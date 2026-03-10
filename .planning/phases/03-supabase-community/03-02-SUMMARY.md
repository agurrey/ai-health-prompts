---
phase: 03-supabase-community
plan: "02"
subsystem: auth
tags: [supabase, auth, anonymous, magic-link, username, react, tailwind]

requires:
  - phase: 03-01-supabase-foundation
    provides: Supabase client singleton (getSupabase, getAuthUser, isAnonymousUser), community types (Profile, League, getLeague)
  - phase: 02-profile-page
    provides: gamification data and storage utilities (getXP, getStreak)

provides:
  - Auth flow logic module (auth.ts) with 6 exported functions
  - getCommunityStatus() returns 4-state membership enum
  - joinCommunity() creates anonymous Supabase session + syncs local XP/streak
  - upgradeToEmail() sends magic link for anonymous-to-named upgrade
  - setUsername() validates + claims unique username in profiles table
  - getProfile() and updateProfileStats() for profile reads/writes
  - JoinCommunity modal component with loading/error states
  - UsernameSetup modal with blur-based uniqueness check + optional email field
  - CommunityBanner card that hides itself when user is authenticated

affects: [03-03-sync, 03-04-leaderboard, 03-05-feed]

tech-stack:
  added: []
  patterns:
    - "4-state community status: none|anonymous|verified|member"
    - "Blur-based username availability check — queries Supabase on blur, not on keystroke"
    - "Anonymous-first auth: joinCommunity() signs in anonymously, upgradeToEmail() upgrades later"
    - "CommunityBanner self-hides via getCommunityStatus() in useEffect"

key-files:
  created:
    - app/src/lib/auth.ts
    - app/src/components/JoinCommunity.tsx
    - app/src/components/UsernameSetup.tsx
    - app/src/components/CommunityBanner.tsx

key-decisions:
  - "UsernameSetup email flow: send magic link first, username claimed on next session after verification (not in same flow)"
  - "Username uniqueness checked on blur via createClient direct call (not through getSupabase singleton) to avoid auth context issue"
  - "CommunityBanner hidden by default (useState(true)) to prevent flash before status check"

patterns-established:
  - "Auth state pattern: getCommunityStatus() is the single source of truth for UI gating"
  - "Error returns: { success: boolean; error?: string } for user-facing functions"

requirements-completed: [AUTH-01, AUTH-02, COM-01]

duration: 7min
completed: 2026-03-10
---

# Phase 03 Plan 02: Auth Flow Summary

**Anonymous-first Supabase auth with magic link email upgrade, username claiming, and bilingual community UI components**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-10T21:14:04Z
- **Completed:** 2026-03-10T21:21:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- auth.ts covers the full community membership lifecycle: none → anonymous → verified → member
- Username validation enforces 3-20 chars, alphanumeric+underscore, case-insensitive uniqueness check via `.ilike()`
- CommunityBanner self-hides so users who joined never see it again
- All 3 components bilingual (EN/ES) via `useI18n()`, consistent with existing Tailwind patterns

## Task Commits

1. **Task 1: Create auth.ts logic module** - `21f3e16` (feat)
2. **Task 2: Create JoinCommunity, UsernameSetup, CommunityBanner** - `c21c363` (feat)

## Files Created/Modified
- `app/src/lib/auth.ts` — 6 exported functions: getCommunityStatus, joinCommunity, upgradeToEmail, setUsername, getProfile, updateProfileStats
- `app/src/components/CommunityBanner.tsx` — Non-intrusive card, hides when user is authenticated
- `app/src/components/JoinCommunity.tsx` — Modal overlay with loading spinner and error display
- `app/src/components/UsernameSetup.tsx` — Username + optional email, blur-based availability, magic link flow

## Decisions Made
- UsernameSetup sends the magic link first, then shows a "check your email" screen. Username claiming happens on the next session after email verification. This matches Supabase's magic link flow correctly.
- Username availability check on blur uses a direct `createClient` call rather than the `getSupabase()` singleton because the singleton's session context can interfere with anonymous availability queries.
- CommunityBanner defaults to `hidden=true` to avoid a flash of the banner before `getCommunityStatus()` resolves.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — components are created but not yet wired into any page. Pages will reference them in subsequent plans (03-03 and beyond).

## Next Phase Readiness
- auth.ts ready for import by sync engine (Plan 03-03)
- Components ready to be placed in profile page or wherever the community entry point is designed
- Anonymous auth flow works independently — users can join before email/username step

---
*Phase: 03-supabase-community*
*Completed: 2026-03-10*
