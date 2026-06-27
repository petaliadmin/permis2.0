'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, Button } from '@permis2.0/ui';

const QUICK_ACTIONS = [
  {
    href: '/traffic-signs',
    emoji: '🚦',
    title: 'Panneaux',
    desc: 'Apprends à reconnaître tous les panneaux de signalisation.',
    accent: 'from-rose-500 to-red-600',
  },
  {
    href: '/exam',
    emoji: '🎯',
    title: 'Examen blanc',
    desc: '40 questions en 30 minutes, comme le vrai examen.',
    accent: 'from-secondary-400 to-secondary-600',
  },
  {
    href: '/lessons',
    emoji: '📚',
    title: 'Leçons',
    desc: 'Fiches de révision claires sur le code de la route.',
    accent: 'from-slate-600 to-slate-800',
  },
  {
    href: '/training',
    emoji: '✍️',
    title: 'Entraînement',
    desc: 'Révise par séries de 25 questions à ton rythme.',
    accent: 'from-primary-500 to-primary-700',
  },
];

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  if (!mounted || isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-2xl py-8 sm:py-12 animate-fade-in">
        <h1 className="mb-6 text-center text-2xl font-extrabold text-dark dark:text-white sm:text-3xl">
          Que veux-tu faire ?
        </h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {QUICK_ACTIONS.map((action, i) => (
            <Link key={action.href} href={action.href} className="block">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
                whileTap={{ scale: 0.97 }}
                className="h-full"
              >
                <Card className="group h-full cursor-pointer overflow-hidden transition-shadow hover:shadow-glow">
                  <CardContent className="p-5 sm:p-6">
                    <div
                      className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.accent} text-2xl shadow-soft sm:h-14 sm:w-14 sm:text-3xl`}
                    >
                      {action.emoji}
                    </div>
                    <h2 className="text-base font-bold text-dark dark:text-white sm:text-lg">{action.title}</h2>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{action.desc}</p>
                    <span className="mt-4 inline-flex text-sm font-semibold text-primary">
                      Commencer →
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
