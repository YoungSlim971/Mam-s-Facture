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

