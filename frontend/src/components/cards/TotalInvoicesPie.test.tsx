import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TotalInvoicesPie } from './TotalInvoicesPie';
import { apiClient } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  apiClient: {
    getInvoiceSummary: jest.fn(),
  },
}));

test('affiche un graphique', async () => {
  (apiClient.getInvoiceSummary as jest.Mock).mockResolvedValue({ payees: 2, non_payees: 1 });

  render(<TotalInvoicesPie />);

  const chart = await screen.findByTestId('invoice-pie-chart');
  expect(chart).toBeInTheDocument();
  expect(await screen.findByText(/3 facture/)).toBeInTheDocument();
});
