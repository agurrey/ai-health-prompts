'use client';

import { useI18n } from '@/lib/i18n';
import type { League } from '@/lib/types/community';

interface LeagueSelectorProps {
  selected: League;
  userLeague: League;
  onChange: (league: League) => void;
}

const LEAGUES: {
  id: League;
  en: string;
  es: string;
  range: string;
  color: string;
  borderColor: string;
}[] = [
  { id: 'bronze',   en: 'Bronze',   es: 'Bronce',  range: 'Lv 1-3',  color: 'text-amber-600',  borderColor: 'border-amber-600' },
  { id: 'silver',   en: 'Silver',   es: 'Plata',   range: 'Lv 4-6',  color: 'text-gray-400',   borderColor: 'border-gray-400' },
  { id: 'gold',     en: 'Gold',     es: 'Oro',     range: 'Lv 7-10', color: 'text-yellow-500', borderColor: 'border-yellow-500' },
  { id: 'platinum', en: 'Platinum', es: 'Platino', range: 'Lv 11+',  color: 'text-purple-500', borderColor: 'border-purple-500' },
];

export default function LeagueSelector({ selected, userLeague, onChange }: LeagueSelectorProps) {
  const { t, lang } = useI18n();

  return (
    <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label={t('League', 'Liga')}>
      {LEAGUES.map((league) => {
        const isSelected = selected === league.id;
        const isUserLeague = userLeague === league.id;
        const label = lang === 'es' ? league.es : league.en;

        return (
          <button
            key={league.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(league.id)}
            className={[
              'flex flex-col items-center px-3 py-2 border-b-2 transition-all whitespace-nowrap',
              isSelected
                ? `${league.borderColor} ${league.color} font-bold`
                : 'border-transparent text-muted hover:text-foreground',
            ].join(' ')}
          >
            <span className="text-sm leading-tight">
              {label}
              {isUserLeague && (
                <span className="ml-1 text-xs" aria-label={t('your league', 'tu liga')}>
                  {t('(you)', '(tu)')}
                </span>
              )}
            </span>
            <span className={`text-xs mt-0.5 ${isSelected ? league.color : 'text-muted'}`}>
              {league.range}
            </span>
          </button>
        );
      })}
    </div>
  );
}
