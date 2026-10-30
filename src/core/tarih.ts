/* ===== Tarih: bugün geçerli değer ve sıradaki değer; doğrulama durumu ===== */
import type { Deger, Kayit } from './tipler';

export function iso(t: string): string { const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(t || ''); return m ? m[3] + '-' + m[2] + '-' + m[1] : ''; }

export interface GecerliDeger { simdi: Deger | null; sonraki: Deger | null; ileri: Deger[]; onceki: Deger[] }
/** bugun: YYYY-AA-GG. Tarihsiz değer başlangıç değeridir. */
export function gecerliDeger(degerler: Deger[], bugun: string): GecerliDeger {
  const sirali = degerler.slice().sort((a, b) => (iso(a.t) || '0000') < (iso(b.t) || '0000') ? -1 : 1);
  let simdi: Deger | null = null, sonraki: Deger | null = null; const onceki: Deger[] = [];
  for (const v of sirali) {
    const t = iso(v.t);
    if (!t || t <= bugun) { if (simdi) onceki.push(simdi); simdi = v; }
    else if (!sonraki) sonraki = v;
  }
  const ileri = sirali.filter(v => iso(v.t) > bugun);
  return { simdi, sonraki, ileri, onceki };
}
export function tarihYaz(t: string): string { return t ? t + '’ten itibaren' : ''; }

export interface Durum { ton: 'ok' | 'bekle'; baslik: string; metin: string }
/** Doğrulama kapısı: "güncel" yalnız guncellik alanı doluysa. */
export function durumOf(k: Kayit): Durum {
  if (k.guncellik) return { ton: 'ok', baslik: 'Güncel yürürlük teyit edildi', metin: k.guncellik };
  if (k.durum === 'eslesti') return { ton: 'ok', baslik: 'Belgeyle iki kez eşleşti.', metin: 'Hukuki güncellik onayı yok.' };
  return { ton: 'bekle', baslik: 'Sayfadan bir kez okundu.', metin: 'İkinci kontrol ve hukuki güncellik onayı bekliyor.' };
}
