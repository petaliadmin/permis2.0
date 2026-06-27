'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed-at';
// Re-show the prompt only after this many days if previously dismissed.
const DISMISS_DAYS = 3;

function recentlyDismissed(): boolean {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    const days = (Date.now() - Number(ts)) / (1000 * 60 * 60 * 24);
    return days < DISMISS_DAYS;
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as any).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

const FEATURES = [
  { icon: '⚡', label: 'Plus rapide' },
  { icon: '📶', label: 'Hors connexion' },
  { icon: '🏠', label: "Écran d'accueil" },
];

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    // Android / Chromium: capture the native prompt, then surface our sheet
    // shortly after so it lands gently rather than mid-page-load.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 800);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener('appinstalled', onInstalled);

    // iOS has no beforeinstallprompt — show manual instructions after a short delay.
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIos()) {
      iosTimer = setTimeout(() => {
        setIosHelp(true);
        setVisible(true);
      }, 1200);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setVisible(false);
    else dismiss();
    setDeferred(null);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 sm:bg-black/20"
            onClick={dismiss}
            aria-hidden
          />
          {/* Bottom sheet (mobile) / centered card (desktop) */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-title"
            initial={{ y: '110%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '110%', opacity: 0.4 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:bottom-6 sm:rounded-3xl dark:bg-dark-800
                       pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700 sm:hidden" />
            <div className="flex items-start gap-4">
              <motion.span
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary text-2xl font-black text-white shadow-glow"
              >
                P
              </motion.span>
              <div className="min-w-0 flex-1">
                <h2 id="install-title" className="text-lg font-extrabold text-dark dark:text-white">
                  Installer PERMIS2.0
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Ajoute l&apos;application à ton écran d&apos;accueil pour un accès plus rapide,
                  en plein écran et même hors connexion.
                </p>
              </div>
              <button
                onClick={dismiss}
                aria-label="Fermer"
                className="-mr-1 -mt-1 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-900"
              >
                ✕
              </button>
            </div>

            {/* Mini feature row — makes the invite feel worthwhile */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {FEATURES.map((f) => (
                <div
                  key={f.label}
                  className="flex flex-col items-center gap-1 rounded-2xl bg-slate-50 py-3 text-center dark:bg-dark-900"
                >
                  <span className="text-xl">{f.icon}</span>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {f.label}
                  </span>
                </div>
              ))}
            </div>

            {iosHelp ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-dark-900 dark:text-slate-300">
                <p className="font-semibold text-dark dark:text-white">Sur iPhone / iPad :</p>
                <ol className="mt-2 space-y-1.5">
                  <li>1. Appuie sur <span className="font-semibold">Partager</span> <span className="align-middle">􀈂</span> dans la barre Safari.</li>
                  <li>2. Choisis <span className="font-semibold">« Sur l&apos;écran d&apos;accueil »</span>.</li>
                  <li>3. Confirme avec <span className="font-semibold">Ajouter</span>.</li>
                </ol>
                <button
                  onClick={dismiss}
                  className="mt-4 w-full rounded-xl bg-slate-200 py-2.5 text-sm font-semibold text-slate-700 dark:bg-dark-800 dark:text-slate-200"
                >
                  J&apos;ai compris
                </button>
              </div>
            ) : (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={dismiss}
                  className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-dark-900"
                >
                  Plus tard
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={install}
                  className="flex-[1.6] rounded-xl bg-gradient-primary py-3 text-sm font-bold text-white shadow-soft transition-all hover:shadow-glow"
                >
                  Installer l&apos;app
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
