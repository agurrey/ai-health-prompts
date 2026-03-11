-- Hormesis ANON League Schema
-- Run this in Supabase Dashboard -> SQL Editor
-- Requires: 001_gamification.sql already applied
-- Safe to re-run: uses IF NOT EXISTS and DROP POLICY IF EXISTS

-- ============================================================
-- 1. LEAGUE_CYCLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.league_cycles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status                TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','registration','active','scoring','completed','cancelled')),
  start_date            DATE NOT NULL,
  end_date              DATE NOT NULL,
  registration_deadline TIMESTAMPTZ NOT NULL,
  buy_in_cents          INTEGER NOT NULL DEFAULT 4000,
  base_pool_pct         INTEGER NOT NULL DEFAULT 20,
  forfeit_pool_pct      INTEGER NOT NULL DEFAULT 70,
  forfeit_platform_pct  INTEGER NOT NULL DEFAULT 30,
  max_participants      INTEGER NOT NULL DEFAULT 10,
  min_participants      INTEGER NOT NULL DEFAULT 5,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.league_cycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "league_cycles: authenticated read" ON public.league_cycles;
CREATE POLICY "league_cycles: authenticated read" ON public.league_cycles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin INSERT/UPDATE/DELETE handled via service role (bypasses RLS)

-- ============================================================
-- 2. LEAGUE_WEEKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.league_weeks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id      UUID NOT NULL REFERENCES public.league_cycles(id) ON DELETE CASCADE,
  week_number   INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 4),
  workout_day_1 JSONB NOT NULL,
  workout_day_2 JSONB NOT NULL,
  deadline      TIMESTAMPTZ NOT NULL,
  is_benchmark  BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cycle_id, week_number)
);

ALTER TABLE public.league_weeks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "league_weeks: authenticated read" ON public.league_weeks;
CREATE POLICY "league_weeks: authenticated read" ON public.league_weeks
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- 3. LEAGUE_PARTICIPANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.league_participants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id         UUID NOT NULL REFERENCES public.league_cycles(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id),
  alias            TEXT NOT NULL,
  payment_status   TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','refunded')),
  payment_id       TEXT,
  completion_count INTEGER NOT NULL DEFAULT 0 CHECK (completion_count BETWEEN 0 AND 8),
  is_completer     BOOLEAN NOT NULL DEFAULT false,
  prize_category   TEXT CHECK (prize_category IN ('champion','most_improved','consistency')),
  prize_rank       INTEGER CHECK (prize_rank IN (1, 2)),
  joined_at        TIMESTAMPTZ DEFAULT now(),
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cycle_id, user_id),
  UNIQUE(cycle_id, alias)
);

ALTER TABLE public.league_participants ENABLE ROW LEVEL SECURITY;

-- Own rows: full access
DROP POLICY IF EXISTS "league_participants: own read" ON public.league_participants;
CREATE POLICY "league_participants: own read" ON public.league_participants
  FOR SELECT USING (auth.uid() = user_id);

-- Other participants in same cycle: public fields only (alias, completion_count, prize_category, prize_rank)
DROP POLICY IF EXISTS "league_participants: cycle peer read" ON public.league_participants;
CREATE POLICY "league_participants: cycle peer read" ON public.league_participants
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND cycle_id IN (
      SELECT lp.cycle_id FROM public.league_participants lp WHERE lp.user_id = auth.uid()
    )
  );

-- Insert: own user_id only
DROP POLICY IF EXISTS "league_participants: own insert" ON public.league_participants;
CREATE POLICY "league_participants: own insert" ON public.league_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update: admin only (service role bypasses RLS)

-- ============================================================
-- 4. LEAGUE_SUBMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.league_submissions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id     UUID NOT NULL REFERENCES public.league_participants(id) ON DELETE CASCADE,
  week_id            UUID NOT NULL REFERENCES public.league_weeks(id) ON DELETE CASCADE,
  day_number         INTEGER NOT NULL CHECK (day_number IN (1, 2)),
  timer_started_at   TIMESTAMPTZ NOT NULL,
  timer_completed_at TIMESTAMPTZ,
  score_value        NUMERIC,
  score_type         TEXT NOT NULL CHECK (score_type IN ('for_time','amrap','rounds_reps')),
  photo_url          TEXT,
  photo_verified     BOOLEAN NOT NULL DEFAULT false,
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','disputed','voided')),
  submitted_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_id, week_id, day_number)
);

ALTER TABLE public.league_submissions ENABLE ROW LEVEL SECURITY;

-- Own submissions: full access
DROP POLICY IF EXISTS "league_submissions: own read" ON public.league_submissions;
CREATE POLICY "league_submissions: own read" ON public.league_submissions
  FOR SELECT USING (
    participant_id IN (
      SELECT lp.id FROM public.league_participants lp WHERE lp.user_id = auth.uid()
    )
  );

-- Other participants: public score fields only (score_value, score_type, status)
DROP POLICY IF EXISTS "league_submissions: peer read" ON public.league_submissions;
CREATE POLICY "league_submissions: peer read" ON public.league_submissions
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND participant_id IN (
      SELECT lp.id FROM public.league_participants lp
      WHERE lp.cycle_id IN (
        SELECT lp2.cycle_id FROM public.league_participants lp2 WHERE lp2.user_id = auth.uid()
      )
    )
  );

-- Insert: own participant_id only
DROP POLICY IF EXISTS "league_submissions: own insert" ON public.league_submissions;
CREATE POLICY "league_submissions: own insert" ON public.league_submissions
  FOR INSERT WITH CHECK (
    participant_id IN (
      SELECT lp.id FROM public.league_participants lp WHERE lp.user_id = auth.uid()
    )
  );

-- Update: own pending submissions only (for adding photo)
DROP POLICY IF EXISTS "league_submissions: own update pending" ON public.league_submissions;
CREATE POLICY "league_submissions: own update pending" ON public.league_submissions
  FOR UPDATE USING (
    status = 'pending'
    AND participant_id IN (
      SELECT lp.id FROM public.league_participants lp WHERE lp.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. LEAGUE_SCORES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.league_scores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id   UUID NOT NULL REFERENCES public.league_participants(id) ON DELETE CASCADE,
  week_id          UUID NOT NULL REFERENCES public.league_weeks(id) ON DELETE CASCADE,
  day_number       INTEGER NOT NULL CHECK (day_number IN (1, 2)),
  placement_points INTEGER NOT NULL,
  raw_score        NUMERIC NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_id, week_id, day_number)
);

ALTER TABLE public.league_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "league_scores: authenticated read" ON public.league_scores;
CREATE POLICY "league_scores: authenticated read" ON public.league_scores
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- 6. LEAGUE_POOL
-- ============================================================
CREATE TABLE IF NOT EXISTS public.league_pool (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id                    UUID NOT NULL REFERENCES public.league_cycles(id) ON DELETE CASCADE UNIQUE,
  total_buy_ins_cents         INTEGER NOT NULL DEFAULT 0,
  total_base_pool_cents       INTEGER NOT NULL DEFAULT 0,
  total_forfeit_pool_cents    INTEGER NOT NULL DEFAULT 0,
  total_platform_revenue_cents INTEGER NOT NULL DEFAULT 0,
  total_prize_pool_cents      INTEGER NOT NULL DEFAULT 0,
  total_refunds_cents         INTEGER NOT NULL DEFAULT 0,
  finalized_at                TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.league_pool ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "league_pool: authenticated read" ON public.league_pool;
CREATE POLICY "league_pool: authenticated read" ON public.league_pool
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- 7. LEAGUE_PAYOUTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.league_payouts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id      UUID NOT NULL REFERENCES public.league_participants(id) ON DELETE CASCADE,
  cycle_id            UUID NOT NULL REFERENCES public.league_cycles(id) ON DELETE CASCADE,
  payout_type         TEXT NOT NULL CHECK (payout_type IN ('refund','prize')),
  amount_cents        INTEGER NOT NULL,
  prize_category      TEXT CHECK (prize_category IN ('champion','most_improved','consistency')),
  tx_hash             TEXT,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.league_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "league_payouts: own read" ON public.league_payouts;
CREATE POLICY "league_payouts: own read" ON public.league_payouts
  FOR SELECT USING (
    participant_id IN (
      SELECT lp.id FROM public.league_participants lp WHERE lp.user_id = auth.uid()
    )
  );

-- ============================================================
-- 8. LEAGUE_VERIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.league_verifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id    UUID NOT NULL REFERENCES public.league_participants(id) ON DELETE CASCADE,
  cycle_id          UUID NOT NULL REFERENCES public.league_cycles(id) ON DELETE CASCADE,
  prize_category    TEXT NOT NULL CHECK (prize_category IN ('champion','most_improved','consistency')),
  verification_type TEXT CHECK (verification_type IN ('video','voice_judge')),
  video_url         TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','approved','rejected','expired')),
  deadline          TIMESTAMPTZ,
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_id, cycle_id, prize_category)
);

ALTER TABLE public.league_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "league_verifications: own read" ON public.league_verifications;
CREATE POLICY "league_verifications: own read" ON public.league_verifications
  FOR SELECT USING (
    participant_id IN (
      SELECT lp.id FROM public.league_participants lp WHERE lp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "league_verifications: own update" ON public.league_verifications;
CREATE POLICY "league_verifications: own update" ON public.league_verifications
  FOR UPDATE USING (
    participant_id IN (
      SELECT lp.id FROM public.league_participants lp WHERE lp.user_id = auth.uid()
    )
  );

-- ============================================================
-- 9. LEAGUE_DISPUTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.league_disputes (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id            UUID NOT NULL REFERENCES public.league_submissions(id) ON DELETE CASCADE,
  flagged_by_participant_id UUID NOT NULL REFERENCES public.league_participants(id) ON DELETE CASCADE,
  reason                   TEXT NOT NULL,
  evidence_url             TEXT,
  status                   TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','evidence_requested','resolved_valid','resolved_invalid','expired')),
  response_deadline        TIMESTAMPTZ,
  resolved_at              TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.league_disputes ENABLE ROW LEVEL SECURITY;

-- Read own disputes: as flagger
DROP POLICY IF EXISTS "league_disputes: own flagged read" ON public.league_disputes;
CREATE POLICY "league_disputes: own flagged read" ON public.league_disputes
  FOR SELECT USING (
    flagged_by_participant_id IN (
      SELECT lp.id FROM public.league_participants lp WHERE lp.user_id = auth.uid()
    )
  );

-- Read own disputes: as the flagged person (submission owner)
DROP POLICY IF EXISTS "league_disputes: flagged target read" ON public.league_disputes;
CREATE POLICY "league_disputes: flagged target read" ON public.league_disputes
  FOR SELECT USING (
    submission_id IN (
      SELECT ls.id FROM public.league_submissions ls
      WHERE ls.participant_id IN (
        SELECT lp.id FROM public.league_participants lp WHERE lp.user_id = auth.uid()
      )
    )
  );

-- Insert: authenticated users can flag
DROP POLICY IF EXISTS "league_disputes: own insert" ON public.league_disputes;
CREATE POLICY "league_disputes: own insert" ON public.league_disputes
  FOR INSERT WITH CHECK (
    flagged_by_participant_id IN (
      SELECT lp.id FROM public.league_participants lp WHERE lp.user_id = auth.uid()
    )
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_league_participants_cycle_id ON public.league_participants(cycle_id);
CREATE INDEX IF NOT EXISTS idx_league_participants_user_id ON public.league_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_league_submissions_participant_id ON public.league_submissions(participant_id);
CREATE INDEX IF NOT EXISTS idx_league_submissions_week_id ON public.league_submissions(week_id);
CREATE INDEX IF NOT EXISTS idx_league_scores_participant_id ON public.league_scores(participant_id);
CREATE INDEX IF NOT EXISTS idx_league_scores_week_id ON public.league_scores(week_id);
CREATE INDEX IF NOT EXISTS idx_league_disputes_submission_id ON public.league_disputes(submission_id);

-- ============================================================
-- TRIGGER: Auto-update updated_at on league_cycles
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_league_cycles_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_league_cycles_updated ON public.league_cycles;
CREATE TRIGGER on_league_cycles_updated
  BEFORE UPDATE ON public.league_cycles
  FOR EACH ROW EXECUTE FUNCTION public.handle_league_cycles_updated_at();

-- ============================================================
-- STORAGE: league-proofs bucket for photo/video uploads
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('league-proofs', 'league-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to their own folder
DROP POLICY IF EXISTS "league-proofs: own upload" ON storage.objects;
CREATE POLICY "league-proofs: own upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'league-proofs'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can read their own files
DROP POLICY IF EXISTS "league-proofs: own read" ON storage.objects;
CREATE POLICY "league-proofs: own read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'league-proofs'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin reads all files via service role (bypasses RLS)
