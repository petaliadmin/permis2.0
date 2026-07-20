import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@permis2.0/types';

export type OtpChannel = 'sms' | 'whatsapp';

export function isValidSnPhone(raw: string): boolean {
  const digits = raw.replace(/[^\d]/g, '').replace(/^221/, '');
  return /^(77|78|76|70|75|33)\d{7}$/.test(digits);
}

export function formatPhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '').replace(/^221/, '');
  return digits.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
}

interface AuthState {
  user: User | null;
  token: string | null;
  phone: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithPin: (phone: string, pin: string) => Promise<void>;
  requestOtp: (phone: string, channel: OtpChannel) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<boolean>;
  registerWithPin: (name: string, phone: string, pin: string) => Promise<void>;
  resetPin: (phone: string, otp: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

/**
 * Estimate the XP earned as a guest from the locally stored quiz progress,
 * mirroring the server rule (10 XP per correct answer, +50 for a perfect run).
 * Sessions hold ~13 questions on average.
 */
function computeGuestXp(): number {
  try {
    const raw = JSON.parse(localStorage.getItem('quizz_progress') ?? '{}') as Record<
      string,
      unknown
    >;
    let xp = 0;
    for (const v of Object.values(raw)) {
      if (!v || typeof v !== 'object' || !('done' in v)) continue;
      const pct = Math.max(0, Math.min(100, Number((v as { pct?: number }).pct ?? 0)));
      const correct = Math.round((pct / 100) * 13);
      xp += correct * 10 + (pct === 100 ? 50 : 0);
    }
    return Math.min(xp, 50000);
  } catch {
    return 0;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      phone: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: user !== null }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            throw new Error('Invalid credentials');
          }

          const data = await response.json();
          set({
            user: data.user,
            token: data.accessToken,
            isAuthenticated: true,
          });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password, name }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
          }

          const data = await response.json();
          set({
            user: data.user,
            token: data.accessToken,
            isAuthenticated: true,
          });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithPin: async (phone: string, pin: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/auth/login-pin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ phone, pin }),
          });
          if (!response.ok) throw new Error('Identifiants invalides');
          const data = await response.json();
          set({ user: data.user, token: data.accessToken, isAuthenticated: true, phone });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      requestOtp: async (phone: string, channel: OtpChannel) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/auth/otp/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, channel }),
          });
          if (!response.ok) throw new Error('Envoi du code échoué');
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOtp: async (phone: string, otp: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/auth/otp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp }),
          });
          return response.ok;
        } catch {
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      registerWithPin: async (name: string, phone: string, pin: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/auth/register-pin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, phone, pin }),
          });
          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Inscription échouée');
          }
          const data = await response.json();
          set({ user: data.user, token: data.accessToken, isAuthenticated: true, phone });

          // Merge guest progress into the freshly created account (best effort).
          const guestXp = computeGuestXp();
          if (guestXp > 0) {
            try {
              const res = await fetch(`${API_URL}/auth/migrate-guest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ xp: guestXp }),
              });
              if (res.ok) {
                const migrated = await res.json();
                if (migrated.user) set({ user: migrated.user });
              }
            } catch {
              // Non-blocking: local progress stays in localStorage anyway
            }
          }
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      resetPin: async (phone: string, otp: string, pin: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/auth/reset-pin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ phone, otp, pin }),
          });
          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Code invalide ou expiré');
          }
          const data = await response.json();
          set({ user: data.user, token: data.accessToken, isAuthenticated: true, phone });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
          });
        } catch {
          // Ignore logout API errors — clear state regardless
        }
        set({
          user: null,
          token: null,
          phone: null,
          isAuthenticated: false,
          error: null,
        });
        localStorage.removeItem('auth-store');
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // token volontairement exclus — restera en mémoire seulement
      }),
    }
  )
);
