'use client';

import { useState, type FormEvent } from 'react';
import { SchoolShell } from '@/components/SchoolShell';
import { PhoneInput } from '@/components/PhoneInput';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const inputCls =
  'h-11 w-full rounded-xl border border-token bg-surface-2 px-3.5 text-sm text-foreground placeholder:text-muted focus:border-primary-400 focus:outline-none';

interface CreateSchoolFormProps {
  /** Called after a successful creation so the parent can refetch /schools/mine. */
  onCreated: () => void;
}

export function CreateSchoolForm({ onCreated }: CreateSchoolFormProps) {
  const userName = useAuthStore((s) => s.user?.name);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappSame, setWhatsappSame] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const effectiveWhatsapp = whatsappSame ? phone : whatsapp;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError("Entrez le nom de l'auto-école (2 caractères min).");

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/schools`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim() || undefined,
          district: district.trim() || undefined,
          phone: phone || undefined,
          whatsapp: effectiveWhatsapp || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = Array.isArray(body?.message) ? body.message[0] : body?.message;
        throw new Error(msg || 'Une erreur est survenue. Réessayez.');
      }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SchoolShell>
      <div className="mx-auto max-w-lg px-4 py-12">
        <span className="chip chip-primary">Espace auto-école</span>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-foreground">
          {userName ? `Bienvenue, ${userName.split(' ')[0]}` : 'Créer mon auto-école'}
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Renseignez votre auto-école pour commencer. La fiche passe en validation, mais vous
          pouvez déjà gérer votre équipe, vos élèves et vos demandes de pré-inscription.
        </p>

        <form onSubmit={handleSubmit} className="card-clay mt-6 space-y-4">
          <div>
            <label htmlFor="school-name" className="mb-1 block text-xs font-bold text-secondary">
              Nom de l&apos;auto-école <span className="text-danger">*</span>
            </label>
            <input
              id="school-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Auto-École Réussite"
              autoFocus
              className={inputCls}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="school-city" className="mb-1 block text-xs font-bold text-secondary">
                Ville
              </label>
              <input
                id="school-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Dakar"
                className={inputCls}
              />
            </div>
            <div>
              <label
                htmlFor="school-district"
                className="mb-1 block text-xs font-bold text-secondary"
              >
                Quartier
              </label>
              <input
                id="school-district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Sacré-Cœur 3"
                className={inputCls}
              />
            </div>
          </div>

          <PhoneInput id="school-phone" label="Téléphone" value={phone} onChange={setPhone} />

          <label className="flex cursor-pointer items-center gap-2 text-sm text-secondary">
            <input
              type="checkbox"
              checked={whatsappSame}
              onChange={(e) => setWhatsappSame(e.target.checked)}
              className="h-4 w-4 rounded border-token accent-primary-600"
            />
            WhatsApp identique au téléphone
          </label>

          {!whatsappSame && (
            <PhoneInput id="school-whatsapp" label="WhatsApp" value={whatsapp} onChange={setWhatsapp} />
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">{error}</p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-40">
            {submitting ? 'Création…' : 'Créer mon auto-école'}
          </button>
        </form>
      </div>
    </SchoolShell>
  );
}
