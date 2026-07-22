'use client';

const KEY = 'p2_sync_queue';

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: unknown;
  createdAt: number;
}

function readQueue(): QueuedRequest[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as QueuedRequest[];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedRequest[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(queue));
  } catch {
    // best-effort
  }
}

function enqueue(url: string, method: string, body?: unknown): void {
  const queue = readQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    url,
    method,
    body,
    createdAt: Date.now(),
  });
  writeQueue(queue);
}

/** Writes still waiting to be delivered — handy for a "pending sync" indicator. */
export function pendingSyncCount(): number {
  return readQueue().length;
}

/**
 * Sends a write immediately; if that fails, queues it for delivery next time
 * the app is back online instead of losing it. A 4xx response means the
 * server rejected the request on its merits (bad data, auth, …) — retrying
 * later won't change that, so those are dropped rather than queued.
 */
export async function postWithSync(url: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (res.ok) return true;
    if (res.status >= 500) enqueue(url, 'POST', body);
    return false;
  } catch {
    enqueue(url, 'POST', body);
    return false;
  }
}

let flushing = false;

/**
 * Delivers queued writes in order. Stops at the first network failure
 * (offline again) and leaves the remainder queued for the next attempt; a
 * request the server rejects outright (4xx) is dropped since resending it
 * unchanged would just fail the same way.
 */
export async function flushSyncQueue(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    let queue = readQueue();
    while (queue.length > 0) {
      const next = queue[0];
      try {
        const res = await fetch(next.url, {
          method: next.method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: next.body !== undefined ? JSON.stringify(next.body) : undefined,
        });
        if (!res.ok && res.status < 500) {
          queue = queue.slice(1);
          writeQueue(queue);
          continue;
        }
        if (!res.ok) break; // 5xx — leave queued, try again next time
        queue = queue.slice(1);
        writeQueue(queue);
      } catch {
        break; // offline — stop, keep the rest queued
      }
    }
  } finally {
    flushing = false;
  }
}
