import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuoteCard } from './QuoteCard';

global.fetch = jest.fn().mockResolvedValueOnce({
  json: () => Promise.resolve({ text: 'bonjour', author: 'me' })
});

test('affiche la citation', async () => {
  render(<QuoteCard />);
  await waitFor(() => expect(screen.getByText(/bonjour/)).toBeInTheDocument());
  expect(screen.getByText(/me/)).toBeInTheDocument();
});

