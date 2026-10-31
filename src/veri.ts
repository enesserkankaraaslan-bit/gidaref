/* Veri kaynakları (değerler burada kopyalanmaz):
 * - data/ek1/gidaref_kayitlar_v2.json: Bulaşanlar Ek-1 + talimat + Ek-1 ürün sınıflandırması
 * - data/mikro/: Mikrobiyolojik Kriterler Yönetmeliği satırları, mikroorganizma aileleri, dipnot/değerlendirme
 * - data/ortak/urun_siniflandirmasi_ek.json: ortak ürün sınıflandırmasına ekler */
import ham from '../data/ek1/gidaref_kayitlar_v2.json';
import mikroHam from '../data/mikro/mikrobiyolojik_kriterler.jsonl?raw';
import mikroAileleriHam from '../data/mikro/mikroorganizma_aileleri.json';
import dipnotHam from '../data/mikro/mikrobiyolojik_kriterler_dipnot_ve_degerlendirme.json';
import sinifEkHam from '../data/ortak/urun_siniflandirmasi_ek.json';
import type { MikroKriter, Veri } from './core/tipler';
import { birlesikVeri, mikroJsonlOku, mikroKayitlari, type MikroAileleri, type SiniflandirmaEki } from './core/mikro';

/** Yalnız Bulaşanlar (Ek-1 + talimat): prototipin kabul testleri bu veriyle çalışır. */
export const VERI = ham as unknown as Veri;
export const MIKRO_SATIRLAR: MikroKriter[] = mikroJsonlOku(mikroHam);
export const MIKRO_AILELERI = mikroAileleriHam as unknown as MikroAileleri;
export const MIKRO_DIPNOT = dipnotHam as unknown as { dipnotlar: Record<string, string[]>; analiz_sonuclarinin_degerlendirilmesi: Record<string, string[]> };
export const SINIFLANDIRMA_EKI = sinifEkHam as unknown as SiniflandirmaEki;
/** Uygulamanın aradığı birleşik veri: bulaşanlar + mikrobiyolojik kriterler, ortak ürün sınıflandırması */
export const BIRLESIK_VERI: Veri = birlesikVeri(VERI, mikroKayitlari(MIKRO_SATIRLAR, MIKRO_AILELERI), MIKRO_AILELERI, SINIFLANDIRMA_EKI);
