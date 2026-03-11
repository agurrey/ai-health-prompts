-- Fix infinite recursion in league_participants RLS
-- The "cycle peer read" policy queries league_participants inside a policy on league_participants
-- Solution: SECURITY DEFINER helper functions that bypass RLS for self-referencing lookups
-- Safe to re-run: uses CREATE OR REPLACE and DROP POLICY IF EXISTS

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER = bypass RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_league_cycle_ids(uid UUID)
RETURNS SETOF UUID AS $$
  SELECT cycle_id FROM public.league_participants WHERE user_id = uid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_participant_ids(uid UUID)
RETURNS SETOF UUID AS $$
  SELECT id FROM public.league_participants WHERE user_id = uid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- FIX: league_participants (was self-referencing → infinite recursion)
-- ============================================================

DROP POLICY IF EXISTS "league_participants: cycle peer read" ON public.league_participants;
CREATE POLICY "league_participants: cycle peer read" ON public.league_participants
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND cycle_id IN (SELECT public.get_user_league_cycle_ids(auth.uid()))
  );

-- ============================================================
-- FIX: league_submissions (referenced league_participants → triggered recursion)
-- ============================================================

DROP POLICY IF EXISTS "league_submissions: own read" ON public.league_submissions;
CREATE POLICY "league_submissions: own read" ON public.league_submissions
  FOR SELECT USING (
    participant_id IN (SELECT public.get_user_participant_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "league_submissions: peer read" ON public.league_submissions;
CREATE POLICY "league_submissions: peer read" ON public.league_submissions
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND participant_id IN (
      SELECT lp.id FROM public.league_participants lp
      WHERE lp.cycle_id IN (SELECT public.get_user_league_cycle_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "league_submissions: own insert" ON public.league_submissions;
CREATE POLICY "league_submissions: own insert" ON public.league_submissions
  FOR INSERT WITH CHECK (
    participant_id IN (SELECT public.get_user_participant_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "league_submissions: own update pending" ON public.league_submissions;
CREATE POLICY "league_submissions: own update pending" ON public.league_submissions
  FOR UPDATE USING (
    status = 'pending'
    AND participant_id IN (SELECT public.get_user_participant_ids(auth.uid()))
  );

-- ============================================================
-- FIX: league_payouts
-- ============================================================

DROP POLICY IF EXISTS "league_payouts: own read" ON public.league_payouts;
CREATE POLICY "league_payouts: own read" ON public.league_payouts
  FOR SELECT USING (
    participant_id IN (SELECT public.get_user_participant_ids(auth.uid()))
  );

-- ============================================================
-- FIX: league_verifications
-- ============================================================

DROP POLICY IF EXISTS "league_verifications: own read" ON public.league_verifications;
CREATE POLICY "league_verifications: own read" ON public.league_verifications
  FOR SELECT USING (
    participant_id IN (SELECT public.get_user_participant_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "league_verifications: own update" ON public.league_verifications;
CREATE POLICY "league_verifications: own update" ON public.league_verifications
  FOR UPDATE USING (
    participant_id IN (SELECT public.get_user_participant_ids(auth.uid()))
  );

-- ============================================================
-- FIX: league_disputes
-- ============================================================

DROP POLICY IF EXISTS "league_disputes: own flagged read" ON public.league_disputes;
CREATE POLICY "league_disputes: own flagged read" ON public.league_disputes
  FOR SELECT USING (
    flagged_by_participant_id IN (SELECT public.get_user_participant_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "league_disputes: flagged target read" ON public.league_disputes;
CREATE POLICY "league_disputes: flagged target read" ON public.league_disputes
  FOR SELECT USING (
    submission_id IN (
      SELECT ls.id FROM public.league_submissions ls
      WHERE ls.participant_id IN (SELECT public.get_user_participant_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "league_disputes: own insert" ON public.league_disputes;
CREATE POLICY "league_disputes: own insert" ON public.league_disputes
  FOR INSERT WITH CHECK (
    flagged_by_participant_id IN (SELECT public.get_user_participant_ids(auth.uid()))
  );
