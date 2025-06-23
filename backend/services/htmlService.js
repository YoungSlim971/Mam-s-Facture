require('ts-node/register/transpile-only');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const { computeTotals } = require('../utils/computeTotals.ts');
const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR'
});

function mapFactureToInvoiceData(facture) {
  return {
    // Informations de l'entreprise (Émetteur)
    companyName: facture.emitter_full_name || facture.nom_entreprise || '', // Fallback to old field if new one is not there
    siren: facture.emitter_siret_siren || facture.siren || '',
    apeNafCode: facture.emitter_ape_naf_code || '',
    vatNumber: facture.emitter_vat_number || '',
    companyAddress: `${facture.emitter_address_street || ''}`,
    companyPostalCode: facture.emitter_address_postal_code || '',
    companyCity: facture.emitter_address_city || '',
    companyEmail: facture.emitter_email || '',
    companyPhone: facture.emitter_phone || '',
    activityStartDate: facture.emitter_activity_start_date || '',
    logoUrl: facture.logo_path // Assuming logo_path is still relevant for emitter or general branding
      ? path.isAbsolute(facture.logo_path)
        ? facture.logo_path
        : path.join(__dirname, '..', facture.logo_path)
      : undefined,

    // Informations du client (Destinataire)
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
  const formatEuro = (amount) => euroFormatter.format(amount);

  // Préparation des lignes pour la nouvelle maquette
  const items = invoiceData.lignes.map(l => ({
    description: l.description,
    quantity: l.quantite,
    unit: '',
    unitPrice: formatEuro(l.prix_unitaire),
    totalHt: formatEuro(l.quantite * l.prix_unitaire),
    tva: invoiceData.tvaRate || 20,
  }));

  const tvaLines = [
    {
      rate: invoiceData.tvaRate || 20,
      tvaAmount: formatEuro(totals.totalTVA),
      baseHt: formatEuro(totals.totalHT),
    },
  ];

  const templateData = {
    ...invoiceData,
    items,
    tvaLines,
    totalTtc: formatEuro(totals.totalTTC),
  };

  const templatePath = path.join(__dirname, '..', 'views', 'invoice.ejs');
  const template = fs.readFileSync(templatePath, 'utf8');
  try {
    return ejs.render(template, templateData);
  } catch (err) {
    console.error('Erreur lors du rendu du template:', err);
    throw err;
  }
}

module.exports = buildFactureHTML;
module.exports.mapFactureToInvoiceData = mapFactureToInvoiceData;
