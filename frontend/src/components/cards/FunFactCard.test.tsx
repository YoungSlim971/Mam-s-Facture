import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FunFactCard } from './FunFactCard';

global.fetch = jest.fn(() =>
  Promise.resolve({ json: () => Promise.resolve({ text: 'test fact' }) })
) as jest.Mock;

test('affiche le fun fact retourné', async () => {
  render(<FunFactCard />);
  await waitFor(() => expect(screen.getByText('test fact')).toBeInTheDocument());
});
