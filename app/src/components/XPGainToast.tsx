'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import type { XPGain } from '@/lib/gamification';

interface Props {
  gain: XPGain;
  onDismiss: () => void;
  autoDismissMs?: number; // default 3000
}

export default function XPGainToast({ gain, onDismiss, autoDismissMs = 3000 }: Props) {
  const { lang } = useI18n();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 250); // wait for exit animation
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-accent/30 shadow-lg min-w-[200px] max-w-[280px] ${exiting ? 'toast-exit' : 'toast-enter'}`}
      role="status"
      aria-live="polite"
    >
      <span className="text-2xl">⚡</span>
      <div className="flex-1 min-w-0">
        <p className="text-accent font-bold text-sm">+{gain.total} XP</p>
        <p className="text-muted text-xs truncate">
          {lang === 'es' ? gain.breakdown_es : gain.breakdown}
        </p>
      </div>
    </div>
  );
}
