import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { API_URL } from '@/lib/api';
import { PieChart, Pie, Cell, Legend } from 'recharts';

export function InvoicePieChart() {
  const [stats, setStats] = useState<{
    total: number;
    payees: number;
    non_payees: number;
  } | null>(null);

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
        console.log('Statistiques récupérées :', data);
        setStats(data);
      } catch {
        setStats({ total: 0, payees: 0, non_payees: 0 });
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
        {stats === null ? (
          <Skeleton className="h-40 w-full" />
        ) : stats.total === 0 ? (
          <div className="h-40 flex items-center justify-center">
            Aucune facture ce mois-ci
          </div>
        ) : (
          <PieChart
            width={200}
            height={160}
            data-testid="invoice-pie-chart"
          >
            <Pie
              data={[
                { name: 'Payées', value: stats.payees },
                { name: 'Non payées', value: stats.non_payees },
              ]}
              dataKey="value"
              nameKey="name"
              outerRadius={80}
            >
              <Cell fill="#4ade80" />
              <Cell fill="#f87171" />
            </Pie>
            <Legend verticalAlign="bottom" />
          </PieChart>
        )}
        {stats && (
          <>
            <p className="mt-4 font-medium">
              {stats.total} facture{stats.total > 1 ? 's' : ''} au total
            </p>
            <p className="text-sm text-gray-200">
              {stats.payees} payée{stats.payees > 1 ? 's' : ''}, {stats.non_payees}{' '}
              non payée{stats.non_payees > 1 ? 's' : ''}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
