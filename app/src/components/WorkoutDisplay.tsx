'use client';

import { Session } from '@/lib/generator';
import { useI18n } from '@/lib/i18n';

export default function WorkoutDisplay({ session }: { session: Session }) {
  const { t, lang } = useI18n();

  return (
    <div className="font-mono text-sm leading-relaxed space-y-6">
      {/* Header */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <div className="text-accent font-bold mb-2">
          {lang === 'es' ? session.sessionType_es : session.sessionType} — {session.date}
        </div>
        <div className="text-muted text-xs space-y-1">
          <p>{t('Level', 'Nivel')}: {session.level} | {t('Light', 'Ligeras')}: {session.lightKg}kg | {t('Heavy', 'Pesadas')}: {session.heavyKg}kg</p>
          <p>{t('Duration', 'Duración')}: ~{session.duration} min</p>
          {session.restrictions.length > 0 && (
            <p>{t('Restrictions', 'Restricciones')}: {session.restrictions.join(', ')}</p>
          )}
        </div>
      </div>

      {/* Warm-up */}
      <div>
        <h3 className="text-accent font-bold mb-3 text-xs uppercase tracking-wider">
          {t('Warm-up (3 min)', 'Calentamiento (3 min)')}
        </h3>
        <ul className="space-y-2">
          {session.warmup.map((w, i) => (
            <li key={i} className="pl-4 border-l-2 border-border">
              <span className="text-foreground">{w.name}</span>
              <span className="text-muted"> — {w.prescription}</span>
              <p className="text-muted text-xs mt-0.5">{lang === 'es' ? w.cue_es : w.cue}</p>
              {w.demoSearch && (
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(w.demoSearch)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded bg-accent/10 text-accent text-xs hover:bg-accent/20 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  {t('Watch Demo', 'Ver Demo')}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Strength */}
      <div>
        <h3 className="text-accent font-bold mb-3 text-xs uppercase tracking-wider">
          {t(`Strength (${session.strength.length} exercises)`, `Fuerza (${session.strength.length} ejercicios)`)}
        </h3>
        <div className="space-y-4">
          {session.strength.map((item, i) => (
            <div key={i} className="pl-4 border-l-2 border-accent/30">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-foreground font-medium">{item.exercise.name}</span>
                <span className="text-accent text-xs">
                  {item.sets}x{item.reps} @ {item.load}
                </span>
              </div>
              <p className="text-muted text-xs mt-1">
                {lang === 'es' ? item.exercise.cue_es : item.exercise.cue}
              </p>
              {item.tempo && (
                <p className="text-muted text-xs">Tempo: {item.tempo}</p>
              )}
              <p className="text-muted text-xs">{t('Rest', 'Descanso')}: {item.rest}</p>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.exercise.demoSearch)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded bg-accent/10 text-accent text-xs hover:bg-accent/20 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                {t('Watch Demo', 'Ver Demo')}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Finisher */}
      {session.finisher.length > 0 && (
        <div>
          <h3 className="text-accent font-bold mb-3 text-xs uppercase tracking-wider">Finisher</h3>
          {session.finisher.map((item, i) => (
            <div key={i} className="pl-4 border-l-2 border-border">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-foreground font-medium">{item.exercise.name}</span>
                <span className="text-accent text-xs">
                  {item.sets}x{item.reps} @ {item.load}
                </span>
              </div>
              <p className="text-muted text-xs mt-1">
                {lang === 'es' ? item.exercise.cue_es : item.exercise.cue}
              </p>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.exercise.demoSearch)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded bg-accent/10 text-accent text-xs hover:bg-accent/20 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                {t('Watch Demo', 'Ver Demo')}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* WOD Section */}
      {session.warrior && (
        <div className={`border-2 rounded-lg p-4 ${session.level === 'warrior' ? 'border-red-500/40 bg-red-500/5' : 'border-accent/40 bg-accent/5'}`}>
          <h3 className={`font-bold mb-3 text-xs uppercase tracking-wider ${session.level === 'warrior' ? 'text-red-400' : 'text-accent'}`}>
            {session.level === 'warrior' ? 'WARRIOR WOD' : t('Conditioning WOD', 'WOD de Acondicionamiento')}
          </h3>
          <p className="text-foreground font-bold text-sm mb-3">
            {lang === 'es' ? session.warrior.format_es : session.warrior.format}
            <span className="text-red-400 ml-2">| Cap: {session.warrior.timecap}</span>
          </p>
          <div className="space-y-2 mb-3">
            {session.warrior.movements.map((m, i) => (
              <div key={i} className="text-sm">
                <span className="text-red-400 font-mono font-bold">{m.reps}</span>
                <span className="text-foreground ml-2">{m.name}</span>
                {m.load !== 'BW' && m.load !== 'light' && <span className="text-muted ml-1">({m.load})</span>}
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(m.demoSearch)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 ml-2 text-red-400/60 text-xs hover:text-red-400 transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  demo
                </a>
              </div>
            ))}
          </div>
          <p className="text-muted text-xs italic">
            {lang === 'es' ? session.warrior.note_es : session.warrior.note}
          </p>
        </div>
      )}

      {/* Daily steps reminder */}
      <div className="flex items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3">
        <svg className="w-5 h-5 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        <p className="text-blue-400 text-sm font-medium">
          {t('Walk 7,000–10,000 steps today. Non-negotiable.', 'Camina 7.000–10.000 pasos hoy. No negociable.')}
        </p>
      </div>

      {/* Strategy */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <h3 className="text-accent font-bold mb-2 text-xs uppercase tracking-wider">
          {t('Strategy', 'Estrategia')}
        </h3>
        <p className="text-muted text-xs leading-relaxed">
          {lang === 'es' ? session.strategy_es : session.strategy}
        </p>
      </div>

      {/* Disclaimer */}
      <p className="text-muted/60 text-xs border-t border-border pt-4">
        {t(
          'This is not medical advice. If you experience sharp pain, dizziness, chest pain, or any symptom that concerns you — stop and consult a healthcare professional immediately.',
          'Esto no es consejo médico. Si experimentas dolor agudo, mareos, dolor en el pecho, o cualquier síntoma preocupante — para y consulta a un profesional de la salud inmediatamente.'
        )}
      </p>
    </div>
  );
}
