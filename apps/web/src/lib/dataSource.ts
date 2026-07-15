'use client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Content now lives in the database and is served by the API. The bundled JSON
 * files under /public/data are kept ONLY as an offline fallback so the PWA
 * keeps working without network (the service worker caches them).
 */
export async function loadData<T>(apiPath: string, staticPath: string): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${apiPath}`);
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as T;
  } catch {
    const res = await fetch(staticPath);
    if (!res.ok) throw new Error('offline fallback failed');
    return (await res.json()) as T;
  }
}
