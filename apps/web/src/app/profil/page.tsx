'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell, PageHeader } from '@/components/AppShell';
import { useAuthStore, formatPhone } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { QUIZ_CATEGORIES, TOTAL_QUIZZES } from '../quizz/config';

interface LocalUser { name: string; streak: number; xp: number; }

const BADGES = [
  { id: 'first',    icon: '🎯', label: 'Premier quiz',    earned: false },
  { id: 'streak3',  icon: '🔥', label: 'Streak 3 jours',  earned: false },
  { id: 'signs',    icon: '🚦', label: 'Expert panneaux', earned: false },
  { id: 'perfect',  icon: '⭐', label: 'Parfait !',       earned: false },
  { id: 'streak7',  icon: '💎', label: 'Streak 7 jours',  earned: false },
  { id: 'champion', icon: '🏆', label: 'Champion',        earned: false },
];

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-2xl border border-token bg-surface-1 p-3 text-center shadow-soft">
      <i className={`ti ${icon} text-lg ${color}`} aria-hidden="true" />
      <p className="mt-1 font-display text-lg font-black text-foreground">{value}</p>
      <p className="mt-0.5 text-[10px] leading-tight text-muted">{label}</p>
    </div>
  );
}

function SettingRow({ icon, label, value, onClick, danger = false }: {
  icon: string; label: string; value?: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 border-b border-token py-3.5 last:border-0">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${danger ? 'bg-red-50' : 'bg-surface-2'}`}>
        <i className={`ti ${icon} text-base ${danger ? 'text-danger-500' : 'text-secondary'}`} aria-hidden="true" />
      </div>
      <span className={`flex-1 text-left text-sm font-medium ${danger ? 'text-danger-500' : 'text-foreground'}`}>{label}</span>
      {value && <span className="text-xs text-muted">{value}</span>}
      {!danger && <i className="ti ti-chevron-right text-sm text-slate-300" aria-hidden="true" />}
    </button>
  );
}

export default function ProfilPage() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const authPhone = useAuthStore((s) => s.phone);
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useThemeStore();

  const [localUser, setLocalUser] = useState<LocalUser>({ name: 'Conducteur', streak: 0, xp: 0 });
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [showTheme, setShowTheme] = useState(false);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('permis_user') || '{}');
      if (u.name) setLocalUser(u);
      setProgress(JSON.parse(localStorage.getItem('quizz_progress') || '{}'));
    } catch {}
  }, []);

  const name = authUser?.name || localUser.name;
  const xp = authUser?.xp || localUser.xp;
  const streak = localUser.streak || 7;
  const completedCnt = Object.values(progress).filter(Boolean).length;
  const initial = name.charAt(0).toUpperCase();

  const handleLogout = () => { logout(); router.push('/auth/login'); };
  const handleResetProgress = () => {
    if (confirm('Réinitialiser toute ta progression ?')) {
      try { localStorage.removeItem('quizz_progress'); } catch {}
      setProgress({});
    }
  };

  return (
    <AppShell>
      <PageHeader title="Profil" accent="violet"
        actions={
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15" aria-label="Paramètres">
            <i className="ti ti-settings text-lg" aria-hidden="true" />
          </button>
        }
      />

      <div className="px-5">
        {/* Avatar card overlapping header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="-mt-6 flex flex-col items-center rounded-3xl border border-token bg-surface-1 p-5 text-center shadow-card">
          <div className="relative -mt-14 mb-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 shadow-lg ring-4 ring-white">
              <span className="font-display text-3xl font-black text-white">{initial}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-token bg-surface-1">
              <i className="ti ti-pencil text-xs text-secondary" aria-hidden="true" />
            </div>
          </div>
          <h2 className="font-display text-xl font-black text-foreground">{name}</h2>
          {isAuth && authPhone && <p className="mt-0.5 text-xs text-muted">+221 {formatPhone(authPhone)}</p>}
          {isAuth && !authPhone && authUser?.email && <p className="mt-0.5 text-xs text-muted">{authUser.email}</p>}
          <span className="mt-2 chip chip-violet"><i className="ti ti-award" aria-hidden="true" /> Débutant</span>
        </motion.div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-4 gap-2.5">
          <StatCard icon="ti-flame"  label="Jours"     value={streak} color="text-orange-500" />
          <StatCard icon="ti-star"   label="XP total"  value={xp} color="text-xp-500" />
          <StatCard icon="ti-trophy" label="Quiz OK"   value={completedCnt} color="text-success-600" />
          <StatCard icon="ti-target" label="Précision" value="—" color="text-primary-600" />
        </div>

        {/* Progression */}
        <div className="mt-6">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="font-display text-sm font-bold text-foreground">Progression</p>
            <span className="text-xs text-muted">{completedCnt}/{TOTAL_QUIZZES}</span>
          </div>
          <div className="rounded-2xl border border-token bg-surface-1 p-4 shadow-soft">
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-surface-3">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600"
                initial={{ width: 0 }} animate={{ width: `${Math.round((completedCnt / TOTAL_QUIZZES) * 100)}%` }}
                transition={{ delay: 0.3, duration: 0.8 }} />
            </div>
            <div className="space-y-2.5">
              {QUIZ_CATEGORIES.map((cat) => {
                const done = cat.quizzes.filter((q) => progress[`${cat.slug}_${q.id}`]).length;
                const pct = cat.quizzes.length ? Math.round((done / cat.quizzes.length) * 100) : 0;
                return (
                  <div key={cat.slug} className="flex items-center gap-2.5">
                    <span className="w-5 shrink-0 text-sm">{cat.icon}</span>
                    <span className="w-24 shrink-0 truncate text-xs text-secondary">{cat.title}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                      <motion.div className="h-full rounded-full bg-violet-500" animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[10px] text-muted">{done}/{cat.quizzes.length}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-6">
          <p className="mb-2.5 font-display text-sm font-bold text-foreground">Badges</p>
          <div className="grid grid-cols-3 gap-2.5">
            {BADGES.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                className={`rounded-2xl border p-3 text-center shadow-soft ${b.earned ? 'border-violet-200 bg-violet-50' : 'border-token bg-surface-1 opacity-60'}`}>
                <div className="mb-1 text-2xl">{b.icon}</div>
                <p className="text-[10px] font-semibold leading-tight text-secondary">{b.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="mt-6">
          <p className="mb-2.5 font-display text-sm font-bold text-foreground">Paramètres</p>
          <div className="rounded-2xl border border-token bg-surface-1 px-4 shadow-soft">
            <SettingRow icon="ti-palette" label="Thème"
              value={theme === 'dark' ? 'Sombre' : theme === 'light' ? 'Clair' : 'Système'}
              onClick={() => setShowTheme(!showTheme)} />
            {showTheme && (
              <div className="flex gap-2 border-b border-token py-2">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button key={t} onClick={() => { setTheme(t); setShowTheme(false); }}
                    className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${theme === t ? 'bg-violet-100 text-violet-700' : 'bg-surface-2 text-muted'}`}>
                    {t === 'light' ? '☀️ Clair' : t === 'dark' ? '🌙 Sombre' : '🖥 Système'}
                  </button>
                ))}
              </div>
            )}
            <SettingRow icon="ti-bell" label="Notifications" value="Activées" onClick={() => {}} />
            <SettingRow icon="ti-headset" label="Assistance" onClick={() => router.push('/assistance')} />
            <SettingRow icon="ti-info-circle" label="À propos — v2.0" onClick={() => {}} />
          </div>
        </div>

        {/* Account */}
        <div className="mt-6">
          <p className="mb-2.5 font-display text-sm font-bold text-foreground">Compte</p>
          <div className="rounded-2xl border border-token bg-surface-1 px-4 shadow-soft">
            {isAuth ? (
              <SettingRow icon="ti-logout" label="Se déconnecter" onClick={handleLogout} danger />
            ) : (
              <>
                <SettingRow icon="ti-login" label="Se connecter" onClick={() => router.push('/auth/login')} />
                <SettingRow icon="ti-user-plus" label="Créer un compte" onClick={() => router.push('/auth/register')} />
              </>
            )}
            <SettingRow icon="ti-refresh" label="Réinitialiser la progression" onClick={handleResetProgress} danger />
          </div>
        </div>

        {/* Premium */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <Link href="/boutique">
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-4 text-white shadow-md">
              <i className="ti ti-crown text-2xl" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-display text-sm font-bold">Passer Premium</p>
                <p className="text-xs text-white/85">Accès illimité — 2 500 FCFA/mois</p>
              </div>
              <i className="ti ti-chevron-right" aria-hidden="true" />
            </div>
          </Link>
        </motion.div>
      </div>
    </AppShell>
  );
}
