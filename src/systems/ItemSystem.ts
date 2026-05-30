import { Container } from "pixi.js";
import { circlesOverlap } from "./Collision";
import type { CollectibleItem, ItemKind, Vector } from "./types";
import { createItemVisual } from "./VisualFactory";

export class ItemSystem {
  readonly container = new Container();
  readonly items: CollectibleItem[] = [];
  private nextId = 1;

  spawn(kind: ItemKind, pos: Vector, burst = 0) {
    const sprite = createItemVisual(kind);
    sprite.position.set(pos.x, pos.y);
    this.container.addChild(sprite);

    this.items.push({
      id: this.nextId++,
      kind,
      sprite,
      pos: { ...pos },
      vel: { x: (Math.random() - 0.5) * 80 + burst, y: -70 - Math.random() * 60 },
      radius: kind === "bomb" ? 13 : 11,
      alive: true
    });
  }

  update(
    dt: number,
    player: Vector,
    collectRadius: number,
    autoCollect: boolean,
    onCollect: (item: CollectibleItem) => void
  ) {
    for (const item of this.items) {
      if (!item.alive) {
        continue;
      }

      const dx = player.x - item.pos.x;
      const dy = player.y - item.pos.y;
      const distance = Math.hypot(dx, dy);
      const magnetRadius = autoCollect ? 9999 : 118;
      if (distance < magnetRadius) {
        const pull = autoCollect ? 1180 : Math.max(0, 1 - distance / 118) * 760;
        item.vel.x += (dx / Math.max(distance, 1)) * pull * dt;
        item.vel.y += (dy / Math.max(distance, 1)) * pull * dt;
      }

      item.vel.y += 190 * dt;
      item.pos.x += item.vel.x * dt;
      item.pos.y += item.vel.y * dt;
      item.sprite.position.set(item.pos.x, item.pos.y);
      item.sprite.rotation += dt * (item.kind === "bomb" ? 2.2 : 1.4);

      if (circlesOverlap(item.pos, item.radius, player, collectRadius)) {
        item.alive = false;
        item.sprite.destroy();
        onCollect(item);
      } else if (item.pos.y > 1010 || item.pos.x < -60 || item.pos.x > 780) {
        item.alive = false;
        item.sprite.destroy();
      }
    }

    this.compact();
  }

  clear() {
    for (const item of this.items) {
      item.alive = false;
      item.sprite.destroy();
    }
    this.items.length = 0;
  }

  private compact() {
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      if (!this.items[i].alive) {
        this.items.splice(i, 1);
      }
    }
  }
}
