'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Shared nav config — used by the sidebar (layout.tsx) and the dashboard's section grid. */
export const ADMIN_SECTIONS = [
  {
    href: '/admin/demandes',
    label: 'Demandes',
    desc: 'Abonnements à activer',
    icon: 'ti-receipt',
    color: '#16A34A',
  },
  {
    href: '/admin/users',
    label: 'Utilisateurs',
    desc: 'Bloquer, rôles, abonnements',
    icon: 'ti-users',
    color: '#2563EB',
  },
  {
    href: '/admin/questions',
    label: 'Questions (quiz)',
    desc: 'Créer, modifier, supprimer',
    icon: 'ti-help-circle',
    color: '#7C3AED',
  },
  {
    href: '/admin/series',
    label: 'Séries (examens)',
    desc: 'Gérer les séries d’entraînement',
    icon: 'ti-clipboard-check',
    color: '#F97316',
  },
  {
    href: '/admin/cours',
    label: 'Cours (leçons)',
    desc: 'Rédiger et organiser les leçons',
    icon: 'ti-book',
    color: '#0EA5E9',
  },
] as const;

/** fetch wrapper: always sends the session cookie and parses JSON errors. */
export async function adminFetch<T = unknown>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...(json !== undefined
      ? {
          method: rest.method ?? 'POST',
          headers: { 'Content-Type': 'application/json', ...(rest.headers ?? {}) },
          body: JSON.stringify(json),
        }
      : {}),
    ...rest,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}) as { message?: string | string[] });
    const msg = Array.isArray(e.message) ? e.message.join(' · ') : e.message;
    throw new Error(msg || `Erreur ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Server-verified admin gate: /admin/stats is ADMIN-only, so its status code is
 * the source of truth. Returns null while checking.
 */
export function useAdminGuard(): boolean | null {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    fetch(`${API_URL}/admin/stats`, { credentials: 'include' })
      .then((r) => setAllowed(r.ok))
      .catch(() => setAllowed(false));
  }, []);
  return allowed;
}

export function AccessDenied() {
  const router = useRouter();
  return (
    <div className="mt-12 px-4 text-center">
      <i className="ti ti-shield-lock text-5xl text-slate-300" aria-hidden="true" />
      <h2 className="mt-4 font-display text-lg font-bold text-foreground">Accès réservé</h2>
      <p className="mt-2 text-sm text-secondary">Cette page est réservée aux administrateurs.</p>
      <button onClick={() => router.push('/')} className="btn-primary mt-6">
        Retour aux cours
      </button>
    </div>
  );
}

/**
 * Desktop-appropriate page header for admin screens — a plain title/subtitle
 * row with optional right-side actions, no mobile gradient hero. The sidebar
 * already carries navigation, so this never needs a back link.
 */
export function AdminPageHeader({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  /** Extra content rendered below the title row (e.g. search/filter controls). */
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-black tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-secondary">{subtitle}</p>}
        {children && <div className="mt-4">{children}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold text-white shadow-lg">
      {message}
    </div>
  );
}

export function useToast(): [string, (m: string) => void] {
  const [toast, setToast] = useState('');
  // Stable identity — callers memoize effects/callbacks on this (e.g. a
  // load() wrapped in useCallback([flash])); a fresh function every render
  // would retrigger those effects on every render, an infinite fetch loop.
  const flash = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 2800);
  }, []);
  return [toast, flash];
}

export const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} F`;

/** Textarea helper: array of strings ⇄ one item per line. */
export const linesToArray = (s: string) =>
  s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
export const arrayToLines = (a?: string[]) => (a ?? []).join('\n');
