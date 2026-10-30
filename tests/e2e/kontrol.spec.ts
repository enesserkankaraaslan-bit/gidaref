/* Kontrol modu (#kontrol): telefon (375 px, varsayılan) ve masaüstü genişliğinde. */
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const sayac = (page: Page) => page.locator('#kSayac');
const kart = (page: Page) => page.locator('#kKart');

async function ac(page: Page, ad = 'Deneme Mühendis') {
  await page.goto('/#kontrol');
  await expect(sayac(page)).toHaveText('Eşleşti 8 / 482 · Düzeltme önerisi 0 · Bekleyen 474');
  if (ad) await page.locator('#kAd').fill(ad);
}

test('açılış: sayaç, ilk bekleyen satır ve sayfa görüntüsü; ad yazılmadan karar verilemez', async ({ page }) => {
  await ac(page, '');
  await expect(kart(page)).toContainText('Madde 1.1.1');
  await expect(kart(page)).toContainText('Satır 1 / 474');
  await expect(page.locator('#kResim')).toHaveAttribute('src', /sayfalar\/e1\/1\.jpg$/);
  await expect(kart(page).getByRole('button', { name: 'Eşleşti' })).toBeDisabled();
  await expect(kart(page)).toContainText('önce “Kontrol eden”');
  await page.locator('#kAd').fill('Deneme Mühendis');
  await expect(kart(page).getByRole('button', { name: 'Eşleşti' })).toBeEnabled();
  const tasma = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(tasma).toBeLessThanOrEqual(0);
});

test('Eşleşti: sayaç artar, sıradaki satıra geçer, sayfa yenilenince korunur', async ({ page }) => {
  await ac(page);
  const ilk = await kart(page).locator('h2').textContent();
  await kart(page).getByRole('button', { name: 'Eşleşti' }).click();
  await expect(sayac(page)).toHaveText('Eşleşti 9 / 482 · Düzeltme önerisi 0 · Bekleyen 473');
  await expect(kart(page)).toContainText('Satır 1 / 473');
  await expect(page.locator('#kIndir')).toHaveText('Kayıtları indir (1)');
  await page.reload();
  await expect(sayac(page)).toHaveText('Eşleşti 9 / 482 · Düzeltme önerisi 0 · Bekleyen 473');
  await expect(page.locator('#kAd')).toHaveValue('Deneme Mühendis');
  // Eşleşenler süzgecinde geçmişiyle görünür
  await page.locator('#kSuzDurum').selectOption('eslesti');
  await page.locator('#kSuzSayfa').selectOption('1');
  await expect(kart(page).locator('h2')).toHaveText(ilk!);
  await expect(kart(page).locator('.k-gecmis')).toContainText('Deneme Mühendis · Eşleşti');
  await expect(kart(page).locator('.k-gecmis')).toContainText('yerel, henüz indirilmedi');
});

test('Düzelt: öneri kaydedilir, veri değişmez', async ({ page }) => {
  await ac(page);
  const deger = await kart(page).locator('.k-deger .sayi-k').textContent();
  await kart(page).getByRole('button', { name: 'Düzelt' }).click();
  await page.locator('#kAlan').selectOption('deger');
  await expect(page.locator('#kEski')).toHaveText(deger!);
  await page.locator('#kYeni').fill('9,9');
  await page.locator('#kNot').fill('deneme');
  await page.getByRole('button', { name: 'Düzeltmeyi kaydet' }).click();
  await expect(sayac(page)).toHaveText('Eşleşti 8 / 482 · Düzeltme önerisi 1 · Bekleyen 473');
  await page.locator('#kSuzDurum').selectOption('duzeltme');
  await expect(kart(page)).toContainText('Düzeltme önerildi');
  await expect(kart(page).locator('.k-deger .sayi-k')).toHaveText(deger!); // gösterilen değer hâlâ verideki
  await expect(kart(page).locator('.k-gecmis')).toContainText(`Değer “${deger}” → “9,9” (deneme)`);
  // Ana arama ekranı da değişmez
  await page.goto('/');
  await page.locator('#q').fill('aflatoksin');
  await expect(page.locator('#sonuclar')).not.toContainText('9,9');
});

test('Kayıtları indir: yalnız yeni kayıtlar, geçerli JSONL', async ({ page }) => {
  await ac(page);
  await kart(page).getByRole('button', { name: 'Eşleşti' }).click();
  await kart(page).getByRole('button', { name: 'Eşleşti' }).click();
  const [indirme] = await Promise.all([page.waitForEvent('download'), page.locator('#kIndir').click()]);
  expect(indirme.suggestedFilename()).toMatch(/^kontrol_kayitlari_\d{4}-\d{2}-\d{2}\.jsonl$/);
  const satirlar = readFileSync((await indirme.path())!, 'utf8').trim().split('\n').map(l => JSON.parse(l));
  expect(satirlar).toHaveLength(2);
  for (const k of satirlar) {
    expect(k).toMatchObject({ karar: 'eslesti', kontrol_eden: 'Deneme Mühendis' });
    expect(k.anahtar).toContain(' ¦ ');
    expect(Date.parse(k.zaman)).not.toBeNaN();
  }
  expect(satirlar.map(k => k.madde)).toEqual(['1.1.1', '1.1.1']);
});

test.describe('masaüstü', () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false });
  test('sayfa görüntüsü ve satır yan yana; klavye kısayolu E', async ({ page }) => {
    await ac(page);
    const g = await page.locator('.k-gorsel').boundingBox(), k = await kart(page).boundingBox();
    expect(k!.x).toBeGreaterThan(g!.x + g!.width - 1);
    await page.locator('#kKart h2').click(); // odak yazı alanından çıksın
    await page.keyboard.press('e');
    await expect(sayac(page)).toHaveText('Eşleşti 9 / 482 · Düzeltme önerisi 0 · Bekleyen 473');
  });
});
