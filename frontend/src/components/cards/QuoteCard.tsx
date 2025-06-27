import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { API_URL } from '@/lib/api';

interface QuoteState {
  text: string;
  author: string;
}

const DEFAULT_QUOTES: QuoteState[] = [
  {
    text: "La vie est un mystère qu'il faut vivre, et non un problème à résoudre.",
    author: 'Gandhi'
  }
];

export function QuoteCard() {
  const [quote, setQuote] = useState<QuoteState | null>(null);

  useEffect(() => {
    const todayKey = new Date().toDateString();

    const fetchQuote = async () => {
      try {
        const { text, author } = await fetch(`${API_URL}/quote`).then(r => r.json());
        const q = { text, author };
        setQuote(q);
        localStorage.setItem('dailyQuote', JSON.stringify(q));
        localStorage.setItem('dailyQuoteDate', todayKey);
      } catch {
        const fallback = DEFAULT_QUOTES[0];
        setQuote(fallback);
        localStorage.setItem('dailyQuote', JSON.stringify(fallback));
        localStorage.setItem('dailyQuoteDate', todayKey);
      }
    };

    const cached = localStorage.getItem('dailyQuote');
    const cachedDate = localStorage.getItem('dailyQuoteDate');
    if (cached && cachedDate === todayKey) {
      setQuote(JSON.parse(cached));
    } else {
      fetchQuote();
    }

    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(fetchQuote, next.getTime() - now.getTime());
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6 transition-all duration-300 w-full bg-gradient-to-br from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] text-white dark:from-indigo-900 dark:via-violet-900 dark:to-indigo-950 hover:-translate-y-1 hover:shadow-lg"
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

