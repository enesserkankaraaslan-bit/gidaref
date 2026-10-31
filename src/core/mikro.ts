/* ===== Mikrobiyolojik Kriterler modülü (DOM'dan bağımsız) =====
 * Veri dosyası teslim edildiği gibi okunur; arama için ortak Kayit biçimine uyarlanır.
 * m ve M belgede yazdığı gibi metin kalır, hiçbir yerde sayıya çevrilmez. */
import type { Aile, Kayit, KayitTuru, MikroKriter, UrunBilgisi, Veri } from './tipler';
import { iso } from './tarih';

export const MIKRO_KAYNAK = 'Türk Gıda Kodeksi Mikrobiyolojik Kriterler Yönetmeliği (RG 13.02.2025, sayı 32812)';

export interface MikroAile { ad: string; adlar: string[]; es: string[] }
export interface MikroAileleri { grup: string; grupEs: string[]; aileler: MikroAile[] }
export interface SiniflandirmaEki { urunler: Record<string, UrunBilgisi>; ustEkle: Record<string, string[]>; katEs: Record<string, string[]> }

export function mikroJsonlOku(metin: string): MikroKriter[] {
  return metin.split(/\r?\n/).filter(l => l.trim()).map(l => JSON.parse(l) as MikroKriter);
}

export function mikroTur(ek: MikroKriter['ek']): KayitTuru {
  return ek === 'Ek-1' ? 'mikro_guvenilirlik' : ek === 'Ek-2' ? 'mikro_hijyen' : 'mikro_patojen';
}
export const MIKRO_TUR_ADI: Record<string, string> = {
  mikro_guvenilirlik: 'Gıda güvenilirliği kriteri', mikro_hijyen: 'Üretim hijyeni kriteri', mikro_patojen: 'Genel patojen limiti'
};

/** Numune planı: 2 sınıflı (m = M), 3 sınıflı (m < M), ya da n/c verilmemiş günlük ortalama */
export function planTuru(s: MikroKriter): '2 sınıflı' | '3 sınıflı' | 'günlük ortalama' {
  if (!s.n && !s.c) return 'günlük ortalama';
  return s.tek_limit ? '2 sınıflı' : '3 sınıflı';
}
/** Limit metninde birim yazmıyorsa Ek-1 dipnot 2 gereği kob/g-mL'dir (gösterimde not düşülür). */
export function birimYazili(v: string): boolean {
  return /kob|ems|mg\/kg|log|bulunmamal/i.test(v);
}

/** Aşamalı c: bugün geçerli değer ve sıradakiler. "31.12.2025 sonrası" = o gün hariç, ertesi günden itibaren. */
export function gecerliC(s: MikroKriter, bugun: string): { simdi: string; ileri: { c: string; tarih: string }[] } {
  if (!s.c_asamali?.length) return { simdi: s.c, ileri: [] };
  const t = (x: { tarih: string }) => iso((/(\d{2}\.\d{2}\.\d{4})/.exec(x.tarih) || [])[1] || '');
  const sirali = s.c_asamali.slice().sort((a, b) => (t(a) || '0000') < (t(b) || '0000') ? -1 : 1);
  let simdi = s.c; const ileri: { c: string; tarih: string }[] = [];
  for (const x of sirali) { const d = t(x); if (!d || d < bugun) simdi = x.c; else ileri.push(x); }
  return { simdi, ileri };
}

export function mikroDurum(s: MikroKriter): Kayit['durum'] {
  return s.durum === 'eslesti' ? 'eslesti' : s.durum === 'guncel' ? 'guncel' : 'okundu';
}

/** Mikroorganizma metni → aile adı (her metin tam bir aileye bağlı olmalı) */
export function aileHaritasi(a: MikroAileleri): Map<string, string> {
  const m = new Map<string, string>();
  for (const x of a.aileler) for (const ad of x.adlar) m.set(ad, x.ad);
  return m;
}

/** Arama için ortak Kayit biçimi */
export function mikroKayitlari(satirlar: MikroKriter[], aileler: MikroAileleri, sayfalar: Record<string, number> = {}): Kayit[] {
  const harita = aileHaritasi(aileler);
  return satirlar.map(s => ({
    id: s.id, madde: s.madde, sayfa: sayfalar[s.id] || 0, kaynak: 'mk', tur: mikroTur(s.ek),
    urun: s.urun_ifadesi, kat: s.kategori, istisna: '', aile: harita.get(s.mikroorganizma) || s.mikroorganizma, grup: aileler.grup,
    dipnot: [], not: s.uyari ? [s.uyari] : [], analitler: [{ ad: s.mikroorganizma, degerler: [] }], durum: mikroDurum(s), mikro: s
  }));
}

/** Ek-1 verisine mikrobiyolojik kriterleri ve ortak sınıflandırma eklerini ekler (girdi nesneleri değişmez). */
export function birlesikVeri(ek1: Veri, mikro: Kayit[], aileler: MikroAileleri, sinif: SiniflandirmaEki): Veri {
  const urunler: Record<string, UrunBilgisi> = {};
  for (const [u, b] of Object.entries(ek1.urunler)) urunler[u] = { ust: b.ust.concat(sinif.ustEkle[u] || []), es: b.es.slice() };
  for (const [u, b] of Object.entries(sinif.urunler)) if (!urunler[u]) urunler[u] = { ust: b.ust.slice(), es: b.es.slice() };
  const katEs: Record<string, string[]> = { ...ek1.katEs };
  for (const [k, v] of Object.entries(sinif.katEs)) katEs[k] = (katEs[k] || []).concat(v);
  const aileEs: Record<string, string[]> = { ...ek1.aileEs };
  for (const a of aileler.aileler) aileEs[a.ad] = a.es;
  const mikroAileleri: Aile[] = aileler.aileler.map(a => ({ onek: '', ad: a.ad, grup: aileler.grup }));
  return {
    ...ek1, kayitlar: ek1.kayitlar.concat(mikro), aileler: ek1.aileler.concat(mikroAileleri),
    urunler, katEs, aileEs, grupEs: { ...ek1.grupEs, [aileler.grup]: aileler.grupEs }
  };
}

/** Tablo bazlı "dipnotlar" ve "sonuçların değerlendirilmesi" anahtarı: Ek-1, Ek-3 ya da "Ek-2 (2.1. …)" */
export function tabloAnahtari(s: MikroKriter, anahtarlar: string[]): string {
  if (s.ek !== 'Ek-2') return s.ek;
  const bolum = s.madde.split('.').slice(0, 2).join('.') + '.';
  return anahtarlar.find(k => k.startsWith('Ek-2 (' + bolum)) || 'Ek-2';
}
