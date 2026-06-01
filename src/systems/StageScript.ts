import type { AsteroidSpawn, EnemySpawn, StageDefinition } from "./types";

const stageOneSpawns: EnemySpawn[] = [
  { time: 1.2, x: 130, y: -40, hp: 18, pattern: "fan" },
  { time: 2.3, x: 590, y: -40, hp: 18, pattern: "fan", mirror: true },
  { time: 3.7, x: 230, y: -40, hp: 22, pattern: "drift", move: "arc" },
  { time: 4.8, x: 490, y: -40, hp: 22, pattern: "drift", move: "arc", mirror: true },
  { time: 6.3, x: 90, y: -40, hp: 16, pattern: "cross" },
  { time: 7.15, x: 220, y: -40, hp: 16, pattern: "cross" },
  { time: 8.0, x: 360, y: -40, hp: 16, pattern: "cross" },
  { time: 8.85, x: 500, y: -40, hp: 16, pattern: "cross" },
  { time: 9.7, x: 630, y: -40, hp: 16, pattern: "cross" },
  { time: 11.5, x: 190, y: -40, hp: 24, pattern: "snipe", move: "dive" },
  { time: 13.2, x: 530, y: -40, hp: 24, pattern: "snipe", move: "dive", mirror: true },

  { time: 22.0, x: 120, y: -40, hp: 20, pattern: "snipe", move: "dive" },
  { time: 23.25, x: 600, y: -40, hp: 20, pattern: "snipe", move: "dive", mirror: true },
  { time: 24.75, x: 160, y: -40, hp: 26, pattern: "fan", move: "arc" },
  { time: 25.95, x: 560, y: -40, hp: 26, pattern: "fan", move: "arc", mirror: true },
  { time: 27.5, x: 300, y: -40, hp: 30, pattern: "wheel" },
  { time: 29.2, x: 100, y: -40, hp: 18, pattern: "cross" },
  { time: 30.0, x: 230, y: -40, hp: 18, pattern: "cross" },
  { time: 30.8, x: 360, y: -40, hp: 18, pattern: "cross" },
  { time: 31.6, x: 490, y: -40, hp: 18, pattern: "cross" },
  { time: 32.4, x: 620, y: -40, hp: 18, pattern: "cross" },
  { time: 35.2, x: 360, y: -40, hp: 34, pattern: "drift", move: "arc" },

  { time: 44.0, x: 210, y: -40, hp: 24, pattern: "drift", move: "arc" },
  { time: 45.15, x: 510, y: -40, hp: 24, pattern: "drift", move: "arc", mirror: true },
  { time: 46.35, x: 80, y: -40, hp: 18, pattern: "fan" },
  { time: 47.5, x: 640, y: -40, hp: 18, pattern: "fan", mirror: true },
  { time: 49.0, x: 150, y: -40, hp: 22, pattern: "snipe", move: "dive" },
  { time: 50.0, x: 570, y: -40, hp: 22, pattern: "snipe", move: "dive", mirror: true },
  { time: 51.45, x: 140, y: -40, hp: 18, pattern: "cross" },
  { time: 52.25, x: 250, y: -40, hp: 18, pattern: "cross" },
  { time: 53.05, x: 360, y: -40, hp: 18, pattern: "cross" },
  { time: 53.85, x: 470, y: -40, hp: 18, pattern: "cross" },
  { time: 54.65, x: 580, y: -40, hp: 18, pattern: "cross" },
  { time: 57.2, x: 360, y: -40, hp: 38, pattern: "wheel" },

  { time: 66.0, x: 130, y: -40, hp: 24, pattern: "fan" },
  { time: 67.15, x: 590, y: -40, hp: 24, pattern: "fan", mirror: true },
  { time: 68.35, x: 240, y: -40, hp: 28, pattern: "drift", move: "arc" },
  { time: 69.5, x: 480, y: -40, hp: 28, pattern: "drift", move: "arc", mirror: true },
  { time: 70.9, x: 90, y: -40, hp: 20, pattern: "cross" },
  { time: 71.7, x: 220, y: -40, hp: 20, pattern: "cross" },
  { time: 72.5, x: 360, y: -40, hp: 20, pattern: "cross" },
  { time: 73.3, x: 500, y: -40, hp: 20, pattern: "cross" },
  { time: 74.1, x: 630, y: -40, hp: 20, pattern: "cross" },
  { time: 76.0, x: 180, y: -40, hp: 28, pattern: "snipe", move: "dive" },
  { time: 77.4, x: 540, y: -40, hp: 28, pattern: "snipe", move: "dive", mirror: true },
  { time: 79.2, x: 360, y: -40, hp: 42, pattern: "wheel" }
];

const stageTwoSpawns: EnemySpawn[] = [
  { time: 1.0, x: 150, y: -40, hp: 30, kind: "crystal", pattern: "laserSlash", move: "sway" },
  { time: 2.4, x: 570, y: -40, hp: 30, kind: "crystal", pattern: "laserSlash", move: "sway", mirror: true },
  { time: 3.8, x: 250, y: -40, hp: 32, kind: "crystal", pattern: "fan", move: "arc" },
  { time: 5.0, x: 470, y: -40, hp: 32, kind: "crystal", pattern: "fan", move: "arc", mirror: true },
  { time: 6.4, x: 360, y: -40, hp: 42, kind: "crystal", pattern: "laserSnipe", move: "dive" },

  { time: 16.8, x: 100, y: -40, hp: 30, kind: "crystal", pattern: "laserGate", move: "sway" },
  { time: 18.0, x: 620, y: -40, hp: 30, kind: "crystal", pattern: "laserGate", move: "sway", mirror: true },
  { time: 19.4, x: 210, y: -40, hp: 30, kind: "crystal", pattern: "cross", move: "arc" },
  { time: 20.5, x: 510, y: -40, hp: 30, kind: "crystal", pattern: "cross", move: "arc", mirror: true },
  { time: 22.0, x: 360, y: -40, hp: 46, kind: "crystal", pattern: "laserSnipe", move: "dive" },
  { time: 24.6, x: 150, y: -40, hp: 30, pattern: "wheel" },
  { time: 25.7, x: 570, y: -40, hp: 30, pattern: "wheel", mirror: true },

  { time: 36.0, x: 90, y: -40, hp: 32, kind: "crystal", pattern: "laserSlash", move: "dive" },
  { time: 37.0, x: 630, y: -40, hp: 32, kind: "crystal", pattern: "laserSlash", move: "dive", mirror: true },
  { time: 38.4, x: 230, y: -40, hp: 34, kind: "crystal", pattern: "snipe", move: "arc" },
  { time: 39.4, x: 490, y: -40, hp: 34, kind: "crystal", pattern: "snipe", move: "arc", mirror: true },
  { time: 41.0, x: 360, y: -40, hp: 52, kind: "crystal", pattern: "laserGate", move: "arc" },
  { time: 43.2, x: 170, y: -40, hp: 30, kind: "crystal", pattern: "laserSnipe", move: "dive" },
  { time: 44.2, x: 550, y: -40, hp: 30, kind: "crystal", pattern: "laserSnipe", move: "dive", mirror: true },

  { time: 53.5, x: 120, y: -40, hp: 32, kind: "crystal", pattern: "fan" },
  { time: 54.4, x: 240, y: -40, hp: 32, kind: "crystal", pattern: "laserSlash" },
  { time: 55.3, x: 480, y: -40, hp: 32, kind: "crystal", pattern: "laserSlash", mirror: true },
  { time: 56.2, x: 600, y: -40, hp: 32, kind: "crystal", pattern: "fan", mirror: true },
  { time: 58.4, x: 360, y: -40, hp: 58, kind: "crystal", pattern: "wheel", move: "arc" },
  { time: 60.8, x: 210, y: -40, hp: 34, kind: "crystal", pattern: "laserGate", move: "arc" },
  { time: 61.8, x: 510, y: -40, hp: 34, kind: "crystal", pattern: "laserGate", move: "arc", mirror: true },

  { time: 68.0, x: 110, y: -40, hp: 36, kind: "crystal", pattern: "laserGate", move: "dive" },
  { time: 69.0, x: 610, y: -40, hp: 36, kind: "crystal", pattern: "laserGate", move: "dive", mirror: true },
  { time: 70.2, x: 250, y: -40, hp: 38, kind: "crystal", pattern: "laserSnipe", move: "arc" },
  { time: 71.2, x: 470, y: -40, hp: 38, kind: "crystal", pattern: "laserSnipe", move: "arc", mirror: true },
  { time: 72.8, x: 160, y: -40, hp: 34, kind: "crystal", pattern: "laserSlash", move: "dive" },
  { time: 73.7, x: 560, y: -40, hp: 34, kind: "crystal", pattern: "laserSlash", move: "dive", mirror: true },
  { time: 75.4, x: 360, y: -40, hp: 64, kind: "crystal", pattern: "wheel", move: "arc" }
];

const stageThreeSpawns: EnemySpawn[] = [
  { time: 1.0, x: 120, y: -40, hp: 36, kind: "astralFamiliar", pattern: "splitFan", move: "arc" },
  { time: 2.0, x: 600, y: -40, hp: 36, kind: "astralFamiliar", pattern: "splitFan", move: "arc", mirror: true },
  { time: 3.4, x: 250, y: -40, hp: 38, kind: "astralFamiliar", pattern: "snipe", move: "dive" },
  { time: 4.5, x: 470, y: -40, hp: 38, kind: "astralFamiliar", pattern: "snipe", move: "dive", mirror: true },
  { time: 6.1, x: 360, y: -40, hp: 54, kind: "astralFamiliar", pattern: "breakableWall", move: "arc" },

  { time: 15.4, x: 90, y: -40, hp: 34, kind: "crystal", pattern: "laserSlash", move: "sway" },
  { time: 16.3, x: 630, y: -40, hp: 34, kind: "crystal", pattern: "laserSlash", move: "sway", mirror: true },
  { time: 17.7, x: 200, y: -40, hp: 42, kind: "astralFamiliar", pattern: "breakableWall", move: "arc" },
  { time: 18.6, x: 520, y: -40, hp: 42, kind: "astralFamiliar", pattern: "breakableWall", move: "arc", mirror: true },
  { time: 20.0, x: 360, y: -40, hp: 58, kind: "astralFamiliar", pattern: "laserSnipe", move: "dive" },

  { time: 30.0, x: 140, y: -40, hp: 40, kind: "astralFamiliar", pattern: "splitFan", move: "arc" },
  { time: 31.1, x: 580, y: -40, hp: 40, kind: "astralFamiliar", pattern: "splitFan", move: "arc", mirror: true },
  { time: 32.4, x: 360, y: -40, hp: 62, kind: "crystal", pattern: "laserGate", move: "sway" },
  { time: 34.3, x: 230, y: -40, hp: 42, kind: "astralFamiliar", pattern: "snipe", move: "dive" },
  { time: 35.0, x: 490, y: -40, hp: 42, kind: "astralFamiliar", pattern: "snipe", move: "dive", mirror: true },

  { time: 51.2, x: 100, y: -40, hp: 42, kind: "astralFamiliar", pattern: "splitFan", move: "arc" },
  { time: 52.0, x: 620, y: -40, hp: 42, kind: "astralFamiliar", pattern: "splitFan", move: "arc", mirror: true },
  { time: 53.4, x: 250, y: -40, hp: 44, kind: "crystal", pattern: "laserSlash", move: "dive" },
  { time: 54.2, x: 470, y: -40, hp: 44, kind: "crystal", pattern: "laserSlash", move: "dive", mirror: true },
  { time: 55.8, x: 360, y: -40, hp: 70, kind: "astralFamiliar", pattern: "breakableWall", move: "arc" },

  { time: 66.0, x: 130, y: -40, hp: 44, kind: "astralFamiliar", pattern: "breakableWall", move: "arc" },
  { time: 66.9, x: 590, y: -40, hp: 44, kind: "astralFamiliar", pattern: "breakableWall", move: "arc", mirror: true },
  { time: 68.2, x: 210, y: -40, hp: 46, kind: "astralFamiliar", pattern: "laserSnipe", move: "dive" },
  { time: 69.1, x: 510, y: -40, hp: 46, kind: "astralFamiliar", pattern: "laserSnipe", move: "dive", mirror: true },
  { time: 70.5, x: 360, y: -40, hp: 76, kind: "crystal", pattern: "wheel", move: "arc" },

  { time: 78.0, x: 110, y: -40, hp: 46, kind: "astralFamiliar", pattern: "splitFan", move: "dive" },
  { time: 78.8, x: 610, y: -40, hp: 46, kind: "astralFamiliar", pattern: "splitFan", move: "dive", mirror: true },
  { time: 80.2, x: 250, y: -40, hp: 50, kind: "crystal", pattern: "laserGate", move: "arc" },
  { time: 81.1, x: 470, y: -40, hp: 50, kind: "crystal", pattern: "laserGate", move: "arc", mirror: true },
  { time: 82.8, x: 360, y: -40, hp: 82, kind: "astralFamiliar", pattern: "breakableWall", move: "arc" }
];

const stageFourSpawns: EnemySpawn[] = [
  { time: 1.0, x: 120, y: -40, hp: 42, kind: "dragon", pattern: "flameFan", move: "arc" },
  { time: 2.0, x: 600, y: -40, hp: 42, kind: "dragon", pattern: "flameFan", move: "arc", mirror: true },
  { time: 3.4, x: 260, y: -40, hp: 44, kind: "dragon", pattern: "flameSnipe", move: "dive" },
  { time: 4.4, x: 460, y: -40, hp: 44, kind: "dragon", pattern: "fireRain", move: "dive", mirror: true },
  { time: 6.0, x: 360, y: -40, hp: 64, kind: "crystal", pattern: "laserGate", move: "arc" },

  { time: 15.2, x: 90, y: -40, hp: 44, kind: "dragon", pattern: "fireRain", move: "sway" },
  { time: 16.1, x: 630, y: -40, hp: 44, kind: "dragon", pattern: "fireRain", move: "sway", mirror: true },
  { time: 17.5, x: 210, y: -40, hp: 46, kind: "dragon", pattern: "flameSnipe", move: "arc" },
  { time: 18.4, x: 510, y: -40, hp: 46, kind: "dragon", pattern: "flameSnipe", move: "arc", mirror: true },
  { time: 20.0, x: 360, y: -40, hp: 66, kind: "astralFamiliar", pattern: "splitFan", move: "dive" },

  { time: 29.6, x: 130, y: -40, hp: 48, kind: "dragon", pattern: "flameFan", move: "arc" },
  { time: 30.5, x: 590, y: -40, hp: 48, kind: "dragon", pattern: "flameFan", move: "arc", mirror: true },
  { time: 31.8, x: 260, y: -40, hp: 50, kind: "dragon", pattern: "fireRain", move: "dive" },
  { time: 32.7, x: 460, y: -40, hp: 50, kind: "dragon", pattern: "fireRain", move: "dive", mirror: true },
  { time: 34.4, x: 360, y: -40, hp: 72, kind: "crystal", pattern: "laserSlash", move: "sway" },

  { time: 45.8, x: 100, y: -40, hp: 50, kind: "dragon", pattern: "flameSnipe", move: "arc" },
  { time: 46.6, x: 620, y: -40, hp: 50, kind: "dragon", pattern: "flameSnipe", move: "arc", mirror: true },
  { time: 47.9, x: 220, y: -40, hp: 52, kind: "dragon", pattern: "flameFan", move: "dive" },
  { time: 48.7, x: 500, y: -40, hp: 52, kind: "dragon", pattern: "flameFan", move: "dive", mirror: true },
  { time: 50.4, x: 360, y: -40, hp: 76, kind: "astralFamiliar", pattern: "breakableWall", move: "arc" },

  { time: 61.0, x: 140, y: -40, hp: 54, kind: "dragon", pattern: "fireRain", move: "arc" },
  { time: 61.8, x: 580, y: -40, hp: 54, kind: "dragon", pattern: "fireRain", move: "arc", mirror: true },
  { time: 63.0, x: 250, y: -40, hp: 56, kind: "dragon", pattern: "flameSnipe", move: "dive" },
  { time: 63.8, x: 470, y: -40, hp: 56, kind: "dragon", pattern: "flameSnipe", move: "dive", mirror: true },
  { time: 65.4, x: 360, y: -40, hp: 82, kind: "crystal", pattern: "laserSnipe", move: "arc" },

  { time: 75.6, x: 110, y: -40, hp: 58, kind: "dragon", pattern: "flameFan", move: "dive" },
  { time: 76.4, x: 610, y: -40, hp: 58, kind: "dragon", pattern: "fireRain", move: "dive", mirror: true },
  { time: 77.8, x: 250, y: -40, hp: 60, kind: "dragon", pattern: "flameSnipe", move: "arc" },
  { time: 78.6, x: 470, y: -40, hp: 60, kind: "dragon", pattern: "flameFan", move: "arc", mirror: true },
  { time: 80.4, x: 360, y: -40, hp: 88, kind: "astralFamiliar", pattern: "splitFan", move: "arc" }
];

const stageThreeAsteroidSeeds: AsteroidSpawn[] = [
  { time: 35.0, x: 120, y: -90, vx: 36, vy: 170, radius: 31, variant: 0, spin: 0.55 },
  { time: 35.8, x: 560, y: -100, vx: -42, vy: 178, radius: 34, variant: 1, spin: -0.5 },
  { time: 36.8, x: 340, y: -110, vx: 18, vy: 190, radius: 28, variant: 2, spin: 0.75 },
  { time: 38.0, x: 680, y: -120, vx: -72, vy: 168, radius: 37, variant: 3, spin: -0.42 },
  { time: 39.0, x: 50, y: -100, vx: 76, vy: 182, radius: 30, variant: 0, spin: 0.62 },
  { time: 40.2, x: 250, y: -120, vx: 30, vy: 176, radius: 35, variant: 1, spin: -0.7 },
  { time: 41.2, x: 500, y: -120, vx: -28, vy: 184, radius: 32, variant: 2, spin: 0.58 },
  { time: 42.4, x: 360, y: -130, vx: 0, vy: 198, radius: 40, variant: 3, spin: -0.36 },
  { time: 43.8, x: 110, y: -100, vx: 52, vy: 188, radius: 29, variant: 0, spin: 0.68 },
  { time: 44.5, x: 620, y: -100, vx: -58, vy: 188, radius: 29, variant: 1, spin: -0.66 },
  { time: 45.8, x: 260, y: -130, vx: -18, vy: 178, radius: 33, variant: 2, spin: 0.48 },
  { time: 46.7, x: 460, y: -130, vx: 22, vy: 178, radius: 33, variant: 3, spin: -0.52 },
  { time: 48.0, x: 80, y: -120, vx: 70, vy: 192, radius: 36, variant: 0, spin: 0.44 },
  { time: 49.0, x: 640, y: -120, vx: -70, vy: 192, radius: 36, variant: 1, spin: -0.44 }
];

const stageThreeAsteroids: AsteroidSpawn[] = stageThreeAsteroidSeeds
  .flatMap((spawn, index) => {
    const offsets = [0, 0.34, 0.68, 1.02];
    return offsets.map((offset, wave) => {
      const side = wave % 2 === 0 ? 1 : -1;
      return {
        ...spawn,
        time: spawn.time + offset + (index % 3) * 0.08,
        x: clampSpawnX(spawn.x + side * (42 + (index % 4) * 14) * wave),
        vx: spawn.vx + side * (10 + wave * 8),
        vy: spawn.vy + wave * 9,
        radius: Math.max(24, spawn.radius - (wave % 2) * 4 + (wave === 3 ? 3 : 0)),
        variant: (spawn.variant + wave) % 4,
        spin: spawn.spin * (wave % 2 === 0 ? 1 : -1) + side * wave * 0.08
      };
    });
  })
  .sort((a, b) => a.time - b.time);

function clampSpawnX(x: number) {
  return Math.max(70, Math.min(650, x));
}

const thickenStageSpawns = (spawns: EnemySpawn[]) =>
  spawns
    .flatMap((spawn, index) => {
      if (index % 2 === 1) {
        return [spawn];
      }

      const side = spawn.x < 360 ? 1 : -1;
      const extra: EnemySpawn = {
        ...spawn,
        time: spawn.time + 0.36,
        x: clampSpawnX(720 - spawn.x + side * 36),
        hp: Math.max(28, Math.floor(spawn.hp * 0.9)),
        mirror: !spawn.mirror
      };
      return [spawn, extra];
    })
    .sort((a, b) => a.time - b.time);

const doubleStageSpawns = (spawns: EnemySpawn[]) =>
  spawns
    .flatMap((spawn) => {
      const side = spawn.x < 360 ? 1 : -1;
      const mirroredX = 720 - spawn.x;
      const offsetX = Math.abs(mirroredX - spawn.x) < 80 ? spawn.x + side * 95 : mirroredX;
      const extra: EnemySpawn = {
        ...spawn,
        time: spawn.time + 0.42,
        x: clampSpawnX(offsetX),
        mirror: !spawn.mirror
      };
      return [spawn, extra];
    })
    .sort((a, b) => a.time - b.time);

export const stages: StageDefinition[] = [
  {
    id: 1,
    title: "Stage 1",
    subtitle: "Moonlit shrine approach",
    warningText: "Lunar Witch approaches",
    bossKind: "lunarWitch",
    spawns: stageOneSpawns,
    bossStartTime: 88.0
  },
  {
    id: 2,
    title: "Stage 2",
    subtitle: "Starlight crystal corridor",
    warningText: "Starlight Oracle descends",
    bossKind: "starlightOracle",
    stageMusic: "stage2",
    spawns: doubleStageSpawns(stageTwoSpawns),
    bossStartTime: 90.0
  },
  {
    id: 3,
    title: "Stage 3",
    subtitle: "Asteroid spell belt",
    warningText: "Cosmic Sorcerer opens the belt",
    bossKind: "cosmicSorcerer",
    stageMusic: "stage3",
    bossMusic: "lastBoss",
    spawns: thickenStageSpawns(stageThreeSpawns),
    obstacles: stageThreeAsteroids,
    bossStartTime: 92.0
  },
  {
    id: 4,
    title: "Stage 4",
    subtitle: "Fire storm",
    warningText: "Salamander rises from the storm",
    bossKind: "salamander",
    stageMusic: "stage4",
    bossMusic: "lastBoss",
    spawns: stageFourSpawns,
    bossStartTime: 92.0
  }
];

export const stageSpawns = stages[0].spawns;
export const bossStartTime = stages[0].bossStartTime;
