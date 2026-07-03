'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Input, Sheet, Skeleton } from '@permis2.0/ui';
import type { PaymentMethod } from '@permis2.0/types';
import { AppShell } from '@/components/AppShell';
import { usePurchasesStore } from '@/store/purchasesStore';
import { useAuthStore } from '@/store/authStore';

const PAYMENT_LIVE = process.env.NEXT_PUBLIC_PAYMENT_LIVE === 'true';
// The dev "simulate" button only makes sense against the offline sandbox.
const IS_DEV = process.env.NODE_ENV !== 'production' && !PAYMENT_LIVE;

/** sku of the single annual subscription product (see prisma/seed.ts). */
const SUBSCRIPTION_SKU = 'abo_annuel';

/** What the subscription unlocks — shown as a checklist on the offer card. */
const BENEFITS = [
  'Toutes les séries de quiz du Code',
  'Tous les examens blancs premium',
  'Tous les cours de conduite',
  'Accès illimité pendant 1 an',
];

interface PaymentMethodMeta {
  id: PaymentMethod;
  label: string;
  emoji: string;
  /** Tailwind classes for the icon tile in each method's brand colour. */
  tile: string;
}

/** The three payment methods (all routed through Bictorys), with brand cues. */
const PAYMENT_METHODS: PaymentMethodMeta[] = [
  { id: 'orange_money', label: 'Orange Money', emoji: '🟠', tile: 'bg-orange-100 text-orange-600' },
  { id: 'wave',         label: 'Wave',         emoji: '🌊', tile: 'bg-sky-100 text-sky-600' },
  { id: 'card',         label: 'Carte',        emoji: '💳', tile: 'bg-surface-2 text-secondary' },
];

function formatXof(n: number) {
  return `${n.toLocaleString('fr-FR')} FCFA`;
}

/** "12 juin 2027" — expiry shown on the active-subscription state. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Senegalese Mobile Money numbers are 9 local digits (Orange/Wave), optionally
 * prefixed with +221 / 221.
 */
function isValidSnPhone(raw: string): boolean {
  const digits = raw.replace(/[^\d]/g, '').replace(/^221/, '');
  return digits.length === 9 && /^7[0-8]/.test(digits);
}

function BoutiqueInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const products = usePurchasesStore((s) => s.products);
  const loading = usePurchasesStore((s) => s.loading);
  const hasKey = usePurchasesStore((s) => s.hasKey);
  const premiumExpiresAt = usePurchasesStore((s) => s.premiumExpiresAt);
  const checkoutStatus = usePurchasesStore((s) => s.checkoutStatus);
  const activePurchaseId = usePurchasesStore((s) => s.activePurchaseId);
  const error = usePurchasesStore((s) => s.error);
  const fetchProducts = usePurchasesStore((s) => s.fetchProducts);
  const fetchEntitlements = usePurchasesStore((s) => s.fetchEntitlements);
  const checkout = usePurchasesStore((s) => s.checkout);
  const pollPurchase = usePurchasesStore((s) => s.pollPurchase);
  const simulateConfirm = usePurchasesStore((s) => s.simulateConfirm);
  const resetCheckout = usePurchasesStore((s) => s.resetCheckout);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('orange_money');

  useEffect(() => {
    fetchProducts();
    fetchEntitlements();
  }, [fetchProducts, fetchEntitlements]);

  useEffect(() => {
    const status = searchParams.get('status');
    if (!status) return;
    const pending = typeof window !== 'undefined' ? localStorage.getItem('pending-purchase') : null;
    if (status === 'success' && pending) {
      setSheetOpen(true);
      pollPurchase(pending);
    }
    if (typeof window !== 'undefined') localStorage.removeItem('pending-purchase');
    router.replace('/boutique');
  }, [searchParams, pollPurchase, router]);

  const subscription = products.find((p) => p.sku === SUBSCRIPTION_SKU);
  const isActive = hasKey('premium_all');

  const openSheet = () => {
    if (!isAuthenticated) { router.push('/auth/register'); return; }
    resetCheckout();
    setSheetOpen(true);
  };
  const closeSheet = () => { setSheetOpen(false); resetCheckout(); };

  const phoneValid = method === 'card' || isValidSnPhone(phone);

  const handlePay = async () => {
    if (!subscription) return;
    if (method !== 'card' && !phoneValid) return;
    const result = await checkout(subscription.id, phone.trim(), method);
    if (!result) return;
    if (result.redirectUrl) { window.location.href = result.redirectUrl; return; }
    pollPurchase(result.purchaseId);
  };

  return (
    <AppShell>
      <header className="bg-gradient-to-br from-orange-500 to-orange-600 px-5 pt-[calc(env(safe-area-inset-top)+18px)] pb-6 text-white rounded-b-[28px] shadow-lg">
        <button onClick={() => router.back()} className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15" aria-label="Retour">
          <i className="ti ti-chevron-left text-lg" aria-hidden="true" />
        </button>
        <h1 className="font-display text-2xl font-extrabold">Abonnement</h1>
        <p className="mt-1 text-sm text-white/85">Un seul abonnement, tout le contenu débloqué.</p>
      </header>

      <div className="px-5 pt-6">
        {loading && products.length === 0 ? (
          <Skeleton className="h-96 w-full rounded-3xl" />
        ) : !subscription ? (
          <p className="rounded-2xl border border-token bg-surface-1 p-6 text-center text-sm text-secondary">
            L&apos;abonnement est momentanément indisponible. Réessayez plus tard.
          </p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl border border-orange-200 bg-surface-1 p-6 shadow-card"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-3xl" aria-hidden="true">👑</span>
              <div>
                <h2 className="font-display text-xl font-extrabold text-foreground">{subscription.title}</h2>
                <p className="text-sm text-secondary">{subscription.description}</p>
              </div>
            </div>

            <div className="flex items-end gap-1.5">
              <span className="font-display text-4xl font-black text-orange-600">{formatXof(subscription.priceXof)}</span>
              <span className="mb-1 text-sm font-semibold text-muted">/ an</span>
            </div>

            <ul className="mt-6 space-y-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-orange-100 text-xs text-orange-600" aria-hidden="true">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>

            {isActive ? (
              <div className="mt-7">
                <div className="flex items-center justify-center gap-2 rounded-xl bg-success-50 px-4 py-3 text-sm font-bold text-success-700">
                  <span aria-hidden="true">✅</span>
                  Abonnement actif
                  {premiumExpiresAt && <span className="font-medium text-secondary">· jusqu&apos;au {formatDate(premiumExpiresAt)}</span>}
                </div>
                <Button variant="outline" size="lg" className="mt-3 w-full" onClick={openSheet}>Renouveler</Button>
              </div>
            ) : (
              <Button size="lg" className="mt-7 w-full" onClick={openSheet}>
                S&apos;abonner · {formatXof(subscription.priceXof)}
              </Button>
            )}

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
              <span aria-hidden="true">🔒</span> Paiement sécurisé via Bictorys · sans engagement
            </p>
          </motion.div>
        )}
      </div>

      {/* Payment sheet */}
      <Sheet open={sheetOpen} onClose={closeSheet} ariaLabel="Confirmer l'abonnement">
        {subscription && (
          <div>
            {checkoutStatus === 'paid' ? (
              <div className="py-6 text-center">
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-4xl">🎉</motion.div>
                <h3 className="font-display text-lg font-extrabold text-foreground">Abonnement activé !</h3>
                <p className="mt-1 text-sm text-secondary">Tout le contenu premium est maintenant débloqué.</p>
                <Button className="mt-5 w-full" onClick={closeSheet}>Continuer</Button>
              </div>
            ) : checkoutStatus === 'pending' ? (
              <div className="py-6 text-center">
                <span className="mx-auto mb-4 block h-10 w-10 animate-spin rounded-full border-4 border-primary/25 border-t-primary" aria-hidden="true" />
                <h3 className="font-display text-base font-extrabold text-foreground">
                  {method === 'card' ? 'Redirection vers le paiement sécurisé…' : 'Confirmez sur votre téléphone'}
                </h3>
                <p className="mt-1 text-sm text-secondary">
                  {method === 'card'
                    ? 'Un instant, nous ouvrons la page de paiement.'
                    : `Validez la demande ${PAYMENT_METHODS.find((m) => m.id === method)?.label} reçue au ${phone}.`}
                </p>
                {IS_DEV && activePurchaseId && (
                  <Button variant="outline" className="mt-5 w-full" onClick={() => simulateConfirm(activePurchaseId)}>
                    Simuler la confirmation (dev)
                  </Button>
                )}
                <button type="button" onClick={closeSheet} className="mt-3 text-sm font-medium text-muted hover:text-secondary">Annuler</button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-lg font-extrabold text-foreground">{subscription.title}</h3>
                <p className="mt-1 text-sm text-secondary">{subscription.description}</p>
                <p className="mt-2 font-display text-2xl font-extrabold text-orange-600">
                  {formatXof(subscription.priceXof)}
                  <span className="ml-1 text-sm font-semibold text-muted">/ an</span>
                </p>

                <p className="mt-5 text-xs font-bold uppercase tracking-wide text-muted">Moyen de paiement</p>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {PAYMENT_METHODS.map((m) => (
                    <MethodButton key={m.id} method={m} active={method === m.id} onClick={() => setMethod(m.id)} />
                  ))}
                </div>

                {method === 'card' ? (
                  <div className="mt-4 rounded-xl bg-surface-2 p-3 text-sm text-secondary">
                    Vous serez redirigé vers la page de paiement sécurisée pour saisir votre carte (Visa / Mastercard).
                  </div>
                ) : (
                  <label className="mt-4 block text-sm font-medium text-foreground">
                    Numéro {PAYMENT_METHODS.find((m) => m.id === method)?.label}
                    <Input type="tel" inputMode="tel" placeholder="+221 77 000 00 00" value={phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                      className="mt-1" aria-invalid={phone.length > 0 && !phoneValid} />
                    {phone.length > 0 && !phoneValid && (
                      <span className="mt-1 block text-xs font-medium text-danger">
                        Entrez un numéro sénégalais valide (77, 78, 76, 70 ou 75…).
                      </span>
                    )}
                  </label>
                )}

                {checkoutStatus === 'failed' && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-semibold text-danger">
                    {error || 'Le paiement a échoué. Veuillez réessayer.'}
                  </p>
                )}

                <Button size="lg" className="mt-5 w-full" disabled={!phoneValid} onClick={handlePay}>
                  Payer {formatXof(subscription.priceXof)}
                </Button>

                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
                  <span aria-hidden="true">🔒</span> Paiement sécurisé via Bictorys
                </p>
              </>
            )}
          </div>
        )}
      </Sheet>
    </AppShell>
  );
}

export default function BoutiquePage() {
  return (
    <Suspense fallback={null}>
      <BoutiqueInner />
    </Suspense>
  );
}

function MethodButton({ method, active, onClick }: { method: PaymentMethodMeta; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-colors ${
        active ? 'border-primary-500 bg-primary-50' : 'border-token hover:border-token-strong'
      }`}>
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${method.tile}`} aria-hidden="true">{method.emoji}</span>
      <span className={`text-xs font-bold ${active ? 'text-primary-600' : 'text-secondary'}`}>{method.label}</span>
    </button>
  );
}
