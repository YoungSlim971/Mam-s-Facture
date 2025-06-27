import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
    // choose a fresh image every time the component mounts
    setImg(getRandomImage());
  }, []);

  return (
    <div
      className="rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6 transition-all duration-300 w-full animate-fade-in bg-gradient-to-br from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] text-white dark:from-indigo-900 dark:via-violet-900 dark:to-indigo-950 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="mb-4">
        <h3 className="font-semibold">Coucher de soleil</h3>
      </div>
      <div>
        {img ? (
          <motion.img
            key={img}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            src={img}
            alt="Coucher de soleil"
            className="w-full"
          />
        ) : (
          <Skeleton className="h-40 w-full" />
        )}
      </div>
    </div>
  );
}
