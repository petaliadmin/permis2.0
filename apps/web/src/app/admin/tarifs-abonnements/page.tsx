'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sheet, Skeleton } from '@permis2.0/ui';
import { adminFetch, Toast, useToast, AdminPageHeader, fmtXof } from '../adminShared';
import { IconPlus, IconTrash } from '@tabler/icons-react';

type SubscriptionType = 'STUDENT' | 'SCHOOL' | 'SCHOOL_FEATURED';

interface SubscriptionPlan {
  id: string;
  type: SubscriptionType;
  title: string;
  description: string | null;
  priceXof: number;
  durationDays: number;
  active: boolean;
  ordre: number;
  updatedAt: string;
}

interface FormState {
  id?: string;
  type: SubscriptionType;
  title: string;
  description: string;
  priceXof: string;
  durationDays: string;
  active: boolean;
  ordre: string;
}

const TYPES: { code: SubscriptionType; label: string }[] = [
  { code: 'STUDENT', label: 'Élève' },
  { code: 'SCHOOL', label: 'Auto-école' },
  { code: 'SCHOOL_FEATURED', label: 'Top auto-école (mise en avant)' },
];

const typeLabel = (t: SubscriptionType) => TYPES.find((x) => x.code === t)?.label ?? t;

export default function AdminTarifsAbonnementsPage() {
  const [toast, flash] = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<SubscriptionPlan | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminFetch<SubscriptionPlan[]>('/admin/subscription-plans')
      .then(setPlans)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const blank = (): FormState => ({
    type: 'STUDENT',
    title: '',
    description: '',
    priceXof: '',
    durationDays: '',
    active: true,
    ordre: '0',
  });

  const toForm = (p: SubscriptionPlan): FormState => ({
    id: p.id,
    type: p.type,
    title: p.title,
    description: p.description ?? '',
    priceXof: String(p.priceXof),
    durationDays: String(p.durationDays),
    active: p.active,
    ordre: String(p.ordre),
  });

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const body = {
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priceXof: parseInt(form.priceXof, 10),
        durationDays: parseInt(form.durationDays, 10),
        active: form.active,
        ordre: parseInt(form.ordre, 10) || 0,
      };
      if (form.id) {
        await adminFetch(`/admin/subscription-plans/${form.id}`, { method: 'PATCH', json: body });
        flash('Plan mis à jour.');
      } else {
        await adminFetch('/admin/subscription-plans', { json: body });
        flash('Plan créé.');
      }
      setForm(null);
      load();
    } catch (e: any) {
      flash(e.message);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (p: SubscriptionPlan) => {
    setConfirmDelete(null);
    try {
      await adminFetch(`/admin/subscription-plans/${p.id}`, { method: 'DELETE' });
      flash('Plan supprimé.');
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
        title="Tarifs abonnements"
        subtitle={`${plans.length} plan${plans.length > 1 ? 's' : ''} — élève / auto-école / mise en avant`}
        actions={
          <button onClick={() => setForm(blank())} className="btn-primary px-5 py-2.5 text-sm">
            <IconPlus size="1em" aria-hidden="true" /> Nouveau plan
          </button>
        }
      />

      {loading && <Skeleton className="h-60 w-full rounded-2xl" />}

      {!loading && plans.length === 0 && (
        <p className="rounded-2xl border border-token bg-surface-1 p-6 text-center text-sm text-secondary">
          Aucun plan d&apos;abonnement enregistré pour l&apos;instant.
        </p>
      )}

      {!loading && plans.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-token bg-surface-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Titre</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Durée</th>
                <th className="px-4 py-3">Actif</th>
                <th className="px-4 py-3">Mis à jour</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-token">
              {plans.map((p) => (
                <tr
                  key={p.id}
                  className="cursor-pointer hover:bg-surface-2"
                  onClick={() => setForm(toForm(p))}
                >
                  <td className="px-4 py-3 font-semibold text-foreground">{typeLabel(p.type)}</td>
                  <td className="px-4 py-3">{p.title}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{fmtXof(p.priceXof)}</td>
                  <td className="px-4 py-3 text-secondary">{p.durationDays} j</td>
                  <td className="px-4 py-3">
                    {p.active ? (
                      <span className="rounded-full bg-success-50 px-2.5 py-1 text-xs font-bold text-success-700">
                        Actif
                      </span>
                    ) : (
                      <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold text-muted">
                        Inactif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {new Date(p.updatedAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(p);
                      }}
                      aria-label={`Supprimer le plan ${p.title}`}
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
      <Sheet open={!!form} onClose={() => setForm(null)} ariaLabel="Éditer le plan d'abonnement">
        {form && (
          <div className="pb-2">
            <h3 className="font-display text-lg font-bold text-foreground">
              {form.id ? 'Modifier le plan' : 'Nouveau plan'}
            </h3>

            <label className="mt-4 block text-xs font-medium text-foreground">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as SubscriptionType })}
              className={INPUT}
            >
              {TYPES.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>

            <label className="mt-3 block text-xs font-medium text-foreground">Titre</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Abonnement Annuel"
              className={INPUT}
            />

            <label className="mt-3 block text-xs font-medium text-foreground">
              Description (optionnel)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className={`${INPUT} h-auto py-2`}
            />

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground">Prix (FCFA)</label>
                <input
                  type="number"
                  min={0}
                  value={form.priceXof}
                  onChange={(e) => setForm({ ...form, priceXof: e.target.value })}
                  placeholder="2900"
                  className={INPUT}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground">Durée (jours)</label>
                <input
                  type="number"
                  min={1}
                  value={form.durationDays}
                  onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                  placeholder="365"
                  className={INPUT}
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground">Ordre</label>
                <input
                  type="number"
                  value={form.ordre}
                  onChange={(e) => setForm({ ...form, ordre: e.target.value })}
                  className={INPUT}
                />
              </div>
              <label className="mt-6 flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="h-4 w-4"
                />
                Actif (visible côté client)
              </label>
            </div>

            <button
              onClick={save}
              disabled={
                saving ||
                form.title.trim().length < 2 ||
                !form.priceXof ||
                Number(form.priceXof) < 0 ||
                !form.durationDays ||
                Number(form.durationDays) < 1
              }
              className="btn-primary mt-5 w-full disabled:opacity-40"
            >
              {saving ? 'Enregistrement…' : form.id ? 'Enregistrer' : 'Créer le plan'}
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
            <h3 className="font-display text-lg font-bold text-foreground">Supprimer ce plan ?</h3>
            <p className="mt-2 text-sm text-secondary">
              {confirmDelete.title} — {typeLabel(confirmDelete.type)}
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
