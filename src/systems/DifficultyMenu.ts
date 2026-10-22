import { Container, Graphics, Text } from "pixi.js";
import { difficulties } from "./Difficulty";
import { t } from "./I18n";

export class DifficultyMenu {
  readonly container = new Container();
  private readonly heading = new Text({ style: { fontSize: 30, fill: 0xffffff, fontWeight: "700" } });
  private readonly rows: Text[] = [];
  private readonly confirm = new Text({ style: { fontSize: 24, fill: 0xaefdf2 } });
  private readonly back = new Text({ style: { fontSize: 20, fill: 0xaefdf2 } });
  private readonly help = new Text({ style: { fontSize: 18, fill: 0xffedf9, align: "center" } });

  constructor(onSelect: (index: number) => void, onConfirm: () => void, onBack: () => void) {
    this.container.visible = false;
    const panel = new Graphics().roundRect(65, 330, 590, 540, 20).fill({ color: 0x170f25, alpha: 0.97 });
    this.container.addChild(panel);
    this.heading.anchor.set(0.5); this.heading.position.set(360, 375);
    this.container.addChild(this.heading);
    difficulties.forEach((_, index) => {
      const row = new Text({ style: { fontSize: 28, fill: 0xffffff } });
      row.anchor.set(0.5); row.position.set(360, 440 + index * 60);
      row.eventMode = "static"; row.cursor = "pointer";
      row.on("pointertap", () => onSelect(index));
      this.rows.push(row); this.container.addChild(row);
    });
    this.confirm.anchor.set(0.5); this.confirm.position.set(360, 720);
    this.back.anchor.set(0.5); this.back.position.set(360, 770);
    this.help.anchor.set(0.5); this.help.position.set(360, 822);
    for (const [button, callback] of [[this.confirm, onConfirm], [this.back, onBack]] as const) {
      button.eventMode = "static"; button.cursor = "pointer"; button.on("pointertap", callback);
    }
    this.container.addChild(this.confirm, this.back, this.help);
  }

  refresh(selected: number) {
    this.heading.text = t("Select difficulty");
    this.rows.forEach((row, index) => {
      row.text = `${index === selected ? "▶ " : ""}${t(difficulties[index].label)}`;
      row.style.fill = index === selected ? 0xffd477 : 0xffedf9;
    });
    this.confirm.text = t("Confirm difficulty");
    this.back.text = t("Back to title");
    this.help.text = t("Difficulty menu controls");
  }
}
