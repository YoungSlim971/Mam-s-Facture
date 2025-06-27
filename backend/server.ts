// TS-Node registration removed as this file will be pre-compiled
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
// Import mapFactureToInvoiceData from htmlService
import { mapFactureToInvoiceData } from './services/htmlService';
// Import generateInvoiceHTML from invoiceHTML
import { generateInvoiceHTML } from './invoiceHTML';
import SQLiteDatabase from './database/sqlite';
import { computeTotals } from './utils/computeTotals';
import { getRandomQuote } from './services/quoteService';
import { errorHandler } from './middleware/errorHandler';
// Legacy JSON profile helpers removed in favour of SQLite storage
// eslint-disable-next-line @typescript-eslint/no-var-requires
const seedDemoData = require('./scripts/seed-demo-data');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Authentication Middleware
const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.sendStatus(401); // Unauthorized if no token
  }

  // For this example, API_TOKEN is an environment variable.
  // In a real application, use a more secure way to store and manage tokens.
  if (token === process.env.API_TOKEN) {
    next(); // Token is valid
  } else {
    return res.sendStatus(403); // Forbidden if token is invalid
  }
};

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

const seedIfNeeded = async () => {
  await dbReady;
  if (db.getMeta('hasSeeded')) return;
  const profile = db.getUserProfile();
  const hasData = (profile && profile.full_name) || db.getClients().length > 0 || db.getFactures().length > 0;
  if (!hasData) {
    await seedDemoData(db);
  }
  db.setMeta('hasSeeded', 'true');
};
seedIfNeeded();

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

// Apply authentication to /api/invoices and /api/clients routes
app.use('/api/invoices', authenticateToken);
app.use('/api/clients', authenticateToken);
app.use('/api/user-profile', authenticateToken); // Secure user profile endpoint

// User Profile Endpoints
app.get('/api/user-profile', (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = db.getUserProfile();
    if (profile && profile.full_name) {
      res.json(profile);
    } else {
      res.status(404).json({ message: 'Profil utilisateur non trouvé.' });
    }
  } catch (err) {
    console.error('GET /api/user-profile error:', err);
    next(err);
  }
});

app.post('/api/user-profile', (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const saved = db.upsertUserProfile({
      full_name: data.full_name,
      address_street: data.address_street,
      address_postal_code: data.address_postal_code,
      address_city: data.address_city,
      siret_siren: data.siret_siren,
      ape_naf_code: data.ape_naf_code,
      vat_number: data.vat_number,
      email: data.email,
      phone: data.phone,
      activity_start_date: data.activity_start_date,
      legal_form: data.legal_form,
      rcs_rm: data.rcs_rm,
      social_capital: data.social_capital
    });
    db.setMeta('hasSeeded', 'true');
    res.json(saved);
  } catch (err) {
    console.error('POST /api/user-profile error:', err);
    next(err);
  }
});

// New profile endpoints using SQLite storage
app.get('/api/profile', (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = db.getUserProfile();
    if (profile && profile.full_name) {
      res.json(profile);
    } else {
      res.status(404).json({ message: 'Profil utilisateur non trouvé.' });
    }
  } catch (err) {
    console.error('GET /api/profile error:', err);
    next(err);
  }
});

app.put('/api/profile', (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const saved = db.upsertUserProfile({
      full_name: data.full_name,
      address_street: data.address_street,
      address_postal_code: data.address_postal_code,
      address_city: data.address_city,
      siret_siren: data.siret_siren,
      ape_naf_code: data.ape_naf_code,
      vat_number: data.vat_number,
      email: data.email,
      phone: data.phone,
      activity_start_date: data.activity_start_date,
      legal_form: data.legal_form,
      rcs_rm: data.rcs_rm,
      social_capital: data.social_capital
    });
    db.setMeta('hasSeeded', 'true');
    res.json(saved);
  } catch (err) {
    console.error('PUT /api/profile error:', err);
    next(err);
  }
});

// Upload du logo
app.post('/api/upload/logo', upload.single('logo'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier fourni' });
  }
  res.json({ filename: req.file.filename });
});

// Upload du logo client
app.post('/api/upload/logo-client', uploadClientLogo.single('logo'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier fourni' });
  }
  res.json({ path: `/uploads/logos/${req.file.filename}` });
});

// Gestion des clients
app.get('/api/clients', (req: Request, res: Response, next: NextFunction) => {
  try {
    const clients = db.getClients().map((c: any) => ({
      ...c,
      totalInvoices: c.nombre_de_factures ?? (c.factures ? c.factures.length : 0),
      unpaidInvoices: c.factures_impayees ?? 0
    }));
    res.json(clients);
  } catch (err) {
    next(err);
  }
});

app.post('/api/clients', (req: Request, res: Response, next: NextFunction) => {
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
  db.setMeta('hasSeeded', 'true');
  const client = db.getClientById(id);
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
});

app.get('/api/clients/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = db.getClientById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client non trouvé' });
    res.json(client);
  } catch (err) {
    next(err);
  }
});

app.put('/api/clients/:id', (req: Request, res: Response, next: NextFunction) => {
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
    const updatedClient = db.getClientById(req.params.id);
    if (!updatedClient) return res.status(404).json({ error: 'Client non trouvé après mise à jour' });
  db.synchroniserFacturesParClient(); // Ensure aggregates are updated
  db.setMeta('hasSeeded', 'true');
  res.json(updatedClient);
  } catch (err) {
    next(err);
  }
});

// GET /api/factures - Liste toutes les factures avec pagination et recherche
app.get('/api/factures', (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      dateDebut = '',
      dateFin = '',
      status = '',
      statut = '',
      sortBy = 'date',
      order = 'desc'
    } = req.query;

    // Sécuriser et convertir les paramètres de pagination
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    const filters: { search: any; dateDebut: any; dateFin: any; status?: any } = {
      search,
      dateDebut,
      dateFin
    };
    let statusFilterToApply = status; // req.query.status
    if (!statusFilterToApply && statut) { // req.query.statut
      if (statut === 'payee') statusFilterToApply = 'paid';
      else if (statut === 'nonpayee' || statut === 'non-payee') statusFilterToApply = 'unpaid';
      else if (statut === 'impayee') statusFilterToApply = 'unpaid';
      // Allow other values if they come directly from 'status'
    }

    if (statusFilterToApply) {
      filters.status = statusFilterToApply;
    }
    const allFactures = db.getFactures(filters);
    console.table(
      allFactures.map(f => ({
        numero: f.numero_facture,
        client: f.nom_client,
        status: f.status,
        montant: f.montant_total
      }))
    );

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
    next(err);
  }
});

// GET /api/factures/:id - Récupère une facture spécifique avec ses lignes
app.get('/api/factures/:id', (req, res, next) => {
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
    next(err);
  }
});

// POST /api/factures - Crée une nouvelle facture
app.post('/api/factures', (req, res, next) => {
  try {
    const userProfile = db.getUserProfile();

    if (!userProfile || !userProfile.full_name) {
      return res.status(400).json({
        error: "Profil utilisateur non configuré",
        details: "Veuillez configurer vos informations dans 'Mes informations' avant de créer une facture.",
        errorCode: "USER_PROFILE_MISSING" // Custom code for frontend to detect
      });
    }

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

    // Define a type for factureData to ensure all fields are accounted for
    type FactureDataType = {
      numero_facture: string;
      client_id?: number;
      nom_client: string;
      nom_entreprise: string;
      telephone: string;
      adresse: string;
      date_facture: string;
      montant_total: number;
      lignes: any[]; // Consider defining a stricter type for lignes
      title: string;
      status: string;
      logo_path: string;
      siren: string;
      siret: string;
      legal_form: string;
      vat_number?: string; // Optional as it might not always be present
      vat_rate: number;
      rcs_number: string;
      emitter_full_name: string;
      emitter_address_street: string;
      emitter_address_postal_code: string | null;
      emitter_address_city: string | null;
      emitter_siret_siren: string;
      emitter_ape_naf_code: string;
      emitter_vat_number?: string | null; // Optional and nullable
      emitter_email: string | null;
      emitter_phone: string | null;
      emitter_activity_start_date: string | null;
      emitter_legal_form: string;
      emitter_rcs_rm?: string | null; // Optional and nullable
      emitter_social_capital: string | null;
    };

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

    const factureData: FactureDataType = {
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
      vat_number, // Already optional in FactureDataType if not provided
      vat_rate: parsedVatRate,
      rcs_number,
      // Emitter details from JSON profile
      emitter_full_name: userProfile.full_name,
      emitter_address_street: `${userProfile.address_street}, ${userProfile.address_postal_code} ${userProfile.address_city}`,
      emitter_siret_siren: userProfile.siret_siren,
      emitter_ape_naf_code: userProfile.ape_naf_code,
      emitter_vat_number: userProfile.vat_number || null,
      emitter_legal_form: userProfile.legal_form,
      emitter_rcs_rm: userProfile.rcs_rm || null,
      // Fields that were previously added later, now initialized
      emitter_address_postal_code: null, // Part of combined street, so explicitly null
      emitter_address_city: null,      // Part of combined street, so explicitly null
      emitter_email: null,             // Not in userProfile.json, so null
      emitter_phone: null,             // Not in userProfile.json, so null
      emitter_activity_start_date: null, // Not in userProfile.json, so null
      emitter_social_capital: null     // Not in userProfile.json, so null
    };

    // The lines that previously assigned these to null are now redundant
    // as they are initialized above.

    const factureId = db.createFacture(factureData);
  if (client_id) {
    db.addFactureToClient(client_id, factureId);
  }
  db.synchroniserFacturesParClient();
  db.setMeta('hasSeeded', 'true');

    res.status(201).json({
      message: 'Facture créée avec succès',
      id: factureId,
      numero_facture
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/factures/:id - Mise à jour partielle d'une facture
app.put('/api/factures/:id', (req, res, next) => {
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
    db.setMeta('hasSeeded', 'true');

    const updated = db.getFactureById(id);
    res.json(updated);
  } catch (err) {
    console.error('Erreur lors de PUT /api/factures/:id', err);
    next(err);
  }
});

// PATCH /api/factures/:id/status - Met à jour uniquement le statut d'une facture
app.patch('/api/factures/:id/status', (req, res, next) => {
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
    db.setMeta('hasSeeded', 'true');
    const updatedInvoice = db.getFactureById(id);
    if (!updatedInvoice) return res.status(404).json({ error: 'Facture non trouvée après mise à jour du statut' });
    res.json(updatedInvoice);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/factures/:id - Supprime une facture
app.delete('/api/factures/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const success = db.deleteFacture(id);

    if (!success) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    db.synchroniserFacturesParClient();
    db.setMeta('hasSeeded', 'true');

    res.json({ message: 'Facture supprimée avec succès' });
  } catch (err) {
    next(err);
  }
});

// GET /api/factures/:id/html - Génère le HTML d'une facture
app.get('/api/factures/:id/html', async (req, res, next) => { // Made async
  try {
    await dbReady; // Ensure db is initialized
    const facture = db.getFactureById(req.params.id);
    if (!facture) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    let clientDetails = null;
    if (facture.client_id) {
      clientDetails = db.getClientById(facture.client_id);
    }

    // The actual HTML building is now wrapped in its own try-catch
    // as per the plan to make the error handling more specific to this part.
    let html;
    try {
      // 1. Use mapFactureToInvoiceData to get a consistently structured object
      const mappedData = mapFactureToInvoiceData(facture, clientDetails);

      // 2. Transform mappedData to InvoiceData structure for generateInvoiceHTML
      //    The InvoiceData interface is:
      //    nom_entreprise: string; siren?: string; vat_number?: string; adresse?: string[]; logo_path?: string;
      //    nom_client: string; adresse_client?: string[]; numero: string; date: string;
      //    lignes: { description: string; quantite: number; prix_unitaire: number }[];
      //    tvaRate?: number; date_reglement: string; date_vente: string; penalites: string;

      const userProfile = db.getUserProfile(); // Fetch user profile for logo

      const invoiceDataForTs = {
        nom_entreprise: mappedData.Nom_entreprise,
        siren: mappedData.Num_SIRET_emetteur, // SIRET used as SIREN here
        vat_number: facture.emitter_vat_number, // Emitter's VAT from original facture, mapFactureToInvoiceData has TVA_emetteur which might include "TVA non applicable"
        adresse: mappedData.Adresse_emetteur.split('<br>').filter(line => line.trim() !== ''),
        logo_path: facture.logo_path || (userProfile ? userProfile.logo_path : undefined),

        nom_client: mappedData.Nom_client,
        adresse_client: mappedData.Adresse_facturation_client.split('<br>').filter(line => line.trim() !== ''),
        // Note: mappedData.Adresse_livraison_client is available if needed, but InvoiceData only has one adresse_client

        numero: mappedData.numero_facture,
        date: facture.date_facture, // Needs to be in 'YYYY-MM-DD' or a parsable format for `new Date()` in generateInvoiceHTML

        // Each item from mapFactureToInvoiceData already exposes a `description`
        // field, so map it directly. Using `service` here caused `undefined`
        // values and broke invoice HTML generation.
        lignes: mappedData.lignes_facture.map(l => ({
          description: l.description,
          quantite: l.quantity,
          prix_unitaire: l.unitPriceHT,
        })),

        tvaRate: mappedData.taux_TVA,

        // Fields required by InvoiceData but not directly in mapFactureToInvoiceData output, using defaults or placeholders
        date_reglement: mappedData.date_emission, // Placeholder: using emission date
        date_vente: mappedData.date_prestation,  // Placeholder: using prestation date
        penalites: "Pénalités de retard : Taux d'intérêt légal majoré de 10 points. Pas d'escompte pour paiement anticipé.", // Standard penalty clause
        status: facture.status,
      };

      if (userProfile && userProfile.logo_path && !invoiceDataForTs.logo_path) {
        // Ensure the logo_path is correctly prefixed if it's just a filename
        // This case might be redundant if the above `logo_path: facture.logo_path || (userProfile ? userProfile.logo_path : undefined)` handles it.
        // However, this ensures the prefixing logic is applied if userProfile.logo_path is chosen.
        invoiceDataForTs.logo_path = path.basename(userProfile.logo_path).startsWith('http') ? userProfile.logo_path : `/uploads/${path.basename(userProfile.logo_path)}`;
      } else if (invoiceDataForTs.logo_path && !invoiceDataForTs.logo_path.startsWith('http') && !invoiceDataForTs.logo_path.startsWith('/')) {
        // If logo_path was taken from facture.logo_path and needs prefixing
         invoiceDataForTs.logo_path = `/uploads/${path.basename(invoiceDataForTs.logo_path)}`;
      }


      html = generateInvoiceHTML(invoiceDataForTs);

    } catch (buildError) {
      console.error("❌ Failed to build facture HTML using generateInvoiceHTML:", buildError);
      return next(buildError);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const filename = `facture-${facture.numero_facture || facture.id}.html`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(html);

  } catch (err) {
    console.error("Error in /api/factures/:id/html route (outside HTML build):", err);
    next(err);
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

app.get('/api/quote', (req, res, next) => {
  try {
    const quote = getRandomQuote();
    res.json(quote);
  } catch (err) {
    next(new Error('Erreur lors de la récupération de la citation'));
  }
});

// Route pour obtenir les statistiques de factures d'un mois donné
app.get('/api/invoices/stats', (req, res, next) => {
  const { month, year } = req.query;

  try {
    let targetYear: number;
    let targetMonth: number;

    if (month === 'current' || (!month && !year)) {
      const now = new Date();
      targetYear = now.getFullYear();
      targetMonth = now.getMonth();
    } else {
      const parsedMonth = parseInt(String(month), 10) - 1;
      const parsedYear = parseInt(String(year), 10);
      if (
        Number.isNaN(parsedMonth) ||
        Number.isNaN(parsedYear) ||
        parsedMonth < 0 ||
        parsedMonth > 11
      ) {
        return res
          .status(400)
          .json({ error: 'Paramètres month/year invalides' });
      }
      targetMonth = parsedMonth;
      targetYear = parsedYear;
    }

    const factures = db.getFactures();
    console.log('📊 Fetching stats for:', month, year);
    const filtered = factures.filter(f => {
      const d = new Date(f.created_at || f.date_facture);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });
    console.log('🧾 Filtered invoices:', filtered);
    const paidStatuses = ['paid', 'payée'];
    const unpaidStatuses = ['unpaid', 'non payé', 'non payée', 'impayée'];
    const paid = filtered.filter(f => paidStatuses.includes(f.status)).length;
    const unpaid = filtered.filter(f => unpaidStatuses.includes(f.status)).length;
    const result = { total: filtered.length, payees: paid, non_payees: unpaid };
    console.log('🔢 Stats:', result);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Route pour obtenir un résumé global des factures payées et non payées
app.get('/api/invoices/summary', (req, res, next) => {
  try {
    const factures = db.getFactures();
    const paidStatuses = ['paid', 'payée'];
    const unpaidStatuses = ['unpaid', 'non payé', 'non payée', 'impayée'];
    const paid = factures.filter(f => paidStatuses.includes(f.status)).length;
    const unpaid = factures.filter(f => unpaidStatuses.includes(f.status)).length;
    res.json({ payees: paid, non_payees: unpaid });
  } catch (err) {
    next(err);
  }
});

// Alias pour /api/factures/summary
app.get('/api/factures/summary', (req, res, next) => {
  try {
    const factures = db.getFactures();
    const paidStatuses = ['paid', 'payée'];
    const unpaidStatuses = ['unpaid', 'non payé', 'non payée', 'impayée'];
    const paid = factures.filter(f => paidStatuses.includes(f.status)).length;
    const unpaid = factures.filter(f => unpaidStatuses.includes(f.status)).length;
    res.json({ payees: paid, non_payees: unpaid });
  } catch (err) {
    next(err);
  }
});

// Route de statistiques
app.get('/api/stats', (req, res, next) => {
  try {
    const factures = db.getFactures();
    const total = factures.reduce((sum, f) => sum + f.montant_total, 0);
    
    res.json({
      totalFactures: factures.length,
      montantTotal: formatEuro(total),
      factureRecente: factures.length > 0 ? factures[0] : null
    });
  } catch (err) {
    next(err);
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'public')));

// Handles any requests that don't match the ones above
app.get('*', (req, res, next) => {
  // Check if the request is for an API route, if so, don't serve index.html
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // For any other route, serve the frontend's index.html
  res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) {
      next(err);
    }
  });
});

// Centralized error handler
app.use(errorHandler);

// Démarrage du serveur
if (require.main === module) {
  dbReady.then(() => {
    app.listen(PORT, '0.0.0.0', () => { // Listen on 0.0.0.0
      // console.log(`🚀 Serveur de facturation démarré sur le port ${PORT}`);
      // console.log(`📊 API disponible sur http://0.0.0.0:${PORT}/api`);
      // console.log(`🌐 Frontend accessible sur http://0.0.0.0:${PORT}`);
      // console.log(`💾 Stockage: SQLite (sql.js)`);
      // console.log(`📂 Fichier base: ${path.join(__dirname, 'database', 'facturation.sqlite')}`);
    });
  });
}

module.exports = dbReady.then(() => app);

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  // console.log('\n🛑 Arrêt du serveur...');
  // console.log('💾 Données sauvegardées dans la base SQLite.');
  process.exit(0);
});
