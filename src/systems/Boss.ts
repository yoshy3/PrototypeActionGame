import { Container } from "pixi.js";
import type { DifficultyConfig } from "./Difficulty";
import { polar } from "./math";
import type { BulletSystem } from "./BulletSystem";
import type { Actor, BossKind, Vector } from "./types";
import { CharacterVisual, createBossVisual } from "./VisualFactory";

export class Boss implements Actor {
  readonly container = new Container();
  readonly pos = { x: 360, y: -80 };
  readonly radius = 30;
  hp: number;
  readonly maxHp: number;
  alive = true;
  entered = false;
  phaseChanged = false;
  private age = 0;
  private moveAge = 0;
  private fireTimer = 0.2;
  private fireLockTimer = 0;
  private breakableVolley = 0;
  private phase = 0;
  private readonly body: CharacterVisual;
  private target: Vector = { x: 360, y: 820 };

  constructor(
    private readonly difficulty: DifficultyConfig,
    private readonly kind: BossKind = "lunarWitch"
  ) {
    this.maxHp = Math.ceil((kind === "cosmicSorcerer" ? 2550 : kind === "starlightOracle" ? 4200 : 3120) * difficulty.bossHp);
    this.hp = this.maxHp;
    const visual = createBossVisual(kind);
    this.body = visual.character;
    this.container.addChild(visual.container);
    this.container.position.set(this.pos.x, this.pos.y);
  }

  update(dt: number, bullets: BulletSystem, player: Vector) {
    if (!this.alive) {
      return;
    }

    this.age += dt;
    this.fireLockTimer = Math.max(0, this.fireLockTimer - dt);
    this.target = { ...player };
    const previousX = this.pos.x;
    if (!this.entered) {
      this.pos.y += 95 * dt;
      if (this.pos.y >= 145) {
        this.pos.y = 145;
        this.entered = true;
        this.moveAge = 0;
      }
    } else if (this.fireLockTimer <= 0) {
      this.moveAge += dt;
      this.pos.x = 360 + Math.sin(this.moveAge * 0.75) * 135;
      this.pos.y = 145 + Math.sin(this.moveAge * 1.15) * 24;
    }

    this.container.position.set(this.pos.x, this.pos.y);
    this.container.rotation = Math.sin(this.age * 0.7) * 0.05;
    const animationState = this.pos.x < previousX - 0.5 ? "left" : this.pos.x > previousX + 0.5 ? "right" : "idle";
    this.body.update(dt, animationState);

    if (!this.entered) {
      return;
    }

    const nextPhase = this.resolvePhase();
    this.phaseChanged = nextPhase !== this.phase;
    this.phase = nextPhase;
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireSpell(bullets);
    }
  }

  getPhase() {
    return this.phase;
  }

  getSpellName() {
    if (this.kind === "starlightOracle") {
      return [
        "Crystal Dawn Ray",
        "Astral Crosslight",
        "Prism Diagonal Gate",
        "Starlight Meridian",
        "Oracle's Luminous Verdict"
      ][this.phase];
    }

    if (this.kind === "cosmicSorcerer") {
      return [
        "Asteroid Sigil",
        "Comet Thread Spiral",
        "Celestial Ring Gate",
        "Meteor Grimoire",
        "Cosmic Belt Finale"
      ][this.phase];
    }

    return [
      "Moonlit Petal Ring",
      "Starfall Spiral",
      "Lunar Butterfly Storm",
      "Eclipse Star Bloom",
      "Full Moon Finale"
    ][this.phase];
  }

  damage(amount: number) {
    if (!this.entered) {
      return false;
    }
    this.hp -= amount;
    this.body.playHit(0.24);
    this.container.scale.set(1.04);
    if (this.hp <= 0) {
      this.alive = false;
      this.container.destroy();
      return true;
    }
    return false;
  }

  private fireFlower(bullets: BulletSystem) {
    const offset = this.age * 0.9;
    for (let ring = 0; ring < 2; ring += 1) {
      for (let i = 0; i < 16; i += 1) {
        const angle = offset + (Math.PI * 2 * i) / 16 + ring * 0.1;
        bullets.spawn(
          "enemy",
          ring === 0 ? "petal" : "orb",
          this.pos,
          polar(angle, (112 + ring * 42) * this.difficulty.bulletSpeed),
          8,
          1
        );
      }
    }
  }

  private fireSpiral(bullets: BulletSystem) {
    for (let arm = 0; arm < 6; arm += 1) {
      const angle = this.age * 2.8 + (Math.PI * 2 * arm) / 6;
      bullets.spawn("enemy", arm % 2 === 0 ? "star" : "petal", this.pos, polar(angle, 190 * this.difficulty.bulletSpeed), 8, 1);
    }
  }

  private fireSpell(bullets: BulletSystem) {
    if (this.kind === "cosmicSorcerer") {
      this.fireCosmicSpell(bullets);
      return;
    }

    if (this.kind === "starlightOracle") {
      this.fireStarlightSpell(bullets);
      return;
    }

    if (this.phase === 0) {
      this.fireFlower(bullets);
      this.fireTimer = 0.42 * this.difficulty.fireDelay;
    } else if (this.phase === 1) {
      this.fireSpiral(bullets);
      this.fireTimer = 0.15 * this.difficulty.fireDelay;
    } else if (this.phase === 2) {
      this.fireButterflyStorm(bullets);
      this.fireTimer = 0.24 * this.difficulty.fireDelay;
    } else if (this.phase === 3) {
      this.fireStarBloom(bullets);
      this.fireTimer = 0.3 * this.difficulty.fireDelay;
    } else {
      this.fireFinale(bullets);
      this.fireTimer = 0.22 * this.difficulty.fireDelay;
    }
  }

  private fireStarlightSpell(bullets: BulletSystem) {
    if (this.phase === 0) {
      this.fireFlower(bullets);
      if (Math.floor(this.age * 2.2) % 2 === 0) {
        this.fireBossLaserFan(bullets, 2, 420, 6);
      }
      this.fireTimer = 0.4 * this.difficulty.fireDelay;
    } else if (this.phase === 1) {
      this.fireSpiral(bullets);
      if (Math.floor(this.age * 3) % 3 === 0) {
        this.fireAimedLaser(bullets, { x: this.pos.x - 60, y: this.pos.y + 22 }, 520, 6, -0.18);
        this.fireAimedLaser(bullets, { x: this.pos.x + 60, y: this.pos.y + 22 }, 520, 6, 0.18);
      }
      this.fireTimer = 0.18 * this.difficulty.fireDelay;
    } else if (this.phase === 2) {
      this.fireButterflyStorm(bullets);
      this.fireBossLaserFan(bullets, 3, 560, 7);
      this.fireTimer = 0.34 * this.difficulty.fireDelay;
    } else if (this.phase === 3) {
      this.fireStarBloom(bullets);
      this.fireAimedLaser(bullets, { x: this.pos.x, y: this.pos.y + 8 }, 700, 8, 0);
      if (Math.sin(this.age * 1.6) > 0) {
        this.fireAimedLaser(bullets, { x: this.pos.x - 90, y: this.pos.y + 58 }, 620, 7, -0.24);
        this.fireAimedLaser(bullets, { x: this.pos.x + 90, y: this.pos.y + 58 }, 620, 7, 0.24);
      }
      this.fireTimer = 0.38 * this.difficulty.fireDelay;
    } else {
      this.fireFinale(bullets);
      this.fireBossLaserFan(bullets, 4, 720, 8);
      this.fireTimer = 0.3 * this.difficulty.fireDelay;
    }
  }

  private fireCosmicSpell(bullets: BulletSystem) {
    if (this.phase === 0) {
      this.fireSplitSigil(bullets, 5, 0.82);
      this.fireTimer = 0.5 * this.difficulty.fireDelay;
    } else if (this.phase === 1) {
      this.fireSplitSpiral(bullets, 4, 0.66);
      this.fireTimer = 0.18 * this.difficulty.fireDelay;
    } else if (this.phase === 2) {
      if (this.shouldFireBreakable()) {
        this.fireBreakableRing(bullets, 10);
      }
      this.fireNormalStarFan(bullets, 7);
      this.fireTimer = 0.44 * this.difficulty.fireDelay;
    } else if (this.phase === 3) {
      if (this.shouldFireBreakable()) {
        this.fireBreakableComets(bullets, 12);
      }
      this.fireNormalStarFan(bullets, 9);
      this.fireTimer = 0.34 * this.difficulty.fireDelay;
    } else {
      if (Math.floor(this.age * 4) % 2 === 0) {
        this.fireSplitSpiral(bullets, 6, 0.5);
      } else if (this.shouldFireBreakable()) {
        this.fireBreakableComets(bullets, 14);
        this.fireNormalStarFan(bullets, 7);
      } else {
        this.fireNormalStarFan(bullets, 11);
      }
      this.fireTimer = 0.28 * this.difficulty.fireDelay;
    }
  }

  private shouldFireBreakable() {
    this.breakableVolley += 1;
    return this.breakableVolley % 2 === 1;
  }

  private fireSplitSigil(bullets: BulletSystem, count: number, splitAt: number) {
    const base = this.age * 0.95;
    for (let i = 0; i < count; i += 1) {
      const angle = base + (Math.PI * 2 * i) / count;
      bullets.spawn(
        "enemy",
        "splitter",
        { x: this.pos.x + Math.cos(angle) * 34, y: this.pos.y + 18 + Math.sin(angle) * 18 },
        polar(angle + 0.42, 118 * this.difficulty.bulletSpeed),
        12,
        1,
        { splitAt, splitCount: 9, splitSpeed: 152 * this.difficulty.bulletSpeed, splitKind: i % 2 === 0 ? "star" : "petal" }
      );
    }
  }

  private fireSplitSpiral(bullets: BulletSystem, arms: number, splitAt: number) {
    for (let arm = 0; arm < arms; arm += 1) {
      const angle = this.age * 2.1 + (Math.PI * 2 * arm) / arms;
      bullets.spawn(
        "enemy",
        "splitter",
        { x: this.pos.x + Math.cos(angle) * 28, y: this.pos.y + 20 + Math.sin(angle) * 16 },
        polar(angle + Math.PI / 2, 132 * this.difficulty.bulletSpeed),
        11,
        1,
        { splitAt, splitCount: 6, splitSpeed: 170 * this.difficulty.bulletSpeed, splitKind: arm % 2 === 0 ? "petal" : "star" }
      );
    }
  }

  private fireBreakableRing(bullets: BulletSystem, count: number) {
    const wobble = Math.sin(this.age * 1.7) * 0.18;
    for (let i = 0; i < count; i += 1) {
      const angle = Math.PI * 0.18 + wobble + (Math.PI * 0.64 * i) / (count - 1);
      bullets.spawn(
        "enemy",
        "shell",
        { x: this.pos.x + Math.cos(angle) * 66, y: this.pos.y + 34 + Math.sin(angle) * 28 },
        polar(angle, 112 * this.difficulty.bulletSpeed),
        15,
        1,
        { hp: 24 }
      );
    }
  }

  private fireBreakableComets(bullets: BulletSystem, count: number) {
    const center = this.angleToTarget({ x: this.pos.x, y: this.pos.y + 20 });
    const spread = 1.02;
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0 : i / (count - 1) - 0.5;
      const angle = center + t * spread + Math.sin(this.age + i) * 0.08;
      bullets.spawn(
        "enemy",
        "shell",
        { x: this.pos.x + t * 126, y: this.pos.y + 24 + Math.abs(t) * 28 },
        polar(angle, 126 * this.difficulty.bulletSpeed),
        15,
        1,
        { hp: 24 }
      );
    }
  }

  private fireNormalStarFan(bullets: BulletSystem, count: number) {
    const center = this.angleToTarget({ x: this.pos.x, y: this.pos.y + 24 });
    const spread = 0.92;
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0 : i / (count - 1) - 0.5;
      bullets.spawn(
        "enemy",
        i % 2 === 0 ? "star" : "orb",
        { x: this.pos.x + t * 104, y: this.pos.y + 28 },
        polar(center + t * spread, (170 + Math.abs(t) * 34) * this.difficulty.bulletSpeed),
        i % 2 === 0 ? 7 : 8,
        1
      );
    }
  }

  private fireBossLaserFan(bullets: BulletSystem, count: number, length: number, width: number) {
    const center = this.angleToTarget({ x: this.pos.x, y: this.pos.y + 18 });
    const spread = count <= 2 ? 0.28 : 0.46;
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0 : i / (count - 1) - 0.5;
      bullets.spawnLaser(
        "enemy",
        { x: this.pos.x, y: this.pos.y + 18 },
        center + t * spread,
        length,
        width,
        0.82,
        0.42,
        1,
        360 * this.difficulty.bulletSpeed,
        0.66
      );
    }
    this.fireLockTimer = Math.max(this.fireLockTimer, 1.1);
  }

  private fireAimedLaser(bullets: BulletSystem, origin: Vector, length: number, width: number, angleOffset: number) {
    bullets.spawnLaser(
      "enemy",
      origin,
      this.angleToTarget(origin) + angleOffset,
      length,
      width,
      0.86,
      0.42,
      1,
      370 * this.difficulty.bulletSpeed,
      0.66
    );
    this.fireLockTimer = Math.max(this.fireLockTimer, 1.1);
  }

  private angleToTarget(origin: Vector) {
    return Math.atan2(this.target.y - origin.y, this.target.x - origin.x);
  }

  private fireButterflyStorm(bullets: BulletSystem) {
    const sweep = Math.sin(this.age * 1.9) * 0.36;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 7; i += 1) {
        const angle = Math.PI / 2 + side * (0.18 + i * 0.09 + sweep);
        bullets.spawn(
          "enemy",
          "petal",
          { x: this.pos.x + side * 28, y: this.pos.y + 12 },
          polar(angle, (145 + i * 8) * this.difficulty.bulletSpeed),
          7,
          1
        );
      }
    }

    for (let i = 0; i < 6; i += 1) {
      const angle = this.age * 1.2 + (Math.PI * 2 * i) / 6;
      bullets.spawn("enemy", "star", this.pos, polar(angle, 118 * this.difficulty.bulletSpeed), 7, 1);
    }
  }

  private fireStarBloom(bullets: BulletSystem) {
    const offset = this.age * 1.1;
    for (let ring = 0; ring < 2; ring += 1) {
      for (let i = 0; i < 14; i += 1) {
        const angle = offset * (ring === 0 ? 1 : -1) + (Math.PI * 2 * i) / 14 + ring * 0.13;
        bullets.spawn(
          "enemy",
          ring === 0 ? "star" : "petal",
          this.pos,
          polar(angle, (128 + ring * 36) * this.difficulty.bulletSpeed),
          7,
          1
        );
      }
    }
  }

  private fireFinale(bullets: BulletSystem) {
    this.fireSpiral(bullets);

    const sweep = Math.sin(this.age * 2.2) * 0.24;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 5; i += 1) {
        const angle = Math.PI / 2 + side * (0.12 + i * 0.11 + sweep);
        bullets.spawn(
          "enemy",
          "petal",
          { x: this.pos.x + side * 30, y: this.pos.y + 8 },
          polar(angle, (156 + i * 10) * this.difficulty.bulletSpeed),
          7,
          1
        );
      }
    }
  }

  private resolvePhase() {
    if (this.kind === "cosmicSorcerer") {
      if (this.hp < this.maxHp * 0.133) {
        return 4;
      }
      if (this.hp < this.maxHp * 0.266) {
        return 3;
      }
      if (this.hp < this.maxHp * 0.4) {
        return 2;
      }
      if (this.hp < this.maxHp * 0.7) {
        return 1;
      }
      return 0;
    }

    if (this.hp < this.maxHp * 0.2) {
      return 4;
    }
    if (this.hp < this.maxHp * 0.4) {
      return 3;
    }
    if (this.hp < this.maxHp * 0.6) {
      return 2;
    }
    if (this.hp < this.maxHp * 0.8) {
      return 1;
    }
    return 0;
  }
}
