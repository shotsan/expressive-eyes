/**
 * Brings a rendered eye SVG to life: autonomous blinking + pupils that track
 * the cursor. Style-agnostic — it just looks for `.eye` (blink) and `.pupil`
 * (tracking) nodes, which every style in eyeStyles.ts provides.
 */
const MAX_X = 9; // px the pupils travel horizontally
const MAX_Y = 6;

export function liveize(root: HTMLElement) {
  const eyes = Array.from(root.querySelectorAll<SVGElement>(".eye"));
  const pupils = Array.from(root.querySelectorAll<SVGElement>(".pupil"));

  // pupils follow the pointer, eased via CSS transition
  const onMove = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = clamp((e.clientX - cx) / (r.width / 2), -1, 1) * MAX_X;
    const dy = clamp((e.clientY - cy) / (r.height / 2), -1, 1) * MAX_Y;
    for (const p of pupils) p.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  window.addEventListener("pointermove", onMove);

  // recenter when the pointer leaves the window
  const onLeave = () => {
    for (const p of pupils) p.style.transform = "translate(0,0)";
  };
  window.addEventListener("blur", onLeave);

  const blink = () => {
    for (const el of eyes) {
      el.animate(
        [
          { transform: "scaleY(1)" },
          { transform: "scaleY(0.06)", offset: 0.5 },
          { transform: "scaleY(1)" },
        ],
        { duration: 170, easing: "ease-in-out" }
      );
    }
  };

  // randomized blink cadence (occasionally a quick double-blink)
  let timer = 0;
  const schedule = () => {
    const next = 2200 + Math.random() * 3500;
    timer = window.setTimeout(() => {
      blink();
      if (Math.random() < 0.18) window.setTimeout(blink, 230);
      schedule();
    }, next);
  };
  schedule();

  return {
    blink,
    dispose() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onLeave);
      clearTimeout(timer);
    },
  };
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));
