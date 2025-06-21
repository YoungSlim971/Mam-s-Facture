import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function FunFactCard() {
  const [fact, setFact] = useState<string | null>(null);

  useEffect(() => {
    const key = 'funfact-cache';
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { text: string; ts: number };
        if (Date.now() - parsed.ts < 24 * 60 * 60 * 1000) {
          setFact(parsed.text);
          return;
        }
      } catch {
        // ignore parse errors
      }
    }
    fetch('https://uselessfacts.jsph.pl/api/v2/facts/today?language=fr')
      .then((r) => r.json())
      .then((d) => {
        setFact(d.text);
        localStorage.setItem(key, JSON.stringify({ text: d.text, ts: Date.now() }));
      })
      .catch(() => setFact(''));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fun Fact du jour</CardTitle>
      </CardHeader>
      <CardContent>{fact ? <p>{fact}</p> : <Skeleton className="h-6 w-full" />}</CardContent>
    </Card>
  );
}
