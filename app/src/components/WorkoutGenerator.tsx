'use client';

import { useState } from 'react';
import { track } from '@vercel/analytics';
import { generateSession, Session, UserLevel } from '@/lib/generator';
import { getTodayString } from '@/lib/seed';
import { useI18n } from '@/lib/i18n';
import WorkoutDisplay from './WorkoutDisplay';

const RESTRICTIONS = [
  { id: 'shoulder_pain', label: 'Shoulder pain', label_es: 'Dolor de hombro' },
  { id: 'low_back', label: 'Low back pain', label_es: 'Dolor lumbar' },
  { id: 'knee_pain', label: 'Knee pain', label_es: 'Dolor de rodilla' },
  { id: 'hip_pain', label: 'Hip pain', label_es: 'Dolor de cadera' },
  { id: 'foot_pain', label: "Can't bear weight on feet", label_es: 'Sin apoyo de pies' },
  { id: 'wrist_pain', label: 'Wrist pain', label_es: 'Dolor de muñeca' },
  { id: 'no_pullup_bar', label: 'No pull-up bar', label_es: 'Sin barra de dominadas' },
];

const LEVEL_LABELS: Record<UserLevel, { en: string; es: string }> = {
  beginner: { en: 'Beginner', es: 'Principiante' },
  intermediate: { en: 'Intermediate', es: 'Intermedio' },
  advanced: { en: 'Advanced', es: 'Avanzado' },
  warrior: { en: 'Warrior', es: 'Warrior' },
};

export default function WorkoutGenerator() {
  const { t, lang } = useI18n();
  const [lightKg, setLightKg] = useState(8);
  const [heavyKg, setHeavyKg] = useState(16);
  const [level, setLevel] = useState<UserLevel>('intermediate');
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [session, setSession] = useState<Session | null>(null);

  function toggleRestriction(id: string) {
    setRestrictions(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  }

  function handleGenerate() {
    const today = getTodayString();
    const result = generateSession(today, level, lightKg, heavyKg, restrictions);
    setSession(result);
    track('workout_generated', { level, lightKg, heavyKg });
  }

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="space-y-6">
        {/* Weight inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted mb-2">
              {t('Light dumbbells (kg)', 'Mancuernas ligeras (kg)')}
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={lightKg}
              onChange={e => setLightKg(Number(e.target.value))}
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-2">
              {t('Heavy dumbbells (kg)', 'Mancuernas pesadas (kg)')}
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={heavyKg}
              onChange={e => setHeavyKg(Number(e.target.value))}
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* Level */}
        <div>
          <label className="block text-sm text-muted mb-2">
            {t('Experience level', 'Nivel de experiencia')}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['beginner', 'intermediate', 'advanced', 'warrior'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`py-3 px-4 rounded-lg border text-sm transition-all cursor-pointer ${
                  level === l
                    ? l === 'warrior'
                      ? 'border-red-500 bg-red-500/10 text-red-400'
                      : 'border-accent bg-accent/10 text-accent'
                    : l === 'warrior'
                      ? 'border-red-500/30 text-red-400/60 hover:border-red-500/60'
                      : 'border-border text-muted hover:border-muted'
                }`}
              >
                {lang === 'es' ? LEVEL_LABELS[l].es : LEVEL_LABELS[l].en}
              </button>
            ))}
          </div>
        </div>

        {/* Restrictions */}
        <div>
          <label className="block text-sm text-muted mb-2">
            {t('Any of these apply?', '¿Te aplica alguna de estas?')}
          </label>
          <div className="flex flex-wrap gap-2">
            {RESTRICTIONS.map(r => (
              <button
                key={r.id}
                onClick={() => toggleRestriction(r.id)}
                className={`px-3 py-2 rounded-lg border text-xs transition-all cursor-pointer ${
                  restrictions.includes(r.id)
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-muted hover:border-muted'
                }`}
              >
                {lang === 'es' ? r.label_es : r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          className="w-full py-4 bg-accent text-background font-bold rounded-lg hover:brightness-110 transition-all text-lg cursor-pointer"
        >
          {t("Generate Today's Workout", 'Generar el Entrenamiento de Hoy')}
        </button>
      </div>

      {/* Output */}
      {session && (
        <div className="mt-8">
          <WorkoutDisplay session={session} />
        </div>
      )}
    </div>
  );
}
