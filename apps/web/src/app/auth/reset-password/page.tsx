'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, LoadingState } from '@permis2.0/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Lien invalide ou expiré.');
      }
      setStatus('done');
      setTimeout(() => router.replace('/auth/login'), 1800);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
      setStatus('idle');
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-gradient-hero px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(3rem+env(safe-area-inset-top))]">
      <div className="mx-auto mb-6 w-full max-w-md text-center text-white">
        <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl font-black shadow-soft backdrop-blur">
          P
        </span>
        <h1 className="text-3xl font-extrabold">
          PERMIS<span className="text-secondary">2.0</span>
        </h1>
      </div>

      <div className="mx-auto w-full max-w-md rounded-3xl bg-surface-2 border border-token p-6 shadow-2xl animate-fade-in sm:p-8">
        <h2 className="mb-1 text-xl font-extrabold text-foreground">
          Nouveau mot de passe
        </h2>

        {!token ? (
          <div className="mt-4 space-y-5">
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              Lien de réinitialisation invalide.
            </div>
            <Link href="/auth/forgot-password" className="block text-center font-semibold text-primary hover:underline">
              Demander un nouveau lien
            </Link>
          </div>
        ) : status === 'done' ? (
          <div className="mt-4 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary-300">
            Mot de passe réinitialisé avec succès. Redirection vers la connexion…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-5">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-secondary">
                Nouveau mot de passe
              </label>
              <Input id="password" name="password" type="password" required placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} disabled={status === 'loading'} />
            </div>

            <div>
              <label htmlFor="confirm" className="mb-2 block text-sm font-medium text-secondary">
                Confirmer le mot de passe
              </label>
              <Input id="confirm" name="confirm" type="password" required placeholder="••••••••"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={status === 'loading'} />
            </div>

            {error && (
              <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={status === 'loading'}>
              {status === 'loading' ? 'Réinitialisation…' : 'Réinitialiser'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResetPasswordInner />
    </Suspense>
  );
}
