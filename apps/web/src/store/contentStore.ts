import { create } from 'zustand';
import type { Category, Lesson } from '@permis2.0/types';

interface ContentState {
  // Categories
  categories: Category[];
  selectedCategory: Category | null;
  categoriesLoading: boolean;

  // Lessons
  lessons: Lesson[];
  selectedLesson: Lesson | null;
  lessonsLoading: boolean;
  favorites: Set<string>;

  // Methods
  fetchCategories: () => Promise<void>;
  fetchCategoryById: (id: string) => Promise<void>;
  fetchLessonsByCategory: (categoryId: string) => Promise<void>;
  fetchLesson: (id: string) => Promise<void>;
  toggleFavorite: (lessonId: string) => Promise<void>;
  searchLessons: (query: string) => Promise<Lesson[]>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useContentStore = create<ContentState>((set, get) => ({
  categories: [],
  selectedCategory: null,
  categoriesLoading: false,

  lessons: [],
  selectedLesson: null,
  lessonsLoading: false,
  favorites: new Set(),

  fetchCategories: async () => {
    set({ categoriesLoading: true });
    try {
      const response = await fetch(`${API_URL}/categories?take=100`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      set({ categories: data.data });
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      set({ categoriesLoading: false });
    }
  },

  fetchCategoryById: async (id: string) => {
    set({ categoriesLoading: true });
    try {
      const response = await fetch(`${API_URL}/categories/${id}`);
      if (!response.ok) throw new Error('Failed to fetch category');
      const data = await response.json();
      set({ selectedCategory: data });
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      set({ categoriesLoading: false });
    }
  },

  fetchLessonsByCategory: async (categoryId: string) => {
    set({ lessonsLoading: true });
    try {
      const response = await fetch(`${API_URL}/lessons/category/${categoryId}?take=100`);
      if (!response.ok) throw new Error('Failed to fetch lessons');
      const data = await response.json();
      set({ lessons: data.data });
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      set({ lessonsLoading: false });
    }
  },

  fetchLesson: async (id: string) => {
    set({ lessonsLoading: true });
    try {
      const response = await fetch(`${API_URL}/lessons/${id}`);
      if (!response.ok) throw new Error('Failed to fetch lesson');
      const data = await response.json();
      set({ selectedLesson: data });
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      set({ lessonsLoading: false });
    }
  },

  toggleFavorite: async (lessonId: string) => {
    const { favorites } = get();
    const token = localStorage.getItem('auth-store')
      ? JSON.parse(localStorage.getItem('auth-store') || '{}').state?.token
      : null;

    if (!token) {
      console.error('Not authenticated');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/lessons/${lessonId}/favorite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to toggle favorite');
      const data = await response.json();

      const newFavorites = new Set(favorites);
      if (data.isFavorite) {
        newFavorites.add(lessonId);
      } else {
        newFavorites.delete(lessonId);
      }
      set({ favorites: newFavorites });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  },

  searchLessons: async (query: string) => {
    try {
      const response = await fetch(
        `${API_URL}/lessons/search?q=${encodeURIComponent(query)}&take=50`
      );
      if (!response.ok) throw new Error('Failed to search lessons');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error searching lessons:', error);
      return [];
    }
  },
}));
