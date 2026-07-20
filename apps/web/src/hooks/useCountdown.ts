import { useEffect, useRef, useState } from 'react';

/**
 * Idle until `restart()` is called, then ticks down to 0 one second at a
 * time — used to disable "resend code" buttons for a cooldown.
 */
export function useCountdown(startSeconds: number) {
  const [seconds, setSeconds] = useState(0);
  const startSecondsRef = useRef(startSeconds);
  startSecondsRef.current = startSeconds;

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const restart = () => setSeconds(startSecondsRef.current);

  return { seconds, restart };
}
