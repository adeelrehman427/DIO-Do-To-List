/**
 * Sound effects engine using Web Audio API for subtle, non-intrusive auditory feedback.
 * No external sound files required — zero latency, offline-first, and lightweight.
 */

const STORAGE_KEY_SOUND = 'todo_app_sound_enabled';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SOUND);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SOUND, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

/**
 * Play an uplifting, soft marimba chime when a new task is added.
 */
export function playAddTaskSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Dual gentle sine notes (E5 -> A5)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(0.045, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.04); // A5

    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.setValueAtTime(0.0001, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.05, now + 0.055);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc1.connect(gain1);
    gain1.connect(filter);

    osc2.connect(gain2);
    gain2.connect(filter);

    filter.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.13);

    osc2.start(now + 0.04);
    osc2.stop(now + 0.18);
  } catch {
    // audio failure silent catch
  }
}

/**
 * Play a rich, satisfying major chord chime (C5 - E5 - G5) when a task is completed.
 */
export function playCompleteTaskSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, delay: 0, duration: 0.22, vol: 0.045 }, // C5
      { freq: 659.25, delay: 0.045, duration: 0.24, vol: 0.05 }, // E5
      { freq: 783.99, delay: 0.09, duration: 0.32, vol: 0.06 }, // G5
      { freq: 1046.5, delay: 0.13, duration: 0.38, vol: 0.035 }, // C6 sparkle
    ];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4500, now);

    notes.forEach(({ freq, delay, duration, vol }) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      noteGain.gain.setValueAtTime(0.0001, now + delay);
      noteGain.gain.exponentialRampToValueAtTime(vol, now + delay + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);

      osc.connect(noteGain);
      noteGain.connect(filter);

      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.02);
    });

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);
  } catch {
    // audio failure silent catch
  }
}

/**
 * Play a soft, non-jarring downward pop when a task is removed.
 */
export function playDeleteTaskSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    osc.type = 'sine';
    // Downward pitch slide: 280Hz -> 140Hz
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.11);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(filter);
    filter.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  } catch {
    // audio failure silent catch
  }
}

/**
 * Play a clear, gentle notification bell chime when a task reaches its due date/time.
 */
export function playDueAlertSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Pleasant bell alert (F#5 -> B5)
    [
      { freq: 739.99, delay: 0 },
      { freq: 987.77, delay: 0.12 },
    ].forEach(({ freq, delay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.05, now + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.38);
    });
  } catch {
    // audio failure silent catch
  }
}

/**
 * Play an uplifting 4-note celebration chime when a Pomodoro focus session finishes.
 */
export function playPomodoroCompleteSound(): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Ascending celebratory fanfare (D5 -> G5 -> B5 -> D6)
    const notes = [
      { freq: 587.33, delay: 0, dur: 0.26 },
      { freq: 783.99, delay: 0.12, dur: 0.3 },
      { freq: 987.77, delay: 0.24, dur: 0.34 },
      { freq: 1174.66, delay: 0.38, dur: 0.55 },
    ];
    notes.forEach(({ freq, delay, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.05, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.04);
    });
  } catch {
    // silent catch
  }
}

