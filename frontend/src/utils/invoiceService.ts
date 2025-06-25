import { API_URL } from '@/lib/api';

export interface InvoiceType {
  id: number;
  numero_facture: string;
  nom_client: string;
  nom_entreprise?: string;
  status?: 'paid' | 'unpaid';
  [key: string]: any;
}

const LOCAL_KEY = 'invoicesCache';

export async function fetchInvoices(): Promise<InvoiceType[]> {
  const res = await fetch(`${API_URL}/factures`);
  if (!res.ok) throw new Error('Failed to fetch invoices');
  const data = await res.json();
  const invoices: InvoiceType[] = data.factures || data;
  cacheInvoicesLocally(invoices);
  return invoices;
}

export async function fetchInvoiceById(id: number): Promise<InvoiceType> {
  const res = await fetch(`${API_URL}/factures/${id}`);
  if (!res.ok) throw new Error('Failed to fetch invoice');
  const invoice = await res.json();
  return invoice as InvoiceType;
}

export async function updateInvoice(id: number, data: Partial<InvoiceType>): Promise<void> {
  await fetch(`${API_URL}/factures/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateInvoiceStatus(
  id: number,
  status: 'payée' | 'non payée'
): Promise<InvoiceType> {
  const res = await fetch(`${API_URL}/factures/${id}/update`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: status === 'payée' ? 'paid' : 'unpaid' }),
  });
  if (!res.ok) {
    throw new Error('Failed to update invoice status');
  }
  return (await res.json()) as InvoiceType;
}

export function cacheInvoicesLocally(invoices: InvoiceType[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(invoices));
    }
  } catch {
    /* ignore */
  }
}

export function getInvoiceFromLocal(id: number): InvoiceType | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    if (!stored) return null;
    const invoices: InvoiceType[] = JSON.parse(stored);
    return invoices.find((f) => f.id === id) || null;
  } catch {
    return null;
  }
}
