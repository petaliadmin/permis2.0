'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sheet, Skeleton } from '@permis2.0/ui';
import { AppShell } from '@/components/AppShell';
import { PaymentPanel } from '@/components/PaymentPanel';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAuthStore } from '@/store/authStore';
import { WHATSAPP_DISPLAY, whatsappLink } from '@/lib/contact';
import { waveLink } from '@/lib/wave';
import { trackEvent } from '@/lib/analytics';
import {
  IconBrandWhatsapp,
  IconCheck,
  IconChevronLeft,
  IconClock,
  IconRefresh,
  IconCards,
  IconClipboardCheck,
  IconCar,
  IconCalendar,
  IconDeviceMobile,
  IconCreditCard,
} from '@tabler/icons-react';

const BENEFITS = [
  { icon: IconCards, text: 'Toutes les séries de quiz du Code' },
  { icon: IconClipboardCheck, text: 'Tous les examens blancs premium' },
  { icon: IconCar, text: 'Tous les cours de conduite' },
  { icon: IconCalendar, text: 'Accès illimité pendant 4 mois' },
];

function formatXof(n: number) {
  return `${n.toLocaleString('fr-FR')} FCFA`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/* ── Abonnement ───────────────────────────────────────────────────────────────── */
function AbonnementInner() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const [requested, setRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [waveSheetOpen, setWaveSheetOpen] = useState(false);

  const products = useSubscriptionStore((s) => s.products);
  const loading = useSubscriptionStore((s) => s.loading);
  const hasKey = useSubscriptionStore((s) => s.hasKey);
  const premiumExpiresAt = useSubscriptionStore((s) => s.premiumExpiresAt);
  const fetchProducts = useSubscriptionStore((s) => s.fetchProducts);
  const fetchEntitlements = useSubscriptionStore((s) => s.fetchEntitlements);
  const requestManual = useSubscriptionStore((s) => s.requestManual);

  // Products/entitlements seed from a per-origin cache → the first client render
  // can differ from SSR. Hold the catalog-dependent UI until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetchProducts();
    fetchEntitlements();
  }, [fetchProducts, fetchEntitlements]);

  const plan = products
    .filter((p) => p.type === 'STUDENT' && p.active)
    .sort((a, b) => a.ordre - b.ordre)[0];
  const isActive = hasKey('premium_all');
  const priceXof = plan?.priceXof ?? 2900;
  const wavePayLink = waveLink(priceXof);

  const waLink = whatsappLink(
    `Bonjour PERMIS 2.0 ! 👋\nJe souhaite activer l'${plan?.title ?? 'Abonnement'} (${formatXof(priceXof)}).\nMon compte : ${authUser?.name ?? ''}${authUser?.phone ? ` — +221 ${authUser.phone}` : ''}`
  );

  const refreshEntitlements = async () => {
    setRefreshing(true);
    setRefreshed(false);
    await fetchEntitlements();
    setRefreshing(false);
    setRefreshed(true);
    setTimeout(() => setRefreshed(false), 4000);
  };

  const activateViaWhatsapp = async () => {
    if (!plan) return;
    setSubmitting(true);
    await requestManual(plan.id); // creates a PENDING subscription for /admin/demandes
    setSubmitting(false);
    setRequested(true);
    trackEvent('subscription_started', { product_id: plan.id, method: 'whatsapp' });
  };

  const iPaidWave = async () => {
    if (!plan) return;
    setSubmitting(true);
    await requestManual(plan.id, undefined, 'WAVE');
    setSubmitting(false);
    setWaveSheetOpen(false);
    setRequested(true);
    trackEvent('subscription_started', { product_id: plan.id, method: 'wave' });
  };

  return (
    <AppShell>
      <header className="relative overflow-hidden rounded-b-[28px] bg-gradient-to-br from-orange-500 to-orange-600 px-5 pt-[calc(env(safe-area-inset-top)+18px)] pb-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <button
          onClick={() => router.back()}
          className="relative mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15"
          aria-label="Retour"
        >
          <IconChevronLeft size="1em" className="text-lg" aria-hidden="true" />
        </button>
        <div className="relative flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Abonnement</h1>
            <p className="mt-1 text-sm text-white/85">Accès illimité à tout le contenu.</p>
          </div>
          <span className="text-4xl" aria-hidden="true">
            👑
          </span>
        </div>
      </header>

      <div className="px-5 pt-6 pb-10">
        {!mounted || (loading && products.length === 0) ? (
          <Skeleton className="h-96 w-full rounded-3xl" />
        ) : !plan ? (
          <div className="rounded-2xl border border-token bg-surface-1 p-6 text-center">
            <p className="text-sm text-secondary">
              L&apos;abonnement est momentanément indisponible en ligne.
            </p>
            <a
              href={whatsappLink(
                "Bonjour PERMIS 2.0 ! 👋\nJe souhaite activer mon abonnement — la page m'indique qu'il est momentanément indisponible."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-md transition-transform active:scale-[0.98]"
            >
              <IconBrandWhatsapp size="1em" className="text-xl" aria-hidden="true" />
              Nous contacter sur WhatsApp · {WHATSAPP_DISPLAY}
            </a>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-3xl border border-orange-200 bg-surface-1 shadow-card"
          >
            {/* Price */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 px-6 pt-6 pb-5">
              <div className="flex items-end gap-1.5">
                <span className="font-display text-4xl font-black text-orange-600">
                  {formatXof(plan.priceXof)}
                </span>
                <span className="mb-1.5 text-sm font-semibold text-muted">/ 4 mois</span>
              </div>
              <p className="mt-1 text-xs text-orange-700/70">{plan.description}</p>
            </div>

            {/* Benefits */}
            <ul className="space-y-3 px-6 py-5">
              {BENEFITS.map((b) => (
                <li
                  key={b.text}
                  className="flex items-center gap-3 text-sm font-medium text-foreground"
                >
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-orange-100">
                    <b.icon size="1em" className="text-xs text-orange-600" aria-hidden="true" />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>

            {/* Payment methods — Orange Money / Carte bancaire coming soon, WhatsApp active */}
            <div className="border-t border-token px-6 pb-4">
              <p className="mb-2.5 mt-3 text-xs font-bold uppercase tracking-wide text-muted">
                Moyens de paiement
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-token bg-surface-2 px-3.5 py-3 opacity-60">
                  <span className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                    <IconDeviceMobile size="1em" className="text-lg text-orange-500" aria-hidden="true" />
                    Orange Money
                  </span>
                  <span className="rounded-full bg-surface-1 px-2.5 py-1 text-[11px] font-bold text-muted">
                    Disponible bientôt
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-token bg-surface-2 px-3.5 py-3 opacity-60">
                  <span className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                    <IconCreditCard size="1em" className="text-lg text-slate-500" aria-hidden="true" />
                    Carte bancaire
                  </span>
                  <span className="rounded-full bg-surface-1 px-2.5 py-1 text-[11px] font-bold text-muted">
                    Disponible bientôt
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setWaveSheetOpen(true)}
                  disabled={!plan}
                  className="flex w-full items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-3 text-left transition-colors hover:bg-sky-100 disabled:opacity-60"
                >
                  <span className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                    <Image src="/images/payments/wave.png" alt="Wave" width={46} height={20} />
                  </span>
                  <span className="rounded-full bg-sky-500 px-2.5 py-1 text-[11px] font-bold text-white">
                    Actif
                  </span>
                </button>
                <div className="flex items-center justify-between rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 px-3.5 py-3">
                  <span className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                    <IconBrandWhatsapp size="1em" className="text-lg text-[#25D366]" aria-hidden="true" />
                    Contact WhatsApp
                  </span>
                  <span className="rounded-full bg-[#25D366] px-2.5 py-1 text-[11px] font-bold text-white">
                    Actif
                  </span>
                </div>
              </div>
            </div>

            {/* Active banner */}
            {isActive && (
              <div className="px-6 pt-2">
                <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl bg-success-50 px-4 py-3 text-sm font-bold text-success-700">
                  <span>✅ Abonnement actif</span>
                  {premiumExpiresAt && (
                    <span className="font-medium text-secondary">
                      jusqu&apos;au {formatDate(premiumExpiresAt)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ── CTA : activation via WhatsApp ── */}
            <div className="px-6 pb-6 pt-4">
              {!isActive && !requested && (
                <>
                  <div className="rounded-2xl border border-token bg-surface-2 p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
                      Comment activer ton abonnement
                    </p>
                    <ol className="space-y-3">
                      {[
                        {
                          done: isAuthenticated,
                          text: isAuthenticated
                            ? `Compte créé ✓ (${authUser?.name ?? ''})`
                            : 'Crée ton compte gratuit (1 minute)',
                        },
                        {
                          done: false,
                          text: `Contacte-nous sur WhatsApp au ${WHATSAPP_DISPLAY} en indiquant ton numéro de compte`,
                        },
                        {
                          done: false,
                          text: `Règle ${formatXof(priceXof)} — notre équipe active ton abonnement immédiatement`,
                        },
                      ].map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${step.done ? 'bg-success-500 text-white' : 'bg-orange-100 text-orange-600'}`}
                          >
                            {step.done ? <IconCheck size="1em" aria-hidden="true" /> : i + 1}
                          </span>
                          <span className="text-sm leading-snug text-foreground">{step.text}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {isAuthenticated ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={activateViaWhatsapp}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-md transition-transform active:scale-[0.98]"
                    >
                      <IconBrandWhatsapp size="1em" className="text-xl" aria-hidden="true" />
                      {submitting ? 'Enregistrement…' : `Activer via WhatsApp · ${WHATSAPP_DISPLAY}`}
                    </a>
                  ) : (
                    <button
                      onClick={() => router.push('/auth/register')}
                      className="btn-primary mt-4 w-full"
                    >
                      Créer mon compte d&apos;abord
                    </button>
                  )}
                </>
              )}

              {requested && !isActive && (
                <div className="rounded-2xl border border-token bg-surface-2 p-4 text-center">
                  <IconClock size="1em" className="mx-auto text-2xl text-orange-500" aria-hidden="true" />
                  <p className="mt-2 text-sm font-bold text-foreground">Activation en cours</p>
                  <p className="mt-1 text-xs text-secondary">
                    Notre équipe vérifie ton paiement et active ton abonnement (généralement en
                    moins d&apos;une heure).
                  </p>
                </div>
              )}

              {/* Refresh after team activation */}
              {isAuthenticated && (
                <button
                  onClick={refreshEntitlements}
                  disabled={refreshing}
                  className="btn-ghost mt-3 w-full disabled:opacity-50"
                >
                  {refreshing ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500 align-middle" />
                      Vérification…
                    </>
                  ) : (
                    <>
                      <IconRefresh size="1em" className="mr-2" aria-hidden="true" />
                      {isActive ? 'Vérifier mon abonnement' : 'J’ai payé — vérifier l’activation'}
                    </>
                  )}
                </button>
              )}
              {refreshed && !isActive && (
                <p className="mt-2 text-center text-xs font-medium text-secondary">
                  Pas encore activé — notre équipe te confirme sur WhatsApp dès que c&apos;est fait.
                </p>
              )}
              {refreshed && isActive && (
                <p className="mt-2 text-center text-xs font-bold text-success-600">
                  🎉 Abonnement actif — tout le contenu est débloqué !
                </p>
              )}

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
                <IconClock size="1em" className="text-xs" aria-hidden="true" />
                Activation immédiate après paiement · 7j/7 de 9h à 21h
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Wave payment sheet ── */}
      <Sheet open={waveSheetOpen} onClose={() => setWaveSheetOpen(false)} ariaLabel="Payer par Wave">
        <h3 className="font-display text-lg font-extrabold text-foreground">Payer par Wave</h3>
        <div className="mt-0.5 flex items-baseline gap-1">
          <span className="font-display text-2xl font-extrabold text-orange-600">
            {formatXof(priceXof)}
          </span>
          <span className="text-sm text-muted">/ 4 mois</span>
        </div>
        <PaymentPanel
          link={wavePayLink}
          methodLabel="Wave"
          note="Après paiement, appuie sur « J'ai payé » — l'équipe active ton accès (généralement < 1h)."
          primaryAction={{ label: "J'ai payé", onClick: iPaidWave, busy: submitting }}
          onCancel={() => setWaveSheetOpen(false)}
        />
      </Sheet>
    </AppShell>
  );
}

export default function AbonnementClient() {
  return (
    <Suspense fallback={null}>
      <AbonnementInner />
    </Suspense>
  );
}
