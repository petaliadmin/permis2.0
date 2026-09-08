'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore, isValidSnPhone } from '@/store/authStore';
import { CodeInput } from '@/components/CodeInput';
import { PhoneInput } from '@/components/PhoneInput';
import { useSpace } from '@/components/SpaceProvider';
import { gotoSpace, spaceForProfile } from '@/lib/space';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const space = useSpace();
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
      const redirect = searchParams.get('redirect');
      if (redirect && redirect.startsWith('/')) {
        router.push(redirect);
        return;
      }
      // Signing in from a subdomain? Stay there. Otherwise follow the profile.
      gotoSpace(
        space !== 'www'
          ? space
          : spaceForProfile(useAuthStore.getState().user?.profileType)
      );
    } catch {
      setErr(useAuthStore.getState().error || 'Connexion impossible.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <span className="chip chip-primary">Bon retour</span>
      <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground sm:text-3xl">
        Content de te revoir 👋
      </h1>
      <p className="mt-2 text-sm text-secondary">Ton numéro et ton code de sécurité.</p>

      <div className="mt-7">
        <PhoneInput label="Téléphone" value={phone} onChange={setPhone} autoFocus />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Code de sécurité</label>
        <Link href="/auth/reset-pin" className="text-xs font-semibold text-primary-600">
          Code oublié ?
        </Link>
      </div>
      <div className="mt-2">
        <CodeInput length={4} value={pin} onChange={setPin} secret onComplete={submit} />
      </div>

      {err && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">
          {err}
        </p>
      )}

      <button
        onClick={submit}
        disabled={isLoading}
        className="btn-primary mt-7 w-full disabled:opacity-40"
      >
        {isLoading ? 'Connexion…' : 'Se connecter'}
      </button>

      <p className="mt-6 text-center text-sm text-secondary">
        Pas encore de compte ?{' '}
        <Link href="/auth/register" className="font-bold text-primary-600 hover:underline">
          Créer un compte
        </Link>
      </p>
    </motion.div>
  );
}
