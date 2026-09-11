'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { SchoolMemberRole } from '@permis2.0/types';
import { Sheet } from '@permis2.0/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type ImportKind = 'students' | 'members' | 'vehicles';

interface FieldConfig {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
}

const ROLE_FROM_LABEL: Record<string, SchoolMemberRole> = {
  manager: SchoolMemberRole.MANAGER,
  secretaire: SchoolMemberRole.SECRETARY,
  moniteur: SchoolMemberRole.INSTRUCTOR,
  instructeur: SchoolMemberRole.INSTRUCTOR,
  coach: SchoolMemberRole.COACH,
  comptable: SchoolMemberRole.ACCOUNTANT,
};

const FIELDS: Record<ImportKind, FieldConfig[]> = {
  students: [
    { key: 'name', label: 'Nom', required: true, aliases: ['nom', 'name', 'eleve', 'élève'] },
    { key: 'phone', label: 'Téléphone', required: true, aliases: ['telephone', 'téléphone', 'phone', 'tel'] },
    {
      key: 'licenseCategory',
      label: 'Catégorie',
      required: false,
      aliases: ['categorie', 'catégorie', 'category', 'permis'],
    },
  ],
  members: [
    { key: 'name', label: 'Nom', required: true, aliases: ['nom', 'name', 'moniteur'] },
    { key: 'phone', label: 'Téléphone', required: true, aliases: ['telephone', 'téléphone', 'phone', 'tel'] },
    { key: 'role', label: 'Rôle', required: true, aliases: ['role', 'rôle', 'fonction'] },
  ],
  vehicles: [
    { key: 'plate', label: 'Immatriculation', required: true, aliases: ['immatriculation', 'plate', 'plaque'] },
    { key: 'brand', label: 'Marque', required: false, aliases: ['marque', 'brand'] },
    { key: 'model', label: 'Modèle', required: false, aliases: ['modele', 'modèle', 'model'] },
    { key: 'category', label: 'Catégorie', required: false, aliases: ['categorie', 'catégorie', 'category'] },
  ],
};

const ENDPOINT: Record<ImportKind, string> = {
  students: 'students',
  members: 'members',
  vehicles: 'vehicles',
};

const TITLE: Record<ImportKind, string> = {
  students: 'Importer des élèves',
  members: "Importer de l'équipe",
  vehicles: 'Importer des véhicules',
};

const COMBINING_DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

const normalize = (s: string) => s.normalize('NFD').replace(COMBINING_DIACRITICS, '').toLowerCase().trim();

function autoMapColumns(headers: string[], fields: FieldConfig[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const field of fields) {
    const match = headers.find((h) => field.aliases.includes(normalize(h)));
    if (match) map[field.key] = match;
  }
  return map;
}

type Row = Record<string, string>;

interface ImportSheetProps {
  schoolId: string;
  kind: ImportKind;
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function ImportSheet({ schoolId, kind, open, onClose, onImported }: ImportSheetProps) {
  const fields = FIELDS[kind];
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<{ ok: number; failed: number; errors: string[] } | null>(null);

  const reset = () => {
    setHeaders([]);
    setMapping({});
    setRows([]);
    setError('');
    setSummary(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = async (file: File) => {
    setError('');
    setSummary(null);
    try {
      const buf = await file.arrayBuffer();
      const workbook = XLSX.read(buf, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Row>(sheet, { defval: '', raw: false });
      if (data.length === 0) {
        setError('Fichier vide ou illisible.');
        return;
      }
      const fileHeaders = Object.keys(data[0]);
      setHeaders(fileHeaders);
      setMapping(autoMapColumns(fileHeaders, fields));
      setRows(data.slice(0, 500));
    } catch {
      setError("Impossible de lire ce fichier. Utilisez un .csv, .xlsx ou .xls.");
    }
  };

  const mappedRows = rows.map((row) => {
    const out: Row = {};
    for (const field of fields) {
      out[field.key] = mapping[field.key] ? String(row[mapping[field.key]] ?? '').trim() : '';
    }
    return out;
  });

  const missingRequired = fields.some((f) => f.required && !mapping[f.key]);

  const updateCell = (index: number, key: string, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      const sourceCol = mapping[key];
      if (!sourceCol) return prev;
      next[index] = { ...next[index], [sourceCol]: value };
      return next;
    });
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      let body: unknown;
      if (kind === 'vehicles') {
        body = { rows: mappedRows.filter((r) => r.plate).map((r) => ({ ...r, plate: r.plate.trim() })) };
      } else if (kind === 'members') {
        body = {
          rows: mappedRows
            .filter((r) => r.name && r.phone)
            .map((r) => ({
              name: r.name,
              phone: r.phone,
              role: ROLE_FROM_LABEL[normalize(r.role)] ?? SchoolMemberRole.INSTRUCTOR,
            })),
        };
      } else {
        body = { rows: mappedRows.filter((r) => r.name && r.phone) };
      }

      const res = await fetch(`${API_URL}/schools/${schoolId}/${ENDPOINT[kind]}/bulk`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Échec de l'import.");
      }
      const results: { index: number; ok: boolean; error?: string }[] = await res.json();
      const ok = results.filter((r) => r.ok).length;
      const failed = results.filter((r) => !r.ok);
      setSummary({
        ok,
        failed: failed.length,
        errors: failed.map((f) => `Ligne ${f.index + 2} : ${f.error ?? 'erreur inconnue'}`),
      });
      onImported();
    } catch (e: any) {
      setError(e.message || "Échec de l'import.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      ariaLabel={TITLE[kind]}
    >
      <p className="font-display text-lg font-bold text-foreground">{TITLE[kind]}</p>
      <p className="mt-1 text-xs text-secondary">Fichier .csv, .xlsx ou .xls — les colonnes sont détectées automatiquement.</p>

      {rows.length === 0 ? (
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-token bg-surface-2 px-4 py-10 text-center">
          <i className="ti ti-file-spreadsheet text-2xl text-secondary" aria-hidden="true" />
          <span className="text-sm font-bold text-foreground">Choisir un fichier</span>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      ) : (
        <div className="mt-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-bold text-secondary">
                  {f.label}
                  {f.required ? ' *' : ''}
                </label>
                <select
                  value={mapping[f.key] ?? ''}
                  onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                  className="w-full rounded-xl border border-token bg-surface-2 px-3 py-2 text-xs focus:border-primary-400 focus:outline-none"
                >
                  <option value="">— Colonne —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-token">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-2">
                <tr>
                  {fields.map((f) => (
                    <th key={f.key} className="px-2 py-1.5 text-left font-bold text-secondary">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mappedRows.map((row, i) => (
                  <tr key={i} className="border-t border-token">
                    {fields.map((f) => (
                      <td key={f.key} className="px-1 py-1">
                        <input
                          value={row[f.key]}
                          onChange={(e) => updateCell(i, f.key, e.target.value)}
                          className="w-full rounded-lg border border-transparent bg-transparent px-1.5 py-1 hover:border-token focus:border-primary-400 focus:outline-none"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1.5 text-xs text-muted">{rows.length} ligne(s) détectée(s).</p>

          {missingRequired && (
            <p className="mt-2 text-xs font-medium text-danger">
              Associez toutes les colonnes obligatoires (*) avant d&apos;importer.
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-danger">{error}</p>
      )}

      {summary && (
        <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">
          <p className="font-bold text-success">{summary.ok} ligne(s) importée(s)</p>
          {summary.failed > 0 && (
            <>
              <p className="mt-1 font-bold text-danger">{summary.failed} erreur(s)</p>
              <ul className="mt-1 list-inside list-disc text-xs text-secondary">
                {summary.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-4 flex gap-2">
          <button onClick={reset} className="btn-ghost !px-4">
            Recommencer
          </button>
          <button
            onClick={submit}
            disabled={busy || missingRequired}
            className="btn-primary flex-1"
          >
            {busy ? 'Import…' : `Importer ${rows.length} ligne(s)`}
          </button>
        </div>
      )}
    </Sheet>
  );
}
