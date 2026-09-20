'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { School } from '@permis2.0/types';
import { Skeleton } from '@permis2.0/ui';
import { useAuthStore } from '@/store/authStore';
import { SchoolShell } from '@/components/SchoolShell';
import { CreateSchoolForm } from './CreateSchoolForm';
import { SchoolDashboard } from './SchoolDashboard';
import { SubscriptionPaywall } from './SubscriptionPaywall';
import { IconBuildingStore } from '@tabler/icons-react';

function hasActiveSubscription(school: School): boolean {
  return !!school.subscriptionExpiresAt && new Date(school.subscriptionExpiresAt) > new Date();
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function GuestPrompt() {
  const router = useRouter();
  return (
    <SchoolShell>
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <span className="chip chip-primary mb-4">
          <IconBuildingStore size="1em" aria-hidden="true" />
        </span>
        <h1 className="font-display text-2xl font-extrabold text-foreground">
          Gérer mon auto-école
        </h1>
        <p className="mt-2 text-sm text-secondary">
          Connectez-vous pour créer ou gérer votre auto-école sur PERMIS 2.0.
        </p>
        <button
          onClick={() => router.push('/auth/register')}
          className="btn-primary mt-6 w-full"
        >
          Créer mon compte auto-école
        </button>
        <button
          onClick={() => router.push('/auth/login?redirect=/')}
          className="btn-ghost mt-2 w-full"
        >
          J&apos;ai déjà un compte
        </button>
      </div>
    </SchoolShell>
  );
}

function SchoolPicker({
  schools,
  onPick,
}: {
  schools: (School & { myRole?: string | null })[];
  onPick: (school: School) => void;
}) {
  return (
    <SchoolShell>
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-display text-2xl font-extrabold text-foreground">Vos auto-écoles</h1>
        <p className="mt-1 text-sm text-secondary">Choisissez une auto-école à gérer.</p>
        <div className="mt-6 space-y-3">
          {schools.map((s) => (
            <button
              key={s.id}
              onClick={() => onPick(s)}
              className="flex w-full items-center justify-between rounded-2xl border border-token bg-surface-1 p-4 text-left shadow-soft transition-colors hover:border-primary-300"
            >
              <div>
                <p className="font-display text-sm font-bold text-foreground">{s.name}</p>
                <p className="text-xs text-secondary">{s.city}</p>
              </div>
              <span className="chip chip-primary">{s.myRole}</span>
            </button>
          ))}
        </div>
      </div>
    </SchoolShell>
  );
}

export default function GestionClient() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [schools, setSchools] = useState<School[] | null>(null);
  const [selected, setSelected] = useState<School | null>(null);

  const fetchMine = useCallback(async () => {
    const res = await fetch(`${API_URL}/schools/mine`, { credentials: 'include' });
    const data: School[] = res.ok ? await res.json() : [];
    const list = Array.isArray(data) ? data : [];
    setSchools(list);
    // Keep the currently-picked school's data fresh (e.g. studentsCount after a confirmation).
    setSelected((prev) => (prev ? (list.find((s) => s.id === prev.id) ?? null) : prev));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchMine();
  }, [isAuthenticated, fetchMine]);

  if (!isAuthenticated) return <GuestPrompt />;

  if (schools === null) {
    return (
      <SchoolShell>
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </SchoolShell>
    );
  }

  if (schools.length === 0) {
    return <CreateSchoolForm onCreated={fetchMine} />;
  }

  const active = selected ?? (schools.length === 1 ? schools[0] : null);

  if (!active) {
    return <SchoolPicker schools={schools} onPick={setSelected} />;
  }

  if (!hasActiveSubscription(active)) {
    return <SubscriptionPaywall school={active} onRefresh={fetchMine} />;
  }

  return (
    <SchoolDashboard
      school={active}
      onBackToPicker={schools.length > 1 ? () => setSelected(null) : undefined}
      onSchoolUpdated={fetchMine}
    />
  );
}
