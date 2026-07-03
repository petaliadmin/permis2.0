'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell, PageHeader } from '@/components/AppShell';

const HELP_ITEMS = [
  { icon: 'ti-help-circle',  title: 'Questions fréquentes', desc: 'Consultez les réponses', color: '#7C3AED', soft: 'bg-violet-50' },
  { icon: 'ti-message-2',    title: 'Nous contacter',       desc: 'Discutez avec notre équipe', color: '#2563EB', soft: 'bg-blue-50' },
  { icon: 'ti-alert-triangle', title: 'Signaler un problème', desc: 'Aidez-nous à nous améliorer', color: '#F59E0B', soft: 'bg-amber-50' },
  { icon: 'ti-bulb',         title: 'Suggestions',          desc: 'Partagez vos idées', color: '#16A34A', soft: 'bg-green-50' },
];

const FAQ = [
  { q: 'Comment fonctionne l’abonnement ?', a: 'L’abonnement à 2 500 FCFA/mois débloque tous les quiz, les séries d’examen et le mode examen officiel. Sans engagement, annulable à tout moment.' },
  { q: 'Le contenu est-il conforme au Code sénégalais ?', a: 'Oui. Les panneaux, priorités, vitesses et infractions suivent le Code de la route du Sénégal. Toute information non vérifiable est signalée.' },
  { q: 'Puis-je réviser sans connexion ?', a: 'Oui, l’app est une PWA : les leçons consultées sont mises en cache pour une révision hors-ligne.' },
  { q: 'Quels moyens de paiement acceptez-vous ?', a: 'Orange Money, Wave et carte bancaire.' },
];

export default function AssistancePage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <AppShell>
      <PageHeader title="Assistance" accent="violet" back="/">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="font-display text-lg font-bold">Besoin d’aide ?</p>
            <p className="mt-0.5 text-sm text-white/80">Notre équipe est là pour vous accompagner.</p>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <i className="ti ti-headset text-4xl" aria-hidden="true" />
          </div>
        </div>
      </PageHeader>

      <div className="px-5 pt-6">
        <div className="space-y-3">
          {HELP_ITEMS.map((item, i) => (
            <motion.button key={item.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="flex w-full items-center gap-4 rounded-2xl border border-token bg-surface-1 p-4 text-left shadow-soft transition-transform active:scale-[0.98]">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.soft}`}>
                <i className={`ti ${item.icon} text-2xl`} style={{ color: item.color }} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-bold text-foreground">{item.title}</p>
                <p className="mt-0.5 text-xs text-secondary">{item.desc}</p>
              </div>
              <i className="ti ti-chevron-right text-lg text-slate-300" aria-hidden="true" />
            </motion.button>
          ))}
        </div>

        <p className="mb-3 mt-8 font-display text-base font-bold text-foreground">Questions fréquentes</p>
        <div className="space-y-2.5">
          {FAQ.map((f, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-token bg-surface-1 shadow-soft">
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-3 p-4 text-left">
                <span className="flex-1 text-sm font-semibold text-foreground">{f.q}</span>
                <i className={`ti ti-chevron-down text-secondary transition-transform ${open === i ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}>
                    <p className="px-4 pb-4 text-sm leading-relaxed text-secondary">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 p-5 text-center text-white shadow-md">
          <i className="ti ti-message-circle-heart text-3xl" aria-hidden="true" />
          <p className="mt-2 font-display text-base font-bold">Toujours besoin d’aide ?</p>
          <p className="mt-1 text-xs text-white/80">Écrivez-nous, nous répondons sous 24 h.</p>
          <a href="mailto:support@permis2.sn" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-violet-700">
            <i className="ti ti-mail" aria-hidden="true" /> Nous écrire
          </a>
        </div>
      </div>
    </AppShell>
  );
}
