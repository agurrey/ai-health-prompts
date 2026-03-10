'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { getCommunityStatus } from '@/lib/auth';

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
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {t('Join the Hormesis community', 'Unete a la comunidad Hormesis')}
        </p>
        <p className="text-xs text-muted leading-relaxed">
          {t(
            'Sync your data, compete on leaderboards, and give kudos to others.',
            'Sincroniza tus datos, compite en clasificaciones y da kudos a otros.'
          )}
        </p>
      </div>
      <button
        onClick={onJoin}
        className="w-full px-4 py-2.5 bg-accent text-background font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer text-sm"
      >
        {t('Join Community', 'Unirme a la Comunidad')}
      </button>
    </div>
  );
}
