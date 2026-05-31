import { Application } from "pixi.js";
import "./style.css";
import { GameScene } from "./systems/GameScene";
import { loadCharacterAssets } from "./systems/VisualFactory";

const app = new Application();
const RENDERER_KEY = "moonlit-spell-barrage.renderer";
const ASSET_LOAD_TIMEOUT_MS = 8000;
const appRoot = document.querySelector<HTMLDivElement>("#app");
const appStatus = document.querySelector<HTMLDivElement>("#app-status");

const setStatus = (message: string) => {
  if (appStatus) {
    appStatus.textContent = message;
  }
};

const showFatalError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  setStatus(`Failed to start.\n${message}`);
  console.error("Failed to start:", error);
};

const getSavedRenderer = () => {
  try {
    return window.localStorage.getItem(RENDERER_KEY);
  } catch {
    return null;
  }
};

const useCanvasRenderer = import.meta.env.PROD || getSavedRenderer() === "canvas";

const rememberCanvasRenderer = () => {
  try {
    window.localStorage.setItem(RENDERER_KEY, "canvas");
  } catch {
    // Best-effort fallback; reloading still gives Pixi another chance to auto-detect.
  }
};

try {
  setStatus("Starting renderer...");
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

  app.canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    rememberCanvasRenderer();
    window.setTimeout(() => {
      window.location.reload();
    }, 120);
  });

  appRoot?.appendChild(app.canvas);

  setStatus("Loading assets...");
  await Promise.race([
    loadCharacterAssets(),
    new Promise<void>((resolve) => window.setTimeout(resolve, ASSET_LOAD_TIMEOUT_MS))
  ]);
  const scene = new GameScene(app);
  await scene.init();
  appStatus?.remove();

  app.ticker.add((ticker) => {
    scene.update(ticker.deltaMS / 1000);
  });
} catch (error) {
  showFatalError(error);
}
