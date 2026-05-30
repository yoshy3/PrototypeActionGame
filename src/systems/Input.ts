export class Input {
  private readonly keys = new Set<string>();
  private readonly pressed = new Set<string>();

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
  }

  isDown(...keys: string[]) {
    return keys.some((key) => this.keys.has(this.normalize(key)));
  }

  wasPressed(...keys: string[]) {
    return keys.some((key) => this.pressed.has(this.normalize(key)));
  }

  endFrame() {
    this.pressed.clear();
  }

  private normalize(key: string) {
    if (key === " ") {
      return " ";
    }
    return key.toLowerCase();
  }
}
