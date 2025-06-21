import { z } from 'zod';
import Decimal from 'decimal.js';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { computeTotals } = require('./utils/computeTotals.ts');
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import numeral from 'numeral';
import 'numeral/locales/fr';

numeral.locale('fr');

export interface InvoiceData {
  nom_entreprise: string;
  siren?: string;
  vat_number?: string;
  adresse?: string[];
  logo_path?: string;
  nom_client: string;
  adresse_client?: string[];
  numero: string;
  date: string;
  lignes: { description: string; quantite: number; prix_unitaire: number }[];
  tvaRate?: number;
  date_reglement: string;
  date_vente: string;
  penalites: string;
}

const ligneSchema = z.object({
  description: z.string(),
  quantite: z.number().positive(),
  prix_unitaire: z.number().nonnegative(),
});

const invoiceSchema = z.object({
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


export function generateInvoiceHTML(data: InvoiceData): string {
  const parsed = invoiceSchema.parse(data);
  const totals = computeTotals(parsed.lignes, parsed.tvaRate);
  const formatEuro = (v: number) => numeral(v).format('0,0.00 $');
  const dateStr = format(new Date(parsed.date), 'dd/MM/yyyy', { locale: fr });
  const lignesHtml = parsed.lignes
    .map(l => {
      const lineTotal = new Decimal(l.quantite).mul(l.prix_unitaire);
      return `<tr><td>${l.description}</td><td>${l.quantite}</td><td class="price">${formatEuro(
        l.prix_unitaire
      )}</td><td class="price">${formatEuro(lineTotal.toNumber())}</td></tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Facture ${parsed.numero}</title>
<style>
@page { size: A4; margin: 20mm 15mm; }
body.invoice { font: 14px/1.4 "Helvetica Neue", Arial, sans-serif; color:#333; }
header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; }
header img{ max-height:60px; }
.meta h1{ margin:0; font-size:28px; letter-spacing:2px; }
.addresses{ display:flex; justify-content:space-between; margin-bottom:24px; }
.addresses h2{ margin:0 0 8px; font-size:16px; }
table.lines{ width:100%; border-collapse:collapse; }
table.lines thead { background:#f2f6fa; }
table.lines th, table.lines td{ padding:8px; border:1px solid #ddd; text-align:left; }
table.lines td.price, .totals p{ text-align:right; }
.totals{ margin-top:16px; }
.totals .grand{ font-size:18px; font-weight:700; }
@media print{ table.lines tr{ break-inside:avoid; } }
@media(max-width:600px){ header, .addresses{ flex-direction:column; align-items:flex-start; } .addresses > div{ width:100%; margin-bottom:12px; } }
</style>
</head>
<body class="invoice">
<header>
  <img src="${parsed.logo_path || '/logo.png'}" alt="Logo">
  <section class="meta">
    <h1>FACTURE</h1>
    <p>N° ${parsed.numero}</p>
    <p>Date : ${dateStr}</p>
  </section>
</header>
<section class="addresses">
  <div class="from">
    <h2>Émetteur</h2>
    ${parsed.nom_entreprise}<br>${(parsed.adresse || []).join('<br>')}
  </div>
  <div class="to">
    <h2>Client</h2>
    ${parsed.nom_client}<br>${(parsed.adresse_client || []).join('<br>')}
  </div>
</section>
<table class="lines">
  <thead><tr><th>Description</th><th>Qté</th><th>PU HT</th><th class="price">Total HT</th></tr></thead>
  <tbody>${lignesHtml}</tbody>
</table>
<section class="totals">
  <p>Sous-total HT : ${formatEuro(totals.totalHT)}</p>
  <p>TVA ${parsed.tvaRate ?? 20} % : ${formatEuro(totals.totalTVA)}</p>
  <p class="grand">TOTAL TTC : ${formatEuro(totals.totalTTC)}</p>
</section>
<footer>
  <p>Conditions de paiement : règlement à réception.</p>
  <p>${parsed.nom_entreprise} – SIRET ${parsed.siren || ''}</p>
</footer>
</body>
</html>`;
}
