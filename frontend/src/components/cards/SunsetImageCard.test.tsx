import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SunsetImageCard } from './SunsetImageCard';

jest.mock('@/lib/api', () => ({ GEMINI_API_KEY: 'key' }));

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      candidates: [{ content: { parts: [{ inlineData: { data: 'imgdata' } }] } }]
    })
  })
) as jest.Mock;

test('affiche une image', async () => {
  render(<SunsetImageCard />);
  const img = (await screen.findByRole('img')) as HTMLImageElement;
  expect(img.src).toContain('data:image/png;base64,imgdata');
});

