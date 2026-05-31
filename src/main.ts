import "pixi.js/browser";
import { Application, type ApplicationOptions } from "pixi.js";
import "./style.css";
import { GameScene } from "./systems/GameScene";
import { loadCharacterAssets } from "./systems/VisualFactory";

const app = new Application();
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

try {
  setStatus("Starting WebGL renderer...");
  const baseOptions: Partial<ApplicationOptions> = {
    width: 720,
    height: 960,
    backgroundAlpha: 0,
    antialias: false,
    resolution: 1,
    autoDensity: true,
    preference: ["webgl"],
    skipExtensionImports: true,
    failIfMajorPerformanceCaveat: false,
    powerPreference: "high-performance"
  };

  await initRendererWithTimeout(baseOptions);

  app.canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    setStatus("WebGL context was lost. Reloading...");
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

async function initRendererWithTimeout(options: Partial<ApplicationOptions>) {
  await Promise.race([
    app.init(options),
    new Promise<never>((_, reject) =>
      window.setTimeout(() => reject(new Error("webgl renderer initialization timed out")), RENDERER_INIT_TIMEOUT_MS)
    )
  ]);
}
