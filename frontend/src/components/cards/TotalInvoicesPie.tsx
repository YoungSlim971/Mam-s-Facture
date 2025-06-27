import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, Legend } from 'recharts';
import { apiClient } from '@/lib/api';

function SkeletonPie() {
  return <Skeleton className="h-40 w-full" />;
}

export function TotalInvoicesPie() {
  const [payees, setPayees] = useState(0);
  const [nonPayees, setNonPayees] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    apiClient
      .getInvoiceSummary()
      .then(res => {
        setPayees(res.payees);
        setNonPayees(res.non_payees);
      })
      .catch(err => {
        console.error('Failed to fetch invoice summary', err);
        setError(true);
      })
      .finally(() => {
        clearTimeout(timer);
        setIsLoading(false);
      });
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, []);

  const total = payees + nonPayees;

  return (
    <Card className="w-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-gradient-to-br from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] text-white dark:from-indigo-900 dark:via-violet-900 dark:to-indigo-950">
      <CardHeader>
        <CardTitle>Répartition des factures</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {error ? (
          <div className="h-40 flex items-center justify-center">Données non disponibles</div>
        ) : isLoading ? (
          <SkeletonPie />
        ) : total === 0 ? (
          <div className="h-40 flex items-center justify-center">Aucune facture enregistrée</div>
        ) : (
          <PieChart width={200} height={160} data-testid="invoice-pie-chart">
            <Pie
              data={[
                { name: 'Payées', value: payees },
                { name: 'Non payées', value: nonPayees },
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
        {!isLoading && !error && (
          <>
            <p className="mt-4 font-medium">
              {total} facture{total > 1 ? 's' : ''} au total
            </p>
            <p className="text-sm text-gray-200">
              {payees} payée{payees > 1 ? 's' : ''}, {nonPayees} non payée{nonPayees > 1 ? 's' : ''}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
