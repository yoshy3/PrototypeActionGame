import type { AnimatedSprite, Container, Graphics } from "pixi.js";
import type { MusicTrackId, VoiceId } from "./AudioSystem";

export type Vector = {
  x: number;
  y: number;
};

export type BulletKind = "star" | "petal" | "orb" | "splitter" | "shell" | "fire" | "homingFire";

export type BulletOwner = "player" | "enemy";

export type ItemKind = "score" | "bomb";

export type Bullet = {
  id: number;
  owner: BulletOwner;
  kind: BulletKind;
  sprite: Graphics | AnimatedSprite;
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
  homingDelay?: number;
  homingTime?: number;
  homingTurnRate?: number;
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

export type StageEnemyKind = "moth" | "crystal" | "astralFamiliar" | "dragon";

export type BossKind = "lunarWitch" | "starlightOracle" | "cosmicSorcerer" | "salamander";

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
  | "breakableWall"
  | "fireRain"
  | "flameFan"
  | "flameSnipe";

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
  preBossVoice?: VoiceId;
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
