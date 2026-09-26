'use client';

import { useState, type FormEvent } from 'react';
import { API_URL } from '@/lib/dataSource';
import { trackEvent } from '@/lib/analytics';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 1) return setError('Indiquez votre nom.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Indiquez une adresse email valide.');
    if (message.trim().length < 1) return setError('Votre message est vide.');

    setError('');
    setStatus('submitting');
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || undefined,
          message: message.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      trackEvent('contact_form_submitted', {});
    } catch {
      setStatus('error');
      setError('Une erreur est survenue. Réessayez ou contactez-nous directement.');
    }
  };

  if (status === 'success') {
    return (
      <div className="card-clay mt-8 text-center">
        <span className="chip chip-success mb-3">Envoyé</span>
        <p className="font-display text-lg font-bold text-foreground">Message envoyé !</p>
        <p className="mt-2 text-sm text-secondary">
          Notre équipe vous répondra par email dès que possible.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-clay mt-8 space-y-3">
      <h2 className="font-display text-lg font-bold text-foreground">Nous écrire</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold text-secondary">Nom</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-secondary">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold text-secondary">Sujet (optionnel)</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold text-secondary">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
        />
      </div>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">{error}</p>}

      <button type="submit" disabled={status === 'submitting'} className="btn-primary w-full">
        {status === 'submitting' ? 'Envoi…' : 'Envoyer'}
      </button>
    </form>
  );
}
