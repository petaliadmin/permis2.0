'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { useAuthStore, formatPhone } from '@/store/authStore';
import { useThemeStore, type ThemeMode } from '@/store/themeStore';
import { useSettingsStore } from '@/store/settingsStore';
import { usePurchasesStore } from '@/store/purchasesStore';
import { useNotificationStore } from '@/store/notificationStore';
import { SUBSCRIPTION_PRICE_ANNUAL } from '@permis2.0/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UserStats {
  daysOnApp: number;
  quizAnswered: number;
  examCount: number;
  streak: number;
  xp: number;
  level: string;
  progressPct: number;
}

const LEVEL_META: Record<string, { next: number; color: string; chip: string }> = {
  Débutant: { next: 100, color: 'bg-slate-500', chip: 'bg-slate-100 text-slate-700' },
  Intermédiaire: { next: 300, color: 'bg-sky-500', chip: 'bg-sky-100 text-sky-700' },
  Confirmé: { next: 600, color: 'bg-violet-500', chip: 'bg-violet-100 text-violet-700' },
  Expert: { next: 9999, color: 'bg-amber-500', chip: 'bg-amber-100 text-amber-700' },
};

const THEME_LABEL: Record<ThemeMode, string> = {
  light: '☀️ Clair',
  dark: '🌙 Sombre',
  system: '🖥 Système',
};
const THEME_NEXT: Record<ThemeMode, ThemeMode> = { light: 'dark', dark: 'system', system: 'light' };

/* ── Rows ───────────────────────────────────────────────────────────────────── */
function SettingRow({
  icon,
  label,
  value,
  onClick,
  danger = false,
  chevron = true,
}: {
  icon: string;
  label: string;
  value?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  chevron?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-token py-3.5 last:border-0"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${danger ? 'bg-red-50' : 'bg-surface-2'}`}
      >
        <i
          className={`ti ${icon} text-base ${danger ? 'text-red-500' : 'text-secondary'}`}
          aria-hidden="true"
        />
      </div>
      <span
        className={`flex-1 text-left text-sm font-medium ${danger ? 'text-red-500' : 'text-foreground'}`}
      >
        {label}
      </span>
      {value !== undefined && <span className="text-xs text-muted">{value}</span>}
      {chevron && !danger && (
        <i className="ti ti-chevron-right text-sm text-slate-300" aria-hidden="true" />
      )}
    </button>
  );
}

/* ── Edit name sheet ─────────────────────────────────────────────────────────── */
function EditNameSheet({ initial, onClose }: { initial: string; onClose: () => void }) {
  const [val, setVal] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const setUser = useAuthStore((s) => s.setUser);
  const currentUser = useAuthStore((s) => s.user);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const save = async () => {
    const trimmed = val.trim();
    if (trimmed.length < 2) {
      setErr('Minimum 2 caractères.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      if (currentUser) setUser({ ...currentUser, name: updated.name });
      onClose();
    } catch {
      setErr('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-sm rounded-3xl bg-surface-1 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 font-display text-lg font-extrabold text-foreground">
          Modifier le prénom
        </h3>
        <input
          ref={inputRef}
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            setErr('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
          }}
          maxLength={50}
          className="w-full rounded-xl border border-token bg-surface-2 px-4 py-3 text-sm text-foreground placeholder-muted focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          placeholder="Ton prénom"
        />
        {err && <p className="mt-2 text-xs font-medium text-red-500">{err}</p>}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-token py-3 text-sm font-semibold text-secondary"
          >
            Annuler
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? 'Sauvegarde…' : 'Enregistrer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function ProfilPage() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const authPhone = useAuthStore((s) => s.phone);
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useThemeStore();
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);

  const hasKey = usePurchasesStore((s) => s.hasKey);
  const premiumExpiresAt = usePurchasesStore((s) => s.premiumExpiresAt);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetchNotifCount = useNotificationStore((s) => s.fetchCount);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [editName, setEditName] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!isAuth) return;
    fetchNotifCount();
    fetch(`${API_URL}/users/stats`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s && setStats(s))
      .catch(() => {});
  }, [isAuth, fetchNotifCount]);

  const name = authUser?.name || 'Conducteur';
  const level = stats?.level || authUser?.level || 'Débutant';
  const levelMeta = LEVEL_META[level] ?? LEVEL_META['Débutant'];
  const isPremium = hasKey('premium_all');

  const xp = stats?.xp ?? authUser?.xp ?? 0;
  const xpPct = level === 'Expert' ? 100 : Math.min(100, Math.round((xp / levelMeta.next) * 100));

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };
  const handleReset = () => {
    try {
      localStorage.removeItem('quizz_progress');
      localStorage.removeItem('quizz_errors');
    } catch {}
    setConfirmReset(false);
  };

  const formatExpiry = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <AppShell>
      <PageHeader
        title="Profil"
        accent="violet"
        menu
        actions={
          <Link
            href="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15"
            aria-label="Notifications"
          >
            <i className="ti ti-bell text-base" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-400 text-[9px] font-black text-white ring-2 ring-primary-700">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        }
      />

      <div className="px-5 pb-10">
        {/* ── Identity card : avatar + niveau + stats ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="-mt-6 rounded-3xl border border-token bg-surface-1 p-5 shadow-card"
        >
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 shadow-lg">
                <span className="font-display text-2xl font-black text-white">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
              {isAuth && (
                <button
                  onClick={() => setEditName(true)}
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-token bg-surface-1 shadow-sm"
                  aria-label="Modifier le nom"
                >
                  <i className="ti ti-pencil text-[10px] text-secondary" aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-lg font-black text-foreground">{name}</h2>
              {isAuth && (authPhone || authUser?.email) && (
                <p className="truncate text-xs text-muted">
                  {authPhone ? `+221 ${formatPhone(authPhone)}` : authUser?.email}
                </p>
              )}
              <span
                className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${levelMeta.chip}`}
              >
                <i className="ti ti-award text-[11px]" aria-hidden="true" /> {level}
              </span>
            </div>
          </div>

          {/* XP progress */}
          {isAuth && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[10px] text-muted">
                <span>{xp} XP</span>
                {level !== 'Expert' && <span>→ {levelMeta.next} XP</span>}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                <motion.div
                  className={`h-full rounded-full ${levelMeta.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPct}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                />
              </div>
            </div>
          )}

          {/* Compact stats */}
          {isAuth && (
            <div className="mt-4 grid grid-cols-3 divide-x divide-token rounded-2xl bg-surface-2 py-3 text-center">
              {[
                { label: 'Série', value: stats ? `${stats.streak} j` : '—', icon: 'ti-flame' },
                { label: 'Quiz', value: stats ? stats.quizAnswered : '—', icon: 'ti-cards' },
                {
                  label: 'Précision',
                  value: stats ? `${stats.progressPct}%` : '—',
                  icon: 'ti-target',
                },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-display text-base font-black text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Premium ─── */}
        {isPremium ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <span className="text-2xl">👑</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">Abonnement Premium actif</p>
              {premiumExpiresAt && (
                <p className="text-xs text-amber-700">Expire le {formatExpiry(premiumExpiresAt)}</p>
              )}
            </div>
            <Link href="/boutique" className="text-xs font-bold text-amber-700">
              Renouveler
            </Link>
          </div>
        ) : (
          <Link href="/boutique">
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-4 text-white shadow-md">
              <i className="ti ti-crown text-2xl" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-display text-sm font-bold">Passer Premium</p>
                <p className="text-xs text-white/85">
                  Accès illimité — {SUBSCRIPTION_PRICE_ANNUAL}
                </p>
              </div>
              <i className="ti ti-chevron-right" aria-hidden="true" />
            </div>
          </Link>
        )}

        {/* ── Réglages ─── */}
        <div className="mt-6 rounded-2xl border border-token bg-surface-1 px-4 shadow-soft">
          <SettingRow
            icon="ti-palette"
            label="Thème"
            value={THEME_LABEL[theme]}
            chevron={false}
            onClick={() => setTheme(THEME_NEXT[theme])}
          />
          <SettingRow
            icon={soundEnabled ? 'ti-volume' : 'ti-volume-off'}
            label="Sons des quiz"
            chevron={false}
            value={
              <span
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${soundEnabled ? 'bg-violet-500' : 'bg-slate-300'}`}
                role="switch"
                aria-checked={soundEnabled}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${soundEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </span>
            }
            onClick={() => setSoundEnabled(!soundEnabled)}
          />
          <SettingRow
            icon="ti-headset"
            label="Assistance"
            onClick={() => router.push('/assistance')}
          />
          {String(authUser?.role) === 'ADMIN' && (
            <SettingRow
              icon="ti-shield-lock"
              label="Administration"
              onClick={() => router.push('/admin')}
            />
          )}
        </div>

        {/* ── Compte ─── */}
        <div className="mt-4 rounded-2xl border border-token bg-surface-1 px-4 shadow-soft">
          {isAuth ? (
            <>
              <SettingRow
                icon="ti-refresh"
                label="Réinitialiser la progression"
                onClick={() => setConfirmReset(true)}
                danger
              />
              <SettingRow icon="ti-logout" label="Se déconnecter" onClick={handleLogout} danger />
            </>
          ) : (
            <>
              <SettingRow
                icon="ti-login"
                label="Se connecter"
                onClick={() => router.push('/auth/login')}
              />
              <SettingRow
                icon="ti-user-plus"
                label="Créer un compte"
                onClick={() => router.push('/auth/register')}
              />
            </>
          )}
        </div>

        <p className="mt-8 text-center text-[10px] text-muted">
          PERMIS 2.0 · v2.0 · Made with ❤️ in Dakar
        </p>
      </div>

      {/* ── Edit name sheet ─── */}
      <AnimatePresence>
        {editName && <EditNameSheet initial={name} onClose={() => setEditName(false)} />}
      </AnimatePresence>

      {/* ── Confirm reset ─── */}
      <AnimatePresence>
        {confirmReset && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
            onClick={() => setConfirmReset(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-surface-1 p-6 text-center shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-3xl">
                ⚠️
              </div>
              <h3 className="font-display text-lg font-extrabold text-foreground">
                Réinitialiser ?
              </h3>
              <p className="mt-1 text-sm text-secondary">
                Ta progression locale (quiz terminés, erreurs à revoir) sera effacée. Irréversible.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 rounded-xl border border-token py-3 text-sm font-semibold text-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white"
                >
                  Réinitialiser
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
