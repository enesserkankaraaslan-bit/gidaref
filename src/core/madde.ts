/* ===== Madde numaraları: sıralama ve istisna metnindeki atıflar ===== */

export interface MaddeRef { bas: string; son: string }

function maddeAnahtar(m: string): number[] { return m.split('.').map(Number); }
export function maddeKarsilastir(a: string, b: string): number {
  const x = maddeAnahtar(a), y = maddeAnahtar(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const p = x[i] === undefined ? -1 : x[i], q = y[i] === undefined ? -1 : y[i];
    if (p !== q) return p - q;
  }
  return 0;
}
/** "1.1.10 ile 1.1.11", "3.1.1-3.1.3" aralıkları ve tek madde atıfları */
export function maddeRefleri(s: string): MaddeRef[] {
  const out: MaddeRef[] = []; if (!s) return out;
  const aralik = /(\d+(?:\.\d+)+)\s*(?:ile|-|–)\s*(\d+(?:\.\d+)+)/g; let m: RegExpExecArray | null;
  const kullanilan: [number, number][] = [];
  while ((m = aralik.exec(s))) { out.push({ bas: m[1], son: m[2] }); kullanilan.push([m.index, m.index + m[0].length]); }
  const tek = /\d+(?:\.\d+)+/g;
  while ((m = tek.exec(s))) { const i = m.index; if (!kullanilan.some(([a, b]) => i >= a && i < b)) out.push({ bas: m[0], son: m[0] }); }
  return out;
}
/** madde, ref aralığında mı (alt maddeler dahil) */
export function refeUyar(madde: string, ref: MaddeRef): boolean {
  if (madde === ref.bas || madde.startsWith(ref.bas + '.')) return true;
  if (ref.bas === ref.son) return false;
  return maddeKarsilastir(madde, ref.bas) >= 0 && (maddeKarsilastir(madde, ref.son) <= 0 || madde.startsWith(ref.son + '.'));
}
