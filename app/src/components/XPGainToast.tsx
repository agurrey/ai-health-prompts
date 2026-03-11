'use client';

import { useEffect } from 'react';
import { m } from 'motion/react';
import { useI18n } from '@/lib/i18n';
import type { XPGain } from '@/lib/gamification';
import Icon from './Icon';

interface Props {
  gain: XPGain;
  onDismiss: () => void;
  autoDismissMs?: number; // default 3000
}

export default function XPGainToast({ gain, onDismiss, autoDismissMs = 3000 }: Props) {
  const { lang } = useI18n();

  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  return (
    <m.div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card-elevated backdrop-blur-sm border-2 border-xp/30 shadow-lg min-w-[200px] max-w-[280px] glow-xp"
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      role="status"
      aria-live="polite"
    >
      <span className="text-xp shrink-0"><Icon name="zap" size={24} /></span>
      <div className="flex-1 min-w-0">
        <p className="text-xp font-extrabold text-sm">+{gain.total} XP</p>
        <p className="text-muted text-xs truncate font-semibold">
          {lang === 'es' ? gain.breakdown_es : gain.breakdown}
        </p>
      </div>
    </m.div>
  );
}
