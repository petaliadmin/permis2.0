'use client';

import { create } from 'zustand';
import { useAuthStore } from './authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;

  fetch: () => Promise<void>;
  fetchCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  loading: false,

  fetch: async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    set({ loading: true });
    try {
      const res = await fetch(`${API_URL}/notifications`, { credentials: 'include' });
      if (!res.ok) return;
      const items: AppNotification[] = await res.json();
      const unreadCount = items.filter((n) => !n.read).length;
      set({ items, unreadCount });
    } finally {
      set({ loading: false });
    }
  },

  fetchCount: async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    try {
      const res = await fetch(`${API_URL}/notifications/unread-count`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      set({ unreadCount: data.count });
    } catch {}
  },

  markRead: async (id) => {
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(
        0,
        s.unreadCount - (s.items.find((n) => n.id === id && !n.read) ? 1 : 0)
      ),
    }));
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
    } catch {}
  },

  markAllRead: async () => {
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })), unreadCount: 0 }));
    try {
      await fetch(`${API_URL}/notifications/read-all`, { method: 'PATCH', credentials: 'include' });
    } catch {}
  },

  remove: async (id) => {
    set((s) => ({
      items: s.items.filter((n) => n.id !== id),
      unreadCount: Math.max(
        0,
        s.unreadCount - (s.items.find((n) => n.id === id && !n.read) ? 1 : 0)
      ),
    }));
    try {
      await fetch(`${API_URL}/notifications/${id}`, { method: 'DELETE', credentials: 'include' });
    } catch {}
  },
}));
