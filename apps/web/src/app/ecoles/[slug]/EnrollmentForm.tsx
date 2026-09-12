'use client';

import { useState, type FormEvent } from 'react';
import type { School } from '@permis2.0/types';
import { API_URL } from '@/lib/dataSource';
import { isValidSnPhone } from '@/store/authStore';
import { trackEvent } from '@/lib/analytics';

interface EnrollmentFormProps {
  school: School;
}

const CITIES = ['Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Touba', 'Mbour', 'Kaolack', 'Autre'];

export function EnrollmentForm({ school }: EnrollmentFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [licenseCategory, setLicenseCategory] = useState(school.licenseCategories[0] ?? '');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (firstName.trim().length < 1) return setError('Indiquez votre prénom.');
    if (lastName.trim().length < 1) return setError('Indiquez votre nom.');
    if (!isValidSnPhone(phone)) return setError('Numéro sénégalais invalide (ex : 77, 78, 76, 70…).');

    setError('');
    setStatus('submitting');
    try {
      const res = await fetch(`${API_URL}/schools/${school.id}/enrollment-requests`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone,
          whatsapp: whatsapp || undefined,
          email: email || undefined,
          city: city || undefined,
          licenseCategory: licenseCategory || undefined,
          message: message || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      trackEvent('school_contacted', { school_id: school.id, school_name: school.name });
    } catch {
      setStatus('error');
      setError('Une erreur est survenue. Réessayez ou contactez-nous directement.');
    }
  };

  if (status === 'success') {
    return (
      <div className="card-clay text-center">
        <span className="chip chip-success mb-3">Envoyée</span>
        <p className="font-display text-lg font-bold text-foreground">Demande envoyée !</p>
        <p className="mt-2 text-sm text-secondary">
          {school.name} va examiner votre pré-inscription et vous recontactera bientôt.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-clay space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold text-secondary">Prénom</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-secondary">Nom</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-secondary">Téléphone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="77 123 45 67"
            className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-secondary">WhatsApp (optionnel)</label>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="77 123 45 67"
            className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-secondary">Email (optionnel)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-secondary">Ville</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
          >
            <option value="">Sélectionner</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {school.licenseCategories.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-bold text-secondary">Permis souhaité</label>
          <div className="flex flex-wrap gap-2">
            {school.licenseCategories.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setLicenseCategory(c)}
                className={`chip ${licenseCategory === c ? 'chip-primary' : 'bg-surface-2 text-secondary'}`}
              >
                Permis {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-bold text-secondary">Message (optionnel)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
        />
      </div>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">{error}</p>}

      <button type="submit" disabled={status === 'submitting'} className="btn-primary w-full">
        {status === 'submitting' ? 'Envoi…' : 'Envoyer ma pré-inscription'}
      </button>
    </form>
  );
}
