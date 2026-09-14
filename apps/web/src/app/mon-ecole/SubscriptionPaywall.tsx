'use client';

import { useEffect, useState } from 'react';
import type { School } from '@permis2.0/types';
import { SchoolShell } from '@/components/SchoolShell';
import { usePurchasesStore } from '@/store/purchasesStore';
import { useAuthStore } from '@/store/authStore';
import { whatsappLink, WHATSAPP_DISPLAY } from '@/lib/contact';

const fmtXof = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;

const BENEFITS = [
  'Élèves, équipe, véhicules et planning illimités',
  'Facturation et suivi des paiements',
  'Fiche visible dans l’annuaire public',
];

interface SubscriptionPaywallProps {
  school: School;
  /** Refetches /schools/mine — call after confirmation to leave the paywall automatically. */
  onRefresh: () => Promise<void> | void;
}

/**
 * Shown by GestionClient instead of SchoolDashboard whenever
 * `school.subscriptionExpiresAt` is missing or in the past — the school
 * management space requires a PAID school_subscription (enforced server-side
 * too, in SchoolRolesGuard). Same manual/WhatsApp purchase pattern as the
 * student boutique (BoutiqueClient): no live online payment integration yet.
 */
export function SubscriptionPaywall({ school, onRefresh }: SubscriptionPaywallProps) {
  const authUser = useAuthStore((s) => s.user);
  const products = usePurchasesStore((s) => s.products);
  const fetchProducts = usePurchasesStore((s) => s.fetchProducts);
  const requestManual = usePurchasesStore((s) => s.requestManual);

  const [stage, setStage] = useState<'pay' | 'requested'>('pay');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const product = products.find((p) => p.sku === 'abo_ecole_annuel');
  const price = product?.priceXof ?? 12000;

  // trialEndsAt is set once at creation and never touched again — a school
  // whose subscriptionExpiresAt still equals it has never had a real paid
  // subscription (only ever the free trial), regardless of whether that
  // trial is still running or has lapsed. Any purchase pushes
  // subscriptionExpiresAt strictly past trialEndsAt (see ShopService.markPaid).
  const onOriginalTrial =
    !!school.trialEndsAt &&
    !!school.subscriptionExpiresAt &&
    new Date(school.subscriptionExpiresAt).getTime() === new Date(school.trialEndsAt).getTime();
  const everSubscribed = !!school.trialEndsAt && !onOriginalTrial;

  const waLink = whatsappLink(
    `Bonjour PERMIS 2.0 ! 👋\nJe souhaite ${everSubscribed ? 'renouveler' : 'activer'} l'abonnement annuel (${fmtXof(price)}) pour mon auto-école « ${school.name} ».\nMon compte : ${authUser?.name ?? ''}${authUser?.phone ? ` — +221 ${authUser.phone}` : ''}`
  );

  const iPaid = async () => {
    if (!product) return;
    setSubmitting(true);
    await requestManual(product.id, school.id);
    setSubmitting(false);
    setStage('requested');
  };

  const refresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <SchoolShell>
      <div className="mx-auto max-w-md px-4 py-14 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 text-3xl">
          🏫
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground">
          {everSubscribed
            ? 'Abonnement expiré'
            : onOriginalTrial
              ? 'Essai gratuit terminé'
              : 'Abonnement requis'}
        </h1>
        <p className="mt-2 text-sm text-secondary">
          {everSubscribed
            ? `L'abonnement de « ${school.name} » est arrivé à échéance.`
            : onOriginalTrial
              ? `Les 3 mois d'essai gratuit de « ${school.name} » sont terminés. Activez l'abonnement annuel pour continuer à accéder à l'espace de gestion.`
              : `Activez l'abonnement de « ${school.name} » pour accéder à l'espace de gestion.`}
        </p>

        {stage === 'pay' ? (
          <div className="mt-6 overflow-hidden rounded-3xl border border-violet-200 bg-surface-1 text-left shadow-card">
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 px-6 pt-6 pb-5">
              <div className="flex items-end gap-1.5">
                <span className="font-display text-4xl font-black text-violet-600">
                  {fmtXof(price)}
                </span>
                <span className="mb-1.5 text-sm font-semibold text-muted">/ an</span>
              </div>
              <p className="mt-1 text-xs text-violet-700/70">
                Accès complet à l&apos;espace de gestion de votre auto-école.
              </p>
            </div>
            <ul className="space-y-3 px-6 py-5">
              {BENEFITS.map((text) => (
                <li key={text} className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-violet-100">
                    <i className="ti ti-check text-xs text-violet-600" aria-hidden="true" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
            <div className="space-y-2 px-6 pb-6">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-md transition-transform active:scale-[0.98]"
              >
                <i className="ti ti-brand-whatsapp text-xl" aria-hidden="true" />
                Contacter l&apos;équipe · {WHATSAPP_DISPLAY}
              </a>
              <button
                onClick={iPaid}
                disabled={!product || submitting}
                className="btn-primary w-full disabled:opacity-60"
              >
                {submitting ? 'Enregistrement…' : "J'ai payé"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-violet-200 bg-surface-1 p-6 shadow-card">
            <i className="ti ti-clock text-3xl text-violet-500" aria-hidden="true" />
            <p className="mt-2 font-display text-base font-bold text-foreground">
              Activation en cours
            </p>
            <p className="mt-1 text-sm text-secondary">
              Notre équipe vérifie votre paiement et active votre abonnement (généralement en moins
              d&apos;une heure).
            </p>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="btn-ghost mt-4 w-full disabled:opacity-60"
            >
              {refreshing ? 'Vérification…' : 'Vérifier maintenant'}
            </button>
          </div>
        )}
      </div>
    </SchoolShell>
  );
}
