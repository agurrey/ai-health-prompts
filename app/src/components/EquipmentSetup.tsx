'use client';

import { useState } from 'react';
import type { Equipment } from '@/data/exercises';
import { useI18n } from '@/lib/i18n';

const EQUIPMENT_OPTIONS: { id: Equipment; en: string; es: string; icon: string }[] = [
  { id: 'dumbbell', en: 'Dumbbells', es: 'Mancuernas', icon: 'M3 12h3m12 0h3M6 12a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v0z' },
  { id: 'pull_up_bar', en: 'Pull-up bar', es: 'Barra de dominadas', icon: 'M2 6h20M6 6v6M18 6v6' },
  { id: 'jump_rope', en: 'Jump rope', es: 'Comba', icon: 'M7 3v4m10-4v4M7 7c0 5-3 7-3 10a3 3 0 0 0 6 0c0-3-3-5-3-10m10 0c0 5-3 7-3 10a3 3 0 0 0 6 0c0-3-3-5-3-10' },
];

interface EquipmentSetupProps {
  initial?: Equipment[];
  onSave: (equipment: Equipment[]) => void;
  mode?: 'setup' | 'settings';
}

export default function EquipmentSetup({ initial, onSave, mode = 'setup' }: EquipmentSetupProps) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<Set<Equipment>>(new Set(initial ?? ['dumbbell']));

  function toggle(id: Equipment) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function handleSave() {
    onSave(Array.from(selected));
  }

  return (
    <div className={mode === 'setup' ? 'space-y-6 animate-fade-up' : 'space-y-4'}>
      {mode === 'setup' && (
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            {t('What equipment do you have?', 'Que equipamiento tienes?')}
          </h2>
          <p className="text-muted text-sm">
            {t(
              'We\'ll tailor every session to your gear. You can change this anytime.',
              'Adaptamos cada sesion a tu material. Puedes cambiarlo cuando quieras.'
            )}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {EQUIPMENT_OPTIONS.map(eq => (
          <button
            key={eq.id}
            onClick={() => toggle(eq.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors cursor-pointer text-left ${
              selected.has(eq.id)
                ? 'border-accent bg-accent/10 text-foreground'
                : 'border-border bg-card text-muted hover:border-zinc-600'
            }`}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={eq.icon} />
            </svg>
            <span className="text-sm font-medium flex-1">
              {t(eq.en, eq.es)}
            </span>
            {selected.has(eq.id) && (
              <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        ))}

        <div className="px-4 py-2">
          <p className="text-zinc-600 text-xs">
            {t(
              'Bodyweight exercises are always included.',
              'Ejercicios con peso corporal siempre incluidos.'
            )}
          </p>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full px-4 py-3 bg-accent text-background font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer text-sm"
      >
        {mode === 'setup'
          ? t('Start Training', 'Empezar a Entrenar')
          : t('Save', 'Guardar')}
      </button>
    </div>
  );
}
