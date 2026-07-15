import React from 'react';
import { cn } from './utils/cn';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const barColors: Record<NonNullable<ProgressProps['variant']>, string> = {
  primary: 'bg-gradient-primary',
  secondary: 'bg-secondary',
  danger: 'bg-danger',
};

const trackSizes: Record<NonNullable<ProgressProps['size']>, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, variant = 'primary', size = 'md', ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-surface-3',
          trackSizes[size],
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-700 ease-out',
            barColors[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
