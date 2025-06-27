const SQLiteDatabase = require('../database/sqlite');
const { computeTotals } = require('../utils/computeTotals');

async function generate(count = 10) {
  const db = await SQLiteDatabase.create();
  const clients = db.getClients();
  if (clients.length === 0) {
    console.error('Aucun client existant. Lancez seed-demo-data d\'abord.');
    return;
  }
  const userProfile = db.getUserProfile() || {};

  const invoices = [];
  const statuses = Array.from({ length: count }, (_, i) =>
    i < count / 2 ? 'paid' : 'unpaid'
  );

  for (let i = 0; i < count; i++) {
    const client = clients[i % clients.length];
    const items = [
      {
        description: `Prestation ${i + 1}`,
        quantite: 1,
        prix_unitaire: 100 + (i % 5) * 50
      }
    ];
    const { totalHT, totalTVA, totalTTC } = computeTotals(items, 20);
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateISO = date.toISOString().split('T')[0];
    const numero = `AUTO-${Date.now()}-${i}`;

    const factureData = {
      client_id: client.id,
      numero_facture: numero,
      nom_client: client.nom_client,
      nom_entreprise: client.nom_entreprise || '',
      telephone: client.telephone || '',
      adresse: client.adresse_facturation || '',
      date_facture: dateISO,
      montant_total: totalHT,
      lignes: items,
      title: items[0].description,
      status: statuses[i],
      logo_path: client.logo || '',
      siren: client.siren || '',
      siret: client.siret || '',
      legal_form: client.legal_form || '',
      vat_number: client.tva || null,
      vat_rate: 20,
      rcs_number: client.rcs_number || '',
      emitter_full_name: userProfile.full_name,
      emitter_address_street: `${userProfile.address_street}, ${userProfile.address_postal_code} ${userProfile.address_city}`,
      emitter_siret_siren: userProfile.siret_siren,
      emitter_ape_naf_code: userProfile.ape_naf_code,
      emitter_vat_number: userProfile.vat_number || null,
      emitter_legal_form: userProfile.legal_form,
      emitter_rcs_rm: userProfile.rcs_rm || null,
      emitter_address_postal_code: null,
      emitter_address_city: null,
      emitter_email: null,
      emitter_phone: null,
      emitter_activity_start_date: null,
      emitter_social_capital: null
    };

    const id = db.createFacture(factureData);
    invoices.push({
      id,
      numeroFacture: numero,
      clientId: client.id,
      client: client.nom_entreprise || client.nom_client,
      status: statuses[i],
      date: dateISO,
      montantHT: totalHT,
      TVA: totalTVA,
      montantTTC: totalTTC
    });
  }

  console.table(invoices);
}

if (require.main === module) {
  const count = parseInt(process.argv[2], 10) || 10;
  generate(count).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = generate;
