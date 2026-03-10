---
phase: 01-gamification-core
plan: 02
subsystem: gamification
tags: [typescript, weight-parsing, pr-detection, streak-freeze, tdd, jest]

requires:
  - phase: 01-gamification-core
    plan: 01
    provides: "XP engine, storage v2 schema with PersonalRecord/freezeTokens fields, getFreezeTokens/setFreezeTokens"

provides:
  - "parseWeightKg: parses kg, lbs, unitless weight strings; returns null for non-weight inputs"
  - "detectPR: compares weight against stored PR, returns new PersonalRecord or null"
  - "checkNewPRs: batch PR detection across a full workout log session"
  - "getStreakFreezeState: pure function determining freeze activation (pure, testable, no storage deps)"
  - "StreakFreezeState interface"
  - "getStreak() returns { current, longest, freezeActive } — extended, backward compatible"
  - "markWorkoutDone() awards freeze token on every 7-day streak milestone (capped at 2)"

affects: [01-03, 01-04, 01-05, 01-06]

tech-stack:
  added: []
  patterns:
    - "import type only from storage.ts in gamification.ts — prevents circular runtime dependency"
    - "UTC-based date arithmetic (T00:00:00Z + setUTCDate) to avoid timezone drift in streak logic"
    - "Pure functions receive all data as params — no direct storage calls in gamification.ts"

key-files:
  created:
    - app/src/__tests__/pr-detection.test.ts
    - app/src/__tests__/streak-freeze.test.ts
  modified:
    - app/src/lib/gamification.ts
    - app/src/lib/storage.ts

key-decisions:
  - "getStreakFreezeState is pure (no storage imports) — avoids circular runtime dependency"
  - "UTC dates throughout streak date math — local time parsing caused off-by-one on Madrid CET"
  - "getStreak() extended return type { current, longest, freezeActive } — additive, backward compatible"
  - "markWorkoutDone awards token on streak.current % 7 === 0, not streak.current === 7 — catches 14, 21, etc."

patterns-established:
  - "TDD: write failing tests first (RED), commit, implement (GREEN), verify build"
  - "Date arithmetic: always use T00:00:00Z + setUTCDate/getUTCDate in Node/browser shared code"

requirements-completed: [PR-01, PR-02, PR-03, STR-03, STR-04]

duration: 3min
completed: 2026-03-10
---

# Phase 1 Plan 02: PR Detection + Streak Freeze Summary

**parseWeightKg/detectPR/checkNewPRs for weight-based PR detection and getStreakFreezeState for auto-freeze-token consumption on missed days**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-10T15:52:10Z
- **Completed:** 2026-03-10T15:56:02Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 4

## Accomplishments

- parseWeightKg handles kg, lbs, unitless numbers, and all non-weight strings (bw, bodyweight, empty, dash)
- detectPR + checkNewPRs enable PR detection at workout completion time — pure functions, no storage side effects
- getStreakFreezeState activates when yesterday done + today not done + tokens > 0; auto-consumes token in getStreak()
- getStreak() extended with freezeActive flag; markWorkoutDone() awards token at every 7-day multiple

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: PR detection failing tests** - `c430387` (test)
2. **Task 1 GREEN: parseWeightKg, detectPR, checkNewPRs** - `027c9b4` (feat)
3. **Task 2 RED: streak freeze failing tests** - `4e1d0ce` (test)
4. **Task 2 GREEN: getStreakFreezeState + storage integration** - `dc09fc9` (feat)

## Files Created/Modified

- `app/src/lib/gamification.ts` - Added parseWeightKg, detectPR, checkNewPRs, getStreakFreezeState, StreakFreezeState interface
- `app/src/lib/storage.ts` - Updated getStreak() return type, added freeze auto-consumption, added token award in markWorkoutDone()
- `app/src/__tests__/pr-detection.test.ts` - 20 tests: parseWeightKg (10), detectPR (6), checkNewPRs (4)
- `app/src/__tests__/streak-freeze.test.ts` - 6 tests: getStreakFreezeState pure logic

## Decisions Made

- `getStreakFreezeState` kept as pure function in gamification.ts with no storage imports — avoids circular runtime dependency (gamification.ts uses `import type` from storage.ts which is type-only, safe)
- UTC date arithmetic required: `new Date('YYYY-MM-DDT00:00:00')` parses as local time in Node.js, causing off-by-one errors at UTC+1. Fixed by using `T00:00:00Z` + `setUTCDate`/`getUTCDate`
- getStreak() return type extended additively: `{ current, longest, freezeActive }` — existing destructures `{ current, longest }` remain valid
- Token award condition is `streak.current % 7 === 0` (not `=== 7`) to reward 14, 21, 28-day milestones too

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed UTC timezone drift in date arithmetic**
- **Found during:** Task 2 (getStreakFreezeState GREEN — 3 tests failing after implementation)
- **Issue:** `new Date(todayStr + 'T00:00:00')` parsed as local time (UTC+1 Madrid), then `.toISOString().slice(0,10)` returned UTC date, causing "yesterday" calculation to yield two days ago
- **Fix:** Changed to `T00:00:00Z` + `setUTCDate`/`getUTCDate` throughout date arithmetic
- **Files modified:** app/src/lib/gamification.ts
- **Verification:** All 6 freeze tests pass after fix
- **Committed in:** dc09fc9 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — Bug)
**Impact on plan:** Essential correctness fix. Streak freeze would silently fail for users in UTC+ timezones.

## Issues Encountered

None beyond the timezone bug documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PR detection ready for use in workout completion flow (checkNewPRs callable from any component)
- Freeze token lifecycle complete: award on 7-day streaks, auto-consume in getStreak(), state visible via freezeActive flag
- 01-03 (achievements) can use streak data and PR detection as achievement triggers
- getStreak().freezeActive ready for UI display in 01-04/01-05

## Self-Check: PASSED

All files verified present. All 4 task commits verified in git log.

---
*Phase: 01-gamification-core*
*Completed: 2026-03-10*
