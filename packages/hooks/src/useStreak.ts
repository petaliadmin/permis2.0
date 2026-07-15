import { useState, useCallback, useEffect } from 'react';

const STREAK_KEY = 'daily_streak';

export interface UseStreakState {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  isStreakActive: boolean;
}

export interface UseStreakActions {
  checkIn: () => Promise<void>;
  reset: () => void;
}

export function useStreak(): UseStreakState & UseStreakActions {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [lastActivityDate, setLastActivityDate] = useState<Date | null>(null);

  useEffect(() => {
    // Load streak from localStorage
    const stored = localStorage.getItem(STREAK_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCurrentStreak(parsed.currentStreak || 0);
        setLongestStreak(parsed.longestStreak || 0);
        if (parsed.lastActivityDate) {
          setLastActivityDate(new Date(parsed.lastActivityDate));
        }
      } catch (e) {
        localStorage.removeItem(STREAK_KEY);
      }
    }
  }, []);

  const saveStreak = useCallback((current: number, longest: number, lastDate: Date | null) => {
    localStorage.setItem(
      STREAK_KEY,
      JSON.stringify({
        currentStreak: current,
        longestStreak: longest,
        lastActivityDate: lastDate?.toISOString(),
      })
    );
  }, []);

  const isStreakActive = useCallback(() => {
    if (!lastActivityDate) return false;
    const now = new Date();
    const dayInMs = 24 * 60 * 60 * 1000;
    const timeDiff = now.getTime() - lastActivityDate.getTime();
    return timeDiff <= dayInMs;
  }, [lastActivityDate]);

  const checkIn = useCallback(async () => {
    const now = new Date();
    let newCurrent = currentStreak;
    let newLongest = longestStreak;

    if (!lastActivityDate || !isStreakActive()) {
      newCurrent = 1;
    } else {
      newCurrent = currentStreak + 1;
    }

    newLongest = Math.max(newCurrent, longestStreak);

    setCurrentStreak(newCurrent);
    setLongestStreak(newLongest);
    setLastActivityDate(now);
    saveStreak(newCurrent, newLongest, now);

    // TODO: Sync with API
  }, [currentStreak, longestStreak, lastActivityDate, isStreakActive, saveStreak]);

  const reset = useCallback(() => {
    setCurrentStreak(0);
    setLastActivityDate(null);
    saveStreak(0, longestStreak, null);
  }, [longestStreak, saveStreak]);

  return {
    currentStreak,
    longestStreak,
    lastActivityDate,
    isStreakActive: isStreakActive(),
    checkIn,
    reset,
  };
}
