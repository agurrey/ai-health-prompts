'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { TimerConfig, TimerSnapshot, TimerState, IntervalPhase } from '@/lib/timer-engine';
import { beepShort, beepWork, beepRest, beepComplete, beepCountdown } from '@/lib/timer-engine';

export function useExerciseTimer(config: TimerConfig | null) {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [phase, setPhase] = useState<IntervalPhase>('work');
  const [currentRound, setCurrentRound] = useState(1);
  const [currentMinute, setCurrentMinute] = useState(1);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef(0);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopInterval(), [stopInterval]);

  // Reset when config changes
  useEffect(() => {
    stopInterval();
    setTimerState('idle');
    setDisplaySeconds(0);
    setPhase('work');
    setCurrentRound(1);
    setCurrentMinute(1);
  }, [config, stopInterval]);

  const handleComplete = useCallback(() => {
    stopInterval();
    setTimerState('idle');
    beepComplete();
  }, [stopInterval]);

  const tick = useCallback(() => {
    if (!config) return;
    const now = Date.now();
    if (now - lastTickRef.current < 900) return;
    lastTickRef.current = now;

    if (config.mode === 'stopwatch') {
      setDisplaySeconds(prev => prev + 1);
      return;
    }

    if (config.mode === 'countdown') {
      setDisplaySeconds(prev => {
        if (prev <= 1) { handleComplete(); return 0; }
        beepCountdown(prev - 1);
        return prev - 1;
      });
      return;
    }

    if (config.mode === 'emom') {
      const interval = config.intervalSeconds || 60;
      setDisplaySeconds(prev => {
        if (prev <= 1) {
          const totalBlocks = Math.floor((config.totalSeconds || 600) / interval);
          setCurrentMinute(cm => {
            if (cm >= totalBlocks) { handleComplete(); return cm; }
            beepShort();
            setDisplaySeconds(interval);
            return cm + 1;
          });
          return interval;
        }
        beepCountdown(prev - 1);
        return prev - 1;
      });
      return;
    }

    if (config.mode === 'intervals') {
      setDisplaySeconds(prev => {
        if (prev <= 1) {
          setPhase(cp => {
            if (cp === 'work') {
              beepRest();
              setDisplaySeconds(config.restSeconds || 10);
              return 'rest';
            } else {
              setCurrentRound(cr => {
                if (config.rounds && cr >= config.rounds) { handleComplete(); return cr; }
                beepWork();
                setDisplaySeconds(config.workSeconds || 20);
                return cr + 1;
              });
              return 'work';
            }
          });
          return prev;
        }
        beepCountdown(prev - 1);
        return prev - 1;
      });
    }
  }, [config, handleComplete]);

  const start = useCallback(() => {
    if (!config) return;

    if (timerState === 'paused') {
      setTimerState('running');
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(tick, 1000);
      return;
    }

    beepShort();

    switch (config.mode) {
      case 'countdown':
        setDisplaySeconds(config.totalSeconds || 60);
        break;
      case 'stopwatch':
        setDisplaySeconds(0);
        break;
      case 'emom':
        setDisplaySeconds(config.intervalSeconds || 60);
        setCurrentMinute(1);
        break;
      case 'intervals':
        setDisplaySeconds(config.workSeconds || 20);
        setCurrentRound(1);
        setPhase('work');
        break;
    }

    setTimerState('running');
    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(tick, 1000);
  }, [config, timerState, tick]);

  const pause = useCallback(() => {
    if (timerState !== 'running') return;
    stopInterval();
    setTimerState('paused');
  }, [timerState, stopInterval]);

  const reset = useCallback(() => {
    stopInterval();
    setTimerState('idle');
    setDisplaySeconds(0);
    setPhase('work');
    setCurrentRound(1);
    setCurrentMinute(1);
  }, [stopInterval]);

  // Reattach interval when tick changes during running
  useEffect(() => {
    if (timerState === 'running' && intervalRef.current) {
      stopInterval();
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(tick, 1000);
    }
  }, [tick, timerState, stopInterval]);

  // Calculate progress
  let progress = 0;
  if (config && timerState !== 'idle') {
    switch (config.mode) {
      case 'countdown':
        progress = config.totalSeconds ? 1 - displaySeconds / config.totalSeconds : 0;
        break;
      case 'emom': {
        const interval = config.intervalSeconds || 60;
        const totalBlocks = Math.floor((config.totalSeconds || 600) / interval);
        progress = (currentMinute - 1 + (1 - displaySeconds / interval)) / totalBlocks;
        break;
      }
      case 'intervals': {
        const total = config.rounds || 8;
        const phaseDuration = phase === 'work' ? (config.workSeconds || 20) : (config.restSeconds || 10);
        const phaseProgress = phaseDuration > 0 ? 1 - displaySeconds / phaseDuration : 0;
        progress = ((currentRound - 1) * 2 + (phase === 'rest' ? 1 : 0) + phaseProgress) / (total * 2);
        break;
      }
      case 'stopwatch':
        progress = 0;
        break;
    }
  }

  const snapshot: TimerSnapshot = {
    state: timerState,
    displaySeconds,
    mode: config?.mode || 'countdown',
    phase: config?.mode === 'intervals' ? phase : undefined,
    currentRound: config?.mode === 'intervals' ? currentRound : undefined,
    totalRounds: config?.mode === 'intervals' ? config.rounds : undefined,
    currentMinute: config?.mode === 'emom' ? currentMinute : undefined,
    totalMinutes: config?.mode === 'emom' ? Math.floor((config.totalSeconds || 600) / (config.intervalSeconds || 60)) : undefined,
    progress: Math.min(1, Math.max(0, progress)),
  };

  return { snapshot, start, pause, reset };
}
