'use client';

import { useMemo, useState } from 'react';
import type { SchoolEnrollmentRequest } from '@permis2.0/types';
import { SchoolEnrollmentStatus } from '@permis2.0/types';
import { EmptyState, Sheet, Skeleton } from '@permis2.0/ui';
import { cn } from '@/lib/cn';
import { IconBrandWhatsapp, IconInbox, IconLicense, IconMail, IconMapPin, IconPhone } from '@tabler/icons-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const STATUS_LABEL: Record<string, string> = {
  SENT: 'Envoyée',
  IN_PROGRESS: 'En cours',
  ACCEPTED: 'Acceptée',
  REFUSED: 'Refusée',
  CONFIRMED: 'Confirmée',
};

const STATUS_CHIP: Record<string, string> = {
  SENT: 'chip-primary',
  IN_PROGRESS: 'chip-orange',
  ACCEPTED: 'chip-violet',
  REFUSED: 'chip-danger',
  CONFIRMED: 'chip-success',
};

const FILTERS = ['ALL', 'SENT', 'IN_PROGRESS', 'ACCEPTED', 'REFUSED', 'CONFIRMED'] as const;

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

/** Only the forward transitions that make sense from the current status. */
function nextActions(status: string): { label: string; target: string }[] {
  switch (status) {
    case SchoolEnrollmentStatus.SENT:
      return [
        { label: 'Prendre en charge', target: SchoolEnrollmentStatus.IN_PROGRESS },
        { label: 'Refuser', target: SchoolEnrollmentStatus.REFUSED },
      ];
    case SchoolEnrollmentStatus.IN_PROGRESS:
      return [
        { label: 'Accepter', target: SchoolEnrollmentStatus.ACCEPTED },
        { label: 'Refuser', target: SchoolEnrollmentStatus.REFUSED },
      ];
    case SchoolEnrollmentStatus.ACCEPTED:
      return [
        { label: "Confirmer l'inscription", target: SchoolEnrollmentStatus.CONFIRMED },
        { label: 'Refuser', target: SchoolEnrollmentStatus.REFUSED },
      ];
    default:
      return [];
  }
}

interface EnrollmentRequestsPanelProps {
  schoolId: string;
  requests: SchoolEnrollmentRequest[] | null;
  onChanged: () => void;
}

export function EnrollmentRequestsPanel({ schoolId, requests, onChanged }: EnrollmentRequestsPanelProps) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(
    () => (requests ?? []).filter((r) => filter === 'ALL' || r.status === filter),
    [requests, filter]
  );
  const open = requests?.find((r) => r.id === openId) ?? null;

  const setStatus = async (target: string) => {
    if (!open) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_URL}/schools/${schoolId}/enrollment-requests/${open.id}/status`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: target, statusNote: note || undefined }),
        }
      );
      if (res.ok) {
        setOpenId(null);
        setNote('');
        onChanged();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (requests === null) {
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
      <div className="mb-4 flex flex-wrap gap-2">
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

      {filtered.length === 0 ? (
        <EmptyState
          icon={<IconInbox size="1em" aria-hidden="true" />}
          title="Aucune demande"
          description="Les nouvelles pré-inscriptions apparaîtront ici."
        />
      ) : (
        <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0 xl:grid-cols-3">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setOpenId(r.id);
                setNote(r.statusNote ?? '');
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-token bg-surface-1 p-4 text-left shadow-soft transition-colors hover:border-primary-200"
            >
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-foreground">
                  {r.firstName} {r.lastName}
                </p>
                <p className="text-xs text-secondary">{r.phone} · {fmtDate(r.createdAt)}</p>
              </div>
              <span className={cn('chip shrink-0', STATUS_CHIP[r.status])}>
                {STATUS_LABEL[r.status]}
              </span>
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!open} onClose={() => setOpenId(null)} ariaLabel="Détail de la demande">
        {open && (
          <div>
            <p className="font-display text-lg font-bold text-foreground">
              {open.firstName} {open.lastName}
            </p>
            <span className={cn('chip mt-1', STATUS_CHIP[open.status])}>
              {STATUS_LABEL[open.status]}
            </span>

            <div className="mt-4 space-y-1.5 text-sm text-secondary">
              <p className="flex items-center gap-2">
                <IconPhone size="1em" aria-hidden="true" /> {open.phone}
              </p>
              {open.whatsapp && (
                <p className="flex items-center gap-2">
                  <IconBrandWhatsapp size="1em" aria-hidden="true" /> {open.whatsapp}
                </p>
              )}
              {open.email && (
                <p className="flex items-center gap-2">
                  <IconMail size="1em" aria-hidden="true" /> {open.email}
                </p>
              )}
              {open.city && (
                <p className="flex items-center gap-2">
                  <IconMapPin size="1em" aria-hidden="true" /> {open.city}
                </p>
              )}
              {open.licenseCategory && (
                <p className="flex items-center gap-2">
                  <IconLicense size="1em" aria-hidden="true" /> Permis {open.licenseCategory}
                </p>
              )}
              {open.message && (
                <p className="mt-2 rounded-xl bg-surface-2 p-3 text-foreground">{open.message}</p>
              )}
            </div>

            {nextActions(open.status).length > 0 && (
              <div className="mt-4">
                <label className="mb-1 block text-xs font-bold text-secondary">
                  Note (visible en cas de refus)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {nextActions(open.status).map((a) => (
                    <button
                      key={a.target}
                      disabled={submitting}
                      onClick={() => setStatus(a.target)}
                      className={a.target === SchoolEnrollmentStatus.REFUSED ? 'btn-danger flex-1' : 'btn-primary flex-1'}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
