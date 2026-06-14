import { STYLES, styleMarkup } from "../src/eyeStyles";
import { liveize } from "../src/animator";

const grid = document.getElementById("grid")!;

STYLES.forEach((style, i) => {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="num">${String(i + 1).padStart(2, "0")}</div>
    <div class="stage">${styleMarkup(style)}</div>
    <div class="meta">
      <span class="name">${style.name}</span>
      <span class="insp">${style.inspiration}</span>
    </div>`;
  grid.appendChild(card);
  liveize(card);
});
