'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore, isValidSnPhone } from '@/store/authStore';
import { CodeInput } from '@/components/CodeInput';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const loginWithPin = useAuthStore((s) => s.loginWithPin);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');

  const handleGoogle = () => { window.location.href = `${API_URL}/auth/google`; };

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

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-token" /></div>
          <div className="relative flex justify-center text-sm"><span className="bg-surface-1 px-2 text-muted">Ou</span></div>
        </div>

        <button onClick={handleGoogle} disabled={isLoading} className="btn-ghost w-full">
          <svg className="mr-1 h-5 w-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuer avec Google
        </button>
      </motion.div>

      <p className="mx-auto mt-5 text-center text-sm text-white/80">
        Pas encore de compte ?{' '}
        <Link href="/auth/register" className="font-bold text-white underline">Créer un compte</Link>
      </p>
    </div>
  );
}
