'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Plays a pre-recorded Wolof audio file if it exists under /public.
 * The button using this hook should only render when `available` is true,
 * so the UI stays clean while recordings are being produced.
 *
 * File conventions (drop the .mp3 files in, nothing else to do):
 *   - Panneaux : /audio/wolof/panneaux/<code>.mp3   (ex: AB4.mp3)
 *   - Leçons   : /audio/wolof/lecons/<lessonId>.mp3
 */
export function useWolofAudio(url: string | null) {
  const [available, setAvailable] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setAvailable(false);
    setPlaying(false);
    audioRef.current?.pause();
    audioRef.current = null;
    if (!url) return;

    let cancelled = false;
    fetch(url, { method: 'HEAD' })
      .then((r) => {
        // Guard against SPA fallbacks that return 200 with an HTML body
        const type = r.headers.get('content-type') ?? '';
        if (!cancelled && r.ok && !type.includes('text/html')) setAvailable(true);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [url]);

  const toggle = () => {
    if (!url || !available) return;
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    // Stop any French TTS before playing the recording
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    const audio = audioRef.current ?? new Audio(url);
    audioRef.current = audio;
    audio.currentTime = 0;
    audio.onended = () => setPlaying(false);
    audio.onerror = () => {
      setPlaying(false);
      setAvailable(false);
    };
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  };

  const stop = () => {
    audioRef.current?.pause();
    setPlaying(false);
  };

  return { available, playing, toggle, stop };
}
