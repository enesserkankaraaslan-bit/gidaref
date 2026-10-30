import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CSV_ESLESTI, csvAyristir, csvYaz, gecmisBirlestir, jsonlOku, jsonlYaz, kayitGecerli, kontrolSatirlari, pyJson,
  satirAnahtari, satirDurumu, sonKararlar, uygulamaPlani, type KontrolKaydi
} from '../../src/core';
import { VERI } from '../../src/veri';

const oku = (ad: string) => readFileSync(fileURLToPath(new URL('../../data/ek1/' + ad, import.meta.url)), 'utf8');
const satirlar = kontrolSatirlari(VERI);
const kayit = (s: { anahtar: string; madde: string; sayfa: number }, karar: 'eslesti' | 'duzelt', zaman: string, ek: Partial<KontrolKaydi> = {}): KontrolKaydi =>
  ({ anahtar: s.anahtar, madde: s.madde, sayfa: s.sayfa, karar, kontrol_eden: 'Test Kişi', zaman, ...ek });

describe('Satır anahtarı', () => {
  it('482 Ek-1 değerinin her biri tekil anahtar taşır', () => {
    expect(satirlar).toHaveLength(482);
    expect(new Set(satirlar.map(s => s.anahtar)).size).toBe(482);
  });
  it('JSONL satırlarının anahtarlarıyla birebir aynı', () => {
    const jsonl = oku('ek1_satirlar.jsonl').split('\n').filter(l => l.trim()).map(l => JSON.parse(l))
      .map(r => satirAnahtari(r.madde, r.urun_ifadesi, r.analit, r.tarih));
    expect(new Set(jsonl)).toEqual(new Set(satirlar.map(s => s.anahtar)));
  });
  it('verideki eslesti grupları 8 satır eder (ilk doğrulama turu)', () => {
    const son = sonKararlar([]);
    expect(satirlar.filter(s => satirDurumu(s, son) === 'eslesti')).toHaveLength(8);
  });
});

describe('Kararlar ve geçmiş', () => {
  const s = satirlar.find(x => x.veriDurumu === 'okundu')!;
  it('son karar geçerlidir (zaman sırasıyla)', () => {
    const g = [kayit(s, 'duzelt', '2026-10-30T10:00:00Z', { alan: 'deger', eski: s.deger, yeni: '9,9' }), kayit(s, 'eslesti', '2026-10-30T09:00:00Z')];
    expect(satirDurumu(s, sonKararlar(g))).toBe('duzeltme');
    expect(satirDurumu(s, sonKararlar(g.concat(kayit(s, 'eslesti', '2026-10-30T11:00:00Z'))))).toBe('eslesti');
  });
  it('geçmiş yalnız eklenerek birleşir; aynı kayıt iki kez eklenmez', () => {
    const a = kayit(s, 'eslesti', '2026-10-30T09:00:00Z'), b = kayit(s, 'duzelt', '2026-10-30T10:00:00Z', { alan: 'birim', eski: s.birim, yeni: 'mg/kg' });
    const r = gecmisBirlestir([a], [a, b, b]);
    expect(r.gecmis).toEqual([a, b]);
    expect(r.eklenen).toEqual([b]);
  });
  it('JSONL okuma/yazma tur atar; bozuk kayıt reddedilir', () => {
    const a = kayit(s, 'eslesti', '2026-10-30T09:00:00Z');
    expect(jsonlOku(jsonlYaz([a]))).toEqual([a]);
    expect(kayitGecerli({ ...a, kontrol_eden: ' ' })).toBe(false);
    expect(kayitGecerli({ ...a, karar: 'duzelt' })).toBe(false); // alan ve yeni değer zorunlu
    expect(kayitGecerli({ ...a, karar: 'guncel' })).toBe(false); // kontrol modu hukuki güncellik veremez
    expect(() => jsonlOku('{bozuk')).toThrow();
  });
  it('depodaki kontrol_gecmisi.jsonl geçerli kayıtlardan oluşur', () => {
    expect(() => jsonlOku(oku('kontrol_gecmisi.jsonl'))).not.toThrow();
  });
});

describe('Uygulama planı', () => {
  const grup = VERI.kayitlar.find(k => k.kaynak === 'e1' && k.durum === 'okundu' && k.analitler.length === 2)!;
  const gs = satirlar.filter(x => x.kayitId === grup.id);
  it('grup yalnız tüm değerleri eşleşince eslesti olur', () => {
    expect(uygulamaPlani(VERI, [kayit(gs[0], 'eslesti', '2026-10-30T09:00:00Z')]).eslesenGruplar).not.toContain(grup.id);
    const p = uygulamaPlani(VERI, gs.map((x, i) => kayit(x, 'eslesti', '2026-10-30T09:0' + i + ':00Z')));
    expect(p.eslesenGruplar).toContain(grup.id);
    expect(p.eslesenSatirlar).toEqual(expect.arrayContaining(gs.map(x => x.anahtar)));
  });
  it('düzeltme önerisi gruplamayı engeller ve ayrı listelenir, veriye işlenmez', () => {
    const g = [...gs.map((x, i) => kayit(x, 'eslesti', '2026-10-30T09:0' + i + ':00Z')), kayit(gs[0], 'duzelt', '2026-10-30T10:00:00Z', { alan: 'deger', eski: gs[0].deger, yeni: '1,0' })];
    const p = uygulamaPlani(VERI, g);
    expect(p.eslesenGruplar).not.toContain(grup.id);
    expect(p.duzeltmeler.map(k => k.anahtar)).toEqual([gs[0].anahtar]);
  });
  it('zaten eslesti olan gruplar yeniden listelenmez; bilinmeyen anahtar raporlanır', () => {
    const p = uygulamaPlani(VERI, [kayit({ anahtar: 'yok ¦ yok', madde: '9.9', sayfa: 1 }, 'eslesti', '2026-10-30T09:00:00Z')]);
    expect(p.eslesenGruplar).toEqual([]);
    expect(p.bilinmeyen).toEqual(['yok ¦ yok']);
  });
});

describe('Dosya biçimini koruma', () => {
  it('pyJson, gidaref_kayitlar_v2.json dosyasını bayt bayt yeniden üretir', () => {
    const metin = oku('gidaref_kayitlar_v2.json');
    expect(pyJson(JSON.parse(metin))).toBe(metin);
  });
  it('CSV ayrıştır/yaz her satırda tur atar', () => {
    const satir = oku('ek1_tum_satirlar.csv').replace(/^﻿/, '').split(/\r?\n/).filter(l => l);
    for (const l of satir) expect(csvYaz(csvAyristir(l))).toBe(l);
    expect(satir.filter(l => csvAyristir(l)[12] === CSV_ESLESTI)).toHaveLength(8);
  });
});
