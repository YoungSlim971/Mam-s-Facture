const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const PDFDocument = require('pdfkit');
const JSONDatabase = require('./database/storage');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Base de données JSON
const db = new JSONDatabase();

// Utilitaire pour formater les nombres en français
const formatEuro = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

// Utilitaire pour formater les dates en français
const formatDateFR = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
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
    const { page = 1, limit = 10, search = '', dateDebut = '', dateFin = '' } = req.query;
    const offset = (page - 1) * limit;
    
    const filters = { search, dateDebut, dateFin };
    const allFactures = db.getFactures(filters);
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
      lignes = []
    } = req.body;

    // Validation
    if (!nom_client || !date_facture || !lignes.length) {
      return res.status(400).json({ 
        error: 'Données manquantes',
        details: 'Le nom du client, la date et au moins une ligne sont requis' 
      });
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
      lignes
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
      lignes = []
    } = req.body;

    // Validation
    if (!nom_client || !date_facture || !lignes.length) {
      return res.status(400).json({ 
        error: 'Données manquantes',
        details: 'Le nom du client, la date et au moins une ligne sont requis' 
      });
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
      lignes
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
app.get('/api/factures/:id/pdf', (req, res) => {
  try {
    const { id } = req.params;
    const facture = db.getFactureById(id);

    if (!facture) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    // Créer le PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Headers pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="facture-${facture.numero_facture}.pdf"`);
    
    doc.pipe(res);

    // En-tête de la facture
    doc.fontSize(20).text('FACTURE', 50, 50);
    doc.fontSize(12).text(`Numéro: ${facture.numero_facture}`, 50, 80);
    doc.text(`Date: ${formatDateFR(facture.date_facture)}`, 50, 100);

    // Informations entreprise (exemple)
    doc.text('Facturation Pro SARL', 400, 50);
    doc.text('123 Rue de l\'Innovation', 400, 70);
    doc.text('75001 Paris, France', 400, 90);
    doc.text('contact@facturation-pro.fr', 400, 110);
    doc.text('SIRET: 12345678901234', 400, 130);

    // Informations client
    doc.text('Facturé à:', 50, 160);
    doc.text(facture.nom_client, 50, 180);
    if (facture.nom_entreprise) doc.text(facture.nom_entreprise, 50, 200);
    if (facture.adresse) doc.text(facture.adresse, 50, 220);
    if (facture.telephone) doc.text(`Tél: ${facture.telephone}`, 50, 240);

    // Tableau des lignes
    let yPosition = 300;
    
    // En-têtes du tableau
    doc.text('Description', 50, yPosition);
    doc.text('Qté', 300, yPosition);
    doc.text('Prix Unit.', 350, yPosition);
    doc.text('Sous-total', 450, yPosition);
    
    yPosition += 20;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;

    // Lignes du tableau
    facture.lignes.forEach(ligne => {
      doc.text(ligne.description, 50, yPosition, { width: 240 });
      doc.text(ligne.quantite.toLocaleString('fr-FR', { minimumFractionDigits: 2 }), 300, yPosition);
      doc.text(formatEuro(ligne.prix_unitaire), 350, yPosition);
      doc.text(formatEuro(ligne.sous_total), 450, yPosition);
      yPosition += 30;
    });

    // Total
    yPosition += 20;
    doc.moveTo(350, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;
    doc.fontSize(14).text('Total: ' + formatEuro(facture.montant_total), 400, yPosition);

    // Pied de page
    yPosition += 50;
    doc.fontSize(10);
    doc.text('Merci pour votre confiance !', 50, yPosition);
    doc.text('Conditions de paiement: 30 jours net', 50, yPosition + 15);
    doc.text(`Facture générée le ${formatDateFR(new Date().toISOString())}`, 50, yPosition + 30);

    doc.end();
  } catch (err) {
    res.status(500).json({ 
      error: 'Erreur lors de la génération du PDF',
      details: err.message 
    });
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
