'use client';

import { useI18n } from '@/lib/i18n';

interface SectionLabelProps {
  type: 'warmup' | 'strength' | 'wod';
  count: number;
}

const CONFIG = {
  warmup: { en: 'WARM-UP', es: 'CALENTAMIENTO', color: 'text-emerald-400', border: 'border-emerald-500/30' },
  strength: { en: 'STRENGTH', es: 'FUERZA', color: 'text-red-400', border: 'border-red-500/30' },
  wod: { en: 'WOD', es: 'WOD', color: 'text-orange-400', border: 'border-orange-500/30' },
};

export default function SectionLabel({ type, count }: SectionLabelProps) {
  const { t } = useI18n();
  const c = CONFIG[type];

  return (
    <div className={`flex items-center gap-3 py-2`}>
      <div className={`h-px flex-1 ${c.border} border-t`} />
      <span className={`text-xs font-extrabold tracking-widest ${c.color}`}>
        {t(c.en, c.es)}
        {type !== 'wod' && (
          <span className="font-semibold opacity-60 ml-1.5">({count})</span>
        )}
      </span>
      <div className={`h-px flex-1 ${c.border} border-t`} />
    </div>
  );
}
