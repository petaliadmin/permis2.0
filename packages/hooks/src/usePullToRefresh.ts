import { useEffect, useRef, useState } from 'react';

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

interface PullToRefreshState {
  pulling: boolean;
  refreshing: boolean;
  pullDistance: number;
}

/**
 * Detects a downward pull gesture at the top of the page and fires a refresh
 * callback. Works on iOS and Android WebViews. Only activates when
 * `window.scrollY === 0` and a downward swipe is detected.
 *
 * Usage:
 *   const { refreshing, pullDistance } = usePullToRefresh(handleRefresh);
 */
export function usePullToRefresh(onRefresh: () => Promise<void>): PullToRefreshState {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const startYRef = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || refreshingRef.current) return;
      startYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null || refreshingRef.current) return;
      if (window.scrollY > 0) {
        startYRef.current = null;
        return;
      }
      const deltaY = e.touches[0].clientY - startYRef.current;
      if (deltaY <= 0) return;

      e.preventDefault();
      const clamped = Math.min(deltaY * 0.5, MAX_PULL);
      pullDistanceRef.current = clamped;
      setPulling(true);
      setPullDistance(clamped);
    };

    const handleTouchEnd = async () => {
      if (startYRef.current === null) return;
      const dist = pullDistanceRef.current;
      startYRef.current = null;
      pullDistanceRef.current = 0;
      setPullDistance(0);

      if (dist < PULL_THRESHOLD) {
        setPulling(false);
        return;
      }

      refreshingRef.current = true;
      setPulling(false);
      setRefreshing(true);

      try {
        await onRefreshRef.current();
      } finally {
        refreshingRef.current = false;
        setRefreshing(false);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return { pulling, refreshing, pullDistance };
}
