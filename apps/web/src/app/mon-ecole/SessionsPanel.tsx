'use client';

import { useMemo, useState } from 'react';
import type { SchoolMembership, SchoolStudent, Session, Vehicle } from '@permis2.0/types';
import { SchoolMemberRole, SessionStatus, SessionType } from '@permis2.0/types';
import { EmptyState, Sheet, Skeleton } from '@permis2.0/ui';
import { cn } from '@/lib/cn';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const TYPE_LABEL: Record<string, string> = { THEORY: 'Théorie', PRACTICE: 'Pratique' };

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Prévue',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  NO_SHOW: 'Absence',
};

const STATUS_CHIP: Record<string, string> = {
  SCHEDULED: 'chip-primary',
  COMPLETED: 'chip-success',
  CANCELLED: 'chip-danger',
  NO_SHOW: 'chip-orange',
};

const FILTERS = ['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;

const fmtDateTime = (d: string | Date) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** yyyy-mm-ddThh:mm for a native <input type="datetime-local">. */
const toDateTimeInput = (d?: string | Date | null) => (d ? new Date(d).toISOString().slice(0, 16) : '');

function nextActions(status: string): { label: string; target: string }[] {
  if (status !== SessionStatus.SCHEDULED) return [];
  return [
    { label: 'Marquer terminée', target: SessionStatus.COMPLETED },
    { label: 'Marquer absence', target: SessionStatus.NO_SHOW },
    { label: 'Annuler', target: SessionStatus.CANCELLED },
  ];
}

interface SessionsPanelProps {
  schoolId: string;
  sessions: Session[] | null;
  students: SchoolStudent[] | null;
  members: SchoolMembership[] | null;
  vehicles: Vehicle[] | null;
  onChanged: () => void;
}

export function SessionsPanel({
  schoolId,
  sessions,
  students,
  members,
  vehicles,
  onChanged,
}: SessionsPanelProps) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    studentId: '',
    type: SessionType.PRACTICE as string,
    startsAt: '',
    endsAt: '',
    instructorMembershipId: '',
    vehicleId: '',
    notes: '',
  });
  const [createError, setCreateError] = useState('');

  const instructors = (members ?? []).filter(
    (m) => m.active && (m.role === SchoolMemberRole.INSTRUCTOR || m.role === SchoolMemberRole.COACH)
  );

  const filtered = useMemo(() => {
    const list = (sessions ?? []).filter((s) => filter === 'ALL' || s.status === filter);
    return [...list].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [sessions, filter]);

  const now = Date.now();
  const upcoming = filtered.filter((s) => new Date(s.startsAt).getTime() >= now);
  const past = filtered.filter((s) => new Date(s.startsAt).getTime() < now).reverse();

  const open = sessions?.find((s) => s.id === openId) ?? null;

  const patchSession = async (extra: Record<string, unknown> = {}) => {
    if (!open) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/schools/${schoolId}/sessions/${open.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || undefined, ...extra }),
      });
      if (res.ok) {
        setOpenId(null);
        onChanged();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const createSession = async () => {
    if (!form.studentId) return setCreateError('Choisissez un élève.');
    if (!form.startsAt || !form.endsAt) return setCreateError('Renseignez les horaires.');
    setCreateError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/schools/${schoolId}/sessions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: form.studentId,
          type: form.type,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
          instructorMembershipId: form.instructorMembershipId || undefined,
          vehicleId: form.vehicleId || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Une erreur est survenue.');
      }
      setCreateOpen(false);
      setForm({
        studentId: '',
        type: SessionType.PRACTICE,
        startsAt: '',
        endsAt: '',
        instructorMembershipId: '',
        vehicleId: '',
        notes: '',
      });
      onChanged();
    } catch (e: any) {
      setCreateError(e.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sessions === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const renderRow = (s: Session) => (
    <button
      key={s.id}
      onClick={() => {
        setOpenId(s.id);
        setNotes(s.notes ?? '');
      }}
      className="flex w-full items-center justify-between rounded-2xl border border-token bg-surface-1 p-4 text-left shadow-soft transition-colors hover:border-primary-200"
    >
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-bold text-foreground">
          {s.student?.user?.name ?? s.student?.guestName ?? 'Élève'}
        </p>
        <p className="text-xs text-secondary">
          {TYPE_LABEL[s.type]} · {fmtDateTime(s.startsAt)}
        </p>
        {(s.instructor || s.vehicle) && (
          <p className="mt-0.5 text-xs text-muted">
            {s.instructor && `Moniteur : ${s.instructor.user?.name ?? s.instructor.guestName}`}
            {s.instructor && s.vehicle ? ' · ' : ''}
            {s.vehicle && `Véhicule : ${s.vehicle.plate}`}
          </p>
        )}
      </div>
      <span className={cn('chip shrink-0', STATUS_CHIP[s.status])}>{STATUS_LABEL[s.status]}</span>
    </button>
  );

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
              {f === 'ALL' ? 'Toutes' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-ghost !px-4 !py-2 text-xs">
          <i className="ti ti-plus" aria-hidden="true" />
          Ajouter une séance
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<i className="ti ti-calendar-event" aria-hidden="true" />}
          title="Aucune séance"
          description="Planifiez des séances théoriques ou pratiques pour vos élèves."
        />
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">À venir</p>
              <div className="space-y-2.5">{upcoming.map(renderRow)}</div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Passées</p>
              <div className="space-y-2.5">{past.map(renderRow)}</div>
            </section>
          )}
        </div>
      )}

      {/* Detail sheet */}
      <Sheet open={!!open} onClose={() => setOpenId(null)} ariaLabel="Détail de la séance">
        {open && (
          <div>
            <p className="font-display text-lg font-bold text-foreground">
              {open.student?.user?.name ?? open.student?.guestName ?? 'Élève'}
            </p>
            <span className={cn('chip mt-1', STATUS_CHIP[open.status])}>
              {STATUS_LABEL[open.status]}
            </span>

            <div className="mt-4 space-y-1.5 text-sm text-secondary">
              <p className="flex items-center gap-2">
                <i className="ti ti-category" aria-hidden="true" /> {TYPE_LABEL[open.type]}
              </p>
              <p className="flex items-center gap-2">
                <i className="ti ti-calendar" aria-hidden="true" /> {fmtDateTime(open.startsAt)} —{' '}
                {fmtDateTime(open.endsAt)}
              </p>
              {open.instructor && (
                <p className="flex items-center gap-2">
                  <i className="ti ti-steering-wheel" aria-hidden="true" />{' '}
                  {open.instructor.user?.name ?? open.instructor.guestName}
                </p>
              )}
              {open.vehicle && (
                <p className="flex items-center gap-2">
                  <i className="ti ti-car" aria-hidden="true" /> {open.vehicle.plate}
                </p>
              )}
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-bold text-secondary">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
              />
            </div>

            <button
              disabled={submitting}
              onClick={() => patchSession()}
              className="btn-ghost mt-3 w-full"
            >
              Enregistrer
            </button>

            {nextActions(open.status).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {nextActions(open.status).map((a) => (
                  <button
                    key={a.target}
                    disabled={submitting}
                    onClick={() => patchSession({ status: a.target })}
                    className={a.target === SessionStatus.CANCELLED ? 'btn-danger flex-1' : 'btn-primary flex-1'}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Sheet>

      {/* Create sheet */}
      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} ariaLabel="Ajouter une séance">
        <p className="font-display text-lg font-bold text-foreground">Ajouter une séance</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-secondary">Élève</label>
            <select
              value={form.studentId}
              onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            >
              <option value="">Sélectionner</option>
              {(students ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user?.name ?? s.guestName ?? s.id}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-secondary">Type</label>
            <div className="flex gap-2">
              {Object.values(SessionType).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={cn('chip', form.type === t ? 'chip-primary' : 'bg-surface-2 text-secondary')}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Début</label>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Fin</label>
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Moniteur</label>
            <select
              value={form.instructorMembershipId}
              onChange={(e) => setForm((f) => ({ ...f, instructorMembershipId: e.target.value }))}
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            >
              <option value="">Aucun</option>
              {instructors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.user?.name ?? m.guestName ?? m.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Véhicule</label>
            <select
              value={form.vehicleId}
              onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            >
              <option value="">Aucun</option>
              {(vehicles ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-secondary">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
        </div>

        {createError && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">
            {createError}
          </p>
        )}

        <button disabled={submitting} onClick={createSession} className="btn-primary mt-4 w-full">
          {submitting ? 'Création…' : 'Planifier la séance'}
        </button>
      </Sheet>
    </div>
  );
}
