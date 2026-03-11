'use client';

import { useState } from 'react';
import type { Restriction, Equipment } from '@/data/exercises';
import { RESTRICTIONS } from '@/data/restrictions';
import { useI18n } from '@/lib/i18n';

const USER_RESTRICTIONS = RESTRICTIONS.filter(r => r.id !== 'no_pullup_bar');

const EQUIPMENT_OPTIONS: { id: Equipment; en: string; es: string }[] = [
  { id: 'dumbbell', en: 'Dumbbells', es: 'Mancuernas' },
  { id: 'pull_up_bar', en: 'Pull-up bar', es: 'Barra de dominadas' },
  { id: 'jump_rope', en: 'Jump rope', es: 'Comba' },
];

interface AdaptPanelProps {
  activeRestrictions: Restriction[];
  equipmentOverride: Equipment[] | null;
  shortMode: boolean;
  savedEquipment: Equipment[];
  onApply: (restrictions: Restriction[], equipmentOverride: Equipment[] | null, shortMode: boolean) => void;
  onReset: () => void;
}

export default function AdaptPanel({
  activeRestrictions,
  equipmentOverride,
  shortMode,
  savedEquipment,
  onApply,
  onReset,
}: AdaptPanelProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [pendingRestrictions, setPendingRestrictions] = useState<Set<Restriction>>(new Set(activeRestrictions));
  const [pendingEquipment, setPendingEquipment] = useState<Set<Equipment>>(
    new Set(equipmentOverride ?? savedEquipment)
  );
  const [pendingShort, setPendingShort] = useState(shortMode);
  const [equipmentChanged, setEquipmentChanged] = useState(equipmentOverride !== null);

  const activeCount = activeRestrictions.length + (equipmentOverride ? 1 : 0) + (shortMode ? 1 : 0);

  function toggleRestriction(id: Restriction) {
    const next = new Set(pendingRestrictions);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPendingRestrictions(next);
  }

  function toggleEquipment(id: Equipment) {
    const next = new Set(pendingEquipment);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPendingEquipment(next);
    setEquipmentChanged(true);
  }

  function handleApply() {
    const restrictions = Array.from(pendingRestrictions);
    const eqArray = Array.from(pendingEquipment);
    const savedSet = new Set(savedEquipment);
    const eqChanged = equipmentChanged && (
      eqArray.length !== savedEquipment.length ||
      eqArray.some(e => !savedSet.has(e))
    );
    onApply(
      restrictions,
      eqChanged ? eqArray : null,
      pendingShort,
    );
    setOpen(false);
  }

  function handleReset() {
    setPendingRestrictions(new Set());
    setPendingEquipment(new Set(savedEquipment));
    setPendingShort(false);
    setEquipmentChanged(false);
    onReset();
    setOpen(false);
  }

  return (
    <div className="border-2 border-border rounded-2xl bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
      >
        <span className="text-sm font-semibold text-foreground">
          {t('Adapt this workout', 'Adaptar este entreno')}
        </span>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent border-2 border-accent/30 font-semibold">
              {activeCount} {t('active', activeCount === 1 ? 'activa' : 'activas')}
            </span>
          )}
          <svg
            className={`w-4 h-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 animate-slide-down">
          {/* Body restrictions */}
          <div>
            <p className="text-xs text-muted mb-2 uppercase tracking-wider font-bold">
              {t('Body', 'Cuerpo')}
            </p>
            <div className="flex flex-wrap gap-2">
              {USER_RESTRICTIONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => toggleRestriction(r.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-colors cursor-pointer ${
                    pendingRestrictions.has(r.id)
                      ? 'border-accent bg-accent/10 text-foreground'
                      : 'border-border bg-card text-muted hover:border-border'
                  }`}
                >
                  {t(r.label, r.label_es)}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment override */}
          <div>
            <p className="text-xs text-muted mb-2 uppercase tracking-wider font-bold">
              {t('Equipment', 'Equipamiento')}
            </p>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map(eq => (
                <button
                  key={eq.id}
                  onClick={() => toggleEquipment(eq.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-colors cursor-pointer ${
                    pendingEquipment.has(eq.id)
                      ? 'border-accent bg-accent/10 text-foreground'
                      : 'border-border bg-card text-muted hover:border-border'
                  }`}
                >
                  {t(eq.en, eq.es)}
                </button>
              ))}
            </div>
          </div>

          {/* Short mode */}
          <div>
            <button
              onClick={() => setPendingShort(!pendingShort)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-colors cursor-pointer ${
                pendingShort
                  ? 'border-accent bg-accent/10 text-foreground'
                  : 'border-border bg-card text-muted hover:border-border'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {t('Short mode (~30 min)', 'Modo corto (~30 min)')}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2.5 bg-accent text-background font-bold rounded-2xl hover:brightness-110 transition-all cursor-pointer text-sm btn-playful"
            >
              {t('Apply', 'Aplicar')}
            </button>
            {activeCount > 0 && (
              <button
                onClick={handleReset}
                className="text-xs text-muted hover:text-foreground transition-colors cursor-pointer font-semibold"
              >
                {t('Reset', 'Resetear')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
