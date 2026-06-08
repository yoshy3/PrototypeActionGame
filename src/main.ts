import { Application } from "pixi.js";
import "./style.css";
import { GameScene } from "./systems/GameScene";
import { Input } from "./systems/Input";
import { VirtualGamepad } from "./systems/VirtualGamepad";
import { loadCharacterAssets } from "./systems/VisualFactory";

const showError = (err: any) => {
  const container = document.getElementById("app");
  if (container) {
    // Clear loading or canvas if they exist
    container.innerHTML = "";
    const errorEl = document.createElement("div");
    errorEl.style.color = "#ff5e8c";
    errorEl.style.padding = "24px";
    errorEl.style.fontFamily = "monospace";
    errorEl.style.fontSize = "15px";
    errorEl.style.lineHeight = "1.5";
    errorEl.style.whiteSpace = "pre-wrap";
    errorEl.style.background = "rgba(16, 12, 29, 0.95)";
    errorEl.style.border = "1px solid rgba(255, 94, 140, 0.3)";
    errorEl.style.borderRadius = "8px";
    errorEl.style.margin = "20px";
    errorEl.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.5)";
    errorEl.innerText = `[Game Initialization Error]\n\nError: ${err?.message || err}\n\nStack:\n${err?.stack || "No stack trace available"}`;
    container.appendChild(errorEl);
  }
};

window.addEventListener("unhandledrejection", (event) => {
  showError(event.reason);
});

window.addEventListener("error", (event) => {
  showError(event.error);
});

async function start() {
  try {
    const app = new Application();

    await app.init({
      width: 720,
      height: 960,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio, 2),
      autoDensity: true
    });

    document.querySelector<HTMLDivElement>("#app")?.appendChild(app.canvas);

    await loadCharacterAssets();

    const input = new Input();
    new VirtualGamepad(input);

    const scene = new GameScene(app, input);
    await scene.init();

    app.ticker.add((ticker) => {
      scene.update(ticker.deltaMS / 1000);
    });
  } catch (err) {
    console.error("Initialization error:", err);
    showError(err);
  }
}

void start();
