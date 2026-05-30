import { Application } from "pixi.js";
import "./style.css";
import { GameScene } from "./systems/GameScene";
import { loadCharacterAssets } from "./systems/VisualFactory";

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

const scene = new GameScene(app);
await scene.init();

app.ticker.add((ticker) => {
  scene.update(ticker.deltaMS / 1000);
});
