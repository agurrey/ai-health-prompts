'use client';

import { m } from 'motion/react';
import { useI18n } from '@/lib/i18n';
import Icon from './Icon';

export default function FinalCelebration() {
  const { t } = useI18n();

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="space-y-4"
    >
      <div className="flex flex-col items-center gap-3 px-4 py-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <m.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
        >
          <Icon name="check" size={48} className="text-emerald-400" />
        </m.div>
        <p className="text-emerald-400 text-lg font-bold">
          {t('Workout Complete!', 'Entrenamiento Completo!')}
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3">
        <svg className="w-5 h-5 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <p className="text-blue-400 text-sm font-semibold">
          {t('Walk 7,000-10,000 steps today. Non-negotiable.', 'Camina 7.000-10.000 pasos hoy. No negociable.')}
        </p>
      </div>
    </m.div>
  );
}
