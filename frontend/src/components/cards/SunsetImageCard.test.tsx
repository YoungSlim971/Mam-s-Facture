 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/frontend/src/components/cards/SunsetImageCard.test.tsx b/frontend/src/components/cards/SunsetImageCard.test.tsx
index 934ba6de384a26a3e209e23cef10091b1619dbf5..fd14a97a3a1abc1253f56c7d574a8bd4d56037ca 100644
--- a/frontend/src/components/cards/SunsetImageCard.test.tsx
+++ b/frontend/src/components/cards/SunsetImageCard.test.tsx
@@ -1,16 +1,10 @@
-import { render, screen, waitFor } from '@testing-library/react';
+import { render, screen } from '@testing-library/react';
 import '@testing-library/jest-dom';
 import { SunsetImageCard } from './SunsetImageCard';
 
-global.fetch = jest.fn(() =>
-  Promise.resolve({
-    json: () => Promise.resolve({ output_url: 'https://example.com/img.png' })
-  })
-) as jest.Mock;
-
-test('affiche une image', async () => {
+test('affiche une image locale', async () => {
   render(<SunsetImageCard />);
   const img = (await screen.findByRole('img')) as HTMLImageElement;
-  expect(img.src).toBe('https://example.com/img.png');
+  expect(img.src).toMatch(/\/images\/pic[123]\.jpg$/);
 });
 
 
EOF
)
