import React from 'react';
import { cn } from './utils/cn';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Large emoji or icon node shown above the title */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Optional call-to-action rendered below the description (e.g. a Button) */
  action?: React.ReactNode;
}

/**
 * Centered empty state for lists/screens with no content. Mirrors the calm,
 * minimal feel of the maquette rather than a stark "no data" message.
 */
const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}
      {...props}
    >
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-surface-2 text-3xl">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };
