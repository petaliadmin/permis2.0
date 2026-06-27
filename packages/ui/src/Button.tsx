import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-primary text-white shadow-soft hover:shadow-glow hover:brightness-105',
        secondary:
          'bg-secondary text-dark shadow-soft hover:bg-secondary-500',
        danger:
          'bg-danger text-white shadow-soft hover:bg-danger-700',
        outline:
          'border border-slate-300 bg-white text-slate-800 hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-dark-800 dark:text-slate-100 dark:hover:border-primary',
        ghost:
          'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-dark-800',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        xl: 'h-14 rounded-2xl px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
