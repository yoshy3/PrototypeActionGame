import { Container, Graphics, Text } from "pixi.js";
import { getLocale, t } from "./I18n";

export type HudData = {
  lives: number; bombs: number; power: number; level: number; score: number; best: number;
  graze: number; difficulty: string; nextExtend: number; muted: boolean;
  stage: string; subtitle: string; progress: number;
  boss?: { name: string; spell: string; hp: number; maxHp: number; phase: number; thresholds: number[] };
  canChangeLanguage: boolean; inRun: boolean;
};

export class RemasterHud {
  readonly container = new Container();
  private readonly player = this.label(60, 180, 34);
  private readonly controls = this.label(60, 625, 25);
  private readonly records = this.label(1420, 180, 30);
  private readonly encounter = this.label(1420, 650, 28);
  private readonly tip = this.label(1420, 970, 24);
  private readonly bars = new Graphics();
  private readonly language = this.label(82, 986, 26);
  private readonly languageBackground = new Graphics();
  private readonly languageKeys = new Container();

  constructor(onLanguage: () => void) {
    const background = new Graphics().rect(0, 0, 1920, 1080).fill(0x100c1d);
    for (const x of [32, 1397]) {
      background.roundRect(x, 135, 491, 810, 18).fill({ color: 0x21172f, alpha: 0.9 });
      background.moveTo(x + 28, 155).lineTo(x + 463, 155).stroke({ color: 0xff87c9, alpha: 0.5, width: 2 });
    }
    const title = this.label(60, 46, 30);
    title.text = "MOONLIT\nSPELL BARRAGE";
    this.languageBackground.roundRect(60, 970, 435, 64, 12).fill(0x3a254e).stroke({ color: 0xaefdf2, width: 1, alpha: 0.5 });
    this.languageBackground.eventMode = "static";
    this.languageBackground.cursor = "pointer";
    this.languageBackground.on("pointertap", onLanguage);
    this.language.eventMode = "none";
    // A square keyboard key and a controller silhouette distinguish the two inputs.
    const keys = new Graphics().roundRect(350, 985, 34, 34, 5).stroke({ color: 0xffedf9, width: 2 });
    keys.roundRect(405, 982, 72, 40, 13).fill(0x17111f).stroke({ color: 0xffedf9, width: 2 });
    keys.moveTo(418, 994).lineTo(418, 1010).moveTo(410, 1002).lineTo(426, 1002).stroke({ color: 0xffedf9, width: 3 });
    keys.circle(457, 1002, 12).fill(0xffd477);
    const keyL = new Text({ text: "L", style: { fontSize: 22, fill: 0xffffff } });
    keyL.anchor.set(0.5); keyL.position.set(367, 1002);
    const keyY = new Text({ text: "Y", style: { fontSize: 18, fill: 0x17111f, fontWeight: "700" } });
    keyY.anchor.set(0.5); keyY.position.set(457, 1002);
    this.languageKeys.addChild(keys, keyL, keyY);
    this.languageKeys.eventMode = "none";
    this.container.addChild(background, title, this.player, this.controls, this.records, this.encounter, this.tip, this.bars, this.languageBackground, this.language, this.languageKeys);
  }

  private label(x: number, y: number, size: number) {
    const text = new Text({ text: "", style: { fontSize: size, fill: 0xffedf9, lineHeight: size * 1.5, wordWrap: true, wordWrapWidth: 435 } });
    text.position.set(x, y);
    return text;
  }

  update(data: HudData) {
    const number = (value: number) => Math.floor(value).toLocaleString(getLocale());
    this.player.text = `${t("Player")}\n\n${t("Lives")}   ${data.inRun ? data.lives : "—"}\n${t("Bombs")}   ${data.inRun ? data.bombs : "—"}\n${t("Shot level")}   Lv${data.level}\n${t("Power")}   ${data.power} / 120`;
    this.controls.text = [t("Controls"), t("Move: Arrow / WASD / Pad"), t("Shoot: Z / Space / Pad A"), t("Bomb: X / Pad X"), t("Focus: Shift / RB"), t("Pause: Esc / Start"), `${t("Sound: M")} · ${t(data.muted ? "Sound Off" : "Sound On")}`].join("\n");
    this.records.text = `${t("Records")}\n${t("Difficulty")}   ${data.difficulty}\n\n${t("Score")}   ${number(data.score)}\n${t("Best")}   ${number(data.best)}\n${t("Graze")}   ${number(data.graze)}\n${t("Next extend")}\n${number(data.nextExtend)}`;
    this.encounter.text = data.boss
      ? `${data.boss.name}\n${t("Phase")} ${data.boss.phase} / 5\n${data.boss.spell}\n${Math.ceil(data.boss.hp)} / ${Math.ceil(data.boss.maxHp)} HP`
      : `${data.stage}\n${data.subtitle}\n${t("Stage progress")}  ${Math.floor(data.progress * 100)}%`;
    this.language.text = getLocale() === "ja" ? "日本語 → English" : "English → 日本語";
    this.tip.text = t(data.inRun ? "Auto-collect above the line" : "Graze bullets for bonus score");
    this.languageBackground.visible = this.language.visible = this.languageKeys.visible = data.canChangeLanguage;
    this.bars.clear();
    this.bar(60, 550, data.power / 120, 0xfff4a8);
    if (data.inRun) this.bar(1420, 895, data.boss ? data.boss.hp / data.boss.maxHp : data.progress, data.boss ? 0xff72bd : 0xaefdf2);
    if (data.inRun && data.boss) {
      for (const ratio of data.boss.thresholds) this.bars.moveTo(1420 + 435 * ratio, 891).lineTo(1420 + 435 * ratio, 911).stroke({ color: 0xffffff, width: 2 });
    }
  }

  private bar(x: number, y: number, ratio: number, color: number) {
    this.bars.roundRect(x, y, 435, 12, 6).fill({ color: 0xffffff, alpha: 0.12 });
    this.bars.roundRect(x, y, 435 * Math.max(0, Math.min(1, ratio)), 12, 6).fill(color);
  }
}
