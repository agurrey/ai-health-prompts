import type { TimerConfig } from './timer-engine';

/**
 * Auto-configure timer from exercise context.
 *
 * Strength: parse `rest` field ("90s" -> 90s countdown)
 * Warmup: parse prescription ("30s" -> countdown, "10 reps" -> no timer)
 * WOD: parse format (EMOM -> emom mode, AMRAP/For Time -> countdown from timecap, Tabata -> intervals)
 */

function parseSeconds(str: string): number | null {
  // "90s" -> 90, "2min" -> 120, "60-90s" -> 90 (take upper), "2:00" -> 120
  const colonMatch = str.match(/(\d+):(\d{2})/);
  if (colonMatch) return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]);

  const rangeMatch = str.match(/(\d+)-(\d+)\s*s/i);
  if (rangeMatch) return parseInt(rangeMatch[2]);

  const secMatch = str.match(/(\d+)\s*s/i);
  if (secMatch) return parseInt(secMatch[1]);

  const minMatch = str.match(/(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1]) * 60;

  return null;
}

function parseTimecap(timecap: string): number | null {
  // "12 min" -> 720, "20:00" -> 1200
  return parseSeconds(timecap);
}

export function configFromStrengthRest(rest: string): TimerConfig | null {
  const seconds = parseSeconds(rest);
  if (!seconds || seconds < 5) return null;
  return { mode: 'countdown', totalSeconds: seconds };
}

export function configFromWarmupPrescription(prescription: string): TimerConfig | null {
  // Only create timer for time-based prescriptions
  if (/\d+\s*s(ec)?/i.test(prescription)) {
    const seconds = parseSeconds(prescription);
    if (seconds && seconds >= 5) return { mode: 'countdown', totalSeconds: seconds };
  }
  return null;
}

export function configFromWod(formatType: string, timecap: string): TimerConfig | null {
  const lc = formatType.toLowerCase();

  // Tabata
  if (lc.includes('tabata')) {
    return { mode: 'intervals', workSeconds: 20, restSeconds: 10, rounds: 8 };
  }

  // E2MOM / E3MOM (must check before generic emom)
  if (lc.includes('e2mom')) {
    const totalSec = parseTimecap(timecap);
    return { mode: 'emom', totalSeconds: totalSec || 600, intervalSeconds: 120 };
  }
  if (lc.includes('e3mom')) {
    const totalSec = parseTimecap(timecap);
    return { mode: 'emom', totalSeconds: totalSec || 600, intervalSeconds: 180 };
  }

  // EMOM
  if (lc.includes('emom')) {
    const totalSec = parseTimecap(timecap);
    return { mode: 'emom', totalSeconds: totalSec || 600, intervalSeconds: 60 };
  }

  // Fight Gone Bad — 3 rounds of 5 stations x 1 min + 1 min rest
  if (lc.includes('fgb') || lc.includes('fight_gone_bad')) {
    return { mode: 'intervals', workSeconds: 60, restSeconds: 60, rounds: 15 };
  }

  // Death By — escalating EMOM, use stopwatch (athlete decides when to stop)
  if (lc.includes('death_by')) {
    const totalSec = parseTimecap(timecap);
    return { mode: 'emom', totalSeconds: totalSec || 600, intervalSeconds: 60 };
  }

  // AMRAP, For Time, or any countdown-based format
  const totalSec = parseTimecap(timecap);
  if (totalSec) return { mode: 'countdown', totalSeconds: totalSec };

  return null;
}
