'use client';

import { useI18n } from '@/lib/i18n';

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-5">
        <img
          src="https://unavatar.io/twitter/ignakki"
          alt="Iñaki — personal trainer"
          className="w-20 h-20 rounded-full object-cover flex-shrink-0"
        />
        <div>
          <h1 className="text-2xl font-bold">Iñaki</h1>
          <p className="text-muted text-sm">
            {t(
              'Personal trainer \u00b7 Functional movement \u00b7 Injury rehab',
              'Entrenador personal \u00b7 Movimiento funcional \u00b7 Rehabilitación de lesiones'
            )}
          </p>
          <a href="https://twitter.com/ignakki" target="_blank" rel="noopener noreferrer" className="text-accent text-sm hover:underline">@ignakki</a>
        </div>
      </div>

      <div className="space-y-4 text-muted leading-relaxed">
        <p>
          {t(
            'This is a free, open-source project built by ',
            'Este es un proyecto gratuito y open-source creado por '
          )}
          <a href="https://twitter.com/ignakki" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">@ignakki</a>
          {t(
            ' — a personal trainer with 5+ years of experience in functional movement and injury rehabilitation, based in Madrid, Spain.',
            ' — entrenador personal con 5+ años de experiencia en movimiento funcional y rehabilitación de lesiones, en Madrid, España.'
          )}
        </p>

        <p>
          {t(
            "The daily workout generator uses the same exercise science, coaching cues, and progressive overload logic I use with my in-person clients — just automated so anyone with 2 pairs of dumbbells can train properly at home.",
            'El generador de entrenamientos usa la misma ciencia del ejercicio, indicaciones de coaching y logica de sobrecarga progresiva que uso con mis clientes presenciales — automatizado para que cualquiera con 2 pares de mancuernas pueda entrenar bien en casa.'
          )}
        </p>

        <p>
          {t(
            'The AI prompts are not generic templates. Each one encodes real methodology: phase systems with gates, injury decision trees, intake protocols, and safety checks. They turn ChatGPT, Claude, or DeepSeek into a capable health coach for their specific domain.',
            'Los prompts de IA no son plantillas genéricas. Cada uno codifica metodología real: sistemas de fases con puertas, árboles de decisión de lesiones, protocolos de intake y chequeos de seguridad. Convierten ChatGPT, Claude o DeepSeek en un coach de salud competente en su dominio.'
          )}
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="font-bold">{t('Knowledge sources', 'Fuentes de conocimiento')}</h2>
        <ul className="text-muted text-sm space-y-1">
          <li>Stuart McGill — Low Back Disorders ({t('spine stability, Big 3', 'estabilidad espinal, Big 3')})</li>
          <li>Gray Cook — Movement ({t('functional screening', 'cribado funcional')})</li>
          <li>Matthew Walker — Why We Sleep ({t('sleep architecture', 'arquitectura del sueño')})</li>
          <li>BJ Fogg — Tiny Habits ({t('behavior design', 'diseño de hábitos')})</li>
          <li>Kelly Starrett — Becoming a Supple Leopard ({t('mobility', 'movilidad')})</li>
          <li>NOVA Classification — {t('ultra-processed food framework', 'marco de alimentos ultraprocesados')}</li>
          <li>NASM — {t('corrective exercise methodology', 'metodología de ejercicio correctivo')}</li>
        </ul>
      </div>

      {/* Contact */}
      <div className="space-y-3">
        <h2 className="font-bold">{t('Contact', 'Contacto')}</h2>
        <p className="text-muted text-sm">
          {t(
            'Questions, feedback, or want personalized coaching? DM me on Twitter.',
            '¿Preguntas, feedback, o quieres coaching personalizado? Escríbeme por DM en Twitter.'
          )}
        </p>
        <a
          href="https://twitter.com/messages/compose?recipient_id=ignakki"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 bg-accent text-background font-semibold rounded-lg hover:brightness-110 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          {t('Send me a DM', 'Envíame un DM')}
        </a>
      </div>

      <div className="space-y-3">
        <h2 className="font-bold">Links</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <a href="https://github.com/agurrey/ai-health-prompts" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              GitHub Repository
            </a>{' '}
            <span className="text-muted">— {t('all prompts are open source (MIT)', 'todos los prompts son open source (MIT)')}</span>
          </li>
          <li>
            <a href="https://twitter.com/ignakki" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              Twitter @ignakki
            </a>{' '}
            <span className="text-muted">— {t('updates, daily workouts, feedback', 'actualizaciones, entrenamientos diarios, feedback')}</span>
          </li>
        </ul>
      </div>

      <div className="border-t border-border pt-6">
        <p className="text-muted text-xs leading-relaxed">
          {t(
            'These tools generate general health guidance, not medical advice. They include built-in disclaimers and referral triggers for conditions that require professional supervision. If you have a diagnosed medical condition, always consult your healthcare provider.',
            'Estas herramientas generan orientación general de salud, no consejo médico. Incluyen disclaimers integrados y triggers de derivación para condiciones que requieren supervisión profesional. Si tienes una condición médica diagnosticada, consulta siempre a tu profesional de salud.'
          )}
        </p>
      </div>
    </div>
  );
}
