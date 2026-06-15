import { Spring, clamp, lerp } from "../math/Spring";
import { EyeParams, PARAM_KEYS, NEUTRAL, merge, mirror } from "./params";
import { EMOTION_BY_ID, EMOTIONS } from "./emotions";
import { drawFace, RenderColors } from "./EyeRenderer";
import { Skin, SKIN_BY_ID } from "./skins";

type RGB = [number, number, number];
const lerpRGB = (a: RGB, b: RGB, t: number): RGB =>
  [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

class SprungEye {
  springs = {} as Record<keyof EyeParams, Spring>;
  constructor(init: EyeParams) {
    for (const k of PARAM_KEYS) this.springs[k] = new Spring(init[k], 110, 0.85);
  }
  set(t: EyeParams) { for (const k of PARAM_KEYS) this.springs[k].set(t[k]); }
  update(dt: number): EyeParams {
    const o = {} as EyeParams;
    for (const k of PARAM_KEYS) o[k] = this.springs[k].update(dt);
    return o;
  }
}

export class Persona {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private skin: Skin;
  private left = new SprungEye(NEUTRAL);
  private right = new SprungEye(NEUTRAL);

  private col: RenderColors;
  private colTarget: RenderColors;

  private gazeX = new Spring(0, 60, 0.7);
  private gazeY = new Spring(0, 60, 0.7);
  private cursor = true;

  private blink = 0; private blinkT = 1.2; private blinking = false; private blinkPhase = 0;
  private sacT = 1; private sacX = 0; private sacY = 0; private breathe = 0;
  private gazeGain = 1; // ramps 0->1 after an emotion change (pupils re-engage)
  autonomic: boolean;

  private last = 0; private raf = 0; private disposed = false;
  private W = 320; private H = 240;
  current = "neutral";

  constructor(canvas: HTMLCanvasElement, skinId: string, opts: { autonomic?: boolean } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.skin = SKIN_BY_ID[skinId] ?? SKIN_BY_ID["gel"];
    this.autonomic = opts.autonomic ?? true;
    this.col = this.colorsFor("neutral");
    this.colTarget = this.col;
    this.resize();
    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointermove", this.onMove);
    this.setEmotion("neutral");
    this.loop(0);
  }

  // ---- public ----
  setEmotion(id: string) {
    const e = EMOTION_BY_ID[id];
    if (!e) return this;
    this.left.set(merge(e.base, e.left ?? {}));
    this.right.set(mirror(merge(e.base, e.right ?? {})));
    this.colTarget = this.colorsFor(id);
    this.current = id;
    // Center the pupils at the moment of change so the new expression reads
    // clearly, then let gaze/convergence/emotion-bias ease back in.
    for (const sp of [this.left, this.right]) {
      sp.springs.offsetX.value = 0; sp.springs.offsetX.velocity = 0;
      sp.springs.offsetY.value = 0; sp.springs.offsetY.velocity = 0;
    }
    this.gazeX.reset(0); this.gazeY.reset(0);
    this.sacX = 0; this.sacY = 0; this.sacT = 0.9;
    this.gazeGain = 0;
    return this;
  }
  get emotions() { return EMOTIONS.map((e) => e.id); }
  get skinId() { return this.skin.id; }
  followCursor(on: boolean) { this.cursor = on; if (!on) { this.gazeX.set(0); this.gazeY.set(0); } return this; }
  doBlink() { this.blinking = true; this.blinkPhase = 0; return this; }
  /** Drive gaze externally (e.g. from face tracking). Call followCursor(false) first. */
  setGaze(nx: number, ny: number) { this.gazeX.set(clamp(nx, -1.2, 1.2)); this.gazeY.set(clamp(ny, -1.2, 1.2)); return this; }
  setAutonomic(on: boolean) { this.autonomic = on; return this; }
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onMove);
  }

  // ---- colour stays the skin's own in EVERY emotion (no recolouring) ----
  private colorsFor(id: string): RenderColors {
    const b = this.skin.base;
    const e = EMOTION_BY_ID[id];
    return {
      top: b.top, bot: b.bot, glow: b.glow, iris: b.iris, sclera: b.sclera,
      blush: e?.blush ?? 0,
      heart: e?.heart ?? 0,
    };
  }

  // ---- internals ----
  private onResize = () => this.resize();
  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth || 320;
    const h = this.canvas.clientHeight || 240;
    this.canvas.width = w * dpr; this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = w; this.H = h;
  }
  private onMove = (e: PointerEvent) => {
    if (!this.cursor) return;
    const r = this.canvas.getBoundingClientRect();
    this.gazeX.set(clamp(((e.clientX - (r.left + r.width / 2)) / (r.width / 2)), -1.2, 1.2));
    this.gazeY.set(clamp(((e.clientY - (r.top + r.height / 2)) / (r.height / 2)), -1.2, 1.2));
  };

  private lerpColors(t: number) {
    const c = this.col, d = this.colTarget;
    c.top = lerpRGB(c.top, d.top, t); c.bot = lerpRGB(c.bot, d.bot, t); c.glow = lerpRGB(c.glow, d.glow, t);
    c.iris = lerpRGB(c.iris, d.iris, t); c.sclera = lerpRGB(c.sclera, d.sclera, t);
    c.blush = lerp(c.blush, d.blush, t); c.heart = d.heart; // heart is binary
  }

  private updateIdle(dt: number) {
    this.blinkT -= dt;
    if (this.blinkT <= 0 && this.autonomic) {
      this.blinking = true; this.blinkPhase = 0;
      this.blinkT = 3 + Math.random() * 3.5; // calmer cadence (~3–6.5s)
      if (Math.random() < 0.1) this.blinkT = 0.34; // occasional double blink
    }
    if (this.blinking) {
      this.blinkPhase += dt / 0.32; // ~320ms blink (was 160ms)
      const ph = this.blinkPhase;
      const ease = (t: number) => t * t * (3 - 2 * t);
      // quick close (first 40%), slower open (rest) — reads natural
      this.blink = ph >= 1 ? 0 : ph < 0.4 ? ease(ph / 0.4) : ease(1 - (ph - 0.4) / 0.6);
      if (ph >= 1) { this.blinking = false; this.blink = 0; }
    }
    this.sacT -= dt;
    if (this.sacT <= 0 && this.autonomic) {
      this.sacX = (Math.random() * 2 - 1) * 0.16; this.sacY = (Math.random() * 2 - 1) * 0.1;
      this.sacT = 0.6 + Math.random() * 1.6;
    }
    this.breathe += dt;
  }

  private loop = (t: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = this.last ? Math.min((t - this.last) / 1000, 0.05) : 0.016;
    this.last = t;

    this.updateIdle(dt);
    this.gazeX.update(dt); this.gazeY.update(dt);
    this.lerpColors(Math.min(1, dt * 6));

    const l = this.left.update(dt);
    const r = this.right.update(dt);
    // after an emotion change, gaze + convergence ramp back from 0 (pupils
    // start centered so the new expression is legible)
    this.gazeGain = Math.min(1, this.gazeGain + dt / 0.45);
    const g = this.gazeGain;
    const gx = clamp((this.gazeX.value + this.sacX) * g, -1.2, 1.2);
    const gy = clamp((this.gazeY.value + this.sacY) * g, -1.2, 1.2);
    const br = 1 + Math.sin(this.breathe * 1.1) * 0.012;
    // dynamic focus: pupils converge on the viewer when gaze is centered,
    // and relax to parallel when looking away.
    const focus = 0.22 * (1 - Math.min(1, Math.hypot(gx, gy)));
    // side = -1 left eye, +1 right eye; converge pulls each pupil toward center
    const apply = (p: EyeParams, side: number): EyeParams => {
      const c = clamp((p.converge + focus) * g, -0.3, 0.6);
      return {
        ...p,
        offsetX: p.offsetX + gx - side * c,
        offsetY: p.offsetY + gy,
        scaleX: p.scaleX * br, scaleY: p.scaleY * br,
      };
    };
    drawFace(this.ctx, this.W, this.H, apply(l, -1), apply(r, 1), this.skin, this.col, this.blink);
  };
}
