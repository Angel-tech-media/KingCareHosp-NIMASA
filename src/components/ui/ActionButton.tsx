import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 hover:bg-primary-700 text-white border border-transparent shadow-sm',
  secondary:
    'bg-surface-card hover:bg-primary-50/50 text-ink-secondary hover:text-ink-primary border border-surface-border-strong hover:border-primary-300 shadow-card',
  dark:
    'bg-slate-900 hover:bg-slate-800 text-white border border-transparent shadow-sm',
  ghost:
    'bg-transparent hover:bg-surface-subtle text-ink-secondary hover:text-ink-primary border border-transparent',
  danger:
    'bg-red-600 hover:bg-red-700 text-white border border-transparent shadow-sm',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
    </button>
  );
};
