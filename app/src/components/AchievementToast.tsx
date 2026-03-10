'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import type { Achievement } from '@/lib/achievements';
import type { PersonalRecord } from '@/lib/storage';

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
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 250);
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  const containerClass = `flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[220px] max-w-[300px] border ${exiting ? 'toast-exit' : 'toast-enter'}`;

  if (item.type === 'achievement') {
    const { achievement } = item;
    return (
      <div
        className={`${containerClass} bg-card border-fuchsia-500/30`}
        role="status"
        aria-live="polite"
      >
        <span className="text-2xl shrink-0">{achievement.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-fuchsia-400 font-bold uppercase tracking-wider">
            {t('Achievement Unlocked!', '¡Logro Desbloqueado!')}
          </p>
          <p className="text-foreground font-semibold text-sm">
            {lang === 'es' ? achievement.name_es : achievement.name}
          </p>
          <p className="text-muted text-xs mt-0.5 line-clamp-2">
            {lang === 'es' ? achievement.description_es : achievement.description}
          </p>
        </div>
      </div>
    );
  }

  // PR toast
  const { pr, exerciseName } = item;
  const improvementText = pr.improvementKg
    ? t(`+${pr.improvementKg}kg PR`, `+${pr.improvementKg}kg PR`)
    : t('New PR!', '¡Nuevo PR!');

  return (
    <div
      className={`${containerClass} bg-card border-yellow-500/30`}
      role="status"
      aria-live="polite"
    >
      <span className="text-2xl shrink-0">🏆</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-yellow-400 font-bold uppercase tracking-wider">
          {t('Personal Record!', '¡Récord Personal!')}
        </p>
        <p className="text-foreground font-semibold text-sm truncate">{exerciseName}</p>
        <p className="text-yellow-400/80 text-xs">
          {pr.weightRaw} — {improvementText}
        </p>
      </div>
    </div>
  );
}
