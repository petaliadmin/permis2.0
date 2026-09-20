'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, isValidSnPhone, formatPhone, type OtpChannel } from '@/store/authStore';
import { CodeInput } from '@/components/CodeInput';
import { useWebOtpAutofill } from '@/hooks/useWebOtpAutofill';
import { useCountdown } from '@/hooks/useCountdown';
import { IconBrandWhatsapp, IconChevronLeft, IconMessage } from '@tabler/icons-react';

const RESEND_COOLDOWN_S = 30;

export default function ResetPinPage() {
  const router = useRouter();
  const requestOtp = useAuthStore((s) => s.requestOtp);
  const resetPin = useAuthStore((s) => s.resetPin);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<OtpChannel>('whatsapp');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [err, setErr] = useState('');

  const resend = useCountdown(RESEND_COOLDOWN_S);

  const sendCode = async () => {
    setErr('');
    if (!isValidSnPhone(phone))
      return setErr('Numéro sénégalais invalide (77, 78, 76, 70 ou 75…).');
    try {
      await requestOtp(phone, channel);
      resend.restart();
      setStep(1);
    } catch {
      setErr("Impossible d'envoyer le code. Vérifie ta connexion.");
    }
  };

  const resendCode = async () => {
    if (resend.seconds > 0) return;
    setErr('');
    try {
      await requestOtp(phone, channel);
      resend.restart();
    } catch {
      setErr("Impossible d'envoyer le code. Vérifie ta connexion.");
    }
  };

  const toPinStep = (code: string = otp) => {
    setErr('');
    if (code.length !== 6) return setErr('Entrez les 6 chiffres du code reçu.');
    setOtp(code);
    setStep(2);
  };

  // Auto-read the code straight off the SMS (Chrome/Android) instead of
  // requiring a manual copy-paste from Messages.
  const handleAutoCode = useCallback((code: string) => toPinStep(code), []);
  useWebOtpAutofill(step === 1, handleAutoCode);

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
    <div>
      <span className="chip chip-primary">Code oublié</span>
      <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground sm:text-3xl">
        Réinitialise ton code
      </h1>

      {/* Progress */}
      <div className="mt-5 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i === step ? 'bg-primary-600' : i < step ? 'bg-primary-300' : 'bg-surface-3'}`}
          />
        ))}
      </div>

      <div className="mt-7">
        <AnimatePresence mode="wait">
          {/* Step 0 — phone + channel */}
          {step === 0 && (
            <motion.div
              key="s0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-lg font-extrabold text-foreground">Code oublié ?</h2>
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
                  <IconBrandWhatsapp size="1em" className="text-lg" aria-hidden="true" /> WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-bold transition-colors ${channel === 'sms' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-token text-secondary'}`}
                >
                  <IconMessage size="1em" className="text-lg" aria-hidden="true" /> SMS
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
                <IconChevronLeft size="1em" aria-hidden="true" /> Modifier le numéro
              </button>
              <h2 className="font-display text-lg font-extrabold text-foreground">
                Vérifie ton numéro
              </h2>
              <p className="mt-1 text-sm text-secondary">
                Code envoyé par {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} au{' '}
                <span className="font-semibold text-foreground">+221 {formatPhone(phone)}</span>
              </p>

              <div className="mt-6">
                <CodeInput
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  autoFocus
                  onComplete={(code) => toPinStep(code)}
                />
              </div>

              {err && (
                <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">
                  {err}
                </p>
              )}

              <button
                onClick={() => toPinStep()}
                disabled={isLoading}
                className="btn-primary mt-6 w-full disabled:opacity-40"
              >
                Continuer
              </button>
              <button
                onClick={resendCode}
                disabled={resend.seconds > 0}
                className="mt-3 w-full py-2 text-center text-sm font-medium text-secondary disabled:opacity-50"
              >
                {resend.seconds > 0 ? `Renvoyer le code (${resend.seconds}s)` : 'Renvoyer le code'}
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
              <h2 className="font-display text-lg font-extrabold text-foreground">
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

      <p className="mt-6 text-center text-sm text-secondary">
        Tu te souviens de ton code ?{' '}
        <Link href="/auth/login" className="font-bold text-primary-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
