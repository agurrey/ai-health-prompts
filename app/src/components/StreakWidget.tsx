'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { getStreak, getFreezeTokens, isWorkoutDone } from '@/lib/storage';
import { getTodayString } from '@/lib/seed';

function getFireColor(streak: number): string {
  if (streak === 0) return '#a3a3a3';
  if (streak <= 2) return '#22c55e';
  if (streak <= 4) return '#eab308';
  if (streak <= 6) return '#f97316';
  return '#ef4444';
}

function getFireSize(streak: number): string {
  if (streak === 0) return 'text-lg';
  if (streak <= 2) return 'text-xl';
  if (streak <= 4) return 'text-2xl';
  if (streak <= 6) return 'text-3xl';
  return 'text-3xl';
}

export default function StreakWidget() {
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);
  const [longest, setLongest] = useState(0);
  const [freezeTokens, setFreezeTokens] = useState(0);
  const [freezeActive, setFreezeActive] = useState(false);
  const [atRisk, setAtRisk] = useState(false);

  useEffect(() => {
    const streak = getStreak();
    setCurrent(streak.current);
    setLongest(streak.longest);
    setFreezeActive(streak.freezeActive);
    setFreezeTokens(getFreezeTokens());

    // At-risk: after 18:00 if today not completed
    const now = new Date();
    const todayDone = isWorkoutDone(getTodayString());
    if (now.getHours() >= 18 && !todayDone && streak.current > 0) {
      setAtRisk(true);
    }
  }, []);

  const fireColor = getFireColor(current);
  const fireSize = getFireSize(current);

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
      {/* Fire icon */}
      <span
        className={`${fireSize} leading-none shrink-0`}
        style={{ color: fireColor, filter: current >= 7 ? 'drop-shadow(0 0 4px #ef444460)' : undefined }}
      >
        🔥
      </span>

      {/* Streak count + label */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-foreground font-bold text-lg leading-none">{current}</span>
          <span className="text-muted text-xs">{t('day streak', 'días seguidos')}</span>
        </div>
        {longest > current && (
          <p className="text-muted text-xs mt-0.5">
            {t('Best:', 'Mejor:')} {longest}
          </p>
        )}
      </div>

      {/* Freeze tokens (snowflake icons) */}
      {(freezeTokens > 0 || freezeActive) && (
        <div className="flex gap-0.5 shrink-0" title={t('Streak freeze tokens', 'Fichas de congelación')}>
          {[0, 1].map(i => (
            <span
              key={i}
              className={`text-sm ${i < freezeTokens ? 'text-blue-400' : 'text-zinc-700'}`}
            >
              ❄️
            </span>
          ))}
        </div>
      )}

      {/* At-risk warning */}
      {atRisk && !freezeActive && (
        <div className="shrink-0 text-yellow-400 text-xs font-medium flex items-center gap-1">
          <span>⚠️</span>
          <span className="hidden sm:inline">{t('At risk!', '¡En riesgo!')}</span>
        </div>
      )}

      {/* Freeze active indicator */}
      {freezeActive && (
        <div className="shrink-0 text-blue-400 text-xs font-medium">
          {t('Frozen', 'Congelado')} ❄️
        </div>
      )}
    </div>
  );
}
