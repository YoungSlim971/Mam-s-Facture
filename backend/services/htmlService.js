require('ts-node/register/transpile-only');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const { computeTotals } = require('../utils/computeTotals.ts');

function mapFactureToInvoiceData(facture) {
  return {
    nom_entreprise: facture.nom_entreprise || '',
    siren: facture.siren || '',
    adresse: undefined,
    logo_path: facture.logo_path
      ? path.isAbsolute(facture.logo_path)
        ? facture.logo_path
        : path.join(__dirname, '..', facture.logo_path)
      : undefined,
    nom_client: facture.nom_client,
    adresse_client: facture.adresse ? facture.adresse.split('\n') : undefined,
    numero: facture.numero_facture || facture.numero,
    date: facture.date_facture,
    lignes: (facture.lignes || []).map(l => ({
      description: l.description,
      quantite: Number(l.quantite),
      prix_unitaire: Number(l.prix_unitaire),
    })),
    tvaRate: facture.vat_rate !== undefined ? Number(facture.vat_rate) : undefined,
    date_reglement: facture.date_reglement || facture.date_facture,
    date_vente: facture.date_vente || facture.date_facture,
    penalites: facture.penalites || '',
  };
}

function buildFactureHTML(facture) {
  const invoiceData = mapFactureToInvoiceData(facture);
  const totals = computeTotals(invoiceData.lignes, invoiceData.tvaRate || 20);
  Object.assign(invoiceData, totals);
  const templatePath = path.join(__dirname, '..', 'views', 'invoice.ejs');
  const template = fs.readFileSync(templatePath, 'utf8');
  return ejs.render(template, invoiceData);
}

module.exports = buildFactureHTML;
module.exports.mapFactureToInvoiceData = mapFactureToInvoiceData;
