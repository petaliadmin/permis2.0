'use client';

import { useSettingsStore } from '@/store/settingsStore';
import { startBackgroundMusic, stopBackgroundMusic } from '@/lib/backgroundMusic';
import { haptic } from '@permis2.0/hooks';
import { IconMusic, IconMusicOff } from '@tabler/icons-react';

/** Lets the player stop/resume the background gaming loop mid-session. */
export function MusicToggleButton({ className = '' }: { className?: string }) {
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const setMusicEnabled = useSettingsStore((s) => s.setMusicEnabled);

  const toggle = () => {
    haptic.tap();
    const next = !musicEnabled;
    setMusicEnabled(next);
    if (next) startBackgroundMusic();
    else stopBackgroundMusic();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={musicEnabled ? 'Couper la musique' : 'Activer la musique'}
      aria-pressed={musicEnabled}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-secondary transition-colors ${className}`}
    >
      {musicEnabled ? (
        <IconMusic size="1em" className="text-base" aria-hidden="true" />
      ) : (
        <IconMusicOff size="1em" className="text-base" aria-hidden="true" />
      )}
    </button>
  );
}
