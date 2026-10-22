import type { Input } from "./Input";

type PadButton = {
  className: string;
  label: string;
  key: string;
  text: string;
};

const STORAGE_KEY = "moonlit-spell-barrage.virtualGamepad";
const BUTTONS: readonly PadButton[] = [
  { className: "virtual-gamepad__action--shoot", label: "Shoot", key: "z", text: "Shoot" },
  { className: "virtual-gamepad__action--bomb", label: "Bomb", key: "x", text: "Bomb" },
  { className: "virtual-gamepad__action--focus", label: "Focus", key: "shift", text: "Focus" },
  { className: "virtual-gamepad__action--pause", label: "Pause", key: "escape", text: "Pause" }
];

const DPAD_DIRECTIONS: readonly (readonly string[])[] = [
  ["arrowright"],
  ["arrowright", "arrowdown"],
  ["arrowdown"],
  ["arrowleft", "arrowdown"],
  ["arrowleft"],
  ["arrowleft", "arrowup"],
  ["arrowup"],
  ["arrowright", "arrowup"]
];
const DPAD_DEAD_ZONE = 14;

export class VirtualGamepad {
  private readonly root = document.createElement("div");
  private readonly toggle = document.createElement("button");
  private readonly dpadArea = document.createElement("div");
  private readonly dpadGuide = document.createElement("div");
  private readonly dpadStick = document.createElement("div");
  private readonly pointerKeys = new Map<number, readonly string[]>();
  private readonly keyHoldCounts = new Map<string, number>();
  private dpadPointerId: number | null = null;
  private dpadOrigin = { x: 0, y: 0 };
  private visible = this.loadInitialVisibility();

  constructor(private readonly input: Input) {
    this.root.className = "virtual-gamepad";
    this.root.setAttribute("aria-label", "Virtual gamepad");

    this.toggle.type = "button";
    this.toggle.className = "virtual-gamepad-toggle";
    this.toggle.textContent = "PAD";
    this.toggle.setAttribute("aria-label", "Toggle virtual gamepad");
    this.toggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.setVisible(!this.visible, true);
    });

    this.root.append(this.createDpad(), this.createActions());
    document.body.append(this.root, this.toggle);
    window.addEventListener("pointercancel", (event) => this.releasePointer(event.pointerId));
    window.addEventListener("blur", () => this.clearActivePointers());
    this.setVisible(this.visible, false);
  }

  private createDpad() {
    this.dpadArea.className = "virtual-gamepad__dpad-area";
    this.dpadArea.setAttribute("aria-label", "Movement area");
    this.dpadGuide.className = "virtual-gamepad__dpad-guide";
    this.dpadStick.className = "virtual-gamepad__dpad-stick";
    this.dpadGuide.appendChild(this.dpadStick);

    this.dpadArea.addEventListener("pointerdown", (event) => {
      if (this.dpadPointerId !== null) {
        return;
      }
      event.preventDefault();
      this.dpadArea.setPointerCapture(event.pointerId);
      this.dpadPointerId = event.pointerId;
      this.dpadOrigin = { x: event.clientX, y: event.clientY };
      this.moveDpadGuide(event.clientX, event.clientY, 0, 0);
      this.pressPointer(event.pointerId, []);
    });
    this.dpadArea.addEventListener("pointermove", (event) => {
      if (this.dpadPointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      const dx = event.clientX - this.dpadOrigin.x;
      const dy = event.clientY - this.dpadOrigin.y;
      this.pressPointer(event.pointerId, this.getDpadKeys(dx, dy));
      this.moveDpadGuide(this.dpadOrigin.x, this.dpadOrigin.y, dx, dy);
    });
    this.dpadArea.addEventListener("pointerup", (event) => {
      event.preventDefault();
      this.releaseDpad(event.pointerId);
    });
    this.dpadArea.addEventListener("pointercancel", (event) => {
      this.releaseDpad(event.pointerId);
    });
    this.dpadArea.addEventListener("lostpointercapture", (event) => {
      this.releaseDpad(event.pointerId);
    });
    this.dpadArea.appendChild(this.dpadGuide);
    return this.dpadArea;
  }

  private createActions() {
    const actions = document.createElement("div");
    actions.className = "virtual-gamepad__actions";

    for (const button of BUTTONS) {
      actions.appendChild(this.createButton(button, "virtual-gamepad__action"));
    }

    return actions;
  }

  private createButton(button: PadButton, baseClass: string) {
    const element = document.createElement("button");
    element.type = "button";
    element.className = `${baseClass} ${button.className}`;
    element.textContent = button.text;
    element.setAttribute("aria-label", button.label);
    element.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      element.setPointerCapture(event.pointerId);
      this.pressPointer(event.pointerId, [button.key]);
      element.classList.add("is-pressed");
    });
    element.addEventListener("pointerup", (event) => {
      event.preventDefault();
      this.releasePointer(event.pointerId);
      element.classList.remove("is-pressed");
    });
    element.addEventListener("pointercancel", (event) => {
      this.releasePointer(event.pointerId);
      element.classList.remove("is-pressed");
    });
    element.addEventListener("lostpointercapture", (event) => {
      this.releasePointer(event.pointerId);
      element.classList.remove("is-pressed");
    });
    return element;
  }

  private pressPointer(pointerId: number, keys: readonly string[]) {
    const previousKeys = this.pointerKeys.get(pointerId) ?? [];
    if (this.sameKeys(previousKeys, keys)) {
      return;
    }
    for (const key of previousKeys) {
      this.releaseKey(key);
    }
    this.pointerKeys.set(pointerId, keys);
    for (const key of keys) {
      this.keyHoldCounts.set(key, (this.keyHoldCounts.get(key) ?? 0) + 1);
      this.input.setVirtualKey(key, true);
    }
  }

  private releasePointer(pointerId: number) {
    const keys = this.pointerKeys.get(pointerId);
    if (!keys) {
      return;
    }
    this.pointerKeys.delete(pointerId);
    for (const key of keys) {
      this.releaseKey(key);
    }
  }

  private releaseKey(key: string) {
    const count = Math.max(0, (this.keyHoldCounts.get(key) ?? 0) - 1);
    if (count > 0) {
      this.keyHoldCounts.set(key, count);
      return;
    }
    this.keyHoldCounts.delete(key);
    this.input.setVirtualKey(key, false);
  }

  private clearActivePointers() {
    this.pointerKeys.clear();
    this.keyHoldCounts.clear();
    this.dpadPointerId = null;
    this.input.clearVirtualKeys();
    this.dpadGuide.classList.remove("is-active");
    for (const element of this.root.querySelectorAll(".is-pressed")) {
      element.classList.remove("is-pressed");
    }
  }

  private releaseDpad(pointerId: number) {
    if (this.dpadPointerId !== pointerId) {
      return;
    }
    this.releasePointer(pointerId);
    this.dpadPointerId = null;
    this.dpadGuide.classList.remove("is-active");
  }

  private getDpadKeys(dx: number, dy: number) {
    if (Math.hypot(dx, dy) < DPAD_DEAD_ZONE) {
      return [];
    }

    const angle = Math.atan2(dy, dx);
    const directionIndex = (Math.round(angle / (Math.PI / 4)) + 8) % 8;
    return DPAD_DIRECTIONS[directionIndex];
  }

  private moveDpadGuide(originX: number, originY: number, dx: number, dy: number) {
    const maxStickOffset = 34;
    const length = Math.hypot(dx, dy);
    const scale = length > 0 ? Math.min(maxStickOffset, length) / length : 0;
    this.dpadGuide.style.left = `${originX}px`;
    this.dpadGuide.style.top = `${originY}px`;
    this.dpadStick.style.transform = `translate(calc(-50% + ${dx * scale}px), calc(-50% + ${dy * scale}px))`;
    this.dpadGuide.classList.add("is-active");
  }

  private sameKeys(left: readonly string[], right: readonly string[]) {
    return left.length === right.length && left.every((key) => right.includes(key));
  }

  private setVisible(visible: boolean, persist: boolean) {
    this.visible = visible;
    this.root.classList.toggle("is-hidden", !visible);
    this.toggle.classList.toggle("is-active", visible);
    this.toggle.setAttribute("aria-pressed", String(visible));
    if (!visible) {
      this.clearActivePointers();
    }
    if (persist) {
      localStorage.setItem(STORAGE_KEY, visible ? "visible" : "hidden");
    }
  }

  private loadInitialVisibility() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "visible") {
      return true;
    }
    if (stored === "hidden") {
      return false;
    }
    return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  }
}
