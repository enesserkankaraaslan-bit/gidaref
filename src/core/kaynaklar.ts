import type { KaynakKodu } from './tipler';

/** sayfalar: görüntüsü olan sayfalar (JPG numarası = PDF sayfa numarası); pdf: public/kaynaklar altındaki orijinal PDF */
export interface Kaynak { ad: string; sayfalar: number[]; pdf: string }

/** Sayfa görüntüleri: public/sayfalar/<kaynak>/<sayfa>.jpg */
export const KAYNAKLAR: Record<KaynakKodu, Kaynak> = {
  e1: { ad: 'Bulaşanlar Yönetmeliği Ek-1', sayfalar: Array.from({ length: 45 }, (_, i) => i + 1), pdf: 'ek1.pdf' },
  tl: { ad: 'Bakanlık Bulaşanlar Talimatı Ek-2', sayfalar: [9, 10, 14, 15], pdf: 'talimat.pdf' },
  /* Resmî PDF henüz eklenmedi: sayfa görüntüsü yok, kontrol modunda "Eşleşti" kapalı */
  mk: { ad: 'Mikrobiyolojik Kriterler Yönetmeliği', sayfalar: [], pdf: '' }
};

export function sayfaYolu(kaynak: KaynakKodu, sayfa: number): string { return 'sayfalar/' + kaynak + '/' + sayfa + '.jpg'; }
export function pdfYolu(kaynak: KaynakKodu): string { return 'kaynaklar/' + KAYNAKLAR[kaynak].pdf; }
