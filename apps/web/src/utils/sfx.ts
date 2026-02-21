const audioCache = new Map<string, HTMLAudioElement>();
let audioContext: AudioContext | null = null;
let bgmGain: GainNode | null = null;
let bgmOsc: OscillatorNode | null = null;
let bgmLfo: OscillatorNode | null = null;
let bgmLfoGain: GainNode | null = null;

function resolveAudio(name: string): string | null {
  // Hook point: drop audio files under src/assets/sfx later.
  const candidate = name.trim().toLowerCase();
  if (!candidate) {
    return null;
  }
  return null;
}

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (!audioContext) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) {
      return null;
    }
    audioContext = new Ctx();
  }
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  return audioContext;
}

function playSynth(name: string): void {
  const ctx = ensureContext();
  if (!ctx) {
    return;
  }
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (name === "dice_roll") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.24);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc.start(now);
    osc.stop(now + 0.3);
    return;
  }

  if (name === "dice_land") {
    osc.type = "square";
    osc.frequency.setValueAtTime(150, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.12);
    return;
  }

  if (name === "ui_click") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.07);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.025, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.1);
    return;
  }

  if (name === "money_gain") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.start(now);
    osc.stop(now + 0.18);
    return;
  }

  if (name === "money_lose") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.2);
    return;
  }

  if (name === "event_trigger") {
    osc.type = "square";
    osc.frequency.setValueAtTime(420, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.start(now);
    osc.stop(now + 0.1);
  }
}

export function playSfx(name: string): void {
  try {
    playSynth(name);
    const src = resolveAudio(name);
    if (!src) {
      return;
    }
    let audio = audioCache.get(src);
    if (!audio) {
      audio = new Audio(src);
      audioCache.set(src, audio);
    }
    audio.currentTime = 0;
    void audio.play();
  } catch {
    // No-op: missing/blocked audio should never break interaction.
  }
}

export function startBgm(): void {
  try {
    const ctx = ensureContext();
    if (!ctx || bgmOsc || bgmGain) {
      return;
    }
    bgmGain = ctx.createGain();
    bgmGain.gain.setValueAtTime(0.012, ctx.currentTime);
    bgmGain.connect(ctx.destination);

    bgmOsc = ctx.createOscillator();
    bgmOsc.type = "triangle";
    bgmOsc.frequency.setValueAtTime(196, ctx.currentTime);
    bgmOsc.connect(bgmGain);
    bgmOsc.start();

    bgmLfo = ctx.createOscillator();
    bgmLfo.type = "sine";
    bgmLfo.frequency.setValueAtTime(0.22, ctx.currentTime);
    bgmLfoGain = ctx.createGain();
    bgmLfoGain.gain.setValueAtTime(45, ctx.currentTime);
    bgmLfo.connect(bgmLfoGain);
    bgmLfoGain.connect(bgmOsc.frequency);
    bgmLfo.start();
  } catch {
    // ignore bgm failures
  }
}

export function stopBgm(): void {
  try {
    if (bgmLfo) {
      bgmLfo.stop();
      bgmLfo.disconnect();
      bgmLfo = null;
    }
    if (bgmLfoGain) {
      bgmLfoGain.disconnect();
      bgmLfoGain = null;
    }
    if (bgmOsc) {
      bgmOsc.stop();
      bgmOsc.disconnect();
      bgmOsc = null;
    }
    if (bgmGain) {
      bgmGain.disconnect();
      bgmGain = null;
    }
  } catch {
    // ignore bgm failures
  }
}
