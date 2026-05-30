import type { Container, Graphics } from "pixi.js";

export type Vector = {
  x: number;
  y: number;
};

export type BulletKind = "star" | "petal" | "orb";

export type BulletOwner = "player" | "enemy";

export type ItemKind = "score" | "bomb";

export type Bullet = {
  id: number;
  owner: BulletOwner;
  kind: BulletKind;
  sprite: Graphics;
  pos: Vector;
  vel: Vector;
  radius: number;
  damage: number;
  age: number;
  spin: number;
  grazed: boolean;
  alive: boolean;
};

export type Laser = {
  id: number;
  owner: BulletOwner;
  sprite: Graphics;
  origin: Vector;
  angle: number;
  length: number;
  visibleLength: number;
  offset: number;
  width: number;
  warningTime: number;
  growTime: number;
  duration: number;
  speed: number;
  damage: number;
  age: number;
  grazed: boolean;
  alive: boolean;
};

export type CollectibleItem = {
  id: number;
  kind: ItemKind;
  sprite: Graphics;
  pos: Vector;
  vel: Vector;
  radius: number;
  autoCollect: boolean;
  alive: boolean;
};

export type StageEnemyKind = "moth" | "crystal";

export type BossKind = "lunarWitch" | "starlightOracle";

export type StageEnemyPattern =
  | "drift"
  | "fan"
  | "cross"
  | "snipe"
  | "wheel"
  | "laserSlash"
  | "laserGate"
  | "laserSnipe";

export type StageEnemyMove = "sway" | "dive" | "arc";

export type EnemySpawn = {
  time: number;
  x: number;
  y: number;
  hp: number;
  pattern: StageEnemyPattern;
  kind?: StageEnemyKind;
  move?: StageEnemyMove;
  mirror?: boolean;
};

export type StageDefinition = {
  id: number;
  title: string;
  subtitle: string;
  warningText: string;
  bossKind: BossKind;
  spawns: EnemySpawn[];
  bossStartTime: number;
};

export type Actor = {
  container: Container;
  pos: Vector;
  radius: number;
  hp: number;
  alive: boolean;
};
