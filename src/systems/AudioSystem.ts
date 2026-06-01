type WaveType = OscillatorType;
export type MusicTrackId =
  | "title"
  | "stage"
  | "stage2"
  | "stage3"
  | "stage4"
  | "boss"
  | "lastBoss"
  | "clear"
  | "ending"
  | "gameover";

const titleMusicUrl = new URL("../assets/audio/title.mp3", import.meta.url).href;
const stageMusicUrl = new URL("../assets/audio/stage.mp3", import.meta.url).href;
const stage2MusicUrl = new URL("../assets/audio/stage2.mp3", import.meta.url).href;
const stage3MusicUrl = new URL("../assets/audio/stage3.mp3", import.meta.url).href;
const stage4MusicUrl = new URL("../assets/audio/stage4.mp3", import.meta.url).href;
const bossMusicUrl = new URL("../assets/audio/boss.mp3", import.meta.url).href;
const lastBossMusicUrl = new URL("../assets/audio/last-boss.mp3", import.meta.url).href;
const clearMusicUrl = new URL("../assets/audio/clear.mp3", import.meta.url).href;
const endingMusicUrl = new URL("../assets/audio/ending.mp3", import.meta.url).href;
const gameOverMusicUrl = new URL("../assets/audio/game-over.mp3", import.meta.url).href;
const shootSfxUrl = new URL("../assets/audio/sfx/shoot.wav", import.meta.url).href;
const defeatSfxUrl = new URL("../assets/audio/sfx/defeat.wav", import.meta.url).href;
const defeatedSfxUrl = new URL("../assets/audio/sfx/defeated.wav", import.meta.url).href;
const bombSfxUrl = new URL("../assets/audio/sfx/bomb.wav", import.meta.url).href;
const spellSwitchSfxUrl = new URL("../assets/audio/sfx/spell-switch.wav", import.meta.url).href;
const warningSfxUrl = new URL("../assets/audio/sfx/warning.wav", import.meta.url).href;
const getItemSfxUrl = new URL("../assets/audio/sfx/get-item.wav", import.meta.url).href;
const powerUpSfxUrl = new URL("../assets/audio/sfx/power-up.wav", import.meta.url).href;
const bossAppearSfxUrl = new URL("../assets/audio/sfx/boss-appear.wav", import.meta.url).href;
const defeatBossSfxUrl = new URL("../assets/audio/sfx/defeat-boss.wav", import.meta.url).href;

type GeneratedMusicTrack = {
  mode: "generated";
  bpm: number;
  volume: number;
  lead: readonly number[];
  bass: readonly number[];
  pad: readonly number[];
  leadWave: WaveType;
};

type AssetMusicTrack = {
  mode: "asset";
  url: string;
  volume: number;
};

type MusicTrack = GeneratedMusicTrack | AssetMusicTrack;
type SfxId =
  | "shoot"
  | "defeat"
  | "defeated"
  | "bomb"
  | "spellSwitch"
  | "warning"
  | "getItem"
  | "powerUp"
  | "bossAppear"
  | "defeatBoss";

const musicTracks: Record<MusicTrackId, MusicTrack> = {
  title: {
    mode: "asset",
    url: titleMusicUrl,
    volume: 0.24
  },
  stage: {
    mode: "asset",
    url: stageMusicUrl,
    volume: 0.24
  },
  stage2: {
    mode: "asset",
    url: stage2MusicUrl,
    volume: 0.24
  },
  stage3: {
    mode: "asset",
    url: stage3MusicUrl,
    volume: 0.24
  },
  stage4: {
    mode: "asset",
    url: stage4MusicUrl,
    volume: 0.24
  },
  boss: {
    mode: "asset",
    url: bossMusicUrl,
    volume: 0.25
  },
  lastBoss: {
    mode: "asset",
    url: lastBossMusicUrl,
    volume: 0.25
  },
  clear: {
    mode: "asset",
    url: clearMusicUrl,
    volume: 0.24
  },
  ending: {
    mode: "asset",
    url: endingMusicUrl,
    volume: 0.24
  },
  gameover: {
    mode: "asset",
    url: gameOverMusicUrl,
    volume: 0.24
  }
};

const sfxUrls: Record<SfxId, string> = {
  shoot: shootSfxUrl,
  defeat: defeatSfxUrl,
  defeated: defeatedSfxUrl,
  bomb: bombSfxUrl,
  spellSwitch: spellSwitchSfxUrl,
  warning: warningSfxUrl,
  getItem: getItemSfxUrl,
  powerUp: powerUpSfxUrl,
  bossAppear: bossAppearSfxUrl,
  defeatBoss: defeatBossSfxUrl
};

const sfxVolumes: Partial<Record<SfxId, number>> = {
  defeat: 2,
  defeated: 2,
  getItem: 0.5
};

export class AudioSystem {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private lastShotAt = 0;
  private lastGrazeAt = 0;
  private lastItemCollectAt = 0;
  private muted = false;
  private paused = false;
  private requestedTrack: MusicTrackId | null = null;
  private currentTrack: MusicTrackId | null = null;
  private assetMusic: HTMLAudioElement | null = null;
  private sfxBuffers = new Map<SfxId, AudioBuffer | null>();
  private sfxLoading = new Map<SfxId, Promise<AudioBuffer | null>>();
  private musicStep = 0;
  private nextMusicTime = 0;
  private musicTimer = 0;
  private unlockListening = false;

  resume() {
    const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    if (!this.context) {
      this.context = new AudioContextCtor();
      this.master = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.18;
      this.sfxGain.gain.value = 0.6;
      this.musicGain.gain.value = 0;
      this.sfxGain.connect(this.master);
      this.musicGain.connect(this.master);
      this.master.connect(this.context.destination);
    }

    void this.context.resume();
    this.preloadSfx();
    if (this.requestedTrack) {
      this.startMusic(this.requestedTrack);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.18, this.context.currentTime, 0.025);
      this.refreshMusicVolume();
      if (!this.muted) {
        void this.context.resume();
        this.assetMusic?.play().catch((err) => {
          console.warn("Audio autoplay or resume blocked:", err);
        });
      }
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  playMusic(track: MusicTrackId) {
    this.requestedTrack = track;
    if (!this.context) {
      this.listenForAudioUnlock();
      return;
    }
    this.startMusic(track);
  }

  stopMusic() {
    this.requestedTrack = null;
    this.currentTrack = null;
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = 0;
    }
    if (this.assetMusic) {
      this.assetMusic.pause();
      this.assetMusic.currentTime = 0;
      this.assetMusic = null;
    }
    if (this.musicGain && this.context) {
      this.musicGain.gain.setTargetAtTime(0, this.context.currentTime, 0.04);
    }
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    this.refreshMusicVolume();
  }

  shot() {
    const now = this.context?.currentTime ?? 0;
    if (now - this.lastShotAt < 0.055) {
      return;
    }
    this.lastShotAt = now;
    if (this.playSfx("shoot")) {
      return;
    }
    this.tone(980, 0.042, "triangle", 0.055, -260);
    this.tone(1460, 0.028, "sine", 0.022, -360);
  }

  enemyDown() {
    if (this.playSfx("defeat")) {
      return;
    }
    this.tone(460, 0.11, "triangle", 0.12, -280);
    this.tone(780, 0.08, "sine", 0.055, -420);
    this.noise(0.075, 0.035);
  }

  playerHit() {
    if (this.playSfx("defeated")) {
      return;
    }
    this.tone(150, 0.28, "sawtooth", 0.16, -90);
    this.tone(92, 0.34, "triangle", 0.1, -30);
    this.noise(0.18, 0.11);
  }

  graze() {
    const now = this.context?.currentTime ?? 0;
    if (now - this.lastGrazeAt < 0.04) {
      return;
    }
    this.lastGrazeAt = now;
    this.tone(1320, 0.032, "sine", 0.024, -170);
  }

  bomb() {
    if (this.playSfx("bomb")) {
      return;
    }
    this.tone(180, 0.48, "sine", 0.2, 560);
    this.tone(540, 0.28, "triangle", 0.13, 260);
    this.tone(1080, 0.16, "sine", 0.06, -360);
    this.noise(0.34, 0.095);
  }

  bossAppear() {
    if (this.playSfx("bossAppear")) {
      return;
    }
    this.tone(180, 0.18, "sine", 0.16, 80);
    this.tone(360, 0.38, "triangle", 0.12, 240);
  }

  spellChange() {
    if (this.playSfx("spellSwitch")) {
      return;
    }
    this.tone(330, 0.12, "triangle", 0.12, 220);
    window.setTimeout(() => this.tone(660, 0.18, "triangle", 0.1, -80), 95);
    this.noise(0.12, 0.055);
  }

  warning() {
    if (this.playSfx("warning")) {
      return;
    }
    this.tone(220, 0.16, "sawtooth", 0.08, 20);
    window.setTimeout(() => this.tone(220, 0.16, "sawtooth", 0.08, 20), 240);
  }

  itemCollect(kind: "score" | "bomb") {
    const now = this.context?.currentTime ?? 0;
    if (now - this.lastItemCollectAt < 1) {
      return;
    }
    this.lastItemCollectAt = now;

    if (this.playSfx("getItem")) {
      return;
    }
    if (kind === "bomb") {
      this.tone(523.25, 0.08, "triangle", 0.09, 140);
      window.setTimeout(() => this.tone(783.99, 0.12, "triangle", 0.08, 0), 65);
      return;
    }
    this.tone(1174.66, 0.035, "sine", 0.028, 160);
    this.tone(1567.98, 0.028, "triangle", 0.018, -120);
  }

  powerUp() {
    if (this.playSfx("powerUp")) {
      return;
    }
    this.tone(392, 0.08, "triangle", 0.1, 80);
    window.setTimeout(() => this.tone(523.25, 0.08, "triangle", 0.1, 80), 75);
    window.setTimeout(() => this.tone(783.99, 0.18, "triangle", 0.11, 160), 150);
  }

  bossDefeated() {
    if (this.playSfx("defeatBoss")) {
      return;
    }
    this.tone(196, 0.36, "sine", 0.16, 360);
    this.tone(392, 0.22, "triangle", 0.12, 220);
    window.setTimeout(() => this.tone(783.99, 0.28, "triangle", 0.11, 0), 150);
    this.noise(0.24, 0.065);
  }

  clear() {
    this.tone(523.25, 0.14, "triangle", 0.12, 0);
    window.setTimeout(() => this.tone(659.25, 0.14, "triangle", 0.12, 0), 110);
    window.setTimeout(() => this.tone(783.99, 0.28, "triangle", 0.12, 0), 220);
  }

  private tone(frequency: number, duration: number, type: WaveType, volume: number, slide: number) {
    if (!this.context || !this.sfxGain || this.muted) {
      return;
    }

    this.toneAt(frequency, duration, type, volume, slide, this.context.currentTime, this.sfxGain);
  }

  private playSfx(id: SfxId) {
    if (!this.context || !this.sfxGain || this.muted) {
      return false;
    }

    const buffer = this.sfxBuffers.get(id);
    if (!buffer) {
      void this.loadSfx(id);
      return false;
    }

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    gain.gain.value = sfxVolumes[id] ?? 1;
    source.connect(gain);
    gain.connect(this.sfxGain);
    source.start();
    return true;
  }

  private preloadSfx() {
    Object.keys(sfxUrls).forEach((id) => {
      void this.loadSfx(id as SfxId);
    });
  }

  private loadSfx(id: SfxId) {
    if (!this.context) {
      return Promise.resolve(null);
    }

    const cached = this.sfxBuffers.get(id);
    if (cached) {
      return Promise.resolve(cached);
    }

    const loading = this.sfxLoading.get(id);
    if (loading) {
      return loading;
    }

    const promise = fetch(sfxUrls[id])
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${sfxUrls[id]}`);
        }
        return response.arrayBuffer();
      })
      .then((data) => this.context?.decodeAudioData(data) ?? null)
      .then((buffer) => {
        this.sfxBuffers.set(id, buffer);
        return buffer;
      })
      .catch(() => {
        this.sfxBuffers.set(id, null);
        return null;
      })
      .finally(() => {
        this.sfxLoading.delete(id);
      });

    this.sfxLoading.set(id, promise);
    return promise;
  }

  private toneAt(
    frequency: number,
    duration: number,
    type: WaveType,
    volume: number,
    slide: number,
    startTime: number,
    destination: AudioNode
  ) {
    if (!this.context) {
      return;
    }

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.frequency.linearRampToValueAtTime(Math.max(40, frequency + slide), startTime + duration);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(Math.max(now, startTime));
    oscillator.stop(startTime + duration + 0.02);
  }

  private noise(duration: number, volume: number) {
    if (!this.context || !this.sfxGain || this.muted) {
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
    gain.connect(this.sfxGain);
    source.start();
  }

  private startMusic(trackId: MusicTrackId) {
    if (!this.context || this.currentTrack === trackId) {
      this.refreshMusicVolume();
      return;
    }

    const track = musicTracks[trackId];
    if (track.mode === "asset") {
      this.startAssetMusic(trackId, track);
      return;
    }

    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = 0;
    }
    if (this.assetMusic) {
      this.assetMusic.pause();
      this.assetMusic = null;
    }
    this.currentTrack = trackId;
    this.musicStep = 0;
    this.nextMusicTime = this.context.currentTime + 0.03;
    this.refreshMusicVolume();
    this.scheduleMusic();
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 50);
  }

  private startAssetMusic(trackId: MusicTrackId, track: AssetMusicTrack) {
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = 0;
    }
    if (this.musicGain && this.context) {
      this.musicGain.gain.setTargetAtTime(0, this.context.currentTime, 0.04);
    }

    if (this.assetMusic?.src !== track.url) {
      if (this.assetMusic) {
        this.assetMusic.pause();
      }
      this.assetMusic = new Audio(track.url);
      this.assetMusic.loop = true;
      this.assetMusic.preload = "auto";
    }

    this.currentTrack = trackId;
    this.refreshMusicVolume();
    if (!this.muted) {
      this.assetMusic.play().catch((err) => {
        console.warn("Audio autoplay blocked:", err);
      });
    }
  }

  private listenForAudioUnlock() {
    if (this.unlockListening) {
      return;
    }

    this.unlockListening = true;
    const unlock = () => {
      this.unlockListening = false;
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
      this.resume();
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
  }

  private scheduleMusic() {
    if (!this.context || !this.musicGain || !this.currentTrack || this.muted) {
      return;
    }

    const track = musicTracks[this.currentTrack];
    if (track.mode !== "generated") {
      return;
    }

    const stepDuration = 60 / track.bpm / 2;
    while (this.nextMusicTime < this.context.currentTime + 0.18) {
      this.playMusicStep(track, this.musicStep, this.nextMusicTime);
      this.nextMusicTime += stepDuration;
      this.musicStep = (this.musicStep + 1) % 32;
    }
  }

  private playMusicStep(track: GeneratedMusicTrack, step: number, time: number) {
    if (!this.musicGain) {
      return;
    }

    const beat = step % 8;
    const bass = track.bass[Math.floor(step / 2) % track.bass.length];
    const lead = track.lead[beat % track.lead.length];
    const pad = track.pad[Math.floor(step / 8) % track.pad.length];

    if (step % 2 === 0 && bass > 0) {
      this.toneAt(bass, 0.16, "sine", 0.22, -8, time, this.musicGain);
    }
    if (lead > 0) {
      this.toneAt(lead, 0.1, track.leadWave, 0.08, -12, time, this.musicGain);
    }
    if (step % 8 === 0 && pad > 0) {
      this.toneAt(pad, 0.62, "triangle", 0.045, 0, time, this.musicGain);
      this.toneAt(pad * 1.5, 0.62, "sine", 0.026, 0, time, this.musicGain);
    }
    if ((this.currentTrack === "stage" || this.currentTrack === "boss") && step % 4 === 2) {
      this.toneAt(72, 0.025, "sine", 0.055, -20, time, this.musicGain);
    }
  }

  private refreshMusicVolume() {
    if (!this.context || !this.musicGain || !this.currentTrack) {
      return;
    }

    const track = musicTracks[this.currentTrack];
    const pausedScale = this.paused ? 0.42 : 1;
    if (this.assetMusic && track.mode === "asset") {
      this.assetMusic.volume = this.muted ? 0 : Math.min(1, track.volume * pausedScale);
      return;
    }
    this.musicGain.gain.setTargetAtTime(track.volume * pausedScale, this.context.currentTime, 0.05);
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
