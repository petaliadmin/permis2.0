'use client';

import { useCallback, useEffect, useState } from 'react';
import { Skeleton } from '@permis2.0/ui';
import { adminFetch, AdminPageHeader, Toast, useToast } from '../adminShared';

interface SchoolPack {
  id: string;
  createdAt: string;
  buyer: { id: string; name: string; phone: string | null; email: string | null };
  product: { title: string; sku: string; seats: number | null };
  seats: { id: string; code: string; claimedAt: string | null; claimedBy: { name: string } | null }[];
  claimedCount: number;
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function AdminEcolesPage() {
  const [toast, flash] = useToast();
  const [packs, setPacks] = useState<SchoolPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminFetch<SchoolPack[]>('/admin/school-packs')
      .then(setPacks)
      .catch((e) => flash(e.message))
      .finally(() => setLoading(false));
  }, [flash]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      flash(`Code ${code} copié.`);
    } catch {
      flash('Impossible de copier — copiez-le manuellement.');
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Auto-écoles"
        subtitle={
          loading
            ? 'Chargement…'
            : packs.length > 0
              ? `${packs.length} pack${packs.length > 1 ? 's' : ''} école vendu${packs.length > 1 ? 's' : ''}`
              : 'Aucun pack école vendu pour le moment'
        }
      />

      {loading && <Skeleton className="h-40 w-full rounded-2xl" />}

      {!loading && packs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-token bg-surface-1 py-16 text-center shadow-soft">
          <i className="ti ti-school text-4xl text-slate-300" aria-hidden="true" />
          <p className="mt-3 font-display text-base font-bold text-foreground">
            Aucun pack école pour l&apos;instant
          </p>
          <p className="mt-1 text-sm text-secondary">
            Les packs marque blanche vendus à des auto-écoles apparaîtront ici, avec les codes à
            distribuer aux élèves.
          </p>
        </div>
      )}

      {!loading && packs.length > 0 && (
        <div className="space-y-3">
          {packs.map((p) => {
            const total = p.seats.length;
            const isOpen = expanded === p.id;
            return (
              <div
                key={p.id}
                className="overflow-hidden rounded-2xl border border-token bg-surface-1 shadow-soft"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-4 px-4 py-3.5 text-left hover:bg-surface-2/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-black text-violet-700 dark:bg-violet-900/20 dark:text-violet-400">
                      {p.buyer.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{p.buyer.name}</p>
                      <p className="text-xs text-secondary">
                        {p.buyer.phone ? `+221 ${p.buyer.phone}` : (p.buyer.email ?? '—')}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-secondary">{p.product.title}</div>
                  <div className="text-xs font-bold text-foreground">
                    {p.claimedCount}/{total} places réclamées
                  </div>
                  <div className="text-xs text-muted">{fmtDate(p.createdAt)}</div>
                  <i
                    className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'} text-lg text-slate-400`}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-token bg-surface-2/40 px-4 py-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {p.seats.map((s) => (
                        <div
                          key={s.id}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                            s.claimedAt
                              ? 'border-token bg-surface-1 text-muted'
                              : 'border-violet-200 bg-white dark:border-violet-900/40 dark:bg-surface-1'
                          }`}
                        >
                          <span className="font-mono font-bold tracking-wide">{s.code}</span>
                          {s.claimedAt ? (
                            <span className="text-xs text-secondary" title={s.claimedBy?.name}>
                              ✓ {s.claimedBy?.name ?? 'réclamé'}
                            </span>
                          ) : (
                            <button
                              onClick={() => copyCode(s.code)}
                              className="text-xs font-bold text-violet-600 hover:underline"
                            >
                              Copier
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Toast message={toast} />
    </>
  );
}
