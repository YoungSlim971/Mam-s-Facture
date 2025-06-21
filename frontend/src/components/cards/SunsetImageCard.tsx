import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';


export function SunsetImageCard() {
  const [img, setImg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const form = new FormData();
        form.append('text', 'a tropical sunset beach');
        const res = await fetch('https://api.deepai.org/api/text2img', {
          method: 'POST',
          headers: { 'api-key': '7a75e7bb-621d-440a-bf46-6ac29b0c1ce0' },
          body: form
        }).then(r => r.json());
        const url = res.output_url;
        if (url) setImg(url);
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

