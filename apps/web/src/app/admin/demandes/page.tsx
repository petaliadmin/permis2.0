'use client';

import { useCallback, useEffect, useState } from 'react';
import { Skeleton } from '@permis2.0/ui';
import { adminFetch, fmtXof, Toast, useToast, AdminPageHeader } from '../adminShared';

interface PendingPurchase {
  id: string;
  amountXof: number;
  method: string | null;
  provider: string;
  createdAt: string;
  user: { id: string; name: string; phone: string | null; email: string | null };
  product: { title: string; sku: string };
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function AdminDemandesPage() {
  const [toast, flash] = useToast();
  const [purchases, setPurchases] = useState<PendingPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminFetch<PendingPurchase[]>('/admin/purchases?status=PENDING')
      .then(setPurchases)
      .catch((e) => flash(e.message))
      .finally(() => setLoading(false));
  }, [flash]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirm = async (p: PendingPurchase) => {
    setConfirming(p.id);
    try {
      await adminFetch(`/admin/purchases/${p.id}/confirm`, { method: 'POST' });
      flash(`Abonnement activé pour ${p.user.name}.`);
      setPurchases((list) => list.filter((x) => x.id !== p.id));
    } catch (e: any) {
      flash(e.message);
    } finally {
      setConfirming(null);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Demandes d'abonnement"
        subtitle={
          loading
            ? 'Chargement…'
            : purchases.length > 0
              ? `${purchases.length} demande${purchases.length > 1 ? 's' : ''} en attente d'activation`
              : 'Aucune demande en attente'
        }
      />

      {loading && <Skeleton className="h-40 w-full rounded-2xl" />}

      {!loading && purchases.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-token bg-surface-1 py-16 text-center shadow-soft">
          <i className="ti ti-circle-check text-4xl text-success-500" aria-hidden="true" />
          <p className="mt-3 font-display text-base font-bold text-foreground">
            Tout est à jour
          </p>
          <p className="mt-1 text-sm text-secondary">
            Aucune demande d&apos;abonnement en attente d&apos;activation.
          </p>
        </div>
      )}

      {!loading && purchases.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-token bg-surface-1 shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-token bg-surface-2/60 text-left text-[11px] font-bold uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-bold">Utilisateur</th>
                <th className="px-4 py-3 font-bold">Contact</th>
                <th className="px-4 py-3 font-bold">Produit</th>
                <th className="px-4 py-3 font-bold">Montant</th>
                <th className="px-4 py-3 font-bold">Reçu le</th>
                <th className="px-4 py-3 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-token">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-surface-2/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-50 text-sm font-black text-success-700 dark:bg-success-900/20 dark:text-success-400">
                        {p.user.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span className="font-bold text-foreground">{p.user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {p.user.phone ? `+221 ${p.user.phone}` : (p.user.email ?? '—')}
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {p.product.title}
                    {p.method === 'whatsapp' && (
                      <i
                        className="ti ti-brand-whatsapp ml-1.5 text-[#25D366]"
                        aria-hidden="true"
                        title="Demande via WhatsApp"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-foreground">{fmtXof(p.amountXof)}</td>
                  <td className="px-4 py-3 text-xs text-muted">{fmtDate(p.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => confirm(p)}
                      disabled={confirming === p.id}
                      className="rounded-lg bg-success-50 px-3.5 py-2 text-xs font-bold text-success-700 transition-colors hover:bg-success-100 disabled:opacity-40 dark:bg-success-900/20 dark:text-success-400"
                    >
                      {confirming === p.id ? 'Activation…' : '✓ Confirmer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast message={toast} />
    </>
  );
}
