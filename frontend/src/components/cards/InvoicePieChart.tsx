import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { API_URL } from '@/lib/api';

export function InvoicePieChart() {
  const [url, setUrl] = useState('');
  const [stats, setStats] = useState({ total: 0, paid: 0, unpaid: 0 });

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
    const handler = () => load();
    window.addEventListener('factureChange', handler);
    window.addEventListener('factureStatutChange', handler);
    return () => {
      window.removeEventListener('factureChange', handler);
      window.removeEventListener('factureStatutChange', handler);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statut du mois</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {url ? <img src={url} alt="Camembert factures" /> : <Skeleton className="h-40 w-full" />}
        <p className="mt-4 font-medium">
          {stats.total} facture{stats.total > 1 ? 's' : ''} au total
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {stats.paid} payée{stats.paid > 1 ? 's' : ''}, {stats.unpaid} impayée{stats.unpaid > 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  );
}
