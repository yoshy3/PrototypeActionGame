import { Container } from "pixi.js";
import { polar, clamp } from "./math";
import type { DifficultyConfig } from "./Difficulty";
import type { BulletSystem } from "./BulletSystem";
import type { Actor, EnemySpawn, StageEnemyPattern } from "./types";
import { CharacterVisual, createEnemyVisual } from "./VisualFactory";

let nextEnemyId = 1;

export class Enemy implements Actor {
  readonly id = nextEnemyId++;
  readonly container = new Container();
  readonly pos = { x: 0, y: 0 };
  readonly radius = 18;
  hp: number;
  alive = true;
  private age = 0;
  private fireTimer = 0.5;
  private fireLockTimer = 0;
  private disposed = false;
  private readonly body: CharacterVisual;

  constructor(
    private readonly spawn: EnemySpawn,
    private readonly difficulty: DifficultyConfig
  ) {
    this.hp = Math.ceil(spawn.hp * difficulty.enemyHp);
    this.pos.x = spawn.x;
    this.pos.y = spawn.y;

    this.body = createEnemyVisual(spawn.kind);
    this.container.addChild(this.body);
    this.container.position.set(this.pos.x, this.pos.y);
  }

  update(dt: number, bullets: BulletSystem, playerX: number) {
    if (!this.alive) {
      return;
    }

    this.age += dt;
    this.fireLockTimer = Math.max(0, this.fireLockTimer - dt);

    const side = this.spawn.mirror ? -1 : 1;
    if (this.fireLockTimer <= 0) {
      this.move(dt, side);
    }
    this.container.position.set(this.pos.x, this.pos.y);
    this.container.rotation = Math.sin(this.age * 3) * 0.08;
    this.body.update(dt, "idle");

    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = this.getFireDelay(this.spawn.pattern) * this.difficulty.fireDelay;
      this.fire(bullets, playerX, this.spawn.pattern);
    }

    if (this.pos.y > 980) {
      this.alive = false;
      this.destroyContainer();
    }
  }

  damage(amount: number) {
    this.hp -= amount;
    this.body.playHit(0.2);
    this.container.scale.set(1.12);
    if (this.hp <= 0) {
      this.alive = false;
      this.destroyContainer();
      return true;
    }
    return false;
  }

  destroy() {
    this.alive = false;
    this.destroyContainer();
  }

  private destroyContainer() {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.container.destroy();
  }

  private fire(bullets: BulletSystem, playerX: number, pattern: StageEnemyPattern) {
    if (pattern === "fan") {
      const base = Math.atan2(760 - this.pos.y, playerX - this.pos.x);
      for (let i = -2; i <= 2; i += 1) {
        bullets.spawn("enemy", "petal", this.pos, polar(base + i * 0.18, 175 * this.difficulty.bulletSpeed), 8, 1);
      }
      return;
    }

    if (pattern === "cross") {
      for (let i = 0; i < 8; i += 1) {
        bullets.spawn(
          "enemy",
          "star",
          this.pos,
          polar((Math.PI * 2 * i) / 8 + this.age * 0.25, 130 * this.difficulty.bulletSpeed),
          8,
          1
        );
      }
      return;
    }

    if (pattern === "snipe") {
      const angle = Math.atan2(780 - this.pos.y, playerX - this.pos.x);
      bullets.spawn("enemy", "orb", this.pos, polar(angle, 210 * this.difficulty.bulletSpeed), 9, 1);
      bullets.spawn("enemy", "petal", this.pos, polar(angle - 0.16, 165 * this.difficulty.bulletSpeed), 7, 1);
      bullets.spawn("enemy", "petal", this.pos, polar(angle + 0.16, 165 * this.difficulty.bulletSpeed), 7, 1);
      return;
    }

    if (pattern === "wheel") {
      for (let i = 0; i < 10; i += 1) {
        const angle = this.age * 1.4 + (Math.PI * 2 * i) / 10;
        bullets.spawn("enemy", i % 2 === 0 ? "star" : "petal", this.pos, polar(angle, 120 * this.difficulty.bulletSpeed), 7, 1);
      }
      return;
    }

    if (pattern === "splitFan") {
      const base = Math.atan2(760 - this.pos.y, playerX - this.pos.x);
      for (let i = -1; i <= 1; i += 1) {
        bullets.spawn(
          "enemy",
          "splitter",
          this.pos,
          polar(base + i * 0.28, 122 * this.difficulty.bulletSpeed),
          11,
          1,
          { splitAt: 0.78, splitCount: 7, splitSpeed: 155 * this.difficulty.bulletSpeed, splitKind: "petal" }
        );
      }
      return;
    }

    if (pattern === "breakableWall") {
      const drift = this.spawn.mirror ? -1 : 1;
      for (let i = -3; i <= 3; i += 1) {
        bullets.spawn(
          "enemy",
          "shell",
          { x: this.pos.x + i * 18, y: this.pos.y + 8 + Math.abs(i) * 2 },
          { x: (i * 9 + drift * 22) * this.difficulty.bulletSpeed, y: 122 * this.difficulty.bulletSpeed },
          14,
          1,
          { hp: 16 }
        );
      }
      for (let i = -2; i <= 2; i += 1) {
        bullets.spawn(
          "enemy",
          i % 2 === 0 ? "orb" : "petal",
          { x: this.pos.x + i * 24, y: this.pos.y + 2 },
          polar(Math.PI / 2 + i * 0.13 + drift * 0.08, (154 + Math.abs(i) * 12) * this.difficulty.bulletSpeed),
          i % 2 === 0 ? 8 : 7,
          1
        );
      }
      return;
    }

    if (pattern === "laserSlash") {
      const angle = Math.atan2(800 - this.pos.y, playerX - this.pos.x);
      bullets.spawnLaser("enemy", { x: this.pos.x, y: this.pos.y + 8 }, angle, 270, 5, 0.72, 0.7, 1, 300 * this.difficulty.bulletSpeed, 0.52, this.id);
      this.fireLockTimer = Math.max(this.fireLockTimer, 0.92);
      bullets.spawn("enemy", "petal", this.pos, polar(Math.PI / 2, 120 * this.difficulty.bulletSpeed), 7, 1);
      return;
    }

    if (pattern === "laserGate") {
      const targetY = 760 + Math.sin(this.age * 3) * 70;
      const angle = Math.atan2(targetY - this.pos.y, playerX - this.pos.x);
      bullets.spawnLaser("enemy", { x: this.pos.x, y: this.pos.y + 8 }, angle, 310, 5, 0.74, 0.7, 1, 310 * this.difficulty.bulletSpeed, 0.54, this.id);
      this.fireLockTimer = Math.max(this.fireLockTimer, 0.96);
      bullets.spawn("enemy", "star", this.pos, polar(angle - 0.22, 140 * this.difficulty.bulletSpeed), 7, 1);
      bullets.spawn("enemy", "star", this.pos, polar(angle + 0.22, 140 * this.difficulty.bulletSpeed), 7, 1);
      return;
    }

    if (pattern === "laserSnipe") {
      const angle = Math.atan2(780 - this.pos.y, playerX - this.pos.x);
      bullets.spawnLaser("enemy", this.pos, angle, 330, 6, 0.78, 0.7, 1, 320 * this.difficulty.bulletSpeed, 0.54, this.id);
      this.fireLockTimer = Math.max(this.fireLockTimer, 0.94);
      bullets.spawn("enemy", "orb", this.pos, polar(angle, 170 * this.difficulty.bulletSpeed), 8, 1);
      return;
    }

    if (pattern === "flameFan") {
      const base = Math.atan2(780 - this.pos.y, playerX - this.pos.x);
      for (let i = -3; i <= 3; i += 1) {
        bullets.spawn("enemy", "fire", this.pos, polar(base + i * 0.16, (150 + Math.abs(i) * 10) * this.difficulty.bulletSpeed), 9, 1);
      }
      return;
    }

    if (pattern === "flameSnipe") {
      const angle = Math.atan2(790 - this.pos.y, playerX - this.pos.x);
      bullets.spawn("enemy", "fire", this.pos, polar(angle, 235 * this.difficulty.bulletSpeed), 11, 1);
      bullets.spawn("enemy", "fire", { x: this.pos.x - 18, y: this.pos.y + 6 }, polar(angle - 0.12, 172 * this.difficulty.bulletSpeed), 8, 1);
      bullets.spawn("enemy", "fire", { x: this.pos.x + 18, y: this.pos.y + 6 }, polar(angle + 0.12, 172 * this.difficulty.bulletSpeed), 8, 1);
      return;
    }

    if (pattern === "fireRain") {
      const drift = this.spawn.mirror ? -1 : 1;
      for (let i = -2; i <= 2; i += 1) {
        bullets.spawn(
          "enemy",
          "fire",
          { x: this.pos.x + i * 30, y: this.pos.y + 12 + Math.abs(i) * 8 },
          { x: (i * 12 + drift * 26) * this.difficulty.bulletSpeed, y: (178 + Math.abs(i) * 18) * this.difficulty.bulletSpeed },
          9,
          1
        );
      }
      return;
    }

    for (let i = -1; i <= 1; i += 1) {
      bullets.spawn("enemy", "orb", this.pos, polar(Math.PI / 2 + i * 0.22, 155 * this.difficulty.bulletSpeed), 9, 1);
    }
  }

  private move(dt: number, side: number) {
    const move = this.spawn.move ?? "sway";
    if (move === "dive") {
      this.pos.x += Math.sin(this.age * 2.2) * 26 * dt * side;
      this.pos.y += (this.age < 1.25 ? 145 : 62) * dt;
      return;
    }

    if (move === "arc") {
      this.pos.x = clamp(this.spawn.x + Math.sin(this.age * 1.35) * 140 * side, 42, 678);
      this.pos.y += 72 * dt;
      return;
    }

    this.pos.x += Math.sin(this.age * 1.7) * 42 * dt * side;
    this.pos.y += (this.age < 1.8 ? 95 : 36) * dt;
  }

  private getFireDelay(pattern: StageEnemyPattern) {
    if (pattern === "breakableWall") {
      return 1.08;
    }
    if (pattern === "splitFan") {
      return 1.05;
    }
    if (pattern === "laserSlash" || pattern === "laserGate" || pattern === "laserSnipe") {
      return 1.18;
    }
    if (pattern === "flameFan" || pattern === "fireRain") {
      return 0.94;
    }
    if (pattern === "flameSnipe") {
      return 0.82;
    }
    if (pattern === "cross" || pattern === "wheel") {
      return 0.85;
    }
    if (pattern === "snipe") {
      return 0.72;
    }
    return 1.15;
  }
}
