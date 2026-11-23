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
      className="border-b border-surface-border flex items-center gap-6 overflow-x-auto"
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
            className={`relative pb-3 pt-1 text-sm font-medium whitespace-nowrap transition-colors inline-flex items-center gap-2 ${
              selected
                ? 'text-ink-primary'
                : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full tabular-nums ${
                  selected
                    ? 'bg-navy-900 text-white font-semibold'
                    : 'bg-surface-subtle text-ink-muted'
                }`}
              >
                {tab.count}
              </span>
            )}
            {selected && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 inset-x-0 h-0.5 bg-navy-900 rounded-full"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
