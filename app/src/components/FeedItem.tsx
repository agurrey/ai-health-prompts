'use client';

import { useI18n } from '@/lib/i18n';
import type { FeedItem as FeedItemType } from '@/lib/types/community';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { exercises } from '@/data/exercises';
import Icon from './Icon';

interface FeedItemProps {
  item: FeedItemType;
  onKudos: (feedItemId: string) => void;
  lang: string;
}

function relativeTime(createdAt: string, lang: string): string {
  const now = Date.now();
  const then = new Date(createdAt).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 2) return lang === 'es' ? 'ahora mismo' : 'just now';
  if (diffMin < 60) return lang === 'es' ? `hace ${diffMin}m` : `${diffMin}m ago`;
  if (diffHours < 24) return lang === 'es' ? `hace ${diffHours}h` : `${diffHours}h ago`;
  if (diffDays === 1) return lang === 'es' ? 'ayer' : 'yesterday';
  return lang === 'es' ? `hace ${diffDays}d` : `${diffDays}d ago`;
}

function EventText({ item, lang }: { item: FeedItemType; lang: string }) {
  const username = item.username ?? 'Someone';

  switch (item.event_type) {
    case 'workout': {
      const sessionType = item.event_data.session_type as string | undefined;
      if (sessionType) {
        return lang === 'es' ? (
          <span><span className="font-bold text-accent">{username}</span> <span className="text-muted font-semibold">completo un entrenamiento de {sessionType}</span></span>
        ) : (
          <span><span className="font-bold text-accent">{username}</span> <span className="text-muted font-semibold">completed a {sessionType} workout</span></span>
        );
      }
      return lang === 'es' ? (
        <span><span className="font-bold text-accent">{username}</span> <span className="text-muted font-semibold">completo un entrenamiento</span></span>
      ) : (
        <span><span className="font-bold text-accent">{username}</span> <span className="text-muted font-semibold">completed a workout</span></span>
      );
    }
    case 'achievement': {
      const achievementId = item.event_data.achievement_id as string | undefined;
      const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
      const achievementName = achievement
        ? (lang === 'es' ? achievement.name_es : achievement.name)
        : (achievementId ?? 'an achievement');
      return lang === 'es' ? (
        <span>
          <span className="font-bold text-accent">{username}</span>{' '}
          <span className="text-muted font-semibold">desbloqueo</span>{' '}
          {achievement && <Icon name={achievement.icon} size={14} className="inline-flex text-accent align-text-bottom" />}{' '}
          <span className="text-muted font-semibold">{achievementName}</span>
        </span>
      ) : (
        <span>
          <span className="font-bold text-accent">{username}</span>{' '}
          <span className="text-muted font-semibold">unlocked</span>{' '}
          {achievement && <Icon name={achievement.icon} size={14} className="inline-flex text-accent align-text-bottom" />}{' '}
          <span className="text-muted font-semibold">{achievementName}</span>
        </span>
      );
    }
    case 'pr': {
      const exerciseId = item.event_data.exercise_id as string | undefined;
      const exercise = exerciseId ? exercises.find(e => e.id === exerciseId) : undefined;
      const exerciseName = exercise?.name ?? (item.event_data.exercise_name as string | undefined);
      return lang === 'es' ? (
        <span><span className="font-bold text-accent">{username}</span> <span className="text-muted font-semibold">establecio un nuevo record personal{exerciseName ? ` en ${exerciseName}` : ''}!</span></span>
      ) : (
        <span><span className="font-bold text-accent">{username}</span> <span className="text-muted font-semibold">set a new personal record{exerciseName ? ` in ${exerciseName}` : ''}!</span></span>
      );
    }
    case 'streak': {
      const streakDays = item.event_data.streak_days as number | undefined;
      return lang === 'es' ? (
        <span><span className="font-bold text-accent">{username}</span> <span className="text-muted font-semibold">alcanzo una racha de {streakDays ?? '?'} dias!</span></span>
      ) : (
        <span><span className="font-bold text-accent">{username}</span> <span className="text-muted font-semibold">reached a {streakDays ?? '?'}-day streak!</span></span>
      );
    }
    default:
      return <span className="text-muted font-semibold">{username}</span>;
  }
}

export default function FeedItem({ item, onKudos, lang }: FeedItemProps) {
  const { t } = useI18n();
  const kudosCount = item.kudos_count ?? 0;
  const hasKudosed = item.user_has_kudosed ?? false;

  function handleKudos() {
    if (!hasKudosed) {
      onKudos(item.id);
    }
  }

  // Semantic color for event icon
  const eventIconMap: Record<string, { icon: string; color: string }> = {
    workout: { icon: 'dumbbell', color: 'text-success' },
    pr: { icon: 'trophy', color: 'text-xp' },
    streak: { icon: 'flame', color: 'text-streak' },
    achievement: { icon: 'award', color: 'text-accent' },
  };
  const eventIcon = eventIconMap[item.event_type];

  return (
    <div className="bg-card rounded-2xl p-4 border-2 border-border space-y-3 card-interactive">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {eventIcon && (
            <span className={`${eventIcon.color} shrink-0 mt-0.5`}>
              <Icon name={eventIcon.icon} size={16} />
            </span>
          )}
          <p className="text-sm leading-relaxed flex-1">
            <EventText item={item} lang={lang} />
          </p>
        </div>
        <span className="text-xs text-muted whitespace-nowrap shrink-0 font-semibold">
          {relativeTime(item.created_at, lang)}
        </span>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleKudos}
          disabled={hasKudosed}
          title={hasKudosed ? t('Already kudosed', 'Ya diste kudos') : t('Give kudos', 'Dar kudos')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            hasKudosed
              ? 'bg-accent/20 text-accent border-2 border-accent/30 cursor-default'
              : 'border-2 border-border text-muted hover:border-accent hover:text-accent hover:bg-accent/10'
          }`}
        >
          <Icon name="fist-bump" size={14} />
          <span>{kudosCount}</span>
        </button>
      </div>
    </div>
  );
}
