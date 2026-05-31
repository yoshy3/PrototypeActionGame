import type { Container, Graphics } from "pixi.js";
import type { MusicTrackId } from "./AudioSystem";

export type Vector = {
  x: number;
  y: number;
};

export type BulletKind = "star" | "petal" | "orb" | "splitter" | "shell";

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
  hp?: number;
  splitAt?: number;
  splitCount?: number;
  splitSpeed?: number;
  splitKind?: BulletKind;
  alive: boolean;
};

export type Laser = {
  id: number;
  owner: BulletOwner;
  sourceId?: number;
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

export type StageEnemyKind = "moth" | "crystal" | "astralFamiliar";

export type BossKind = "lunarWitch" | "starlightOracle" | "cosmicSorcerer";

export type StageEnemyPattern =
  | "drift"
  | "fan"
  | "cross"
  | "snipe"
  | "wheel"
  | "laserSlash"
  | "laserGate"
  | "laserSnipe"
  | "splitFan"
  | "breakableWall";

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

export type AsteroidSpawn = {
  time: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  variant: number;
  spin: number;
};

export type StageDefinition = {
  id: number;
  title: string;
  subtitle: string;
  warningText: string;
  bossKind: BossKind;
  stageMusic?: MusicTrackId;
  bossMusic?: MusicTrackId;
  spawns: EnemySpawn[];
  obstacles?: AsteroidSpawn[];
  bossStartTime: number;
};

export type Actor = {
  container: Container;
  pos: Vector;
  radius: number;
  hp: number;
  alive: boolean;
};
