import React from 'react';
import { cn } from './utils/cn';

/**
 * Shimmering placeholder shown while content loads. Uses the `shimmer`
 * keyframe defined in the app Tailwind config for a native-feel loading state.
 */
const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-xl bg-surface-3',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer',
        'after:bg-gradient-to-r after:from-transparent after:via-foreground/[0.06] after:to-transparent',
        className
      )}
      {...props}
    />
  )
);
Skeleton.displayName = 'Skeleton';

export { Skeleton };
