'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Sheet, Skeleton } from '@permis2.0/ui';
import { adminFetch, useAdminGuard, AccessDenied, Toast, useToast } from '../adminShared';

interface Serie {
  id: string;
  name: string;
  description: string;
  code: string;
  isFree: boolean;
  _count: { questions: number };
}

type FormState = { id?: string; name: string; description: string; code: string; isFree: boolean };
const EMPTY: FormState = { name: '', description: '', code: '', isFree: false };

export default function AdminSeriesPage() {
  const allowed = useAdminGuard();
  const [toast, flash] = useToast();
  const [series, setSeries] = useState<Serie[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Serie | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminFetch<Serie[]>('/admin/series')
      .then(setSeries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        code: form.code.trim().toUpperCase(),
        isFree: form.isFree,
      };
      if (form.id) {
        await adminFetch(`/admin/series/${form.id}`, { method: 'PATCH', json: body });
        flash('Série mise à jour.');
      } else {
        await adminFetch('/admin/series', { json: body });
        flash('Série créée.');
      }
      setForm(null);
      load();
    } catch (e: any) {
      flash(e.message);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (s: Serie) => {
    setConfirmDelete(null);
    try {
      await adminFetch(`/admin/series/${s.id}`, { method: 'DELETE' });
      flash(`Série ${s.code} supprimée.`);
      load();
    } catch (e: any) {
      flash(e.message);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Séries (examens)"
        subtitle={`${series.length} séries d'entraînement`}
        accent="orange"
        back="/admin"
        compact
        actions={
          <button
            onClick={() => setForm(EMPTY)}
            className="flex h-9 items-center gap-1 rounded-full bg-white/15 px-3 text-xs font-bold"
          >
            <i className="ti ti-plus" aria-hidden="true" /> Nouvelle
          </button>
        }
      />

      <div className="px-4 pb-8 pt-5">
        {allowed === false && <AccessDenied />}
        {allowed && loading && <Skeleton className="h-40 w-full rounded-2xl" />}
        {allowed && !loading && (
          <div className="space-y-2.5">
            {series.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-token bg-surface-1 p-3.5 shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 font-display text-sm font-black text-orange-600">
                    {s.code}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{s.name}</p>
                    <p className="truncate text-xs text-secondary">
                      {s._count.questions} questions · {s.isFree ? 'Gratuite' : 'Premium'}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => setForm({ ...s })}
                    className="flex-1 rounded-xl bg-surface-2 py-2 text-xs font-bold text-secondary hover:bg-orange-50 hover:text-orange-600"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => setConfirmDelete(s)}
                    className="flex-1 rounded-xl bg-red-50 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create / edit sheet ── */}
      <Sheet open={!!form} onClose={() => setForm(null)} ariaLabel="Éditer la série">
        {form && (
          <div className="pb-4">
            <h3 className="font-display text-lg font-bold text-foreground">
              {form.id ? 'Modifier la série' : 'Nouvelle série'}
            </h3>

            <label className="mt-4 block text-sm font-medium text-foreground">Nom</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Série 4"
              className="mt-1.5 h-12 w-full rounded-2xl border border-token bg-surface-2 px-4 text-sm text-foreground focus:outline-none"
            />

            <label className="mt-3 block text-sm font-medium text-foreground">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Quatrième série de 25 questions"
              className="mt-1.5 h-12 w-full rounded-2xl border border-token bg-surface-2 px-4 text-sm text-foreground focus:outline-none"
            />

            <div className="mt-3 flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground">Code unique</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="B4"
                  className="mt-1.5 h-12 w-full rounded-2xl border border-token bg-surface-2 px-4 font-mono text-sm uppercase text-foreground focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground">Accès</label>
                <button
                  onClick={() => setForm({ ...form, isFree: !form.isFree })}
                  className={`mt-1.5 h-12 w-full rounded-2xl border-2 text-sm font-bold ${form.isFree ? 'border-success-500 bg-success-50 text-success-700' : 'border-orange-400 bg-orange-50 text-orange-600'}`}
                >
                  {form.isFree ? 'Gratuite' : 'Premium'}
                </button>
              </div>
            </div>

            <button
              onClick={save}
              disabled={saving || !form.name.trim() || !form.code.trim()}
              className="btn-primary mt-5 w-full disabled:opacity-40"
            >
              {saving ? 'Enregistrement…' : form.id ? 'Enregistrer' : 'Créer la série'}
            </button>
          </div>
        )}
      </Sheet>

      {/* ── Delete confirmation ── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-surface-1 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold text-foreground">
              Supprimer la série {confirmDelete.code} ?
            </h3>
            <p className="mt-2 text-sm text-secondary">
              {confirmDelete._count.questions > 0
                ? `Impossible tant qu'elle contient ${confirmDelete._count.questions} questions.`
                : 'Cette action est définitive.'}
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost flex-1">
                Annuler
              </button>
              <button
                onClick={() => doDelete(confirmDelete)}
                disabled={confirmDelete._count.questions > 0}
                className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} />
    </AppShell>
  );
}
