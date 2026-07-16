import React from 'react';
import { cn } from './utils/cn';
import { EmptyState } from './EmptyState';

/**
 * Full-screen-ish spinner for transient loading. Kept lightweight; for list
 * placeholders prefer <Skeleton /> instead.
 */
export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ className, label = 'Chargement…', ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center justify-center gap-4 py-16', className)}
      {...props}
    >
      <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-surface-3 border-t-primary" />
      <p className="text-sm font-medium text-muted">{label}</p>
    </div>
  )
);
LoadingState.displayName = 'LoadingState';

/**
 * Shown when the device is offline. Optionally exposes a retry action.
 */
export interface OfflineStateProps {
  onRetry?: () => void;
  className?: string;
}

function OfflineState({ onRetry, className }: OfflineStateProps) {
  return (
    <EmptyState
      className={className}
      icon={<span>📡</span>}
      title="Vous êtes hors ligne"
      description="Vérifiez votre connexion. Le contenu gratuit déjà téléchargé reste disponible."
      action={
        onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all active:scale-[0.98]"
          >
            Réessayer
          </button>
        ) : undefined
      }
    />
  );
}

export { LoadingState, OfflineState };
