/* Mikrobiyolojik Kriterler modülü: veri bütünlüğü, sınıflandırma, arama ve tarih mantığı. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { aramaDizini, aileHaritasi, birimYazili, gecerliC, planTuru, pyJson, csvAyristir, csvYaz, norm, type MikroKriter } from '../../src/core';
import { kabulTestleri } from '../../src/kabul/testler';
import { BIRLESIK_VERI, MIKRO_AILELERI, MIKRO_DIPNOT, MIKRO_SATIRLAR, VERI } from '../../src/veri';

const oku = (ad: string) => readFileSync(fileURLToPath(new URL('../../data/mikro/' + ad, import.meta.url)), 'utf8');
const dz = aramaDizini(BIRLESIK_VERI);
const mk = (s: string) => dz.ara(s).sonuc.filter(x => x.d.kaynak === 'mk').map(x => x.d.id);
const satir = (id: string) => MIKRO_SATIRLAR.find(s => s.id === id)!;

describe('Mikrobiyolojik kriter verisi', () => {
  it('174 satır (Ek-1 128, Ek-2 34, Ek-3 12), kimlikler tekil, hepsi tek okuma', () => {
    expect(MIKRO_SATIRLAR).toHaveLength(174);
    expect(new Set(MIKRO_SATIRLAR.map(s => s.id)).size).toBe(174);
    const ek = (e: string) => MIKRO_SATIRLAR.filter(s => s.ek === e).length;
    expect([ek('Ek-1'), ek('Ek-2'), ek('Ek-3')]).toEqual([128, 34, 12]);
    expect(MIKRO_SATIRLAR.every(s => s.durum === 'tek_okuma')).toBe(true);
  });
  it('her satırda m ve M dolu; tek limitlilerde m = M; yokluk kriterleri “bulunmamalı” der', () => {
    for (const s of MIKRO_SATIRLAR) {
      expect(s.m && s.M, s.id).toBeTruthy();
      if (s.tek_limit) expect(s.m, s.id).toBe(s.M);
      expect(s.limit_turu === 'yokluk', s.id).toBe(/bulunmamal/i.test(s.m));
    }
  });
  it('JSONL satırları biçim korunarak yeniden yazılabilir (kontrol:uygula için)', () => {
    const satirlar = oku('mikrobiyolojik_kriterler.jsonl').split('\n').filter(Boolean);
    for (const l of satirlar) expect(pyJson(JSON.parse(l))).toBe(l);
  });
  it('CSV 174 satır, JSONL ile aynı kimlikler ve aynı sırada; ayrıştır/yaz tur atar', () => {
    const csv = oku('mikrobiyolojik_kriterler.csv').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
    expect(csv.slice(1).map(l => csvAyristir(l)[0])).toEqual(MIKRO_SATIRLAR.map(s => s.id));
    for (const l of csv) expect(csvYaz(csvAyristir(l))).toBe(l);
  });
});

describe('Sınıflandırma', () => {
  it('her mikroorganizma metni tam bir aileye bağlı', () => {
    const say = new Map<string, number>();
    MIKRO_AILELERI.aileler.forEach(a => a.adlar.forEach(ad => say.set(ad, (say.get(ad) || 0) + 1)));
    for (const s of MIKRO_SATIRLAR) expect(say.get(s.mikroorganizma), s.mikroorganizma).toBe(1);
    const harita = aileHaritasi(MIKRO_AILELERI);
    expect([...say.keys()].every(ad => MIKRO_SATIRLAR.some(s => s.mikroorganizma === ad))).toBe(true);
    expect(harita.get('Muhtemel B.cereus')).toBe(harita.get('B. cereus'));
  });
  it('Ek-1 sınıflandırması değişmeden korunur; ekler birleşik veride', () => {
    expect(BIRLESIK_VERI.urunler['peynir']).toEqual(VERI.urunler['peynir']);
    expect(BIRLESIK_VERI.urunler['yoğurt'].ust).toEqual([...VERI.urunler['yoğurt'].ust, 'fermente süt ürünü']);
    expect(BIRLESIK_VERI.urunler['dondurma'].ust).toContain('süt ürünü');
    expect(VERI.urunler['dondurma']).toBeUndefined(); // Ek-1 verisi değişmedi
    expect(BIRLESIK_VERI.urunler['sığır eti'].es).toContain('kıyma'); // kıyma kararı bekliyor: eş anlamlı kaldı
  });
});

describe('Arama', () => {
  it('Ek-1 kabul testleri birleşik veride de geçer (mikrobiyoloji eklenince bulaşan davranışı değişmez)', () => {
    for (const [ad, fn] of kabulTestleri(dz, BIRLESIK_VERI, () => true)) expect(fn(), ad).toBe(true);
  });
  it('“yoğurt”: fermente süt ürünü kriterleri doğrudan gelir; bulaşan limitleri önce, mikrobiyoloji sonra', () => {
    const s = dz.ara('yoğurt');
    expect(mk('yoğurt')).toContain('MK-003');
    const ilkMk = s.sonuc.findIndex(x => x.d.kaynak === 'mk');
    expect(ilkMk).toBeGreaterThan(-1);
    expect(s.sonuc.slice(ilkMk).every(x => x.d.kaynak === 'mk')).toBe(true);
  });
  it('“listeria”: yalnız L. monocytogenes satırları (24), tümü mikrobiyolojik', () => {
    const r = dz.ara('listeria');
    expect(r.mod).toBe('aile');
    expect(r.sonuc.every(x => x.d.mikro?.mikroorganizma === 'L. monocytogenes')).toBe(true);
    expect(r.sonuc).toHaveLength(24);
  });
  it('“yoğurtta salmonella”: yalnız Salmonella; Ek-3 ayrı “genel” listede', () => {
    const r = dz.ara('yoğurtta salmonella');
    expect(r.sonuc.length).toBeGreaterThan(0);
    expect(r.sonuc.every(x => x.d.aile === 'Salmonella')).toBe(true);
    expect(r.sonuc.some(x => x.d.tur === 'mikro_patojen')).toBe(false);
    expect(r.genel.length).toBeGreaterThan(0);
    expect(r.genel.every(x => x.d.tur === 'mikro_patojen' && x.d.aile === 'Salmonella')).toBe(true);
  });
  it('“koliform bakteri” iki yazımı da bulur, başka mikroorganizma getirmez', () => {
    const r = dz.ara('koliform bakteri').sonuc;
    expect(new Set(r.map(x => x.d.mikro!.mikroorganizma))).toEqual(new Set(['Koliform bakteri', 'Koliform bakteriler']));
  });
  it('“patojen” / “mikrobiyolojik”: tüm mikrobiyolojik satırlar, bulaşan yok', () => {
    for (const q of ['patojen', 'mikrobiyolojik']) {
      const r = dz.ara(q).sonuc;
      expect(r).toHaveLength(174);
      expect(r.every(x => x.d.kaynak === 'mk')).toBe(true);
    }
  });
  it('“aflatoksin” mikrobiyolojik satır getirmez; madde numaraları kaynaklar arasında karışmaz', () => {
    expect(dz.ara('aflatoksin').sonuc.every(x => x.d.kaynak === 'e1')).toBe(true);
    expect(dz.ara('pirinç').sonuc.filter(x => x.d.kaynak === 'e1').map(x => x.d.madde)).toEqual(aramaDizini(VERI).ara('pirinç').sonuc.map(x => x.d.madde));
  });
  it('“dondurma” (yeni ürün): doğrudan dondurma kriterleri', () => {
    const r = dz.ara('dondurma');
    expect(r.urunler[0].anahtar).toBe('dondurma');
    expect(r.sonuc.filter(x => x.d.kaynak === 'mk' && x.bag?.seviye === 1).length).toBe(9);
  });
});

describe('Numune planı ve tarih', () => {
  it('plan türü: 2 sınıflı, 3 sınıflı, günlük ortalama', () => {
    expect(planTuru(satir('MK-001'))).toBe('2 sınıflı');
    expect(planTuru(MIKRO_SATIRLAR.find(s => !s.tek_limit && s.n)!)).toBe('3 sınıflı');
    expect(planTuru(MIKRO_SATIRLAR.find(s => s.madde === '2.1.1')!)).toBe('günlük ortalama');
  });
  it('aşamalı c (2.1.9): 2025 ortası 20, bugün 15, 2027’de 10; “sonrası” o gün hariç', () => {
    const s = MIKRO_SATIRLAR.find(x => x.c_asamali) as MikroKriter;
    expect(s.madde).toBe('2.1.9');
    expect(gecerliC(s, '2025-06-01').simdi).toBe('20');
    expect(gecerliC(s, '2025-12-31').simdi).toBe('20');
    expect(gecerliC(s, '2026-01-01').simdi).toBe('15');
    expect(gecerliC(s, '2026-11-01')).toEqual({ simdi: '15', ileri: [{ c: '10', tarih: '31.12.2026 sonrası' }] });
    expect(gecerliC(s, '2027-01-01').simdi).toBe('10');
  });
  it('birim notu: yalnız birimi yazmayan limitlerde', () => {
    expect(birimYazili('10²')).toBe(false);
    expect(birimYazili('5×10² kob/g – cm²')).toBe(true);
    expect(birimYazili('25 g-mL’de bulunmamalı')).toBe(true);
    expect(birimYazili('230 EMS/100 g')).toBe(true);
  });
  it('her Ek-2 satırının tablo dipnot/değerlendirme anahtarı bulunur', () => {
    const anahtarlar = Object.keys(MIKRO_DIPNOT.dipnotlar);
    expect(MIKRO_SATIRLAR.filter(s => s.ek === 'Ek-2').every(s => anahtarlar.some(k => k.startsWith('Ek-2 (' + s.madde.split('.').slice(0, 2).join('.') + '.')))).toBe(true);
    expect(norm('Ek-2')).toBe('ek 2');
  });
});
