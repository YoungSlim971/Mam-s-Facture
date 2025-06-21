import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
jest.mock('@/lib/api', () => ({ API_URL: 'http://localhost:3001/api' }));
import { InvoicePieChart } from './InvoicePieChart';

const fetchMock = jest.fn().mockResolvedValue({
  json: () => Promise.resolve({ paid: 3, unpaid: 2 })
});

global.fetch = fetchMock as any;

test('génère une url de graphique', async () => {
  render(<InvoicePieChart />);
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/invoices?month=current'))
  );
  const img = await screen.findByRole('img');
  expect(img.getAttribute('src')).toMatch('quickchart.io');
});
