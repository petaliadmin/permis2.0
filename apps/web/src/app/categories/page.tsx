'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useContentStore } from '@/store/contentStore';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, Progress, Badge } from '@permis2.0/ui';

export default function CategoriesPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const categories = useContentStore((state) => state.categories);
  const categoriesLoading = useContentStore((state) => state.categoriesLoading);
  const fetchCategories = useContentStore((state) => state.fetchCategories);

  useEffect(() => {
    if (isAuthenticated && categories.length === 0) {
      fetchCategories();
    }
  }, [isAuthenticated, categories.length, fetchCategories]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-dark dark:text-white sm:text-4xl">
          Catégories
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Choisis une catégorie pour commencer à apprendre.
        </p>
      </div>

      {categoriesLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="skeleton-shimmer">
              <CardContent className="p-5">
                <div className="mb-4 h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
                <div className="mb-2 h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mb-4 h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category: any, index: number) => (
            <Link key={category.id} href={`/categories/${category.id}`}>
              <Card
                className="group h-full cursor-pointer transition-all hover:-translate-y-1 hover:shadow-glow animate-fade-in"
                style={{ animationDelay: `${Math.min(index * 40, 320)}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl text-white shadow-soft"
                      style={{ backgroundColor: category.couleur || '#16A34A' }}
                    >
                      🚗
                    </div>
                    <Badge variant="muted">{category.questionCount ?? 0} Q</Badge>
                  </div>
                  <h3 className="mt-4 font-bold text-dark dark:text-white">
                    {category.label}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                    {category.description}
                  </p>
                  <div className="mt-4">
                    <Progress value={0} max={100} />
                    <div className="mt-1.5 flex justify-between text-xs text-slate-400">
                      <span>{category.lessonCount ?? 0} leçons</span>
                      <span>0%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
