import { Container, Graphics, Text } from "pixi.js";
import type { BulletKind, BulletOwner, ItemKind } from "./types";

export const createPlayerVisual = () => {
  const body = new Graphics();
  body
    .moveTo(0, -20)
    .lineTo(13, 15)
    .quadraticCurveTo(0, 8, -13, 15)
    .closePath()
    .fill(0xf8f1ff)
    .stroke({ color: 0x83fff2, width: 2 });
  body.circle(0, 0, 27).stroke({ color: 0x6dfce9, width: 2, alpha: 0.24 });
  return body;
};

export const createHitMark = (radius: number) => {
  const hitMark = new Graphics();
  hitMark.circle(0, 0, radius).fill(0xff5eaa);
  hitMark.circle(0, 0, radius + 5).stroke({ color: 0xffffff, width: 1, alpha: 0.8 });
  return hitMark;
};

export const createEnemyVisual = () => {
  const body = new Graphics();
  body.circle(0, 0, 19).fill(0xffd7f0).stroke({ color: 0x7b4dd8, width: 3 });
  body.moveTo(-25, 2).quadraticCurveTo(-42, 16, -20, 25).stroke({ color: 0xff8bc7, width: 3 });
  body.moveTo(25, 2).quadraticCurveTo(42, 16, 20, 25).stroke({ color: 0xff8bc7, width: 3 });
  return body;
};

export const createBossVisual = () => {
  const container = new Container();

  const aura = new Graphics();
  aura.circle(0, 0, 64).stroke({ color: 0xffd7fb, width: 2, alpha: 0.38 });
  aura.circle(0, 0, 48).stroke({ color: 0x92fff1, width: 2, alpha: 0.32 });

  const body = new Graphics();
  body.circle(0, -5, 28).fill(0xfff3fb).stroke({ color: 0xe358ad, width: 3 });
  body.moveTo(-12, 18).lineTo(0, 48).lineTo(12, 18).fill(0x8e58d9);
  body.moveTo(-32, 2).quadraticCurveTo(-78, 12, -36, 44).stroke({ color: 0xff8bc7, width: 5, alpha: 0.9 });
  body.moveTo(32, 2).quadraticCurveTo(78, 12, 36, 44).stroke({ color: 0xff8bc7, width: 5, alpha: 0.9 });

  const label = new Text({ text: "LUNAR WITCH", style: { fill: 0xffe5f6, fontSize: 13, letterSpacing: 0 } });
  label.anchor.set(0.5);
  label.y = 68;

  container.addChild(aura, body, label);
  return container;
};

export const createBulletVisual = (owner: BulletOwner, kind: BulletKind, radius: number) => {
  const g = new Graphics();

  if (owner === "player") {
    g.circle(0, -radius * 0.4, radius * 0.75).fill(0xa8fff8);
    g.circle(0, radius * 0.5, radius * 0.45).fill(0xffffff);
    g.circle(0, 0, radius * 1.4).stroke({ color: 0x96fff5, width: 2, alpha: 0.42 });
    return g;
  }

  if (kind === "star") {
    const points: number[] = [];
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? radius * 1.25 : radius * 0.45;
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / 10;
      points.push(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.poly(points).fill(0xfff2a8).stroke({ color: 0xff77ba, width: 2, alpha: 0.9 });
  } else if (kind === "petal") {
    g.ellipse(0, 0, radius * 0.68, radius * 1.35).fill(0xff88c8);
    g.ellipse(0, 0, radius * 0.38, radius * 1.04).fill({ color: 0xffffff, alpha: 0.45 });
    g.ellipse(0, 0, radius * 0.78, radius * 1.45).stroke({ color: 0xfff0fb, width: 1, alpha: 0.7 });
  } else {
    g.circle(0, 0, radius).fill(0x8db8ff);
    g.circle(-radius * 0.22, -radius * 0.26, radius * 0.35).fill({ color: 0xffffff, alpha: 0.72 });
    g.circle(0, 0, radius * 1.18).stroke({ color: 0xd7e4ff, width: 2, alpha: 0.55 });
  }

  return g;
};

export const createItemVisual = (kind: ItemKind) => {
  const g = new Graphics();
  if (kind === "bomb") {
    g.circle(0, 0, 10).fill(0xfff4a8).stroke({ color: 0xff76bf, width: 2 });
    g.moveTo(0, -15).lineTo(0, 15).stroke({ color: 0xffffff, width: 2, alpha: 0.82 });
    g.moveTo(-15, 0).lineTo(15, 0).stroke({ color: 0xffffff, width: 2, alpha: 0.82 });
  } else {
    g.circle(0, 0, 8).fill(0x9ffff4).stroke({ color: 0xffffff, width: 2, alpha: 0.78 });
    g.circle(0, 0, 15).stroke({ color: 0x9ffff4, width: 1, alpha: 0.36 });
  }
  return g;
};
