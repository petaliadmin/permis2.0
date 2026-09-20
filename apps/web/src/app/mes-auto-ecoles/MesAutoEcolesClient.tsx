'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { SchoolEnrollmentRequest, SchoolPayment, SchoolStudent, Session } from '@permis2.0/types';
import {
  SchoolEnrollmentStatus,
  SchoolPaymentStatus,
  SchoolStudentStatus,
  SessionStatus,
} from '@permis2.0/types';
import { EmptyState, Skeleton } from '@permis2.0/ui';
import { AppShell, PageHeader } from '@/components/AppShell';
import { useAuthStore } from '@/store/authStore';
import { IconCar, IconSchool, IconSteeringWheel } from '@tabler/icons-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const REQUEST_STATUS_LABEL: Record<string, string> = {
  SENT: 'Envoyée',
  IN_PROGRESS: 'En cours',
  ACCEPTED: 'Acceptée',
  REFUSED: 'Refusée',
  CONFIRMED: 'Confirmée',
};

const REQUEST_STATUS_CHIP: Record<string, string> = {
  SENT: 'chip-primary',
  IN_PROGRESS: 'chip-orange',
  ACCEPTED: 'chip-violet',
  REFUSED: 'chip-danger',
  CONFIRMED: 'chip-success',
};

const STUDENT_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  GRADUATED: 'Diplômé',
  WITHDRAWN: 'Parti',
};

const STUDENT_STATUS_CHIP: Record<string, string> = {
  ACTIVE: 'chip-success',
  SUSPENDED: 'chip-orange',
  GRADUATED: 'chip-violet',
  WITHDRAWN: 'chip-danger',
};

const SESSION_TYPE_LABEL: Record<string, string> = { THEORY: 'Théorie', PRACTICE: 'Pratique' };

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  PAID: 'Payée',
  OVERDUE: 'En retard',
  CANCELLED: 'Annulée',
};

const PAYMENT_STATUS_CHIP: Record<string, string> = {
  PENDING: 'chip-orange',
  PAID: 'chip-success',
  OVERDUE: 'chip-danger',
  CANCELLED: 'bg-surface-2 text-secondary',
};

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtDateTime = (d: string | Date) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function MesAutoEcolesClient() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [enrollments, setEnrollments] = useState<SchoolStudent[] | null>(null);
  const [requests, setRequests] = useState<SchoolEnrollmentRequest[] | null>(null);
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [payments, setPayments] = useState<SchoolPayment[] | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login?redirect=/mes-auto-ecoles');
      return;
    }
    fetch(`${API_URL}/schools/my-enrollments`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then(setEnrollments)
      .catch(() => setEnrollments([]));
    fetch(`${API_URL}/schools/my-requests`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then(setRequests)
      .catch(() => setRequests([]));
    fetch(`${API_URL}/schools/my-sessions`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then(setSessions)
      .catch(() => setSessions([]));
    fetch(`${API_URL}/schools/my-payments`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then(setPayments)
      .catch(() => setPayments([]));
  }, [isAuthenticated, router]);

  const pendingRequests = (requests ?? []).filter(
    (r) => r.status !== SchoolEnrollmentStatus.CONFIRMED
  );
  const upcomingSessions = (sessions ?? [])
    .filter((s) => s.status === SessionStatus.SCHEDULED && new Date(s.startsAt).getTime() >= Date.now())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const outstandingPayments = (payments ?? []).filter(
    (p) => p.status === SchoolPaymentStatus.PENDING || p.status === SchoolPaymentStatus.OVERDUE
  );
  const loading = enrollments === null || requests === null || sessions === null || payments === null;
  const isEmpty = !loading && (enrollments?.length ?? 0) === 0 && pendingRequests.length === 0;

  return (
    <AppShell>
      <PageHeader title="Mes auto-écoles" accent="blue" menu />

      <div className="space-y-6 px-5 pt-6">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {isEmpty && (
          <EmptyState
            icon={<IconSchool size="1em" aria-hidden="true" />}
            title="Aucune auto-école pour l'instant"
            description="Trouvez une auto-école partenaire et faites votre pré-inscription en ligne."
            action={
              <Link href="/ecoles" className="btn-primary mt-2">
                Trouver une auto-école
              </Link>
            }
          />
        )}

        {!loading && (enrollments?.length ?? 0) > 0 && (
          <section>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Mes inscriptions
            </p>
            <div className="space-y-2.5">
              {enrollments!.map((e) => (
                <Link
                  key={e.id}
                  href={e.school ? `/ecoles/${e.school.slug}` : '/ecoles'}
                  className="flex items-center justify-between rounded-2xl border border-token bg-surface-1 p-4 shadow-soft"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-bold text-foreground">
                      {e.school?.name ?? 'Auto-école'}
                    </p>
                    <p className="text-xs text-secondary">
                      {[e.school?.district, e.school?.city].filter(Boolean).join(', ') || '—'}
                      {e.licenseCategory ? ` · Permis ${e.licenseCategory}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">Inscrit le {fmtDate(e.enrolledAt)}</p>
                    {e.assignedInstructor?.user && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-secondary">
                        <IconSteeringWheel size="1em" aria-hidden="true" />
                        Moniteur : {e.assignedInstructor.user.name}
                      </p>
                    )}
                    {e.assignedVehicle && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-secondary">
                        <IconCar size="1em" aria-hidden="true" />
                        Véhicule : {e.assignedVehicle.plate}
                      </p>
                    )}
                  </div>
                  <span
                    className={`chip shrink-0 ${STUDENT_STATUS_CHIP[e.status] ?? 'bg-surface-2 text-secondary'}`}
                  >
                    {STUDENT_STATUS_LABEL[e.status] ?? e.status}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {!loading && upcomingSessions.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Mes rendez-vous
            </p>
            <div className="space-y-2.5">
              {upcomingSessions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-token bg-surface-1 p-4 shadow-soft"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-display text-sm font-bold text-foreground">
                      {fmtDateTime(s.startsAt)}
                    </p>
                    <span className="chip chip-primary">{SESSION_TYPE_LABEL[s.type] ?? s.type}</span>
                  </div>
                  <p className="mt-1 text-xs text-secondary">{s.school?.name ?? 'Auto-école'}</p>
                  {(s.instructor?.user || s.vehicle) && (
                    <p className="mt-1 text-xs text-muted">
                      {s.instructor?.user && `Moniteur : ${s.instructor.user.name}`}
                      {s.instructor?.user && s.vehicle ? ' · ' : ''}
                      {s.vehicle && `Véhicule : ${s.vehicle.plate}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && outstandingPayments.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Mes paiements
            </p>
            <div className="space-y-2.5">
              {outstandingPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl border border-token bg-surface-1 p-4 shadow-soft"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-bold text-foreground">
                      {p.description}
                    </p>
                    <p className="text-xs text-secondary">
                      {p.school?.name ?? 'Auto-école'} · {fmtXof(p.amountXof)}
                    </p>
                    {p.dueDate && (
                      <p className="mt-0.5 text-xs text-muted">Échéance : {fmtDate(p.dueDate)}</p>
                    )}
                  </div>
                  <span
                    className={`chip shrink-0 ${PAYMENT_STATUS_CHIP[p.status] ?? 'bg-surface-2 text-secondary'}`}
                  >
                    {PAYMENT_STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && pendingRequests.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Mes demandes en cours
            </p>
            <div className="space-y-2.5">
              {pendingRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-2xl border border-token bg-surface-1 p-4 shadow-soft"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-bold text-foreground">
                      {r.school?.name ?? 'Auto-école'}
                    </p>
                    <p className="text-xs text-secondary">
                      {[r.school?.district, r.school?.city].filter(Boolean).join(', ') || '—'}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">Envoyée le {fmtDate(r.createdAt)}</p>
                  </div>
                  <span
                    className={`chip shrink-0 ${REQUEST_STATUS_CHIP[r.status] ?? 'bg-surface-2 text-secondary'}`}
                  >
                    {REQUEST_STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
