import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

const VER = "0.10.35";
const CDN_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`;
const LOCAL_WASM = "/mediapipe";
const CDN_MODEL = `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`;
const LOCAL_MODEL = "/mediapipe/face_landmarker.task";

async function resolveWasm(): Promise<string> {
  try {
    const r = await fetch(`${CDN_WASM}/vision_wasm_internal.js`, { method: "HEAD" });
    if (r.ok) return CDN_WASM;
  } catch { /* fall through */ }
  return LOCAL_WASM;
}
async function resolveModel(wasm: string): Promise<string> {
  if (wasm === LOCAL_WASM) return LOCAL_MODEL;
  try {
    const r = await fetch(CDN_MODEL, { method: "HEAD" });
    if (r.ok) return CDN_MODEL;
  } catch { /* fall through */ }
  return LOCAL_MODEL;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp  = (a: number, b: number, t: number)   => a + (b - a) * t;

/** Eye Aspect Ratio — drops below threshold when eye closes (blink). */
function ear(
  lm: { x: number; y: number }[],
  upper: number, lower: number, outer: number, inner: number
) {
  const h = Math.abs(lm[upper].y - lm[lower].y);
  const w = Math.abs(lm[outer].x - lm[inner].x);
  return w > 0.001 ? h / w : 1;
}

const EAR_BLINK  = 0.18;  // below this = eye closing
const EAR_OPEN   = 0.22;  // above this = eye open again
const BLINK_COOL = 600;   // ms between blink triggers

export class FaceTracker {
  private landmarker?: FaceLandmarker;
  private video: HTMLVideoElement;
  private raf    = 0;
  private lastMs = -1;
  private running = false;

  // smoothed gaze output
  private gx = 0;
  private gy = 0;
  present = false;

  // blink state
  private blinkClosed  = false;
  private lastBlinkMs  = 0;

  constructor(
    videoEl: HTMLVideoElement,
    private readonly onUpdate: (nx: number, ny: number, present: boolean) => void,
    private readonly onBlink: () => void
  ) {
    this.video = videoEl;
  }

  async start() {
    const wasm  = await resolveWasm();
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

    // Wall-clock diff — reliable on Android Chrome (currentTime can stall)
    const now = performance.now();
    if (now - this.lastMs < 33) return; // ~30 fps cap
    this.lastMs = now;

    const res = this.landmarker.detectForVideo(v, now);
    const lm  = res.faceLandmarks?.[0];

    if (!lm || lm.length < 478) {
      this.present = false;
      this.onUpdate(this.gx, this.gy, false);
      return;
    }
    this.present = true;

    // ------------------------------------------------------------------ gaze
    // Landmark key:
    //   Left  iris center : 468  Right iris center : 473
    //   Left  outer/inner : 33 / 133
    //   Right outer/inner : 362 / 263
    //   Upper/lower lids  : 159/145 (L) 386/374 (R)
    //   Nose tip          : 1

    const irisL = lm[468], irisR = lm[473];

    // 1. Iris-in-socket offset — fine eye direction
    const eyeLW = Math.abs(lm[33].x  - lm[133].x);
    const eyeRW = Math.abs(lm[362].x - lm[263].x);
    const rawLx = eyeLW > 0.001 ? (irisL.x - Math.min(lm[33].x,  lm[133].x))  / eyeLW  - 0.5 : 0;
    const rawRx = eyeRW > 0.001 ? (irisR.x - Math.min(lm[362].x, lm[263].x))  / eyeRW  - 0.5 : 0;
    const eyeLH = Math.abs(lm[159].y - lm[145].y);
    const eyeRH = Math.abs(lm[386].y - lm[374].y);
    const rawLy = eyeLH > 0.001 ? (irisL.y - Math.min(lm[159].y, lm[145].y)) / eyeLH - 0.5 : 0;
    const rawRy = eyeRH > 0.001 ? (irisR.y - Math.min(lm[386].y, lm[374].y)) / eyeRH - 0.5 : 0;

    // FIX: on Android front camera the video is already mirrored — DO NOT negate.
    // Positive iris offset → iris moved right in frame → user looking right → tx positive ✓
    const irisX = (rawLx + rawRx) * 2.5;
    const irisY = (rawLy + rawRy) * 2.0;

    // 2. Head position — nose tip on screen drives coarse head movement.
    // Mirrored frame: nose on right side (large X) → user turned right → eyes right (+)
    const headX = (lm[1].x - 0.5) *  2.0;
    const headY = (lm[1].y - 0.35) * 1.5; // 0.35 = roughly nose height on centered face

    // Blend: iris gives gaze direction, head gives movement; combined feels natural
    const tx = clamp(irisX + headX, -1.2, 1.2);
    const ty = clamp(irisY + headY, -1.2, 1.2);

    // Snappy lerp — feels responsive on mobile
    this.gx = lerp(this.gx, tx, 0.35);
    this.gy = lerp(this.gy, ty, 0.30);
    this.onUpdate(this.gx, this.gy, true);

    // --------------------------------------------------------------- blink
    // Eye Aspect Ratio: vertical / horizontal span of eye opening
    const earL = ear(lm, 159, 145, 33,  133);
    const earR = ear(lm, 386, 374, 362, 263);
    const avgEAR = (earL + earR) * 0.5;

    if (!this.blinkClosed && avgEAR < EAR_BLINK) {
      this.blinkClosed = true;
      const ms = performance.now();
      if (ms - this.lastBlinkMs > BLINK_COOL) {
        this.lastBlinkMs = ms;
        this.onBlink();
      }
    } else if (this.blinkClosed && avgEAR > EAR_OPEN) {
      this.blinkClosed = false;
    }
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
