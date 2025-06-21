import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface WeatherState {
  city: string;
  time: string;
  temp: number | null;
  icon: string;
}

const codeIcon: Record<number, string> = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌦️',
  55: '🌦️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  71: '❄️',
  73: '❄️',
  75: '❄️',
  80: '🌧️',
  81: '🌧️',
  82: '🌧️',
  95: '⛈️',
  96: '⚡',
  99: '⚡',
};

function iconFor(code: number | undefined) {
  return code !== undefined ? codeIcon[code] || '☀️' : '☀️';
}

export function WeatherClockCard() {
  const [state, setState] = useState<WeatherState>({
    city: '',
    time: '',
    temp: null,
    icon: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    async function load() {
      try {
        const loc = await fetch('https://ipwho.is').then((r) => r.json());
        const { city, latitude, longitude, timezone } = loc;
        const timeData = await fetch(`https://worldtimeapi.org/api/timezone/${timezone}`).then((r) => r.json());
        const weather = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
        ).then((r) => r.json());

        setState({
          city,
          time: timeData.datetime,
          temp: weather.current_weather?.temperature ?? null,
          icon: iconFor(weather.current_weather?.weathercode),
        });
        setLoading(false);

        timer = setInterval(async () => {
          const t = await fetch(`https://worldtimeapi.org/api/timezone/${timezone}`).then((r) => r.json());
          setState((s) => ({ ...s, time: t.datetime }));
        }, 300000);
      } catch {
        setLoading(false);
      }
    }
    load();
    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  const timeStr = state.time
    ? new Date(state.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Météo et heure</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-lg font-medium">{state.city}</div>
            <div className="text-4xl">{timeStr}</div>
            {state.temp !== null && (
              <div className="text-lg">
                {state.icon} {state.temp}°C
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
