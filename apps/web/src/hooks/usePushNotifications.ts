'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export type PushState = 'unsupported' | 'default' | 'granted' | 'denied';

export function usePushNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [state, setState] = useState<PushState>('default');

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      !('serviceWorker' in navigator)
    ) {
      setState('unsupported');
      return;
    }
    setState(Notification.permission as PushState);
  }, []);

  const subscribe = async (): Promise<boolean> => {
    if (!isAuthenticated || !VAPID_KEY) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      });
      const json = sub.toJSON();
      await fetch(`${API_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        }),
      });
      setState('granted');
      return true;
    } catch {
      return false;
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (state === 'unsupported' || state === 'denied') return false;
    const result = await Notification.requestPermission();
    setState(result as PushState);
    if (result === 'granted') return subscribe();
    return false;
  };

  return { state, requestPermission };
}
