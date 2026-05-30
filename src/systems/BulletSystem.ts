import { Container } from "pixi.js";
import type { Bullet, BulletKind, BulletOwner, Vector } from "./types";
import { createBulletVisual } from "./VisualFactory";

export class BulletSystem {
  readonly container = new Container();
  readonly bullets: Bullet[] = [];
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

    this.compact();
  }

  kill(bullet: Bullet) {
    if (!bullet.alive) {
      return;
    }
    bullet.alive = false;
    bullet.sprite.destroy();
  }

  clear(owner?: BulletOwner) {
    for (const bullet of this.bullets) {
      if (!owner || bullet.owner === owner) {
        this.kill(bullet);
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
  }

}
