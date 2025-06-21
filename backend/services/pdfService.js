require('ts-node/register');
const path = require('path');
const { generateInvoicePDF } = require('../invoiceGenerator.ts');

function mapFactureToInvoiceData(facture) {
  return {
    nom_entreprise: facture.nom_entreprise || '',
    siren: facture.siren || '',
    adresse: facture.adresse ? facture.adresse.split('\n') : undefined,
    logo_path: facture.logo_path
      ? path.isAbsolute(facture.logo_path)
        ? facture.logo_path
        : path.join(__dirname, '..', facture.logo_path)
      : undefined,
    nom_client: facture.nom_client,
    adresse_client: facture.adresse_client
      ? facture.adresse_client.split('\n')
      : undefined,
    numero: facture.numero_facture || facture.numero,
    date: facture.date_facture,
    lignes: (facture.lignes || []).map(l => ({
      description: l.description,
      quantite: Number(l.quantite),
      prix_unitaire: Number(l.prix_unitaire),
    })),
    tvaRate:
      facture.vat_rate !== undefined ? Number(facture.vat_rate) : undefined,
    date_reglement: facture.date_reglement || facture.date_facture,
    date_vente: facture.date_vente || facture.date_facture,
    penalites: facture.penalites || '',
  };
}

async function buildFacturePDF(facture, outPath) {
  const invoiceData = mapFactureToInvoiceData(facture);
  await generateInvoicePDF(invoiceData, { variant: 'client', outPath });
}

module.exports = buildFacturePDF;
