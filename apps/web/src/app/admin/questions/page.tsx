'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Sheet, Skeleton } from '@permis2.0/ui';
import {
  adminFetch,
  useAdminGuard,
  AccessDenied,
  Toast,
  useToast,
  linesToArray,
  arrayToLines,
} from '../adminShared';

const PAGE_SIZE = 8;

interface Choice {
  id: string;
  text: string;
  order: number;
}
interface Question {
  id: string;
  serieId: string;
  categoryId: string;
  numero: number;
  enonce: string;
  explication: string;
  reponses_correctes: string[];
  image?: string | null;
  signalisation_visible?: string | null;
  choices: Choice[];
  category: { id: string; label: string };
  series: { id: string; name: string; code: string };
}
interface SerieOpt {
  id: string;
  name: string;
  code: string;
}
interface CategoryOpt {
  id: string;
  label: string;
}

interface FormState {
  id?: string;
  serieId: string;
  categoryId: string;
  numero: number;
  enonce: string;
  choicesText: string;
  correct: string;
  explication: string;
  image: string;
}

export default function AdminQuestionsPage() {
  const allowed = useAdminGuard();
  const [toast, flash] = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [serieFilter, setSerieFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [series, setSeries] = useState<SerieOpt[]>([]);
  const [categories, setCategories] = useState<CategoryOpt[]>([]);

  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Question | null>(null);

  const load = useCallback(
    (p: number, q: string, serieId: string) => {
      setLoading(true);
      const params = new URLSearchParams({
        skip: String(p * PAGE_SIZE),
        take: String(PAGE_SIZE),
      });
      if (q.trim()) params.set('q', q.trim());
      if (serieId) params.set('serieId', serieId);
      adminFetch<{ data: Question[]; total: number }>(`/admin/questions?${params}`)
        .then((d) => {
          setQuestions(d.data);
          setTotal(d.total);
        })
        .catch((e) => flash(e.message))
        .finally(() => setLoading(false));
    },
    [flash]
  );

  useEffect(() => {
    if (!allowed) return;
    adminFetch<SerieOpt[]>('/admin/series')
      .then((s) => setSeries(s))
      .catch(() => {});
    adminFetch<{ data: CategoryOpt[] }>('/categories?take=100')
      .then((d) => setCategories(d.data ?? []))
      .catch(() => {});
  }, [allowed]);

  useEffect(() => {
    if (allowed) load(page, query, serieFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, page, serieFilter]);

  const searchNow = () => {
    setPage(0);
    load(0, query, serieFilter);
  };

  const blank = (): FormState => ({
    serieId: series[0]?.id ?? '',
    categoryId: categories[0]?.id ?? '',
    numero: total + 1,
    enonce: '',
    choicesText: '',
    correct: '',
    explication: '',
    image: '',
  });

  const toForm = (q: Question): FormState => ({
    id: q.id,
    serieId: q.serieId,
    categoryId: q.categoryId,
    numero: q.numero,
    enonce: q.enonce,
    choicesText: arrayToLines(q.choices.map((c) => c.text)),
    correct: q.reponses_correctes[0] ?? '',
    explication: q.explication,
    image: q.image ?? '',
  });

  const save = async () => {
    if (!form) return;
    const choices = linesToArray(form.choicesText);
    if (choices.length < 2) return flash('Il faut au moins 2 choix (un par ligne).');
    if (!form.correct || !choices.includes(form.correct))
      return flash('Sélectionne la bonne réponse parmi les choix.');
    setSaving(true);
    try {
      const body = {
        serieId: form.serieId,
        categoryId: form.categoryId,
        numero: Number(form.numero) || 1,
        enonce: form.enonce.trim(),
        choices,
        reponses_correctes: [form.correct],
        explication: form.explication.trim(),
        ...(form.image.trim() ? { image: form.image.trim() } : {}),
      };
      if (form.id) {
        await adminFetch(`/admin/questions/${form.id}`, { method: 'PATCH', json: body });
        flash('Question mise à jour.');
      } else {
        await adminFetch('/admin/questions', { json: body });
        flash('Question créée.');
      }
      setForm(null);
      load(page, query, serieFilter);
    } catch (e: any) {
      flash(e.message);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (q: Question) => {
    setConfirmDelete(null);
    try {
      await adminFetch(`/admin/questions/${q.id}`, { method: 'DELETE' });
      flash('Question supprimée.');
      load(page, query, serieFilter);
    } catch (e: any) {
      flash(e.message);
    }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const formChoices = form ? linesToArray(form.choicesText) : [];

  return (
    <AppShell>
      <PageHeader
        title="Questions"
        subtitle={`${total} questions de quiz`}
        accent="violet"
        back="/admin"
        compact
        actions={
          <button
            onClick={() => setForm(blank())}
            className="flex h-9 items-center gap-1 rounded-full bg-white/15 px-3 text-xs font-bold"
          >
            <i className="ti ti-plus" aria-hidden="true" /> Nouvelle
          </button>
        }
      >
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white/15 px-3 py-2">
            <i className="ti ti-search text-sm text-white/80" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchNow()}
              placeholder="Rechercher…"
              className="w-full bg-transparent text-sm text-white placeholder-white/60 focus:outline-none"
            />
          </div>
          <select
            value={serieFilter}
            onChange={(e) => {
              setSerieFilter(e.target.value);
              setPage(0);
            }}
            className="rounded-2xl bg-white/15 px-3 py-2 text-xs font-bold text-white focus:outline-none [&>option]:text-slate-800"
          >
            <option value="">Toutes séries</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code}
              </option>
            ))}
          </select>
        </div>
      </PageHeader>

      <div className="px-4 pb-8 pt-5">
        {allowed === false && <AccessDenied />}
        {allowed && loading && <Skeleton className="h-60 w-full rounded-2xl" />}
        {allowed && !loading && (
          <>
            <div className="space-y-2.5">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-token bg-surface-1 p-3.5 shadow-soft"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 rounded-lg bg-violet-50 px-2 py-1 font-mono text-[10px] font-black text-violet-700">
                      {q.series.code}·{q.numero}
                    </span>
                    <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">
                      {q.enonce}
                    </p>
                  </div>
                  <p className="mt-1.5 truncate text-xs text-secondary">
                    ✓ {q.reponses_correctes.join(', ')} · {q.category.label}
                  </p>
                  <div className="mt-2.5 flex gap-2">
                    <button
                      onClick={() => setForm(toForm(q))}
                      className="flex-1 rounded-xl bg-surface-2 py-2 text-xs font-bold text-secondary hover:bg-violet-50 hover:text-violet-700"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => setConfirmDelete(q)}
                      className="flex-1 rounded-xl bg-red-50 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
              {questions.length === 0 && (
                <p className="mt-8 text-center text-sm text-muted">Aucune question trouvée.</p>
              )}
            </div>

            {pages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-token bg-surface-1 text-secondary disabled:opacity-30"
                  aria-label="Page précédente"
                >
                  <i className="ti ti-chevron-left" aria-hidden="true" />
                </button>
                <span className="text-xs font-bold text-secondary">
                  {page + 1} / {pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                  disabled={page >= pages - 1}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-token bg-surface-1 text-secondary disabled:opacity-30"
                  aria-label="Page suivante"
                >
                  <i className="ti ti-chevron-right" aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Create / edit sheet ── */}
      <Sheet open={!!form} onClose={() => setForm(null)} ariaLabel="Éditer la question">
        {form && (
          <div className="max-h-[75vh] overflow-y-auto pb-4">
            <h3 className="font-display text-lg font-bold text-foreground">
              {form.id ? 'Modifier la question' : 'Nouvelle question'}
            </h3>

            <div className="mt-4 flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-foreground">Série</label>
                <select
                  value={form.serieId}
                  onChange={(e) => setForm({ ...form, serieId: e.target.value })}
                  className="mt-1 h-11 w-full rounded-xl border border-token bg-surface-2 px-3 text-sm text-foreground focus:outline-none"
                >
                  {series.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-foreground">N°</label>
                <input
                  type="number"
                  min={1}
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: parseInt(e.target.value, 10) || 1 })}
                  className="mt-1 h-11 w-full rounded-xl border border-token bg-surface-2 px-3 text-center text-sm text-foreground focus:outline-none"
                />
              </div>
            </div>

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

            <label className="mt-3 block text-xs font-medium text-foreground">Énoncé</label>
            <textarea
              value={form.enonce}
              onChange={(e) => setForm({ ...form, enonce: e.target.value })}
              rows={3}
              placeholder="Que signifie ce panneau ?"
              className="mt-1 w-full rounded-xl border border-token bg-surface-2 px-3 py-2.5 text-sm text-foreground focus:outline-none"
            />

            <label className="mt-3 block text-xs font-medium text-foreground">
              Choix (un par ligne)
            </label>
            <textarea
              value={form.choicesText}
              onChange={(e) => {
                const choicesText = e.target.value;
                const list = linesToArray(choicesText);
                setForm({
                  ...form,
                  choicesText,
                  correct: list.includes(form.correct) ? form.correct : '',
                });
              }}
              rows={4}
              placeholder={'Stop\nCédez le passage\nSens interdit'}
              className="mt-1 w-full rounded-xl border border-token bg-surface-2 px-3 py-2.5 text-sm text-foreground focus:outline-none"
            />

            {formChoices.length >= 2 && (
              <>
                <label className="mt-3 block text-xs font-medium text-foreground">
                  Bonne réponse
                </label>
                <div className="mt-1 space-y-1.5">
                  {formChoices.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, correct: c })}
                      className={`flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm font-medium ${form.correct === c ? 'border-success-500 bg-success-50 text-success-700' : 'border-token bg-surface-1 text-foreground'}`}
                    >
                      <i
                        className={`ti ${form.correct === c ? 'ti-circle-check-filled text-success-600' : 'ti-circle'}`}
                        aria-hidden="true"
                      />
                      {c}
                    </button>
                  ))}
                </div>
              </>
            )}

            <label className="mt-3 block text-xs font-medium text-foreground">Explication</label>
            <textarea
              value={form.explication}
              onChange={(e) => setForm({ ...form, explication: e.target.value })}
              rows={2}
              placeholder="Pourquoi cette réponse est la bonne…"
              className="mt-1 w-full rounded-xl border border-token bg-surface-2 px-3 py-2.5 text-sm text-foreground focus:outline-none"
            />

            <label className="mt-3 block text-xs font-medium text-foreground">
              Image (optionnel, chemin /images/… ou /icons/…)
            </label>
            <input
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="/icons/panneaux/AB4.svg"
              className="mt-1 h-11 w-full rounded-xl border border-token bg-surface-2 px-3 font-mono text-xs text-foreground focus:outline-none"
            />

            <button
              onClick={save}
              disabled={saving || !form.enonce.trim() || !form.explication.trim()}
              className="btn-primary mt-5 w-full disabled:opacity-40"
            >
              {saving ? 'Enregistrement…' : form.id ? 'Enregistrer' : 'Créer la question'}
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
              Supprimer cette question ?
            </h3>
            <p className="mt-2 line-clamp-3 text-sm text-secondary">« {confirmDelete.enonce} »</p>
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
    </AppShell>
  );
}
