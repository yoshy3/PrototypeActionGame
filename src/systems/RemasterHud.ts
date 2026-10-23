import { Container, Graphics, Text } from "pixi.js";
import { version as packageVersion } from "../../package.json";
import { getLocale, t, UI_FONT, type MessageKey } from "./I18n";

export type HudData = {
  lives: number; bombs: number; power: number; level: number; score: number; best: number;
  graze: number; difficulty: string; nextExtend: number; muted: boolean;
  stage: string; subtitle: string; progress: number;
  boss?: { name: string; spell: string; hp: number; maxHp: number; phase: number; thresholds: number[] };
  canChangeLanguage: boolean; inRun: boolean;
};

const GOLD = 0xcbb17d, IVORY = 0xfff2da, PINK = 0xff88cb, PANEL = 0x131122;
const SERIF = ["Yu Mincho", "Noto Serif JP", "Georgia", "serif"];

/** All coordinates belong to the shared 1920 × 1080 canvas, including hit targets. */
export class RemasterHud {
  readonly container = new Container();
  private readonly decoration = new Graphics();
  private readonly meters = new Graphics();
  private readonly fields = new Map<string, Text>();
  private readonly translated: { text: Text; key: MessageKey; width: number }[] = [];
  private readonly languageButton = new Container();
  private lastData = "";

  constructor(onLanguage: () => void) {
    this.container.addChild(this.decoration, this.meters);
    const g = this.decoration;
    g.rect(0, 0, 1920, 1080).fill(0x0c0b18);
    this.panel(16, 16, 523, 608);
    this.panel(16, 638, 523, 426);
    this.panel(1381, 16, 523, 548);
    this.panel(1381, 580, 523, 378);
    this.panel(1381, 974, 523, 90);
    for (const [x, y, r] of [[101, 99, 65], [460, 940, 67], [1820, 302, 78], [1810, 690, 84]]) this.sigil(x, y, r);
    for (const [x, y] of [[340, 170], [350, 656], [1754, 147]]) {
      const points = [[0, 0], [32, 18], [92, 9], [133, 42], [110, 89]];
      g.moveTo(x, y);
      for (const [dx, dy] of points.slice(1)) g.lineTo(x + dx, y + dy);
      g.stroke({ color: GOLD, alpha: 0.15, width: 1 });
      for (const [dx, dy] of points) {
        g.circle(x + dx, y + dy, 2).fill({ color: GOLD, alpha: 0.35 });
      }
    }
    this.moon(g, 94, 91, 43, GOLD);
    this.star(g, 135, 80, 13, IVORY);
    const version = this.label("version", `Version ${import.meta.env.VITE_APP_VERSION ?? packageVersion}`, 55, 26, 16, 190, false, GOLD);
    version.alpha = 0.5;
    this.label("title", "MOONLIT", 168, 43, 49, 342, true);
    this.label("subtitle", "SPELL BARRAGE", 170, 104, 26, 339, true);
    this.rule(46, 168, 463);
    this.heading("Player", 46, 188);
    this.local("Lives", 53, 270, 26, 120);
    this.local("Bombs", 53, 334, 26, 120);
    this.label("lives", "", 462, 260, 36, 48, true);
    this.label("bombs", "", 462, 324, 36, 48, true);
    this.rule(46, 402, 463);
    this.local("Shot level", 53, 425, 23, 200);
    this.label("level", "", 398, 416, 43, 108, true);
    this.local("Power", 53, 493, 24, 110);
    this.label("power", "", 186, 488, 30, 230, true);
    this.label("max", "", 447, 497, 20, 61, true, GOLD);
    this.heading("Controls", 46, 655);
    const rows: [MessageKey, string[], number][] = [
      ["Move", ["WASD", "↑↓←→", "✛"], 724],
      ["Shoot", ["Z", "Space", "A"], 774],
      ["Bomb", ["X", "X"], 824],
      ["Focus", ["Shift", "RB"], 874],
      ["Pause", ["Esc", "Start"], 924]
    ];
    for (const [key, keys, y] of rows) {
      this.local(key, 53, y + 4, 23, 125);
      let x = 200;
      keys.forEach((value, index) => {
        const controller = index === keys.length - 1;
        const width = value.length > 1 ? (value === "↑↓←→" ? 106 : 86) : 40;
        this.keycap(value, x, y, width, controller);
        x += width + 16;
      });
    }
    this.rule(46, 980, 463);
    this.label("sound", "", 100, 1003, 23, 330);
    // Speaker pictogram, distinct from the keyboard shortcut.
    g.poly([53, 1016, 63, 1016, 76, 1006, 76, 1037, 63, 1027, 53, 1027]).fill(GOLD);
    g.moveTo(83, 1010).quadraticCurveTo(96, 1021, 83, 1033).stroke({ color: GOLD, width: 2 });
    this.keycap("M", 460, 1000, 38);

    this.heading("Records", 1411, 54);
    g.roundRect(1700, 57, 174, 42, 8).fill(0x282035).stroke({ color: PINK, alpha: 0.65, width: 1 });
    this.label("difficulty", "", 1711, 65, 22, 152, true, PINK);
    this.local("Score", 1420, 153, 29, 430);
    this.label("score", "", 1420, 193, 86, 454, true);
    this.rule(1411, 303, 463);
    this.local("Best", 1420, 327, 24, 205);
    this.label("best", "", 1635, 319, 35, 239, true);
    this.rule(1411, 385, 463);
    this.local("Graze", 1420, 418, 23, 155);
    this.label("graze", "", 1420, 463, 40, 165, true);
    g.moveTo(1610, 418).lineTo(1610, 522).stroke({ color: GOLD, alpha: 0.5, width: 1 });
    this.local("Next extend", 1635, 418, 22, 239);
    this.label("extend", "", 1635, 463, 40, 239, true);

    this.label("encounterKind", "", 1455, 605, 22, 390, true, GOLD);
    this.moon(g, 1429, 620, 15, GOLD);
    this.rule(1411, 651, 463);
    this.label("encounter", "", 1420, 668, 38, 454, true);
    this.label("spell", "", 1420, 724, 27, 454, true, PINK);
    this.label("phase", "", 1420, 791, 23, 210);
    this.label("hp", "", 1420, 900, 25, 454, true);
    this.label("tip", "", 1418, 1006, 22, 450);

    // The title-only language button replaces the sound row at the same position.
    const button = new Graphics().roundRect(46, 987, 463, 62, 8).fill(0x292238).stroke({ color: GOLD, width: 1 });
    this.languageButton.addChild(button);
    const language = this.label("language", "", 64, 1004, 24, 270);
    this.languageButton.addChild(language);
    const key = this.label("languageKey", "L", 366, 1004, 24, 30);
    const pad = this.label("languagePad", "Y", 465, 1006, 20, 22, false, PANEL);
    const input = new Graphics().roundRect(355, 998, 38, 38, 5).stroke({ color: IVORY, width: 1 });
    input.roundRect(412, 998, 83, 38, 12).stroke({ color: IVORY, width: 1 });
    input.moveTo(429, 1008).lineTo(429, 1026).moveTo(420, 1017).lineTo(438, 1017).stroke({ color: IVORY, width: 2 });
    input.circle(473, 1017, 13).fill(GOLD);
    this.languageButton.addChild(input, key, pad);
    this.languageButton.eventMode = "static";
    this.languageButton.cursor = "pointer";
    this.languageButton.on("pointertap", onLanguage);
    this.container.addChild(this.languageButton);
  }

  private label(id: string, value: string, x: number, y: number, size: number, width: number, serif = false, color = IVORY) {
    const text = new Text({ text: value, style: { fontFamily: serif ? SERIF : UI_FONT, fontSize: size, fill: color, fontWeight: serif ? "600" : "400" } });
    text.position.set(x, y);
    text.eventMode = "none";
    this.container.addChild(text);
    this.fields.set(id, text);
    this.fit(text, width);
    return text;
  }

  private fit(text: Text, width: number) {
    text.scale.set(1);
    if (text.width > width) text.scale.set(width / text.width);
  }

  private local(key: MessageKey, x: number, y: number, size: number, width: number, serif = false) {
    const text = this.label(`label-${key}`, t(key), x, y, size, width, serif);
    this.translated.push({ text, key, width });
  }

  private heading(key: MessageKey, x: number, y: number) {
    this.moon(this.decoration, x + 18, y + 20, 18, GOLD);
    this.local(key, x + 50, y, 31, 230, true);
    this.rule(x, y + 56, 463);
  }

  private rule(x: number, y: number, width: number) {
    this.decoration.moveTo(x, y).lineTo(x + width, y).stroke({ color: GOLD, alpha: 0.7, width: 1 });
    this.star(this.decoration, x, y, 3, GOLD);
    this.star(this.decoration, x + width, y, 3, GOLD);
  }

  private panel(x: number, y: number, width: number, height: number) {
    const g = this.decoration;
    g.roundRect(x, y, width, height, 14).fill(PANEL).stroke({ color: GOLD, alpha: 0.75, width: 1.5 });
    g.roundRect(x + 6, y + 6, width - 12, height - 12, 10).stroke({ color: GOLD, alpha: 0.3, width: 1 });
    for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + width, y, -1, 1], [x, y + height, 1, -1], [x + width, y + height, -1, -1]]) {
      g.moveTo(cx + dx * 10, cy + dy * 43).lineTo(cx + dx * 16, cy + dy * 16).lineTo(cx + dx * 43, cy + dy * 10).stroke({ color: GOLD, width: 1 });
      this.star(g, cx + dx * 21, cy + dy * 21, 6, GOLD);
    }
  }

  private star(g: Graphics, x: number, y: number, r: number, color: number) {
    g.poly([x, y - r, x + r * 0.28, y - r * 0.28, x + r, y, x + r * 0.28, y + r * 0.28, x, y + r, x - r * 0.28, y + r * 0.28, x - r, y, x - r * 0.28, y - r * 0.28]).fill(color);
  }

  private moon(g: Graphics, x: number, y: number, r: number, color: number) {
    g.circle(x, y, r).fill(color);
    g.circle(x + r * 0.43, y - r * 0.3, r * 0.84).fill(PANEL);
  }

  private sigil(x: number, y: number, r: number) {
    const g = this.decoration;
    for (const scale of [0.45, 0.78, 1]) g.circle(x, y, r * scale).stroke({ color: GOLD, alpha: 0.12, width: 1 });
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      g.moveTo(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45).lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r).stroke({ color: GOLD, alpha: 0.12, width: 1 });
    }
  }

  private keycap(value: string, x: number, y: number, width: number, controller = false) {
    this.decoration.roundRect(x, y, width, 36, controller ? 14 : 4).fill(0x0c0b18).stroke({ color: controller ? PINK : 0xaaa3b7, width: 1 });
    const text = this.label(`key-${x}-${y}`, value, x + 7, y + 4, 21, width - 14, false, controller ? PINK : IVORY);
    text.x = x + (width - text.width) / 2;
  }

  update(data: HudData) {
    // Static frames and keycaps are built once; redraw meters only when values change.
    const signature = JSON.stringify([getLocale(), data]);
    if (signature === this.lastData) return;
    this.lastData = signature;
    const number = (value: number) => Math.floor(value).toLocaleString(getLocale());
    const set = (id: string, value: string, width: number) => {
      const text = this.fields.get(id)!;
      text.text = value;
      this.fit(text, width);
    };
    for (const { text, key, width } of this.translated) { text.text = t(key); this.fit(text, width); }
    set("lives", data.inRun ? number(data.lives) : "—", 48);
    set("bombs", data.inRun ? number(data.bombs) : "—", 48);
    set("level", `Lv ${data.level}`, 108);
    set("power", `${data.power} / 120`, 230);
    set("max", data.power >= 120 ? "MAX" : "", 61);
    set("sound", t(data.muted ? "Sound Off" : "Sound On"), 330);
    set("difficulty", data.difficulty, 152);
    set("score", number(data.score), 454);
    set("best", number(data.best), 239);
    set("graze", number(data.graze), 165);
    set("extend", number(data.nextExtend), 239);
    set("encounterKind", data.inRun ? t(data.boss ? "Boss" : "Stage progress") : "", 390);
    set("encounter", data.inRun ? data.boss?.name ?? data.stage : "", 454);
    set("spell", data.inRun ? data.boss?.spell ?? data.subtitle : "", 454);
    set("phase", data.inRun ? (data.boss ? `${t("Phase")} ${data.boss.phase} / 5` : `${Math.floor(data.progress * 100)}%`) : "", 210);
    set("hp", data.inRun && data.boss ? `${Math.ceil(data.boss.hp)} / ${Math.ceil(data.boss.maxHp)} HP` : "", 454);
    const hp = this.fields.get("hp")!;
    hp.x = 1420 + (454 - hp.width) / 2;
    set("tip", t(data.inRun ? "Auto-collect above the line" : "Graze bullets for bonus score"), 450);
    set("language", getLocale() === "ja" ? "日本語 → English" : "English → 日本語", 270);
    this.languageButton.visible = data.canChangeLanguage;
    this.meters.clear();
    for (let i = 0; i < Math.min(5, data.inRun ? data.lives : 0); i++) this.moon(this.meters, 205 + i * 48, 288, 17, PINK);
    for (let i = 0; i < Math.min(5, data.inRun ? data.bombs : 0); i++) this.star(this.meters, 205 + i * 48, 352, 17, IVORY);
    // The adjacent numeric counts remain authoritative when there are more than five.
    for (let i = 0; i < 4; i++) this.diamond(275 + i * 26, 445, 8, i < data.level, GOLD);
    this.bar(53, 551, 447, data.power / 120, 0xffe6a2);
    for (let i = 1; i < 4; i++) this.meters.moveTo(53 + 447 * i / 4, 553).lineTo(53 + 447 * i / 4, 569).stroke({ color: PANEL, width: 2 });
    if (data.inRun) {
      this.bar(1420, 858, 454, data.boss ? data.boss.hp / data.boss.maxHp : data.progress, data.boss ? PINK : 0xaefdf2);
      if (data.boss) {
        for (let i = 0; i < 5; i++) this.diamond(1660 + i * 47, 807, 7, i < data.boss.phase, PINK);
        for (const ratio of data.boss.thresholds) this.meters.moveTo(1420 + 454 * ratio, 859).lineTo(1420 + 454 * ratio, 877).stroke({ color: IVORY, alpha: 0.6, width: 1 });
      }
    }
  }

  private diamond(x: number, y: number, radius: number, active: boolean, color: number) {
    this.meters.poly([x, y - radius, x + radius, y, x, y + radius, x - radius, y]).fill(active ? color : PANEL).stroke({ color: GOLD, width: 1 });
  }

  private bar(x: number, y: number, width: number, ratio: number, color: number) {
    const g = this.meters;
    g.roundRect(x - 5, y - 4, width + 10, 28, 4).stroke({ color: GOLD, width: 1.5 });
    g.roundRect(x, y, width, 20, 4).fill(0x393043);
    const fillWidth = width * Math.max(0, Math.min(1, ratio));
    if (fillWidth > 0) {
      g.rect(x, y + 2, fillWidth, 16).fill(color);
      g.rect(x, y + 3, fillWidth, 4).fill({ color: 0xffffff, alpha: 0.35 });
    }
    this.diamond(x - 5, y + 10, 5, false, GOLD);
    this.diamond(x + width + 5, y + 10, 5, false, GOLD);
  }
}
