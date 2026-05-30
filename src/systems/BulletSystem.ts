import { Container } from "pixi.js";
import type { Bullet, BulletKind, BulletOwner, Laser, Vector } from "./types";
import { createBulletVisual, createLaserVisual, drawLaserVisual } from "./VisualFactory";

export class BulletSystem {
  readonly container = new Container();
  readonly bullets: Bullet[] = [];
  readonly lasers: Laser[] = [];
  private nextId = 1;

  spawn(owner: BulletOwner, kind: BulletKind, pos: Vector, vel: Vector, radius: number, damage: number) {
    const sprite = createBulletVisual(owner, kind, radius);
    sprite.position.set(pos.x, pos.y);
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
      spin: owner === "player" ? 0 : (Math.random() - 0.5) * 4,
      grazed: false,
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
    growTime = 0.18
  ) {
    const sprite = createLaserVisual(owner, length, width);
    sprite.position.set(origin.x, origin.y);
    sprite.rotation = angle;
    this.container.addChild(sprite);

    this.lasers.push({
      id: this.nextId++,
      owner,
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

  update(dt: number, width: number, height: number) {
    for (const bullet of this.bullets) {
      if (!bullet.alive) {
        continue;
      }

      bullet.age += dt;
      bullet.pos.x += bullet.vel.x * dt;
      bullet.pos.y += bullet.vel.y * dt;
      bullet.sprite.position.set(bullet.pos.x, bullet.pos.y);
      bullet.sprite.rotation += bullet.spin * dt;

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

  killLaser(laser: Laser) {
    if (!laser.alive) {
      return;
    }
    laser.alive = false;
    laser.sprite.destroy();
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

}
