import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
}

export const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  widthClass = 'max-w-lg',
}) => {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
      />
      <div
        className={`relative z-10 w-full ${widthClass} bg-surface-card h-full shadow-2xl border-l border-surface-border flex flex-col`}
      >
        <div className="px-6 py-5 border-b border-surface-border flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-ink-primary">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="p-1.5 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-subtle transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-surface-border bg-surface-canvas flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
