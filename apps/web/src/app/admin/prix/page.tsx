'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sheet, Skeleton } from '@permis2.0/ui';
import { adminFetch, Toast, useToast, AdminPageHeader } from '../adminShared';
import { IconPlus, IconTrash } from '@tabler/icons-react';

interface PermitPrice {
  id: string;
  city: string;
  category: string;
  priceXof: number;
  note: string | null;
  updatedAt: string;
}

interface FormState {
  id?: string;
  city: string;
  category: string;
  priceXof: string;
  note: string;
}

const CATEGORIES = [
  { code: 'A', label: 'A — Motos et scooters' },
  { code: 'B', label: 'B — Véhicules légers' },
  { code: 'C', label: 'C — Poids lourds' },
  { code: 'D', label: 'D — Transport en commun' },
  { code: 'E', label: 'E — Remorques et attelages' },
];

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

export default function AdminPrixPage() {
  const [toast, flash] = useToast();
  const [prices, setPrices] = useState<PermitPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<PermitPrice | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminFetch<PermitPrice[]>('/permit-prices')
      .then(setPrices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const blank = (): FormState => ({
    city: '',
    category: CATEGORIES[1].code,
    priceXof: '',
    note: '',
  });

  const toForm = (p: PermitPrice): FormState => ({
    id: p.id,
    city: p.city,
    category: p.category,
    priceXof: String(p.priceXof),
    note: p.note ?? '',
  });

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const body = {
        city: form.city.trim(),
        category: form.category,
        priceXof: parseInt(form.priceXof, 10),
        note: form.note.trim() || undefined,
      };
      if (form.id) {
        await adminFetch(`/admin/permit-prices/${form.id}`, { method: 'PATCH', json: body });
        flash('Tarif mis à jour.');
      } else {
        await adminFetch('/admin/permit-prices', { json: body });
        flash('Tarif créé.');
      }
      setForm(null);
      load();
    } catch (e: any) {
      flash(e.message);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (p: PermitPrice) => {
    setConfirmDelete(null);
    try {
      await adminFetch(`/admin/permit-prices/${p.id}`, { method: 'DELETE' });
      flash('Tarif supprimé.');
      load();
    } catch (e: any) {
      flash(e.message);
    }
  };

  const INPUT =
    'mt-1 h-11 w-full rounded-xl border border-token bg-surface-2 px-3 text-sm text-foreground focus:outline-none';

  return (
    <>
      <AdminPageHeader
        title="Tarifs du permis"
        subtitle={`${prices.length} tarif${prices.length > 1 ? 's' : ''} — affichés sur /prix-permis-conduire-senegal`}
        actions={
          <button onClick={() => setForm(blank())} className="btn-primary px-5 py-2.5 text-sm">
            <IconPlus size="1em" aria-hidden="true" /> Nouveau tarif
          </button>
        }
      />

      <p className="mb-4 text-xs text-secondary">
        Ce tableau alimente directement la page publique /prix-permis-conduire-senegal. Tant
        qu'il est vide, la page ne montre aucun prix — aucune valeur n'y est jamais inventée.
      </p>

      {loading && <Skeleton className="h-60 w-full rounded-2xl" />}

      {!loading && prices.length === 0 && (
        <p className="rounded-2xl border border-token bg-surface-1 p-6 text-center text-sm text-secondary">
          Aucun tarif enregistré pour l'instant.
        </p>
      )}

      {!loading && prices.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-token bg-surface-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Mis à jour</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-token">
              {prices.map((p) => (
                <tr
                  key={p.id}
                  className="cursor-pointer hover:bg-surface-2"
                  onClick={() => setForm(toForm(p))}
                >
                  <td className="px-4 py-3 font-semibold text-foreground">{p.city}</td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{fmtXof(p.priceXof)}</td>
                  <td className="px-4 py-3 text-secondary">{p.note ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {new Date(p.updatedAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(p);
                      }}
                      aria-label={`Supprimer le tarif ${p.city} ${p.category}`}
                      className="rounded-lg p-2 text-secondary hover:bg-red-50 hover:text-red-600"
                    >
                      <IconTrash size="1em" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / edit sheet ── */}
      <Sheet open={!!form} onClose={() => setForm(null)} ariaLabel="Éditer le tarif">
        {form && (
          <div className="pb-2">
            <h3 className="font-display text-lg font-bold text-foreground">
              {form.id ? 'Modifier le tarif' : 'Nouveau tarif'}
            </h3>

            <label className="mt-4 block text-xs font-medium text-foreground">Ville</label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Dakar"
              className={INPUT}
            />

            <label className="mt-3 block text-xs font-medium text-foreground">Catégorie</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={INPUT}
            >
              {CATEGORIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>

            <label className="mt-3 block text-xs font-medium text-foreground">Prix (FCFA)</label>
            <input
              type="number"
              min={0}
              value={form.priceXof}
              onChange={(e) => setForm({ ...form, priceXof: e.target.value })}
              placeholder="150000"
              className={INPUT}
            />

            <label className="mt-3 block text-xs font-medium text-foreground">
              Note (optionnel)
            </label>
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Code + conduite"
              className={INPUT}
            />

            <button
              onClick={save}
              disabled={
                saving ||
                form.city.trim().length < 2 ||
                !form.priceXof ||
                Number(form.priceXof) < 0
              }
              className="btn-primary mt-5 w-full disabled:opacity-40"
            >
              {saving ? 'Enregistrement…' : form.id ? 'Enregistrer' : 'Créer le tarif'}
            </button>
          </div>
        )}
      </Sheet>

      {/* ── Delete confirmation ── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-surface-1 p-6 shadow-card-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold text-foreground">Supprimer ce tarif ?</h3>
            <p className="mt-2 text-sm text-secondary">
              {confirmDelete.city} — catégorie {confirmDelete.category}
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost flex-1">
                Annuler
              </button>
              <button
                onClick={() => doDelete(confirmDelete)}
                className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} />
    </>
  );
}
