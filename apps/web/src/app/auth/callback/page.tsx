'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@permis2.0/ui';
import { useAuthStore } from '@/store/authStore';

/**
 * OAuth landing page (Sprint 7). The API sets an httpOnly cookie and redirects
 * here after Google sign-in. We fetch /auth/me to populate the store and then
 * bounce to the Code tab.
 */
function AuthCallbackInner() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('auth_failed');
        const user = await res.json();
        setUser(user);
        router.replace('/code');
      })
      .catch(() => setError('La connexion a échoué. Veuillez réessayer.'));
  }, [setUser, router]);

  if (error) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-danger">{error}</p>
        <button
          onClick={() => router.replace('/auth/login')}
          className="font-semibold text-primary hover:underline"
        >
          Retour à la connexion
        </button>
      </div>
    );
  }

  return <LoadingState label="Connexion en cours…" />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AuthCallbackInner />
    </Suspense>
  );
}
