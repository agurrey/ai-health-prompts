'use client';

import { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import Icon from './Icon';
import VideoPlayer from './VideoPlayer';

interface CompletedStepProps {
  name: string;
  status: 'done' | 'skipped';
  prescription?: string;
  cue?: string;
  demoSearch?: string;
}

export default function CompletedStep({ name, status, prescription, cue, demoSearch }: CompletedStepProps) {
  const [expanded, setExpanded] = useState(false);
  const isDone = status === 'done';

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 w-full text-left cursor-pointer hover:bg-card-elevated/50 rounded-lg transition-colors"
      >
        <Icon
          name={isDone ? 'check' : 'skip-forward'}
          size={14}
          className={isDone ? 'text-emerald-400' : 'text-muted/40'}
        />
        <span className={`text-xs font-medium flex-1 ${isDone ? 'text-muted line-through' : 'text-muted/40 line-through'}`}>
          {name}
        </span>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          className="text-muted/40"
        />
      </button>

      <AnimatePresence>
        {expanded && (prescription || demoSearch) && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mx-3 mb-2 rounded-lg border border-border bg-card overflow-hidden">
              {demoSearch && <VideoPlayer demoSearch={demoSearch} name={name} />}
              <div className="p-2.5 space-y-1">
                {prescription && <p className="text-xs font-semibold text-muted">{prescription}</p>}
                {cue && <p className="text-muted/60 text-xs leading-relaxed">{cue}</p>}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
