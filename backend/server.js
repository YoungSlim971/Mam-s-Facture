require('ts-node/register/transpile-only');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const buildFactureHTML = require('./services/htmlService');
const generatePdf = require('./pdf/generatePdf');
const SQLiteDatabase = require('./database/sqlite');
const { computeTotals } = require('./utils/computeTotals.ts');
const { getRandomQuote } = require('./services/quoteService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Gestion du stockage des logos
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  }
});

const clientLogoDir = path.join(uploadDir, 'logos');
if (!fs.existsSync(clientLogoDir)) {
  fs.mkdirSync(clientLogoDir, { recursive: true });
}
const clientLogoStorage = multer.diskStorage({
  destination: clientLogoDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});
const uploadClientLogo = multer({
  storage: clientLogoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  }
});
app.use('/uploads', express.static(uploadDir));

let db;
const dbReady = (async () => {
  db = await SQLiteDatabase.create();
})();

// Formatters réutilisables pour éviter de recréer les objets à chaque appel
const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR'
});
const { format } = require('date-fns');
const { fr } = require('date-fns/locale');

// Utilitaire pour formater les montants en euros
const formatEuro = (amount) => euroFormatter.format(amount);

// Utilitaire pour formater les dates en français
const formatDateFR = (dateString) => {
  const date = new Date(dateString);
  return format(date, 'dd/MM/yyyy', { locale: fr });
};

// Générer un numéro de facture automatique
const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const factures = db.getFactures();
  const existingNumbers = factures
    .map((f) => {
      const match = f.numero_facture.match(/^FACT-(\d{4})-(\d+)/);
      return match && parseInt(match[1], 10) === year
        ? parseInt(match[2], 10)
        : NaN;
    })
    .filter((n) => !isNaN(n));
  const next = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `FACT-${year}-${String(next).padStart(3, '0')}`;
};

// Routes API

// Upload du logo
app.post('/api/upload/logo', upload.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier fourni' });
  }
  res.json({ filename: req.file.filename });
});

// Upload du logo client
app.post('/api/upload/logo-client', uploadClientLogo.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier fourni' });
  }
  res.json({ path: `/uploads/logos/${req.file.filename}` });
});

// Gestion des clients
app.get('/api/clients', (req, res) => {
  try {
    res.json(db.getClients());
  } catch (err) {
    res.status(500).json({
      error: 'Erreur lors de la récupération des clients',
      details: err.message
    });
  }
});

app.post('/api/clients', (req, res) => {
  try {
    const {
      nom_client,
      prenom_client = '',
      nom_entreprise = '',
      telephone = '',
      email = '',
      adresse_facturation = '',
      adresse_livraison = '',
      intitule = '',
      siren = '',
      siret = '',
      legal_form = '',
      tva = '',
      rcs_number = '',
      logo = ''
    } = req.body;
    if (!nom_client) {
      return res.status(400).json({ error: 'Nom du client requis' });
    }
    const id = db.createClient({
      nom_client: nom_client.trim(),
      prenom_client: prenom_client.trim(),
      nom_entreprise: nom_entreprise.trim(),
      telephone: telephone.trim(),
      email: email.trim(),
      adresse_facturation: adresse_facturation.trim(),
      adresse_livraison: adresse_livraison.trim(),
      intitule: intitule.trim(),
      siren: siren.trim(),
      siret: siret.trim(),
      legal_form: legal_form.trim(),
      tva: tva.trim(),
      rcs_number: rcs_number.trim(),
      logo: logo.trim()
    });
    db.synchroniserFacturesParClient();
    const client = db.getClientById(id);
    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({
      error: 'Erreur lors de la création du client',
      details: err.message
    });
  }
});

app.get('/api/clients/:id', (req, res) => {
  try {
    const client = db.getClientById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client non trouvé' });
    res.json(client);
  } catch (err) {
    res.status(500).json({
      error: 'Erreur lors de la récupération du client',
      details: err.message
    });
  }
});

app.put('/api/clients/:id', (req, res) => {
  try {
    const {
      nom_client,
      prenom_client = '',
      nom_entreprise = '',
      telephone = '',
      email = '',
      adresse_facturation = '',
      adresse_livraison = '',
      intitule = '',
      siren = '',
      siret = '',
      legal_form = '',
      tva = '',
      rcs_number = '',
      logo = ''
    } = req.body;
    if (!nom_client) {
      return res.status(400).json({ error: 'Nom du client requis' });
    }
    const success = db.updateClient(req.params.id, {
      nom_client: nom_client.trim(),
      prenom_client: prenom_client.trim(),
      nom_entreprise: nom_entreprise.trim(),
      telephone: telephone.trim(),
      email: email.trim(),
      adresse_facturation: adresse_facturation.trim(),
      adresse_livraison: adresse_livraison.trim(),
      intitule: intitule.trim(),
      siren: siren.trim(),
      siret: siret.trim(),
      legal_form: legal_form.trim(),
      tva: tva.trim(),
      rcs_number: rcs_number.trim(),
      logo: logo.trim()
    });
    if (!success) return res.status(404).json({ error: 'Client non trouvé' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      error: 'Erreur lors de la mise à jour du client',
      details: err.message
    });
  }
});

// GET /api/factures - Liste toutes les factures avec pagination et recherche
app.get('/api/factures', (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      dateDebut = '',
      dateFin = '',
      status = '',
      sortBy = 'date',
      order = 'desc'
    } = req.query;

    // Sécuriser et convertir les paramètres de pagination
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    const filters = { search, dateDebut, dateFin };
    if (status) filters.status = status;
    const allFactures = db.getFactures(filters);

    // Tri
    const sortFieldMap = {
      nom: 'nom_client',
      entreprise: 'nom_entreprise',
      date: 'date_facture'
    };
    const sortField = sortFieldMap[sortBy] || 'date_facture';
    const sortOrder = order === 'asc' ? 1 : -1;

    allFactures.sort((a, b) => {
      const aVal =
        sortField === 'date_facture'
          ? new Date(a[sortField])
          : (a[sortField] || '').toString().toLowerCase();
      const bVal =
        sortField === 'date_facture'
          ? new Date(b[sortField])
          : (b[sortField] || '').toString().toLowerCase();
      if (aVal < bVal) return -1 * sortOrder;
      if (aVal > bVal) return 1 * sortOrder;
      return 0;
    });

    const total = allFactures.length;
    
    // Pagination
    const factures = allFactures.slice(offset, offset + limitNum);

    // Ajouter le formatage français
    const facturesFormatees = factures.map(row => ({
      ...row,
      date_facture_fr: formatDateFR(row.date_facture),
      montant_total_fr: formatEuro(row.montant_total)
    }));

    res.json({
      factures: facturesFormatees,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des factures',
      details: err.message 
    });
  }
});

// GET /api/factures/:id - Récupère une facture spécifique avec ses lignes
app.get('/api/factures/:id', (req, res) => {
  try {
    const { id } = req.params;
    const facture = db.getFactureById(id);

    if (!facture) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    res.json({
      ...facture,
      date_facture_fr: formatDateFR(facture.date_facture),
      montant_total_fr: formatEuro(facture.montant_total)
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de la facture',
      details: err.message 
    });
  }
});

// POST /api/factures - Crée une nouvelle facture
app.post('/api/factures', (req, res) => {
  try {
    const {
      numero_facture: numero_facture_input = '',
      client_id = null,
      nom_client,
      nom_entreprise = '',
      telephone = '',
      adresse = '',
      date_facture,
      lignes = [],
      title = '',
      status = 'unpaid',
      logo_path = '',
      siren = '',
      siret = '',
      legal_form = '',
      vat_number = '',
      vat_rate = 0,
      montant_total: montant_total_input = undefined,
      rcs_number = ''
    } = req.body;
    const parsedVatRate =
      vat_rate !== undefined && vat_rate !== '' ? parseFloat(vat_rate) : 20;


    // Validation
    if (!nom_client || !date_facture || !lignes.length) {
      return res.status(400).json({
        error: 'Données manquantes',
        details: 'Le nom du client, la date et au moins une ligne sont requis'
      });
    }

    for (let i = 0; i < lignes.length; i++) {
      const q = parseFloat(lignes[i].quantite);
      const pu = parseFloat(lignes[i].prix_unitaire);
      if (!(q > 0)) {
        return res.status(400).json({
          error: 'Quantité invalide',
          details: `La quantité de la ligne ${i + 1} doit être supérieure à 0`
        });
      }
      if (!(pu >= 0)) {
        return res.status(400).json({
          error: 'Prix unitaire invalide',
          details: `Le prix unitaire de la ligne ${i + 1} doit être positif`
        });
      }
    }


    let montant_total;
    if (montant_total_input !== undefined && montant_total_input !== '') {
      montant_total = parseFloat(montant_total_input);
    } else {
      const { totalHT } = computeTotals(lignes, parsedVatRate);
      montant_total = totalHT;
    }

    const numero_facture = numero_facture_input.trim() || generateInvoiceNumber();

    const factureData = {
      numero_facture,
      ...(client_id ? { client_id: parseInt(client_id) } : {}),
      nom_client: nom_client.trim(),
      nom_entreprise: nom_entreprise.trim(),
      telephone: telephone.trim(),
      adresse: adresse.trim(),
      date_facture,
      montant_total,
      lignes,
      title,
      status,
      logo_path,
      siren,
      siret,
      legal_form,
      vat_number,
      vat_rate: parsedVatRate,
      rcs_number
    };

    const factureId = db.createFacture(factureData);
    if (client_id) {
      db.addFactureToClient(client_id, factureId);
    }
    db.synchroniserFacturesParClient();

    res.status(201).json({
      message: 'Facture créée avec succès',
      id: factureId,
      numero_facture
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erreur lors de la création de la facture',
      details: err.message 
    });
  }
});

// PUT /api/factures/:id - Mise à jour partielle d'une facture
app.put('/api/factures/:id', (req, res) => {
  try {
    const { id } = req.params;
    const facture = db.getFactureById(id);
    if (!facture) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    const updates = { ...req.body };

    if (updates.statut !== undefined) {
      if (updates.statut !== 'payée' && updates.statut !== 'non payée') {
        return res.status(400).json({ error: 'Statut invalide' });
      }
      updates.status = updates.statut === 'payée' ? 'paid' : 'unpaid';
      delete updates.statut;
    }
    if (updates.status !== undefined) {
      if (updates.status !== 'paid' && updates.status !== 'unpaid') {
        return res.status(400).json({ error: 'Statut invalide' });
      }
    }

    if (updates.lignes) {
      for (let i = 0; i < updates.lignes.length; i++) {
        const q = parseFloat(updates.lignes[i].quantite);
        const pu = parseFloat(updates.lignes[i].prix_unitaire);
        if (!(q > 0)) {
          return res.status(400).json({
            error: 'Quantité invalide',
            details: `La quantité de la ligne ${i + 1} doit être supérieure à 0`
          });
        }
        if (!(pu >= 0)) {
          return res.status(400).json({
            error: 'Prix unitaire invalide',
            details: `Le prix unitaire de la ligne ${i + 1} doit être positif`
          });
        }
      }
      if (updates.montant_total === undefined) {
        const rate =
          updates.vat_rate !== undefined && updates.vat_rate !== ''
            ? parseFloat(updates.vat_rate)
            : facture.vat_rate || 20;
        const { totalHT } = computeTotals(updates.lignes, rate);
        updates.montant_total = totalHT;
      }
    }

    const success = db.updateFacture(id, { ...facture, ...updates });
    if (success && updates.client_id) {
      db.addFactureToClient(updates.client_id, parseInt(id));
    }
    if (!success) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }
    db.synchroniserFacturesParClient();

    const updated = db.getFactureById(id);
    res.json(updated);
  } catch (err) {
    console.error('Erreur lors de PUT /api/factures/:id', err);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour de la facture',
      details: err.message
    });
  }
});

// PATCH /api/factures/:id/status - Met à jour uniquement le statut d'une facture
app.patch('/api/factures/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (status !== 'paid' && status !== 'unpaid') {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    const facture = db.getFactureById(id);
    if (!facture) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }
    const success = db.updateFacture(id, { ...facture, status });
    if (!success) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }
    db.synchroniserFacturesParClient();
    res.json({ message: 'Statut mis à jour' });
  } catch (err) {
    res.status(500).json({
      error: 'Erreur lors de la mise à jour du statut',
      details: err.message
    });
  }
});

// DELETE /api/factures/:id - Supprime une facture
app.delete('/api/factures/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = db.deleteFacture(id);

    if (!success) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    db.synchroniserFacturesParClient();

    res.json({ message: 'Facture supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erreur lors de la suppression de la facture',
      details: err.message 
    });
  }
});

// GET /api/factures/:id/html - Génère le HTML d'une facture
app.get('/api/factures/:id/html', (req, res) => {
  const facture = db.getFactureById(req.params.id);
  if (!facture) {
    return res.status(404).json({ error: 'Facture non trouvée' });
  }

  try {
    const html = buildFactureHTML(facture);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la génération du HTML' });
  }
});

// GET /api/factures/:id/pdf - Génère un PDF depuis le HTML
app.get('/api/factures/:id/pdf', async (req, res) => {
  const facture = db.getFactureById(req.params.id);
  if (!facture) {
    return res.status(404).json({ error: 'Facture non trouvée' });
  }
  try {
    console.log('Facture reçue pour export :', facture);
    const html = buildFactureHTML(facture);
    fs.writeFileSync('last-facture.html', html, 'utf-8');
    const pdf = await generatePdf(html);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  } catch (err) {
    console.error('Error generating PDF for invoice:', err);
    res.status(500).json({
      error: 'Erreur lors de la génération du PDF',
      details: err.message,
    });
  }
});


// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API de facturation opérationnelle',
    timestamp: new Date().toISOString(),
    storage: 'SQLite (sql.js)'
  });
});

app.get('/api/quote', (req, res) => {
  try {
    const quote = getRandomQuote();
    res.json(quote);
  } catch {
    res.status(500).json({ error: 'Erreur lors de la récupération de la citation' });
  }
});

// Route pour le camembert factures payées vs impayées du mois courant
app.get('/api/invoices', (req, res) => {
  const { month } = req.query;
  if (month !== 'current') {
    return res.status(400).json({ error: 'Paramètre month invalide' });
  }
  try {
    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const factures = db.getFactures();
    const current = factures.filter(f => {
      const d = new Date(f.date_facture);
      return d.getFullYear() === year && d.getMonth() === monthIndex;
    });
    const paid = current.filter(f => f.status === 'paid').length;
    const unpaid = current.filter(f => f.status !== 'paid').length;
    res.json({ paid, unpaid });
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne', details: err.message });
  }
});

// Route de statistiques
app.get('/api/stats', (req, res) => {
  try {
    const factures = db.getFactures();
    const total = factures.reduce((sum, f) => sum + f.montant_total, 0);
    
    res.json({
      totalFactures: factures.length,
      montantTotal: formatEuro(total),
      factureRecente: factures.length > 0 ? factures[0] : null
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques',
      details: err.message 
    });
  }
});

// Démarrage du serveur
if (require.main === module) {
  dbReady.then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Serveur de facturation démarré sur le port ${PORT}`);
      console.log(`📊 API disponible sur http://localhost:${PORT}/api`);
      console.log(`💾 Stockage: SQLite (sql.js)`);
      console.log(`📂 Fichier base: ${path.join(__dirname, 'database', 'facturation.sqlite')}`);
    });
  });
}

module.exports = dbReady.then(() => app);

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  console.log('💾 Données sauvegardées dans la base SQLite.');
  process.exit(0);
});
