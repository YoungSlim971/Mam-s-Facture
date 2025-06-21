import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { API_URL } from '@/lib/api';

interface Health {
  status: string;
  message: string;
  timestamp: string;
}

export function ApiInfoCard() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const key = 'api-health-cache';
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { data: Health; ts: number };
        if (Date.now() - parsed.ts < 5 * 60 * 1000) {
          setHealth(parsed.data);
          return;
        }
      } catch {
        /* ignore */
      }
    }
    fetch(`${API_URL}/health`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Health) => {
        setHealth(d);
        localStorage.setItem(key, JSON.stringify({ data: d, ts: Date.now() }));
      })
      .catch(() => setError(true));
  }, []);

  const endpoints = [
    'GET /api/factures',
    'GET /api/factures/:id',
    'POST /api/factures',
    'PUT /api/factures/:id',
    'DELETE /api/factures/:id',
    'GET /api/clients',
    'POST /api/clients',
    'GET /api/clients/:id',
    'GET /api/health',
    'GET /api/stats',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>API</CardTitle>
      </CardHeader>
      <CardContent>
        {health && !error ? (
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">{health.message}</span>
            </div>
            <ul className="list-disc ml-4">
              {endpoints.map((e) => (
                <li key={e} className="font-mono">
                  {e}
                </li>
              ))}
            </ul>
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm">Impossible de contacter l'API</div>
        ) : (
          <Skeleton className="h-20 w-full" />
        )}
      </CardContent>
    </Card>
  );
}

