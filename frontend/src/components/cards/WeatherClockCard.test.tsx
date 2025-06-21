import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WeatherClockCard } from './WeatherClockCard';

global.fetch = jest
  .fn()
  .mockResolvedValueOnce({
    json: () => Promise.resolve({ city: 'Paris', latitude: 1, longitude: 2, timezone: 'Europe/Paris' })
  })
  .mockResolvedValueOnce({
    json: () => Promise.resolve({ datetime: '2024-01-01T12:00:00.000Z' })
  })
  .mockResolvedValueOnce({
    json: () => Promise.resolve({ current_weather: { temperature: 20, weathercode: 0 } })
  });

test('affiche ville et température', async () => {
  render(<WeatherClockCard />);
  await waitFor(() => expect(screen.getByText('Paris')).toBeInTheDocument());
  expect(screen.getByText(/20°C/)).toBeInTheDocument();
});
