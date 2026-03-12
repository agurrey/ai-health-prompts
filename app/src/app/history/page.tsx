'use client';

import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import Calendar from '@/components/Calendar';
import {
  getCompletedDates,
  getStreak,
  exportData,
  importData,
} from '@/lib/storage';

export default function HistoryPage() {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    const dates = getCompletedDates();
    setCompletedDates(new Set(dates));
    setTotalWorkouts(dates.length);
    setStreak(getStreak());
  }, []);

  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthCount = Array.from(completedDates).filter((d) => d.startsWith(thisMonthPrefix)).length;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

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
        const dates = getCompletedDates();
        setCompletedDates(new Set(dates));
        setTotalWorkouts(dates.length);
        setStreak(getStreak());
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
    <div className="space-y-8 animate-fade-up">
      <h1 className="text-2xl font-bold text-foreground text-center">
        {t('History', 'Historial')}
      </h1>

      {totalWorkouts === 0 ? (
        <div className="text-center py-8 space-y-3">
          <p className="text-muted font-semibold">
            {t('No workouts yet. Time to start!', 'Sin entrenos aún. \u00a1Es hora de empezar!')}
          </p>
        </div>
      ) : (
        <Calendar completedDates={completedDates} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-border rounded-lg p-4 bg-card text-center">
          <p className="text-2xl font-extrabold text-streak">{streak.current}</p>
          <p className="text-xs text-muted font-semibold">{t('Current Streak', 'Racha Actual')}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card text-center">
          <p className="text-2xl font-extrabold text-foreground">{streak.longest}</p>
          <p className="text-xs text-muted font-semibold">{t('Longest Streak', 'Mejor Racha')}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card text-center">
          <p className="text-2xl font-extrabold text-foreground">{thisMonthCount}/{daysInMonth}</p>
          <p className="text-xs text-muted font-semibold">{t('This Month', 'Este Mes')}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card text-center">
          <p className="text-2xl font-extrabold text-foreground">{totalWorkouts}</p>
          <p className="text-xs text-muted font-semibold">{t('Total Workouts', 'Total Entrenos')}</p>
        </div>
      </div>

      {/* Export / Import */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleExport}
          className="flex-1 px-4 py-3 bg-card border border-border text-foreground rounded-lg cursor-pointer text-sm font-bold"
        >
          {t('Export Data', 'Exportar Datos')}
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 px-4 py-3 bg-card border border-border text-foreground rounded-lg cursor-pointer text-sm font-bold"
        >
          {t('Import Data', 'Importar Datos')}
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
    </div>
  );
}
