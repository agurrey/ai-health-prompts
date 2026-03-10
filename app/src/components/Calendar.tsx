'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { getCompletedWorkout } from '@/lib/storage';

interface Props {
  completedDates: Set<string>;
}

function fmt(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function Calendar({ completedDates }: Props) {
  const { t } = useI18n();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const todayStr = fmt(today.getFullYear(), today.getMonth(), today.getDate());

  const dayNames = t('Mon,Tue,Wed,Thu,Fri,Sat,Sun', 'Lun,Mar,Mie,Jue,Vie,Sab,Dom').split(',');
  const monthNames = t(
    'January,February,March,April,May,June,July,August,September,October,November,December',
    'Enero,Febrero,Marzo,Abril,Mayo,Junio,Julio,Agosto,Septiembre,Octubre,Noviembre,Diciembre'
  ).split(',');

  // First day of month (0=Sun, adjust to Mon=0)
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prev() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
    setSelected(null);
  }

  function next() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
    setSelected(null);
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedWorkout = selected ? getCompletedWorkout(selected) : null;

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="px-3 py-1 text-muted hover:text-foreground transition-colors cursor-pointer">&larr;</button>
        <span className="text-foreground font-medium">{monthNames[month]} {year}</span>
        <button onClick={next} className="px-3 py-1 text-muted hover:text-foreground transition-colors cursor-pointer">&rarr;</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-xs text-muted py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateStr = fmt(year, month, day);
          const done = completedDates.has(dateStr);
          const isToday = dateStr === todayStr;
          const isSel = dateStr === selected;

          return (
            <button
              key={i}
              onClick={() => setSelected(isSel ? null : dateStr)}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-colors cursor-pointer relative
                ${done ? 'bg-accent/20 text-accent font-bold' : 'text-muted hover:bg-zinc-800'}
                ${isToday ? 'ring-1 ring-accent' : ''}
                ${isSel ? 'ring-2 ring-foreground' : ''}
              `}
            >
              {day}
              {done && (
                <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day info */}
      {selected && selectedWorkout && (
        <div className="mt-4 p-3 rounded-lg bg-card border border-border text-sm animate-fade-up">
          <p className="text-foreground font-medium">{selectedWorkout.sessionType}</p>
          <p className="text-muted text-xs mt-1">
            {t('Completed', 'Completado')} {new Date(selectedWorkout.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </div>
  );
}
