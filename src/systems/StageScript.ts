import type { EnemySpawn } from "./types";

export const stageSpawns: EnemySpawn[] = [
  { time: 1.2, x: 130, y: -40, hp: 18, pattern: "fan" },
  { time: 1.6, x: 590, y: -40, hp: 18, pattern: "fan", mirror: true },
  { time: 3.0, x: 230, y: -40, hp: 22, pattern: "drift", move: "arc" },
  { time: 3.3, x: 490, y: -40, hp: 22, pattern: "drift", move: "arc", mirror: true },
  { time: 5.0, x: 90, y: -40, hp: 16, pattern: "cross" },
  { time: 5.25, x: 220, y: -40, hp: 16, pattern: "cross" },
  { time: 5.5, x: 360, y: -40, hp: 16, pattern: "cross" },
  { time: 5.75, x: 500, y: -40, hp: 16, pattern: "cross" },
  { time: 6.0, x: 630, y: -40, hp: 16, pattern: "cross" },
  { time: 7.2, x: 120, y: -40, hp: 20, pattern: "snipe", move: "dive" },
  { time: 7.6, x: 600, y: -40, hp: 20, pattern: "snipe", move: "dive", mirror: true },
  { time: 8.8, x: 160, y: -40, hp: 26, pattern: "fan", move: "arc" },
  { time: 8.8, x: 560, y: -40, hp: 26, pattern: "fan", move: "arc", mirror: true },
  { time: 10.7, x: 360, y: -40, hp: 34, pattern: "wheel" },
  { time: 12.0, x: 210, y: -40, hp: 24, pattern: "snipe", move: "dive" },
  { time: 12.2, x: 510, y: -40, hp: 24, pattern: "snipe", move: "dive", mirror: true }
];

export const bossStartTime = 15.6;
