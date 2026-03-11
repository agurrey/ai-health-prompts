'use client';

import { m } from 'motion/react';
import { useI18n } from '@/lib/i18n';
import Icon from './Icon';

interface BlockCelebrationProps {
  block: 'warmup' | 'strength';
}

const MESSAGES = {
  warmup: {
    en: 'Warm-up done! On to Strength.',
    es: 'Calentamiento hecho! Vamos con Fuerza.',
  },
  strength: {
    en: 'Strength done! Time for the WOD.',
    es: 'Fuerza hecha! Hora del WOD.',
  },
};

export default function BlockCelebration({ block }: BlockCelebrationProps) {
  const { t } = useI18n();
  const msg = MESSAGES[block];

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
    >
      <Icon name="check" size={18} className="text-emerald-400" />
      <p className="text-emerald-400 text-sm font-bold">{t(msg.en, msg.es)}</p>
    </m.div>
  );
}
