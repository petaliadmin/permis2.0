'use client';

import { useState } from 'react';
import type { Vehicle } from '@permis2.0/types';
import { VehicleStatus } from '@permis2.0/types';
import { EmptyState, Sheet, Skeleton } from '@permis2.0/ui';
import { cn } from '@/lib/cn';
import { ImportSheet } from './ImportSheet';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'En service',
  MAINTENANCE: 'En entretien',
  OUT_OF_SERVICE: 'Hors service',
};

const STATUS_CHIP: Record<string, string> = {
  ACTIVE: 'chip-success',
  MAINTENANCE: 'chip-orange',
  OUT_OF_SERVICE: 'chip-danger',
};

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

/** Converts a Date/ISO string to a yyyy-mm-dd value for a native <input type="date">. */
const toDateInput = (d?: string | Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const emptyForm = {
  plate: '',
  brand: '',
  model: '',
  category: '',
  status: VehicleStatus.ACTIVE as string,
  insuranceExpiresAt: '',
  technicalInspectionExpiresAt: '',
  notes: '',
};

interface VehiclesPanelProps {
  schoolId: string;
  vehicles: Vehicle[] | null;
  onChanged: () => void;
}

export function VehiclesPanel({ schoolId, vehicles, onChanged }: VehiclesPanelProps) {
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setFormOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      plate: v.plate,
      brand: v.brand ?? '',
      model: v.model ?? '',
      category: v.category ?? '',
      status: v.status,
      insuranceExpiresAt: toDateInput(v.insuranceExpiresAt),
      technicalInspectionExpiresAt: toDateInput(v.technicalInspectionExpiresAt),
      notes: v.notes ?? '',
    });
    setError('');
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.plate.trim()) return setError("L'immatriculation est obligatoire.");
    setBusy(true);
    setError('');
    try {
      const body = {
        plate: form.plate.trim(),
        brand: form.brand || undefined,
        model: form.model || undefined,
        category: form.category || undefined,
        status: form.status,
        insuranceExpiresAt: form.insuranceExpiresAt || undefined,
        technicalInspectionExpiresAt: form.technicalInspectionExpiresAt || undefined,
        notes: form.notes || undefined,
      };
      const res = await fetch(
        `${API_URL}/schools/${schoolId}/vehicles${editing ? `/${editing.id}` : ''}`,
        {
          method: editing ? 'PATCH' : 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Une erreur est survenue.');
      }
      setFormOpen(false);
      onChanged();
    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!editing || !confirm(`Retirer ${editing.plate} de la flotte ?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/schools/${schoolId}/vehicles/${editing.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setFormOpen(false);
        onChanged();
      }
    } finally {
      setBusy(false);
    }
  };

  if (vehicles === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2">
        <button onClick={() => setImportOpen(true)} className="btn-ghost !px-4 !py-2 text-xs">
          <i className="ti ti-file-spreadsheet" aria-hidden="true" />
          Importer
        </button>
        <button onClick={openCreate} className="btn-ghost !px-4 !py-2 text-xs">
          <i className="ti ti-plus" aria-hidden="true" />
          Ajouter un véhicule
        </button>
      </div>

      {vehicles.length === 0 ? (
        <EmptyState
          icon={<i className="ti ti-car" aria-hidden="true" />}
          title="Aucun véhicule"
          description="Ajoutez les véhicules de votre flotte pour suivre leurs échéances."
        />
      ) : (
        <div className="space-y-2.5">
          {vehicles.map((v) => (
            <button
              key={v.id}
              onClick={() => openEdit(v)}
              className="flex w-full items-center justify-between rounded-2xl border border-token bg-surface-1 p-4 text-left shadow-soft transition-colors hover:border-primary-200"
            >
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-foreground">
                  {v.plate}
                  {(v.brand || v.model) && (
                    <span className="ml-1.5 font-normal text-secondary">
                      {[v.brand, v.model].filter(Boolean).join(' ')}
                    </span>
                  )}
                </p>
                <p className="text-xs text-secondary">
                  {v.category ? `Permis ${v.category}` : 'Catégorie non renseignée'}
                </p>
                {(v.insuranceExpiringSoon || v.inspectionExpiringSoon) && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-danger">
                    <i className="ti ti-alert-triangle" aria-hidden="true" />
                    {v.insuranceExpiringSoon && v.inspectionExpiringSoon
                      ? 'Assurance et visite technique à renouveler'
                      : v.insuranceExpiringSoon
                        ? 'Assurance à renouveler'
                        : 'Visite technique à renouveler'}
                  </p>
                )}
              </div>
              <span className={cn('chip shrink-0', STATUS_CHIP[v.status])}>
                {STATUS_LABEL[v.status]}
              </span>
            </button>
          ))}
        </div>
      )}

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        ariaLabel={editing ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
      >
        <p className="font-display text-lg font-bold text-foreground">
          {editing ? editing.plate : 'Ajouter un véhicule'}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Immatriculation</label>
            <input
              value={form.plate}
              onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value }))}
              placeholder="DK-1234-AB"
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Catégorie</label>
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="B"
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Marque</label>
            <input
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Modèle</label>
            <input
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Assurance jusqu&apos;au</label>
            <input
              type="date"
              value={form.insuranceExpiresAt}
              onChange={(e) => setForm((f) => ({ ...f, insuranceExpiresAt: e.target.value }))}
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-secondary">Visite technique jusqu&apos;au</label>
            <input
              type="date"
              value={form.technicalInspectionExpiresAt}
              onChange={(e) =>
                setForm((f) => ({ ...f, technicalInspectionExpiresAt: e.target.value }))
              }
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
          {editing && (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-secondary">Statut</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(VehicleStatus).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                    className={cn('chip', form.status === s ? 'chip-primary' : 'bg-surface-2 text-secondary')}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold text-secondary">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-token bg-surface-2 px-3.5 py-2.5 text-sm focus:border-primary-400 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">{error}</p>
        )}

        <div className="mt-4 flex gap-2">
          {editing && (
            <button onClick={remove} disabled={busy} className="btn-danger !px-4">
              Retirer
            </button>
          )}
          <button onClick={submit} disabled={busy} className="btn-primary flex-1">
            {busy ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>

        {editing && (
          <p className="mt-3 text-center text-xs text-muted">
            Ajouté le {fmtDate(editing.createdAt)}
          </p>
        )}
      </Sheet>

      <ImportSheet
        schoolId={schoolId}
        kind="vehicles"
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={onChanged}
      />
    </div>
  );
}
