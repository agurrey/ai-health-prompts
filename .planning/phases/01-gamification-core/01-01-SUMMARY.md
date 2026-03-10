---
phase: 01-gamification-core
plan: 01
subsystem: gamification
tags: [typescript, localStorage, xp-engine, migration, jest]

# Dependency graph
requires: []
provides:
  - "XP computation engine (computeXP, xpForLevel, getLevelFromXP, calculateTotalXP)"
  - "localStorage v2 schema with xp/xpLevel/achievements/personalRecords/freezeTokens"
  - "migrateIfNeeded: v1→v2 migration with retroactive XP processing"
  - "New storage accessors: getXP, addXP, getAchievements, addAchievement, getPersonalRecords, savePersonalRecord, getFreezeTokens, setFreezeTokens"
affects: [01-02, 01-03, 01-04, 01-05, 01-06]

# Tech tracking
tech-stack:
  added: [jest, ts-jest, @types/jest]
  patterns:
    - "Pure TypeScript XP engine with no React imports — fully testable"
    - "TDD: RED (failing tests) then GREEN (implementation) then build verify"
    - "Circular import avoided: gamification.ts uses `import type` from storage.ts"
    - "migrateIfNeeded pattern: version gate + retroactive computation + persist on change"

key-files:
  created:
    - app/src/lib/gamification.ts
    - app/src/__tests__/gamification.test.ts
    - app/jest.config.ts
  modified:
    - app/src/lib/storage.ts
    - app/package.json

key-decisions:
  - "xpForLevel(10) = 6500, xpForLevel(n>10) = 6500 + (n-10)*1000 — exponential base + linear extension"
  - "Streak bonus is 20 * streakDay (day 1 = 20, day 7 = 140 max) — first workout still earns streak XP"
  - "migrateIfNeeded is a pure function returning new object — no mutation, safe to call repeatedly"
  - "calculateTotalXP processes history chronologically — each workout sees only past workouts for streak accuracy"
  - "Jest + ts-jest added for TDD infrastructure — jest.config.ts uses testMatch to avoid deprecated testPathPattern"

patterns-established:
  - "XP engine pattern: pure functions, no side effects, import type only from storage.ts"
  - "Migration pattern: version check in migrateIfNeeded, auto-persist in loadData if version changed"
  - "Test helper pattern: makeWorkout/makeLogEntry factories in test files"

requirements-completed: [MIG-01, MIG-02, XP-01, XP-02, XP-03, XP-04, XP-05, XP-06, XP-07, XP-08]

# Metrics
duration: 5min
completed: 2026-03-10
---

# Phase 1 Plan 01: XP Engine + Storage v2 Migration Summary

**Pure TypeScript XP engine (computeXP/xpForLevel/getLevelFromXP) with localStorage v1→v2 migration that retroactively processes workout history to populate XP fields**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-10T15:44:23Z
- **Completed:** 2026-03-10T15:49:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- gamification.ts: XP engine with base/logs/streak/milestone/PR bonuses, level thresholds, and full history reprocessing
- storage.ts v2: extended HormesisData schema with xp/xpLevel/achievements/personalRecords/freezeTokens
- Automatic migration: existing users with v1 data get XP computed retroactively on next app load
- Jest + ts-jest test infrastructure with 23 passing tests covering all XP scenarios

## Task Commits

1. **Task 1 (RED): Add failing tests for XP engine** - `c22353a` (test)
2. **Task 1 (GREEN): Create gamification.ts XP/level engine** - `f79f2f1` (feat)
3. **Task 2: Migrate storage.ts to v2 schema** - `78556de` (feat)

## Files Created/Modified
- `app/src/lib/gamification.ts` - XP engine: computeXP, xpForLevel, getLevelFromXP, calculateTotalXP, XPGain type
- `app/src/__tests__/gamification.test.ts` - 23 tests covering all XP scenarios
- `app/jest.config.ts` - Jest + ts-jest config with @/ path alias
- `app/src/lib/storage.ts` - v2 schema, migrateIfNeeded, 8 new accessor/mutator exports
- `app/package.json` - jest, @types/jest, ts-jest devDependencies added

## Decisions Made
- xpForLevel(10) = 6500 (from planning context), then linear +1000/level after
- Streak bonus: 20 * streakDay starting at day 1 (not day 2) — matches spec "20 * streakDay"
- migrateIfNeeded is pure (returns new object) not mutating — safe for testing
- calculateTotalXP iterates chronologically, slicing allWorkouts per iteration for accurate streak detection

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed jest.config.ts deprecated testPathPattern field**
- **Found during:** Task 1 (build verification after GREEN)
- **Issue:** jest.config.ts used `testPathPattern` which is deprecated — caused TypeScript error in `npm run build` because Next.js type-checks all .ts files including config
- **Fix:** Replaced with `testMatch: ['**/__tests__/**/*.test.ts']`
- **Files modified:** app/jest.config.ts
- **Verification:** `npm run build` passes clean, tests still run
- **Committed in:** f79f2f1 (Task 1 feat commit)

**2. [Rule 1 - Bug] Corrected test expectations for streak XP on first workout**
- **Found during:** Task 1 (GREEN phase — tests failed with wrong expectations)
- **Issue:** Initial test file expected total=100 for single workout, but spec says "streak bonus: 20 * streakDay" — streakDay=1 gives 20 XP, so first workout total = 100+200(first)+20(streak)=320
- **Fix:** Updated test expectations to match spec; restructured tests that only want to test base+logs to use non-first workouts
- **Files modified:** app/src/__tests__/gamification.test.ts
- **Verification:** All 23 tests pass
- **Committed in:** f79f2f1 (included in Task 1 feat commit)

---

**Total deviations:** 2 auto-fixed (1 blocking config issue, 1 incorrect test expectations)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- None beyond the two auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- gamification.ts and storage.ts v2 are complete — preconditions for all other Phase 1 plans
- Plan 01-02 (streak freeze mechanics) can use getFreezeTokens/setFreezeTokens immediately
- Plan 01-03 (achievements) can use addAchievement/getAchievements immediately
- Plan 01-04 (XP UI bar) can use getXP/addXP immediately
- calculateTotalXP available for any plan that needs to recompute state

---
*Phase: 01-gamification-core*
*Completed: 2026-03-10*
