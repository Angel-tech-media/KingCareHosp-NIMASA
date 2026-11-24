import React from 'react';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}

export function Tabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/75 backdrop-blur-sm border border-surface-border/80 shadow-card overflow-x-auto max-w-full"
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all inline-flex items-center gap-2 ${
              selected
                ? 'bg-navy-800 text-white shadow-sm'
                : 'text-ink-muted hover:text-ink-primary hover:bg-surface-canvas/80'
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full tabular-nums ${
                  selected
                    ? 'bg-white/20 text-white font-semibold'
                    : 'bg-surface-subtle text-ink-muted font-medium'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
