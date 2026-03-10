-- Hormesis Gamification + Community Schema
-- Run this in Supabase Dashboard -> SQL Editor
-- Requires: Authentication -> Providers -> Anonymous Sign-Ins -> Enabled

-- ============================================================
-- 1. PROFILES
-- Extends auth.users. Auto-created via trigger on sign-up.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE,
  xp_level    INT NOT NULL DEFAULT 0,
  streak      INT NOT NULL DEFAULT 0,
  is_public   BOOLEAN NOT NULL DEFAULT false,
  league      TEXT NOT NULL DEFAULT 'bronze',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "profiles: own read" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles: own update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Public profiles readable by all authenticated users
CREATE POLICY "profiles: public read" ON public.profiles
  FOR SELECT USING (is_public = true AND auth.role() = 'authenticated');

-- ============================================================
-- 2. WORKOUTS
-- Synced completed workouts. One row per user per date.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workouts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  session_type  TEXT NOT NULL,
  xp_earned     INT NOT NULL DEFAULT 0,
  completed_at  TIMESTAMPTZ NOT NULL,
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workouts: own read" ON public.workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "workouts: own insert" ON public.workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workouts: own update" ON public.workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "workouts: own delete" ON public.workouts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 3. EXERCISE_LOGS
-- Synced exercise entries. One row per user per exercise per date.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id  TEXT NOT NULL,
  date         DATE NOT NULL,
  weight       TEXT NOT NULL DEFAULT '',
  reps         TEXT NOT NULL DEFAULT '',
  sets         INT NOT NULL DEFAULT 0,
  notes        TEXT,
  synced_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id, date)
);

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercise_logs: own read" ON public.exercise_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "exercise_logs: own insert" ON public.exercise_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "exercise_logs: own update" ON public.exercise_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "exercise_logs: own delete" ON public.exercise_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4. USER_ACHIEVEMENTS
-- Unlocked achievements per user. Composite PK prevents duplicates.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at    DATE NOT NULL,
  PRIMARY KEY (user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_achievements: own read" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_achievements: own insert" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_achievements: own update" ON public.user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_achievements: own delete" ON public.user_achievements
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 5. ACTIVITY_FEED
-- Public workout/achievement/PR/streak events.
-- IMPORTANT: event_data MUST NEVER contain weight or time values.
-- This is enforced at application level (see supabase.ts postFeedEvent).
-- Allowed keys: exercise_name, workout_name, achievement_id, streak_days, xp_earned.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN ('workout', 'achievement', 'pr', 'streak')),
  event_data  JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read public feed
CREATE POLICY "activity_feed: authenticated read" ON public.activity_feed
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users insert their own feed items only
CREATE POLICY "activity_feed: own insert" ON public.activity_feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own feed items
CREATE POLICY "activity_feed: own delete" ON public.activity_feed
  FOR DELETE USING (auth.uid() = user_id);

-- Index for feed queries (latest first)
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON public.activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON public.activity_feed(user_id);

-- ============================================================
-- 6. KUDOS
-- Reactions on feed items. One kudos per user per feed item.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kudos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id UUID NOT NULL REFERENCES public.activity_feed(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(feed_item_id, user_id)
);

ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read kudos
CREATE POLICY "kudos: authenticated read" ON public.kudos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users insert their own kudos only
CREATE POLICY "kudos: own insert" ON public.kudos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users delete their own kudos only (un-kudos)
CREATE POLICY "kudos: own delete" ON public.kudos
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 7. WEEKLY_LEADERBOARD
-- Materialized weekly stats, refreshed by refresh_weekly_leaderboard().
-- ============================================================
CREATE TABLE IF NOT EXISTS public.weekly_leaderboard (
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username        TEXT NOT NULL,
  league          TEXT NOT NULL,
  week_start      DATE NOT NULL,
  workouts_count  INT NOT NULL DEFAULT 0,
  rank            INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, week_start)
);

ALTER TABLE public.weekly_leaderboard ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read leaderboard
CREATE POLICY "weekly_leaderboard: authenticated read" ON public.weekly_leaderboard
  FOR SELECT USING (auth.role() = 'authenticated');

-- Index for leaderboard queries (by league + week + rank)
CREATE INDEX IF NOT EXISTS idx_weekly_leaderboard_league_week ON public.weekly_leaderboard(league, week_start, rank);

-- ============================================================
-- TRIGGER: Auto-create profile row on auth.users insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCTION: Refresh weekly leaderboard
-- Call this on a schedule (e.g. Supabase pg_cron, or from app on load)
-- Only includes public profiles with a username that have at least 1 workout this week.
-- ============================================================
CREATE OR REPLACE FUNCTION public.refresh_weekly_leaderboard()
RETURNS void AS $$
DECLARE
  week_start_date DATE;
BEGIN
  -- Current week Monday
  week_start_date := date_trunc('week', CURRENT_DATE)::DATE;

  DELETE FROM weekly_leaderboard WHERE week_start = week_start_date;

  INSERT INTO weekly_leaderboard (user_id, username, league, week_start, workouts_count, rank)
  SELECT
    p.id,
    p.username,
    p.league,
    week_start_date,
    COUNT(w.id)::INT,
    ROW_NUMBER() OVER (PARTITION BY p.league ORDER BY COUNT(w.id) DESC, p.created_at ASC)::INT
  FROM profiles p
  LEFT JOIN workouts w ON w.user_id = p.id
    AND w.date >= week_start_date
    AND w.date < week_start_date + 7
  WHERE p.is_public = true AND p.username IS NOT NULL
  GROUP BY p.id, p.username, p.league
  HAVING COUNT(w.id) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
