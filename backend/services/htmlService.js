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
  console.log("mapFactureToInvoiceData input - facture:", JSON.stringify(facture, null, 2));
  console.log("mapFactureToInvoiceData input - clientDetails:", JSON.stringify(clientDetails, null, 2));

  // facture is expected to be an object, clientDetails can be null/undefined
  facture = facture || {};
  clientDetails = clientDetails || {};

  // Emitter data from the facture object (denormalized)
  if (!facture.emitter_full_name) console.warn("⚠️ Missing emitter_full_name in facture:", facture);
  const emitterName = facture.emitter_full_name || '-';

  if (!facture.emitter_address_street) console.warn("⚠️ Missing emitter_address_street in facture:", facture);
  if (!facture.emitter_address_postal_code) console.warn("⚠️ Missing emitter_address_postal_code in facture:", facture);
  if (!facture.emitter_address_city) console.warn("⚠️ Missing emitter_address_city in facture:", facture);
  const emitterAddress = `${facture.emitter_address_street || ''}<br>${facture.emitter_address_postal_code || ''} ${facture.emitter_address_city || ''}`.trim() || '-';

  if (!facture.emitter_siret_siren) console.warn("⚠️ Missing emitter_siret_siren in facture:", facture);
  const emitterSiret = facture.emitter_siret_siren || '-';

  if (!facture.emitter_ape_naf_code) console.warn("⚠️ Missing emitter_ape_naf_code in facture:", facture);
  const emitterApe = facture.emitter_ape_naf_code || '-';

  const emitterVatDisplay = facture.emitter_vat_number ? facture.emitter_vat_number : "TVA non applicable – art. 293 B du CGI";

  if (!facture.emitter_rcs_rm) console.warn("⚠️ Missing emitter_rcs_rm in facture:", facture); // As per task: userProfile.rcs_rm
  const emitterRcsRm = facture.emitter_rcs_rm || '-';

  if (!facture.emitter_email) console.warn("⚠️ Missing emitter_email in facture:", facture);
  const emitterEmail = facture.emitter_email || '-';

  if (!facture.emitter_phone) console.warn("⚠️ Missing emitter_phone in facture:", facture);
  const emitterPhone = facture.emitter_phone || '-';

  // Client data from clientDetails (fetched separately)
  if (!clientDetails.nom_entreprise && !clientDetails.nom_client) console.warn("⚠️ Missing nom_entreprise or nom_client in clientDetails:", clientDetails);
  const clientName = clientDetails.nom_entreprise || clientDetails.nom_client || '-';

  const clientStreet = clientDetails.adresse_facturation_rue || '';
  const clientPostalCode = clientDetails.adresse_facturation_cp || '';
  const clientCity = clientDetails.adresse_facturation_ville || '';
  let clientBillingAddress = `${clientStreet}<br>${clientPostalCode} ${clientCity}`.trim();

  if (!clientBillingAddress && facture.adresse) {
    console.warn("⚠️ Client billing address missing, falling back to facture.adresse. ClientDetails:", clientDetails, "Facture:", facture);
    clientBillingAddress = facture.adresse.replace(/\n/g, '<br>');
  }
  if (!clientBillingAddress) {
    console.warn("⚠️ Critical: Client billing address is empty. ClientDetails:", clientDetails, "Facture:", facture);
    clientBillingAddress = '-';
  }


  let clientDeliveryAddress = '';
  const clientDeliveryStreet = clientDetails.adresse_livraison_rue || '';
  const clientDeliveryPostalCode = clientDetails.adresse_livraison_cp || '';
  const clientDeliveryCity = clientDetails.adresse_livraison_ville || '';
  if (clientDeliveryStreet || clientDeliveryPostalCode || clientDeliveryCity) {
    const adrLiv = `${clientDeliveryStreet}<br>${clientDeliveryPostalCode} ${clientDeliveryCity}`.trim();
    if (adrLiv !== clientBillingAddress && adrLiv) { // Only show if different and not empty
        clientDeliveryAddress = adrLiv;
    }
  }
  const clientVat = clientDetails.tva || '';

  // Invoice specific data
  if (!facture.numero_facture) console.warn("⚠️ Missing numero_facture in facture:", facture);
  const invoiceNum = facture.numero_facture || 'N/A';

  if (!facture.date_facture) console.warn("⚠️ Missing date_facture in facture:", facture);
  const emissionDate = formatDate(facture.date_facture);
  const prestationDate = formatDate(facture.date_facture); // Assuming same as emission date

  const paymentDeadline = '30'; // Default to 30 days

  const items = (facture.lignes || []).map((l, index) => {
    if (!l) {
      console.warn(`⚠️ Missing ligne object at index ${index} in facture.lignes:`, facture.lignes);
      return { service: '-', quantity: 0, unitPriceHT: 0, totalHT: 0 };
    }
    if (l.description === undefined || l.description === null) console.warn(`⚠️ Missing description in ligne ${index}:`, l);
    if (l.quantite === undefined || l.quantite === null) console.warn(`⚠️ Missing quantite in ligne ${index}:`, l);
    if (l.prix_unitaire === undefined || l.prix_unitaire === null) console.warn(`⚠️ Missing prix_unitaire in ligne ${index}:`, l);

    const quantity = Number(l.quantite) || 0;
    const unitPriceHT = Number(l.prix_unitaire) || 0;

    return {
      service: l.description || '-',
      quantity: quantity,
      unitPriceHT: unitPriceHT,
      totalHT: quantity * unitPriceHT,
    };
  });
  if (!facture.lignes || facture.lignes.length === 0) {
    console.warn("⚠️ facture.lignes is missing or empty:", facture);
  }


  // Check for total_ht existence (as per task, though it's calculated)
  // The task mentioned "facture.total_ht", but it's calculated by computeTotals.
  // We are checking the inputs to computeTotals (items).
  if (items.some(item => typeof item.unitPriceHT !== 'number' || typeof item.quantity !== 'number')) {
    console.warn("⚠️ Invalid data in items for total calculation:", items);
  }


  const tvaRate = facture.vat_rate !== undefined && !isNaN(Number(facture.vat_rate)) ? Number(facture.vat_rate) : 20; // Default TVA rate, ensure it's a number
  const { totalHT, totalTVA, totalTTC } = computeTotals(items.map(i => ({...i, prix_unitaire: i.unitPriceHT, quantite: i.quantity})), tvaRate);


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
    date_prestation: prestationDate,
    lignes_facture: items,

    // Totals
    sous_total_HT: !isNaN(totalHT) ? totalHT : 0,
    taux_TVA: tvaRate,
    montant_TVA_calculee: !isNaN(totalTVA) ? totalTVA : 0,
    total_TTC: !isNaN(totalTTC) ? totalTTC : 0,

    // Mentions
    delai_paiement: paymentDeadline,
  };
}


function buildFactureHTML(facture, clientDetails) {
  const d = mapFactureToInvoiceData(facture, clientDetails); // d for data
  const formatEuro = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.warn(`⚠️ Invalid amount for euro formatting: ${amount}. Using 0.`);
      amount = 0;
    }
    return euroFormatter.format(amount);
  }

  const lignesHtml = d.lignes_facture.map(ligne => `
    <tr>
      <td>${ligne.service || '-'}</td>
      <td>${ligne.quantity || 0}</td>
      <td>${formatEuro(ligne.unitPriceHT)}</td>
      <td>${formatEuro(ligne.totalHT)}</td>
    </tr>
  `).join('');

  // Ensure all parts of 'd' are strings or numbers that can be converted to strings
  // Fallbacks for main display fields if they are still problematic after mapping
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
  const displayClientDeliveryAddr = d.Adresse_livraison_client || ''; // Can be empty
  const displayClientVat = d.TVA_client || ''; // Can be empty

  const displayInvoiceNum = d.numero_facture || 'N/A';
  const displayEmissionDate = d.date_emission || '-';
  const displayPrestationDate = d.date_prestation || '-';


  return `
<div class="facture">
  <div class="en-tete">
    <div class="emetteur">
      <strong>${displayName}</strong><br>
      ${displayAddress}<br>
      SIRET : ${displaySiret}<br>
      Code APE : ${displayApe}<br>
      TVA : ${displayVat}<br>
      RCS/RM : ${displayRcsRm}<br>
      Email : ${displayEmail}<br>
      Tél : ${displayPhone}<br>
    </div>

    <div class="client">
      <strong>${displayClientName}</strong><br>
      ${displayClientBillingAddr}<br>
      ${displayClientDeliveryAddr ? `Livraison : ${displayClientDeliveryAddr}<br>` : ''}
      ${displayClientVat ? `TVA : ${displayClientVat}<br>` : ''}
    </div>
  </div>

  <div class="infos-facture">
    Facture n°${displayInvoiceNum}<br>
    Date d’émission : ${displayEmissionDate}<br>
    Date de prestation : ${displayPrestationDate}<br>
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
    Sous-total HT : ${formatEuro(d.sous_total_HT)}<br>
    TVA (${d.taux_TVA}%) : ${formatEuro(d.montant_TVA_calculee)}<br>
    Total TTC : ${formatEuro(d.total_TTC)}<br>
  </div>

  <div class="mentions">
    Paiement sous ${d.delai_paiement || '30'} jours.<br>
    Indemnité forfaitaire de 40,00 € pour frais de recouvrement (article D441-5 du Code de commerce).<br>
  </div>
</div>
  `;
}

module.exports = buildFactureHTML;
module.exports.mapFactureToInvoiceData = mapFactureToInvoiceData;
