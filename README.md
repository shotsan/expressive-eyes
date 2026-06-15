# Expressive Eyes

A high-quality character eye animation system where **one emotion engine drives every eye style**. Emotion is conveyed purely through shape — eyelids, brows, openness, gaze, pupil convergence — never by changing colour.

**Live demo → [expressive-eyes.azurewebsites.net](https://expressive-eyes.azurewebsites.net)**

![Expressive Eyes](https://expressive-eyes.azurewebsites.net)

---

## What it does

- **14 distinct eye styles** — Gel, EMO bot, Robot, Orb, Aurora, Neon, HUD, Anime, Cute, Deep, Classic, Villain, Kawaii, Pixel
- **10 emotions** — Neutral, Happy, Shy, Curious, Pleading, Surprised, Angry, Sad, Love, Playful
- **One emotion engine drives all styles** simultaneously — click an emotion and watch every style express it
- **Pupil convergence** — pupils focus inward (lock on) for intensity/curiosity, diverge for shyness, center on emotion change so the expression reads clearly
- **Webcam face tracking** — click "Follow my face", grant camera access, and the eyes follow your face in real time using **MediaPipe** (Google's in-browser WASM)
- **Cursor follow** — eyes track the mouse as fallback
- **Autonomous idle life** — natural blinking cadence, micro-saccades, breathing bob

---

## Emotion is shape, not colour

Each style keeps its own palette in every emotion. Angry gel stays cyan — it glares via inner-down brows and slanted lids. The parametric model (inspired by Anki's Cozmo/Vector) defines each eye with:

- 4 independent corner radii
- Upper + lower eyelids with angle, bend, and coverage
- Brow height, angle, and arch
- Gaze offset, pupil size, convergence, tilt

Every emotion is just a different set of numbers, spring-morphed smoothly.

---

## Stack

| Layer | Library |
|---|---|
| Rendering | Canvas 2D (no WebGL dependency) |
| Motion | Critically-damped springs (custom, ~30 lines) |
| Blink / transition timing | [GSAP](https://gsap.com) |
| Face tracking | [MediaPipe](https://mediapipe.dev) tasks-vision |
| Build | [Vite](https://vitejs.dev) + TypeScript |
| Server | Node.js (zero dependencies) |

---

## Run locally

```bash
git clone https://github.com/shotsan/expressive-eyes
cd expressive-eyes
npm install
npm run dev
# → http://localhost:5173
```

## Deploy

```bash
npm run build
az webapp up --name expressive-eyes --resource-group expressive-eyes-rg --runtime "NODE:22-lts"
```

---

## Project structure

```
src/
  persona/
    Persona.ts          # render loop, spring morph, gaze, blink, public API
    EyeRenderer.ts      # parametric Canvas eye (body, iris, lids, brow, lashes)
    emotions.ts         # 10 emotion presets (shape params only)
    params.ts           # EyeParams type, NEUTRAL baseline, mirror/lerp utils
    skins.ts            # 14 style skins (shape, fill, pupil, brow, colour)
  face/
    FaceTracker.ts      # MediaPipe webcam face detection → gaze target
  math/
    Spring.ts           # stable damped spring
demo/
  main.ts               # wires all personas + emotion bar + camera toggle
index.html              # two-column layout, sticky emotion bar
gallery.html            # static style reference (blinks + cursor follow)
server.cjs              # zero-dep Node server for Azure
```

---

## Programmatic API

```ts
import { Persona } from './src/persona/Persona'

const eyes = new Persona(canvas, 'gel', { autonomic: true })

eyes.setEmotion('curious')        // morph to any emotion
eyes.followCursor(true)           // cursor-driven gaze
eyes.setGaze(-0.5, 0.2)          // direct gaze (e.g. from face tracker)
eyes.setAutonomic(false)          // pause idle blink/saccade/breathe
eyes.dispose()                    // clean teardown
```

---

## Emotions

| ID | Expression cues |
|---|---|
| `neutral` | Soft open lids, gentle convergence |
| `happy` | Lower lids raised (smile-eyes), brows up |
| `shy` | Half-lowered lids, gaze down, blush |
| `curious` | Wide eyes, upward gaze, asymmetric raised brow |
| `pleading` | Very large pupils + catchlights, inner brows up |
| `surprised` | Maximum openness, brows high |
| `angry` | Inner-down brow V, slanted upper lids, sharp corners |
| `sad` | Inner-up lids + brows, downcast gaze |
| `love` | Smiling lids, dilated pupils, heart catchlights |
| `playful` | One eye winks |

---

## Credits

- Eye design principles inspired by Anki's Cozmo / Vector parametric face system
- Face tracking: [Google MediaPipe](https://mediapipe.dev)
- Style gallery includes reference designs: Anime, Cute, Deep (original artwork)
