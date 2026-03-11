'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { joinCommunity } from '@/lib/auth';

interface JoinCommunityProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function JoinCommunity({ isOpen, onClose, onSuccess }: JoinCommunityProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleJoin() {
    setLoading(true);
    setError(null);
    try {
      await joinCommunity();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Something went wrong', 'Algo salio mal'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card-elevated border-2 border-border rounded-2xl w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-foreground">
            {t('Join the Community', 'Unete a la Comunidad')}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors cursor-pointer p-1 -mt-1 -mr-1"
            aria-label={t('Close', 'Cerrar')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <p className="text-sm text-muted leading-relaxed font-semibold">
          {t(
            'Join anonymously — no email needed. Your workout data stays on your device. You can add an email later to claim a username and unlock leaderboards.',
            'Unete de forma anonima, sin necesidad de email. Tus datos permanecen en tu dispositivo. Puedes anadir un email despues para reclamar un nombre de usuario y acceder a las clasificaciones.'
          )}
        </p>

        {/* Error */}
        {error && (
          <p className="text-xs text-danger bg-danger/10 border-2 border-danger/20 rounded-xl px-3 py-2 font-semibold">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleJoin}
            disabled={loading}
            className="btn-playful w-full text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                {t('Joining...', 'Uniendose...')}
              </>
            ) : (
              t('Join Now', 'Unirse Ahora')
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm text-muted hover:text-foreground transition-colors cursor-pointer font-semibold"
          >
            {t('Cancel', 'Cancelar')}
          </button>
        </div>
      </div>
    </div>
  );
}
