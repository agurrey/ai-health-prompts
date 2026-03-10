import { getSupabase, pingSupabase, getAuthUser, getConnectionState, onConnectionStateChange } from '@/lib/supabase';
import type { SyncQueueItem, ConnectionState } from '@/lib/types/community';
import type { CompletedWorkout, ExerciseLogEntry } from '@/lib/storage';

const QUEUE_KEY = 'hormesis_sync_queue';
const LAST_SYNC_KEY = 'hormesis_last_sync';

// ---------------------------------------------------------------------------
// Queue helpers
// ---------------------------------------------------------------------------

function loadQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SyncQueueItem[];
  } catch {
    return [];
  }
}

function saveQueue(items: SyncQueueItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

function addToQueue(item: Omit<SyncQueueItem, 'id' | 'created_at' | 'retries'>): void {
  const queue = loadQueue();
  queue.push({
    ...item,
    id: crypto.randomUUID(),
    created_at: Date.now(),
    retries: 0,
  });
  saveQueue(queue);
}

// ---------------------------------------------------------------------------
// Community user gate
// ---------------------------------------------------------------------------

export async function isCommunityUser(): Promise<boolean> {
  const user = await getAuthUser();
  return user !== null;
}

// ---------------------------------------------------------------------------
// Feed event sanitizer — strips weight/time keys as safety net
// ---------------------------------------------------------------------------

const BANNED_KEY_PATTERNS = ['weight', 'time', 'kg', 'lbs'];

function sanitizeEventData(data: Record<string, string | number>): Record<string, string | number> {
  const clean: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(data)) {
    const lk = key.toLowerCase();
    if (!BANNED_KEY_PATTERNS.some(p => lk.includes(p))) {
      clean[key] = value;
    }
  }
  return clean;
}

// ---------------------------------------------------------------------------
// Core sync functions
// ---------------------------------------------------------------------------

export async function syncWorkout(workout: CompletedWorkout, xpEarned: number): Promise<void> {
  const alive = await pingSupabase();
  if (!alive) {
    addToQueue({
      table: 'workouts',
      operation: 'upsert',
      payload: {
        date: workout.date,
        session_type: workout.sessionType,
        xp_earned: xpEarned,
        completed_at: new Date(workout.completedAt).toISOString(),
        synced_at: new Date().toISOString(),
      },
    });
    return;
  }

  const sb = await getSupabase();
  if (!sb) return;
  const user = await getAuthUser();
  if (!user) return;

  const { error } = await sb.from('workouts').upsert(
    {
      user_id: user.id,
      date: workout.date,
      session_type: workout.sessionType,
      xp_earned: xpEarned,
      completed_at: new Date(workout.completedAt).toISOString(),
      synced_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,date' }
  );

  if (error) {
    addToQueue({
      table: 'workouts',
      operation: 'upsert',
      payload: {
        date: workout.date,
        session_type: workout.sessionType,
        xp_earned: xpEarned,
        completed_at: new Date(workout.completedAt).toISOString(),
        synced_at: new Date().toISOString(),
      },
    });
  } else {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    }
  }
}

export async function syncExerciseLogs(entries: ExerciseLogEntry[]): Promise<void> {
  const alive = await pingSupabase();
  if (!alive) {
    for (const entry of entries) {
      addToQueue({
        table: 'exercise_logs',
        operation: 'upsert',
        payload: {
          exercise_id: entry.exerciseId,
          date: entry.date,
          weight: entry.weight,
          reps: entry.reps,
          sets: entry.sets,
          notes: entry.notes ?? null,
          synced_at: new Date().toISOString(),
        },
      });
    }
    return;
  }

  const sb = await getSupabase();
  if (!sb) return;
  const user = await getAuthUser();
  if (!user) return;

  const rows = entries.map(entry => ({
    user_id: user.id,
    exercise_id: entry.exerciseId,
    date: entry.date,
    weight: entry.weight,
    reps: entry.reps,
    sets: entry.sets,
    notes: entry.notes ?? null,
    synced_at: new Date().toISOString(),
  }));

  const { error } = await sb.from('exercise_logs').upsert(rows, { onConflict: 'user_id,exercise_id,date' });

  if (error) {
    for (const entry of entries) {
      addToQueue({
        table: 'exercise_logs',
        operation: 'upsert',
        payload: {
          exercise_id: entry.exerciseId,
          date: entry.date,
          weight: entry.weight,
          reps: entry.reps,
          sets: entry.sets,
          notes: entry.notes ?? null,
          synced_at: new Date().toISOString(),
        },
      });
    }
  }
}

export async function syncAchievement(achievementId: string, unlockedAt: string): Promise<void> {
  const alive = await pingSupabase();
  if (!alive) {
    addToQueue({
      table: 'user_achievements',
      operation: 'upsert',
      payload: { achievement_id: achievementId, unlocked_at: unlockedAt },
    });
    return;
  }

  const sb = await getSupabase();
  if (!sb) return;
  const user = await getAuthUser();
  if (!user) return;

  const { error } = await sb.from('user_achievements').upsert(
    { user_id: user.id, achievement_id: achievementId, unlocked_at: unlockedAt },
    { onConflict: 'user_id,achievement_id' }
  );

  if (error) {
    addToQueue({
      table: 'user_achievements',
      operation: 'upsert',
      payload: { achievement_id: achievementId, unlocked_at: unlockedAt },
    });
  }
}

export async function postFeedEvent(
  eventType: string,
  eventData: Record<string, string | number>
): Promise<void> {
  const sb = await getSupabase();
  if (!sb) return;
  const user = await getAuthUser();
  if (!user) return;

  // Check public profile before posting
  const { data: profile } = await sb.from('profiles').select('is_public').eq('id', user.id).maybeSingle();
  if (!profile?.is_public) return;

  const clean = sanitizeEventData(eventData);

  const alive = await pingSupabase();
  if (!alive) {
    addToQueue({
      table: 'activity_feed',
      operation: 'insert',
      payload: { event_type: eventType, event_data: clean },
    });
    return;
  }

  const { error } = await sb.from('activity_feed').insert({
    user_id: user.id,
    event_type: eventType,
    event_data: clean,
  });

  if (error) {
    addToQueue({
      table: 'activity_feed',
      operation: 'insert',
      payload: { event_type: eventType, event_data: clean },
    });
  }
}

// ---------------------------------------------------------------------------
// Drain queue
// ---------------------------------------------------------------------------

export async function drainSyncQueue(): Promise<void> {
  const user = await getAuthUser();
  if (!user) return;

  const sb = await getSupabase();
  if (!sb) return;

  const queue = loadQueue();
  if (queue.length === 0) return;

  const remaining: SyncQueueItem[] = [];

  for (const item of queue) {
    if (item.retries > 5) continue; // discard stale items

    try {
      let error: { message: string } | null = null;

      if (item.operation === 'upsert') {
        const payload = { ...item.payload, user_id: user.id };
        let conflictCol = '';
        if (item.table === 'workouts') conflictCol = 'user_id,date';
        else if (item.table === 'exercise_logs') conflictCol = 'user_id,exercise_id,date';
        else if (item.table === 'user_achievements') conflictCol = 'user_id,achievement_id';

        const res = conflictCol
          ? await (sb.from(item.table) as ReturnType<typeof sb.from>).upsert(payload, { onConflict: conflictCol })
          : await (sb.from(item.table) as ReturnType<typeof sb.from>).upsert(payload);
        error = res.error;
      } else {
        const payload = { ...item.payload, user_id: user.id };
        const res = await (sb.from(item.table) as ReturnType<typeof sb.from>).insert(payload);
        error = res.error;
      }

      if (error) {
        remaining.push({ ...item, retries: item.retries + 1 });
      }
    } catch {
      remaining.push({ ...item, retries: item.retries + 1 });
    }
  }

  saveQueue(remaining);
  if (remaining.length < queue.length && typeof window !== 'undefined') {
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  }
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export function getSyncStatus(): { queueLength: number; lastSyncAt: string | null; connectionState: ConnectionState } {
  return {
    queueLength: loadQueue().length,
    lastSyncAt: typeof window !== 'undefined' ? localStorage.getItem(LAST_SYNC_KEY) : null,
    connectionState: getConnectionState(),
  };
}

// ---------------------------------------------------------------------------
// Auto-drain on reconnect
// ---------------------------------------------------------------------------

if (typeof window !== 'undefined') {
  onConnectionStateChange((state) => {
    if (state === 'connected') drainSyncQueue();
  });
}
