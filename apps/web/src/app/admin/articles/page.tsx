'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sheet, Skeleton } from '@permis2.0/ui';
import { adminFetch, Toast, useToast, linesToArray, arrayToLines, AdminPageHeader } from '../adminShared';
import { IconPlus, IconTrash, IconArrowUp, IconArrowDown } from '@tabler/icons-react';

type BlogCategory = 'Conseils examen' | 'Code de la route' | 'Permis de conduire' | 'Auto-écoles';
const CATEGORIES: BlogCategory[] = ['Conseils examen', 'Code de la route', 'Permis de conduire', 'Auto-écoles'];

interface LinkItem {
  href: string;
  label: string;
  external?: boolean;
}

type ContentBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'callout'; tone: 'info' | 'success' | 'warning'; title: string; text: string }
  | { type: 'links'; items: LinkItem[] };

const BLOCK_TYPE_LABEL: Record<ContentBlock['type'], string> = {
  p: 'Paragraphe',
  h2: 'Titre (H2)',
  h3: 'Sous-titre (H3)',
  ul: 'Liste à puces',
  ol: 'Liste numérotée',
  callout: 'Encadré',
  links: 'Liens',
};

interface FaqBlock {
  question: string;
  answer: string;
}

interface Article {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: BlogCategory;
  published: boolean;
  publishedAt: string | null;
  readingMinutes: number;
  directAnswer: string;
  blocks: ContentBlock[];
  faqs?: FaqBlock[] | null;
  updatedAt: string;
}

interface FormState {
  id?: string;
  slug: string;
  slugTouched: boolean;
  title: string;
  description: string;
  category: BlogCategory;
  published: boolean;
  readingMinutes: string;
  directAnswer: string;
  blocks: ContentBlock[];
  faqs: FaqBlock[];
}

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const emptyBlock = (type: ContentBlock['type']): ContentBlock => {
  switch (type) {
    case 'p':
    case 'h2':
    case 'h3':
      return { type, text: '' };
    case 'ul':
    case 'ol':
      return { type, items: [] };
    case 'callout':
      return { type: 'callout', tone: 'info', title: '', text: '' };
    case 'links':
      return { type: 'links', items: [] };
  }
};

const linksToLines = (items: LinkItem[]) =>
  items.map((i) => `${i.label} | ${i.href}${i.external ? ' | external' : ''}`).join('\n');

const linesToLinks = (s: string): LinkItem[] =>
  linesToArray(s)
    .map((line) => {
      const [label, href, flag] = line.split('|').map((p) => p.trim());
      return { label: label ?? '', href: href ?? '', external: flag?.toLowerCase() === 'external' };
    })
    .filter((l) => l.label && l.href);

const INPUT =
  'mt-1 h-11 w-full rounded-xl border border-token bg-surface-2 px-3 text-sm text-foreground focus:outline-none';
const AREA =
  'mt-1 w-full rounded-xl border border-token bg-surface-2 px-3 py-2.5 text-sm text-foreground focus:outline-none';

function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}) {
  const update = (i: number, block: ContentBlock) => {
    const next = [...blocks];
    next[i] = block;
    onChange(next);
  };
  const remove = (i: number) => onChange(blocks.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="mt-2 space-y-3">
      {blocks.map((block, i) => (
        <div key={i} className="rounded-xl border border-token bg-surface-1 p-3">
          <div className="flex items-center gap-2">
            <select
              value={block.type}
              onChange={(e) => update(i, emptyBlock(e.target.value as ContentBlock['type']))}
              className="h-9 flex-1 rounded-lg border border-token bg-surface-2 px-2 text-xs font-semibold text-foreground focus:outline-none"
            >
              {Object.entries(BLOCK_TYPE_LABEL).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="rounded-lg bg-surface-2 p-2 text-secondary hover:bg-primary-50 hover:text-primary-700 disabled:opacity-30"
              aria-label="Monter"
            >
              <IconArrowUp size="1em" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === blocks.length - 1}
              className="rounded-lg bg-surface-2 p-2 text-secondary hover:bg-primary-50 hover:text-primary-700 disabled:opacity-30"
              aria-label="Descendre"
            >
              <IconArrowDown size="1em" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
              aria-label="Supprimer le bloc"
            >
              <IconTrash size="1em" aria-hidden="true" />
            </button>
          </div>

          {(block.type === 'p' || block.type === 'h2' || block.type === 'h3') && (
            <textarea
              value={block.text}
              onChange={(e) => update(i, { ...block, text: e.target.value })}
              rows={block.type === 'p' ? 3 : 1}
              placeholder="Texte…"
              className={AREA + ' mt-2'}
            />
          )}

          {(block.type === 'ul' || block.type === 'ol') && (
            <textarea
              value={arrayToLines(block.items)}
              onChange={(e) => update(i, { ...block, items: linesToArray(e.target.value) })}
              rows={3}
              placeholder="Un élément par ligne"
              className={AREA + ' mt-2'}
            />
          )}

          {block.type === 'callout' && (
            <div className="mt-2 space-y-2">
              <select
                value={block.tone}
                onChange={(e) => update(i, { ...block, tone: e.target.value as typeof block.tone })}
                className={INPUT + ' mt-0'}
              >
                <option value="info">Info</option>
                <option value="success">Succès</option>
                <option value="warning">Avertissement</option>
              </select>
              <input
                value={block.title}
                onChange={(e) => update(i, { ...block, title: e.target.value })}
                placeholder="Titre de l'encadré"
                className={INPUT + ' mt-0'}
              />
              <textarea
                value={block.text}
                onChange={(e) => update(i, { ...block, text: e.target.value })}
                rows={2}
                placeholder="Texte de l'encadré"
                className={AREA}
              />
            </div>
          )}

          {block.type === 'links' && (
            <textarea
              value={linksToLines(block.items)}
              onChange={(e) => update(i, { ...block, items: linesToLinks(e.target.value) })}
              rows={3}
              placeholder={['Réviser les panneaux | /traffic-signs', 'Source officielle | https://exemple.sn | external'].join(
                '\n'
              )}
              className={AREA + ' mt-2 font-mono text-xs'}
            />
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        {(Object.keys(BLOCK_TYPE_LABEL) as ContentBlock['type'][]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange([...blocks, emptyBlock(type)])}
            className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-primary-50 hover:text-primary-700"
          >
            + {BLOCK_TYPE_LABEL[type]}
          </button>
        ))}
      </div>
    </div>
  );
}

function FaqEditor({ faqs, onChange }: { faqs: FaqBlock[]; onChange: (faqs: FaqBlock[]) => void }) {
  const update = (i: number, faq: FaqBlock) => {
    const next = [...faqs];
    next[i] = faq;
    onChange(next);
  };
  const remove = (i: number) => onChange(faqs.filter((_, j) => j !== i));

  return (
    <div className="mt-2 space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="rounded-xl border border-token bg-surface-1 p-3">
          <div className="flex items-center gap-2">
            <input
              value={faq.question}
              onChange={(e) => update(i, { ...faq, question: e.target.value })}
              placeholder="Question"
              className={INPUT + ' mt-0 flex-1'}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
              aria-label="Supprimer la FAQ"
            >
              <IconTrash size="1em" aria-hidden="true" />
            </button>
          </div>
          <textarea
            value={faq.answer}
            onChange={(e) => update(i, { ...faq, answer: e.target.value })}
            rows={2}
            placeholder="Réponse"
            className={AREA + ' mt-2'}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...faqs, { question: '', answer: '' }])}
        className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-primary-50 hover:text-primary-700"
      >
        + Question fréquente
      </button>
    </div>
  );
}

export default function AdminArticlesPage() {
  const [toast, flash] = useToast();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Article | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminFetch<Article[]>('/admin/articles')
      .then((d) => setArticles(d ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const blank = (): FormState => ({
    slug: '',
    slugTouched: false,
    title: '',
    description: '',
    category: CATEGORIES[0],
    published: false,
    readingMinutes: '5',
    directAnswer: '',
    blocks: [],
    faqs: [],
  });

  const toForm = (a: Article): FormState => ({
    id: a.id,
    slug: a.slug,
    slugTouched: true,
    title: a.title,
    description: a.description,
    category: a.category,
    published: a.published,
    readingMinutes: String(a.readingMinutes),
    directAnswer: a.directAnswer,
    blocks: a.blocks,
    faqs: a.faqs ?? [],
  });

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const body = {
        slug: form.slug.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        published: form.published,
        readingMinutes: parseInt(form.readingMinutes, 10) || 1,
        directAnswer: form.directAnswer.trim(),
        blocks: form.blocks,
        faqs: form.faqs,
      };
      if (form.id) {
        await adminFetch(`/admin/articles/${form.id}`, { method: 'PATCH', json: body });
        flash('Article mis à jour.');
      } else {
        await adminFetch('/admin/articles', { json: body });
        flash('Article créé.');
      }
      setForm(null);
      load();
    } catch (e: any) {
      flash(e.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (a: Article) => {
    try {
      await adminFetch(`/admin/articles/${a.id}`, {
        method: 'PATCH',
        json: {
          slug: a.slug,
          title: a.title,
          description: a.description,
          category: a.category,
          published: !a.published,
          readingMinutes: a.readingMinutes,
          directAnswer: a.directAnswer,
          blocks: a.blocks,
          faqs: a.faqs ?? undefined,
        },
      });
      flash(a.published ? 'Article dépublié.' : 'Article publié.');
      load();
    } catch (e: any) {
      flash(e.message);
    }
  };

  const doDelete = async (a: Article) => {
    setConfirmDelete(null);
    try {
      await adminFetch(`/admin/articles/${a.id}`, { method: 'DELETE' });
      flash('Article supprimé.');
      load();
    } catch (e: any) {
      flash(e.message);
    }
  };

  const valid =
    !!form &&
    form.title.trim().length >= 3 &&
    form.slug.trim().length >= 3 &&
    form.description.trim().length >= 10 &&
    form.directAnswer.trim().length >= 10;

  return (
    <>
      <AdminPageHeader
        title="Articles"
        subtitle={`${articles.length} articles · ${articles.filter((a) => a.published).length} publiés`}
        actions={
          <button onClick={() => setForm(blank())} className="btn-primary px-5 py-2.5 text-sm">
            <IconPlus size="1em" aria-hidden="true" /> Nouvel article
          </button>
        }
      />

      {loading && <Skeleton className="h-60 w-full rounded-2xl" />}
      {!loading && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {articles.map((a) => (
            <div
              key={a.id}
              className="flex flex-col rounded-2xl border border-token bg-surface-1 p-4 shadow-soft transition-shadow hover:shadow-card"
            >
              <div className="flex items-center gap-2">
                <span className={`chip ${a.published ? 'chip-success' : 'bg-surface-2 text-secondary'}`}>
                  {a.published ? 'Publié' : 'Brouillon'}
                </span>
                <span className="chip chip-primary">{a.category}</span>
              </div>
              <p className="mt-2 text-sm font-bold leading-snug text-foreground">{a.title}</p>
              <p className="mt-0.5 truncate text-xs text-secondary">/blog/{a.slug}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setForm(toForm(a))}
                  className="rounded-xl bg-surface-2 py-2 text-xs font-bold text-secondary hover:bg-primary-50 hover:text-primary-700"
                >
                  Modifier
                </button>
                <button
                  onClick={() => togglePublish(a)}
                  className="rounded-xl bg-surface-2 py-2 text-xs font-bold text-secondary hover:bg-primary-50 hover:text-primary-700"
                >
                  {a.published ? 'Dépublier' : 'Publier'}
                </button>
                <button
                  onClick={() => setConfirmDelete(a)}
                  className="col-span-2 rounded-xl bg-red-50 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / edit sheet ── */}
      <Sheet open={!!form} onClose={() => setForm(null)} ariaLabel="Éditer l'article" className="mx-auto max-w-2xl">
        {form && (
          <div className="max-h-[75vh] overflow-y-auto pb-4">
            <h3 className="font-display text-lg font-bold text-foreground">
              {form.id ? "Modifier l'article" : 'Nouvel article'}
            </h3>

            <label className="mt-4 block text-xs font-medium text-foreground">Titre</label>
            <input
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                  slug: form.slugTouched ? form.slug : slugify(e.target.value),
                })
              }
              placeholder="Les erreurs les plus fréquentes à l'examen du Code"
              className={INPUT}
            />

            <label className="mt-3 block text-xs font-medium text-foreground">
              Slug (URL — /blog/…)
            </label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: slugify(e.target.value), slugTouched: true })}
              placeholder="erreurs-frequentes-examen-code-route"
              className={INPUT + ' font-mono text-xs'}
            />

            <label className="mt-3 block text-xs font-medium text-foreground">
              Description (méta + résumé sur la liste)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className={AREA}
            />

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground">Catégorie</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as BlogCategory })}
                  className={INPUT}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground">
                  Temps de lecture (min)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.readingMinutes}
                  onChange={(e) => setForm({ ...form, readingMinutes: e.target.value })}
                  className={INPUT}
                />
              </div>
            </div>

            <label className="mt-3 flex items-center gap-2 text-xs font-medium text-foreground">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="h-4 w-4 rounded border-token"
              />
              Publié (visible sur /blog)
            </label>

            <label className="mt-3 block text-xs font-medium text-foreground">
              Réponse directe (affichée juste sous le titre)
            </label>
            <textarea
              value={form.directAnswer}
              onChange={(e) => setForm({ ...form, directAnswer: e.target.value })}
              rows={3}
              className={AREA}
            />

            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-secondary">Contenu</p>
            <BlockEditor blocks={form.blocks} onChange={(blocks) => setForm({ ...form, blocks })} />

            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-secondary">
              Questions fréquentes (optionnel)
            </p>
            <FaqEditor faqs={form.faqs} onChange={(faqs) => setForm({ ...form, faqs })} />

            <button onClick={save} disabled={saving || !valid} className="btn-primary mt-5 w-full disabled:opacity-40">
              {saving ? 'Enregistrement…' : form.id ? 'Enregistrer' : "Créer l'article"}
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
            <h3 className="font-display text-lg font-bold text-foreground">Supprimer cet article ?</h3>
            <p className="mt-2 text-sm text-secondary">« {confirmDelete.title} »</p>
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
