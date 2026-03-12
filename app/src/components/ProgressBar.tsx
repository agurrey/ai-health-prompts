'use client';

import { m } from 'motion/react';
import type { FlowStep } from '@/lib/workout-flow';

const BAR_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-400',
  red: 'bg-red-400',
  orange: 'bg-orange-400',
};

interface ProgressBarProps {
  steps: FlowStep[];
  currentStep: number;
  color?: string;
}

export default function ProgressBar({ steps, currentStep, color = 'emerald' }: ProgressBarProps) {
  const total = steps.length;
  const completed = Math.min(currentStep, total);
  const pct = total > 0 ? (completed / total) * 100 : 0;

  // Find block boundaries for subtle markers
  const markers: number[] = [];
  for (let i = 1; i < total; i++) {
    if (steps[i].type !== steps[i - 1].type) {
      markers.push((i / total) * 100);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 relative h-1 bg-border rounded-full overflow-hidden">
        <m.div
          className={`absolute inset-y-0 left-0 ${BAR_COLORS[color] ?? BAR_COLORS.emerald} rounded-full`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        {markers.map((pos) => (
          <div
            key={pos}
            className="absolute top-0 bottom-0 w-px bg-background/60"
            style={{ left: `${pos}%` }}
          />
        ))}
      </div>
      <span className="text-muted text-xs font-mono tabular-nums shrink-0">
        {completed}/{total}
      </span>
    </div>
  );
}
