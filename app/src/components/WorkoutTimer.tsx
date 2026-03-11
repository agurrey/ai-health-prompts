'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';

type TimerMode = 'timer' | 'emom' | 'intervals';
type TimerState = 'idle' | 'running' | 'paused';
type TimerDirection = 'up' | 'down';
type IntervalPhase = 'work' | 'rest';

function padTwo(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${padTwo(m)}:${padTwo(s)}`;
}

function formatTimeCompact(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m > 0) return `${m}:${padTwo(s)}`;
  return `${s}s`;
}

// Web Audio API beep generator
function createBeep(frequency: number, duration: number, volume: number = 0.3): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = 'square';
    gain.gain.value = volume;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), (duration + 0.1) * 1000);
  } catch {
    // Audio not available
  }
}

function beepShort() { createBeep(880, 0.15, 0.3); }
function beepWork() { createBeep(1000, 0.12, 0.35); }
function beepRest() { createBeep(440, 0.2, 0.25); }
function beepComplete() {
  createBeep(660, 0.4, 0.4);
  setTimeout(() => createBeep(880, 0.4, 0.4), 450);
  setTimeout(() => createBeep(1100, 0.6, 0.4), 900);
}
function beepCountdown3() { createBeep(500, 0.12, 0.2); }
function beepCountdown2() { createBeep(700, 0.12, 0.25); }
function beepCountdown1() { createBeep(900, 0.15, 0.35); }

const MODES: TimerMode[] = ['timer', 'emom', 'intervals'];

const INTERVAL_PRESETS = [
  { label: 'Tabata 20/10', work: 20, rest: 10, rounds: 8 },
  { label: '30/30', work: 30, rest: 30, rounds: 6 },
  { label: '40/20', work: 40, rest: 20, rounds: 5 },
  { label: '45/15', work: 45, rest: 15, rounds: 8 },
];

function getModeLabel(mode: TimerMode, t: (en: string, es: string) => string): string {
  switch (mode) {
    case 'timer': return 'Timer';
    case 'emom': return 'EMOM';
    case 'intervals': return t('Intervals', 'Intervalos');
  }
}

function TimerIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-6 h-6'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2" />
      <path d="M5 3l2 2" />
      <path d="M19 3l-2 2" />
      <path d="M12 5V3" />
    </svg>
  );
}

export default function WorkoutTimer() {
  const { t } = useI18n();

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<TimerMode>('timer');

  // Timer mode
  const [direction, setDirection] = useState<TimerDirection>('down');
  const [inputMinutes, setInputMinutes] = useState(10);
  const [inputSeconds, setInputSeconds] = useState(0);

  // State
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // EMOM
  const [emomCurrentMinute, setEmomCurrentMinute] = useState(1);

  // Intervals state
  const [workTime, setWorkTime] = useState(20);
  const [restTime, setRestTime] = useState(10);
  const [totalRounds, setTotalRounds] = useState(8);
  const [noLimit, setNoLimit] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [intervalPhase, setIntervalPhase] = useState<IntervalPhase>('work');
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(0);

  const totalInputSeconds = inputMinutes * 60 + inputSeconds;

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const handleComplete = useCallback(() => {
    stopInterval();
    setTimerState('idle');
    beepComplete();
  }, [stopInterval]);

  const tick = useCallback(() => {
    const now = Date.now();
    if (now - lastTickRef.current < 900) return;
    lastTickRef.current = now;

    // Timer mode
    if (mode === 'timer') {
      if (direction === 'up') {
        setTimeElapsed(prev => prev + 1);
      } else {
        setTimeRemaining(prev => {
          if (prev <= 1) { handleComplete(); return 0; }
          if (prev === 4) beepCountdown3(); else if (prev === 3) beepCountdown2(); else if (prev === 2) beepCountdown1();
          return prev - 1;
        });
      }
      return;
    }

    // EMOM
    if (mode === 'emom') {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setEmomCurrentMinute(prevMin => {
            if (prevMin >= totalInputSeconds / 60) { handleComplete(); return prevMin; }
            beepShort();
            setTimeRemaining(60);
            return prevMin + 1;
          });
          return 60;
        }
        if (prev === 4) beepCountdown3(); else if (prev === 3) beepCountdown2(); else if (prev === 2) beepCountdown1();
        return prev - 1;
      });
      return;
    }

    // Intervals
    if (mode === 'intervals') {
      setPhaseTimeLeft(prev => {
        if (prev <= 1) {
          setIntervalPhase(currentPhase => {
            if (currentPhase === 'work') {
              beepRest();
              setPhaseTimeLeft(restTime);
              return 'rest';
            } else {
              setCurrentRound(prevRound => {
                if (!noLimit && prevRound >= totalRounds) { handleComplete(); return totalRounds; }
                beepWork();
                setPhaseTimeLeft(workTime);
                return prevRound + 1;
              });
              return 'work';
            }
          });
          return prev;
        }
        if (prev === 4) beepCountdown3(); else if (prev === 3) beepCountdown2(); else if (prev === 2) beepCountdown1();
        return prev - 1;
      });
      return;
    }
  }, [mode, direction, totalInputSeconds, workTime, restTime, totalRounds, noLimit, handleComplete]);

  function handleStart() {
    if (timerState === 'running') return;

    if (timerState === 'paused') {
      setTimerState('running');
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(tick, 1000);
      return;
    }

    beepShort();

    switch (mode) {
      case 'timer':
        if (direction === 'down') setTimeRemaining(totalInputSeconds);
        else setTimeElapsed(0);
        break;
      case 'emom':
        setTimeRemaining(60);
        setEmomCurrentMinute(1);
        break;
      case 'intervals':
        setCurrentRound(1);
        setIntervalPhase('work');
        setPhaseTimeLeft(workTime);
        break;
    }

    setTimerState('running');
    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(tick, 1000);
  }

  function handlePause() {
    if (timerState !== 'running') return;
    stopInterval();
    setTimerState('paused');
  }

  function handleReset() {
    stopInterval();
    setTimerState('idle');
    setTimeRemaining(0);
    setTimeElapsed(0);
    setEmomCurrentMinute(1);
    setCurrentRound(1);
    setIntervalPhase('work');
    setPhaseTimeLeft(0);
  }

  useEffect(() => {
    if (timerState === 'running' && intervalRef.current) {
      stopInterval();
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(tick, 1000);
    }
  }, [tick, timerState, stopInterval]);

  function getDisplayTime(): string {
    switch (mode) {
      case 'timer':
        if (direction === 'up') return formatTime(timerState === 'idle' ? 0 : timeElapsed);
        return formatTime(timerState === 'idle' ? totalInputSeconds : timeRemaining);
      case 'emom':
        return formatTime(timerState === 'idle' ? 60 : timeRemaining);
      case 'intervals':
        return formatTime(timerState === 'idle' ? workTime : phaseTimeLeft);
    }
  }

  function getFloatingDisplay(): string {
    if (timerState === 'idle') return '';
    switch (mode) {
      case 'timer':
        return formatTimeCompact(direction === 'up' ? timeElapsed : timeRemaining);
      case 'emom':
        return formatTimeCompact(timeRemaining);
      case 'intervals':
        return formatTimeCompact(phaseTimeLeft);
    }
  }

  function getTimerColor(): string {
    if (timerState === 'idle') return 'text-foreground';
    if (mode === 'intervals') {
      return intervalPhase === 'work' ? 'text-success' : 'text-danger';
    }
    return 'text-accent';
  }

  function getSubInfo(): string {
    if (timerState === 'idle') return '';
    switch (mode) {
      case 'timer':
        return direction === 'up' ? t('Stopwatch', 'Cronometro') : t('Countdown', 'Cuenta atras');
      case 'emom':
        return `${t('Minute', 'Minuto')} ${emomCurrentMinute}/${Math.floor(totalInputSeconds / 60)}`;
      case 'intervals':
        return noLimit
          ? `${t('Round', 'Ronda')} ${currentRound} — ${intervalPhase === 'work' ? t('WORK', 'TRABAJO') : t('REST', 'DESCANSO')}`
          : `${t('Round', 'Ronda')} ${currentRound}/${totalRounds} — ${intervalPhase === 'work' ? t('WORK', 'TRABAJO') : t('REST', 'DESCANSO')}`;
      default:
        return '';
    }
  }

  const isRunningOrPaused = timerState !== 'idle';
  const canStart =
    mode === 'intervals' ||
    (mode === 'timer' && direction === 'up') ||
    totalInputSeconds > 0;

  function applyPreset(preset: typeof INTERVAL_PRESETS[0]) {
    setWorkTime(preset.work);
    setRestTime(preset.rest);
    setTotalRounds(preset.rounds);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 sm:bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent text-background flex items-center justify-center shadow-lg hover:brightness-110 transition-all cursor-pointer btn-playful"
        aria-label={t('Open timer', 'Abrir temporizador')}
      >
        {timerState !== 'idle' ? (
          <span className="text-xs font-bold font-mono">{getFloatingDisplay()}</span>
        ) : (
          <TimerIcon />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      )}

      {/* Timer panel — bottom sheet */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="bg-card border-2 border-border rounded-t-2xl max-w-lg mx-auto shadow-2xl">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          <div className="px-6 pb-6 pt-2 space-y-5">
            {/* Mode selector */}
            <div className="flex gap-1 justify-center">
              {MODES.map(m => (
                <button
                  key={m}
                  onClick={() => { if (timerState !== 'idle') return; setMode(m); }}
                  disabled={timerState !== 'idle'}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    mode === m ? 'bg-accent/20 text-accent border-2 border-accent' : 'bg-card-elevated text-muted hover:text-foreground border-2 border-transparent'
                  } ${timerState !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {getModeLabel(m, t)}
                </button>
              ))}
            </div>

            {/* === TIMER CONFIG === */}
            {timerState === 'idle' && mode === 'timer' && (
              <div className="space-y-3">
                <div className="flex gap-1 justify-center">
                  <button onClick={() => setDirection('down')} className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${direction === 'down' ? 'bg-card-elevated text-foreground' : 'text-muted hover:text-foreground'}`}>
                    {t('Countdown', 'Cuenta atras')}
                  </button>
                  <button onClick={() => setDirection('up')} className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${direction === 'up' ? 'bg-card-elevated text-foreground' : 'text-muted hover:text-foreground'}`}>
                    {t('Stopwatch', 'Cronometro')}
                  </button>
                </div>
                {direction === 'down' && (
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex flex-col items-center">
                      <label className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">{t('Min', 'Min')}</label>
                      <input type="number" min={0} max={99} value={inputMinutes} onChange={e => setInputMinutes(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))} className="w-16 h-12 text-center text-2xl font-mono font-bold bg-background border-2 border-border rounded-xl text-foreground focus:border-accent focus:outline-none" />
                    </div>
                    <span className="text-2xl font-bold text-muted mt-4">:</span>
                    <div className="flex flex-col items-center">
                      <label className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">{t('Sec', 'Seg')}</label>
                      <input type="number" min={0} max={59} value={inputSeconds} onChange={e => setInputSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))} className="w-16 h-12 text-center text-2xl font-mono font-bold bg-background border-2 border-border rounded-xl text-foreground focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* === EMOM CONFIG === */}
            {timerState === 'idle' && mode === 'emom' && (
              <div className="flex items-center justify-center gap-3">
                <div className="flex flex-col items-center">
                  <label className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">{t('Total min', 'Min totales')}</label>
                  <input type="number" min={1} max={99} value={inputMinutes} onChange={e => setInputMinutes(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))} className="w-16 h-12 text-center text-2xl font-mono font-bold bg-background border-2 border-border rounded-xl text-foreground focus:border-accent focus:outline-none" />
                </div>
              </div>
            )}

            {/* === INTERVALS CONFIG === */}
            {timerState === 'idle' && mode === 'intervals' && (
              <div className="space-y-3">
                {/* Presets */}
                <div className="flex gap-1 justify-center flex-wrap">
                  {INTERVAL_PRESETS.map((p, i) => (
                    <button key={i} onClick={() => applyPreset(p)} className="px-2.5 py-1 rounded-xl text-xs font-semibold text-muted bg-card-elevated hover:text-foreground hover:bg-border transition-colors cursor-pointer">
                      {p.label}
                    </button>
                  ))}
                </div>
                {/* Custom inputs */}
                <div className="flex items-center justify-center gap-4">
                  <div className="flex flex-col items-center">
                    <label className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">{t('Work', 'Trabajo')}</label>
                    <input type="number" min={5} max={300} value={workTime} onChange={e => setWorkTime(Math.max(5, Math.min(300, parseInt(e.target.value) || 5)))} className="w-16 h-12 text-center text-2xl font-mono font-bold bg-background border-2 border-border rounded-xl text-emerald-400 focus:border-emerald-400 focus:outline-none" />
                    <span className="text-[10px] text-muted/50 mt-0.5">sec</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <label className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">{t('Rest', 'Descanso')}</label>
                    <input type="number" min={0} max={300} value={restTime} onChange={e => setRestTime(Math.max(0, Math.min(300, parseInt(e.target.value) || 0)))} className="w-16 h-12 text-center text-2xl font-mono font-bold bg-background border-2 border-border rounded-xl text-red-400 focus:border-red-400 focus:outline-none" />
                    <span className="text-[10px] text-muted/50 mt-0.5">sec</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <label className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">{t('Rounds', 'Rondas')}</label>
                    <input type="number" min={1} max={50} value={totalRounds} onChange={e => setTotalRounds(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))} disabled={noLimit} className={`w-16 h-12 text-center text-2xl font-mono font-bold bg-background border-2 border-border rounded-xl text-foreground focus:border-accent focus:outline-none ${noLimit ? 'opacity-30' : ''}`} />
                  </div>
                </div>
                <label className="flex items-center justify-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={noLimit} onChange={e => setNoLimit(e.target.checked)} className="accent-accent w-4 h-4 cursor-pointer" />
                  <span className="text-xs text-muted font-semibold">{t('No limit (runs until you stop)', 'Sin limite (corre hasta parar)')}</span>
                </label>
              </div>
            )}


            {/* Timer display */}
            <div className="text-center space-y-1">
              <div className={`text-7xl font-mono font-extrabold tracking-wider ${getTimerColor()} transition-colors`}>
                {getDisplayTime()}
              </div>
              {isRunningOrPaused && (
                <p className={`text-sm font-semibold ${
                  mode === 'intervals' && intervalPhase === 'work' ? 'text-emerald-400' :
                  mode === 'intervals' && intervalPhase === 'rest' ? 'text-red-400' :
                  'text-muted'
                }`}>
                  {getSubInfo()}
                </p>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {timerState === 'idle' ? (
                <button onClick={handleStart} disabled={!canStart} className="px-8 py-3 bg-accent text-background font-bold rounded-xl text-lg hover:brightness-110 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed btn-playful">
                  {t('Start', 'Iniciar')}
                </button>
              ) : (
                <>
                  {timerState === 'running' ? (
                    <button onClick={handlePause} className="px-6 py-3 bg-amber-500 text-background font-bold rounded-xl text-lg hover:brightness-110 transition-all cursor-pointer btn-playful">
                      {t('Pause', 'Pausa')}
                    </button>
                  ) : (
                    <button onClick={handleStart} className="px-6 py-3 bg-accent text-background font-bold rounded-xl text-lg hover:brightness-110 transition-all cursor-pointer btn-playful">
                      {t('Resume', 'Continuar')}
                    </button>
                  )}
                  <button onClick={handleReset} className="px-6 py-3 bg-card-elevated text-foreground font-bold rounded-xl text-lg hover:bg-border transition-all cursor-pointer btn-playful">
                    {t('Reset', 'Reset')}
                  </button>
                </>
              )}
            </div>

            <button onClick={() => setIsOpen(false)} className="w-full py-2 text-muted text-xs font-semibold hover:text-foreground transition-colors cursor-pointer">
              {t('Close', 'Cerrar')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
