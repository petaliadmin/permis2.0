'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { TrafficSignCard, TrafficSignCategoryCard } from '@/components/TrafficSignComponents';
import { Button } from '@permis2.0/ui';
import { Card, CardContent } from '@permis2.0/ui';
import { AppShell } from '@/components/AppShell';
import type { TrafficSign } from '@permis2.0/types';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

function TrafficSignsContent() {
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [signs, setSigns] = useState<TrafficSign[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const categoriesRes = await fetch(`${API_URL}/traffic-signs/categories`);
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }

        let url = `${API_URL}/traffic-signs`;

        if (selectedCategory) {
          url = `${API_URL}/traffic-signs/category/${selectedCategory}`;
        } else if (searchQuery && searchQuery.length >= 2) {
          url = `${API_URL}/traffic-signs/search?q=${encodeURIComponent(searchQuery)}`;
        }

        const signsRes = await fetch(url);
        if (!signsRes.ok) {
          throw new Error('Failed to fetch signs');
        }

        const signsData = await signsRes.json();
        setSigns(signsData.data || signsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load signs';
        setError(message);
        console.error('Error fetching signs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, searchQuery, API_URL]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell streak={0}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-extrabold text-dark dark:text-white sm:text-3xl">
            Guide de signalisation
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            Apprends à reconnaître tous les panneaux du code de la route sénégalais.
          </p>
        </div>

        <Card className="mb-6 shadow-card">
          <CardContent className="pt-6">
            <input
              type="text"
              placeholder="Rechercher un panneau (ex: STOP, priorité, feux)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedCategory(null);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-dark placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-dark-900 dark:text-white dark:placeholder:text-slate-500"
            />
          </CardContent>
        </Card>

        {!searchQuery && !selectedCategory && categories.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-bold text-dark dark:text-white sm:text-xl">
              Catégories
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {categories.map((category) => (
                <TrafficSignCategoryCard
                  key={category.id}
                  {...category}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSearchQuery('');
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Chargement des panneaux...
            </p>
          </div>
        ) : error ? (
          <Card className="border-danger/30 bg-danger/5">
            <CardContent className="pt-6 text-center text-danger">
              Erreur : {error}
            </CardContent>
          </Card>
        ) : signs.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-500 dark:text-slate-400">
              {searchQuery || selectedCategory
                ? 'Aucun panneau trouvé pour cette recherche.'
                : 'Aucun panneau disponible.'}
            </CardContent>
          </Card>
        ) : (
          <section className="animate-fade-in">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-dark dark:text-white sm:text-xl">
                {selectedCategory
                  ? `Panneaux — ${selectedCategory}`
                  : searchQuery
                    ? `Résultats pour « ${searchQuery} »`
                    : 'Tous les panneaux'}
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {signs.length} résultat{signs.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {signs.map((sign) => (
                <TrafficSignCard key={sign.id} sign={sign} />
              ))}
            </div>
          </section>
        )}

        {selectedCategory && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => setSelectedCategory(null)}
              className="rounded-xl"
            >
              ← Retour aux catégories
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function TrafficSignsPage() {
  return (
    <Suspense fallback={null}>
      <TrafficSignsContent />
    </Suspense>
  );
}
