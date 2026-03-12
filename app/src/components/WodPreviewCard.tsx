'use client';

import { m } from 'motion/react';
import { useI18n } from '@/lib/i18n';
import Icon from './Icon';
import VideoPlayer from './VideoPlayer';

interface WodMovement {
  name: string;
  reps: string;
  load: string;
  demoSearch: string;
}

interface WodPreviewCardProps {
  movement: WodMovement;
  movementIndex: number;
  totalMovements: number;
  onNext: () => void;
  onSkipAll: () => void;
}

export default function WodPreviewCard({
  movement,
  movementIndex,
  totalMovements,
  onNext,
  onSkipAll,
}: WodPreviewCardProps) {
  const { t } = useI18n();

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-orange-500/40 bg-card overflow-hidden"
      style={{ boxShadow: '0 0 0 1px rgba(249, 115, 22, 0.4), 0 4px 20px rgba(249, 115, 22, 0.15)' }}
    >
      {/* Header */}
      <div className="p-3 border-b border-orange-500/20">
        <p className="text-orange-400 text-xs font-bold uppercase tracking-wider">
          {t('Preview the movement', 'Visualiza el ejercicio')}
        </p>
        <p className="text-muted text-xs mt-0.5">
          {movementIndex + 1} {t('of', 'de')} {totalMovements}
        </p>
      </div>

      {/* Video */}
      <VideoPlayer demoSearch={movement.demoSearch} name={movement.name} />

      {/* Movement info */}
      <div className="p-3 space-y-3">
        <div>
          <h4 className="font-bold text-foreground text-sm">{movement.name}</h4>
          <p className="text-orange-400 text-xs font-semibold">
            {movement.reps} {movement.load !== 'BW' ? `@ ${movement.load}` : ''}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onNext}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-bold hover:bg-orange-500/30 transition-colors cursor-pointer"
          >
            <Icon name="check" size={14} />
            {movementIndex < totalMovements - 1 ? t('Next', 'Siguiente') : t('Start', 'Iniciar')}
          </button>
          <button
            onClick={onSkipAll}
            className="px-3 py-2.5 rounded-lg bg-card-elevated text-muted text-xs font-semibold hover:text-foreground transition-colors cursor-pointer"
          >
            {t('Skip to conditioning', 'Ir al acondicionamiento')}
          </button>
        </div>
      </div>
    </m.div>
  );
}
