'use client';

import { useEffect, useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import {
  getStreak,
  loadData,
  getEquipment,
  setEquipment as persistEquipment,
  exportData,
  importData,
  getCompletedDates,
  CompletedWorkout,
} from '@/lib/storage';
import type { Equipment } from '@/data/exercises';
import StreakWidget from '@/components/StreakWidget';
import EquipmentSetup from '@/components/EquipmentSetup';

function getCompletionRate(workouts: CompletedWorkout[]): string {
  if (workouts.length === 0) return '0%';
  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));
  const first = new Date(sorted[0].date + 'T00:00:00Z');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const diffMs = today.getTime() - first.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  const rate = Math.min(100, Math.round((workouts.length / diffDays) * 100));
  return `${rate}%`;
}

export default function ProfilePage() {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [streak, setStreak] = useState<{ current: number; longest: number }>({ current: 0, longest: 0 });
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [showEquipment, setShowEquipment] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[] | undefined>(undefined);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    setStreak(getStreak());
    setCompletedWorkouts(loadData().completedWorkouts);
    const eq = getEquipment();
    if (eq) setEquipment(eq);
  }, []);

  const totalWorkouts = completedWorkouts.length;
  const thisMonthPrefix = new Date().toISOString().slice(0, 7);
  const thisMonth = completedWorkouts.filter(w => w.date.startsWith(thisMonthPrefix)).length;
  const completionRate = getCompletionRate(completedWorkouts);

  function handleEquipmentSave(eq: Equipment[]) {
    persistEquipment(eq);
    setEquipment(eq);
    setShowEquipment(false);
  }

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hormesis-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importData(reader.result as string);
      if (ok) {
        setStreak(getStreak());
        setCompletedWorkouts(loadData().completedWorkouts);
        setImportStatus(t('Data restored!', '\u00a1Datos restaurados!'));
      } else {
        setImportStatus(t('Invalid file', 'Archivo inválido'));
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="max-w-lg mx-auto space-y-8 animate-fade-up">
      <h1 className="text-2xl font-bold text-foreground">
        {t('Profile', 'Perfil')}
      </h1>

      {/* Streak */}
      <section className="space-y-3">
        <StreakWidget />
        <div className="flex justify-between text-sm text-muted font-semibold">
          <span>{t('Longest:', 'Mejor:')} {streak.longest} {t('days', 'días')}</span>
        </div>
      </section>

      {/* Stats */}
      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="text-lg font-bold text-foreground">
          {t('Stats', 'Estadísticas')}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-border rounded-lg p-4 bg-card text-center">
            <p className="text-2xl font-extrabold text-foreground">{totalWorkouts}</p>
            <p className="text-xs text-muted font-semibold mt-1">{t('Total', 'Total')}</p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card text-center">
            <p className="text-2xl font-extrabold text-foreground">{thisMonth}</p>
            <p className="text-xs text-muted font-semibold mt-1">{t('This month', 'Este mes')}</p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card text-center">
            <p className="text-2xl font-extrabold text-foreground">{completionRate}</p>
            <p className="text-xs text-muted font-semibold mt-1">{t('Rate', 'Constancia')}</p>
          </div>
        </div>
      </section>

      {/* Equipment */}
      <section className="space-y-3 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            {t('Equipment', 'Equipamiento')}
          </h2>
          <button
            onClick={() => setShowEquipment(!showEquipment)}
            className="text-accent text-xs font-bold hover:underline cursor-pointer"
          >
            {showEquipment ? t('Cancel', 'Cancelar') : t('Change', 'Cambiar')}
          </button>
        </div>
        {showEquipment ? (
          <EquipmentSetup initial={equipment} onSave={handleEquipmentSave} mode="settings" />
        ) : (
          <p className="text-sm text-muted font-semibold">
            {equipment && equipment.length > 0
              ? equipment.map(e => e.replace('_', ' ')).join(', ')
              : t('Bodyweight only', 'Solo peso corporal')}
          </p>
        )}
      </section>

      {/* Export / Import */}
      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="text-lg font-bold text-foreground">
          {t('Data', 'Datos')}
        </h2>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-3 bg-card border border-border text-foreground rounded-lg cursor-pointer text-sm font-bold"
          >
            {t('Export', 'Exportar')}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 px-4 py-3 bg-card border border-border text-foreground rounded-lg cursor-pointer text-sm font-bold"
          >
            {t('Import', 'Importar')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
        {importStatus && (
          <p className="text-center text-sm text-accent font-bold animate-fade-in">{importStatus}</p>
        )}
      </section>
    </div>
  );
}
