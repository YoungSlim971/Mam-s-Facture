import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { API_URL } from '@/lib/api';

export function InvoicePieChart() {
  const [url, setUrl] = useState('');
  const [stats, setStats] = useState({ paid: 0, unpaid: 0 });
  const [showPaid, setShowPaid] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/invoices?month=current`);
        const data = await res.json();
        setStats(data);
        const cfg = {
          type: 'pie',
          data: {
            labels: ['Payées', 'Impayées'],
            datasets: [{ data: [data.paid, data.unpaid] }],
          },
        };
        setUrl(
          'https://quickchart.io/chart?c=' +
            encodeURIComponent(JSON.stringify(cfg))
        );
      } catch {
        setUrl('');
      }
    }
    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Statut du mois</CardTitle>
          <div className="flex items-center space-x-2">
            <Switch checked={showPaid} onCheckedChange={setShowPaid} />
            <span className="text-sm">
              {showPaid ? 'Payées' : 'Impayées'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-center">
        {url ? <img src={url} alt="Camembert factures" /> : <Skeleton className="h-40 w-full" />}
        <p className="mt-4 font-medium">
          {showPaid ? stats.paid : stats.unpaid} facture{(showPaid ? stats.paid : stats.unpaid) > 1 ? 's' : ''}{' '}
          {showPaid ? 'payée' : 'impayée'}{(showPaid ? stats.paid : stats.unpaid) > 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  );
}
diff --git a/frontend/src/components/Sidebar.tsx b/frontend/src/components/Sidebar.tsx
index 083f248b3db83a03cd96fb34eec192ccbc86c0ff..f89ab913aaa79690e26d8f914e9fbeb3d80a5a77 100644
--- a/frontend/src/components/Sidebar.tsx
+++ b/frontend/src/components/Sidebar.tsx
@@ -17,50 +17,54 @@ export default function Sidebar() {
     <aside
       className={`fixed left-0 top-0 z-50 h-full w-64 bg-sidebar p-6 text-sidebar-foreground shadow-lg transform transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
     >
       {isMobile && (
         <button onClick={() => setOpen(false)} className="absolute top-2 right-2 p-1">
           <X className="h-5 w-5" />
         </button>
       )}
       <nav className="space-y-4 mt-6">
         <NavLink to="/" className="flex items-center space-x-2 hover:text-primary">
           <Home className="h-5 w-5" />
           <span>Accueil</span>
         </NavLink>
         <NavLink to="/factures" className="flex items-center space-x-2 hover:text-primary">
           <FileText className="h-5 w-5" />
           <span>Toutes les factures</span>
         </NavLink>
         <NavLink to="/factures/nouvelle" className="flex items-center space-x-2 hover:text-primary">
           <PlusCircle className="h-5 w-5" />
           <span>Créer une facture</span>
         </NavLink>
         <NavLink to="/factures?status=unpaid" className="flex items-center space-x-2 hover:text-primary">
           <CircleAlert className="h-5 w-5" />
           <span>Factures non payées</span>
         </NavLink>
+        <NavLink to="/factures?status=paid" className="flex items-center space-x-2 hover:text-primary">
+          <CircleAlert className="h-5 w-5" />
+          <span>Factures payées</span>
+        </NavLink>
         <NavLink to="/clients" className="flex items-center space-x-2 hover:text-primary">
           <Users className="h-5 w-5" />
           <span>Clients</span>
         </NavLink>
         <button onClick={toggleTheme} className="flex items-center space-x-2 hover:text-primary">
           <Sun className="h-5 w-5" />
           <span>Changer le thème ({theme})</span>
         </button>
       </nav>
     </aside>
   )
 
   return (
     <>
       {isMobile && !open && (
         <button
           onClick={() => setOpen(true)}
           className="fixed top-2 left-2 z-40 p-2 bg-sidebar text-sidebar-foreground rounded-md shadow md:hidden"
         >
           <Menu className="h-5 w-5" />
         </button>
       )}
       {isMobile && open && (
         <div className="fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)} />
       )}
diff --git a/frontend/src/pages/ListeFactures.tsx b/frontend/src/pages/ListeFactures.tsx
index ea97ce46436b4323ba2d57cd818920a269084b19..99a02d08bf065ac93db6de059c3c1f66c39f370b 100644
--- a/frontend/src/pages/ListeFactures.tsx
+++ b/frontend/src/pages/ListeFactures.tsx
@@ -1,28 +1,28 @@
 import { useState, useEffect, useCallback } from 'react';
 import { Link, useLocation } from 'react-router-dom';
-import { Search, Filter, FileText, Plus, Eye, Edit, Trash2, Download, ArrowLeft, Calendar } from 'lucide-react';
+import { Search, Filter, FileText, Plus, Eye, Edit, Trash2, Download, Check, ArrowLeft, Calendar } from 'lucide-react';
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
diff --git a/frontend/src/pages/ListeFactures.tsx b/frontend/src/pages/ListeFactures.tsx
index ea97ce46436b4323ba2d57cd818920a269084b19..99a02d08bf065ac93db6de059c3c1f66c39f370b 100644
--- a/frontend/src/pages/ListeFactures.tsx
+++ b/frontend/src/pages/ListeFactures.tsx
@@ -115,50 +115,73 @@ export default function ListeFactures() {
       const response = await fetch(
         `${API_URL}/factures/${id}/${exportFormat}`
       );
       if (!response.ok) {
         throw new Error('Erreur lors de la génération du fichier');
       }
       if (exportFormat === 'pdf') {
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
       alert(err instanceof Error ? err.message : 'Erreur lors du téléchargement');
     }
   };
 
+  const marquerPayee = async (id: number) => {
+    try {
+      const response = await fetch(`${API_URL}/factures/${id}/status`, {
+        method: 'PATCH',
+        headers: { 'Content-Type': 'application/json' },
+        body: JSON.stringify({ status: 'paid' })
+      });
+      if (!response.ok) {
+        throw new Error('Erreur lors du changement de statut');
+      }
+      setFactures(prev => {
+        const updated = prev.map(f =>
+          f.id === id ? { ...f, status: 'paid' } : f
+        );
+        return statusFilter === 'unpaid'
+          ? updated.filter(f => f.id !== id)
+          : updated;
+      });
+    } catch (err) {
+      alert(err instanceof Error ? err.message : 'Erreur inattendue');
+    }
+  };
+
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
diff --git a/frontend/src/pages/ListeFactures.tsx b/frontend/src/pages/ListeFactures.tsx
index ea97ce46436b4323ba2d57cd818920a269084b19..99a02d08bf065ac93db6de059c3c1f66c39f370b 100644
--- a/frontend/src/pages/ListeFactures.tsx
+++ b/frontend/src/pages/ListeFactures.tsx
@@ -378,50 +401,59 @@ export default function ListeFactures() {
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
                             <button
                               onClick={() =>
                                 telechargerFacture(
                                   facture.id,
                                   facture.numero_facture,
                                   facture.date_facture,
                                   facture.nom_entreprise
                                 )
                               }
                               className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                               title="Exporter"
                             >
                               <Download className="h-4 w-4" />
                             </button>
+                            {facture.status !== 'paid' && (
+                              <button
+                                onClick={() => marquerPayee(facture.id)}
+                                className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
+                                title="Marquer comme payée"
+                              >
+                                <Check className="h-4 w-4" />
+                              </button>
+                            )}
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

