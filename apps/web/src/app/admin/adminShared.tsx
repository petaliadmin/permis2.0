'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 2800);
  };
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
