import { distanceSq } from "./math";
import type { Vector } from "./types";

export const circlesOverlap = (a: Vector, ar: number, b: Vector, br: number) => {
  const radius = ar + br;
  return distanceSq(a, b) <= radius * radius;
};

export const distanceToSegment = (point: Vector, a: Vector, b: Vector) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.sqrt(distanceSq(point, a));
  }

  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq));
  const closest = { x: a.x + dx * t, y: a.y + dy * t };
  return Math.sqrt(distanceSq(point, closest));
};
