'use client';

import { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { useI18n } from '@/lib/i18n';
import type { TimerConfig } from '@/lib/timer-engine';
import { useExerciseTimer } from '@/hooks/useExerciseTimer';
import Icon from './Icon';
import TimerDisplay from './TimerDisplay';
import VideoPlayer from './VideoPlayer';

interface WodMovement {
  name: string;
  reps: string;
  load: string;
  demoSearch: string;
}

const FORMAT_EXPLANATIONS: Record<string, { en: string; es: string }> = {
  amrap: {
    en: 'AMRAP = As Many Rounds As Possible. Complete the circuit as many times as you can within the time cap. Your score is the total rounds + extra reps.',
    es: 'AMRAP = Tantas Rondas Como Puedas. Completa el circuito tantas veces como puedas dentro del tiempo. Tu puntuación son las rondas totales + reps extra.',
  },
  emom: {
    en: 'EMOM = Every Minute On the Minute. At the start of each minute, perform the prescribed reps. Rest whatever time remains until the next minute starts.',
    es: 'EMOM = Cada Minuto Al Minuto. Al inicio de cada minuto, haz las reps prescritas. Descansa el tiempo que quede hasta que empiece el siguiente minuto.',
  },
  e2mom: {
    en: 'E2MOM = Every 2 Minutes On the Minute. At the start of every 2-minute block, perform the prescribed reps. Rest the remaining time.',
    es: 'E2MOM = Cada 2 Minutos Al Minuto. Al inicio de cada bloque de 2 minutos, haz las reps prescritas. Descansa el tiempo restante.',
  },
  e3mom: {
    en: 'E3MOM = Every 3 Minutes On the Minute. At the start of every 3-minute block, perform the prescribed reps. Rest the remaining time.',
    es: 'E3MOM = Cada 3 Minutos Al Minuto. Al inicio de cada bloque de 3 minutos, haz las reps prescritas. Descansa el tiempo restante.',
  },
  tabata: {
    en: 'Tabata = 20 seconds of all-out work, 10 seconds of rest, repeated for 8 rounds (4 minutes total). Simple but brutal.',
    es: 'Tabata = 20 segundos de trabajo máximo, 10 segundos de descanso, repetido durante 8 rondas (4 minutos total). Simple pero brutal.',
  },
  rounds_for_time: {
    en: 'For Time = Complete the prescribed rounds as fast as possible within the time cap. Your score is your finish time.',
    es: 'Por Tiempo = Completa las rondas prescritas lo más rápido posible dentro del tiempo límite. Tu puntuación es tu tiempo.',
  },
  chipper: {
    en: 'Chipper = Work through a long list of movements in order, one at a time. Chip away at each before moving on. Pace yourself.',
    es: 'Chipper = Trabaja una lista larga de movimientos en orden, uno a la vez. Ve completando cada uno antes de pasar al siguiente. Dosifícate.',
  },
  couplet: {
    en: 'Couplet = Two movements alternated for rounds. Simple format, high intensity. Push the pace.',
    es: 'Couplet = Dos movimientos alternados por rondas. Formato simple, alta intensidad. Empuja el ritmo.',
  },
  triplet: {
    en: 'Triplet = Three movements cycled for rounds. Classic CrossFit format. Find a sustainable rhythm.',
    es: 'Triplet = Tres movimientos en ciclo por rondas. Formato clásico de CrossFit. Encuentra un ritmo sostenible.',
  },
  interval: {
    en: 'Interval = Work periods followed by rest periods. Go hard during work, recover during rest. Repeat.',
    es: 'Intervalo = Periodos de trabajo seguidos de descanso. Ve fuerte en el trabajo, recupera en el descanso. Repite.',
  },
  ladder: {
    en: 'Ladder = Reps increase (or decrease) each round. Start easy, build up. Manage your effort as reps climb.',
    es: 'Escalera = Las reps aumentan (o disminuyen) cada ronda. Empieza fácil, sube. Gestiona tu esfuerzo a medida que suben las reps.',
  },
  pyramid: {
    en: 'Pyramid = Reps go up then back down. Build to the peak, then survive the way back. Pace the ascent.',
    es: 'Pirámide = Las reps suben y luego bajan. Construye hasta el pico, luego sobrevive la bajada. Dosifica la subida.',
  },
  buy_in_out: {
    en: 'Buy-In/Buy-Out = Complete a set task before and after the main workout. The buy-in earns entry, the buy-out finishes it.',
    es: 'Buy-In/Buy-Out = Completa una tarea antes y después del bloque principal. El buy-in te da entrada, el buy-out lo cierra.',
  },
  death_by: {
    en: 'Death By = Start with 1 rep in minute 1, add 1 rep each minute. Continue until you can\'t complete the reps within the minute.',
    es: 'Death By = Empieza con 1 rep en el minuto 1, añade 1 rep cada minuto. Continúa hasta que no puedas completar las reps dentro del minuto.',
  },
  single_movement: {
    en: 'Single Movement = One exercise, maximum effort. Simple, focused, intense. Nothing to hide behind.',
    es: 'Movimiento Único = Un ejercicio, esfuerzo máximo. Simple, enfocado, intenso. Sin donde esconderse.',
  },
  double_wod: {
    en: 'Double Session = Two short workouts back to back. Different stimulus each. Recover briefly between them.',
    es: 'Doble Sesión = Dos entrenamientos cortos seguidos. Estímulo diferente en cada uno. Recupera brevemente entre ellos.',
  },
  fgb: {
    en: 'Fight Gone Bad = 1 minute at each station, rotate. 1 minute rest between rounds. Score = total reps across all stations.',
    es: 'Fight Gone Bad = 1 minuto en cada estación, rota. 1 minuto de descanso entre rondas. Puntuación = reps totales en todas las estaciones.',
  },
};

interface WodCardProps {
  formatName: string;
  formatDescription: string;
  formatType: string;
  timecap: string;
  intensity: string;
  volume: string;
  movements: WodMovement[];
  note: string;
  scalingNote?: string;
  onComplete: () => void;
  onSkip: () => void;
  timerConfig?: TimerConfig | null;
  readOnly?: boolean;
}

export default function WodCard({
  formatName,
  formatDescription,
  formatType,
  timecap,
  intensity,
  volume,
  movements,
  note,
  scalingNote,
  onComplete,
  onSkip,
  timerConfig,
  readOnly = false,
}: WodCardProps) {
  const { t, lang } = useI18n();
  const [showTimer, setShowTimer] = useState(false);
  const { snapshot, start, pause, reset } = useExerciseTimer(timerConfig || null);

  const handlePlay = () => {
    setShowTimer(true);
    start();
  };

  const explanation = FORMAT_EXPLANATIONS[formatType];

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-orange-500/40 bg-card overflow-hidden"
      style={{ boxShadow: '0 0 0 1px rgba(249, 115, 22, 0.4), 0 4px 20px rgba(249, 115, 22, 0.15)' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-orange-500/20">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-extrabold text-orange-400 text-sm uppercase tracking-wider">{formatName}</h4>
          <span className="text-orange-400 text-xs font-bold">Cap: {timecap}</span>
        </div>
        <p className="text-orange-400/60 text-xs mt-1">{formatDescription}</p>
        <div className="flex gap-2 mt-2">
          <span className="text-xs px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/20">
            {intensity}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-orange-500/10 text-orange-400/80 border border-orange-500/15">
            {volume}
          </span>
        </div>
      </div>

      {/* Format explanation */}
      {explanation && (
        <div className="mx-4 mt-4 px-3 py-2.5 rounded-lg bg-orange-500/5 border border-orange-500/15">
          <div className="flex gap-2">
            <Icon name="info" size={14} className="text-orange-400/60 shrink-0 mt-0.5" />
            <p className="text-orange-400/80 text-xs leading-relaxed">
              {lang === 'es' ? explanation.es : explanation.en}
            </p>
          </div>
        </div>
      )}

      {/* Watch first callout */}
      <div className="mx-4 mt-4 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/15">
        <div className="flex gap-2">
          <Icon name="play" size={14} className="text-blue-400/60 shrink-0 mt-0.5" />
          <p className="text-blue-400/80 text-xs leading-relaxed">
            {t(
              'Watch all the videos first, then execute the plan.',
              'Mira todos los videos primero, luego ejecuta el plan.'
            )}
          </p>
        </div>
      </div>

      {/* Movements list — expandable */}
      <div className="p-4 space-y-1">
        {movements.map((mv, i) => (
          <WodMovementRow key={i} movement={mv} />
        ))}

        {note && (
          <p className="text-muted text-xs italic mt-3">{note}</p>
        )}

        {scalingNote && (
          <p className="text-orange-400/60 text-xs mt-2">{scalingNote}</p>
        )}
      </div>

      {/* Inline timer */}
      {showTimer && timerConfig && (
        <div className="px-4">
          <TimerDisplay
            snapshot={snapshot}
            onStart={start}
            onPause={pause}
            onReset={reset}
            color="orange"
          />
        </div>
      )}

      {/* Action buttons */}
      {!readOnly && (
      <div className="px-4 pb-4 flex gap-2">
        {timerConfig && !showTimer && (
          <button
            onClick={handlePlay}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-bold hover:bg-orange-500/30 transition-colors cursor-pointer"
          >
            <Icon name="play" size={14} />
            {t('Start Timer', 'Iniciar Timer')}
          </button>
        )}
        <button
          onClick={onComplete}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition-colors cursor-pointer"
        >
          <Icon name="check" size={14} />
          {t('Done', 'Hecho')}
        </button>
        <button
          onClick={onSkip}
          className="px-3 py-2.5 rounded-lg bg-card-elevated text-muted text-xs font-semibold hover:text-foreground transition-colors cursor-pointer"
        >
          {t('Skip', 'Saltar')}
        </button>
      </div>
      )}
    </m.div>
  );
}

function WodMovementRow({ movement }: { movement: WodMovement }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm w-full text-left py-1.5 px-1 rounded-lg hover:bg-orange-500/5 transition-colors cursor-pointer"
      >
        <span className="font-mono font-bold text-orange-400 min-w-[40px]">{movement.reps}</span>
        <span className="text-foreground flex-1">{movement.name}</span>
        {movement.load !== 'BW' && (
          <span className="text-muted text-xs">({movement.load})</span>
        )}
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          className="text-muted/40 shrink-0"
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-[48px] mr-1 mb-2 rounded-lg border border-border bg-card overflow-hidden">
              <VideoPlayer demoSearch={movement.demoSearch} name={movement.name} />
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
