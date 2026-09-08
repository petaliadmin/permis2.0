'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EmptyState, Skeleton, Stat } from '@permis2.0/ui';
import { AppShell } from '@/components/AppShell';
import { useAuthStore } from '@/store/authStore';
import { usePurchasesStore } from '@/store/purchasesStore';
import { whatsappLink, WHATSAPP_DISPLAY } from '@/lib/contact';
import { markOnboardingDone } from '@/lib/onboarding';

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;
const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

/** Landing shown to guests — same visual language as pack-ecole's violet header. */
function GuestLanding({ onRegister }: { onRegister: () => void }) {
  const router = useRouter();
  return (
    <AppShell>
      <header className="relative overflow-hidden rounded-b-[28px] bg-gradient-to-br from-violet-600 to-violet-700 px-5 pt-[calc(env(safe-area-inset-top)+18px)] pb-8 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Espace auto-école</h1>
            <p className="mt-1 text-sm text-white/85">
              Offrez l&apos;accès premium à vos élèves, suivez leurs places depuis un dashboard.
            </p>
          </div>
          <span className="text-4xl" aria-hidden="true">
            🏫
          </span>
        </div>
      </header>

      <div className="px-5 pt-6 pb-10">
        <div className="rounded-3xl border border-token bg-surface-1 p-6 shadow-card">
          <ul className="space-y-3">
            {[
              'Achetez un pack de places premium (10, 20 ou 50 élèves).',
              'Distribuez un code unique à chaque élève.',
              'Suivez en direct qui a activé son accès.',
            ].map((text) => (
              <li key={text} className="flex items-start gap-3 text-sm text-foreground">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30">
                  <i className="ti ti-check text-sm" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>

          <button onClick={onRegister} className="btn-primary mt-6 w-full">
            Créer mon compte auto-école
          </button>
          <button
            onClick={() => router.push('/auth/login?redirect=/auto-ecole')}
            className="btn-ghost mt-2 w-full"
          >
            J&apos;ai déjà un compte
          </button>
          <button
            onClick={() => router.push('/mon-ecole')}
            className="mt-3 w-full text-center text-xs font-bold text-violet-600 hover:underline"
          >
            Nouveau : gérer mon auto-école (élèves, staff…) →
          </button>
        </div>
      </div>
    </AppShell>
  );
}

/** Authenticated but no PAID school_pack purchase yet — offer + WhatsApp CTA. */
function EmptyDashboard() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const products = usePurchasesStore((s) => s.products);
  const schoolProducts = products
    .filter((p) => p.kind === 'school_pack')
    .sort((a, b) => a.ordre - b.ordre);

  const waLink = whatsappLink(
    `Bonjour PERMIS 2.0 ! 👋\nJe suis une auto-école et je souhaite acheter un pack de places premium pour mes élèves.\nMon compte : ${authUser?.name ?? ''}${authUser?.phone ? ` — +221 ${authUser.phone}` : ''}`
  );

  return (
    <AppShell>
      <header className="relative overflow-hidden rounded-b-[28px] bg-gradient-to-br from-violet-600 to-violet-700 px-5 pt-[calc(env(safe-area-inset-top)+18px)] pb-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <button
          onClick={() => router.back()}
          className="relative mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15"
          aria-label="Retour"
        >
          <i className="ti ti-chevron-left text-lg" aria-hidden="true" />
        </button>
        <h1 className="relative font-display text-2xl font-extrabold">Espace auto-école</h1>
        <p className="relative mt-1 text-sm text-white/85">
          Aucun pack actif pour l&apos;instant.
        </p>
      </header>

      <div className="px-5 pt-6 pb-10">
        <EmptyState
          icon={<span aria-hidden="true">🏫</span>}
          title="Pas encore de pack élève"
          description="Achetez un pack pour commencer à distribuer des codes premium à vos élèves."
        />

        {schoolProducts.length > 0 && (
          <div className="mt-2 space-y-3">
            {schoolProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-2xl border border-token bg-surface-1 p-4 shadow-soft"
              >
                <div>
                  <p className="font-bold text-foreground">{p.title}</p>
                  <p className="text-xs text-secondary">{p.seats ?? '—'} places</p>
                </div>
                <p className="font-display text-lg font-extrabold text-violet-600">
                  {fmtXof(p.priceXof)}
                </p>
              </div>
            ))}
          </div>
        )}

        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-md transition-transform active:scale-[0.98]"
        >
          <i className="ti ti-brand-whatsapp text-xl" aria-hidden="true" />
          Commander un pack · {WHATSAPP_DISPLAY}
        </a>
      </div>
    </AppShell>
  );
}

/** Real dashboard — own full-width responsive shell, not AppShell's max-w-md. */
function Dashboard() {
  const schoolPacks = usePurchasesStore((s) => s.schoolPacks);
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(schoolPacks[0]?.id ?? null);

  const totalSeats = schoolPacks.reduce((sum, p) => sum + p.seats.length, 0);
  const totalClaimed = schoolPacks.reduce((sum, p) => sum + p.claimedCount, 0);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard unavailable — the code is still visible to copy by hand */
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-token bg-surface-1/90 px-4 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-sm font-black text-white">
            🏫
          </span>
          <p className="font-display text-sm font-extrabold text-foreground sm:text-base">
            Espace auto-école
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full border border-token bg-surface-2 px-3.5 py-1.5 text-xs font-bold text-secondary transition-colors hover:border-violet-300 hover:text-violet-600"
        >
          <i className="ti ti-external-link text-sm" aria-hidden="true" />
          <span className="hidden sm:inline">Voir le site</span>
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            icon={<i className="ti ti-package" aria-hidden="true" />}
            label="Packs actifs"
            value={schoolPacks.length}
            accent="bg-violet-100 text-violet-700"
          />
          <Stat
            icon={<i className="ti ti-users" aria-hidden="true" />}
            label="Places totales"
            value={totalSeats}
            accent="bg-primary-100 text-primary-700"
          />
          <Stat
            icon={<i className="ti ti-check" aria-hidden="true" />}
            label="Réclamées"
            value={totalClaimed}
            accent="bg-success-100 text-success-700"
          />
          <Stat
            icon={<i className="ti ti-clock" aria-hidden="true" />}
            label="Disponibles"
            value={totalSeats - totalClaimed}
            accent="bg-orange-100 text-orange-700"
          />
        </div>

        <div className="mt-8 space-y-4">
          {schoolPacks.map((pack) => {
            const isOpen = expanded === pack.id;
            const total = pack.seats.length;
            return (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-2xl border border-token bg-surface-1 shadow-soft"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : pack.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4 text-left hover:bg-surface-2/50 sm:px-6"
                >
                  <div>
                    <p className="font-display text-base font-bold text-foreground">
                      {pack.product.title}
                    </p>
                    <p className="text-xs text-secondary">Acheté le {fmtDate(pack.createdAt)}</p>
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {pack.claimedCount}/{total} places réclamées
                  </div>
                  <i
                    className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'} text-lg text-slate-400`}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-token bg-surface-2/40 px-4 py-4 sm:px-6">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {pack.seats.map((s) => (
                        <div
                          key={s.id}
                          className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm ${
                            s.claimedAt
                              ? 'border-token bg-surface-1 text-muted'
                              : 'border-violet-200 bg-white dark:border-violet-900/40 dark:bg-surface-1'
                          }`}
                        >
                          <span className="font-mono font-bold tracking-wide">{s.code}</span>
                          {s.claimedAt ? (
                            <span className="text-xs text-secondary" title={s.claimedBy?.name}>
                              ✓ {s.claimedBy?.name ?? 'réclamé'}
                            </span>
                          ) : (
                            <button
                              onClick={() => copyCode(s.code)}
                              className="text-xs font-bold text-violet-600 hover:underline"
                            >
                              {copied === s.code ? 'Copié !' : 'Copier'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function AutoEcoleClient() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchProducts = usePurchasesStore((s) => s.fetchProducts);
  const fetchMySchoolPacks = usePurchasesStore((s) => s.fetchMySchoolPacks);
  const schoolPacks = usePurchasesStore((s) => s.schoolPacks);
  const schoolPacksReady = usePurchasesStore((s) => s.schoolPacksReady);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchProducts();
    fetchMySchoolPacks();
  }, [isAuthenticated, fetchProducts, fetchMySchoolPacks]);

  const goRegister = () => {
    markOnboardingDone('AUTO_ECOLE');
    router.push('/auth/register');
  };

  if (!isAuthenticated) {
    return <GuestLanding onRegister={goRegister} />;
  }

  if (!schoolPacksReady) {
    return (
      <AppShell>
        <div className="px-5 pt-6">
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      </AppShell>
    );
  }

  if (schoolPacks.length === 0) {
    return <EmptyDashboard />;
  }

  return <Dashboard />;
}
