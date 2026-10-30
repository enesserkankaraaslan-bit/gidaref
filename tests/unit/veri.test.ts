/* Veri dosyalarının kendi aralarında tutarlılığı: satır dosyası (JSONL) ile madde bazlı kayıtlar (JSON) aynı değerleri taşımalı. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { VERI } from '../../src/veri';

const oku = (ad: string) => readFileSync(fileURLToPath(new URL('../../data/ek1/' + ad, import.meta.url)), 'utf8');
interface Satir { sayfa: string | number; madde: string; urun_ifadesi: string; analit: string; deger: string; birim: string; esas: string; tarih: string }
const satirlar: Satir[] = oku('ek1_satirlar.jsonl').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

/* 1.1.5: belgede (s. 2) yerfıstığı ve "diğer yağlı tohumlar" ayrı alt satırlar, her birinin kendi değer hücresi var. */
const IKI_URUNLU_MADDE = ['1.1.5|Aflatoksin B1||', '1.1.5|Toplam aflatoksin (B1+B2+G1+G2)||'];

const anahtar =(m: string, u: string, a: string, d: string, b: string, e: string, t: string, s: number) => [m, u, a, d, b, e, t, s].join('|');

describe('Veri tutarlılığı', () => {
  it('ek1_satirlar.jsonl 482 satır, 338 madde', () => {
    expect(satirlar).toHaveLength(482);
    expect(new Set(satirlar.map(r => r.madde)).size).toBe(338);
  });
  it('JSONL ve JSON aynı 482 değeri taşır (madde, ürün, analit, değer, birim, esas, tarih, sayfa)', () => {
    const json = VERI.kayitlar.filter(k => k.kaynak === 'e1').flatMap(k => k.analitler.flatMap(a => a.degerler.map(v => anahtar(k.madde, k.urun, a.ad, v.d, v.b, v.e, v.t, k.sayfa))));
    const jsonl = satirlar.map(r => anahtar(r.madde, r.urun_ifadesi, r.analit, r.deger, r.birim, r.esas, r.tarih, Number(r.sayfa)));
    expect(json.slice().sort()).toEqual(jsonl.slice().sort());
  });
  it('CSV dışa aktarımı JSONL ile aynı satırları taşır', () => {
    const csv = oku('ek1_tum_satirlar.csv').replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim()).slice(1);
    expect(csv).toHaveLength(satirlar.length);
    // ilk iki alan (sayfa, madde) tırnaksız; satır sırası JSONL ile aynı olmalı
    expect(csv.map(l => l.split(',').slice(0, 2).join(','))).toEqual(satirlar.map(r => r.sayfa + ',' + r.madde));
  });
  it('aynı madde, aynı analit ve aynı tarih için ikinci bir değer yok (sayfa sonunda bölünen satır iki kez girilmemeli)', () => {
    const say: Record<string, number> = {};
    satirlar.forEach(r => { const k = [r.madde, r.analit, r.tarih, r.esas].join('|'); say[k] = (say[k] || 0) + 1; });
    const cift = Object.entries(say).filter(([, n]) => n > 1).map(([k]) => k);
    expect(cift).toEqual(IKI_URUNLU_MADDE);
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
