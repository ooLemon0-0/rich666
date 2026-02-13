const audioCache = new Map<string, HTMLAudioElement>();
let audioContext: AudioContext | null = null;

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
