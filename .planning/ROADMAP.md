# Roadmap: Hormesis v6 — Gamification + Community

## Overview

Three phases that layer naturally: first build the gamification engine entirely in localStorage (no external deps, zero risk to existing users), then expose it through a dedicated profile UI, then add the optional Supabase layer for users who want community features. Each phase ships independently and the app stays fully functional throughout.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Gamification Core** - XP engine, achievements, PR detection, streak enhancement, and localStorage schema migration — zero external dependencies (completed 2026-03-10)
- [ ] **Phase 2: Profile Page** - Dedicated profile page exposing all gamification data with visual polish
- [ ] **Phase 3: Supabase + Community** - Optional auth, cloud sync, leaderboard, and activity feed

## Phase Details

### Phase 1: Gamification Core
**Goal**: Users earn XP, unlock achievements, see PRs detected automatically, and get enhanced streak feedback — all computed from localStorage with no new dependencies
**Depends on**: Nothing (extends existing localStorage schema)
**Requirements**: XP-01, XP-02, XP-03, XP-04, XP-05, XP-06, XP-07, XP-08, ACH-01, ACH-02, ACH-03, ACH-04, PR-01, PR-02, PR-03, STR-01, STR-02, STR-03, STR-04, MIG-01, MIG-02
**Success Criteria** (what must be TRUE):
  1. User completes a workout and sees an XP gain notification with the correct amount
  2. User logs a heavier weight for an exercise and sees a PR toast with XP reward
  3. User unlocks an achievement and sees a bilingual badge notification
  4. Streak fire icon changes color/size as streak grows, and shows "at risk" warning after 18:00 on incomplete days
  5. Existing users open the app after update and all previous workout history is intact with XP retroactively calculated
**Plans**: 6 plans

Plans:
- [x] 01-01-PLAN.md — Storage v2 migration + XP/level engine (gamification.ts)
- [x] 01-02-PLAN.md — PR detection (parseWeightKg, detectPR) + streak freeze token logic
- [x] 01-03-PLAN.md — Achievement definitions + checkAchievements evaluator (achievements.ts)
- [ ] 01-04-PLAN.md — Toast components (XPGainToast, AchievementToast) + CSS animations
- [ ] 01-05-PLAN.md — XPBar + StreakWidget UI components
- [ ] 01-06-PLAN.md — Wire gamification into workout completion flow + mount on homepage

### Phase 2: Profile Page
**Goal**: Users can navigate to a profile page that surfaces all gamification data — XP level, achievements, PRs, streak, and stats — in a coherent visual layout
**Depends on**: Phase 1
**Requirements**: PRF-01, PRF-02, PRF-03, PRF-04, PRF-05
**Success Criteria** (what must be TRUE):
  1. User navigates to /profile and sees their current XP level badge and progress bar to next level
  2. User sees achievement grid with unlocked badges in color (with unlock date) and locked badges greyed out with hint text
  3. User sees top 5 personal records showing exercise name, weight, and date
  4. User sees stats grid with total workouts, this-month count, favorite workout type, and completion rate
  5. User sees streak widget showing current streak, longest streak, and available freeze tokens
**Plans**: TBD

### Phase 3: Supabase + Community
**Goal**: Users can optionally join the community — anonymous or with email — sync their data to the cloud, compete on a weekly leaderboard, and see/give kudos in an activity feed
**Depends on**: Phase 2
**Requirements**: AUTH-01, AUTH-02, AUTH-03, SYNC-01, SYNC-02, SYNC-03, SYNC-04, COM-01, COM-02, COM-03, COM-04, COM-05, COM-06
**Success Criteria** (what must be TRUE):
  1. User can tap "Join Community" and get an anonymous session with zero friction (no email required)
  2. User can upgrade to a named account with email/magic link and claim a username
  3. User's workout data syncs in the background; app works fully offline and recovers gracefully from Supabase auto-pause
  4. User sees a weekly leaderboard showing the top 20 in their XP league, resetting every Monday
  5. User sees an activity feed of public workout completions and achievements, and can give one kudos per item — weights and times are never shown
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Gamification Core | 6/6 | Complete   | 2026-03-10 |
| 2. Profile Page | 0/TBD | Not started | - |
| 3. Supabase + Community | 0/TBD | Not started | - |
