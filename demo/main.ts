import { Persona } from "../src/persona/Persona";
import { SKINS } from "../src/persona/skins";
import { EMOTIONS } from "../src/persona/emotions";
import { FaceTracker } from "../src/face/FaceTracker";

const grid = document.getElementById("grid")!;
const bar = document.getElementById("bar")!;
const personas: Persona[] = [];

for (const skin of SKINS) {
  const card = document.createElement("div");
  card.className = "card";
  const canvas = document.createElement("canvas");
  card.appendChild(canvas);
  const name = document.createElement("div");
  name.className = "name";
  name.textContent = skin.name;
  card.appendChild(name);
  grid.appendChild(card);
  personas.push(new Persona(canvas, skin.id, { autonomic: true }));
}

// one global emotion bar drives them all
EMOTIONS.forEach((e, i) => {
  const b = document.createElement("button");
  b.textContent = e.name;
  if (i === 0) b.classList.add("active");
  b.onclick = () => {
    personas.forEach((p) => p.setEmotion(e.id));
    bar.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
  };
  bar.appendChild(b);
});

(window as unknown as { personas: Persona[] }).personas = personas;

// ---- webcam face tracking ----
const camBtn = document.getElementById("camBtn") as HTMLButtonElement;
const video = document.getElementById("video") as HTMLVideoElement;
const camMsg = document.getElementById("camMsg")!;
let tracker: FaceTracker | null = null;

camBtn.onclick = async () => {
  if (tracker) {
    tracker.stop();
    tracker = null;
    video.classList.remove("on");
    camBtn.textContent = "📷 Follow my face";
    camMsg.textContent = "";
    personas.forEach((p) => p.followCursor(true));
    return;
  }
  camBtn.textContent = "starting…";
  camMsg.textContent = "loading face model…";
  try {
    personas.forEach((p) => p.followCursor(false));
    tracker = new FaceTracker(
      video,
      (nx, ny, present) => {
        if (present) personas.forEach((p) => p.setGaze(nx, ny));
        camMsg.textContent = present ? "tracking your face 👀" : "looking for a face…";
      },
      () => personas.forEach((p) => p.doBlink()) // real blink triggers eye blink
    );
    await tracker.start();
    video.classList.add("on");
    camBtn.textContent = "■ Stop camera";
    camMsg.textContent = "tracking your face 👀";
  } catch (err) {
    tracker = null;
    personas.forEach((p) => p.followCursor(true));
    camBtn.textContent = "📷 Follow my face";
    camMsg.textContent =
      "camera unavailable (permission denied or unsupported). Cursor still works.";
    console.error(err);
  }
};

// cycle through a couple emotions on load to show off the morph
personas.forEach((p) => p.setEmotion("happy"));
setTimeout(() => personas.forEach((p) => p.setEmotion("neutral")), 1500);
