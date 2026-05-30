export class Input {
  private readonly keys = new Set<string>();
  private readonly pressed = new Set<string>();
  private pointerPressed = false;

  constructor() {
    window.addEventListener("keydown", (event) => {
      const key = this.normalize(event.key);
      if (!this.keys.has(key)) {
        this.pressed.add(key);
      }
      this.keys.add(key);

      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "z", "x", "m", "r", "shift"].includes(key)) {
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(this.normalize(event.key));
    });

    window.addEventListener("pointerdown", () => {
      this.pointerPressed = true;
    });
  }

  isDown(...keys: string[]) {
    return keys.some((key) => this.keys.has(this.normalize(key)));
  }

  wasPressed(...keys: string[]) {
    return keys.some((key) => this.pressed.has(this.normalize(key)));
  }

  wasAnyPressed() {
    return this.pointerPressed || this.pressed.size > 0;
  }

  endFrame() {
    this.pressed.clear();
    this.pointerPressed = false;
  }

  private normalize(key: string) {
    if (key === " ") {
      return " ";
    }
    return key.toLowerCase();
  }
}
