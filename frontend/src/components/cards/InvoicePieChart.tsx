import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { API_URL } from '@/lib/api';

export function InvoicePieChart() {
  const [url, setUrl] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/invoices?month=current`);
        const data = await res.json();
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
        <CardTitle>Statut du mois</CardTitle>
      </CardHeader>
      <CardContent>
        {url ? (
          <img src={url} alt="Camembert factures" />
        ) : (
          <Skeleton className="h-40 w-full" />
        )}
      </CardContent>
    </Card>
  );
}
