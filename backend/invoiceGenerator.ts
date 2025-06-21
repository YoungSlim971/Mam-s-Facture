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
  opts: { variant: 'company' | 'client'; outPath: string }
): Promise<void> {
  const parsed = invoiceSchema.parse(data);
  const { variant, outPath } = opts;
  const doc = new PDFDocument({ margin: mm(15), size: 'A4' });
  const dir = path.dirname(outPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const writeStream = createWriteStream(outPath);
  const pipe = pipeline(doc, writeStream);

  const watermarkText =
    variant === 'company' ? 'COPIE ENTREPRISE' : 'ORIGINAL CLIENT';
  const addWatermark = () => {
    const { width, height } = doc.page;
    doc.save();
    doc.fillColor('gray').opacity(0.3);
    doc.font('Helvetica-Bold').fontSize(70);
    doc.rotate(-45, { origin: [width / 2, height / 2] });
    doc.text(watermarkText, 0, height / 2 - 35, {
      width,
      align: 'center',
    });
    doc.opacity(1).restore();
  };
  addWatermark();
  doc.on('pageAdded', addWatermark);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const startX = doc.page.margins.left;

  // Top banner
  const bannerHeight = 22;
  doc.lineWidth(1);
  doc.rect(startX, doc.y, pageWidth, bannerHeight).stroke();
  doc.rect(startX, doc.y, pageWidth / 2, bannerHeight).fill('#e0e0e0');
  doc.rect(startX + pageWidth / 2, doc.y, pageWidth / 2, bannerHeight).fill('#e0e0e0');
  doc
    .fillColor('black')
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(parsed.bannerLeft ?? '', startX, doc.y + 6, {
      width: pageWidth / 2,
      align: 'center',
    });
  doc.text(parsed.bannerRight ?? '', startX + pageWidth / 2, doc.y + 6, {
    width: pageWidth / 2,
    align: 'center',
  });
  doc.moveDown(1.5);

  // Info boxes
  const boxSize = 95; // points ~ 33mm
  const boxY = doc.y;
  const rightBoxX = startX + pageWidth - boxSize;
  doc.lineWidth(0.5);
  doc.rect(startX, boxY, boxSize, boxSize).stroke();
  doc.rect(rightBoxX, boxY, boxSize, boxSize).stroke();
  doc.font('Helvetica-Bold').text('Identification de l\u2019entrepreneur', startX, boxY + 5, {
    width: boxSize,
    align: 'center',
  });
  doc
    .font('Helvetica')
    .text((parsed.adresse ?? []).join('\n'), startX + 5, boxY + 25, {
      width: boxSize - 10,
    });
  doc
    .font('Helvetica-Bold')
    .text('Client :', rightBoxX, boxY + 5, { width: boxSize, align: 'center' });
  doc
    .font('Helvetica')
    .text((parsed.adresse_client ?? []).join('\n'), rightBoxX + 5, boxY + 25, {
      width: boxSize - 10,
    });
  doc.y = boxY + boxSize + 10;

  // Invoice meta
  const metaY = doc.y;
  const factLabel = `FACTURE N\u00b0${parsed.numero}`;
  const labelWidth = doc.widthOfString(factLabel) + 10;
  doc.rect(startX, metaY, labelWidth, 16).stroke();
  doc.font('Helvetica-Bold').text(factLabel, startX + 5, metaY + 3);
  const dateText = `Date : ${parsed.date}`;
  doc
    .font('Helvetica')
    .text(dateText, startX + pageWidth - doc.widthOfString(dateText), metaY + 3);
  doc.y = metaY + 20;

  // Table header
  const rowHeight = 18;
  const columnWidths = [pageWidth * 0.4, pageWidth * 0.2, pageWidth * 0.2, pageWidth * 0.2];

  const drawHeader = (y: number) => {
    doc.lineWidth(0.5);
    doc.font('Helvetica-Bold');
    doc.text('D\u00e9signation', startX, y, { width: columnWidths[0] });
    doc.text('Quantit\u00e9', startX + columnWidths[0], y, {
      width: columnWidths[1],
      align: 'right',
    });
    doc.text('Prix unitaire HT', startX + columnWidths[0] + columnWidths[1], y, {
      width: columnWidths[2],
      align: 'right',
    });
    doc.text('Total HT', startX + columnWidths[0] + columnWidths[1] + columnWidths[2], y, {
      width: columnWidths[3],
      align: 'right',
    });
    doc
      .moveTo(startX, y + rowHeight)
      .lineTo(startX + pageWidth, y + rowHeight)
      .stroke();
  };

  let y = doc.y;
  drawHeader(y);
  y += rowHeight;

  const currency = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  });

  for (const ligne of parsed.lignes) {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom - 150) {
      doc.addPage();
      y = doc.y;
      drawHeader(y);
      y += rowHeight;
    }
    doc.font('Helvetica');
    doc.text(ligne.description, startX, y, { width: columnWidths[0] });
    doc.text(String(ligne.quantite), startX + columnWidths[0], y, {
      width: columnWidths[1],
      align: 'right',
    });
    doc.text(currency.format(ligne.prix_unitaire), startX + columnWidths[0] + columnWidths[1], y, {
      width: columnWidths[2],
      align: 'right',
    });
    doc.text(
      currency.format(ligne.quantite * ligne.prix_unitaire),
      startX + columnWidths[0] + columnWidths[1] + columnWidths[2],
      y,
      { width: columnWidths[3], align: 'right' }
    );
    doc
      .moveTo(startX, y + rowHeight)
      .lineTo(startX + pageWidth, y + rowHeight)
      .stroke();
    y += rowHeight;
  }
  doc.y = y + 10;

  // Totals block
  const totals = computeTotals(
    parsed.lignes as { description: string; quantite: number; prix_unitaire: number }[],
    parsed.tvaRate
  );
  const col1 = pageWidth * 0.5;
  const col2 = pageWidth * 0.25;
  const col3 = pageWidth - col1 - col2;
  doc.font('Helvetica-Bold').text('Total HT', startX + col1, doc.y, {
    width: col2,
    align: 'right',
  });
  doc.text(currency.format(totals.totalHT), startX + col1 + col2, doc.y, {
    width: col3,
    align: 'right',
  });
  doc.moveDown(1);
  doc.font('Helvetica').text(`TVA ${parsed.tvaRate}%`, startX + col1, doc.y, {
    width: col2,
    align: 'right',
  });
  doc.text(currency.format(totals.totalTVA), startX + col1 + col2, doc.y, {
    width: col3,
    align: 'right',
  });
  doc.moveDown(1);
  doc.font('Helvetica-Bold').text('Total TTC', startX + col1, doc.y, {
    width: col2,
    align: 'right',
  });
  doc.text(currency.format(totals.totalTTC), startX + col1 + col2, doc.y, {
    width: col3,
    align: 'right',
  });
  doc.moveDown(1.5);

  // Legal/payment info
  const bullets = [
    `Date de r\u00e8glement : ${parsed.date_reglement}`,
    `Date de vente : ${parsed.date_vente}`,
    'Modalit\u00e9 : r\u00e8glement \u00e0 r\u00e9ception',
    `P\u00e9nalit\u00e9s de retard : ${parsed.penalites}`,
    'Escompte pour paiement anticip\u00e9 : n\u00e9ant',
    'Indemnit\u00e9 forfaitaire de recouvrement : 40 \u20ac',
  ];
  for (const line of bullets) {
    const bulletY = doc.y + 3;
    doc.circle(startX + 2, bulletY, 1.5).fill('black');
    doc.fillColor('black').text(line, startX + 8, doc.y, {
      width: pageWidth - 8,
    });
  }

  // Logo
  const logoSize = mm(95);
  const logoX = doc.page.width - doc.page.margins.right - logoSize;
  const logoY = doc.page.height - doc.page.margins.bottom - logoSize;
  doc.lineWidth(0.5);
  if (parsed.logo_path && existsSync(parsed.logo_path)) {
    doc.image(parsed.logo_path, logoX, logoY, { width: logoSize, height: logoSize });
  } else {
    doc.rect(logoX, logoY, logoSize, logoSize).stroke();
    doc
      .font('Helvetica')
      .fontSize(12)
      .text('VOTRE LOGO', logoX, logoY + logoSize / 2 - 6, {
        width: logoSize,
        align: 'center',
      });
  }

  doc.end();
  await pipe;
}
