import { distanceSq } from "./math";
import type { Vector } from "./types";

export const circlesOverlap = (a: Vector, ar: number, b: Vector, br: number) => {
  const radius = ar + br;
  return distanceSq(a, b) <= radius * radius;
};
