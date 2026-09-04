'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, isValidSnPhone } from '@/store/authStore';
import { CodeInput } from '@/components/CodeInput';

const STEPS = [
  { key: 'name', label: 'Nom' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'pin', label: 'Code' },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const registerWithPin = useAuthStore((s) => s.registerWithPin);
  const isLoading = useAuthStore((s) => s.isLoading);
  const storeError = useAuthStore((s) => s.error);

  // 1 = name · 2 = phone · 3 = choose PIN
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [err, setErr] = useState('');

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
    const intended = localStorage.getItem('intended_profile_type') as
      | 'PARTICULIER'
      | 'AUTO_ECOLE'
      | null;
    await registerWithPin(name.trim(), phone, pin, intended ?? undefined);
    router.push(intended === 'AUTO_ECOLE' ? '/auto-ecole' : '/');
  };

  return (
    <div>
      <span className="chip chip-primary">Nouveau compte</span>
      <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground sm:text-3xl">
        Crée ton compte en une minute
      </h1>

      {/* Onboarding progress — 3 clear steps, always visible so it's obvious
          how much is left and what's already been entered. */}
      <div className="mt-6 flex items-center gap-2" aria-label={`Étape ${step} sur ${STEPS.length}`}>
        {STEPS.map((s, i) => {
          const n = i + 1;
          const state = n === step ? 'current' : n < step ? 'done' : 'upcoming';
          return (
            <div key={s.key} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  state === 'upcoming'
                    ? 'bg-surface-3 text-muted'
                    : 'bg-primary-600 text-white'
                }`}
              >
                {state === 'done' ? <i className="ti ti-check" aria-hidden="true" /> : n}
              </span>
              <span
                className={`hidden text-xs font-semibold sm:inline ${
                  state === 'upcoming' ? 'text-muted' : 'text-foreground'
                }`}
              >
                {s.label}
              </span>
              {n < STEPS.length && (
                <span
                  className={`h-px flex-1 ${state === 'done' ? 'bg-primary-600' : 'bg-surface-3'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-7">
        <AnimatePresence mode="wait">
          {/* Step 1 — name */}
          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-lg font-extrabold text-foreground">
                Comment tu t&apos;appelles ?
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

              <button onClick={confirmName} className="btn-primary mt-6 w-full">
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
              <h2 className="font-display text-lg font-extrabold text-foreground">
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

              <button onClick={confirmPhone} className="btn-primary mt-6 w-full">
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
              <button
                onClick={() => setStep(2)}
                className="mb-3 flex items-center gap-1 text-sm font-semibold text-primary-600"
              >
                <i className="ti ti-chevron-left" aria-hidden="true" /> Modifier le numéro
              </button>
              <h2 className="font-display text-lg font-extrabold text-foreground">
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
                <i className="ti ti-lock" aria-hidden="true" /> Ta session reste ouverte, pas
                besoin de te reconnecter.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-6 text-center text-sm text-secondary">
        Déjà un compte ?{' '}
        <Link href="/auth/login" className="font-bold text-primary-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
