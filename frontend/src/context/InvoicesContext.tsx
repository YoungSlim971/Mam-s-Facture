import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { API_URL } from '@/lib/api';

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
  refresh: () => Promise<void>;
}

const InvoicesContext = createContext<InvoicesContextValue | undefined>(undefined);

export function InvoicesProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);

  const fetchInvoices = useCallback(async () => {
    if (fetched.current) return;
    fetched.current = true;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/invoices`);
      if (!res.ok) throw new Error('Erreur lors du chargement des factures');
      const data = await res.json();
      setInvoices(data.invoices || data);
    } catch (e: any) {
      setError(e.message || 'Erreur inconnue');
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
    refresh,
  };

  return <InvoicesContext.Provider value={value}>{children}</InvoicesContext.Provider>;
}

export function useInvoices() {
  const ctx = useContext(InvoicesContext);
  if (!ctx) throw new Error('useInvoices must be used within an InvoicesProvider');
  return ctx;
}
