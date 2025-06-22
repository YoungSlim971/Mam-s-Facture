import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function getRandomImage() {
  const images = ['/images/pic1.jpg', '/images/pic2.jpg', '/images/pic3.jpg'];
  return images[Math.floor(Math.random() * images.length)];
}

export function SunsetImageCard() {
  const [img, setImg] = useState('');

  useEffect(() => {
    setImg(getRandomImage());
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
