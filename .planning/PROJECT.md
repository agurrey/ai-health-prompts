# Hormesis v6: Gamification + Community

## What This Is

Hormesis is a bilingual (EN/ES) PWA that generates daily functional training workouts using deterministic algorithms — same date = same workout for everyone. Currently a solo localStorage app with 155 exercises, 31 WODs, 4-week periodization, equipment filtering, and an Adapt Panel for restrictions. This milestone adds gamification to drive retention and opt-in community features via Supabase.

## Core Value

Make users WANT to come back daily by gamifying consistency (not performance) and adding lightweight social proof — without breaking the free, offline-first experience.

## Requirements

### Validated

- ✓ Deterministic workout generation (seeded RNG, date-based) — v1
- ✓ 4-week periodization (accumulation/intensification/conditioning/realization) — v1
- ✓ Equipment filtering (dumbbells/bar/rope, onboarding + gear icon) — v3
- ✓ Restriction system (7 body-area chips, exercise filtering) — v5
- ✓ Adapt Panel (restrictions, equipment override, short mode) — v5
- ✓ Exercise logging (weight/reps per exercise) — v3
- ✓ Workout history with calendar and streaks — v3
- ✓ Export/import JSON backup — v4
- ✓ Bilingual EN/ES (context provider, localStorage-backed) — v1
- ✓ PWA (service worker, installable) — v2
- ✓ Workout timer — v3

### Active

- [ ] XP system — earn XP for completing workouts, logging exercises, streaks, PRs
- [ ] Achievement system — 15 bilingual badges unlockable through training milestones
- [ ] Personal record detection — auto-detect weight PRs from exercise logs
- [ ] Enhanced streak system — fire icon progression, streak freeze tokens, "at risk" warnings
- [ ] Level progression — exponential XP curve with visual level badge
- [ ] Profile page — XP bar, badge grid, streak widget, stats, PRs
- [ ] Supabase auth — anonymous-first, upgrade to email/magic link
- [ ] Cloud sync — offline-first, localStorage primary, Supabase opportunistic
- [ ] Weekly leaderboard — workouts/week by XP league (Bronze/Silver/Gold/Platinum)
- [ ] Activity feed — public workout/achievement/PR events with kudos
- [ ] Username system — claim username when upgrading to public profile

### Out of Scope

- Performance-based leaderboards — consistency only, never compare weights/times
- Comments/replies on feed — positive-only kudos, zero moderation needed
- Real-time features — no live chat, no live workout sync
- Paid tiers — everything stays free
- Native mobile app — PWA only
- Weight comparisons in feed — show WHAT people did, not HOW MUCH

## Context

- **Existing users** rely on localStorage — migration must be non-breaking
- **Supabase free tier**: 500MB DB, unlimited auth, 2M requests/mo, auto-pauses after 1 week inactivity
- **Same workout for everyone on same day** — this is a feature for community (shared experience)
- **Vercel free tier** — already deployed at hormesis-pt.vercel.app
- **No backend currently** — Supabase is the first external dependency
- **Gamification computed from localStorage** — never stored in Supabase directly, always recomputable

## Constraints

- **Budget**: Zero — Supabase + Vercel free tiers only
- **Offline-first**: localStorage = source of truth, always. Supabase sync is non-blocking
- **Bundle size**: `@supabase/supabase-js` (~45KB) dynamically imported only when user opts in
- **Migration**: v1 → v2 localStorage schema migration must preserve all existing data
- **Auto-pause**: Supabase DB sleeps after 1 week inactivity — app must handle wake-up gracefully
- **Bilingual**: All user-facing strings in EN + ES
- **No breaking changes**: Users without accounts keep using the app exactly as before

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Gamify consistency, not performance | Beginners and veterans compete equally on showing up | — Pending |
| localStorage stays primary | Zero-downtime, works offline, no Supabase dependency for core | — Pending |
| Anonymous-first auth | Lower barrier — try community before committing email | — Pending |
| Weekly leaderboard by league | Duolingo model — fresh shot every Monday, compete within XP tier | — Pending |
| Kudos only, no comments | Positive-only feed, zero moderation burden | — Pending |
| Dynamic import of Supabase | Zero bundle impact for solo users who never opt in | — Pending |
| XP computed client-side | Idempotent — always recalculable from workout history | — Pending |

---
*Last updated: 2026-03-10 after initialization*
