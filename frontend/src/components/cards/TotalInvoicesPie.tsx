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
  const [hasData, setHasData] = useState(true);

  useEffect(() => {
    apiClient
      .getInvoiceSummary()
      .then(res => {
        setPayees(res.payees);
        setNonPayees(res.non_payees);
      })
      .catch(() => {
        setHasData(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const total = payees + nonPayees;

  if (isLoading) {
    return (
      <Card className="w-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-gradient-to-br from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] text-white dark:from-indigo-900 dark:via-violet-900 dark:to-indigo-950">
        <CardHeader>
          <CardTitle>Répartition des factures</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <SkeletonPie />
        </CardContent>
      </Card>
    );
  }

  if (!hasData) return null;

  return (
    <Card className="w-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-gradient-to-br from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] text-white dark:from-indigo-900 dark:via-violet-900 dark:to-indigo-950">
      <CardHeader>
        <CardTitle>Répartition des factures</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {total === 0 ? (
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
        <>
          <p className="mt-4 font-medium">
            {total} facture{total > 1 ? 's' : ''} au total
          </p>
          <p className="text-sm text-gray-200">
            {payees} payée{payees > 1 ? 's' : ''}, {nonPayees} non payée{nonPayees > 1 ? 's' : ''}
          </p>
        </>
      </CardContent>
    </Card>
  );
}
