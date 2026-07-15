'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@permis2.0/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      setMessage(
        data.message ||
          'Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.'
      );
      setStatus('sent');
    } catch {
      setMessage('Une erreur est survenue. Veuillez réessayer.');
      setStatus('sent');
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
        <h2 className="mb-1 text-xl font-extrabold text-foreground">Mot de passe oublié</h2>
        <p className="mb-6 text-sm text-muted">
          Saisis ton adresse email et nous t&apos;enverrons un lien de réinitialisation.
        </p>

        {status === 'sent' ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary-300">
              {message}
            </div>
            <Link
              href="/auth/login"
              className="block text-center font-semibold text-primary hover:underline"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-secondary">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={status === 'loading'}>
              {status === 'loading' ? 'Envoi…' : 'Envoyer le lien'}
            </Button>

            <p className="text-center text-sm text-slate-400">
              <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
