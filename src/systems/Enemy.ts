import { Container } from "pixi.js";
import { polar, clamp } from "./math";
import type { DifficultyConfig } from "./Difficulty";
import type { BulletSystem } from "./BulletSystem";
import type { Actor, EnemySpawn, StageEnemyPattern } from "./types";
import { CharacterVisual, createEnemyVisual } from "./VisualFactory";

let nextEnemyId = 1;

type QueuedFire = {
  timer: number;
  origin: { x: number; y: number };
  angle: number;
  speed: number;
  radius: number;
};

export class Enemy implements Actor {
  readonly id = nextEnemyId++;
  readonly container = new Container();
  readonly pos = { x: 0, y: 0 };
  readonly radius: number;
  hp: number;
  alive = true;
  private age = 0;
  private moveAge = 0;
  private fireTimer = 0.5;
  private fireLockTimer = 0;
  private readonly queuedFires: QueuedFire[] = [];
  private disposed = false;
  private readonly body: CharacterVisual;

  constructor(
    private readonly spawn: EnemySpawn,
    private readonly difficulty: DifficultyConfig
  ) {
    this.hp = Math.ceil(spawn.hp * difficulty.enemyHp);
    this.radius = spawn.kind === "dragon" ? 28 : 18;
    this.pos.x = spawn.x;
    this.pos.y = spawn.y;

    this.body = createEnemyVisual(spawn.kind, spawn.pattern);
    this.container.addChild(this.body);
    this.container.position.set(this.pos.x, this.pos.y);
  }

  update(dt: number, bullets: BulletSystem, player: { x: number; y: number }) {
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
    this.updateQueuedFires(dt, bullets);

    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = this.getFireDelay(this.spawn.pattern) * this.difficulty.fireDelay;
      this.fire(bullets, player, this.spawn.pattern);
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

  private fire(bullets: BulletSystem, player: { x: number; y: number }, pattern: StageEnemyPattern) {
    if (pattern === "fan") {
      const base = Math.atan2(760 - this.pos.y, player.x - this.pos.x);
      const start = this.difficulty.id === "beginner" ? -1 : -2;
      const end = this.difficulty.id === "beginner" ? 1 : 2;
      for (let i = start; i <= end; i += 1) {
        bullets.spawn("enemy", "petal", this.pos, polar(base + i * 0.18, 175 * this.difficulty.bulletSpeed), 8, 1);
      }
      return;
    }

    if (pattern === "cross") {
      const count = this.difficulty.id === "beginner" ? 4 : 8;
      for (let i = 0; i < count; i += 1) {
        bullets.spawn(
          "enemy",
          "star",
          this.pos,
          polar((Math.PI * 2 * i) / count + this.age * 0.25, 130 * this.difficulty.bulletSpeed),
          8,
          1
        );
      }
      return;
    }

    if (pattern === "snipe") {
      const angle = Math.atan2(780 - this.pos.y, player.x - this.pos.x);
      bullets.spawn("enemy", "orb", this.pos, polar(angle, 210 * this.difficulty.bulletSpeed), 9, 1);
      if (this.difficulty.id !== "beginner") {
        bullets.spawn("enemy", "petal", this.pos, polar(angle - 0.16, 165 * this.difficulty.bulletSpeed), 7, 1);
        bullets.spawn("enemy", "petal", this.pos, polar(angle + 0.16, 165 * this.difficulty.bulletSpeed), 7, 1);
      }
      return;
    }

    if (pattern === "wheel") {
      const count = this.difficulty.id === "beginner" ? 5 : 10;
      for (let i = 0; i < count; i += 1) {
        const angle = this.age * 1.4 + (Math.PI * 2 * i) / count;
        bullets.spawn("enemy", i % 2 === 0 ? "star" : "petal", this.pos, polar(angle, 120 * this.difficulty.bulletSpeed), 7, 1);
      }
      return;
    }

    if (pattern === "splitFan") {
      const base = Math.atan2(760 - this.pos.y, player.x - this.pos.x);
      const start = this.difficulty.id === "beginner" ? 0 : -1;
      const end = this.difficulty.id === "beginner" ? 0 : 1;
      const splitCount = this.difficulty.id === "beginner" ? 3 : 7;
      for (let i = start; i <= end; i += 1) {
        bullets.spawn(
          "enemy",
          "splitter",
          this.pos,
          polar(base + i * 0.28, 122 * this.difficulty.bulletSpeed),
          11,
          1,
          { splitAt: 0.78, splitCount, splitSpeed: 155 * this.difficulty.bulletSpeed, splitKind: "petal" }
        );
      }
      return;
    }

    if (pattern === "breakableWall") {
      const drift = this.spawn.mirror ? -1 : 1;
      const step = this.difficulty.id === "beginner" ? 2 : 1;
      const shellLimit = this.difficulty.id === "beginner" ? 2 : 3;
      for (let i = -shellLimit; i <= shellLimit; i += step) {
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
      const otherLimit = this.difficulty.id === "beginner" ? 1 : 2;
      for (let i = -otherLimit; i <= otherLimit; i += step) {
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
      const angle = Math.atan2(800 - this.pos.y, player.x - this.pos.x);
      const fireLaser = this.difficulty.id !== "beginner" || Math.random() < 0.5;
      if (fireLaser) {
        bullets.spawnLaser("enemy", { x: this.pos.x, y: this.pos.y + 8 }, angle, 270, 5, 0.72, 0.7, 1, 300 * this.difficulty.bulletSpeed, 0.52, this.id);
        this.fireLockTimer = Math.max(this.fireLockTimer, 0.92);
      }
      if (this.difficulty.id !== "beginner" || Math.random() < 0.5) {
        bullets.spawn("enemy", "petal", this.pos, polar(Math.PI / 2, 120 * this.difficulty.bulletSpeed), 7, 1);
      }
      return;
    }

    if (pattern === "laserGate") {
      const targetY = 760 + Math.sin(this.age * 3) * 70;
      const angle = Math.atan2(targetY - this.pos.y, player.x - this.pos.x);
      const fireLaser = this.difficulty.id !== "beginner" || Math.random() < 0.5;
      if (fireLaser) {
        bullets.spawnLaser("enemy", { x: this.pos.x, y: this.pos.y + 8 }, angle, 310, 5, 0.74, 0.7, 1, 310 * this.difficulty.bulletSpeed, 0.54, this.id);
        this.fireLockTimer = Math.max(this.fireLockTimer, 0.96);
      }
      if (this.difficulty.id === "beginner") {
        bullets.spawn("enemy", "star", this.pos, polar(angle, 140 * this.difficulty.bulletSpeed), 7, 1);
      } else {
        bullets.spawn("enemy", "star", this.pos, polar(angle - 0.22, 140 * this.difficulty.bulletSpeed), 7, 1);
        bullets.spawn("enemy", "star", this.pos, polar(angle + 0.22, 140 * this.difficulty.bulletSpeed), 7, 1);
      }
      return;
    }

    if (pattern === "laserSnipe") {
      const angle = Math.atan2(780 - this.pos.y, player.x - this.pos.x);
      const fireLaser = this.difficulty.id !== "beginner" || Math.random() < 0.5;
      if (fireLaser) {
        bullets.spawnLaser("enemy", this.pos, angle, 330, 6, 0.78, 0.7, 1, 320 * this.difficulty.bulletSpeed, 0.54, this.id);
        this.fireLockTimer = Math.max(this.fireLockTimer, 0.94);
      }
      if (this.difficulty.id !== "beginner" || Math.random() < 0.5) {
        bullets.spawn("enemy", "orb", this.pos, polar(angle, 170 * this.difficulty.bulletSpeed), 8, 1);
      }
      return;
    }

    if (pattern === "flameFan") {
      this.queueDelayedFlameFans(player.x);
      return;
    }

    if (pattern === "flameSnipe") {
      this.fireHomingFlames(bullets, player);
      return;
    }

    if (pattern === "fireRain") {
      this.fireCrossingFlameStream(bullets);
      return;
    }

    const start = this.difficulty.id === "beginner" ? 0 : -1;
    const end = this.difficulty.id === "beginner" ? 0 : 1;
    for (let i = start; i <= end; i += 1) {
      bullets.spawn("enemy", "orb", this.pos, polar(Math.PI / 2 + i * 0.22, 155 * this.difficulty.bulletSpeed), 9, 1);
    }
  }

  private updateQueuedFires(dt: number, bullets: BulletSystem) {
    for (let index = this.queuedFires.length - 1; index >= 0; index -= 1) {
      const queued = this.queuedFires[index];
      queued.timer -= dt;
      if (queued.timer > 0) {
        continue;
      }

      bullets.spawn("enemy", "fire", queued.origin, polar(queued.angle, queued.speed * this.difficulty.bulletSpeed), queued.radius, 1);
      this.queuedFires.splice(index, 1);
    }
  }

  private queueDelayedFlameFans(playerX: number) {
    const base = Math.atan2(780 - this.pos.y, playerX - this.pos.x);
    const count = this.difficulty.id === "beginner" ? 5 : 9;
    const spread = 1.04;
    const direction = this.spawn.mirror ? -1 : 1;
    for (let i = 0; i < count; i += 1) {
      const ordered = direction > 0 ? i : count - 1 - i;
      const t = ordered / (count - 1) - 0.5;
      this.queuedFires.push({
        timer: i * 0.075,
        origin: { x: this.pos.x, y: this.pos.y + 4 },
        angle: base + t * spread,
        speed: 168 + Math.abs(t) * 24,
        radius: i % 3 === 0 ? 3.3 : 2.8
      });
    }
  }

  private fireHomingFlames(bullets: BulletSystem, player: { x: number; y: number }) {
    const base = Math.atan2(player.y - this.pos.y, player.x - this.pos.x);
    const homingLimit = this.difficulty.id === "beginner" ? 0 : 1;
    for (let i = -homingLimit; i <= homingLimit; i += 1) {
      const angle = base + i * 0.28;
      bullets.spawn(
        "enemy",
        "homingFire",
        { x: this.pos.x + i * 20, y: this.pos.y + 8 },
        polar(angle, (120 + Math.abs(i) * 16) * this.difficulty.bulletSpeed),
        i === 0 ? 3.6 : 3,
        1,
        { homingDelay: 3.0, homingTime: 3.0, homingTurnRate: 2.35 }
      );
    }
    if (this.difficulty.id !== "beginner") {
      for (let i = -1; i <= 1; i += 2) {
        bullets.spawn(
          "enemy",
          "fire",
          { x: this.pos.x + i * 28, y: this.pos.y + 12 },
          polar(base + i * 0.52, 168 * this.difficulty.bulletSpeed),
          2.7,
          1
        );
      }
    } else {
      bullets.spawn(
        "enemy",
        "fire",
        { x: this.pos.x + 28, y: this.pos.y + 12 },
        polar(base + 0.52, 168 * this.difficulty.bulletSpeed),
        2.7,
        1
      );
    }
  }

  private fireCrossingFlameStream(bullets: BulletSystem) {
    const drift = this.spawn.mirror ? -1 : 1;
    const step = this.difficulty.id === "beginner" ? 2 : 1;
    for (let i = -2; i <= 2; i += step) {
      const sideSweep = i % 2 === 0 ? drift : -drift;
      bullets.spawn(
        "enemy",
        "fire",
        { x: this.pos.x + i * 26, y: this.pos.y + 10 + Math.abs(i) * 7 },
        { x: (i * 10 + sideSweep * 48) * this.difficulty.bulletSpeed, y: (154 + Math.abs(i) * 22) * this.difficulty.bulletSpeed },
        i === 0 ? 3.4 : 2.9,
        1
      );
    }
    const start2 = this.difficulty.id === "beginner" ? 0 : -1;
    const end2 = this.difficulty.id === "beginner" ? 0 : 1;
    for (let i = start2; i <= end2; i += 1) {
      bullets.spawn(
        "enemy",
        "fire",
        { x: this.pos.x + i * 34, y: this.pos.y + 24 },
        polar(Math.PI / 2 + drift * (0.36 + i * 0.1), 116 * this.difficulty.bulletSpeed),
        2.6,
        1
      );
    }
  }

  private move(dt: number, side: number) {
    this.moveAge += dt;
    const move = this.spawn.move ?? "sway";
    if (move === "dive") {
      this.pos.x += Math.sin(this.moveAge * 2.2) * 26 * dt * side;
      this.pos.y += (this.moveAge < 1.25 ? 145 : 62) * dt;
      return;
    }

    if (move === "arc") {
      this.pos.x = clamp(this.spawn.x + Math.sin(this.moveAge * 1.35) * 140 * side, 42, 678);
      this.pos.y += 72 * dt;
      return;
    }

    this.pos.x += Math.sin(this.moveAge * 1.7) * 42 * dt * side;
    this.pos.y += (this.moveAge < 1.8 ? 95 : 36) * dt;
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
