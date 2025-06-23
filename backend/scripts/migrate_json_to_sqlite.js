/**
 * @deprecated This script is for one-time migration of JSON data to SQLite.
 * Run this script only once after setting up the SQLite database.
 * Make sure to backup your database before running this script.
 */

const fs = require('fs');
const path = require('path');
const SQLiteDatabase = require('../database/sqlite');

const JSON_DATA_DIR = path.join(__dirname, '..', 'database', 'data');
const CLIENTS_JSON_PATH = path.join(JSON_DATA_DIR, 'clients.json');
const FACTURES_JSON_PATH = path.join(JSON_DATA_DIR, 'factures.json');
const LIGNES_JSON_PATH = path.join(JSON_DATA_DIR, 'lignes.json');

async function migrate() {
  console.log('Starting migration from JSON to SQLite...');

  let db;
  try {
    db = await SQLiteDatabase.create();
    console.log('SQLite database loaded.');
  } catch (error) {
    console.error('Failed to load SQLite database:', error);
    return;
  }

  // Migrate Clients
  try {
    if (fs.existsSync(CLIENTS_JSON_PATH)) {
      const clientsData = JSON.parse(fs.readFileSync(CLIENTS_JSON_PATH, 'utf-8'));
      console.log(`Found ${clientsData.length} clients in JSON. Migrating...`);
      for (const client of clientsData) {
        // Check if client already exists by name or email to avoid duplicates
        // This is a simple check; more robust duplicate detection might be needed
        const existingClient = db.db.prepare('SELECT id FROM clients WHERE nom_client = ? OR email = ?').get(client.nom_client, client.email);
        if (existingClient) {
          console.log(`Client "${client.nom_client}" already exists. Skipping.`);
          continue;
        }
        db.createClient({
          nom_client: client.nom_client,
          prenom_client: client.prenom_client || '',
          nom_entreprise: client.nom_entreprise || '',
          telephone: client.telephone || '',
          email: client.email || '',
          adresse_facturation: client.adresse_facturation || client.adresse || '', // Legacy support for 'adresse'
          adresse_livraison: client.adresse_livraison || '',
          intitule: client.intitule || '',
          siren: client.siren || '',
          siret: client.siret || '',
          legal_form: client.legal_form || '',
          tva: client.tva || '',
          rcs_number: client.rcs_number || '',
          logo: client.logo || ''
        });
      }
      console.log('Clients migration completed.');
    } else {
      console.log('clients.json not found. Skipping clients migration.');
    }
  } catch (error) {
    console.error('Error during clients migration:', error);
  }

  // Migrate Factures and Lignes
  try {
    if (fs.existsSync(FACTURES_JSON_PATH)) {
      const facturesData = JSON.parse(fs.readFileSync(FACTURES_JSON_PATH, 'utf-8'));
      const lignesData = fs.existsSync(LIGNES_JSON_PATH) ? JSON.parse(fs.readFileSync(LIGNES_JSON_PATH, 'utf-8')) : [];

      console.log(`Found ${facturesData.length} factures in JSON. Migrating...`);
      for (const facture of facturesData) {
        // Check if facture already exists by numero_facture to avoid duplicates
        const existingFacture = db.db.prepare('SELECT id FROM factures WHERE numero_facture = ?').get(facture.numero_facture);
        if (existingFacture) {
          console.log(`Facture "${facture.numero_facture}" already exists. Skipping.`);
          continue;
        }

        let clientId = facture.client_id;
        // If client_id is not present, try to find client by name (simple lookup)
        if (!clientId && facture.nom_client) {
            const clientRow = db.db.prepare('SELECT id FROM clients WHERE nom_client = ?').get(facture.nom_client);
            if (clientRow) {
                clientId = clientRow.id;
            } else {
                console.warn(`Client with name "${facture.nom_client}" for facture "${facture.numero_facture}" not found. client_id will be null.`);
            }
        }

        const factureLignes = lignesData.filter(l => l.facture_id === facture.id);

        db.createFacture({
          client_id: clientId,
          numero_facture: facture.numero_facture,
          nom_client: facture.nom_client, // Keep original nom_client from JSON if client_id is not found
          nom_entreprise: facture.nom_entreprise || '',
          telephone: facture.telephone || '',
          adresse: facture.adresse || '',
          date_facture: facture.date_facture,
          montant_total: parseFloat(facture.montant_total) || 0,
          status: facture.status || 'unpaid',
          lignes: factureLignes.map(l => ({
            description: l.description,
            quantite: parseFloat(l.quantite) || 0,
            prix_unitaire: parseFloat(l.prix_unitaire) || 0,
          }))
        });
      }
      console.log('Factures and Lignes migration completed.');
      // Synchronize client aggregates after migrating factures
      db.synchroniserFacturesParClient();
      console.log('Client aggregates synchronized.');

    } else {
      console.log('factures.json not found. Skipping factures migration.');
    }
  } catch (error) {
    console.error('Error during factures/lignes migration:', error);
  }

  db.save();
  console.log('Migration finished. Database saved.');
  console.log('IMPORTANT: This script is deprecated. Please remove or archive it after use.');
  console.log('Consider deleting the JSON data files from backend/database/data/ if they are no longer needed.');
}

if (require.main === module) {
  migrate().catch(err => {
    console.error('Unhandled error during migration:', err);
  });
}

module.exports = migrate;
