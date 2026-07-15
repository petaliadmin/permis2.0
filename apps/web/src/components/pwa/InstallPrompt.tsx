'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// No "remind me later" cooldown by design: the prompt should resurface on
// every visit until the app is actually installed — isStandalone() below is
// the only thing that stops it for good.
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as any).standalone === true
  );
}

type Platform = 'ios' | 'android' | 'desktop';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

const FEATURES = [
  { icon: '⚡', label: 'Plus rapide' },
  { icon: '📶', label: 'Hors connexion' },
  { icon: '🏠', label: "Écran d'accueil" },
];

const MANUAL_STEPS: Record<Platform, string[]> = {
  ios: [
    'Appuie sur Partager (icône avec une flèche) dans la barre Safari.',
    "Choisis « Sur l'écran d'accueil ».",
    'Confirme avec Ajouter.',
  ],
  android: [
    'Ouvre le menu ⋮ en haut à droite de Chrome.',
    'Choisis « Installer l\'application » (ou « Ajouter à l\'écran d\'accueil »).',
    "Confirme l'installation.",
  ],
  desktop: [
    "Clique sur l'icône d'installation dans la barre d'adresse (ou le menu ⋮ → « Installer PERMIS2.0 »).",
    "Confirme dans la fenêtre qui s'ouvre.",
  ],
};

/**
 * Fully custom install invite — deliberately independent of the browser's
 * native beforeinstallprompt banner. That event only fires under strict
 * conditions (HTTPS, specific engagement heuristics, etc.) and simply never
 * shows up at all on an http:// origin, so relying on it left this feature
 * invisible in practice. This component always offers to install; if the
 * native one-tap prompt happens to be available it's used, otherwise a
 * platform-appropriate manual walkthrough is shown instead.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [platform, setPlatform] = useState<Platform>('desktop');

  useEffect(() => {
    if (isStandalone()) return;
    setPlatform(detectPlatform());

    // Captured opportunistically — used for a real one-tap install when the
    // browser supports it, but the invite itself never waits on this.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener('appinstalled', onInstalled);

    const timer = setTimeout(() => setVisible(true), 1200);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    setShowManual(false);
  };

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') setVisible(false);
      else dismiss();
      setDeferred(null);
      return;
    }
    // No native prompt available — walk the user through it manually
    // instead of doing nothing.
    setShowManual(true);
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
                <h2 id="install-title" className="text-lg font-extrabold text-foreground">
                  Installer PERMIS2.0
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Ajoute l&apos;application à ton écran d&apos;accueil pour un accès plus rapide, en
                  plein écran et même hors connexion.
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
                  className="flex flex-col items-center gap-1 rounded-2xl bg-surface-1 py-3 text-center"
                >
                  <span className="text-xl">{f.icon}</span>
                  <span className="text-[11px] font-semibold text-secondary">{f.label}</span>
                </div>
              ))}
            </div>

            {showManual ? (
              <div className="mt-4 rounded-2xl bg-surface-1 p-4 text-sm text-secondary">
                <p className="font-semibold text-foreground">Comment installer :</p>
                <ol className="mt-2 list-inside list-decimal space-y-1.5">
                  {MANUAL_STEPS[platform].map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
                <button
                  onClick={dismiss}
                  className="mt-4 w-full rounded-xl bg-surface-2 py-2.5 text-sm font-semibold text-secondary hover:bg-surface-3 transition-colors"
                >
                  J&apos;ai compris
                </button>
              </div>
            ) : (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={dismiss}
                  className="flex-1 rounded-xl border border-token py-3 text-sm font-semibold text-secondary transition-colors hover:bg-surface-2"
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
