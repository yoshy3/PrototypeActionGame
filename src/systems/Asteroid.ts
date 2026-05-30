import { Container } from "pixi.js";
import type { AsteroidSpawn, Vector } from "./types";
import { createAsteroidVisual } from "./VisualFactory";

export class Asteroid {
  readonly container = new Container();
  readonly pos: Vector;
  readonly radius: number;
  alive = true;
  private readonly velocity: Vector;
  private readonly spin: number;
  private disposed = false;

  constructor(private readonly spawn: AsteroidSpawn) {
    this.pos = { x: spawn.x, y: spawn.y };
    this.velocity = { x: spawn.vx, y: spawn.vy };
    this.radius = spawn.radius;
    this.spin = spawn.spin;

    const sprite = createAsteroidVisual(spawn.variant);
    sprite.width = spawn.radius * 2;
    sprite.height = spawn.radius * 2;
    sprite.rotation = spawn.variant * 0.7;
    this.container.addChild(sprite);
    this.container.position.set(this.pos.x, this.pos.y);
  }

  update(dt: number) {
    if (!this.alive) {
      return;
    }

    this.pos.x += this.velocity.x * dt;
    this.pos.y += this.velocity.y * dt;
    this.container.position.set(this.pos.x, this.pos.y);
    this.container.rotation += this.spin * dt;

    if (this.pos.y > 1040 || this.pos.x < -120 || this.pos.x > 840) {
      this.alive = false;
      this.destroyContainer();
    }
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
}
