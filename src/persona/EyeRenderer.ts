import { EyeParams } from "./params";
import { Skin } from "./skins";

const DEG = Math.PI / 180;
type RGB = [number, number, number];
const rgb = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

export interface RenderColors {
  top: RGB; bot: RGB; glow: RGB; iris: RGB; sclera: RGB;
  blush: number; heart: number;
}

// ---- shape paths (centered on 0,0) ----
function bodyPath(ctx: CanvasRenderingContext2D, skin: Skin, w: number, h: number, p: EyeParams) {
  const hw = w / 2, hh = h / 2;
  if (skin.shape === "ellipse") {
    ctx.beginPath();
    ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
    return;
  }
  if (skin.shape === "almond") {
    ctx.beginPath();
    ctx.moveTo(-hw, 0);
    ctx.quadraticCurveTo(-hw * 0.2, -hh, hw * 0.25, -hh * 0.9);
    ctx.quadraticCurveTo(hw * 0.8, -hh * 0.8, hw, hh * 0.1);
    ctx.quadraticCurveTo(hw * 0.6, hh, 0, hh);
    ctx.quadraticCurveTo(-hw * 0.6, hh, -hw, 0);
    ctx.closePath();
    return;
  }
  // roundrect (and square when radius 0). Emotion corner radii scaled by skin.
  const scale = skin.radius / 0.55 || 0;
  const m = Math.min(hw, hh);
  const tl = Math.min(p.rTL * scale, 1) * m;
  const tr = Math.min(p.rTR * scale, 1) * m;
  const br = Math.min(p.rBR * scale, 1) * m;
  const bl = Math.min(p.rBL * scale, 1) * m;
  ctx.beginPath();
  ctx.moveTo(-hw + tl, -hh);
  ctx.lineTo(hw - tr, -hh); ctx.arcTo(hw, -hh, hw, -hh + tr, tr);
  ctx.lineTo(hw, hh - br); ctx.arcTo(hw, hh, hw - br, hh, br);
  ctx.lineTo(-hw + bl, hh); ctx.arcTo(-hw, hh, -hw, hh - bl, bl);
  ctx.lineTo(-hw, -hh + tl); ctx.arcTo(-hw, -hh, -hw + tl, -hh, tl);
  ctx.closePath();
}

function carveLid(ctx: CanvasRenderingContext2D, w: number, h: number,
  lid: number, angleDeg: number, bend: number, upper: boolean) {
  if (lid <= 0.001) return;
  const hw = w / 2, hh = h / 2, padX = hw + 8;
  const slope = Math.tan(angleDeg * DEG);
  const edge = upper ? -hh + lid * h : hh - lid * h;
  const outer = upper ? -hh - 8 : hh + 8;
  ctx.beginPath();
  ctx.moveTo(-padX, outer);
  ctx.lineTo(padX, outer);
  ctx.lineTo(padX, edge + slope * hw);
  ctx.quadraticCurveTo(0, edge + bend * h * 0.4, -padX, edge - slope * hw);
  ctx.closePath();
  ctx.fill();
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, a: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.bezierCurveTo(-5, -2, -6, -7, -2.6, -8.5);
  ctx.bezierCurveTo(-0.8, -9.3, 0, -7.5, 0, -6.2);
  ctx.bezierCurveTo(0, -7.5, 0.8, -9.3, 2.6, -8.5);
  ctx.bezierCurveTo(6, -7, 5, -2, 0, 4);
  ctx.closePath();
  ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill();
  ctx.restore();
}

function drawEye(ctx: CanvasRenderingContext2D, cx: number, cy: number,
  p: EyeParams, skin: Skin, col: RenderColors, blink: number) {
  const effScaleY = p.scaleY * (1 - 0.95 * blink);
  const w = skin.w * p.scaleX;
  const h = Math.max(5, skin.h * effScaleY);
  const hw = w / 2, hh = h / 2;
  const isIris = skin.pupil === "iris";
  const px = p.offsetX * hw * 0.42;
  const py = p.offsetY * hh * 0.42;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(p.angle * DEG);

  // ---- body ----
  ctx.save();
  if (skin.glow > 0) { ctx.shadowColor = rgb(col.glow, 0.9); ctx.shadowBlur = skin.glow; }
  if (skin.fill === "outline") {
    bodyPath(ctx, skin, w, h, p);
    ctx.lineWidth = skin.id === "neon" ? 4 : 2.6;
    ctx.strokeStyle = rgb(col.glow);
    ctx.stroke(); ctx.stroke();
  } else {
    const g = ctx.createLinearGradient(0, -hh, 0, hh);
    if (skin.fill === "gradient") { g.addColorStop(0, rgb(col.top)); g.addColorStop(1, rgb(col.bot)); }
    else { const s = isIris ? col.sclera : col.top; g.addColorStop(0, rgb(s)); g.addColorStop(1, rgb(isIris ? col.sclera : col.bot)); }
    bodyPath(ctx, skin, w, h, p);
    ctx.fillStyle = g; ctx.fill();
    if (skin.glow > 0) { ctx.shadowBlur = skin.glow * 0.5; ctx.fill(); }
  }
  ctx.restore();

  // ---- interior (clipped) ----
  ctx.save();
  bodyPath(ctx, skin, w, h, p); ctx.clip();
  if (isIris) {
    const ir = Math.min(hw, hh) * 0.72 * p.pupil;
    const ig = ctx.createRadialGradient(px, py - ir * 0.2, ir * 0.2, px, py, ir);
    ig.addColorStop(0, rgb([Math.min(255, col.iris[0] + 80), Math.min(255, col.iris[1] + 80), Math.min(255, col.iris[2] + 80)]));
    ig.addColorStop(1, rgb(col.iris));
    ctx.fillStyle = ig; ctx.beginPath(); ctx.ellipse(px, py, ir, ir, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(8,6,14,0.92)"; ctx.beginPath();
    ctx.ellipse(px, py, ir * 0.42, ir * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  } else if (skin.pupil === "dot") {
    const r = Math.min(hw, hh) * 0.5 * p.pupil;
    ctx.fillStyle = rgb(col.iris); ctx.beginPath(); ctx.ellipse(px, py, r, r, 0, 0, Math.PI * 2); ctx.fill();
  } else if (skin.pupil === "soft") {
    ctx.fillStyle = "rgba(8,14,38,0.24)"; ctx.beginPath();
    ctx.ellipse(px, py, w * 0.27 * p.pupil, h * 0.3 * p.pupil, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    // none: a bright inner core that drifts with gaze, so it "looks"
    const cr = Math.min(hw, hh) * 0.55;
    const cg = ctx.createRadialGradient(px, py, 0, px, py, cr);
    cg.addColorStop(0, "rgba(255,255,255,0.4)"); cg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(px, py, cr, cr, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (skin.gloss) {
    ctx.fillStyle = "rgba(255,255,255,0.32)"; ctx.beginPath();
    ctx.ellipse(0, -hh * 0.5, w * 0.32, h * 0.15, 0, 0, Math.PI * 2); ctx.fill();
  }
  // catchlights
  if (col.heart > 0.5) heart(ctx, px - w * 0.08, py - h * 0.06, p.pupil * 1.4, 0.92);
  else if (skin.pupil !== "none") {
    ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.beginPath();
    ctx.ellipse(px - w * 0.1, py - h * 0.12, w * 0.09 * p.pupil, h * 0.1 * p.pupil, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.beginPath();
    ctx.ellipse(px + w * 0.1, py + h * 0.1, w * 0.045 * p.pupil, h * 0.045 * p.pupil, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // ---- eyelids ----
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  carveLid(ctx, w, h, p.upperLid, p.upperLidAngle, p.upperLidBend, true);
  carveLid(ctx, w, h, p.lowerLid, p.lowerLidAngle, p.lowerLidBend, false);
  ctx.restore();

  // ---- eyebrow ----
  if (skin.brow !== "none") {
    const L = skin.w * 0.78;
    ctx.save();
    ctx.translate(0, -hh - 14 - p.browY);
    ctx.rotate(p.browAngle * DEG);
    ctx.lineCap = "round";
    ctx.lineWidth = skin.brow === "glow" ? 14 : 13;
    if (skin.brow === "glow") { ctx.shadowColor = rgb(col.glow, 0.8); ctx.shadowBlur = 12; ctx.strokeStyle = rgb(col.top); }
    else ctx.strokeStyle = "rgba(26,22,30,0.95)";
    ctx.beginPath();
    ctx.moveTo(-L / 2, 0);
    ctx.quadraticCurveTo(0, -p.browBend * 15, L / 2, 0);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

export function drawFace(ctx: CanvasRenderingContext2D, W: number, H: number,
  left: EyeParams, right: EyeParams, skin: Skin, col: RenderColors, blink: number) {
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H * 0.54;
  drawEye(ctx, cx - skin.spacing, cy, left, skin, col, blink);
  drawEye(ctx, cx + skin.spacing, cy, right, skin, col, blink);
  if (col.blush > 0.01) {
    ctx.save();
    ctx.fillStyle = `rgba(255,140,170,${0.42 * col.blush})`;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + s * skin.spacing, cy + skin.h * 0.46, skin.w * 0.36, skin.h * 0.11, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
