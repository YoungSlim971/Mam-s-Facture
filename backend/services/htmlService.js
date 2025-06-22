require('ts-node/register/transpile-only');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const { computeTotals } = require('../utils/computeTotals.ts');

function mapFactureToInvoiceData(facture) {
  return {
    // Informations de l'entreprise
    companyName: facture.nom_entreprise || '',
    siren: facture.siren || '',
    companyAddress: '',
    companyPostal: '',
    logoUrl: facture.logo_path
      ? path.isAbsolute(facture.logo_path)
        ? facture.logo_path
        : path.join(__dirname, '..', facture.logo_path)
      : undefined,

    // Informations du client
    clientName: facture.nom_client,
    clientCompany: '',
    clientAddress: facture.adresse ? facture.adresse.replace(/\n/g, '<br>') : '',
    clientPostal: '',
    clientId: facture.client_id || '',

    // Informations de la facture
    invoiceNumber: facture.numero_facture || facture.numero,
    invoiceDate: facture.date_facture,
    lignes: (facture.lignes || []).map(l => ({
      description: l.description,
      quantite: Number(l.quantite),
      prix_unitaire: Number(l.prix_unitaire),
    })),
    tvaRate: facture.vat_rate !== undefined ? Number(facture.vat_rate) : undefined,
    date_reglement: facture.date_reglement || facture.date_facture,
    date_vente: facture.date_vente || facture.date_facture,
    penalites: facture.penalites || '',

    // Pied de page et mentions
    paymentConditions: '',
    paymentMethod: '',
    closingMessage: '',
    companyFooter: '',
    companyContact: '',
    bankDetails: '',
    legalInfo: '',
    pageLabel: '1',
  };
}

function buildFactureHTML(facture) {
  const invoiceData = mapFactureToInvoiceData(facture);
  const totals = computeTotals(invoiceData.lignes, invoiceData.tvaRate || 20);

  // Préparation des lignes pour la nouvelle maquette
  const items = invoiceData.lignes.map(l => ({
    description: l.description,
    quantity: l.quantite,
    unit: '',
    unitPrice: l.prix_unitaire.toFixed(2),
    totalHt: (l.quantite * l.prix_unitaire).toFixed(2),
    tva: invoiceData.tvaRate || 20,
  }));

  const tvaLines = [
    {
      rate: invoiceData.tvaRate || 20,
      tvaAmount: totals.totalTVA.toFixed(2),
      baseHt: totals.totalHT.toFixed(2),
    },
  ];

  const templateData = {
    ...invoiceData,
    items,
    tvaLines,
    totalTtc: totals.totalTTC.toFixed(2),
  };

  const templatePath = path.join(__dirname, '..', 'views', 'invoice.ejs');
  const template = fs.readFileSync(templatePath, 'utf8');
  return ejs.render(template, templateData);
}

module.exports = buildFactureHTML;
module.exports.mapFactureToInvoiceData = mapFactureToInvoiceData;
