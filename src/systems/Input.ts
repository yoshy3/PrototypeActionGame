export class Input {
  private readonly keyboardKeys = new Set<string>();
  private readonly gamepadKeys = new Set<string>();
  private readonly virtualKeys = new Set<string>();
  private readonly pressed = new Set<string>();
  private pointerPressed = false;
  private readonly gamepadAxisThreshold = 0.45;

  constructor() {
    window.addEventListener("keydown", (event) => {
      const key = this.normalize(event.key);
      if (!this.isKeyDown(key)) {
        this.pressed.add(key);
      }
      this.keyboardKeys.add(key);

      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "z", "x", "m", "r", "shift"].includes(key)) {
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      this.keyboardKeys.delete(this.normalize(event.key));
    });

    window.addEventListener("pointerdown", () => {
      this.pointerPressed = true;
    });

    window.addEventListener("blur", () => {
      this.clearVirtualKeys();
    });
  }

  update() {
    const previousGamepadKeys = new Set(this.gamepadKeys);
    this.gamepadKeys.clear();

    for (const gamepad of navigator.getGamepads()) {
      if (!gamepad) {
        continue;
      }

      this.addGamepadButton(gamepad, 0, "z");
      this.addGamepadButton(gamepad, 2, "x");
      this.addGamepadButton(gamepad, 5, "shift");
      this.addGamepadButton(gamepad, 9, "escape");
      this.addGamepadButton(gamepad, 12, "arrowup");
      this.addGamepadButton(gamepad, 13, "arrowdown");
      this.addGamepadButton(gamepad, 14, "arrowleft");
      this.addGamepadButton(gamepad, 15, "arrowright");

      const horizontal = gamepad.axes[0] ?? 0;
      const vertical = gamepad.axes[1] ?? 0;

      if (horizontal <= -this.gamepadAxisThreshold) {
        this.gamepadKeys.add("arrowleft");
      } else if (horizontal >= this.gamepadAxisThreshold) {
        this.gamepadKeys.add("arrowright");
      }

      if (vertical <= -this.gamepadAxisThreshold) {
        this.gamepadKeys.add("arrowup");
      } else if (vertical >= this.gamepadAxisThreshold) {
        this.gamepadKeys.add("arrowdown");
      }
    }

    for (const key of this.gamepadKeys) {
      if (!previousGamepadKeys.has(key) && !this.keyboardKeys.has(key)) {
        this.pressed.add(key);
      }
    }
  }

  isDown(...keys: string[]) {
    return keys.some((key) => this.isKeyDown(this.normalize(key)));
  }

  wasPressed(...keys: string[]) {
    return keys.some((key) => this.pressed.has(this.normalize(key)));
  }

  wasAnyPressed() {
    return this.pointerPressed || this.pressed.size > 0;
  }

  setVirtualKey(key: string, down: boolean) {
    const normalized = this.normalize(key);
    if (down) {
      if (!this.isKeyDown(normalized)) {
        this.pressed.add(normalized);
      }
      this.virtualKeys.add(normalized);
    } else {
      this.virtualKeys.delete(normalized);
    }
  }

  clearVirtualKeys() {
    this.virtualKeys.clear();
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

  private isKeyDown(key: string) {
    return this.keyboardKeys.has(key) || this.gamepadKeys.has(key) || this.virtualKeys.has(key);
  }

  private addGamepadButton(gamepad: Gamepad, buttonIndex: number, key: string) {
    if (gamepad.buttons[buttonIndex]?.pressed) {
      this.gamepadKeys.add(key);
    }
  }
}
