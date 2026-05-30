import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Text, Texture } from "pixi.js";
import type { BossKind, BulletKind, BulletOwner, ItemKind, StageEnemyKind } from "./types";

export type CharacterAnimationState = "idle" | "left" | "right" | "hit";

type CharacterFrames = Record<CharacterAnimationState, Texture[]>;
type CharacterSheetConfig = {
  cellSize: number;
  displaySize: number;
  url: string;
};

const stateRows: CharacterAnimationState[] = ["idle", "left", "right", "hit"];
const characterSheets = {
  boss: { cellSize: 256, displaySize: 128, url: new URL("../assets/characters/boss-lunar-witch-sheet.png", import.meta.url).href },
  bossStarlightOracle: {
    cellSize: 256,
    displaySize: 128,
    url: new URL("../assets/characters/boss-starlight-oracle-sheet.png", import.meta.url).href
  },
  bossCosmicSorcerer: {
    cellSize: 256,
    displaySize: 128,
    url: new URL("../assets/characters/boss-cosmic-sorcerer-sheet.png", import.meta.url).href
  },
  enemy: { cellSize: 96, displaySize: 48, url: new URL("../assets/characters/enemy-moth-sheet.png", import.meta.url).href },
  enemyCrystal: {
    cellSize: 96,
    displaySize: 48,
    url: new URL("../assets/characters/enemy-crystal-sheet.png", import.meta.url).href
  },
  enemyAstralFamiliar: {
    cellSize: 96,
    displaySize: 48,
    url: new URL("../assets/characters/enemy-astral-familiar-sheet.png", import.meta.url).href
  },
  asteroid: {
    cellSize: 128,
    displaySize: 76,
    url: new URL("../assets/characters/asteroid-sheet.png", import.meta.url).href
  },
  player: { cellSize: 128, displaySize: 64, url: new URL("../assets/characters/player-sheet.png", import.meta.url).href }
} satisfies Record<string, CharacterSheetConfig>;

const loadedFrames = new Map<string, CharacterFrames>();

export const loadCharacterAssets = async () => {
  await Promise.all(
    Object.entries(characterSheets).map(async ([key, config]) => {
      const texture = (await Assets.load(config.url)) as Texture;
      loadedFrames.set(key, sliceCharacterSheet(texture, config.cellSize));
    })
  );
};

export class CharacterVisual extends Container {
  private readonly sprite: AnimatedSprite;
  private state: CharacterAnimationState = "idle";
  private hitTimer = 0;

  constructor(
    private readonly frames: CharacterFrames,
    displaySize: number
  ) {
    super();
    this.sprite = new AnimatedSprite(frames.idle);
    this.sprite.anchor.set(0.5);
    this.sprite.animationSpeed = 0.12;
    this.sprite.width = displaySize;
    this.sprite.height = displaySize;
    this.sprite.play();
    this.addChild(this.sprite);
  }

  setState(state: CharacterAnimationState) {
    if (this.hitTimer > 0 && state !== "hit") {
      return;
    }
    if (state === this.state) {
      return;
    }

    this.state = state;
    this.sprite.textures = this.frames[state];
    this.sprite.gotoAndPlay(0);
  }

  playHit(seconds = 0.24) {
    this.hitTimer = Math.max(this.hitTimer, seconds);
    this.setState("hit");
  }

  update(dt: number, fallback: CharacterAnimationState = "idle") {
    if (this.hitTimer <= 0) {
      this.setState(fallback);
      return;
    }

    this.hitTimer = Math.max(0, this.hitTimer - dt);
    if (this.hitTimer === 0) {
      this.setState(fallback);
    }
  }

  reset(state: CharacterAnimationState = "idle") {
    this.hitTimer = 0;
    this.state = state;
    this.sprite.textures = this.frames[state];
    this.sprite.gotoAndPlay(0);
  }
}

export const createPlayerVisual = () => createCharacterVisual("player");

export const createEnemyVisual = (kind: StageEnemyKind = "moth") =>
  createCharacterVisual(kind === "crystal" ? "enemyCrystal" : kind === "astralFamiliar" ? "enemyAstralFamiliar" : "enemy");

export const createBossVisual = (kind: BossKind = "lunarWitch") => {
  const container = new Container();
  const character = createCharacterVisual(
    kind === "cosmicSorcerer" ? "bossCosmicSorcerer" : kind === "starlightOracle" ? "bossStarlightOracle" : "boss"
  );
  character.name = "character";

  const aura = new Graphics();
  aura.circle(0, 0, 64).stroke({ color: kind === "lunarWitch" ? 0xffd7fb : 0xfff4a8, width: 2, alpha: 0.38 });
  aura.circle(0, 0, 48).stroke({ color: kind === "cosmicSorcerer" ? 0x74c9ff : 0x92fff1, width: 2, alpha: 0.32 });

  const label = new Text({
    text: kind === "cosmicSorcerer" ? "COSMIC SORCERER" : kind === "starlightOracle" ? "STARLIGHT ORACLE" : "LUNAR WITCH",
    style: { fill: 0xffe5f6, fontSize: 13, letterSpacing: 0 }
  });
  label.anchor.set(0.5);
  label.y = 68;

  container.addChild(aura, character, label);
  return { container, character };
};

export const createAsteroidVisual = (variant: number) => {
  const frames = loadedFrames.get("asteroid");
  if (!frames) {
    throw new Error("Character assets must be loaded before creating asteroid visual.");
  }

  const row = stateRows[Math.max(0, Math.min(stateRows.length - 1, variant % stateRows.length))];
  const sprite = new AnimatedSprite(frames[row]);
  sprite.anchor.set(0.5);
  sprite.animationSpeed = 0.08;
  sprite.width = characterSheets.asteroid.displaySize;
  sprite.height = characterSheets.asteroid.displaySize;
  sprite.play();
  return sprite;
};

const createCharacterVisual = (key: keyof typeof characterSheets) => {
  const frames = loadedFrames.get(key);
  if (!frames) {
    throw new Error(`Character assets must be loaded before creating ${key} visual.`);
  }

  return new CharacterVisual(frames, characterSheets[key].displaySize);
};

const sliceCharacterSheet = (texture: Texture, cellSize: number): CharacterFrames => {
  const frames = {} as CharacterFrames;

  for (let row = 0; row < stateRows.length; row += 1) {
    frames[stateRows[row]] = [];
    for (let col = 0; col < 4; col += 1) {
      frames[stateRows[row]].push(
        new Texture({
          source: texture.source,
          frame: new Rectangle(col * cellSize, row * cellSize, cellSize, cellSize)
        })
      );
    }
  }

  return frames;
};

export const createHitMark = (radius: number) => {
  const hitMark = new Graphics();
  hitMark.circle(0, 0, radius).fill(0xff5eaa);
  hitMark.circle(0, 0, radius + 5).stroke({ color: 0xffffff, width: 1, alpha: 0.8 });
  return hitMark;
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
    g.poly(points).fill(0xff8acb).stroke({ color: 0xfff0fb, width: 2, alpha: 0.9 });
  } else if (kind === "splitter") {
    g.circle(0, 0, radius * 0.95).fill(0x74c9ff);
    g.circle(0, 0, radius * 0.48).fill(0xffffff);
    g.poly([
      0,
      -radius * 1.45,
      radius * 0.44,
      -radius * 0.44,
      radius * 1.45,
      0,
      radius * 0.44,
      radius * 0.44,
      0,
      radius * 1.45,
      -radius * 0.44,
      radius * 0.44,
      -radius * 1.45,
      0,
      -radius * 0.44,
      -radius * 0.44
    ]);
    g.stroke({ color: 0xfff4a8, width: 2, alpha: 0.82 });
    g.circle(0, 0, radius * 1.85).stroke({ color: 0x9ffff4, width: 1, alpha: 0.42 });
  } else if (kind === "shell") {
    g.circle(0, 0, radius * 1.05).fill(0x38445f);
    g.circle(-radius * 0.24, -radius * 0.3, radius * 0.36).fill({ color: 0x92fff1, alpha: 0.78 });
    g.moveTo(-radius * 0.8, radius * 0.1).lineTo(radius * 0.8, -radius * 0.25).stroke({ color: 0x67dfff, width: 3, alpha: 0.9 });
    g.circle(0, 0, radius * 1.18).stroke({ color: 0xfff4a8, width: 2, alpha: 0.8 });
    g.circle(0, 0, radius * 1.58).stroke({ color: 0x74c9ff, width: 1, alpha: 0.34 });
  } else if (kind === "petal") {
    g.ellipse(0, 0, radius * 0.68, radius * 1.35).fill(0xff88c8);
    g.ellipse(0, 0, radius * 0.38, radius * 1.04).fill({ color: 0xffffff, alpha: 0.45 });
    g.ellipse(0, 0, radius * 0.78, radius * 1.45).stroke({ color: 0xfff0fb, width: 1, alpha: 0.7 });
  } else {
    g.circle(0, 0, radius).fill(0xff62b8);
    g.circle(-radius * 0.22, -radius * 0.26, radius * 0.35).fill({ color: 0xffffff, alpha: 0.72 });
    g.circle(0, 0, radius * 1.18).stroke({ color: 0xffd8ef, width: 2, alpha: 0.62 });
  }

  return g;
};

export const createLaserVisual = (owner: BulletOwner, length: number, width: number) => {
  const g = new Graphics();
  drawLaserVisual(g, owner, length, width, 0);
  return g;
};

export const drawLaserVisual = (g: Graphics, owner: BulletOwner, length: number, width: number, activeRatio: number) => {
  g.clear();
  const active = activeRatio >= 1;
  const core = owner === "enemy" ? 0xffffff : 0xeaffff;
  const outer = owner === "enemy" ? 0xff72bd : 0x92fff1;
  const inner = owner === "enemy" ? 0xfff4a8 : 0xa8fff8;

  if (!active) {
    const pulse = 0.5 + Math.sin(activeRatio * Math.PI * 8) * 0.5;
    const blinkOn = Math.floor(activeRatio * 10) % 2 === 0;
    const blink = blinkOn ? 1 : 0.18;
    const warningRamp = 0.82 + activeRatio * 0.18;
    const glowAlpha = (0.2 + activeRatio * 0.26 + pulse * 0.06) * blink * warningRamp;
    const coreAlpha = (0.5 + activeRatio * 0.3) * blink * warningRamp;
    g.moveTo(0, 0).lineTo(length, 0).stroke({ color: outer, width: Math.max(3, width * 0.78), alpha: glowAlpha });
    g.moveTo(0, 0).lineTo(length, 0).stroke({ color: inner, width: Math.max(2, width * 0.5), alpha: (0.34 + activeRatio * 0.22) * blink });
    g.moveTo(0, 0).lineTo(length, 0).stroke({ color: core, width: Math.max(1.5, width * 0.25), alpha: coreAlpha });

    const markerStep = 32;
    const markerHalfHeight = Math.max(3, width * 0.45);
    for (let x = 16; x < length; x += markerStep) {
      const markerBlink = (Math.floor(x / markerStep) + Math.floor(activeRatio * 10)) % 2 === 0 ? 1 : 0.12;
      const markerAlpha = Math.min(0.85, (0.24 + activeRatio * 0.42 + pulse * 0.1) * markerBlink);
      g.moveTo(x, -markerHalfHeight).lineTo(x, markerHalfHeight).stroke({ color: core, width: 1, alpha: markerAlpha });
    }
    return;
  }

  g.moveTo(0, 0).lineTo(length, 0).stroke({ color: outer, width: width + 4, alpha: 0.18 });
  g.moveTo(0, 0).lineTo(length, 0).stroke({ color: inner, width: width, alpha: 0.78 });
  g.moveTo(0, 0).lineTo(length, 0).stroke({ color: core, width: Math.max(1.5, width * 0.28), alpha: 0.94 });
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
