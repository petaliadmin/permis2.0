'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  School,
  SchoolEnrollmentRequest,
  SchoolMembership,
  SchoolPayment,
  SchoolStudent,
  Session,
  Vehicle,
} from '@permis2.0/types';
import { SchoolEnrollmentStatus, SchoolPaymentStatus, SchoolStatus } from '@permis2.0/types';
import { Sheet } from '@permis2.0/ui';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import { usePurchasesStore } from '@/store/purchasesStore';
import { whatsappLink, WHATSAPP_DISPLAY } from '@/lib/contact';
import { SideMenuProvider, MenuButton } from '@/components/SideMenu';
import { EnrollmentRequestsPanel } from './EnrollmentRequestsPanel';
import { TeamPanel } from './TeamPanel';
import { StudentsPanel, type StudentsPanelHandle } from './StudentsPanel';
import { VehiclesPanel, type VehiclesPanelHandle } from './VehiclesPanel';
import { SessionsPanel, type SessionsPanelHandle } from './SessionsPanel';
import { PaymentsPanel, type PaymentsPanelHandle } from './PaymentsPanel';
import { SchoolSettingsSheet } from './SchoolSettingsSheet';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Single canonical tab list — icon included so it can drive both the mobile
 * bottom-bar/"Plus"-sheet split (only 5 slots fit a `grid-cols-5` bottom bar)
 * and the `lg:` sidebar (no slot limit, renders all 7 flat).
 */
const TABS: { key: string; label: string; icon: string }[] = [
  { key: 'overview', label: "Vue d'ensemble", icon: 'ti-home' },
  { key: 'demandes', label: 'Demandes', icon: 'ti-inbox' },
  { key: 'eleves', label: 'Élèves', icon: 'ti-users' },
  { key: 'equipe', label: 'Équipe', icon: 'ti-users-group' },
  { key: 'vehicules', label: 'Véhicules', icon: 'ti-car' },
  { key: 'planning', label: 'Planning', icon: 'ti-calendar' },
  { key: 'finances', label: 'Finances', icon: 'ti-receipt' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

/** The 4 primary destinations shown in the mobile bottom bar — the rest live behind "Plus". */
const BOTTOM_KEYS: TabKey[] = ['overview', 'demandes', 'eleves', 'planning'];
const BOTTOM_TABS = TABS.filter((t) => BOTTOM_KEYS.includes(t.key));
const MORE_TABS = TABS.filter((t) => !BOTTOM_KEYS.includes(t.key));

const PENDING_STATUSES: string[] = [SchoolEnrollmentStatus.SENT, SchoolEnrollmentStatus.IN_PROGRESS];
const PENDING_PAYMENT_STATUSES: string[] = [SchoolPaymentStatus.PENDING, SchoolPaymentStatus.OVERDUE];
const SESSION_TYPE_LABEL: Record<string, string> = { THEORY: 'Théorie', PRACTICE: 'Pratique' };
const SESSION_STATUS_DOT: Record<string, string> = {
  SCHEDULED: 'bg-primary-500',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-slate-300',
  NO_SHOW: 'bg-orange-500',
};

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;
const fmtTime = (d: string | Date) =>
  new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const isToday = (d: string | Date) => {
  const a = new Date(d);
  const b = new Date();
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};
const personName = (p?: { user?: { name?: string | null } | null; guestName?: string | null } | null) =>
  p?.user?.name ?? p?.guestName ?? 'Élève';

/** Compact, tappable stat card for the overview grid — jumps to the related tab. */
function OverviewTile({
  icon,
  label,
  sublabel,
  value,
  accent,
  highlight,
  badge,
  onClick,
}: {
  icon: string;
  label: string;
  /** Small secondary line under the label, e.g. an amount — omitted when not meaningful (0). */
  sublabel?: string;
  value: number;
  accent: string;
  /** Draws a colored ring when the count needs action (e.g. pending requests). */
  highlight?: boolean;
  /** Small attention dot in the corner (e.g. a vehicle document expiring soon). */
  badge?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start gap-2 rounded-2xl border bg-surface-1 p-3.5 text-left shadow-soft transition-transform active:scale-[0.97]',
        highlight ? 'border-orange-200' : 'border-token'
      )}
    >
      {badge && (
        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-danger" aria-hidden="true" />
      )}
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl text-base', accent)}>
        <i className={`ti ${icon}`} aria-hidden="true" />
      </span>
      <span className="font-display text-xl font-extrabold leading-none text-foreground">{value}</span>
      <span className="text-xs font-semibold leading-snug text-secondary">{label}</span>
      {sublabel && <span className="text-[11px] font-medium leading-snug text-muted">{sublabel}</span>}
    </button>
  );
}

const fmtDateShort = (d: string | Date) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

/** Top 20 visibility boost — a separate weekly add-on, purchasable once the
 * school's own subscription is active (this card only renders inside the
 * gated dashboard). Same manual/WhatsApp purchase pattern as the paywall. */
function VisibilityCard({
  school,
  onSchoolUpdated,
}: {
  school: School;
  onSchoolUpdated: () => void;
}) {
  const authUser = useAuthStore((s) => s.user);
  const products = usePurchasesStore((s) => s.products);
  const fetchProducts = usePurchasesStore((s) => s.fetchProducts);
  const requestManual = usePurchasesStore((s) => s.requestManual);
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<'pay' | 'requested'>('pay');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const product = products.find((p) => p.sku === 'top20_semaine');
  const price = product?.priceXof ?? 5000;
  const featuredUntil = school.featuredUntil ? new Date(school.featuredUntil) : null;
  const isFeatured = !!featuredUntil && featuredUntil > new Date();

  const waLink = whatsappLink(
    `Bonjour PERMIS 2.0 ! 👋\nJe souhaite ${isFeatured ? 'prolonger' : 'activer'} le forfait Top 20 (${fmtXof(price)}/semaine) pour mon auto-école « ${school.name} ».\nMon compte : ${authUser?.name ?? ''}${authUser?.phone ? ` — +221 ${authUser.phone}` : ''}`
  );

  const openSheet = () => {
    setStage('pay');
    setOpen(true);
  };

  const iPaid = async () => {
    if (!product) return;
    setSubmitting(true);
    await requestManual(product.id, school.id);
    setSubmitting(false);
    setStage('requested');
  };

  return (
    <>
      <div className="rounded-2xl border border-token bg-surface-1 p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-foreground">Visibilité — Top 20</p>
            <p className="mt-0.5 truncate text-xs text-secondary">
              {isFeatured
                ? `En vedette sur l'accueil jusqu'au ${fmtDateShort(featuredUntil!)}`
                : "Pas encore en vedette sur la page d'accueil."}
            </p>
          </div>
          <button onClick={openSheet} className="btn-ghost shrink-0 !px-3.5 !py-2 text-xs">
            {isFeatured ? 'Prolonger' : 'Booster'}
          </button>
        </div>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} ariaLabel="Forfait Top 20">
        {stage === 'pay' ? (
          <div>
            <p className="font-display text-lg font-bold text-foreground">Forfait Top 20 — 1 semaine</p>
            <p className="mt-1 text-sm text-secondary">
              Votre auto-école mise en avant dans le Top 20 affiché sur la page d&apos;accueil, pendant
              7 jours.
            </p>
            <p className="mt-4 font-display text-3xl font-black text-violet-600">{fmtXof(price)}</p>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-md transition-transform active:scale-[0.98]"
            >
              <i className="ti ti-brand-whatsapp text-xl" aria-hidden="true" />
              Contacter l&apos;équipe · {WHATSAPP_DISPLAY}
            </a>
            <button
              onClick={iPaid}
              disabled={!product || submitting}
              className="btn-primary mt-2 w-full disabled:opacity-60"
            >
              {submitting ? 'Enregistrement…' : "J'ai payé"}
            </button>
          </div>
        ) : (
          <div className="py-4 text-center">
            <i className="ti ti-clock text-3xl text-violet-500" aria-hidden="true" />
            <p className="mt-2 font-display text-base font-bold text-foreground">
              Activation en cours
            </p>
            <p className="mt-1 text-sm text-secondary">
              Notre équipe active votre visibilité sous peu.
            </p>
            <button
              onClick={() => {
                onSchoolUpdated();
                setOpen(false);
              }}
              className="btn-ghost mt-4 w-full"
            >
              Fermer
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
}

interface SchoolDashboardProps {
  school: School;
  onBackToPicker?: () => void;
  /** Refetches /schools/mine — call after anything that could change school-level data (e.g. studentsCount). */
  onSchoolUpdated: () => void;
}

export function SchoolDashboard({ school, onBackToPicker, onSchoolUpdated }: SchoolDashboardProps) {
  const [tab, setTab] = useState<TabKey>('overview');
  const [moreOpen, setMoreOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [requests, setRequests] = useState<SchoolEnrollmentRequest[] | null>(null);
  const [members, setMembers] = useState<SchoolMembership[] | null>(null);
  const [students, setStudents] = useState<SchoolStudent[] | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [payments, setPayments] = useState<SchoolPayment[] | null>(null);

  const studentsRef = useRef<StudentsPanelHandle>(null);
  const vehiclesRef = useRef<VehiclesPanelHandle>(null);
  const sessionsRef = useRef<SessionsPanelHandle>(null);
  const paymentsRef = useRef<PaymentsPanelHandle>(null);

  const fetchRequests = useCallback(async () => {
    const res = await fetch(`${API_URL}/schools/${school.id}/enrollment-requests`, {
      credentials: 'include',
    });
    setRequests(res.ok ? await res.json() : []);
  }, [school.id]);

  const fetchMembers = useCallback(async () => {
    const res = await fetch(`${API_URL}/schools/${school.id}/members`, { credentials: 'include' });
    setMembers(res.ok ? await res.json() : []);
  }, [school.id]);

  const fetchStudents = useCallback(async () => {
    const res = await fetch(`${API_URL}/schools/${school.id}/students`, { credentials: 'include' });
    setStudents(res.ok ? await res.json() : []);
  }, [school.id]);

  const fetchVehicles = useCallback(async () => {
    const res = await fetch(`${API_URL}/schools/${school.id}/vehicles`, { credentials: 'include' });
    setVehicles(res.ok ? await res.json() : []);
  }, [school.id]);

  const fetchSessions = useCallback(async () => {
    const res = await fetch(`${API_URL}/schools/${school.id}/sessions`, { credentials: 'include' });
    setSessions(res.ok ? await res.json() : []);
  }, [school.id]);

  const fetchPayments = useCallback(async () => {
    const res = await fetch(`${API_URL}/schools/${school.id}/payments`, { credentials: 'include' });
    setPayments(res.ok ? await res.json() : []);
  }, [school.id]);

  useEffect(() => {
    fetchRequests();
    fetchMembers();
    fetchStudents();
    fetchVehicles();
    fetchSessions();
    fetchPayments();
  }, [fetchRequests, fetchMembers, fetchStudents, fetchVehicles, fetchSessions, fetchPayments]);

  const pendingCount = requests?.filter((r) => PENDING_STATUSES.includes(r.status)).length ?? 0;
  const pendingPayments = payments?.filter((p) => PENDING_PAYMENT_STATUSES.includes(p.status)) ?? [];
  const pendingPaymentsCount = pendingPayments.length;
  const pendingPaymentsAmount = pendingPayments.reduce((sum, p) => sum + p.amountXof, 0);
  const vehiclesNeedingAttention =
    vehicles?.filter((v) => v.insuranceExpiringSoon || v.inspectionExpiringSoon).length ?? 0;
  const todaysSessions = (sessions ?? [])
    .filter((s) => s.status !== 'CANCELLED' && isToday(s.startsAt))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const moreActive = MORE_TABS.some((t) => t.key === tab);

  /** Numeric badge shown on a nav item (bottom bar or sidebar) — count-based, only when > 0. */
  const tabBadge = (key: TabKey): number =>
    key === 'demandes' ? pendingCount : key === 'finances' ? pendingPaymentsCount : 0;

  const fab: { label: string; icon: string; onClick: () => void } | null =
    tab === 'eleves'
      ? { label: 'Ajouter un élève', icon: 'ti-user-plus', onClick: () => studentsRef.current?.openCreate() }
      : tab === 'vehicules'
        ? { label: 'Ajouter un véhicule', icon: 'ti-car', onClick: () => vehiclesRef.current?.openCreate() }
        : tab === 'planning'
          ? { label: 'Ajouter une séance', icon: 'ti-calendar-plus', onClick: () => sessionsRef.current?.openCreate() }
          : tab === 'finances'
            ? { label: 'Créer une facture', icon: 'ti-receipt', onClick: () => paymentsRef.current?.openCreate() }
            : null;

  return (
    <SideMenuProvider>
    <div className="on-light min-h-screen bg-surface pb-32 lg:pb-0">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-token bg-surface-1/90 px-4 backdrop-blur-xl sm:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <MenuButton />
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-black text-white"
            aria-label="Modifier les informations de l'auto-école"
          >
            {school.logoUrl ? (
              <img src={school.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              '🏫'
            )}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="min-w-0 text-left"
          >
            <p className="truncate font-display text-sm font-extrabold text-foreground sm:text-base">
              {school.name}
            </p>
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-secondary transition-colors hover:bg-surface-3"
            aria-label="Paramètres de l'auto-école"
          >
            <i className="ti ti-settings text-lg" aria-hidden="true" />
          </button>
          {onBackToPicker && (
            <button
              onClick={onBackToPicker}
              className="hidden rounded-full border border-token bg-surface-2 px-3.5 py-1.5 text-xs font-bold text-secondary transition-colors hover:border-primary-300 hover:text-primary-600 sm:inline-flex"
            >
              Changer d&apos;auto-école
            </button>
          )}
        </div>
      </header>

      {school.status !== SchoolStatus.ACTIVE && (
        <div
          className={cn(
            'px-4 py-2.5 text-center text-sm font-semibold sm:px-8',
            school.status === SchoolStatus.PENDING
              ? 'bg-orange-50 text-orange-700'
              : 'bg-red-50 text-danger'
          )}
        >
          {school.status === SchoolStatus.PENDING
            ? "Votre fiche est en attente de validation — elle n'apparaît pas encore dans l'annuaire public."
            : 'Votre fiche est suspendue — contactez le support.'}
        </div>
      )}

      <div className="lg:mx-auto lg:flex lg:max-w-[1400px] lg:items-start">
        {/* ── Sidebar navigation — lg: and up, replaces the mobile bottom bar/FAB/"Plus" sheet ── */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col overflow-y-auto border-r border-token bg-surface-1 px-3 py-5 lg:flex">
          <nav className="flex flex-col gap-1" aria-label="Navigation de l'auto-école">
            {TABS.map((t) => {
              const active = tab === t.key;
              const badge = tabBadge(t.key);
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors',
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-secondary hover:bg-surface-2 hover:text-foreground'
                  )}
                >
                  <i className={`ti ${t.icon} text-lg`} aria-hidden="true" />
                  <span className="flex-1">{t.label}</span>
                  {t.key === 'vehicules' && vehiclesNeedingAttention > 0 && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-danger" aria-hidden="true" />
                  )}
                  {badge > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-1 pt-4">
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-secondary transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <i className="ti ti-building-store text-lg" aria-hidden="true" />
              <span className="flex-1">Infos de l&apos;auto-école</span>
            </button>
            {onBackToPicker && (
              <button
                onClick={onBackToPicker}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-secondary transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <i className="ti ti-replace text-lg" aria-hidden="true" />
                <span className="flex-1">Changer d&apos;auto-école</span>
              </button>
            )}
          </div>
        </aside>

      <main className="mx-auto max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:mx-0 lg:max-w-6xl lg:px-8">
        {tab === 'overview' && (
          <div className="space-y-3">
            {/* Needs attention — the two actionable counters, surfaced first */}
            <div className="grid grid-cols-2 gap-3">
              <OverviewTile
                icon="ti-inbox"
                label="Demandes en attente"
                value={pendingCount}
                accent="bg-orange-100 text-orange-700"
                highlight={pendingCount > 0}
                onClick={() => setTab('demandes')}
              />
              <OverviewTile
                icon="ti-receipt"
                label="Factures impayées"
                sublabel={pendingPaymentsAmount > 0 ? fmtXof(pendingPaymentsAmount) : undefined}
                value={pendingPaymentsCount}
                accent="bg-red-100 text-danger"
                highlight={pendingPaymentsCount > 0}
                onClick={() => setTab('finances')}
              />
            </div>

            {/* Fleet at a glance */}
            <div className="grid grid-cols-3 gap-3">
              <OverviewTile
                icon="ti-users"
                label="Élèves"
                value={school.studentsCount ?? 0}
                accent="bg-primary-100 text-primary-700"
                onClick={() => setTab('eleves')}
              />
              <OverviewTile
                icon="ti-users-group"
                label="Équipe"
                value={members?.length ?? 0}
                accent="bg-violet-100 text-violet-700"
                onClick={() => setTab('equipe')}
              />
              <OverviewTile
                icon="ti-car"
                label="Véhicules"
                value={vehicles?.length ?? 0}
                accent="bg-teal-100 text-teal-700"
                badge={vehiclesNeedingAttention > 0}
                onClick={() => setTab('vehicules')}
              />
            </div>

            {/* Today's schedule — the one thing an owner opening the app actually wants to see */}
            <div className="rounded-2xl border border-token bg-surface-1 p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-bold text-foreground">Aujourd&apos;hui</p>
                {todaysSessions.length > 0 && (
                  <button
                    onClick={() => setTab('planning')}
                    className="text-xs font-bold text-primary-600"
                  >
                    Voir tout
                  </button>
                )}
              </div>

              {todaysSessions.length === 0 ? (
                <p className="mt-2 text-sm text-secondary">Aucune séance programmée aujourd&apos;hui.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {todaysSessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setTab('planning')}
                      className="flex w-full items-center gap-3 rounded-xl bg-surface-2 p-2.5 text-left"
                    >
                      <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-surface-1 text-xs font-bold text-foreground">
                        {fmtTime(s.startsAt)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {personName(s.student)}
                        </p>
                        <p className="text-xs text-secondary">
                          {SESSION_TYPE_LABEL[s.type] ?? s.type}
                          {s.vehicle ? ` · ${s.vehicle.plate}` : ''}
                        </p>
                      </span>
                      <span
                        className={cn('h-2 w-2 shrink-0 rounded-full', SESSION_STATUS_DOT[s.status])}
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {school.subscriptionExpiresAt && (
              <p className="px-1 text-xs text-muted">
                {school.trialEndsAt &&
                new Date(school.subscriptionExpiresAt).getTime() ===
                  new Date(school.trialEndsAt).getTime()
                  ? <>Essai gratuit jusqu&apos;au {fmtDateShort(school.subscriptionExpiresAt)}</>
                  : <>Abonnement actif jusqu&apos;au {fmtDateShort(school.subscriptionExpiresAt)}</>}
              </p>
            )}
            <VisibilityCard school={school} onSchoolUpdated={onSchoolUpdated} />

            {vehiclesNeedingAttention > 0 && (
              <button
                onClick={() => setTab('vehicules')}
                className="flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-danger">
                  <i className="ti ti-alert-triangle" aria-hidden="true" />
                </span>
                <span className="flex-1 text-sm font-semibold text-danger">
                  {vehiclesNeedingAttention} véhicule{vehiclesNeedingAttention > 1 ? 's' : ''} à vérifier
                  — assurance ou visite technique bientôt expirée.
                </span>
                <i className="ti ti-chevron-right text-danger" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {tab === 'demandes' && (
          <EnrollmentRequestsPanel
            schoolId={school.id}
            requests={requests}
            onChanged={() => {
              fetchRequests();
              onSchoolUpdated();
            }}
          />
        )}

        {tab === 'eleves' && (
          <StudentsPanel
            ref={studentsRef}
            schoolId={school.id}
            students={students}
            members={members}
            vehicles={vehicles}
            onChanged={() => {
              fetchStudents();
              onSchoolUpdated();
            }}
          />
        )}

        {tab === 'equipe' && (
          <TeamPanel schoolId={school.id} members={members} onChanged={fetchMembers} />
        )}

        {tab === 'vehicules' && (
          <VehiclesPanel ref={vehiclesRef} schoolId={school.id} vehicles={vehicles} onChanged={fetchVehicles} />
        )}

        {tab === 'planning' && (
          <SessionsPanel
            ref={sessionsRef}
            schoolId={school.id}
            school={school}
            sessions={sessions}
            students={students}
            members={members}
            vehicles={vehicles}
            onChanged={fetchSessions}
          />
        )}

        {tab === 'finances' && (
          <PaymentsPanel
            ref={paymentsRef}
            schoolId={school.id}
            school={school}
            payments={payments}
            students={students}
            onChanged={fetchPayments}
          />
        )}
      </main>
      </div>

      {/* ── Floating action button — contextual to the active tab, mobile only
           (each panel's own toolbar already has an equivalent "Ajouter" button
           for the lg: sidebar layout) ── */}
      {fab && (
        <button
          onClick={fab.onClick}
          aria-label={fab.label}
          className="fixed bottom-[calc(84px+env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-card transition-transform active:scale-90 sm:right-8 lg:hidden"
        >
          <i className={`ti ${fab.icon} text-2xl`} aria-hidden="true" />
        </button>
      )}

      {/* ── Bottom navigation — mobile only, replaced by the sidebar at lg: ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-token bg-surface-1/95 shadow-nav backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Navigation de l'auto-école"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-5">
          {BOTTOM_TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-current={active ? 'page' : undefined}
                className="relative flex h-16 flex-col items-center justify-center gap-1"
              >
                {active && (
                  <span className="absolute top-0 h-1 w-9 rounded-full bg-primary-600" />
                )}
                <span className="relative">
                  <i
                    className={cn(
                      `ti ${t.icon} text-[22px] transition-colors`,
                      active ? 'text-primary-600' : 'text-secondary'
                    )}
                    aria-hidden="true"
                  />
                  {t.key === 'demandes' && pendingCount > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[9px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold tracking-wide transition-colors',
                    active ? 'text-primary-600' : 'text-secondary'
                  )}
                >
                  {t.label}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setMoreOpen(true)}
            aria-current={moreActive ? 'page' : undefined}
            className="relative flex h-16 flex-col items-center justify-center gap-1"
          >
            {moreActive && <span className="absolute top-0 h-1 w-9 rounded-full bg-primary-600" />}
            <i
              className={cn(
                'ti ti-dots-circle-horizontal text-[22px] transition-colors',
                moreActive ? 'text-primary-600' : 'text-secondary'
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                'text-[10px] font-bold tracking-wide transition-colors',
                moreActive ? 'text-primary-600' : 'text-secondary'
              )}
            >
              Plus
            </span>
          </button>
        </div>
      </nav>

      {/* ── "Plus" sheet — secondary sections + account switcher ── */}
      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} ariaLabel="Plus d'options">
        <p className="font-display text-lg font-bold text-foreground">Plus</p>
        <div className="mt-3 space-y-2">
          {MORE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setMoreOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl border border-token bg-surface-1 p-4 text-left shadow-soft transition-colors hover:border-primary-200',
                tab === t.key && 'border-primary-300 bg-primary-50'
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-primary-600">
                <i className={`ti ${t.icon} text-lg`} aria-hidden="true" />
              </span>
              <span className="flex-1 font-display text-sm font-bold text-foreground">{t.label}</span>
              {t.key === 'finances' && pendingPaymentsCount > 0 && (
                <span className="chip chip-danger">{pendingPaymentsCount}</span>
              )}
              <i className="ti ti-chevron-right text-secondary" aria-hidden="true" />
            </button>
          ))}

          <button
            onClick={() => {
              setSettingsOpen(true);
              setMoreOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-2xl border border-token bg-surface-1 p-4 text-left shadow-soft transition-colors hover:border-primary-200"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-primary-600">
              <i className="ti ti-building-store text-lg" aria-hidden="true" />
            </span>
            <span className="flex-1 font-display text-sm font-bold text-foreground">
              Infos de l&apos;auto-école
            </span>
            <i className="ti ti-chevron-right text-secondary" aria-hidden="true" />
          </button>

          {onBackToPicker && (
            <button
              onClick={() => {
                setMoreOpen(false);
                onBackToPicker();
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-token bg-surface-1 p-4 text-left shadow-soft transition-colors hover:border-primary-200"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-secondary">
                <i className="ti ti-replace text-lg" aria-hidden="true" />
              </span>
              <span className="flex-1 font-display text-sm font-bold text-foreground">
                Changer d&apos;auto-école
              </span>
              <i className="ti ti-chevron-right text-secondary" aria-hidden="true" />
            </button>
          )}
        </div>
      </Sheet>

      <SchoolSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        school={school}
        onSaved={onSchoolUpdated}
      />
    </div>
    </SideMenuProvider>
  );
}
