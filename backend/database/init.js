const Database = require('better-sqlite3');
const path = require('path');

// Créer la base de données
const dbPath = path.join(__dirname, 'facturation.db');
const db = new Database(dbPath);

console.log('Initialisation de la base de données...');

// Table des factures
db.exec(`CREATE TABLE IF NOT EXISTS factures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_facture TEXT UNIQUE NOT NULL,
  nom_client TEXT NOT NULL,
  nom_entreprise TEXT,
  telephone TEXT,
  adresse TEXT,
  date_facture DATE NOT NULL,
  montant_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Table des lignes de facture
db.exec(`CREATE TABLE IF NOT EXISTS lignes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facture_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantite DECIMAL(10,2) NOT NULL,
  prix_unitaire DECIMAL(10,2) NOT NULL,
  sous_total DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (facture_id) REFERENCES factures (id) ON DELETE CASCADE
)`);

// Données d'exemple
const sampleInvoices = [
  {
    numero_facture: 'FACT-2024-001',
    nom_client: 'Martin Dupont',
    nom_entreprise: 'Dupont SARL',
    telephone: '01 23 45 67 89',
    adresse: '123 Rue de la République, 75001 Paris',
    date_facture: '2024-01-15',
    montant_total: 1200.00
  },
  {
    numero_facture: 'FACT-2024-002',
    nom_client: 'Sophie Bernard',
    nom_entreprise: 'Bernard & Associés',
    telephone: '01 98 76 54 32',
    adresse: '456 Avenue des Champs, 69000 Lyon',
    date_facture: '2024-01-20',
    montant_total: 2500.50
  },
  {
    numero_facture: 'FACT-2024-003',
    nom_client: 'Pierre Lambert',
    nom_entreprise: 'Lambert Consulting',
    telephone: '04 56 78 90 12',
    adresse: '789 Boulevard Saint-Michel, 13000 Marseille',
    date_facture: '2024-02-01',
    montant_total: 850.75
  }
];

const sampleLines = [
  // Facture 1
  { facture_id: 1, description: 'Développement site web', quantite: 40, prix_unitaire: 25.00, sous_total: 1000.00 },
  { facture_id: 1, description: 'Formation utilisateurs', quantite: 4, prix_unitaire: 50.00, sous_total: 200.00 },
  
  // Facture 2
  { facture_id: 2, description: 'Audit sécurité informatique', quantite: 1, prix_unitaire: 1500.00, sous_total: 1500.00 },
  { facture_id: 2, description: 'Rapport détaillé', quantite: 1, prix_unitaire: 500.00, sous_total: 500.00 },
  { facture_id: 2, description: 'Présentation résultats', quantite: 1, prix_unitaire: 500.50, sous_total: 500.50 },
  
  // Facture 3
  { facture_id: 3, description: 'Consultation stratégique', quantite: 5, prix_unitaire: 120.00, sous_total: 600.00 },
  { facture_id: 3, description: 'Document de recommandations', quantite: 1, prix_unitaire: 250.75, sous_total: 250.75 }
];

// Insérer les données d'exemple
const insertInvoice = db.prepare(`INSERT OR IGNORE INTO factures 
  (numero_facture, nom_client, nom_entreprise, telephone, adresse, date_facture, montant_total) 
  VALUES (?, ?, ?, ?, ?, ?, ?)`);

sampleInvoices.forEach(invoice => {
  insertInvoice.run(
    invoice.numero_facture,
    invoice.nom_client,
    invoice.nom_entreprise,
    invoice.telephone,
    invoice.adresse,
    invoice.date_facture,
    invoice.montant_total
  );
});

const insertLine = db.prepare(`INSERT OR IGNORE INTO lignes 
  (facture_id, description, quantite, prix_unitaire, sous_total) 
  VALUES (?, ?, ?, ?, ?)`);

sampleLines.forEach(line => {
  insertLine.run(
    line.facture_id,
    line.description,
    line.quantite,
    line.prix_unitaire,
    line.sous_total
  );
});

console.log('Base de données initialisée avec succès !');
console.log('Tables créées: factures, lignes');
console.log('Données d\'exemple insérées.');

db.close();
