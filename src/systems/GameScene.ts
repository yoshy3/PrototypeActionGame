import { Application, Assets, Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { AudioSystem } from "./AudioSystem";
import { Boss } from "./Boss";
import { BulletSystem } from "./BulletSystem";
import { circlesOverlap, distanceToSegment } from "./Collision";
import { difficulties, type DifficultyConfig, type DifficultyId } from "./Difficulty";
import { Enemy } from "./Enemy";
import { Input } from "./Input";
import { ItemSystem } from "./ItemSystem";
import { MAX_POWER, Player, POWER_STEP } from "./Player";
import { stages } from "./StageScript";

type GameState = "boot" | "title" | "playing" | "paused" | "stageClearPause" | "stageTransition" | "clear" | "gameover";
const HIGH_SCORE_KEY = "moonlit-spell-barrage.highScores";
const LEGACY_HIGH_SCORE_KEY = "moonlit-spell-barrage.highScore";
const TITLE_IMAGE_URL = new URL("../assets/images/title.png", import.meta.url).href;
const AUTO_COLLECT_LINE_Y = 340;
const ITEM_COLLECT_RADIUS = 40;
const FIRST_EXTEND_SCORE = 10000;
const EXTEND_SCORE_STEP = 20000;
const DEV_BOSS_START_ENABLED = import.meta.env.DEV;
type HighScores = Record<DifficultyId, number>;
type StartOptions = {
  bossDebug?: boolean;
  stageDebug?: number;
};

export class GameScene {
  private readonly audio = new AudioSystem();
  private readonly input = new Input();
  private readonly root = new Container();
  private readonly background = new Graphics();
  private readonly titleArt = new Sprite(Texture.EMPTY);
  private readonly bombFlash = new Graphics();
  private readonly collectLine = new Graphics();
  private readonly playfield = new Container();
  private readonly bullets = new BulletSystem();
  private readonly items = new ItemSystem();
  private readonly enemies: Enemy[] = [];
  private readonly player = new Player();
  private readonly ui = new Container();
  private readonly overlay = new Text({
    text: "",
    style: {
      fill: 0xffffff,
      fontSize: 32,
      align: "center",
      fontWeight: "700",
      letterSpacing: 0,
      wordWrap: true,
      wordWrapWidth: 640
    }
  });
  private readonly hud = new Text({
    text: "",
    style: { fill: 0xffedf9, fontSize: 16, letterSpacing: 0, wordWrap: true, wordWrapWidth: 676 }
  });
  private readonly subHud = new Text({
    text: "",
    style: { fill: 0xaefdf2, fontSize: 14, letterSpacing: 0, wordWrap: true, wordWrapWidth: 676 }
  });
  private readonly banner = new Text({
    text: "",
    style: { fill: 0xffe2f3, fontSize: 28, align: "center", fontWeight: "700", letterSpacing: 0 }
  });
  private readonly clearFx = new Container();
  private readonly clearRays = new Graphics();
  private readonly clearSparkles = new Graphics();
  private readonly clearTitle = new Text({
    text: "",
    style: { fill: 0xffffff, fontSize: 48, align: "center", fontWeight: "700", letterSpacing: 0 }
  });
  private readonly clearStats = new Text({
    text: "",
    style: { fill: 0xffedf9, fontSize: 22, align: "center", fontWeight: "700", letterSpacing: 0 }
  });
  private readonly clearHint = new Text({
    text: "",
    style: { fill: 0xaefdf2, fontSize: 18, align: "center", fontWeight: "700", letterSpacing: 0 }
  });
  private readonly bossBar = new Graphics();
  private readonly stageProgress = new Graphics();
  private state: GameState = "boot";
  private time = 0;
  private spawnIndex = 0;
  private boss: Boss | null = null;
  private score = 0;
  private highScores: HighScores = { casual: 0, normal: 0, lunatic: 0 };
  private graze = 0;
  private power = 0;
  private bombs = 2;
  private clearTimer = 0;
  private backgroundOffset = 0;
  private flashTimer = 0;
  private bannerTimer = 0;
  private shakeTime = 0;
  private shakeStrength = 0;
  private clearFxTimer = 0;
  private clearWasRecord = false;
  private announcedBoss = false;
  private playedClear = false;
  private bossPhase = 0;
  private difficultyIndex = 0;
  private currentStageIndex = 0;
  private nextExtendScore = FIRST_EXTEND_SCORE;
  private stageClearTimer = 0;
  private stageTransitionTimer = 0;

  constructor(private readonly app: Application) {}

  async init() {
    this.highScores = this.loadHighScores();
    const titleTexture = (await Assets.load(TITLE_IMAGE_URL)) as Texture;
    this.titleArt.texture = titleTexture;
    this.titleArt.anchor.set(0.5);
    this.titleArt.position.set(360, 180);
    this.fitTitleArt();

    this.app.stage.addChild(this.root);
    this.root.addChild(this.background, this.titleArt, this.playfield, this.collectLine, this.bombFlash, this.ui);
    this.playfield.addChild(this.items.container, this.bullets.container, this.player.container);

    this.overlay.anchor.set(0.5);
    this.overlay.position.set(360, 460);
    this.banner.anchor.set(0.5);
    this.banner.position.set(360, 250);
    this.clearTitle.anchor.set(0.5);
    this.clearTitle.position.set(360, 350);
    this.clearStats.anchor.set(0.5);
    this.clearStats.position.set(360, 465);
    this.clearHint.anchor.set(0.5);
    this.clearHint.position.set(360, 590);
    this.clearFx.visible = false;
    this.clearFx.addChild(this.clearRays, this.clearSparkles, this.clearTitle, this.clearStats, this.clearHint);
    this.hud.position.set(22, 20);
    this.subHud.position.set(22, 64);
    this.ui.addChild(this.hud, this.subHud, this.bossBar, this.stageProgress, this.clearFx, this.banner, this.overlay);

    this.drawBackground();
    this.showBootScreen();
  }

  update(dt: number) {
    this.input.update();
    this.updateBackground(dt);
    this.updateShake(dt);
    this.updateClearResult(dt);

    if (this.state === "boot") {
      if (this.input.wasAnyPressed()) {
        this.audio.resume();
        this.showTitle();
      }
      this.input.endFrame();
      return;
    }

    if (this.input.wasPressed("escape") && (this.state === "playing" || this.state === "paused")) {
      this.state = this.state === "playing" ? "paused" : "playing";
      this.audio.setPaused(this.state === "paused");
      this.overlay.position.set(360, 460);
      this.overlay.text = this.state === "paused" ? "PAUSED\n\nEsc/Start to resume\nR to retry   Z / SPACE to title" : "";
    }
    if (this.input.wasPressed("m")) {
      this.audio.resume();
      const muted = this.audio.toggleMute();
      this.showBanner(muted ? "SOUND OFF" : "SOUND ON", 0.8);
      if (this.state === "title") {
        this.showTitle();
      }
    }

    if (this.state === "title" && DEV_BOSS_START_ENABLED && this.input.wasPressed("b")) {
      this.start({ bossDebug: true });
    } else if (this.state === "title" && DEV_BOSS_START_ENABLED && this.input.wasPressed("v")) {
      this.start({ stageDebug: 2 });
    } else if (this.state === "title" && this.input.wasPressed("z", " ", "enter")) {
      this.start();
    } else if (this.state === "paused" && this.input.wasPressed("r")) {
      this.start();
    } else if (this.state === "paused" && this.input.wasPressed("z", " ", "enter")) {
      this.showTitle();
    } else if ((this.state === "clear" || this.state === "gameover") && this.input.wasPressed("r")) {
      this.start();
    } else if ((this.state === "clear" || this.state === "gameover") && this.input.wasPressed("z", " ", "enter")) {
      this.showTitle();
    }

    if (this.state === "title") {
      this.updateTitleSelection();
    }

    if (this.state === "stageClearPause") {
      this.updateStageClearPause(dt);
      this.input.endFrame();
      return;
    }

    if (this.state === "stageTransition") {
      this.updateStageTransition(dt);
      this.input.endFrame();
      return;
    }

    if (this.state === "clear") {
      this.updateClearState(dt);
      this.input.endFrame();
      return;
    }

    if (this.state !== "playing") {
      this.input.endFrame();
      return;
    }

    this.time += dt;
    this.clearTimer = Math.max(0, this.clearTimer - dt);
    this.updateBanner(dt);
    if (!this.announcedBoss && this.time >= this.currentStage.bossStartTime - 2.1) {
      this.announcedBoss = true;
      this.audio.warning();
      this.showBanner(`WARNING\n${this.currentStage.warningText}`, 2.0);
    }

    if (this.player.update(dt, this.input, this.bullets, { width: 720, height: 960 }, this.power)) {
      this.audio.shot();
    }
    if (this.input.wasPressed("x") && this.bombs > 0) {
      this.useBomb();
    }
    this.spawnEnemies();

    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        continue;
      }
      enemy.update(dt, this.bullets, this.player.pos.x);
      if (!enemy.alive) {
        continue;
      }
      enemy.container.scale.set(1 + Math.max(0, enemy.container.scale.x - 1 - dt * 5));
    }

    if (!this.boss && this.time >= this.currentStage.bossStartTime) {
      this.boss = new Boss(this.difficulty, this.currentStage.bossKind);
      this.bossPhase = this.boss.getPhase();
      this.playfield.addChild(this.boss.container);
      this.audio.playMusic("boss");
      this.audio.bossAppear();
    }
    this.boss?.update(dt, this.bullets, this.player.pos);
    if (this.boss?.alive) {
      if (this.boss.phaseChanged && this.boss.getPhase() !== this.bossPhase) {
        this.bossPhase = this.boss.getPhase();
        this.bullets.clear("enemy");
        this.audio.spellChange();
        this.showBanner(`SPELL ${this.bossPhase + 1}\n${this.boss.getSpellName()}`, 1.7);
        this.shake(0.28, 5);
        this.spark(this.boss.pos.x, this.boss.pos.y, 0xffe2f3, 34);
        if (this.currentStage.id === 2) {
          this.dropSpellPowerItems(this.boss.pos.x, this.boss.pos.y);
        }
      }
      this.boss.container.scale.set(1 + Math.max(0, this.boss.container.scale.x - 1 - dt * 4));
    }

    this.bullets.update(dt, 720, 960);
    this.drawCollectLine();
    this.items.update(dt, this.player.pos, ITEM_COLLECT_RADIUS, this.player.pos.y < AUTO_COLLECT_LINE_Y, (item) =>
      this.collectItem(item.kind)
    );
    this.resolveCollisions();
    this.cleanupEnemies();
    this.drawBossBar();
    this.drawStageProgress();
    this.updateHud();

    if (!this.player.alive) {
      this.state = "gameover";
      this.audio.playMusic("gameover");
      this.finishRun("GAME OVER");
    } else if (this.boss && !this.boss.alive && this.clearTimer <= 0) {
      if (this.currentStageIndex < stages.length - 1) {
        this.beginStageClearPause();
      } else {
        this.state = "clear";
        this.addScore(this.player.hp * 1000 + this.bombs * 750 + this.graze * 5);
        this.audio.playMusic("clear");
        this.finishRun("STAGE CLEAR");
        if (!this.playedClear) {
          this.playedClear = true;
          this.audio.clear();
        }
      }
    }

    this.input.endFrame();
  }

  private start(options: StartOptions = {}) {
    const bossDebug = DEV_BOSS_START_ENABLED && options.bossDebug === true;
    const stageDebug = DEV_BOSS_START_ENABLED ? options.stageDebug ?? 1 : 1;
    this.audio.resume();
    this.audio.setPaused(false);
    this.audio.playMusic(bossDebug ? "boss" : "stage");
    this.state = "playing";
    this.currentStageIndex = Math.max(0, Math.min(stages.length - 1, stageDebug - 1));
    this.titleArt.visible = false;
    this.playfield.visible = true;
    this.overlay.position.set(360, 460);
    this.time = bossDebug ? this.currentStage.bossStartTime : 0;
    this.spawnIndex = bossDebug ? this.currentStage.spawns.length : 0;
    this.score = 0;
    this.graze = 0;
    this.power = bossDebug || this.currentStageIndex > 0 ? MAX_POWER : 0;
    this.bombs = 2;
    this.nextExtendScore = FIRST_EXTEND_SCORE;
    this.clearTimer = 0;
    this.stageClearTimer = 0;
    this.flashTimer = 0;
    this.bannerTimer = 0;
    this.announcedBoss = bossDebug;
    this.playedClear = false;
    this.bossPhase = 0;
    this.clearWasRecord = false;
    this.overlay.text = "";
    this.banner.text = "";
    this.hideClearResult();
    this.bombFlash.clear();
    this.boss?.container.destroy();
    this.boss = null;
    this.bullets.clear();
    this.items.clear();

    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.enemies.length = 0;

    this.player.reset();
    if (!this.playfield.children.includes(this.player.container)) {
      this.playfield.addChild(this.player.container);
    }
    if (bossDebug) {
      this.showBanner("BOSS DEBUG\nFull power start", 1.4);
    } else if (this.currentStageIndex > 0) {
      this.showBanner(`${this.currentStage.title.toUpperCase()}\nFull power debug start`, 1.4);
    }
  }

  private showTitle() {
    this.state = "title";
    this.audio.setPaused(false);
    this.audio.playMusic("title");
    this.titleArt.visible = true;
    this.playfield.visible = false;
    this.bullets.clear();
    this.items.clear();
    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.enemies.length = 0;
    this.boss?.container.destroy();
    this.boss = null;
    this.player.reset();
    this.hideClearResult();
    this.overlay.position.set(360, 560);
    this.overlay.text = `Difficulty: ${this.difficulty.label}\n\nLeft/Right or 1-3 to change\nZ / SPACE to start${
      DEV_BOSS_START_ENABLED ? "\nB to start boss debug   V for Stage 2" : ""
    }`;
    this.hud.text = `Move: Arrow/WASD/Pad   Shot: Z/A   Bomb: X/X\nFocus: Shift/RB   M: ${
      this.audio.isMuted() ? "Sound Off" : "Sound On"
    }   Esc/Start: Pause`;
    this.subHud.text = `Graze enemy bullets for bonus score. ${this.difficulty.label} best: ${this.currentHighScore}`;
    this.bossBar.clear();
    this.stageProgress.clear();
    this.bombFlash.clear();
    this.collectLine.clear();
  }

  private showBootScreen() {
    this.state = "boot";
    this.titleArt.visible = true;
    this.playfield.visible = false;
    this.hideClearResult();
    this.overlay.position.set(360, 560);
    this.overlay.text = "CLICK OR PRESS ANY KEY\nGAMEPAD BUTTON";
    this.hud.text = "";
    this.subHud.text = "";
    this.banner.text = "";
    this.bossBar.clear();
    this.stageProgress.clear();
    this.bombFlash.clear();
    this.collectLine.clear();
  }

  private spawnEnemies() {
    while (this.spawnIndex < this.currentStage.spawns.length && this.currentStage.spawns[this.spawnIndex].time <= this.time) {
      const enemy = new Enemy(this.currentStage.spawns[this.spawnIndex], this.difficulty);
      this.enemies.push(enemy);
      this.playfield.addChild(enemy.container);
      this.spawnIndex += 1;
    }
  }

  private resolveCollisions() {
    for (const bullet of this.bullets.bullets) {
      if (bullet.owner === "player") {
        for (const enemy of this.enemies) {
          if (enemy.alive && circlesOverlap(bullet.pos, bullet.radius, enemy.pos, enemy.radius)) {
            this.bullets.kill(bullet);
            if (enemy.damage(bullet.damage)) {
              this.addScore(120);
              this.audio.enemyDown();
              this.dropEnemyItems(enemy.pos.x, enemy.pos.y);
              this.spark(enemy.pos.x, enemy.pos.y, 0xffc3ec);
            }
            break;
          }
        }

        if (this.boss?.alive && circlesOverlap(bullet.pos, bullet.radius, this.boss.pos, this.boss.radius)) {
          this.bullets.kill(bullet);
          if (this.boss.damage(bullet.damage)) {
            this.addScore(5000);
            this.awardLife("BOSS BONUS");
            this.clearTimer = 0.8;
            this.bullets.clear("enemy");
            this.audio.bossDefeated();
            this.dropBossItems(this.boss.pos.x, this.boss.pos.y);
            this.shake(0.42, 9);
            this.spark(this.boss.pos.x, this.boss.pos.y, 0xffffff, 48);
          } else {
            this.addScore(6);
          }
        }
      } else if (this.player.alive && circlesOverlap(bullet.pos, bullet.radius, this.player.pos, this.player.radius)) {
        if (this.player.damage()) {
          this.power = Math.max(0, this.power - POWER_STEP);
          this.audio.playerHit();
          this.bullets.kill(bullet);
          this.bullets.clear("enemy");
          this.shake(0.34, 8);
          this.spark(this.player.pos.x, this.player.pos.y, 0x9effff, 24);
        }
      } else if (
        this.player.alive &&
        !bullet.grazed &&
        circlesOverlap(bullet.pos, bullet.radius + 28, this.player.pos, this.player.radius)
      ) {
        bullet.grazed = true;
        this.graze += 1;
        this.addScore(15);
        this.audio.graze();
        this.floatText("+GRAZE", this.player.pos.x + 24, this.player.pos.y - 18, 0xaefdf2);
      }
    }

    for (const laser of this.bullets.lasers) {
      if (
        laser.owner !== "enemy" ||
        !laser.alive ||
        laser.age < laser.warningTime ||
        !this.player.alive ||
        this.player.invincible > 0
      ) {
        continue;
      }

      const start = {
        x: laser.origin.x + Math.cos(laser.angle) * laser.offset,
        y: laser.origin.y + Math.sin(laser.angle) * laser.offset
      };
      const end = {
        x: start.x + Math.cos(laser.angle) * laser.visibleLength,
        y: start.y + Math.sin(laser.angle) * laser.visibleLength
      };
      const distance = distanceToSegment(this.player.pos, start, end);
      if (distance <= laser.width * 0.5 + this.player.radius) {
        if (this.player.damage()) {
          this.power = Math.max(0, this.power - POWER_STEP);
          this.audio.playerHit();
          this.bullets.clear("enemy");
          this.shake(0.34, 8);
          this.spark(this.player.pos.x, this.player.pos.y, 0x9effff, 24);
        }
      } else if (!laser.grazed && distance <= laser.width * 0.5 + this.player.radius + 28) {
        laser.grazed = true;
        this.graze += 1;
        this.addScore(15);
        this.audio.graze();
        this.floatText("+GRAZE", this.player.pos.x + 24, this.player.pos.y - 18, 0xaefdf2);
      }
    }
  }

  private cleanupEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      if (!this.enemies[i].alive) {
        this.enemies.splice(i, 1);
      }
    }
  }

  private updateHud() {
    this.hud.text = `Lives: ${this.player.hp}   Bombs: ${this.bombs}   Power: Lv${this.powerLevel + 1} ${
      this.power
    }/${MAX_POWER}   Graze: ${this.graze}\nScore: ${this.score}   ${this.audio.isMuted() ? "Muted" : "Sound"}`;
    this.subHud.text = this.boss?.alive
      ? `${this.boss.getSpellName()}: ${Math.max(0, Math.ceil(this.boss.hp))} HP   Focus with Shift/RB`
      : `${this.currentStage.title}: ${this.currentStage.subtitle}   Auto-collect above the top line`;
  }

  private finishRun(title: string) {
    const wasRecord = this.score > this.currentHighScore;
    if (wasRecord) {
      this.highScores[this.difficulty.id] = this.score;
      this.saveHighScores(this.highScores);
    }

    if (title === "STAGE CLEAR") {
      this.clearWasRecord = wasRecord;
      this.showClearResult(wasRecord);
      return;
    }

    this.hideClearResult();
    this.overlay.position.set(360, 460);
    this.overlay.text = `${title}\n\n${this.difficulty.label} Score ${this.score}\nPower Lv${this.powerLevel + 1} ${this.power}/${MAX_POWER}\nGraze ${this.graze}\nBest ${this.currentHighScore}${
      wasRecord ? "  NEW RECORD" : ""
    }\n\nR to retry   Z / SPACE to title`;
    this.subHud.text = wasRecord ? "New local high score saved." : "Run complete.";
  }

  private showClearResult(wasRecord: boolean) {
    this.overlay.text = "";
    this.banner.text = "";
    this.clearFx.visible = true;
    this.clearFxTimer = 0;
    this.clearTitle.text = "STAGE CLEAR";
    this.refreshClearResultText(wasRecord);
    this.subHud.text = wasRecord ? "New local high score saved." : "Run complete.";
    this.updateClearResult(0);
  }

  private refreshClearResultText(wasRecord: boolean) {
    this.clearStats.text = `${this.difficulty.label} Score ${this.score}\nPower Lv${this.powerLevel + 1} ${this.power}/${MAX_POWER}   Graze ${this.graze}\nBest ${this.currentHighScore}`;
    this.clearHint.text = `${wasRecord ? "NEW RECORD" : "RUN COMPLETE"}\nR to retry   Z / SPACE to title`;
  }

  private hideClearResult() {
    this.clearFx.visible = false;
    this.clearFxTimer = 0;
    this.clearRays.clear();
    this.clearSparkles.clear();
    this.clearTitle.text = "";
    this.clearStats.text = "";
    this.clearHint.text = "";
  }

  private updateClearState(dt: number) {
    this.bullets.update(dt, 720, 960);
    this.drawCollectLine();
    this.items.update(dt, this.player.pos, ITEM_COLLECT_RADIUS, true, (item) => this.collectItem(item.kind));

    if (this.score > this.currentHighScore) {
      this.highScores[this.difficulty.id] = this.score;
      this.saveHighScores(this.highScores);
      this.clearWasRecord = true;
    }

    this.refreshClearResultText(this.clearWasRecord);
    this.drawStageProgress();
    this.updateHud();
  }

  private drawBossBar() {
    this.bossBar.clear();
    if (!this.boss?.alive || !this.boss.entered) {
      return;
    }

    const width = 510;
    const x = 105;
    const y = 88;
    const ratio = Math.max(0, this.boss.hp / this.boss.maxHp);
    this.bossBar.roundRect(x, y, width, 8, 4).fill({ color: 0xffffff, alpha: 0.18 });
    this.bossBar.roundRect(x, y, width * ratio, 8, 4).fill(0xff72bd);

    for (const phaseRatio of [0.2, 0.4, 0.6, 0.8]) {
      const markerX = x + width * phaseRatio;
      this.bossBar.moveTo(markerX, y - 3).lineTo(markerX, y + 11).stroke({ color: 0xffedf9, width: 1, alpha: 0.62 });
    }
  }

  private drawStageProgress() {
    this.stageProgress.clear();

    const width = 510;
    const x = 105;
    const y = 104;
    const ratio = Math.min(1, this.boss?.alive ? 1 : this.time / this.currentStage.bossStartTime);
    this.stageProgress.roundRect(x, y, width, 5, 3).fill({ color: 0xffffff, alpha: 0.12 });
    this.stageProgress.roundRect(x, y, width * ratio, 5, 3).fill({ color: 0xaefdf2, alpha: 0.72 });

    const bossX = x + width;
    this.stageProgress.circle(bossX, y + 2.5, this.boss ? 4.5 : 3.5).fill({
      color: this.boss ? 0xff72bd : 0xffedf9,
      alpha: this.boss ? 0.86 : 0.42
    });
  }

  private get currentHighScore() {
    return this.highScores[this.difficulty.id] ?? 0;
  }

  private loadHighScores(): HighScores {
    try {
      const value = window.localStorage.getItem(HIGH_SCORE_KEY);
      if (value) {
        const parsed = JSON.parse(value) as Partial<HighScores>;
        return {
          casual: Number(parsed.casual) || 0,
          normal: Number(parsed.normal) || 0,
          lunatic: Number(parsed.lunatic) || 0
        };
      }

      const legacy = window.localStorage.getItem(LEGACY_HIGH_SCORE_KEY);
      return { casual: 0, normal: legacy ? Number.parseInt(legacy, 10) || 0 : 0, lunatic: 0 };
    } catch {
      return { casual: 0, normal: 0, lunatic: 0 };
    }
  }

  private saveHighScores(value: HighScores) {
    try {
      window.localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(value));
    } catch {
      // localStorage can be unavailable in hardened browser settings.
    }
  }

  private awardLife(label: string) {
    this.player.addLife();
    this.floatText("+1 LIFE", this.player.pos.x, this.player.pos.y - 48, 0xfff4a8);
    this.showBanner(label, 1.0);
  }

  private beginStageClearPause() {
    this.state = "stageClearPause";
    this.stageClearTimer = 4.0;
    this.audio.playMusic("clear");
    this.audio.clear();
    this.bullets.clear();
    this.items.clear();
    this.boss?.container.destroy();
    this.boss = null;
    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.enemies.length = 0;
    this.overlay.text = "";
    this.banner.text = "";
    this.clearFx.visible = true;
    this.clearFxTimer = 0;
    this.clearTitle.text = `${this.currentStage.title.toUpperCase()} CLEAR`;
    this.clearStats.text = `${this.difficulty.label} Score ${this.score}\nPower Lv${this.powerLevel + 1} ${this.power}/${MAX_POWER}   Graze ${this.graze}`;
    this.clearHint.text = "NEXT STAGE\nGet ready";
    this.updateClearResult(0);
  }

  private updateStageClearPause(dt: number) {
    this.stageClearTimer = Math.max(0, this.stageClearTimer - dt);
    this.updateClearResult(dt);
    this.updateHud();
    if (this.stageClearTimer <= 0) {
      this.clearHint.text = "NEXT STAGE\nPress Z / SPACE";
    }
    if (this.stageClearTimer <= 0 && this.input.wasPressed("z", " ", "enter")) {
      this.hideClearResult();
      this.beginNextStage();
    }
  }

  private beginNextStage() {
    this.currentStageIndex += 1;
    this.state = "stageTransition";
    this.stageTransitionTimer = 2.2;
    this.time = 0;
    this.spawnIndex = 0;
    this.clearTimer = 0;
    this.announcedBoss = false;
    this.bossPhase = 0;
    this.audio.playMusic("stage");
    this.overlay.position.set(360, 460);
    this.overlay.text = `${this.currentStage.title.toUpperCase()}\n\n${this.currentStage.subtitle}`;
    this.bullets.clear();
    this.items.clear();
    this.boss?.container.destroy();
    this.boss = null;
    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.enemies.length = 0;
    this.player.prepareForNextStage();
    this.updateHud();
  }

  private updateStageTransition(dt: number) {
    this.stageTransitionTimer = Math.max(0, this.stageTransitionTimer - dt);
    this.drawStageProgress();
    this.updateHud();
    if (this.stageTransitionTimer <= 0) {
      this.state = "playing";
      this.overlay.text = "";
      this.showBanner(`${this.currentStage.title.toUpperCase()}\n${this.currentStage.subtitle}`, 1.4);
    }
  }

  private useBomb() {
    this.bombs -= 1;
    this.audio.bomb();
    this.shake(0.32, 7);
    this.player.invincible = Math.max(this.player.invincible, 2.6);
    this.bullets.clear("enemy");
    this.addScore(300);

    for (const enemy of [...this.enemies]) {
      if (enemy.alive && enemy.damage(16)) {
        this.addScore(120);
        this.audio.enemyDown();
        this.dropEnemyItems(enemy.pos.x, enemy.pos.y, true);
        this.spark(enemy.pos.x, enemy.pos.y, 0xfff3fb, 18);
      }
    }

    if (this.boss?.alive && this.boss.entered) {
      if (this.boss.damage(42)) {
        this.addScore(5000);
        this.awardLife("BOSS BONUS");
        this.clearTimer = 0.8;
        this.audio.bossDefeated();
        this.dropBossItems(this.boss.pos.x, this.boss.pos.y);
      }
      this.spark(this.boss.pos.x, this.boss.pos.y, 0xaefdf2, 32);
    }

    this.cleanupEnemies();
    this.flashTimer = 0.28;
    this.bombFlash.clear();
    this.bombFlash.rect(0, 0, 720, 960).fill({ color: 0xeefcff, alpha: 0.42 });
  }

  private showBanner(text: string, seconds: number) {
    this.banner.text = text;
    this.banner.alpha = 1;
    this.bannerTimer = seconds;
  }

  private dropEnemyItems(x: number, y: number, generous = false) {
    this.items.spawn("score", { x, y }, generous ? -24 : 0);
    if (generous || Math.random() < 0.18) {
      this.items.spawn("score", { x: x + 12, y }, 24);
    }
    if (Math.random() < (generous ? 0.12 : 0.06)) {
      this.items.spawn("bomb", { x, y: y - 8 });
    }
  }

  private dropBossItems(x: number, y: number) {
    for (let i = 0; i < 18; i += 1) {
      const angle = (Math.PI * 2 * i) / 18;
      this.items.spawn("score", { x: x + Math.cos(angle) * 34, y: y + Math.sin(angle) * 22 }, Math.cos(angle) * 80, true);
    }
    this.items.spawn("bomb", { x, y }, 0, true);
  }

  private dropSpellPowerItems(x: number, y: number) {
    for (let i = 0; i < 12; i += 1) {
      const angle = -Math.PI * 0.9 + (Math.PI * 0.8 * i) / 11;
      const radius = 18 + (i % 3) * 12;
      this.items.spawn(
        "score",
        { x: x + Math.cos(angle) * radius, y: y + 18 + Math.sin(angle) * radius },
        Math.cos(angle) * 95,
        true
      );
    }
  }

  private collectItem(kind: "score" | "bomb") {
    if (kind === "bomb") {
      this.bombs = Math.min(4, this.bombs + 1);
      this.addScore(250);
      this.floatText("+BOMB", this.player.pos.x, this.player.pos.y - 30, 0xfff4a8);
    } else {
      const previousLevel = this.powerLevel;
      this.power = Math.min(MAX_POWER, this.power + 4);
      this.addScore(80);
      this.floatText("+ITEM", this.player.pos.x + 22, this.player.pos.y - 18, 0x9ffff4);
      if (this.powerLevel > previousLevel && this.state !== "clear") {
        this.showBanner(`POWER UP\nLevel ${this.powerLevel + 1}`, 1.0);
        this.audio.powerUp();
      }
    }
    this.audio.itemCollect(kind);
  }

  private get difficulty(): DifficultyConfig {
    return difficulties[this.difficultyIndex];
  }

  private get currentStage() {
    return stages[this.currentStageIndex];
  }

  private get powerLevel() {
    return Math.min(3, Math.floor(this.power / POWER_STEP));
  }

  private updateTitleSelection() {
    const previous = this.difficultyIndex;
    if (this.input.wasPressed("arrowleft", "a")) {
      this.difficultyIndex = (this.difficultyIndex + difficulties.length - 1) % difficulties.length;
    } else if (this.input.wasPressed("arrowright", "d")) {
      this.difficultyIndex = (this.difficultyIndex + 1) % difficulties.length;
    } else if (this.input.wasPressed("1")) {
      this.difficultyIndex = 0;
    } else if (this.input.wasPressed("2")) {
      this.difficultyIndex = 1;
    } else if (this.input.wasPressed("3")) {
      this.difficultyIndex = 2;
    }

    if (previous !== this.difficultyIndex) {
      this.audio.resume();
      this.audio.graze();
      this.showTitle();
    }
  }

  private addScore(baseScore: number) {
    this.score += Math.round(baseScore * this.difficulty.score);
    while (this.score >= this.nextExtendScore) {
      this.awardLife("EXTEND");
      this.nextExtendScore += EXTEND_SCORE_STEP;
    }
  }

  private updateBanner(dt: number) {
    if (this.bannerTimer <= 0) {
      this.banner.text = "";
      return;
    }

    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    this.banner.alpha = Math.min(1, this.bannerTimer);
  }

  private updateClearResult(dt: number) {
    if (!this.clearFx.visible) {
      return;
    }

    this.clearFxTimer += dt;
    const t = this.clearFxTimer;
    const reveal = Math.min(1, t / 0.65);
    const pulse = Math.sin(t * 4.2);

    this.clearRays.clear();
    this.clearRays.rect(0, 0, 720, 960).fill({ color: 0x12081f, alpha: 0.34 * reveal });

    const centerX = 360;
    const centerY = 388;
    for (let i = 0; i < 26; i += 1) {
      const angle = (Math.PI * 2 * i) / 26 + t * 0.28;
      const inner = 58 + Math.sin(t * 2.4 + i) * 8;
      const outer = 390 + Math.sin(t * 1.7 + i * 0.6) * 34;
      this.clearRays
        .moveTo(centerX + Math.cos(angle) * inner, centerY + Math.sin(angle) * inner)
        .lineTo(centerX + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer)
        .stroke({ color: i % 2 === 0 ? 0xffc3ec : 0xaefdf2, width: 2, alpha: 0.12 * reveal });
    }

    for (let i = 0; i < 4; i += 1) {
      const radius = 88 + i * 48 + Math.sin(t * 2 + i) * 5;
      this.clearRays
        .circle(centerX, centerY, radius)
        .stroke({ color: i % 2 === 0 ? 0xfff4a8 : 0xaefdf2, width: 2, alpha: (0.3 - i * 0.045) * reveal });
    }

    this.clearSparkles.clear();
    for (let i = 0; i < 42; i += 1) {
      const x = (i * 89 + Math.sin(t * 0.7 + i) * 18) % 720;
      const y = ((i * 137 + t * 54) % 880) + 40;
      const sparkle = 1.4 + ((i % 4) * 0.7 + Math.max(0, Math.sin(t * 5 + i)) * 2.2) * reveal;
      this.clearSparkles.circle(x, y, sparkle).fill({
        color: i % 3 === 0 ? 0xfff4a8 : i % 3 === 1 ? 0xffc3ec : 0xaefdf2,
        alpha: (0.18 + Math.max(0, Math.sin(t * 4 + i)) * 0.42) * reveal
      });
    }

    this.clearTitle.alpha = reveal;
    this.clearTitle.scale.set(1 + Math.max(0, pulse) * 0.035);
    this.clearTitle.y = 350 + Math.sin(t * 2.6) * 3;
    this.clearStats.alpha = Math.min(1, Math.max(0, (t - 0.22) / 0.55));
    this.clearHint.alpha = Math.min(1, Math.max(0, (t - 0.45) / 0.55));
  }

  private shake(seconds: number, strength: number) {
    this.shakeTime = Math.max(this.shakeTime, seconds);
    this.shakeStrength = Math.max(this.shakeStrength, strength);
  }

  private updateShake(dt: number) {
    if (this.shakeTime <= 0) {
      this.root.position.set(0, 0);
      this.shakeStrength = 0;
      return;
    }

    this.shakeTime = Math.max(0, this.shakeTime - dt);
    const strength = this.shakeStrength * Math.min(1, this.shakeTime * 8);
    this.root.position.set((Math.random() - 0.5) * strength, (Math.random() - 0.5) * strength);
    if (this.shakeTime === 0) {
      this.root.position.set(0, 0);
      this.shakeStrength = 0;
    }
  }

  private spark(x: number, y: number, color: number, count = 12) {
    for (let i = 0; i < count; i += 1) {
      const bit = new Graphics();
      const angle = (Math.PI * 2 * i) / count;
      bit.circle(0, 0, 2 + Math.random() * 4).fill(color);
      bit.position.set(x + Math.cos(angle) * 16, y + Math.sin(angle) * 16);
      bit.alpha = 0.85;
      this.playfield.addChild(bit);

      const life = 0.35 + Math.random() * 0.25;
      let age = 0;
      const tick = (ticker: { deltaMS: number }) => {
        age += ticker.deltaMS / 1000;
        bit.position.x += Math.cos(angle) * 180 * (ticker.deltaMS / 1000);
        bit.position.y += Math.sin(angle) * 180 * (ticker.deltaMS / 1000);
        bit.alpha = Math.max(0, 1 - age / life);
        if (age >= life) {
          this.app.ticker.remove(tick);
          bit.destroy();
        }
      };
      this.app.ticker.add(tick);
    }
  }

  private floatText(text: string, x: number, y: number, color: number) {
    const label = new Text({ text, style: { fill: color, fontSize: 13, fontWeight: "700", letterSpacing: 0 } });
    label.anchor.set(0.5);
    label.position.set(x, y);
    this.playfield.addChild(label);

    let age = 0;
    const life = 0.38;
    const tick = (ticker: { deltaMS: number }) => {
      const dt = ticker.deltaMS / 1000;
      age += dt;
      label.y -= 45 * dt;
      label.alpha = Math.max(0, 1 - age / life);
      if (age >= life) {
        this.app.ticker.remove(tick);
        label.destroy();
      }
    };
    this.app.ticker.add(tick);
  }

  private updateBackground(dt: number) {
    this.backgroundOffset = (this.backgroundOffset + dt * 36) % 960;
    this.drawBackground();

    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - dt);
      this.bombFlash.alpha = this.flashTimer / 0.28;
      if (this.flashTimer === 0) {
        this.bombFlash.clear();
      }
    }
  }

  private drawCollectLine() {
    this.collectLine.clear();
    const active = this.player.pos.y < AUTO_COLLECT_LINE_Y;
    this.collectLine.moveTo(0, AUTO_COLLECT_LINE_Y).lineTo(720, AUTO_COLLECT_LINE_Y).stroke({
      color: active ? 0xfff4a8 : 0xaefdf2,
      width: active ? 2 : 1,
      alpha: active ? 0.52 : 0.2
    });
  }

  private drawBackground() {
    this.background.clear();
    this.background.rect(0, 0, 720, 960).fill(0x0b0613);

    for (let i = 0; i < 80; i += 1) {
      const x = (i * 97) % 720;
      const y = ((i * 173 + this.backgroundOffset) % 1040) - 40;
      const alpha = 0.15 + ((i * 13) % 40) / 120;
      this.background.circle(x, y, 1 + (i % 3)).fill({ color: i % 2 ? 0xffc5ec : 0x96fff5, alpha });
    }

    for (let i = 0; i < 5; i += 1) {
      const y = ((170 + i * 150 + this.backgroundOffset * 0.35) % 1080) - 60;
      this.background.circle(360, y, 70 + i * 8).stroke({ color: 0x7554c8, width: 1, alpha: 0.22 });
      this.background.circle(360, y, 36 + i * 4).stroke({ color: 0xff87c9, width: 1, alpha: 0.17 });

      for (let spoke = 0; spoke < 8; spoke += 1) {
        const angle = (Math.PI * 2 * spoke) / 8 + this.time * 0.18;
        this.background
          .moveTo(360 + Math.cos(angle) * 20, y + Math.sin(angle) * 20)
          .lineTo(360 + Math.cos(angle) * 76, y + Math.sin(angle) * 76)
          .stroke({ color: 0xff87c9, width: 1, alpha: 0.12 });
      }
    }
  }

  private fitTitleArt() {
    const width = this.titleArt.texture.width;
    const height = this.titleArt.texture.height;
    if (width <= 0 || height <= 0) {
      return;
    }

    const scale = Math.min(600 / width, 300 / height, 1);
    this.titleArt.scale.set(scale);
  }
}
