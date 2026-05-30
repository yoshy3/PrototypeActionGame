import type { Vector } from "./types";

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const distanceSq = (a: Vector, b: Vector) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};

export const normalize = (x: number, y: number): Vector => {
  const length = Math.hypot(x, y);
  return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
};

export const polar = (angle: number, speed: number): Vector => ({
  x: Math.cos(angle) * speed,
  y: Math.sin(angle) * speed
});
