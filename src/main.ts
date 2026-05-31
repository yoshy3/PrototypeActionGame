import { Application, type ApplicationOptions } from "pixi.js";
import "./style.css";
import { GameScene } from "./systems/GameScene";
import { loadCharacterAssets } from "./systems/VisualFactory";

let app = new Application();
const RENDERER_KEY = "moonlit-spell-barrage.renderer";
const ASSET_LOAD_TIMEOUT_MS = 8000;
const RENDERER_INIT_TIMEOUT_MS = 8000;
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

const useCanvasRenderer = getSavedRenderer() === "canvas";

const rememberCanvasRenderer = () => {
  try {
    window.localStorage.setItem(RENDERER_KEY, "canvas");
  } catch {
    // Best-effort fallback; reloading still gives Pixi another chance to auto-detect.
  }
};

try {
  setStatus("Starting renderer...");
  const baseOptions: Partial<ApplicationOptions> = {
    width: 720,
    height: 960,
    backgroundAlpha: 0,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 2),
    autoDensity: true,
    failIfMajorPerformanceCaveat: true,
    powerPreference: "high-performance"
  };

  await initRendererWithTimeout(useCanvasRenderer ? "canvas" : "webgl", baseOptions);

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

async function initRendererWithTimeout(preference: "webgl" | "canvas", options: Partial<ApplicationOptions>) {
  try {
    await Promise.race([
      app.init({ ...options, preference }),
      new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error(`${preference} renderer initialization timed out`)), RENDERER_INIT_TIMEOUT_MS)
      )
    ]);
  } catch (error) {
    if (preference === "canvas") {
      throw error;
    }

    console.warn("WebGL renderer failed; retrying with Canvas renderer.", error);
    rememberCanvasRenderer();
    setStatus("Starting fallback renderer...");
    app = new Application();
    await Promise.race([
      app.init({ ...options, preference: "canvas" }),
      new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error("canvas renderer initialization timed out")), RENDERER_INIT_TIMEOUT_MS)
      )
    ]);
  }
}
