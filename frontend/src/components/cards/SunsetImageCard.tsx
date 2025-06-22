 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/frontend/src/components/cards/SunsetImageCard.tsx b/frontend/src/components/cards/SunsetImageCard.tsx
index e0357faf6fcebdfaa3c8223d7070c7c75ccd5c1b..b3679e5994229a1a6cb4cac440921ffdea9e8a26 100644
--- a/frontend/src/components/cards/SunsetImageCard.tsx
+++ b/frontend/src/components/cards/SunsetImageCard.tsx
@@ -1,39 +1,29 @@
 import { useEffect, useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Skeleton } from '@/components/ui/skeleton';
 
+function getRandomImage() {
+  const images = ['/images/pic1.jpg', '/images/pic2.jpg', '/images/pic3.jpg'];
+  return images[Math.floor(Math.random() * images.length)];
+}
+
 
 export function SunsetImageCard() {
   const [img, setImg] = useState('');
 
   useEffect(() => {
-    async function load() {
-      try {
-        const form = new FormData();
-        form.append('text', 'a tropical sunset beach');
-        const res = await fetch('https://api.deepai.org/api/text2img', {
-          method: 'POST',
-          headers: { 'api-key': '7a75e7bb-621d-440a-bf46-6ac29b0c1ce0' },
-          body: form
-        }).then(r => r.json());
-        const url = res.output_url;
-        if (url) setImg(url);
-      } catch {
-        setImg('');
-      }
-    }
-    load();
+    setImg(getRandomImage());
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
 
 
EOF
)
