import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetInvoiceSummary = jest.fn().mockResolvedValue({ payees: 3, non_payees: 2 });

jest.mock('@/lib/api', () => ({
  apiClient: { getInvoiceSummary: mockGetInvoiceSummary }
}));

import { apiClient } from '@/lib/api';
import { TotalInvoicesPie } from './TotalInvoicesPie';

test('affiche un graphique', async () => {
  render(<TotalInvoicesPie />);
  await waitFor(() => expect(apiClient.getInvoiceSummary).toHaveBeenCalled());
  const chart = await screen.findByTestId('invoice-pie-chart');
  expect(chart).toBeInTheDocument();
  expect(await screen.findByText(/5 facture/)).toBeInTheDocument();
});
