import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Download, Trash2, FileText, User, Calendar, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_URL } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { computeTotals } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import StatutBadge from '@/components/StatutBadge';
import { useInvoices } from '@/context/InvoicesContext';

interface Facture {
  id: number;
  numero_facture: string;
  nom_client: string;
  nom_entreprise?: string;
  telephone?: string;
  adresse?: string;
  date_facture: string;
  date_facture_fr: string;
  montant_total: number;
  montant_total_fr: string;
  created_at: string;
  updated_at: string;
  title?: string;
  status?: 'paid' | 'unpaid';
  logo_path?: string;
  siren?: string;
  siret?: string;
  legal_form?: string;
  vat_number?: string;
  vat_rate?: number;
  rcs_number?: string;
  lignes: LigneFacture[];
}

interface LigneFacture {
  id: number;
  description: string;
  quantite: number;
  prix_unitaire: number;
  sous_total: number;
}

export default function DetailFacture() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refresh } = useInvoices();
  const [facture, setFacture] = useState<Facture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chargerFacture = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/factures/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Facture non trouvée');
        } else {
          throw new Error('Erreur lors du chargement de la facture');
        }
        return;
      }

      const data = await response.json();
      setFacture(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      chargerFacture();
    }
  }, [id, chargerFacture]);

  const supprimerFacture = async () => {
    if (!facture || !confirm(`Êtes-vous sûr de vouloir supprimer la facture ${facture.numero_facture} ?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/factures/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      alert('Facture supprimée avec succès');
      window.dispatchEvent(new Event('factureChange'));
      await refresh();
      navigate('/factures');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const telechargerFacture = async (): Promise<void> => {
    if (!facture) return;
    const url = `${API_URL}/factures/${facture.id}/html`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Erreur lors du téléchargement');
      }
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `facture-${facture.numero_facture}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ description: 'Le fichier a été téléchargé avec succès' });
    } catch (err) {
      toast({
        description:
          err instanceof Error ? err.message : 'Erreur lors du téléchargement',
        variant: 'destructive'
      });
    }
  };

  const euroFormatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  });
  const formatEuro = (amount: number) => euroFormatter.format(amount);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'd MMMM yyyy', { locale: fr });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'd MMMM yyyy HH:mm', { locale: fr });
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

  if (error || !facture) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Facture non trouvée'}
          </h2>
          <p className="text-gray-600 mb-6">
            La facture demandée n'existe pas ou a été supprimée.
          </p>
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour
          </button>
        </div>
      </div>
    );
  }

  const tauxTVA = facture.vat_rate ?? 20;
  const { totalHT, totalTVA: montantTVA, totalTTC } = computeTotals(
    facture.lignes.map(l => ({ quantite: l.quantite, prix_unitaire: l.prix_unitaire })),
    tauxTVA
  );

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
                onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </button>
              <FileText className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {facture.numero_facture}
                </h1>
                <p className="text-sm text-gray-500">
                  Créée le {formatDateTime(facture.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to={`/factures/${facture.id}/modifier`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-5 w-5 mr-2" />
                Modifier
              </Link>
              <Button
                variant="outline"
                onClick={() => telechargerFacture()}
                title="Télécharger en HTML"
              >
                <Download className="h-5 w-5 mr-2" />
                Télécharger
              </Button>
              <button
                onClick={supprimerFacture}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Informations générales */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Informations générales
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Numéro de facture</p>
                      <p className="font-semibold text-gray-900">{facture.numero_facture}</p>
                    </div>
                  </div>
                  {facture.title && (
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Intitulé</p>
                        <p className="font-semibold text-gray-900">{facture.title}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Date de facturation</p>
                      <p className="font-semibold text-gray-900">{formatDate(facture.date_facture)}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Euro className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Montant total</p>
                      <p className="text-2xl font-bold text-green-600">{facture.montant_total_fr}</p>
                    </div>
                  </div>
                  {facture.status && (
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Statut</p>
                        <StatutBadge statut={facture.status === 'paid' ? 'payée' : 'non payée'} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Nombre de lignes</p>
                      <p className="font-semibold text-gray-900">{facture.lignes.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informations client */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informations du client
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nom du client</p>
                  <p className="font-semibold text-gray-900 text-lg">{facture.nom_client}</p>
                </div>
                {facture.nom_entreprise && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Entreprise</p>
                    <p className="font-semibold text-gray-900">{facture.nom_entreprise}</p>
                  </div>
                )}
                {facture.telephone && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Téléphone</p>
                    <p className="font-semibold text-gray-900">{facture.telephone}</p>
                  </div>
                )}
                {facture.adresse && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Adresse</p>
                    <p className="font-semibold text-gray-900 whitespace-pre-line">{facture.adresse}</p>
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* Informations légales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Informations légales</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {facture.siren && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">SIREN</p>
                  <p className="font-semibold text-gray-900">{facture.siren}</p>
                </div>
              )}
              {facture.siret && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">SIRET</p>
                  <p className="font-semibold text-gray-900">{facture.siret}</p>
                </div>
              )}
              {facture.legal_form && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Forme juridique</p>
                  <p className="font-semibold text-gray-900">{facture.legal_form}</p>
                </div>
              )}
              {facture.vat_number && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">N° TVA</p>
                  <p className="font-semibold text-gray-900">{facture.vat_number}</p>
                </div>
              )}
              {typeof facture.vat_rate !== 'undefined' && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Taux de TVA</p>
                  <p className="font-semibold text-gray-900">{facture.vat_rate}%</p>
                </div>
              )}
              {facture.rcs_number && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">N° RCS</p>
                  <p className="font-semibold text-gray-900">{facture.rcs_number}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lignes de facturation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Articles et prestations
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix unitaire
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sous-total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {facture.lignes.map((ligne, index) => (
                    <tr key={ligne.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{ligne.description}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm text-gray-900">
                          {ligne.quantite.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm text-gray-900">{formatEuro(ligne.prix_unitaire)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatEuro(ligne.sous_total)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-indigo-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right">
                      <p className="text-lg font-bold text-gray-900">Total HT</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-lg font-bold text-indigo-600">{formatEuro(totalHT)}</p>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right">
                      <p className="text-lg font-bold text-gray-900">TVA {tauxTVA}%</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-lg font-bold text-indigo-600">{formatEuro(montantTVA)}</p>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right">
                      <p className="text-lg font-bold text-gray-900">Total TTC</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-xl font-bold text-indigo-600">{formatEuro(totalTTC)}</p>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Informations système */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Informations système
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Créée le</p>
                <p className="font-medium text-gray-900">{formatDateTime(facture.created_at)}</p>
              </div>
              <div>
                <p className="text-gray-500">Dernière modification</p>
                <p className="font-medium text-gray-900">{formatDateTime(facture.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
