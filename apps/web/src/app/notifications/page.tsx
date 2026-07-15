'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/AppShell';
import { useNotificationStore, type AppNotification } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

const TYPE_META: Record<AppNotification['type'], { icon: string; bg: string; text: string }> = {
  success: { icon: 'ti-circle-check', bg: 'bg-emerald-100', text: 'text-emerald-600' },
  info: { icon: 'ti-info-circle', bg: 'bg-sky-100', text: 'text-sky-600' },
  warning: { icon: 'ti-alert-triangle', bg: 'bg-amber-100', text: 'text-amber-600' },
  error: { icon: 'ti-circle-x', bg: 'bg-red-100', text: 'text-red-600' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Il y a ${d}j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { items, loading, fetch, markRead, markAllRead, remove } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    fetch();
  }, [isAuthenticated, fetch, router]);

  const unread = items.filter((n) => !n.read);
  const read = items.filter((n) => n.read);

  const handleTap = (n: AppNotification) => {
    if (!n.read) markRead(n.id);
  };

  return (
    <AppShell>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-surface px-5 pt-[calc(env(safe-area-inset-top)+12px)] pb-4 border-b border-token">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2"
            aria-label="Retour"
          >
            <i className="ti ti-chevron-left text-lg text-foreground" aria-hidden="true" />
          </button>
          <h1 className="font-display text-xl font-extrabold text-foreground">Notifications</h1>
        </div>
        {unread.length > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-bold text-primary-600 hover:text-primary-700"
          >
            Tout lire
          </button>
        )}
      </header>

      <div className="px-5 py-4 space-y-6">
        {loading && items.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-surface-2 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-surface-2" />
                  <div className="h-3 w-full rounded bg-surface-2" />
                  <div className="h-2 w-1/4 rounded bg-surface-2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-2">
              <i className="ti ti-bell-off text-2xl text-muted" aria-hidden="true" />
            </div>
            <p className="font-display text-base font-bold text-foreground">Aucune notification</p>
            <p className="mt-1 text-sm text-muted">
              Tes activités et récompenses apparaîtront ici.
            </p>
          </div>
        ) : (
          <>
            {/* Unread */}
            {unread.length > 0 && (
              <section>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                  Non lues · {unread.length}
                </p>
                <AnimatePresence initial={false}>
                  <ul className="space-y-2">
                    {unread.map((n) => (
                      <NotifCard key={n.id} n={n} onTap={handleTap} onRemove={remove} />
                    ))}
                  </ul>
                </AnimatePresence>
              </section>
            )}

            {/* Read */}
            {read.length > 0 && (
              <section>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Lues</p>
                <AnimatePresence initial={false}>
                  <ul className="space-y-2">
                    {read.map((n) => (
                      <NotifCard key={n.id} n={n} onTap={handleTap} onRemove={remove} />
                    ))}
                  </ul>
                </AnimatePresence>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function NotifCard({
  n,
  onTap,
  onRemove,
}: {
  n: AppNotification;
  onTap: (n: AppNotification) => void;
  onRemove: (id: string) => void;
}) {
  const meta = TYPE_META[n.type] ?? TYPE_META.info;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
      className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
        n.read ? 'border-token bg-surface-1' : 'border-primary-200 bg-primary-50'
      }`}
      onClick={() => onTap(n)}
    >
      {/* Icon */}
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.bg}`}
      >
        <i className={`ti ${meta.icon} text-base ${meta.text}`} aria-hidden="true" />
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm font-semibold leading-snug ${n.read ? 'text-foreground' : 'text-foreground font-bold'}`}
          >
            {n.title}
          </p>
          {!n.read && (
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500"
              aria-label="Non lu"
            />
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-secondary">{n.message}</p>
        <p className="mt-1.5 text-[10px] text-muted">{timeAgo(n.createdAt)}</p>
      </div>

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(n.id);
        }}
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
        aria-label="Supprimer"
      >
        <i className="ti ti-x text-xs" aria-hidden="true" />
      </button>
    </motion.li>
  );
}
