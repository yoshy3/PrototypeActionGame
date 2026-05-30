export type DifficultyId = "casual" | "normal" | "lunatic";

export type DifficultyConfig = {
  id: DifficultyId;
  label: string;
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
    fireDelay: 1.22,
    score: 0.85
  },
  {
    id: "normal",
    label: "Normal",
    enemyHp: 1,
    bossHp: 1,
    bulletSpeed: 1,
    fireDelay: 1,
    score: 1
  },
  {
    id: "lunatic",
    label: "Lunatic",
    enemyHp: 1.25,
    bossHp: 1.32,
    bulletSpeed: 1.2,
    fireDelay: 0.78,
    score: 1.45
  }
];
