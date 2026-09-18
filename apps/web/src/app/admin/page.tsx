'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Skeleton } from '@permis2.0/ui';
import { adminFetch, fmtXof, ADMIN_SECTIONS, AdminPageHeader } from './adminShared';

interface AdminStats {
  usersCount: number;
  categoriesCount: number;
  lessonsCount: number;
  questionsCount: number;
  purchasesCount: number;
  examsCount: number;
  seriesCount: number;
  trafficSignsCount: number;
  schoolsCount: number;
  schoolsByStatus: { PENDING: number; ACTIVE: number; SUSPENDED: number };
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

/** Design-system color tokens (globals.css) — theme-aware via CSS custom properties,
 * so charts stay correct whether the admin is viewing in light or dark mode. */
const PALETTE = [
  'var(--color-primary)',
  'var(--color-violet)',
  'var(--color-orange)',
  'var(--color-success)',
  'var(--color-danger)',
];

function KpiCard({
  icon,
  color,
  label,
  value,
  sublabel,
  delay,
}: {
  icon: string;
  color: string;
  label: string;
  value: number | string | undefined;
  sublabel?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-token bg-surface-1 p-4 shadow-soft transition-shadow hover:shadow-card"
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: color + '18' }}
      >
        <i className={`ti ${icon} text-lg`} style={{ color }} aria-hidden="true" />
      </span>
      <p className="mt-2.5 font-display text-2xl font-black leading-none text-foreground">
        {value ?? '—'}
      </p>
      <p className="mt-1 text-xs font-medium leading-tight text-muted">{label}</p>
      {sublabel && <p className="mt-0.5 text-[11px] leading-tight text-secondary">{sublabel}</p>}
    </motion.div>
  );
}

/** Compact single-row stacked bar — proportional segments, no chart library needed
 * for 3 data points. Mirrors the chip color convention used on /admin/schools. */
function StatusBar({
  counts,
}: {
  counts: { label: string; value: number; className: string; chipClass: string }[];
}) {
  const total = counts.reduce((s, c) => s + c.value, 0) || 1;
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        {counts.map((c) => (
          <div
            key={c.label}
            className={c.className}
            style={{ width: `${(c.value / total) * 100}%` }}
            title={`${c.label} : ${c.value}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {counts.map((c) => (
          <span key={c.label} className={`chip ${c.chipClass ?? ''}`}>
            {c.label} · {c.value}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [rev, setRev] = useState<Revenue | null>(null);

  useEffect(() => {
    adminFetch<{ data: AdminStats }>('/admin/stats')
      .then((d) => setStats(d.data))
      .catch(() => {});
    adminFetch<Revenue>('/admin/revenue')
      .then(setRev)
      .catch(() => {});
  }, []);

  const monthChartData = (rev?.revenue.byMonth ?? []).map((m) => ({
    month: fmtMonth(m.month),
    totalXof: m.totalXof,
  }));
  const productChartData = (rev?.revenue.byProduct ?? []).map((p) => ({
    name: p.title,
    value: p.totalXof,
  }));

  const schoolCounts = stats
    ? [
        { label: 'Actives', value: stats.schoolsByStatus.ACTIVE, className: 'bg-success-500', chipClass: 'chip-success' },
        { label: 'En attente', value: stats.schoolsByStatus.PENDING, className: 'bg-orange-500', chipClass: 'chip-orange' },
        { label: 'Suspendues', value: stats.schoolsByStatus.SUSPENDED, className: 'bg-danger', chipClass: 'chip-danger' },
      ]
    : [];

  return (
    <>
      <AdminPageHeader title="Tableau de bord" subtitle="Vue d'ensemble de PERMIS 2.0" />

      {/* ── Chiffres clés ── */}
      <p className="mb-3 font-display text-base font-bold text-foreground">Chiffres clés</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard icon="ti-users" color="#003EA8" label="Utilisateurs" value={stats?.usersCount} delay={0} />
        <KpiCard
          icon="ti-school"
          color="#0D9488"
          label="Auto-écoles"
          value={stats?.schoolsCount}
          sublabel={stats ? `${stats.schoolsByStatus.ACTIVE} active${stats.schoolsByStatus.ACTIVE > 1 ? 's' : ''}` : undefined}
          delay={0.04}
        />
        <KpiCard
          icon="ti-cash"
          color="#16A34A"
          label="Chiffre d'affaires"
          value={rev ? fmtXof(rev.revenue.totalXof) : undefined}
          sublabel={rev ? `${rev.revenue.salesCount} vente${rev.revenue.salesCount > 1 ? 's' : ''}` : undefined}
          delay={0.08}
        />
        <KpiCard
          icon="ti-crown"
          color="#7C3AED"
          label="Abonnements actifs"
          value={rev?.revenue.activeSubscriptions}
          delay={0.12}
        />
        <KpiCard
          icon="ti-shopping-cart"
          color="#FF620E"
          label="Ventes payées"
          value={stats?.purchasesCount}
          delay={0.16}
        />
        <KpiCard
          icon="ti-clipboard-check"
          color="#EF4444"
          label="Examens passés"
          value={stats?.examsCount}
          delay={0.2}
        />
      </div>

      {/* ── Recettes ── */}
      <p className="mb-3 mt-9 font-display text-base font-bold text-foreground">Recettes</p>
      {!rev ? (
        <Skeleton className="h-80 w-full rounded-2xl" />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-gradient-to-br from-success-500 to-success-700 p-5 text-white shadow-card">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/80">
                <i className="ti ti-cash" aria-hidden="true" />
                CA brut
              </p>
              <p className="mt-1 font-display text-2xl font-black">{fmtXof(rev.revenue.totalXof)}</p>
              <p className="mt-0.5 text-xs text-white/85">
                {rev.revenue.salesCount} vente{rev.revenue.salesCount > 1 ? 's' : ''} ·{' '}
                {rev.revenue.activeSubscriptions} abo actif
                {rev.revenue.activeSubscriptions > 1 ? 's' : ''}
              </p>
            </div>
            <div className="rounded-2xl border border-token bg-surface-1 p-5 shadow-soft">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                <i className="ti ti-trending-up" aria-hidden="true" />
                Net estimé
              </p>
              <p className="mt-1 font-display text-2xl font-black text-foreground">
                {fmtXof(rev.net.totalXof)}
              </p>
              <p className="mt-0.5 text-xs text-secondary">après coûts SMS</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Revenue by month — bar chart */}
            <div className="rounded-2xl border border-token bg-surface-1 p-5 shadow-soft">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
                <i className="ti ti-chart-bar" aria-hidden="true" />
                Recettes par mois
              </p>
              {monthChartData.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">Pas encore de vente.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border, #e2e8f0)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: 'var(--color-muted, #94a3b8)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-muted, #94a3b8)' }}
                      axisLine={false}
                      tickLine={false}
                      width={56}
                      tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                    />
                    <Tooltip
                      formatter={(value) => fmtXof(Number(value))}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid var(--color-border, #e2e8f0)',
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="totalXof" name="Recettes" fill="var(--color-success)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Revenue by product — donut chart */}
            <div className="rounded-2xl border border-token bg-surface-1 p-5 shadow-soft">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
                <i className="ti ti-chart-donut" aria-hidden="true" />
                Recettes par produit
              </p>
              {productChartData.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">Pas encore de vente.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={productChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {productChartData.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => fmtXof(Number(value))}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid var(--color-border, #e2e8f0)',
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ fontSize: 11 }}
                      iconType="circle"
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Costs */}
          <div className="rounded-2xl border border-token bg-surface-1 p-5 shadow-soft">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
              <i className="ti ti-receipt-2" aria-hidden="true" />
              Coûts
            </p>
            <div className="flex items-center justify-between border-b border-token py-2 text-sm">
              <span className="text-foreground">
                <i className="ti ti-message mr-1.5 text-secondary" aria-hidden="true" />
                SMS / WhatsApp ({rev.costs.sms.sent} envoyés
                {rev.costs.sms.simulated > 0 ? ` · ${rev.costs.sms.simulated} simulés` : ''})
              </span>
              <span className="font-bold text-danger">−{fmtXof(rev.costs.sms.totalXof)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-token py-2 text-sm">
              <span className="text-foreground">
                <i className="ti ti-mail mr-1.5 text-secondary" aria-hidden="true" />
                E-mails <span className="text-xs text-muted">({rev.costs.email.note})</span>
              </span>
              <span className="font-bold text-secondary">{fmtXof(rev.costs.email.totalXof)}</span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-foreground">
                <i className="ti ti-dots mr-1.5 text-secondary" aria-hidden="true" />
                Autres
              </span>
              <span className="font-bold text-secondary">{fmtXof(rev.costs.other.totalXof)}</span>
            </div>
            <p className="mt-2 text-[10px] text-muted">
              Coût SMS estimé à {rev.costs.sms.unitXof} F/message (variable{' '}
              <code className="font-mono">SMS_COST_XOF</code>).
            </p>
          </div>
        </div>
      )}

      {/* ── Auto-écoles ── */}
      <p className="mb-3 mt-9 font-display text-base font-bold text-foreground">Auto-écoles</p>
      <div className="rounded-2xl border border-token bg-surface-1 p-5 shadow-soft">
        {!stats ? (
          <Skeleton className="h-10 w-full rounded-xl" />
        ) : stats.schoolsCount === 0 ? (
          <p className="py-4 text-center text-sm text-muted">Aucune auto-école pour le moment.</p>
        ) : (
          <StatusBar counts={schoolCounts} />
        )}
      </div>

      {/* ── Contenu / ressources ── */}
      <p className="mb-3 mt-9 font-display text-base font-bold text-foreground">Contenu &amp; ressources</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <KpiCard icon="ti-book" color="#0284C7" label="Leçons" value={stats?.lessonsCount} delay={0} />
        <KpiCard icon="ti-help-circle" color="#7C3AED" label="Questions" value={stats?.questionsCount} delay={0.04} />
        <KpiCard icon="ti-list-details" color="#FF620E" label="Séries" value={stats?.seriesCount} delay={0.08} />
        <KpiCard icon="ti-road-sign" color="#EF4444" label="Panneaux" value={stats?.trafficSignsCount} delay={0.12} />
        <KpiCard icon="ti-category" color="#64748B" label="Catégories" value={stats?.categoriesCount} delay={0.16} />
      </div>

      {/* ── Gestion ── */}
      <p className="mb-3 mt-9 font-display text-base font-bold text-foreground">Gestion</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ADMIN_SECTIONS.map((s, i) => (
          <motion.div
            key={s.href}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <Link
              href={s.href}
              className="group flex h-full flex-col gap-3 rounded-2xl border border-token bg-surface-1 p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card-lg"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: s.color + '18' }}
              >
                <i className={`ti ${s.icon} text-xl`} style={{ color: s.color }} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold text-foreground">{s.label}</p>
                <p className="mt-0.5 text-xs text-secondary">{s.desc}</p>
              </div>
              <i
                className="ti ti-arrow-right text-base text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-violet-500"
                aria-hidden="true"
              />
            </Link>
          </motion.div>
        ))}
      </div>
    </>
  );
}
