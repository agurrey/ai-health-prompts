# AI Health App — Product Spec V1

## What Is This

A free web app that does 2 things:
1. **Generates a daily dumbbell workout** — changes every day, uses the dumbbell prompt logic internally
2. **Gives access to 5 specialized health AI prompts** — the user picks their need (back pain, training, nutrition, sleep, CrossFit) and gets a ready-to-use prompt they paste into their own AI

No login. No API costs. No database. Hosted on Vercel free tier.

---

## The User

**Primary:** Desk worker, 25-45, sits 8+ hours, knows they should move but doesn't know how. Has dumbbells at home collecting dust (or would buy them). Speaks English or Spanish.

**Secondary:** Anyone interested in AI-assisted health — home trainers, people with back pain, CrossFit athletes, people who want to eat better or sleep better.

**What they feel:** "I know I should exercise / eat better / sleep better, but I don't know where to start and I don't want to pay €50/month for an app."

**What we give them:** A free daily workout they can do in 25 min with 2 dumbbells + an AI coach they can talk to about any health topic using their own ChatGPT/Claude.

---

## The 2 Core Features

### Feature 1: Daily Workout Generator

**What the user sees:**
- Landing page with a simple form: select dumbbell weights (light pair kg + heavy pair kg) and experience level (beginner / intermediate / advanced)
- Hit "Generate Today's Workout"
- Get a complete session: warm-up + strength + finisher, with exercises, sets, reps, weights, coaching cues, and video demo links
- The workout changes daily (seeded by date) so they get variety without choosing

**How it works internally:**
- NO API calls. Pure client-side or server-side logic (Next.js).
- Exercise database embedded in the app (from the dumbbell prompt's exercise tables)
- Session generator algorithm:
  - Seeds randomness with today's date (same day = same workout for all users at same level)
  - Selects exercises covering all 5 patterns (squat, hinge, push, pull, carry/core)
  - Assigns sets/reps/load based on phase level
  - Rotates exercise variations across the week (no repeats within 3 days)
  - Applies the progression ladder logic internally
  - Outputs in the same format as the dumbbell prompt

**What makes it different from Fitbod/Freeletics:**
- Injury-aware: asks about pain/restrictions, modifies accordingly
- McGill bracing cue on every loaded exercise
- Coaching strategy per session (not just a list of exercises)
- Free, no paywall, no crippled free tier
- Built by a real trainer, not a generic algorithm

### Feature 2: AI Health Prompts Hub

**What the user sees:**
- A page with 5 cards, one per module:
  1. "My back hurts" → Spinal Health prompt
  2. "I want to train at home" → Dumbbell Home Training prompt
  3. "I want to eat better" → Whole Food Nutrition prompt
  4. "I can't sleep" → Sleep Optimization prompt
  5. "Program my CrossFit" → Triple Block prompt
- Click a card → see a brief description of what the prompt does + a "Copy Prompt" button
- One click copies the full system prompt to clipboard
- Instructions: "Paste this into ChatGPT, Claude, or DeepSeek and start chatting"

**Why this works:**
- Zero API cost (user uses their own AI subscription)
- The prompts are the product — they encode real expertise
- Each prompt has built-in intake, phases, decision trees, disclaimers
- Users who get value become followers/advocates on Twitter

---

## Pages & Routes

```
/                     → Landing page + daily workout generator
/prompts              → 5-card prompt hub
/prompts/[slug]       → Individual prompt page with description + copy button
/about                → Who built this, why, credentials, links
```

4 page types. That's it.

---

## Landing Page Structure

```
┌─────────────────────────────────────────┐
│  HERO                                    │
│  "Your daily dumbbell workout.           │
│   Free. No app. No login. Just train."   │
│                                          │
│  [Light DBs: __ kg]  [Heavy DBs: __ kg] │
│  [Level: Beginner / Inter / Advanced]    │
│  [Any restrictions? dropdown]            │
│                                          │
│  [ GENERATE TODAY'S WORKOUT ]            │
├─────────────────────────────────────────┤
│  WORKOUT OUTPUT                          │
│  (rendered session in clean format)      │
│  Warm-up → Strength → Finisher          │
│  Each exercise with cue + demo link     │
├─────────────────────────────────────────┤
│  PROMPT HUB TEASER                       │
│  "Need more than a workout?"            │
│  5 mini-cards linking to /prompts        │
├─────────────────────────────────────────┤
│  FOOTER                                  │
│  About · GitHub · Twitter @ignakki      │
└─────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js (App Router) | Already used for quiz-project. SSR + static. |
| Hosting | Vercel (free tier) | Already set up. Zero cost. |
| Styling | Tailwind CSS | Fast, utility-first, no design system needed |
| Database | None (V1) | No user data to store. Workouts are deterministic from date + inputs. |
| Auth | None (V1) | No login. Friction zero. |
| API | None (V1) | Workout generation is client/server logic, not LLM calls. |
| Language | TypeScript | Type safety for exercise database and generator logic. |
| i18n | next-intl or manual | Bilingual EN/ES. Detect browser language, allow toggle. |

**Total monthly cost: €0**

---

## Exercise Database Schema

```typescript
interface Exercise {
  id: string;
  name: string;                    // Always English
  pattern: 'squat' | 'hinge' | 'push' | 'pull' | 'carry';
  load: 'light' | 'heavy' | 'bodyweight';
  level: 1 | 2 | 3;              // Phase minimum
  cue: string;                    // 1-line coaching cue
  cue_es: string;                 // Spanish version
  demoSearch: string;             // YouTube search string
  demoChannel: string;            // Recommended channel
  contraindications?: string[];   // e.g., ['shoulder_pain', 'low_back']
}

interface Session {
  date: string;                   // YYYY-MM-DD (seed)
  level: 'beginner' | 'intermediate' | 'advanced';
  lightKg: number;
  heavyKg: number;
  restrictions: string[];
  warmup: WarmupBlock;
  strength: StrengthBlock[];
  finisher: FinisherBlock;
  strategy: string;               // 2-3 line coaching strategy
  strategy_es: string;
}
```

---

## Workout Generation Algorithm

```
Input: date, level, lightKg, heavyKg, restrictions[]

1. Seed RNG with date string hash
2. Determine session type from day-of-week:
   - Mon/Thu: Lower + Push focus
   - Tue/Fri: Upper + Pull focus
   - Wed: Full body
   - Sat: Conditioning circuit
   - Sun: Active recovery (mobility + carries only)
3. For each required pattern:
   a. Filter exercises by level ≤ user level
   b. Filter out exercises matching user restrictions
   c. Select 1 exercise per pattern (seeded random, no repeat within 3 days)
   d. Assign sets/reps from level template:
      - Beginner: 3×8-10, 90s rest
      - Intermediate: 3-4×8-12, 60-90s rest
      - Advanced: 4×6-10 with tempo/pause, 60s rest, supersets
   e. Assign weight: L/H/BW based on exercise.load
4. Generate warm-up (always: Cat-Camel + WGS + movement prep)
5. Generate finisher (core or carry, rotated)
6. Write strategy based on session type + exercises selected
7. Output formatted session
```

**No AI involved.** This is deterministic logic with seeded randomness. The intelligence is in the exercise selection rules, the contraindication filters, and the coaching cues — all extracted from the dumbbell prompt.

---

## Prompt Hub — Data Structure

```typescript
interface PromptModule {
  slug: string;                    // URL-friendly ID
  title: string;                   // Display name
  title_es: string;
  tagline: string;                 // 1-line description
  tagline_es: string;
  description: string;             // 3-5 line explanation
  description_es: string;
  icon: string;                    // Emoji or icon name
  promptFile: string;              // Path to .md file content
  tags: string[];                  // For filtering/display
}
```

The 5 modules:

| Slug | Title | Tagline |
|------|-------|---------|
| `back-pain` | Spinal Health | "AI protocol for desk workers with back pain" |
| `dumbbell` | Home Training | "Full-body training with 2 pairs of dumbbells" |
| `nutrition` | Whole Food Nutrition | "Eat real food. No calorie counting." |
| `sleep` | Sleep Optimization | "Fix your sleep with behavior, not supplements" |
| `crossfit` | CrossFit Programming | "Periodized Oly + Strength + Conditioning cycles" |

---

## Restrictions / Pain Filter

On the landing page, a simple multi-select:

```
Any of these apply to you?
☐ Shoulder pain
☐ Low back pain
☐ Knee pain
☐ Wrist pain
☐ No pull-up bar
☐ No resistance band
☐ Very limited space
☐ None of the above
```

Each restriction maps to exercise contraindications. The generator filters out flagged exercises and substitutes from the injury decision trees in the prompt.

---

## V1 Scope — What's IN

- [ ] Landing page with workout generator (form + output)
- [ ] Exercise database (50+ exercises from the dumbbell prompt)
- [ ] Workout generation algorithm (deterministic, date-seeded)
- [ ] Restriction/pain filter with exercise substitution
- [ ] Bilingual support (EN/ES, browser detect + toggle)
- [ ] Prompt hub page (5 cards)
- [ ] Individual prompt pages with copy-to-clipboard
- [ ] Mobile-responsive design
- [ ] About page with credentials + links
- [ ] SEO basics (meta tags, OG images for Twitter sharing)
- [ ] GitHub repo link
- [ ] Twitter @ignakki link

## V1 Scope — What's OUT

- ❌ User accounts / authentication
- ❌ Saved workout history
- ❌ AI API calls (no Claude/OpenAI backend)
- ❌ Payment / monetization features
- ❌ Push notifications
- ❌ Mobile app (web only)
- ❌ Exercise video hosting (link to YouTube)
- ❌ Custom workout builder (daily workout is what you get)
- ❌ Analytics beyond Vercel's built-in
- ❌ Email capture (V2)

---

## V2 Roadmap (after launch + validation)

**Trigger:** 100+ daily users OR 50+ Twitter DMs asking for more

| Feature | What | Why | Cost |
|---------|------|-----|------|
| Email capture | "Get tomorrow's workout in your inbox" | Builds list, re-engagement | Free (Resend free tier) |
| Workout history | LocalStorage-based, no auth needed | Users want to track progress | Free |
| AI chat integration | Claude API via backend, rate-limited | Users chat with the agent in-app | ~€20-50/month at moderate usage |
| Auth (optional) | Login to sync history across devices | Users asked for it | Free (NextAuth) |
| Movement assessment | Interactive quiz → personalized prompt selection | Extends the quiz-project concept | Free |

## V3 Roadmap (monetization)

**Trigger:** Consistent 500+ daily users

| Feature | What | Revenue |
|---------|------|---------|
| Pro tier | Unlimited AI chat + personalized programming + email coaching | €9.99/month via Lemon Squeezy |
| 21-day challenge | Structured program via Telegram/WhatsApp | €49-97 one-time |
| Trainer prompt pack | The 5 prompts packaged for fitness professionals | €19-29 via Lemon Squeezy |
| Physio referral integration | Physios (Ana, Irene) share link → patients land on app | Commission or partnership |

---

## Design Direction

- **Clean, minimal, fast.** No hero images, no animations, no gradients.
- **Dark mode default** (most dev/health tools use dark). Light mode toggle.
- **Typography-first.** The workout output IS the design. Make it scannable.
- **Mobile-first.** 80%+ users will open from a Twitter link on their phone.
- **No branding fluff.** No "powered by AI" badges. No stock photos of people exercising.
- **Trust signals:** "Built by a trainer with 5+ years of rehab experience" + link to GitHub repo (open prompts = transparency).

**Color palette suggestion:**
- Background: `#0a0a0a` (near-black)
- Text: `#fafafa` (near-white)
- Accent: `#22c55e` (green — health, go, action)
- Secondary: `#a3a3a3` (neutral gray for secondary text)

---

## File Structure (Next.js App Router)

```
src/
├── app/
│   ├── page.tsx                  # Landing + workout generator
│   ├── prompts/
│   │   ├── page.tsx              # Prompt hub (5 cards)
│   │   └── [slug]/
│   │       └── page.tsx          # Individual prompt + copy button
│   ├── about/
│   │   └── page.tsx              # About page
│   └── layout.tsx                # Root layout (nav, footer, i18n)
├── components/
│   ├── WorkoutGenerator.tsx      # Form + generation logic
│   ├── WorkoutDisplay.tsx        # Rendered workout output
│   ├── PromptCard.tsx            # Card component for prompt hub
│   ├── CopyButton.tsx            # Copy-to-clipboard with feedback
│   ├── LanguageToggle.tsx        # EN/ES switch
│   └── RestrictionFilter.tsx     # Pain/equipment multi-select
├── data/
│   ├── exercises.ts              # Full exercise database
│   ├── prompts.ts                # Prompt metadata (slugs, descriptions)
│   └── prompts-content/          # Raw .md files for each prompt
│       ├── back-pain.md
│       ├── dumbbell.md
│       ├── nutrition.md
│       ├── sleep.md
│       └── crossfit.md
├── lib/
│   ├── generator.ts              # Workout generation algorithm
│   ├── seed.ts                   # Date-based seeded RNG
│   └── i18n.ts                   # Internationalization helpers
└── styles/
    └── globals.css               # Tailwind base + custom styles
```

---

## Launch Plan

### Pre-launch (build phase)
1. Build exercise database from dumbbell prompt tables
2. Build generator algorithm + test with multiple dates/levels
3. Build landing page + workout display
4. Build prompt hub + individual pages
5. Deploy to Vercel, test on mobile

### Launch day (Twitter)
1. Tweet thread: "I built a free app that gives you a daily dumbbell workout. No login. No paywall. Built by a real trainer."
2. Include screenshot of a generated workout
3. Link to app
4. Pin tweet
5. Follow up with daily "today's workout" tweets linking to the app

### Post-launch (week 1-2)
1. Monitor Vercel analytics (visits, bounce rate)
2. Collect feedback via Twitter DMs
3. Fix bugs, adjust exercise selection if needed
4. If traction → start V2 features (email capture first)

---

## Success Metrics (V1)

| Metric | Target | How to measure |
|--------|--------|---------------|
| Daily visitors | 50+ within 2 weeks | Vercel Analytics |
| Workout generations | 20+ per day | Client-side event (optional) |
| Prompt copies | 10+ per day | Copy button click counter |
| Twitter followers gained | 50+ from app link | Twitter analytics |
| Bug reports | <5 critical | Twitter DMs + GitHub issues |
| Time to build | Target: 1-2 weeks | Calendar |

---

## Open Questions (decide during build)

1. **App name?** — Needs to be short, memorable, available as domain. Options to explore: something around "daily", "move", "dumbbell", or your brand.
2. **Domain?** — Custom domain or `app-name.vercel.app` for V1?
3. **OG image for Twitter sharing?** — Auto-generated per workout or static?
4. **Workout PDF export?** — Nice to have for V1 or defer to V2?
