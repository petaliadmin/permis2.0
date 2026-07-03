'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore, isValidSnPhone } from '@/store/authStore';
import { CodeInput } from '@/components/CodeInput';

export default function LoginPage() {
  const router = useRouter();
  const loginWithPin = useAuthStore((s) => s.loginWithPin);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    if (!isValidSnPhone(phone)) return setErr('Numéro sénégalais invalide.');
    if (pin.length !== 4) return setErr('Entrez votre code à 4 chiffres.');
    try {
      await loginWithPin(phone, pin);
      router.push('/');
    } catch {
      setErr(useAuthStore.getState().error || 'Connexion impossible.');
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-primary-600 to-primary-800 px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(3rem+env(safe-area-inset-top))]">
      {/* Brand */}
      <div className="mx-auto mb-7 w-full max-w-md text-center text-white">
        <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl font-black backdrop-blur">P</span>
        <h1 className="font-display text-3xl font-extrabold">PERMIS<span className="text-primary-200">2.0</span></h1>
        <p className="mt-1 text-sm text-white/75">Content de te revoir 👋</p>
      </div>

      {/* Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-md rounded-3xl border border-token bg-surface-1 p-6 shadow-card">
        <h2 className="font-display text-xl font-extrabold text-foreground">Connexion</h2>
        <p className="mt-1 text-sm text-secondary">Ton numéro et ton code de sécurité.</p>

        <label className="mt-5 block text-sm font-medium text-foreground">Téléphone</label>
        <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-token bg-surface-2 px-4">
          <span className="text-sm font-semibold text-secondary">🇸🇳 +221</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="77 000 00 00"
            className="h-12 w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none" />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Code de sécurité</label>
          <Link href="/auth/register" className="text-xs font-semibold text-primary-600">Code oublié ?</Link>
        </div>
        <div className="mt-2">
          <CodeInput length={4} value={pin} onChange={setPin} secret onComplete={submit} />
        </div>

        {err && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">{err}</p>}

        <button onClick={submit} disabled={isLoading} className="btn-primary mt-6 w-full disabled:opacity-40">
          {isLoading ? 'Connexion…' : 'Se connecter'}
        </button>
      </motion.div>

      <p className="mx-auto mt-5 text-center text-sm text-white/80">
        Pas encore de compte ?{' '}
        <Link href="/auth/register" className="font-bold text-white underline">Créer un compte</Link>
      </p>
    </div>
  );
}
