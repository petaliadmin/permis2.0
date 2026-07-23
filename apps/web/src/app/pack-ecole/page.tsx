'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/AppShell';
import { useAuthStore } from '@/store/authStore';
import { usePurchasesStore } from '@/store/purchasesStore';

/** Horizon 0: a student redeems the code their auto-école gave them (school_pack seat). */
export default function PackEcolePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const claimSeat = usePurchasesStore((s) => s.claimSeat);

  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!code.trim()) return;
    if (!isAuthenticated) {
      router.push('/auth/register');
      return;
    }
    setStatus('loading');
    setError(null);
    const result = await claimSeat(code.trim());
    if (result.ok) {
      setStatus('success');
    } else {
      setStatus('error');
      setError(result.error ?? "Le code n'a pas pu être validé.");
    }
  };

  return (
    <AppShell>
      <header className="relative overflow-hidden rounded-b-[28px] bg-gradient-to-br from-violet-600 to-violet-700 px-5 pt-[calc(env(safe-area-inset-top)+18px)] pb-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <button
          onClick={() => router.back()}
          className="relative mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15"
          aria-label="Retour"
        >
          <i className="ti ti-chevron-left text-lg" aria-hidden="true" />
        </button>
        <div className="relative flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Code auto-école</h1>
            <p className="mt-1 text-sm text-white/85">
              Activez votre accès offert par votre auto-école.
            </p>
          </div>
          <span className="text-4xl" aria-hidden="true">
            🏫
          </span>
        </div>
      </header>

      <div className="px-5 pt-6 pb-10">
        {status === 'success' ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-token bg-surface-1 p-6 text-center shadow-card"
          >
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-4xl">
              🎉
            </div>
            <h3 className="font-display text-lg font-extrabold text-foreground">
              Accès activé !
            </h3>
            <p className="mt-1 text-sm text-secondary">
              Tout le contenu premium est maintenant débloqué.
            </p>
            <button className="btn-primary mt-5 w-full" onClick={() => router.push('/')}>
              Commencer à réviser
            </button>
          </motion.div>
        ) : (
          <div className="rounded-3xl border border-token bg-surface-1 p-6 shadow-card">
            <p className="text-sm text-secondary">
              Votre auto-école vous a transmis un code à 8 caractères. Saisissez-le ici pour
              débloquer gratuitement tout le contenu premium.
            </p>

            <label className="mt-5 block text-sm font-medium text-foreground">Code</label>
            <input
              type="text"
              autoCapitalize="characters"
              placeholder="AB3D9F2K"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (status === 'error') setStatus('idle');
              }}
              className="mt-1.5 w-full rounded-xl border border-token bg-surface-1 px-4 py-3 text-center font-mono text-lg font-bold tracking-[0.2em] text-foreground placeholder-muted focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              maxLength={16}
            />

            {status === 'error' && error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-semibold text-danger">
                {error}
              </p>
            )}

            {!isAuthenticated && (
              <p className="mt-3 text-center text-xs text-muted">
                Vous devrez créer un compte gratuit pour associer ce code à votre profil.
              </p>
            )}

            <button
              className="btn-primary mt-5 w-full disabled:opacity-50"
              disabled={!code.trim() || status === 'loading'}
              onClick={submit}
            >
              {status === 'loading' ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white align-middle" />
                  Vérification…
                </>
              ) : (
                'Activer mon accès'
              )}
            </button>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-muted">
          Vous êtes une auto-école ?{' '}
          <button
            onClick={() => router.push('/auto-ecole')}
            className="font-bold text-violet-600 hover:underline"
          >
            Découvrez l&apos;espace dédié
          </button>
        </p>
      </div>
    </AppShell>
  );
}
