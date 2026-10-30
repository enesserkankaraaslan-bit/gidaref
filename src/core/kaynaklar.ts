import type { KaynakKodu } from './tipler';

export interface Kaynak { ad: string; sayfalar: number[] }

/** Sayfa görüntüleri: public/sayfalar/<kaynak>/<sayfa>.jpg */
export const KAYNAKLAR: Record<KaynakKodu, Kaynak> = {
  e1: { ad: 'Bulaşanlar Yönetmeliği Ek-1', sayfalar: Array.from({ length: 45 }, (_, i) => i + 1) },
  tl: { ad: 'Bakanlık Bulaşanlar Talimatı Ek-2', sayfalar: [9, 10, 14, 15] }
};

export function sayfaYolu(kaynak: KaynakKodu, sayfa: number): string { return 'sayfalar/' + kaynak + '/' + sayfa + '.jpg'; }
