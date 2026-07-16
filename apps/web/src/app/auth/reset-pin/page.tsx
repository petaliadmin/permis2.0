'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, isValidSnPhone, formatPhone, type OtpChannel } from '@/store/authStore';
import { CodeInput } from '@/components/CodeInput';

export default function ResetPinPage() {
  const router = useRouter();
  const requestOtp = useAuthStore((s) => s.requestOtp);
  const resetPin = useAuthStore((s) => s.resetPin);
  const isLoading = useAuthStore((s) => s.isLoading);
  const devCode = useAuthStore((s) => s.devCode);

  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<OtpChannel>('whatsapp');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [err, setErr] = useState('');

  const sendCode = async () => {
    setErr('');
    if (!isValidSnPhone(phone))
      return setErr('Numéro sénégalais invalide (77, 78, 76, 70 ou 75…).');
    try {
      await requestOtp(phone, channel);
      setStep(1);
    } catch {
      setErr("Impossible d'envoyer le code. Vérifie ta connexion.");
    }
  };

  const toPinStep = () => {
    setErr('');
    if (otp.length !== 6) return setErr('Entrez les 6 chiffres du code reçu.');
    setStep(2);
  };

  const finish = async () => {
    setErr('');
    if (pin.length !== 4) return setErr('Choisissez un code à 4 chiffres.');
    if (pin !== pinConfirm) return setErr('Les deux codes ne correspondent pas.');
    try {
      await resetPin(phone, otp, pin);
      router.push('/');
    } catch {
      // OTP wrong/expired or unknown number — send back to the code step
      setErr(useAuthStore.getState().error || 'Code invalide ou expiré. Réessaie.');
      setOtp('');
      setStep(1);
    }
  };

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
        <p className="mt-1 text-sm text-white/75">Réinitialise ton code de sécurité</p>
      </div>

      {/* Progress */}
      <div className="mx-auto mb-5 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-white' : i < step ? 'w-4 bg-white/60' : 'w-4 bg-white/25'}`}
          />
        ))}
      </div>

      {/* Card */}
      <div className="mx-auto w-full max-w-md rounded-3xl border border-token bg-surface-1 p-6 shadow-card">
        <AnimatePresence mode="wait">
          {/* Step 0 — phone + channel */}
          {step === 0 && (
            <motion.div
              key="s0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-xl font-extrabold text-foreground">Code oublié ?</h2>
              <p className="mt-1 text-sm text-secondary">
                On t&apos;envoie un code de vérification pour en choisir un nouveau.
              </p>

              <label className="mt-5 block text-sm font-medium text-foreground">Téléphone</label>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-token bg-surface-2 px-4">
                <span className="text-sm font-semibold text-secondary">🇸🇳 +221</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  placeholder="77 000 00 00"
                  className="h-12 w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
                />
              </div>

              <p className="mt-4 text-sm font-medium text-foreground">Recevoir le code par</p>
              <div className="mt-1.5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-bold transition-colors ${channel === 'whatsapp' ? 'border-success-500 bg-success-50 text-success-700' : 'border-token text-secondary'}`}
                >
                  <i className="ti ti-brand-whatsapp text-lg" aria-hidden="true" /> WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-bold transition-colors ${channel === 'sms' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-token text-secondary'}`}
                >
                  <i className="ti ti-message text-lg" aria-hidden="true" /> SMS
                </button>
              </div>

              {err && (
                <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">
                  {err}
                </p>
              )}

              <button
                onClick={sendCode}
                disabled={isLoading}
                className="btn-primary mt-5 w-full disabled:opacity-40"
              >
                {isLoading ? 'Envoi du code…' : 'Envoyer le code'}
              </button>
            </motion.div>
          )}

          {/* Step 1 — OTP */}
          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={() => setStep(0)}
                className="mb-3 flex items-center gap-1 text-sm font-semibold text-primary-600"
              >
                <i className="ti ti-chevron-left" aria-hidden="true" /> Modifier le numéro
              </button>
              <h2 className="font-display text-xl font-extrabold text-foreground">
                Vérifie ton numéro
              </h2>
              <p className="mt-1 text-sm text-secondary">
                Code envoyé par {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} au{' '}
                <span className="font-semibold text-foreground">+221 {formatPhone(phone)}</span>
              </p>

              <div className="mt-6">
                <CodeInput length={6} value={otp} onChange={setOtp} autoFocus />
              </div>

              {devCode && (
                <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-700">
                  Mode démo (hors ligne) — ton code est{' '}
                  <span className="font-black tracking-widest">{devCode}</span>
                </p>
              )}
              {err && (
                <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">
                  {err}
                </p>
              )}

              <button
                onClick={toPinStep}
                disabled={isLoading}
                className="btn-primary mt-6 w-full disabled:opacity-40"
              >
                Continuer
              </button>
              <button
                onClick={() => requestOtp(phone, channel)}
                className="mt-3 w-full py-2 text-center text-sm font-medium text-secondary"
              >
                Renvoyer le code
              </button>
            </motion.div>
          )}

          {/* Step 2 — new PIN */}
          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-xl font-extrabold text-foreground">
                Choisis ton nouveau code
              </h2>
              <p className="mt-1 text-sm text-secondary">4 chiffres pour te reconnecter.</p>

              <p className="mb-2 mt-6 text-center text-sm font-medium text-foreground">
                Nouveau code
              </p>
              <CodeInput length={4} value={pin} onChange={setPin} secret autoFocus />

              <p className="mb-2 mt-5 text-center text-sm font-medium text-foreground">
                Confirme le code
              </p>
              <CodeInput length={4} value={pinConfirm} onChange={setPinConfirm} secret />

              {err && (
                <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">
                  {err}
                </p>
              )}

              <button
                onClick={finish}
                disabled={isLoading}
                className="btn-primary mt-6 w-full disabled:opacity-40"
              >
                {isLoading ? 'Réinitialisation…' : 'Valider mon nouveau code'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mx-auto mt-5 text-center text-sm text-white/80">
        Tu te souviens de ton code ?{' '}
        <Link href="/auth/login" className="font-bold text-white underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
