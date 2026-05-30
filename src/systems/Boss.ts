import { Container } from "pixi.js";
import type { DifficultyConfig } from "./Difficulty";
import { polar } from "./math";
import type { BulletSystem } from "./BulletSystem";
import type { Actor } from "./types";
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
  private phase = 0;
  private readonly body: CharacterVisual;

  constructor(private readonly difficulty: DifficultyConfig) {
    this.maxHp = Math.ceil(3120 * difficulty.bossHp);
    this.hp = this.maxHp;
    const visual = createBossVisual();
    this.body = visual.character;
    this.container.addChild(visual.container);
    this.container.position.set(this.pos.x, this.pos.y);
  }

  update(dt: number, bullets: BulletSystem) {
    if (!this.alive) {
      return;
    }

    this.age += dt;
    const previousX = this.pos.x;
    if (!this.entered) {
      this.pos.y += 95 * dt;
      if (this.pos.y >= 145) {
        this.pos.y = 145;
        this.entered = true;
        this.moveAge = 0;
      }
    } else {
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
