# Coding Conventions

**Analysis Date:** 2025-03-10

## Naming Patterns

**Files:**
- PascalCase for React components: `WorkoutGenerator.tsx`, `ExerciseLogPanel.tsx`
- camelCase for utilities and libs: `generator.ts`, `storage.ts`, `seed.ts`
- kebab-case for data files: `wod-formats.ts`, `warmup-exercises.ts`
- Lowercase for app routes: `app/`, `history/`, `program/`

**Functions:**
- camelCase for all function names: `generateSession()`, `getWeekPhase()`, `seededShuffle()`
- Verb + noun pattern for action functions: `generateWarmup()`, `filterByEquipment()`, `markWorkoutDone()`
- Helper functions use `get`, `set`, `filter`, `check`, `create` prefixes
- Private helper functions in files use standard camelCase without leading underscore

**Variables:**
- camelCase for all variables: `viewDate`, `swapCounts`, `effectiveEquipment`
- Abbreviated for temporary/loop variables: `i`, `j`, `d`, `m`, `s` (semantically paired with data type)
- Const collections use descriptive plural or set names: `completedDates`, `recentIds`, `usedProtocolIds`

**Types:**
- PascalCase for interface/type names: `Exercise`, `Session`, `WorkoutDisplayProps`
- Props interfaces end with `Props`: `WorkoutDisplayProps`, `EquipmentSetupProps`, `AdaptPanelProps`
- Single-letter generic type constraints used in functions: `<T>` for array shuffle/pick functions
- Union types use literal type unions: `type Pattern = 'squat' | 'hinge' | 'push' | 'pull' | 'carry'`
- Enum-like types use type unions, not enums: `type WeekPhase = 'accumulation' | 'intensification' | 'mixed' | 'realization'`

**Constants:**
- UPPER_SNAKE_CASE for top-level constants: `STORAGE_KEY`, `CURRENT_VERSION`, `PHASE_EPOCH`, `EXERCISE_LOOKBACK_DAYS`
- Constants initialized at module level before functions

## Code Style

**Formatting:**
- No explicit formatter config file detected (no .prettierrc or eslint config)
- Inferred from code: 2-space indentation, semicolons required
- Line length: typically 80-100 characters, JSX can extend longer for readability
- Single quotes for strings in TypeScript, double quotes in attributes sometimes

**Linting:**
- ESLint v9 configured via eslintrc-next (from package.json)
- No custom eslint rules file present; uses Next.js defaults
- `npm run lint` available but likely using next/eslint config
- Strict TypeScript mode enabled: `"strict": true` in tsconfig.json

**Type Strictness:**
- TypeScript strict mode: `strict: true` in tsconfig.json
- No `any` types observed; explicit typing throughout
- `Record<K, V>` used for object maps: `Record<number, number>`, `Record<string, ExerciseLogEntry | null>`
- Nullish coalescing operator used: `data.equipment ?? null`
- Optional chaining: `e.contraindications?.some()`

## Import Organization

**Order:**
1. React/Next imports: `import { useState } from 'react'`, `import { useContext } from 'react'`
2. External dependencies: `import { track } from '@vercel/analytics'`
3. Relative @ imports (alias-based): `import { generateSession } from '@/lib/generator'`
4. Type imports: `import type { Level, Equipment } from '@/data/exercises'`
5. Component imports: `import WorkoutDisplay from './WorkoutDisplay'`
6. Node imports (in scripts): `import * as fs from 'fs'`

**Path Aliases:**
- `@/*` maps to `./src/*` via tsconfig.json
- Always use `@/` for cross-module imports, never relative paths
- No barrel files (`index.ts`) observed; imports target files directly

**Type Imports:**
- Syntax: `import type { TypeName }` for types only
- Mixed imports combine both: `import { logExercises, type ExerciseLogEntry }`

## Error Handling

**Patterns:**
- Try-catch blocks used in:
  - `storage.ts` loadData() wraps JSON.parse to handle corruption
  - `qa-check.ts` checkSession() catches generation failures and reports as error
  - `i18n.tsx` getInitialLang() handles missing window and localStorage
- No error throwing observed; functions return null or default values on failure
- localStorage access guarded with `if (typeof window === 'undefined')` SSR check
- QA script uses severity levels: `'error' | 'warning' | 'info'`

## Logging

**Framework:** `console` (no dedicated logging library)

**Patterns:**
- Vercel Analytics via `track()` for user events: `track('workout_generated', { date, level })`
- QA script outputs to console and appends to file via fs
- No debug/info/warn logging in application code; silent failures preferred
- File-based logging: `qa-check.ts` appends to `~/Business/hormesis/qa-log.md`

## Comments

**When to Comment:**
- Before complex logic blocks: `// ── Periodization: 4-week mesocycle ──`
- Before phase descriptions: `// ── Block format (warmup) ──`
- Inline for non-obvious calculations: `// Mon=0` in Calendar date offset logic
- Clarify intent: `// Check if today's workout is done (for lock logic)`
- No comments for obvious code; code is readable by design

**Style:**
- Line comments use `//` with space: `// Comment text`
- Section separators use dashes: `// ── Section Name ──`
- No JSDoc/TSDoc observed; types are self-documenting via TypeScript
- Comments are sparse; code readability preferred

## Function Design

**Size:**
- Typically 5-50 lines for React components
- Larger logic files (generator.ts) use small helper functions (10-30 lines each)
- Long functions broken into nested helpers: generateWarmup, generateStrength, generateWod inside generateSession

**Parameters:**
- Max 5 parameters common; excess parameters grouped into options object
- Example: `generateWod(isBig, random, level, phase, equipment, restrictions, shortMode)` — 7 params is upper bound
- Props interfaces used for React components instead of many parameters

**Return Values:**
- Functions return null on failure, not undefined
- Optional return types: `ExerciseLogEntry | null`
- Interfaces always returned intact; no partial objects

**Callbacks:**
- useCallback wrapping for event handlers: `handleSwapStrength`, `handleDoneCallback`
- Callback props typed explicitly: `onSwapStrength?: (index: number) => void`

## Module Design

**Exports:**
- Named exports preferred: `export function generateSession()`, `export const exercises: Exercise[]`
- Default exports for components: `export default function WorkoutGenerator()`
- Type exports use `export type`: `export type Session = { ... }`
- Single exported item per data file: `exercises.ts` exports exercises array; types are separate

**File Organization:**
- Interfaces/types defined at top of file
- Constants below types
- Helper functions before main functions
- Main entry point (export) at end of file
- Example in generator.ts: types → phase info → templates → protocols → helpers → public API

**Barrel Files:**
- Not used; imports target files directly via @ alias

## TypeScript Patterns

**Generics:**
- `seededShuffle<T>()`, `seededPick<T>()` use T for generic arrays
- `Record<K, V>` for typed object maps

**Union Types:**
- Literals for enums: `type Pattern = 'squat' | 'hinge'`
- Discriminated unions for data: `Session` has `phase: PhaseInfo` which has `phase: WeekPhase`

**Optional Properties:**
- `interface ExerciseLogEntry { notes?: string }` — optional fields use `?`
- Null coalescing: `data.equipment ?? null` preferred over optional chaining for null fallback

**Type Inference:**
- Arrow functions with implicit return types used in data files
- Event handler types inferred from context in components

## Bilingual Patterns

**I18n Approach:**
- Function `t(en: string, es: string): string` takes English and Spanish
- Data objects duplicate keys: `label` and `label_es`, `description` and `description_es`
- In components: `{lang === 'es' ? session.phase.label_es : session.phase.label}`
- Always provide both EN and ES strings; no fallback to English if ES missing

**Date Formatting:**
- Separate formatDateLabel function with lang parameter
- Month/day names duplicated in English and Spanish arrays
- ISO strings used internally; formatting only for display

---

*Convention analysis: 2025-03-10*
