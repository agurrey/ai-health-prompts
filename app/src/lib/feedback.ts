let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    return audioCtx;
  } catch {
    return null;
  }
}

export function playCompletionFeedback(): void {
  navigator.vibrate?.(50);
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}

export function playVictoryFeedback(): void {
  navigator.vibrate?.([80, 60, 80, 60, 150]);
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  // Triumphant 3-note fanfare: C5 → E5 → G5 with harmonics
  const notes = [523, 659, 784];
  notes.forEach((freq, i) => {
    const t = now + i * 0.15;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc2.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq * 2, t);
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.setValueAtTime(0.22, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (i === 2 ? 0.6 : 0.2));
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.7);
    osc2.stop(t + 0.7);
  });
}

export function playSkipFeedback(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  // Quick descending "womp" — two short tones going down
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}
