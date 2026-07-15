'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Skeleton } from '@permis2.0/ui';
import { adminFetch, useAdminGuard, AccessDenied, fmtXof } from './adminShared';

interface AdminStats {
  usersCount: number;
  categoriesCount: number;
  lessonsCount: number;
  questionsCount: number;
  purchasesCount: number;
  examsCount: number;
}

interface Revenue {
  revenue: {
    totalXof: number;
    salesCount: number;
    activeSubscriptions: number;
    byProduct: { sku: string; title: string; count: number; totalXof: number }[];
    byMonth: { month: string; totalXof: number }[];
  };
  costs: {
    sms: { sent: number; simulated: number; unitXof: number; totalXof: number };
    email: { sent: number; totalXof: number; note: string };
    other: { totalXof: number };
  };
  net: { totalXof: number };
}

const SECTIONS = [
  {
    href: '/admin/users',
    label: 'Utilisateurs',
    desc: 'Bloquer, rôles, abonnements',
    icon: 'ti-users',
    color: '#2563EB',
  },
  {
    href: '/admin/questions',
    label: 'Questions (quiz)',
    desc: 'Créer, modifier, supprimer',
    icon: 'ti-help-circle',
    color: '#7C3AED',
  },
  {
    href: '/admin/series',
    label: 'Séries (examens)',
    desc: 'Gérer les séries d’entraînement',
    icon: 'ti-clipboard-check',
    color: '#F97316',
  },
  {
    href: '/admin/cours',
    label: 'Cours (leçons)',
    desc: 'Rédiger et organiser les leçons',
    icon: 'ti-book',
    color: '#0EA5E9',
  },
];

const MONTH_LABELS = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];
const fmtMonth = (ym: string) => {
  const [y, m] = ym.split('-');
  return `${MONTH_LABELS[parseInt(m, 10) - 1]} ${y.slice(2)}`;
};

export default function AdminPage() {
  const allowed = useAdminGuard();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [rev, setRev] = useState<Revenue | null>(null);

  useEffect(() => {
    if (!allowed) return;
    adminFetch<{ data: AdminStats }>('/admin/stats')
      .then((d) => setStats(d.data))
      .catch(() => {});
    adminFetch<Revenue>('/admin/revenue')
      .then(setRev)
      .catch(() => {});
  }, [allowed]);

  const statCards = [
    {
      label: 'Utilisateurs',
      value: stats?.usersCount,
      icon: 'ti-users',
      color: 'text-primary-600',
    },
    {
      label: 'Ventes payées',
      value: stats?.purchasesCount,
      icon: 'ti-shopping-cart',
      color: 'text-success-600',
    },
    {
      label: 'Examens passés',
      value: stats?.examsCount,
      icon: 'ti-clipboard-check',
      color: 'text-orange-500',
    },
    {
      label: 'Questions',
      value: stats?.questionsCount,
      icon: 'ti-help-circle',
      color: 'text-violet-600',
    },
    { label: 'Leçons', value: stats?.lessonsCount, icon: 'ti-book', color: 'text-sky-600' },
    {
      label: 'Catégories',
      value: stats?.categoriesCount,
      icon: 'ti-category',
      color: 'text-slate-500',
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Administration"
        subtitle="Tableau de bord PERMIS 2.0"
        accent="violet"
        back="/profil"
        compact
      />

      <div className="px-4 pb-8 pt-5">
        {allowed === null && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        )}
        {allowed === false && <AccessDenied />}

        {allowed && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2.5">
              {statCards.map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-2xl border border-token bg-surface-1 p-3 text-center shadow-soft"
                >
                  <i className={`ti ${c.icon} text-lg ${c.color}`} aria-hidden="true" />
                  <p className="mt-1 font-display text-lg font-black text-foreground">
                    {c.value ?? '—'}
                  </p>
                  <p className="text-[10px] font-medium leading-tight text-muted">{c.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Sections */}
            <p className="mb-3 mt-6 font-display text-base font-bold text-foreground">Gestion</p>
            <div className="space-y-2.5">
              {SECTIONS.map((s, i) => (
                <motion.div
                  key={s.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  <Link
                    href={s.href}
                    className="flex w-full items-center gap-4 rounded-2xl border border-token bg-surface-1 px-4 py-3.5 shadow-soft transition-transform active:scale-[0.98]"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: s.color + '18' }}
                    >
                      <i
                        className={`ti ${s.icon} text-xl`}
                        style={{ color: s.color }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-sm font-bold text-foreground">{s.label}</p>
                      <p className="text-xs text-secondary">{s.desc}</p>
                    </div>
                    <i className="ti ti-chevron-right text-lg text-slate-300" aria-hidden="true" />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Recettes */}
            <p className="mb-3 mt-6 font-display text-base font-bold text-foreground">Recettes</p>
            {!rev ? (
              <Skeleton className="h-40 w-full rounded-2xl" />
            ) : (
              <div className="space-y-3">
                {/* Net + gross */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl bg-gradient-to-br from-success-500 to-success-700 p-4 text-white shadow-card">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-white/80">
                      Revenus (brut)
                    </p>
                    <p className="mt-1 font-display text-xl font-black">
                      {fmtXof(rev.revenue.totalXof)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/85">
                      {rev.revenue.salesCount} vente{rev.revenue.salesCount > 1 ? 's' : ''} ·{' '}
                      {rev.revenue.activeSubscriptions} abo actif
                      {rev.revenue.activeSubscriptions > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-token bg-surface-1 p-4 shadow-soft">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Net estimé
                    </p>
                    <p className="mt-1 font-display text-xl font-black text-foreground">
                      {fmtXof(rev.net.totalXof)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-secondary">après coûts SMS</p>
                  </div>
                </div>

                {/* By product */}
                {rev.revenue.byProduct.length > 0 && (
                  <div className="rounded-2xl border border-token bg-surface-1 p-4 shadow-soft">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                      Par produit
                    </p>
                    {rev.revenue.byProduct.map((p) => (
                      <div
                        key={p.sku}
                        className="flex items-center justify-between border-b border-token py-2 text-sm last:border-0"
                      >
                        <span className="min-w-0 truncate font-medium text-foreground">
                          {p.title} <span className="text-xs text-muted">× {p.count}</span>
                        </span>
                        <span className="shrink-0 font-bold text-success-600">
                          {fmtXof(p.totalXof)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* By month */}
                {rev.revenue.byMonth.length > 0 && (
                  <div className="rounded-2xl border border-token bg-surface-1 p-4 shadow-soft">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                      Par mois
                    </p>
                    {rev.revenue.byMonth.map((m) => (
                      <div
                        key={m.month}
                        className="flex items-center justify-between border-b border-token py-2 text-sm last:border-0"
                      >
                        <span className="font-medium text-foreground">{fmtMonth(m.month)}</span>
                        <span className="font-bold text-foreground">{fmtXof(m.totalXof)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Costs */}
                <div className="rounded-2xl border border-token bg-surface-1 p-4 shadow-soft">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Coûts</p>
                  <div className="flex items-center justify-between border-b border-token py-2 text-sm">
                    <span className="text-foreground">
                      <i className="ti ti-message mr-1.5 text-secondary" aria-hidden="true" />
                      SMS / WhatsApp ({rev.costs.sms.sent} envoyés
                      {rev.costs.sms.simulated > 0 ? ` · ${rev.costs.sms.simulated} simulés` : ''})
                    </span>
                    <span className="font-bold text-red-500">
                      −{fmtXof(rev.costs.sms.totalXof)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-token py-2 text-sm">
                    <span className="text-foreground">
                      <i className="ti ti-mail mr-1.5 text-secondary" aria-hidden="true" />
                      E-mails <span className="text-xs text-muted">({rev.costs.email.note})</span>
                    </span>
                    <span className="font-bold text-secondary">
                      {fmtXof(rev.costs.email.totalXof)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 text-sm">
                    <span className="text-foreground">
                      <i className="ti ti-dots mr-1.5 text-secondary" aria-hidden="true" />
                      Autres
                    </span>
                    <span className="font-bold text-secondary">
                      {fmtXof(rev.costs.other.totalXof)}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] text-muted">
                    Coût SMS estimé à {rev.costs.sms.unitXof} F/message (variable{' '}
                    <code className="font-mono">SMS_COST_XOF</code>).
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
