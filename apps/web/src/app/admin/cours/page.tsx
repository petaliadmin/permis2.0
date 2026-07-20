'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sheet, Skeleton } from '@permis2.0/ui';
import {
  adminFetch,
  Toast,
  useToast,
  linesToArray,
  arrayToLines,
  AdminPageHeader,
} from '../adminShared';

interface Lesson {
  id: string;
  categoryId: string;
  titre: string;
  contenu: string;
  points_cles: string[];
  exceptions: string[];
  erreurs_frequentes: string[];
  regles: string[];
  illustrations: string[];
  category?: { id: string; label: string };
}
interface CategoryOpt {
  id: string;
  label: string;
}

interface FormState {
  id?: string;
  categoryId: string;
  titre: string;
  contenu: string;
  points: string;
  regles: string;
  erreurs: string;
  exceptions: string;
  illustrations: string;
}

export default function AdminCoursPage() {
  const [toast, flash] = useToast();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [categories, setCategories] = useState<CategoryOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Lesson | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminFetch<{ data: Lesson[] }>('/lessons?take=200')
      .then((d) => setLessons(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    adminFetch<{ data: CategoryOpt[] }>('/categories?take=100')
      .then((d) => setCategories(d.data ?? []))
      .catch(() => {});
  }, [load]);

  const blank = (): FormState => ({
    categoryId: categories[0]?.id ?? '',
    titre: '',
    contenu: '',
    points: '',
    regles: '',
    erreurs: '',
    exceptions: '',
    illustrations: '',
  });

  const toForm = (l: Lesson): FormState => ({
    id: l.id,
    categoryId: l.categoryId,
    titre: l.titre,
    contenu: l.contenu,
    points: arrayToLines(l.points_cles),
    regles: arrayToLines(l.regles),
    erreurs: arrayToLines(l.erreurs_frequentes),
    exceptions: arrayToLines(l.exceptions),
    illustrations: arrayToLines(l.illustrations),
  });

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const body = {
        categoryId: form.categoryId,
        titre: form.titre.trim(),
        contenu: form.contenu.trim(),
        points_cles: linesToArray(form.points),
        regles: linesToArray(form.regles),
        erreurs_frequentes: linesToArray(form.erreurs),
        exceptions: linesToArray(form.exceptions),
        illustrations: linesToArray(form.illustrations),
      };
      if (form.id) {
        await adminFetch(`/admin/lessons/${form.id}`, { method: 'PATCH', json: body });
        flash('Leçon mise à jour.');
      } else {
        await adminFetch('/admin/lessons', { json: body });
        flash('Leçon créée.');
      }
      setForm(null);
      load();
    } catch (e: any) {
      flash(e.message);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (l: Lesson) => {
    setConfirmDelete(null);
    try {
      await adminFetch(`/admin/lessons/${l.id}`, { method: 'DELETE' });
      flash('Leçon supprimée.');
      load();
    } catch (e: any) {
      flash(e.message);
    }
  };

  const AREA =
    'mt-1 w-full rounded-xl border border-token bg-surface-2 px-3 py-2.5 text-sm text-foreground focus:outline-none';

  return (
    <>
      <AdminPageHeader
        title="Cours (leçons)"
        subtitle={`${lessons.length} leçons publiées`}
        actions={
          <button onClick={() => setForm(blank())} className="btn-primary px-5 py-2.5 text-sm">
            <i className="ti ti-plus" aria-hidden="true" /> Nouvelle leçon
          </button>
        }
      />

      {loading && <Skeleton className="h-60 w-full rounded-2xl" />}
      {!loading && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {lessons.map((l) => (
            <div
              key={l.id}
              className="flex flex-col rounded-2xl border border-token bg-surface-1 p-4 shadow-soft transition-shadow hover:shadow-card"
            >
              <p className="text-sm font-bold leading-snug text-foreground">{l.titre}</p>
              <p className="mt-0.5 truncate text-xs text-secondary">
                {l.category?.label ?? '—'} · {l.points_cles.length} points clés
              </p>
              <div className="mt-3 flex gap-2 pt-1">
                <button
                  onClick={() => setForm(toForm(l))}
                  className="flex-1 rounded-xl bg-surface-2 py-2 text-xs font-bold text-secondary hover:bg-primary-50 hover:text-primary-700"
                >
                  Modifier
                </button>
                <button
                  onClick={() => setConfirmDelete(l)}
                  className="flex-1 rounded-xl bg-red-50 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / edit sheet ── */}
      <Sheet
        open={!!form}
        onClose={() => setForm(null)}
        ariaLabel="Éditer la leçon"
        className="mx-auto max-w-2xl"
      >
        {form && (
          <div className="max-h-[75vh] overflow-y-auto pb-4">
            <h3 className="font-display text-lg font-bold text-foreground">
              {form.id ? 'Modifier la leçon' : 'Nouvelle leçon'}
            </h3>

            <label className="mt-4 block text-xs font-medium text-foreground">Titre</label>
            <input
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              placeholder="La priorité à droite"
              className="mt-1 h-11 w-full rounded-xl border border-token bg-surface-2 px-3 text-sm text-foreground focus:outline-none"
            />

            <label className="mt-3 block text-xs font-medium text-foreground">Catégorie</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="mt-1 h-11 w-full rounded-xl border border-token bg-surface-2 px-3 text-sm text-foreground focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <label className="mt-3 block text-xs font-medium text-foreground">Contenu</label>
            <textarea
              value={form.contenu}
              onChange={(e) => setForm({ ...form, contenu: e.target.value })}
              rows={6}
              placeholder="Le texte principal de la leçon…"
              className={AREA}
            />

            <label className="mt-3 block text-xs font-medium text-foreground">
              Points clés (un par ligne)
            </label>
            <textarea
              value={form.points}
              onChange={(e) => setForm({ ...form, points: e.target.value })}
              rows={3}
              className={AREA}
            />

            <label className="mt-3 block text-xs font-medium text-foreground">
              Règles à retenir (une par ligne)
            </label>
            <textarea
              value={form.regles}
              onChange={(e) => setForm({ ...form, regles: e.target.value })}
              rows={3}
              className={AREA}
            />

            <label className="mt-3 block text-xs font-medium text-foreground">
              Erreurs fréquentes (une par ligne)
            </label>
            <textarea
              value={form.erreurs}
              onChange={(e) => setForm({ ...form, erreurs: e.target.value })}
              rows={3}
              className={AREA}
            />

            <label className="mt-3 block text-xs font-medium text-foreground">
              Exceptions (une par ligne)
            </label>
            <textarea
              value={form.exceptions}
              onChange={(e) => setForm({ ...form, exceptions: e.target.value })}
              rows={3}
              className={AREA}
            />

            <label className="mt-3 block text-xs font-medium text-foreground">
              Panneaux illustrés (un chemin par ligne, ex. /icons/panneaux/AB4.svg)
            </label>
            <textarea
              value={form.illustrations}
              onChange={(e) => setForm({ ...form, illustrations: e.target.value })}
              rows={3}
              placeholder={['/icons/panneaux/AB4.svg', '/icons/panneaux/M4.svg'].join('\n')}
              className={AREA + ' font-mono text-xs'}
            />

            <button
              onClick={save}
              disabled={saving || form.titre.trim().length < 3 || form.contenu.trim().length < 10}
              className="btn-primary mt-5 w-full disabled:opacity-40"
            >
              {saving ? 'Enregistrement…' : form.id ? 'Enregistrer' : 'Créer la leçon'}
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
            <h3 className="font-display text-lg font-bold text-foreground">
              Supprimer cette leçon ?
            </h3>
            <p className="mt-2 text-sm text-secondary">« {confirmDelete.titre} »</p>
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
