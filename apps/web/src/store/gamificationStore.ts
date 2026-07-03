'use client';

import { create } from 'zustand';
import type { BadgeType, UserProfile } from '@permis2.0/types';
import { useAuthStore } from './authStore';

export interface GamificationState {
  // User profile
  userProfile: UserProfile | null;
  xp: number;
  level: string;
  currentStreak: number;
  longestStreak: number;
  badges: BadgeType[];

  // Leaderboard
  leaderboard: Array<{
    userId: string;
    name: string;
    avatar?: string;
    xp: number;
    level: string;
    rank: number;
  }>;
  userRank: number | null;

  // State management
  isLoading: boolean;
  error: string | null;

  // Methods
  fetchUserProfile: () => Promise<void>;
  fetchBadges: () => Promise<void>;
  fetchLeaderboard: (limit?: number) => Promise<void>;
  fetchUserRank: () => Promise<void>;
  checkAchievements: () => Promise<BadgeType[]>;
  updateXP: (amount: number) => void;
  reset: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token && !token.startsWith('local:')) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  userProfile: null,
  xp: 0,
  level: 'Débutant',
  currentStreak: 0,
  longestStreak: 0,
  badges: [],
  leaderboard: [],
  userRank: null,
  isLoading: false,
  error: null,

  fetchUserProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/profile`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();

      set({
        userProfile: data,
        xp: data.xp || 0,
        level: data.level || 'Débutant',
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch profile';
      set({ error: message, isLoading: false });
      console.error('Error fetching profile:', error);
    }
  },

  fetchBadges: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/gamification/badges`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch badges');
      }

      const data = await response.json();

      set({
        badges: data.badges || [],
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch badges';
      set({ error: message, isLoading: false });
      console.error('Error fetching badges:', error);
    }
  },

  fetchLeaderboard: async (limit = 100) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/gamification/leaderboard?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();

      set({
        leaderboard: data.leaderboard || [],
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch leaderboard';
      set({ error: message, isLoading: false });
      console.error('Error fetching leaderboard:', error);
    }
  },

  fetchUserRank: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/gamification/rank`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user rank');
      }

      const data = await response.json();

      set({
        userRank: data.rank,
        currentStreak: data.currentStreak || 0,
        longestStreak: data.longestStreak || 0,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch rank';
      set({ error: message, isLoading: false });
      console.error('Error fetching rank:', error);
    }
  },

  checkAchievements: async () => {
    try {
      const token = useAuthStore.getState().token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/gamification/check-achievements`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to check achievements');
      }

      const data = await response.json();

      // Update badges if new ones unlocked
      if (data.newBadges && data.newBadges.length > 0) {
        const currentBadges = get().badges;
        const allBadges = [...currentBadges, ...data.newBadges];
        set({ badges: allBadges });
      }

      return data.newBadges || [];
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  },

  updateXP: (amount: number) => {
    const currentXP = get().xp;
    set({ xp: currentXP + amount });
  },

  reset: () => {
    set({
      userProfile: null,
      xp: 0,
      level: 'Débutant',
      currentStreak: 0,
      longestStreak: 0,
      badges: [],
      leaderboard: [],
      userRank: null,
      isLoading: false,
      error: null,
    });
  },
}));
