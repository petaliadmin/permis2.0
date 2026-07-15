'use client';

import { useRef } from 'react';

interface CodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  /** Mask digits (PIN). */
  secret?: boolean;
  autoFocus?: boolean;
  /** Called when all boxes are filled. */
  onComplete?: (value: string) => void;
}

/**
 * Segmented numeric code input (OTP / PIN). Auto-advances on entry, supports
 * backspace navigation and paste. Mobile-friendly numeric keypad.
 */
export function CodeInput({
  length = 6,
  value,
  onChange,
  secret = false,
  autoFocus = false,
  onComplete,
}: CodeInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const chars = value.split('').slice(0, length);

  const setChar = (i: number, char: string) => {
    const next = value.split('');
    next[i] = char;
    const joined = next.join('').slice(0, length);
    onChange(joined);
    if (joined.length === length && !joined.includes('')) onComplete?.(joined);
  };

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    if (!digit) return;
    setChar(i, digit);
    if (i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (chars[i]) {
        setChar(i, '');
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
        setChar(i - 1, '');
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, length - 1);
    refs.current[focusIdx]?.focus();
    if (pasted.length === length) onComplete?.(pasted);
  };

  return (
    <div className="flex justify-center gap-2.5" role="group" aria-label="Code de sécurité">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type={secret ? 'password' : 'text'}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={chars[i] ?? ''}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          aria-label={`Chiffre ${i + 1}`}
          className="h-14 w-12 rounded-2xl border-2 border-token bg-surface-1 text-center font-display text-xl font-black text-foreground shadow-soft transition-colors focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
        />
      ))}
    </div>
  );
}
