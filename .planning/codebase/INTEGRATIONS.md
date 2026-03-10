# External Integrations

**Analysis Date:** 2026-03-10

## APIs & External Services

**Analytics:**
- Vercel Analytics - User behavior tracking
  - SDK: `@vercel/analytics` v1.6.1
  - Usage: `track()` function called from `src/components/WorkoutGenerator.tsx` on workout generation
  - No API key required (Vercel-native integration, token injected at build time)

**Links to External Tools:**
- ChatGPT - Referenced in UI for prompt copying workflow
  - Location: `src/components/PromptPageContent.tsx` line 57
  - Link: `https://chat.openai.com` (user manually navigates)
  - Not an API integration (user copy-paste flow only)

## Data Storage

**Databases:**
- None - Client-side only

**File Storage:**
- Local filesystem only
  - Static prompt markdown files: `app/public/prompts/` (bilingual EN/ES)
  - Exercise database: hardcoded in `src/data/exercises.ts` (2022 lines)
  - Workout formats: hardcoded in `src/data/wod-formats.ts`

**Client-side Persistence:**
- localStorage API
  - Key: `hormesis_data` (see `src/lib/storage.ts`)
  - Data: User settings (level, equipment, completed workouts, exercise logs)
  - No backend sync, no cloud storage

**Caching:**
- Service Worker caching (`app/public/sw.js`)
  - Cache-first for static assets: `/_next/static/`, `/icons/`
  - Network-first for pages (HTML) and data
  - Offline capable with stale fallback

## Authentication & Identity

**Auth Provider:**
- None - Completely anonymous, no user accounts
- No login, no registration, no user IDs
- All data stored locally in localStorage

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- None - Client-side logging not implemented
- Vercel Analytics passively tracks page views and custom events

## CI/CD & Deployment

**Hosting:**
- Vercel platform (inferred from `@vercel/analytics`, next.config.ts patterns)

**CI Pipeline:**
- None detected in repository (git commits only)
- Vercel auto-deploys from git on push (Vercel default behavior)

## Environment Configuration

**Required env vars:**
- None - Application is fully static

**Secrets location:**
- No secrets in codebase
- `.env*` excluded from git (see `.gitignore`)
- Vercel project settings handle any sensitive config at deploy time (if added in future)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Content & Static Resources

**Prompt Markdown Files:**
- Location: `app/public/prompts/`
- Files (6 prompts × 2 languages):
  - `sedentary_spinal_health.md` / `sedentary_spinal_health_es.md`
  - `dumbbell_home_training.md` / `dumbbell_home_training_es.md`
  - `whole_food_nutrition.md` / `whole_food_nutrition_es.md`
  - `crossfit_triple_block.md` / `crossfit_triple_block_es.md`
  - `sleep_optimization.md` / `sleep_optimization_es.md`
  - `pelvic_floor_health.md` / `pelvic_floor_health_es.md`
- Loaded at runtime by `src/app/prompts/[slug]/page.tsx` via `fs.readFile()` (server-side)

**Icons & Media:**
- Location: `app/public/icons/`
- PWA icons: 192×192, 512×512, 512×512 maskable
- No external CDN (self-hosted)

## Data Flow

**User → App:**
1. Browser requests page (Next.js App Router)
2. Server renders prompt markdown from filesystem
3. Client hydrates, loads user settings from localStorage
4. User interacts (level select, equipment setup, workout generation)

**App → Vercel:**
- Event tracking: `track()` sends event to Vercel Analytics endpoint
- No other outbound requests

**App → User:**
- Service Worker serves cached assets offline
- Manifest.json enables PWA install on home screen

## Offline Capabilities

**Supported:**
- View previously generated workouts (cached in localStorage)
- View prompts (cached by Service Worker)
- View exercise library (bundled in code)
- Generate new workouts (fully client-side algorithm)

**Not Supported:**
- Analytics events (require network)
- Prompt markdown load if never visited (not pre-cached in SW)

---

*Integration audit: 2026-03-10*
