import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SunsetImageCard } from './SunsetImageCard';

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ output_url: 'https://example.com/img.png' })
  })
) as jest.Mock;

test('affiche une image', async () => {
  render(<SunsetImageCard />);
  const img = (await screen.findByRole('img')) as HTMLImageElement;
  expect(img.src).toBe('https://example.com/img.png');
});

