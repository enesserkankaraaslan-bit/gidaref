/* ===== Arama çekirdeği (DOM'dan bağımsız) — prototipteki davranışın birebir taşınmış hali ===== */
import type { Kayit, Veri } from './tipler';
import { eslesir, icerir, norm as N, tokenler, type Token } from './normalize';
import { maddeKarsilastir, maddeRefleri, refeUyar, type MaddeRef } from './madde';

export interface DizinKaydi { k: Kayit; kat: string[]; urunT: Token[]; istisnaT: Token[]; tamT: Token[]; refler: MaddeRef[] }
export type TerimTuru = 'urun' | 'kategori' | 'aile' | 'grup';
interface Terim { tur: TerimTuru; anahtar: string; f: Token[] }
export interface SorguUrunu { anahtar: string; tur: 'urun' | 'kategori' }
export interface Cozumleme { qt: Token[]; urunler: SorguUrunu[]; aileler: Set<string>; kalan: Token[] }

/** seviye 1 = doğrudan, 2 = üst kategori, 3 = istisnayı kontrol edin, 0 = daha özel satır var (gizlenir) */
export interface Baglanti { seviye: 0 | 1 | 2 | 3; ust: string | null; ozel?: string }
export interface SonucBaglantisi extends Baglanti { urun: string }
export interface Sonuc { d: Kayit; bag: SonucBaglantisi | null }
export type AramaModu = 'bos' | 'urun' | 'aile' | 'metin';
/** genel: ürün aramasında Ek-3 genel patojen limitleri (ürüne özgü kriterlerden ayrı gösterilir) */
export interface AramaSonucu extends Cozumleme { sonuc: Sonuc[]; gizlenen: number; mod: AramaModu; genel: Sonuc[] }

export interface Aday { ad: string; sorgu: string; tur: string; rank: number; formlar: Token[][] }

export interface AramaDizini {
  kayitlar: DizinKaydi[];
  cozumle(sorgu: string): Cozumleme;
  urunBagla(d: DizinKaydi, u: string): Baglanti | null;
  ara(sorgu: string): AramaSonucu;
  tamamla(sorgu: string, sinir?: number): Aday[];
}

export function aramaDizini(DATA: Veri): AramaDizini {
  const AILE_SIRA: Record<string, number> = {}; DATA.aileler.forEach((a, i) => AILE_SIRA[a.ad] = i);
  ['Nikel', 'Akrilamid', 'Alternaria toksinleri'].forEach((a, i) => AILE_SIRA[a] = 100 + i);

  /* --- kayıt dizini --- */
  const KAYITLAR: DizinKaydi[] = DATA.kayitlar.map(k => ({
    k,
    kat: k.kat.map(N),
    urunT: tokenler(k.urun),
    istisnaT: tokenler(k.istisna),
    tamT: tokenler([k.urun, k.kat.join(' '), k.aile, k.analitler.map(a => a.ad).join(' '), k.not.join(' ')].join(' ')),
    refler: maddeRefleri(k.istisna)
  }));
  /* madde numaraları kaynak içinde anlamlıdır (Ek-1 1.1.1 ≠ mikrobiyolojik 1.1.1) */
  const MADDE_INDEX: Record<string, Record<string, DizinKaydi[]>> = {};
  KAYITLAR.forEach(d => { const k = (MADDE_INDEX[d.k.kaynak] = MADDE_INDEX[d.k.kaynak] || {}); (k[d.k.madde] = k[d.k.madde] || []).push(d); });

  /* --- terimler: ürün, kategori, bulaşan ailesi, grup --- */
  const URUN_ADLARI = Object.keys(DATA.urunler);
  const URUN_N = new Set(URUN_ADLARI.map(N));
  const TERIMLER: Terim[] = (function () {
    const t: Terim[] = [];
    const ekle = (tur: TerimTuru, anahtar: string, metin: string) => { const f = tokenler(metin); if (f.length) t.push({ tur, anahtar, f }); };
    for (const u of URUN_ADLARI) { ekle('urun', u, u); DATA.urunler[u].es.forEach(e => ekle('urun', u, e)); }
    const tumKat = new Set<string>(); DATA.kayitlar.forEach(k => k.kat.forEach(x => tumKat.add(x)));
    for (const k of tumKat) { if (!URUN_N.has(N(k))) ekle('kategori', k, k); }
    for (const k in DATA.katEs) DATA.katEs[k].forEach(e => ekle('kategori', k, e));
    for (const a in DATA.aileEs) { ekle('aile', a, a); DATA.aileEs[a].forEach(e => ekle('aile', a, e)); }
    for (const g in DATA.grupEs) { ekle('grup', g, g); DATA.grupEs[g].forEach(e => ekle('grup', g, e)); }
    return t;
  })();

  function cozumle(sorgu: string): Cozumleme {
    const qt = tokenler(sorgu);
    const urunler: SorguUrunu[] = [], aileler = new Set<string>(), kalan: Token[] = [];
    let i = 0;
    while (i < qt.length) {
      let en: Terim | null = null;
      for (const t of TERIMLER) {
        const L = t.f.length; if (i + L > qt.length) continue;
        let ok = true; for (let j = 0; j < L; j++) { if (qt[i + j].g !== t.f[j].g && qt[i + j].w !== t.f[j].w) { ok = false; break; } }
        if (ok && (!en || L > en.f.length || (L === en.f.length && en.tur !== 'urun' && t.tur === 'urun'))) en = t;
      }
      if (!en) { kalan.push(qt[i]); i++; continue; }
      const bulunan = en;
      if (bulunan.tur === 'urun' || bulunan.tur === 'kategori') { if (!urunler.some(u => u.anahtar === bulunan.anahtar)) urunler.push({ anahtar: bulunan.anahtar, tur: bulunan.tur }); }
      else if (bulunan.tur === 'aile') aileler.add(bulunan.anahtar);
      else DATA.aileler.filter(a => a.grup === bulunan.anahtar).forEach(a => aileler.add(a.ad));
      i += bulunan.f.length;
    }
    return { qt, urunler, aileler, kalan };
  }

  /* --- ürün eşleştirme: doğrudan / üst kategori / istisna --- */
  function dogrudan(d: DizinKaydi, u: string): boolean { return d.kat.includes(N(u)); }
  function urunBagla(d: DizinKaydi, u: string): Baglanti | null {
    const un = N(u), bilgi = DATA.urunler[u];
    if (d.kat.includes(un)) return { seviye: 1, ust: null };
    const ust = bilgi ? bilgi.ust : [];
    const ortak = ust.find(p => d.kat.includes(N(p)));
    if (!ortak) return null;
    /* satır başka belirli bir ürüne özgü mü? (ürün adı satır metninde geçiyorsa) */
    const ustN = new Set(ust.map(N));
    for (const t of d.kat) {
      if (t === un || ustN.has(t) || !URUN_N.has(t)) continue;
      if (icerir(d.urunT, tokenler(t))) return null;
    }
    /* istisna: daha özel satıra yönlendirme ya da ürün adı */
    if (d.refler.length) {
      const idx = MADDE_INDEX[d.k.kaynak];
      for (const r of d.refler) {
        for (const m in idx) { if (refeUyar(m, r) && idx[m].some(x => dogrudan(x, u))) return { seviye: d.k.kismi ? 3 : 0, ust: ortak, ozel: m }; }
      }
    }
    const adlar = [u].concat(bilgi ? bilgi.es : []);
    if (adlar.some(a => icerir(d.istisnaT, tokenler(a)))) return { seviye: 3, ust: ortak };
    return { seviye: 2, ust: ortak };
  }

  function ara(sorgu: string): AramaSonucu {
    const c = cozumle(sorgu);
    const sonuc: Sonuc[] = [], genel: Sonuc[] = []; let gizlenen = 0;
    const bos = !c.urunler.length && !c.aileler.size && !c.kalan.length;
    if (bos) return Object.assign(c, { sonuc, gizlenen, mod: 'bos' as const, genel });
    for (const d of KAYITLAR) {
      if (c.aileler.size && !c.aileler.has(d.k.aile)) continue;
      /* Ek-3 genel patojen limitleri belirli bir ürüne bağlı değildir: ürün aramasında ayrı listelenir */
      if (c.urunler.length && d.k.tur === 'mikro_patojen') {
        if (!c.kalan.length || c.kalan.every(q => d.tamT.some(t => eslesir(q, t, 4)))) genel.push({ d: d.k, bag: null });
        continue;
      }
      let bag: SonucBaglantisi | null = null;
      if (c.urunler.length) {
        let en: SonucBaglantisi | null = null;
        for (const u of c.urunler) {
          const b: Baglanti | null = u.tur === 'kategori' ? (dogrudan(d, u.anahtar) ? { seviye: 1, ust: null } : null) : urunBagla(d, u.anahtar);
          if (b && (!en || (b.seviye && (!en.seviye || b.seviye < en.seviye)))) en = Object.assign({ urun: u.anahtar }, b);
        }
        if (!en) continue;
        if (en.seviye === 0) { gizlenen++; continue; }
        bag = en;
      }
      if (c.kalan.length && !c.kalan.every(q => d.tamT.some(t => eslesir(q, t, 4)))) continue;
      sonuc.push({ d: d.k, bag });
    }
    const mod: AramaModu = c.urunler.length ? 'urun' : (c.aileler.size ? 'aile' : 'metin');
    const KAYNAK_SIRA: Record<string, number> = { e1: 0, tl: 1, mk: 2 };
    sonuc.sort((a, b) => {
      /* mikrobiyolojik kriterler bulaşan limitlerinden sonra, kendi içinde ek ve madde sırasıyla */
      const ma = a.d.kaynak === 'mk' ? 1 : 0, mb = b.d.kaynak === 'mk' ? 1 : 0; if (ma !== mb) return ma - mb;
      if (ma) { if (a.d.tur !== b.d.tur) return a.d.tur < b.d.tur ? -1 : 1; const m = maddeKarsilastir(a.d.madde, b.d.madde); return m || (a.d.id < b.d.id ? -1 : 1); }
      if (mod === 'urun') {
        const sa = a.bag!.seviye === 3 ? 1 : 0, sb = b.bag!.seviye === 3 ? 1 : 0; if (sa !== sb) return sa - sb;
        const fa = AILE_SIRA[a.d.aile], fb = AILE_SIRA[b.d.aile]; if (fa !== fb) return fa - fb;
      }
      if (a.d.kaynak !== b.d.kaynak) return KAYNAK_SIRA[a.d.kaynak] - KAYNAK_SIRA[b.d.kaynak];
      return maddeKarsilastir(a.d.madde, b.d.madde);
    });
    genel.sort((a, b) => maddeKarsilastir(a.d.madde, b.d.madde));
    return Object.assign(c, { sonuc, gizlenen, mod, genel });
  }

  /* --- tamamlama --- */
  const buyukHarf = (s: string) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
  const ADAYLAR: Aday[] = (function () {
    const l: Aday[] = [], g = new Set<string>();
    const ekle = (ad: string, tur: string, rank: number, formlar: Token[][]) => { const k = N(ad); if (g.has(k)) return; g.add(k); l.push({ ad, sorgu: ad, tur, rank, formlar }); };
    DATA.oneriler.forEach((o, i) => ekle(o, 'Öneri', 200 - i, [tokenler(o)]));
    for (const a in DATA.aileEs) ekle(a, 'Bulaşan', 120, [a].concat(DATA.aileEs[a]).map(tokenler));
    for (const gr in DATA.grupEs) ekle(gr, 'Bulaşan grubu', 110, [gr].concat(DATA.grupEs[gr]).map(tokenler));
    for (const u of URUN_ADLARI) ekle(buyukHarf(u), 'Ürün', 100, [u].concat(DATA.urunler[u].es).map(tokenler));
    const katlar = new Set<string>(); DATA.kayitlar.forEach(k => k.kat.forEach(x => katlar.add(x)));
    for (const k of katlar) if (!URUN_N.has(N(k))) ekle(buyukHarf(k), 'Ürün grubu', 90, [k].concat(DATA.katEs[k] || []).map(tokenler));
    return l;
  })();
  function tamamla(sorgu: string, sinir?: number): Aday[] {
    const qt = tokenler(sorgu); if (!qt.length) return [];
    const son = qt[qt.length - 1], once = qt.slice(0, -1);
    const out = ADAYLAR.filter(a => a.formlar.some(f => once.every(q => f.some(t => eslesir(q, t, 0))) && f.some(t => eslesir(son, t, 3))));
    out.sort((x, y) => y.rank - x.rank || x.ad.localeCompare(y.ad, 'tr'));
    return out.slice(0, sinir || 7);
  }

  return { kayitlar: KAYITLAR, cozumle, urunBagla, ara, tamamla };
}
