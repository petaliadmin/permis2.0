'use client';

import { useAuthStore } from '@/store/authStore';

const PREFIX = 'p2_cache:';

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

function readEntry<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as CacheEntry<T>) : null;
  } catch {
    return null;
  }
}

function writeEntry<T>(key: string, data: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, cachedAt: Date.now() } as CacheEntry<T>));
  } catch {
    // Storage full/unavailable (private browsing) — cache is best-effort only.
  }
}

/**
 * Scopes a cache key to the signed-in user so logging out (or switching
 * accounts on a shared device) can never surface someone else's cached
 * entitlements/purchases before the network revalidates.
 */
export function userScopedKey(key: string): string {
  const userId = useAuthStore.getState().user?.id ?? 'guest';
  return `${userId}:${key}`;
}

export interface CachedResult<T> {
  data: T;
  /** True when this came from a previous fetch, not a fresh network response. */
  fromCache: boolean;
  cachedAt: number | null;
}

/**
 * Network-first fetch with a local fallback. On success, the parsed response
 * is cached under `key` and returned; on failure (offline, timeout, non-2xx)
 * the last cached value for `key` is served instead, so a page that already
 * loaded once keeps working offline. Throws only when both the network call
 * fails and nothing is cached yet.
 */
export async function fetchWithCache<T>(
  key: string,
  url: string,
  init?: RequestInit
): Promise<CachedResult<T>> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as T;
    writeEntry(key, data);
    return { data, fromCache: false, cachedAt: Date.now() };
  } catch (err) {
    const cached = readEntry<T>(key);
    if (cached) return { data: cached.data, fromCache: true, cachedAt: cached.cachedAt };
    throw err;
  }
}

/** Reads the cache directly, without attempting a network call. */
export function peekCache<T>(key: string): CachedResult<T> | null {
  const cached = readEntry<T>(key);
  return cached ? { data: cached.data, fromCache: true, cachedAt: cached.cachedAt } : null;
}

/** Drops every cached response for a given user (or all of them if no id is passed). */
export function clearCache(userId?: string): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(PREFIX)) continue;
      if (!userId || k.startsWith(PREFIX + userId + ':')) localStorage.removeItem(k);
    }
  } catch {
    // best-effort
  }
}
