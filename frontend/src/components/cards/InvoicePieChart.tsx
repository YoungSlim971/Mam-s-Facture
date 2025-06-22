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

