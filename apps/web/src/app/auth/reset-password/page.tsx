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
    <div>
      <span className="chip chip-primary">Mot de passe</span>
      <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground sm:text-3xl">
        Nouveau mot de passe
      </h1>

      {!token ? (
        <div className="mt-6 space-y-5">
          <div className="rounded-xl border border-danger/30 bg-danger-50 px-4 py-3 text-sm text-danger">
            Lien de réinitialisation invalide.
          </div>
          <Link
            href="/auth/forgot-password"
            className="block text-center font-semibold text-primary-600 hover:underline"
          >
            Demander un nouveau lien
          </Link>
        </div>
      ) : status === 'done' ? (
        <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
          Mot de passe réinitialisé avec succès. Redirection vers la connexion…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
              Nouveau mot de passe
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={status === 'loading'}
            />
          </div>

          <div>
            <label htmlFor="confirm" className="mb-2 block text-sm font-medium text-foreground">
              Confirmer le mot de passe
            </label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              required
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={status === 'loading'}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger-50 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={status === 'loading'}>
            {status === 'loading' ? 'Réinitialisation…' : 'Réinitialiser'}
          </Button>
        </form>
      )}
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
