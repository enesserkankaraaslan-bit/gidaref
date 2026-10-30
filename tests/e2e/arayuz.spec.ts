/* Prototipin 3 arayüz kabul testi, gerçek etkileşimle ve telefon genişliğinde (375 px). */
import { expect, test } from '@playwright/test';

test('Görüntüleyici: Ek-1 sayfa 30 açılır, başlık, konum ve görsel doğru', async ({ page }) => {
  await page.goto('/#ek1-30');
  await expect(page.locator('#goruntuleyici')).toBeVisible();
  await expect(page.locator('#gBaslik')).toContainText('sayfa 30');
  await expect(page.locator('#gKonum')).toHaveText('30 / 45');
  const img = page.locator('#gResim');
  await expect(img).toHaveAttribute('src', /sayfalar\/e1\/30\.jpg$/);
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBeGreaterThan(0);
});

test('Görüntüleyici: önceki/sonraki sayfa', async ({ page }) => {
  await page.goto('/#ek1-10');
  await page.locator('#gSonraki').click();
  await expect(page.locator('#gBaslik')).toContainText('sayfa 11');
  await page.locator('#gOnceki').click();
  await page.locator('#gOnceki').click();
  await expect(page.locator('#gBaslik')).toContainText('sayfa 9');
  await expect(page.locator('#gKonum')).toHaveText('9 / 45');
});

test('Arayüz: “fındık” aramasında doğrudan, üst kategori ve uyarı metni görünür', async ({ page }) => {
  await page.goto('/');
  await page.locator('#q').fill('fındık');
  const sonuclar = page.locator('#sonuclar');
  await expect(sonuclar).toContainText('Doğrudan: Fındık');
  await expect(sonuclar).toContainText('Üst kategori: sert kabuklu meyve');
  await expect(sonuclar).toContainText('analiz planı değildir');
  // Telefon genişliğinde yatay kaydırma olmamalı.
  const tasma = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(tasma).toBeLessThanOrEqual(0);
});

test('Uygulama içi #testler sayfası: 30 / 30', async ({ page }) => {
  await page.goto('/#testler');
  await expect(page.locator('#testSonuc .test-ozet')).toHaveText('30 / 30 test geçti', { timeout: 15_000 });
  // Testler adres çubuğunu kirletmemeli (prototipte #ek1-9 kalıyordu).
  expect(new URL(page.url()).hash).toBe('#testler');
});
