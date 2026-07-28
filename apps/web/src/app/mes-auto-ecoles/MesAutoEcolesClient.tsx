'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { SchoolEnrollmentRequest, SchoolStudent } from '@permis2.0/types';
import { SchoolEnrollmentStatus, SchoolStudentStatus } from '@permis2.0/types';
import { EmptyState, Skeleton } from '@permis2.0/ui';
import { AppShell, PageHeader } from '@/components/AppShell';
import { useAuthStore } from '@/store/authStore';

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

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function MesAutoEcolesClient() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [enrollments, setEnrollments] = useState<SchoolStudent[] | null>(null);
  const [requests, setRequests] = useState<SchoolEnrollmentRequest[] | null>(null);

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
  }, [isAuthenticated, router]);

  const pendingRequests = (requests ?? []).filter(
    (r) => r.status !== SchoolEnrollmentStatus.CONFIRMED
  );
  const loading = enrollments === null || requests === null;
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
            icon={<i className="ti ti-school" aria-hidden="true" />}
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
                        <i className="ti ti-steering-wheel" aria-hidden="true" />
                        Moniteur : {e.assignedInstructor.user.name}
                      </p>
                    )}
                    {e.assignedVehicle && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-secondary">
                        <i className="ti ti-car" aria-hidden="true" />
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
