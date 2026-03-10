---
phase: 01-gamification-core
plan: "03"
subsystem: gamification
tags: [achievements, pure-logic, bilingual, typescript]
dependency_graph:
  requires: [01-01]
  provides: [achievements-engine]
  affects: []
tech_stack:
  added: []
  patterns: [pure-function, parameter-injection, bilingual-content]
key_files:
  created:
    - app/src/lib/achievements.ts
  modified: []
decisions:
  - community achievement defined but condition never evaluates true in Phase 1 — reserved for Phase 3
  - all-patterns simplified to >= 4 workouts in any Mon-Sun week (sufficient proxy for 4 distinct weekday session types)
  - full-cycle uses last-28-days window matching isMesocycleComplete pattern in gamification.ts
  - getWorkoutsWithLogs exported for reuse by callers who need the count
metrics:
  duration: 2 min
  completed: 2026-03-10
  tasks_completed: 1
  files_created: 1
---

# Phase 1 Plan 3: Achievement Definitions and Evaluator Summary

Pure-logic achievements module with 15 bilingual entries and a `checkAchievements` evaluator that returns newly unlocked IDs given current workout state.

## What Was Built

`app/src/lib/achievements.ts` — no React, no runtime storage imports. Receives state as parameters, returns newly unlocked achievement IDs. Called alongside XP computation at workout completion.

### Exports
- `Achievement` — interface for achievement definition shape
- `AchievementCheckParams` — interface for evaluator input
- `ACHIEVEMENTS` — 15 achievement objects with bilingual name/description + icon + xpReward
- `checkAchievements(params)` — returns `string[]` of newly unlocked IDs
- `getWorkoutsWithLogs(completedWorkouts, exerciseLog)` — helper counting workouts with logged weights

### Achievement Catalog (15 total)

| id | icon | condition | category |
|----|------|-----------|----------|
| first-sweat | 🔥 | 1 workout | onboarding |
| three-peat | ⚡ | 3 workouts | onboarding |
| week-warrior | 🗓️ | 7 workouts total | onboarding |
| iron-habit | 🔗 | 14-day streak | streak |
| unbreakable | 💎 | 30-day streak | streak |
| full-cycle | ♻️ | 28 workouts in last 28 days | mesocycle |
| pr-hunter | 🏆 | 5 PRs | strength |
| log-keeper | 📋 | 10 workouts with logs | logging |
| all-patterns | 🎯 | 4 workouts in one Mon-Sun week | consistency |
| level-up | ⬆️ | XP level 5 | progression |
| centurion | 💯 | 100 workouts | milestone |
| early-bird | 🌅 | workout before 08:00 | time-of-day |
| night-owl | 🦉 | workout after 22:00 | time-of-day |
| adaptor | 🔧 | adapted workout completed | feature-usage |
| community | 🌍 | reserved Phase 3 | social |

### First-Week Achievable (ACH-03 verified)
- first-sweat — day 1
- three-peat — day 3
- week-warrior — day 7

### Condition Coverage (ACH-04 verified)
- Workouts: first-sweat, three-peat, week-warrior, centurion
- Streaks: iron-habit, unbreakable
- PRs: pr-hunter
- Logging: log-keeper
- Time-of-day: early-bird, night-owl
- Adapt usage: adaptor

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- No React imports: PASS
- ACHIEVEMENTS.length === 15: PASS
- All 15 entries have name, name_es, description, description_es: PASS
- npm run build: PASS (clean, no errors)

## Self-Check

**Commits:**
- `3251af5` — feat(01-03): add achievements.ts with 15 definitions and checkAchievements evaluator

**File existence:**
- `app/src/lib/achievements.ts`: FOUND

## Self-Check: PASSED
