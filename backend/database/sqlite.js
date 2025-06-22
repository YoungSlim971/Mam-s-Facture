const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js/dist/sql-asm.js');

class SQLiteDatabase {
  static async create() {
    const SQL = await initSqlJs();
    return new SQLiteDatabase(SQL);
  }

  constructor(SQL) {
    this.SQL = SQL;
    this.dbPath = path.join(__dirname, 'facturation.sqlite');
    const fileExists = fs.existsSync(this.dbPath);
    this.db = new this.SQL.Database(fileExists ? fs.readFileSync(this.dbPath) : undefined);
    this.init();
  }

  save() {
    const data = this.db.export();
    fs.writeFileSync(this.dbPath, Buffer.from(data));
  }

  init() {
    this.db.run(`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom_client TEXT NOT NULL,
      prenom_client TEXT,
      nom_entreprise TEXT,
      telephone TEXT,
      email TEXT,
      adresse_facturation TEXT,
      adresse_livraison TEXT,
      siret TEXT,
      tva TEXT,
      logo TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`);
    this.db.run(`CREATE TABLE IF NOT EXISTS factures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      numero_facture TEXT UNIQUE NOT NULL,
      nom_client TEXT NOT NULL,
      nom_entreprise TEXT,
      telephone TEXT,
      adresse TEXT,
      date_facture TEXT NOT NULL,
      montant_total REAL NOT NULL,
      status TEXT DEFAULT 'unpaid',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`);
    this.db.run(`CREATE TABLE IF NOT EXISTS lignes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      facture_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantite REAL NOT NULL,
      prix_unitaire REAL NOT NULL,
      sous_total REAL NOT NULL
    );`);
    this.save();
  }

  // Clients
  getClients() {
    const stmt = this.db.prepare('SELECT * FROM clients');
    const res = [];
    while (stmt.step()) res.push(stmt.getAsObject());
    stmt.free();
    return res;
  }

  getClientById(id) {
    const stmt = this.db.prepare('SELECT * FROM clients WHERE id=?');
    stmt.bind([id]);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return row;
  }

  createClient(data) {
    const stmt = this.db.prepare('INSERT INTO clients (nom_client, prenom_client, nom_entreprise, telephone, email, adresse_facturation, adresse_livraison, siret, tva, logo) VALUES (?,?,?,?,?,?,?,?,?,?)');
    stmt.run([
      data.nom_client,
      data.prenom_client || '',
      data.nom_entreprise || '',
      data.telephone || '',
      data.email || '',
      data.adresse_facturation || '',
      data.adresse_livraison || '',
      data.siret || '',
      data.tva || '',
      data.logo || ''
    ]);
    stmt.free();
    const id = this.db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
    this.save();
    return id;
  }

  updateClient(id, data) {
    const stmt = this.db.prepare('UPDATE clients SET nom_client=?, prenom_client=?, nom_entreprise=?, telephone=?, email=?, adresse_facturation=?, adresse_livraison=?, siret=?, tva=?, logo=?, updated_at=CURRENT_TIMESTAMP WHERE id=?');
    stmt.run([
      data.nom_client,
      data.prenom_client || '',
      data.nom_entreprise || '',
      data.telephone || '',
      data.email || '',
      data.adresse_facturation || '',
      data.adresse_livraison || '',
      data.siret || '',
      data.tva || '',
      data.logo || '',
      id
    ]);
    const changes = this.db.getRowsModified();
    stmt.free();
    this.save();
    return changes > 0;
  }

  // Factures
  getFactures() {
    const stmt = this.db.prepare('SELECT * FROM factures ORDER BY date_facture DESC');
    const result = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      row.lignes = this.getLignesForFacture(row.id);
      result.push(row);
    }
    stmt.free();
    return result;
  }

  getFactureById(id) {
    const stmt = this.db.prepare('SELECT * FROM factures WHERE id=?');
    stmt.bind([id]);
    if (!stmt.step()) { stmt.free(); return null; }
    const row = stmt.getAsObject();
    stmt.free();
    row.lignes = this.getLignesForFacture(id);
    return row;
  }

  getLignesForFacture(id) {
    const stmt = this.db.prepare('SELECT * FROM lignes WHERE facture_id=?');
    stmt.bind([id]);
    const res = [];
    while (stmt.step()) res.push(stmt.getAsObject());
    stmt.free();
    return res;
  }

  createFacture(data) {
    const { lignes = [], ...fact } = data;
    const stmt = this.db.prepare('INSERT INTO factures (client_id, numero_facture, nom_client, nom_entreprise, telephone, adresse, date_facture, montant_total, status) VALUES (?,?,?,?,?,?,?,?,?)');
    stmt.run([fact.client_id || null, fact.numero_facture, fact.nom_client, fact.nom_entreprise || '', fact.telephone || '', fact.adresse || '', fact.date_facture, fact.montant_total, fact.status || 'unpaid']);
    stmt.free();
    const factureId = this.db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
    lignes.forEach(l => {
      const lstmt = this.db.prepare('INSERT INTO lignes (facture_id, description, quantite, prix_unitaire, sous_total) VALUES (?,?,?,?,?)');
      lstmt.run([factureId, l.description, l.quantite, l.prix_unitaire, l.quantite * l.prix_unitaire]);
      lstmt.free();
    });
    this.save();
    return factureId;
  }

  updateFacture(id, data) {
    const { lignes = [], ...fact } = data;
    const stmt = this.db.prepare('UPDATE factures SET client_id=?, numero_facture=?, nom_client=?, nom_entreprise=?, telephone=?, adresse=?, date_facture=?, montant_total=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?');
    stmt.run([fact.client_id || null, fact.numero_facture, fact.nom_client, fact.nom_entreprise || '', fact.telephone || '', fact.adresse || '', fact.date_facture, fact.montant_total, fact.status || 'unpaid', id]);
    const changes = this.db.getRowsModified();
    stmt.free();
    this.db.run('DELETE FROM lignes WHERE facture_id=?', [id]);
    lignes.forEach(l => {
      const lstmt = this.db.prepare('INSERT INTO lignes (facture_id, description, quantite, prix_unitaire, sous_total) VALUES (?,?,?,?,?)');
      lstmt.run([id, l.description, l.quantite, l.prix_unitaire, l.quantite * l.prix_unitaire]);
      lstmt.free();
    });
    this.save();
    return changes > 0;
  }

  deleteFacture(id) {
    this.db.run('DELETE FROM factures WHERE id=?', [id]);
    const changes = this.db.getRowsModified();
    this.db.run('DELETE FROM lignes WHERE facture_id=?', [id]);
    this.save();
    return changes > 0;
  }

  addFactureToClient() {
    return true;
  }
}

module.exports = SQLiteDatabase;
diff --git a/backend/database/sqlite.js b/backend/database/sqlite.js
index abedc69ebe2d0374816889f2b1339790652c92c7..f079fd600153d55371b0133e5c40647d05b253a6 100644
--- a/backend/database/sqlite.js
+++ b/backend/database/sqlite.js
@@ -12,187 +12,346 @@ class SQLiteDatabase {
     this.SQL = SQL;
     this.dbPath = path.join(__dirname, 'facturation.sqlite');
     const fileExists = fs.existsSync(this.dbPath);
     this.db = new this.SQL.Database(fileExists ? fs.readFileSync(this.dbPath) : undefined);
     this.init();
   }
 
   save() {
     const data = this.db.export();
     fs.writeFileSync(this.dbPath, Buffer.from(data));
   }
 
   init() {
     this.db.run(`CREATE TABLE IF NOT EXISTS clients (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       nom_client TEXT NOT NULL,
       prenom_client TEXT,
       nom_entreprise TEXT,
       telephone TEXT,
       email TEXT,
       adresse_facturation TEXT,
       adresse_livraison TEXT,
       siret TEXT,
       tva TEXT,
       logo TEXT,
+      factures TEXT DEFAULT '[]',
+      nombre_de_factures INTEGER DEFAULT 0,
+      factures_payees INTEGER DEFAULT 0,
+      factures_impayees INTEGER DEFAULT 0,
+      total_facture REAL DEFAULT 0,
+      total_paye REAL DEFAULT 0,
       created_at TEXT DEFAULT CURRENT_TIMESTAMP,
       updated_at TEXT DEFAULT CURRENT_TIMESTAMP
     );`);
+
+    // Migrations éventuelles pour la table clients
+    const cInfo = this.db.exec("PRAGMA table_info(clients)");
+    const cCols = cInfo[0].values.map(v => v[1]);
+    if (!cCols.includes('factures')) {
+      this.db.run("ALTER TABLE clients ADD COLUMN factures TEXT DEFAULT '[]'");
+    }
+    if (!cCols.includes('nombre_de_factures')) {
+      this.db.run(
+        'ALTER TABLE clients ADD COLUMN nombre_de_factures INTEGER DEFAULT 0'
+      );
+    }
+    if (!cCols.includes('factures_payees')) {
+      this.db.run(
+        'ALTER TABLE clients ADD COLUMN factures_payees INTEGER DEFAULT 0'
+      );
+    }
+    if (!cCols.includes('factures_impayees')) {
+      this.db.run(
+        'ALTER TABLE clients ADD COLUMN factures_impayees INTEGER DEFAULT 0'
+      );
+    }
+    if (!cCols.includes('total_facture')) {
+      this.db.run(
+        'ALTER TABLE clients ADD COLUMN total_facture REAL DEFAULT 0'
+      );
+    }
+    if (!cCols.includes('total_paye')) {
+      this.db.run("ALTER TABLE clients ADD COLUMN total_paye REAL DEFAULT 0");
+    }
     this.db.run(`CREATE TABLE IF NOT EXISTS factures (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       client_id INTEGER,
       numero_facture TEXT UNIQUE NOT NULL,
       nom_client TEXT NOT NULL,
       nom_entreprise TEXT,
       telephone TEXT,
       adresse TEXT,
       date_facture TEXT NOT NULL,
       montant_total REAL NOT NULL,
+      status TEXT DEFAULT 'unpaid',
       created_at TEXT DEFAULT CURRENT_TIMESTAMP,
       updated_at TEXT DEFAULT CURRENT_TIMESTAMP
     );`);
+
+    // Ajout de la colonne status si elle n'existait pas dans une base existante
+    const info = this.db.exec("PRAGMA table_info(factures)");
+    const hasStatus = info[0].values.some(row => row[1] === 'status');
+    if (!hasStatus) {
+      this.db.run("ALTER TABLE factures ADD COLUMN status TEXT DEFAULT 'unpaid'");
+    }
     this.db.run(`CREATE TABLE IF NOT EXISTS lignes (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       facture_id INTEGER NOT NULL,
       description TEXT NOT NULL,
       quantite REAL NOT NULL,
       prix_unitaire REAL NOT NULL,
       sous_total REAL NOT NULL
     );`);
     this.save();
   }
 
   // Clients
   getClients() {
     const stmt = this.db.prepare('SELECT * FROM clients');
     const res = [];
     while (stmt.step()) res.push(stmt.getAsObject());
     stmt.free();
     return res;
   }
 
   getClientById(id) {
     const stmt = this.db.prepare('SELECT * FROM clients WHERE id=?');
     stmt.bind([id]);
     const row = stmt.step() ? stmt.getAsObject() : null;
     stmt.free();
     return row;
   }
 
   createClient(data) {
     const stmt = this.db.prepare('INSERT INTO clients (nom_client, prenom_client, nom_entreprise, telephone, email, adresse_facturation, adresse_livraison, siret, tva, logo) VALUES (?,?,?,?,?,?,?,?,?,?)');
     stmt.run([
       data.nom_client,
       data.prenom_client || '',
       data.nom_entreprise || '',
       data.telephone || '',
       data.email || '',
       data.adresse_facturation || '',
       data.adresse_livraison || '',
       data.siret || '',
       data.tva || '',
       data.logo || ''
     ]);
     stmt.free();
     const id = this.db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
     this.save();
+    this.synchroniserFacturesParClient();
     return id;
   }
 
   updateClient(id, data) {
     const stmt = this.db.prepare('UPDATE clients SET nom_client=?, prenom_client=?, nom_entreprise=?, telephone=?, email=?, adresse_facturation=?, adresse_livraison=?, siret=?, tva=?, logo=?, updated_at=CURRENT_TIMESTAMP WHERE id=?');
     stmt.run([
       data.nom_client,
       data.prenom_client || '',
       data.nom_entreprise || '',
       data.telephone || '',
       data.email || '',
       data.adresse_facturation || '',
       data.adresse_livraison || '',
       data.siret || '',
       data.tva || '',
       data.logo || '',
       id
     ]);
     const changes = this.db.getRowsModified();
     stmt.free();
     this.save();
+    this.synchroniserFacturesParClient();
     return changes > 0;
   }
 
   // Factures
-  getFactures() {
-    const stmt = this.db.prepare('SELECT * FROM factures ORDER BY date_facture DESC');
+  getFactures(filters = {}) {
+    let query = 'SELECT * FROM factures';
+    const clauses = [];
+    const params = [];
+
+    if (filters.search) {
+      clauses.push(
+        '(LOWER(nom_client) LIKE ? OR LOWER(nom_entreprise) LIKE ? OR numero_facture LIKE ?)'
+      );
+      const term = `%${filters.search.toLowerCase()}%`;
+      params.push(term, term, term);
+    }
+    if (filters.dateDebut) {
+      clauses.push('date_facture >= ?');
+      params.push(filters.dateDebut);
+    }
+    if (filters.dateFin) {
+      clauses.push('date_facture <= ?');
+      params.push(filters.dateFin);
+    }
+    if (filters.status) {
+      clauses.push('status = ?');
+      params.push(filters.status);
+    }
+
+    if (clauses.length) {
+      query += ' WHERE ' + clauses.join(' AND ');
+    }
+    query += ' ORDER BY date_facture DESC';
+
+    const stmt = this.db.prepare(query);
+    stmt.bind(params);
     const result = [];
     while (stmt.step()) {
       const row = stmt.getAsObject();
       row.lignes = this.getLignesForFacture(row.id);
       result.push(row);
     }
     stmt.free();
     return result;
   }
 
   getFactureById(id) {
     const stmt = this.db.prepare('SELECT * FROM factures WHERE id=?');
     stmt.bind([id]);
     if (!stmt.step()) { stmt.free(); return null; }
     const row = stmt.getAsObject();
     stmt.free();
     row.lignes = this.getLignesForFacture(id);
     return row;
   }
 
   getLignesForFacture(id) {
     const stmt = this.db.prepare('SELECT * FROM lignes WHERE facture_id=?');
     stmt.bind([id]);
     const res = [];
     while (stmt.step()) res.push(stmt.getAsObject());
     stmt.free();
     return res;
   }
 
   createFacture(data) {
     const { lignes = [], ...fact } = data;
-    const stmt = this.db.prepare('INSERT INTO factures (client_id, numero_facture, nom_client, nom_entreprise, telephone, adresse, date_facture, montant_total) VALUES (?,?,?,?,?,?,?,?)');
-    stmt.run([fact.client_id || null, fact.numero_facture, fact.nom_client, fact.nom_entreprise || '', fact.telephone || '', fact.adresse || '', fact.date_facture, fact.montant_total]);
+    const stmt = this.db.prepare('INSERT INTO factures (client_id, numero_facture, nom_client, nom_entreprise, telephone, adresse, date_facture, montant_total, status) VALUES (?,?,?,?,?,?,?,?,?)');
+    stmt.run([fact.client_id || null, fact.numero_facture, fact.nom_client, fact.nom_entreprise || '', fact.telephone || '', fact.adresse || '', fact.date_facture, fact.montant_total, fact.status || 'unpaid']);
     stmt.free();
     const factureId = this.db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
     lignes.forEach(l => {
       const lstmt = this.db.prepare('INSERT INTO lignes (facture_id, description, quantite, prix_unitaire, sous_total) VALUES (?,?,?,?,?)');
       lstmt.run([factureId, l.description, l.quantite, l.prix_unitaire, l.quantite * l.prix_unitaire]);
       lstmt.free();
     });
     this.save();
+    this.synchroniserFacturesParClient();
     return factureId;
   }
 
   updateFacture(id, data) {
     const { lignes = [], ...fact } = data;
-    const stmt = this.db.prepare('UPDATE factures SET client_id=?, numero_facture=?, nom_client=?, nom_entreprise=?, telephone=?, adresse=?, date_facture=?, montant_total=?, updated_at=CURRENT_TIMESTAMP WHERE id=?');
-    stmt.run([fact.client_id || null, fact.numero_facture, fact.nom_client, fact.nom_entreprise || '', fact.telephone || '', fact.adresse || '', fact.date_facture, fact.montant_total, id]);
+    const existing = this.getFactureById(id);
+    if (!existing) return false;
+    const statusToUse = fact.status !== undefined ? fact.status : existing.status;
+    const numero = fact.numero_facture !== undefined ? fact.numero_facture : existing.numero_facture;
+    const stmt = this.db.prepare('UPDATE factures SET client_id=?, numero_facture=?, nom_client=?, nom_entreprise=?, telephone=?, adresse=?, date_facture=?, montant_total=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?');
+    stmt.run([
+      fact.client_id || null,
+      numero,
+      fact.nom_client,
+      fact.nom_entreprise || '',
+      fact.telephone || '',
+      fact.adresse || '',
+      fact.date_facture,
+      fact.montant_total,
+      statusToUse || 'unpaid',
+      id
+    ]);
     const changes = this.db.getRowsModified();
     stmt.free();
     this.db.run('DELETE FROM lignes WHERE facture_id=?', [id]);
     lignes.forEach(l => {
       const lstmt = this.db.prepare('INSERT INTO lignes (facture_id, description, quantite, prix_unitaire, sous_total) VALUES (?,?,?,?,?)');
       lstmt.run([id, l.description, l.quantite, l.prix_unitaire, l.quantite * l.prix_unitaire]);
       lstmt.free();
     });
     this.save();
+    this.synchroniserFacturesParClient();
     return changes > 0;
   }
 
+  updateFactureStatus(id, status) {
+    const stmt = this.db.prepare(
+      'UPDATE factures SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
+    );
+    stmt.run([status, id]);
+    const changes = this.db.getRowsModified();
+    stmt.free();
+    this.save();
+    if (changes > 0) {
+      this.synchroniserFacturesParClient();
+      return true;
+    }
+    return false;
+  }
+
   deleteFacture(id) {
     this.db.run('DELETE FROM factures WHERE id=?', [id]);
     const changes = this.db.getRowsModified();
     this.db.run('DELETE FROM lignes WHERE facture_id=?', [id]);
     this.save();
+    this.synchroniserFacturesParClient();
     return changes > 0;
   }
 
   addFactureToClient() {
+    this.synchroniserFacturesParClient();
     return true;
   }
+
+  synchroniserFacturesParClient() {
+    const clients = this.getClients();
+    const factures = this.getFactures();
+
+    const map = new Map();
+    clients.forEach(c => {
+      map.set(c.id, {
+        factures: [],
+        nombre: 0,
+        payees: 0,
+        impayees: 0,
+        total: 0,
+        paye: 0
+      });
+    });
+
+    factures.forEach(f => {
+      if (f.client_id && map.has(f.client_id)) {
+        const m = map.get(f.client_id);
+        if (!m.factures.includes(f.id)) m.factures.push(f.id);
+        m.nombre += 1;
+        m.total += f.montant_total;
+        if (f.status === 'paid') {
+          m.payees += 1;
+          m.paye += f.montant_total;
+        } else {
+          m.impayees += 1;
+        }
+      }
+    });
+
+    map.forEach((info, id) => {
+      const stmt = this.db.prepare(
+        'UPDATE clients SET factures=?, nombre_de_factures=?, factures_payees=?, factures_impayees=?, total_facture=?, total_paye=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
+      );
+      stmt.run([
+        JSON.stringify(info.factures),
+        info.nombre,
+        info.payees,
+        info.impayees,
+        info.total,
+        info.paye,
+        id
+      ]);
+      stmt.free();
+    });
+    this.save();
+  }
 }
 
 module.exports = SQLiteDatabase;
diff --git a/backend/database/storage.js b/backend/database/storage.js
index 38a5357a2971aec7976404be9338a0b3d2136809..9712101fc16322a8374572cfc103bf62088dc1b7 100644
--- a/backend/database/storage.js
+++ b/backend/database/storage.js
@@ -98,70 +98,85 @@ class JSONDatabase {
         // Facture 1
         { id: 1, facture_id: 1, description: 'Développement site web', quantite: 40, prix_unitaire: 25.00, sous_total: 1000.00 },
         { id: 2, facture_id: 1, description: 'Formation utilisateurs', quantite: 4, prix_unitaire: 50.00, sous_total: 200.00 },
         
         // Facture 2
         { id: 3, facture_id: 2, description: 'Audit sécurité informatique', quantite: 1, prix_unitaire: 1500.00, sous_total: 1500.00 },
         { id: 4, facture_id: 2, description: 'Rapport détaillé', quantite: 1, prix_unitaire: 500.00, sous_total: 500.00 },
         { id: 5, facture_id: 2, description: 'Présentation résultats', quantite: 1, prix_unitaire: 500.50, sous_total: 500.50 },
         
         // Facture 3
         { id: 6, facture_id: 3, description: 'Consultation stratégique', quantite: 5, prix_unitaire: 120.00, sous_total: 600.00 },
         { id: 7, facture_id: 3, description: 'Document de recommandations', quantite: 1, prix_unitaire: 250.75, sous_total: 250.75 }
       ];
       this.writeData(this.lignesFile, sampleLignes);
     }
 
     if (!fs.existsSync(this.clientsFile)) {
       const sampleClients = [
         {
           id: 1,
           nom_client: 'Martin Dupont',
           nom_entreprise: 'Dupont SARL',
           telephone: '01 23 45 67 89',
           adresse: '123 Rue de la République, 75001 Paris',
           factures: [1],
+          nombre_de_factures: 1,
+          factures_payees: 1,
+          factures_impayees: 0,
+          total_facture: 1200.0,
+          total_paye: 1200.0,
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString()
         },
         {
           id: 2,
           nom_client: 'Sophie Bernard',
           nom_entreprise: 'Bernard & Associés',
           telephone: '01 98 76 54 32',
           adresse: '456 Avenue des Champs, 69000 Lyon',
           factures: [2],
+          nombre_de_factures: 1,
+          factures_payees: 0,
+          factures_impayees: 1,
+          total_facture: 2500.5,
+          total_paye: 0,
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString()
         },
         {
           id: 3,
           nom_client: 'Pierre Lambert',
           nom_entreprise: 'Lambert Consulting',
           telephone: '04 56 78 90 12',
           adresse: '789 Boulevard Saint-Michel, 13000 Marseille',
           factures: [3],
+          nombre_de_factures: 1,
+          factures_payees: 0,
+          factures_impayees: 1,
+          total_facture: 850.75,
+          total_paye: 0,
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString()
         }
       ];
       this.writeData(this.clientsFile, sampleClients);
     }
 
     // Charger les données en mémoire
     this.factures = this.readData(this.facturesFile);
     this.lignes = this.readData(this.lignesFile);
     this.clients = this.readData(this.clientsFile);
   }
 
   readData(file) {
     try {
       const data = fs.readFileSync(file, 'utf8');
       return JSON.parse(data);
     } catch (err) {
       console.error('Erreur lecture fichier:', err);
       return [];
     }
   }
 
   writeData(file, data) {
     try {
diff --git a/backend/database/storage.js b/backend/database/storage.js
index 38a5357a2971aec7976404be9338a0b3d2136809..9712101fc16322a8374572cfc103bf62088dc1b7 100644
--- a/backend/database/storage.js
+++ b/backend/database/storage.js
@@ -257,165 +272,224 @@ class JSONDatabase {
       created_at: now,
       updated_at: now
     };
 
     factures.push(nouvelleFacture);
 
     // Ajouter les lignes
     const nouvelleLignes = lignesData.map((ligne, index) => ({
       id: lignes.length > 0 ? Math.max(...lignes.map(l => l.id)) + 1 + index : 1 + index,
       facture_id: newId,
       description: ligne.description,
       quantite: parseFloat(ligne.quantite),
       prix_unitaire: parseFloat(ligne.prix_unitaire),
       sous_total: parseFloat(ligne.quantite) * parseFloat(ligne.prix_unitaire)
     }));
 
     lignes.push(...nouvelleLignes);
 
     // Sauvegarder
     this.writeData(this.facturesFile, factures);
     this.writeData(this.lignesFile, lignes);
 
     // Mettre à jour les caches
     this.factures = factures;
     this.lignes = lignes;
-
+    this.synchroniserFacturesParClient();
     return newId;
   }
 
   updateFacture(id, data) {
     const factures = this.factures;
     const lignes = this.lignes;
     
     const index = factures.findIndex(f => f.id === parseInt(id));
     if (index === -1) return false;
 
     // Mettre à jour la facture
     const { lignes: lignesData = [], ...factureSansLignes } = data;
 
     factures[index] = {
       ...factures[index],
       ...factureSansLignes,
       id: parseInt(id),
       client_id:
         factureSansLignes.client_id !== undefined
           ? parseInt(factureSansLignes.client_id)
           : factures[index].client_id || null,
       updated_at: new Date().toISOString()
     };
 
     // Supprimer les anciennes lignes
     const lignesFiltered = lignes.filter(l => l.facture_id !== parseInt(id));
     
     // Ajouter les nouvelles lignes
     const nouvelleLignes = lignesData.map((ligne, ligneIndex) => ({
       id: lignes.length > 0 ? Math.max(...lignes.map(l => l.id)) + 1 + ligneIndex : 1 + ligneIndex,
       facture_id: parseInt(id),
       description: ligne.description,
       quantite: parseFloat(ligne.quantite),
       prix_unitaire: parseFloat(ligne.prix_unitaire),
       sous_total: parseFloat(ligne.quantite) * parseFloat(ligne.prix_unitaire)
     }));
 
     lignesFiltered.push(...nouvelleLignes);
 
     // Sauvegarder
     this.writeData(this.facturesFile, factures);
     this.writeData(this.lignesFile, lignesFiltered);
 
     this.factures = factures;
     this.lignes = lignesFiltered;
-
+    this.synchroniserFacturesParClient();
     return true;
   }
 
   deleteFacture(id) {
     const factures = this.factures;
     const lignes = this.lignes;
     
     const index = factures.findIndex(f => f.id === parseInt(id));
     if (index === -1) return false;
 
     const facture = factures.splice(index, 1)[0];
 
     // Retirer la facture du client associé si besoin
     if (facture && facture.client_id) {
       const client = this.clients.find(c => c.id === facture.client_id);
       if (client) {
         client.factures = client.factures.filter(fid => fid !== facture.id);
         client.updated_at = new Date().toISOString();
         this.writeData(this.clientsFile, this.clients);
       }
     }
     // Supprimer les lignes associées
     const lignesFiltered = lignes.filter(l => l.facture_id !== parseInt(id));
 
     // Sauvegarder
     this.writeData(this.facturesFile, factures);
     this.writeData(this.lignesFile, lignesFiltered);
 
     this.factures = factures;
     this.lignes = lignesFiltered;
-
+    this.synchroniserFacturesParClient();
     return true;
   }
 
   getTotalCount(filters = {}) {
     return this.getFactures(filters).length;
   }
 
   // CLIENTS
   getClients() {
     return [...this.clients];
   }
 
   getClientById(id) {
     return this.clients.find(c => c.id === parseInt(id)) || null;
   }
 
   createClient(data) {
     const clients = this.clients;
     const newId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
     const now = new Date().toISOString();
     const client = {
       id: newId,
       nom_client: data.nom_client,
       nom_entreprise: data.nom_entreprise || '',
       telephone: data.telephone || '',
       adresse: data.adresse || '',
       factures: [],
+      nombre_de_factures: 0,
+      factures_payees: 0,
+      factures_impayees: 0,
+      total_facture: 0,
+      total_paye: 0,
       created_at: now,
       updated_at: now
     };
     clients.push(client);
     this.writeData(this.clientsFile, clients);
     this.clients = clients;
+    this.synchroniserFacturesParClient();
     return newId;
   }
 
   updateClient(id, data) {
     const index = this.clients.findIndex(c => c.id === parseInt(id));
     if (index === -1) return false;
     this.clients[index] = {
       ...this.clients[index],
       ...data,
       id: parseInt(id),
       updated_at: new Date().toISOString()
     };
     this.writeData(this.clientsFile, this.clients);
+    this.synchroniserFacturesParClient();
     return true;
   }
 
   addFactureToClient(clientId, factureId) {
     const client = this.clients.find(c => c.id === parseInt(clientId));
     if (!client) return false;
     if (!client.factures.includes(factureId)) {
       client.factures.push(factureId);
       client.updated_at = new Date().toISOString();
       this.writeData(this.clientsFile, this.clients);
     }
+    this.synchroniserFacturesParClient();
     return true;
   }
+
+  synchroniserFacturesParClient() {
+    const statsMap = new Map();
+    this.clients.forEach(c => {
+      statsMap.set(c.id, {
+        factures: [],
+        nombre: 0,
+        payees: 0,
+        impayees: 0,
+        total: 0,
+        paye: 0
+      });
+    });
+
+    this.factures.forEach(f => {
+      if (f.client_id && statsMap.has(f.client_id)) {
+        const s = statsMap.get(f.client_id);
+        if (!s.factures.includes(f.id)) s.factures.push(f.id);
+        s.nombre += 1;
+        s.total += f.montant_total;
+        if (f.status === 'paid') {
+          s.payees += 1;
+          s.paye += f.montant_total;
+        } else {
+          s.impayees += 1;
+        }
+      }
+    });
+
+    this.clients = this.clients.map(c => {
+      const st = statsMap.get(c.id) || {
+        factures: [],
+        nombre: 0,
+        payees: 0,
+        impayees: 0,
+        total: 0,
+        paye: 0
+      };
+      return {
+        ...c,
+        factures: st.factures,
+        nombre_de_factures: st.nombre,
+        factures_payees: st.payees,
+        factures_impayees: st.impayees,
+        total_facture: st.total,
+        total_paye: st.paye,
+        updated_at: new Date().toISOString()
+      };
+    });
+    this.writeData(this.clientsFile, this.clients);
+  }
 }
 
 module.exports = JSONDatabase;


