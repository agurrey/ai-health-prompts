// ANON League — TypeScript types for the 4-week paid competition system

// --- Enums ---

export type CycleStatus =
  | 'draft'
  | 'registration'
  | 'active'
  | 'scoring'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export type ScoreType = 'for_time' | 'amrap' | 'rounds_reps';

export type SubmissionStatus = 'pending' | 'verified' | 'disputed' | 'voided';

export type PrizeCategory = 'champion' | 'most_improved' | 'consistency';

export type PayoutType = 'refund' | 'prize';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type VerificationType = 'video' | 'voice_judge';

export type VerificationStatus =
  | 'pending'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'expired';

export type DisputeStatus =
  | 'open'
  | 'evidence_requested'
  | 'resolved_valid'
  | 'resolved_invalid'
  | 'expired';

// --- Table interfaces ---

export interface LeagueCycle {
  id: string;
  status: CycleStatus;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  buy_in_cents: number;          // default 4000 ($40)
  base_pool_pct: number;         // default 20
  forfeit_pool_pct: number;      // default 70
  forfeit_platform_pct: number;  // default 30
  max_participants: number;
  min_participants: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutDay {
  type: string;
  format: string;
  exercises: string[];
  target_score_type: ScoreType;
}

export interface LeagueWeek {
  id: string;
  cycle_id: string;
  week_number: 1 | 2 | 3 | 4;
  workout_day_1: WorkoutDay;
  workout_day_2: WorkoutDay;
  deadline: string;
  is_benchmark: boolean;         // true for week 1 and 4
  created_at: string;
}

export interface LeagueParticipant {
  id: string;
  cycle_id: string;
  user_id: string;
  alias: string;                 // auto-generated, e.g. "Athlete_7K3F"
  payment_status: PaymentStatus;
  payment_id: string | null;     // Crossmint payment ID
  completion_count: number;      // 0-8
  is_completer: boolean;
  prize_category: PrizeCategory | null;
  prize_rank: 1 | 2 | null;
  joined_at: string;
  created_at: string;
}

export interface LeagueSubmission {
  id: string;
  participant_id: string;
  week_id: string;
  day_number: 1 | 2;
  timer_started_at: string;
  timer_completed_at: string;
  score_value: number;           // seconds for for_time, reps for amrap
  score_type: ScoreType;
  photo_url: string | null;
  photo_verified: boolean;
  status: SubmissionStatus;
  submitted_at: string;
  created_at: string;
}

export interface LeagueScore {
  id: string;
  participant_id: string;
  week_id: string;
  day_number: 1 | 2;
  placement_points: number;      // 1st=1, 2nd=2, etc. Lower is better
  raw_score: number;
  created_at: string;
}

export interface LeaguePool {
  id: string;
  cycle_id: string;
  total_buy_ins_cents: number;
  total_base_pool_cents: number;
  total_forfeit_pool_cents: number;
  total_platform_revenue_cents: number;
  total_prize_pool_cents: number;
  total_refunds_cents: number;
  finalized_at: string | null;
  created_at: string;
}

export interface LeaguePayout {
  id: string;
  participant_id: string;
  cycle_id: string;
  payout_type: PayoutType;
  amount_cents: number;
  prize_category: PrizeCategory | null;
  crossmint_payout_id: string | null;
  status: PayoutStatus;
  created_at: string;
}

export interface LeagueVerification {
  id: string;
  participant_id: string;
  cycle_id: string;
  prize_category: PrizeCategory;
  verification_type: VerificationType;
  video_url: string | null;
  status: VerificationStatus;
  deadline: string;
  reviewed_at: string | null;
  created_at: string;
}

export interface LeagueDispute {
  id: string;
  submission_id: string;
  flagged_by_participant_id: string;
  reason: string;
  evidence_url: string | null;   // video from flagged person
  status: DisputeStatus;
  response_deadline: string;
  resolved_at: string | null;
  created_at: string;
}

// --- Helper / view types ---

export interface StandingsEntry {
  participant_id: string;
  alias: string;
  total_placement_points: number; // lower = better
  rank: number;
  events_completed: number;
}

export interface ImprovementEntry {
  participant_id: string;
  alias: string;
  improvement_pct: number;       // positive = improved
  week1_avg: number;
  week4_avg: number;
}

export interface ConsistencyEntry {
  participant_id: string;
  alias: string;
  variance: number;              // lower = more consistent
  avg_placement: number;
}

export interface PrizeWinner {
  participant_id: string;
  alias: string;
  category: PrizeCategory;
  rank: 1 | 2;
  amount_cents: number;
}

export interface PrizeSplit {
  champion_1_cents: number;      // 30% of pool
  champion_2_cents: number;      // 20% of pool
  most_improved_1_cents: number; // 18% of pool
  most_improved_2_cents: number; // 12% of pool
  consistency_1_cents: number;   // 12% of pool
  consistency_2_cents: number;   // 8% of pool
}

export interface PoolConfig {
  base_pool_pct: number;         // default 20
  forfeit_pool_pct: number;      // default 70
  forfeit_platform_pct: number;  // default 30
}

export interface PoolCalculation {
  total_buy_ins_cents: number;
  total_base_pool_cents: number;
  total_forfeit_pool_cents: number;
  total_platform_revenue_cents: number;
  total_prize_pool_cents: number;
  total_refunds_cents: number;
  completers: number;
  dropouts: number;
}

export interface RefundEntry {
  participant_id: string;
  amount_cents: number;
}

export interface WeeklySchedule {
  week: LeagueWeek;
  day1_submitted: boolean;
  day2_submitted: boolean;
  deadline_passed: boolean;
}

export interface LeagueDashboard {
  cycle: LeagueCycle;
  participant: LeagueParticipant;
  standings: StandingsEntry[];
  schedule: WeeklySchedule[];
  my_rank: number;
  events_remaining: number;
}
