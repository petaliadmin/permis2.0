'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@permis2.0/ui';
import { Input } from '@permis2.0/ui';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    passwordConfirm: '',
  });

  const [validationError, setValidationError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.passwordConfirm) {
      setValidationError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setValidationError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      await register(formData.email, formData.password, formData.name);
      router.push('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-gradient-hero px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2.5rem+env(safe-area-inset-top))]">
      {/* Brand header on the gradient */}
      <div className="mx-auto mb-5 w-full max-w-md text-center text-white">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black shadow-soft backdrop-blur">
          P
        </span>
        <h1 className="text-2xl font-extrabold">
          PERMIS<span className="text-secondary">2.0</span>
        </h1>
        <p className="mt-1 text-sm text-primary-50/90">
          Crée ton compte et commence à apprendre
        </p>
      </div>

      {/* Card */}
      <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-fade-in dark:bg-dark-800 sm:p-8">
        <h2 className="mb-5 text-xl font-extrabold text-dark dark:text-white">Inscription</h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Nom complet
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="votre@email.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Mot de passe
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium mb-2">
              Confirmer le mot de passe
            </label>
            <Input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              required
              placeholder="••••••••"
              value={formData.passwordConfirm}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          {(error || validationError) && (
            <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg">
              {error || validationError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? 'Création du compte...' : 'S\'inscrire'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 dark:bg-dark text-gray-500">
              Ou
            </span>
          </div>
        </div>

        {/* Google Signup */}
        <Button
          variant="outline"
          className="w-full"
          size="lg"
          disabled={isLoading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          S'inscrire avec Google
        </Button>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Déjà un compte?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-primary hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
