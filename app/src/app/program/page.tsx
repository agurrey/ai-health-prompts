'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { getWeekPhase, PhaseInfo } from '@/lib/generator';

const PHASES: { phase: PhaseInfo['phase']; week: number; en: string; es: string; desc_en: string; desc_es: string; strength_en: string; strength_es: string; wod_en: string; wod_es: string }[] = [
  {
    phase: 'accumulation',
    week: 1,
    en: 'Accumulation',
    es: 'Acumulación',
    desc_en: 'Build your base. Volume is king.',
    desc_es: 'Construye tu base. El volumen manda.',
    strength_en: 'Hypertrophy, Strength-Endurance, Tempo, Myo-Reps. Moderate loads, higher reps (8-15).',
    strength_es: 'Hipertrofia, Fuerza-Resistencia, Tempo, Myo-Reps. Cargas moderadas, reps altas (8-15).',
    wod_en: 'Longer conditioning: AMRAPs, Chippers, Fight Gone Bad, Rounds for Time. 10+ min timecaps.',
    wod_es: 'Acondicionamiento largo: AMRAPs, Chippers, Fight Gone Bad, Rounds for Time. +10 min timecaps.',
  },
  {
    phase: 'intensification',
    week: 2,
    en: 'Intensification',
    es: 'Intensificación',
    desc_en: 'Get strong. Intensity over volume.',
    desc_es: 'Hazte fuerte. Intensidad sobre volumen.',
    strength_en: 'Heavy RIR1, Wave Loading, Cluster Sets, Rest-Pause. Heavier loads, fewer reps (3-6).',
    strength_es: 'Heavy RIR1, Wave Loading, Cluster Sets, Rest-Pause. Cargas pesadas, pocas reps (3-6).',
    wod_en: 'Short, intense: Couplets, Intervals, EMOM, E2MOM, Ladders. Under 12 min.',
    wod_es: 'Cortos e intensos: Couplets, Intervalos, EMOM, E2MOM, Ladders. Menos de 12 min.',
  },
  {
    phase: 'mixed',
    week: 3,
    en: 'Conditioning',
    es: 'Acondicionamiento',
    desc_en: 'Sweat. Your joints recover while your engine grows.',
    desc_es: 'Suda. Tus articulaciones descansan mientras tu motor crece.',
    strength_en: 'Strength-Endurance, Mechanical Drop Sets, To Failure, Tempo. Lighter loads, movement variety.',
    strength_es: 'Fuerza-Resistencia, Mechanical Drop Sets, Al Fallo, Tempo. Cargas ligeras, variedad.',
    wod_en: 'Maximum variety: Triplets, Tabata, Double Session, Pyramid, FGB, AMRAPs. Any timecap.',
    wod_es: 'Máxima variedad: Triplets, Tabata, Doble Sesión, Pirámide, FGB, AMRAPs. Cualquier timecap.',
  },
  {
    phase: 'realization',
    week: 4,
    en: 'Realization',
    es: 'Realización',
    desc_en: 'Show what you\'ve built. Test yourself.',
    desc_es: 'Demuestra lo que has construido. Ponte a prueba.',
    strength_en: 'Heavy RIR1, Wave Loading, Cluster Sets, To Failure, Rest-Pause. Go heavy.',
    strength_es: 'Heavy RIR1, Wave Loading, Cluster Sets, Al Fallo, Rest-Pause. Ve pesado.',
    wod_en: 'Benchmark style: Couplets, Single Movement, Death By, Ladders. Short and decisive.',
    wod_es: 'Estilo benchmark: Couplets, Single Movement, Death By, Ladders. Cortos y decisivos.',
  },
];

const DAY_NAMES_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES_ES = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

export default function ProgramPage() {
  const { t, lang } = useI18n();

  const today = new Date().toISOString().split('T')[0];
  const current = getWeekPhase(today);

  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      <Link href="/" className="text-accent text-sm hover:underline">
        {t('Back to workout', 'Volver al entreno')}
      </Link>

      {/* Header */}
      <section className="space-y-3 animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">
          {t('Training Program', 'Programa de Entrenamiento')}
        </h1>
        <p className="text-muted text-sm leading-relaxed">
          {t(
            'Hormesis follows a 4-week mesocycle that repeats continuously. Each week has a different training bias — the workouts, strength protocols, and conditioning formats all adapt automatically. No two weeks feel the same.',
            'Hormesis sigue un mesociclo de 4 semanas que se repite continuamente. Cada semana tiene un sesgo de entrenamiento diferente — los entrenos, protocolos de fuerza y formatos de acondicionamiento se adaptan automáticamente. Ninguna semana se siente igual.'
          )}
        </p>
      </section>

      {/* Current position */}
      <section className="animate-fade-up">
        <div className="p-4 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20">
          <p className="text-fuchsia-400 text-xs font-bold uppercase tracking-wider">
            {t('You are here', 'Estás aquí')}
          </p>
          <p className="text-fuchsia-400 text-lg font-bold mt-1">
            {lang === 'es' ? current.label_es : current.label}
            <span className="text-fuchsia-400/50 font-normal text-sm ml-2">
              {lang === 'es' ? `día ${current.dayInWeek}/7` : `day ${current.dayInWeek}/7`}
            </span>
          </p>
          {/* Day dots */}
          <div className="flex gap-1.5 mt-3">
            {Array.from({ length: 7 }, (_, i) => {
              const dayNum = i + 1;
              const isToday = dayNum === current.dayInWeek;
              const isPast = dayNum < current.dayInWeek;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isToday
                      ? 'bg-fuchsia-500 text-white'
                      : isPast
                        ? 'bg-fuchsia-500/30 text-fuchsia-400'
                        : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {dayNum}
                  </div>
                  <span className={`text-[10px] ${isToday ? 'text-fuchsia-400 font-bold' : 'text-zinc-600'}`}>
                    {lang === 'es' ? DAY_NAMES_ES[i] : DAY_NAMES_EN[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4 weeks breakdown */}
      <section className="space-y-4 animate-fade-up">
        <h2 className="text-lg font-bold text-foreground">
          {t('The 4-week cycle', 'El ciclo de 4 semanas')}
        </h2>
        <div className="space-y-3">
          {PHASES.map((p) => {
            const isCurrent = p.week === current.weekNumber;
            return (
              <div
                key={p.week}
                className={`p-4 rounded-lg border transition-all ${
                  isCurrent
                    ? 'border-fuchsia-500/40 bg-fuchsia-500/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isCurrent ? 'bg-fuchsia-500 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {t(`W${p.week}`, `S${p.week}`)}
                  </span>
                  <h3 className={`font-bold text-sm ${isCurrent ? 'text-fuchsia-400' : 'text-foreground'}`}>
                    {lang === 'es' ? p.es : p.en}
                  </h3>
                  {isCurrent && (
                    <span className="text-fuchsia-400/60 text-xs ml-auto">
                      {t('current', 'actual')}
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-2 ${isCurrent ? 'text-fuchsia-400/70' : 'text-muted'}`}>
                  {lang === 'es' ? p.desc_es : p.desc_en}
                </p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex gap-2 text-xs">
                    <span className="text-red-400 font-medium shrink-0">{t('Strength:', 'Fuerza:')}</span>
                    <span className="text-muted">{lang === 'es' ? p.strength_es : p.strength_en}</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-orange-400 font-medium shrink-0">{t('Conditioning:', 'Acondicionamiento:')}</span>
                    <span className="text-muted">{lang === 'es' ? p.wod_es : p.wod_en}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Weekly split */}
      <section className="space-y-4 animate-fade-up">
        <h2 className="text-lg font-bold text-foreground">
          {t('Weekly split', 'Distribución semanal')}
        </h2>
        <p className="text-muted text-sm">
          {t(
            'Each day targets different movement patterns. The split balances push/pull/squat/hinge across the week so nothing gets overtrained.',
            'Cada día trabaja diferentes patrones de movimiento. La distribución equilibra empuje/tirón/sentadilla/bisagra a lo largo de la semana para no sobreentrenar nada.'
          )}
        </p>
        <div className="space-y-1.5">
          {[
            { day_en: 'Monday', day_es: 'Lunes', type_en: 'Lower + Push', type_es: 'Tren Inferior + Empuje', patterns: 'squat / hinge / push / carry', isToday: current.dayInWeek === 1 },
            { day_en: 'Tuesday', day_es: 'Martes', type_en: 'Upper Pull Focus', type_es: 'Tren Superior + Tirón', patterns: 'push / pull / pull / carry', isToday: current.dayInWeek === 2 },
            { day_en: 'Wednesday', day_es: 'Miércoles', type_en: 'Full Body', type_es: 'Cuerpo Completo', patterns: 'squat / hinge / push / pull / carry', isToday: current.dayInWeek === 3 },
            { day_en: 'Thursday', day_es: 'Jueves', type_en: 'Lower + Pull', type_es: 'Tren Inferior + Tirón', patterns: 'hinge / squat / pull / carry', isToday: current.dayInWeek === 4 },
            { day_en: 'Friday', day_es: 'Viernes', type_en: 'Upper Push Focus', type_es: 'Tren Superior + Empuje', patterns: 'push / pull / push / carry', isToday: current.dayInWeek === 5 },
            { day_en: 'Saturday', day_es: 'Sábado', type_en: 'Conditioning Day', type_es: 'Día de Acondicionamiento', patterns: 'squat / hinge / push / pull', isToday: current.dayInWeek === 6 },
            { day_en: 'Sunday', day_es: 'Domingo', type_en: 'Active Full Body', type_es: 'Cuerpo Completo Activo', patterns: 'squat / push / pull', isToday: current.dayInWeek === 7 },
          ].map((d) => (
            <div
              key={d.day_en}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                d.isToday ? 'border-fuchsia-500/40 bg-fuchsia-500/5' : 'border-border bg-card'
              }`}
            >
              <span className={`text-xs font-bold w-10 shrink-0 ${d.isToday ? 'text-fuchsia-400' : 'text-zinc-400'}`}>
                {lang === 'es' ? d.day_es.slice(0, 3) : d.day_en.slice(0, 3)}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-medium ${d.isToday ? 'text-fuchsia-400' : 'text-foreground'}`}>
                  {lang === 'es' ? d.type_es : d.type_en}
                </p>
                <p className="text-muted text-xs">{d.patterns}</p>
              </div>
              {d.isToday && (
                <span className="text-fuchsia-400/60 text-xs ml-auto shrink-0">{t('today', 'hoy')}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Daily structure */}
      <section className="space-y-4 animate-fade-up">
        <h2 className="text-lg font-bold text-foreground">
          {t('Session structure', 'Estructura de sesión')}
        </h2>
        <div className="space-y-2">
          {[
            { color: 'bg-green-500', label: t('Warm-up', 'Calentamiento'), desc: t('RAMP protocol + CARs + breathing. Prepares joints and nervous system.', 'Protocolo RAMP + CARs + respiración. Prepara articulaciones y sistema nervioso.') },
            { color: 'bg-red-500', label: t('Strength', 'Fuerza'), desc: t('2-3 exercises, protocol changes by week phase. Swap button to adapt.', '2-3 ejercicios, protocolo cambia por fase semanal. Botón de cambio para adaptar.') },
            { color: 'bg-orange-500', label: t('Conditioning', 'Acondicionamiento'), desc: t('Format and intensity vary by mesocycle phase.', 'Formato e intensidad varían por fase del mesociclo.') },
          ].map((block) => (
            <div key={block.label} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
              <div className={`w-3 h-3 rounded-full ${block.color} mt-0.5 shrink-0`} />
              <div>
                <p className="text-sm font-medium text-foreground">{block.label}</p>
                <p className="text-muted text-xs mt-0.5">{block.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Philosophy */}
      <section className="space-y-4 animate-fade-up">
        <h2 className="text-lg font-bold text-foreground">
          {t('Why this works', '\u00bfPor qué funciona?')}
        </h2>
        <div className="space-y-3 text-sm text-muted leading-relaxed">
          <p>
            {t(
              '7 days a week, no rest days. The mesocycle handles recovery — Week 3 (Conditioning) acts as active recovery with lighter loads and more cardio. Your joints rest while your engine grows.',
              '7 días a la semana, sin días de descanso. El mesociclo gestiona la recuperación — la Semana 3 (Acondicionamiento) actúa como recuperación activa con cargas ligeras y más cardio. Tus articulaciones descansan mientras tu motor crece.'
            )}
          </p>
          <p>
            {t(
              'Based on Daily Undulating Periodization (DUP) research, CompTrain/HWPO methodology, and Moesgaard 2022 meta-analysis on periodized training. The same principles used in competitive CrossFit, adapted for home training with minimal equipment.',
              'Basado en investigación de Periodización Ondulante Diaria (DUP), metodología CompTrain/HWPO, y metaanálisis de Moesgaard 2022 sobre entrenamiento periodizado. Los mismos principios del CrossFit competitivo, adaptados para entrenar en casa con equipamiento mínimo.'
            )}
          </p>
        </div>
      </section>

      {/* Equipment */}
      <section className="space-y-3 animate-fade-up border-t border-border pt-8">
        <h2 className="text-lg font-bold text-foreground">
          {t('Equipment needed', 'Equipamiento necesario')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            t('Dumbbells', 'Mancuernas'),
            t('Pull-up bar', 'Barra de dominadas'),
            t('Jump rope', 'Comba'),
            t('Bodyweight', 'Peso corporal'),
          ].map((item) => (
            <span key={item} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium">
              {item}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
