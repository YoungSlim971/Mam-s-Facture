import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GEMINI_API_KEY } from '@/lib/api';

export function SunsetImageCard() {
  const [img, setImg] = useState('');

  useEffect(() => {
    async function load() {
      if (!GEMINI_API_KEY) return;
      try {
        const prompt = 'Ultra-wide photograph of a breathtaking sunset over the ocean horizon, vivid orange and pink clouds, atmospheric, 4K';
        const genBody = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE'] }
        };
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(genBody)
          }
        ).then(r => r.json());
        const data = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (data) setImg(`data:image/png;base64,${data}`);
      } catch {
        setImg('');
      }
    }
    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coucher de soleil</CardTitle>
      </CardHeader>
      <CardContent>
        {img ? <img src={img} alt="Coucher de soleil" /> : <Skeleton className="h-40 w-full" />}
      </CardContent>
    </Card>
  );
}

