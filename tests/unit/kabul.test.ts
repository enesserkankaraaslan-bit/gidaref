/* Prototipin 27 çekirdek kabul testi (src/kabul/testler.ts) — aynı liste uygulamadaki #testler sayfasında da çalışır. */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { aramaDizini, sayfaYolu, type KaynakKodu } from '../../src/core';
import { kabulTestleri } from '../../src/kabul/testler';
import { VERI } from '../../src/veri';

function sayfaVar(k: KaynakKodu, n: number): boolean {
  const yol = fileURLToPath(new URL('../../public/' + sayfaYolu(k, n), import.meta.url));
  if (!existsSync(yol)) return false;
  const b = readFileSync(yol);
  return b.length > 1500 && b[0] === 0xff && b[1] === 0xd8; // JPEG imzası
}

describe('Kabul testleri (prototip #testler, 27 çekirdek)', () => {
  const testler = kabulTestleri(aramaDizini(VERI), VERI, sayfaVar);
  it('liste prototiptekiyle aynı uzunlukta', () => expect(testler).toHaveLength(27));
  for (const [ad, fn] of testler) it(ad, () => expect(fn()).toBe(true));
});
