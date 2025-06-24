import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ListeFactures from './ListeFactures';

// Mock the api module
jest.mock('@/lib/api', () => ({
  API_URL: 'http://localhost:3000/api/mock', // Provide a mock API_URL
  GEMINI_API_KEY: 'mock-gemini-key', // Provide a mock GEMINI_API_KEY
}));

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

global.fetch = jest
  .fn()
  .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(facturesResponse) })
  .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 1, status: 'paid' }) });

test('marque une facture comme payée', async () => {
  render(
    <BrowserRouter>
      <ListeFactures />
    </BrowserRouter>
  );
  await waitFor(() => expect(fetch as any).toHaveBeenCalled());

  const btn = await screen.findByTitle('Marquer comme payée');
  fireEvent.click(btn);

  await waitFor(() =>
    expect(fetch as any).toHaveBeenCalledWith(
      expect.stringContaining('/factures/1'),
      expect.objectContaining({ method: 'PATCH' })
    )
  );
});
