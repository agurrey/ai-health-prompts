'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import type { SelectedStrengthExercise } from '@/lib/generator';
import { logExercises, getPersonalRecords, savePersonalRecord, type ExerciseLogEntry, type PersonalRecord } from '@/lib/storage';
import { checkNewPRs } from '@/lib/gamification';

interface Props {
  date: string;
  strength: SelectedStrengthExercise[];
  onComplete: (prCount: number, newPRs: PersonalRecord[]) => void;
}

interface LogField {
  weight: string;
  reps: string;
  sets: string;
  skipped: boolean;
}

export default function ExerciseLogPanel({ date, strength, onComplete }: Props) {
  const { t } = useI18n();
  const [fields, setFields] = useState<LogField[]>(
    strength.map((s) => ({
      weight: '',
      reps: s.reps,
      sets: String(s.sets),
      skipped: false,
    }))
  );

  function updateField(i: number, key: keyof LogField, value: string | boolean) {
    setFields((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: value };
      return next;
    });
  }

  function handleSave() {
    const entries: ExerciseLogEntry[] = [];
    for (let i = 0; i < strength.length; i++) {
      const f = fields[i];
      entries.push({
        exerciseId: strength[i].exercise.id,
        date,
        weight: f.skipped ? '' : f.weight,
        reps: f.skipped ? '' : f.reps,
        sets: f.skipped ? 0 : parseInt(f.sets) || strength[i].sets,
        notes: f.skipped ? 'skipped' : undefined,
      });
    }
    logExercises(entries);

    // Detect PRs from entries that have a non-empty weight and aren't skipped
    const currentPRs = getPersonalRecords();
    const logEntriesForPR = entries.filter(e => e.weight && e.weight.trim() !== '' && e.notes !== 'skipped');
    const newPRs = checkNewPRs(logEntriesForPR, currentPRs);
    for (const pr of newPRs) {
      savePersonalRecord(pr);
    }
    onComplete(newPRs.length, newPRs);
  }

  function handleSkipAll() {
    onComplete(0, []);
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <p className="text-xs text-muted">
        {t('Log your weights (optional)', 'Registra tus pesos (opcional)')}
      </p>

      {strength.map((item, i) => (
        <div
          key={i}
          className={`border border-border rounded-lg p-3 bg-card space-y-2 ${fields[i].skipped ? 'opacity-40' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm font-medium">{item.exercise.name}</span>
            <button
              onClick={() => updateField(i, 'skipped', !fields[i].skipped)}
              className="text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              {fields[i].skipped ? t('Undo', 'Deshacer') : t('Skip', 'Saltar')}
            </button>
          </div>
          {!fields[i].skipped && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted block mb-1">{t('Weight', 'Peso')}</label>
                <input
                  type="text"
                  placeholder="20kg"
                  value={fields[i].weight}
                  onChange={(e) => updateField(i, 'weight', e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-zinc-800 border border-border text-foreground text-sm outline-none focus:border-accent"
                />
              </div>
              <div className="w-20">
                <label className="text-xs text-muted block mb-1">Reps</label>
                <input
                  type="text"
                  value={fields[i].reps}
                  onChange={(e) => updateField(i, 'reps', e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-zinc-800 border border-border text-foreground text-sm outline-none focus:border-accent"
                />
              </div>
              <div className="w-16">
                <label className="text-xs text-muted block mb-1">Sets</label>
                <input
                  type="text"
                  value={fields[i].sets}
                  onChange={(e) => updateField(i, 'sets', e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-zinc-800 border border-border text-foreground text-sm outline-none focus:border-accent"
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-3 bg-accent text-background font-semibold rounded-lg hover:brightness-110 transition-all cursor-pointer"
        >
          {t('Save & Complete', 'Guardar y Completar')}
        </button>
        <button
          onClick={handleSkipAll}
          className="px-4 py-3 bg-card border border-border text-muted rounded-lg hover:text-foreground transition-colors cursor-pointer"
        >
          {t('Skip All', 'Saltar Todo')}
        </button>
      </div>
    </div>
  );
}
