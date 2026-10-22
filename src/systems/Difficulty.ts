import type { MessageKey } from "./I18n";
export type DifficultyId = "casual" | "normal" | "lunatic";

export type DifficultyConfig = {
  id: DifficultyId;
  label: MessageKey;
  enemyHp: number;
  bossHp: number;
  bulletSpeed: number;
  fireDelay: number;
  score: number;
};

export const difficulties: DifficultyConfig[] = [
  {
    id: "casual",
    label: "Casual",
    enemyHp: 0.85,
    bossHp: 0.82,
    bulletSpeed: 0.86,
    fireDelay: 3.66,
    score: 0.85
  },
  {
    id: "normal",
    label: "Normal",
    enemyHp: 1,
    bossHp: 1,
    bulletSpeed: 1,
    fireDelay: 1.5,
    score: 1
  },
  {
    id: "lunatic",
    label: "Lunatic",
    enemyHp: 1.10,
    bossHp: 1.10,
    bulletSpeed: 1.08,
    fireDelay: 1.30,
    score: 1.20
  }
];
