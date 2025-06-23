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
      intitule TEXT,
      siren TEXT,
      siret TEXT,
      legal_form TEXT,
      tva TEXT,
      rcs_number TEXT,
      logo TEXT,
      nombre_de_factures INTEGER DEFAULT 0,
      factures_payees INTEGER DEFAULT 0,
      factures_impayees INTEGER DEFAULT 0,
      total_facture REAL DEFAULT 0,
      total_paye REAL DEFAULT 0,
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
      -- Emitter fields from user_profile, denormalized for historical accuracy
      emitter_full_name TEXT,
      emitter_address_street TEXT,
      emitter_address_postal_code TEXT,
      emitter_address_city TEXT,
      emitter_siret_siren TEXT,
      emitter_ape_naf_code TEXT,
      emitter_vat_number TEXT,
      emitter_email TEXT,
      emitter_phone TEXT,
      emitter_activity_start_date TEXT,
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

    this.db.run(`CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT,
      address_street TEXT,
      address_postal_code TEXT,
      address_city TEXT,
      siret_siren TEXT,
      ape_naf_code TEXT,
      vat_number TEXT,
      email TEXT,
      phone TEXT,
      activity_start_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`);

    const cols = this.db.exec('PRAGMA table_info(clients)')[0].values.map(r => r[1]);
    if (!cols.includes('nombre_de_factures')) this.db.run('ALTER TABLE clients ADD COLUMN nombre_de_factures INTEGER DEFAULT 0');
    if (!cols.includes('factures_payees')) this.db.run('ALTER TABLE clients ADD COLUMN factures_payees INTEGER DEFAULT 0');
    if (!cols.includes('factures_impayees')) this.db.run('ALTER TABLE clients ADD COLUMN factures_impayees INTEGER DEFAULT 0');
    if (!cols.includes('total_facture')) this.db.run('ALTER TABLE clients ADD COLUMN total_facture REAL DEFAULT 0');
    if (!cols.includes('total_paye')) this.db.run('ALTER TABLE clients ADD COLUMN total_paye REAL DEFAULT 0');
    if (!cols.includes('intitule')) this.db.run("ALTER TABLE clients ADD COLUMN intitule TEXT");
    if (!cols.includes('siren')) this.db.run("ALTER TABLE clients ADD COLUMN siren TEXT");
    if (!cols.includes('legal_form')) this.db.run("ALTER TABLE clients ADD COLUMN legal_form TEXT");
    if (!cols.includes('rcs_number')) this.db.run("ALTER TABLE clients ADD COLUMN rcs_number TEXT");
    this.save();
  }

  // Clients
  getClients() {
    const stmt = this.db.prepare('SELECT * FROM clients');
    const res = [];
    const factures = this.getFactures();
    while (stmt.step()) {
      const row = stmt.getAsObject();
      row.factures = factures
        .filter(f => f.client_id === row.id)
        .map(f => f.id);
      res.push(row);
    }
    stmt.free();
    return res;
  }

  getClientById(id) {
    const stmt = this.db.prepare('SELECT * FROM clients WHERE id=?');
    stmt.bind([id]);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    if (!row) return null;
    const factures = this.getFactures();
    row.factures = factures.filter(f => f.client_id === row.id).map(f => f.id);
    return row;
  }

  createClient(data) {
    const stmt = this.db.prepare('INSERT INTO clients (nom_client, prenom_client, nom_entreprise, telephone, email, adresse_facturation, adresse_livraison, intitule, siren, siret, legal_form, tva, rcs_number, logo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    stmt.run([
      data.nom_client,
      data.prenom_client || '',
      data.nom_entreprise || '',
      data.telephone || '',
      data.email || '',
      data.adresse_facturation || '',
      data.adresse_livraison || '',
      data.intitule || '',
      data.siren || '',
      data.siret || '',
      data.legal_form || '',
      data.tva || '',
      data.rcs_number || '',
      data.logo || ''
    ]);
    stmt.free();
    const id = this.db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
    this.save();
    return id;
  }

  updateClient(id, data) {
    const stmt = this.db.prepare('UPDATE clients SET nom_client=?, prenom_client=?, nom_entreprise=?, telephone=?, email=?, adresse_facturation=?, adresse_livraison=?, intitule=?, siren=?, siret=?, legal_form=?, tva=?, rcs_number=?, logo=?, updated_at=CURRENT_TIMESTAMP WHERE id=?');
    stmt.run([
      data.nom_client,
      data.prenom_client || '',
      data.nom_entreprise || '',
      data.telephone || '',
      data.email || '',
      data.adresse_facturation || '',
      data.adresse_livraison || '',
      data.intitule || '',
      data.siren || '',
      data.siret || '',
      data.legal_form || '',
      data.tva || '',
      data.rcs_number || '',
      data.logo || '',
      id
    ]);
    const changes = this.db.getRowsModified();
    stmt.free();
    this.save();
    return changes > 0;
  }

  // Factures
  getFactures(filters = {}) {
    const stmt = this.db.prepare('SELECT * FROM factures ORDER BY date_facture DESC');
    const result = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      row.lignes = this.getLignesForFacture(row.id);
      result.push(row);
    }
    stmt.free();

    if (filters.status) {
      return result.filter(f => f.status === filters.status);
    }
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
    // Prepare all fields for insertion, including new emitter fields
    const query = `INSERT INTO factures (
      client_id, numero_facture, nom_client, nom_entreprise, telephone, adresse,
      date_facture, montant_total, status,
      emitter_full_name, emitter_address_street, emitter_address_postal_code, emitter_address_city,
      emitter_siret_siren, emitter_ape_naf_code, emitter_vat_number, emitter_email, emitter_phone,
      emitter_activity_start_date
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const stmt = this.db.prepare(query);
    stmt.run([
      fact.client_id || null,
      fact.numero_facture,
      fact.nom_client,
      fact.nom_entreprise || '',
      fact.telephone || '',
      fact.adresse || '',
      fact.date_facture,
      fact.montant_total,
      fact.status || 'unpaid',
      fact.emitter_full_name || null,
      fact.emitter_address_street || null,
      fact.emitter_address_postal_code || null,
      fact.emitter_address_city || null,
      fact.emitter_siret_siren || null,
      fact.emitter_ape_naf_code || null,
      fact.emitter_vat_number || null,
      fact.emitter_email || null,
      fact.emitter_phone || null,
      fact.emitter_activity_start_date || null
    ]);
    stmt.free();
    const factureId = this.db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
    lignes.forEach(l => {
      const lstmt = this.db.prepare('INSERT INTO lignes (facture_id, description, quantite, prix_unitaire, sous_total) VALUES (?,?,?,?,?)');
      lstmt.run([factureId, l.description, l.quantite, l.prix_unitaire, l.quantite * l.prix_unitaire]);
      lstmt.free();
    });
    this.save();
    this.synchroniserFacturesParClient();
    return factureId;
  }

  updateFacture(id, data) {
    const { lignes = [], ...fact } = data;
    // Include emitter fields in the update query
    // Typically, emitter details on an invoice are fixed after creation.
    // However, if the model requires them to be updatable along with other invoice details, they are included here.
    // For this implementation, we'll allow them to be updated if provided.
    const query = `UPDATE factures SET
      client_id=?, numero_facture=?, nom_client=?, nom_entreprise=?, telephone=?, adresse=?,
      date_facture=?, montant_total=?, status=?,
      emitter_full_name=?, emitter_address_street=?, emitter_address_postal_code=?, emitter_address_city=?,
      emitter_siret_siren=?, emitter_ape_naf_code=?, emitter_vat_number=?, emitter_email=?, emitter_phone=?,
      emitter_activity_start_date=?,
      updated_at=CURRENT_TIMESTAMP
      WHERE id=?`;
    const stmt = this.db.prepare(query);
    stmt.run([
      fact.client_id || null,
      fact.numero_facture,
      fact.nom_client,
      fact.nom_entreprise || '',
      fact.telephone || '',
      fact.adresse || '',
      fact.date_facture,
      fact.montant_total,
      fact.status || 'unpaid',
      fact.emitter_full_name || null,
      fact.emitter_address_street || null,
      fact.emitter_address_postal_code || null,
      fact.emitter_address_city || null,
      fact.emitter_siret_siren || null,
      fact.emitter_ape_naf_code || null,
      fact.emitter_vat_number || null,
      fact.emitter_email || null,
      fact.emitter_phone || null,
      fact.emitter_activity_start_date || null,
      id
    ]);
    const changes = this.db.getRowsModified();
    stmt.free();
    this.db.run('DELETE FROM lignes WHERE facture_id=?', [id]);
    lignes.forEach(l => {
      const lstmt = this.db.prepare('INSERT INTO lignes (facture_id, description, quantite, prix_unitaire, sous_total) VALUES (?,?,?,?,?)');
      lstmt.run([id, l.description, l.quantite, l.prix_unitaire, l.quantite * l.prix_unitaire]);
      lstmt.free();
    });
    this.save();
    if (changes > 0) this.synchroniserFacturesParClient();
    return changes > 0;
  }

  deleteFacture(id) {
    this.db.run('DELETE FROM factures WHERE id=?', [id]);
    const changes = this.db.getRowsModified();
    this.db.run('DELETE FROM lignes WHERE facture_id=?', [id]);
    this.save();
    if (changes > 0) this.synchroniserFacturesParClient();
    return changes > 0;
  }

  addFactureToClient() {
    this.synchroniserFacturesParClient();
    return true;
  }

  synchroniserFacturesParClient() {
    const factures = this.getFactures();
    const clients = this.getClients();
    clients.forEach(c => {
      const f = factures.filter(fa => fa.client_id === c.id);
      const ids = f.map(fa => fa.id);
      const nombre = ids.length;
      const payees = f.filter(fa => fa.status === 'paid').length;
      const impayees = nombre - payees;
      const totalFact = f.reduce((sum, fa) => sum + fa.montant_total, 0);
      const totalPaye = f
        .filter(fa => fa.status === 'paid')
        .reduce((sum, fa) => sum + fa.montant_total, 0);
      this.db.run(
        'UPDATE clients SET nombre_de_factures=?, factures_payees=?, factures_impayees=?, total_facture=?, total_paye=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
        [nombre, payees, impayees, totalFact, totalPaye, c.id]
      );
    });
    this.save();
    return true;
  }

  // User Profile
  getUserProfile() {
    // Assuming a single profile for the application user, fetch the first one.
    // Create an empty one if it doesn't exist.
    let stmt = this.db.prepare('SELECT * FROM user_profile LIMIT 1');
    const profile = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();

    if (!profile) {
      // Create a dummy/default profile row if none exists
      // This simplifies frontend logic as it can always expect an object
      const insertStmt = this.db.prepare('INSERT INTO user_profile (id) VALUES (1)');
      insertStmt.run();
      insertStmt.free();
      this.save();
      stmt = this.db.prepare('SELECT * FROM user_profile WHERE id = 1');
      const newProfile = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();
      return newProfile;
    }
    return profile;
  }

  upsertUserProfile(data) {
    // Check if a profile exists
    const existingProfile = this.getUserProfile(); // This will create one if it doesn't exist

    const stmt = this.db.prepare(
      `UPDATE user_profile SET
        full_name = ?,
        address_street = ?,
        address_postal_code = ?,
        address_city = ?,
        siret_siren = ?,
        ape_naf_code = ?,
        vat_number = ?,
        email = ?,
        phone = ?,
        activity_start_date = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
    );
    stmt.run([
      data.full_name || null,
      data.address_street || null,
      data.address_postal_code || null,
      data.address_city || null,
      data.siret_siren || null,
      data.ape_naf_code || null,
      data.vat_number || null,
      data.email || null,
      data.phone || null,
      data.activity_start_date || null,
      existingProfile.id // Use the ID of the existing or newly created profile
    ]);
    stmt.free();
    this.save();
    return this.getUserProfile(); // Return the updated profile
  }
}

module.exports = SQLiteDatabase;
