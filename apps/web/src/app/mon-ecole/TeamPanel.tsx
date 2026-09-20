'use client';

import { useState } from 'react';
import type { SchoolMembership } from '@permis2.0/types';
import { SchoolMemberRole } from '@permis2.0/types';
import { EmptyState, Sheet, Skeleton } from '@permis2.0/ui';
import { cn } from '@/lib/cn';
import { isContactPickerSupported, pickContacts } from '@/lib/contactPicker';
import { ImportSheet } from './ImportSheet';
import { IconAddressBook, IconCalendar, IconFileSpreadsheet, IconMail, IconPhone, IconTrash, IconUsers } from '@tabler/icons-react';

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

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
  const [mode, setMode] = useState<'account' | 'guest'>('guest');
  const [phone, setPhone] = useState('');
  const [found, setFound] = useState<FoundUser | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [role, setRole] = useState<SchoolMemberRole>(SchoolMemberRole.INSTRUCTOR);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const open = (members ?? []).find((m) => m.id === openId) ?? null;

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
    if (mode === 'account' && !found) return;
    if (mode === 'guest' && (!guestName.trim() || !guestPhone.trim())) {
      setError('Nom et téléphone obligatoires.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/schools/${schoolId}/members`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'account'
            ? { userId: found!.id, role }
            : { guestName: guestName.trim(), guestPhone: guestPhone.trim(), role }
        ),
      });
      if (res.ok) {
        setFound(null);
        setPhone('');
        setGuestName('');
        setGuestPhone('');
        onChanged();
      } else {
        setError("Impossible d'ajouter ce membre.");
      }
    } finally {
      setBusy(false);
    }
  };

  const importContact = async () => {
    const [contact] = await pickContacts(false);
    if (!contact) return;
    setMode('guest');
    setGuestName(contact.name);
    setGuestPhone(contact.phone);
  };

  const removeMember = async (membershipId: string) => {
    setRemoving(membershipId);
    try {
      const res = await fetch(`${API_URL}/schools/${schoolId}/members/${membershipId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setOpenId(null);
        onChanged();
      }
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-clay">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-sm font-bold text-foreground">Ajouter un membre</p>
          <button onClick={() => setImportOpen(true)} className="btn-ghost !px-3 !py-1.5 text-xs">
            <IconFileSpreadsheet size="1em" aria-hidden="true" />
            Importer
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setMode('account')}
            className={cn('chip', mode === 'account' ? 'chip-primary' : 'bg-surface-2 text-secondary')}
          >
            Compte existant
          </button>
          <button
            onClick={() => setMode('guest')}
            className={cn('chip', mode === 'guest' ? 'chip-primary' : 'bg-surface-2 text-secondary')}
          >
            Sans compte
          </button>
        </div>

        {mode === 'account' ? (
          <>
            <p className="mt-3 text-xs text-secondary">La personne doit déjà avoir un compte PERMIS 2.0.</p>
            <div className="mt-3 flex gap-3">
              <input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setFound(null);
                }}
                placeholder="77 123 45 67"
                className="flex-1 rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
              />
              <button onClick={lookup} disabled={busy} className="btn-ghost ml-1 !px-4 !py-2.5 text-sm">
                Rechercher
              </button>
            </div>
          </>
        ) : (
          <div className="mt-3 space-y-2">
            {isContactPickerSupported() && (
              <button onClick={importContact} className="btn-ghost w-full !py-2.5 text-sm">
                <IconAddressBook size="1em" aria-hidden="true" />
                Importer un contact du téléphone
              </button>
            )}
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Nom complet"
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
            <input
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="77 123 45 67"
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
        )}

        {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}

        {((mode === 'account' && found) || mode === 'guest') && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-surface-2 p-3">
            {mode === 'account' && found && (
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{found.name}</p>
                <p className="text-xs text-secondary">{found.phone}</p>
              </div>
            )}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as SchoolMemberRole)}
              className={cn(
                'rounded-full border border-token bg-surface-1 px-3 py-1.5 text-xs font-bold text-secondary focus:border-primary-400 focus:outline-none',
                mode === 'guest' && 'flex-1'
              )}
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

      <ImportSheet
        schoolId={schoolId}
        kind="members"
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={onChanged}
      />

      {members === null ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={<IconUsers size="1em" aria-hidden="true" />}
          title="Pas encore d'équipe"
          description="Ajoutez vos moniteurs, secrétaires ou comptables."
        />
      ) : (
        <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0 xl:grid-cols-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-2xl border border-token bg-surface-1 p-4 shadow-soft"
            >
              <button
                type="button"
                onClick={() => setOpenId(m.id)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate font-display text-sm font-bold text-foreground">
                  {m.user?.name ?? m.guestName}
                  {!m.userId && (
                    <span className="ml-1.5 chip bg-surface-2 text-secondary align-middle text-[10px]">
                      Sans compte
                    </span>
                  )}
                </p>
                <p className="text-xs text-secondary">{m.user?.phone ?? m.guestPhone}</p>
              </button>
              <div className="flex shrink-0 items-center gap-2">
                <span className="chip chip-primary">{ROLE_LABEL[m.role]}</span>
                {m.role !== SchoolMemberRole.OWNER && (
                  <button
                    onClick={() => {
                      if (confirm(`Retirer ${m.user?.name ?? m.guestName} de l'équipe ?`)) removeMember(m.id);
                    }}
                    disabled={removing === m.id}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-danger hover:bg-red-50',
                      removing === m.id && 'opacity-50'
                    )}
                    aria-label="Retirer"
                  >
                    <IconTrash size="1em" className="text-sm" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail sheet */}
      <Sheet open={!!open} onClose={() => setOpenId(null)} ariaLabel="Détail du membre">
        {open && (
          <div>
            <p className="font-display text-lg font-bold text-foreground">
              {open.user?.name ?? open.guestName}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="chip chip-primary">{ROLE_LABEL[open.role]}</span>
              {!open.userId && <span className="chip bg-surface-2 text-secondary">Sans compte</span>}
            </div>

            <div className="mt-4 space-y-1.5 text-sm text-secondary">
              <p className="flex items-center gap-2">
                <IconPhone size="1em" aria-hidden="true" /> {open.user?.phone ?? open.guestPhone}
              </p>
              {open.user?.email && (
                <p className="flex items-center gap-2">
                  <IconMail size="1em" aria-hidden="true" /> {open.user.email}
                </p>
              )}
              <p className="flex items-center gap-2">
                <IconCalendar size="1em" aria-hidden="true" /> Membre depuis le {fmtDate(open.createdAt)}
              </p>
            </div>

            {open.role !== SchoolMemberRole.OWNER && (
              <button
                onClick={() => {
                  if (confirm(`Retirer ${open.user?.name ?? open.guestName} de l'équipe ?`))
                    removeMember(open.id);
                }}
                disabled={removing === open.id}
                className={cn('btn-danger mt-4 w-full', removing === open.id && 'opacity-50')}
              >
                Retirer de l&apos;équipe
              </button>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
