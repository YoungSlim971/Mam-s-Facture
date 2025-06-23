const path = require('path');
const fs = require('fs');
// const ejs = require('ejs'); // Not used directly for HTML string building here
const { computeTotals } = require('../utils/computeTotals'); // This computeTotals expects TTC unit prices
const { fr } = require('date-fns/locale');
const { format } = require('date-fns');
const Decimal = require('decimal.js'); // Import Decimal.js

const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR'
});

const formatDate = (dateString, fmt = 'dd/MM/yyyy') => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), fmt, { locale: fr });
  } catch (e) {
    console.warn(`Failed to format date: ${dateString}`, e);
    return dateString;
  }
};

function mapFactureToInvoiceData(facture, clientDetails) {
  // console.log("mapFactureToInvoiceData input - facture:", JSON.stringify(facture, null, 2));
  // console.log("mapFactureToInvoiceData input - clientDetails:", JSON.stringify(clientDetails, null, 2));

  facture = facture || {};
  clientDetails = clientDetails || {};

  const emitterName = facture.emitter_full_name || '-';
  const emitterAddress = `${facture.emitter_address_street || ''}<br>${facture.emitter_address_postal_code || ''} ${facture.emitter_address_city || ''}`.trim() || '-';
  const emitterSiret = facture.emitter_siret_siren || '-';
  const emitterApe = facture.emitter_ape_naf_code || '-';
  const emitterVatDisplay = facture.emitter_vat_number ? facture.emitter_vat_number : "TVA non applicable – art. 293 B du CGI";
  const emitterRcsRm = facture.emitter_rcs_rm || '-';
  const emitterEmail = facture.emitter_email || '-';
  const emitterPhone = facture.emitter_phone || '-';
  // Emitter activity start date is not currently used in this HTML output from mapFactureToInvoiceData
  // const emitterActivityStartDate = formatDate(facture.emitter_activity_start_date);


  const clientName = clientDetails.nom_entreprise || clientDetails.nom_client || '-';
  let clientBillingAddress = (clientDetails.adresse_facturation_rue && clientDetails.adresse_facturation_cp && clientDetails.adresse_facturation_ville)
    ? `${clientDetails.adresse_facturation_rue}<br>${clientDetails.adresse_facturation_cp} ${clientDetails.adresse_facturation_ville}`.trim()
    : (facture.adresse_client || facture.adresse || '').replace(/\n/g, '<br>') || '-'; // facture.adresse is old, facture.adresse_client is new

  let clientDeliveryAddress = '';
  const clientDeliveryStreet = clientDetails.adresse_livraison_rue || '';
  const clientDeliveryPostalCode = clientDetails.adresse_livraison_cp || '';
  const clientDeliveryCity = clientDetails.adresse_livraison_ville || '';
  if (clientDeliveryStreet || clientDeliveryPostalCode || clientDeliveryCity) {
    const adrLiv = `${clientDeliveryStreet}<br>${clientDeliveryPostalCode} ${clientDeliveryCity}`.trim();
    if (adrLiv && adrLiv !== clientBillingAddress.replace(/<br>/g, '')) { // Basic check if different
        clientDeliveryAddress = adrLiv;
    }
  }
  const clientVat = clientDetails.tva || ''; // Client's TVA number

  const invoiceNum = facture.numero_facture || 'N/A';
  const emissionDate = formatDate(facture.date_facture);
  const prestationDate = formatDate(facture.date_facture); // Assuming same as emission date for now

  // ADDED: Payment Due Date
  const paymentDueDate = formatDate(facture.date_limite_paiement);

  // facture.vat_rate is the overall rate from the form (e.g. 20)
  const tvaRatePercent = new Decimal(facture.vat_rate !== undefined ? facture.vat_rate : 20);
  const tvaRateDecimal = tvaRatePercent.div(100); // e.g., 0.20

  const items = (facture.lignes || []).map((l) => {
    const quantity = new Decimal(l.quantite || 0);
    const unitPriceTTC = new Decimal(l.prix_unitaire || 0); // prix_unitaire from form IS TTC

    const lineTotalTTC = quantity.mul(unitPriceTTC);
    // HT = TTC / (1 + tauxTVA_decimal)
    const lineTotalHT = lineTotalTTC.div(tvaRateDecimal.plus(1));
    const lineVatAmount = lineTotalTTC.minus(lineTotalHT);
    // unitPriceHT = prix_unitaire_TTC / (1 + tauxTVA_decimal)
    const unitPriceHT = unitPriceTTC.div(tvaRateDecimal.plus(1));

    return {
      description: l.description || '-',
      quantity: quantity.toNumber(),
      unitPriceHT: unitPriceHT.toDecimalPlaces(2).toNumber(),
      totalHT: lineTotalHT.toDecimalPlaces(2).toNumber(),
      vatRate: tvaRatePercent.toNumber(), // The rate applied to this line
      vatAmount: lineVatAmount.toDecimalPlaces(2).toNumber(),
      unitPriceTTC: unitPriceTTC.toDecimalPlaces(2).toNumber(), // For clarity if needed
      totalTTC: lineTotalTTC.toDecimalPlaces(2).toNumber(),
    };
  });

  // Overall totals (using the same computeTotals which expects TTC unit prices)
  // The `computeTotals` function in `utils` calculates overall HT, TVA, TTC based on the provided lines
  // where `prix_unitaire` is TTC. This is consistent with what `items` provides for its `unitPriceTTC`.
  const overallTotals = computeTotals(
    (facture.lignes || []).map(l => ({ quantite: Number(l.quantite || 0) , prix_unitaire: Number(l.prix_unitaire || 0) })), // Pass original TTC unit prices
    tvaRatePercent.toNumber()
  );

  return {
    // Emitter
    Nom_entreprise: emitterName,
    Adresse_emetteur: emitterAddress,
    Num_SIRET_emetteur: emitterSiret,
    APE_emetteur: emitterApe,
    TVA_emetteur: emitterVatDisplay,
    RCS_RM_emetteur: emitterRcsRm,
    Email_emetteur: emitterEmail,
    Telephone_emetteur: emitterPhone,

    // Client
    Nom_client: clientName,
    Adresse_facturation_client: clientBillingAddress,
    Adresse_livraison_client: clientDeliveryAddress,
    TVA_client: clientVat,

    // Invoice details
    numero_facture: invoiceNum,
    date_emission: emissionDate,
    date_prestation: prestationDate, // Could be different, but here same as emission
    date_limite_paiement: paymentDueDate, // ADDED
    lignes_facture: items, // Now contains detailed HT/TVA/TTC per line

    // Overall Totals from computeTotals
    sous_total_HT: overallTotals.totalHT,
    taux_TVA_global: tvaRatePercent.toNumber(), // Global VAT rate used for summary
    montant_TVA_global: overallTotals.totalTVA,
    total_TTC_global: overallTotals.totalTTC,

    // Mentions
    // delai_paiement: paymentDeadline, // Replaced by specific date_limite_paiement
    // Hardcoded mentions can remain in buildFactureHTML or be dynamic
  };
}

function buildFactureHTML(facture, clientDetails) {
  const d = mapFactureToInvoiceData(facture, clientDetails);
  const formatEuro = (amount) => euroFormatter.format(amount || 0);

  const lignesHtml = d.lignes_facture.map(ligne => `
    <tr>
      <td>${ligne.description}</td>
      <td style="text-align:right;">${ligne.quantity}</td>
      <td style="text-align:right;">${formatEuro(ligne.unitPriceHT)}</td>
      <td style="text-align:right;">${ligne.vatRate}%</td>
      <td style="text-align:right;">${formatEuro(ligne.vatAmount)}</td>
      <td style="text-align:right;">${formatEuro(ligne.totalTTC)}</td>
    </tr>
  `).join('');

  // Fallbacks for display
  const displayName = d.Nom_entreprise || '-';
  const displayAddress = d.Adresse_emetteur || '-';
  const displaySiret = d.Num_SIRET_emetteur || '-';
  const displayApe = d.APE_emetteur || '-';
  const displayVat = d.TVA_emetteur || "TVA non applicable – art. 293 B du CGI";
  const displayRcsRm = d.RCS_RM_emetteur || '-';
  const displayEmail = d.Email_emetteur || '-';
  const displayPhone = d.Telephone_emetteur || '-';

  const displayClientName = d.Nom_client || '-';
  const displayClientBillingAddr = d.Adresse_facturation_client || '-';
  const displayClientDeliveryAddr = d.Adresse_livraison_client || '';
  const displayClientVat = d.TVA_client || '';

  const displayInvoiceNum = d.numero_facture || 'N/A';
  const displayEmissionDate = d.date_emission || '-';
  const displayPrestationDate = d.date_prestation || '-';
  const displayPaymentDueDate = d.date_limite_paiement || 'Non spécifiée'; // ADDED

  return `
<html>
<head>
  <meta charset="UTF-8">
  <title>Facture ${displayInvoiceNum}</title>
  <style>
    body { font-family: Helvetica, Arial, sans-serif; margin: 20px; font-size: 10pt; color: #333; }
    .facture { border: 1px solid #eee; padding: 20px; }
    .en-tete { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .emetteur, .client { width: 48%; }
    .emetteur strong, .client strong { font-size: 11pt; margin-bottom: 5px; display: block; }
    .infos-facture { margin-bottom: 20px; padding-bottom:10px; border-bottom: 1px solid #eee; }
    .infos-facture div { margin-bottom: 3px; }
    .table-facture { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .table-facture th, .table-facture td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .table-facture th { background-color: #f8f8f8; font-weight: bold; }
    .table-facture td:nth-child(2), .table-facture td:nth-child(3), .table-facture td:nth-child(4), .table-facture td:nth-child(5), .table-facture td:nth-child(6) { text-align: right; }
    .totaux { margin-top: 20px; width: 50%; float: right; text-align: right; }
    .totaux div { margin-bottom: 5px; }
    .totaux strong { font-size: 11pt; }
    .mentions { margin-top: 80px; clear: both; font-size: 9pt; border-top: 1px solid #eee; padding-top: 15px; }
    .mentions p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="facture">
    <div class="en-tete">
      <div class="emetteur">
        <strong>${displayName}</strong><br>
        ${displayAddress.replace(/<br>/g, '<br/>')}<br>
        SIRET : ${displaySiret}<br>
        Code APE : ${displayApe}<br>
        N° TVA : ${displayVat}<br>
        ${displayRcsRm ? `RCS/RM : ${displayRcsRm}<br>` : ''}
        Email : ${displayEmail}<br>
        Tél : ${displayPhone}
      </div>
      <div class="client">
        <strong>Client :</strong><br>
        <strong>${displayClientName}</strong><br>
        ${displayClientBillingAddr.replace(/<br>/g, '<br/>')}<br>
        ${displayClientDeliveryAddr ? `Adresse de livraison : ${displayClientDeliveryAddr.replace(/<br>/g, '<br/>')}<br>` : ''}
        ${displayClientVat ? `N° TVA Client : ${displayClientVat}<br>` : ''}
      </div>
    </div>

    <div class="infos-facture">
      <div><strong>Facture n° :</strong> ${displayInvoiceNum}</div>
      <div><strong>Date d’émission :</strong> ${displayEmissionDate}</div>
      <div><strong>Date de réalisation de la prestation :</strong> ${displayPrestationDate}</div>
      <div><strong>Date limite de paiement :</strong> ${displayPaymentDueDate}</div>
    </div>

    <table class="table-facture">
      <thead>
        <tr>
          <th>Désignation</th>
          <th style="text-align:right;">Qté</th>
          <th style="text-align:right;">Prix Unit. HT</th>
          <th style="text-align:right;">Taux TVA</th>
          <th style="text-align:right;">Montant TVA</th>
          <th style="text-align:right;">Total TTC</th>
        </tr>
      </thead>
      <tbody>
        ${lignesHtml}
      </tbody>
    </table>

    <div class="totaux">
      <div>Sous-total HT : ${formatEuro(d.sous_total_HT)}</div>
      <div>Total TVA (${d.taux_TVA_global}%) : ${formatEuro(d.montant_TVA_global)}</div>
      <div><strong>Total TTC : ${formatEuro(d.total_TTC_global)}</strong></div>
    </div>

    <div class="mentions">
      <p>Conditions de paiement : Paiement à réception de facture, au plus tard le ${displayPaymentDueDate}.</p>
      <p>Aucun escompte pour paiement anticipé.</p>
      <p>En cas de retard de paiement, une indemnité forfaitaire de 40,00 € pour frais de recouvrement sera appliquée (article L441-10 et D441-5 du Code de commerce), ainsi que des pénalités de retard calculées au taux annuel de 10%.</p>
      ${d.TVA_emetteur.startsWith('TVA non applicable') ? "<p>" + d.TVA_emetteur + "</p>" : ""}
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = buildFactureHTML;
module.exports.mapFactureToInvoiceData = mapFactureToInvoiceData;
