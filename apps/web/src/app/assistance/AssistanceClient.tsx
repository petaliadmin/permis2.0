'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell, PageHeader } from '@/components/AppShell';
import { WHATSAPP_DISPLAY, whatsappLink } from '@/lib/contact';
import { ASSISTANCE_FAQS as FAQ } from '@/lib/assistanceFaq';
import {
  IconBrandWhatsapp,
  IconChevronRight,
  IconChevronDown,
  IconHeadset,
  IconHelpCircle,
  IconAlertTriangle,
  IconBulb,
} from '@tabler/icons-react';

const HELP_ITEMS = [
  {
    icon: IconHelpCircle,
    title: 'Questions fréquentes',
    desc: 'Consultez les réponses',
    color: '#7C3AED',
    soft: 'bg-violet-50',
  },
  {
    icon: IconBrandWhatsapp,
    title: 'Nous contacter',
    desc: `WhatsApp · ${WHATSAPP_DISPLAY}`,
    color: '#25D366',
    soft: 'bg-green-50',
  },
  {
    icon: IconAlertTriangle,
    title: 'Signaler un problème',
    desc: 'Aidez-nous à nous améliorer',
    color: '#F59E0B',
    soft: 'bg-amber-50',
  },
  {
    icon: IconBulb,
    title: 'Suggestions',
    desc: 'Partagez vos idées',
    color: '#16A34A',
    soft: 'bg-green-50',
  },
];

const openWhatsApp = (message: string) => window.open(whatsappLink(message), '_blank');

export default function AssistanceClient() {
  const [open, setOpen] = useState<number | null>(null);

  const HELP_ACTIONS = [
    () => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }),
    () => openWhatsApp('Bonjour PERMIS 2.0 ! 👋 J’ai besoin d’aide.'),
    () => openWhatsApp('Bonjour PERMIS 2.0 ! ⚠️ Je souhaite signaler un problème : '),
    () => openWhatsApp('Bonjour PERMIS 2.0 ! 💡 J’ai une suggestion : '),
  ];

  return (
    <AppShell>
      <PageHeader title="Assistance" accent="violet" back="/">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="font-display text-lg font-bold text-foreground">Besoin d&apos;aide ?</p>
            <p className="mt-0.5 text-sm text-secondary">
              Écrivez-nous sur WhatsApp, réponse rapide 7j/7.
            </p>
          </div>
          <div className="chip chip-violet flex h-16 w-16 shrink-0 items-center justify-center !rounded-2xl">
            <IconHeadset size="1em" className="text-4xl" aria-hidden="true" />
          </div>
        </div>
      </PageHeader>

      <div className="px-5 pt-6">
        <div className="space-y-3">
          {HELP_ITEMS.map((item, i) => (
            <motion.button
              key={item.title}
              onClick={HELP_ACTIONS[i]}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex w-full items-center gap-4 rounded-2xl border border-token bg-surface-1 p-4 text-left shadow-soft transition-transform active:scale-[0.98]"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.soft}`}
              >
                <item.icon size="1em" className="text-2xl" style={{ color: item.color }} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-bold text-foreground">{item.title}</p>
                <p className="mt-0.5 text-xs text-secondary">{item.desc}</p>
              </div>
              <IconChevronRight size="1em" className="text-lg text-slate-300" aria-hidden="true" />
            </motion.button>
          ))}
        </div>

        <p
          id="faq"
          className="mb-3 mt-8 scroll-mt-4 font-display text-base font-bold text-foreground"
        >
          Questions fréquentes
        </p>
        <div className="space-y-2.5">
          {FAQ.map((f, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-token bg-surface-1 shadow-soft"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span className="flex-1 text-sm font-semibold text-foreground">{f.question}</span>
                <IconChevronDown
                  size="1em"
                  className={`text-secondary transition-transform ${open === i ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="px-4 pb-4 text-sm leading-relaxed text-secondary">{f.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Contact CTA — WhatsApp */}
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] p-5 text-center text-white shadow-md">
          <IconBrandWhatsapp size="1em" className="text-3xl" aria-hidden="true" />
          <p className="mt-2 font-display text-base font-bold">Toujours besoin d'aide ?</p>
          <p className="mt-1 text-xs text-white/85">
            Écrivez-nous sur WhatsApp — 7j/7 de 9h à 21h.
          </p>
          <a
            href={whatsappLink('Bonjour PERMIS 2.0 ! 👋 J’ai besoin d’aide.')}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#128C7E]"
          >
            <IconBrandWhatsapp size="1em" aria-hidden="true" /> {WHATSAPP_DISPLAY}
          </a>
        </div>
      </div>
    </AppShell>
  );
}
