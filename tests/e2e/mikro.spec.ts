/* Mikrobiyolojik kriterler: arama, kart, süzgeç, Ek-3 bölümü ve kontrol modu (375 px). */
import { expect, test } from '@playwright/test';

test('“yoğurt”: bulaşan limitleri ve mikrobiyolojik kriterler ayrı bölümlerde; kart n, c, m, M gösterir', async ({ page }) => {
  await page.goto('/');
  await page.locator('#q').fill('yoğurt');
  const sonuc = page.locator('#sonuclar');
  await expect(sonuc).toContainText('Mikrobiyolojik kriterler · Gıda güvenilirliği kriteri');
  const kart = sonuc.locator('article.kart-mikro').first();
  await expect(kart.locator('.tur')).toHaveText('Gıda güvenilirliği kriteri');
  await expect(kart).toContainText('Numune planı: 2 sınıflı · n = 5, c = 0');
  await expect(kart).toContainText('25 g-mL’de bulunmamalı');
  await expect(kart).toContainText('resmî PDF henüz eklenmedi');
  await expect(kart).toContainText('Tek okuma (Word metninden programla çekildi).');
  await expect(kart).not.toContainText('teyit edildi');
  await expect(kart.getByRole('button', { name: 'Sayfayı gör' })).toHaveCount(0);
  await expect(page.locator('#suzgec')).toContainText('Mikrobiyolojik kriter');
  await expect(sonuc).toContainText('Bu liste bir analiz planı değildir');
  const tasma = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(tasma).toBeLessThanOrEqual(0);
});

test('süzgeç “Mikrobiyolojik kriter”: yalnız mikrobiyolojik kartlar ve Ek-3 genel bölümü', async ({ page }) => {
  await page.goto('/');
  await page.locator('#q').fill('peynir');
  await page.locator('#suzgec button', { hasText: 'Mikrobiyolojik kriter' }).click();
  await expect(page.locator('#sonuclar article.kart-limit')).toHaveCount(0);
  await expect(page.locator('#sonuclar')).toContainText('Genel patojen limitleri (Ek-3)');
  await expect(page.locator('#sonuclar')).toContainText('belirli bir ürüne bağlı değildir');
});

test('“listeria”: geçtiği tüm ürünler; 3 sınıflı plan m ve M ayrı', async ({ page }) => {
  await page.goto('/');
  await page.locator('#q').fill('listeria');
  await expect(page.locator('#sonucBaslik')).toHaveText('Listeria monocytogenes: geçtiği tüm ürünler');
  await expect(page.locator('#sayim')).toHaveText('24 satır');
  await page.locator('#q').fill('kıyma salmonella');
  await expect(page.locator('#sonuclar article.kart-mikro').first()).toBeVisible();
});

test('aşamalı c (2.1.9): bugün geçerli c ve sıradaki değer', async ({ page }) => {
  await page.goto('/');
  await page.locator('#q').fill('campylobacter');
  const kart = page.locator('article.kart-mikro', { hasText: 'n = 50' }).first();
  await expect(kart.locator('.sonraki')).toContainText('31.12.2026 sonrası: c = 10');
});

test('kontrol modu: Mikrobiyolojik kriterler kaynağı; PDF yokken Eşleşti ve Düzelt kapalı', async ({ page }) => {
  await page.goto('/#kontrol');
  await page.locator('#kAd').fill('Deneme Mühendis');
  await page.locator('#kKaynak').selectOption('mk');
  await expect(page.locator('#kSayac')).toHaveText('Mikrobiyolojik kriterler · Eşleşti 0 / 174 · Düzeltme önerisi 0 · Bekleyen 174');
  await expect(page.locator('#kKart')).toContainText('MK-001');
  await expect(page.locator('#kKart')).toContainText('L. monocytogenes');
  await expect(page.locator('#kYok')).toBeVisible();
  await expect(page.locator('#kSayfaEtiket')).toBeHidden();
  await expect(page.locator('#kKart').getByRole('button', { name: 'Eşleşti' })).toBeDisabled();
  await expect(page.locator('#kKart').getByRole('button', { name: 'Düzelt' })).toBeDisabled();
  await page.locator('#kKart').getByRole('button', { name: 'Atla' }).click();
  await expect(page.locator('#kKart')).toContainText('MK-002');
  // Ek-1'e dönünce karar verilebilir
  await page.locator('#kKaynak').selectOption('e1');
  await expect(page.locator('#kKart').getByRole('button', { name: 'Eşleşti' })).toBeEnabled();
});
