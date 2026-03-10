# Testing Patterns

**Analysis Date:** 2025-03-10

## Test Framework

**Status:** No automated test suite. QA validation script only.

**Test Runner:**
- None configured (no jest, vitest, mocha in package.json)
- Manual QA via Node script: `scripts/qa-check.ts`
- Command to run QA: `npx ts-node scripts/qa-check.ts` (inferred; no package.json script)

**Assertion Library:**
- No dedicated assertion library
- QA script uses manual checks and array operations: `.includes()`, `.filter()`, `.size`

**Run Commands:**
```bash
npm run dev        # Dev server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint check
# QA validation (manual, not npm script):
npx ts-node scripts/qa-check.ts
```

## Test File Organization

**Location:**
- QA script: `app/scripts/qa-check.ts` (non-standard, not in src/)
- No test files in `__tests__`, `tests/`, or `.test.ts` pattern
- Tests are not co-located with source

**Naming:**
- QA script: `qa-check.ts` (no .test or .spec suffix)
- Output log: `~/Business/hormesis/qa-log.md` (appended daily)

## Test Structure

**QA Script Pattern:**

```typescript
interface Finding {
  severity: 'error' | 'warning' | 'info';
  message: string;
}

function checkDemoLinks(): Finding[] {
  const findings: Finding[] = [];
  // Check logic
  return findings;
}

function runQA(): string {
  const lines: string[] = [];
  // Build markdown report
  return lines.join('\n');
}

// Main execution
const report = runQA();
console.log(report);
// Append to file
fs.appendFileSync(logPath, header + report);
```

**Patterns:**
- Functions return array of `Finding` objects with severity level
- Report generation builds markdown string with sections
- Main function composes check results into formatted output
- Execution logs to console and appends to persistent log file

## What Is Tested

**Coverage Areas:**

**1. Demo Link Audit:**
- All exercises have `demoSearch` and `demoChannel` populated
- Warmup exercises have video links
- WOD movements have demo search terms
- Severity: error for missing demoSearch, warning for missing demoChannel

**2. Session Generation:**
- Generates session for today + 7 days
- Validates presence of phase, warmup, strength, conditioning
- Checks minimum exercise counts (warmup ≥3, strength ≥3)
- Verifies all exercises have demo links
- Validates duration within 15-60 minutes
- Checks exercise variety vs. yesterday (warns if >50% overlap)
- Catches generation crashes and reports as CRASH error

**3. Periodization Validation:**
- Full 28-day cycle checked
- Each of 4 phases must appear exactly 7 days
- Verifies protocol variety per phase (≥2 different protocols)
- Verifies format variety per phase (≥2 different WOD formats)
- Ensures phases are distinct (accumulation ≠ intensification)
- Catches generation failures per day

**4. Exercise Pool Stats:**
- Total exercise count by pattern (squat, hinge, push, pull, carry)
- Warmup count
- WOD movement count per level (beginner, intermediate, advanced)

## Mocking

**Not applicable** — no mocking framework or patterns observed.

**Reason:** QA script tests generated output of pure functions. All dependencies (exercises data, generation logic) are real, not mocked.

## Fixtures and Factories

**Test Data:**

Pattern: Hardcoded arrays in data files, not factories.

```typescript
// app/src/data/exercises.ts
export const exercises: Exercise[] = [
  {
    id: 'air-squat',
    name: 'Air Squat',
    pattern: 'squat',
    load: 'bodyweight',
    level: 1,
    equipment: ['bodyweight'],
    cue: '...',
    demoSearch: 'air squat form cues',
    demoChannel: 'Squat University',
    contraindications: ['foot_pain'],
  },
  // ... 155 more exercises
];
```

**Location:**
- `app/src/data/exercises.ts` — 155 exercises
- `app/src/data/warmup-exercises.ts` — 28 warmup exercises
- `app/src/data/wod-formats.ts` — 31 WOD formats
- `app/src/data/restrictions.ts` — restriction rules

**Date-based determinism:**
- Seed string: `date + restrictions.sort().join(',')`
- Same date = same workout for all users (seeded PRNG)
- Prevents randomness; ensures consistency

## Coverage

**Requirements:** None enforced. No coverage threshold configured.

**View Coverage:**
- No coverage tool configured
- Manual inspection: check QA log at `~/Business/hormesis/qa-log.md`

**Current gaps:**
- No unit tests for pure functions (generator, seed, storage)
- No component testing (React Testing Library, Cypress)
- No integration tests
- Only QA validation script covering application semantics

## Test Types

**Unit Tests:**
- None. Pure functions like `seededShuffle()`, `hashString()`, `filterByEquipment()` are untested

**Integration Tests:**
- QA script simulates end-to-end: generates sessions and validates output
- Tests interaction between generator, data files, restrictions, equipment
- Checks session variety, periodization, and cross-day consistency

**E2E Tests:**
- Not implemented
- Manual testing in browser only

## QA Script Details

**Runs 5 checks:**

1. **checkDemoLinks()** — All exercises have video search terms
2. **checkSession(date)** — Single day session generation passes validation
3. **checkPeriodization()** — 28-day cycle respects phases and variety
4. **Exercise pool stats** — Count and categorize all available exercises
5. **Summary report** — Error/warning counts and overall health

**Invocation:**
```bash
# Terminal
npx ts-node scripts/qa-check.ts

# Output format
## QA Check — 2025-03-10 (Sunday) | Week 1/4 — Accumulation

### Demo Link Audit
All exercises have demo links.

### Exercise Pool
Total exercises: 155
carry: 8
hinge: 29
...

### Session Checks (today + 7 days)
- [ERROR] Monday (2025-03-10) [accumulation]: Empty warmup

### Periodization Check (28-day cycle)
All 4 phases present, protocols and formats vary correctly.

### Summary
Days checked: 7 + 28-day cycle
Errors: 0 | Warnings: 2
**OK** — 2 warnings, no errors.
```

**Log appended to:**
- `~/Business/hormesis/qa-log.md`
- Includes date, day name, phase, findings
- Grows cumulatively with each run

## Common Testing Gaps

**What's NOT tested:**

- **Storage (localStorage)**: No tests for `getLevel()`, `setEquipment()`, etc.
- **React components**: No component tree, interaction, or snapshot tests
- **Bilingual output**: No verification that Spanish strings render correctly
- **Equipment filters**: No tests for equipment-based exercise selection
- **Restriction logic**: Tested indirectly via session generation; not isolated
- **UI state**: No tests for date navigation, level selection, adaptation
- **Browser APIs**: localStorage, Web Audio (timer beeps) untested
- **Edge cases**: Leap years, timezone edge cases not explicitly tested
- **Performance**: No load testing; no rendering performance checks

## How to Add Tests

**For new features:**

1. **Session logic (generator.ts):**
   - Run QA script: ensures output is valid
   - Manual: generate 10 different dates, verify variety

2. **Component logic:**
   - Manual browser testing in `npm run dev`
   - Check calendar, timer, exercise log panels work

3. **Data integrity:**
   - QA script checks exercises have demoSearch
   - Manual: verify equipment filtering works

4. **Restrictions:**
   - QA script validates generation doesn't crash
   - Manual: test with knee_pain, shoulder_pain restrictions in UI

**If adding automated tests:**
- Vitest would be lightweight (no jest config overhead)
- Focus on pure functions first: seed.ts, generator selection logic
- Component tests: React Testing Library for user interactions
- Integration: same approach as QA script — generate and validate

---

*Testing analysis: 2025-03-10*
