'use client';

import { useEffect, useState } from 'react';
import { m } from 'motion/react';
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
    <m.div
      className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-card border-2 border-border"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      {/* Level badge */}
      <div className="shrink-0 w-10 h-10 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center glow-accent">
        <span className="text-accent font-extrabold text-base">{level}</span>
      </div>

      {/* Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-accent font-semibold">
            {t('Level', 'Nivel')} {level}
          </span>
          <span className="text-xs text-muted font-semibold">
            <span className="text-sm font-extrabold text-xp">{progressXP}</span> / {rangeXP} XP
          </span>
        </div>
        <div className="h-3 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full gradient-xp transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </m.div>
  );
}
