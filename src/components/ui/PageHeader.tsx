import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-1">
    <div className="min-w-0">
      <h1 className="text-2xl sm:text-[28px] leading-tight font-semibold tracking-tight text-ink-primary">
        {title}
      </h1>
      {subtitle && (
        <div className="text-sm text-ink-muted mt-1.5">{subtitle}</div>
      )}
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>
    )}
  </div>
);
