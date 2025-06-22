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
