'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { setUsername } from '@/lib/auth';

interface UsernameSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type UsernameState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

function validateUsername(value: string): string | null {
  if (value.length < 3) return 'Username must be at least 3 characters';
  if (value.length > 20) return 'Username must be at most 20 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, and underscores';
  return null;
}

export default function UsernameSetup({ isOpen, onClose, onSuccess }: UsernameSetupProps) {
  const { t } = useI18n();
  const [username, setUsernameInput] = useState('');
  const [usernameState, setUsernameState] = useState<UsernameState>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  function handleUsernameChange(value: string) {
    setUsernameInput(value);
    setUsernameState('idle');
    const err = validateUsername(value);
    setValidationError(err);
  }

  async function handleUsernameBlur() {
    const err = validateUsername(username);
    if (err) return; // Don't check availability if invalid

    setUsernameState('checking');
    // Import getSupabase lazily for uniqueness check — reuse setUsername which checks internally
    // We check via a dry-run approach: just display "checking" and let the server validate on submit
    // Per plan: check on blur, not on every keystroke
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setUsernameState('idle');
      return;
    }
    try {
      const sb = createClient(url, key);
      const { data } = await sb.from('profiles').select('id').ilike('username', username).maybeSingle();
      setUsernameState(data ? 'taken' : 'available');
    } catch {
      setUsernameState('idle');
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setSubmitError(null);

    try {
      const { success, error } = await setUsername(username);
      if (!success) {
        setSubmitError(error ?? t('Failed to claim username', 'Error al reclamar nombre de usuario'));
        if (error === 'Username already taken') setUsernameState('taken');
        return;
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  const usernameValid = !validateUsername(username) && usernameState !== 'taken';
  const canSubmit = usernameValid && (usernameState === 'available' || usernameState === 'idle') && !loading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card-elevated border-2 border-border rounded-2xl w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-foreground">
            {t('Claim your username', 'Reclama tu nombre de usuario')}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors cursor-pointer p-1 -mt-1 -mr-1"
            aria-label={t('Close', 'Cerrar')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Username field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted uppercase tracking-wide">
            {t('Username', 'Nombre de usuario')}
          </label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={e => handleUsernameChange(e.target.value)}
              onBlur={handleUsernameBlur}
              placeholder={t('e.g. iron_agur', 'ej. agur_fuerte')}
              maxLength={20}
              className={`w-full px-3 py-2.5 bg-background border-2 rounded-xl text-sm text-foreground placeholder-muted focus:outline-none transition-colors pr-8 ${
                usernameState === 'available'
                  ? 'border-success focus:border-success'
                  : usernameState === 'taken' || validationError
                  ? 'border-danger focus:border-danger'
                  : 'border-border focus:border-accent'
              }`}
            />
            {/* Status indicator */}
            {usernameState === 'checking' && (
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            )}
            {usernameState === 'available' && (
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>

          {/* Validation feedback */}
          {validationError && username.length > 0 && (
            <p className="text-xs text-danger font-semibold">
              {t(validationError, validationError === 'Username must be at least 3 characters'
                ? 'El nombre debe tener al menos 3 caracteres'
                : validationError === 'Username must be at most 20 characters'
                ? 'El nombre no puede tener mas de 20 caracteres'
                : 'Solo letras, numeros y guiones bajos')}
            </p>
          )}
          {usernameState === 'taken' && (
            <p className="text-xs text-danger font-semibold">
              {t('Username already taken', 'Nombre de usuario no disponible')}
            </p>
          )}
          {usernameState === 'available' && (
            <p className="text-xs text-success font-semibold">
              {t('Available', 'Disponible')}
            </p>
          )}
        </div>

        {/* Submit error */}
        {submitError && (
          <p className="text-xs text-danger bg-danger/10 border-2 border-danger/20 rounded-xl px-3 py-2 font-semibold">
            {submitError}
          </p>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="btn-playful w-full text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                {t('Saving...', 'Guardando...')}
              </>
            ) : (
              t('Claim Username', 'Reclamar Nombre')
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm text-muted hover:text-foreground transition-colors cursor-pointer font-semibold"
          >
            {t('Cancel', 'Cancelar')}
          </button>
        </div>
      </div>
    </div>
  );
}
