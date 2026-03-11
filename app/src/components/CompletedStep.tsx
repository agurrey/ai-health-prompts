'use client';

import Icon from './Icon';

interface CompletedStepProps {
  name: string;
  status: 'done' | 'skipped';
}

export default function CompletedStep({ name, status }: CompletedStepProps) {
  const isDone = status === 'done';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <Icon
        name={isDone ? 'check' : 'skip-forward'}
        size={14}
        className={isDone ? 'text-emerald-400' : 'text-muted/40'}
      />
      <span className={`text-xs font-medium ${isDone ? 'text-muted line-through' : 'text-muted/40 line-through'}`}>
        {name}
      </span>
    </div>
  );
}
