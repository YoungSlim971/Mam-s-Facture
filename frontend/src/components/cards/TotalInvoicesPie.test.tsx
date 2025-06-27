import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
jest.mock('@/lib/api', () => ({ API_URL: 'http://localhost:3001/api' }));
import { TotalInvoicesPie } from './TotalInvoicesPie';

const fetchMock = jest.fn().mockResolvedValue({
  json: () => Promise.resolve({ payees: 3, non_payees: 2 })
});

global.fetch = fetchMock as any;

test('affiche un graphique', async () => {
  render(<TotalInvoicesPie />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/invoices/summary'));
  const chart = await screen.findByTestId('invoice-pie-chart');
  expect(chart).toBeInTheDocument();
  expect(await screen.findByText(/5 facture/)).toBeInTheDocument();
});
