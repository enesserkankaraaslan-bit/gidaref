/* ===== Türkçe normalleştirme, ek atma, ünsüz yumuşaması ===== */

const DURDURMA = new Set(['ve', 'ile', 'icin', 'de', 'da', 'mi', 'mu', 'bir', 'nedir', 'limit', 'limiti', 'limitleri']);
const EKLER = ['lerinden', 'larindan', 'lerinde', 'larinda', 'lerden', 'lardan', 'lerde', 'larda', 'lerin', 'larin', 'leri', 'lari', 'nden', 'ndan', 'inde', 'inda', 'nin', 'nun', 'ten', 'tan', 'den', 'dan', 'ler', 'lar', 'te', 'ta', 'de', 'da', 'si', 'i', 'u'];

export interface Token { w: string; g: string }

export function norm(s: unknown): string {
  return String(s == null ? '' : s).replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
export function yumusat(w: string): string { return w.length > 2 ? w.replace(/g$/, 'k').replace(/b$/, 'p').replace(/d$/, 't') : w; }
export function govde(w: string): string { return yumusat(govdeHam(w)); }
export function govdeHam(w: string): string {
  if (w.length < 3 || /^\d/.test(w)) return w;
  for (const e of EKLER) {
    if (!w.endsWith(e)) continue;
    const k = w.length - e.length;
    if (e.length === 1 && w.length >= 3 && k >= 2) return w.slice(0, k);
    if (e.length === 2 && w.length >= 4 && k >= 2) return w.slice(0, k);
    if (e.length >= 3 && k >= 3) return w.slice(0, k);
  }
  return w;
}
export function kelimeler(s: unknown): string[] { return norm(s).split(' ').filter(w => w && !DURDURMA.has(w)); }
export function tokenler(s: unknown): Token[] { return kelimeler(s).map(w => ({ w, g: govde(w) })); }
export function eslesir(q: Token, r: Token, onek?: number): boolean {
  if (q.w === r.w || q.g === r.g) return true;
  return !!(onek && q.w.length >= onek && (r.w.startsWith(q.w) || r.g.startsWith(q.w)));
}
/** parca'nın tüm kelimeleri (gövde) tumu içinde var mı */
export function icerir(tumu: Token[], parca: Token[]): boolean {
  return parca.length > 0 && parca.every(p => tumu.some(t => t.g === p.g));
}
