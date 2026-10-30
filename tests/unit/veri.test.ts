/* Veri dosyalarının kendi aralarında tutarlılığı: satır dosyası (JSONL) ile madde bazlı kayıtlar (JSON) aynı değerleri taşımalı. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { VERI } from '../../src/veri';

const oku = (ad: string) => readFileSync(fileURLToPath(new URL('../../data/ek1/' + ad, import.meta.url)), 'utf8');
interface Satir { sayfa: string | number; madde: string; urun_ifadesi: string; analit: string; deger: string; birim: string; esas: string; tarih: string }
const satirlar: Satir[] = oku('ek1_satirlar.jsonl').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

const anahtar = (m: string, u: string, a: string, d: string, b: string, e: string, t: string, s: number) => [m, u, a, d, b, e, t, s].join('|');

describe('Veri tutarlılığı', () => {
  it('ek1_satirlar.jsonl 483 satır, 338 madde', () => {
    expect(satirlar).toHaveLength(483);
    expect(new Set(satirlar.map(r => r.madde)).size).toBe(338);
  });
  it('JSONL ve JSON aynı 483 değeri taşır (madde, ürün, analit, değer, birim, esas, tarih, sayfa)', () => {
    const json = VERI.kayitlar.filter(k => k.kaynak === 'e1').flatMap(k => k.analitler.flatMap(a => a.degerler.map(v => anahtar(k.madde, k.urun, a.ad, v.d, v.b, v.e, v.t, k.sayfa))));
    const jsonl = satirlar.map(r => anahtar(r.madde, r.urun_ifadesi, r.analit, r.deger, r.birim, r.esas, r.tarih, Number(r.sayfa)));
    expect(json.slice().sort()).toEqual(jsonl.slice().sort());
  });
  it('dipnotlar ek1_dipnotlar.json ile aynı', () => {
    expect(VERI.dipnotlar).toEqual(JSON.parse(oku('ek1_dipnotlar.json')));
  });
  it('kayıt kimlikleri tekil', () => {
    const ids = VERI.kayitlar.map(k => k.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('tarihler GG.AA.YYYY ya da boş', () => {
    expect(satirlar.filter(r => r.tarih && !/^\d{2}\.\d{2}\.\d{4}$/.test(r.tarih))).toEqual([]);
  });
  it('resmî limit yalnız Ek-1, karşılaştırma değeri yalnız talimat', () => {
    expect(VERI.kayitlar.every(k => (k.tur === 'limit') === (k.kaynak === 'e1'))).toBe(true);
  });
});
