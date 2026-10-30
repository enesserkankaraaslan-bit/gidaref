/* ===== Kabul testleri (tarih sabit: 30.10.2026) =====
 * Prototipin #testler sayfasındaki 27 çekirdek testi, aynı sıra ve aynı koşullarla.
 * Hem Vitest (tests/unit) hem uygulamadaki #testler sayfası bu listeyi çalıştırır.
 * Arayüz testleri (3 adet) tests/e2e ve src/ui altında. */
import type { AramaDizini } from '../core/arama';
import { gecerliDeger, durumOf } from '../core/tarih';
import { KAYNAKLAR } from '../core/kaynaklar';
import type { KaynakKodu, Veri } from '../core/tipler';

export const TEST_GUNU = '2026-10-30';
export type KabulTesti = [ad: string, fn: () => boolean];
/** Sayfa görüntüsü var ve boş değil mi? (Node'da dosya sistemi, tarayıcıda ön yüklenmiş sonuç) */
export type SayfaKontrol = (kaynak: KaynakKodu, sayfa: number) => boolean;

export function kabulTestleri(dz: AramaDizini, DATA: Veri, sayfaVar: SayfaKontrol): KabulTesti[] {
  const ara = dz.ara;
  const mad = (s: string) => ara(s).sonuc.map(x => x.d.madde);
  const seviyesi = (s: string, m: string) => { const x = ara(s).sonuc.find(y => y.d.madde === m); return x ? x.bag!.seviye : null; };
  const kayit = (m: string) => DATA.kayitlar.find(x => x.madde === m)!;
  return [
    ['Türkçe normalleştirme ve ASCII yazım: “findik” = “fındık”, “kursun” = “kurşun”', () => mad('findik').join() === mad('fındık').join() && mad('kursun').join() === mad('kurşun').join() && mad('fındık').length > 0],
    ['“aflatoksin”: aflatoksin geçen tüm ürün satırları (1.1.1–1.1.18), başka bulaşan yok', () => { const r = ara('aflatoksin').sonuc; return new Set(r.map(x => x.d.madde)).size === 18 && r.length === 19 && r.every(x => x.d.aile === 'Aflatoksin') && ['1.1.1', '1.1.10', '1.1.16', '1.1.18'].every(m => r.some(x => x.d.madde === m)); }],
    ['“fındık”: doğrudan fındık satırları 1.1.10 ve 1.1.11', () => seviyesi('fındık', '1.1.10') === 1 && seviyesi('fındık', '1.1.11') === 1],
    ['“fındık”: üst kategori satırı kadmiyum 3.2.1.5.1 ve talimat nikel gelir', () => seviyesi('fındık', '3.2.1.5.1') === 2 && ara('fındık').sonuc.some(x => x.d.aile === 'Nikel')],
    ['“fındık”: fındığı hariç tutan 1.1.6 / 1.1.7 ve badem satırı 1.1.8 gelmez', () => { const m = mad('fındık'); return !m.includes('1.1.6') && !m.includes('1.1.7') && !m.includes('1.1.8') && !m.includes('1.1.9'); }],
    ['“fındık”: meyve satırları (dipnot 1) fındığa uygulanmaz', () => !ara('fındık').sonuc.some(x => x.d.kat.includes('meyve') && !x.d.kat.includes('sert kabuklu meyve'))],
    ['“fındıkta aflatoksin”: yalnız 1.1.10 ve 1.1.11', () => mad('fındıkta aflatoksin').sort().join() === '1.1.10,1.1.11'],
    ['“ceviz”: genel sert kabuklu aflatoksin satırları gelir, talimat nikel istisna olarak işaretlenir', () => seviyesi('ceviz', '1.1.6') === 2 && ara('ceviz').sonuc.some(x => x.d.aile === 'Nikel' && x.bag!.seviye === 3)],
    ['“pirinç”: 3.2.12.3 ve 3.4.1.1 doğrudan; daha özel satırı olan genel 3.2.12.1 gizlenir', () => seviyesi('pirinç', '3.2.12.3') === 1 && seviyesi('pirinç', '3.4.1.1') === 1 && !mad('pirinç').includes('3.2.12.1')],
    ['“pirinç”: pirinci hariç tutan DON satırı 1.4.1 “istisnayı kontrol edin” olarak gelir', () => seviyesi('pirinç', '1.4.1') === 3],
    ['“pirinç”: yalnız ayıklanacak pirinci hariç tutan 1.1.12 gizlenmez, kontrol uyarısıyla gelir', () => seviyesi('pirinç', '1.1.12') === 3],
    ['“fındık”: kayısı çekirdeği ve badem satırları (hidrosiyanik asit) gelmez', () => !ara('fındık').sonuc.some(x => x.d.aile === 'Hidrosiyanik asit')],
    ['“et”: kurşun, kadmiyum, dioksin, PFAS ve PAH et satırları gelir', () => { const m = mad('et'); return ['3.1.13', '3.2.13.1', '4.1.1.1', '4.2.1.1', '5.1.6'].every(x => m.includes(x)); }],
    ['“et”: “etiket” geçen satırlar et olarak eşleşmez (keten tohumu 2.3.2 yok)', () => !mad('et').includes('2.3.2')],
    ['“ette kurşun”: yalnız kurşun aileli et satırları', () => { const r = ara('ette kurşun').sonuc; return r.length >= 4 && r.every(x => x.d.aile === 'Kurşun') && r.some(x => x.d.madde === '3.1.13'); }],
    ['“bebek maması”: bebek gıdası satırlarının tamamı (en az 40)', () => { const m = mad('bebek maması'); return m.length >= 40 && ['1.1.17', '1.1.18', '3.1.24.1', '6.3.3'].every(x => m.includes(x)); }],
    ['“ağır metal”: kurşun, kadmiyum, cıva, arsenik ve kalay', () => { const a = new Set(ara('ağır metal').sonuc.map(x => x.d.aile)); return ['Kurşun', 'Kadmiyum', 'Cıva', 'Arsenik', 'İnorganik kalay'].every(x => a.has(x)) && a.size === 5; }],
    ['“aflatoksin m1”: yalnız M1 satırları (süt ve bebek formülü)', () => mad('aflatoksin m1').sort().join() === '1.1.16,1.1.17'],
    ['Tam metin: “fleur de sel” → 3.1.23.2; “kabukla” → kabukla analiz notlu satırlar', () => mad('fleur de sel').join() === '3.1.23.2' && mad('kabukla').length >= 5],
    ['Tarih: 1.1.1 B1 bugün 8,0, sıradaki 31.12.2026’dan itibaren 5,0', () => { const g = gecerliDeger(kayit('1.1.1').analitler[0].degerler, TEST_GUNU); return g.simdi!.d === '8,0' && g.sonraki!.d === '5,0' && g.sonraki!.t === '31.12.2026'; }],
    ['Tarih: PFAS (31.12.2025) bugün geçerli, 01.06.2025’te henüz değil', () => { const v = kayit('4.2.1.1').analitler[0].degerler; return !!gecerliDeger(v, TEST_GUNU).simdi && !gecerliDeger(v, '2025-06-01').simdi && !!gecerliDeger(v, '2025-06-01').sonraki; }],
    ['Tarih: yalnız ileri tarihli değer (1.7.2.2, 31.12.2026) bugün “henüz yürürlükte değil”', () => { const g = gecerliDeger(kayit('1.7.2.2').analitler[0].degerler, TEST_GUNU); return !g.simdi && g.sonraki!.d === '150'; }],
    /* Prototipte 483 idi; 3.1.9.1 sayfa 18–19'a bölünmüş tek satır olduğu için iki kez girilmişti, birleştirildi (30.10.2026). */
    ['Veri bütünlüğü: 482 Ek-1 değeri, 338 madde, her değerin birimi var', () => { const e1 = DATA.kayitlar.filter(k => k.kaynak === 'e1'); const n = e1.reduce((s, k) => s + k.analitler.reduce((t, a) => t + a.degerler.length, 0), 0); return n === 482 && new Set(e1.map(k => k.madde)).size === 338 && e1.every(k => k.analitler.every(a => a.degerler.every(v => v.d && v.b))); }],
    ['Kaynak görselleri: Ek-1’in 45 ve talimatın 4 sayfası', () => KAYNAKLAR.e1.sayfalar.every(n => sayfaVar('e1', n)) && KAYNAKLAR.tl.sayfalar.every(n => sayfaVar('tl', n))],
    ['Doğrulama kapısı: hiçbir kayıt “güncel/onaylı” demiyor; iki kez eşleşen Ek-1 grubu yalnız 6', () => DATA.kayitlar.every(k => !k.guncellik && !/teyit edildi|onaylı/i.test(durumOf(k).baslik)) && DATA.kayitlar.filter(k => k.kaynak === 'e1' && k.durum === 'eslesti').length === 6],
    ['Karşılaştırma değerleri ayrı türde: nikel, akrilamid, Alternaria', () => DATA.kayitlar.filter(k => k.tur === 'karsilastirma').every(k => k.kaynak === 'tl') && new Set(DATA.kayitlar.filter(k => k.tur === 'karsilastirma').map(k => k.aile)).size === 3],
    ['Anlamsız sorgu sonuç vermez', () => ara('xqzw').sonuc.length === 0]
  ];
}
