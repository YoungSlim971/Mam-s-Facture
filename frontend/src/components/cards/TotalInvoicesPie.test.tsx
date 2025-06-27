import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InvoicesProvider } from '@/context/InvoicesContext';
import { TotalInvoicesPie } from './TotalInvoicesPie';

jest.mock('@/lib/api', () => ({ API_URL: 'http://localhost' }));

test('affiche un graphique', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: () =>
      Promise.resolve({ invoices: [
        { id: 1, status: 'paid' },
        { id: 2, status: 'unpaid' },
        { id: 3, status: 'paid' },
      ] })
  }) as any;

  render(
    <InvoicesProvider>
      <TotalInvoicesPie />
    </InvoicesProvider>
  );

  const chart = await screen.findByTestId('invoice-pie-chart');
  expect(chart).toBeInTheDocument();
  expect(await screen.findByText(/3 facture/)).toBeInTheDocument();
});
