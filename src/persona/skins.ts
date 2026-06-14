/**
 * A "skin" = the visual identity of an eye style (shape, fill, pupil, brow,
 * colour). The SAME emotion parameters (lids, brows, openness, gaze, pupil,
 * tilt) are applied on top of any skin — so every past style becomes a full
 * persona that can express every emotion.
 */
export type Shape = "roundrect" | "ellipse" | "almond" | "square";
export type Fill = "gradient" | "solid" | "outline";
export type Pupil = "none" | "soft" | "iris" | "dot";
export type Brow = "glow" | "dark" | "none";

export interface Skin {
  id: string;
  name: string;
  shape: Shape;
  w: number;
  h: number;
  spacing: number;
  radius: number; // base corner radius 0..1 (roundrect)
  fill: Fill;
  pupil: Pupil;
  gloss: boolean;
  brow: Brow;
  glow: number; // shadow blur px
  tintable: boolean; // can emotion mood recolour it?
  // distinctiveness knobs
  iris?: "anime" | "real" | "tech"; // iris family (when pupil === "iris")
  pupilShape?: "round" | "slit" | "square";
  detail?: "scanlines"; // solid-glow texture
  sparkle?: boolean; // anime star glint
  shine?: boolean; // kawaii big highlight, no dark pupil
  lashes?: boolean; // upper-lid lashes
  lidRim?: boolean; // depth shadow at lid edge (default true)
  base: {
    top: [number, number, number];
    bot: [number, number, number];
    glow: [number, number, number];
    iris: [number, number, number];
    sclera: [number, number, number];
  };
}

const C = (
  top: [number, number, number],
  bot: [number, number, number],
  glow: [number, number, number],
  iris: [number, number, number] = [20, 20, 28],
  sclera: [number, number, number] = [247, 249, 255]
) => ({ top, bot, glow, iris, sclera });

export const SKINS: Skin[] = [
  {
    id: "gel", name: "Gel", shape: "roundrect", w: 116, h: 150, spacing: 92, radius: 0.55,
    fill: "gradient", pupil: "soft", gloss: true, brow: "glow", glow: 24, tintable: true,
    base: C([165, 240, 255], [104, 139, 255], [74, 168, 255]),
  },
  {
    id: "emobot", name: "EMO bot", shape: "roundrect", w: 104, h: 150, spacing: 88, radius: 0.7,
    fill: "gradient", pupil: "none", gloss: true, brow: "glow", glow: 30, tintable: true, lidRim: false,
    base: C([155, 240, 255], [58, 160, 255], [43, 120, 255]),
  },
  {
    id: "robot", name: "Robot", shape: "roundrect", w: 100, h: 150, spacing: 86, radius: 0.55,
    fill: "gradient", pupil: "none", gloss: false, brow: "glow", glow: 28, tintable: true, detail: "scanlines", lidRim: false,
    base: C([154, 243, 255], [35, 199, 239], [40, 200, 240]),
  },
  {
    id: "orb", name: "Orb", shape: "ellipse", w: 130, h: 132, spacing: 92, radius: 1,
    fill: "gradient", pupil: "none", gloss: true, brow: "glow", glow: 28, tintable: true, lidRim: false,
    base: C([255, 214, 242], [88, 120, 255], [150, 110, 255]),
  },
  {
    id: "aurora", name: "Aurora", shape: "ellipse", w: 130, h: 132, spacing: 92, radius: 1,
    fill: "gradient", pupil: "soft", gloss: true, brow: "glow", glow: 24, tintable: true,
    base: C([110, 247, 200], [176, 123, 255], [90, 184, 255]),
  },
  {
    id: "neon", name: "Neon", shape: "almond", w: 138, h: 96, spacing: 96, radius: 1,
    fill: "outline", pupil: "dot", gloss: false, brow: "glow", glow: 16, tintable: true, lidRim: false,
    base: C([57, 245, 255], [57, 245, 255], [57, 245, 255], [200, 251, 255]),
  },
  {
    id: "hud", name: "HUD", shape: "ellipse", w: 128, h: 128, spacing: 92, radius: 1,
    fill: "outline", pupil: "iris", gloss: false, brow: "glow", glow: 12, tintable: true, iris: "tech", lidRim: false,
    base: C([34, 230, 255], [34, 230, 255], [34, 230, 255], [120, 230, 255], [6, 18, 26]),
  },
  {
    id: "anime", name: "Anime", shape: "ellipse", w: 120, h: 150, spacing: 92, radius: 1,
    fill: "solid", pupil: "iris", gloss: false, brow: "dark", glow: 0, tintable: false,
    iris: "anime", sparkle: true, lashes: true,
    base: C([255, 255, 255], [223, 234, 246], [120, 170, 255], [58, 134, 255]),
  },
  {
    id: "cute", name: "Cute", shape: "ellipse", w: 128, h: 140, spacing: 92, radius: 1,
    fill: "solid", pupil: "iris", gloss: false, brow: "dark", glow: 0, tintable: false,
    iris: "anime",
    base: C([251, 247, 242], [240, 232, 222], [150, 110, 70], [123, 78, 42]),
  },
  {
    id: "deep", name: "Deep", shape: "ellipse", w: 132, h: 152, spacing: 94, radius: 1,
    fill: "solid", pupil: "iris", gloss: true, brow: "dark", glow: 0, tintable: false,
    iris: "real",
    base: C([248, 251, 255], [232, 240, 250], [120, 200, 240], [31, 95, 136]),
  },
  {
    id: "classic", name: "Classic", shape: "ellipse", w: 120, h: 140, spacing: 90, radius: 1,
    fill: "solid", pupil: "dot", gloss: false, brow: "dark", glow: 0, tintable: false, lashes: true,
    base: C([255, 255, 255], [245, 245, 245], [120, 120, 120], [20, 20, 20]),
  },
  {
    id: "villain", name: "Villain", shape: "almond", w: 140, h: 104, spacing: 96, radius: 1,
    fill: "solid", pupil: "iris", gloss: false, brow: "dark", glow: 8, tintable: false,
    iris: "real", pupilShape: "slit", lashes: true,
    base: C([255, 255, 255], [245, 240, 235], [255, 140, 40], [239, 125, 26]),
  },
  {
    id: "kawaii", name: "Kawaii", shape: "roundrect", w: 70, h: 132, spacing: 78, radius: 0.9,
    fill: "solid", pupil: "none", gloss: false, brow: "dark", glow: 6, tintable: false, shine: true,
    base: C([46, 40, 50], [30, 26, 34], [120, 120, 140]),
  },
  {
    id: "pixel", name: "Pixel", shape: "square", w: 116, h: 116, spacing: 90, radius: 0,
    fill: "solid", pupil: "dot", gloss: false, brow: "dark", glow: 0, tintable: false, pupilShape: "square",
    base: C([238, 243, 255], [220, 228, 245], [120, 130, 160], [27, 31, 44]),
  },
];

export const SKIN_BY_ID = Object.fromEntries(SKINS.map((s) => [s.id, s]));
