export type TimerMode = 'countdown' | 'emom' | 'intervals' | 'stopwatch';
export type TimerState = 'idle' | 'running' | 'paused';
export type IntervalPhase = 'work' | 'rest';

export interface TimerConfig {
  mode: TimerMode;
  totalSeconds?: number;    // countdown / emom total
  workSeconds?: number;     // intervals work
  restSeconds?: number;     // intervals rest
  rounds?: number;          // intervals rounds
  intervalSeconds?: number; // emom interval (60 for EMOM, 120 for E2MOM, 180 for E3MOM)
}

export interface TimerSnapshot {
  state: TimerState;
  displaySeconds: number;
  mode: TimerMode;
  // intervals
  phase?: IntervalPhase;
  currentRound?: number;
  totalRounds?: number;
  // emom
  currentMinute?: number;
  totalMinutes?: number;
  // progress 0-1
  progress: number;
}

// Audio
function createBeep(frequency: number, duration: number, volume: number = 0.3): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = 'square';
    gain.gain.value = volume;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), (duration + 0.1) * 1000);
  } catch { /* audio not available */ }
}

export function beepShort() { createBeep(880, 0.15, 0.3); }
export function beepWork() { createBeep(1000, 0.12, 0.35); }
export function beepRest() { createBeep(440, 0.2, 0.25); }
export function beepComplete() {
  createBeep(660, 0.4, 0.4);
  setTimeout(() => createBeep(880, 0.4, 0.4), 450);
  setTimeout(() => createBeep(1100, 0.6, 0.4), 900);
}
export function beepCountdown(secondsLeft: number) {
  if (secondsLeft === 3) createBeep(500, 0.12, 0.2);
  else if (secondsLeft === 2) createBeep(700, 0.12, 0.25);
  else if (secondsLeft === 1) createBeep(900, 0.15, 0.35);
}

// Formatting
export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatTimeCompact(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m > 0) return `${m}:${s.toString().padStart(2, '0')}`;
  return `${s}s`;
}
