import type { Session } from './generator';

export type StepType = 'warmup' | 'strength' | 'wod';
export type StepStatus = 'pending' | 'current' | 'done' | 'skipped';

export interface FlowStep {
  type: StepType;
  index: number;
  status: StepStatus;
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
  steps.push({ type: 'wod', index: 0, status: 'pending' });

  return { date: session.date, steps, currentStep: 0 };
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
