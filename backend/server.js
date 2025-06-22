require('ts-node/register/transpile-only');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const buildFactureHTML = require('./services/htmlService');
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
      siret = '',
      tva = '',
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
      siret: siret.trim(),
      tva: tva.trim(),
      logo: logo.trim()
    });
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
      siret = '',
      tva = '',
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
      siret: siret.trim(),
      tva: tva.trim(),
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

// PUT /api/factures/:id - Met à jour une facture
app.put('/api/factures/:id', (req, res) => {
  try {
    const { id } = req.params;
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

    const factureData = {
      ...(numero_facture_input ? { numero_facture: numero_facture_input.trim() } : {}),
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

    const success = db.updateFacture(id, factureData);
    if (success && client_id) {
      db.addFactureToClient(client_id, parseInt(id));
    }

    if (!success) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    res.json({ message: 'Facture mise à jour avec succès' });
  } catch (err) {
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
    const html = buildFactureHTML(facture);
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
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
diff --git a/backend/server.js b/backend/server.js
index 0fc53fa78cf89ad5458172c53d166af9221c7b20..9d486ad72f31f30904652af98c4fef8c07c7b1fa 100644
--- a/backend/server.js
+++ b/backend/server.js
@@ -314,51 +314,51 @@ app.get('/api/factures/:id', (req, res) => {
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
-      status = 'unpaid',
+      status,
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
diff --git a/backend/server.js b/backend/server.js
index 0fc53fa78cf89ad5458172c53d166af9221c7b20..9d486ad72f31f30904652af98c4fef8c07c7b1fa 100644
--- a/backend/server.js
+++ b/backend/server.js
@@ -417,131 +417,164 @@ app.post('/api/factures', (req, res) => {
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
 
 // PUT /api/factures/:id - Met à jour une facture
 app.put('/api/factures/:id', (req, res) => {
   try {
     const { id } = req.params;
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
-      status = 'unpaid',
+      status,
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
 
+    const existing = db.getFactureById(id);
+    if (!existing) {
+      return res.status(404).json({ error: 'Facture non trouvée' });
+    }
+
     const factureData = {
       ...(numero_facture_input ? { numero_facture: numero_facture_input.trim() } : {}),
       ...(client_id ? { client_id: parseInt(client_id) } : {}),
       nom_client: nom_client.trim(),
       nom_entreprise: nom_entreprise.trim(),
       telephone: telephone.trim(),
       adresse: adresse.trim(),
       date_facture,
       montant_total,
       lignes,
       title,
-      status,
+      status: status !== undefined ? status : existing.status,
       logo_path,
       siren,
       siret,
       legal_form,
       vat_number,
       vat_rate: parsedVatRate,
       rcs_number
     };
 
     const success = db.updateFacture(id, factureData);
     if (success && client_id) {
       db.addFactureToClient(client_id, parseInt(id));
     }
 
     if (!success) {
       return res.status(404).json({ error: 'Facture non trouvée' });
     }
 
     res.json({ message: 'Facture mise à jour avec succès' });
   } catch (err) {
-    res.status(500).json({ 
+    res.status(500).json({
       error: 'Erreur lors de la mise à jour de la facture',
-      details: err.message 
+      details: err.message
+    });
+  }
+});
+
+// PATCH /api/factures/:id/status - Met à jour uniquement le statut d'une facture
+app.patch('/api/factures/:id/status', (req, res) => {
+  try {
+    const { id } = req.params;
+    const { status } = req.body;
+    if (status !== 'paid' && status !== 'unpaid') {
+      return res.status(400).json({ error: 'Statut invalide' });
+    }
+    const facture = db.getFactureById(id);
+    if (!facture) {
+      return res.status(404).json({ error: 'Facture non trouvée' });
+    }
+    if (facture.status === status) {
+      return res.json({ message: 'Aucun changement' });
+    }
+    const success = db.updateFactureStatus(id, status);
+    if (!success) {
+      return res.status(404).json({ error: 'Facture non trouvée' });
+    }
+    res.json({ message: 'Statut mis à jour' });
+  } catch (err) {
+    res.status(500).json({
+      error: 'Erreur lors de la mise à jour du statut',
+      details: err.message
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

