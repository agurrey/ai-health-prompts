'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import Calendar from '@/components/Calendar';
import CatMascot from '@/components/CatMascot';
import Icon from '@/components/Icon';
import {
  getCompletedDates,
  getStreak,
  exportData,
  importData,
  getXP,
  getFreezeTokens,
} from '@/lib/storage';

export default function HistoryPage() {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [xpData, setXpData] = useState<{ xp: number; xpLevel: number }>({ xp: 0, xpLevel: 1 });
  const [freezeTokens, setFreezeTokens] = useState(0);

  useEffect(() => {
    const dates = getCompletedDates();
    setCompletedDates(new Set(dates));
    setTotalWorkouts(dates.length);
    setStreak(getStreak());
    setXpData(getXP());
    setFreezeTokens(getFreezeTokens());
  }, []);

  // Count this month
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
        setImportStatus(t('Data restored!', 'Datos restaurados!'));
      } else {
        setImportStatus(t('Invalid file', 'Archivo invalido'));
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <h1 className="text-2xl font-extrabold text-foreground text-center">
        {t('History', 'Historial')}
      </h1>

      {totalWorkouts === 0 ? (
        <div className="text-center py-8 space-y-3">
          <CatMascot pose="sleeping" size={100} className="mx-auto" />
          <p className="text-muted font-semibold">
            {t('No workouts yet. Time to start!', 'Sin entrenos aun. Es hora de empezar!')}
          </p>
        </div>
      ) : (
        <Calendar completedDates={completedDates} />
      )}

      {/* XP teaser */}
      <Link href="/profile" className="block border-2 border-border rounded-2xl p-4 bg-card hover:bg-card-elevated transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-accent font-extrabold">Level {xpData.xpLevel}</span>
            <span className="text-muted text-sm font-semibold ml-2">{xpData.xp} XP</span>
          </div>
          <span className="text-muted text-sm font-semibold">{t('View Profile', 'Ver Perfil')} &rarr;</span>
        </div>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border-2 border-border rounded-2xl p-4 bg-card text-center">
          <p className="text-2xl font-extrabold text-streak">{streak.current}</p>
          <p className="text-xs text-muted font-semibold">{t('Current Streak', 'Racha Actual')}</p>
          {freezeTokens > 0 && (
            <span className="text-accent flex justify-center gap-0.5 mt-1">
              {Array.from({ length: freezeTokens }).map((_, i) => (
                <Icon key={i} name="snowflake" size={12} />
              ))}
            </span>
          )}
        </div>
        <div className="border-2 border-border rounded-2xl p-4 bg-card text-center">
          <p className="text-2xl font-extrabold text-foreground">{streak.longest}</p>
          <p className="text-xs text-muted font-semibold">{t('Longest Streak', 'Mejor Racha')}</p>
        </div>
        <div className="border-2 border-border rounded-2xl p-4 bg-card text-center">
          <p className="text-2xl font-extrabold text-foreground">{thisMonthCount}/{daysInMonth}</p>
          <p className="text-xs text-muted font-semibold">{t('This Month', 'Este Mes')}</p>
        </div>
        <div className="border-2 border-border rounded-2xl p-4 bg-card text-center">
          <p className="text-2xl font-extrabold text-foreground">{totalWorkouts}</p>
          <p className="text-xs text-muted font-semibold">{t('Total Workouts', 'Total Entrenos')}</p>
        </div>
      </div>

      {/* Export / Import */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleExport}
          className="btn-playful flex-1 px-4 py-3 bg-card border-2 border-border text-foreground rounded-2xl cursor-pointer text-sm font-bold"
        >
          {t('Export Data', 'Exportar Datos')}
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="btn-playful flex-1 px-4 py-3 bg-card border-2 border-border text-foreground rounded-2xl cursor-pointer text-sm font-bold"
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
