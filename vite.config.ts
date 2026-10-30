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
        globPatterns: ['**/*.{js,css,html,svg,png,jpg}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
      }
    })
  ],
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node'
  }
});
