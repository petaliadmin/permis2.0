'use client';

import { create } from 'zustand';
import type { BadgeType, UserProfile } from '@permis2.0/types';

export interface GamificationState {
  userProfile: UserProfile | null;
  xp: number;
  level: string;
  currentStreak: number;
  longestStreak: number;
  badges: BadgeType[];
  leaderboard: Array<{
    userId: string;
    name: string;
    avatar?: string;
    xp: number;
    level: string;
    rank: number;
  }>;
  userRank: number | null;
  isLoading: boolean;
  error: string | null;
  fetchUserProfile: () => Promise<void>;
  fetchBadges: () => Promise<void>;
  fetchLeaderboard: (limit?: number) => Promise<void>;
  fetchUserRank: () => Promise<void>;
  checkAchievements: () => Promise<BadgeType[]>;
  updateXP: (amount: number) => void;
  reset: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
      const response = await fetch(`${API_URL}/users/profile`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch user profile');

      const data = await response.json();
      set({ userProfile: data, xp: data.xp || 0, level: data.level || 'Débutant', isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch profile';
      set({ error: message, isLoading: false });
    }
  },

  fetchBadges: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/gamification/badges`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch badges');

      const data = await response.json();
      set({ badges: data || [], isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch badges';
      set({ error: message, isLoading: false });
    }
  },

  fetchLeaderboard: async (limit = 100) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/gamification/leaderboard?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');

      const data = await response.json();
      set({ leaderboard: data || [], isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch leaderboard';
      set({ error: message, isLoading: false });
    }
  },

  fetchUserRank: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/gamification/rank`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch user rank');

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
    }
  },

  checkAchievements: async () => {
    try {
      const response = await fetch(`${API_URL}/gamification/check-achievements`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to check achievements');

      const data = await response.json();
      if (data.newBadges?.length > 0) {
        set({ badges: [...get().badges, ...data.newBadges] });
      }
      return data.newBadges || [];
    } catch {
      return [];
    }
  },

  updateXP: (amount: number) => {
    set({ xp: get().xp + amount });
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
