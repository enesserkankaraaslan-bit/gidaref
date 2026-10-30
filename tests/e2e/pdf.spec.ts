/* Orijinal PDF görüntüleyici (PDF.js), 375 px telefon genişliğinde. */
import { expect, test, type Page } from '@playwright/test';

const hazir = (page: Page, sayfa: number) => expect(page.locator('#pSayfa')).toHaveAttribute('data-sayfa', String(sayfa), { timeout: 20_000 });

/** Tuvalde boş olmayan (beyaz dışı) piksel var mı: sayfa gerçekten çizildi mi? */
const cizildi = (page: Page) => page.locator('#pTuval').evaluate((c: HTMLCanvasElement) => {
  const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  let koyu = 0; for (let i = 0; i < d.length; i += 4 * 97) if (d[i] < 200) koyu++;
  return koyu;
});

test('PDF.js yalnız “Orijinal PDF” tıklanınca yüklenir', async ({ page }) => {
  const istekler: string[] = [];
  page.on('request', r => istekler.push(r.url()));
  await page.goto('/');
  await page.locator('#q').fill('fındık');
  await expect(page.locator('#sonuclar')).toContainText('Doğrudan: Fındık');
  expect(istekler.some(u => /pdf\.worker|\.pdf$/.test(u))).toBe(false);
});

test('1.1.10 kartı → Sayfayı gör → Orijinal PDF: Ek-1 sayfa 3 çizilir', async ({ page }) => {
  await page.goto('/');
  await page.locator('#q').fill('fındıkta aflatoksin');
  const kart = page.locator('article.kart', { hasText: 'madde 1.1.10,' });
  await kart.getByRole('button', { name: 'Sayfayı gör' }).click();
  await expect(page.locator('#gBaslik')).toContainText('sayfa 3');
  await page.locator('#gPdf').click();
  await expect(page.locator('#pdfGoruntuleyici')).toBeVisible();
  await hazir(page, 3);
  await expect(page.locator('#pBaslik')).toHaveText('Bulaşanlar Yönetmeliği Ek-1, sayfa 3');
  await expect(page.locator('#pKonum')).toHaveText('3 / 45');
  await expect(page.locator('#pSayfa')).toHaveAttribute('data-metin', 'false'); // taranmış görüntü
  expect(await cizildi(page)).toBeGreaterThan(50);
  // Sayfa telefon genişliğine sığar, yatay taşma yok
  const g = await page.locator('#pSayfa').evaluate(el => el.getBoundingClientRect().width);
  expect(g).toBeLessThanOrEqual(375);
  // Kapat → sayfa görüntüleyiciye dönülür
  await page.locator('#pKapat').click();
  await expect(page.locator('#pdfGoruntuleyici')).toBeHidden();
  await expect(page.locator('#goruntuleyici')).toBeVisible();
});

test('Talimat sayfa 9: metin katmanı var, sonraki/önceki sayfa çalışır', async ({ page }) => {
  await page.goto('/#talimat-9');
  await page.locator('#gPdf').click();
  await hazir(page, 9);
  await expect(page.locator('#pKonum')).toHaveText('9 / 18');
  await expect(page.locator('#pSayfa')).toHaveAttribute('data-metin', 'true');
  await expect(page.locator('#pMetin')).toContainText('Ek');
  await page.locator('#pSonraki').click();
  await hazir(page, 10);
  await expect(page.locator('#pMetin')).toContainText('Nikel');
  await page.locator('#pOnceki').click();
  await page.locator('#pOnceki').click();
  await hazir(page, 8);
  await expect(page.locator('#pKonum')).toHaveText('8 / 18');
});

test('Yakınlaştırma: + sayfayı büyütür, % düğmesi sığdırır', async ({ page }) => {
  await page.goto('/#ek1-30');
  await page.locator('#gPdf').click();
  await hazir(page, 30);
  const genislik = () => page.locator('#pSayfa').evaluate(el => el.getBoundingClientRect().width);
  const ilk = await genislik();
  await page.locator('#pYakin').click();
  await expect.poll(genislik).toBeGreaterThan(ilk * 1.4);
  await expect(page.locator('#pSigdir')).toHaveText('150%');
  await page.locator('#pSigdir').click();
  await expect.poll(genislik).toBeLessThan(ilk + 1);
});
