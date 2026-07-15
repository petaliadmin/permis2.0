'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Une erreur est survenue</h2>
        <p className="text-secondary mb-6">
          Quelque chose s&apos;est mal passé. Réessayez ou revenez plus tard.
        </p>
        <button onClick={reset} className="btn-violet">
          Réessayer
        </button>
      </div>
    </div>
  );
}
