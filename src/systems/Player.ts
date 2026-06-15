import { Container, Graphics } from "pixi.js";
import { clamp, normalize } from "./math";
import type { Input } from "./Input";
import type { BulletSystem } from "./BulletSystem";
import type { Actor } from "./types";
import { CharacterVisual, createHitMark, createPlayerVisual } from "./VisualFactory";

export const POWER_STEP = 40;
export const MAX_POWER = 120;

export class Player implements Actor {
  readonly container = new Container();
  readonly radius = 5;
  readonly pos = { x: 360, y: 820 };
  hp = 3;
  alive = true;
  invincible = 0;
  private shotTimer = 0;
  private readonly body: CharacterVisual;
  private readonly hitMark: Graphics;

  constructor() {
    this.body = createPlayerVisual();
    this.hitMark = createHitMark(this.radius);
    this.container.addChild(this.body, this.hitMark);
    this.container.position.set(this.pos.x, this.pos.y);
  }

  update(dt: number, input: Input, bullets: BulletSystem, bounds: { width: number; height: number }, power: number) {
    if (!this.alive) {
      return false;
    }

    const direction = normalize(
      (input.isDown("arrowright", "d") ? 1 : 0) - (input.isDown("arrowleft", "a") ? 1 : 0),
      (input.isDown("arrowdown", "s") ? 1 : 0) - (input.isDown("arrowup", "w") ? 1 : 0)
    );
    const animationState = direction.x < -0.1 ? "left" : direction.x > 0.1 ? "right" : "idle";
    const focus = input.isDown("shift");
    const speed = focus ? 190 : 330;

    this.pos.x = clamp(this.pos.x + direction.x * speed * dt, 34, bounds.width - 34);
    this.pos.y = clamp(this.pos.y + direction.y * speed * dt, 70, bounds.height - 34);
    this.container.position.set(this.pos.x, this.pos.y);

    this.invincible = Math.max(0, this.invincible - dt);
    this.container.alpha = this.invincible > 0 && Math.floor(this.invincible * 16) % 2 === 0 ? 0.42 : 1;
    this.hitMark.visible = focus;
    this.body.update(dt, animationState);

    this.shotTimer -= dt;
    if (this.shotTimer <= 0 && input.isDown("z", " ")) {
      this.shotTimer = 0.075;
      const level = Math.min(3, Math.floor(power / POWER_STEP));
      bullets.spawn("player", "orb", { x: this.pos.x - 14, y: this.pos.y - 23 }, { x: -24, y: -760 }, 7, 3 + level);
      bullets.spawn("player", "orb", { x: this.pos.x + 14, y: this.pos.y - 23 }, { x: 24, y: -760 }, 7, 3 + level);
      if (level >= 1) {
        bullets.spawn("player", "orb", { x: this.pos.x, y: this.pos.y - 30 }, { x: 0, y: -820 }, 8, 2 + level);
      }
      if (level >= 2) {
        bullets.spawn("player", "orb", { x: this.pos.x - 28, y: this.pos.y - 10 }, { x: -92, y: -690 }, 6, 2);
        bullets.spawn("player", "orb", { x: this.pos.x + 28, y: this.pos.y - 10 }, { x: 92, y: -690 }, 6, 2);
      }
      if (level >= 3) {
        bullets.spawn("player", "orb", { x: this.pos.x - 40, y: this.pos.y }, { x: -150, y: -620 }, 6, 2);
        bullets.spawn("player", "orb", { x: this.pos.x + 40, y: this.pos.y }, { x: 150, y: -620 }, 6, 2);
      }
      return true;
    }

    return false;
  }

  damage() {
    if (this.invincible > 0 || !this.alive) {
      return false;
    }
    this.hp -= 1;
    this.invincible = 2.2;
    this.body.playHit(0.42);
    if (this.hp <= 0) {
      this.alive = false;
      this.container.visible = false;
    }
    return true;
  }

  addLife(amount = 1) {
    this.hp += amount;
    if (this.hp > 0) {
      this.alive = true;
      this.container.visible = true;
    }
  }

  prepareForNextStage() {
    this.invincible = 2.4;
    this.pos.x = 360;
    this.pos.y = 820;
    this.container.visible = true;
    this.container.position.set(this.pos.x, this.pos.y);
    this.body.reset("idle");
  }

  reset(difficultyId?: string) {
    this.hp = difficultyId === "beginner" ? 5 : 3;
    this.alive = true;
    this.invincible = 2;
    this.pos.x = 360;
    this.pos.y = 820;
    this.container.visible = true;
    this.container.position.set(this.pos.x, this.pos.y);
    this.body.reset("idle");
  }
}
