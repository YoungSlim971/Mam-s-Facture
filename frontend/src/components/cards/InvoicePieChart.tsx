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
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const res = await fetch(
          `${API_URL}/invoices/stats?month=${month}&year=${year}`
        );
        const data = await res.json();
        console.log('📥 Stats data:', data);
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
    <Card
      className="w-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-gradient-to-br from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] text-white dark:from-indigo-900 dark:via-violet-900 dark:to-indigo-950"
    >
      <CardHeader>
        <CardTitle>Statut du mois</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {url ? <img src={url} alt="Camembert factures" /> : <Skeleton className="h-40 w-full" />}
        <p className="mt-4 font-medium">
          {stats.total} facture{stats.total > 1 ? 's' : ''} au total
        </p>
        <p className="text-sm text-gray-200">
          {stats.paid} payée{stats.paid > 1 ? 's' : ''}, {stats.unpaid} impayée{stats.unpaid > 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  );
}
