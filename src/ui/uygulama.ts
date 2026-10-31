/* ===== Arayüz — prototipteki davranışın taşınmış hali ===== */
import {
  norm, gecerliDeger, tarihYaz, durumOf, KAYNAKLAR, sayfaYolu, MIKRO_KAYNAK, MIKRO_TUR_ADI, planTuru, birimYazili, gecerliC, tabloAnahtari,
  type AramaDizini, type Aday, type Analit, type KaynakKodu, type Sonuc, type Veri
} from '../core';
import { kabulTestleri, type KabulTesti } from '../kabul/testler';
import { MIKRO_DIPNOT } from '../veri';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: unknown) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const buyuk = (s: string) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
const gorselUrl = (k: KaynakKodu, n: number) => import.meta.env.BASE_URL + sayfaYolu(k, n);

export function baslat(dz: AramaDizini, DATA: Veri): void {
  const BUGUN = new Date().toISOString().slice(0, 10);
  const durum = { q: '', filtre: 'tumu', secili: -1, tamamlamalar: [] as Aday[], sinir: 40 };

  function ilkSatir() {
    const e1 = DATA.kayitlar.filter(k => k.kaynak === 'e1');
    const deger = e1.reduce((s, k) => s + k.analitler.reduce((t, a) => t + a.degerler.length, 0), 0);
    $('kapsamMetin').textContent = 'Bulaşanlar Yönetmeliği Ek-1’in 45 sayfasındaki ' + new Set(e1.map(k => k.madde)).size + ' maddenin tamamı (' + deger + ' limit değeri, 12 dipnot) ve Bakanlık talimatından 6 karşılaştırma değeri; Mikrobiyolojik Kriterler Yönetmeliği’nden ' + DATA.kayitlar.filter(k => k.kaynak === 'mk').length + ' kriter (Ek-1 gıda güvenilirliği, Ek-2 üretim hijyeni, Ek-3 genel patojen limitleri). Aşamalı limitlerde bugün geçerli değer ve sıradaki değer ayrı gösterilir.';
    $('hizliCipler').innerHTML = DATA.oneriler.slice(0, 6).map(s => '<button type="button" class="cip" data-sorgu="' + esc(s) + '">' + esc(s) + '</button>').join('');
  }
  function degerHtml(a: Analit) {
    const g = gecerliDeger(a.degerler, BUGUN);
    const esas = (v: { e: string }) => v.e ? ', ' + esc(v.e) : '';
    let h = '<div class="deger-satir"><span class="analit">' + esc(a.ad) + '</span>';
    if (g.simdi) {
      h += g.simdi.d === '–' ? '<span class="yok">Sabit limit yok; nota bakınız</span>'
        : '<span class="deger-ana"><span class="sayi-k">' + esc(g.simdi.d) + '</span><span class="birim-k">' + esc(g.simdi.b) + esas(g.simdi) + '</span></span>';
      if (g.simdi.t) h += '<span class="gecmis">' + esc(tarihYaz(g.simdi.t)) + ' geçerli</span>';
    } else if (g.sonraki) {
      h += '<span class="yok">Bu satır için henüz yürürlükte limit yok.</span>';
    }
    g.ileri.forEach(v => { h += '<span class="sonraki">' + esc(tarihYaz(v.t)) + ': ' + esc(v.d) + ' ' + esc(v.b) + esas(v) + '</span>'; });
    return h + '</div>';
  }
  function baglamHtml(r: Sonuc) {
    if (!r.bag) return '';
    const u = buyuk(r.bag.urun);
    if (r.bag.seviye === 1) return '<span class="baglam">Doğrudan: ' + esc(u) + '</span>';
    if (r.bag.seviye === 2) return '<span class="baglam">Üst kategori: ' + esc(r.bag.ust) + '</span>';
    return '<span class="baglam baglam-dikkat">İstisna içeriyor, kontrol edin</span>';
  }
  /* Mikrobiyolojik kriter kartı: n, c, m, M belgede yazdığı gibi; bulaşan limitinden ayrı tür ve renk */
  function mikroKart(r: Sonuc) {
    const k = r.d, s = k.mikro!, plan = planTuru(s), c = gecerliC(s, BUGUN);
    /* Bu veri Word metninden programla çekildi (görsel okuma değil); doğrulama kapısı aynı */
    const d = k.durum === 'okundu' ? { ton: 'bekle', baslik: 'Tek okuma (Word metninden programla çekildi).', metin: 'İkinci kontrol ve hukuki güncellik onayı bekliyor.' } : durumOf(k);
    const birim = (v: string) => birimYazili(v) ? '' : '<span class="birim-k">kob/g-mL</span>';
    let h = '<article class="kart kart-mikro">';
    h += '<div class="ust-satir"><span class="tur">' + esc(MIKRO_TUR_ADI[k.tur]) + '</span>' + baglamHtml(r) + '</div>';
    h += '<h3>' + esc(s.urun_ifadesi) + '</h3><p class="aile-ad">' + esc(s.mikroorganizma) + '</p>';
    h += '<div class="degerler"><div class="deger-satir">';
    h += '<span class="analit">' + (plan === 'günlük ortalama' ? 'Günlük ortalama değer (n ve c belirtilmemiş)' : 'Numune planı: ' + plan + ' · n = ' + esc(s.n) + ', c = ' + esc(c.simdi)) + '</span>';
    if (s.tek_limit) h += '<span class="deger-ana"><span class="mikro-limit">' + esc(s.m) + '</span>' + birim(s.m) + '</span>';
    else h += '<span class="deger-ana"><span class="mikro-et">m</span><span class="mikro-limit">' + esc(s.m) + '</span>' + birim(s.m) + '</span><span class="deger-ana"><span class="mikro-et">M</span><span class="mikro-limit">' + esc(s.M) + '</span>' + birim(s.M) + '</span>';
    c.ileri.forEach(x => { h += '<span class="sonraki">' + esc(x.tarih) + ': c = ' + esc(x.c) + '</span>'; });
    if (!birimYazili(s.m) || !birimYazili(s.M)) h += '<span class="gecmis">Birim yazılı değilse kob/g-mL’dir (Ek-1 dipnot 2).</span>';
    h += '</div></div>';
    if (s.metot) h += '<p class="ek-bilgi"><b>Metot:</b> ' + esc(s.metot) + '</p>';
    if (s.basamak) h += '<p class="ek-bilgi"><b>Uygulanacağı basamak:</b> ' + esc(s.basamak) + '</p>';
    if (s.tedbir) h += '<p class="ek-bilgi"><b>Uygun çıkmazsa:</b> ' + esc(s.tedbir) + '</p>';
    if (s.uyari) h += '<p class="uyari-tur"><b>Dikkat:</b> ' + esc(s.uyari) + '</p>';
    if (s.dipnot_metinleri.length) h += '<details class="dipnot"><summary>Dipnotlar (' + s.dipnot_metinleri.length + ')</summary>' + s.dipnot_metinleri.map(x => '<p>' + esc(x) + '</p>').join('') + '</details>';
    const deg = MIKRO_DIPNOT.analiz_sonuclarinin_degerlendirilmesi[tabloAnahtari(s, Object.keys(MIKRO_DIPNOT.analiz_sonuclarinin_degerlendirilmesi))] || [];
    if (deg.length) h += '<details class="dipnot"><summary>Sonuçların değerlendirilmesi</summary>' + deg.map(x => '<p>' + esc(x) + '</p>').join('') + '</details>';
    h += '<div class="alt-satir"><span class="kaynak-yazi">' + esc(MIKRO_KAYNAK + ', ' + s.ek + ', madde ' + s.madde) + ' · resmî PDF henüz eklenmedi</span></div>';
    h += '<p class="durum-k' + (d.ton === 'ok' ? ' ok' : '') + '"><b>' + esc(d.baslik) + '</b> ' + esc(d.metin) + '</p>';
    return h + '</article>';
  }
  function kart(r: Sonuc, aileGoster: boolean) {
    if (r.d.kaynak === 'mk') return mikroKart(r);
    const k = r.d, kar = k.tur === 'karsilastirma', d = durumOf(k);
    const kaynak = KAYNAKLAR[k.kaynak].ad + ', madde ' + k.madde.replace(/^Ek-2 \/ /, '') + ', sayfa ' + k.sayfa;
    let h = '<article class="kart ' + (kar ? 'kart-karsilastirma' : 'kart-limit') + '">';
    h += '<div class="ust-satir"><span class="tur">' + (kar ? 'Karşılaştırma değeri' : 'Resmî maksimum limit') + '</span>' + baglamHtml(r) + '</div>';
    h += '<h3>' + esc(k.urun) + '</h3>';
    if (aileGoster) h += '<p class="aile-ad">' + esc(k.aile) + '</p>';
    h += '<div class="degerler">' + k.analitler.map(degerHtml).join('') + '</div>';
    if (k.istisna) h += '<p class="ek-bilgi"><b>Hariç:</b> ' + esc(k.istisna) + '</p>';
    if (k.not.length) h += '<p class="ek-bilgi"><b>Not:</b> ' + esc(k.not.join('; ')) + '</p>';
    k.dipnot.forEach(n => { if (DATA.dipnotlar[n]) h += '<details class="dipnot"><summary>Dipnot ' + esc(n) + '</summary><p>' + esc(DATA.dipnotlar[n]) + '</p></details>'; });
    h += '<div class="alt-satir"><span class="kaynak-yazi">' + esc(kaynak) + '</span><button type="button" class="btn" data-ac="' + k.kaynak + ':' + k.sayfa + '">Sayfayı gör</button></div>';
    h += '<p class="durum-k' + (d.ton === 'ok' ? ' ok' : '') + '"><b>' + esc(d.baslik) + '</b> ' + esc(d.metin) + '</p>';
    return h + '</article>';
  }
  function sonuclariCiz() {
    const q = durum.q.trim(), alan = $('sonucAlani');
    if (norm(q).length < 2) { alan.hidden = true; $('hizli').hidden = false; $('kapsam').hidden = false; return; }
    const s = dz.ara(q);
    $('hizli').hidden = true; $('kapsam').hidden = true; alan.hidden = false;
    const mikroMu = (t: string) => t.startsWith('mikro');
    const nL = s.sonuc.filter(r => r.d.tur === 'limit').length, nK = s.sonuc.filter(r => r.d.tur === 'karsilastirma').length, nM = s.sonuc.filter(r => mikroMu(r.d.tur)).length;
    let baslik = '“' + q + '”';
    if (s.mod === 'urun') baslik = s.urunler.map(u => buyuk(u.anahtar)).join(', ') + (s.aileler.size ? ' – ' + [...s.aileler].join(', ') : '') + ': kapsayan limitler';
    else if (s.mod === 'aile') baslik = [...s.aileler].join(', ') + ': geçtiği tüm ürünler';
    $('sonucBaslik').textContent = baslik;
    $('sayim').textContent = s.sonuc.length + ' satır';
    const f = ([['tumu', 'Tümü', s.sonuc.length], ['limit', 'Resmî limit', nL], ['karsilastirma', 'Karşılaştırma değeri', nK], ['mikro', 'Mikrobiyolojik kriter', nM]] as [string, string, number][]).filter(x => x[0] === 'tumu' || x[2] > 0);
    if (!f.some(x => x[0] === durum.filtre)) durum.filtre = 'tumu';
    $('suzgec').innerHTML = f.length > 1 ? f.map(x => '<button type="button" data-f="' + x[0] + '" aria-pressed="' + (durum.filtre === x[0]) + '">' + x[1] + ' (' + x[2] + ')</button>').join('') : '';
    const liste = s.sonuc.filter(r => durum.filtre === 'tumu' || (durum.filtre === 'mikro' ? mikroMu(r.d.tur) : r.d.tur === durum.filtre));
    /* Ek-3 genel patojen limitleri: ürün aramasında ayrı bölüm (Tümü ya da Mikrobiyolojik süzgecinde) */
    const genel = durum.filtre === 'tumu' || durum.filtre === 'mikro' ? s.genel : [];
    const genelHtml = () => genel.length ? '<h3 class="bolum-baslik">Genel patojen limitleri (Ek-3)<small>' + genel.length + ' satır</small></h3><p class="uyari">Bu limitler belirli bir ürüne bağlı değildir. Ürününüz için yukarıda ürüne özgü bir kriter yoksa geçerli olabilir; hangi gıdalara uygulandığını yönetmelik maddesinden teyit edin.</p>' + genel.map(r => kart(r, false)).join('') : '';
    let h = '';
    if (s.mod === 'urun') h += '<p class="uyari"><b>Bu liste bir analiz planı değildir.</b> Bir limitin burada görünmesi o analizin zorunlu olduğu anlamına gelmez; analiz planı risk değerlendirmesine göre yapılır.' + (s.gizlenen ? ' Daha özel bir satırı bulunduğu için ' + s.gizlenen + ' genel satır gösterilmedi.' : '') + '</p>';
    if (s.kalan.length && s.mod !== 'metin') h += '<p class="uyari">Ek olarak satır metninde aranan kelimeler: ' + esc(s.kalan.map(t => t.w).join(', ')) + '</p>';
    if (!liste.length) {
      h += '<div class="bos"><strong>“' + esc(q) + '” için satır bulunamadı.</strong><p>Ürünü tek kelimeyle (ör. “fındık”) ya da bulaşanı ya da mikroorganizmayı tek başına (ör. “kadmiyum”, “listeria”) yazmayı deneyin. Bu sürüm bulaşan limitlerini ve mikrobiyolojik kriterleri içerir.</p>' +
        '<div class="cipler">' + DATA.oneriler.slice(0, 5).map(x => '<button type="button" class="cip" data-sorgu="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div></div>';
      $('sonuclar').innerHTML = h + genelHtml(); return;
    }
    const ISTISNA_BOLUM = 'İstisna içeren satırlar: ürününüzün kapsama girip girmediğini kontrol edin';
    const bolumOf = (r: Sonuc) => r.d.kaynak === 'mk' && s.mod === 'urun' ? 'Mikrobiyolojik kriterler · ' + MIKRO_TUR_ADI[r.d.tur] : s.mod === 'urun' ? (r.bag!.seviye === 3 ? ISTISNA_BOLUM : r.d.aile) : r.d.aile;
    const gosterilen = liste.slice(0, durum.sinir);
    let sonBolum: string | null = null;
    gosterilen.forEach(r => {
      let bolum: string | null = null;
      if (s.mod === 'urun') bolum = bolumOf(r);
      else if (s.mod === 'aile' && s.aileler.size > 1) bolum = r.d.aile;
      if (bolum && bolum !== sonBolum) {
        const say = liste.filter(x => bolumOf(x) === bolum).length;
        h += '<h3 class="bolum-baslik">' + esc(bolum) + '<small>' + say + ' satır</small></h3>'; sonBolum = bolum;
      }
      h += kart(r, s.mod !== 'urun' && !(s.mod === 'aile' && s.aileler.size > 1) ? s.mod === 'metin' : false);
    });
    if (liste.length > gosterilen.length) h += '<button type="button" class="btn daha" data-daha="1">' + (liste.length - gosterilen.length) + ' satır daha göster</button>';
    else h += genelHtml();
    $('sonuclar').innerHTML = h;
  }
  function oneriCiz() {
    const liste = $('oneriler');
    durum.tamamlamalar = norm(durum.q).length >= 2 ? dz.tamamla(durum.q) : [];
    if (durum.tamamlamalar.some(a => norm(a.ad) === norm(durum.q))) durum.tamamlamalar = [];
    durum.secili = -1;
    if (!durum.tamamlamalar.length) { liste.hidden = true; $('q').setAttribute('aria-expanded', 'false'); return; }
    liste.innerHTML = durum.tamamlamalar.map((a, i) => '<li class="oneri" role="option" id="o' + i + '" data-i="' + i + '" aria-selected="false"><span class="oneri-ad">' + esc(a.ad) + '</span><span class="oneri-tur">' + esc(a.tur) + '</span></li>').join('');
    liste.hidden = false; $('q').setAttribute('aria-expanded', 'true');
  }
  function oneriKapat() { $('oneriler').hidden = true; $('q').setAttribute('aria-expanded', 'false'); durum.secili = -1; }
  function sorguKoy(m: string) { $<HTMLInputElement>('q').value = m; durum.q = m; durum.sinir = 40; durum.filtre = 'tumu'; $('temizle').hidden = !m; oneriKapat(); sonuclariCiz(); }

  /* ---- Kaynak sayfa görüntüleyici ---- */
  const gv = { kaynak: 'e1' as KaynakKodu, sayfa: 1, zoom: 1, onceki: null as Element | null };
  function varsayilanZoom() { const w = $('gKaydir').clientWidth || window.innerWidth || 1000; return Math.max(1, Math.min(4, Math.round(1000 / w * 2) / 2)); }
  function gvCiz() {
    const k = KAYNAKLAR[gv.kaynak], l = k.sayfalar, i = l.indexOf(gv.sayfa);
    $('gBaslik').textContent = k.ad + ', sayfa ' + gv.sayfa;
    const m = DATA.kayitlar.filter(x => x.kaynak === gv.kaynak && x.sayfa === gv.sayfa).map(x => x.madde);
    $('gKapsam').textContent = m.length ? 'Bu sayfadaki maddeler: ' + [...new Set(m)].slice(0, 6).join(', ') + (new Set(m).size > 6 ? '…' : '') : 'Resmî PDF sayfası';
    const img = $<HTMLImageElement>('gResim'); img.src = gorselUrl(gv.kaynak, gv.sayfa); img.alt = k.ad + ' belgesinin ' + gv.sayfa + '. sayfası';
    img.style.width = (gv.zoom * 100) + '%';
    $('gKonum').textContent = (i + 1) + ' / ' + l.length; $('gSigdir').textContent = Math.round(gv.zoom * 100) + '%';
    $<HTMLButtonElement>('gOnceki').disabled = i <= 0; $<HTMLButtonElement>('gSonraki').disabled = i >= l.length - 1;
    $<HTMLButtonElement>('gUzak').disabled = gv.zoom <= 1; $<HTMLButtonElement>('gYakin').disabled = gv.zoom >= 5;
    $('gKaydir').scrollTop = 0; $('gKaydir').scrollLeft = 0;
  }
  function gvAc(kaynak: string, n: number, hashYaz?: boolean) {
    if (!(kaynak in KAYNAKLAR) || !KAYNAKLAR[kaynak as KaynakKodu].sayfalar.includes(n)) return;
    if ($('goruntuleyici').hidden) gv.onceki = document.activeElement;
    gv.kaynak = kaynak as KaynakKodu; gv.sayfa = n; $('goruntuleyici').hidden = false; document.body.style.overflow = 'hidden';
    gv.zoom = varsayilanZoom(); gvCiz();
    if (hashYaz !== false) { const h = '#' + (kaynak === 'e1' ? 'ek1' : 'talimat') + '-' + n; if (location.hash !== h) history.replaceState(null, '', h); }
    $('gKapat').focus();
  }
  function gvKapat() {
    if ($('goruntuleyici').hidden) return;
    $('goruntuleyici').hidden = true; document.body.style.overflow = '';
    if (/^#(ek1|talimat)-/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
    if (gv.onceki instanceof HTMLElement) gv.onceki.focus();
  }
  /* hashYaz: prototipte sayfa değiştirmek adresi her zaman yazıyordu; testler false geçirerek adresi kirletmez. */
  /* Orijinal PDF: PDF.js modülü ilk tıklamada yüklenir, ana paketi büyütmez. */
  let pdf: Promise<import('./pdf').PdfGoruntuleyici> | null = null;
  function pdfAc() {
    pdf = pdf || import('./pdf').then(m => m.pdfGoruntuleyici());
    pdf.then(p => p.ac(gv.kaynak, gv.sayfa), () => { pdf = null; $('gKapsam').textContent = 'PDF görüntüleyici yüklenemedi.'; });
  }
  function gvGit(d: number, hashYaz?: boolean) { const l = KAYNAKLAR[gv.kaynak].sayfalar, i = l.indexOf(gv.sayfa) + d; if (i < 0 || i >= l.length) return; const z = gv.zoom; gvAc(gv.kaynak, l[i], hashYaz); gv.zoom = z; gvCiz(); }

  /* Kontrol modu: modül yalnız #kontrol ilk açıldığında yüklenir. */
  let kontrol: Promise<void> | null = null;
  function kontrolGoster(ac: boolean) {
    $('uygulama').hidden = ac; $('kontrolAlani').hidden = !ac;
    if (ac && !kontrol) {
      kontrol = import('./kontrol').then(m => m.kontrolBaslat($('kontrolAlani'), DATA), () => { kontrol = null; $('kontrolAlani').textContent = 'Kontrol modu yüklenemedi.'; });
    }
  }
  function yonlendir() {
    const h = location.hash.replace(/^#/, ''), m = /^(ek1|talimat)-(\d{1,2})$/.exec(h);
    kontrolGoster(h === 'kontrol');
    if (h === 'kontrol') { gvKapat(); window.scrollTo(0, 0); return; }
    if (m) { $('testAlani').hidden = true; $('ana').hidden = false; gvAc(m[1] === 'ek1' ? 'e1' : 'tl', parseInt(m[2], 10), false); return; }
    gvKapat();
    if (h === 'testler') { $('ana').hidden = true; $('testAlani').hidden = false; void testleriGoster(); } else { $('testAlani').hidden = true; $('ana').hidden = false; }
  }
  function domTestleri(): KabulTesti[] {
    const kapat = () => { $('goruntuleyici').hidden = true; document.body.style.overflow = ''; };
    return [
      ['Görüntüleyici: Ek-1 sayfa 30 açılır, başlık, konum ve görsel doğru', () => { gvAc('e1', 30, false); const ok = /sayfa 30/.test($('gBaslik').textContent || '') && $('gKonum').textContent === '30 / 45' && $<HTMLImageElement>('gResim').src.endsWith(sayfaYolu('e1', 30)); kapat(); return ok; }],
      ['Görüntüleyici: önceki/sonraki sayfa', () => { gvAc('e1', 10, false); gvGit(1, false); const a = gv.sayfa === 11; gvGit(-1, false); gvGit(-1, false); const b = gv.sayfa === 9; kapat(); return a && b; }],
      ['Arayüz: “fındık” aramasında doğrudan, üst kategori ve uyarı metni görünür', () => { sorguKoy('fındık'); const t = $('sonuclar').textContent || ''; const ok = /Doğrudan: Fındık/.test(t) && /Üst kategori: sert kabuklu meyve/.test(t) && /analiz planı değildir/.test(t); sorguKoy(''); return ok; }]
    ];
  }
  /* Görseller artık ayrı dosya: önce hepsinin gerçekten indirilebildiği yoklanır, sonra testler eşzamanlı çalışır. */
  async function mevcutSayfalar(): Promise<Set<string>> {
    const var_ = new Set<string>();
    await Promise.all((Object.keys(KAYNAKLAR) as KaynakKodu[]).flatMap(k => KAYNAKLAR[k].sayfalar.map(async n => {
      try { const r = await fetch(gorselUrl(k, n)); if (r.ok && (await r.blob()).size > 1500) var_.add(k + ':' + n); } catch { /* yok sayılır */ }
    })));
    return var_;
  }
  async function testleriGoster() {
    $('testSonuc').innerHTML = '<p class="test-ozet">Testler çalışıyor…</p>';
    const sayfalar = await mevcutSayfalar();
    const liste = kabulTestleri(dz, DATA, (k, n) => sayfalar.has(k + ':' + n)).concat(domTestleri());
    const r = liste.map(([ad, fn]) => { let ok = false, hata = ''; try { ok = !!fn(); } catch (e) { hata = String((e as Error)?.message || e); } return { ad, ok, hata }; });
    const g = r.filter(x => x.ok).length;
    $('testSonuc').innerHTML = '<p class="test-ozet">' + g + ' / ' + r.length + ' test geçti</p>' + r.map(x => '<div class="test-satir"><span class="' + (x.ok ? 'test-ok' : 'test-hata') + '">' + (x.ok ? '✓' : '✗') + '</span><span>' + esc(x.ad) + (x.hata ? '<br><span class="test-ayrinti">' + esc(x.hata) + '</span>' : '') + '</span></div>').join('');
    document.title = 'GıdaRef testleri: ' + g + '/' + r.length; (window as unknown as { __testSonuc: unknown }).__testSonuc = r;
  }

  ilkSatir();
  const q = $<HTMLInputElement>('q');
  q.addEventListener('input', () => { durum.q = q.value; durum.sinir = 40; $('temizle').hidden = !q.value; oneriCiz(); sonuclariCiz(); });
  q.addEventListener('keydown', e => {
    const n = durum.tamamlamalar.length;
    if (e.key === 'ArrowDown' && n) { e.preventDefault(); durum.secili = (durum.secili + 1) % n; }
    else if (e.key === 'ArrowUp' && n) { e.preventDefault(); durum.secili = (durum.secili - 1 + n) % n; }
    else if (e.key === 'Enter') { e.preventDefault(); if (durum.secili >= 0 && durum.tamamlamalar[durum.secili]) sorguKoy(durum.tamamlamalar[durum.secili].sorgu); else { oneriKapat(); sonuclariCiz(); } return; }
    else if (e.key === 'Escape') { oneriKapat(); return; }
    else return;
    document.querySelectorAll('.oneri').forEach((li, i) => li.setAttribute('aria-selected', String(i === durum.secili)));
    q.setAttribute('aria-activedescendant', durum.secili >= 0 ? 'o' + durum.secili : '');
  });
  $('oneriler').addEventListener('mousedown', e => { const li = (e.target as Element).closest<HTMLElement>('.oneri'); if (!li) return; e.preventDefault(); sorguKoy(durum.tamamlamalar[parseInt(li.dataset.i!, 10)].sorgu); });
  q.addEventListener('blur', () => setTimeout(oneriKapat, 120));
  $('ara').addEventListener('click', () => { oneriKapat(); sonuclariCiz(); });
  $('temizle').addEventListener('click', () => { sorguKoy(''); q.focus(); });
  $('evBaglanti').addEventListener('click', e => { e.preventDefault(); sorguKoy(''); history.replaceState(null, '', location.pathname + location.search); yonlendir(); window.scrollTo(0, 0); });
  document.addEventListener('click', e => {
    const hedef = e.target as Element;
    const c = hedef.closest<HTMLElement>('[data-sorgu]'); if (c) { sorguKoy(c.dataset.sorgu!); return; }
    const f = hedef.closest<HTMLElement>('[data-f]'); if (f) { durum.filtre = f.dataset.f!; sonuclariCiz(); return; }
    const a = hedef.closest<HTMLElement>('[data-ac]'); if (a) { const [k, n] = a.dataset.ac!.split(':'); gvAc(k, parseInt(n, 10)); return; }
    if (hedef.closest('[data-daha]')) { durum.sinir += 40; sonuclariCiz(); }
  });
  $('gKapat').addEventListener('click', gvKapat);
  $('gPdf').addEventListener('click', pdfAc);
  $('gOnceki').addEventListener('click', () => gvGit(-1)); $('gSonraki').addEventListener('click', () => gvGit(1));
  $('gYakin').addEventListener('click', () => { gv.zoom = Math.min(5, gv.zoom + 0.5); gvCiz(); });
  $('gUzak').addEventListener('click', () => { gv.zoom = Math.max(1, gv.zoom - 0.5); gvCiz(); });
  $('gSigdir').addEventListener('click', () => { gv.zoom = varsayilanZoom(); gvCiz(); });
  document.addEventListener('keydown', e => { if ($('goruntuleyici').hidden) return; if (e.key === 'Escape') gvKapat(); else if (e.key === 'ArrowLeft') gvGit(-1); else if (e.key === 'ArrowRight') gvGit(1); });
  window.addEventListener('hashchange', yonlendir);
  yonlendir();
}
