type WaveType = OscillatorType;

export class AudioSystem {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private lastShotAt = 0;
  private muted = false;

  resume() {
    const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    if (!this.context) {
      this.context = new AudioContextCtor();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.16;
      this.master.connect(this.context.destination);
    }

    void this.context.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.16, this.context.currentTime, 0.01);
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  shot() {
    const now = this.context?.currentTime ?? 0;
    if (now - this.lastShotAt < 0.055) {
      return;
    }
    this.lastShotAt = now;
    this.tone(880, 0.045, "triangle", 0.08, -220);
  }

  enemyDown() {
    this.tone(420, 0.09, "sine", 0.12, -260);
    this.tone(720, 0.08, "triangle", 0.07, -360);
  }

  playerHit() {
    this.tone(160, 0.25, "sawtooth", 0.16, -100);
    this.noise(0.15, 0.12);
  }

  graze() {
    this.tone(1320, 0.035, "sine", 0.035, -180);
  }

  bomb() {
    this.tone(220, 0.42, "sine", 0.22, 520);
    this.tone(660, 0.24, "triangle", 0.14, -140);
    this.noise(0.32, 0.08);
  }

  bossAppear() {
    this.tone(180, 0.18, "sine", 0.16, 80);
    this.tone(360, 0.38, "triangle", 0.12, 240);
  }

  spellChange() {
    this.tone(330, 0.12, "triangle", 0.12, 220);
    window.setTimeout(() => this.tone(660, 0.18, "triangle", 0.1, -80), 95);
    this.noise(0.12, 0.055);
  }

  clear() {
    this.tone(523.25, 0.14, "triangle", 0.12, 0);
    window.setTimeout(() => this.tone(659.25, 0.14, "triangle", 0.12, 0), 110);
    window.setTimeout(() => this.tone(783.99, 0.28, "triangle", 0.12, 0), 220);
  }

  private tone(frequency: number, duration: number, type: WaveType, volume: number, slide: number) {
    if (!this.context || !this.master || this.muted) {
      return;
    }

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.linearRampToValueAtTime(Math.max(40, frequency + slide), now + duration);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  private noise(duration: number, volume: number) {
    if (!this.context || !this.master || this.muted) {
      return;
    }

    const sampleRate = this.context.sampleRate;
    const buffer = this.context.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
    }

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.master);
    source.start();
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
