import { Container } from "pixi.js";
import type { Bullet, BulletKind, BulletOwner, Laser, Vector } from "./types";
import { createBulletVisual, createLaserVisual, drawLaserVisual } from "./VisualFactory";

type BulletSpawnOptions = {
  hp?: number;
  splitAt?: number;
  splitCount?: number;
  splitSpeed?: number;
  splitKind?: BulletKind;
  homingDelay?: number;
  homingTime?: number;
  homingTurnRate?: number;
};

export class BulletSystem {
  readonly container = new Container();
  readonly bullets: Bullet[] = [];
  readonly lasers: Laser[] = [];
  private nextId = 1;

  spawn(owner: BulletOwner, kind: BulletKind, pos: Vector, vel: Vector, radius: number, damage: number, options: BulletSpawnOptions = {}) {
    const sprite = createBulletVisual(owner, kind, radius);
    sprite.position.set(pos.x, pos.y);
    if (this.isFireKind(kind)) {
      sprite.rotation = this.getTravelRotation(vel);
    }
    this.container.addChild(sprite);

    this.bullets.push({
      id: this.nextId++,
      owner,
      kind,
      sprite,
      pos: { ...pos },
      vel: { ...vel },
      radius,
      damage,
      age: 0,
      spin: owner === "player" || this.isFireKind(kind) ? 0 : (Math.random() - 0.5) * 4,
      grazed: false,
      hp: options.hp,
      splitAt: options.splitAt,
      splitCount: options.splitCount,
      splitSpeed: options.splitSpeed,
      splitKind: options.splitKind,
      homingDelay: options.homingDelay,
      homingTime: options.homingTime,
      homingTurnRate: options.homingTurnRate,
      alive: true
    });
  }

  spawnLaser(
    owner: BulletOwner,
    origin: Vector,
    angle: number,
    length: number,
    width: number,
    duration: number,
    warningTime: number,
    damage: number,
    speed = 360,
    growTime = 0.18,
    sourceId?: number
  ) {
    const sprite = createLaserVisual(owner, length, width);
    sprite.position.set(origin.x, origin.y);
    sprite.rotation = angle;
    this.container.addChild(sprite);

    this.lasers.push({
      id: this.nextId++,
      owner,
      sourceId,
      sprite,
      origin: { ...origin },
      angle,
      length,
      visibleLength: 0,
      offset: 0,
      width,
      warningTime,
      growTime,
      duration,
      speed,
      damage,
      age: 0,
      grazed: false,
      alive: true
    });
  }

  update(dt: number, width: number, height: number, target?: Vector) {
    for (const bullet of this.bullets) {
      if (!bullet.alive) {
        continue;
      }

      bullet.age += dt;
      if (bullet.splitAt !== undefined && bullet.age >= bullet.splitAt) {
        this.split(bullet);
        continue;
      }
      const homingDelay = bullet.homingDelay ?? 0;
      if (
        target &&
        bullet.owner === "enemy" &&
        bullet.homingTime !== undefined &&
        bullet.age >= homingDelay &&
        bullet.age <= homingDelay + bullet.homingTime
      ) {
        this.homeToward(bullet, target, dt);
      }
      bullet.pos.x += bullet.vel.x * dt;
      bullet.pos.y += bullet.vel.y * dt;
      bullet.sprite.position.set(bullet.pos.x, bullet.pos.y);
      bullet.sprite.rotation = this.isFireKind(bullet.kind) ? this.getTravelRotation(bullet.vel) : bullet.sprite.rotation + bullet.spin * dt;
      if (!this.isFireKind(bullet.kind)) {
        bullet.sprite.scale.set(1 + Math.max(0, bullet.sprite.scale.x - 1 - dt * 5));
      }

      if (
        bullet.pos.x < -80 ||
        bullet.pos.x > width + 80 ||
        bullet.pos.y < -100 ||
        bullet.pos.y > height + 120
      ) {
        this.kill(bullet);
      }
    }

    for (const laser of this.lasers) {
      if (!laser.alive) {
        continue;
      }

      laser.age += dt;
      const warningRatio = laser.warningTime <= 0 ? 1 : Math.min(1, laser.age / laser.warningTime);
      const activeAge = Math.max(0, laser.age - laser.warningTime);
      const growRatio = laser.growTime <= 0 ? 1 : Math.min(1, activeAge / laser.growTime);
      laser.visibleLength = laser.length * growRatio;
      laser.offset = Math.max(0, activeAge - laser.growTime) * laser.speed;

      const renderedLength = activeAge <= 0 ? laser.length : Math.max(1, laser.visibleLength);
      const renderRatio = activeAge <= 0 ? warningRatio : 1;
      const startX = laser.origin.x + Math.cos(laser.angle) * laser.offset;
      const startY = laser.origin.y + Math.sin(laser.angle) * laser.offset;
      drawLaserVisual(laser.sprite, laser.owner, renderedLength, laser.width, renderRatio);
      laser.sprite.position.set(startX, startY);
      laser.sprite.alpha = 1;

      const endX = startX + Math.cos(laser.angle) * renderedLength;
      const endY = startY + Math.sin(laser.angle) * renderedLength;
      const outOfBounds =
        Math.max(startX, endX) < -120 ||
        Math.min(startX, endX) > width + 120 ||
        Math.max(startY, endY) < -140 ||
        Math.min(startY, endY) > height + 140;
      if (activeAge > 0 && outOfBounds) {
        this.killLaser(laser);
      }
    }

    this.compact();
  }

  kill(bullet: Bullet) {
    if (!bullet.alive) {
      return;
    }
    bullet.alive = false;
    bullet.sprite.destroy();
  }

  damage(bullet: Bullet, amount: number) {
    if (!bullet.alive || bullet.hp === undefined) {
      return false;
    }

    bullet.hp -= amount;
    bullet.sprite.scale.set(1.16);
    if (bullet.hp <= 0) {
      this.kill(bullet);
      return true;
    }
    return false;
  }

  killLaser(laser: Laser) {
    if (!laser.alive) {
      return;
    }
    laser.alive = false;
    laser.sprite.destroy();
  }

  killWarningLasersBySource(sourceId: number) {
    for (const laser of this.lasers) {
      if (laser.sourceId === sourceId && laser.age < laser.warningTime) {
        this.killLaser(laser);
      }
    }
    this.compact();
  }

  clear(owner?: BulletOwner) {
    for (const bullet of this.bullets) {
      if (!owner || bullet.owner === owner) {
        this.kill(bullet);
      }
    }
    for (const laser of this.lasers) {
      if (!owner || laser.owner === owner) {
        this.killLaser(laser);
      }
    }
    this.compact();
  }

  private compact() {
    for (let index = this.bullets.length - 1; index >= 0; index -= 1) {
      if (!this.bullets[index].alive) {
        this.bullets.splice(index, 1);
      }
    }
    for (let index = this.lasers.length - 1; index >= 0; index -= 1) {
      if (!this.lasers[index].alive) {
        this.lasers.splice(index, 1);
      }
    }
  }

  private split(bullet: Bullet) {
    const count = bullet.splitCount ?? 6;
    const speed = bullet.splitSpeed ?? 145;
    const kind = bullet.splitKind ?? "petal";
    const base = Math.atan2(bullet.vel.y, bullet.vel.x);
    const spread = Math.PI * 2;
    const start = base - spread * 0.5;

    this.kill(bullet);
    for (let i = 0; i < count; i += 1) {
      const angle = start + (spread * i) / count + bullet.age * 0.25;
      this.spawn(
        bullet.owner,
        kind,
        bullet.pos,
        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        Math.max(5, bullet.radius * 0.62),
        bullet.damage
      );
    }
  }

  private getTravelRotation(vel: Vector) {
    return Math.atan2(vel.y, vel.x) - Math.PI / 2;
  }

  private isFireKind(kind: BulletKind) {
    return kind === "fire" || kind === "homingFire";
  }

  private homeToward(bullet: Bullet, target: Vector, dt: number) {
    const speed = Math.hypot(bullet.vel.x, bullet.vel.y);
    if (speed <= 0) {
      return;
    }

    const current = Math.atan2(bullet.vel.y, bullet.vel.x);
    const desired = Math.atan2(target.y - bullet.pos.y, target.x - bullet.pos.x);
    const maxTurn = (bullet.homingTurnRate ?? 2.6) * dt;
    const delta = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
    const next = current + Math.max(-maxTurn, Math.min(maxTurn, delta));
    bullet.vel.x = Math.cos(next) * speed;
    bullet.vel.y = Math.sin(next) * speed;
  }

}
