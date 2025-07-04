import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Calculator } from 'lucide-react';
import LogoDropzone from '@/components/LogoDropzone';
import { API_URL, apiClient } from '@/lib/api';
import { computeTotals } from '@/lib/utils';
import { updateInvoice } from '@/utils/invoiceService';
import { useInvoices } from '@/context/InvoicesContext';

interface LigneFacture {
  description: string;
  quantite: number;
  prix_unitaire: number;
}

interface Facture {
  id: number;
  numero_facture: string;
  nom_client: string;
  nom_entreprise?: string;
  telephone?: string;
  adresse?: string;
  date_facture: string;
  montant_total: number;
  title?: string;
  status?: 'paid' | 'unpaid';
  logo_path?: string;
  siren?: string;
  siret?: string;
  legal_form?: string;
  vat_number?: string;
  vat_rate?: number;
  rcs_number?: string;
  client_id?: number;
  lignes: Array<{
    id: number;
    description: string;
    quantite: number;
    prix_unitaire: number;
    sous_total: number;
  }>;
}

export default function ModifierFacture() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refresh } = useInvoices();
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));
  
  // État du formulaire
  const [nomClient, setNomClient] = useState('');
  const [nomEntreprise, setNomEntreprise] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [dateFacture, setDateFacture] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'paid' | 'unpaid'>('unpaid');
  const [logoPath, setLogoPath] = useState('');
  const [numeroFacture, setNumeroFacture] = useState('');
  const [siren, setSiren] = useState('');
  const [siret, setSiret] = useState('');
  const [legalForm, setLegalForm] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [rcsNumber, setRcsNumber] = useState('');
  const [clients, setClients] = useState<Array<{
    id: number
    nom_client: string
    nom_entreprise?: string
    telephone?: string
    adresse?: string
    intitule?: string
    siren?: string
    siret?: string
    legal_form?: string
    tva?: string
    rcs_number?: string
  }>>([])
  const [clientId, setClientId] = useState<number | ''>('')
  const [lignes, setLignes] = useState<LigneFacture[]>([
    { description: '', quantite: 1, prix_unitaire: 0 }
  ]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [erreurs, setErreurs] = useState<{ [key: string]: string }>({});
  const [factureOriginale, setFactureOriginale] = useState<Facture | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      const data = await apiClient.getClients();
      setClients(data);
    }
    fetchClients()
  }, [])

  const handleSelectClient = (id: string) => {
    if (!id) {
      setClientId('')
      return
    }
    const cid = parseInt(id)
    setClientId(cid)
    const client = clients.find(c => c.id === cid)
    if (client) {
      setNomClient(client.nom_client)
      setNomEntreprise(client.nom_entreprise || '')
      setTelephone(client.telephone || '')
      setAdresse(client.adresse || '')
      setSiren(client.siren || '')
      setSiret(client.siret || '')
      setLegalForm(client.legal_form || '')
      setVatNumber(client.tva || '')
      setRcsNumber(client.rcs_number || '')
      setTitle(client.intitule || '')
    }
  }

  // Charger la facture existante
  const chargerFacture = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/factures/${id}`);
      
      if (!response.ok) {
        throw new Error('Facture non trouvée');
      }

      const facture: Facture = await response.json();
      setFactureOriginale(facture);

      // Remplir le formulaire avec les données existantes
      setNomClient(facture.nom_client);
      setNomEntreprise(facture.nom_entreprise || '');
      setTelephone(facture.telephone || '');
      setAdresse(facture.adresse || '');
      setDateFacture(facture.date_facture);
      setTitle(facture.title || '');
      setStatus(facture.status || 'unpaid');
      setLogoPath(facture.logo_path || '');
      setNumeroFacture(facture.numero_facture || '');
      setSiren(facture.siren || '');
      setSiret(facture.siret || '');
      setLegalForm(facture.legal_form || '');
      setVatNumber(facture.vat_number || '');
      setRcsNumber(facture.rcs_number || '');
      setClientId(facture.client_id ?? '')
      
      // Convertir les lignes au format du formulaire
      const lignesFormulaire = facture.lignes.map(ligne => ({
        description: ligne.description,
        quantite: ligne.quantite,
        prix_unitaire: ligne.prix_unitaire
      }));
      setLignes(lignesFormulaire.length > 0 ? lignesFormulaire : [{ description: '', quantite: 1, prix_unitaire: 0 }]);
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du chargement de la facture');
      navigate('/factures');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      chargerFacture();
    }
  }, [id, chargerFacture]);

  const TVA_RATE = 20;
  const { totalHT: montantHT, totalTTC: montantTotal } = computeTotals(
    lignes,
    TVA_RATE
  );

  // Formatage des devises en français
  const euroFormatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  });
  const formatEuro = (amount: number) => euroFormatter.format(amount);

  // Ajouter une ligne
  const ajouterLigne = () => {
    setLignes([...lignes, { description: '', quantite: 1, prix_unitaire: 0 }]);
  };

  // Supprimer une ligne
  const supprimerLigne = (index: number) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((_, i) => i !== index));
    }
  };

  // Mettre à jour une ligne
  const mettreAJourLigne = (index: number, champ: keyof LigneFacture, valeur: string | number) => {
    const nouvellesLignes = [...lignes];
    nouvellesLignes[index] = { ...nouvellesLignes[index], [champ]: valeur };
    setLignes(nouvellesLignes);
  };

  // Validation du formulaire
  const validerFormulaire = () => {
    const nouvellesErreurs: { [key: string]: string } = {};

    if (!nomClient.trim()) {
      nouvellesErreurs.nomClient = 'Le nom du client est requis';
    }

    if (!dateFacture) {
      nouvellesErreurs.dateFacture = 'La date de la facture est requise';
    }

    const lignesValides = lignes.filter(ligne => 
      ligne.description.trim() && ligne.quantite > 0 && ligne.prix_unitaire >= 0
    );

    if (lignesValides.length === 0) {
      nouvellesErreurs.lignes = 'Au moins une ligne valide est requise';
    }

    lignes.forEach((ligne, index) => {
      if (ligne.description.trim() && (!ligne.quantite || ligne.quantite <= 0)) {
        nouvellesErreurs[`quantite_${index}`] = 'La quantité doit être supérieure à 0';
      }
      if (ligne.description.trim() && ligne.prix_unitaire < 0) {
        nouvellesErreurs[`prix_${index}`] = 'Le prix ne peut pas être négatif';
      }
    });

    setErreurs(nouvellesErreurs);
    return Object.keys(nouvellesErreurs).length === 0;
  };

  // Soumettre le formulaire
  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validerFormulaire()) {
      return;
    }

    setSubmitting(true);

    try {
      const lignesValides = lignes.filter(ligne => 
        ligne.description.trim() && ligne.quantite > 0 && ligne.prix_unitaire >= 0
      );

      await updateInvoice(Number(id), {
        numero_facture: numeroFacture.trim(),
        client_id: clientId || undefined,
        nom_client: nomClient.trim(),
        nom_entreprise: nomEntreprise.trim(),
        telephone: telephone.trim(),
        adresse: adresse.trim(),
        date_facture: dateFacture,
        title: title.trim(),
        status,
        logo_path: logoPath.trim(),
        siren: siren.trim(),
        siret: siret.trim(),
        legal_form: legalForm.trim(),
        vat_number: vatNumber.trim(),
        rcs_number: rcsNumber.trim(),
        lignes: lignesValides,
      });

      await refresh();
      alert('Facture modifiée avec succès !');
      navigate(`/factures/${id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la facture...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header
        className="bg-gradient-to-r from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] text-white shadow-sm border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                type="button"
                onClick={goBack}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Modifier la facture {factureOriginale?.numero_facture}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Nouveau montant total</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatEuro(montantTotal)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={soumettre} className="space-y-8">
          {/* Informations client */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Informations du client
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un client enregistré</label>
                <select
                  value={clientId}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">-- Aucun --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom_client}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du client *
                </label>
                <input
                  type="text"
                  value={nomClient}
                  onChange={(e) => setNomClient(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    erreurs.nomClient ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Jean Dupont"
                />
                {erreurs.nomClient && (
                  <p className="mt-1 text-sm text-red-600">{erreurs.nomClient}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  value={nomEntreprise}
                  onChange={(e) => setNomEntreprise(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Dupont SARL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: 01 23 45 67 89"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de la facture *
                </label>
                <input
                  type="date"
                  value={dateFacture}
                  onChange={(e) => setDateFacture(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    erreurs.dateFacture ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {erreurs.dateFacture && (
                  <p className="mt-1 text-sm text-red-600">{erreurs.dateFacture}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <textarea
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: 123 Rue de la République, 75001 Paris"
                />
              </div>
          </div>
        </div>

        {/* Informations légales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Informations légales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de facture</label>
              <input
                type="text"
                value={numeroFacture}
                onChange={(e) => setNumeroFacture(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Intitulé</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'paid' | 'unpaid')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="unpaid">Non payée</option>
                <option value="paid">Payée</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
              <LogoDropzone onUploaded={setLogoPath} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SIREN</label>
              <input
                type="text"
                value={siren}
                onChange={(e) => setSiren(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SIRET</label>
              <input
                type="text"
                value={siret}
                onChange={(e) => setSiret(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Forme juridique</label>
              <input
                type="text"
                value={legalForm}
                onChange={(e) => setLegalForm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">N° TVA</label>
              <input
                type="text"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">N° RCS</label>
              <input
                type="text"
                value={rcsNumber}
                onChange={(e) => setRcsNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Lignes de facturation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Lignes d'articles/prestations
              </h3>
              <button
                type="button"
                onClick={ajouterLigne}
                className="inline-flex items-center px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </button>
            </div>

            {erreurs.lignes && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{erreurs.lignes}</p>
              </div>
            )}

            <div className="space-y-4">
              {lignes.map((ligne, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="md:col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={ligne.description}
                      onChange={(e) => mettreAJourLigne(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ex: Développement site web"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantité
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={ligne.quantite}
                      onChange={(e) => mettreAJourLigne(index, 'quantite', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        erreurs[`quantite_${index}`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {erreurs[`quantite_${index}`] && (
                      <p className="mt-1 text-xs text-red-600">{erreurs[`quantite_${index}`]}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix unitaire TTC (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={ligne.prix_unitaire}
                      onChange={(e) => mettreAJourLigne(index, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        erreurs[`prix_${index}`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      (TVA :{' '}
                      {formatEuro(
                        ligne.prix_unitaire - ligne.prix_unitaire / (1 + TVA_RATE / 100)
                      )})
                    </p>
                    {erreurs[`prix_${index}`] && (
                      <p className="mt-1 text-xs text-red-600">{erreurs[`prix_${index}`]}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sous-total
                    </label>
                    <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-right font-semibold text-green-600">
                      {formatEuro(ligne.quantite * ligne.prix_unitaire)}
                    </div>
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => supprimerLigne(index)}
                      disabled={lignes.length === 1}
                      className="w-full p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Supprimer cette ligne"
                    >
                      <Trash2 className="h-4 w-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Récapitulatif */}
            <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Calculator className="h-5 w-5 text-indigo-600 mr-2" />
                  <span className="text-lg font-semibold text-indigo-900">
                    Nouveau montant total de la facture
                  </span>
                </div>
                <div className="text-2xl font-bold text-indigo-600">
                  {formatEuro(montantTotal)}
                </div>
              </div>
              {factureOriginale && montantTotal !== factureOriginale.montant_total && (
                <div className="mt-2 text-sm text-indigo-700">
                  Montant précédent : {formatEuro(factureOriginale.montant_total)}
                  <span className={`ml-2 font-semibold ${
                    montantTotal > factureOriginale.montant_total ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ({montantTotal > factureOriginale.montant_total ? '+' : ''}
                    {formatEuro(montantTotal - factureOriginale.montant_total)})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link
              to={`/factures/${id}`}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              {submitting ? 'Modification en cours...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
