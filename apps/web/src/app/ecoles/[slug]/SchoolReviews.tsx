'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { SchoolReview, SchoolReviewsResponse } from '@permis2.0/types';
import { useAuthStore } from '@/store/authStore';
import { IconStarFilled, IconStar, IconTrash } from '@tabler/icons-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function Stars({ value, size = '1em' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) =>
        n <= Math.round(value) ? (
          <IconStarFilled key={n} size={size} />
        ) : (
          <IconStar key={n} size={size} className="text-token" />
        )
      )}
    </span>
  );
}

interface SchoolReviewsProps {
  schoolId: string;
  /** Fetched server-side (same call that feeds the page's JSON-LD
   *  aggregateRating) so real review content is in the initial server HTML
   *  — a client-only useEffect fetch would leave it invisible without JS
   *  (brief rule 5). Only refetched client-side after the viewer's own
   *  submit/delete. */
  initialData: SchoolReviewsResponse;
}

export function SchoolReviews({ schoolId, initialData }: SchoolReviewsProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [data, setData] = useState<SchoolReviewsResponse>(initialData);
  const myInitial = initialData.reviews.find((r) => r.userId === user?.id);
  const [rating, setRating] = useState(myInitial?.rating ?? 0);
  const [comment, setComment] = useState(myInitial?.comment ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    fetch(`${API_URL}/schools/${schoolId}/reviews`)
      .then((r) => r.json())
      .then((d: SchoolReviewsResponse) => setData(d))
      .catch(() => {});
  };

  const myReview: SchoolReview | undefined = data.reviews.find((r) => r.userId === user?.id);

  const submit = async () => {
    if (rating < 1) {
      setError('Choisissez une note.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/schools/${schoolId}/reviews`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Erreur');
      load();
    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/schools/${schoolId}/reviews`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setRating(0);
      setComment('');
      load();
    } catch {
      // no-op — load() below will still reflect the server's real state
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-bold text-foreground">Avis</p>
        {data.reviewCount > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-secondary">
            <Stars value={data.averageRating ?? 0} />
            <span className="font-semibold text-foreground">{data.averageRating?.toFixed(1)}</span>
            <span>
              ({data.reviewCount} avis{data.reviewCount > 1 ? '' : ''})
            </span>
          </span>
        )}
      </div>

      {data.reviewCount === 0 && (
        <p className="mt-2 text-sm text-secondary">Aucun avis pour le moment.</p>
      )}

      {data.reviews.length > 0 && (
        <ul className="mt-3 space-y-3 border-t border-token pt-3">
          {data.reviews.map((r) => (
            <li key={r.id}>
              <div className="flex items-center gap-2">
                <Stars value={r.rating} />
                <span className="text-xs font-semibold text-foreground">{r.user.name}</span>
              </div>
              {r.comment && <p className="mt-1 text-sm text-secondary">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t border-token pt-4">
        {!isAuthenticated ? (
          <p className="text-sm text-secondary">
            <Link href="/auth/login" className="font-semibold text-primary-600 hover:underline">
              Connectez-vous
            </Link>{' '}
            pour laisser un avis.
          </p>
        ) : (
          <>
            <p className="text-xs font-bold text-secondary">
              {myReview ? 'Modifier mon avis' : 'Laisser un avis'}
            </p>
            <div className="mt-1.5 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                  className="text-amber-400"
                >
                  {n <= rating ? <IconStarFilled size="1.4em" /> : <IconStar size="1.4em" className="text-token" />}
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Votre expérience (optionnel)"
              className="mt-2 w-full rounded-xl border border-token bg-surface-2 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
            />
            {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={submit}
                disabled={saving}
                className="btn-primary !px-4 !py-2 text-xs disabled:opacity-40"
              >
                {saving ? 'Enregistrement…' : myReview ? 'Mettre à jour' : "Publier l'avis"}
              </button>
              {myReview && (
                <button
                  onClick={remove}
                  disabled={saving}
                  aria-label="Supprimer mon avis"
                  className="rounded-lg p-2 text-secondary hover:bg-red-50 hover:text-red-600"
                >
                  <IconTrash size="1em" aria-hidden="true" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
