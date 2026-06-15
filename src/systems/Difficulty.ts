export type DifficultyId = "beginner" | "casual" | "normal" | "lunatic";

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
    id: "beginner",
    label: "Beginner",
    enemyHp: 0.65,
    bossHp: 0.6,
    bulletSpeed: 0.65,
    fireDelay: 7.32,
    score: 0.5
  },
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
    enemyHp: 1.25,
    bossHp: 1.32,
    bulletSpeed: 1.2,
    fireDelay: 0.78,
    score: 1.45
  }
];
