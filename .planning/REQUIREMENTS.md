# Requirements: Hormesis v6

**Defined:** 2026-03-10
**Core Value:** Make users WANT to come back daily by gamifying consistency and adding lightweight social proof

## v1 Requirements

### XP System

- [x] **XP-01**: User earns 100 XP for completing a workout
- [x] **XP-02**: User earns 150 XP for completing a workout with exercise logs
- [x] **XP-03**: User earns streak bonus XP (20 x streak_day, capped at 7 days)
- [x] **XP-04**: User earns 50 XP for setting a new personal record
- [x] **XP-05**: User earns 200 XP for their first workout ever
- [x] **XP-06**: User earns 300 XP bonus for reaching a 7-day streak
- [x] **XP-07**: User earns 1000 XP for completing a full 28-day mesocycle
- [x] **XP-08**: User sees XP level badge with exponential progression curve

### Achievements

- [x] **ACH-01**: User unlocks 15 bilingual achievements based on training milestones
- [x] **ACH-02**: User sees achievement toast notification when unlocking a badge
- [x] **ACH-03**: First 3 achievements are unlockable within the first week (early wins)
- [x] **ACH-04**: Achievement conditions cover workouts, streaks, PRs, logging, time-of-day, adapt usage

### Personal Records

- [x] **PR-01**: App auto-detects weight PRs by parsing exercise log strings ("20kg", "45lbs")
- [x] **PR-02**: User sees toast + XP gain when setting a new PR
- [x] **PR-03**: PRs are tracked per exercise with weight, date, and improvement delta

### Streak Enhancement

- [x] **STR-01**: Streak fire icon with size/color progression (green → yellow → orange → red)
- [x] **STR-02**: User sees "Streak at risk!" warning after 18:00 if today not completed
- [x] **STR-03**: User earns streak freeze tokens (1 per 7-day streak, max 2 stored)
- [x] **STR-04**: Freeze token auto-activates to preserve streak for 1 missed day

### Profile

- [ ] **PRF-01**: User can view profile page with XP level, total XP, and progress bar
- [ ] **PRF-02**: Profile shows achievement grid (unlocked = color + date, locked = grey + hint)
- [ ] **PRF-03**: Profile shows top 5 personal records with exercise, weight, date
- [ ] **PRF-04**: Profile shows stats grid (total workouts, this month, favorite type, completion rate)
- [ ] **PRF-05**: Profile shows streak widget with current/longest streak and freeze tokens

### Auth & Sync

- [ ] **AUTH-01**: User can join community via anonymous Supabase session (zero-friction)
- [ ] **AUTH-02**: User can upgrade to email/magic link to claim username and public profile
- [ ] **AUTH-03**: Supabase client dynamically imported only when user opts in (~45KB)

- [ ] **SYNC-01**: Workout data syncs to Supabase with last-write-wins strategy
- [ ] **SYNC-02**: Failed sync writes queue to localStorage and drain on reconnect
- [ ] **SYNC-03**: App handles Supabase auto-pause with wake-up ping + "Connecting..." state
- [ ] **SYNC-04**: localStorage remains source of truth — app works fully offline

### Community

- [ ] **COM-01**: User can set username when upgrading to public profile
- [ ] **COM-02**: Weekly leaderboard shows top 20 in user's XP league (workouts/week, Mon-Sun)
- [ ] **COM-03**: Leaderboard has 4 leagues: Bronze (level 1-3), Silver (4-6), Gold (7-10), Platinum (11+)
- [ ] **COM-04**: Activity feed shows public workout completions, achievements, and PRs
- [ ] **COM-05**: User can give kudos (fist-bump) on feed items (1 per user per item)
- [ ] **COM-06**: Feed shows WHAT people did, never HOW MUCH (no weights/times displayed)

### Storage Migration

- [x] **MIG-01**: localStorage v1 → v2 migration adds gamification fields without data loss
- [x] **MIG-02**: Existing workout history is retroactively processed for XP and achievements

## v2 Requirements

### Notifications
- **NOTF-01**: Push notification for "streak at risk" (requires service worker update)
- **NOTF-02**: Weekly summary notification (workouts, XP earned, leaderboard rank)

### Social
- **SOCL-01**: User can follow specific users to filter feed
- **SOCL-02**: User can view another user's public profile

### Gamification
- **GAME-01**: Monthly challenges (community-wide goals)
- **GAME-02**: Seasonal badges (limited-time achievements)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Performance-based leaderboards | Gamify consistency, not performance — beginners and veterans compete equally |
| Comments/replies on feed | Positive-only kudos keeps it zero-moderation |
| Real-time features | No live chat, no live workout sync — unnecessary complexity |
| Paid tiers | Everything stays free |
| Native mobile app | PWA only |
| Weight comparisons in feed | Show WHAT people did, not HOW MUCH |
| Direct messaging | Out of scope — social interaction is kudos only |
| OAuth providers | Email/magic link sufficient, simpler than Google/GitHub OAuth |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| XP-01 | Phase 1 | Complete |
| XP-02 | Phase 1 | Complete |
| XP-03 | Phase 1 | Complete |
| XP-04 | Phase 1 | Complete |
| XP-05 | Phase 1 | Complete |
| XP-06 | Phase 1 | Complete |
| XP-07 | Phase 1 | Complete |
| XP-08 | Phase 1 | Complete |
| ACH-01 | Phase 1 | Complete |
| ACH-02 | Phase 1 | Complete |
| ACH-03 | Phase 1 | Complete |
| ACH-04 | Phase 1 | Complete |
| PR-01 | Phase 1 | Complete |
| PR-02 | Phase 1 | Complete |
| PR-03 | Phase 1 | Complete |
| STR-01 | Phase 1 | Complete |
| STR-02 | Phase 1 | Complete |
| STR-03 | Phase 1 | Complete |
| STR-04 | Phase 1 | Complete |
| MIG-01 | Phase 1 | Pending |
| MIG-02 | Phase 1 | Pending |
| PRF-01 | Phase 2 | Pending |
| PRF-02 | Phase 2 | Pending |
| PRF-03 | Phase 2 | Pending |
| PRF-04 | Phase 2 | Pending |
| PRF-05 | Phase 2 | Pending |
| AUTH-01 | Phase 3 | Pending |
| AUTH-02 | Phase 3 | Pending |
| AUTH-03 | Phase 3 | Pending |
| SYNC-01 | Phase 3 | Pending |
| SYNC-02 | Phase 3 | Pending |
| SYNC-03 | Phase 3 | Pending |
| SYNC-04 | Phase 3 | Pending |
| COM-01 | Phase 3 | Pending |
| COM-02 | Phase 3 | Pending |
| COM-03 | Phase 3 | Pending |
| COM-04 | Phase 3 | Pending |
| COM-05 | Phase 3 | Pending |
| COM-06 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after initial definition*
