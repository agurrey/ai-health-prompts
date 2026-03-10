import { getSupabase, getAuthUser, isAnonymousUser } from '@/lib/supabase';
import { getXP, getStreak } from '@/lib/storage';
import { getLeague } from '@/lib/types/community';
import type { Profile } from '@/lib/types/community';

export type CommunityStatus = 'none' | 'anonymous' | 'verified' | 'member';

/**
 * Returns the user's current community membership state.
 * 'none'      — no auth session
 * 'anonymous' — anonymous session, no email
 * 'verified'  — has email but no username
 * 'member'    — email + username + public profile
 */
export async function getCommunityStatus(): Promise<CommunityStatus> {
  const user = await getAuthUser();
  if (!user) return 'none';

  const anonymous = await isAnonymousUser();
  if (anonymous) return 'anonymous';

  // Has email — check for username in profiles
  const sb = await getSupabase();
  if (!sb) return 'verified';

  const { data } = await sb
    .from('profiles')
    .select('username, is_public')
    .eq('id', user.id)
    .maybeSingle();

  if (data?.username && data?.is_public) return 'member';
  return 'verified';
}

/**
 * Creates an anonymous Supabase session.
 * Supabase triggers auto-create a profile row on sign-in.
 * Also writes current XP and streak to the profile.
 */
export async function joinCommunity() {
  const sb = await getSupabase();
  if (!sb) throw new Error('Supabase not available');

  const { data, error } = await sb.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error('No user returned');

  // Sync current local stats into the new profile row
  const { xpLevel } = getXP();
  const { current: streak } = getStreak();
  const league = getLeague(xpLevel);

  await sb
    .from('profiles')
    .upsert({ id: data.user.id, xp_level: xpLevel, streak, league }, { onConflict: 'id' });

  return data.user;
}

/**
 * Sends a magic link to the provided email to upgrade from anonymous.
 * Basic format validation before calling Supabase.
 */
export async function upgradeToEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const trimmed = email.trim();
  if (!trimmed.includes('@') || !trimmed.includes('.')) {
    return { success: false, error: 'Invalid email address' };
  }

  const sb = await getSupabase();
  if (!sb) return { success: false, error: 'Not connected' };

  const { error } = await sb.auth.updateUser({ email: trimmed });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Validates and claims a username for the current user's profile.
 * Checks uniqueness via case-insensitive query before updating.
 */
export async function setUsername(
  username: string
): Promise<{ success: boolean; error?: string }> {
  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters' };
  }
  if (trimmed.length > 20) {
    return { success: false, error: 'Username must be at most 20 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { success: false, error: 'Only letters, numbers, and underscores' };
  }

  const sb = await getSupabase();
  if (!sb) return { success: false, error: 'Not connected' };

  // Check uniqueness (case-insensitive)
  const { data: existing } = await sb
    .from('profiles')
    .select('id')
    .ilike('username', trimmed)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'Username already taken' };
  }

  const user = await getAuthUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await sb
    .from('profiles')
    .update({ username: trimmed, is_public: true })
    .eq('id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Fetches a profile from Supabase.
 * If no userId provided, fetches the current user's own profile.
 */
export async function getProfile(userId?: string): Promise<Profile | null> {
  const sb = await getSupabase();
  if (!sb) return null;

  let targetId = userId;
  if (!targetId) {
    const user = await getAuthUser();
    if (!user) return null;
    targetId = user.id;
  }

  const { data } = await sb
    .from('profiles')
    .select('*')
    .eq('id', targetId)
    .maybeSingle();

  return (data as Profile) ?? null;
}

/**
 * Updates the current user's profile with latest XP level, streak, and league.
 * Called by the sync engine after syncing workout data.
 */
export async function updateProfileStats(
  xpLevel: number,
  streak: number
): Promise<void> {
  const sb = await getSupabase();
  if (!sb) return;

  const user = await getAuthUser();
  if (!user) return;

  const league = getLeague(xpLevel);

  await sb
    .from('profiles')
    .update({ xp_level: xpLevel, streak, league })
    .eq('id', user.id);
}
