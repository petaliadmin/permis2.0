'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  city: string;
  avatar: string;
  rating: number;
  quote: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Aïssatou Diop',
    role: 'Élève',
    city: 'Dakar',
    avatar: '/images/home/testimonial-1.jpg',
    rating: 5,
    quote:
      "J'ai trouvé mon auto-école en 10 minutes, comparé les prix et pré-inscrit sans me déplacer. J'ai eu mon permis du premier coup !",
  },
  {
    name: 'Moussa Fall',
    role: "Directeur d'auto-école",
    city: 'Thiès',
    avatar: '/images/home/testimonial-2.jpg',
    rating: 5,
    quote:
      "L'ERP nous a fait gagner un temps fou sur la gestion des élèves et des paiements. Plus besoin de cahiers, tout est centralisé.",
  },
  {
    name: 'Fatou Sarr',
    role: 'Élève',
    city: 'Saint-Louis',
    avatar: '/images/home/testimonial-3.jpg',
    rating: 5,
    quote:
      "Le suivi de ma formation en temps réel m'a vraiment motivée. Je savais exactement où j'en étais avant l'examen.",
  },
  {
    name: 'Ibrahima Ndiaye',
    role: 'Moniteur',
    city: 'Kaolack',
    avatar: '/images/home/testimonial-4.jpg',
    rating: 4,
    quote:
      'La messagerie intégrée simplifie vraiment les échanges avec les élèves. Plus rapide que les appels ou WhatsApp.',
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIndex((i) => (i + 1) % TESTIMONIALS.length), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 5500);
    return () => clearInterval(id);
  }, [paused, next]);

  const current = TESTIMONIALS[index];

  return (
    <section className="bg-surface-1 py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="chip chip-orange">Témoignages</span>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            Ils ont utilisé Permis2
          </h2>
        </motion.div>

        <div
          className="relative mt-12"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="card-clay text-center"
            >
              <Quote className="mx-auto h-8 w-8 text-primary-200 dark:text-primary-900" strokeWidth={1.5} />
              <p className="mx-auto mt-4 max-w-xl text-base font-medium text-foreground sm:text-lg">
                &laquo; {current.quote} &raquo;
              </p>

              <div className="mt-6 flex items-center justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < current.rating ? 'fill-xp text-xp' : 'text-slate-300 dark:text-slate-600'}`}
                    strokeWidth={1.5}
                  />
                ))}
              </div>

              <div className="mt-5 flex items-center justify-center gap-3">
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-2">
                  <Image src={current.avatar} alt={current.name} fill sizes="44px" className="object-cover" />
                </span>
                <div className="text-left">
                  <p className="font-display text-sm font-bold text-foreground">{current.name}</p>
                  <p className="text-xs text-secondary">
                    {current.role} · {current.city}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-center gap-2">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.name}
                onClick={() => setIndex(i)}
                aria-label={`Voir le témoignage de ${t.name}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-6 bg-primary-600' : 'w-2 bg-surface-3'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
