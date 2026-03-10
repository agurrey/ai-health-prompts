// League enum derived from XP level
export type League = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Profile {
  id: string;           // auth.users UUID
  username: string | null;
  xp_level: number;
  streak: number;
  is_public: boolean;
  league: League;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSync {
  id: string;
  user_id: string;
  date: string;         // YYYY-MM-DD
  session_type: string;
  xp_earned: number;
  completed_at: string; // ISO timestamp
  synced_at: string;
}

export interface ExerciseLogSync {
  id: string;
  user_id: string;
  exercise_id: string;
  date: string;
  weight: string;
  reps: string;
  sets: number;
  notes: string | null;
  synced_at: string;
}

export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface FeedItem {
  id: string;
  user_id: string;
  event_type: 'workout' | 'achievement' | 'pr' | 'streak';
  event_data: Record<string, string | number>;  // NEVER includes weight/time
  created_at: string;
  // Joined fields:
  username?: string;
  kudos_count?: number;
  user_has_kudosed?: boolean;
}

export interface Kudos {
  id: string;
  feed_item_id: string;
  user_id: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  league: League;
  workouts_this_week: number;
  rank: number;
  // Week boundaries
  week_start: string;  // Monday YYYY-MM-DD
}

export interface SyncQueueItem {
  id: string;
  table: 'workouts' | 'exercise_logs' | 'user_achievements' | 'activity_feed';
  operation: 'upsert' | 'insert';
  payload: Record<string, unknown>;
  created_at: number;
  retries: number;
}

// Connection state for UI indicators
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'paused';

// Helper: compute league from XP level
export function getLeague(xpLevel: number): League {
  if (xpLevel >= 11) return 'platinum';
  if (xpLevel >= 7) return 'gold';
  if (xpLevel >= 4) return 'silver';
  return 'bronze';
}
