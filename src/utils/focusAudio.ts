/**
 * Focus Mode Background Audio Engine
 * Powered entirely by the browser-native Web Audio API.
 * Zero external audio assets, zero latency, offline-first.
 */

export type FocusSoundType = 'white_noise' | 'lofi_beats' | 'gentle_rain' | 'alpha_drone';

export interface FocusSoundOption {
  id: FocusSoundType;
  name: string;
  description: string;
  badge: string;
}

export const FOCUS_SOUND_OPTIONS: FocusSoundOption[] = [
  {
    id: 'white_noise',
    name: 'Soft Pink Noise',
    description: 'Smooth, warm acoustic static that masks background distractions',
    badge: 'Ambient',
  },
  {
    id: 'lofi_beats',
    name: 'Lo-Fi Chill Beats',
    description: 'Warm rhodes chord progressions with gentle relaxed 72 BPM tempo',
    badge: 'Rhythmic',
  },
  {
    id: 'gentle_rain',
    name: 'Gentle Rain',
    description: 'Soothing rain shower with natural organic acoustic drops',
    badge: 'Nature',
  },
  {
    id: 'alpha_drone',
    name: 'Binaural Alpha Drone',
    description: 'Deep 10Hz alpha-wave harmonic meditation hum for intense focus',
    badge: 'Focus',
  },
];

const STORAGE_KEY_FOCUS_SETTINGS = 'todo_app_focus_audio_settings_v1';

export interface FocusAudioSettings {
  isPlaying: boolean;
  soundType: FocusSoundType;
  volume: number; // 0.0 to 1.0
}

export function loadFocusAudioSettings(): FocusAudioSettings {
  if (typeof window === 'undefined') {
    return { isPlaying: false, soundType: 'white_noise', volume: 0.5 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FOCUS_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        isPlaying: false, // Always start paused on page load to avoid unexpected noise
        soundType: parsed.soundType || 'white_noise',
        volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(1, parsed.volume)) : 0.5,
      };
    }
  } catch {
    // fallback
  }
  return { isPlaying: false, soundType: 'white_noise', volume: 0.5 };
}

export function saveFocusAudioSettings(settings: Partial<FocusAudioSettings>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadFocusAudioSettings();
    const updated = { ...current, ...settings, isPlaying: false };
    localStorage.setItem(STORAGE_KEY_FOCUS_SETTINGS, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

// Internal audio nodes
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let activeSoundType: FocusSoundType | null = null;
let currentCleanup: (() => void) | null = null;
let currentVolume = 0.5;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function ensureMasterGain(ctx: AudioContext): GainNode {
  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(currentVolume, ctx.currentTime);
    masterGain.connect(ctx.destination);
  }
  return masterGain;
}

/**
 * Procedural Soft White / Pink Noise generator
 */
function createWhiteNoise(ctx: AudioContext, destination: AudioNode): () => void {
  const bufferSize = ctx.sampleRate * 4; // 4 second looped noise buffer
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Pink noise approximation using Paul Kellet's filter
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
    b6 = white * 0.115926;
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  // Gentle low-pass filter to smooth harsh frequencies into warm acoustic static
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(850, ctx.currentTime);
  filter.Q.setValueAtTime(0.7, ctx.currentTime);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.8, ctx.currentTime + 0.5);

  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(destination);

  noiseSource.start();

  return () => {
    try {
      gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      setTimeout(() => {
        try {
          noiseSource.stop();
          noiseSource.disconnect();
          filter.disconnect();
          gainNode.disconnect();
        } catch {
          // ignore
        }
      }, 350);
    } catch {
      // ignore
    }
  };
}

/**
 * Procedural Gentle Rain Generator
 */
function createRainAudio(ctx: AudioContext, destination: AudioNode): () => void {
  // Base rain noise
  const bufferSize = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < bufferSize; i++) {
    left[i] = (Math.random() * 2 - 1) * 0.06;
    right[i] = (Math.random() * 2 - 1) * 0.06;
  }

  const rainSource = ctx.createBufferSource();
  rainSource.buffer = buffer;
  rainSource.loop = true;

  // Bandpass filter for gentle rain acoustics
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1400, ctx.currentTime);
  filter.Q.setValueAtTime(0.6, ctx.currentTime);

  const rainGain = ctx.createGain();
  rainGain.gain.setValueAtTime(0.001, ctx.currentTime);
  rainGain.gain.exponentialRampToValueAtTime(0.65, ctx.currentTime + 0.6);

  rainSource.connect(filter);
  filter.connect(rainGain);
  rainGain.connect(destination);
  rainSource.start();

  // Subtle random raindrop pings
  let dropInterval: number | null = null;
  const triggerDrop = () => {
    if (!audioCtx || audioCtx.state === 'closed') return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const dropGain = ctx.createGain();

      const freq = 1200 + Math.random() * 800;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.05);

      dropGain.gain.setValueAtTime(0.015 + Math.random() * 0.02, now);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc.connect(dropGain);
      dropGain.connect(destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // ignore
    }
  };

  dropInterval = window.setInterval(() => {
    if (Math.random() > 0.4) {
      triggerDrop();
    }
  }, 180);

  return () => {
    if (dropInterval) clearInterval(dropInterval);
    try {
      rainGain.gain.setValueAtTime(rainGain.gain.value, ctx.currentTime);
      rainGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      setTimeout(() => {
        try {
          rainSource.stop();
          rainSource.disconnect();
          filter.disconnect();
          rainGain.disconnect();
        } catch {
          // ignore
        }
      }, 350);
    } catch {
      // ignore
    }
  };
}

/**
 * Procedural Binaural Alpha Drone (10Hz difference: 108Hz L, 118Hz R + 216Hz harmonic)
 */
function createAlphaDrone(ctx: AudioContext, destination: AudioNode): () => void {
  const now = ctx.currentTime;

  // Left ear: 108 Hz
  const oscL = ctx.createOscillator();
  const panL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  const gainL = ctx.createGain();
  oscL.type = 'sine';
  oscL.frequency.setValueAtTime(108, now);
  if (panL) panL.pan.setValueAtTime(-0.85, now);

  // Right ear: 118 Hz (10Hz difference stimulates Alpha waves 8-12Hz)
  const oscR = ctx.createOscillator();
  const panR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  const gainR = ctx.createGain();
  oscR.type = 'sine';
  oscR.frequency.setValueAtTime(118, now);
  if (panR) panR.pan.setValueAtTime(0.85, now);

  // Subtle warm harmonic drone at 216 Hz
  const oscHarmonic = ctx.createOscillator();
  const gainHarmonic = ctx.createGain();
  oscHarmonic.type = 'triangle';
  oscHarmonic.frequency.setValueAtTime(216, now);

  // Filter for warmth
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(320, now);

  // Master fade in
  const mainGain = ctx.createGain();
  mainGain.gain.setValueAtTime(0.001, now);
  mainGain.gain.exponentialRampToValueAtTime(0.5, now + 1.2);

  gainL.gain.setValueAtTime(0.35, now);
  gainR.gain.setValueAtTime(0.35, now);
  gainHarmonic.gain.setValueAtTime(0.12, now);

  if (panL) {
    oscL.connect(gainL);
    gainL.connect(panL);
    panL.connect(filter);
  } else {
    oscL.connect(gainL);
    gainL.connect(filter);
  }

  if (panR) {
    oscR.connect(gainR);
    gainR.connect(panR);
    panR.connect(filter);
  } else {
    oscR.connect(gainR);
    gainR.connect(filter);
  }

  oscHarmonic.connect(gainHarmonic);
  gainHarmonic.connect(filter);

  filter.connect(mainGain);
  mainGain.connect(destination);

  oscL.start(now);
  oscR.start(now);
  oscHarmonic.start(now);

  return () => {
    try {
      mainGain.gain.setValueAtTime(mainGain.gain.value, ctx.currentTime);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      setTimeout(() => {
        try {
          oscL.stop();
          oscR.stop();
          oscHarmonic.stop();
          oscL.disconnect();
          oscR.disconnect();
          oscHarmonic.disconnect();
          filter.disconnect();
          mainGain.disconnect();
        } catch {
          // ignore
        }
      }, 450);
    } catch {
      // ignore
    }
  };
}

/**
 * Procedural Lo-Fi Beats & Chords Generator
 * Warm jazzy Rhodes chords (Dm7 - G7 - Cmaj7 - Am7) + 72 BPM chill heartbeat drums + soft vinyl dust
 */
function createLoFiBeats(ctx: AudioContext, destination: AudioNode): () => void {
  const bpm = 72;
  const beatDuration = 60 / bpm; // ~0.833 seconds per beat
  const barDuration = beatDuration * 4; // ~3.33 seconds per bar

  let isAlive = true;
  let timerId: number | null = null;

  // Chord frequencies: [Dm7, G7, Cmaj7, Am7]
  const chordProgression: number[][] = [
    [146.83, 220.00, 261.63, 349.23], // Dm7: D3, A3, C4, F4
    [196.00, 246.94, 293.66, 349.23], // G7: G3, B3, D4, F4
    [130.81, 196.00, 246.94, 329.63], // Cmaj7: C3, G3, B3, E4
    [220.00, 261.63, 329.63, 392.00], // Am7: A3, C4, E4, G4
  ];

  let currentChordIndex = 0;

  // Subgroup gain
  const lofiGain = ctx.createGain();
  lofiGain.gain.setValueAtTime(0.001, ctx.currentTime);
  lofiGain.gain.exponentialRampToValueAtTime(0.45, ctx.currentTime + 0.8);
  lofiGain.connect(destination);

  // 1. Soft Vinyl Dust loop
  const vinylBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const vinylData = vinylBuffer.getChannelData(0);
  for (let i = 0; i < vinylData.length; i++) {
    // Sparse clicks
    vinylData[i] = Math.random() < 0.002 ? (Math.random() * 2 - 1) * 0.15 : (Math.random() * 2 - 1) * 0.008;
  }
  const vinylSource = ctx.createBufferSource();
  vinylSource.buffer = vinylBuffer;
  vinylSource.loop = true;
  const vinylFilter = ctx.createBiquadFilter();
  vinylFilter.type = 'bandpass';
  vinylFilter.frequency.setValueAtTime(2500, ctx.currentTime);
  const vinylGain = ctx.createGain();
  vinylGain.gain.setValueAtTime(0.25, ctx.currentTime);
  vinylSource.connect(vinylFilter);
  vinylFilter.connect(vinylGain);
  vinylGain.connect(lofiGain);
  vinylSource.start();

  // Play a soft rhodes chord
  const playChord = (notes: number[], startTime: number) => {
    if (!isAlive) return;
    notes.forEach((freq) => {
      try {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle'; // Warm Rhodes electric piano timbre
        osc.frequency.setValueAtTime(freq, startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, startTime);
        filter.Q.setValueAtTime(1.2, startTime);

        // Soft bell attack, mellow sustain, long natural decay
        oscGain.gain.setValueAtTime(0.0001, startTime);
        oscGain.gain.linearRampToValueAtTime(0.065, startTime + 0.06);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, startTime + barDuration * 0.95);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(lofiGain);

        osc.start(startTime);
        osc.stop(startTime + barDuration);
      } catch {
        // ignore
      }
    });
  };

  // Play mellow lo-fi kick
  const playKick = (startTime: number) => {
    if (!isAlive) return;
    try {
      const osc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, startTime);
      osc.frequency.exponentialRampToValueAtTime(42, startTime + 0.12);

      kickGain.gain.setValueAtTime(0.18, startTime);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);

      osc.connect(kickGain);
      kickGain.connect(lofiGain);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    } catch {
      // ignore
    }
  };

  // Play mellow brush snare / rim click
  const playSnare = (startTime: number) => {
    if (!isAlive) return;
    try {
      const osc = ctx.createOscillator();
      const snareGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(210, startTime);

      snareGain.gain.setValueAtTime(0.08, startTime);
      snareGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);

      osc.connect(snareGain);
      snareGain.connect(lofiGain);
      osc.start(startTime);
      osc.stop(startTime + 0.16);
    } catch {
      // ignore
    }
  };

  // Scheduler function to schedule 1 bar at a time
  const scheduleBar = () => {
    if (!isAlive) return;
    const now = ctx.currentTime;

    // 1. Play current chord
    playChord(chordProgression[currentChordIndex], now);
    currentChordIndex = (currentChordIndex + 1) % chordProgression.length;

    // 2. Play drum groove for the 4 beats
    // Beat 1: Kick
    playKick(now);
    // Beat 2: Snare
    playSnare(now + beatDuration);
    // Beat 3: Kick
    playKick(now + beatDuration * 2);
    // Beat 3.5: subtle syncopated ghost kick
    if (Math.random() > 0.3) {
      playKick(now + beatDuration * 2.75);
    }
    // Beat 4: Snare
    playSnare(now + beatDuration * 3);

    // Schedule next bar right before this one finishes
    timerId = window.setTimeout(scheduleBar, barDuration * 980);
  };

  // Start sequence
  scheduleBar();

  return () => {
    isAlive = false;
    if (timerId) clearTimeout(timerId);
    try {
      lofiGain.gain.setValueAtTime(lofiGain.gain.value, ctx.currentTime);
      lofiGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      setTimeout(() => {
        try {
          vinylSource.stop();
          vinylSource.disconnect();
          vinylFilter.disconnect();
          vinylGain.disconnect();
          lofiGain.disconnect();
        } catch {
          // ignore
        }
      }, 450);
    } catch {
      // ignore
    }
  };
}

/**
 * Start or switch focus audio profile
 */
export function startFocusAudio(soundType: FocusSoundType, volume = currentVolume): boolean {
  const ctx = getAudioContext();
  if (!ctx) return false;

  currentVolume = volume;
  const master = ensureMasterGain(ctx);
  master.gain.setValueAtTime(currentVolume, ctx.currentTime);

  // Stop previous if playing
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  activeSoundType = soundType;

  switch (soundType) {
    case 'white_noise':
      currentCleanup = createWhiteNoise(ctx, master);
      break;
    case 'gentle_rain':
      currentCleanup = createRainAudio(ctx, master);
      break;
    case 'alpha_drone':
      currentCleanup = createAlphaDrone(ctx, master);
      break;
    case 'lofi_beats':
      currentCleanup = createLoFiBeats(ctx, master);
      break;
    default:
      currentCleanup = createWhiteNoise(ctx, master);
      break;
  }

  saveFocusAudioSettings({ isPlaying: true, soundType, volume });
  return true;
}

/**
 * Stop focus audio
 */
export function stopFocusAudio(): void {
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }
  activeSoundType = null;
  saveFocusAudioSettings({ isPlaying: false });
}

/**
 * Update focus audio volume smoothly
 */
export function setFocusAudioVolume(volume: number): void {
  currentVolume = Math.max(0, Math.min(1, volume));
  if (audioCtx && masterGain) {
    masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(currentVolume, audioCtx.currentTime + 0.08);
  }
  saveFocusAudioSettings({ volume: currentVolume });
}

/**
 * Query active state
 */
export function isFocusAudioPlaying(): boolean {
  return currentCleanup !== null;
}

export function getActiveFocusSoundType(): FocusSoundType | null {
  return activeSoundType;
}

export function getCurrentFocusVolume(): number {
  return currentVolume;
}
