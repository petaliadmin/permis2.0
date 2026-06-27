'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useContentStore } from '@/store/contentStore';
import { Input } from '@permis2.0/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@permis2.0/ui';
import { Button } from '@permis2.0/ui';

export default function LessonsPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const lessons = useContentStore((state) => state.lessons);
  const lessonsLoading = useContentStore((state) => state.lessonsLoading);
  const fetchCategories = useContentStore((state) => state.fetchCategories);
  const searchLessons = useContentStore((state) => state.searchLessons);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated, fetchCategories]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const results = await searchLessons(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const resultsToDisplay = searchQuery.trim() ? searchResults : lessons;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-dark dark:to-dark">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            PERMIS2.0
          </Link>
          <nav className="flex gap-4">
            <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-primary">
              Accueil
            </Link>
            <Link href="/categories" className="text-gray-600 dark:text-gray-400 hover:text-primary">
              Catégories
            </Link>
            <Link href="/lessons" className="text-primary font-semibold">
              Leçons
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-dark dark:text-white mb-4">
            Leçons
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Explorez toutes les leçons disponibles
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="Rechercher une leçon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? 'Recherche...' : 'Rechercher'}
            </Button>
          </form>
        </div>

        {/* Results */}
        {lessonsLoading || isSearching ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : resultsToDisplay.length > 0 ? (
          <div className="space-y-4">
            {resultsToDisplay.map((lesson: any) => (
              <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {lesson.titre}
                      {lesson.category && (
                        <span
                          className="text-2xl"
                          dangerouslySetInnerHTML={{ __html: lesson.category.icone }}
                        />
                      )}
                    </CardTitle>
                    <CardDescription>
                      {lesson.contenu.substring(0, 150)}...
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'Aucun résultat trouvé' : 'Aucune leçon disponible'}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
