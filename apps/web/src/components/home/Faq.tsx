'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'Permis2 est-il gratuit pour les élèves ?',
    answer:
      "Oui, la création de compte, la recherche d'auto-écoles et la pré-inscription sont entièrement gratuites. Certains contenus premium (examens blancs, cours) sont proposés en option.",
  },
  {
    question: 'Comment fonctionne la pré-inscription en ligne ?',
    answer:
      "Vous choisissez une auto-école, remplissez un formulaire en quelques minutes et l'auto-école valide votre inscription. Vous êtes notifié dès que c'est confirmé.",
  },
  {
    question: 'Comment mon auto-école peut-elle rejoindre Permis2 ?',
    answer:
      "Créez un compte auto-école, complétez votre profil (ville, services, moniteurs) et vous apparaissez immédiatement dans l'annuaire et sur la carte.",
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      "Oui. Vos informations personnelles et vos paiements sont protégés et ne sont jamais partagés avec des tiers sans votre consentement.",
  },
  {
    question: 'Permis2 est-il disponible en dehors de Dakar ?',
    answer:
      'Oui, la plateforme couvre plus de 150 villes au Sénégal, dont Thiès, Saint-Louis, Kaolack et Ziguinchor.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <span className="chip chip-primary">FAQ</span>
        <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          Questions fréquentes
        </h2>
      </motion.div>

      <div className="mt-10 space-y-3">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.question} className="overflow-hidden rounded-2xl border border-token bg-surface-1">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-display text-sm font-bold text-foreground sm:text-base">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  strokeWidth={2}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-sm text-secondary">{item.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
