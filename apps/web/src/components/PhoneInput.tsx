'use client';

import { useId, useMemo, useState } from 'react';

interface Country {
  code: string; // dial code without +
  label: string; // flag + name
}

// Senegal first (the app's market), then neighbours. No flag emoji — Windows
// browsers render regional-indicator pairs as bare letters ("SN"), not a flag.
const COUNTRIES: Country[] = [
  { code: '221', label: 'Sénégal +221' },
  { code: '220', label: 'Gambie +220' },
  { code: '223', label: 'Mali +223' },
  { code: '224', label: 'Guinée +224' },
  { code: '222', label: 'Mauritanie +222' },
  { code: '245', label: 'Guinée-Bissau +245' },
  { code: '238', label: 'Cap-Vert +238' },
  { code: '225', label: "Côte d'Ivoire +225" },
];

/** Split an E.164-ish string into a known dial code + the national part. */
function parse(value: string): { code: string; national: string } {
  const digits = value.replace(/[^\d]/g, '');
  for (const c of COUNTRIES) {
    if (digits.startsWith(c.code)) return { code: c.code, national: digits.slice(c.code.length) };
  }
  return { code: '221', national: digits };
}

function groupSn(d: string): string {
  // 77 123 45 67
  return d
    .replace(/(\d{2})(\d{0,3})(\d{0,2})(\d{0,2}).*/, (_, a, b, c, e) =>
      [a, b, c, e].filter(Boolean).join(' ')
    )
    .trim();
}

interface PhoneInputProps {
  value: string;
  onChange: (e164: string) => void;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  id?: string;
}

export function PhoneInput({
  value,
  onChange,
  label,
  placeholder = '77 123 45 67',
  autoFocus,
  disabled,
  id,
}: PhoneInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const parsed = useMemo(() => parse(value), [value]);
  const [code, setCode] = useState(parsed.code);

  const national = parsed.national;
  const emit = (nextCode: string, nextNational: string) => {
    const clean = nextNational.replace(/[^\d]/g, '');
    onChange(clean ? `+${nextCode}${clean}` : '');
  };

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-xs font-bold text-secondary">
          {label}
        </label>
      )}
      <div className="flex items-stretch gap-2">
        <select
          aria-label="Indicatif pays"
          value={code}
          disabled={disabled}
          onChange={(e) => {
            setCode(e.target.value);
            emit(e.target.value, national);
          }}
          className="shrink-0 rounded-xl border border-token bg-surface-2 px-2.5 text-sm font-semibold text-foreground focus:border-primary-400 focus:outline-none"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          id={inputId}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          disabled={disabled}
          value={code === '221' ? groupSn(national) : national}
          onChange={(e) => emit(code, e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-token bg-surface-2 px-3.5 text-sm text-foreground placeholder:text-muted focus:border-primary-400 focus:outline-none disabled:opacity-50"
        />
      </div>
    </div>
  );
}
