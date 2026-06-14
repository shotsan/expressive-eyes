import { FilesetResolver, FaceDetector } from "@mediapipe/tasks-vision";

/**
 * Webcam face tracking via MediaPipe (in-browser WASM). Emits a normalized
 * gaze target (-1..1, x mirrored like a mirror) from the detected face's
 * position so the eyes follow your face. Keeps running continuously; when the
 * face is briefly lost it holds the last target so the motion never snaps.
 */
const VER = "0.10.35";
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`;
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export class FaceTracker {
  private detector?: FaceDetector;
  private video: HTMLVideoElement;
  private raf = 0;
  private lastT = -1;
  private running = false;
  private nx = 0;
  private ny = 0;
  present = false;

  constructor(
    video: HTMLVideoElement,
    private onUpdate: (nx: number, ny: number, present: boolean) => void
  ) {
    this.video = video;
  }

  async start() {
    const vision = await FilesetResolver.forVisionTasks(WASM);
    this.detector = await FaceDetector.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
      runningMode: "VIDEO",
    });
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 640, height: 480 },
      audio: false,
    });
    this.video.srcObject = stream;
    await this.video.play();
    this.running = true;
    this.loop();
  }

  private loop = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    const v = this.video;
    if (!this.detector || v.readyState < 2 || v.currentTime === this.lastT) return;
    this.lastT = v.currentTime;

    const res = this.detector.detectForVideo(v, performance.now());
    const d = res.detections?.[0];
    if (d?.boundingBox && v.videoWidth) {
      const bb = d.boundingBox;
      const cx = (bb.originX + bb.width / 2) / v.videoWidth;
      const cy = (bb.originY + bb.height / 2) / v.videoHeight;
      const tx = clamp(-((cx * 2 - 1)) * 1.7, -1.2, 1.2); // mirror x
      const ty = clamp((cy * 2 - 1) * 1.5, -1.2, 1.2);
      this.nx += (tx - this.nx) * 0.35; // smooth
      this.ny += (ty - this.ny) * 0.35;
      this.present = true;
    } else {
      this.present = false;
    }
    this.onUpdate(this.nx, this.ny, this.present);
  };

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    const s = this.video.srcObject as MediaStream | null;
    s?.getTracks().forEach((t) => t.stop());
    this.video.srcObject = null;
    this.detector?.close();
  }
}
