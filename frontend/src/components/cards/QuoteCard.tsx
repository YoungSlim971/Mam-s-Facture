import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { API_URL } from '@/lib/api';

interface QuoteState {
  text: string;
  author: string;
}

export function QuoteCard() {
  const [quote, setQuote] = useState<QuoteState | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { text, author } = await fetch(`${API_URL}/quote`).then(r => r.json());
        setQuote({ text, author });
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
          <motion.blockquote
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
            style={{
              fontFamily: '"Playfair Display", "Poppins", serif'
            }}
          >
            <p
              className={
                quote.text.length > 180
                  ? 'text-sm'
                  : quote.text.length > 100
                  ? 'text-base'
                  : 'text-lg'
              }
            >
              “{quote.text}”
            </p>
            <span className="mt-2 block text-sm">— {quote.author}</span>
          </motion.blockquote>
        ) : (
          <Skeleton className="h-20 w-full" />
        )}
      </CardContent>
    </Card>
  );
}

