import { EyeParams } from "./params";

/**
 * Emotion presets — the SAME persona, different SHAPE. Emotion is conveyed only
 * by geometry (eyelids, brows, openness, gaze, pupil, tilt) — never by changing
 * the eye's colour. Each style keeps its own palette in every emotion.
 *  - base:  applied to both eyes (over NEUTRAL)
 *  - left/right: asymmetric overrides (curiosity's raised brow, the wink)
 *  - blush/heart: additive persona features (shy cheeks, love catchlight) — not recolouring
 * Conventions: upperLidAngle/browAngle > 0 = inner-DOWN (angry); < 0 = inner-UP (sad/shy).
 */
export interface Emotion {
  id: string;
  name: string;
  base: Partial<EyeParams>;
  left?: Partial<EyeParams>;
  right?: Partial<EyeParams>;
  blush?: number;
  heart?: number;
}

export const EMOTIONS: Emotion[] = [
  {
    id: "neutral",
    name: "Neutral",
    base: {},
  },
  {
    id: "happy",
    name: "Happy",
    base: {
      lowerLid: 0.52, lowerLidBend: -0.85, upperLid: 0.04, converge: 0.22,
      rBL: 0.95, rBR: 0.95, scaleY: 1.0, pupil: 1.05,
      browY: 9, browBend: 0.8,
    },
  },
  {
    id: "shy",
    name: "Shy",
    base: {
      upperLid: 0.5, upperLidBend: 0.3, offsetY: 0.4, offsetX: 0.16,
      scaleY: 0.92, pupil: 1.12, browY: 9, browAngle: -7, converge: -0.12,
    },
    blush: 1,
  },
  {
    id: "curious",
    name: "Curious",
    base: { scaleY: 1.12, offsetY: -0.28, angle: 6, browY: 6, converge: 0.3 },
    left: { browY: 2 },
    right: { browY: 22, upperLid: 0 },
  },
  {
    id: "pleading",
    name: "Pleading",
    base: {
      scaleX: 1.08, scaleY: 1.22, pupil: 1.5, offsetY: -0.34,
      lowerLid: 0.16, browY: 13, browAngle: -13, converge: 0.32,
      rTL: 0.7, rTR: 0.7, rBL: 0.85, rBR: 0.85,
    },
  },
  {
    id: "surprised",
    name: "Surprised",
    base: {
      scaleY: 1.34, scaleX: 1.06, upperLid: 0, lowerLid: 0, pupil: 0.72,
      browY: 22, rTL: 0.7, rTR: 0.7, rBL: 0.7, rBR: 0.7,
    },
  },
  {
    id: "angry",
    name: "Angry",
    base: {
      upperLid: 0.46, upperLidAngle: 22, scaleY: 1.0, pupil: 0.8,
      browY: -12, browAngle: 22, browBend: 0.15, rTL: 0.15, rTR: 0.15, converge: 0.4,
    },
  },
  {
    id: "sad",
    name: "Sad",
    base: {
      upperLid: 0.38, upperLidAngle: -18, offsetY: 0.3, lowerLid: 0.12,
      pupil: 1.06, browY: 8, browAngle: -18,
    },
  },
  {
    id: "love",
    name: "Love",
    base: {
      lowerLid: 0.44, lowerLidBend: -0.75, pupil: 1.42, scaleY: 1.04, browY: 8, converge: 0.35,
    },
    heart: 1,
  },
  {
    id: "playful",
    name: "Playful",
    base: { browY: 9 },
    left: { lowerLid: 0.44, lowerLidBend: -0.65, upperLid: 0.04, pupil: 1.05 },
    right: { scaleY: 0.09, lowerLidBend: -0.7 },
  },
];

export const EMOTION_BY_ID = Object.fromEntries(EMOTIONS.map((e) => [e.id, e]));
