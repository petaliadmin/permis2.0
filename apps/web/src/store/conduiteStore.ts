import { create } from 'zustand';
import type { DrivingCourse } from '@permis2.0/types';

interface ConduiteState {
  courses: DrivingCourse[];
  coursesLoading: boolean;
  selectedCourse: DrivingCourse | null;
  courseLoading: boolean;

  fetchCourses: () => Promise<void>;
  fetchCourse: (slug: string) => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Conduite vertical store (Sprint 4). Courses are a public endpoint, so the
 * whole vertical works for guests with no auth — mirroring the contentStore
 * used by the Code vertical.
 */
export const useConduiteStore = create<ConduiteState>((set) => ({
  courses: [],
  coursesLoading: false,
  selectedCourse: null,
  courseLoading: false,

  fetchCourses: async () => {
    set({ coursesLoading: true });
    try {
      const res = await fetch(`${API_URL}/conduite`);
      if (!res.ok) throw new Error('Failed to fetch driving courses');
      const data = await res.json();
      set({ courses: data });
    } catch (error) {
      console.error('Error fetching driving courses:', error);
    } finally {
      set({ coursesLoading: false });
    }
  },

  fetchCourse: async (slug: string) => {
    set({ courseLoading: true });
    try {
      const res = await fetch(`${API_URL}/conduite/${slug}`);
      if (!res.ok) throw new Error('Failed to fetch driving course');
      const data = await res.json();
      set({ selectedCourse: data });
    } catch (error) {
      console.error('Error fetching driving course:', error);
    } finally {
      set({ courseLoading: false });
    }
  },
}));
