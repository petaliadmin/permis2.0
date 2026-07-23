'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import {
  SlideSignsIllustration,
  SlideQuizIllustration,
  SlideProgressIllustration,
} from './illustrations';

type ProfileChoice = 'PARTICULIER' | 'AUTO_ECOLE';

interface Slide {
  grad: string;
  Illustration: () => React.ReactElement;
  title: string;
  text: string;
}

const SLIDES: Slide[] = [
  {
    grad: 'from-primary-600 to-primary-800',
    Illustration: SlideSignsIllustration,
    title: 'Tous les panneaux du code sénégalais',
    text: 'Apprends à reconnaître chaque panneau, par catégorie, avec des explications simples.',
  },
  {
    grad: 'from-violet-600 to-violet-700',
    Illustration: SlideQuizIllustration,
    title: 'Entraîne-toi à ton rythme',
    text: 'Des quiz par série et des examens blancs pour te préparer comme le vrai jour J.',
  },
  {
    grad: 'from-orange-500 to-orange-600',
    Illustration: SlideProgressIllustration,
    title: 'Suis ta progression',
    text: 'Score, séries réussies, badges — vois tes progrès jusqu’à décrocher ton permis.',
  },
];

const SWIPE_THRESHOLD = 60;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const isSlide = step < SLIDES.length;

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(Math.max(0, Math.min(SLIDES.length, next)));
  };

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) goTo(step + 1);
    else if (info.offset.x > SWIPE_THRESHOLD) goTo(step - 1);
  };

  const finish = (choice: ProfileChoice) => {
    localStorage.setItem('intended_profile_type', choice);
    localStorage.setItem('permis_onboarding_done', '1');
    router.replace(choice === 'AUTO_ECOLE' ? '/auto-ecole' : '/traffic-signs');
  };

  if (!isSlide) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-surface px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(3rem+env(safe-area-inset-top))]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-md text-center"
        >
          <h1 className="font-display text-2xl font-extrabold text-foreground">
            Tu es plutôt…
          </h1>
          <p className="mt-2 text-sm text-secondary">
            On adapte ton espace selon ton profil.
          </p>
        </motion.div>

        <div className="mx-auto mt-8 flex w-full max-w-md flex-1 flex-col gap-4">
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => finish('PARTICULIER')}
            className="flex items-center gap-4 rounded-3xl border border-token bg-surface-1 p-5 text-left shadow-card transition-colors hover:border-primary-300"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
              <i className="ti ti-user text-3xl" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base font-bold text-foreground">
                Particulier
              </span>
              <span className="mt-0.5 block text-sm text-secondary">
                Je révise pour mon propre permis.
              </span>
            </span>
            <i className="ti ti-chevron-right text-lg text-slate-300" aria-hidden="true" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => finish('AUTO_ECOLE')}
            className="flex items-center gap-4 rounded-3xl border border-token bg-surface-1 p-5 text-left shadow-card transition-colors hover:border-violet-300"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <i className="ti ti-school text-3xl" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base font-bold text-foreground">
                Auto-école
              </span>
              <span className="mt-0.5 block text-sm text-secondary">
                Je gère des places premium pour mes élèves.
              </span>
            </span>
            <i className="ti ti-chevron-right text-lg text-slate-300" aria-hidden="true" />
          </motion.button>
        </div>

        <button
          onClick={() => goTo(SLIDES.length - 1)}
          className="mx-auto mt-4 text-sm font-semibold text-secondary hover:text-foreground"
        >
          Retour
        </button>
      </div>
    );
  }

  const slide = SLIDES[step];

  return (
    <div
      className={`relative flex min-h-[100dvh] flex-col overflow-hidden bg-gradient-to-b px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2.5rem+env(safe-area-inset-top))] ${slide.grad}`}
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -left-8 top-1/3 h-32 w-32 rounded-full bg-white/5" />

      <div className="relative flex items-center justify-end">
        <button
          onClick={() => goTo(SLIDES.length)}
          className="text-sm font-semibold text-white/80 hover:text-white"
        >
          Passer
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={onDragEnd}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex w-full max-w-md flex-col items-center px-2 text-center"
          >
            <slide.Illustration />
            <h1 className="mt-8 font-display text-2xl font-extrabold text-white">
              {slide.title}
            </h1>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/85">{slide.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative mx-auto mb-6 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Aller à l'écran ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === step ? 'w-8 bg-white' : 'w-4 bg-white/30'
            }`}
          />
        ))}
      </div>

      <button onClick={() => goTo(step + 1)} className="relative mx-auto w-full max-w-md">
        <span className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-bold text-foreground shadow-lg transition-transform active:scale-[0.98]">
          {step === SLIDES.length - 1 ? 'Continuer' : 'Suivant'}
          <i className="ti ti-arrow-right text-base" aria-hidden="true" />
        </span>
      </button>
    </div>
  );
}
