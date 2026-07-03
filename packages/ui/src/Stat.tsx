import React from 'react';
import { cn } from './utils/cn';

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Emoji or icon node shown in the colored bubble */
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  /** Tailwind classes for the icon bubble background, e.g. "bg-primary-100 text-primary-700" */
  accent?: string;
}

const Stat = React.forwardRef<HTMLDivElement, StatProps>(
  ({ className, icon, label, value, accent = 'bg-primary-100 text-primary-700', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-4 rounded-2xl border border-token bg-surface-2 p-4 shadow-card',
        className
      )}
      {...props}
    >
      {icon != null && (
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl',
            accent
          )}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-extrabold leading-none text-foreground">
          {value}
        </p>
      </div>
    </div>
  )
);
Stat.displayName = 'Stat';

export { Stat };
