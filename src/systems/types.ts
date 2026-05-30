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

export type CollectibleItem = {
  id: number;
  kind: ItemKind;
  sprite: Graphics;
  pos: Vector;
  vel: Vector;
  radius: number;
  alive: boolean;
};

export type StageEnemyPattern = "drift" | "fan" | "cross" | "snipe" | "wheel";

export type StageEnemyMove = "sway" | "dive" | "arc";

export type EnemySpawn = {
  time: number;
  x: number;
  y: number;
  hp: number;
  pattern: StageEnemyPattern;
  move?: StageEnemyMove;
  mirror?: boolean;
};

export type Actor = {
  container: Container;
  pos: Vector;
  radius: number;
  hp: number;
  alive: boolean;
};
