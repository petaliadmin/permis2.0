import { useState, useCallback, useEffect } from 'react';

const FAVORITES_KEY = 'favorites';

export interface UseFavoritesState {
  favorites: Set<string>;
  isFavorite: (id: string) => boolean;
}

export interface UseFavoritesActions {
  toggleFavorite: (id: string) => Promise<void>;
  addFavorite: (id: string) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
}

export function useFavorites(): UseFavoritesState & UseFavoritesActions {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load favorites from localStorage
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFavorites(new Set(parsed));
      } catch (e) {
        localStorage.removeItem(FAVORITES_KEY);
      }
    }
  }, []);

  const saveFavorites = useCallback((newFavorites: Set<string>) => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(newFavorites)));
  }, []);

  const isFavorite = useCallback((id: string) => {
    return favorites.has(id);
  }, [favorites]);

  const toggleFavorite = useCallback(
    async (id: string) => {
      const newFavorites = new Set(favorites);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      setFavorites(newFavorites);
      saveFavorites(newFavorites);
      // TODO: Sync with API
    },
    [favorites, saveFavorites]
  );

  const addFavorite = useCallback(
    async (id: string) => {
      const newFavorites = new Set(favorites);
      newFavorites.add(id);
      setFavorites(newFavorites);
      saveFavorites(newFavorites);
      // TODO: Sync with API
    },
    [favorites, saveFavorites]
  );

  const removeFavorite = useCallback(
    async (id: string) => {
      const newFavorites = new Set(favorites);
      newFavorites.delete(id);
      setFavorites(newFavorites);
      saveFavorites(newFavorites);
      // TODO: Sync with API
    },
    [favorites, saveFavorites]
  );

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
  };
}
