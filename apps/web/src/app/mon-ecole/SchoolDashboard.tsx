'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type {
  School,
  SchoolEnrollmentRequest,
  SchoolMembership,
  SchoolPayment,
  SchoolStudent,
  Session,
  Vehicle,
} from '@permis2.0/types';
import { SchoolEnrollmentStatus, SchoolPaymentStatus, SchoolStatus } from '@permis2.0/types';
import { Stat } from '@permis2.0/ui';
import { cn } from '@/lib/cn';
import { SideMenuProvider, MenuButton } from '@/components/SideMenu';
import { EnrollmentRequestsPanel } from './EnrollmentRequestsPanel';
import { TeamPanel } from './TeamPanel';
import { StudentsPanel } from './StudentsPanel';
import { VehiclesPanel } from './VehiclesPanel';
import { SessionsPanel } from './SessionsPanel';
import { PaymentsPanel } from './PaymentsPanel';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const TABS = [
  { key: 'overview', label: "Vue d'ensemble" },
  { key: 'demandes', label: 'Demandes' },
  { key: 'eleves', label: 'Élèves' },
  { key: 'equipe', label: 'Équipe' },
  { key: 'vehicules', label: 'Véhicules' },
  { key: 'planning', label: 'Planning' },
  { key: 'finances', label: 'Finances' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

const PENDING_STATUSES: string[] = [SchoolEnrollmentStatus.SENT, SchoolEnrollmentStatus.IN_PROGRESS];

interface SchoolDashboardProps {
  school: School;
  onBackToPicker?: () => void;
  /** Refetches /schools/mine — call after anything that could change school-level data (e.g. studentsCount). */
  onSchoolUpdated: () => void;
}

export function SchoolDashboard({ school, onBackToPicker, onSchoolUpdated }: SchoolDashboardProps) {
  const [tab, setTab] = useState<TabKey>('overview');
  const [requests, setRequests] = useState<SchoolEnrollmentRequest[] | null>(null);
  const [members, setMembers] = useState<SchoolMembership[] | null>(null);
  const [students, setStudents] = useState<SchoolStudent[] | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [payments, setPayments] = useState<SchoolPayment[] | null>(null);

  const fetchRequests = useCallback(async () => {
    const res = await fetch(`${API_URL}/schools/${school.id}/enrollment-requests`, {
      credentials: 'include',
    });
    setRequests(res.ok ? await res.json() : []);
  }, [school.id]);

  const fetchMembers = useCallback(async () => {
    const res = await fetch(`${API_URL}/schools/${school.id}/members`, { credentials: 'include' });
    setMembers(res.ok ? await res.json() : []);
  }, [school.id]);

  const fetchStudents = useCallback(async () => {
    const res = await fetch(`${API_URL}/schools/${school.id}/students`, { credentials: 'include' });
    setStudents(res.ok ? await res.json() : []);
  }, [school.id]);

  const fetchVehicles = useCallback(async () => {
    const res = await fetch(`${API_URL}/schools/${school.id}/vehicles`, { credentials: 'include' });
    setVehicles(res.ok ? await res.json() : []);
  }, [school.id]);

  const fetchSessions = useCallback(async () => {
    const res = await fetch(`${API_URL}/schools/${school.id}/sessions`, { credentials: 'include' });
    setSessions(res.ok ? await res.json() : []);
  }, [school.id]);

  const fetchPayments = useCallback(async () => {
    const res = await fetch(`${API_URL}/schools/${school.id}/payments`, { credentials: 'include' });
    setPayments(res.ok ? await res.json() : []);
  }, [school.id]);

  useEffect(() => {
    fetchRequests();
    fetchMembers();
    fetchStudents();
    fetchVehicles();
    fetchSessions();
    fetchPayments();
  }, [fetchRequests, fetchMembers, fetchStudents, fetchVehicles, fetchSessions, fetchPayments]);

  const pendingCount = requests?.filter((r) => PENDING_STATUSES.includes(r.status)).length ?? 0;
  const pendingPaymentsCount =
    payments?.filter(
      (p) => p.status === SchoolPaymentStatus.PENDING || p.status === SchoolPaymentStatus.OVERDUE
    ).length ?? 0;

  return (
    <SideMenuProvider>
    <div className="on-light min-h-screen bg-surface">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-token bg-surface-1/90 px-4 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-2.5">
          <MenuButton />
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-black text-white">
            🏫
          </span>
          <p className="font-display text-sm font-extrabold text-foreground sm:text-base">
            {school.name}
          </p>
        </div>
        {onBackToPicker && (
          <button
            onClick={onBackToPicker}
            className="rounded-full border border-token bg-surface-2 px-3.5 py-1.5 text-xs font-bold text-secondary transition-colors hover:border-primary-300 hover:text-primary-600"
          >
            Changer d&apos;auto-école
          </button>
        )}
      </header>

      {school.status !== SchoolStatus.ACTIVE && (
        <div
          className={cn(
            'px-4 py-2.5 text-center text-sm font-semibold sm:px-8',
            school.status === SchoolStatus.PENDING
              ? 'bg-orange-50 text-orange-700'
              : 'bg-red-50 text-danger'
          )}
        >
          {school.status === SchoolStatus.PENDING
            ? "Votre fiche est en attente de validation — elle n'apparaît pas encore dans l'annuaire public."
            : 'Votre fiche est suspendue — contactez le support.'}
        </div>
      )}

      <nav className="border-b border-token bg-surface-1">
        <div className="no-scrollbar mx-auto flex max-w-5xl gap-6 overflow-x-auto px-4 sm:px-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'shrink-0 border-b-2 py-3 text-sm font-bold transition-colors',
                tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-secondary'
              )}
            >
              {t.label}
              {t.key === 'demandes' && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              icon={<i className="ti ti-users" aria-hidden="true" />}
              label="Élèves"
              value={school.studentsCount ?? 0}
              accent="bg-primary-100 text-primary-700"
            />
            <Stat
              icon={<i className="ti ti-inbox" aria-hidden="true" />}
              label="Demandes en attente"
              value={pendingCount}
              accent="bg-orange-100 text-orange-700"
            />
            <Stat
              icon={<i className="ti ti-users-group" aria-hidden="true" />}
              label="Équipe"
              value={members?.length ?? 0}
              accent="bg-violet-100 text-violet-700"
            />
            <Stat
              icon={<i className="ti ti-car" aria-hidden="true" />}
              label="Véhicules"
              value={vehicles?.length ?? 0}
              accent="bg-teal-100 text-teal-700"
            />
            <Stat
              icon={<i className="ti ti-receipt" aria-hidden="true" />}
              label="Factures impayées"
              value={pendingPaymentsCount}
              accent="bg-red-100 text-danger"
            />
          </div>
        )}

        {tab === 'demandes' && (
          <EnrollmentRequestsPanel
            schoolId={school.id}
            requests={requests}
            onChanged={() => {
              fetchRequests();
              onSchoolUpdated();
            }}
          />
        )}

        {tab === 'eleves' && (
          <StudentsPanel
            schoolId={school.id}
            students={students}
            members={members}
            vehicles={vehicles}
            onChanged={() => {
              fetchStudents();
              onSchoolUpdated();
            }}
          />
        )}

        {tab === 'equipe' && (
          <TeamPanel schoolId={school.id} members={members} onChanged={fetchMembers} />
        )}

        {tab === 'vehicules' && (
          <VehiclesPanel schoolId={school.id} vehicles={vehicles} onChanged={fetchVehicles} />
        )}

        {tab === 'planning' && (
          <SessionsPanel
            schoolId={school.id}
            sessions={sessions}
            students={students}
            members={members}
            vehicles={vehicles}
            onChanged={fetchSessions}
          />
        )}

        {tab === 'finances' && (
          <PaymentsPanel
            schoolId={school.id}
            payments={payments}
            students={students}
            onChanged={fetchPayments}
          />
        )}
      </main>
    </div>
    </SideMenuProvider>
  );
}
