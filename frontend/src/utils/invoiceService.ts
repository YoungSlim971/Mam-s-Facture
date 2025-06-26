import { API_URL } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

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
  window.dispatchEvent(new Event('factureChange'));
}

export async function updateInvoiceStatus(
  id: number,
  newStatus: 'paid' | 'unpaid' // Changed type to match example and backend expectation
): Promise<InvoiceType> {
  const res = await fetch(`${API_URL}/factures/${id}/status`, { // Corrected URL
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: newStatus }), // Use newStatus directly
  });

  if (!res.ok) {
    // Attempt to get error message from backend response
    let errorMessage = 'Erreur lors de la mise à jour du statut';
    try {
      const errorData = await res.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      // Ignore if response is not JSON or other error
    }
    toast({
      title: "Erreur de mise à jour",
      description: errorMessage,
      variant: "destructive",
    });
    throw new Error(errorMessage);
  }

  const updatedInvoice = (await res.json()) as InvoiceType;

  // Affiche une confirmation
  toast({
    title: "Statut mis à jour",
    description: `Le statut de la facture #${updatedInvoice.numero_facture} est maintenant ${newStatus === 'paid' ? 'payée' : 'non payée'}.`,
  });

  // Déclenche l’événement global
  window.dispatchEvent(new CustomEvent('factureStatutChange', {
    detail: updatedInvoice,
  }));
  window.dispatchEvent(new Event('factureChange'));

  return updatedInvoice;
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
