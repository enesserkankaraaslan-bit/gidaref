/* ===== Veri şeması (data/ek1/gidaref_kayitlar_v2.json) ===== */

/** Tek bir değer: d = değer ("8,0", "1 250" ya da "–"), b = birim, e = ölçüm esası, t = itibaren tarihi (GG.AA.YYYY, boşsa başlangıç değeri). */
export interface Deger { d: string; b: string; e: string; t: string }
export interface Analit { ad: string; degerler: Deger[] }

export type KaynakKodu = 'e1' | 'tl';
/** limit = Ek-1 resmî maksimum limit; karsilastirma = Bakanlık talimatı Ek-2 karşılaştırma değeri. Asla karıştırılmaz. */
export type KayitTuru = 'limit' | 'karsilastirma';
/** okundu = tek okuma, eslesti = iki kez kontrol, guncel = hukuki güncellik teyitli. */
export type KayitDurumu = 'okundu' | 'eslesti' | 'guncel';

export interface Kayit {
  id: string;
  madde: string;
  sayfa: number;
  kaynak: KaynakKodu;
  tur: KayitTuru;
  urun: string;
  kat: string[];
  istisna: string;
  aile: string;
  grup: string;
  dipnot: string[];
  not: string[];
  analitler: Analit[];
  durum: KayitDurumu;
  /** Koşullu istisna (ör. 1.1.12): daha özel satıra yönlendirse de gizlenmez. */
  kismi?: boolean;
  /** Doğrulama kapısı: teyit tarihi + kaynak. Dolmadıkça kayıt "güncel" gösterilmez. */
  guncellik?: string;
}

export interface Aile { onek: string; ad: string; grup: string }
export interface UrunBilgisi { ust: string[]; es: string[] }

export interface Veri {
  kayitlar: Kayit[];
  dipnotlar: Record<string, string>;
  aileler: Aile[];
  urunler: Record<string, UrunBilgisi>;
  katEs: Record<string, string[]>;
  aileEs: Record<string, string[]>;
  grupEs: Record<string, string[]>;
  oneriler: string[];
}
