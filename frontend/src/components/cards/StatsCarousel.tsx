import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoicePieChart } from './InvoicePieChart';
import { API_URL } from '@/lib/api';

interface Facture {
  montant_total: number;
}

export function StatsCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);
  const [pieStats, setPieStats] = useState({ total: 0, paid: 0, unpaid: 0 });
  const [unpaid, setUnpaid] = useState<Facture[]>([]);

  const euro = useMemo(
    () =>
      new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }),
    []
  );

  useEffect(() => {
    async function loadPie() {
      try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const r = await fetch(
          `${API_URL}/invoices/stats?month=${month}&year=${year}`
        );
        if (r.ok) {
          const d = await r.json();
          console.log('📥 Stats data:', d);
          setPieStats(d);
        }
      } catch {
        /* ignore */
      }
    }
    async function loadUnpaid() {
      try {
        const r = await fetch(`${API_URL}/factures?status=unpaid&limit=1000`);
        if (r.ok) {
          const d = await r.json();
          setUnpaid(d.factures || []);
        }
      } catch {
        /* ignore */
      }
    }
    loadPie();
    loadUnpaid();
    const handler = () => {
      loadPie();
      loadUnpaid();
    };
    window.addEventListener('factureChange', handler);
    window.addEventListener('factureStatutChange', handler);
    return () => {
      window.removeEventListener('factureChange', handler);
      window.removeEventListener('factureStatutChange', handler);
    };
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    api.on('select', onSelect);
    onSelect();
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  const unpaidTotal = useMemo(
    () => unpaid.reduce((sum, f) => sum + (f.montant_total || 0), 0),
    [unpaid]
  );

  const invoicesThisMonth = pieStats.total;

  return (
    <div className="rounded-xl shadow-md bg-white dark:bg-gray-800 p-6 transition-all duration-300 w-full">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          <CarouselItem>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: index === 0 ? 1 : 0, y: index === 0 ? 0 : 10 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Link to="/factures?status=unpaid" className="block">
                <InvoicePieChart />
              </Link>
            </motion.div>
          </CarouselItem>
          <CarouselItem>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: index === 1 ? 1 : 0, y: index === 1 ? 0 : 10 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Paiements en attente</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-3xl font-bold">
                    {euro.format(unpaidTotal)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </CarouselItem>
          <CarouselItem>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: index === 2 ? 1 : 0, y: index === 2 ? 0 : 10 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Factures générées ce mois-ci</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-3xl font-bold">{invoicesThisMonth}</p>
                </CardContent>
              </Card>
            </motion.div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious className="-left-4" />
        <CarouselNext className="-right-4" />
      </Carousel>
      <div className="flex justify-center mt-2 space-x-2">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${
              i === index
                ? 'bg-indigo-600'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
