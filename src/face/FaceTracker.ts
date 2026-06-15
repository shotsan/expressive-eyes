import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

/**
 * Face tracking via MediaPipe FaceLandmarker.
 *
 * Fixes vs the old bounding-box FaceDetector approach:
 *  1. WASM served locally (/mediapipe) — no CDN, works offline + on mobile
 *  2. Detection loop uses a wall-clock timestamp diff instead of
 *     video.currentTime equality, which was unreliable on Android Chrome
 *  3. Uses facial landmarks (iris centers + nose tip) to derive actual gaze
 *     direction, not just "where your face is on screen"
 *
 * Landmark indices (MediaPipe 478-point model):
 *   Left  iris center  : 468
 *   Right iris center  : 473
 *   Nose tip           : 1
 *   Left  eye outer    : 33   inner: 133
 *   Right eye outer    : 362  inner: 263
 *
 * Gaze = normalised offset of iris center within its eye socket (how far
 * left/right/up/down the iris sits between the eye corners).
 */

const VER = "0.10.35";
const CDN_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`;
const LOCAL_WASM = "/mediapipe";
const CDN_MODEL = `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`;
const LOCAL_MODEL = "/mediapipe/face_landmarker.task";

async function resolveWasm(): Promise<string> {
  try {
    const r = await fetch(`${CDN_WASM}/vision_wasm_internal.js`, { method: "HEAD" });
    if (r.ok) return CDN_WASM;
  } catch {}
  return LOCAL_WASM;
}

async function resolveModel(wasmPath: string): Promise<string> {
  // Use local model when on local WASM (CDN unreachable), otherwise CDN model
  if (wasmPath === LOCAL_WASM) return LOCAL_MODEL;
  try {
    const r = await fetch(CDN_MODEL, { method: "HEAD" });
    if (r.ok) return CDN_MODEL;
  } catch {}
  return LOCAL_MODEL;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export class FaceTracker {
  private landmarker?: FaceLandmarker;
  private video: HTMLVideoElement;
  private raf = 0;
  private lastMs = -1;
  private running = false;

  private gx = 0;
  private gy = 0;
  present = false;

  constructor(
    video: HTMLVideoElement,
    private onUpdate: (nx: number, ny: number, present: boolean) => void
  ) {
    this.video = video;
  }

  async start() {
    const wasm = await resolveWasm();
    const model = await resolveModel(wasm);
    const vision = await FilesetResolver.forVisionTasks(wasm);
    this.landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: model, delegate: "CPU" },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    this.video.srcObject = stream;
    this.video.setAttribute("playsinline", "true");
    this.video.muted = true;
    await this.video.play();
    this.running = true;
    this.loop();
  }

  private loop = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    const v = this.video;
    if (!this.landmarker || v.readyState < 2) return;

    // Use wall-clock ms instead of video.currentTime — more reliable on
    // Android Chrome where currentTime can stall between frames
    const now = performance.now();
    if (now - this.lastMs < 33) return; // ~30fps cap, don't over-run
    this.lastMs = now;

    const res = this.landmarker.detectForVideo(v, now);
    const lm = res.faceLandmarks?.[0];

    if (!lm || lm.length < 478) {
      this.present = false;
      this.onUpdate(this.gx, this.gy, false);
      return;
    }

    this.present = true;

    // ---- iris-based gaze ----
    // Left iris (468), Right iris (473) — average for head-center gaze
    // Left eye corners: outer=33, inner=133
    // Right eye corners: inner=263, outer=362
    const irisL = lm[468];
    const irisR = lm[473];
    const eyeLOuter = lm[33];
    const eyeLInner = lm[133];
    const eyeROuter = lm[362];
    const eyeRInner = lm[263];

    // How far the iris sits between the inner/outer corner of each eye (0..1)
    const eyeLWidth = Math.abs(eyeLOuter.x - eyeLInner.x);
    const eyeRWidth = Math.abs(eyeROuter.x - eyeRInner.x);

    const rawLx = eyeLWidth > 0.001
      ? (irisL.x - Math.min(eyeLOuter.x, eyeLInner.x)) / eyeLWidth - 0.5
      : 0;
    const rawRx = eyeRWidth > 0.001
      ? (irisR.x - Math.min(eyeROuter.x, eyeRInner.x)) / eyeRWidth - 0.5
      : 0;

    // Y: use vertical position of iris relative to eye top/bottom landmarks
    // lm 159 = left upper lid, 145 = left lower lid
    const eyeLHeight = Math.abs(lm[159].y - lm[145].y);
    const eyeRHeight = Math.abs(lm[386].y - lm[374].y);
    const rawLy = eyeLHeight > 0.001
      ? (irisL.y - Math.min(lm[159].y, lm[145].y)) / eyeLHeight - 0.5
      : 0;
    const rawRy = eyeRHeight > 0.001
      ? (irisR.y - Math.min(lm[386].y, lm[374].y)) / eyeRHeight - 0.5
      : 0;

    // Average both eyes, scale up so slight gaze moves read clearly
    // Mirror X: landmark coords are in camera space (unmirrored), so
    // looking left in real life = iris moves right in image = eyes should look left
    const tx = clamp(-(rawLx + rawRx) * 3.5, -1.2, 1.2);
    const ty = clamp((rawLy + rawRy) * 2.8, -1.2, 1.2);

    // Smooth — tighter than before so it feels snappier on mobile
    this.gx = lerp(this.gx, tx, 0.25);
    this.gy = lerp(this.gy, ty, 0.25);
    this.onUpdate(this.gx, this.gy, true);
  };

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    const s = this.video.srcObject as MediaStream | null;
    s?.getTracks().forEach((t) => t.stop());
    this.video.srcObject = null;
    this.landmarker?.close();
  }
}
