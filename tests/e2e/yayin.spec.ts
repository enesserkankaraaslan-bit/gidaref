/* Yayına hazırlık: CSP, dış istek yokluğu, önizleme ayarı, sürüm bilgisi ve çevrimdışı çalışma. */
import { spawn } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';

/** Sayfa yüklenmeden CSP ihlallerini toplayan dinleyici */
async function cspDinle(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener('securitypolicyviolation', e => (window as unknown as { __csp: string[] }).__csp.push(e.violatedDirective + ' ' + e.blockedURI));
  });
}
const cspIhlalleri = (page: Page) => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);

test('CSP altında arama, sayfa görüntüsü, PDF ve kontrol modu ihlalsiz çalışır; dış istek yok', async ({ page }) => {
  await cspDinle(page);
  const dis: string[] = [];
  page.on('request', r => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1'].includes(u.hostname) && !u.protocol.startsWith('data') && !u.protocol.startsWith('blob')) dis.push(r.url()); });
  const yanit = await page.goto('/');
  expect(yanit!.headers()['content-security-policy']).toContain("script-src 'self'");

  await page.locator('#q').fill('fındık');
  await expect(page.locator('#sonuclar')).toContainText('Doğrudan: Fındık');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('16px "IBM Plex Sans"') && document.fonts.check('700 16px "Source Serif 4"'))).toBe(true);
  expect(await cspIhlalleri(page)).toEqual([]);

  await page.goto('/#talimat-9');
  await page.locator('#gPdf').click();
  await expect(page.locator('#pSayfa')).toHaveAttribute('data-sayfa', '9', { timeout: 20_000 });
  expect(await cspIhlalleri(page)).toEqual([]);

  await page.goto('/#kontrol');
  await expect(page.locator('#kSayac')).toContainText('Eşleşti');
  expect(await cspIhlalleri(page)).toEqual([]);
  expect(dis).toEqual([]);
});

test('önizleme derlemesi: şerit, noindex, robots.txt; sürüm bilgisi', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('#onizleme')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
  await expect(page.locator('#surumBilgi')).toHaveText(/^Sürüm \d+\.\d+\.\d+ · [0-9a-f]{7} · veri \d{2}\.\d{2}\.\d{4}$/);
  await expect(page.locator('#kontrolBaglanti')).toBeVisible();
});

/* Çevrimdışı: Playwright'ın setOffline'ı service worker isteklerini kesmiyor; bu yüzden test kendi sunucusunu
 * başlatır, önbelleği ısıtır ve sunucuyu tamamen kapatır (gerçek "ağ yok" durumu). dist/ webServer adımında derlenir. */
test('çevrimdışı (sunucu kapalı): arama, sayfa görüntüsü ve daha önce açılmış PDF çalışır', async ({ page }) => {
  const PORT = 4280, kok = `http://127.0.0.1:${PORT}`;
  const sunucu = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
  try {
    await expect.poll(() => fetch(kok + '/').then(r => r.ok, () => false), { timeout: 20_000 }).toBe(true);
    await cevrimdisiSenaryo(page, kok, () => new Promise<void>(bitti => { sunucu.once('exit', () => bitti()); sunucu.kill(); }));
  } finally { if (sunucu.exitCode === null) sunucu.kill(); }
});

async function cevrimdisiSenaryo(page: Page, kok: string, sunucuyuKapat: () => Promise<void>) {
  await page.goto(kok + '/');
  // service worker kurulup sayfayı kontrol edene kadar bekle
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  // Önbellek ısınsın: talimat PDF'ini bir kez çevrimiçi aç
  await page.goto(kok + '/#talimat-9');
  await page.locator('#gPdf').click();
  await expect(page.locator('#pSayfa')).toHaveAttribute('data-sayfa', '9', { timeout: 20_000 });
  await expect.poll(() => page.evaluate(async () => (await caches.keys()).includes('resmi-pdf') && !!(await (await caches.open('resmi-pdf')).keys()).length)).toBe(true);

  await sunucuyuKapat();
  // Ağ gerçekten yok: hiç açılmamış Ek-1 PDF'i indirilemez
  expect(await page.evaluate(() => fetch('/kaynaklar/ek1.pdf').then(r => r.ok ? 'indi' : 'ag-yok', () => 'ag-yok'))).toBe('ag-yok');
  await page.goto(kok + '/');
  await page.locator('#q').fill('pirinçte kadmiyum');
  await expect(page.locator('#sonuclar')).toContainText('3.2.12.3');
  await page.goto(kok + '/#ek1-30');
  await expect.poll(() => page.locator('#gResim').evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBeGreaterThan(0);
  await page.goto(kok + '/#talimat-9');
  await page.locator('#gPdf').click();
  await expect(page.locator('#pSayfa')).toHaveAttribute('data-sayfa', '9', { timeout: 20_000 });
  await expect(page.locator('#pMetin')).toContainText('Ek');
}
