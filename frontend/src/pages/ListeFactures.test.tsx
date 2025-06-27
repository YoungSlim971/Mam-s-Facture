import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ListeFactures from './ListeFactures';
import { useInvoices } from '@/context/InvoicesContext';

const mockUseInvoices = jest.fn();
jest.mock('@/context/InvoicesContext', () => {
  const actual = jest.requireActual('@/context/InvoicesContext');
  return {
    ...actual,
    useInvoices: (...args: any[]) => mockUseInvoices(...args),
    InvoicesProvider: ({ children }: any) => <div>{children}</div>,
  };
});

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

beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as any) = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

const factureBase = {
  id: 1,
  numero_facture: 'F001',
  nom_client: 'Test',
  nom_entreprise: 'ACME',
  client_id: 1,
  date_facture: '2024-01-01',
  date_facture_fr: '01/01/2024',
  montant_total: 10,
  montant_total_fr: '10€',
  nombre_lignes: 1,
  status: 'unpaid'
};


test('marque une facture comme payée', async () => {
  mockGetInvoices.mockResolvedValueOnce([factureBase]);
  mockGetClients.mockResolvedValueOnce([]);
  mockUseInvoices.mockReturnValue({
    invoices: [factureBase],
    isLoading: false,
    error: null,
    total: 1,
    payees: 0,
    nonPayees: 1,
    usingDemoData: false,
    refresh: jest.fn(),
  });
  render(
    <BrowserRouter>
      <ListeFactures />
    </BrowserRouter>
  );

  const btn = await screen.findByTitle('Marquer comme payée');
  fireEvent.click(btn);

  await waitFor(() =>
    expect(fetch as any).toHaveBeenCalledWith(
      expect.stringContaining('/factures/1/status'),
      expect.objectContaining({ method: 'PATCH' })
    )
  );
});

test('affiche le nom du client associé', async () => {
  mockGetInvoices.mockResolvedValueOnce([factureBase]);
  mockGetClients.mockResolvedValueOnce([
    { id: 1, nom_client: 'Test', nom_entreprise: 'ACME' },
  ]);

  mockUseInvoices.mockReturnValue({
    invoices: [factureBase],
    isLoading: false,
    error: null,
    total: 1,
    payees: 0,
    nonPayees: 1,
    usingDemoData: false,
    refresh: jest.fn(),
  });
  render(
    <BrowserRouter>
      <ListeFactures />
    </BrowserRouter>
  );

  expect(await screen.findByText('ACME')).toBeInTheDocument();
});
