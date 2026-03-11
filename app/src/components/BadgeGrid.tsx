'use client';

import { ACHIEVEMENTS, Achievement } from '@/lib/achievements';
import { AchievementUnlock } from '@/lib/storage';
import { useI18n } from '@/lib/i18n';
import { m } from 'motion/react';
import Icon from './Icon';

interface BadgeGridProps {
  unlockedAchievements: AchievementUnlock[];
}

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

export default function BadgeGrid({ unlockedAchievements }: BadgeGridProps) {
  const { lang } = useI18n();

  const unlockedMap = new Map<string, AchievementUnlock>(
    unlockedAchievements.map(u => [u.id, u])
  );

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      {ACHIEVEMENTS.map((achievement: Achievement, index: number) => {
        const unlock = unlockedMap.get(achievement.id);
        const isUnlocked = unlock !== undefined;

        return (
          <m.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.04, type: 'spring', stiffness: 400, damping: 20 }}
            className={`bg-card border-2 rounded-2xl p-3 text-center flex flex-col items-center gap-1 card-interactive ${
              isUnlocked ? 'border-accent/40 glow-xp' : 'border-border opacity-40'
            }`}
          >
            <span
              className={`leading-none ${isUnlocked ? 'text-accent animate-pop' : 'text-muted'}`}
            >
              <Icon name={achievement.icon} size={24} />
            </span>

            <span
              className={`text-xs font-semibold leading-tight ${
                isUnlocked ? 'text-foreground' : 'text-muted'
              }`}
            >
              {lang === 'es' ? achievement.name_es : achievement.name}
            </span>

            {isUnlocked ? (
              <span className="text-xs text-accent font-semibold leading-tight">
                {formatShortDate(unlock.unlockedAt, lang)}
              </span>
            ) : (
              <span className="text-xs text-muted leading-tight">
                {lang === 'es' ? achievement.description_es : achievement.description}
              </span>
            )}
          </m.div>
        );
      })}
    </div>
  );
}
