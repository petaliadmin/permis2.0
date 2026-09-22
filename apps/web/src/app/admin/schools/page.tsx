'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@permis2.0/ui';
import type { School } from '@permis2.0/types';
import { SchoolStatus } from '@permis2.0/types';
import { adminFetch, AdminPageHeader, Toast, useToast } from '../adminShared';
import { IconBuildingStore, IconTrash } from '@tabler/icons-react';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspendue',
};

const STATUS_CHIP: Record<string, string> = {
  PENDING: 'chip-orange',
  ACTIVE: 'chip-success',
  SUSPENDED: 'chip-danger',
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

/** Renders a future/past expiry as a chip — reused for both subscription and Top 20 columns. */
function ExpiryChip({ date, activeLabel }: { date: string | Date | null | undefined; activeLabel: string }) {
  if (!date) return <span className="chip bg-surface-2 text-secondary">—</span>;
  const active = new Date(date) > new Date();
  return (
    <span className={`chip ${active ? 'chip-success' : 'chip-danger'}`}>
      {active ? `${activeLabel} · ${fmtDate(String(date))}` : `Expiré le ${fmtDate(String(date))}`}
    </span>
  );
}

/** The single forward action that makes sense from the current status. */
function nextAction(
  status: string
): { label: string; target: SchoolStatus; tone: 'success' | 'caution' } | null {
  switch (status) {
    case SchoolStatus.PENDING:
      return { label: 'Activer', target: SchoolStatus.ACTIVE, tone: 'success' };
    case SchoolStatus.ACTIVE:
      return { label: 'Suspendre', target: SchoolStatus.SUSPENDED, tone: 'caution' };
    case SchoolStatus.SUSPENDED:
      return { label: 'Réactiver', target: SchoolStatus.ACTIVE, tone: 'success' };
    default:
      return null;
  }
}

const ACTION_TONE = {
  success:
    'bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-900/20 dark:text-success-400',
  caution: 'bg-caution-500/10 text-caution-600 hover:bg-caution-500/20 dark:text-caution-400',
};

export default function AdminSchoolsPage() {
  const [toast, flash] = useToast();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<School | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminFetch<School[]>('/admin/schools')
      .then(setSchools)
      .catch((e) => flash(e.message))
      .finally(() => setLoading(false));
  }, [flash]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (school: School, target: SchoolStatus) => {
    setUpdating(school.id);
    try {
      await adminFetch(`/admin/schools/${school.id}/status`, { method: 'PATCH', json: { status: target } });
      setSchools((list) => list.map((s) => (s.id === school.id ? { ...s, status: target } : s)));
      flash(`${school.name} : ${STATUS_LABEL[target].toLowerCase()}.`);
    } catch (e: any) {
      flash(e.message);
    } finally {
      setUpdating(null);
    }
  };

  const deleteSchool = async (school: School) => {
    setConfirmDelete(null);
    setUpdating(school.id);
    try {
      await adminFetch(`/admin/schools/${school.id}`, { method: 'DELETE' });
      setSchools((list) => list.filter((s) => s.id !== school.id));
      flash(`${school.name} supprimée.`);
    } catch (e: any) {
      flash(e.message || 'Suppression impossible.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Écoles"
        subtitle={
          loading
            ? 'Chargement…'
            : `${schools.length} auto-école${schools.length > 1 ? 's' : ''} — statut, abonnement et visibilité Top 20`
        }
      />

      {loading && <Skeleton className="h-40 w-full rounded-2xl" />}

      {!loading && schools.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-token bg-surface-1 py-16 text-center shadow-soft">
          <IconBuildingStore size="1em" className="text-4xl text-slate-300" aria-hidden="true" />
          <p className="mt-3 font-display text-base font-bold text-foreground">
            Aucune auto-école pour l&apos;instant
          </p>
          <p className="mt-1 text-sm text-secondary">
            Les auto-écoles créées depuis /mon-ecole apparaîtront ici.
          </p>
        </div>
      )}

      {!loading && schools.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-token bg-surface-1 shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-token bg-surface-2/60 text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-bold">Auto-école</th>
                <th className="px-4 py-3 font-bold">Statut</th>
                <th className="px-4 py-3 font-bold">Abonnement</th>
                <th className="px-4 py-3 font-bold">Top 20</th>
                <th className="px-4 py-3 font-bold">Créée le</th>
                <th className="px-4 py-3 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-token">
              {schools.map((s) => {
                const action = nextAction(s.status);
                return (
                  <tr key={s.id} className="hover:bg-surface-2/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00235E] text-sm font-black text-white">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{s.name}</p>
                          <p className="text-xs text-secondary">
                            {[s.district, s.city].filter(Boolean).join(', ') || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`chip ${STATUS_CHIP[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <ExpiryChip date={s.subscriptionExpiresAt} activeLabel="Actif" />
                    </td>
                    <td className="px-4 py-3">
                      <ExpiryChip date={s.featuredUntil} activeLabel="En vedette" />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{fmtDate(String(s.createdAt))}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {action && (
                          <button
                            onClick={() => updateStatus(s, action.target)}
                            disabled={updating === s.id}
                            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-colors disabled:opacity-40 ${ACTION_TONE[action.tone]}`}
                          >
                            {updating === s.id ? '…' : action.label}
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDelete(s)}
                          disabled={updating === s.id}
                          title="Supprimer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-40"
                        >
                          <IconTrash size="1em" className="text-sm" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
              Supprimer cette auto-école ?
            </h3>
            <p className="mt-2 text-sm text-secondary">
              <span className="font-bold">{confirmDelete.name}</span> et toutes ses données
              (membres, élèves, véhicules, séances, paiements, avis) seront définitivement
              supprimés.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost flex-1">
                Annuler
              </button>
              <button
                onClick={() => deleteSchool(confirmDelete)}
                className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white transition-transform active:scale-[0.98]"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Toast message={toast} />
    </>
  );
}
