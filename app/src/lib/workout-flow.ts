import type { Session } from './generator';

export type StepType = 'warmup' | 'strength' | 'wod_preview' | 'wod';
export type StepStatus = 'pending' | 'current' | 'done' | 'skipped';

export interface FlowStep {
  type: StepType;
  index: number;
  status: StepStatus;
  swappedExerciseId?: string;
}

export interface LinearFlowState {
  date: string;
  steps: FlowStep[];
  currentStep: number;
}

const STORAGE_PREFIX = 'hormesis_flow_';

export function createLinearState(session: Session): LinearFlowState {
  const steps: FlowStep[] = [];

  for (let i = 0; i < session.warmup.exercises.length; i++) {
    steps.push({ type: 'warmup', index: i, status: i === 0 ? 'current' : 'pending' });
  }
  for (let i = 0; i < session.strength.length; i++) {
    steps.push({ type: 'strength', index: i, status: 'pending' });
  }
  for (let i = 0; i < session.conditioning.movements.length; i++) {
    steps.push({ type: 'wod_preview', index: i, status: 'pending' });
  }
  steps.push({ type: 'wod', index: 0, status: 'pending' });

  return { date: session.date, steps, currentStep: 0 };
}

export function expectedStepCount(session: Session): number {
  return session.warmup.exercises.length
    + session.strength.length
    + session.conditioning.movements.length
    + 1;
}

export function completeStep(state: LinearFlowState): LinearFlowState {
  return advanceStep(state, 'done');
}

export function skipStep(state: LinearFlowState): LinearFlowState {
  return advanceStep(state, 'skipped');
}

function advanceStep(state: LinearFlowState, newStatus: 'done' | 'skipped'): LinearFlowState {
  const steps = state.steps.map((s, i) => {
    if (i === state.currentStep) return { ...s, status: newStatus as StepStatus };
    return s;
  });

  const nextIdx = state.currentStep + 1;
  if (nextIdx < steps.length) {
    steps[nextIdx] = { ...steps[nextIdx], status: 'current' };
  }

  return { ...state, steps, currentStep: nextIdx };
}

export function swapExercise(state: LinearFlowState, stepIndex: number, newExerciseId: string): LinearFlowState {
  const steps = state.steps.map((s, i) => {
    if (i === stepIndex) return { ...s, swappedExerciseId: newExerciseId };
    return s;
  });
  return { ...state, steps };
}

export function skipToWod(state: LinearFlowState): LinearFlowState {
  const steps = state.steps.map(s => {
    if (s.type === 'wod_preview' && (s.status === 'pending' || s.status === 'current')) {
      return { ...s, status: 'skipped' as StepStatus };
    }
    return s;
  });
  const wodIdx = steps.findIndex(s => s.type === 'wod');
  if (wodIdx >= 0) {
    steps[wodIdx] = { ...steps[wodIdx], status: 'current' };
  }
  return { ...state, steps, currentStep: wodIdx >= 0 ? wodIdx : state.currentStep };
}

export function isBlockComplete(state: LinearFlowState, type: StepType): boolean {
  return state.steps
    .filter(s => s.type === type)
    .every(s => s.status === 'done' || s.status === 'skipped');
}

export function isBlockStarted(state: LinearFlowState, type: StepType): boolean {
  return state.steps
    .filter(s => s.type === type)
    .some(s => s.status === 'done' || s.status === 'skipped' || s.status === 'current');
}

export function isWorkoutComplete(state: LinearFlowState): boolean {
  return state.currentStep >= state.steps.length;
}

export function getCurrentBlockType(state: LinearFlowState): StepType | null {
  if (state.currentStep >= state.steps.length) return null;
  return state.steps[state.currentStep].type;
}

export function getBlockTransition(state: LinearFlowState): StepType | null {
  if (state.currentStep <= 0 || state.currentStep >= state.steps.length) return null;
  const prev = state.steps[state.currentStep - 1];
  const curr = state.steps[state.currentStep];
  if (prev.type !== curr.type) return prev.type;
  return null;
}

const BLOCK_ORDER: Record<StepType, number> = { warmup: 0, strength: 1, wod_preview: 2, wod: 3 };

export function resetBlock(state: LinearFlowState, type: StepType): LinearFlowState {
  const targetOrder = BLOCK_ORDER[type];
  const steps = state.steps.map(s => {
    if (BLOCK_ORDER[s.type] >= targetOrder) return { ...s, status: 'pending' as StepStatus, swappedExerciseId: undefined };
    return s;
  });
  const firstIdx = steps.findIndex(s => s.type === type);
  if (firstIdx >= 0) steps[firstIdx] = { ...steps[firstIdx], status: 'current' };
  return { ...state, steps, currentStep: firstIdx >= 0 ? firstIdx : 0 };
}

export function resetAll(state: LinearFlowState): LinearFlowState {
  const steps = state.steps.map((s, i) => ({
    ...s,
    status: (i === 0 ? 'current' : 'pending') as StepStatus,
    swappedExerciseId: undefined,
  }));
  return { ...state, steps, currentStep: 0 };
}

export function saveFlowState(state: LinearFlowState): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + state.date, JSON.stringify(state));
  } catch { /* quota exceeded */ }
}

export function loadFlowState(date: string): LinearFlowState | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + date);
    if (!raw) return null;
    return JSON.parse(raw) as LinearFlowState;
  } catch {
    return null;
  }
}
