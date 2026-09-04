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
    <div>
      <span className="chip chip-primary">Mot de passe</span>
      <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground sm:text-3xl">
        Mot de passe oublié
      </h1>
      <p className="mt-2 text-sm text-secondary">
        Saisis ton adresse email et nous t&apos;enverrons un lien de réinitialisation.
      </p>

      {status === 'sent' ? (
        <div className="mt-6 space-y-5">
          <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
            {message}
          </div>
          <Link
            href="/auth/login"
            className="block text-center font-semibold text-primary-600 hover:underline"
          >
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="votre@email.com"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={status === 'loading'}>
            {status === 'loading' ? 'Envoi…' : 'Envoyer le lien'}
          </Button>

          <p className="text-center text-sm text-secondary">
            <Link href="/auth/login" className="font-semibold text-primary-600 hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
