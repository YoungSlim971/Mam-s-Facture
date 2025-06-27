import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ListeFactures from './ListeFactures';
import { InvoicesProvider } from '@/context/InvoicesContext';

// Mock the api module
const mockGetInvoices = jest.fn();
const mockGetClients = jest.fn();
jest.mock('@/lib/api', () => {
  return {
    API_URL: 'http://localhost:3000/api/mock',
    GEMINI_API_KEY: 'mock-gemini-key',
    apiClient: {
      getInvoices: (...args: any[]) => mockGetInvoices(...args),
      getClients: (...args: any[]) => mockGetClients(...args),
      getInvoiceSummary: jest.fn(),
    },
  };
});

const facturesResponse = {
  factures: [
    {
      id: 1,
      numero_facture: 'F001',
      nom_client: 'Test',
      date_facture: '2024-01-01',
      date_facture_fr: '01/01/2024',
      montant_total: 10,
      montant_total_fr: '10€',
      nombre_lignes: 1,
      status: 'unpaid'
    }
  ],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
};

mockGetInvoices.mockResolvedValue(facturesResponse.factures);
mockGetClients.mockResolvedValue([]);

global.fetch = jest
  .fn()
  .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 1, status: 'paid' }) });

test('marque une facture comme payée', async () => {
  render(
    <InvoicesProvider>
      <BrowserRouter>
        <ListeFactures />
      </BrowserRouter>
    </InvoicesProvider>
  );
  await waitFor(() => expect(mockGetInvoices).toHaveBeenCalled());

  const btn = await screen.findByTitle('Marquer comme payée');
  fireEvent.click(btn);

  await waitFor(() =>
    expect(fetch as any).toHaveBeenCalledWith(
      expect.stringContaining('/factures/1/status'),
      expect.objectContaining({ method: 'PATCH' })
    )
  );
});
