const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const buildFacturePDF = require('./services/pdfService');
const tmp = require('tmp');
const JSONDatabase = require('./database/storage');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Base de données JSON
const db = new JSONDatabase();

// Formatters réutilisables pour éviter de recréer les objets à chaque appel
const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR'
});
const dateFormatter = new Intl.DateTimeFormat('fr-FR');

// Utilitaire pour formater les montants en euros
const formatEuro = (amount) => euroFormatter.format(amount);

// Utilitaire pour formater les dates en français
const formatDateFR = (dateString) => {
  const date = new Date(dateString);
  return dateFormatter.format(date);
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
    const offset = (page - 1) * limit;

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
    const factures = allFactures.slice(offset, offset + parseInt(limit));

    // Ajouter le formatage français
    const facturesFormatees = factures.map(row => ({
      ...row,
      date_facture_fr: formatDateFR(row.date_facture),
      montant_total_fr: formatEuro(row.montant_total)
    }));

    res.json({
      factures: facturesFormatees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
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
      rcs_number = ''
    } = req.body;
    const parsedVatRate =
      vat_rate !== undefined && vat_rate !== '' ? parseFloat(vat_rate) : 0;


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


    // Calculer le montant total
    const montant_total = lignes.reduce((total, ligne) => {
      return total + (parseFloat(ligne.quantite) * parseFloat(ligne.prix_unitaire));
    }, 0);

    const numero_facture = generateInvoiceNumber();

    const factureData = {
      numero_facture,
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
      rcs_number = ''
    } = req.body;
    const parsedVatRate =
      vat_rate !== undefined && vat_rate !== '' ? parseFloat(vat_rate) : 0;


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

    // Calculer le montant total
    const montant_total = lignes.reduce((total, ligne) => {
      return total + (parseFloat(ligne.quantite) * parseFloat(ligne.prix_unitaire));
    }, 0);

    const factureData = {
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

// GET /api/factures/:id/pdf - Génère et télécharge le PDF d'une facture
app.get('/api/factures/:id/pdf', async (req, res) => {
  const facture = db.getFactureById(req.params.id);
  if (!facture) {
    return res.status(404).json({ error: 'Facture non trouvée' });
  }

  const tmpFile = tmp.fileSync({ postfix: '.pdf' });
  try {
    await buildFacturePDF(facture, tmpFile.name);

    const date = new Date(facture.date_facture);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(2);
    const formattedDate = `${dd}/${mm}/${yy}`;
    const fileName = `Facture - ${formattedDate} - ${facture.nom_entreprise}.pdf`;

    res.download(tmpFile.name, fileName, err => {
      tmpFile.removeCallback();
      if (err) res.status(500).end();
    });
  } catch (err) {
    tmpFile.removeCallback();
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  }
});

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API de facturation opérationnelle',
    timestamp: new Date().toISOString(),
    storage: 'JSON Files'
  });
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
  app.listen(PORT, () => {
    console.log(`🚀 Serveur de facturation démarré sur le port ${PORT}`);
    console.log(`📊 API disponible sur http://localhost:${PORT}/api`);
    console.log(`💾 Stockage: Fichiers JSON`);
    console.log(`📂 Dossier données: ${path.join(__dirname, 'database', 'data')}`);
  });
}

module.exports = app;

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  console.log('💾 Données sauvegardées dans les fichiers JSON.');
  process.exit(0);
});
