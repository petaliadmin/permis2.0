'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Sheet, Skeleton } from '@permis2.0/ui';
import { useAuthStore } from '@/store/authStore';
import { adminFetch, useAdminGuard, AccessDenied, Toast, useToast, fmtXof } from '../adminShared';

const PAGE_SIZE = 10;

interface AdminUser {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  xp: number;
  level: string;
  role: 'USER' | 'ADMIN';
  blocked?: boolean;
  createdAt: string;
}

interface UserDetails {
  user: AdminUser & { blocked: boolean };
  entitlements: { key: string; source: string; expiresAt: string | null; createdAt: string }[];
  purchases: {
    id: string;
    amountXof: number;
    status: string;
    provider: string;
    method?: string | null;
    createdAt: string;
    product: { title: string };
  }[];
  examCount: number;
  streak: { currentStreak: number; longestStreak: number } | null;
  otpCount: number;
  totalSpentXof: number;
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR');

export default function AdminUsersPage() {
  const allowed = useAdminGuard();
  const me = useAuthStore((s) => s.user);
  const [toast, flash] = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);

  const load = useCallback((p: number) => {
    setLoading(true);
    adminFetch<{ data: AdminUser[]; total: number }>(
      `/users?skip=${p * PAGE_SIZE}&take=${PAGE_SIZE}`
    )
      .then((d) => {
        setUsers(d.data ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (allowed) load(page);
  }, [allowed, page, load]);

  const openDetails = async (u: AdminUser) => {
    try {
      setDetails(await adminFetch<UserDetails>(`/admin/users/${u.id}/details`));
    } catch (e: any) {
      flash(e.message);
    }
  };

  const act = async (id: string, fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(id);
    try {
      await fn();
      flash(okMsg);
      load(page);
      // refresh open sheet
      if (details?.user.id === id) {
        setDetails(await adminFetch<UserDetails>(`/admin/users/${id}/details`));
      }
    } catch (e: any) {
      flash(e.message || 'Action impossible.');
    } finally {
      setBusy(null);
    }
  };

  const toggleBlock = (u: AdminUser, blocked: boolean) =>
    act(
      u.id,
      () => adminFetch(`/admin/users/${u.id}/block`, { method: 'PATCH', json: { blocked } }),
      blocked ? `${u.name} est bloqué.` : `${u.name} est débloqué.`
    );

  const toggleRole = (u: AdminUser) =>
    act(
      u.id,
      () =>
        adminFetch(`/admin/users/${u.id}/role`, {
          method: 'PATCH',
          json: { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' },
        }),
      `Rôle de ${u.name} mis à jour.`
    );

  const deleteUser = (u: AdminUser) => {
    setConfirmDelete(null);
    setDetails(null);
    return act(
      u.id,
      () => adminFetch(`/users/${u.id}`, { method: 'DELETE' }),
      `Compte de ${u.name} supprimé.`
    );
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppShell>
      <PageHeader
        title="Utilisateurs"
        subtitle={`${total} comptes`}
        accent="violet"
        back="/admin"
        compact
      />

      <div className="px-4 pb-8 pt-5">
        {allowed === false && <AccessDenied />}
        {allowed && loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {allowed && !loading && (
          <>
            <div className="space-y-2.5">
              {users.map((u) => {
                const isSelf = me?.id === u.id;
                return (
                  <div
                    key={u.id}
                    className={`rounded-2xl border bg-surface-1 p-3.5 shadow-soft ${u.blocked ? 'border-red-200 opacity-75' : 'border-token'}`}
                  >
                    <button
                      className="flex w-full items-center gap-3"
                      onClick={() => openDetails(u)}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${u.blocked ? 'bg-red-100 text-red-600' : 'bg-violet-100 text-violet-700'}`}
                      >
                        {u.blocked ? (
                          <i className="ti ti-ban" aria-hidden="true" />
                        ) : (
                          u.name?.charAt(0).toUpperCase() || '?'
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="flex items-center gap-1.5 truncate text-sm font-bold text-foreground">
                          {u.name}
                          {u.role === 'ADMIN' && (
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-black uppercase text-violet-700">
                              Admin
                            </span>
                          )}
                          {u.blocked && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black uppercase text-red-600">
                              Bloqué
                            </span>
                          )}
                          {isSelf && (
                            <span className="text-[10px] font-medium text-muted">(toi)</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-secondary">
                          {u.phone ? `+221 ${u.phone}` : (u.email ?? '—')} · {u.xp} XP · {u.level}
                        </p>
                      </div>
                      <i
                        className="ti ti-chevron-right text-lg text-slate-300"
                        aria-hidden="true"
                      />
                    </button>

                    {!isSelf && (
                      <div className="mt-2.5 flex gap-2">
                        <button
                          onClick={() => toggleBlock(u, !u.blocked)}
                          disabled={busy === u.id}
                          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-colors disabled:opacity-40 ${u.blocked ? 'bg-success-50 text-success-700 hover:bg-success-100' : 'bg-surface-2 text-secondary hover:bg-amber-50 hover:text-amber-700'}`}
                        >
                          {u.blocked ? 'Débloquer' : 'Bloquer'}
                        </button>
                        <button
                          onClick={() => toggleRole(u)}
                          disabled={busy === u.id}
                          className="flex-1 rounded-xl bg-surface-2 py-2 text-xs font-bold text-secondary transition-colors hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"
                        >
                          {u.role === 'ADMIN' ? 'Retirer admin' : 'Promouvoir'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(u)}
                          disabled={busy === u.id}
                          className="flex-1 rounded-xl bg-red-50 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-40"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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

      {/* ── Details sheet ── */}
      <Sheet open={!!details} onClose={() => setDetails(null)} ariaLabel="Détails utilisateur">
        {details && (
          <div className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-lg font-black text-violet-700">
                {details.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-bold text-foreground">
                  {details.user.name}
                </p>
                <p className="text-xs text-secondary">
                  {details.user.phone ? `+221 ${details.user.phone}` : details.user.email} · inscrit
                  le {fmtDate(String(details.user.createdAt))}
                </p>
              </div>
            </div>

            {/* Activity stats */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[
                { label: 'XP', value: details.user.xp },
                { label: 'Examens', value: details.examCount },
                { label: 'Série', value: `${details.streak?.currentStreak ?? 0} j` },
                { label: 'SMS reçus', value: details.otpCount },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-surface-2 p-2 text-center">
                  <p className="font-display text-sm font-black text-foreground">{s.value}</p>
                  <p className="text-[9px] font-medium text-muted">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Subscription */}
            <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-muted">
              Abonnements & accès
            </p>
            {details.entitlements.length === 0 ? (
              <p className="rounded-xl bg-surface-2 px-3 py-2.5 text-sm text-secondary">
                Aucun abonnement — compte gratuit.
              </p>
            ) : (
              <div className="space-y-1.5">
                {details.entitlements.map((e) => {
                  const expired = e.expiresAt && new Date(e.expiresAt) < new Date();
                  return (
                    <div
                      key={e.key}
                      className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5 text-sm"
                    >
                      <span className="font-semibold text-foreground">{e.key}</span>
                      <span className={`text-xs ${expired ? 'text-red-500' : 'text-success-600'}`}>
                        {e.expiresAt
                          ? `${expired ? 'Expiré' : 'Expire'} le ${fmtDate(e.expiresAt)}`
                          : 'À vie'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Manual activation (WhatsApp payment flow) */}
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={() =>
                  act(
                    details.user.id,
                    () =>
                      adminFetch(`/admin/users/${details.user.id}/subscription`, {
                        method: 'POST',
                        json: {},
                      }),
                    `Abonnement activé pour ${details.user.name} (1 an).`
                  )
                }
                disabled={busy === details.user.id}
                className="flex-1 rounded-xl bg-success-50 py-2.5 text-xs font-bold text-success-700 transition-colors hover:bg-success-100 disabled:opacity-40"
              >
                <i className="ti ti-crown mr-1" aria-hidden="true" />
                {details.entitlements.some((e) => e.key === 'premium_all')
                  ? 'Prolonger 1 an'
                  : 'Activer l’abonnement'}
              </button>
              {details.entitlements.some((e) => e.key === 'premium_all') && (
                <button
                  onClick={() =>
                    act(
                      details.user.id,
                      () =>
                        adminFetch(`/admin/users/${details.user.id}/subscription`, {
                          method: 'DELETE',
                        }),
                      `Abonnement révoqué pour ${details.user.name}.`
                    )
                  }
                  disabled={busy === details.user.id}
                  className="flex-1 rounded-xl bg-red-50 py-2.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-40"
                >
                  Révoquer
                </button>
              )}
            </div>

            {/* Purchases */}
            <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-muted">
              Achats ({fmtXof(details.totalSpentXof)} au total)
            </p>
            {details.purchases.length === 0 ? (
              <p className="rounded-xl bg-surface-2 px-3 py-2.5 text-sm text-secondary">
                Aucun achat.
              </p>
            ) : (
              <div className="space-y-1.5">
                {details.purchases.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{p.product.title}</p>
                      <p className="text-[10px] text-muted">
                        {fmtDate(p.createdAt)} · {p.method || p.provider}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-foreground">{fmtXof(p.amountXof)}</p>
                      <p
                        className={`text-[10px] font-bold ${p.status === 'PAID' ? 'text-success-600' : p.status === 'PENDING' ? 'text-amber-600' : 'text-red-500'}`}
                      >
                        {p.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Sheet>

      {/* ── Delete confirmation ── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8"
          onClick={() => setConfirmDelete(null)}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-sm rounded-3xl bg-surface-1 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold text-foreground">
              Supprimer ce compte ?
            </h3>
            <p className="mt-2 text-sm text-secondary">
              Le compte de <span className="font-bold">{confirmDelete.name}</span> et toute sa
              progression seront définitivement supprimés.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost flex-1">
                Annuler
              </button>
              <button
                onClick={() => deleteUser(confirmDelete)}
                className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white transition-transform active:scale-[0.98]"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Toast message={toast} />
    </AppShell>
  );
}
