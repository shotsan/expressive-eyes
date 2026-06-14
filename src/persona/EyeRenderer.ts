import { EyeParams } from "./params";
import { Skin } from "./skins";

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
type RGB = [number, number, number];
const rgb = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const shift = (c: RGB, d: number): RGB =>
  [Math.max(0, Math.min(255, c[0] + d)), Math.max(0, Math.min(255, c[1] + d)), Math.max(0, Math.min(255, c[2] + d))];

export interface RenderColors {
  top: RGB; bot: RGB; glow: RGB; iris: RGB; sclera: RGB;
  blush: number; heart: number;
}

// ---------- shape paths (centered on 0,0) ----------
function bodyPath(ctx: CanvasRenderingContext2D, skin: Skin, w: number, h: number, p: EyeParams) {
  const hw = w / 2, hh = h / 2;
  if (skin.shape === "ellipse") { ctx.beginPath(); ctx.ellipse(0, 0, hw, hh, 0, 0, TAU); return; }
  if (skin.shape === "almond") {
    ctx.beginPath();
    ctx.moveTo(-hw, 0);
    ctx.quadraticCurveTo(-hw * 0.2, -hh, hw * 0.25, -hh * 0.9);
    ctx.quadraticCurveTo(hw * 0.8, -hh * 0.8, hw, hh * 0.1);
    ctx.quadraticCurveTo(hw * 0.6, hh, 0, hh);
    ctx.quadraticCurveTo(-hw * 0.6, hh, -hw, 0);
    ctx.closePath(); return;
  }
  const scale = skin.radius / 0.55 || 0;
  const m = Math.min(hw, hh);
  const tl = Math.min(p.rTL * scale, 1) * m, tr = Math.min(p.rTR * scale, 1) * m;
  const br = Math.min(p.rBR * scale, 1) * m, bl = Math.min(p.rBL * scale, 1) * m;
  ctx.beginPath();
  ctx.moveTo(-hw + tl, -hh);
  ctx.lineTo(hw - tr, -hh); ctx.arcTo(hw, -hh, hw, -hh + tr, tr);
  ctx.lineTo(hw, hh - br); ctx.arcTo(hw, hh, hw - br, hh, br);
  ctx.lineTo(-hw + bl, hh); ctx.arcTo(-hw, hh, -hw, hh - bl, bl);
  ctx.lineTo(-hw, -hh + tl); ctx.arcTo(-hw, -hh, -hw + tl, -hh, tl);
  ctx.closePath();
}

// edge curve of a lid across the eye width (left -> right)
function lidEdge(hw: number, hh: number, h: number, lid: number, angleDeg: number, bend: number, upper: boolean) {
  const slope = Math.tan(angleDeg * DEG);
  const edge = upper ? -hh + lid * h : hh - lid * h;
  return { lx: -hw, ly: edge - slope * hw, cx: 0, cy: edge + bend * h * 0.4, rx: hw, ry: edge + slope * hw };
}

function carveLid(ctx: CanvasRenderingContext2D, w: number, h: number,
  lid: number, angleDeg: number, bend: number, upper: boolean) {
  if (lid <= 0.001) return;
  const hw = w / 2, hh = h / 2, padX = hw + 8;
  const e = lidEdge(hw, hh, h, lid, angleDeg, bend, upper);
  const outer = upper ? -hh - 8 : hh + 8;
  ctx.beginPath();
  ctx.moveTo(-padX, outer); ctx.lineTo(padX, outer);
  ctx.lineTo(padX, e.ry); ctx.quadraticCurveTo(e.cx, e.cy, -padX, e.ly);
  ctx.closePath(); ctx.fill();
}

// soft shadow line where the lid meets the eye → reads as lid thickness/depth
function lidRim(ctx: CanvasRenderingContext2D, w: number, h: number,
  lid: number, angleDeg: number, bend: number, upper: boolean) {
  if (lid <= 0.02) return;
  const hw = w / 2, hh = h / 2;
  const e = lidEdge(hw, hh, h, lid, angleDeg, bend, upper);
  ctx.beginPath();
  ctx.moveTo(e.lx, e.ly); ctx.quadraticCurveTo(e.cx, e.cy, e.rx, e.ry);
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = 5; ctx.lineCap = "round";
  ctx.stroke();
}

function lashes(ctx: CanvasRenderingContext2D, w: number, h: number, side: number, col: RGB) {
  const hw = w / 2, hh = h / 2;
  const ox = side * hw * 0.78, oy = -hh * 0.74;
  ctx.save();
  ctx.strokeStyle = rgb(col, 0.95); ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    ctx.lineWidth = 4 - i;
    const ang = (side > 0 ? -30 : -150) + (i - 1) * (side > 0 ? 18 : -18);
    const len = hw * (0.42 - i * 0.06);
    const a = ang * DEG;
    ctx.beginPath();
    ctx.moveTo(ox - side * i * 5, oy + i * 4);
    ctx.lineTo(ox - side * i * 5 + Math.cos(a) * len, oy + i * 4 + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.restore();
}

function catchlights(ctx: CanvasRenderingContext2D, px: number, py: number, w: number, h: number, s: number) {
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath(); ctx.ellipse(px - w * 0.1, py - h * 0.12, w * 0.09 * s, h * 0.1 * s, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath(); ctx.ellipse(px + w * 0.1, py + h * 0.1, w * 0.045 * s, h * 0.045 * s, 0, 0, TAU); ctx.fill();
}

function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a + Math.PI / 4) * r * 0.32, Math.sin(a + Math.PI / 4) * r * 0.32);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

function pupilPath(ctx: CanvasRenderingContext2D, px: number, py: number, R: number, shape: string, s: number) {
  ctx.beginPath();
  if (shape === "slit") ctx.ellipse(px, py, R * 0.16 * s + 1.5, R * 0.92, 0, 0, TAU);
  else if (shape === "square") { const r = R * 0.5 * s; ctx.rect(px - r, py - r, r * 2, r * 2); }
  else ctx.ellipse(px, py, R * 0.42 * s, R * 0.42 * s, 0, 0, TAU);
}

// ---------- iris families ----------
function drawIris(ctx: CanvasRenderingContext2D, px: number, py: number, R: number,
  iris: RGB, kind: string, shape: string, s: number, doSparkle: boolean) {
  if (kind === "tech") {
    ctx.fillStyle = rgb(shift(iris, -120)); ctx.beginPath(); ctx.ellipse(px, py, R, R, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgb(iris, 0.9);
    for (const rr of [R * 0.95, R * 0.66, R * 0.4]) { ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(px, py, rr, rr, 0, 0, TAU); ctx.stroke(); }
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.beginPath(); ctx.moveTo(px + Math.cos(a) * R * 0.78, py + Math.sin(a) * R * 0.78); ctx.lineTo(px + Math.cos(a) * R * 0.95, py + Math.sin(a) * R * 0.95); ctx.stroke(); }
    ctx.fillStyle = rgb(shift(iris, 60)); ctx.beginPath(); ctx.ellipse(px, py, R * 0.2, R * 0.2, 0, 0, TAU); ctx.fill();
    return;
  }
  // organic iris (anime / real)
  const g = ctx.createRadialGradient(px, py - R * 0.25, R * 0.15, px, py, R);
  g.addColorStop(0, rgb(shift(iris, 85)));
  g.addColorStop(0.6, rgb(iris));
  g.addColorStop(1, rgb(shift(iris, -55)));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px, py, R, R, 0, 0, TAU); ctx.fill();
  if (kind === "real") {
    ctx.strokeStyle = rgb(shift(iris, -90), 0.35); ctx.lineWidth = 1;
    for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU; ctx.beginPath(); ctx.moveTo(px + Math.cos(a) * R * 0.42, py + Math.sin(a) * R * 0.42); ctx.lineTo(px + Math.cos(a) * R * 0.92, py + Math.sin(a) * R * 0.92); ctx.stroke(); }
    ctx.strokeStyle = rgb(shift(iris, -110), 0.6); ctx.lineWidth = R * 0.1;
    ctx.beginPath(); ctx.ellipse(px, py, R * 0.94, R * 0.94, 0, 0, TAU); ctx.stroke();
  }
  // pupil
  ctx.fillStyle = "rgba(6,5,12,0.95)"; pupilPath(ctx, px, py, R, shape, s); ctx.fill();
  if (kind === "anime") { // glassy lower reflection
    ctx.fillStyle = rgb(shift(iris, 60), 0.5);
    ctx.beginPath(); ctx.ellipse(px, py + R * 0.4, R * 0.5, R * 0.28, 0, 0, TAU); ctx.fill();
  }
  if (doSparkle) sparkle(ctx, px - R * 0.34, py - R * 0.38, R * 0.3);
}

function drawEye(ctx: CanvasRenderingContext2D, cx: number, cy: number,
  p: EyeParams, skin: Skin, col: RenderColors, blink: number, side: number) {
  const effScaleY = p.scaleY * (1 - 0.95 * blink);
  const w = skin.w * p.scaleX;
  const h = Math.max(5, skin.h * effScaleY);
  const hw = w / 2, hh = h / 2;
  const isIris = skin.pupil === "iris";
  const px = p.offsetX * hw * 0.42, py = p.offsetY * hh * 0.42;
  const R = Math.min(hw, hh) * 0.72;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(p.angle * DEG);

  // ---- body ----
  ctx.save();
  if (skin.glow > 0) { ctx.shadowColor = rgb(col.glow, 0.9); ctx.shadowBlur = skin.glow; }
  if (skin.fill === "outline") {
    bodyPath(ctx, skin, w, h, p);
    ctx.lineWidth = skin.id === "neon" ? 4 : 2.6; ctx.strokeStyle = rgb(col.glow); ctx.stroke(); ctx.stroke();
  } else {
    const g = ctx.createLinearGradient(0, -hh, 0, hh);
    const a = skin.fill === "gradient" ? col.top : (isIris ? col.sclera : col.top);
    const b = skin.fill === "gradient" ? col.bot : (isIris ? col.sclera : col.bot);
    g.addColorStop(0, rgb(a)); g.addColorStop(1, rgb(b));
    bodyPath(ctx, skin, w, h, p); ctx.fillStyle = g; ctx.fill();
    if (skin.glow > 0) { ctx.shadowBlur = skin.glow * 0.5; ctx.fill(); }
  }
  ctx.restore();

  // ---- interior (clipped) ----
  ctx.save();
  bodyPath(ctx, skin, w, h, p); ctx.clip();

  if (isIris) {
    drawIris(ctx, px, py, R * p.pupil, col.iris, skin.iris ?? "anime", skin.pupilShape ?? "round", p.pupil, !!skin.sparkle);
  } else if (skin.pupil === "dot") {
    ctx.fillStyle = rgb(col.iris); pupilPath(ctx, px, py, R, skin.pupilShape ?? "round", p.pupil); ctx.fill();
  } else if (skin.pupil === "soft") {
    ctx.fillStyle = "rgba(8,14,38,0.24)"; ctx.beginPath(); ctx.ellipse(px, py, w * 0.27 * p.pupil, h * 0.3 * p.pupil, 0, 0, TAU); ctx.fill();
  } else if (skin.shine) {
    // kawaii: big offset highlight + small sparkle, no dark pupil
    ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.beginPath();
    ctx.ellipse(px - w * 0.12, py - h * 0.16, w * 0.2, h * 0.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.beginPath();
    ctx.ellipse(px + w * 0.12, py + h * 0.12, w * 0.08, h * 0.08, 0, 0, TAU); ctx.fill();
  } else {
    // solid glow: bright core that drifts with gaze
    const cr = Math.min(hw, hh) * 0.6;
    const cg = ctx.createRadialGradient(px, py, 0, px, py, cr);
    cg.addColorStop(0, "rgba(255,255,255,0.45)"); cg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(px, py, cr, cr, 0, 0, TAU); ctx.fill();
    if (skin.detail === "scanlines") {
      ctx.strokeStyle = "rgba(0,0,0,0.10)"; ctx.lineWidth = 2;
      for (let y = -hh + 4; y < hh; y += 7) { ctx.beginPath(); ctx.moveTo(-hw, y); ctx.lineTo(hw, y); ctx.stroke(); }
    }
  }

  if (skin.gloss) {
    ctx.fillStyle = "rgba(255,255,255,0.32)"; ctx.beginPath();
    ctx.ellipse(0, -hh * 0.5, w * 0.32, h * 0.15, 0, 0, TAU); ctx.fill();
  }
  if (col.heart > 0.5) {
    ctx.save(); ctx.translate(px - w * 0.06, py - h * 0.04); ctx.scale(p.pupil * 1.3, p.pupil * 1.3);
    ctx.beginPath(); ctx.moveTo(0, 4);
    ctx.bezierCurveTo(-5, -2, -6, -7, -2.6, -8.5); ctx.bezierCurveTo(-0.8, -9.3, 0, -7.5, 0, -6.2);
    ctx.bezierCurveTo(0, -7.5, 0.8, -9.3, 2.6, -8.5); ctx.bezierCurveTo(6, -7, 5, -2, 0, 4);
    ctx.closePath(); ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.fill(); ctx.restore();
  } else if (skin.pupil === "iris" || skin.pupil === "dot") {
    catchlights(ctx, px, py, w, h, p.pupil);
  } else if (skin.pupil === "none" && !skin.shine) {
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath();
    ctx.ellipse(px - w * 0.1, py - h * 0.14, w * 0.07, h * 0.08, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();

  // ---- eyelids (carve) ----
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  carveLid(ctx, w, h, p.upperLid, p.upperLidAngle, p.upperLidBend, true);
  carveLid(ctx, w, h, p.lowerLid, p.lowerLidAngle, p.lowerLidBend, false);
  ctx.restore();

  // ---- lid depth rim + lashes (clipped to remaining eye) ----
  if (skin.lidRim !== false || skin.lashes) {
    ctx.save();
    bodyPath(ctx, skin, w, h, p); ctx.clip();
    if (skin.lidRim !== false) {
      lidRim(ctx, w, h, p.upperLid, p.upperLidAngle, p.upperLidBend, true);
      lidRim(ctx, w, h, p.lowerLid, p.lowerLidAngle, p.lowerLidBend, false);
    }
    if (skin.lashes) lashes(ctx, w, h, side, [20, 16, 26]);
    ctx.restore();
  }

  // ---- eyebrow ----
  if (skin.brow !== "none") {
    const L = skin.w * 0.78;
    ctx.save();
    ctx.translate(0, -hh - 14 - p.browY); ctx.rotate(p.browAngle * DEG);
    ctx.lineCap = "round"; ctx.lineWidth = skin.brow === "glow" ? 14 : 13;
    if (skin.brow === "glow") { ctx.shadowColor = rgb(col.glow, 0.8); ctx.shadowBlur = 12; ctx.strokeStyle = rgb(col.top); }
    else ctx.strokeStyle = "rgba(26,22,30,0.95)";
    ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.quadraticCurveTo(0, -p.browBend * 15, L / 2, 0); ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

export function drawFace(ctx: CanvasRenderingContext2D, W: number, H: number,
  left: EyeParams, right: EyeParams, skin: Skin, col: RenderColors, blink: number) {
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H * 0.54;
  drawEye(ctx, cx - skin.spacing, cy, left, skin, col, blink, -1);
  drawEye(ctx, cx + skin.spacing, cy, right, skin, col, blink, 1);
  if (col.blush > 0.01) {
    ctx.save();
    ctx.fillStyle = `rgba(255,140,170,${0.42 * col.blush})`;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + s * skin.spacing, cy + skin.h * 0.46, skin.w * 0.36, skin.h * 0.11, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
