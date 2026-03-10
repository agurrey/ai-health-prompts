---
phase: 03-supabase-community
plan: "05"
subsystem: ui
tags: [react, nextjs, supabase, community, feed, kudos, nav]

# Dependency graph
requires:
  - phase: 03-supabase-community plan 01
    provides: FeedItem/Kudos types, activity_feed table schema
  - phase: 03-supabase-community plan 02
    provides: getCommunityStatus, CommunityBanner, JoinCommunity, UsernameSetup
  - phase: 03-supabase-community plan 03
    provides: getSupabase, getAuthUser
provides:
  - /feed page with paginated activity feed and kudos interaction
  - FeedItem component rendering 4 event types with bilingual text
  - Kudos button with optimistic UI (1 per user per item)
  - ClientShell nav updated with Leaderboard and Feed links
  - Profile page community integration (banner, claim spot, member badge)
affects: [deployment, hormesis-qa]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Optimistic UI with revert on error for kudos
    - Access control via getCommunityStatus() in useEffect
    - Skeleton loading state with animate-pulse
    - RawFeedRow intermediate type for Supabase join mapping

key-files:
  created:
    - app/src/components/FeedItem.tsx
    - app/src/app/feed/page.tsx
  modified:
    - app/src/components/ClientShell.tsx
    - app/src/app/profile/page.tsx
    - app/src/app/leaderboard/page.tsx

key-decisions:
  - "FeedItem never renders weights, times, kg, or lbs — event_data contains exercise_name only for PR type"
  - "Anonymous users can view feed but cannot give kudos — tooltip prompts join"
  - "Kudos optimistic update reverts on DB insert failure (duplicate or network error)"
  - "CommunityBanner integration in profile is purely additive at the bottom — no existing content touched"

patterns-established:
  - "Optimistic UI pattern: update state immediately, revert on error"
  - "Status-gated content: getCommunityStatus() in useEffect, render by status value"

requirements-completed: [COM-04, COM-05, COM-06]

# Metrics
duration: 4min
completed: 2026-03-10
---

# Phase 03 Plan 05: Activity Feed + Nav Integration Summary

**Activity feed with bilingual FeedItem cards, optimistic kudos, and community nav links wired into global shell and profile page**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-10T21:19:48Z
- **Completed:** 2026-03-10T21:23:52Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- FeedItem renders workout/achievement/pr/streak events in EN/ES with privacy-safe text — no weights, times, or performance numbers shown
- Kudos button with optimistic UI: immediate +1 on click, reverts on DB error or duplicate insert
- /feed page fetches activity_feed joined with profiles and kudos, paginates 20 at a time, skeleton loading state, empty state, access control
- ClientShell nav updated: Leaderboard and Feed links added between Profile and Prompts
- Profile page community integration: CommunityBanner for none, claim spot card for anonymous, public badge for member

## Task Commits

1. **Task 1: FeedItem component + /feed page** - `14941f9` (feat)
2. **Task 2: Nav links + profile CommunityBanner** - `51d08f0` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `app/src/components/FeedItem.tsx` - Single feed item card with 4 event types and kudos button
- `app/src/app/feed/page.tsx` - Activity feed page with Supabase join query, pagination, access control
- `app/src/components/ClientShell.tsx` - Added Leaderboard and Feed nav links
- `app/src/app/profile/page.tsx` - Added community status section at bottom (banner/claim/member badge)
- `app/src/app/leaderboard/page.tsx` - Rule 1 auto-fixes for TS errors

## Decisions Made
- FeedItem never shows performance numbers — only exercise names and session types (privacy by design)
- Anonymous users get read-only feed access — kudos requires at least an anonymous Supabase session (canKudos = status !== 'anonymous')
- Optimistic UI reverts to original state on any insert error — prevents phantom kudos in UI

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed leaderboard/page.tsx TypeScript errors blocking compilation**
- **Found during:** Task 1 (TypeScript verification step)
- **Issue 1:** `void sb.rpc(...)` — linter rewrote to `void (async () => { await sb.rpc(...); })()` which caused `PromiseLike.catch` TS error
- **Issue 2:** `status !== 'none'` comparison with `CommunityStatus | null` type always-true for null — removed redundant check
- **Fix:** Both issues were pre-existing in leaderboard/page.tsx. Linter auto-applied the IIFE pattern; removed the invalid null comparison
- **Files modified:** app/src/app/leaderboard/page.tsx
- **Verification:** `npx tsc --noEmit` passes clean
- **Committed in:** 14941f9 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Pre-existing TS errors in leaderboard page, unrelated to feed work. Required fix for clean build. No scope creep.

## Issues Encountered
None — Supabase join query pattern with `profiles!activity_feed_user_id_fkey` follows existing leaderboard conventions.

## User Setup Required
None - no external service configuration required for this plan.

## Next Phase Readiness
- Phase 3 complete: all community features shipped (Supabase init, auth flow, sync engine, leaderboard, feed + nav)
- Ready for production deployment to Vercel
- `npm run build` passes clean with /feed, /leaderboard, /profile all rendering

---
*Phase: 03-supabase-community*
*Completed: 2026-03-10*
