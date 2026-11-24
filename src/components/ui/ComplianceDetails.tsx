import React from 'react';
import { Info } from 'lucide-react';

interface ComplianceDetailsProps {
  label?: string;
  items: { code: string; description: string }[];
  tone?: 'light' | 'dark';
}

export const ComplianceDetails: React.FC<ComplianceDetailsProps> = ({
  label = 'Regulatory & form references',
  items,
  tone = 'light',
}) => {
  const isDark = tone === 'dark';

  return (
    <details
      className={`group rounded-xl border text-xs transition-colors ${
        isDark
          ? 'bg-white/5 border-white/10 text-slate-300'
          : 'bg-surface-canvas/70 border-surface-border/80 text-ink-muted'
      }`}
    >
      <summary
        className={`cursor-pointer list-none px-3.5 py-2 flex items-center justify-between gap-2 font-medium select-none ${
          isDark ? 'text-slate-300 hover:text-white' : 'text-ink-secondary hover:text-ink-primary'
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden="true" />
          <span>{label}</span>
        </span>
        <span className="text-[12px] opacity-75 group-open:hidden">Show</span>
        <span className="text-[12px] opacity-75 hidden group-open:inline">Hide</span>
      </summary>
      <dl
        className={`px-3.5 pb-3 pt-1.5 border-t space-y-1.5 ${
          isDark ? 'border-white/10' : 'border-surface-border/70'
        }`}
      >
        {items.map((item) => (
          <div key={item.code} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <dt
              className={`font-mono font-semibold shrink-0 ${
                isDark ? 'text-primary-200' : 'text-navy-800'
              }`}
            >
              {item.code}
            </dt>
            <dd className={isDark ? 'text-slate-300' : 'text-ink-muted'}>{item.description}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
};
