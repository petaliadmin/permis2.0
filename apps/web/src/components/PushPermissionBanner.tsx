'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuthStore } from '@/store/authStore';

const DISMISSED_KEY = 'push-banner-dismissed';

export function PushPermissionBanner() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { state, requestPermission } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (state !== 'default') return;
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (!dismissed) setVisible(true);
  }, [isAuthenticated, state]);

  const handleAccept = async () => {
    setLoading(true);
    await requestPermission();
    setLoading(false);
    setVisible(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+72px)] left-4 right-4 z-50 rounded-2xl border border-orange-200 bg-surface-1 p-4 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xl">
              🔔
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Rappels de révision</p>
              <p className="mt-0.5 text-xs text-secondary">
                Reçois des alertes quand ton streak est en danger ou pour rester motivé.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleAccept}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-orange-500 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {loading ? 'Activation…' : 'Activer'}
                </button>
                <button
                  onClick={handleDismiss}
                  className="rounded-xl border border-token px-3 py-2 text-xs font-semibold text-secondary"
                >
                  Plus tard
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted hover:text-foreground"
              aria-label="Fermer"
            >
              <i className="ti ti-x text-sm" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
