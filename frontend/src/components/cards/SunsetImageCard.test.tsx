import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SunsetImageCard } from './SunsetImageCard';

test('affiche une image locale', async () => {
  render(<SunsetImageCard />);
  const img = (await screen.findByRole('img')) as HTMLImageElement;
  expect(img.src).toMatch(/\/images\/pic[123]\.jpg$/);
});
