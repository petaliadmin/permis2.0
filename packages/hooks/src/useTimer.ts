import { useEffect, useState, useCallback } from 'react';

export interface UseTimerOptions {
  initialSeconds?: number;
  onComplete?: () => void;
  onTick?: (remainingSeconds: number) => void;
}

export function useTimer({ initialSeconds = 0, onComplete, onTick }: UseTimerOptions = {}) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || seconds <= 0) {
      if (seconds === 0 && isRunning) {
        setIsRunning(false);
        onComplete?.();
      }
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const newSeconds = prev - 1;
        onTick?.(newSeconds);
        if (newSeconds === 0) {
          setIsRunning(false);
          onComplete?.();
        }
        return newSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onComplete, onTick]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    setIsRunning(true);
  }, []);

  const reset = useCallback(
    (newSeconds?: number) => {
      setIsRunning(false);
      setSeconds(newSeconds ?? initialSeconds);
    },
    [initialSeconds]
  );

  return {
    seconds,
    isRunning,
    start,
    pause,
    resume,
    reset,
  };
}
