'use client';

import { useEffect } from 'react';
import { m } from 'motion/react';
import { useI18n } from '@/lib/i18n';
import type { Achievement } from '@/lib/achievements';
import type { PersonalRecord } from '@/lib/storage';
import Icon from './Icon';

export type ToastItem =
  | { type: 'achievement'; achievement: Achievement }
  | { type: 'pr'; pr: PersonalRecord; exerciseName: string };

interface Props {
  item: ToastItem;
  onDismiss: () => void;
  autoDismissMs?: number; // default 4000
}

export default function AchievementToast({ item, onDismiss, autoDismissMs = 4000 }: Props) {
  const { t, lang } = useI18n();

  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  if (item.type === 'achievement') {
    const { achievement } = item;
    return (
      <m.div
        className="flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg min-w-[220px] max-w-[300px] border-2 bg-card-elevated backdrop-blur-sm border-accent/30 glow-accent"
        initial={{ opacity: 0, x: 80, scale: 0.85 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 80, scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 350, damping: 22 }}
        role="status"
        aria-live="polite"
      >
        <span className="text-accent shrink-0"><Icon name={achievement.icon} size={24} /></span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-accent font-bold uppercase tracking-wider">
            {t('Achievement Unlocked!', 'Logro Desbloqueado!')}
          </p>
          <p className="font-bold text-accent text-sm">
            {lang === 'es' ? achievement.name_es : achievement.name}
          </p>
          <p className="text-muted text-xs mt-0.5 line-clamp-2 font-semibold">
            {lang === 'es' ? achievement.description_es : achievement.description}
          </p>
        </div>
      </m.div>
    );
  }

  // PR toast
  const { pr, exerciseName } = item;
  const improvementText = pr.improvementKg
    ? t(`+${pr.improvementKg}kg PR`, `+${pr.improvementKg}kg PR`)
    : t('New PR!', 'Nuevo PR!');

  return (
    <m.div
      className="flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg min-w-[220px] max-w-[300px] border-2 bg-card-elevated backdrop-blur-sm border-xp/30 glow-xp"
      initial={{ opacity: 0, x: 80, scale: 0.85 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
      role="status"
      aria-live="polite"
    >
      <span className="text-xp shrink-0"><Icon name="trophy" size={24} /></span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-xp font-bold uppercase tracking-wider">
          {t('Personal Record!', 'Record Personal!')}
        </p>
        <p className="text-foreground font-bold text-sm truncate">{exerciseName}</p>
        <p className="text-xp/80 text-xs font-semibold">
          {pr.weightRaw} -- {improvementText}
        </p>
      </div>
    </m.div>
  );
}
