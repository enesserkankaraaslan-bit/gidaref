/* ===== Kontrol modu çekirdeği (DOM'dan bağımsız) =====
 * İkinci kontrol kararları yalnız eklenerek büyüyen bir geçmişte tutulur (data/ek1/kontrol_gecmisi.jsonl).
 * "Eşleşti" kararları `kontrol:uygula` ile veriye işlenir; "düzelt" kararları hiçbir zaman otomatik işlenmez. */
import type { Kayit, Veri } from './tipler';

/** Kontrol edilen tek değer satırı (ek1_satirlar.jsonl'deki bir satırın karşılığı) */
export interface KontrolSatiri {
  anahtar: string;
  kayitId: string;
  madde: string;
  sayfa: number;
  urun: string;
  analit: string;
  deger: string;
  birim: string;
  esas: string;
  tarih: string;
  istisna: string;
  dipnot: string[];
  not: string[];
  /** Verideki madde grubunun durumu (eslesti ise satır zaten iki kez kontrol edilmiş sayılır) */
  veriDurumu: Kayit['durum'];
}

export type KontrolKarari = 'eslesti' | 'duzelt';
/** Düzeltilebilecek alanlar: yalnız belgede yazanlar (kategori bizim etiketimizdir, burada yok). */
export const DUZELTILEBILIR = ['urun', 'analit', 'deger', 'birim', 'esas', 'tarih', 'istisna', 'sayfa', 'dipnot', 'not'] as const;
export type DuzeltilebilirAlan = typeof DUZELTILEBILIR[number];

export interface KontrolKaydi {
  anahtar: string;
  madde: string;
  sayfa: number;
  karar: KontrolKarari;
  alan?: DuzeltilebilirAlan;
  eski?: string;
  yeni?: string;
  not?: string;
  kontrol_eden: string;
  /** ISO 8601 zaman damgası */
  zaman: string;
}

export type SatirDurumu = 'bekliyor' | 'eslesti' | 'duzeltme';

/** Satır kimliği: madde + ürün ifadesi + analit + tarih (veri dosyasına yeni alan eklemeden tekil). */
export function satirAnahtari(madde: string, urun: string, analit: string, tarih: string): string {
  return [madde, urun, analit, tarih].join(' ¦ ');
}

export function kontrolSatirlari(veri: Veri): KontrolSatiri[] {
  const out: KontrolSatiri[] = [];
  for (const k of veri.kayitlar) {
    if (k.kaynak !== 'e1') continue;
    for (const a of k.analitler) for (const v of a.degerler) {
      out.push({
        anahtar: satirAnahtari(k.madde, k.urun, a.ad, v.t), kayitId: k.id, madde: k.madde, sayfa: k.sayfa,
        urun: k.urun, analit: a.ad, deger: v.d, birim: v.b, esas: v.e, tarih: v.t,
        istisna: k.istisna, dipnot: k.dipnot, not: k.not, veriDurumu: k.durum
      });
    }
  }
  return out;
}

/** Her satır için en son karar (zaman sırasına göre; eşit zamanda geçmişteki sıra). */
export function sonKararlar(gecmis: KontrolKaydi[]): Map<string, KontrolKaydi> {
  const m = new Map<string, KontrolKaydi>();
  gecmis.map((k, i) => ({ k, i })).sort((a, b) => a.k.zaman < b.k.zaman ? -1 : a.k.zaman > b.k.zaman ? 1 : a.i - b.i)
    .forEach(({ k }) => m.set(k.anahtar, k));
  return m;
}

export function satirDurumu(s: KontrolSatiri, son: Map<string, KontrolKaydi>): SatirDurumu {
  const k = son.get(s.anahtar);
  if (k) return k.karar === 'eslesti' ? 'eslesti' : 'duzeltme';
  return s.veriDurumu === 'eslesti' || s.veriDurumu === 'guncel' ? 'eslesti' : 'bekliyor';
}

const kayitKimligi = (k: KontrolKaydi) => JSON.stringify([k.anahtar, k.karar, k.alan ?? '', k.yeni ?? '', k.kontrol_eden, k.zaman]);

/** Yalnız ekleyerek birleştirir: mevcut kayıtlar aynı sırada kalır, aynı kayıt ikinci kez eklenmez. */
export function gecmisBirlestir(mevcut: KontrolKaydi[], yeni: KontrolKaydi[]): { gecmis: KontrolKaydi[]; eklenen: KontrolKaydi[] } {
  const gorulen = new Set(mevcut.map(kayitKimligi));
  const eklenen: KontrolKaydi[] = [];
  for (const k of yeni) { const id = kayitKimligi(k); if (!gorulen.has(id)) { gorulen.add(id); eklenen.push(k); } }
  return { gecmis: mevcut.concat(eklenen), eklenen };
}

/** Bir dosyadan gelen kaydın şekli doğru mu? (elle düzenlenmiş ya da bozuk dosyalara karşı) */
export function kayitGecerli(x: unknown): x is KontrolKaydi {
  const k = x as KontrolKaydi;
  return !!k && typeof k.anahtar === 'string' && typeof k.madde === 'string' && typeof k.sayfa === 'number'
    && (k.karar === 'eslesti' || (k.karar === 'duzelt' && !!k.alan && (DUZELTILEBILIR as readonly string[]).includes(k.alan) && typeof k.yeni === 'string'))
    && typeof k.kontrol_eden === 'string' && k.kontrol_eden.trim().length > 0 && typeof k.zaman === 'string' && !isNaN(Date.parse(k.zaman));
}
export function jsonlOku(metin: string): KontrolKaydi[] {
  return metin.split(/\r?\n/).filter(l => l.trim()).map((l, i) => {
    let x: unknown; try { x = JSON.parse(l); } catch { throw new Error((i + 1) + '. satır JSON değil'); }
    if (!kayitGecerli(x)) throw new Error((i + 1) + '. satır geçerli bir kontrol kaydı değil');
    return x;
  });
}
export function jsonlYaz(kayitlar: KontrolKaydi[]): string { return kayitlar.map(k => JSON.stringify(k)).join('\n') + (kayitlar.length ? '\n' : ''); }

export interface UygulamaPlani {
  /** Tüm değerleri eşleşmiş, durumu okundu → eslesti olacak madde grupları (kayıt kimliği) */
  eslesenGruplar: string[];
  /** CSV'de "belgeyle eşleşti" olacak satır anahtarları */
  eslesenSatirlar: string[];
  /** Otomatik işlenmeyen düzeltme önerileri (her satırın son kararı düzelt olanlar) */
  duzeltmeler: KontrolKaydi[];
  /** Geçmişte olup veride karşılığı bulunmayan anahtarlar */
  bilinmeyen: string[];
}

/** Hangi değişikliklerin yapılacağını hesaplar; veriye dokunmaz. "guncel" durumuna asla geçirmez. */
export function uygulamaPlani(veri: Veri, gecmis: KontrolKaydi[]): UygulamaPlani {
  const satirlar = kontrolSatirlari(veri), son = sonKararlar(gecmis);
  const bilinen = new Set(satirlar.map(s => s.anahtar));
  const eslesenSatirlar = satirlar.filter(s => satirDurumu(s, son) === 'eslesti').map(s => s.anahtar);
  const es = new Set(eslesenSatirlar);
  const gruplar = new Map<string, KontrolSatiri[]>();
  satirlar.forEach(s => (gruplar.get(s.kayitId) || gruplar.set(s.kayitId, []).get(s.kayitId)!).push(s));
  const eslesenGruplar = [...gruplar].filter(([, ss]) => ss[0].veriDurumu === 'okundu' && ss.every(s => es.has(s.anahtar))).map(([id]) => id);
  return {
    eslesenGruplar, eslesenSatirlar,
    duzeltmeler: [...son.values()].filter(k => k.karar === 'duzelt' && bilinen.has(k.anahtar)),
    bilinmeyen: [...new Set(gecmis.map(k => k.anahtar))].filter(a => !bilinen.has(a))
  };
}

/* --- Dosya biçimini koruyan yazıcılar (kontrol:uygula betiği için) --- */

/** Python json.dump(ensure_ascii=False) biçimi: ", " ve ": " ayırıcılar, tek satır. */
export function pyJson(x: unknown): string {
  if (Array.isArray(x)) return '[' + x.map(pyJson).join(', ') + ']';
  if (x && typeof x === 'object') return '{' + Object.entries(x as Record<string, unknown>).map(([k, v]) => JSON.stringify(k) + ': ' + pyJson(v)).join(', ') + '}';
  return JSON.stringify(x);
}

/** Tek CSV satırı (tırnaklı alanlar dahil) */
export function csvAyristir(satir: string): string[] {
  const out: string[] = []; let f = '', q = false;
  for (let i = 0; i < satir.length; i++) {
    const c = satir[i];
    if (q) { if (c === '"') { if (satir[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { out.push(f); f = ''; } else f += c;
  }
  out.push(f);
  return out;
}
/** Python csv.writer QUOTE_MINIMAL: virgül, tırnak ya da satır sonu içeren alan tırnaklanır. */
export function csvYaz(alanlar: string[]): string {
  return alanlar.map(a => /[",\r\n]/.test(a) ? '"' + a.replace(/"/g, '""') + '"' : a).join(',');
}
export const CSV_ESLESTI = 'belgeyle eşleşti (2. okuma)';
