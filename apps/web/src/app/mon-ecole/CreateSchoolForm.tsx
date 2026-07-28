'use client';

import { useState, type FormEvent } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface CreateSchoolFormProps {
  /** Called after a successful creation so the parent can refetch /schools/mine. */
  onCreated: () => void;
}

export function CreateSchoolForm({ onCreated }: CreateSchoolFormProps) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Le nom de l'auto-école est trop court.");

    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/schools`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          city: city || undefined,
          district: district || undefined,
          phone: phone || undefined,
          whatsapp: whatsapp || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      onCreated();
    } catch {
      setError('Une erreur est survenue. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="font-display text-2xl font-extrabold text-foreground">
          Créer mon auto-école
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Votre fiche sera d&apos;abord en attente de validation, mais vous pouvez déjà gérer votre
          équipe et vos demandes.
        </p>

        <form onSubmit={handleSubmit} className="card-clay mt-6 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Nom de l&apos;auto-école</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Auto-École Réussite"
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-secondary">Ville</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-secondary">Quartier</label>
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-secondary">Téléphone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+221 77 123 45 67"
                className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-secondary">WhatsApp</label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+221 77 123 45 67"
                className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">{error}</p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Création…' : 'Créer mon auto-école'}
          </button>
        </form>
      </div>
      <SiteFooter />
    </div>
  );
}
