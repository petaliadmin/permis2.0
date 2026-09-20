'use client';

import { useRef, useState } from 'react';
import type { School } from '@permis2.0/types';
import { LICENSE_CATEGORIES } from '@permis2.0/shared';
import { Sheet } from '@permis2.0/ui';
import { cn } from '@/lib/cn';
import { IconCamera, IconUpload, IconX } from '@tabler/icons-react';

const toPriceStrings = (prices?: Record<string, number> | null): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [code, value] of Object.entries(prices ?? {})) out[code] = String(value);
  return out;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const MAX_LOGO_DIMENSION = 512;

/** Downscales an image file client-side and returns it as a JPEG data URL — there's no
 * object storage yet, so the logo is stored inline as `School.logoUrl` (a TEXT column). */
function fileToResizedDataUrl(file: File, maxDimension = MAX_LOGO_DIMENSION): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas non supporté'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Impossible de lire l'image."));
    };
    img.src = objectUrl;
  });
}

interface SchoolSettingsSheetProps {
  open: boolean;
  onClose: () => void;
  school: School;
  /** Refetches /schools/mine so the updated name/logo/info flow back down. */
  onSaved: () => void;
}

export function SchoolSettingsSheet({ open, onClose, school, onSaved }: SchoolSettingsSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(() => ({
    name: school.name ?? '',
    city: school.city ?? '',
    district: school.district ?? '',
    address: school.address ?? '',
    description: school.description ?? '',
    phone: school.phone ?? '',
    whatsapp: school.whatsapp ?? '',
    email: school.email ?? '',
  }));
  const [logoUrl, setLogoUrl] = useState(school.logoUrl ?? '');
  const [logoError, setLogoError] = useState('');
  const [categories, setCategories] = useState<string[]>(school.licenseCategories ?? []);
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    toPriceStrings(school.pricesByCategory)
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Re-syncs the form whenever a fresh `school` prop lands while the sheet is open
  // (e.g. reopening for a different school) without fighting the user's own edits.
  const schoolIdRef = useRef(school.id);
  if (schoolIdRef.current !== school.id) {
    schoolIdRef.current = school.id;
    setForm({
      name: school.name ?? '',
      city: school.city ?? '',
      district: school.district ?? '',
      address: school.address ?? '',
      description: school.description ?? '',
      phone: school.phone ?? '',
      whatsapp: school.whatsapp ?? '',
      email: school.email ?? '',
    });
    setLogoUrl(school.logoUrl ?? '');
    setCategories(school.licenseCategories ?? []);
    setPrices(toPriceStrings(school.pricesByCategory));
  }

  const toggleCategory = (code: string) => {
    setCategories((cs) => (cs.includes(code) ? cs.filter((c) => c !== code) : [...cs, code]));
  };

  const onPickLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLogoError('');
    if (!file.type.startsWith('image/')) {
      setLogoError('Choisissez un fichier image.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setLogoError('Image trop lourde (max 8 Mo).');
      return;
    }
    try {
      setLogoUrl(await fileToResizedDataUrl(file));
    } catch {
      setLogoError("Impossible de traiter cette image.");
    }
  };

  const submit = async () => {
    if (!form.name.trim()) {
      setError("Le nom de l'auto-école est obligatoire.");
      return;
    }
    setBusy(true);
    setError('');
    try {
      const pricesByCategory: Record<string, number> = {};
      for (const code of categories) {
        const n = parseInt(prices[code] ?? '', 10);
        if (Number.isFinite(n) && n >= 0) pricesByCategory[code] = n;
      }

      const res = await fetch(`${API_URL}/schools/${school.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          city: form.city.trim() || undefined,
          district: form.district.trim() || undefined,
          address: form.address.trim() || undefined,
          description: form.description.trim() || undefined,
          phone: form.phone.trim() || undefined,
          whatsapp: form.whatsapp.trim() || undefined,
          email: form.email.trim() || undefined,
          logoUrl: logoUrl || undefined,
          licenseCategories: categories,
          pricesByCategory,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Une erreur est survenue.');
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} ariaLabel="Modifier les informations de l'auto-école">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold text-foreground">Infos de l&apos;auto-école</p>
          <p className="mt-1 text-xs text-secondary">
            Ces informations apparaissent sur votre fiche publique dans l&apos;annuaire.
          </p>
        </div>
        {/* lg: and up gets Sheet's own built-in close button (top-right corner) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-secondary hover:bg-surface-2 lg:hidden"
        >
          <IconX size="1em" className="text-lg" aria-hidden="true" />
        </button>
      </div>

      {/* Logo */}
      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-2xl font-black text-white"
          aria-label="Changer le logo"
        >
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span>🏫</span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <IconCamera size="1em" className="text-xl text-white" aria-hidden="true" />
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onPickLogo}
            className="hidden"
          />
          <button onClick={() => fileInputRef.current?.click()} className="btn-ghost !px-4 !py-2 text-xs">
            <IconUpload size="1em" aria-hidden="true" />
            {logoUrl ? 'Changer le logo' : 'Ajouter un logo'}
          </button>
          {logoUrl && (
            <button
              onClick={() => setLogoUrl('')}
              className="ml-2 text-xs font-semibold text-danger"
            >
              Retirer
            </button>
          )}
          {logoError && <p className="mt-1.5 text-xs font-medium text-danger">{logoError}</p>}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-secondary">Nom de l&apos;auto-école</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Ville</label>
            <input
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Quartier</label>
            <input
              value={form.district}
              onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-secondary">Adresse</label>
          <input
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Téléphone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="77 123 45 67"
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">WhatsApp</label>
            <input
              value={form.whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
              placeholder="77 123 45 67"
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-secondary">
            Présentation de l&apos;auto-école
          </label>
          <p className="mb-1 text-xs text-secondary">
            Ce texte apparaît sur votre fiche publique — parlez de votre équipe, votre expérience,
            ce qui vous distingue.
          </p>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            maxLength={800}
            rows={4}
            placeholder="Depuis 20XX, notre équipe accompagne les élèves de..."
            className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
          />
          <p className="mt-1 text-right text-[11px] text-muted">{form.description.length}/800</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-secondary">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-secondary">Permis proposés & tarifs</label>
          <p className="mb-2 text-xs text-secondary">
            Sélectionnez les catégories que vous formez, puis indiquez votre tarif pour chacune.
          </p>
          <div className="flex flex-wrap gap-2">
            {LICENSE_CATEGORIES.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => toggleCategory(code)}
                title={label}
                className={cn('chip', categories.includes(code) ? 'chip-primary' : 'bg-surface-2 text-secondary')}
              >
                Permis {code}
              </button>
            ))}
          </div>

          {categories.length > 0 && (
            <div className="mt-3 space-y-2">
              {categories.map((code) => (
                <div key={code} className="flex items-center gap-3">
                  <span className="w-8 shrink-0 text-center font-display text-sm font-black text-primary-600">
                    {code}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-secondary">
                    {LICENSE_CATEGORIES.find((c) => c.code === code)?.label ?? code}
                  </span>
                  <div className="relative w-32 shrink-0">
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={prices[code] ?? ''}
                      onChange={(e) => setPrices((p) => ({ ...p, [code]: e.target.value }))}
                      placeholder="Prix"
                      className="w-full rounded-xl border border-token bg-surface-2 py-2 pl-3 pr-14 text-sm focus:border-primary-400 focus:outline-none"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted">
                      FCFA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">{error}</p>
      )}

      <button disabled={busy} onClick={submit} className="btn-primary mt-4 w-full">
        {busy ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </Sheet>
  );
}
