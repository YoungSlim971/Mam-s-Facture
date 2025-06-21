const fs = require('fs');
const path = require('path');

class JSONDatabase {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.facturesFile = path.join(this.dataDir, 'factures.json');
    this.lignesFile = path.join(this.dataDir, 'lignes.json');
    this.clientsFile = path.join(this.dataDir, 'clients.json');
    this.factures = [];
    this.lignes = [];
    this.clients = [];
    
    // Créer le dossier data s'il n'existe pas
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.init();
  }

  init() {
    // Initialiser les fichiers avec des données par défaut s'ils n'existent pas
    if (!fs.existsSync(this.facturesFile)) {
      const sampleFactures = [
        {
          id: 1,
          client_id: 1,
          numero_facture: 'FACT-2024-001',
          nom_client: 'Martin Dupont',
          nom_entreprise: 'Dupont SARL',
          telephone: '01 23 45 67 89',
          adresse: '123 Rue de la République, 75001 Paris',
          date_facture: '2024-01-15',
          montant_total: 1200.00,
          title: 'Facture #1',
          status: 'paid',
          logo_path: '',
          siren: '123456789',
          siret: '12345678900011',
          legal_form: 'SARL',
          vat_number: 'FR123456789',
          vat_rate: 20,
          rcs_number: 'Paris B 123456789',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          client_id: 2,
          numero_facture: 'FACT-2024-002',
          nom_client: 'Sophie Bernard',
          nom_entreprise: 'Bernard & Associés',
          telephone: '01 98 76 54 32',
          adresse: '456 Avenue des Champs, 69000 Lyon',
          date_facture: '2024-01-20',
          montant_total: 2500.50,
          title: 'Facture #2',
          status: 'paid',
          logo_path: '',
          siren: '123456789',
          siret: '12345678900011',
          legal_form: 'SARL',
          vat_number: 'FR123456789',
          vat_rate: 20,
          rcs_number: 'Paris B 123456789',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          client_id: 3,
          numero_facture: 'FACT-2024-003',
          nom_client: 'Pierre Lambert',
          nom_entreprise: 'Lambert Consulting',
          telephone: '04 56 78 90 12',
          adresse: '789 Boulevard Saint-Michel, 13000 Marseille',
          date_facture: '2024-02-01',
          montant_total: 850.75,
          title: 'Facture #3',
          status: 'unpaid', // use 'unpaid' for the third sample
          logo_path: '',
          siren: '123456789',
          siret: '12345678900011',
          legal_form: 'SARL',
          vat_number: 'FR123456789',
          vat_rate: 20,
          rcs_number: 'Paris B 123456789',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      this.writeData(this.facturesFile, sampleFactures);
    }

    if (!fs.existsSync(this.lignesFile)) {
      const sampleLignes = [
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
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      return true;
    } catch (err) {
      console.error('Erreur écriture fichier:', err);
      return false;
    }
  }

  // FACTURES
  getFactures(filters = {}) {
    let factures = [...this.factures];
    
    // Appliquer les filtres
    if (filters.search) {
      const search = filters.search.toLowerCase();
      factures = factures.filter(f => 
        f.nom_client.toLowerCase().includes(search) ||
        (f.nom_entreprise && f.nom_entreprise.toLowerCase().includes(search)) ||
        f.numero_facture.toLowerCase().includes(search)
      );
    }

    if (filters.dateDebut) {
      factures = factures.filter(f => f.date_facture >= filters.dateDebut);
    }

    if (filters.dateFin) {
      factures = factures.filter(f => f.date_facture <= filters.dateFin);
    }

    // Filtre par statut payée / non payée
    if (filters.status) {
      factures = factures.filter(f => f.status === filters.status);
    }

    // Ajouter le nombre de lignes
    factures = factures.map(f => ({
      ...f,
      nombre_lignes: this.lignes.filter(l => l.facture_id === f.id).length
    }));

    // Trier par date décroissante
    factures.sort((a, b) => new Date(b.date_facture) - new Date(a.date_facture));

    return factures;
  }

  getFactureById(id) {
    const facture = this.factures.find(f => f.id === parseInt(id));
    
    if (!facture) return null;

    return {
      ...facture,
      lignes: this.lignes.filter(l => l.facture_id === facture.id)
    };
  }

  createFacture(data) {
    const factures = this.factures;
    const lignes = this.lignes;
    
    // Générer un nouvel ID
    const newId = factures.length > 0 ? Math.max(...factures.map(f => f.id)) + 1 : 1;
    
    // Valeurs par défaut pour les nouveaux champs légaux et de statut
    const defaultFields = {
      title: data.title || `Facture #${newId}`,
      status: data.status || 'unpaid',
      logo_path: data.logo_path || '',
      siren: data.siren || '',
      siret: data.siret || '',
      legal_form: data.legal_form || '',
      vat_number: data.vat_number || '',
      vat_rate:
        data.vat_rate !== undefined && data.vat_rate !== ''
          ? parseFloat(data.vat_rate)
          : 0,
      rcs_number: data.rcs_number || '',
      client_id: data.client_id ? parseInt(data.client_id) : null
    };

    const { lignes: lignesData = [], ...factureSansLignes } = data;

    const now = new Date().toISOString();
    const nouvelleFacture = {
      id: newId,
      ...defaultFields,
      ...factureSansLignes,
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
      created_at: now,
      updated_at: now
    };
    clients.push(client);
    this.writeData(this.clientsFile, clients);
    this.clients = clients;
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
    return true;
  }
}

module.exports = JSONDatabase;
