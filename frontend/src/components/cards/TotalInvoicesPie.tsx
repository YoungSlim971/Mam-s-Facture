import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, Legend } from 'recharts';
import { apiClient } from '@/lib/api';

export function TotalInvoicesPie() {
  const [stats, setStats] = useState<{ payees: number; non_payees: number } | null>(null);

  useEffect(() => {
    const fetchSummary = () => {
      apiClient
        .getInvoiceSummary()
        .then(data => setStats({ payees: data.payees ?? 0, non_payees: data.non_payees ?? 0 }))
        .catch(console.error);
    };

    fetchSummary();

    const handler = () => fetchSummary();

    window.addEventListener('factureChange', handler);

    return () => window.removeEventListener('factureChange', handler);
  }, []);

  const total = stats ? stats.payees + stats.non_payees : 0;

  return (
    <Card className="w-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-gradient-to-br from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] text-white dark:from-indigo-900 dark:via-violet-900 dark:to-indigo-950">
      <CardHeader>
        <CardTitle>Répartition des factures</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {stats === null ? (
          <Skeleton className="h-40 w-full" />
        ) : total === 0 ? (
          <div className="h-40 flex items-center justify-center">
            Aucune facture enregistrée
          </div>
        ) : (
          <PieChart width={200} height={160} data-testid="invoice-pie-chart">
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
              {total} facture{total > 1 ? 's' : ''} au total
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
