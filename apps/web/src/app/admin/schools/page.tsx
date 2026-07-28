'use client';

import { useCallback, useEffect, useState } from 'react';
import { Skeleton } from '@permis2.0/ui';
import type { School } from '@permis2.0/types';
import { SchoolStatus } from '@permis2.0/types';
import { adminFetch, AdminPageHeader, Toast, useToast } from '../adminShared';

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

/** The single forward action that makes sense from the current status. */
function nextAction(status: string): { label: string; target: SchoolStatus } | null {
  switch (status) {
    case SchoolStatus.PENDING:
      return { label: 'Activer', target: SchoolStatus.ACTIVE };
    case SchoolStatus.ACTIVE:
      return { label: 'Suspendre', target: SchoolStatus.SUSPENDED };
    case SchoolStatus.SUSPENDED:
      return { label: 'Réactiver', target: SchoolStatus.ACTIVE };
    default:
      return null;
  }
}

export default function AdminSchoolsPage() {
  const [toast, flash] = useToast();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

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
      await adminFetch(`/admin/schools/${school.id}/status`, { json: { status: target } });
      setSchools((list) => list.map((s) => (s.id === school.id ? { ...s, status: target } : s)));
      flash(`${school.name} : ${STATUS_LABEL[target].toLowerCase()}.`);
    } catch (e: any) {
      flash(e.message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Modération des écoles"
        subtitle={
          loading
            ? 'Chargement…'
            : `${schools.length} auto-école${schools.length > 1 ? 's' : ''} — activez une fiche pour la rendre visible dans l'annuaire public`
        }
      />

      {loading && <Skeleton className="h-40 w-full rounded-2xl" />}

      {!loading && schools.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-token bg-surface-1 py-16 text-center shadow-soft">
          <i className="ti ti-building-store text-4xl text-slate-300" aria-hidden="true" />
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
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-black text-teal-700 dark:bg-teal-900/20 dark:text-teal-400">
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
                    <td className="px-4 py-3 text-xs text-muted">{fmtDate(String(s.createdAt))}</td>
                    <td className="px-4 py-3 text-right">
                      {action && (
                        <button
                          onClick={() => updateStatus(s, action.target)}
                          disabled={updating === s.id}
                          className="rounded-lg bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-100 disabled:opacity-40 dark:bg-teal-900/20 dark:text-teal-400"
                        >
                          {updating === s.id ? '…' : action.label}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Toast message={toast} />
    </>
  );
}
