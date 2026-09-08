'use client';

import { useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';

interface PaymentPanelProps {
  /** Payment link (Wave deep-link / hosted checkout). */
  link?: string;
  /** Provider-supplied QR as base64 PNG (no data: prefix). */
  qrCode?: string;
  methodLabel?: string;
  /** True while waiting for the webhook confirmation. */
  pending: boolean;
  onCancel: () => void;
  /** Dev only — force the purchase to PAID without a real payment. */
  devConfirm?: () => void;
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
  pending,
  onCancel,
  devConfirm,
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
        Paie avec {methodLabel || 'Wave / Orange Money'} — scanne le QR code, ou ouvre le lien
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
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full"
          >
            Ouvrir le lien de paiement
          </a>
          <button
            type="button"
            onClick={copy}
            className="btn-ghost w-full !py-2.5 text-xs"
          >
            <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} aria-hidden="true" />
            {copied ? 'Lien copié' : 'Copier le lien'}
          </button>
        </div>
      )}

      {pending && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-surface-2 p-3">
          <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
          <p className="text-xs text-secondary">
            En attente de la confirmation du paiement… (l&apos;accès se débloque
            automatiquement)
          </p>
        </div>
      )}

      {devConfirm && (
        <button type="button" onClick={devConfirm} className="btn-ghost mt-4 w-full">
          Simuler la confirmation (dev)
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
