import { Container } from "pixi.js";
import { polar, clamp } from "./math";
import type { DifficultyConfig } from "./Difficulty";
import type { BulletSystem } from "./BulletSystem";
import type { Actor, EnemySpawn, StageEnemyPattern } from "./types";
import { CharacterVisual, createEnemyVisual } from "./VisualFactory";

export class Enemy implements Actor {
  readonly container = new Container();
  readonly pos = { x: 0, y: 0 };
  readonly radius = 18;
  hp: number;
  alive = true;
  private age = 0;
  private fireTimer = 0.5;
  private disposed = false;
  private readonly body: CharacterVisual;

  constructor(
    private readonly spawn: EnemySpawn,
    private readonly difficulty: DifficultyConfig
  ) {
    this.hp = Math.ceil(spawn.hp * difficulty.enemyHp);
    this.pos.x = spawn.x;
    this.pos.y = spawn.y;

    this.body = createEnemyVisual();
    this.container.addChild(this.body);
    this.container.position.set(this.pos.x, this.pos.y);
  }

  update(dt: number, bullets: BulletSystem, playerX: number) {
    if (!this.alive) {
      return;
    }

    this.age += dt;

    const side = this.spawn.mirror ? -1 : 1;
    this.move(dt, side);
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
    if (pattern === "cross" || pattern === "wheel") {
      return 0.85;
    }
    if (pattern === "snipe") {
      return 0.72;
    }
    return 1.15;
  }
}
