import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => (
  <div
    aria-hidden="true"
    className={`animate-pulse rounded bg-slate-200/80 ${className}`}
  />
);

export const CardSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading summary card"
    className="bg-surface-card rounded-lg border border-surface-border p-5 shadow-card space-y-3"
  >
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-8 w-20" />
    <Skeleton className="h-3 w-40" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading table rows"
    className="divide-y divide-surface-border"
  >
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div
        key={rowIdx}
        className="p-4 grid gap-4 items-center"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((__, colIdx) => (
          <Skeleton
            key={colIdx}
            className={colIdx === 0 ? 'h-4 w-20' : 'h-4 w-full'}
          />
        ))}
      </div>
    ))}
  </div>
);
