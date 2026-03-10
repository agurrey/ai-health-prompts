'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { getXP } from '@/lib/storage';
import { xpForLevel } from '@/lib/gamification';

export default function XPBar() {
  const { t } = useI18n();
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(0);

  useEffect(() => {
    const { xp: storedXP, xpLevel } = getXP();
    setXp(storedXP);
    setLevel(xpLevel);
  }, []);

  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const progressXP = xp - currentLevelXP;
  const rangeXP = nextLevelXP - currentLevelXP;
  const pct = rangeXP > 0 ? Math.min(100, Math.round((progressXP / rangeXP) * 100)) : 100;

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-card border border-border">
      {/* Level badge */}
      <div className="shrink-0 w-9 h-9 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center">
        <span className="text-fuchsia-400 font-bold text-sm">{level}</span>
      </div>

      {/* Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-fuchsia-400 font-medium">
            {t('Level', 'Nivel')} {level}
          </span>
          <span className="text-xs text-muted">
            {progressXP} / {rangeXP} XP
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-fuchsia-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
