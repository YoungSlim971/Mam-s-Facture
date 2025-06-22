import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function getRandomImage() {
  const images = [
    '/images/u2399212684_a_tropical_natur_wallpaper_--chaos_50_--ar_43_--s_999f6183-9521-48de-9503-ef52ed93ee12_1.jpg',
    '/images/u2399212684_a_tropical_natur_wallpaper_--chaos_50_--ar_43_--s_999f6183-9521-48de-9503-ef52ed93ee12_2.jpg',
    '/images/u2399212684_a_tropical_natur_wallpaper_--chaos_50_--ar_43_--s_999f6183-9521-48de-9503-ef52ed93ee12_3.jpg',
    '/images/u2399212684_a_tropical_sunset_on_the_beach_sreff_random_--cha_23f97154-03a9-47ce-9d76-26d30d3703cd_1.jpg',
    '/images/u2399212684_a_tropical_sunset_on_the_beach_sreff_random_--cha_23f97154-03a9-47ce-9d76-26d30d3703cd_2.jpg'
  ];
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
