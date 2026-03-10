# Architecture

**Analysis Date:** 2026-03-10

## Pattern Overview

**Overall:** Client-side deterministic workout generation with React hooks and Next.js App Router.

**Key Characteristics:**
- Seeded random number generation ensures same date = same workout for all users
- Session generation abstracted from UI (generator.ts is pure logic, no React)
- Layered state management: localStorage persistence + React state + context provider for i18n
- Bilingual (EN/ES) as first-class citizen via context provider
- Equipment/restriction filtering applied at generation time, not render time

## Layers

**Data Layer (`src/data/`):**
- Purpose: Static exercise, warmup, WOD, restriction databases
- Location: `src/data/exercises.ts`, `src/data/warmup-exercises.ts`, `src/data/wod-formats.ts`, `src/data/restrictions.ts`, `src/data/prompts.ts`
- Contains: TypeScript type definitions (Pattern, Load, Level, Equipment, Restriction) + 155 exercises + 28 warmup variations + 31 WOD formats + 10 strength protocols
- Depends on: Nothing
- Used by: Generator, components, storage layer

**Logic Layer (`src/lib/`):**
- Purpose: Business logic without React dependencies
- Location: `src/lib/generator.ts`, `src/lib/seed.ts`, `src/lib/storage.ts`, `src/lib/i18n.tsx`
- Contains:
  - `generator.ts`: 841 lines - Deterministic session generation, 4-week mesocycle phases (accumulation/intensification/conditioning/realization), strength protocol selection, WOD format matching, warmup composition
  - `seed.ts`: Seeded RNG (Mulberry32), date-based determinism, shuffle/pick utilities
  - `storage.ts`: localStorage abstraction for workouts, exercise logs, streak tracking, equipment state
  - `i18n.tsx`: Language context provider (localStorage-backed, navigator.language fallback)
- Depends on: Data layer
- Used by: Components

**Component Layer (`src/components/`):**
- Purpose: React UI - presentational and container components
- Location: `src/components/*.tsx`
- Contains: 13 components (WorkoutGenerator, WorkoutDisplay, Calendar, EquipmentSetup, ExerciseLogPanel, AdaptPanel, WorkoutTimer, ClientShell, LanguageToggle, CopyButton, PromptPageContent, PromptActions, Logo)
- Depends on: Logic layer (generator, storage, i18n), data layer
- Used by: Pages

**Page Layer (`src/app/`):**
- Purpose: Next.js App Router pages and layouts
- Location: `src/app/*/page.tsx`, `src/app/layout.tsx`
- Contains: 6 pages (home, program, history, about, prompts, prompts/[slug])
- Depends on: Components, logic layer
- Used by: Next.js router

## Data Flow

**Workout Generation (Daily):**

1. User lands on homepage or navigates to `/` at `src/app/page.tsx`
2. `WorkoutGenerator` component loads (uses `getTodayString()` from seed.ts)
3. On mount/state change, calls `generateSession(date, level, equipment, restrictions, shortMode)`
4. `generateSession()` in `src/lib/generator.ts`:
   - Computes week phase via `getWeekPhase()` using deterministic epoch (2024-01-01)
   - Selects day template from `SESSION_TEMPLATES[dayOfWeek]`
   - Generates warmup: `generateWarmup(patterns, random, level, restrictions)` → picks exercises from warmup pool respecting phase (raise/mobilize/activate/potentiate)
   - Generates strength block: `generateStrength(date, patterns, random, level, phase, equipment, restrictions)` → picks exercises per pattern, applies restrictions (e.g., knee_pain → reduce squat), assigns strength protocols based on phase + load type
   - Generates WOD: `generateWod(isBig, random, level, phase, equipment, restrictions)` → picks format (AMRAP, couplet, EMOM, etc.), selects movements, respects phase preferences (accumulation prefers long chippers, intensification prefers short EMOM)
5. Returns fully hydrated `Session` object with all language variants (en + es)
6. `WorkoutGenerator` renders via `WorkoutDisplay` component
7. User can adapt workout via `AdaptPanel` (equipment override, restrictions, short mode) → re-calls generateSession with new params

**State Management Flow:**

```
localStorage
    ↓
useEffect in WorkoutGenerator
    ↓
useState (level, equipment, restrictions, shortMode, viewDate)
    ↓
generateSession() (pure function)
    ↓
setSession(result)
    ↓
WorkoutDisplay renders
    ↓
User marks done → markWorkoutDone() → storage → Calendar updates
```

**Language Flow:**

1. I18nProvider wraps all children in `src/app/layout.tsx` → `ClientShell`
2. Language state stored in localStorage via `handleSetLang()`
3. `useI18n()` hook returns `{ lang, setLang, t }` - `t(en, es)` selects based on lang
4. All rendered strings use `t()` function or ternary on `lang`

**Equipment Filtering:**

```
EquipmentSetup (onboarding)
    ↓
setEquipment(selected[]) → storage
    ↓
WorkoutGenerator reads getEquipment()
    ↓
generateSession receives equipment array
    ↓
filterByEquipment() removes exercises requiring unavailable gear
    ↓
Additionally checks contraindications (e.g., no_pullup_bar) if pull_up_bar not selected
```

## Key Abstractions

**Session Object:**
- Purpose: Complete workout representation with all metadata
- Definition: `src/lib/generator.ts` lines 152-165
- Contains: date, phase info, warmup block, strength exercises array, conditioning block, duration estimate
- Pattern: Immutable, generated fresh each day, fully hydrated with translations

**Phase Info Object:**
- Purpose: Encapsulate 4-week mesocycle logic
- Computed by: `getWeekPhase(date: string)` using epoch math
- Provides: phase name (accumulation/intensification/mixed/realization), week number (1-4), day in week (1-7), bilingual labels + descriptions

**Exercise Restriction Map:**
- Purpose: Centralize modification rules for pain/limitations (e.g., knee_pain)
- Location: `src/data/restrictions.ts`
- Contains: For each restriction, which exercises are contraindicated, pattern substitutions (reduce squat → increase hinge), recommended alternatives
- Usage: `generateStrength()` applies pattern substitutions, prioritizes recommended exercises when restrictions active

**Strength Protocol:**
- Purpose: Define sets/reps/rest/tempo rules per phase-load combination
- Location: `src/lib/generator.ts` lines 297-419
- 10 protocols: Heavy RIR1, Hypertrophy, Strength-Endurance, Tempo, To Failure, Myo-Reps, Rest-Pause, Mechanical Drop Set, Cluster Sets, Wave Loading
- Selection: `getCompatibleProtocols(loadType, phase)` filters by load type + phase preferences

**WOD Format:**
- Purpose: Conditioning structure (AMRAP, EMOM, Rounds for Time, etc.)
- Location: `src/data/wod-formats.ts`
- Contains: name, description, type, timecap, movements count, scaling by level (beginner/intermediate/advanced)
- Phase filtering: accumulation prefers long/high-volume formats, intensification prefers short/high-intensity

## Entry Points

**Homepage (`src/app/page.tsx`):**
- Location: `src/app/page.tsx`
- Triggers: App load, user navigates to `/`
- Responsibilities: Displays today's workout via WorkoutGenerator, links to other sections (program, history, prompts, about)

**Program Page (`src/app/program/page.tsx`):**
- Location: `src/app/program/page.tsx`
- Triggers: User clicks "Program" nav link
- Responsibilities: Explains 4-week mesocycle, shows current phase, displays weekly split template, explains why structure works

**History Page (`src/app/history/page.tsx`):**
- Location: `src/app/history/page.tsx`
- Triggers: User clicks "History" nav link
- Responsibilities: Calendar view of completed workouts, streak tracking (current + longest), export/import backup

**Prompts Pages (`src/app/prompts/page.tsx`, `src/app/prompts/[slug]/page.tsx`):**
- Location: `src/app/prompts/`
- Triggers: User clicks "Prompts" nav link
- Responsibilities: List of 6 AI health prompts (back pain, dumbbell training, nutrition, sleep, CrossFit, pelvic floor), detail pages load markdown from `public/prompts/`

**About Page (`src/app/about/page.tsx`):**
- Location: `src/app/about/page.tsx`
- Triggers: User clicks "About" link
- Responsibilities: Creator bio, project philosophy, GitHub/Twitter links

## Error Handling

**Strategy:** Graceful degradation - app remains functional even if localStorage fails, next dev fails

**Patterns:**
- `loadData()` returns default state if localStorage unavailable (server-side render guard: `if (typeof window === 'undefined') return defaultData()`)
- `generateSession()` has no error boundaries - assumes input is valid (level 1-3, valid date string)
- Missing restrictions/equipment → defaults to full pool (no exercises filtered)
- Import/export validation: `importData()` checks for version, completedWorkouts array, exerciseLog array before accepting

## Cross-Cutting Concerns

**Logging:** `@vercel/analytics` for tracking workout generation (`track('workout_generated', { date, level })`)

**Validation:** TypeScript strict mode enforces types at compile time; no runtime validation in generator (assumes clean input from components)

**Internationalization:** i18n.tsx context provider with localStorage persistence - all strings use `t(en, es)` helper

**Determinism:** All randomness seeded from date string via `createSeededRandom(seedStr)` - ensures same user always sees same workout for same date, enables sharing

**Persistence:** localStorage under key `hormesis_data` stores: version, level, equipment, completedWorkouts array, exerciseLog array - all JSON serializable

---

*Architecture analysis: 2026-03-10*
