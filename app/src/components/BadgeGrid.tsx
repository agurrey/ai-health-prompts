'use client';

import { ACHIEVEMENTS, Achievement } from '@/lib/achievements';
import { AchievementUnlock } from '@/lib/storage';
import { useI18n } from '@/lib/i18n';

interface BadgeGridProps {
  unlockedAchievements: AchievementUnlock[];
}

function formatShortDate(dateStr: string, lang: string): string {
  // dateStr is 'YYYY-MM-DD'
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
      {ACHIEVEMENTS.map((achievement: Achievement) => {
        const unlock = unlockedMap.get(achievement.id);
        const isUnlocked = unlock !== undefined;

        return (
          <div
            key={achievement.id}
            className={`bg-card border rounded-lg p-3 text-center flex flex-col items-center gap-1 ${
              isUnlocked ? 'border-fuchsia-500/40' : 'border-border'
            }`}
          >
            <span
              className={`text-2xl leading-none ${isUnlocked ? '' : 'opacity-30 grayscale'}`}
            >
              {achievement.icon}
            </span>

            <span
              className={`text-xs font-medium leading-tight ${
                isUnlocked ? 'text-foreground' : 'text-muted'
              }`}
            >
              {lang === 'es' ? achievement.name_es : achievement.name}
            </span>

            {isUnlocked ? (
              <span className="text-xs text-fuchsia-400 leading-tight">
                {formatShortDate(unlock.unlockedAt, lang)}
              </span>
            ) : (
              <span className="text-xs text-muted leading-tight">
                {lang === 'es' ? achievement.description_es : achievement.description}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
