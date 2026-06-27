import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-white',
        secondary: 'border-transparent bg-secondary text-dark',
        danger: 'border-transparent bg-danger text-white',
        success: 'border-transparent bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
        muted: 'border-transparent bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        outline: 'border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
