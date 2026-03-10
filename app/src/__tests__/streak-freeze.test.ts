import { getStreakFreezeState } from '@/lib/gamification';

// Note: getStreak() from storage.ts is tested separately (requires localStorage mock)
// This file tests the pure getStreakFreezeState logic

describe('getStreakFreezeState', () => {
  const today = '2024-03-10';

  it('returns no freeze when today is already done', () => {
    const completedDates = new Set([today, '2024-03-09']);
    const result = getStreakFreezeState({ todayStr: today, completedDates, freezeTokens: 1 });
    expect(result.freezeActive).toBe(false);
    expect(result.tokensRemaining).toBe(1);
    expect(result.streakProtected).toBe(false);
  });

  it('returns no freeze when no tokens available (would break streak)', () => {
    const completedDates = new Set(['2024-03-09']);
    const result = getStreakFreezeState({ todayStr: today, completedDates, freezeTokens: 0 });
    expect(result.freezeActive).toBe(false);
    expect(result.tokensRemaining).toBe(0);
    expect(result.streakProtected).toBe(false);
  });

  it('activates freeze when yesterday done, today not done, tokens available', () => {
    const completedDates = new Set(['2024-03-09']);
    const result = getStreakFreezeState({ todayStr: today, completedDates, freezeTokens: 1 });
    expect(result.freezeActive).toBe(true);
    expect(result.tokensRemaining).toBe(0);
    expect(result.streakProtected).toBe(true);
  });

  it('consumes one token when freeze activates (2 tokens → 1 remaining)', () => {
    const completedDates = new Set(['2024-03-09']);
    const result = getStreakFreezeState({ todayStr: today, completedDates, freezeTokens: 2 });
    expect(result.freezeActive).toBe(true);
    expect(result.tokensRemaining).toBe(1);
    expect(result.streakProtected).toBe(true);
  });

  it('returns no freeze when yesterday was NOT done (streak already broken)', () => {
    // No workout yesterday — streak already broken, freeze does not trigger
    const completedDates = new Set(['2024-03-08']); // two days ago, not yesterday
    const result = getStreakFreezeState({ todayStr: today, completedDates, freezeTokens: 2 });
    expect(result.freezeActive).toBe(false);
    expect(result.streakProtected).toBe(false);
  });

  it('returns no freeze when completedDates is empty', () => {
    const result = getStreakFreezeState({ todayStr: today, completedDates: new Set(), freezeTokens: 2 });
    expect(result.freezeActive).toBe(false);
    expect(result.streakProtected).toBe(false);
  });
});
