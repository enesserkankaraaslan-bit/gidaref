/* ===== Veri şeması (data/ek1/gidaref_kayitlar_v2.json) ===== */

/** Tek bir değer: d = değer ("8,0", "1 250" ya da "–"), b = birim, e = ölçüm esası, t = itibaren tarihi (GG.AA.YYYY, boşsa başlangıç değeri). */
export interface Deger { d: string; b: string; e: string; t: string }
export interface Analit { ad: string; degerler: Deger[] }

/** e1 = Bulaşanlar Ek-1, tl = Bakanlık talimatı Ek-2, mk = Mikrobiyolojik Kriterler Yönetmeliği */
export type KaynakKodu = 'e1' | 'tl' | 'mk';
/** limit = Ek-1 resmî maksimum limit; karsilastirma = Bakanlık talimatı Ek-2 karşılaştırma değeri. Asla karıştırılmaz.
 * mikro_* = Mikrobiyolojik Kriterler Yönetmeliği Ek-1 (gıda güvenilirliği), Ek-2 (üretim hijyeni), Ek-3 (genel patojen limitleri). */
export type KayitTuru = 'limit' | 'karsilastirma' | 'mikro_guvenilirlik' | 'mikro_hijyen' | 'mikro_patojen';
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
  /** Yalnız kaynak 'mk': mikrobiyolojik kriter satırı (dosyadaki haliyle) */
  mikro?: MikroKriter;
}

/** data/mikro/mikrobiyolojik_kriterler.jsonl satırı — dosyadaki haliyle; değerler metin olarak, sayıya çevrilmez. */
export interface MikroKriter {
  id: string;
  ek: 'Ek-1' | 'Ek-2' | 'Ek-3';
  tablo: string;
  madde: string;
  ust_baslik: string;
  urun_ifadesi: string;
  kategori: string[];
  mikroorganizma: string;
  /** numune planı; n ve c boşsa limit günlük ortalamadır (Ek-2 2.1.1, 2.1.2) */
  n: string;
  c: string;
  m: string;
  M: string;
  tek_limit: boolean;
  limit_turu: 'sayısal' | 'yokluk';
  /** aşamalı c (yalnız 2.1.9); tarih "" = başlangıç, "GG.AA.YYYY sonrası" = o günden sonra */
  c_asamali?: { c: string; tarih: string }[];
  metot: string;
  basamak: string;
  tedbir: string;
  dipnot: string[];
  dipnot_metinleri: string[];
  uyari: string;
  durum: 'tek_okuma' | 'eslesti' | 'guncel';
  kaynak: string;
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
