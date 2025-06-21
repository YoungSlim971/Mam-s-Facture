import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface QuoteState {
  text: string;
  author: string;
}

export function QuoteCard() {
  const [quote, setQuote] = useState<QuoteState | null>(null);

  useEffect(() => {
    const key = 'quote-cache';
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { data: QuoteState; ts: number };
        if (Date.now() - parsed.ts < 24 * 60 * 60 * 1000) {
          setQuote(parsed.data);
          return;
        }
      } catch {
        /* ignore */
      }
    }

    async function load() {
      try {
        const [{ q, a }] = await fetch('https://zenquotes.io/api/random').then(r => r.json());
        const body = { q, source: 'en', target: 'fr', format: 'text' };
        const { translatedText } = await fetch('https://libretranslate.de/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }).then(r => r.json());
        const data = { text: translatedText, author: a };
        setQuote(data);
        localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
      } catch {
        setQuote({ text: '', author: '' });
      }
    }
    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Citation du jour</CardTitle>
      </CardHeader>
      <CardContent>
        {quote ? (
          <blockquote>
            “{quote.text}”<br />
            <span className="text-sm">— {quote.author}</span>
          </blockquote>
        ) : (
          <Skeleton className="h-20 w-full" />
        )}
      </CardContent>
    </Card>
  );
}

