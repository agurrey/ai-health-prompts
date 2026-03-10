---
phase: 03-supabase-community
verified: 2026-03-10T21:31:55Z
status: gaps_found
score: 4/5 success criteria verified
re_verification: false
gaps:
  - truth: "User sees an activity feed of public workout completions, achievements, and PRs — with exercise name shown for PRs"
    status: partial
    reason: "FeedItem reads event_data.exercise_name for PR events, but storage.ts posts exercise_id only. FeedItem has no exercises import to resolve the name. PR events will display 'set a new personal record!' with no exercise name."
    artifacts:
      - path: "app/src/components/FeedItem.tsx"
        issue: "Reads event_data.exercise_name (line 61) but no exercises data import exists to resolve exercise_id to a display name"
      - path: "app/src/lib/storage.ts"
        issue: "postFeedEvent('pr', { exercise_id: pr.exerciseId }) sends only exercise_id, not exercise_name (line 334)"
    missing:
      - "In FeedItem.tsx PR case: import { exercises } from '@/data/exercises' and resolve exercise name via exercises.find(e => e.id === item.event_data.exercise_id)"
      - "OR in storage.ts: lookup exercise name before posting and include exercise_name in event_data"
  - truth: "App handles Supabase auto-pause with wake-up ping and Connecting state — for all community pages"
    status: partial
    reason: "Feed page (/feed) does not call pingSupabase() before querying. When Supabase is paused, the fetch silently returns empty and the page shows 'No activity yet' instead of 'Connecting...'. Leaderboard correctly calls pingSupabase(). Sync operations in sync.ts correctly call pingSupabase()."
    artifacts:
      - path: "app/src/app/feed/page.tsx"
        issue: "fetchItems() calls getSupabase() directly without pingSupabase(). On pause: query silently fails returning empty rows, no 'Connecting...' state shown."
    missing:
      - "In feed/page.tsx fetchItems(): add pingSupabase() check before the Supabase query. If not alive, show a 'Connecting...' message and return early."
human_verification:
  - test: "Tap Join Community button in the app"
    expected: "Anonymous session created instantly, no email prompt, app state updates to 'anonymous' community status"
    why_human: "Requires live Supabase project with anonymous sign-ins enabled; cannot verify Supabase auth flow programmatically"
  - test: "Navigate to /leaderboard with no community connection (Supabase paused or env vars unset)"
    expected: "Page shows 'Connecting to community...' message, not blank or error state"
    why_human: "Supabase auto-pause behavior requires a live project that has been idle for a week"
  - test: "Complete a workout while offline (airplane mode), then reconnect"
    expected: "Workout saved to localStorage immediately, sync queue drains on reconnect without data loss"
    why_human: "Requires real device offline simulation and live Supabase project"
---

# Phase 3: Supabase + Community Verification Report

**Phase Goal:** Users can optionally join the community — anonymous or with email — sync their data to the cloud, compete on a weekly leaderboard, and see/give kudos in an activity feed
**Verified:** 2026-03-10T21:31:55Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can tap "Join Community" and get an anonymous session with zero friction | VERIFIED | `JoinCommunity.tsx` calls `joinCommunity()` → `signInAnonymously()`. Single button, no email required. Loading spinner during call. |
| 2 | User can upgrade to a named account with email/magic link and claim a username | VERIFIED | `UsernameSetup.tsx` + `upgradeToEmail()` + `setUsername()` all implemented with validation (3-20 chars, `/^[a-zA-Z0-9_]+$/`, uniqueness check on blur). |
| 3 | User's workout data syncs in the background; app works fully offline and recovers gracefully from Supabase auto-pause | PARTIAL | sync.ts and leaderboard correctly call `pingSupabase()` before operations. Feed page does NOT — silent failure instead of "Connecting..." state. localStorage-first write is solid. |
| 4 | User sees a weekly leaderboard showing the top 20 in their XP league, resetting every Monday | VERIFIED | `/leaderboard` page queries `weekly_leaderboard` table with `limit(20)`, league filter, `week_start` = current Monday (UTC). `refresh_weekly_leaderboard()` RPC called on load. SQL migration computes Mon-Sun window via `date_trunc('week')`. |
| 5 | User sees an activity feed of public workout completions and achievements, and can give one kudos per item — weights and times are never shown | PARTIAL | Feed, kudos, and weight-stripping all work. PR event type reads `exercise_name` from `event_data` but storage only posts `exercise_id` — exercise name always omitted for PR events. COM-06 (no weights/times) is satisfied; display is degraded for PR events. |

**Score:** 3/5 truths fully verified, 2/5 partial

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/src/lib/supabase.ts` | Lazy-loaded Supabase singleton, auth helpers, connection state | VERIFIED | Exports `getSupabase` (dynamic import via `await import()`), `pingSupabase`, `getAuthUser`, `isAnonymousUser`, `signOut`, `onConnectionStateChange`, `getConnectionState`. Top-level imports are `import type` only — no runtime bundle. |
| `app/src/lib/types/community.ts` | Shared TypeScript types for all community features | VERIFIED | Exports `Profile`, `WorkoutSync`, `ExerciseLogSync`, `FeedItem`, `Kudos`, `LeaderboardEntry`, `League`, `ConnectionState`, `SyncQueueItem`, `getLeague`. All required types present. |
| `supabase/migrations/001_gamification.sql` | Full database schema with 7 tables + RLS policies | VERIFIED | 7 `CREATE TABLE` statements confirmed. 29 RLS policy statements. `handle_new_user` trigger. `refresh_weekly_leaderboard()` function with Monday `date_trunc('week')` logic. UNIQUE constraint on `kudos(feed_item_id, user_id)`. |
| `app/.env.local.example` | Template for required environment variables | VERIFIED | Contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| `app/src/lib/auth.ts` | Auth flow functions | VERIFIED | Exports `getCommunityStatus`, `joinCommunity`, `upgradeToEmail`, `setUsername`, `getProfile`, `updateProfileStats`, `CommunityStatus`. All use `getSupabase()` for lazy init. |
| `app/src/components/JoinCommunity.tsx` | Join Community modal/flow UI | VERIFIED | Modal with "Join Now" button, loading spinner, error handling, close button. Calls `joinCommunity()`. Bilingual. |
| `app/src/components/UsernameSetup.tsx` | Username selection modal after email upgrade | VERIFIED | Real-time validation (length + char pattern). Blur check for uniqueness. Optional email field. Calls `setUsername()`. One concern: uniqueness check bypasses `getSupabase()` singleton and creates its own client. Functional but not using the singleton pattern. |
| `app/src/components/CommunityBanner.tsx` | Non-intrusive banner | VERIFIED | Checks `getCommunityStatus()` on mount, renders null if already joined. "Join Community" button calls `onJoin` prop. |
| `app/src/lib/sync.ts` | Offline-first sync engine | VERIFIED | Exports `syncWorkout`, `syncExerciseLogs`, `syncAchievement`, `postFeedEvent`, `drainSyncQueue`, `getSyncStatus`, `isCommunityUser`. Queue uses `hormesis_sync_queue` localStorage key. Auto-drain on reconnect via `onConnectionStateChange`. Weight key sanitizer (`BANNED_KEY_PATTERNS`). |
| `app/src/lib/storage.ts` | Sync triggers added | VERIFIED | `markWorkoutDone`, `logExercise`, `logExercises`, `addAchievement`, `savePersonalRecord` all fire non-blocking sync via `.catch(() => {})`. Feed events posted for all 4 types. No existing behavior altered. |
| `app/src/app/leaderboard/page.tsx` | Weekly leaderboard page | VERIFIED | Top 20 per league, current Monday computed (UTC), league tabs, user row highlight, loading skeleton, "Connecting..." state, "Resets every Monday" note, access control for non-community users. |
| `app/src/components/LeagueSelector.tsx` | League tab selector | VERIFIED | 4 leagues with correct ranges (Lv 1-3, 4-6, 7-10, 11+), league accent colors, user league indicator, bilingual via `useI18n()`. |
| `app/src/app/feed/page.tsx` | Activity feed page | VERIFIED (with note) | Fetches from `activity_feed` with profiles join + kudos join. Paginated 20 at a time. Access control for non-community users. Optimistic kudos with revert on error. Missing `pingSupabase()` for auto-pause handling. |
| `app/src/components/FeedItem.tsx` | Single feed item card with kudos button | PARTIAL | Handles all 4 event types. Kudos button with 1-per-user enforcement (disabled after kudos). Relative timestamps. No weight/time display. PR case reads `exercise_name` from `event_data` but storage only posts `exercise_id` — exercise name will be absent from all PR feed items. |
| `app/src/components/ClientShell.tsx` | Updated nav with Leaderboard and Feed links | VERIFIED | Nav order: Program | History | Profile | Leaderboard | Feed | Prompts | About. Both links present with bilingual labels. |
| `app/src/app/profile/page.tsx` | Profile page with CommunityBanner integration | VERIFIED | CommunityBanner shown for `none` status. "Claim your spot" card for `anonymous`. Public profile badge for `member`. JoinCommunity and UsernameSetup modals wired. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `supabase.ts` | `@supabase/supabase-js` | `await import('@supabase/supabase-js')` (line 37) | WIRED | Dynamic import confirmed. Top-level only has `import type`. |
| `auth.ts` | `supabase.ts` | `getSupabase()` calls | WIRED | 5 calls confirmed in auth.ts |
| `JoinCommunity.tsx` | `auth.ts` | `joinCommunity()` on button click | WIRED | Line 24: `await joinCommunity()` |
| `UsernameSetup.tsx` | `auth.ts` | `setUsername()` / `upgradeToEmail()` on form submit | WIRED | Lines 73, 83 confirmed |
| `sync.ts` | `supabase.ts` | `getSupabase()` for DB operations | WIRED | Imported at line 1, called throughout |
| `sync.ts` | `localStorage` | `hormesis_sync_queue` key | WIRED | `QUEUE_KEY = 'hormesis_sync_queue'` at line 5 |
| `storage.ts` | `sync.ts` | sync + feed event calls after writes | WIRED | 8 trigger sites confirmed |
| `leaderboard/page.tsx` | `supabase.ts` | `getSupabase()` + `pingSupabase()` | WIRED | Both imported and used |
| `leaderboard/page.tsx` | `auth.ts` | `getCommunityStatus()` access control | WIRED | Line 56 confirmed |
| `feed/page.tsx` | `supabase.ts` | `getSupabase()` for feed + kudos queries | WIRED | Used in `fetchItems` and `handleKudos` |
| `ClientShell.tsx` | `/leaderboard` and `/feed` routes | Next.js `<Link>` components | WIRED | Lines 28-33 confirmed |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AUTH-01 | 03-02 | Anonymous Supabase session (zero-friction) | SATISFIED | `joinCommunity()` → `signInAnonymously()` wired to "Join Now" button |
| AUTH-02 | 03-02 | Email/magic link upgrade + username claim | SATISFIED | `upgradeToEmail()` + `setUsername()` fully implemented and wired |
| AUTH-03 | 03-01 | Supabase client dynamically imported only when user opts in (~45KB) | SATISFIED | `await import('@supabase/supabase-js')` at line 37 in `supabase.ts`. Top-level imports are `import type` only. REQUIREMENTS.md shows "Pending" but implementation is correct. |
| SYNC-01 | 03-03 | Workout data syncs with last-write-wins strategy | SATISFIED | `syncWorkout` uses `.upsert({ onConflict: 'user_id,date' })` |
| SYNC-02 | 03-03 | Failed sync writes queue to localStorage, drain on reconnect | SATISFIED | `addToQueue()` + `drainSyncQueue()` + `onConnectionStateChange` auto-drain |
| SYNC-03 | 03-03 | Handles Supabase auto-pause with wake-up ping + "Connecting..." state | PARTIAL | Leaderboard and sync.ts call `pingSupabase()`. Feed page does not — shows empty instead of "Connecting..." |
| SYNC-04 | 03-01 | localStorage remains source of truth — app works fully offline | SATISFIED | All write ops write to localStorage first. Sync is fire-and-forget. Main app pages read exclusively from `loadData()`. REQUIREMENTS.md shows "Pending" but implementation is correct. |
| COM-01 | 03-02 | Username claim on upgrade to public profile | SATISFIED | `setUsername()` validates + sets `is_public = true` |
| COM-02 | 03-04 | Weekly leaderboard top 20 in user's XP league | SATISFIED | Leaderboard page queries with `limit(20)`, league filter, Monday `week_start` |
| COM-03 | 03-04 | 4 leagues: Bronze (1-3), Silver (4-6), Gold (7-10), Platinum (11+) | SATISFIED | `getLeague()` in community.ts + `LeagueSelector` tabs with correct ranges |
| COM-04 | 03-05 | Activity feed shows public workout completions, achievements, PRs | PARTIAL | Feed shows all 4 event types. PR events lack exercise name (exercise_id stored, exercise_name not resolved). |
| COM-05 | 03-05 | Kudos (fist-bump): 1 per user per item | SATISFIED | `UNIQUE(feed_item_id, user_id)` in DB + disabled button after kudos + optimistic UI with revert |
| COM-06 | 03-05 | Feed shows WHAT, never HOW MUCH (no weights/times) | SATISFIED | `BANNED_KEY_PATTERNS` in `sanitizeEventData()`. Storage only posts `exercise_id` for PRs (no weight). FeedItem has no weight display. |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `UsernameSetup.tsx` | 50-58 | Direct `createClient()` bypass instead of `getSupabase()` singleton | Warning | Creates a second Supabase client instance for username availability check. Functional but inconsistent — auth session won't be inherited by this ephemeral client. The check works (anonymous read) but is architecturally inconsistent. |

---

### Human Verification Required

#### 1. Anonymous Join Flow

**Test:** Open app in browser, navigate to /profile, tap "Join Community" button
**Expected:** Modal opens, tap "Join Now", user gets anonymous session within ~2 seconds, community status updates to 'anonymous', CommunityBanner disappears
**Why human:** Requires live Supabase project with anonymous sign-ins enabled in dashboard

#### 2. Magic Link Email Upgrade

**Test:** After joining anonymously, tap "Claim Spot", enter email, submit
**Expected:** "Check your email" screen appears; email arrives with magic link; clicking magic link upgrades to named account
**Why human:** Requires real email delivery and live Supabase project

#### 3. Supabase Auto-Pause Recovery (Leaderboard)

**Test:** With a Supabase project that has been paused, navigate to /leaderboard
**Expected:** "Connecting to community..." message shown; after Supabase wakes (30-60s), leaderboard loads automatically
**Why human:** Auto-pause requires a project idle for 1 week; cannot simulate programmatically

#### 4. Offline Sync Queue

**Test:** Complete a workout while in airplane mode, then reconnect to internet
**Expected:** Workout saved immediately (localStorage), sync queue drains after reconnect (no data loss, no duplicate)
**Why human:** Requires device-level network manipulation and live Supabase project to observe queue drain

---

### Gaps Summary

Two gaps were found, both affecting the feed page:

**Gap 1 — PR exercise name missing from feed (COM-04 partial)**
Storage posts `{ exercise_id: pr.exerciseId }` to the feed, but `FeedItem.tsx` reads `event_data.exercise_name`. No resolution logic exists — `FeedItem` has no `exercises` import. PR feed events will render as "set a new personal record!" with no exercise name. COM-06 is not violated (no weights shown), but the display is less informative than specified. Fix: add `import { exercises } from '@/data/exercises'` to `FeedItem.tsx` and resolve the name using `exercise_id` from `event_data`.

**Gap 2 — Feed page missing auto-pause handling (SYNC-03 partial)**
`/feed/page.tsx` calls `getSupabase()` directly without calling `pingSupabase()` first. If Supabase is paused, the feed query silently returns an empty array and the page shows "No activity yet" instead of a "Connecting..." state. The leaderboard page and all write operations in `sync.ts` correctly call `pingSupabase()` first. Fix: add `pingSupabase()` check in `fetchItems()` before the Supabase query, similar to the leaderboard pattern.

Both gaps are small and do not block the core phase goal — community joining, syncing, leaderboard, and kudos all work correctly. The gaps are in the polish layer of the feed experience.

---

_Verified: 2026-03-10T21:31:55Z_
_Verifier: Claude (gsd-verifier)_
