# Codebase Concerns

**Analysis Date:** 2025-03-10

## Tech Debt

**Large Data Files (2000+ lines):**
- Issue: `src/data/exercises.ts` (2022 lines) and `src/data/wod-formats.ts` (989 lines) contain hard-coded exercise and format definitions. Difficult to maintain, update, and test.
- Files: `src/data/exercises.ts`, `src/data/wod-formats.ts`
- Impact: Any exercise modification requires manual editing of large files. No data validation layer. Typos in contraindications or equipment lists could silently affect exercise selection.
- Fix approach: Consider migrating to JSON files with runtime validation, or implementing a database schema with validation rules.

**Missing Test Coverage:**
- Issue: No test files in the project (zero `.test.ts` or `.spec.ts` files).
- Files: Entire `src/` directory
- Impact: Critical generator logic (`src/lib/generator.ts`, `src/lib/storage.ts`) lacks automated verification. Seeded RNG behavior, phase calculations, and restriction filtering are untested.
- Fix approach: Add Jest/Vitest setup. Prioritize tests for: `generateSession()`, period calculation logic, restriction filtering, seeded randomization, storage round-trip.

**Incomplete Error Handling in Storage:**
- Issue: `src/lib/storage.ts` uses try-catch only on parse/import operations. Runtime errors in storage operations (e.g., quota exceeded, corrupted data) are silently swallowed or propagated uncaught.
- Files: `src/lib/storage.ts`
- Impact: Users could lose workout history or exercise logs if localStorage quota is exceeded. No user-facing error message or fallback.
- Fix approach: Add explicit error handling for `QuotaExceededError`. Implement storage quota warnings. Add recovery mechanism (cleanup old logs, compress data).

**Weak Equipment Override Logic:**
- Issue: `equipmentOverride` in `src/components/WorkoutGenerator.tsx` (line 49) creates a confusing flow where temp equipment settings can diverge from persisted equipment settings without clear reconciliation.
- Files: `src/components/WorkoutGenerator.tsx` (lines 49, 73-74, 91, 140-141, 147-148, 153-155)
- Impact: Users can set equipment, then override it per-session, then accidentally reset it. No visual indication which equipment is active.
- Fix approach: Unify equipment state. Either use temp overrides OR persist settings, not both. Add visual badge showing "Equipment override active".

## Known Bugs

**Audio Context Initialization Can Fail Silently:**
- Symptoms: Timer beeps don't work on some devices (Safari private mode, older browsers).
- Files: `src/components/WorkoutTimer.tsx` (lines 29-47)
- Trigger: Use timer on Safari private mode or any browser with audio context restrictions.
- Workaround: Silent fail with try-catch means timer still runs, just no audio feedback. No user indication that beep failed.
- Fix approach: Add fallback vibration API (`navigator.vibrate()`). Log warning if audio fails.

**Streak Calculation Off-by-One Risk:**
- Symptoms: Streak display may be incorrect for users logging workouts at non-UTC times.
- Files: `src/lib/storage.ts` (lines 136-161)
- Trigger: User completes workout at 23:00 local time, then logs another at 01:00 next calendar day. Streak may count or skip depending on UTC vs local date interpretation.
- Cause: `getTodayString()` uses UTC date (`toISOString().split('T')[0]`), but stored workouts may be in user's local timezone.
- Workaround: Consistent UTC usage in seed strings prevents **generation** inconsistency, but streak display could be wrong by 1 day.
- Fix approach: Document timestamp behavior. Use explicit `getCompletedDates()` filtering with timezone awareness. Add timezone field to `CompletedWorkout` interface.

**Default Case in Phase Switch Returns Empty Description:**
- Symptoms: Unreachable in normal flow, but if cycleWeek calculation breaks, user sees blank week description.
- Files: `src/lib/generator.ts` (line 88)
- Trigger: Corrupt `PHASE_EPOCH` or negative week calculation.
- Workaround: None — default case should not happen.
- Fix approach: Assert or throw if default case is reached: `throw new Error('Invalid phase week: ' + cycleWeek)`.

## Security Considerations

**No Input Validation on URL/Route Parameters:**
- Risk: Date string in URL is not validated. Invalid dates could cause undefined behavior in phase/streak calculations.
- Files: `src/app/program/page.tsx`, `src/components/WorkoutGenerator.tsx` (viewDate state)
- Current mitigation: None. Invalid date strings fall back to `getTodayString()` in some cases, silently ignore in others.
- Recommendations: Add explicit date validation. Use `YYYY-MM-DD` regex or date parsing with fallback. Reject dates outside reasonable range (past 1 year, future 1 month).

**localStorage Accessible to XSS:**
- Risk: Workout history and equipment settings stored in plaintext localStorage. Any XSS vulnerability exposes user training data.
- Files: `src/lib/storage.ts`, `src/lib/i18n.tsx`
- Current mitigation: CSP headers set in `next.config.ts` (X-Content-Type-Options, X-Frame-Options).
- Recommendations: Store sensitive data (exercise details with weights) in sessionStorage for current session only. Consider IndexedDB with encryption for persistent history. Add Content-Security-Policy `default-src 'self'`.

**No Rate Limiting on Export/Import:**
- Risk: User can import extremely large JSON (malicious or accidental), causing memory spike or DoS.
- Files: `src/lib/storage.ts` (lines 186-201)
- Current mitigation: None. `JSON.parse()` on line 192 could fail on huge payloads.
- Recommendations: Add file size check before parse. Validate schema with strict type guards. Limit history to last 365 days on import.

## Performance Bottlenecks

**Generator Filters Entire Exercise List on Every Render:**
- Problem: `src/components/WorkoutGenerator.tsx` `handleSwapStrength()` calls `getExercisesByPattern()` (155 exercises in pool), then filters multiple times per swap.
- Files: `src/components/WorkoutGenerator.tsx` (lines 86-127)
- Cause: No memoization of filtered pools. On every swap, re-filters same pattern 5+ times.
- Improvement path: Memoize filtered exercise pools per (pattern, level, equipment, restrictions). Use `useMemo()` for pool calculation.

**Large WOD Formats Array Searched Linearly:**
- Problem: `getWodFormats()` and phase-based filtering (lines 716-757 in generator) iterate entire `wodFormats` array on every session generation.
- Files: `src/data/wod-formats.ts` (989 items), `src/lib/generator.ts` (lines 705-801)
- Cause: Array has no indexing by level/type. Quadratic complexity with phase filtering + user level filtering.
- Improvement path: Index `wodFormats` by level and type at module load. Build lookup Map: `Map<level, Map<type, WodFormat[]>>`.

**Seeded Random Reshuffles Entire Exercise List:**
- Problem: `seededShuffle()` (src/lib/seed.ts) creates full array copy and Fisher-Yates on every call. Called repeatedly per session generation.
- Files: `src/lib/seed.ts` (lines 27-34), called in `src/lib/generator.ts` (lines 461, 527, 568, 662, 664, 759, 769)
- Cause: No caching of shuffle results. Same seed generates same shuffle multiple times per session.
- Improvement path: Cache shuffle results per seed string. Use `Map<seed, shuffledArray>` with max 50 entries.

## Fragile Areas

**Generator Phase Calculations Tightly Coupled to Epoch:**
- Files: `src/lib/generator.ts` (line 37: `PHASE_EPOCH = new Date('2024-01-01T00:00:00Z')`)
- Why fragile: Hard-coded epoch means all phase calculations depend on exact reference date. If production date changes relative to epoch, **all session phases change globally** with no migration.
- Safe modification: Never change `PHASE_EPOCH` without migration. Add version field to generator to detect epoch changes. Consider making epoch date-relative or user-relative instead of absolute.
- Test coverage: No tests for phase calculation across date ranges. A test should verify phase cycles correctly every 28 days and resets consistently.

**Restriction Map Manual Maintenance:**
- Files: `src/data/restrictions.ts` (lines 33-152)
- Why fragile: Recommended exercise IDs are manually listed. If an exercise is renamed or deleted, contraindication maps become stale and reference non-existent exercises.
- Safe modification: Before deleting/renaming exercise, search `RESTRICTION_MAPS` for all references. No automated validation. Consider building restriction maps from exercise metadata (contraindications field) instead of separate data structure.
- Test coverage: Add test that validates all `recommendedExerciseIds` in restriction maps exist in the exercises array.

**Storage Version Not Enforced:**
- Files: `src/lib/storage.ts` (lines 4, 45)
- Why fragile: `CURRENT_VERSION = 1` is checked in `loadData()` (line 45) but never incremented. If data schema changes, code cannot detect old format. New fields (e.g., adding `timezone` field) will silently be undefined in old data.
- Safe modification: Create versioned migration functions. Increment version on schema changes. On load, run migrations in sequence (v1→v2, v2→v3, etc).
- Test coverage: Add test for data format migrations. Simulate loading v0/v1 data, verify migration path.

**Seeded Random Uses Hash, Not True PRNG for Seed:**
- Files: `src/lib/seed.ts` (lines 4-12)
- Why fragile: `hashString()` is simple string hash. Two different seeds could theoretically hash to same value, causing collisions. Mulberry32 PRNG is fast but has known weak low-bits.
- Safe modification: Use a proper hash (e.g., SipHash) for seed generation. Document that this PRNG is not cryptographically secure. Add seed collision detection in tests.
- Test coverage: Add test that verifies different seeds produce different sequences. Test known weak cases (all zeros, repeating patterns).

## Scaling Limits

**localStorage Capacity Limited to ~5-10MB:**
- Current capacity: Browsers limit localStorage to 5-10MB. At ~500 bytes per workout log entry, max 10,000-20,000 entries.
- Limit: If user logs workouts for 50+ years, storage will fill up.
- Scaling path: Implement data expiration (archive workouts older than 1 year). Switch to IndexedDB for unlimited storage (once implemented). Add quota monitoring and cleanup on low storage.

**Exercise Pool Filtering O(n) Per Pattern:**
- Current capacity: 155 exercises, ~5 patterns per session = 775 filter operations per session generation.
- Limit: Acceptable for current scale. If exercises grow to 500+, filter time becomes measurable.
- Scaling path: Index exercises by pattern as Set. Build lookup at module init: `Map<pattern, Set<exerciseId>>`. Reduces filter to O(1) lookup.

**WOD Movement Picking N Random From 100+:**
- Current capacity: `seededPickN()` shuffles entire movement array, picks N. Manageable for 100 movements.
- Limit: If movements grow to 1000+, shuffle becomes expensive.
- Scaling path: Use Reservoir Sampling (Algorithm R) instead of full shuffle. Reduces complexity from O(n log n) to O(n) single pass.

## Dependencies at Risk

**No Tests on External Analytics:**
- Risk: `@vercel/analytics` is called directly in UI (src/components/WorkoutGenerator.tsx line 83, WorkoutDisplay.tsx). No fallback if Vercel endpoints are down.
- Impact: Failed analytics calls could slow page load (network timeout on Vercel domain).
- Migration plan: Wrap analytics in try-catch. Queue events locally if Vercel is unavailable. Use `navigator.sendBeacon()` for reliability.

**AudioContext API Browser Support Varies:**
- Risk: Web Audio API not supported in IE, older Android. Timer beeps silently fail.
- Impact: Users won't know if timer audio is working until mid-workout.
- Migration plan: Feature-detect with `const hasAudio = !!(window.AudioContext || window.webkitAudioContext)`. Show visual indicator if audio unavailable. Fallback to vibration API.

## Missing Critical Features

**No Offline Capability (PWA Incomplete):**
- Problem: ServiceWorker registered (src/components/ClientShell.tsx line 63) but no service worker file (`public/sw.js`) in app/ directory. PWA setup incomplete.
- Blocks: Offline workout access, background sync of completed sessions.
- Recommendation: Complete PWA implementation. Add `public/sw.js` that caches HTML/JS/CSS and serves from cache on offline. Queue workouts to sync when online.

**No Workout Export to Calendar (iCal/Google Calendar):**
- Problem: Users can view history but cannot export workouts to calendar apps.
- Blocks: Mobile calendar integration, shared scheduling with coaches.
- Recommendation: Add `.ics` export. Generate iCal format with session details. Add Google Calendar share link generator.

**No Sync Across Devices:**
- Problem: localStorage is per-device. If user trains on phone and laptop, each has separate history.
- Blocks: Cloud backup, multi-device experience.
- Recommendation: Implement optional Firebase/Supabase sync. Sync completed workouts + exercise logs. Allow users to opt-in to cloud storage.

## Test Coverage Gaps

**No Tests for Seeded Randomization:**
- What's not tested: `generateSession()` produces same output for same seed. Phase determinism over date ranges. Restriction filtering produces valid exercise pools.
- Files: `src/lib/seed.ts`, `src/lib/generator.ts`, `src/lib/storage.ts`
- Risk: Phase calculations could drift. Restrictions could filter to empty pool (crash). Swap logic could pick same exercise twice.
- Priority: High

**No Tests for Data Migrations/Versioning:**
- What's not tested: Data format upgrades. Loading old storage format. Corrupted JSON gracefully reverts to default.
- Files: `src/lib/storage.ts`
- Risk: Users with old app version could lose data on upgrade. Corrupted localStorage could crash app.
- Priority: High

**No Tests for Restriction Filtering:**
- What's not tested: Each restriction produces valid exercise pool. Recommended exercises exist. Pattern substitutions don't create empty pools.
- Files: `src/data/restrictions.ts`, `src/lib/generator.ts`
- Risk: Restriction could filter to 0 exercises, causing `continue` without picking an exercise. Session could be incomplete.
- Priority: High

**No Tests for UI State Edge Cases:**
- What's not tested: Navigation locks (can't advance until today's workout done). Equipment override + adapter state reconciliation. Swap counts persist across date changes.
- Files: `src/components/WorkoutGenerator.tsx`
- Risk: Users could bypass locks, see stale swaps, or equipment settings apply incorrectly.
- Priority: Medium

---

*Concerns audit: 2025-03-10*
