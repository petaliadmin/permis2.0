'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  FileCheck2,
  GitCompare,
  UserPlus,
  ClipboardList,
  MessageCircle,
  CreditCard,
  LineChart,
  FileText,
  Bell,
  Users2,
  Wallet,
  Calculator,
  Car,
  GraduationCap,
  CalendarDays,
  BarChart3,
  FileSignature,
  Receipt,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react';

interface Service {
  key: string;
  badge: string;
  accent: 'primary' | 'blue-violet' | 'violet';
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  features: { icon: LucideIcon; label: string }[];
  cta: string;
  href: string;
}

const SERVICES: Service[] = [
  {
    key: 'find-school',
    badge: '01',
    accent: 'primary',
    image: '/images/hero.png',
    imageAlt:
      "Un élève sénégalais reçoit son permis des mains de son moniteur, devant le véhicule de l'auto-école",
    title: 'Trouver une auto-école',
    description:
      "Un annuaire complet, une carte interactive et des filtres précis pour choisir en toute confiance.",
    features: [
      { icon: MapPin, label: 'Google Maps' },
      { icon: Search, label: 'Recherche' },
      { icon: SlidersHorizontal, label: 'Filtres' },
      { icon: Star, label: 'Avis' },
      { icon: FileCheck2, label: 'Pré-inscription' },
      { icon: GitCompare, label: 'Comparaison' },
    ],
    cta: 'Découvrir',
    href: '/ecoles',
  },
  {
    key: 'student-platform',
    badge: '02',
    accent: 'blue-violet',
    image: '/images/home/for-students.jpg',
    imageAlt: "Élève sénégalaise suivant sa formation sur l'application PERMIS 2.0",
    title: 'Plateforme Élève',
    description:
      'Votre parcours de A à Z : inscription, échanges avec votre auto-école, paiement et suivi pédagogique.',
    features: [
      { icon: UserPlus, label: 'Créer un compte' },
      { icon: ClipboardList, label: "Suivre l'inscription" },
      { icon: MessageCircle, label: 'Messagerie' },
      { icon: CreditCard, label: 'Paiement' },
      { icon: LineChart, label: 'Suivi pédagogique' },
      { icon: FileText, label: 'Documents' },
      { icon: Bell, label: 'Notifications' },
    ],
    cta: 'Créer mon compte',
    href: '/onboarding',
  },
  {
    key: 'erp',
    badge: '03',
    accent: 'violet',
    image: '/images/home/for-schools.jpg',
    imageAlt: "Directeur d'auto-école sénégalais pilotant son activité depuis le tableau de bord ERP",
    title: 'ERP Auto-école',
    description:
      'Un back-office complet pour piloter votre auto-école : élèves, moniteurs, véhicules, examens et facturation.',
    features: [
      { icon: Users2, label: 'CRM' },
      { icon: GraduationCap, label: 'Gestion des élèves' },
      { icon: Wallet, label: 'Paiements' },
      { icon: Calculator, label: 'Comptabilité' },
      { icon: Car, label: 'Moniteurs' },
      { icon: FileCheck2, label: 'Examens' },
      { icon: CalendarDays, label: 'Planning' },
      { icon: BarChart3, label: 'Statistiques' },
      { icon: FileText, label: 'Documents' },
      { icon: FileSignature, label: 'Signature' },
      { icon: Receipt, label: 'Facturation' },
      { icon: LayoutDashboard, label: 'Tableaux de bord' },
    ],
    cta: 'Gérer mon auto-école',
    href: '/mon-ecole',
  },
];

const ACCENT_STYLES: Record<Service['accent'], { badge: string; ring: string; cta: string }> = {
  primary: {
    badge: 'bg-primary-50 text-primary-600',
    ring: 'hover:border-primary-200',
    cta: 'text-primary-600',
  },
  'blue-violet': {
    badge: 'bg-gradient-to-br from-primary-500 to-violet-600 text-white',
    ring: 'hover:border-violet-200',
    cta: 'text-violet-600',
  },
  violet: {
    badge: 'bg-violet-50 text-violet-600',
    ring: 'hover:border-violet-200',
    cta: 'text-violet-600',
  },
};

export function Services() {
  return (
    <section id="services" className="scroll-mt-20 bg-surface-1 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="chip chip-primary">Nos services</span>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            Tout ce qu&apos;il faut, en un seul endroit
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {SERVICES.map((s, i) => {
            const accent = ACCENT_STYLES[s.accent];
            return (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`card-clay flex flex-col overflow-hidden !p-0 border-2 ${accent.ring} transition-colors`}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-2">
                  <Image
                    src={s.image}
                    alt={s.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 90vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                  <span
                    className={`absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-2xl font-display text-sm font-extrabold shadow-lg ${accent.badge}`}
                  >
                    {s.badge}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-xl font-extrabold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm text-secondary">{s.description}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {s.features.map((f) => (
                      <span
                        key={f.label}
                        className="inline-flex items-center gap-1.5 rounded-full border border-token bg-surface-2 px-2.5 py-1 text-xs font-semibold text-secondary"
                      >
                        <f.icon className="h-3.5 w-3.5" strokeWidth={2} />
                        {f.label}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={s.href}
                    className={`mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-bold hover:underline ${accent.cta}`}
                  >
                    {s.cta} →
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
