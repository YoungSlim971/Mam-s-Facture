import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  Filter,
  FileText,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Check,
  ArrowLeft,
  Calendar,
  Globe
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { API_URL } from '@/lib/api';
import { saveAs } from 'file-saver';

interface Facture {
  id: number;
  numero_facture: string;
  nom_client: string;
  nom_entreprise?: string;
  status?: 'paid' | 'unpaid';
  date_facture: string;
  date_facture_fr: string;
  montant_total: number;
  montant_total_fr: string;
  nombre_lignes: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ListeFactures() {
  const location = useLocation();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Filtres
  const [recherche, setRecherche] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [exportFormat, setExportFormat] = useState<'html' | 'pdf'>('html');

  const chargerFactures = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: recherche,
        dateDebut,
        dateFin,
        status: statusFilter,
        sortBy: sortField,
        order: sortOrder
      });

      const response = await fetch(`${API_URL}/factures?${params}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des factures');
      }

      const data = await response.json();
      setFactures(data.factures);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, recherche, dateDebut, dateFin, statusFilter, sortField, sortOrder]);

  useEffect(() => {
    chargerFactures();
  }, [chargerFactures]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const st = params.get('status');
    if (st) setStatusFilter(st);
  }, [location.search]);

  const supprimerFacture = async (id: number, numeroFacture: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la facture ${numeroFacture} ?`)) {
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
      chargerFactures();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const telechargerFacture = async (
    id: number,
    numeroFacture: string,
    dateFacture: string,
    nomEntreprise?: string,
    format: 'html' | 'pdf' = exportFormat
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/factures/${id}/${format}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la génération du fichier');
      }
      if (format === 'pdf') {
        const pdf = await response.blob();
        saveAs(
          pdf,
          `facture-${numeroFacture}-${dateFacture}-${nomEntreprise ? nomEntreprise.replace(/\s+/g, '-') : ''}.pdf`
        );
      } else {
        const html = await response.text();
        const blob = new Blob([html], { type: 'text/html' });
        saveAs(
          blob,
          `facture-${numeroFacture}-${dateFacture}-${nomEntreprise ? nomEntreprise.replace(/\s+/g, '-') : ''}.html`
        );
      }
    } catch (err) {
      if (format === 'pdf') {
        try {
          await telechargerFacture(
            id,
            numeroFacture,
            dateFacture,
            nomEntreprise,
            'html'
          );
          alert('Export PDF impossible, fichier HTML généré.');
        } catch (e) {
          alert(
            e instanceof Error ? e.message : 'Erreur lors du téléchargement'
          );
        }
      } else {
        alert(
          err instanceof Error ? err.message : 'Erreur lors du téléchargement'
        );
      }
    }
  };

  const marquerPayee = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/factures/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" })
      });
      if (!response.ok) {
        throw new Error("Erreur lors du changement de statut");
      }
      setFactures(prev => {
        const updated = prev.map(f =>
          f.id === id ? { ...f, status: 'paid' as const } : f
        );
        return statusFilter === "unpaid"
          ? updated.filter(f => f.id !== id)
          : updated;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur inattendue");
    }
  };

  const changerPage = (nouvellePage: number) => {
    setPagination(prev => ({ ...prev, page: nouvellePage }));
  };

  if (loading && factures.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des factures...</p>
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
              <Link to="/" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour
              </Link>
              <FileText className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Liste des factures
              </h1>
            </div>
            <Link
              to="/factures/nouvelle"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle facture
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres de recherche</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher un client ou N° facture
              </label>
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Nom du client, entreprise ou numéro..."
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début
              </label>
              <div className="relative">
                <Calendar className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de fin
            </label>
            <div className="relative">
              <Calendar className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tous</option>
              <option value="unpaid">Non payées</option>
              <option value="paid">Payées</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="date">Date</option>
              <option value="nom">Nom</option>
              <option value="entreprise">Entreprise</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ordre</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="asc">Croissant</option>
              <option value="desc">Décroissant</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format export</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'html' | 'pdf')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="html">HTML</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        </div>
      </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Liste des factures */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {pagination.total} facture{pagination.total > 1 ? 's' : ''} trouvée{pagination.total > 1 ? 's' : ''}
            </h3>
          </div>

          {factures.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune facture trouvée
              </h3>
              <p className="text-gray-600 mb-6">
                {recherche || dateDebut || dateFin || statusFilter
                  ? "Aucune facture ne correspond à vos critères de recherche."
                  : "Vous n'avez pas encore créé de facture."}
              </p>
              <Link
                to="/factures/nouvelle"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Créer ma première facture
              </Link>
            </div>
          ) : (
            <>
              {/* Tableau */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N° Facture
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {factures.map((facture) => (
                      <tr key={facture.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {facture.numero_facture}
                          </div>
                          <div className="text-sm text-gray-500">
                            {facture.nombre_lignes} ligne{facture.nombre_lignes > 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {facture.nom_client}
                          </div>
                          {facture.nom_entreprise && (
                            <div className="text-sm text-gray-500">
                              {facture.nom_entreprise}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {facture.date_facture_fr}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {facture.status === 'paid' ? 'Payée' : 'Non payée'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-semibold text-green-600">
                            {facture.montant_total_fr}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/factures/${facture.id}`}
                              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Voir les détails"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`/factures/${facture.id}/modifier`}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Exporter"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onSelect={() =>
                                    telechargerFacture(
                                      facture.id,
                                      facture.numero_facture,
                                      facture.date_facture,
                                      facture.nom_entreprise,
                                      'pdf'
                                    )
                                  }
                                >
                                  <FileText className="mr-2 h-4 w-4" /> PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    telechargerFacture(
                                      facture.id,
                                      facture.numero_facture,
                                      facture.date_facture,
                                      facture.nom_entreprise,
                                      'html'
                                    )
                                  }
                                >
                                  <Globe className="mr-2 h-4 w-4" /> HTML
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {facture.status !== 'paid' && (
                              <button
                                onClick={() => marquerPayee(facture.id)}
                                className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Marquer comme payée"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => supprimerFacture(facture.id, facture.numero_facture)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Affichage de {((pagination.page - 1) * pagination.limit) + 1} à{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
                      {pagination.total} résultats
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => changerPage(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Précédent
                      </button>
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => changerPage(page)}
                          className={`px-3 py-2 text-sm rounded-lg ${
                            page === pagination.page
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => changerPage(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
