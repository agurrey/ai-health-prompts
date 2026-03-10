import {
  computeXP,
  xpForLevel,
  getLevelFromXP,
  calculateTotalXP,
} from '@/lib/gamification';
import type { CompletedWorkout, ExerciseLogEntry } from '@/lib/storage';

// Helpers
function makeWorkout(date: string): CompletedWorkout {
  return { date, level: 2, sessionType: 'Full Body', completedAt: Date.now() };
}

function makeLogEntry(date: string, weight = ''): ExerciseLogEntry {
  return { exerciseId: 'squat', date, weight, reps: '10', sets: 3 };
}

describe('xpForLevel', () => {
  it('returns 0 for level 0', () => {
    expect(xpForLevel(0)).toBe(0);
  });

  it('returns 100 for level 1', () => {
    expect(xpForLevel(1)).toBe(100);
  });

  it('returns 6500 for level 10', () => {
    expect(xpForLevel(10)).toBe(6500);
  });

  it('returns 7500 for level 11', () => {
    expect(xpForLevel(11)).toBe(7500);
  });

  it('returns 8500 for level 12', () => {
    expect(xpForLevel(12)).toBe(8500);
  });
});

describe('getLevelFromXP', () => {
  it('returns 0 for 0 XP', () => {
    expect(getLevelFromXP(0)).toBe(0);
  });

  it('returns 1 for 100 XP', () => {
    expect(getLevelFromXP(100)).toBe(1);
  });

  it('returns 1 for 299 XP', () => {
    expect(getLevelFromXP(299)).toBe(1);
  });

  it('returns 2 for 300 XP', () => {
    expect(getLevelFromXP(300)).toBe(2);
  });

  it('returns 10 for 6500 XP', () => {
    expect(getLevelFromXP(6500)).toBe(10);
  });
});

describe('computeXP', () => {
  it('base and streak bonus only (not first workout): 100 base + 40 streak for day 2', () => {
    // Use workout that is NOT first-ever, to isolate base+streak only
    const w1 = makeWorkout('2024-01-05');
    const w2 = makeWorkout('2024-01-06');
    const result = computeXP({ workout: w2, exerciseLog: [], allWorkouts: [w1, w2] });
    expect(result.base).toBe(100);
    expect(result.logsBonus).toBe(0);
    expect(result.milestoneBonus).toBe(0);
    expect(result.streakBonus).toBe(40); // streakDay=2, 2*20=40
    expect(result.total).toBe(140);
  });

  it('returns 190 XP for non-first workout with logged weight (100 + 50 logs + 40 streak)', () => {
    const w1 = makeWorkout('2024-01-05');
    const w2 = makeWorkout('2024-01-06');
    const log = [makeLogEntry('2024-01-06', '20kg')];
    const result = computeXP({ workout: w2, exerciseLog: log, allWorkouts: [w1, w2] });
    expect(result.logsBonus).toBe(50);
    expect(result.streakBonus).toBe(40);
    expect(result.total).toBe(190); // 100 base + 50 logs + 40 streak
  });

  it('no logs bonus for entries with empty weight', () => {
    const w1 = makeWorkout('2024-01-05');
    const w2 = makeWorkout('2024-01-06');
    const log = [makeLogEntry('2024-01-06', '')];
    const result = computeXP({ workout: w2, exerciseLog: log, allWorkouts: [w1, w2] });
    expect(result.logsBonus).toBe(0);
    expect(result.total).toBe(140); // 100 base + 40 streak, no logs bonus
  });

  it('adds 200 first-workout bonus when only 1 workout in history', () => {
    const workout = makeWorkout('2024-01-01');
    const result = computeXP({ workout, exerciseLog: [], allWorkouts: [workout] });
    expect(result.milestoneBonus).toBe(200);
    expect(result.total).toBe(320); // 100 base + 200 first workout + 20 streak day 1
  });

  it('no first-workout bonus when more than 1 workout exists', () => {
    const w1 = makeWorkout('2024-01-01');
    const w2 = makeWorkout('2024-01-02');
    const result = computeXP({ workout: w2, exerciseLog: [], allWorkouts: [w1, w2] });
    expect(result.milestoneBonus).toBe(0);
  });

  it('computes streak bonus: 3-day streak = 60 XP (3 * 20)', () => {
    const workouts = [
      makeWorkout('2024-01-01'),
      makeWorkout('2024-01-02'),
      makeWorkout('2024-01-03'),
    ];
    const result = computeXP({ workout: workouts[2], exerciseLog: [], allWorkouts: workouts });
    expect(result.streakBonus).toBe(60);
  });

  it('streak bonus capped at 7 days = 140 XP', () => {
    const workouts = Array.from({ length: 10 }, (_, i) =>
      makeWorkout(`2024-01-${String(i + 1).padStart(2, '0')}`)
    );
    const result = computeXP({ workout: workouts[9], exerciseLog: [], allWorkouts: workouts });
    expect(result.streakBonus).toBe(140); // capped at 7 * 20
  });

  it('adds 300 milestone bonus on 7th day of consecutive streak', () => {
    const workouts = Array.from({ length: 7 }, (_, i) =>
      makeWorkout(`2024-01-${String(i + 1).padStart(2, '0')}`)
    );
    const result = computeXP({ workout: workouts[6], exerciseLog: [], allWorkouts: workouts });
    expect(result.milestoneBonus).toBe(300);
    expect(result.streakBonus).toBe(140);
  });

  it('adds PR bonus: 50 per PR', () => {
    const workout = makeWorkout('2024-01-01');
    const result = computeXP({ workout, exerciseLog: [], allWorkouts: [workout], prCount: 2 });
    expect(result.prBonus).toBe(100);
  });

  it('breakdown string contains expected parts', () => {
    const workout = makeWorkout('2024-01-05');
    const log = [makeLogEntry('2024-01-05', '20kg')];
    const allWorkouts = [
      makeWorkout('2024-01-03'),
      makeWorkout('2024-01-04'),
      makeWorkout('2024-01-05'),
    ];
    const result = computeXP({ workout, exerciseLog: log, allWorkouts });
    // streakDay=2 (2 consecutive: 04, 05 — but 03 is not consecutive with 04 only 1 gap)
    // Actually 03, 04, 05 = consecutive 3 days, streakDay=3
    expect(result.breakdown).toContain('100');
    expect(result.breakdown).toContain('50');
    expect(result.streakBonus).toBe(60); // streakDay=3, 3*20=60
  });
});

describe('calculateTotalXP', () => {
  it('returns 0 XP and level 0 for empty history', () => {
    const result = calculateTotalXP([], []);
    expect(result.totalXP).toBe(0);
    expect(result.level).toBe(0);
  });

  it('processes single workout with first-workout bonus', () => {
    const workouts = [makeWorkout('2024-01-01')];
    const result = calculateTotalXP(workouts, []);
    // 100 base + 200 first-workout + 20 streak (day 1) = 320
    expect(result.totalXP).toBe(320);
    expect(result.level).toBe(2); // 320 XP = level 2 (threshold is 300)
  });

  it('accumulates XP across multiple workouts', () => {
    const workouts = [
      makeWorkout('2024-01-01'),
      makeWorkout('2024-01-02'),
    ];
    // Workout 1: 100 base + 200 first + 20 streak (day 1) = 320
    // Workout 2: 100 base + 40 streak (day 2) = 140
    // Total: 460
    const result = calculateTotalXP(workouts, []);
    expect(result.totalXP).toBe(460);
  });
});
