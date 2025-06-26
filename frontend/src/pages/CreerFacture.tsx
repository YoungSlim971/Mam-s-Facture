import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Calculator } from 'lucide-react';
import LogoDropzone from '@/components/LogoDropzone';
import { API_URL, apiClient } from '@/lib/api';
import { getUserProfileFromLocal, fetchAndSyncUserProfile } from '@/utils/userProfile';
import { computeTotals } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import numeral from 'numeral';

interface LigneFacture {
  description: string;
  quantite: number;
  prix_unitaire: number; // This will be treated as TTC by the form and computeTotals
}

interface ClientOption {
  id: number;
  nom_client: string;
  nom_entreprise?: string;
  telephone?: string;
  email?: string;
  adresse?: string; // Generic address, might be composed from structured fields
  adresse_facturation_rue?: string;
  adresse_facturation_cp?: string;
  adresse_facturation_ville?: string;
  intitule?: string;
  // Client's own legal details - not directly used on invoice form state for seller's info
  siren?: string;
  siret?: string;
  legal_form?: string;
  forme_juridique?: string;
  tva?: string; // Client's TVA number
  rcs_number?: string;
  rcs?: string;
}

import { UserProfileJson } from '@/lib/api'; // Import UserProfileJson

// Interface for seller profile data stored in the component's state.
// This will be populated from UserProfileJson.
interface SellerProfileState {
  full_name: string;        // from UserProfileJson.raison_sociale
  address_street: string;   // from UserProfileJson.adresse
  address_postal_code: string; // from UserProfileJson.code_postal
  address_city: string;     // from UserProfileJson.ville
  siret_siren: string;      // from UserProfileJson.siret
  ape_naf_code: string;     // from UserProfileJson.ape_naf
  vat_number?: string;      // from UserProfileJson.tva_intra
  legal_form: string;       // from UserProfileJson.forme_juridique
  rcs_rm: string;           // from UserProfileJson.rcs_ou_rm
  // Fields not in UserProfileJson but part of the old structure/form, default to empty or handle as needed.
  email?: string;
  phone?: string;
  social_capital?: string;
}


export default function CreerFacture() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));
  
  // Client & Invoice specific states
  const [nomClient, setNomClient] = useState(''); // Displayed client name
  const [nomEntreprise, setNomEntreprise] = useState(''); // Displayed client company name
  const [telephone, setTelephone] = useState(''); // Client phone
  const [adresse, setAdresse] = useState(''); // Client address display
  const [email, setEmail] = useState('');
  const [siren, setSiren] = useState('');
  const [siret, setSiret] = useState('');
  const [tva, setTva] = useState('');
  const [rcs, setRcs] = useState('');
  const [formeJuridique, setFormeJuridique] = useState('');
  const [clientId, setClientId] = useState<number | ''>('');
  const [clients, setClients] = useState<ClientOption[]>([]);

  const [dateFacture, setDateFacture] = useState(() => new Date().toISOString().split('T')[0]);
  const [dateLimitePaiement, setDateLimitePaiement] = useState(''); // ADDED: Payment Due Date
  const [numeroFacture, setNumeroFacture] = useState('');
  const [title, setTitle] = useState(''); // Invoice title / Intitulé (often client-specific project name)
  const [status, setStatus] = useState<'paid' | 'unpaid'>('unpaid');
  const [logoPath, setLogoPath] = useState(''); // Seller's logo path

  const [lignes, setLignes] = useState<LigneFacture[]>([
    { description: '', quantite: 1, prix_unitaire: 0 }
  ]);
  const [editableTvaRate, setEditableTvaRate] = useState(20); // ADDED: Editable VAT Rate

  // Seller Profile State
  const [sellerProfile, setSellerProfile] = useState<SellerProfileState | null>(null);

  const [loading, setLoading] = useState(false); // General loading for submission
  const [pageLoading, setPageLoading] = useState(true); // Loading for initial data fetch
  const [erreurs, setErreurs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchInitialData = async () => {
      setPageLoading(true);
      let profileFetched = false;

      // Load from localStorage first for fast display
      const localProfile = getUserProfileFromLocal();
      if (localProfile) {
        setSellerProfile({
          full_name: localProfile.raison_sociale || '',
          address_street: localProfile.adresse || '',
          address_postal_code: localProfile.code_postal || '',
          address_city: localProfile.ville || '',
          siret_siren: localProfile.siret || '',
          ape_naf_code: localProfile.ape_naf || '',
          vat_number: localProfile.tva_intra || '',
          legal_form: localProfile.forme_juridique || '',
          rcs_rm: localProfile.rcs_ou_rm || '',
          email: localProfile.email || '',
          phone: localProfile.phone || '',
          social_capital: localProfile.social_capital || '',
        });
        profileFetched = true;
      }

      try {
        const userProfileJson = await fetchAndSyncUserProfile();
        if (userProfileJson) {
          setSellerProfile({
            full_name: userProfileJson.raison_sociale || '',
            address_street: userProfileJson.adresse || '',
            address_postal_code: userProfileJson.code_postal || '',
            address_city: userProfileJson.ville || '',
            siret_siren: userProfileJson.siret || '',
            ape_naf_code: userProfileJson.ape_naf || '',
            vat_number: userProfileJson.tva_intra || '',
            legal_form: userProfileJson.forme_juridique || '',
            rcs_rm: userProfileJson.rcs_ou_rm || '',
            email: userProfileJson.email || '',
            phone: userProfileJson.phone || '',
            social_capital: userProfileJson.social_capital || '',
          });
          profileFetched = true;
        }
      } catch (error: any) {
        console.error('Failed to fetch seller profile:', error);
        if (!localProfile) {
          if (error.message && error.message.includes('404')) {
            toast({
              title: 'Profil Vendeur Non Trouvé',
              description: "Veuillez d'abord configurer vos informations dans 'Mes Informations'. Vous allez être redirigé.",
              variant: 'default',
              duration: 5000,
            });
            navigate('/profile');
            setPageLoading(false);
            return;
          } else {
            toast({
              title: 'Erreur Chargement Profil Vendeur',
              description: 'Impossible de charger les informations du vendeur. Certaines fonctionnalités pourraient être affectées.',
              variant: 'destructive',
            });
          }
        }
      }

      if (profileFetched) {
        try {
          const clientsData = await apiClient.getClients();
          setClients(clientsData);
        } catch (error: any) {
          toast({
            title: 'Erreur Chargement Clients',
            description: error.message || 'Impossible de charger la liste des clients.',
            variant: 'destructive',
          });
        }
      }
      setPageLoading(false);
    };
    fetchInitialData();
  }, [toast, navigate]);

  const handleSelectClient = (selectedClientId: string) => {
    if (!selectedClientId) {
      setClientId('');
      setNomClient('');
      setNomEntreprise('');
      setTelephone('');
      setAdresse('');
      setEmail('');
      setSiren('');
      setSiret('');
      setTva('');
      setRcs('');
      setFormeJuridique('');
      setTitle('');
      return;
    }
    const cid = parseInt(selectedClientId);
    setClientId(cid);
    const client = clients.find(c => c.id === cid);
    if (client) {
      setNomClient(client.nom_client);
      setNomEntreprise(client.nom_entreprise || '');
      setTelephone(client.telephone || '');
      setEmail(client.email || '');
      const clientAddressDisplay = client.adresse_facturation_rue && client.adresse_facturation_cp && client.adresse_facturation_ville
        ? `${client.adresse_facturation_rue}, ${client.adresse_facturation_cp} ${client.adresse_facturation_ville}`
        : client.adresse || '';
      setAdresse(clientAddressDisplay);
      setSiren(client.siren || '');
      setSiret(client.siret || '');
      setTva(client.tva || '');
      setRcs(client.rcs || client.rcs_number || '');
      setFormeJuridique(client.forme_juridique || client.legal_form || '');
      setTitle(client.intitule || '');
    }
  };

  const { totalHT: montantHT, totalTTC: montantTotal, totalTVA: montantTVA } = computeTotals(lignes, editableTvaRate);

  const euroFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const formatEuro = (amount: number) => euroFormatter.format(amount);

  const ajouterLigne = () => setLignes([...lignes, { description: '', quantite: 1, prix_unitaire: 0 }]);
  const supprimerLigne = (index: number) => {
    if (lignes.length > 1) setLignes(lignes.filter((_, i) => i !== index));
  };
  const mettreAJourLigne = (index: number, champ: keyof LigneFacture, valeur: string | number) => {
    const nouvellesLignes = [...lignes];
    nouvellesLignes[index] = { ...nouvellesLignes[index], [champ]: typeof valeur === 'string' && champ !== 'description' ? parseFloat(valeur) || 0 : valeur };
    setLignes(nouvellesLignes);
  };

  const validerFormulaire = () => {
    const nouvellesErreurs: { [key: string]: string } = {};
    if (!clientId) nouvellesErreurs.clientId = 'Veuillez sélectionner un client.';
    if (!nomClient.trim() && !clientId) nouvellesErreurs.nomClient = 'Le nom du client est requis si aucun client n\'est sélectionné.';
    if (!dateFacture) nouvellesErreurs.dateFacture = 'La date de la facture est requise.';
    if (!dateLimitePaiement) nouvellesErreurs.dateLimitePaiement = 'La date limite de paiement est requise.'; // ADDED Validation
    if (editableTvaRate < 0) nouvellesErreurs.editableTvaRate = 'Le taux de TVA ne peut pas être négatif.';

    const lignesValides = lignes.filter(l => l.description.trim() && l.quantite > 0 && l.prix_unitaire >= 0);
    if (lignesValides.length === 0) nouvellesErreurs.lignes = 'Au moins une ligne de facture valide est requise.';
    lignes.forEach((ligne, index) => {
      if (ligne.description.trim() && (ligne.quantite === undefined || ligne.quantite <= 0)) nouvellesErreurs[`quantite_${index}`] = 'La quantité doit être > 0.';
      if (ligne.description.trim() && (ligne.prix_unitaire === undefined || ligne.prix_unitaire < 0)) nouvellesErreurs[`prix_${index}`] = 'Le prix ne peut être négatif.';
    });
    setErreurs(nouvellesErreurs);
    return Object.keys(nouvellesErreurs).length === 0;
  };

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validerFormulaire()) {
      toast({ title: 'Erreurs de validation', description: 'Veuillez corriger les erreurs dans le formulaire.', variant: 'destructive' });
      return;
    }
    setLoading(true);

    // Prepare seller emitter data from sellerProfile (which is SellerProfileState)
    // The backend /api/factures POST endpoint expects these specific emitter_* keys,
    // and it will get them from the profil_utilisateur.json.
    // So, the frontend doesn't strictly need to send these if the backend re-fetches.
    // However, if the backend relies on the frontend sending them (as it did previously with db.getUserProfile result),
    // then we need to map SellerProfileState to the expected emitter_* keys.
    // The current backend implementation for POST /api/factures *does* re-fetch from readUserProfile().
    // Therefore, we don't strictly need to send emitterData from here.
    // Sending it could be a fallback or for direct use if backend logic changes.
    // For now, let's keep sending it, mapped from `sellerProfile` state.
    const emitterData = sellerProfile ? {
      // These field names (e.g. emitter_full_name) are what the backend invoice creation
      // logic (db.createFacture) ultimately expects for denormalizing into the factures table.
      // The backend POST /api/factures also re-maps from its freshly read UserProfileJson.
      // So there's a bit of duplication of mapping logic if we send it here.
      // Let's align with what the backend `factureData` object expects for emitter fields
      // which are based on the old DB structure.
      emitter_full_name: sellerProfile.full_name, // from raison_sociale
      emitter_address_street: sellerProfile.address_street, // from adresse
      emitter_address_postal_code: sellerProfile.address_postal_code, // from code_postal
      emitter_address_city: sellerProfile.address_city, // from ville
      emitter_siret_siren: sellerProfile.siret_siren, // from siret
      emitter_ape_naf_code: sellerProfile.ape_naf_code, // from ape_naf
      emitter_vat_number: sellerProfile.vat_number, // from tva_intra
      emitter_legal_form: sellerProfile.legal_form, // from forme_juridique
      emitter_rcs_rm: sellerProfile.rcs_rm, // from rcs_ou_rm
      // These were in the old DB structure, but not in the new JSON.
      // Send them as undefined or empty if not available in SellerProfileState.
      emitter_email: sellerProfile.email || '',
      emitter_phone: sellerProfile.phone || '',
      emitter_social_capital: sellerProfile.social_capital || '',
      // emitter_activity_start_date: sellerProfile.activity_start_date, // if it were part of SellerProfileState
    } : {
      // Provide default empty strings if sellerProfile is null, to avoid undefined errors
      // though ideally, form submission should be blocked if sellerProfile is null.
      emitter_full_name: '', emitter_address_street: '', emitter_address_postal_code: '',
      emitter_address_city: '', emitter_siret_siren: '', emitter_ape_naf_code: '',
      emitter_vat_number: '', emitter_legal_form: '', emitter_rcs_rm: '',
      emitter_email: '', emitter_phone: '', emitter_social_capital: ''
    };

    if (!sellerProfile) {
        toast({ title: 'Erreur Profil Vendeur', description: 'Les informations du vendeur sont manquantes. Impossible de créer la facture.', variant: 'destructive' });
        setLoading(false);
        return;
    }

    try {
      const lignesValides = lignes.filter(l => l.description.trim() && l.quantite > 0 && l.prix_unitaire >= 0);
      const payload = {
        numero_facture: numeroFacture.trim(),
        client_id: clientId || undefined,
        // Client details (denormalized for the invoice)
        nom_client: nomClient.trim(),
        nom_entreprise: nomEntreprise.trim(),
        telephone_client: telephone.trim(), // Renamed to avoid conflict if backend has 'telephone' for seller
        adresse_client: adresse.trim(),     // Renamed for clarity

        date_facture: dateFacture,
        date_limite_paiement: dateLimitePaiement, // ADDED
        title: title.trim(), // Invoice title (objet)
        status,
        logo_path: logoPath.trim(), // Seller's logo

        // Seller details (emitter)
        ...emitterData, // Spread seller details

        lignes: lignesValides,
        vat_rate: editableTvaRate, // ADDED
        // Totals are usually calculated backend, but if frontend needs to send them:
        // montant_ht: montantHT,
        // montant_tva: montantTVA,
        // montant_ttc: montantTotal,
      };

      const response = await fetch(`${API_URL}/factures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ details: 'Erreur serveur inconnue.' }));
        // Check for specific error code from backend if profile is missing
        if (errorData.errorCode === "USER_PROFILE_MISSING") {
            toast({
                title: 'Profil Vendeur Requis',
                description: errorData.details || "Veuillez configurer vos informations avant de créer une facture.",
                variant: 'destructive',
                duration: 5000,
            });
            navigate('/profile'); // Redirect to profile page
        } else {
            throw new Error(errorData.details || 'Erreur lors de la création de la facture');
        }
        return; // Stop execution if error
      }

      const data = await response.json();
      toast({ title: 'Facture créée', description: `La facture ${data.numero_facture || numeroFacture} a été créée avec succès.` });
      navigate('/factures');
    } catch (err) {
      toast({ title: 'Erreur de création', description: (err instanceof Error ? err.message : 'Une erreur est survenue.'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="container mx-auto p-4 text-center">Chargement des données initiales...</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] text-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button type="button" onClick={goBack} className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </button>
              <h1 className="text-2xl font-bold text-indigo-200">Créer une nouvelle facture</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Montant total TTC</div>
                <div className="text-2xl font-bold text-green-600">{formatEuro(montantTotal)}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={soumettre} className="space-y-8">
          {/* Section Informations du client */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Informations du client</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="clientSelect" className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un client enregistré</label>
                <select id="clientSelect" value={clientId} onChange={(e) => handleSelectClient(e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${erreurs.clientId ? 'border-red-300' : 'border-gray-300'}`}>
                  <option value="">-- Aucun --</option>
                  {clients.map((c) => (<option key={c.id} value={c.id}>{c.nom_client} {c.nom_entreprise ? `(${c.nom_entreprise})` : ''}</option>))}
                </select>
                {erreurs.clientId && <p className="mt-1 text-sm text-red-600">{erreurs.clientId}</p>}
              </div>
              <div>
                <label htmlFor="nomClient" className="block text-sm font-medium text-gray-700 mb-2">Nom du client *</label>
                <input id="nomClient" type="text" value={nomClient} onChange={(e) => setNomClient(e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${erreurs.nomClient ? 'border-red-300' : 'border-gray-300'}`} placeholder="Ex: Jean Dupont" />
                {erreurs.nomClient && <p className="mt-1 text-sm text-red-600">{erreurs.nomClient}</p>}
              </div>
              <div>
                <label htmlFor="nomEntreprise" className="block text-sm font-medium text-gray-700 mb-2">Nom de l'entreprise</label>
                <input id="nomEntreprise" type="text" value={nomEntreprise} onChange={(e) => setNomEntreprise(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ex: Dupont SARL" />
              </div>
              <div>
                <label htmlFor="emailClient" className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                <input id="emailClient" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ex: jean@exemple.com" />
              </div>
              <div>
                <label htmlFor="telephoneClient" className="block text-sm font-medium text-gray-700 mb-2">Numéro de téléphone (client)</label>
                <input id="telephoneClient" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ex: 01 23 45 67 89" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="adresseClient" className="block text-sm font-medium text-gray-700 mb-2">Adresse (client)</label>
                <textarea id="adresseClient" value={adresse} onChange={(e) => setAdresse(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ex: 123 Rue de la République, 75001 Paris" />
              </div>
              <div>
                <label htmlFor="sirenClient" className="block text-sm font-medium text-gray-700 mb-2">SIREN</label>
                <input id="sirenClient" type="text" value={siren} onChange={(e) => setSiren(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label htmlFor="siretClient" className="block text-sm font-medium text-gray-700 mb-2">SIRET</label>
                <input id="siretClient" type="text" value={siret} onChange={(e) => setSiret(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label htmlFor="tvaClient" className="block text-sm font-medium text-gray-700 mb-2">Numéro TVA</label>
                <input id="tvaClient" type="text" value={tva} onChange={(e) => setTva(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label htmlFor="rcsClient" className="block text-sm font-medium text-gray-700 mb-2">RCS / RM</label>
                <input id="rcsClient" type="text" value={rcs} onChange={(e) => setRcs(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label htmlFor="formeJuridiqueClient" className="block text-sm font-medium text-gray-700 mb-2">Forme juridique</label>
                <input id="formeJuridiqueClient" type="text" value={formeJuridique} onChange={(e) => setFormeJuridique(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Section Informations de la facture */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Informations de la facture</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="numeroFacture" className="block text-sm font-medium text-gray-700 mb-2">Numéro de facture</label>
                <input id="numeroFacture" type="text" value={numeroFacture} onChange={(e) => setNumeroFacture(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Objet / Intitulé de la facture</label>
                <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label htmlFor="dateFacture" className="block text-sm font-medium text-gray-700 mb-2">Date de la facture *</label>
                <input id="dateFacture" type="date" value={dateFacture} onChange={(e) => setDateFacture(e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${erreurs.dateFacture ? 'border-red-300' : 'border-gray-300'}`} />
                {erreurs.dateFacture && <p className="mt-1 text-sm text-red-600">{erreurs.dateFacture}</p>}
              </div>
              <div>
                <label htmlFor="dateLimitePaiement" className="block text-sm font-medium text-gray-700 mb-2">Date limite de paiement *</label>
                <input id="dateLimitePaiement" type="date" value={dateLimitePaiement} onChange={(e) => setDateLimitePaiement(e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${erreurs.dateLimitePaiement ? 'border-red-300' : 'border-gray-300'}`} />
                {erreurs.dateLimitePaiement && <p className="mt-1 text-sm text-red-600">{erreurs.dateLimitePaiement}</p>}
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select id="status" value={status} onChange={(e) => setStatus(e.target.value as 'paid' | 'unpaid')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="unpaid">Non payée</option>
                  <option value="paid">Payée</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section Informations légales du vendeur (Lecture seule) */}
          {sellerProfile && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Informations du vendeur (Vos informations)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <p><span className="font-medium">Raison Sociale:</span> {sellerProfile.full_name}</p>
                <p><span className="font-medium">Adresse:</span> {`${sellerProfile.address_street}, ${sellerProfile.address_postal_code} ${sellerProfile.address_city}`}</p>
                <p><span className="font-medium">SIRET/SIREN:</span> {sellerProfile.siret_siren}</p>
                <p><span className="font-medium">Forme Juridique:</span> {sellerProfile.legal_form}</p>
                {sellerProfile.vat_number && <p><span className="font-medium">N° TVA:</span> {sellerProfile.vat_number}</p>}
                {sellerProfile.rcs_rm && <p><span className="font-medium">RCS/RM:</span> {sellerProfile.rcs_rm}</p>}
                {/* Add more seller details if needed for display */}
              </div>
            </div>
          )}

          {/* Lignes de facturation & TVA */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Lignes d'articles/prestations</h3>
              <button type="button" onClick={ajouterLigne} className="inline-flex items-center px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />Ajouter une ligne
              </button>
            </div>
            <div>
              <label htmlFor="editableTvaRate" className="block text-sm font-medium text-gray-700 mb-1">Taux de TVA applicable (%)</label>
              <input id="editableTvaRate" type="number" step="0.01" value={editableTvaRate} onChange={(e) => setEditableTvaRate(parseFloat(e.target.value) || 0)} className={`w-1/4 px-3 py-2 border rounded-lg ${erreurs.editableTvaRate ? 'border-red-300' : 'border-gray-300'}`} />
              {erreurs.editableTvaRate && <p className="mt-1 text-sm text-red-600">{erreurs.editableTvaRate}</p>}
            </div>
            {erreurs.lignes && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{erreurs.lignes}</p></div>}
            <div className="space-y-4 mt-4">
              {lignes.map((ligne, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg items-start">
                  <div className="md:col-span-5"><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input type="text" value={ligne.description} onChange={(e) => mettreAJourLigne(index, 'description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ex: Développement site web" /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label><input type="number" min="0.01" step="0.01" value={ligne.quantite} onChange={(e) => mettreAJourLigne(index, 'quantite', e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${erreurs[`quantite_${index}`] ? 'border-red-300' : 'border-gray-300'}`} />{erreurs[`quantite_${index}`] && <p className="mt-1 text-xs text-red-600">{erreurs[`quantite_${index}`]}</p>}</div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire TTC (€)</label><input type="number" min="0" step="0.01" value={ligne.prix_unitaire} onChange={(e) => mettreAJourLigne(index, 'prix_unitaire', e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${erreurs[`prix_${index}`] ? 'border-red-300' : 'border-gray-300'}`} />{/* Helper text for VAT part of TTC removed for clarity, as overall VAT rate is now editable. Users should know if they input HT or TTC. This form assumes TTC input. */}{erreurs[`prix_${index}`] && <p className="mt-1 text-xs text-red-600">{erreurs[`prix_${index}`]}</p>}</div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Sous-total TTC</label><div className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-right font-semibold text-green-600">{formatEuro(ligne.quantite * ligne.prix_unitaire)}</div></div>
                  <div className="md:col-span-1 flex items-end h-full"><button type="button" onClick={() => supprimerLigne(index)} disabled={lignes.length === 1} className="w-full p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50" title="Supprimer cette ligne"><Trash2 className="h-4 w-4 mx-auto" /></button></div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
              <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium text-indigo-900">Total HT</span><span className="text-lg font-semibold text-indigo-600">{formatEuro(montantHT)}</span></div>
              <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium text-indigo-900">Total TVA ({editableTvaRate}%)</span><span className="text-lg font-semibold text-indigo-600">{formatEuro(montantTVA)}</span></div>
              <div className="flex justify-between items-center"><div className="flex items-center"><Calculator className="h-5 w-5 text-indigo-600 mr-2" /><span className="text-lg font-semibold text-indigo-900">Montant total TTC</span></div><div className="text-2xl font-bold text-indigo-600">{formatEuro(montantTotal)}</div></div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link to="/factures" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Annuler</Link>
            <button type="submit" disabled={loading} className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? (<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>) : (<Save className="h-5 w-5 mr-2" />)}
              {loading ? 'Création en cours...' : 'Créer la facture'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
