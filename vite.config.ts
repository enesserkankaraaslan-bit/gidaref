/// <reference types="vitest" />
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const paket = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };
const git = (komut: string) => { try { return execSync('git ' + komut, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; } };

/** public/_headers'taki CSP; `vite preview` aynı kuralla çalışsın diye (yayındaki koşulu yerelde test etmek için). */
const CSP = /Content-Security-Policy:\s*(.+)/.exec(readFileSync(new URL('./public/_headers', import.meta.url), 'utf8'))![1].trim();

/** Önizleme: arama motorlarına kapalı (noindex + robots.txt). VITE_ONIZLEME=0 ile herkese açık derlenir. */
function yayinAyari(onizleme: boolean): Plugin {
  return {
    name: 'gidaref-yayin',
    transformIndexHtml: html => onizleme ? html.replace('</title>', '</title>\n<meta name="robots" content="noindex, nofollow">') : html,
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: onizleme ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\n' });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const onizleme = (process.env.VITE_ONIZLEME ?? env.VITE_ONIZLEME) !== '0';
  return {
    define: {
      __SURUM__: JSON.stringify(paket.version),
      // Cloudflare Pages derlemesinde CF_PAGES_COMMIT_SHA hazır gelir; yerelde git'ten okunur.
      __COMMIT__: JSON.stringify((process.env.CF_PAGES_COMMIT_SHA || git('rev-parse HEAD')).slice(0, 7)),
      __VERI_TARIHI__: JSON.stringify(git('log -1 --format=%cs -- data/ek1/gidaref_kayitlar_v2.json'))
    },
    plugins: [
      yayinAyari(onizleme),
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
            { src: 'simge-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: 'simge.svg', sizes: 'any', type: 'image/svg+xml' }
          ]
        },
        workbox: {
          // Sayfa görüntüleri ve yazı tipleri de çevrimdışı açılabilsin diye önbelleğe alınır.
          globPatterns: ['**/*.{js,mjs,css,html,svg,png,jpg,woff2}'],
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
    preview: { headers: { 'Content-Security-Policy': CSP } },
    // pdfjs-dist 4.x üst düzey await kullanır.
    build: { target: 'es2022' },
    optimizeDeps: { esbuildOptions: { target: 'es2022' } },
    test: {
      include: ['tests/unit/**/*.test.ts'],
      environment: 'node'
    }
  };
});
