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
              'Helping people move better — for good.',
              'Ayudo a la gente a moverse mejor — para siempre.'
            )}
          </p>
          <a href="https://twitter.com/ignakki" target="_blank" rel="noopener noreferrer" className="text-accent text-sm hover:underline">
            @ignakki
          </a>
        </div>
      </section>

      {/* The project */}
      <section className="space-y-4 animate-fade-up">
        <h2 className="text-lg font-bold text-foreground">
          {t('What is this?', 'Que es esto?')}
        </h2>
        <div className="space-y-3 text-sm text-muted leading-relaxed">
          <p>
            {t(
              'Free, open-source project. The daily workout generator uses the same exercise science, coaching cues, and progressive overload logic I use with my in-person clients — automated so anyone with dumbbells can train properly at home.',
              'Proyecto gratuito y open-source. El generador de entrenos usa la misma ciencia del ejercicio, indicaciones tecnicas y logica de sobrecarga progresiva que uso con mis clientes presenciales — automatizado para que cualquiera con mancuernas pueda entrenar bien en casa.'
            )}
          </p>
          <p>
            {t(
              'New workout every day at midnight. 7 days a week. Warm-up, strength, and conditioning — always. Pick your level, swap exercises, set a timer, and go.',
              'Nuevo entreno cada dia a medianoche. 7 dias a la semana. Calentamiento, fuerza y acondicionamiento — siempre. Elige tu nivel, cambia ejercicios, pon el temporizador y a darle.'
            )}
          </p>
          <p>
            {t(
              'The AI prompts are not generic templates. Each one encodes real methodology: phase systems with gates, injury decision trees, intake protocols, and safety checks. They turn ChatGPT, Claude, or DeepSeek into a capable health coach for their specific domain.',
              'Los prompts de IA no son plantillas genericas. Cada uno codifica metodologia real: sistemas de fases con puertas, arboles de decision para lesiones, protocolos de evaluacion y controles de seguridad. Convierten ChatGPT, Claude o DeepSeek en un coach de salud competente en su dominio.'
            )}
          </p>
        </div>
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
