import type {
  LeagueParticipant,
  PoolConfig,
  PoolCalculation,
  PrizeSplit,
  RefundEntry,
} from '../types/league';

const DEFAULT_POOL_CONFIG: PoolConfig = {
  base_pool_pct: 20,
  forfeit_pool_pct: 70,
  forfeit_platform_pct: 30,
};

/**
 * Calculate the full economics of a league cycle.
 *
 * Each participant pays buy_in_cents ($40 = 4000).
 * - Completer: gets (100 - base_pool_pct)% back as refund. base_pool_pct% goes to pool.
 * - Dropout: refund portion is forfeit. Split: forfeit_pool_pct% to pool, forfeit_platform_pct% to platform.
 *   Base pool portion still goes to pool.
 */
export function calculatePool(
  participants: LeagueParticipant[],
  buyInCents: number,
  config: PoolConfig = DEFAULT_POOL_CONFIG
): PoolCalculation {
  const completers = participants.filter((p) => p.is_completer).length;
  const dropouts = participants.length - completers;

  const totalBuyIns = buyInCents * participants.length;

  const basePerPerson = Math.round(buyInCents * (config.base_pool_pct / 100));
  const refundPerPerson = buyInCents - basePerPerson;

  // Base pool: every participant contributes base_pool_pct of buy-in
  const totalBasePool = basePerPerson * participants.length;

  // Forfeit pool: dropouts lose their refund portion
  const totalForfeitAmount = refundPerPerson * dropouts;
  const totalForfeitPool = Math.round(
    totalForfeitAmount * (config.forfeit_pool_pct / 100)
  );
  const totalPlatformRevenue = Math.round(
    totalForfeitAmount * (config.forfeit_platform_pct / 100)
  );

  const totalRefunds = refundPerPerson * completers;
  const totalPrizePool = totalBasePool + totalForfeitPool;

  return {
    total_buy_ins_cents: totalBuyIns,
    total_base_pool_cents: totalBasePool,
    total_forfeit_pool_cents: totalForfeitPool,
    total_platform_revenue_cents: totalPlatformRevenue,
    total_prize_pool_cents: totalPrizePool,
    total_refunds_cents: totalRefunds,
    completers,
    dropouts,
  };
}

/**
 * Split the prize pool into 6 prizes across 3 categories.
 * Champion: 50% (30% + 20%), Most Improved: 30% (18% + 12%), Consistency: 20% (12% + 8%).
 */
export function calculatePrizeSplit(poolCents: number): PrizeSplit {
  return {
    champion_1_cents: Math.round(poolCents * 0.3),
    champion_2_cents: Math.round(poolCents * 0.2),
    most_improved_1_cents: Math.round(poolCents * 0.18),
    most_improved_2_cents: Math.round(poolCents * 0.12),
    consistency_1_cents: Math.round(poolCents * 0.12),
    consistency_2_cents: Math.round(poolCents * 0.08),
  };
}

/**
 * Calculate refund amounts for completers. Completers get (buy_in - base_pool_contribution) back.
 */
export function calculateRefunds(
  participants: LeagueParticipant[],
  buyInCents: number,
  basePoolPct: number = 20
): RefundEntry[] {
  const refundAmount = buyInCents - Math.round(buyInCents * (basePoolPct / 100));

  return participants
    .filter((p) => p.is_completer)
    .map((p) => ({
      participant_id: p.id,
      amount_cents: refundAmount,
    }));
}

/** Generate an anonymous alias like "Athlete_7K3F". */
export function generateAlias(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Athlete_${suffix}`;
}
