/**
 * Six character-INSPIRED eye designs (just the eyes — no faces/characters).
 * Each is pure SVG so it's crisp at any size and cheap to animate.
 *
 * Shared conventions, so one animator drives them all:
 *   - viewBox is "0 0 200 120"; eyes are placed at x=62 and x=138, y=60.
 *   - the blinking shell has class "eye"   (animator squashes it vertically)
 *   - the part that tracks the cursor has class "pupil"
 *   - gradient/filter ids are prefixed per-style to avoid collisions.
 */
export interface EyeStyle {
  id: string;
  name: string;
  inspiration: string;
  defs: string; // svg <defs> contents
  eye: string; // one eye, centered on (0,0)
  eyeRight?: string; // optional different right eye (for winks / asymmetry)
}

const pair = (s: EyeStyle) => `
<svg viewBox="0 0 200 120" class="eyes" xmlns="http://www.w3.org/2000/svg">
  <defs>${s.defs}</defs>
  <g transform="translate(62,60)"><g class="eye">${s.eye}</g></g>
  <g transform="translate(138,60)"><g class="eye">${s.eyeRight ?? s.eye}</g></g>
</svg>`;

const BASE_STYLES: EyeStyle[] = [
  {
    id: "anime",
    name: "Anime",
    inspiration: "shoujo / VTuber",
    defs: `
      <radialGradient id="anime-iris" cx="50%" cy="32%" r="70%">
        <stop offset="0%" stop-color="#bdeaff"/>
        <stop offset="45%" stop-color="#3a86ff"/>
        <stop offset="100%" stop-color="#13286e"/>
      </radialGradient>`,
    eye: `
      <ellipse rx="30" ry="40" fill="#ffffff"/>
      <ellipse rx="30" ry="40" fill="#dfeaf6" opacity=".4" transform="translate(0,-22) scale(1,0.5)"/>
      <clipPath id="anime-clip"><ellipse rx="30" ry="40"/></clipPath>
      <g clip-path="url(#anime-clip)">
        <g class="pupil">
          <circle r="25" fill="url(#anime-iris)"/>
          <circle r="11" fill="#0a0a16"/>
          <ellipse cx="-8" cy="-13" rx="8" ry="10" fill="#fff" opacity=".95"/>
          <circle cx="8" cy="7" r="4.5" fill="#fff" opacity=".7"/>
          <path d="M-20 16 Q0 24 20 16" stroke="#9ec9ff" stroke-width="3" fill="none" opacity=".6"/>
        </g>
      </g>
      <path d="M-31 -20 Q0 -47 31 -20" stroke="#181822" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M31 -20 q10 -2 14 -10" stroke="#181822" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  },

  {
    id: "cute",
    name: "Cute",
    inspiration: "modern 3D animation",
    defs: `
      <radialGradient id="cute-iris" cx="50%" cy="35%" r="70%">
        <stop offset="0%" stop-color="#c89b6e"/>
        <stop offset="55%" stop-color="#6b4423"/>
        <stop offset="100%" stop-color="#2f1c0e"/>
      </radialGradient>`,
    eye: `
      <ellipse rx="33" ry="35" fill="#fbf7f2"/>
      <clipPath id="cute-clip"><ellipse rx="33" ry="35"/></clipPath>
      <g clip-path="url(#cute-clip)">
        <g class="pupil">
          <circle r="27" fill="url(#cute-iris)"/>
          <circle r="15" fill="#180d05"/>
          <ellipse cx="-10" cy="-11" rx="10" ry="12" fill="#fff" opacity=".95"/>
          <circle cx="10" cy="9" r="5" fill="#fff" opacity=".6"/>
        </g>
        <path d="M-33 -18 Q0 -30 33 -18" stroke="#00000018" stroke-width="10" fill="none"/>
      </g>`,
  },

  {
    id: "robot",
    name: "Robot",
    inspiration: "Cozmo / Vector",
    defs: `
      <filter id="robot-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDev="4" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <linearGradient id="robot-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#9af3ff"/>
        <stop offset="100%" stop-color="#23c7ef"/>
      </linearGradient>`,
    eye: `
      <g class="pupil" filter="url(#robot-glow)">
        <rect x="-23" y="-32" width="46" height="64" rx="18" fill="url(#robot-fill)"/>
        <rect x="-15" y="-26" width="14" height="20" rx="7" fill="#eafdff" opacity=".55"/>
      </g>`,
  },

  {
    id: "classic",
    name: "Classic toon",
    inspiration: "rubber-hose cartoons",
    defs: ``,
    eye: `
      <ellipse rx="32" ry="36" fill="#ffffff" stroke="#141414" stroke-width="3.5"/>
      <clipPath id="classic-clip"><ellipse rx="32" ry="36"/></clipPath>
      <g clip-path="url(#classic-clip)">
        <g class="pupil">
          <circle r="16" fill="#141414"/>
          <circle cx="-6" cy="-7" r="5" fill="#fff"/>
        </g>
      </g>`,
  },

  {
    id: "kawaii",
    name: "Kawaii",
    inspiration: "mascot / chibi",
    defs: ``,
    eye: `
      <rect x="-16" y="-30" width="32" height="60" rx="16" fill="#26222b"/>
      <g class="pupil">
        <ellipse cx="-5" cy="-13" rx="7" ry="9" fill="#fff"/>
        <circle cx="6" cy="9" r="4" fill="#fff" opacity=".85"/>
      </g>`,
  },

  {
    id: "sharp",
    name: "Villain",
    inspiration: "sharp / dramatic",
    defs: `
      <radialGradient id="sharp-iris" cx="50%" cy="42%" r="65%">
        <stop offset="0%" stop-color="#ffe09c"/>
        <stop offset="50%" stop-color="#ef7d1a"/>
        <stop offset="100%" stop-color="#7a1c08"/>
      </radialGradient>`,
    eye: `
      <path d="M-38 2 L-6 -16 Q0 -18 8 -15 L38 -3 Q22 15 0 14 Q-22 13 -38 2 Z" fill="#fff"/>
      <clipPath id="sharp-clip"><path d="M-38 2 L-6 -16 Q0 -18 8 -15 L38 -3 Q22 15 0 14 Q-22 13 -38 2 Z"/></clipPath>
      <g clip-path="url(#sharp-clip)">
        <g class="pupil">
          <circle r="17" fill="url(#sharp-iris)"/>
          <ellipse rx="4.5" ry="15" fill="#190a05"/>
          <circle cx="-6" cy="-7" r="3" fill="#fff" opacity=".85"/>
        </g>
      </g>
      <path d="M-39 1 L-6 -17 Q0 -19 9 -16 L39 -4" stroke="#1a1116" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  },
];

// ----- the 10 premium / persona / robotic additions -----
const glow = (id: string, sd: number) => `
  <filter id="${id}" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDev="${sd}" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;

const NEW_STYLES: EyeStyle[] = [
  {
    id: "emobot",
    name: "EMO bot",
    inspiration: "expressive desk robot",
    defs: `
      <linearGradient id="emobot-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#9bf0ff"/>
        <stop offset="55%" stop-color="#3aa0ff"/>
        <stop offset="100%" stop-color="#2b5bff"/>
      </linearGradient>${glow("emobot-glow", 4.5)}`,
    eye: `
      <g class="pupil" filter="url(#emobot-glow)">
        <rect x="-25" y="-35" width="50" height="70" rx="23" fill="url(#emobot-fill)"/>
        <rect x="-17" y="-29" width="22" height="15" rx="7" fill="#fff" opacity=".55"/>
      </g>`,
  },
  {
    id: "orb",
    name: "Orb",
    inspiration: "Siri / assistant",
    defs: `
      <radialGradient id="orb-grad" cx="38%" cy="32%" r="78%">
        <stop offset="0%" stop-color="#ffd6f2"/>
        <stop offset="42%" stop-color="#b97bff"/>
        <stop offset="100%" stop-color="#3a66ff"/>
      </radialGradient>${glow("orb-glow", 4)}`,
    eye: `
      <circle r="32" fill="url(#orb-grad)" filter="url(#orb-glow)"/>
      <g class="pupil">
        <circle cx="-9" cy="-9" r="10" fill="#fff" opacity=".5"/>
        <circle cx="9" cy="9" r="4" fill="#fff" opacity=".4"/>
      </g>`,
  },
  {
    id: "neon",
    name: "Neon",
    inspiration: "cyberpunk glow",
    defs: glow("neon-glow", 3),
    eye: `
      <path d="M-34 0 Q0 -24 34 0 Q0 24 -34 0 Z" fill="none" stroke="#39f5ff"
            stroke-width="3.5" filter="url(#neon-glow)"/>
      <g class="pupil"><circle r="7" fill="#ccfbff" filter="url(#neon-glow)"/></g>`,
  },
  {
    id: "gel",
    name: "Gel",
    inspiration: "glassmorphism UI",
    defs: `
      <linearGradient id="gel-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#9ff0ff"/>
        <stop offset="100%" stop-color="#6c8bff"/>
      </linearGradient>`,
    eye: `
      <rect x="-30" y="-33" width="60" height="66" rx="26" fill="url(#gel-grad)"/>
      <ellipse cx="0" cy="-17" rx="22" ry="8" fill="#fff" opacity=".4"/>
      <g class="pupil">
        <circle r="13" fill="#1b2350" opacity=".85"/>
        <circle cx="-5" cy="-6" r="4" fill="#fff" opacity=".7"/>
      </g>`,
  },
  {
    id: "pixel",
    name: "Pixel",
    inspiration: "8-bit / Tamagotchi",
    defs: ``,
    eye: `
      <rect x="-28" y="-28" width="56" height="56" fill="#eef3ff"/>
      <rect x="-28" y="-28" width="56" height="56" fill="none" stroke="#0c0e16" stroke-width="3"/>
      <g class="pupil">
        <rect x="-14" y="-14" width="28" height="28" fill="#1b1f2c"/>
        <rect x="-14" y="-14" width="10" height="10" fill="#eef3ff"/>
      </g>`,
  },
  {
    id: "hud",
    name: "HUD",
    inspiration: "sci-fi AI core",
    defs: `
      <radialGradient id="hud-grad" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#a8f6ff"/>
        <stop offset="100%" stop-color="#0a8bb0"/>
      </radialGradient>${glow("hud-glow", 1.6)}`,
    eye: `
      <g filter="url(#hud-glow)">
        <circle r="32" fill="#061018"/>
        <circle r="31" fill="none" stroke="#22e6ff" stroke-width="2" opacity=".85"/>
        <circle r="23" fill="none" stroke="#22e6ff" stroke-width="1" opacity=".5"/>
        <g stroke="#22e6ff" stroke-width="1.5" opacity=".6">
          <line x1="-33" y1="0" x2="-24" y2="0"/><line x1="33" y1="0" x2="24" y2="0"/>
          <line x1="0" y1="-33" x2="0" y2="-24"/><line x1="0" y1="33" x2="0" y2="24"/>
        </g>
        <g class="pupil"><circle r="11" fill="url(#hud-grad)"/><circle r="4.5" fill="#04222b"/></g>
      </g>`,
  },
  {
    id: "aurora",
    name: "Aurora",
    inspiration: "dreamy gradient",
    defs: `
      <linearGradient id="aurora-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#6ef7c8"/>
        <stop offset="50%" stop-color="#5ab8ff"/>
        <stop offset="100%" stop-color="#b07bff"/>
      </linearGradient>`,
    eye: `
      <circle r="33" fill="url(#aurora-grad)"/>
      <g class="pupil">
        <circle r="14" fill="#101522" opacity=".82"/>
        <ellipse cx="-9" cy="-10" rx="8" ry="10" fill="#fff" opacity=".75"/>
      </g>`,
  },
  {
    id: "arc",
    name: "Arc",
    inspiration: "minimal friendly bot",
    defs: `
      <linearGradient id="arc-grad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#7fe9ff"/>
        <stop offset="100%" stop-color="#5a8bff"/>
      </linearGradient>${glow("arc-glow", 3.5)}`,
    eye: `
      <g class="pupil" filter="url(#arc-glow)">
        <path d="M-26 5 Q0 -9 26 5" stroke="url(#arc-grad)" stroke-width="10"
              fill="none" stroke-linecap="round"/>
      </g>`,
  },
  {
    id: "deep",
    name: "Deep",
    inspiration: "premium emotive",
    defs: `
      <radialGradient id="deep-outer" cx="50%" cy="34%" r="72%">
        <stop offset="0%" stop-color="#4aa6c9"/>
        <stop offset="60%" stop-color="#1f5f88"/>
        <stop offset="100%" stop-color="#0d2c47"/>
      </radialGradient>
      <radialGradient id="deep-inner" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#7fd4ec"/>
        <stop offset="100%" stop-color="#1f5f88"/>
      </radialGradient>`,
    eye: `
      <ellipse rx="34" ry="39" fill="#f8fbff"/>
      <clipPath id="deep-clip"><ellipse rx="34" ry="39"/></clipPath>
      <g clip-path="url(#deep-clip)">
        <g class="pupil">
          <circle r="30" fill="url(#deep-outer)"/>
          <circle r="21" fill="url(#deep-inner)" opacity=".7"/>
          <circle r="13" fill="#080a12"/>
          <ellipse cx="-11" cy="-13" rx="10" ry="13" fill="#fff" opacity=".95"/>
          <circle cx="10" cy="11" r="5" fill="#fff" opacity=".55"/>
          <circle cx="-2" cy="20" r="6" fill="#9fd8ff" opacity=".45"/>
        </g>
        <path d="M-34 -20 Q0 -34 34 -20" stroke="#0000001f" stroke-width="12" fill="none"/>
      </g>`,
  },
];

// NOTE: emotion is now expressed by the single morphing persona (src/persona/*),
// not by per-emotion tiles. The gallery below is style reference only.
export const STYLES: EyeStyle[] = [...NEW_STYLES, ...BASE_STYLES];

export const styleMarkup = (s: EyeStyle) => pair(s);
