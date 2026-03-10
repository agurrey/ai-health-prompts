# Codebase Structure

**Analysis Date:** 2026-03-10

## Directory Layout

```
app/
├── public/                    # Static assets + prompts
│   ├── prompts/              # Markdown files for 6 AI prompts (bilingual)
│   ├── icons/                # PWA icons
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── [svg assets]          # Logo, favicon
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── (layout files)    # Root layout, nested layouts
│   │   ├── page.tsx          # Homepage - workout generator
│   │   ├── about/            # About page
│   │   ├── program/          # 4-week program explainer
│   │   ├── history/          # Workout history + calendar
│   │   ├── faq/              # FAQ page
│   │   ├── prompts/          # Prompt hub listing + detail pages
│   │   │   ├── page.tsx      # List all 6 prompts
│   │   │   └── [slug]/page.tsx  # Individual prompt detail (dynamic route)
│   │   ├── globals.css       # Tailwind CSS
│   │   ├── opengraph-image.tsx  # Dynamic OG image
│   │   └── favicon.ico
│   ├── components/           # React components (13 total)
│   │   ├── ClientShell.tsx   # Nav + Footer wrapper, service worker registration
│   │   ├── WorkoutGenerator.tsx  # Main container - state management for today's workout
│   │   ├── WorkoutDisplay.tsx    # Render warmup + strength + WOD, completion tracking
│   │   ├── EquipmentSetup.tsx    # Onboarding dialog - select equipment
│   │   ├── AdaptPanel.tsx        # In-workout adaptation (restrictions, short mode, equipment override)
│   │   ├── ExerciseLogPanel.tsx  # Log weights/reps for strength exercises
│   │   ├── WorkoutTimer.tsx      # Countdown timer, WOD format aware
│   │   ├── Calendar.tsx          # Month view of completed workouts
│   │   ├── LanguageToggle.tsx    # EN/ES switcher
│   │   ├── PromptPageContent.tsx # Render markdown for prompt detail
│   │   ├── PromptActions.tsx     # Copy/share prompt buttons
│   │   ├── CopyButton.tsx        # Utility - copy to clipboard
│   │   └── Logo.tsx              # SVG logo
│   ├── lib/                  # Business logic (no React)
│   │   ├── generator.ts      # 841 lines - Main workout generation engine
│   │   ├── seed.ts           # Seeded RNG + date utilities
│   │   ├── storage.ts        # localStorage wrapper - workouts, exercise logs, streak
│   │   └── i18n.tsx          # Language context provider (React context)
│   └── data/                 # Static databases (TypeScript)
│       ├── exercises.ts      # 155 exercises - squat/hinge/push/pull/carry
│       ├── warmup-exercises.ts   # 28 warmup variations - raise/mobilize/activate/potentiate
│       ├── wod-formats.ts    # 31 WOD formats - AMRAP/EMOM/Rounds for Time/etc
│       ├── restrictions.ts   # Contraindication maps for 8 injury patterns
│       └── prompts.ts        # Metadata for 6 AI health prompt modules
├── package.json             # Dependencies: Next.js 16.1.6, React 19.2.3, Tailwind 4
├── tsconfig.json            # TypeScript config - @/* alias maps to src/*
├── next.config.js           # (if exists) Next.js configuration
└── public/                  # Public static files served as-is
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router structure - each file/folder maps to a URL route
- Contains: Page components, layouts, API routes
- Key files:
  - `layout.tsx`: Root layout wrapping all pages with metadata, fonts, ClientShell
  - `page.tsx`: Homepage at `/` - main entry point
  - `program/page.tsx`: `/program` - training program explainer
  - `history/page.tsx`: `/history` - workout history calendar
  - `prompts/page.tsx`: `/prompts` - list of 6 AI prompts
  - `prompts/[slug]/page.tsx`: `/prompts/{slug}` - dynamic route for individual prompts

**`src/components/`:**
- Purpose: Reusable React UI components
- Contains: Both stateful containers (WorkoutGenerator) and presentational components (Logo)
- Key patterns:
  - `*Generator` = stateful container, manages user input + data fetching
  - `*Display` = presentational, receives props, renders data
  - `*Panel` = sub-feature, modal or slide-out (EquipmentSetup, AdaptPanel, ExerciseLogPanel)

**`src/lib/`:**
- Purpose: Core business logic, testable without React
- Contains:
  - `generator.ts`: Pure function `generateSession()` - no side effects
  - `seed.ts`: Deterministic random utilities
  - `storage.ts`: localStorage abstraction, workout persistence
  - `i18n.tsx`: Language context (React context provider)

**`src/data/`:**
- Purpose: Static typed databases
- Contains: Exercise definitions, warmup variations, WOD formats, injury restriction rules, prompt metadata
- Format: TypeScript const arrays + interfaces
- No async loading - all compiled into bundle

**`public/`:**
- Purpose: Static assets served directly by Next.js
- Contains:
  - `prompts/`: 12 markdown files (6 topics × 2 languages)
  - `icons/`: PWA home screen icons (192×192, 512×512)
  - `manifest.json`: PWA metadata
  - `sw.js`: Service worker for offline support
  - SVG logos, favicons

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Homepage with WorkoutGenerator - **start here**
- `src/app/layout.tsx`: Root layout - sets up I18nProvider, ClientShell, Vercel Analytics
- `src/app/layout.tsx` → `src/components/ClientShell.tsx`: Navigation, Footer, ServiceWorkerRegistration

**Configuration:**
- `package.json`: Dependencies, build scripts
- `tsconfig.json`: TypeScript config with `@/*` path alias
- `src/app/globals.css`: Tailwind CSS imports + custom CSS

**Core Logic:**
- `src/lib/generator.ts`: 841 lines - `generateSession()` function, mesocycle logic, protocol selection
- `src/lib/seed.ts`: Seeded RNG for determinism
- `src/lib/storage.ts`: localStorage API wrapper
- `src/lib/i18n.tsx`: Language context provider

**Data:**
- `src/data/exercises.ts`: 155 exercises across 5 patterns (squat, hinge, push, pull, carry)
- `src/data/warmup-exercises.ts`: 28 warmup exercises in 4 phases
- `src/data/wod-formats.ts`: 31 conditioning formats with timecaps and movement counts
- `src/data/restrictions.ts`: 8 injury patterns → contraindications + replacements
- `src/data/prompts.ts`: 6 prompt modules (back pain, dumbbell, nutrition, sleep, CrossFit, pelvic floor)

**Testing:**
- No test files in codebase (tests not implemented)

## Naming Conventions

**Files:**
- `page.tsx`: Next.js route files
- `layout.tsx`: Next.js layout files
- `[slug].tsx`: Next.js dynamic route segments
- `ComponentName.tsx`: React components (PascalCase)
- `functionName.ts`: Utility functions (camelCase)
- `types.ts` or inline interfaces: Type definitions

**Directories:**
- `src/app/[feature]/`: Feature routes (lowercase)
- `src/components/`: All components at top level (no subfolders)
- `src/data/`: Data sources
- `src/lib/`: Business logic

**Functions:**
- `generate*`: Create workout/session objects
- `get*`: Fetch from storage or compute
- `set*`: Persist to storage
- `format*`: Transform data for display
- `create*`: Create utilities (e.g., createSeededRandom)

**Variables:**
- `isLoading`, `isTomorrow`, `isAdapted`: Boolean flags
- `viewDate`, `todayDone`: State
- `t(en, es)`: Translation helper
- `random()`: Seeded RNG function

**Types:**
- `Session`: Full workout object
- `Exercise`: Single exercise with metadata
- `Restriction`: Injury constraint type
- `Level`: User skill (1|2|3)
- `Equipment`: Available gear type
- `Pattern`: Movement category (squat|hinge|push|pull|carry)

## Where to Add New Code

**New Page/Route:**
- Create folder under `src/app/{route-name}/`
- Add `page.tsx` (or `layout.tsx` if container)
- Import components from `src/components/`
- Wrap with I18nProvider context if using language

Example:
```
src/app/new-feature/
├── page.tsx
└── layout.tsx (if needed)
```

**New Component:**
- Create in `src/components/{ComponentName}.tsx`
- Start with `'use client'` if it needs interactivity
- Use `useI18n()` hook for translations
- Export as default

Pattern:
```typescript
'use client';
import { useI18n } from '@/lib/i18n';

export default function MyComponent() {
  const { t, lang } = useI18n();
  return <div>{t('English', 'Español')}</div>;
}
```

**New Generator Feature:**
- Add to `src/lib/generator.ts` above `generateSession()` export
- Keep pure (no React, no side effects)
- Accept parameters, return typed object
- Add bilingual labels (label + label_es)

**New Exercise/Warmup/WOD:**
- Add to appropriate `src/data/*.ts` file
- Follow existing interface structure
- Include bilingual text (name + name_es, cue + cue_es, etc.)
- Add YouTube demo search terms (demoSearch, demoChannel)

**New Data Type:**
- Define interface in `src/data/{topic}.ts`
- Export with `export type Name = ...`
- Use in generator and components

**Utilities:**
- Shared helpers go in `src/lib/`
- No React dependencies
- Export as named exports

## Special Directories

**`public/prompts/`:**
- Purpose: Markdown files for 6 AI health prompts
- Format: One per topic, bilingual (filename_es for Spanish)
- Loaded dynamically at `/prompts/[slug]` via `PromptPageContent` component
- Generated: No, static files
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes (via `npm run build`)
- Committed: No (in .gitignore)

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (via `npm install`)
- Committed: No (in .gitignore)

**`public/icons/`:**
- Purpose: PWA home screen icons
- Format: PNG 192×192, 512×512
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-03-10*
