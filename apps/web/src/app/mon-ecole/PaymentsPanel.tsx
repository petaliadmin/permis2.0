'use client';

import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import type { School, SchoolPayment, SchoolPaymentItem, SchoolStudent } from '@permis2.0/types';
import { SchoolPaymentStatus, SchoolPaymentType } from '@permis2.0/types';
import { EmptyState, Sheet, Skeleton } from '@permis2.0/ui';
import { cn } from '@/lib/cn';
import { whatsappLink } from '@/lib/contact';
import { generateInvoicePdf, invoiceFilename } from '@/lib/invoicePdf';

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

const TYPE_LABEL: Record<string, string> = { DEVIS: 'Devis', FACTURE: 'Facture' };

const FILTERS = ['ALL', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'] as const;

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;
const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const emptyItem = (): SchoolPaymentItem => ({ label: '', qty: 1, unitPriceXof: 0 });

/** Converts a Blob to a base64 string (no data: prefix), for the email-send endpoint. */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

interface PaymentsPanelProps {
  schoolId: string;
  school: Pick<School, 'name' | 'address' | 'city' | 'phone' | 'email'>;
  payments: SchoolPayment[] | null;
  students: SchoolStudent[] | null;
  onChanged: () => void;
}

export interface PaymentsPanelHandle {
  openCreate: () => void;
}

export const PaymentsPanel = forwardRef<PaymentsPanelHandle, PaymentsPanelProps>(function PaymentsPanel({
  schoolId,
  school,
  payments,
  students,
  onChanged,
}, ref) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const [openId, setOpenId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [emailTo, setEmailTo] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [type, setType] = useState<SchoolPaymentType>(SchoolPaymentType.FACTURE);
  const [form, setForm] = useState({
    studentId: '',
    description: '',
    dueDate: '',
    method: '',
    notes: '',
  });
  const [items, setItems] = useState<SchoolPaymentItem[]>([emptyItem()]);
  const [createError, setCreateError] = useState('');

  useImperativeHandle(ref, () => ({ openCreate: () => setCreateOpen(true) }), []);

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

  const itemsTotal = items.reduce((s, i) => s + (i.qty || 0) * (i.unitPriceXof || 0), 0);

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

  const resetCreateForm = () => {
    setForm({ studentId: '', description: '', dueDate: '', method: '', notes: '' });
    setItems([emptyItem()]);
    setType(SchoolPaymentType.FACTURE);
    setCreateError('');
  };

  const createPayment = async () => {
    if (!form.studentId) return setCreateError('Choisissez un élève.');
    const cleanItems = items.filter((i) => i.label.trim() && i.qty > 0);
    if (cleanItems.length === 0) return setCreateError('Ajoutez au moins une ligne valide.');
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
          type,
          items: cleanItems,
          description: form.description.trim(),
          notes: form.notes || undefined,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
          method: form.method || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Une erreur est survenue.');
      }
      setCreateOpen(false);
      resetCreateForm();
      onChanged();
    } catch (e: any) {
      setCreateError(e.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPdf = () => {
    if (!open) return;
    const blob = generateInvoicePdf(school, open, open.student);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = invoiceFilename(open);
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendEmail = async () => {
    if (!open) return;
    const to = emailTo.trim() || open.student?.user?.email || '';
    if (!to) {
      setShareMsg('Renseignez une adresse email.');
      return;
    }
    setShareBusy(true);
    setShareMsg('');
    try {
      const blob = generateInvoicePdf(school, open, open.student);
      const pdfBase64 = await blobToBase64(blob);
      const res = await fetch(`${API_URL}/schools/${schoolId}/payments/${open.id}/send-email`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, pdfBase64, filename: invoiceFilename(open) }),
      });
      setShareMsg(res.ok ? 'Envoyé par email.' : "Échec de l'envoi.");
    } catch {
      setShareMsg("Échec de l'envoi.");
    } finally {
      setShareBusy(false);
    }
  };

  const shareWhatsapp = async () => {
    if (!open) return;
    const blob = generateInvoicePdf(school, open, open.student);
    const filename = invoiceFilename(open);
    const label = open.type === SchoolPaymentType.DEVIS ? 'devis' : 'facture';
    const text = `Voici votre ${label} ${open.number ?? ''} — ${fmtXof(open.amountXof)}.`;

    const file = new File([blob], filename, { type: 'application/pdf' });
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
    if (nav.canShare?.({ files: [file] }) && navigator.share) {
      try {
        await navigator.share({ files: [file], text, title: filename });
        return;
      } catch {
        // User cancelled the native share sheet — fall through to the desktop fallback below.
      }
    }

    // Desktop / unsupported browsers: WhatsApp can't attach a local file via a
    // link, so download the PDF and open a prefilled chat asking to attach it.
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    window.open(whatsappLink(`${text}\n(fichier ${filename} téléchargé — à joindre manuellement)`), '_blank');
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
          Devis / Facture
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<i className="ti ti-receipt" aria-hidden="true" />}
          title="Aucune facture"
          description="Créez un devis ou une facture pour suivre les échéances de vos élèves."
        />
      ) : (
        <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0 xl:grid-cols-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setOpenId(p.id);
                setEmailTo(p.student?.user?.email ?? '');
                setShareMsg('');
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-token bg-surface-1 p-4 text-left shadow-soft transition-colors hover:border-primary-200"
            >
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-foreground">
                  {p.student?.user?.name ?? p.student?.guestName ?? 'Élève'}
                </p>
                <p className="text-xs text-secondary">
                  {p.number ? `${p.number} · ` : ''}
                  {p.description} · {fmtXof(p.amountXof)}
                </p>
                {p.dueDate && (
                  <p className="mt-0.5 text-xs text-muted">Échéance : {fmtDate(p.dueDate)}</p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className={cn('chip', STATUS_CHIP[p.status])}>{STATUS_LABEL[p.status]}</span>
                <span className="chip bg-surface-2 text-secondary">{TYPE_LABEL[p.type]}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail sheet */}
      <Sheet open={!!open} onClose={() => setOpenId(null)} ariaLabel="Détail de la facture">
        {open && (
          <div>
            <p className="font-display text-lg font-bold text-foreground">
              {open.student?.user?.name ?? open.student?.guestName ?? 'Élève'}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className={cn('chip', STATUS_CHIP[open.status])}>{STATUS_LABEL[open.status]}</span>
              <span className="chip bg-surface-2 text-secondary">{TYPE_LABEL[open.type]}</span>
              {open.number && <span className="chip bg-surface-2 text-secondary">{open.number}</span>}
            </div>

            <div className="mt-4 space-y-1.5 text-sm text-secondary">
              <p>{open.description}</p>
              {open.items && open.items.length > 0 && (
                <div className="rounded-xl border border-token">
                  {open.items.map((i, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-b border-token px-3 py-2 text-xs last:border-b-0"
                    >
                      <span>
                        {i.label} × {i.qty}
                      </span>
                      <span className="font-semibold text-foreground">{fmtXof(i.qty * i.unitPriceXof)}</span>
                    </div>
                  ))}
                </div>
              )}
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
              {open.notes && <p className="italic text-muted">{open.notes}</p>}
              {open.paidAt && (
                <p className="flex items-center gap-2 text-success">
                  <i className="ti ti-circle-check" aria-hidden="true" /> Payée le {fmtDate(open.paidAt)}
                </p>
              )}
            </div>

            {/* Share actions */}
            <div className="mt-4 space-y-2 rounded-xl bg-surface-2 p-3">
              <p className="text-xs font-bold text-secondary">Partager</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={downloadPdf} className="btn-ghost !px-3 !py-2 text-xs">
                  <i className="ti ti-download" aria-hidden="true" />
                  PDF
                </button>
                <button
                  onClick={shareWhatsapp}
                  disabled={shareBusy}
                  className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-2 text-xs font-bold text-white"
                >
                  <i className="ti ti-brand-whatsapp" aria-hidden="true" />
                  WhatsApp
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="email@client.com"
                  className="flex-1 rounded-xl border border-token bg-surface-1 px-3 py-2 text-xs focus:border-primary-400 focus:outline-none"
                />
                <button
                  onClick={sendEmail}
                  disabled={shareBusy}
                  className="btn-ghost !px-3 !py-2 text-xs"
                >
                  <i className="ti ti-mail" aria-hidden="true" />
                  Email
                </button>
              </div>
              {shareMsg && <p className="text-xs font-medium text-secondary">{shareMsg}</p>}
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
      <Sheet
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetCreateForm();
        }}
        ariaLabel="Créer un devis ou une facture"
      >
        <p className="font-display text-lg font-bold text-foreground">Devis / Facture</p>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setType(SchoolPaymentType.DEVIS)}
            className={cn('chip', type === SchoolPaymentType.DEVIS ? 'chip-primary' : 'bg-surface-2 text-secondary')}
          >
            Devis
          </button>
          <button
            onClick={() => setType(SchoolPaymentType.FACTURE)}
            className={cn(
              'chip',
              type === SchoolPaymentType.FACTURE ? 'chip-primary' : 'bg-surface-2 text-secondary'
            )}
          >
            Facture
          </button>
        </div>

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
            <label className="mb-1 block text-xs font-bold text-secondary">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Frais d'inscription"
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-bold text-secondary">Lignes</label>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input
                  value={item.label}
                  onChange={(e) =>
                    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, label: e.target.value } : it)))
                  }
                  placeholder="Libellé"
                  className="min-w-0 flex-1 rounded-xl border border-token bg-surface-2 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
                />
                <input
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, i) => (i === idx ? { ...it, qty: parseInt(e.target.value, 10) || 1 } : it))
                    )
                  }
                  className="w-14 rounded-xl border border-token bg-surface-2 px-2 py-2 text-center text-sm focus:border-primary-400 focus:outline-none"
                />
                <input
                  type="number"
                  min={0}
                  value={item.unitPriceXof}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, i) =>
                        i === idx ? { ...it, unitPriceXof: parseInt(e.target.value, 10) || 0 } : it
                      )
                    )
                  }
                  placeholder="Prix unitaire"
                  className="w-28 rounded-xl border border-token bg-surface-2 px-2 py-2 text-sm focus:border-primary-400 focus:outline-none"
                />
                <button
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  disabled={items.length === 1}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-danger hover:bg-red-50 disabled:opacity-30"
                  aria-label="Retirer la ligne"
                >
                  <i className="ti ti-trash text-sm" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setItems((prev) => [...prev, emptyItem()])}
            className="mt-2 text-xs font-bold text-primary-600 hover:underline"
          >
            + Ajouter une ligne
          </button>
          <p className="mt-2 text-right font-display text-base font-extrabold text-foreground">
            Total : {fmtXof(itemsTotal)}
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Échéance</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Méthode (optionnel)</label>
            <input
              value={form.method}
              onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
              placeholder="Espèces, Wave, Orange Money…"
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-secondary">Notes (optionnel)</label>
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

        <button disabled={submitting} onClick={createPayment} className="btn-primary mt-4 w-full">
          {submitting ? 'Création…' : `Créer ${type === SchoolPaymentType.DEVIS ? 'le devis' : 'la facture'}`}
        </button>
      </Sheet>
    </div>
  );
});
