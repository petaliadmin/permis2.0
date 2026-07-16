'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AppShell, PageHeader } from '@/components/AppShell';
import { Skeleton } from '@permis2.0/ui';
import { useWolofAudio } from '@/hooks/useWolofAudio';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface LessonDetail {
  id: string;
  titre: string;
  contenu: string;
  points_cles: string[];
  exceptions: string[];
  erreurs_frequentes: string[];
  regles: string[];
  illustrations?: string[];
  category?: { id: string; label: string; couleur?: string | null };
}

/** Sign illustration with graceful fallback when the file is missing. */
function Illustration({ src }: { src: string }) {
  const [err, setErr] = useState(false);
  if (err) return null;
  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-token bg-surface-2 p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-contain" onError={() => setErr(true)} />
    </div>
  );
}

function Section({
  title,
  icon,
  items,
  tone,
}: {
  title: string;
  icon: string;
  items: string[];
  tone: 'primary' | 'success' | 'danger' | 'amber';
}) {
  if (!items || items.length === 0) return null;
  const tones = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-700', icon: 'text-primary-600' },
    success: { bg: 'bg-success-50', text: 'text-success-700', icon: 'text-success-600' },
    danger: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600' },
  }[tone];
  return (
    <div className="mt-5">
      <p className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-foreground">
        <i className={`ti ${icon} ${tones.icon}`} aria-hidden="true" /> {title}
      </p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className={`rounded-xl px-3.5 py-2.5 ${tones.bg}`}>
            <p className={`text-sm leading-snug ${tones.text}`}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CoursDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/lessons/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setLesson)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [id]);

  const wolof = useWolofAudio(id ? `/audio/wolof/lecons/${id}.mp3` : null);

  const speak = () => {
    if (!lesson || typeof window === 'undefined' || !window.speechSynthesis) return;
    wolof.stop();
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(`${lesson.titre}. ${lesson.contenu}`);
    u.lang = 'fr-FR';
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  return (
    <AppShell>
      <PageHeader
        title={lesson?.titre ?? 'Leçon'}
        subtitle={lesson?.category?.label}
        accent="blue"
        back="/cours"
        compact
        actions={
          <>
            {wolof.available && (
              <button
                onClick={wolof.toggle}
                className="flex h-9 items-center justify-center gap-1 rounded-full bg-white/15 px-3 text-xs font-bold"
                aria-label="Écouter en wolof"
              >
                <i
                  className={`ti ${wolof.playing ? 'ti-player-stop-filled' : 'ti-language'} text-base`}
                  aria-hidden="true"
                />
                Wolof
              </button>
            )}
            <button
              onClick={speak}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"
              aria-label={speaking ? 'Arrêter la lecture' : 'Écouter la leçon'}
            >
              <i
                className={`ti ${speaking ? 'ti-player-stop-filled' : 'ti-volume'} text-lg`}
                aria-hidden="true"
              />
            </button>
          </>
        }
      />

      <div className="px-4 pb-8 pt-5">
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        )}

        {!loading && (error || !lesson) && (
          <div className="mt-10 text-center">
            <i className="ti ti-book-off text-4xl text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-sm text-secondary">Leçon introuvable ou connexion perdue.</p>
          </div>
        )}

        {!loading && lesson && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Associated signs */}
            {lesson.illustrations && lesson.illustrations.length > 0 && (
              <div className="no-scrollbar -mx-1 mb-4 flex gap-3 overflow-x-auto px-1 pb-1">
                {lesson.illustrations.map((src) => (
                  <Illustration key={src} src={src} />
                ))}
              </div>
            )}

            {/* Main content — ALL-CAPS lines become sub-headers */}
            <div className="rounded-2xl border border-token bg-surface-1 p-4 shadow-soft">
              {lesson.contenu.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-3" />;
                const isHeading =
                  trimmed.length <= 70 &&
                  trimmed === trimmed.toUpperCase() &&
                  /[A-ZÀ-Ü]/.test(trimmed);
                return isHeading ? (
                  <p
                    key={i}
                    className="mb-1 mt-2 border-l-4 border-primary-500 pl-2.5 font-display text-[13px] font-extrabold uppercase tracking-wide text-primary-700 first:mt-0"
                  >
                    {trimmed}
                  </p>
                ) : (
                  <p key={i} className="text-sm leading-relaxed text-foreground">
                    {line}
                  </p>
                );
              })}
            </div>

            <Section title="Points clés" icon="ti-key" items={lesson.points_cles} tone="primary" />
            <Section
              title="Règles à retenir"
              icon="ti-gavel"
              items={lesson.regles}
              tone="success"
            />
            <Section
              title="Erreurs fréquentes"
              icon="ti-alert-triangle"
              items={lesson.erreurs_frequentes}
              tone="danger"
            />
            <Section
              title="Exceptions"
              icon="ti-info-circle"
              items={lesson.exceptions}
              tone="amber"
            />
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
