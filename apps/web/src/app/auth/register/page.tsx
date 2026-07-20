'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, isValidSnPhone } from '@/store/authStore';
import { CodeInput } from '@/components/CodeInput';

const SPLASH_DURATION_MS = 1800;

export default function RegisterPage() {
  const router = useRouter();
  const registerWithPin = useAuthStore((s) => s.registerWithPin);
  const isLoading = useAuthStore((s) => s.isLoading);
  const storeError = useAuthStore((s) => s.error);

  // 0 = splash · 1 = name · 2 = phone · 3 = choose PIN
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (step !== 0) return;
    const t = setTimeout(() => setStep(1), SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, [step]);

  const phoneOk = isValidSnPhone(phone);
  const nameOk = name.trim().length >= 2;

  const confirmName = () => {
    setErr('');
    if (!nameOk) return setErr('Entrez votre nom (2 caractères min).');
    setStep(2);
  };

  const confirmPhone = () => {
    setErr('');
    if (!phoneOk) return setErr('Numéro sénégalais invalide (77, 78, 76, 70 ou 75…).');
    setStep(3);
  };

  const finish = async () => {
    setErr('');
    if (pin.length !== 4) return setErr('Choisissez un code à 4 chiffres.');
    if (pin !== pinConfirm) return setErr('Les deux codes ne correspondent pas.');
    await registerWithPin(name.trim(), phone, pin);
    router.push('/');
  };

  /* ── Splash — brand-only, auto-advances ── */
  if (step === 0) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-primary-600 to-primary-800 px-5">
        <motion.span
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 text-4xl font-black text-white backdrop-blur"
        >
          P
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mt-5 font-display text-2xl font-extrabold text-white"
        >
          PERMIS<span className="text-primary-200">2.0</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="mt-1.5 text-sm text-white/70"
        >
          Ton permis, prêt en Wolof et en Français
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="absolute bottom-14 h-1 w-9 overflow-hidden rounded-full bg-white/20"
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: SPLASH_DURATION_MS / 1000 - 0.7, ease: 'linear' }}
            className="h-full w-full bg-white"
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-primary-600 to-primary-800 px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2.5rem+env(safe-area-inset-top))]">
      {/* Brand */}
      <div className="mx-auto mb-6 w-full max-w-md text-center text-white">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black backdrop-blur">
          P
        </span>
        <h1 className="font-display text-2xl font-extrabold">
          PERMIS<span className="text-primary-200">2.0</span>
        </h1>
        <p className="mt-1 text-sm text-white/75">Crée ton compte en une minute</p>
      </div>

      {/* Progress */}
      <div className="mx-auto mb-5 flex gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-white' : i < step ? 'w-4 bg-white/60' : 'w-4 bg-white/25'}`}
          />
        ))}
      </div>

      {/* Card */}
      <div className="mx-auto w-full max-w-md rounded-3xl border border-token bg-surface-1 p-6 shadow-card">
        <AnimatePresence mode="wait">
          {/* Step 1 — name */}
          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-xl font-extrabold text-foreground">
                Comment tu t'appelles ?
              </h2>
              <p className="mt-1 text-sm text-secondary">Ce nom sera visible sur ton profil.</p>

              <label className="mt-5 block text-sm font-medium text-foreground">Nom</label>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-token bg-surface-2 px-4">
                <i className="ti ti-user text-secondary" aria-hidden="true" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Moussa Diop"
                  autoFocus
                  className="h-12 w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
                />
              </div>

              {err && (
                <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">
                  {err}
                </p>
              )}

              <button onClick={confirmName} className="btn-primary mt-5 w-full">
                Continuer
              </button>
            </motion.div>
          )}

          {/* Step 2 — phone */}
          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={() => setStep(1)}
                className="mb-3 flex items-center gap-1 text-sm font-semibold text-primary-600"
              >
                <i className="ti ti-chevron-left" aria-hidden="true" /> Modifier le nom
              </button>
              <h2 className="font-display text-xl font-extrabold text-foreground">
                Quel est ton numéro ?
              </h2>
              <p className="mt-1 text-sm text-secondary">
                Pour te retrouver et te contacter si besoin.
              </p>

              <label className="mt-5 block text-sm font-medium text-foreground">Téléphone</label>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-token bg-surface-2 px-4">
                <span className="text-sm font-semibold text-secondary">🇸🇳 +221</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  placeholder="77 000 00 00"
                  autoFocus
                  className="h-12 w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
                />
              </div>

              {err && (
                <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">
                  {err}
                </p>
              )}

              <button onClick={confirmPhone} className="btn-primary mt-5 w-full">
                Continuer
              </button>
            </motion.div>
          )}

          {/* Step 3 — choose PIN */}
          {step === 3 && (
            <motion.div
              key="s3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-xl font-extrabold text-foreground">
                Choisis ton code de sécurité
              </h2>
              <p className="mt-1 text-sm text-secondary">
                4 chiffres pour te reconnecter facilement.
              </p>

              <p className="mt-6 mb-2 text-center text-sm font-medium text-foreground">
                Nouveau code
              </p>
              <CodeInput length={4} value={pin} onChange={setPin} secret autoFocus />

              <p className="mt-5 mb-2 text-center text-sm font-medium text-foreground">
                Confirme le code
              </p>
              <CodeInput length={4} value={pinConfirm} onChange={setPinConfirm} secret />

              {(err || storeError) && (
                <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">
                  {err || storeError}
                </p>
              )}

              <button
                onClick={finish}
                disabled={isLoading}
                className="btn-primary mt-6 w-full disabled:opacity-40"
              >
                {isLoading ? 'Création…' : 'Créer mon compte'}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
                <i className="ti ti-lock" aria-hidden="true" /> Ta session reste ouverte, pas besoin
                de te reconnecter.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mx-auto mt-5 text-center text-sm text-white/80">
        Déjà un compte ?{' '}
        <Link href="/auth/login" className="font-bold text-white underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
