/**
 * Parametric eye model (Anki Cozmo/Vector lineage). ONE eye is fully described
 * by these numbers; every emotion is just a different set of them, morphed
 * smoothly. Brows + eyelids do most of the emotional work.
 */
import { lerp } from "../math/Spring";

export interface EyeParams {
  // gaze (pupil travel, fraction -1..1)
  offsetX: number;
  offsetY: number;
  // size / openness
  scaleX: number;
  scaleY: number;
  angle: number; // whole-eye tilt, degrees
  // four independent corner radii (0..1 of half-size)
  rTL: number;
  rTR: number;
  rBR: number;
  rBL: number;
  // eyelids: coverage 0..1, slant angle (deg), bend (curvature -1..1)
  upperLid: number;
  upperLidAngle: number;
  upperLidBend: number;
  lowerLid: number;
  lowerLidAngle: number;
  lowerLidBend: number;
  // pupil / catchlight size
  pupil: number;
  // eyebrow: vertical raise (px), slant (deg, + = inner-down/angry), arch bend
  browY: number;
  browAngle: number;
  browBend: number;
}

export const NEUTRAL: EyeParams = {
  offsetX: 0, offsetY: 0,
  scaleX: 1, scaleY: 1, angle: 0,
  rTL: 0.55, rTR: 0.55, rBR: 0.55, rBL: 0.55,
  upperLid: 0.08, upperLidAngle: 0, upperLidBend: 0,
  lowerLid: 0.05, lowerLidAngle: 0, lowerLidBend: 0,
  pupil: 1,
  browY: 2, browAngle: 0, browBend: 0.5,
};

export const PARAM_KEYS = Object.keys(NEUTRAL) as (keyof EyeParams)[];

export function merge(...parts: Partial<EyeParams>[]): EyeParams {
  return Object.assign({}, NEUTRAL, ...parts);
}

export function lerpParams(a: EyeParams, b: EyeParams, t: number): EyeParams {
  const out = {} as EyeParams;
  for (const k of PARAM_KEYS) out[k] = lerp(a[k], b[k], t);
  return out;
}

/** Mirror a left-eye spec into a right-eye spec (flip horizontal cues). */
export function mirror(p: EyeParams): EyeParams {
  return {
    ...p,
    offsetX: -p.offsetX,
    angle: -p.angle,
    rTL: p.rTR, rTR: p.rTL, rBR: p.rBL, rBL: p.rBR,
    upperLidAngle: -p.upperLidAngle,
    lowerLidAngle: -p.lowerLidAngle,
    browAngle: -p.browAngle,
  };
}

export interface Theme {
  top: [number, number, number];
  bot: [number, number, number];
  glow: [number, number, number];
  blush: number; // 0..1
  heart: number; // 0..1 (heart-shaped catchlight for love)
}

export const GEL_THEME: Theme = {
  top: [165, 240, 255],
  bot: [104, 139, 255],
  glow: [74, 168, 255],
  blush: 0,
  heart: 0,
};

export const lerpTheme = (a: Theme, b: Theme, t: number): Theme => ({
  top: [lerp(a.top[0], b.top[0], t), lerp(a.top[1], b.top[1], t), lerp(a.top[2], b.top[2], t)],
  bot: [lerp(a.bot[0], b.bot[0], t), lerp(a.bot[1], b.bot[1], t), lerp(a.bot[2], b.bot[2], t)],
  glow: [lerp(a.glow[0], b.glow[0], t), lerp(a.glow[1], b.glow[1], t), lerp(a.glow[2], b.glow[2], t)],
  blush: lerp(a.blush, b.blush, t),
  heart: lerp(a.heart, b.heart, t),
});

export const rgb = (c: [number, number, number], a = 1) =>
  `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
