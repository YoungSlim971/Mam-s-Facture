import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Calculator } from 'lucide-react';

interface LigneFacture {
  description: string;
  quantite: number;
  prix_unitaire: number;
}

export default function CreerFacture() {
  const navigate = useNavigate();
  
  // État du formulaire
  const [nomClient, setNomClient] = useState('');
  const [nomEntreprise, setNomEntreprise] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [dateFacture, setDateFacture] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [lignes, setLignes] = useState<LigneFacture[]>([
    { description: '', quantite: 1, prix_unitaire: 0 }
  ]);

  const [loading, setLoading] = useState(false);
  const [erreurs, setErreurs] = useState<{ [key: string]: string }>({});

  // Calcul du montant total
  const montantTotal = lignes.reduce((total, ligne) => {
    return total + (ligne.quantite * ligne.prix_unitaire);
  }, 0);

  // Formatage des devises en français
  const formatEuro = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Formatage des nombres français
  const formatNombre = (number: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  };

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

    setLoading(true);

    try {
      const lignesValides = lignes.filter(ligne => 
        ligne.description.trim() && ligne.quantite > 0 && ligne.prix_unitaire >= 0
      );

      const response = await fetch('http://localhost:3001/api/factures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom_client: nomClient.trim(),
          nom_entreprise: nomEntreprise.trim(),
          telephone: telephone.trim(),
          adresse: adresse.trim(),
          date_facture: dateFacture,
          lignes: lignesValides
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Erreur lors de la création de la facture');
      }

      const data = await response.json();
      alert(`Facture ${data.numero_facture} créée avec succès !`);
      navigate('/factures');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/factures" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour à la liste
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Créer une nouvelle facture
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Montant total</div>
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
                      Prix unitaire (€)
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
                    Montant total de la facture
                  </span>
                </div>
                <div className="text-2xl font-bold text-indigo-600">
                  {formatEuro(montantTotal)}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link
              to="/factures"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              {loading ? 'Création en cours...' : 'Créer la facture'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
