'use client';

import { useMemo, useState } from 'react';
import type { SchoolStudent } from '@permis2.0/types';
import { SchoolStudentStatus } from '@permis2.0/types';
import { EmptyState, Sheet, Skeleton } from '@permis2.0/ui';
import { cn } from '@/lib/cn';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  GRADUATED: 'Diplômé',
  WITHDRAWN: 'Parti',
};

const STATUS_CHIP: Record<string, string> = {
  ACTIVE: 'chip-success',
  SUSPENDED: 'chip-orange',
  GRADUATED: 'chip-violet',
  WITHDRAWN: 'chip-danger',
};

const FILTERS = ['ALL', 'ACTIVE', 'SUSPENDED', 'GRADUATED', 'WITHDRAWN'] as const;

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

function nextActions(status: string): { label: string; target: string }[] {
  switch (status) {
    case SchoolStudentStatus.ACTIVE:
      return [
        { label: 'Suspendre', target: SchoolStudentStatus.SUSPENDED },
        { label: 'Diplômer', target: SchoolStudentStatus.GRADUATED },
        { label: 'Marquer parti', target: SchoolStudentStatus.WITHDRAWN },
      ];
    case SchoolStudentStatus.SUSPENDED:
      return [
        { label: 'Réactiver', target: SchoolStudentStatus.ACTIVE },
        { label: 'Marquer parti', target: SchoolStudentStatus.WITHDRAWN },
      ];
    case SchoolStudentStatus.WITHDRAWN:
      return [{ label: 'Réactiver', target: SchoolStudentStatus.ACTIVE }];
    default:
      return [];
  }
}

type FoundUser = { id: string; name: string; phone: string };

interface StudentsPanelProps {
  schoolId: string;
  students: SchoolStudent[] | null;
  onChanged: () => void;
}

export function StudentsPanel({ schoolId, students, onChanged }: StudentsPanelProps) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const [openId, setOpenId] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [found, setFound] = useState<FoundUser | null>(null);
  const [addCategory, setAddCategory] = useState('');
  const [addError, setAddError] = useState('');
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () => (students ?? []).filter((s) => filter === 'ALL' || s.status === filter),
    [students, filter]
  );
  const open = students?.find((s) => s.id === openId) ?? null;

  const setStatus = async (target: string) => {
    if (!open) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/schools/${schoolId}/students/${open.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: target, licenseCategory: category || undefined }),
      });
      if (res.ok) {
        setOpenId(null);
        onChanged();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const lookup = async () => {
    setAddError('');
    setFound(null);
    if (!phone.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${API_URL}/schools/${schoolId}/members/lookup?phone=${encodeURIComponent(phone)}`,
        { credentials: 'include' }
      );
      if (!res.ok) {
        setAddError('Aucun utilisateur PERMIS 2.0 avec ce numéro.');
        return;
      }
      setFound(await res.json());
    } finally {
      setBusy(false);
    }
  };

  const addStudent = async () => {
    if (!found) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/schools/${schoolId}/students`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: found.id, licenseCategory: addCategory || undefined }),
      });
      if (res.ok) {
        setAddOpen(false);
        setFound(null);
        setPhone('');
        setAddCategory('');
        onChanged();
      } else {
        setAddError("Impossible d'ajouter cet élève.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (students === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn('chip', filter === f ? 'chip-primary' : 'bg-surface-2 text-secondary')}
            >
              {f === 'ALL' ? 'Tous' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-ghost !px-4 !py-2 text-xs">
          <i className="ti ti-plus" aria-hidden="true" />
          Ajouter un élève
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<i className="ti ti-users" aria-hidden="true" />}
          title="Aucun élève"
          description="Les élèves confirmés depuis une demande, ou ajoutés manuellement, apparaîtront ici."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setOpenId(s.id);
                setCategory(s.licenseCategory ?? '');
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-token bg-surface-1 p-4 text-left shadow-soft transition-colors hover:border-primary-200"
            >
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-foreground">
                  {s.user?.name}
                </p>
                <p className="text-xs text-secondary">
                  {s.user?.phone}
                  {s.licenseCategory ? ` · Permis ${s.licenseCategory}` : ''} · {fmtDate(s.enrolledAt)}
                </p>
              </div>
              <span className={cn('chip shrink-0', STATUS_CHIP[s.status])}>
                {STATUS_LABEL[s.status]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Detail sheet */}
      <Sheet open={!!open} onClose={() => setOpenId(null)} ariaLabel="Détail de l'élève">
        {open && (
          <div>
            <p className="font-display text-lg font-bold text-foreground">{open.user?.name}</p>
            <span className={cn('chip mt-1', STATUS_CHIP[open.status])}>
              {STATUS_LABEL[open.status]}
            </span>

            <div className="mt-4 space-y-1.5 text-sm text-secondary">
              <p className="flex items-center gap-2">
                <i className="ti ti-phone" aria-hidden="true" /> {open.user?.phone}
              </p>
              {open.user?.email && (
                <p className="flex items-center gap-2">
                  <i className="ti ti-mail" aria-hidden="true" /> {open.user.email}
                </p>
              )}
              <p className="flex items-center gap-2">
                <i className="ti ti-calendar" aria-hidden="true" /> Inscrit le {fmtDate(open.enrolledAt)}
              </p>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-bold text-secondary">Catégorie de permis</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="B"
                className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
              />
            </div>

            {nextActions(open.status).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {nextActions(open.status).map((a) => (
                  <button
                    key={a.target}
                    disabled={submitting}
                    onClick={() => setStatus(a.target)}
                    className={a.target === SchoolStudentStatus.WITHDRAWN ? 'btn-danger flex-1' : 'btn-primary flex-1'}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Sheet>

      {/* Add sheet */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} ariaLabel="Ajouter un élève">
        <p className="font-display text-lg font-bold text-foreground">Ajouter un élève</p>
        <p className="mt-1 text-xs text-secondary">
          La personne doit déjà avoir un compte PERMIS 2.0.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setFound(null);
            }}
            placeholder="77 123 45 67"
            className="flex-1 rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
          />
          <button onClick={lookup} disabled={busy} className="btn-ghost !px-4 !py-2.5 text-sm">
            Rechercher
          </button>
        </div>
        {addError && <p className="mt-2 text-xs font-medium text-danger">{addError}</p>}

        {found && (
          <div className="mt-3 space-y-3 rounded-xl bg-surface-2 p-3">
            <div>
              <p className="text-sm font-bold text-foreground">{found.name}</p>
              <p className="text-xs text-secondary">{found.phone}</p>
            </div>
            <input
              value={addCategory}
              onChange={(e) => setAddCategory(e.target.value)}
              placeholder="Catégorie de permis (ex: B)"
              className="w-full rounded-xl border border-token bg-surface-1 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
            <button onClick={addStudent} disabled={busy} className="btn-primary w-full">
              Ajouter comme élève
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
