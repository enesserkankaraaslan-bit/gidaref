/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['simge.svg', 'simge-192.png', 'simge-512.png'],
      manifest: {
        name: 'GıdaRef – gıda mühendisi için mevzuat başucu',
        short_name: 'GıdaRef',
        description: 'Bulaşanlar Yönetmeliği Ek-1’in tüm satırlarında ürün ve bulaşan araması.',
        lang: 'tr',
        start_url: '.',
        display: 'standalone',
        background_color: '#F1F4F0',
        theme_color: '#0F6B5C',
        icons: [
          { src: 'simge-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'simge-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'simge.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        // Sayfa görüntüleri de çevrimdışı açılabilsin diye önbelleğe alınır.
        globPatterns: ['**/*.{js,mjs,css,html,svg,png,jpg}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // PDF'ler (3,3 MB) kurulumda indirilmez; ilk açılışta önbelleğe girer.
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.endsWith('.pdf'),
          handler: 'CacheFirst',
          options: { cacheName: 'resmi-pdf', expiration: { maxEntries: 10 }, rangeRequests: true, cacheableResponse: { statuses: [200] } }
        }]
      }
    })
  ],
  // pdfjs-dist 4.x üst düzey await kullanır.
  build: { target: 'es2022' },
  optimizeDeps: { esbuildOptions: { target: 'es2022' } },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node'
  }
});
