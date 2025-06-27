import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
jest.mock('@/lib/api', () => ({ API_URL: 'http://localhost:3001/api' }));
import { InvoicePieChart } from './InvoicePieChart';

const fetchMock = jest.fn().mockResolvedValue({
  json: () => Promise.resolve({ total: 5, paid: 3, unpaid: 2 })
});

global.fetch = fetchMock as any;

test('affiche un graphique', async () => {
  render(<InvoicePieChart />);
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/invoices/stats?month=')
    )
  );
  const chart = await screen.findByTestId('invoice-pie-chart');
  expect(chart).toBeInTheDocument();
  expect(await screen.findByText(/5 facture/)).toBeInTheDocument();
});
