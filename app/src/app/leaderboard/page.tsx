'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { getSupabase, pingSupabase } from '@/lib/supabase';
import { getCommunityStatus } from '@/lib/auth';
import { getAuthUser } from '@/lib/supabase';
import { getLeague } from '@/lib/types/community';
import { getXP } from '@/lib/storage';
import LeagueSelector from '@/components/LeagueSelector';
import CommunityBanner from '@/components/CommunityBanner';
import type { League, LeaderboardEntry } from '@/lib/types/community';
import type { CommunityStatus } from '@/lib/auth';

function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10);
}

function getWeekEndDate(mondayStr: string): string {
  const monday = new Date(mondayStr + 'T00:00:00Z');
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return sunday.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string, lang: 'en' | 'es'): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', timeZone: 'UTC' };
  return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', options);
}

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardPage() {
  const { t, lang } = useI18n();

  const [status, setStatus] = useState<CommunityStatus | null>(null);
  const [userLeague, setUserLeague] = useState<League>('bronze');
  const [selectedLeague, setSelectedLeague] = useState<League>('bronze');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const mondayStr = getCurrentMonday();
  const sundayStr = getWeekEndDate(mondayStr);

  // Initialize: check community status and user league
  useEffect(() => {
    async function init() {
      const [communityStatus, user] = await Promise.all([
        getCommunityStatus(),
        getAuthUser(),
      ]);
      setStatus(communityStatus);

      if (user) setCurrentUserId(user.id);

      // Derive user's league from local XP
      const { xpLevel } = getXP();
      const league = getLeague(xpLevel);
      setUserLeague(league);
      setSelectedLeague(league);
    }
    init();
  }, []);

  // Fetch leaderboard when selectedLeague changes (and status is known)
  useEffect(() => {
    if (status === null) return;
    if (status === 'none') { setLoading(false); return; }

    async function fetchLeaderboard() {
      setLoading(true);
      setConnecting(false);

      const alive = await pingSupabase();
      if (!alive) {
        setConnecting(true);
        setLoading(false);
        return;
      }

      const sb = await getSupabase();
      if (!sb) { setLoading(false); return; }

      // Trigger refresh RPC (fire and forget — server handles the work)
      void (async () => { await sb.rpc('refresh_weekly_leaderboard'); })();

      const { data } = await sb
        .from('weekly_leaderboard')
        .select('*')
        .eq('league', selectedLeague)
        .eq('week_start', mondayStr)
        .order('rank', { ascending: true })
        .limit(20);

      setEntries((data as LeaderboardEntry[]) ?? []);
      setLoading(false);
      setConnecting(false);
    }

    fetchLeaderboard();
  }, [selectedLeague, status, mondayStr]);

  // ---- Render ----

  const weekLabel =
    lang === 'es'
      ? `Semana del ${formatDateLabel(mondayStr, 'es')} - ${formatDateLabel(sundayStr, 'es')}`
      : `Week of ${formatDateLabel(mondayStr, 'en')} - ${formatDateLabel(sundayStr, 'en')}`;

  // Non-community user
  if (status === 'none') {
    return (
      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t('Weekly Leaderboard', 'Clasificacion Semanal')}
        </h1>
        <CommunityBanner onJoin={() => {}} />
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">
          {t('Weekly Leaderboard', 'Clasificacion Semanal')}
        </h1>
        <p className="text-sm text-muted">{weekLabel}</p>
      </div>

      {/* Anonymous claim prompt */}
      {status === 'anonymous' && (
        <div className="bg-card border border-border rounded-xl px-4 py-3 text-sm text-muted">
          {t(
            'Claim a username to appear on the leaderboard.',
            'Reclama un nombre de usuario para aparecer en la clasificacion.'
          )}
        </div>
      )}

      {/* League tabs */}
      {status !== null && (
        <div className="border-b border-border">
          <LeagueSelector
            selected={selectedLeague}
            userLeague={userLeague}
            onChange={setSelectedLeague}
          />
        </div>
      )}

      {/* Connecting state */}
      {connecting && (
        <div className="text-sm text-muted text-center py-4">
          {t('Connecting to community...', 'Conectando con la comunidad...')}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !connecting && (
        <ul className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg bg-card animate-pulse">
              <div className="w-6 h-4 bg-border rounded" />
              <div className="flex-1 h-4 bg-border rounded" />
              <div className="w-16 h-4 bg-border rounded" />
            </li>
          ))}
        </ul>
      )}

      {/* Leaderboard list */}
      {!loading && !connecting && (
        <>
          {entries.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">
              {t('No activity this week', 'Sin actividad esta semana')}
            </p>
          ) : (
            <ul className="space-y-1">
              {entries.map((entry) => {
                const isCurrentUser = entry.user_id === currentUserId;
                const medal = RANK_MEDALS[entry.rank];
                const isTop3 = entry.rank <= 3;

                return (
                  <li
                    key={entry.user_id}
                    className={[
                      'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors',
                      isCurrentUser ? 'bg-accent/10 border border-accent/20' : 'bg-card',
                    ].join(' ')}
                  >
                    {/* Rank */}
                    <span
                      className={[
                        'w-7 text-center shrink-0',
                        isTop3 ? 'text-lg' : 'text-sm text-muted font-mono',
                      ].join(' ')}
                    >
                      {medal ?? `#${entry.rank}`}
                    </span>

                    {/* Username */}
                    <span
                      className={[
                        'flex-1 truncate',
                        isTop3 ? 'font-semibold text-foreground' : 'text-sm text-foreground',
                      ].join(' ')}
                    >
                      {entry.username}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-accent font-normal">
                          {t('(you)', '(tu)')}
                        </span>
                      )}
                    </span>

                    {/* Workout count */}
                    <span className="text-sm text-muted shrink-0">
                      {entry.workouts_this_week}{' '}
                      {t(
                        entry.workouts_this_week === 1 ? 'workout' : 'workouts',
                        entry.workouts_this_week === 1 ? 'entreno' : 'entrenos'
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {/* Reset note */}
      {!loading && !connecting && status !== null && (
        <p className="text-xs text-muted text-center pt-2">
          {t('Resets every Monday', 'Se reinicia cada lunes')}
        </p>
      )}
    </main>
  );
}
