'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { getStreak, isWorkoutDone, getCompletedDates } from '@/lib/storage';
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
  if (streak === 0) return 16;
  if (streak <= 2) return 18;
  if (streak <= 4) return 20;
  return 22;
}

export default function StreakWidget() {
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [atRisk, setAtRisk] = useState(false);

  useEffect(() => {
    const streak = getStreak();
    setCurrent(streak.current);
    setTotal(getCompletedDates().length);

    const now = new Date();
    const todayDone = isWorkoutDone(getTodayString());
    if (now.getHours() >= 18 && !todayDone && streak.current > 0) {
      setAtRisk(true);
    }
  }, []);

  const fireColor = getFireColor(current);
  const fireSize = getFireSize(current);

  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs">
        <span
          className="leading-none shrink-0 transition-colors duration-500"
          style={{ color: fireColor, filter: current >= 7 ? 'drop-shadow(0 0 4px #ef444460)' : undefined }}
        >
          <Icon name="flame" size={fireSize} />
        </span>
        <span className="text-streak font-extrabold text-lg leading-none">{current}</span>
        <span className="text-muted font-semibold">{t('day streak', 'dias seguidos')}</span>
        {total > 0 && (
          <>
            <span className="text-border">|</span>
            <span className="text-muted font-semibold">{total} {t('total', 'total')}</span>
          </>
        )}
        {atRisk && (
          <span className="text-danger font-semibold flex items-center gap-0.5">
            <Icon name="alert-triangle" size={12} />
          </span>
        )}
      </div>
    </div>
  );
}
