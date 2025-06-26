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
    <div
      className="rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6 transition-all duration-300 w-full bg-gradient-to-br from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] text-white dark:from-indigo-900 dark:via-violet-900 dark:to-indigo-950"
    >
      <div className="mb-4">
        <h3 className="font-semibold">Citation du jour</h3>
      </div>
      <div>
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
      </div>
    </div>
  );
}

