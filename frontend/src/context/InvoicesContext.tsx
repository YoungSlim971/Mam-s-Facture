import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';

export interface Invoice {
  id: number;
  status?: 'paid' | 'unpaid';
  [key: string]: any;
}

interface InvoicesContextValue {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  total: number;
  payees: number;
  nonPayees: number;
  usingDemoData: boolean;
  refresh: () => Promise<void>;
}

const InvoicesContext = createContext<InvoicesContextValue | undefined>(undefined);

export function InvoicesProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingDemo, setUsingDemo] = useState(false);
  const fetched = useRef(false);

  const fetchInvoices = useCallback(async () => {
    if (fetched.current) return;
    fetched.current = true;
    setIsLoading(true);
    try {
      const data = await apiClient.getInvoices();
      setInvoices(data);
      setUsingDemo(false);
    } catch (e: any) {
      console.error('Erreur chargement factures:', e);
      setError(e.message || 'Erreur inconnue');
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        try {
          const res = await fetch('/demo/invoices.json');
          const demo = await res.json();
          setInvoices(demo);
          setUsingDemo(true);
          setError(null);
        } catch (err) {
          console.error('Erreur chargement des données de démo:', err);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    fetched.current = false;
    await fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const payees = invoices.filter(i => i.status === 'paid').length;
  const total = invoices.length;
  const nonPayees = total - payees;

  const value: InvoicesContextValue = {
    invoices,
    isLoading,
    error,
    total,
    payees,
    nonPayees,
    usingDemoData: usingDemo,
    refresh,
  };

  return <InvoicesContext.Provider value={value}>{children}</InvoicesContext.Provider>;
}

export function useInvoices() {
  const ctx = useContext(InvoicesContext);
  if (!ctx) throw new Error('useInvoices must be used within an InvoicesProvider');
  return ctx;
}
