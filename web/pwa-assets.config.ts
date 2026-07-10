import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Generates the PWA icon set (pwa-64x64, pwa-192x192, pwa-512x512,
// maskable-icon-512x512, apple-touch-icon-180x180 + favicon) from the single
// 512x512 source icon (public/icon.png).
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: minimal2023Preset,
  images: ['public/icon.png'],
});
