'use client';

import { useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';

interface PrimaryAction {
  label: string;
  onClick: () => void;
  busy?: boolean;
}

interface PaymentPanelProps {
  /** Payment link (Wave merchant checkout / deep-link). */
  link?: string;
  /** Optional pre-rendered QR as base64 PNG (no data: prefix). Falls back to a
   *  QR generated from `link`. */
  qrCode?: string;
  methodLabel?: string;
  /** Short line under the QR, e.g. what happens after paying. */
  note?: string;
  /** Main button (e.g. "J'ai payé"). */
  primaryAction?: PrimaryAction;
  onCancel: () => void;
}

function qrDataUrl(text: string): string | null {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createDataURL(5, 12);
  } catch {
    return null;
  }
}

export function PaymentPanel({
  link,
  qrCode,
  methodLabel,
  note,
  primaryAction,
  onCancel,
}: PaymentPanelProps) {
  const [copied, setCopied] = useState(false);

  const qrSrc = useMemo(() => {
    if (qrCode) return `data:image/png;base64,${qrCode}`;
    if (link) return qrDataUrl(link);
    return null;
  }, [qrCode, link]);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the link stays visible below */
    }
  };

  return (
    <div className="py-2">
      <p className="text-center text-sm text-secondary">
        Paie avec {methodLabel || 'Wave'} — scanne le QR code, ou ouvre le lien
        {link ? ' sur ce téléphone' : ''}.
      </p>

      {qrSrc && (
        <div className="mx-auto mt-4 w-fit rounded-2xl border border-token bg-white p-3 shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="QR code de paiement" className="h-44 w-44" />
        </div>
      )}

      {link && (
        <div className="mt-4 space-y-2">
          <a href={link} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
            Ouvrir le lien de paiement
          </a>
          <button type="button" onClick={copy} className="btn-ghost w-full !py-2.5 text-xs">
            <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} aria-hidden="true" />
            {copied ? 'Lien copié' : 'Copier le lien'}
          </button>
        </div>
      )}

      {note && (
        <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-center text-xs text-secondary">
          {note}
        </p>
      )}

      {primaryAction && (
        <button
          type="button"
          onClick={primaryAction.onClick}
          disabled={primaryAction.busy}
          className="btn-primary mt-4 w-full disabled:opacity-50"
        >
          {primaryAction.busy ? 'Un instant…' : primaryAction.label}
        </button>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="mt-3 w-full py-2 text-center text-sm text-muted hover:text-secondary"
      >
        Annuler
      </button>
    </div>
  );
}
