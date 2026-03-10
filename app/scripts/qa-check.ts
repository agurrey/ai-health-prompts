import { generateSession, getWeekPhase } from '@/lib/generator';
import { exercises } from '@/data/exercises';
import { warmupExercises } from '@/data/warmup-exercises';
import { beginnerMovements, intermediateMovements, advancedMovements } from '@/data/wod-formats';
import * as fs from 'fs';
import * as path from 'path';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

interface Finding {
  severity: 'error' | 'warning' | 'info';
  message: string;
}

function checkDemoLinks(): Finding[] {
  const findings: Finding[] = [];

  for (const e of exercises) {
    if (!e.demoSearch || e.demoSearch.trim() === '') {
      findings.push({ severity: 'error', message: `Exercise "${e.name}" (${e.id}) missing demoSearch` });
    }
    if (!e.demoChannel || e.demoChannel.trim() === '') {
      findings.push({ severity: 'warning', message: `Exercise "${e.name}" (${e.id}) missing demoChannel` });
    }
  }

  for (const e of warmupExercises) {
    if (!e.demoSearch || e.demoSearch.trim() === '') {
      findings.push({ severity: 'error', message: `Warmup "${e.name}" (${e.id}) missing demoSearch` });
    }
  }

  const allMovements = [...beginnerMovements, ...intermediateMovements, ...advancedMovements];
  for (const m of allMovements) {
    if (!m.demoSearch || m.demoSearch.trim() === '') {
      findings.push({ severity: 'error', message: `WOD movement "${m.name}" missing demoSearch` });
    }
  }

  return findings;
}

function checkSession(date: string): Finding[] {
  const findings: Finding[] = [];

  try {
    const session = generateSession(date);

    // Check phase exists
    if (!session.phase || !session.phase.phase) {
      findings.push({ severity: 'error', message: `Missing phase info` });
    }

    // Check warmup
    if (session.warmup.exercises.length === 0) {
      findings.push({ severity: 'error', message: `Empty warmup` });
    }
    if (session.warmup.exercises.length < 3) {
      findings.push({ severity: 'warning', message: `Only ${session.warmup.exercises.length} warmup exercises` });
    }
    if (!session.warmup.format || !session.warmup.format.name) {
      findings.push({ severity: 'error', message: `Warmup missing format` });
    }

    for (const w of session.warmup.exercises) {
      if (!w.exercise.demoSearch) {
        findings.push({ severity: 'error', message: `Warmup "${w.exercise.name}" missing demo` });
      }
    }

    // Check strength (all days have strength now)
    if (session.strength.length === 0) {
      findings.push({ severity: 'error', message: `Empty strength block` });
    }
    if (session.strength.length < 3) {
      findings.push({ severity: 'warning', message: `Only ${session.strength.length} strength exercises` });
    }

    for (const s of session.strength) {
      if (!s.exercise.demoSearch) {
        findings.push({ severity: 'error', message: `Strength "${s.exercise.name}" missing demo` });
      }
    }

    // Check conditioning (always present now)
    if (session.conditioning.movements.length === 0) {
      findings.push({ severity: 'error', message: `WOD has 0 movements` });
    }
    for (const m of session.conditioning.movements) {
      if (!m.demoSearch) {
        findings.push({ severity: 'error', message: `WOD "${m.name}" missing demo` });
      }
    }
    if (!session.conditioning.scalingNote) {
      findings.push({ severity: 'warning', message: `WOD missing scaling note` });
    }
    if (!session.conditioning.intensity) {
      findings.push({ severity: 'warning', message: `WOD missing intensity` });
    }
    if (!session.conditioning.volume) {
      findings.push({ severity: 'warning', message: `WOD missing volume` });
    }
    if (!session.conditioning.formatDescription) {
      findings.push({ severity: 'warning', message: `WOD missing format description` });
    }

    // Check duration
    if (session.duration < 15 || session.duration > 60) {
      findings.push({ severity: 'warning', message: `Unusual duration: ${session.duration} min` });
    }

    // Check variety vs yesterday
    const yesterday = getYesterday();
    try {
      const yesterdaySession = generateSession(yesterday);
      const todayStrengthIds = new Set(session.strength.map(s => s.exercise.id));
      const yesterdayStrengthIds = new Set(yesterdaySession.strength.map(s => s.exercise.id));
      const overlap = [...todayStrengthIds].filter(id => yesterdayStrengthIds.has(id));
      if (overlap.length > 0 && todayStrengthIds.size > 0) {
        const overlapPct = (overlap.length / todayStrengthIds.size) * 100;
        if (overlapPct > 50) {
          findings.push({ severity: 'warning', message: `${overlap.length}/${todayStrengthIds.size} strength exercises same as yesterday (${overlapPct.toFixed(0)}%)` });
        }
      }
    } catch {
      // Skip variety check if yesterday fails
    }

  } catch (err) {
    findings.push({ severity: 'error', message: `CRASH: ${err}` });
  }

  return findings;
}

function checkPeriodization(): Finding[] {
  const findings: Finding[] = [];
  const today = getToday();

  // Check full 28-day cycle
  const phaseProtocols: Record<string, Set<string>> = {
    accumulation: new Set(),
    intensification: new Set(),
    mixed: new Set(),
    realization: new Set(),
  };
  const phaseFormats: Record<string, Set<string>> = {
    accumulation: new Set(),
    intensification: new Set(),
    mixed: new Set(),
    realization: new Set(),
  };
  const phaseDays: Record<string, number> = {
    accumulation: 0,
    intensification: 0,
    mixed: 0,
    realization: 0,
  };

  for (let d = 0; d < 28; d++) {
    const checkDate = new Date(today + 'T12:00:00Z');
    checkDate.setUTCDate(checkDate.getUTCDate() + d);
    const dateStr = checkDate.toISOString().split('T')[0];

    try {
      const session = generateSession(dateStr);
      const phase = session.phase.phase;
      phaseDays[phase]++;

      for (const s of session.strength) {
        phaseProtocols[phase].add(s.protocol);
      }
      phaseFormats[phase].add(session.conditioning.formatType);
    } catch (err) {
      findings.push({ severity: 'error', message: `Day ${d} (${dateStr}) CRASH: ${err}` });
    }
  }

  // Verify each phase appears exactly 7 days
  for (const [phase, count] of Object.entries(phaseDays)) {
    if (count !== 7) {
      findings.push({ severity: 'error', message: `Phase "${phase}" has ${count} days (expected 7)` });
    }
  }

  // Verify protocol variety per phase
  for (const [phase, protocols] of Object.entries(phaseProtocols)) {
    if (protocols.size < 2) {
      findings.push({ severity: 'warning', message: `Phase "${phase}" only uses ${protocols.size} protocol(s): ${[...protocols].join(', ')}` });
    }
  }

  // Verify format variety per phase
  for (const [phase, formats] of Object.entries(phaseFormats)) {
    if (formats.size < 2) {
      findings.push({ severity: 'warning', message: `Phase "${phase}" only uses ${formats.size} WOD format(s): ${[...formats].join(', ')}` });
    }
  }

  // Verify phases are distinct (accumulation should differ from intensification)
  const accProtos = phaseProtocols['accumulation'];
  const intProtos = phaseProtocols['intensification'];
  const overlap = [...accProtos].filter(p => intProtos.has(p));
  if (accProtos.size > 0 && intProtos.size > 0 && overlap.length === accProtos.size) {
    findings.push({ severity: 'warning', message: `Accumulation and Intensification use identical protocols — periodization not working` });
  }

  return findings;
}

function runQA(): string {
  const today = getToday();
  const dayOfWeek = new Date(today + 'T12:00:00Z').getUTCDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const phase = getWeekPhase(today);

  const lines: string[] = [];
  lines.push(`## QA Check — ${today} (${dayNames[dayOfWeek]}) | ${phase.label}`);
  lines.push('');

  // 1. Demo link audit
  lines.push('### Demo Link Audit');
  const demoFindings = checkDemoLinks();
  if (demoFindings.length === 0) {
    lines.push('All exercises have demo links.');
  } else {
    for (const f of demoFindings) {
      lines.push(`- [${f.severity.toUpperCase()}] ${f.message}`);
    }
  }
  lines.push('');

  // 2. Exercise pool stats
  lines.push('### Exercise Pool');
  const patternCounts: Record<string, number> = {};
  for (const e of exercises) {
    patternCounts[e.pattern] = (patternCounts[e.pattern] || 0) + 1;
  }
  lines.push(`Total exercises: ${exercises.length}`);
  for (const [p, c] of Object.entries(patternCounts).sort()) {
    lines.push(`- ${p}: ${c}`);
  }
  lines.push(`Warmup: ${warmupExercises.length}`);
  lines.push(`WOD movements: ${beginnerMovements.length} beg + ${intermediateMovements.length} int + ${advancedMovements.length} adv`);
  lines.push('');

  // 3. Session generation — check today + 7 days
  lines.push('### Session Checks (today + 7 days)');
  let totalErrors = 0;
  let totalWarnings = 0;

  for (let d = 0; d < 7; d++) {
    const checkDate = new Date(today + 'T12:00:00Z');
    checkDate.setUTCDate(checkDate.getUTCDate() + d);
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayName = dayNames[checkDate.getUTCDay()];
    const dayPhase = getWeekPhase(dateStr);

    const findings = checkSession(dateStr);
    for (const f of findings) {
      if (f.severity === 'error') totalErrors++;
      if (f.severity === 'warning') totalWarnings++;
      lines.push(`- [${f.severity.toUpperCase()}] ${dayName} (${dateStr}) [${dayPhase.phase}]: ${f.message}`);
    }
  }
  lines.push('');

  // 4. Periodization check — full 28-day cycle
  lines.push('### Periodization Check (28-day cycle)');
  const periodFindings = checkPeriodization();
  if (periodFindings.length === 0) {
    lines.push('All 4 phases present, protocols and formats vary correctly.');
  } else {
    for (const f of periodFindings) {
      if (f.severity === 'error') totalErrors++;
      if (f.severity === 'warning') totalWarnings++;
      lines.push(`- [${f.severity.toUpperCase()}] ${f.message}`);
    }
  }
  lines.push('');

  lines.push(`### Summary`);
  lines.push(`Days checked: 7 + 28-day cycle`);
  lines.push(`Errors: ${totalErrors} | Warnings: ${totalWarnings}`);

  if (totalErrors === 0 && totalWarnings === 0) {
    lines.push('**ALL CLEAR** — No issues found.');
  } else if (totalErrors === 0) {
    lines.push(`**OK** — ${totalWarnings} warnings, no errors.`);
  } else {
    lines.push(`**ISSUES FOUND** — ${totalErrors} errors need attention.`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

// ── Run ──
const report = runQA();
console.log(report);

const logPath = path.join(process.env.HOME || '~', 'Business', 'hormesis', 'qa-log.md');
const header = fs.existsSync(logPath) ? '' : '# Hormesis QA Log\n\n';
fs.appendFileSync(logPath, header + report);
console.log(`\nLog appended to: ${logPath}`);
