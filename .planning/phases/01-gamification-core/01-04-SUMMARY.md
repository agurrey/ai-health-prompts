---
phase: 01-gamification-core
plan: 04
subsystem: ui
tags: [react, nextjs, toast, animation, i18n, bilingual]

# Dependency graph
requires:
  - phase: 01-gamification-core
    plan: 01
    provides: XPGain type from gamification.ts
  - phase: 01-gamification-core
    plan: 03
    provides: Achievement type from achievements.ts
  - phase: 01-gamification-core
    plan: 02
    provides: PersonalRecord type from storage.ts
provides:
  - XPGainToast component with bilingual XP breakdown and auto-dismiss
  - AchievementToast component handling achievement and PR discriminated union
  - slide-in-right/slide-out-right CSS animations in globals.css
  - ToastItem type (exported from AchievementToast.tsx)
affects: [01-05, 01-06, workout completion flow, gamification integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Auto-dismiss timer pattern with exit animation (setExiting + delayed onDismiss)
    - Discriminated union for multi-type toast (achievement | pr)
    - CSS animation classes (toast-enter/toast-exit) decoupled from component state

key-files:
  created:
    - app/src/components/XPGainToast.tsx
    - app/src/components/AchievementToast.tsx
  modified:
    - app/src/app/globals.css

key-decisions:
  - "exerciseName passed as prop to AchievementToast — exerciseId lives in PR, display name resolved by caller"
  - "Exit animation runs for 250ms before onDismiss fires — keeps dismiss clean without layout shift"
  - "XPGainToast default 3s, AchievementToast default 4s — achievement toast needs more read time"

patterns-established:
  - "Toast dismiss: setExiting(true) triggers CSS exit class, setTimeout(onDismiss, 250) fires after animation"
  - "Bilingual: use lang==='es' direct comparison for data fields, t() helper for static strings"

requirements-completed: [ACH-02, PR-02, XP-08]

# Metrics
duration: 3min
completed: 2026-03-10
---

# Phase 1 Plan 4: Toast Notification Components Summary

**XPGainToast and AchievementToast presentational components with slide-in/slide-out CSS animations, bilingual text, and auto-dismiss timers — pure props-driven, no storage access**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-10T15:59:22Z
- **Completed:** 2026-03-10T16:02:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added slide-in-right/slide-out-right keyframe animations to globals.css with .toast-enter/.toast-exit utility classes
- Created XPGainToast: shows +N XP with bilingual breakdown, auto-dismisses at 3s with exit animation
- Created AchievementToast: handles achievement (fuchsia) and PR (yellow) toast types via discriminated union, auto-dismisses at 4s

## Task Commits

Each task was committed atomically:

1. **Task 1: Add toast animation to globals.css and create XPGainToast** - `e552ab3` (feat)
2. **Task 2: Create AchievementToast for achievements and PRs** - `6c125d7` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `app/src/components/XPGainToast.tsx` - XP gain notification: ⚡ icon, +N XP, breakdown string, 3s auto-dismiss
- `app/src/components/AchievementToast.tsx` - Achievement/PR notification: discriminated union, fuchsia/yellow accents, 4s auto-dismiss
- `app/src/app/globals.css` - Added slide-in-right, slide-out-right keyframes and .toast-enter/.toast-exit classes

## Decisions Made
- `exerciseName` passed as prop to AchievementToast because PRs only store `exerciseId`; the caller (workout completion flow) resolves the display name from exercises data
- Exit animation delay is 250ms to match `slide-out-right` duration — keeps onDismiss firing after animation completes
- Default dismiss times differ: 3s for XP (minimal content), 4s for achievement (more text to read)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Toast components ready for integration in workout completion flow (Plan 05 or 06)
- Calling component must: manage a toast queue (array state), pass onDismiss that removes item from queue, resolve exerciseName from exerciseId before passing to AchievementToast
- Both components are purely presentational — no coupling to storage or gamification logic

## Self-Check: PASSED

- FOUND: app/src/components/XPGainToast.tsx
- FOUND: app/src/components/AchievementToast.tsx
- FOUND: .planning/phases/01-gamification-core/01-04-SUMMARY.md
- FOUND: commit e552ab3
- FOUND: commit 6c125d7

---
*Phase: 01-gamification-core*
*Completed: 2026-03-10*
