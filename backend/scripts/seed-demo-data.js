const fs = require('fs');
const path = require('path');
const SQLiteDatabase = require('../database/sqlite');
const { writeUserProfile } = require('../services/userProfileService');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'mockData');

async function seed(dbInstance) {
  // If the server module was loaded previously (e.g. in other tests), remove it
  // from the require cache so requiring it again returns a fresh instance with
  // a newly created database.
  const serverPath = path.join(__dirname, '..', 'server');
  if (require.cache[require.resolve(serverPath)]) {
    delete require.cache[require.resolve(serverPath)];
  }

  const db = dbInstance || await SQLiteDatabase.create();

  // Skip seeding if clients already exist
  if (db.getClients().length > 0) {
    console.log('Demo data already present. Skipping seeding.');
    return;
  }

  const user = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'user.json'), 'utf-8'));
  const clients = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'clients.json'), 'utf-8'));
  const factures = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'factures.json'), 'utf-8'));

  // Save user profile
  await writeUserProfile({
    raison_sociale: user.raison_sociale,
    adresse: user.adresse,
    code_postal: user.code_postal,
    ville: user.ville,
    forme_juridique: user.forme_juridique,
    siret: user.siret,
    ape_naf: user.ape_naf,
    tva_intra: user.tva_intra,
    rcs_ou_rm: user.rcs_ou_rm,
    email: user.email,
    phone: user.phone,
    social_capital: user.social_capital,
    activity_start_date: user.activity_start_date
  });

  const clientIdMap = {};
  clients.forEach(c => {
    const id = db.createClient(c);
    clientIdMap[c.nom_entreprise] = id;
  });

  factures.forEach(f => {
    const clientId = clientIdMap[f.clientKey];
    db.createFacture({
      client_id: clientId,
      numero_facture: f.numero,
      nom_client: clients[0].nom_client,
      nom_entreprise: clients[0].nom_entreprise,
      telephone: clients[0].telephone,
      adresse: clients[0].adresse_facturation,
      date_facture: f.date,
      montant_total: f.montant,
      status: f.status,
      lignes: [
        { description: f.description, quantite: 1, prix_unitaire: f.montant }
      ]
    });
  });

  console.log('Demo data inserted.');

  if (typeof db.setMeta === 'function') {
    db.setMeta('hasSeeded', 'true');
  }
}

if (require.main === module) {
  seed().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seed;
