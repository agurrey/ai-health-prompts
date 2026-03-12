'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

const SOURCES = [
  { author: 'Stuart McGill', work: 'Low Back Disorders', work_es: 'Low Back Disorders', topic: 'Spine stability, Big 3', topic_es: 'Estabilidad espinal, Big 3' },
  { author: 'Gray Cook', work: 'Movement', work_es: 'Movement', topic: 'Functional screening', topic_es: 'Evaluacion funcional' },
  { author: 'Kelly Starrett', work: 'Becoming a Supple Leopard', work_es: 'Becoming a Supple Leopard', topic: 'Mobility systems', topic_es: 'Sistemas de movilidad' },
  { author: 'Brad Schoenfeld', work: 'Science and Development of Muscle Hypertrophy', work_es: 'Science and Development of Muscle Hypertrophy', topic: 'Hypertrophy mechanisms, volume, intensity', topic_es: 'Mecanismos de hipertrofia, volumen, intensidad' },
  { author: 'Eric Helms', work: 'The Muscle & Strength Pyramids', work_es: 'The Muscle & Strength Pyramids', topic: 'Training & nutrition hierarchy', topic_es: 'Jerarquia de entrenamiento y nutricion' },
  { author: 'Matthew Walker', work: 'Why We Sleep', work_es: 'Why We Sleep', topic: 'Sleep architecture', topic_es: 'Arquitectura del sueno' },
  { author: 'BJ Fogg', work: 'Tiny Habits', work_es: 'Tiny Habits', topic: 'Behavior design', topic_es: 'Diseno de comportamiento' },
  { author: 'NSCA', work: 'Essentials of Strength & Conditioning', work_es: 'Essentials of Strength & Conditioning', topic: 'Programming, periodization, exercise science', topic_es: 'Programacion, periodizacion, ciencia del ejercicio' },
  { author: 'NASM', work: 'Corrective Exercise Specialist', work_es: 'Especialista en Ejercicio Correctivo', topic: 'Movement assessment & correction', topic_es: 'Evaluacion y correccion del movimiento' },
  { author: 'NOVA Classification', work: 'Food Classification System', work_es: 'Sistema de Clasificacion de Alimentos', topic: 'Ultra-processed food framework', topic_es: 'Marco de alimentos ultraprocesados' },
];

export default function AboutPage() {
  const { t, lang } = useI18n();

  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      {/* Back */}
      <Link href="/" className="text-accent text-sm hover:underline">
        {t('Back to workout', 'Volver al entreno')}
      </Link>

      {/* Header */}
      <section className="flex items-center gap-5 animate-fade-up">
        <img
          src="https://unavatar.io/twitter/ignakki?v=2"
          alt="Iñaki"
          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
        />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Iñaki</h1>
          <p className="text-muted text-sm mt-0.5">
            {t(
              'Your daily training dose',
              'Tu dosis diaria de entrenamiento'
            )}
          </p>
          <a href="https://twitter.com/ignakki" target="_blank" rel="noopener noreferrer" className="text-accent text-sm hover:underline">
            @ignakki
          </a>
        </div>
      </section>

      {/* What is Hormesis? */}
      <section className="space-y-4 animate-fade-up">
        <h2 className="text-lg font-bold text-foreground">
          {t('What is Hormesis?', 'Que es Hormesis?')}
        </h2>
        <div className="space-y-3 text-sm text-muted leading-relaxed">
          <p>
            {t(
              'Hormesis is a biological principle: small, controlled doses of stress make your body stronger. Cold exposure, fasting, training — the mechanism is the same. Your body adapts to what challenges it.',
              'Hormesis es un principio biologico: dosis pequenas y controladas de estres hacen tu cuerpo mas fuerte. Exposicion al frio, ayuno, entrenamiento — el mecanismo es el mismo. Tu cuerpo se adapta a lo que le desafia.'
            )}
          </p>
          <p>
            {t(
              'This app applies that principle to training. One coached session per day — the right dose, programmed by a real trainer.',
              'Esta app aplica ese principio al entrenamiento. Una sesion dirigida al dia — la dosis correcta, programada por un entrenador real.'
            )}
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-4 animate-fade-up">
        <h2 className="text-lg font-bold text-foreground">
          {t('How it works', 'Como funciona')}
        </h2>
        <div className="space-y-3 text-sm text-muted leading-relaxed">
          <p>
            {t(
              'Every session follows the same 3-block structure: warmup, strength, conditioning. The content changes daily — movements, protocols, formats, intensity.',
              'Cada sesion sigue la misma estructura de 3 bloques: calentamiento, fuerza, acondicionamiento. El contenido cambia cada dia — movimientos, protocolos, formatos, intensidad.'
            )}
          </p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>{t('4-week periodization that repeats continuously', 'Periodizacion de 4 semanas que se repite continuamente')}</li>
            <li>{t('155 exercises, 28 warmup movements, 31 conditioning formats', '155 ejercicios, 28 movimientos de calentamiento, 31 formatos de acondicionamiento')}</li>
            <li>{t('Equipment filter — dumbbells, pull-up bar, bodyweight only, or all', 'Filtro de equipamiento — mancuernas, barra de dominadas, solo peso corporal, o todo')}</li>
            <li>{t('Level selector with real coaching cues at every step', 'Selector de nivel con indicaciones tecnicas reales en cada paso')}</li>
          </ul>
        </div>
      </section>

      {/* Why I built this */}
      <section className="space-y-4 animate-fade-up">
        <h2 className="text-lg font-bold text-foreground">
          {t('Why I built this', 'Por que lo construi')}
        </h2>
        <div className="space-y-3 text-sm text-muted leading-relaxed">
          <p>
            {t(
              'I\'m a personal trainer in Madrid. I wanted my clients to train properly on the days they don\'t see me — same methodology, same cues, same periodization. So I automated it.',
              'Soy entrenador personal en Madrid. Queria que mis clientes entrenasen bien los dias que no me ven — misma metodologia, mismas indicaciones, misma periodizacion. Asi que lo automatice.'
            )}
          </p>
          <p>
            {t(
              'This isn\'t a workout logger or a random generator. It\'s 4-week periodized coaching with real exercise science — the same programming a PT charges 50\u20AC/session for.',
              'Esto no es un diario de entrenos ni un generador aleatorio. Es coaching periodizado de 4 semanas con ciencia del ejercicio real — la misma programacion por la que un entrenador cobra 50\u20AC/sesion.'
            )}
          </p>
        </div>
      </section>

      {/* AI Health Prompts */}
      <section className="space-y-3 animate-fade-up">
        <h2 className="text-lg font-bold text-foreground">
          {t('AI Health Prompts', 'Prompts de Salud IA')}
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          {t(
            'Copy a specialized prompt into ChatGPT, Claude, or DeepSeek and get a capable health coach for that domain.',
            'Copia un prompt especializado en ChatGPT, Claude o DeepSeek y consigue un coach de salud competente en ese area.'
          )}
        </p>
        <Link href="/prompts" className="text-accent text-sm hover:underline font-bold">
          {t('Browse prompts', 'Ver prompts')} →
        </Link>
      </section>

      {/* Knowledge sources */}
      <section className="space-y-4 animate-fade-up">
        <h2 className="text-lg font-bold text-foreground">
          {t('Knowledge sources', 'Fuentes de conocimiento')}
        </h2>
        <p className="text-muted text-sm">
          {t(
            'The methodology behind the workouts, prompts, and coaching logic comes from:',
            'La metodologia detras de los entrenos, prompts y logica de coaching viene de:'
          )}
        </p>
        <div className="space-y-2">
          {SOURCES.map((s, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
              <span className="text-accent font-bold text-sm mt-0.5 shrink-0 w-5 text-right">{i + 1}</span>
              <div>
                <p className="text-foreground text-sm font-medium">
                  {s.author} — <span className="text-muted italic">{lang === 'es' ? s.work_es : s.work}</span>
                </p>
                <p className="text-muted text-xs mt-0.5">
                  {lang === 'es' ? s.topic_es : s.topic}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Links */}
      <section className="space-y-3 animate-fade-up">
        <h2 className="text-lg font-bold text-foreground">Links</h2>
        <div className="space-y-2 text-sm">
          <a href="https://github.com/agurrey/ai-health-prompts" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-accent hover:underline">
            GitHub
            <span className="text-muted font-normal">— {t('open source (MIT)', 'open source (MIT)')}</span>
          </a>
          <a href="https://twitter.com/ignakki" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-accent hover:underline">
            @ignakki
            <span className="text-muted font-normal">— {t('updates & feedback', 'novedades y feedback')}</span>
          </a>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-border pt-8 space-y-4 animate-fade-up">
        <p className="text-muted text-sm">
          {t(
            'Questions, feedback, or want to train with me in Madrid?',
            'Preguntas, feedback, o quieres entrenar conmigo en Madrid?'
          )}
        </p>
        <a
          href="https://twitter.com/messages/compose?recipient_id=ignakki"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 bg-accent text-background font-semibold rounded-lg hover:brightness-110 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          {t('DM me on X', 'Escribeme por X')}
        </a>
      </section>

      {/* Disclaimer */}
      <p className="text-muted/60 text-xs leading-relaxed">
        {t(
          'These tools generate general health guidance, not medical advice. If you have a diagnosed medical condition, always consult your healthcare provider.',
          'Estas herramientas generan orientacion general de salud, no consejo medico. Si tienes una condicion medica diagnosticada, consulta siempre a tu profesional de salud.'
        )}
      </p>
    </div>
  );
}
