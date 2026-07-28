'use client';

import { useState } from 'react';
import type { SchoolMembership } from '@permis2.0/types';
import { SchoolMemberRole } from '@permis2.0/types';
import { EmptyState, Skeleton } from '@permis2.0/ui';
import { cn } from '@/lib/cn';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const ASSIGNABLE_ROLES = [
  SchoolMemberRole.MANAGER,
  SchoolMemberRole.SECRETARY,
  SchoolMemberRole.INSTRUCTOR,
  SchoolMemberRole.COACH,
  SchoolMemberRole.ACCOUNTANT,
];

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'Propriétaire',
  MANAGER: 'Manager',
  SECRETARY: 'Secrétaire',
  INSTRUCTOR: 'Moniteur',
  COACH: 'Coach',
  ACCOUNTANT: 'Comptable',
};

type FoundUser = { id: string; name: string; phone: string };

interface TeamPanelProps {
  schoolId: string;
  members: SchoolMembership[] | null;
  onChanged: () => void;
}

export function TeamPanel({ schoolId, members, onChanged }: TeamPanelProps) {
  const [phone, setPhone] = useState('');
  const [found, setFound] = useState<FoundUser | null>(null);
  const [role, setRole] = useState<SchoolMemberRole>(SchoolMemberRole.INSTRUCTOR);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const lookup = async () => {
    setError('');
    setFound(null);
    if (!phone.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${API_URL}/schools/${schoolId}/members/lookup?phone=${encodeURIComponent(phone)}`,
        { credentials: 'include' }
      );
      if (!res.ok) {
        setError('Aucun utilisateur PERMIS 2.0 avec ce numéro.');
        return;
      }
      setFound(await res.json());
    } finally {
      setBusy(false);
    }
  };

  const addMember = async () => {
    if (!found) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/schools/${schoolId}/members`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: found.id, role }),
      });
      if (res.ok) {
        setFound(null);
        setPhone('');
        onChanged();
      } else {
        setError("Impossible d'ajouter ce membre.");
      }
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (membershipId: string) => {
    setRemoving(membershipId);
    try {
      const res = await fetch(`${API_URL}/schools/${schoolId}/members/${membershipId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) onChanged();
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-clay">
        <p className="font-display text-sm font-bold text-foreground">Ajouter un membre</p>
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
        {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}

        {found && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-surface-2 p-3">
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{found.name}</p>
              <p className="text-xs text-secondary">{found.phone}</p>
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as SchoolMemberRole)}
              className="rounded-full border border-token bg-surface-1 px-3 py-1.5 text-xs font-bold text-secondary focus:border-primary-400 focus:outline-none"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
            <button onClick={addMember} disabled={busy} className="btn-primary !px-4 !py-2 text-xs">
              Ajouter
            </button>
          </div>
        )}
      </div>

      {members === null ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={<i className="ti ti-users" aria-hidden="true" />}
          title="Pas encore d'équipe"
          description="Ajoutez vos moniteurs, secrétaires ou comptables."
        />
      ) : (
        <div className="space-y-2.5">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-2xl border border-token bg-surface-1 p-4 shadow-soft"
            >
              <div>
                <p className="font-display text-sm font-bold text-foreground">{m.user?.name}</p>
                <p className="text-xs text-secondary">{m.user?.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip chip-primary">{ROLE_LABEL[m.role]}</span>
                {m.role !== SchoolMemberRole.OWNER && (
                  <button
                    onClick={() => {
                      if (confirm(`Retirer ${m.user?.name} de l'équipe ?`)) removeMember(m.id);
                    }}
                    disabled={removing === m.id}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-danger hover:bg-red-50',
                      removing === m.id && 'opacity-50'
                    )}
                    aria-label="Retirer"
                  >
                    <i className="ti ti-trash text-sm" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
