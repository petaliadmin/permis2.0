'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sheet, Skeleton } from '@permis2.0/ui';
import { AppShell } from '@/components/AppShell';
import { PaymentPanel } from '@/components/PaymentPanel';
import { usePurchasesStore } from '@/store/purchasesStore';
import { useAuthStore } from '@/store/authStore';
import { SUBSCRIPTION_PRICE_ANNUAL } from '@permis2.0/shared';
import { WHATSAPP_DISPLAY, whatsappLink } from '@/lib/contact';
import { waveLink } from '@/lib/wave';
import { trackEvent } from '@/lib/analytics';

/**
 * Temporary payment mode. 'manual' (default) hides the online checkout and
 * routes users to WhatsApp for activation by the team. Set
 * NEXT_PUBLIC_PAYMENT_MODE=online to re-enable the Bictorys flow — the whole
 * integration below is kept intact.
 */
const PAYMENT_MODE = process.env.NEXT_PUBLIC_PAYMENT_MODE === 'online' ? 'online' : 'manual';

const SUBSCRIPTION_SKU = 'abo_annuel';

const BENEFITS = [
  { icon: 'ti-cards', text: 'Toutes les séries de quiz du Code' },
  { icon: 'ti-clipboard-check', text: 'Tous les examens blancs premium' },
  { icon: 'ti-car', text: 'Tous les cours de conduite' },
  { icon: 'ti-calendar', text: 'Accès illimité pendant 1 an' },
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

/* ── Boutique ─────────────────────────────────────────────────────────────────── */
function BoutiqueInner() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authUser = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);

  const products = usePurchasesStore((s) => s.products);
  const loading = usePurchasesStore((s) => s.loading);
  const hasKey = usePurchasesStore((s) => s.hasKey);
  const premiumExpiresAt = usePurchasesStore((s) => s.premiumExpiresAt);
  const fetchProducts = usePurchasesStore((s) => s.fetchProducts);
  const fetchEntitlements = usePurchasesStore((s) => s.fetchEntitlements);
  const requestManual = usePurchasesStore((s) => s.requestManual);

  const [sheetOpen, setSheetOpen] = useState(false);
  // 'pay' = QR + link · 'requested' = user tapped "J'ai payé", team activating
  const [stage, setStage] = useState<'pay' | 'requested'>('pay');
  const [submitting, setSubmitting] = useState(false);
  // Products/entitlements seed from a per-origin cache → the first client render
  // can differ from SSR. Hold the catalog-dependent UI until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetchProducts();
    fetchEntitlements();
  }, [fetchProducts, fetchEntitlements]);

  const subscription = products.find((p) => p.sku === SUBSCRIPTION_SKU);
  const isActive = hasKey('premium_all');
  const priceXof = subscription?.priceXof ?? 2900;
  const payLink = waveLink(priceXof);

  // ── Manual (WhatsApp) activation helper ──
  const waLink = whatsappLink(
    `Bonjour PERMIS 2.0 ! 👋\nJ'ai payé l'Abonnement Annuel (${formatXof(priceXof)}) par Wave.\nMon compte : ${authUser?.name ?? ''}${authUser?.phone ? ` — +221 ${authUser.phone}` : ''}`
  );

  const refreshEntitlements = async () => {
    setRefreshing(true);
    setRefreshed(false);
    await fetchEntitlements();
    setRefreshing(false);
    setRefreshed(true);
    setTimeout(() => setRefreshed(false), 4000);
  };

  const openSheet = () => {
    if (!isAuthenticated) {
      router.push('/auth/register');
      return;
    }
    setStage('pay');
    setSheetOpen(true);
  };
  const closeSheet = () => setSheetOpen(false);

  const iPaid = async () => {
    if (!subscription) return;
    setSubmitting(true);
    await requestManual(subscription.id); // creates a PENDING purchase for /admin/demandes
    await fetchEntitlements();
    setSubmitting(false);
    setStage('requested');
    trackEvent('subscription_started', { product_id: subscription.id });
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
          <i className="ti ti-chevron-left text-lg" aria-hidden="true" />
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
        ) : !subscription ? (
          <div className="rounded-2xl border border-token bg-surface-1 p-6 text-center">
            <p className="text-sm text-secondary">
              L&apos;abonnement est momentanément indisponible en ligne.
            </p>
            <a
              href={whatsappLink(
                "Bonjour PERMIS 2.0 ! 👋\nJe souhaite activer l'Abonnement Annuel — la page m'indique qu'il est momentanément indisponible."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-md transition-transform active:scale-[0.98]"
            >
              <i className="ti ti-brand-whatsapp text-xl" aria-hidden="true" />
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
                  {formatXof(subscription.priceXof)}
                </span>
                <span className="mb-1.5 text-sm font-semibold text-muted">/ an</span>
              </div>
              <p className="mt-1 text-xs text-orange-700/70">{subscription.description}</p>
            </div>

            {/* Benefits */}
            <ul className="space-y-3 px-6 py-5">
              {BENEFITS.map((b) => (
                <li
                  key={b.text}
                  className="flex items-center gap-3 text-sm font-medium text-foreground"
                >
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-orange-100">
                    <i className={`ti ${b.icon} text-xs text-orange-600`} aria-hidden="true" />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>

            {/* Accepted methods — online mode only */}
            {PAYMENT_MODE === 'online' && (
              <div className="border-t border-token px-6 pb-4">
                <p className="mb-2.5 mt-3 text-xs font-bold uppercase tracking-wide text-muted">
                  Paiement
                </p>
                <span className="flex w-fit items-center rounded-lg bg-sky-50 px-2 py-1">
                  <Image src="/images/payments/wave.png" alt="Wave" width={46} height={20} />
                </span>
              </div>
            )}

            {/* Active banner (both modes) */}
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

            {/* ── CTA : mode MANUEL (WhatsApp) ── */}
            {PAYMENT_MODE === 'manual' ? (
              <div className="px-6 pb-6 pt-4">
                {!isActive && (
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
                            text: `Règle ${subscription ? formatXof(subscription.priceXof) : '2 900 FCFA'} par Wave ou Orange Money — notre équipe active ton abonnement immédiatement`,
                          },
                        ].map((step, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${step.done ? 'bg-success-500 text-white' : 'bg-orange-100 text-orange-600'}`}
                            >
                              {step.done ? <i className="ti ti-check" aria-hidden="true" /> : i + 1}
                            </span>
                            <span className="text-sm leading-snug text-foreground">
                              {step.text}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {isAuthenticated ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => subscription && requestManual(subscription.id)}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-md transition-transform active:scale-[0.98]"
                      >
                        <i className="ti ti-brand-whatsapp text-xl" aria-hidden="true" />
                        Activer via WhatsApp · {WHATSAPP_DISPLAY}
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
                        <i className="ti ti-refresh mr-2" aria-hidden="true" />
                        {isActive ? 'Vérifier mon abonnement' : 'J’ai payé — vérifier l’activation'}
                      </>
                    )}
                  </button>
                )}
                {refreshed && !isActive && (
                  <p className="mt-2 text-center text-xs font-medium text-secondary">
                    Pas encore activé — notre équipe te confirme sur WhatsApp dès que c&apos;est
                    fait.
                  </p>
                )}
                {refreshed && isActive && (
                  <p className="mt-2 text-center text-xs font-bold text-success-600">
                    🎉 Abonnement actif — tout le contenu est débloqué !
                  </p>
                )}

                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
                  <i className="ti ti-clock text-xs" aria-hidden="true" />
                  Activation immédiate après paiement · 7j/7 de 9h à 21h
                </p>
              </div>
            ) : (
              /* ── CTA : mode EN LIGNE (Bictorys — conservé) ── */
              <div className="px-6 pb-6">
                {isActive ? (
                  <button onClick={openSheet} className="btn-ghost mt-3 w-full">
                    Renouveler
                  </button>
                ) : (
                  <button onClick={openSheet} className="btn-primary w-full">
                    S&apos;abonner · {SUBSCRIPTION_PRICE_ANNUAL}
                  </button>
                )}
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
                  <i className="ti ti-lock text-xs" aria-hidden="true" /> Paiement sécurisé · sans
                  engagement
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Payment sheet ──────────────────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onClose={closeSheet} ariaLabel="Finaliser l'abonnement">
        {subscription && (
          <div>
            {isActive ? (
              <div className="py-6 text-center">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-4xl"
                >
                  🎉
                </motion.div>
                <h3 className="font-display text-lg font-extrabold text-foreground">
                  Abonnement activé !
                </h3>
                <p className="mt-1 text-sm text-secondary">
                  Tout le contenu premium est débloqué.
                </p>
                <button className="btn-primary mt-5 w-full" onClick={closeSheet}>
                  Continuer
                </button>
              </div>
            ) : stage === 'requested' ? (
              <div className="py-4 text-center">
                <div className="mx-auto mb-3 flex h-14 w-24 items-center justify-center rounded-2xl bg-sky-50">
                  <Image src="/images/payments/wave.png" alt="Wave" width={69} height={30} />
                </div>
                <h3 className="font-display text-lg font-extrabold text-foreground">
                  Paiement signalé
                </h3>
                <p className="mt-1 text-sm text-secondary">
                  Notre équipe vérifie le transfert Wave et active ton abonnement
                  (généralement en moins d&apos;une heure). Tu peux fermer cette fenêtre.
                </p>
                <button
                  onClick={refreshEntitlements}
                  disabled={refreshing}
                  className="btn-primary mt-5 w-full disabled:opacity-50"
                >
                  {refreshing ? 'Vérification…' : 'Vérifier mon activation'}
                </button>
                {refreshed && (
                  <p className="mt-2 text-xs font-medium text-secondary">
                    Pas encore activé — réessaie dans quelques minutes.
                  </p>
                )}
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex w-full items-center justify-center gap-2 text-xs font-semibold text-secondary hover:text-foreground"
                >
                  <i className="ti ti-brand-whatsapp" aria-hidden="true" /> Un souci ? Écris-nous sur WhatsApp
                </a>
                <button
                  type="button"
                  onClick={closeSheet}
                  className="mt-3 w-full py-2 text-center text-sm text-muted hover:text-secondary"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-lg font-extrabold text-foreground">
                  Payer l&apos;abonnement
                </h3>
                <div className="mt-0.5 flex items-baseline gap-1">
                  <span className="font-display text-2xl font-extrabold text-orange-600">
                    {formatXof(priceXof)}
                  </span>
                  <span className="text-sm text-muted">/ an</span>
                </div>
                <PaymentPanel
                  link={payLink}
                  methodLabel="Wave"
                  note="Après paiement, appuie sur « J'ai payé » — l'équipe active ton accès (généralement < 1h)."
                  primaryAction={{ label: "J'ai payé", onClick: iPaid, busy: submitting }}
                  onCancel={closeSheet}
                />
              </>
            )}
          </div>
        )}
      </Sheet>
    </AppShell>
  );
}

export default function BoutiqueClient() {
  return (
    <Suspense fallback={null}>
      <BoutiqueInner />
    </Suspense>
  );
}
