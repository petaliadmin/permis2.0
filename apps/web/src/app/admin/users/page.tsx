'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sheet, Skeleton } from '@permis2.0/ui';
import { useAuthStore } from '@/store/authStore';
import { adminFetch, Toast, useToast, fmtXof, AdminPageHeader } from '../adminShared';
import {
  IconBan,
  IconChevronLeft,
  IconChevronRight,
  IconCrown,
  IconEdit,
  IconLockOpen,
  IconPlayerPause,
  IconPlayerPlay,
  IconSearch,
  IconShieldLock,
  IconTrash,
} from '@tabler/icons-react';

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
  suspendedUntil?: string | null;
  createdAt: string;
}

const isSuspended = (u: AdminUser) =>
  !u.blocked && !!u.suspendedUntil && new Date(u.suspendedUntil) > new Date();

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
  const me = useAuthStore((s) => s.user);
  const [toast, flash] = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'' | 'USER' | 'ADMIN'>('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'suspended' | 'blocked'>('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', role: 'USER' as 'USER' | 'ADMIN' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    (
      p: number,
      q: string,
      role: '' | 'USER' | 'ADMIN',
      status: '' | 'active' | 'suspended' | 'blocked'
    ) => {
      setLoading(true);
      const params = new URLSearchParams({ skip: String(p * PAGE_SIZE), take: String(PAGE_SIZE) });
      if (q.trim()) params.set('q', q.trim());
      if (role) params.set('role', role);
      if (status) params.set('status', status);
      adminFetch<{ data: AdminUser[]; total: number }>(`/users?${params}`)
        .then((d) => {
          setUsers(d.data ?? []);
          setTotal(d.total ?? 0);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    []
  );

  useEffect(() => {
    load(page, query, roleFilter, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const searchNow = () => {
    setPage(0);
    load(0, query, roleFilter, statusFilter);
  };

  const applyFilters = (role: '' | 'USER' | 'ADMIN', status: '' | 'active' | 'suspended' | 'blocked') => {
    setRoleFilter(role);
    setStatusFilter(status);
    setPage(0);
    load(0, query, role, status);
  };

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
      load(page, query, roleFilter, statusFilter);
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

  const suspendUser = (u: AdminUser, days: number) => {
    setSuspendTarget(null);
    return act(
      u.id,
      () => adminFetch(`/admin/users/${u.id}/suspend`, { method: 'PATCH', json: { days } }),
      `${u.name} est suspendu pour ${days} jour${days > 1 ? 's' : ''}.`
    );
  };

  const unsuspendUser = (u: AdminUser) =>
    act(
      u.id,
      () => adminFetch(`/admin/users/${u.id}/suspend`, { method: 'DELETE' }),
      `Suspension de ${u.name} levée.`
    );

  const openEdit = (u: AdminUser) => {
    setEditForm({
      name: u.name ?? '',
      phone: u.phone ?? '',
      email: u.email ?? '',
      role: u.role,
    });
    setEditTarget(u);
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await adminFetch(`/admin/users/${editTarget.id}`, {
        method: 'PATCH',
        json: {
          name: editForm.name.trim(),
          phone: editForm.phone.trim() || undefined,
          email: editForm.email.trim() || undefined,
          role: editForm.role,
        },
      });
      flash(`${editForm.name} mis à jour.`);
      setEditTarget(null);
      load(page, query, roleFilter, statusFilter);
    } catch (e: any) {
      flash(e.message || 'Modification impossible.');
    } finally {
      setSaving(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <AdminPageHeader title="Utilisateurs" subtitle={`${total} comptes`}>
        <div className="flex w-full min-w-[720px] max-w-5xl flex-wrap items-center gap-2">
          <div className="flex min-w-[480px] flex-1 items-center gap-2 rounded-xl border border-token bg-surface-1 px-3.5 py-2.5 shadow-soft">
            <IconSearch size="1em" className="text-sm text-muted" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchNow()}
              onBlur={searchNow}
              placeholder="Rechercher par nom, téléphone, e-mail…"
              className="w-full bg-transparent text-sm text-foreground placeholder-muted focus:outline-none"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => applyFilters(e.target.value as '' | 'USER' | 'ADMIN', statusFilter)}
            className="shrink-0 rounded-xl border border-token bg-surface-1 px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-soft focus:outline-none"
          >
            <option value="">Tous les rôles</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">Utilisateur</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              applyFilters(roleFilter, e.target.value as '' | 'active' | 'suspended' | 'blocked')
            }
            className="shrink-0 rounded-xl border border-token bg-surface-1 px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-soft focus:outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="suspended">Suspendu</option>
            <option value="blocked">Bloqué</option>
          </select>
        </div>
      </AdminPageHeader>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && (
        <>
          <div className="overflow-hidden rounded-2xl border border-token bg-surface-1 shadow-soft">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-token bg-surface-2/60 text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-bold">Utilisateur</th>
                  <th className="px-4 py-3 font-bold">Contact</th>
                  <th className="px-4 py-3 font-bold">Activité</th>
                  <th className="px-4 py-3 font-bold">Statut</th>
                  <th className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-token">
                {users.map((u) => {
                  const isSelf = me?.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      className={u.blocked ? 'bg-red-50/50 dark:bg-red-950/10' : 'hover:bg-surface-2/50'}
                    >
                      <td className="px-4 py-3">
                        <button
                          className="flex items-center gap-3 text-left"
                          onClick={() => openDetails(u)}
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${u.blocked ? 'bg-red-100 text-red-600' : 'bg-[#00235E] text-white'}`}
                          >
                            {u.blocked ? (
                              <IconBan size="1em" aria-hidden="true" />
                            ) : (
                              u.name?.charAt(0).toUpperCase() || '?'
                            )}
                          </div>
                          <span className="flex items-center gap-1.5 font-bold text-foreground">
                            {u.name}
                            {isSelf && (
                              <span className="text-[10px] font-medium text-muted">(toi)</span>
                            )}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {u.phone ? `+221 ${u.phone}` : (u.email ?? '—')}
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {u.xp} XP · {u.level}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {u.role === 'ADMIN' && (
                            <span className="rounded-full bg-[#00235E] px-2 py-0.5 text-[9px] font-black uppercase text-white">
                              Admin
                            </span>
                          )}
                          {u.blocked && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black uppercase text-red-600">
                              Bloqué
                            </span>
                          )}
                          {isSuspended(u) && (
                            <span
                              className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase text-amber-700"
                              title={`Jusqu'au ${fmtDate(u.suspendedUntil!)}`}
                            >
                              Suspendu
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {!isSelf && (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openEdit(u)}
                              disabled={busy === u.id}
                              title="Modifier"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-secondary transition-colors hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"
                            >
                              <IconEdit size="1em" className="text-sm" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() =>
                                isSuspended(u) ? unsuspendUser(u) : setSuspendTarget(u)
                              }
                              disabled={busy === u.id}
                              title={isSuspended(u) ? 'Lever la suspension' : 'Suspendre'}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${isSuspended(u) ? 'bg-success-50 text-success-700 hover:bg-success-100' : 'bg-surface-2 text-secondary hover:bg-caution-500/10 hover:text-caution-600'}`}
                            >
                              {isSuspended(u) ? (
                                <IconPlayerPlay size="1em" className="text-sm" aria-hidden="true" />
                              ) : (
                                <IconPlayerPause size="1em" className="text-sm" aria-hidden="true" />
                              )}
                            </button>
                            <button
                              onClick={() => toggleBlock(u, !u.blocked)}
                              disabled={busy === u.id}
                              title={u.blocked ? 'Débloquer' : 'Bloquer'}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${u.blocked ? 'bg-success-50 text-success-700 hover:bg-success-100' : 'bg-surface-2 text-secondary hover:bg-amber-50 hover:text-amber-700'}`}
                            >
                              {u.blocked ? (
                                <IconLockOpen size="1em" className="text-sm" aria-hidden="true" />
                              ) : (
                                <IconBan size="1em" className="text-sm" aria-hidden="true" />
                              )}
                            </button>
                            <button
                              onClick={() => toggleRole(u)}
                              disabled={busy === u.id}
                              title={u.role === 'ADMIN' ? 'Retirer admin' : 'Promouvoir admin'}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-secondary transition-colors hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"
                            >
                              <IconShieldLock size="1em" className="text-sm" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(u)}
                              disabled={busy === u.id}
                              title="Supprimer"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-40"
                            >
                              <IconTrash size="1em" className="text-sm" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

            {pages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-token bg-surface-1 text-secondary disabled:opacity-30"
                  aria-label="Page précédente"
                >
                  <IconChevronLeft size="1em" aria-hidden="true" />
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
                  <IconChevronRight size="1em" aria-hidden="true" />
                </button>
              </div>
            )}
        </>
      )}

      {/* ── Details sheet ── */}
      <Sheet
        open={!!details}
        onClose={() => setDetails(null)}
        ariaLabel="Détails utilisateur"
        className="mx-auto max-w-xl"
      >
        {details && (
          <div className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00235E] text-lg font-black text-white">
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
                <IconCrown size="1em" className="mr-1" aria-hidden="true" />
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setConfirmDelete(null)}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-sm rounded-3xl bg-surface-1 p-6 shadow-card-lg"
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

      {/* ── Suspend duration picker ── */}
      {suspendTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setSuspendTarget(null)}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-sm rounded-3xl bg-surface-1 p-6 shadow-card-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold text-foreground">Suspendre ce compte ?</h3>
            <p className="mt-2 text-sm text-secondary">
              <span className="font-bold">{suspendTarget.name}</span> ne pourra plus se connecter
              pendant la durée choisie. La suspension est levée automatiquement à l'échéance.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { label: '1 jour', days: 1 },
                { label: '7 jours', days: 7 },
                { label: '30 jours', days: 30 },
              ].map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => suspendUser(suspendTarget, opt.days)}
                  className="rounded-xl bg-caution-500/10 py-2.5 text-sm font-bold text-caution-600 transition-colors hover:bg-caution-500/20"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => setSuspendTarget(null)} className="btn-ghost mt-3 w-full">
              Annuler
            </button>
          </motion.div>
        </div>
      )}

      {/* ── Edit user ── */}
      {editTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setEditTarget(null)}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-sm rounded-3xl bg-surface-1 p-6 shadow-card-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold text-foreground">Modifier l'utilisateur</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">Nom</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-token bg-surface-2 px-3 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">Téléphone</label>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-xl border border-token bg-surface-2 px-3 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">E-mail</label>
                <input
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-xl border border-token bg-surface-2 px-3 py-2.5 text-sm text-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">Rôle</label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, role: e.target.value as 'USER' | 'ADMIN' }))
                  }
                  className="w-full rounded-xl border border-token bg-surface-2 px-3 py-2.5 text-sm text-foreground focus:outline-none"
                >
                  <option value="USER">Utilisateur</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setEditTarget(null)} className="btn-ghost flex-1">
                Annuler
              </button>
              <button
                onClick={saveEdit}
                disabled={saving || !editForm.name.trim()}
                className="flex-1 rounded-2xl bg-[#00235E] py-3 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-40"
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Toast message={toast} />
    </>
  );
}
