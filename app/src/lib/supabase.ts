import type { SupabaseClient } from '@supabase/supabase-js';
import type { ConnectionState } from '@/lib/types/community';

let client: SupabaseClient | null = null;
let connectionState: ConnectionState = 'disconnected';
let stateListeners: Array<(state: ConnectionState) => void> = [];

function setConnectionState(state: ConnectionState) {
  connectionState = state;
  stateListeners.forEach(fn => fn(state));
}

export function onConnectionStateChange(fn: (state: ConnectionState) => void): () => void {
  stateListeners.push(fn);
  return () => { stateListeners = stateListeners.filter(l => l !== fn); };
}

export function getConnectionState(): ConnectionState {
  return connectionState;
}

/**
 * Lazily initialize and return the Supabase client.
 * Dynamic import ensures @supabase/supabase-js (~45KB) is NOT in the initial bundle.
 * Returns null if env vars are missing.
 */
export async function getSupabase(): Promise<SupabaseClient | null> {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  setConnectionState('connecting');

  try {
    const { createClient } = await import('@supabase/supabase-js');
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'hormesis_auth',
      },
    });
    setConnectionState('connected');
    return client;
  } catch {
    setConnectionState('disconnected');
    return null;
  }
}

/**
 * Check if Supabase is awake. Free tier auto-pauses after 1 week inactivity.
 * Call this before any DB operation. If paused, set state to 'paused' and return false.
 * The wake-up usually takes 30-60s — UI should show "Connecting..." state.
 */
export async function pingSupabase(): Promise<boolean> {
  const sb = await getSupabase();
  if (!sb) return false;

  try {
    const { error } = await sb.from('profiles').select('id').limit(1).maybeSingle();
    if (error) {
      // Supabase auto-pause returns a connection error
      setConnectionState('paused');
      return false;
    }
    setConnectionState('connected');
    return true;
  } catch {
    setConnectionState('paused');
    return false;
  }
}

/**
 * Get the current auth user, or null if not authenticated.
 */
export async function getAuthUser() {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

/**
 * Check if the current user is anonymous (no email).
 */
export async function isAnonymousUser(): Promise<boolean> {
  const user = await getAuthUser();
  if (!user) return false;
  return user.is_anonymous === true;
}

/**
 * Sign out and reset client state.
 */
export async function signOut(): Promise<void> {
  const sb = await getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
  setConnectionState('disconnected');
}
