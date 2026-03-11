'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { getStreak, isWorkoutDone } from '@/lib/storage';
import { getTodayString } from '@/lib/seed';
import Icon from './Icon';

function getFireColor(streak: number): string {
  if (streak === 0) return '#a3a3a3';
  if (streak <= 2) return '#22c55e';
  if (streak <= 4) return '#eab308';
  if (streak <= 6) return '#f97316';
  return '#ef4444';
}

function getFireSize(streak: number): number {
  if (streak === 0) return 18;
  if (streak <= 2) return 20;
  if (streak <= 4) return 24;
  return 28;
}

export default function StreakWidget() {
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);
  const [longest, setLongest] = useState(0);
  const [atRisk, setAtRisk] = useState(false);

  useEffect(() => {
    const streak = getStreak();
    setCurrent(streak.current);
    setLongest(streak.longest);

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
      <span
        className="leading-none shrink-0 transition-colors duration-500"
        style={{ color: fireColor, filter: current >= 7 ? 'drop-shadow(0 0 4px #ef444460)' : undefined }}
      >
        <Icon name="flame" size={fireSize} />
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-streak font-extrabold text-3xl leading-none">{current}</span>
          <span className="text-muted text-xs font-semibold">{t('day streak', 'dias seguidos')}</span>
        </div>
        {longest > current && (
          <p className="text-muted text-xs mt-0.5 font-semibold">
            {t('Best:', 'Mejor:')} {longest}
          </p>
        )}
      </div>

      {atRisk && (
        <div className="shrink-0 text-danger text-xs font-semibold flex items-center gap-1">
          <Icon name="alert-triangle" size={14} />
          <span className="hidden sm:inline">{t('At risk!', 'En riesgo!')}</span>
        </div>
      )}
    </div>
  );
}
