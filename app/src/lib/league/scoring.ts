import type {
  LeagueSubmission,
  LeagueScore,
  LeagueParticipant,
  StandingsEntry,
  ImprovementEntry,
  ConsistencyEntry,
  PrizeWinner,
  PrizeCategory,
  ScoreType,
  PrizeSplit,
} from '../types/league';

/**
 * Sort submissions by score and assign placement points (1st=1, 2nd=2, etc).
 * For `for_time`: lower score is better (ascending).
 * For `amrap` / `rounds_reps`: higher score is better (descending).
 */
export function calculatePlacementPoints(
  submissions: LeagueSubmission[],
  scoreType: ScoreType
): LeagueScore[] {
  const sorted = [...submissions].sort((a, b) => {
    if (scoreType === 'for_time') return a.score_value - b.score_value;
    return b.score_value - a.score_value;
  });

  return sorted.map((sub, i) => ({
    id: '',
    participant_id: sub.participant_id,
    week_id: sub.week_id,
    day_number: sub.day_number,
    placement_points: i + 1,
    raw_score: sub.score_value,
    created_at: new Date().toISOString(),
  }));
}

/**
 * Aggregate placement points across all events. Lower total = better rank.
 */
export function calculateStandings(
  scores: LeagueScore[],
  participants: LeagueParticipant[]
): StandingsEntry[] {
  const aliasMap = new Map<string, string>();
  for (const p of participants) {
    aliasMap.set(p.id, p.alias);
  }

  const totals = new Map<string, { points: number; events: number }>();
  for (const s of scores) {
    const current = totals.get(s.participant_id) || { points: 0, events: 0 };
    current.points += s.placement_points;
    current.events += 1;
    totals.set(s.participant_id, current);
  }

  const entries: StandingsEntry[] = Array.from(totals.entries()).map(
    ([pid, data]) => ({
      participant_id: pid,
      alias: aliasMap.get(pid) || 'Unknown',
      total_placement_points: data.points,
      rank: 0,
      events_completed: data.events,
    })
  );

  entries.sort((a, b) => a.total_placement_points - b.total_placement_points);
  for (let i = 0; i < entries.length; i++) {
    entries[i].rank = i + 1;
  }

  return entries;
}

/**
 * Calculate % improvement between week 1 (benchmark) and week 4 (benchmark).
 * Compares average placement points — lower in week 4 = improved.
 */
export function calculateImprovement(
  week1Scores: LeagueScore[],
  week4Scores: LeagueScore[]
): ImprovementEntry[] {
  const avg = (scores: LeagueScore[], pid: string): number => {
    const mine = scores.filter((s) => s.participant_id === pid);
    if (mine.length === 0) return 0;
    return mine.reduce((sum, s) => sum + s.placement_points, 0) / mine.length;
  };

  const participantSet = new Set<string>();
  for (const s of [...week1Scores, ...week4Scores]) {
    participantSet.add(s.participant_id);
  }

  const entries: ImprovementEntry[] = [];
  for (const pid of Array.from(participantSet)) {
    const w1 = avg(week1Scores, pid);
    const w4 = avg(week4Scores, pid);
    if (w1 === 0 || w4 === 0) continue;

    // Positive pct = improved (placement went down = better)
    const improvement_pct = ((w1 - w4) / w1) * 100;

    entries.push({
      participant_id: pid,
      alias: '',
      improvement_pct,
      week1_avg: w1,
      week4_avg: w4,
    });
  }

  entries.sort((a, b) => b.improvement_pct - a.improvement_pct);
  return entries;
}

/**
 * Calculate consistency as lowest variance in placement across all events.
 * Lower variance = more consistent performer.
 */
export function calculateConsistency(
  allScores: LeagueScore[]
): ConsistencyEntry[] {
  const grouped = new Map<string, number[]>();
  for (const s of allScores) {
    const arr = grouped.get(s.participant_id) || [];
    arr.push(s.placement_points);
    grouped.set(s.participant_id, arr);
  }

  const entries: ConsistencyEntry[] = Array.from(grouped.entries()).map(
    ([pid, placements]) => {
      const mean =
        placements.reduce((a, b) => a + b, 0) / placements.length;
      const variance =
        placements.reduce((sum, p) => sum + (p - mean) ** 2, 0) /
        placements.length;

      return {
        participant_id: pid,
        alias: '',
        variance,
        avg_placement: mean,
      };
    }
  );

  entries.sort((a, b) => a.variance - b.variance);
  return entries;
}

/**
 * Assign prize categories with no-overlap rolldown rule.
 * A participant can only win ONE category. If they'd win multiple,
 * they keep the highest-value one and the next person rolls up.
 */
export function determineWinners(
  standings: StandingsEntry[],
  improvement: ImprovementEntry[],
  consistency: ConsistencyEntry[],
  prizeSplit: PrizeSplit
): PrizeWinner[] {
  const winners: PrizeWinner[] = [];
  const claimed = new Set<string>();

  const tryAssign = (
    candidates: { participant_id: string; alias: string }[],
    category: PrizeCategory,
    amounts: [number, number]
  ) => {
    let assigned = 0;
    for (const c of candidates) {
      if (assigned >= 2) break;
      if (claimed.has(c.participant_id)) continue;

      claimed.add(c.participant_id);
      const rank = (assigned + 1) as 1 | 2;
      winners.push({
        participant_id: c.participant_id,
        alias: c.alias,
        category,
        rank,
        amount_cents: amounts[assigned],
      });
      assigned++;
    }
  };

  // Champion: top of standings (lowest total placement points)
  tryAssign(standings, 'champion', [
    prizeSplit.champion_1_cents,
    prizeSplit.champion_2_cents,
  ]);

  // Most Improved: highest improvement %
  tryAssign(improvement, 'most_improved', [
    prizeSplit.most_improved_1_cents,
    prizeSplit.most_improved_2_cents,
  ]);

  // Consistency: lowest variance
  tryAssign(consistency, 'consistency', [
    prizeSplit.consistency_1_cents,
    prizeSplit.consistency_2_cents,
  ]);

  return winners;
}
