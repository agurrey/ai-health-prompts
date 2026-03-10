import {
  parseWeightKg,
  detectPR,
  checkNewPRs,
} from '@/lib/gamification';
import type { PersonalRecord, ExerciseLogEntry } from '@/lib/storage';

// ── parseWeightKg ──

describe('parseWeightKg', () => {
  it('parses kg unit: 20kg → 20', () => {
    expect(parseWeightKg('20kg')).toBe(20);
  });

  it('parses kg unit with space: 20 kg → 20', () => {
    expect(parseWeightKg('20 kg')).toBe(20);
  });

  it('parses lbs unit: 45lbs → 20.41', () => {
    expect(parseWeightKg('45lbs')).toBe(20.41);
  });

  it('parses lbs unit with space: 45 lbs → 20.41', () => {
    expect(parseWeightKg('45 lbs')).toBe(20.41);
  });

  it('parses unitless number as kg: 100 → 100', () => {
    expect(parseWeightKg('100')).toBe(100);
  });

  it('returns null for bodyweight string', () => {
    expect(parseWeightKg('bodyweight')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseWeightKg('')).toBeNull();
  });

  it('returns null for bw abbreviation', () => {
    expect(parseWeightKg('bw')).toBeNull();
  });

  it('returns null for dash placeholder', () => {
    expect(parseWeightKg('-')).toBeNull();
  });

  it('parses decimal kg: 22.5kg → 22.5', () => {
    expect(parseWeightKg('22.5kg')).toBe(22.5);
  });
});

// ── detectPR ──

describe('detectPR', () => {
  const entry = { exerciseId: 'squat', date: '2024-02-01', weight: '25kg' };

  it('detects PR when new weight beats existing: 25kg > 20kg', () => {
    const existing: PersonalRecord = {
      exerciseId: 'squat',
      weightKg: 20,
      weightRaw: '20kg',
      date: '2024-01-01',
    };
    const result = detectPR(entry, existing);
    expect(result).not.toBeNull();
    expect(result!.weightKg).toBe(25);
    expect(result!.improvementKg).toBe(5);
    expect(result!.date).toBe('2024-02-01');
  });

  it('returns null when new weight is lower than existing PR', () => {
    const existing: PersonalRecord = {
      exerciseId: 'squat',
      weightKg: 30,
      weightRaw: '30kg',
      date: '2024-01-01',
    };
    expect(detectPR(entry, existing)).toBeNull();
  });

  it('returns null when new weight equals existing PR', () => {
    const existing: PersonalRecord = {
      exerciseId: 'squat',
      weightKg: 25,
      weightRaw: '25kg',
      date: '2024-01-01',
    };
    expect(detectPR(entry, existing)).toBeNull();
  });

  it('returns PR with improvementKg=undefined when no existing PR', () => {
    const result = detectPR(entry, null);
    expect(result).not.toBeNull();
    expect(result!.weightKg).toBe(25);
    expect(result!.improvementKg).toBeUndefined();
  });

  it('returns null when weight string is empty', () => {
    const emptyEntry = { exerciseId: 'squat', date: '2024-02-01', weight: '' };
    expect(detectPR(emptyEntry, null)).toBeNull();
  });

  it('returns null when weight is bodyweight (unparseable)', () => {
    const bwEntry = { exerciseId: 'pullup', date: '2024-02-01', weight: 'bodyweight' };
    expect(detectPR(bwEntry, null)).toBeNull();
  });
});

// ── checkNewPRs ──

describe('checkNewPRs', () => {
  const makeEntry = (exerciseId: string, weight: string): ExerciseLogEntry => ({
    exerciseId,
    date: '2024-02-01',
    weight,
    reps: '5',
    sets: 3,
  });

  const existingPR = (exerciseId: string, weightKg: number): PersonalRecord => ({
    exerciseId,
    weightKg,
    weightRaw: `${weightKg}kg`,
    date: '2024-01-01',
  });

  it('returns PRs only for exercises that beat existing records', () => {
    const entries = [
      makeEntry('squat', '25kg'),
      makeEntry('bench', '60kg'),
    ];
    const currentPRs = [
      existingPR('squat', 20),
      existingPR('bench', 70),
    ];
    const result = checkNewPRs(entries, currentPRs);
    expect(result).toHaveLength(1);
    expect(result[0].exerciseId).toBe('squat');
  });

  it('returns PR for exercise with no existing record', () => {
    const entries = [makeEntry('deadlift', '100kg')];
    const result = checkNewPRs(entries, []);
    expect(result).toHaveLength(1);
    expect(result[0].improvementKg).toBeUndefined();
  });

  it('skips entries with empty or non-weight strings', () => {
    const entries = [
      makeEntry('pullup', 'bodyweight'),
      makeEntry('squat', ''),
    ];
    const result = checkNewPRs(entries, []);
    expect(result).toHaveLength(0);
  });

  it('handles multiple new PRs in one session', () => {
    const entries = [
      makeEntry('squat', '30kg'),
      makeEntry('bench', '80kg'),
    ];
    const currentPRs = [
      existingPR('squat', 25),
      existingPR('bench', 75),
    ];
    const result = checkNewPRs(entries, currentPRs);
    expect(result).toHaveLength(2);
  });
});
