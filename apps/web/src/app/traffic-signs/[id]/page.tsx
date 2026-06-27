'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { TrafficSignDetail } from '@/components/TrafficSignComponents';
import { Button, Card, CardContent } from '@permis2.0/ui';
import { AppShell } from '@/components/AppShell';
import type { TrafficSign } from '@permis2.0/types';

interface TrafficSignWithRelations extends TrafficSign {
  relatedSigns?: TrafficSign[];
  questions?: Array<{
    id: string;
    enonce: string;
    choices: { id: string; text: string }[];
    category?: { label?: string };
  }>;
}

export default function TrafficSignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const signId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [sign, setSign] = useState<TrafficSignWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchSign = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/traffic-signs/${signId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch traffic sign');
        }

        const data = await response.json();
        setSign(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load sign';
        setError(message);
        console.error('Error fetching sign:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (signId) {
      fetchSign();
    }
  }, [signId, API_URL]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell streak={0}>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Chargement du panneau...
            </p>
          </div>
        ) : error ? (
          <Card className="border-danger/30 bg-danger/5">
            <CardContent className="pt-6 text-center text-danger">
              Erreur : {error}
            </CardContent>
          </Card>
        ) : sign ? (
          <>
            <TrafficSignDetail
              sign={sign}
              relatedSigns={sign.relatedSigns}
              questions={sign.questions}
            />

            <div className="mt-8 flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="rounded-xl"
              >
                ← Retour
              </Button>
              <Link href="/traffic-signs">
                <Button className="rounded-xl">Voir tous les panneaux</Button>
              </Link>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-slate-500 dark:text-slate-400">
              Panneau non trouvé
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
