import { Application } from "pixi.js";
import "./style.css";
import { GameScene } from "./systems/GameScene";
import { loadCharacterAssets } from "./systems/VisualFactory";

const app = new Application();
const RENDERER_KEY = "moonlit-spell-barrage.renderer";

const getSavedRenderer = () => {
  try {
    return window.localStorage.getItem(RENDERER_KEY);
  } catch {
    return null;
  }
};

const useCanvasRenderer = import.meta.env.PROD || getSavedRenderer() === "canvas";

await app.init({
  width: 720,
  height: 960,
  backgroundAlpha: 0,
  antialias: true,
  resolution: Math.min(window.devicePixelRatio, 2),
  autoDensity: true,
  preference: useCanvasRenderer ? "canvas" : ["webgl", "canvas"],
  failIfMajorPerformanceCaveat: true,
  powerPreference: "high-performance"
});

document.querySelector<HTMLDivElement>("#app")?.appendChild(app.canvas);

app.canvas.addEventListener("webglcontextlost", (event) => {
  event.preventDefault();

  try {
    window.localStorage.setItem(RENDERER_KEY, "canvas");
  } catch {
    // Best-effort fallback; reloading still gives Pixi another chance to auto-detect.
  }

  window.setTimeout(() => {
    window.location.reload();
  }, 120);
});

await loadCharacterAssets();

const scene = new GameScene(app);
await scene.init();

app.ticker.add((ticker) => {
  scene.update(ticker.deltaMS / 1000);
});
