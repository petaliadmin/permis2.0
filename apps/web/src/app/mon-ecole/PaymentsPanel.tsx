'use client';

import { useMemo, useState } from 'react';
import type { SchoolPayment, SchoolStudent } from '@permis2.0/types';
import { SchoolPaymentStatus } from '@permis2.0/types';
import { EmptyState, Sheet, Skeleton } from '@permis2.0/ui';
import { cn } from '@/lib/cn';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  PAID: 'Payée',
  OVERDUE: 'En retard',
  CANCELLED: 'Annulée',
};

const STATUS_CHIP: Record<string, string> = {
  PENDING: 'chip-orange',
  PAID: 'chip-success',
  OVERDUE: 'chip-danger',
  CANCELLED: 'bg-surface-2 text-secondary',
};

const FILTERS = ['ALL', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'] as const;

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;
const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

interface PaymentsPanelProps {
  schoolId: string;
  payments: SchoolPayment[] | null;
  students: SchoolStudent[] | null;
  onChanged: () => void;
}

export function PaymentsPanel({ schoolId, payments, students, onChanged }: PaymentsPanelProps) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const [openId, setOpenId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    studentId: '',
    amountXof: '',
    description: '',
    dueDate: '',
    method: '',
  });
  const [createError, setCreateError] = useState('');

  const filtered = useMemo(
    () => (payments ?? []).filter((p) => filter === 'ALL' || p.status === filter),
    [payments, filter]
  );
  const open = payments?.find((p) => p.id === openId) ?? null;

  const totals = useMemo(() => {
    const list = payments ?? [];
    const paid = list.filter((p) => p.status === SchoolPaymentStatus.PAID).reduce((s, p) => s + p.amountXof, 0);
    const pending = list
      .filter((p) => p.status === SchoolPaymentStatus.PENDING || p.status === SchoolPaymentStatus.OVERDUE)
      .reduce((s, p) => s + p.amountXof, 0);
    return { paid, pending };
  }, [payments]);

  const patchPayment = async (data: Record<string, unknown>) => {
    if (!open) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/schools/${schoolId}/payments/${open.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setOpenId(null);
        onChanged();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const createPayment = async () => {
    if (!form.studentId) return setCreateError('Choisissez un élève.');
    const amount = parseInt(form.amountXof, 10);
    if (!amount || amount <= 0) return setCreateError('Montant invalide.');
    if (!form.description.trim()) return setCreateError('Ajoutez une description.');
    setCreateError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/schools/${schoolId}/payments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: form.studentId,
          amountXof: amount,
          description: form.description.trim(),
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
          method: form.method || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Une erreur est survenue.');
      }
      setCreateOpen(false);
      setForm({ studentId: '', amountXof: '', description: '', dueDate: '', method: '' });
      onChanged();
    } catch (e: any) {
      setCreateError(e.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  if (payments === null) {
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
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-token bg-surface-1 p-4 shadow-soft">
          <p className="text-xs font-bold text-secondary">Encaissé</p>
          <p className="mt-1 font-display text-lg font-extrabold text-success">{fmtXof(totals.paid)}</p>
        </div>
        <div className="rounded-2xl border border-token bg-surface-1 p-4 shadow-soft">
          <p className="text-xs font-bold text-secondary">En attente</p>
          <p className="mt-1 font-display text-lg font-extrabold text-orange-600">
            {fmtXof(totals.pending)}
          </p>
        </div>
      </div>

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
          Créer une facture
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<i className="ti ti-receipt" aria-hidden="true" />}
          title="Aucune facture"
          description="Créez une facture pour suivre les échéances de vos élèves."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setOpenId(p.id)}
              className="flex w-full items-center justify-between rounded-2xl border border-token bg-surface-1 p-4 text-left shadow-soft transition-colors hover:border-primary-200"
            >
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-foreground">
                  {p.student?.user?.name ?? 'Élève'}
                </p>
                <p className="text-xs text-secondary">
                  {p.description} · {fmtXof(p.amountXof)}
                </p>
                {p.dueDate && (
                  <p className="mt-0.5 text-xs text-muted">Échéance : {fmtDate(p.dueDate)}</p>
                )}
              </div>
              <span className={cn('chip shrink-0', STATUS_CHIP[p.status])}>
                {STATUS_LABEL[p.status]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Detail sheet */}
      <Sheet open={!!open} onClose={() => setOpenId(null)} ariaLabel="Détail de la facture">
        {open && (
          <div>
            <p className="font-display text-lg font-bold text-foreground">
              {open.student?.user?.name ?? 'Élève'}
            </p>
            <span className={cn('chip mt-1', STATUS_CHIP[open.status])}>
              {STATUS_LABEL[open.status]}
            </span>

            <div className="mt-4 space-y-1.5 text-sm text-secondary">
              <p>{open.description}</p>
              <p className="font-display text-lg font-extrabold text-foreground">
                {fmtXof(open.amountXof)}
              </p>
              {open.dueDate && (
                <p className="flex items-center gap-2">
                  <i className="ti ti-calendar" aria-hidden="true" /> Échéance : {fmtDate(open.dueDate)}
                </p>
              )}
              {open.method && (
                <p className="flex items-center gap-2">
                  <i className="ti ti-credit-card" aria-hidden="true" /> {open.method}
                </p>
              )}
              {open.paidAt && (
                <p className="flex items-center gap-2 text-success">
                  <i className="ti ti-circle-check" aria-hidden="true" /> Payée le {fmtDate(open.paidAt)}
                </p>
              )}
            </div>

            {(open.status === SchoolPaymentStatus.PENDING || open.status === SchoolPaymentStatus.OVERDUE) && (
              <div className="mt-4 flex gap-2">
                <button
                  disabled={submitting}
                  onClick={() => patchPayment({ status: SchoolPaymentStatus.CANCELLED })}
                  className="btn-danger !px-4"
                >
                  Annuler
                </button>
                <button
                  disabled={submitting}
                  onClick={() => patchPayment({ status: SchoolPaymentStatus.PAID })}
                  className="btn-primary flex-1"
                >
                  Marquer payée
                </button>
              </div>
            )}
          </div>
        )}
      </Sheet>

      {/* Create sheet */}
      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} ariaLabel="Créer une facture">
        <p className="font-display text-lg font-bold text-foreground">Créer une facture</p>

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
                  {s.user?.name ?? s.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Montant (FCFA)</label>
            <input
              type="number"
              value={form.amountXof}
              onChange={(e) => setForm((f) => ({ ...f, amountXof: e.target.value }))}
              placeholder="150000"
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Échéance</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-secondary">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Frais d'inscription"
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-secondary">Méthode (optionnel)</label>
            <input
              value={form.method}
              onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
              placeholder="Espèces, Wave, Orange Money…"
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
        </div>

        {createError && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">
            {createError}
          </p>
        )}

        <button disabled={submitting} onClick={createPayment} className="btn-primary mt-4 w-full">
          {submitting ? 'Création…' : 'Créer la facture'}
        </button>
      </Sheet>
    </div>
  );
}
