'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { getCommunityStatus } from '@/lib/auth';
import CatMascot from '@/components/CatMascot';

interface CommunityBannerProps {
  onJoin: () => void;
}

export default function CommunityBanner({ onJoin }: CommunityBannerProps) {
  const { t } = useI18n();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    getCommunityStatus().then(status => {
      setHidden(status !== 'none');
    });
  }, []);

  if (hidden) return null;

  return (
    <div className="bg-card border-2 border-accent/20 rounded-2xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="space-y-1 flex-1">
          <p className="text-sm font-bold text-foreground">
            {t('Join the Hormesis community', 'Unete a la comunidad Hormesis')}
          </p>
          <p className="text-xs text-muted leading-relaxed font-semibold">
            {t(
              'Sync your data, compete on leaderboards, and give kudos to others.',
              'Sincroniza tus datos, compite en clasificaciones y da kudos a otros.'
            )}
          </p>
        </div>
        <div className="shrink-0">
          <CatMascot pose="highfive" size={80} />
        </div>
      </div>
      <button
        onClick={onJoin}
        className="btn-playful w-full text-sm"
      >
        {t('Join Community', 'Unirme a la Comunidad')}
      </button>
    </div>
  );
}
