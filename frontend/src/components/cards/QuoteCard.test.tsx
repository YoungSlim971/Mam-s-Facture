import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuoteCard } from './QuoteCard';

// Mock the api module
jest.mock('@/lib/api', () => ({
  API_URL: 'http://localhost:3000/api/mock',
  GEMINI_API_KEY: 'mock-gemini-key',
}));

test('affiche la citation', async () => {
  const fetchMock = jest.fn().mockResolvedValue({
    json: () => Promise.resolve({ text: 'bonjour', author: 'me' })
  });
  (global as any).fetch = fetchMock;
  localStorage.clear();
  render(<QuoteCard />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  expect(await screen.findByText(/bonjour/)).toBeInTheDocument();
  expect(screen.getByText(/me/)).toBeInTheDocument();
});



