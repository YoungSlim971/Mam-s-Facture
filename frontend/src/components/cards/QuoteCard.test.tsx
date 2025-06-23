import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuoteCard } from './QuoteCard';

// Mock the api module
jest.mock('@/lib/api', () => ({
  API_URL: 'http://localhost:3000/api/mock', // Provide a mock API_URL
  GEMINI_API_KEY: 'mock-gemini-key', // Provide a mock GEMINI_API_KEY
}));

global.fetch = jest.fn().mockResolvedValueOnce({
  json: () => Promise.resolve({ text: 'bonjour', author: 'me' })
});

test('affiche la citation', async () => {
  render(<QuoteCard />);
  await waitFor(() => expect(screen.getByText(/bonjour/)).toBeInTheDocument());
  expect(screen.getByText(/me/)).toBeInTheDocument();
});

