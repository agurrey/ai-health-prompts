'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import {
  getXP,
  getAchievements,
  getPersonalRecords,
  getStreak,
  getFreezeTokens,
  loadData,
  AchievementUnlock,
  PersonalRecord,
  CompletedWorkout,
} from '@/lib/storage';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { exercises } from '@/data/exercises';
import XPBar from '@/components/XPBar';
import StreakWidget from '@/components/StreakWidget';
import BadgeGrid from '@/components/BadgeGrid';
import CommunityBanner from '@/components/CommunityBanner';
import JoinCommunity from '@/components/JoinCommunity';
import UsernameSetup from '@/components/UsernameSetup';
import { getCommunityStatus, CommunityStatus } from '@/lib/auth';

function formatShortDate(dateStr: string, lang: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (lang === 'es') {
    const monthName = d.toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' });
    return `${day} ${monthName}`;
  }
  const monthName = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  return `${monthName} ${day}`;
}

function getFavoriteType(workouts: CompletedWorkout[]): string {
  if (workouts.length === 0) return '--';
  const counts: Record<string, number> = {};
  for (const w of workouts) {
    counts[w.sessionType] = (counts[w.sessionType] ?? 0) + 1;
  }
  let best = '';
  let bestCount = 0;
  for (const [type, count] of Object.entries(counts)) {
    if (count > bestCount) {
      bestCount = count;
      best = type;
    }
  }
  return best || '--';
}

function getCompletionRate(workouts: CompletedWorkout[]): string {
  if (workouts.length === 0) return '0%';
  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));
  const first = new Date(sorted[0].date + 'T00:00:00Z');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const diffMs = today.getTime() - first.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1; // inclusive
  const rate = Math.min(100, Math.round((workouts.length / diffDays) * 100));
  return `${rate}%`;
}

export default function ProfilePage() {
  const { t, lang } = useI18n();
  const [xpData, setXpData] = useState<{ xp: number; xpLevel: number }>({ xp: 0, xpLevel: 0 });
  const [achievements, setAchievements] = useState<AchievementUnlock[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [streak, setStreak] = useState<{ current: number; longest: number; freezeActive: boolean }>({
    current: 0,
    longest: 0,
    freezeActive: false,
  });
  const [freezeTokens, setFreezeTokensState] = useState(0);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [communityStatus, setCommunityStatus] = useState<CommunityStatus>('none');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  useEffect(() => {
    setXpData(getXP());
    setAchievements(getAchievements());
    setPersonalRecords(getPersonalRecords());
    setStreak(getStreak());
    setFreezeTokensState(getFreezeTokens());
    setCompletedWorkouts(loadData().completedWorkouts);
    getCommunityStatus().then(setCommunityStatus);
  }, []);

  // PRs sorted by weight descending, top 5
  const topPRs = [...personalRecords]
    .sort((a, b) => b.weightKg - a.weightKg)
    .slice(0, 5);

  // Stats
  const totalWorkouts = completedWorkouts.length;
  const thisMonthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
  const thisMonth = completedWorkouts.filter(w => w.date.startsWith(thisMonthPrefix)).length;
  const favoriteType = getFavoriteType(completedWorkouts);
  const completionRate = getCompletionRate(completedWorkouts);

  // XP info for total display
  const { xp } = xpData;

  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-8 animate-fade-up">

      {/* Section 1: Header + XP */}
      <section className="space-y-3">
        <h1 className="text-2xl font-bold text-foreground">
          {t('Profile', 'Perfil')}
        </h1>
        <XPBar />
        <p className="text-sm text-muted text-center">
          {xp} {t('XP total', 'XP total')}
        </p>
      </section>

      {/* Section 2: Achievements */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            {t('Achievements', 'Logros')}
          </h2>
          <span className="text-xs bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 rounded-full px-2 py-0.5 font-medium">
            {achievements.length}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <BadgeGrid unlockedAchievements={achievements} />
      </section>

      {/* Section 3: Personal Records */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          {t('Personal Records', 'Records Personales')}
        </h2>
        {topPRs.length > 0 ? (
          <ul className="divide-y divide-border">
            {topPRs.map(pr => {
              const exercise = exercises.find(e => e.id === pr.exerciseId);
              const name = exercise?.name ?? pr.exerciseId;
              return (
                <li key={pr.exerciseId} className="py-3 flex justify-between items-center">
                  <span className="text-foreground font-medium">{name}</span>
                  <div className="text-right">
                    <span className="text-foreground font-bold">{pr.weightRaw}</span>
                    <p className="text-muted text-xs">{formatShortDate(pr.date, lang)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted text-sm">
            {t(
              'No records yet — log your weights!',
              'Sin records aun — registra tus pesos!'
            )}
          </p>
        )}
      </section>

      {/* Section 4: Stats Grid */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          {t('Stats', 'Estadísticas')}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-border rounded-lg p-4 bg-card text-center">
            <p className="text-2xl font-bold text-foreground">{totalWorkouts}</p>
            <p className="text-xs text-muted mt-1">{t('Total workouts', 'Entrenamientos')}</p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card text-center">
            <p className="text-2xl font-bold text-foreground">{thisMonth}</p>
            <p className="text-xs text-muted mt-1">{t('This month', 'Este mes')}</p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card text-center">
            <p className="text-lg font-bold text-foreground truncate">{favoriteType}</p>
            <p className="text-xs text-muted mt-1">{t('Favorite type', 'Tipo favorito')}</p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card text-center">
            <p className="text-2xl font-bold text-foreground">{completionRate}</p>
            <p className="text-xs text-muted mt-1">{t('Completion rate', 'Constancia')}</p>
          </div>
        </div>
      </section>

      {/* Section 5: Streak */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          {t('Streak', 'Racha')}
        </h2>
        <StreakWidget />
        <div className="flex justify-between text-sm text-muted">
          <span>{t('Longest:', 'Mejor:')} {streak.longest} {t('days', 'días')}</span>
          <span>{t('Freeze tokens:', 'Fichas:')} {freezeTokens}/2</span>
        </div>
      </section>

      {/* Section 6: Community */}
      {communityStatus === 'none' && (
        <CommunityBanner onJoin={() => setShowJoinModal(true)} />
      )}

      {communityStatus === 'anonymous' && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {t('Claim your spot', 'Reclama tu lugar')}
            </p>
            <p className="text-xs text-muted leading-relaxed">
              {t(
                'Add an email to unlock leaderboards and a public profile.',
                'Anade un email para desbloquear clasificaciones y un perfil publico.'
              )}
            </p>
          </div>
          <button
            onClick={() => setShowUsernameModal(true)}
            className="w-full px-4 py-2.5 bg-accent text-background font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer text-sm"
          >
            {t('Claim Spot', 'Reclamar Lugar')}
          </button>
        </div>
      )}

      {communityStatus === 'member' && (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">&#x1F30D;</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {t('Community member', 'Miembro de la comunidad')}
            </p>
            <p className="text-xs text-muted">
              {t('Public profile active', 'Perfil publico activo')}
            </p>
          </div>
          <span className="text-xs bg-accent/20 text-accent border border-accent/30 rounded-full px-2 py-0.5 font-medium">
            {t('Public', 'Publico')}
          </span>
        </div>
      )}

      <JoinCommunity
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={() => { setShowJoinModal(false); setCommunityStatus('anonymous'); }}
      />

      <UsernameSetup
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onSuccess={() => { setShowUsernameModal(false); setCommunityStatus('member'); }}
        showEmailField={true}
      />

    </main>
  );
}
