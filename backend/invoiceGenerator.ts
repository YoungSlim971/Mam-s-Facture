import PDFDocument from 'pdfkit';
import { pipeline } from 'stream/promises';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { z } from 'zod';

/**
 * Data structure required to generate an invoice PDF.
 */
export interface InvoiceData {
  /** Text shown on the left of the top banner */
  bannerLeft?: string;
  /** Text shown on the right of the top banner */
  bannerRight?: string;
  /** Company name */
  nom_entreprise: string;
  /** Optional SIREN number */
  siren?: string;
  /** VAT number */
  vat_number?: string;
  /** Company address lines */
  adresse?: string[];
  /** Optional path to a logo image */
  logo_path?: string;
  /** Client name */
  nom_client: string;
  /** Client address lines */
  adresse_client?: string[];
  /** Invoice number */
  numero: string;
  /** Invoice date as ISO string */
  date: string;
  /** Invoice line items */
  lignes: { description: string; quantite: number; prix_unitaire: number }[];
  /** VAT rate (%) */
  tvaRate?: number;
  /** Due date */
  date_reglement: string;
  /** Sale date */
  date_vente: string;
  /** Late payment penalties */
  penalites: string;
}

const mm = (v: number): number => v * 2.83465;

const layout = {
  margin: mm(20),
  headerTop: mm(30),
  metaHeight: 20,
  footerHeight: mm(20),
};

const ligneSchema = z.object({
  description: z.string(),
  quantite: z.number().positive(),
  prix_unitaire: z.number().nonnegative(),
});

const invoiceSchema = z.object({
  bannerLeft: z.string().optional(),
  bannerRight: z.string().optional(),
  nom_entreprise: z.string(),
  siren: z.string().optional(),
  vat_number: z.string().optional(),
  adresse: z.array(z.string()).optional(),
  logo_path: z.string().optional(),
  nom_client: z.string(),
  adresse_client: z.array(z.string()).optional(),
  numero: z.string(),
  date: z.string(),
  lignes: z.array(ligneSchema).nonempty(),
  tvaRate: z.number().default(20).optional(),
  date_reglement: z.string(),
  date_vente: z.string(),
  penalites: z.string(),
});

export interface Totals {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

/**
 * Calculate totals for the provided invoice lines.
 */
export function computeTotals(
  lignes: InvoiceData['lignes'],
  tvaRate: number = 20
): Totals {
  const totalHT = lignes.reduce(
    (sum, l) => sum + l.quantite * l.prix_unitaire,
    0
  );
  const totalTVA = (totalHT * tvaRate) / 100;
  const totalTTC = totalHT + totalTVA;
  return { totalHT, totalTVA, totalTTC };
}

/**
 * Generate a PDF invoice matching the provided data.
 * @param data Information describing the invoice
 * @param opts.variant "company" for a company copy or "client" for the client original
 * @param opts.outPath Filesystem path where the PDF will be written
 */
export async function generateInvoicePDF(
  data: InvoiceData,
  opts: { variant?: 'client' | 'company'; outPath: string }
): Promise<void> {
  const parsed = invoiceSchema.parse(data);
  const { variant = 'client', outPath } = opts;

  const doc = new PDFDocument({ size: 'A4', margin: layout.margin });
  doc.font('Helvetica');
  const dir = path.dirname(outPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const writeStream = createWriteStream(outPath);
  const pipe = pipeline(doc, writeStream);

  const accent = '#0099b0';
  const pageWidth = doc.page.width - layout.margin * 2;

  const addWatermark = () => {
    if (variant === 'company') {
      const { width, height } = doc.page;
      doc.save();
      doc.fillColor('gray').opacity(0.3);
      doc.font('Helvetica-Bold').fontSize(60);
      doc.rotate(-45, { origin: [width / 2, height / 2] });
      doc.text('COPIE ENTREPRISE', 0, height / 2 - 30, {
        width,
        align: 'center',
      });
      doc.restore().opacity(1);
    }
  };
  addWatermark();
  doc.on('pageAdded', addWatermark);

  // Header
  doc.y = layout.headerTop;
  const leftX = layout.margin;
  const rightX = leftX + pageWidth / 2 + mm(10);

  doc.font('Helvetica-Bold').fontSize(14).fillColor('black');
  doc.text(parsed.nom_entreprise, leftX, doc.y);
  doc.fontSize(9).font('Helvetica');
  if (parsed.adresse) doc.text(parsed.adresse.join('\n'), leftX, doc.y);
  if (parsed.siren) doc.text(`SIREN : ${parsed.siren}`, leftX, doc.y);
  if (parsed.vat_number) doc.text(`TVA : ${parsed.vat_number}`, leftX, doc.y);

  doc.font('Helvetica-Bold').fontSize(10).text('Client :', rightX, layout.headerTop);
  doc.font('Helvetica').fontSize(9).text(parsed.nom_client, rightX, doc.y);
  if (parsed.adresse_client) doc.text(parsed.adresse_client.join('\n'), rightX, doc.y);

  // Logo
  const logoW = 70;
  const logoX = layout.margin + pageWidth - logoW;
  const logoY = layout.margin;
  doc.lineWidth(0.5);
  if (parsed.logo_path && existsSync(parsed.logo_path)) {
    doc.image(parsed.logo_path, logoX, logoY, { width: logoW });
  } else {
    doc.fillColor('#cccccc').rect(logoX, logoY, logoW, logoW * 0.4).stroke();
  }

  doc.moveDown();

  // Meta strip
  const metaY = doc.y + mm(5);
  doc
    .fillColor('#e0e0e0')
    .rect(layout.margin, metaY, pageWidth, layout.metaHeight)
    .fill();
  doc.fillColor('black');
  doc.font('Helvetica-Bold').text(`FACTURE N\u00b0 ${parsed.numero}`, layout.margin + 5, metaY + 4);
  const dateStr = new Intl.DateTimeFormat('fr-FR').format(new Date(parsed.date));
  const dateWidth = doc.widthOfString(`Date : ${dateStr}`) + 5;
  doc.text(`Date : ${dateStr}`, layout.margin + pageWidth - dateWidth, metaY + 4);
  doc.y = metaY + layout.metaHeight + mm(5);

  // Table setup
  const columnWidths = [
    pageWidth * 0.34,
    pageWidth * 0.09,
    pageWidth * 0.1,
    pageWidth * 0.15,
    pageWidth * 0.1,
    pageWidth * 0.22,
  ];

  const currency = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  });

  const drawTableHeader = () => {
    doc.fillColor('#f0f0f0').rect(layout.margin, doc.y, pageWidth, 16).fill();
    doc.fillColor('black').font('Helvetica-Bold').fontSize(9);
    const headers = ['Description', 'Qté', 'Unité', 'PU HT', '% TVA', 'TTC'];
    let x = layout.margin + 2;
    headers.forEach((h, i) => {
      doc.text(h, x, doc.y + 4, { width: columnWidths[i] - 4, align: i ? 'right' : 'left' });
      x += columnWidths[i];
    });
    doc.moveDown();
  };

  drawTableHeader();

  parsed.lignes.forEach((l, idx) => {
    if (doc.y > doc.page.height - layout.footerHeight - 100) {
      doc.addPage();
      drawTableHeader();
    }
    if (idx % 2 === 1) {
      doc.fillColor('#fafafa').rect(layout.margin, doc.y, pageWidth, 16).fill();
    }
    doc.fillColor('black').font('Helvetica').fontSize(9);
    let x = layout.margin + 2;
    const lineTotal = l.quantite * l.prix_unitaire * (1 + (parsed.tvaRate ?? 20) / 100);
    const values = [
      l.description,
      l.quantite.toString(),
      'u',
      currency.format(l.prix_unitaire),
      String(parsed.tvaRate ?? 20),
      currency.format(lineTotal),
    ];
    values.forEach((val, i) => {
      doc.text(val, x, doc.y + 4, { width: columnWidths[i] - 4, align: i ? 'right' : 'left' });
      x += columnWidths[i];
    });
    doc.moveDown();
  });

  // Totals
  const totals = computeTotals(parsed.lignes, parsed.tvaRate);
  const boxWidth = 140;
  const boxX = layout.margin + pageWidth - boxWidth;
  doc.moveDown();
  doc.rect(boxX, doc.y, boxWidth, 45).stroke();
  doc.text(`Total HT :`, boxX + 5, doc.y + 5, { continued: true });
  doc.text(currency.format(totals.totalHT), boxX + boxWidth - 5 - doc.widthOfString(currency.format(totals.totalHT)), doc.y);
  doc.text(`\nTVA (${parsed.tvaRate ?? 20} %) :`, boxX + 5, doc.y, { continued: true });
  doc.text(currency.format(totals.totalTVA), boxX + boxWidth - 5 - doc.widthOfString(currency.format(totals.totalTVA)), doc.y);
  doc.font('Helvetica-Bold');
  doc.text(`\nTotal TTC :`, boxX + 5, doc.y, { continued: true });
  doc.text(currency.format(totals.totalTTC), boxX + boxWidth - 5 - doc.widthOfString(currency.format(totals.totalTTC)), doc.y);

  // Footer
  const footerY = doc.page.height - layout.footerHeight;
  doc.font('Helvetica').fontSize(9);
  doc.text('Conditions de paiement : r\u00e8glement \u00e0 r\u00e9ception.', layout.margin, footerY - 15);
  doc.fillColor(accent).rect(layout.margin, footerY, pageWidth, 2).fill();

  doc.end();
  await pipe;
}
