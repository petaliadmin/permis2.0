import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { School, SchoolPayment, SchoolPaymentItem, SchoolPersonRef } from '@permis2.0/types';
import { SchoolPaymentType } from '@permis2.0/types';

const fmtXof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;
const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

const personName = (p?: SchoolPersonRef | null) => p?.user?.name ?? p?.guestName ?? 'Client';
const personPhone = (p?: SchoolPersonRef | null) => p?.user?.phone ?? p?.guestPhone ?? '';

/** Builds a clean one-page devis/facture PDF and returns it as a Blob. */
export function generateInvoicePdf(
  school: Pick<School, 'name' | 'address' | 'city' | 'phone' | 'email'>,
  payment: Pick<
    SchoolPayment,
    'type' | 'number' | 'description' | 'items' | 'amountXof' | 'dueDate' | 'notes' | 'createdAt'
  >,
  student: SchoolPersonRef | undefined
): Blob {
  const doc = new jsPDF();
  const isDevis = payment.type === SchoolPaymentType.DEVIS;
  const title = isDevis ? 'DEVIS' : 'FACTURE';

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(school.name || 'PERMIS 2.0', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const schoolLines = [school.address, school.city, school.phone, school.email]
    .filter(Boolean)
    .join(' · ');
  if (schoolLines) doc.text(schoolLines, 14, 27);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 196, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (payment.number) doc.text(`N° ${payment.number}`, 196, 27, { align: 'right' });
  doc.text(fmtDate(payment.createdAt), 196, 33, { align: 'right' });

  doc.setDrawColor(200);
  doc.line(14, 38, 196, 38);

  doc.setFont('helvetica', 'bold');
  doc.text(isDevis ? 'Destinataire' : 'Facturé à', 14, 47);
  doc.setFont('helvetica', 'normal');
  doc.text(personName(student), 14, 53);
  const phone = personPhone(student);
  if (phone) doc.text(phone, 14, 59);

  const items: SchoolPaymentItem[] = payment.items?.length
    ? payment.items
    : [{ label: payment.description, qty: 1, unitPriceXof: payment.amountXof }];

  autoTable(doc, {
    startY: 68,
    head: [['Description', 'Qté', 'Prix unitaire', 'Total']],
    body: items.map((i) => [
      i.label,
      String(i.qty),
      fmtXof(i.unitPriceXof),
      fmtXof(i.qty * i.unitPriceXof),
    ]),
    foot: [['', '', 'Total', fmtXof(payment.amountXof)]],
    headStyles: { fillColor: [124, 58, 237] },
    footStyles: { fillColor: [245, 245, 245], textColor: 20, fontStyle: 'bold' },
    styles: { fontSize: 10 },
  });

  const afterTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  if (payment.dueDate) {
    doc.text(`Échéance : ${fmtDate(payment.dueDate)}`, 14, afterTableY);
  }
  if (payment.notes) {
    doc.text(doc.splitTextToSize(payment.notes, 180), 14, afterTableY + (payment.dueDate ? 8 : 0));
  }

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Généré via PERMIS 2.0', 14, 287);

  return doc.output('blob');
}

export function invoiceFilename(payment: Pick<SchoolPayment, 'type' | 'number'>): string {
  const prefix = payment.type === SchoolPaymentType.DEVIS ? 'devis' : 'facture';
  return `${prefix}-${payment.number ?? Date.now()}.pdf`;
}
