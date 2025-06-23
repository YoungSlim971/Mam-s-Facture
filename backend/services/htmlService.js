require('ts-node/register/transpile-only');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const { computeTotals } = require('../utils/computeTotals.ts');
const { fr } = require('date-fns/locale');
const { format } = require('date-fns');

const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR'
});

// Helper to format date, defaulting to 'dd/MM/yyyy'
const formatDate = (dateString, fmt = 'dd/MM/yyyy') => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), fmt, { locale: fr });
  } catch (e) {
    return dateString; // if parsing fails, return original string
  }
};


function mapFactureToInvoiceData(facture, clientDetails) {
  // Emitter data from the facture object (denormalized)
  const emitterName = facture.emitter_full_name || '';
  const emitterAddress = `${facture.emitter_address_street || ''}<br>${facture.emitter_address_postal_code || ''} ${facture.emitter_address_city || ''}`.trim();
  const emitterSiret = facture.emitter_siret_siren || '';
  const emitterApe = facture.emitter_ape_naf_code || '';
  const emitterVatDisplay = facture.emitter_vat_number ? facture.emitter_vat_number : "TVA non applicable – art. 293 B du CGI";
  const emitterRcsRm = facture.emitter_rcs_rm || '';
  const emitterEmail = facture.emitter_email || '';
  const emitterPhone = facture.emitter_phone || '';
  // Optional emitter fields for new template (not explicitly in spec but good to have if available)
  // const emitterLegalForm = facture.emitter_legal_form || '';
  // const emitterSocialCapital = facture.emitter_social_capital ? `Capital social : ${facture.emitter_social_capital}` : '';


  // Client data from clientDetails (fetched separately)
  const clientName = clientDetails?.nom_entreprise || clientDetails?.nom_client || '';
  const clientBillingAddress = clientDetails ?
    `${clientDetails.adresse_facturation_rue || ''}<br>${clientDetails.adresse_facturation_cp || ''} ${clientDetails.adresse_facturation_ville || ''}`.trim()
    : (facture.adresse ? facture.adresse.replace(/\n/g, '<br>') : ''); // Fallback to old facture.adresse

  let clientDeliveryAddress = '';
  if (clientDetails && (clientDetails.adresse_livraison_rue || clientDetails.adresse_livraison_cp || clientDetails.adresse_livraison_ville)) {
    const adrLiv = `${clientDetails.adresse_livraison_rue || ''}<br>${clientDetails.adresse_livraison_cp || ''} ${clientDetails.adresse_livraison_ville || ''}`.trim();
    if (adrLiv !== clientBillingAddress) { // Only show if different and not empty
        clientDeliveryAddress = adrLiv;
    }
  }
  const clientVat = clientDetails?.tva || '';

  // Invoice specific data
  const invoiceNum = facture.numero_facture || '';
  const emissionDate = formatDate(facture.date_facture);
  const prestationDate = formatDate(facture.date_facture); // Assuming same as emission date as per previous note
  const paymentDeadline = '30'; // Default to 30 days

  const items = (facture.lignes || []).map(l => ({
    service: l.description,
    quantity: Number(l.quantite),
    unitPriceHT: Number(l.prix_unitaire),
    totalHT: Number(l.quantite) * Number(l.prix_unitaire),
  }));

  const tvaRate = facture.vat_rate !== undefined ? Number(facture.vat_rate) : 20; // Default TVA rate
  const { totalHT, totalTVA, totalTTC } = computeTotals(items.map(i => ({...i, prix_unitaire: i.unitPriceHT})), tvaRate);


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
    // Optional emitter details for completeness if needed later by template
    // LegalForm_emetteur: emitterLegalForm,
    // SocialCapital_emetteur: emitterSocialCapital,

    // Client
    Nom_client: clientName,
    Adresse_facturation_client: clientBillingAddress,
    Adresse_livraison_client: clientDeliveryAddress, // Will be empty if same or not provided
    TVA_client: clientVat,

    // Invoice details
    numero_facture: invoiceNum,
    date_emission: emissionDate,
    date_prestation: prestationDate,
    lignes_facture: items,

    // Totals
    sous_total_HT: totalHT,
    taux_TVA: tvaRate,
    montant_TVA_calculee: totalTVA,
    total_TTC: totalTTC,

    // Mentions
    delai_paiement: paymentDeadline,
    // Other mentions are hardcoded in the template provided
  };
}


function buildFactureHTML(facture, clientDetails) {
  const d = mapFactureToInvoiceData(facture, clientDetails); // d for data
  const formatEuro = (amount) => euroFormatter.format(amount);

  const lignesHtml = d.lignes_facture.map(ligne => `
    <tr>
      <td>${ligne.service}</td>
      <td>${ligne.quantity}</td>
      <td>${formatEuro(ligne.unitPriceHT)}</td>
      <td>${formatEuro(ligne.totalHT)}</td>
    </tr>
  `).join('');

  return `
<div class="facture">
  <div class="en-tete">
    <div class="emetteur">
      <strong>${d.Nom_entreprise}</strong><br>
      ${d.Adresse_emetteur}<br>
      SIRET : ${d.Num_SIRET_emetteur}<br>
      Code APE : ${d.APE_emetteur}<br>
      TVA : ${d.TVA_emetteur}<br>
      RCS/RM : ${d.RCS_RM_emetteur}<br>
      Email : ${d.Email_emetteur}<br>
      Tél : ${d.Telephone_emetteur}<br>
    </div>

    <div class="client">
      <strong>${d.Nom_client}</strong><br>
      ${d.Adresse_facturation_client}<br>
      ${d.Adresse_livraison_client ? `Livraison : ${d.Adresse_livraison_client}<br>` : ''}
      ${d.TVA_client ? `TVA : ${d.TVA_client}<br>` : ''}
    </div>
  </div>

  <div class="infos-facture">
    Facture n°${d.numero_facture}<br>
    Date d’émission : ${d.date_emission}<br>
    Date de prestation : ${d.date_prestation}<br>
  </div>

  <table class="table-facture">
    <thead>
      <tr>
        <th>Désignation</th>
        <th>Quantité</th>
        <th>Prix unitaire HT</th>
        <th>Total HT</th>
      </tr>
    </thead>
    <tbody>
      ${lignesHtml}
    </tbody>
  </table>

  <div class="totaux">
    Sous-total HT : ${formatEuro(d.sous_total_HT)} €<br>
    TVA (${d.taux_TVA}%) : ${formatEuro(d.montant_TVA_calculee)} €<br>
    Total TTC : ${formatEuro(d.total_TTC)} €<br>
  </div>

  <div class="mentions">
    Paiement sous ${d.delai_paiement} jours.<br>
    Indemnité forfaitaire de 40,00 € pour frais de recouvrement (article D441-5 du Code de commerce).<br>
  </div>
</div>
  `;
}

module.exports = buildFactureHTML;
module.exports.mapFactureToInvoiceData = mapFactureToInvoiceData;
