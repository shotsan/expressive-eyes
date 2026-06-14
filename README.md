# Designed Character Eyes — Rive vs Lottie

Instead of hand-coding eye shapes, this uses **pre-designed, animator-made assets**
driven by two battle-tested runtimes, shown side by side so you can pick one:

| | Runtime | Asset | Strength |
|---|---|---|---|
| **Rive** | `@rive-app/canvas` | community "Login" character (`public/rive/teddy.riv`) | live **interactive rig** — eyes follow the cursor, state triggers |
| **Lottie** | `lottie-web` | Google **Noto Emoji** clips (`public/lottie/*.json`, CC BY 4.0) | gorgeous **hand-animated expressions**, zero hand-coding |

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + bundle to dist/
```

Move your cursor over the Rive panel (eyes track it) and click the expression
buttons under each panel.

## Code

```
src/engines/RiveEyes.ts     loads teddy.riv, maps cursor -> isChecking input, react() states
src/engines/LottieEyes.ts   stacks Noto clips, crossfades + plays expression segments
src/index.ts                exports both engines
demo/main.ts                wires the side-by-side comparison UI
public/rive, public/lottie  the downloaded assets (served statically)
```

### Rive API
```ts
const rive = new RiveEyes(canvas);
rive.followCursor(true);          // eyes track the pointer (asset's gaze axis)
rive.react("happy" | "sad" | "peek" | "idle");
```
State machine `Login Machine` inputs: `isChecking` (number, gaze), `isHandsUp`
(number), `trigSuccess` / `trigFail` (triggers).

### Lottie API
```ts
const lottie = new LottieEyes(host);
lottie.setEmotion("love");   // neutral, joy, love, excited, rolling, robot, sad, angry
```
Each emotion is a separate designed clip; switching crossfades opacity and plays
the expressive segment, then settles. Recolorable by editing the JSON fills.

## Swapping assets
- **Rive:** drop a new `.riv` in `public/rive/`, update the `src` + state-machine
  name + input names in `RiveEyes.ts`. Build a custom rig in the Rive editor for
  full x/y gaze + blink + emotion inputs.
- **Lottie:** drop new `.json` clips in `public/lottie/` and edit `LOTTIE_EMOTIONS`.

## Attribution
Lottie expressions use **Google Noto Emoji** (CC BY 4.0). Keep the credit line.
