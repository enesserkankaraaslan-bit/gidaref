/* ===== Kontrol modu (#kontrol) =====
 * Satır + sayfa görüntüsü yan yana; "Eşleşti / Düzelt" kararları tarayıcıda saklanır, dosya olarak indirilir
 * ve `npm run kontrol:uygula` ile data/ek1/kontrol_gecmisi.jsonl'e işlenir. Veri burada hiç değişmez.
 * Bu modül yalnız #kontrol açıldığında yüklenir. */
import depoGecmisi from '../../data/ek1/kontrol_gecmisi.jsonl?raw';
import {
  DUZELTILEBILIR_E1, DUZELTILEBILIR_MK, gecmisBirlestir, jsonlOku, jsonlYaz, kontrolSatirlari, mikroKontrolSatirlari, satirDurumu, sayfaYolu, sonKararlar, KAYNAKLAR,
  type DuzeltilebilirAlan, type KontrolKaydi, type KontrolSatiri, type SatirDurumu, type Veri
} from '../core';
import { MIKRO_SATIRLAR } from '../veri';
import './kontrol.css';

const ANAHTAR_KAYIT = 'gidaref.kontrol.v1', ANAHTAR_AD = 'gidaref.kontrol.ad';
const ALAN_ADI: Record<DuzeltilebilirAlan, string> = {
  urun: 'Ürün ifadesi', analit: 'Analit', deger: 'Değer', birim: 'Birim', esas: 'Ölçüm esası', tarih: 'Tarih (itibaren)', istisna: 'Hariç (istisna)', sayfa: 'Sayfa', dipnot: 'Dipnot', not: 'Not',
  madde: 'Madde no', mikroorganizma: 'Mikroorganizma', n: 'n', c: 'c', m: 'm', M: 'M', metot: 'Metot', basamak: 'Uygulanacağı basamak', tedbir: 'Uygun çıkmazsa tedbir'
};
const DURUM_ADI: Record<SatirDurumu, string> = { bekliyor: 'Bekliyor', eslesti: 'Eşleşti', duzeltme: 'Düzeltme önerildi' };

const esc = (s: unknown) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const oku = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const sakla = (k: string, v: string) => { try { localStorage.setItem(k, v); return true; } catch { return false; } };
function alanDegeri(s: KontrolSatiri, a: DuzeltilebilirAlan): string {
  if (s.mikro) {
    const m = s.mikro as unknown as Record<string, unknown>, v = a === 'urun' ? m.urun_ifadesi : m[a];
    return Array.isArray(v) ? v.join('; ') : String(v ?? '');
  }
  const v = (s as unknown as Record<string, unknown>)[a];
  return Array.isArray(v) ? v.join('; ') : String(v ?? '');
}
/** Kaynak sayfası görülemeyen satırda karar verilemez (ikinci kontrol belgeye bakarak yapılır). */
const kararAcik = (s: KontrolSatiri) => s.kaynak === 'e1' || s.sayfa > 0;
const zamanYaz = (z: string) => new Date(z).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });

export function kontrolBaslat(kok: HTMLElement, veri: Veri): void {
  const KAYNAK_SATIRLARI = { e1: kontrolSatirlari(veri), mk: mikroKontrolSatirlari(MIKRO_SATIRLAR) };
  let satirlar = KAYNAK_SATIRLARI.e1;
  const depo = jsonlOku(depoGecmisi);
  let yerel: KontrolKaydi[] = [];
  try { yerel = jsonlOku(oku(ANAHTAR_KAYIT) || ''); } catch { yerel = []; }
  const d = { kaynak: 'e1' as 'e1' | 'mk', durum: 'bekliyor' as SatirDurumu | 'tumu', sayfa: 0, secili: '', zoom: 1, duzelt: false, mesaj: '' };

  kok.innerHTML = `
    <header class="k-ust">
      <div class="k-baslik"><a class="btn" href="#">Aramaya dön</a><h1>Kontrol modu</h1></div>
      <p class="k-sayac" id="kSayac" aria-live="polite"></p>
      <div class="k-araclar">
        <label>Kontrol eden <input id="kAd" autocomplete="name" placeholder="Ad Soyad" required></label>
        <label>Kaynak <select id="kKaynak"><option value="e1">Bulaşanlar Ek-1</option><option value="mk">Mikrobiyolojik kriterler</option></select></label>
        <label>Durum <select id="kSuzDurum"><option value="bekliyor">Bekleyen</option><option value="duzeltme">Düzeltme önerisi</option><option value="eslesti">Eşleşti</option><option value="tumu">Tümü</option></select></label>
        <label id="kSayfaEtiket">Sayfa <select id="kSuzSayfa"><option value="0">Tümü</option>${KAYNAKLAR.e1.sayfalar.map(n => `<option value="${n}">${n}</option>`).join('')}</select></label>
        <button class="btn" id="kIndir" type="button"></button>
        <label class="btn k-yukle">Kayıt yükle<input id="kYukle" type="file" accept=".jsonl,application/jsonl,text/plain"></label>
      </div>
      <p class="k-mesaj" id="kMesaj" role="status"></p>
    </header>
    <div class="k-govde">
      <section class="k-gorsel" aria-label="Kaynak sayfa">
        <div class="k-gorsel-ust"><strong id="kGorselBaslik"></strong><span class="k-zoom"><button class="btn" id="kUzak" type="button" aria-label="Uzaklaştır">−</button><button class="btn" id="kYakin" type="button" aria-label="Yakınlaştır">+</button></span></div>
        <div class="k-kaydir" id="kKaydir" tabindex="0"><img id="kResim" alt=""><p class="k-yok" id="kYok" hidden>Bu kaynağın resmî PDF’i henüz eklenmedi. İkinci kontrol belgeye bakarak yapıldığı için bu satırlarda “Eşleşti” ve “Düzelt” kapalıdır; satırları yalnız inceleyebilirsiniz.</p></div>
      </section>
      <section class="k-kart" id="kKart" aria-live="polite"></section>
    </div>`;
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => kok.querySelector('#' + id) as T;
  const ad = $<HTMLInputElement>('kAd');
  ad.value = oku(ANAHTAR_AD) || '';

  /* Sayfa görüntüleyiciyle aynı varsayılan: dar ekranda yatay sayfa okunur büyüklükte açılır. */
  const varsayilanZoom = () => { const w = $('kKaydir').clientWidth || window.innerWidth || 1000; return Math.max(1, Math.min(4, Math.round(1000 / w * 2) / 2)); };
  d.zoom = varsayilanZoom();
  const birlesik = () => gecmisBirlestir(depo, yerel);
  const mesaj = (m: string) => { d.mesaj = m; $('kMesaj').textContent = m; };

  function liste(son: Map<string, KontrolKaydi>) {
    return satirlar.filter(s => (d.durum === 'tumu' || satirDurumu(s, son) === d.durum) && (!d.sayfa || s.sayfa === d.sayfa));
  }

  function ciz() {
    const { gecmis, eklenen } = birlesik(), son = sonKararlar(gecmis);
    const say = { bekliyor: 0, eslesti: 0, duzeltme: 0 };
    satirlar.forEach(s => say[satirDurumu(s, son)]++);
    $('kSayac').textContent = (d.kaynak === 'mk' ? 'Mikrobiyolojik kriterler · ' : 'Bulaşanlar Ek-1 · ') + `Eşleşti ${say.eslesti} / ${satirlar.length} · Düzeltme önerisi ${say.duzeltme} · Bekleyen ${say.bekliyor}`;
    const indir = $<HTMLButtonElement>('kIndir');
    indir.textContent = `Kayıtları indir (${eklenen.length})`; indir.disabled = !eklenen.length;

    const l = liste(son);
    let i = l.findIndex(s => s.anahtar === d.secili);
    if (i < 0) i = 0;
    const s = l[i];
    if (!s) {
      $('kKart').innerHTML = `<div class="bos"><strong>Bu süzgeçte satır yok.</strong><p>Durum ya da sayfa süzgecini değiştirin.</p></div>`;
      $('kGorselBaslik').textContent = ''; $<HTMLImageElement>('kResim').removeAttribute('src');
      return;
    }
    d.secili = s.anahtar;
    const durum = satirDurumu(s, son), acik = kararAcik(s), adVar = !!ad.value.trim() && acik;
    const alan = (et: string, v: string, cls = '') => v ? `<div class="${cls}"><dt>${et}</dt><dd>${esc(v)}</dd></div>` : '';
    const mk = s.mikro;
    const alanlarHtml = mk
      ? `${alan('Ürün', mk.urun_ifadesi)}${alan('Mikroorganizma', mk.mikroorganizma)}${alan('Tablo', mk.ek + ' · ' + mk.tablo)}${alan('n', mk.n || '(belirtilmemiş)')}${alan('c', mk.c || '(belirtilmemiş)')}${mk.c_asamali ? alan('Aşamalı c', mk.c_asamali.map(x => (x.tarih || 'başlangıç') + ': ' + x.c).join('; ')) : ''}
         <div class="k-deger"><dt>m</dt><dd><span class="mikro-limit">${esc(mk.m)}</span></dd></div><div class="k-deger"><dt>M</dt><dd><span class="mikro-limit">${esc(mk.M)}</span></dd></div>
         ${alan('Metot', mk.metot)}${alan('Basamak', mk.basamak)}${alan('Tedbir', mk.tedbir)}${alan('Dipnot', mk.dipnot.join('; '))}${alan('Uyarı', mk.uyari)}`
      : '';
    const satirGecmisi = gecmis.filter(k => k.anahtar === s.anahtar);
    const yerelKimlik = new Set(eklenen);
    $('kKart').innerHTML = `
      <div class="k-kart-ust"><span class="k-konum">Satır ${i + 1} / ${l.length}</span><span class="k-durum k-durum-${durum}">${DURUM_ADI[durum]}</span></div>
      <h2>Madde ${esc(s.madde)} <small>${mk ? esc(mk.id) + (s.sayfa ? ' · sayfa ' + s.sayfa : '') : 'sayfa ' + s.sayfa}</small></h2>
      <dl class="k-alanlar">${mk ? alanlarHtml : `
        ${alan('Ürün', s.urun)}${alan('Analit', s.analit)}
        <div class="k-deger"><dt>Değer</dt><dd><span class="sayi-k">${esc(s.deger)}</span> <span class="birim-k">${esc(s.birim)}</span></dd></div>
        ${alan('Ölçüm esası', s.esas)}${alan('Tarih', s.tarih ? s.tarih + '’ten itibaren' : '')}${alan('Hariç', s.istisna)}${alan('Dipnot', s.dipnot.join('; '))}${alan('Not', s.not.join('; '))}`}
      </dl>
      ${!acik ? '<p class="k-uyari">Resmî kaynak PDF eklenmeden bu satır için karar verilemez.</p>' : adVar ? '' : '<p class="k-uyari">Karar vermek için önce “Kontrol eden” alanına adınızı yazın.</p>'}
      <div class="k-dugmeler">
        <button class="btn" type="button" data-k="onceki" ${i <= 0 ? 'disabled' : ''}>Önceki</button>
        <button class="btn k-birincil" type="button" data-k="eslesti" ${adVar ? '' : 'disabled'}>Eşleşti</button>
        <button class="btn" type="button" data-k="duzelt" ${adVar ? '' : 'disabled'}>Düzelt</button>
        <button class="btn" type="button" data-k="sonraki" ${i >= l.length - 1 ? 'disabled' : ''}>Atla</button>
      </div>
      <form class="k-duzelt" id="kDuzelt" ${d.duzelt ? '' : 'hidden'}>
        <label>Alan <select id="kAlan">${(mk ? DUZELTILEBILIR_MK : DUZELTILEBILIR_E1).map(a => `<option value="${a}">${ALAN_ADI[a]}</option>`).join('')}</select></label>
        <p class="k-eski">Kayıttaki: <span id="kEski"></span></p>
        <label>Belgede yazan <input id="kYeni" required autocomplete="off"></label>
        <label>Not <textarea id="kNot" rows="2" placeholder="İsteğe bağlı"></textarea></label>
        <div class="k-dugmeler"><button class="btn k-birincil" type="submit">Düzeltmeyi kaydet</button><button class="btn" type="button" data-k="vazgec">Vazgeç</button></div>
        <p class="k-ipucu">Düzeltme veriyi değiştirmez; öneri olarak kaydedilir ve onayla ayrıca işlenir.</p>
      </form>
      <details class="k-gecmis" ${satirGecmisi.length ? 'open' : ''}><summary>Bu satırın geçmişi (${satirGecmisi.length})</summary>
        ${satirGecmisi.length ? '<ol>' + satirGecmisi.map(k => `<li>${esc(zamanYaz(k.zaman))} · ${esc(k.kontrol_eden)} · ${k.karar === 'eslesti' ? 'Eşleşti' : `Düzeltme: ${esc(ALAN_ADI[k.alan!])} “${esc(k.eski)}” → “${esc(k.yeni)}”` + (k.not ? ` (${esc(k.not)})` : '')}${yerelKimlik.has(k) ? ' <em>yerel, henüz indirilmedi</em>' : ''}</li>`).join('') + '</ol>' : '<p>Henüz karar yok.</p>'}
      </details>`;
    if (d.duzelt) { alanSecildi(); $('kYeni').focus(); }

    const img = $<HTMLImageElement>('kResim');
    const gorselVar = s.kaynak === 'e1';
    img.hidden = !gorselVar; $('kYok').hidden = gorselVar;
    if (!gorselVar) { $('kGorselBaslik').textContent = 'Mikrobiyolojik Kriterler Yönetmeliği'; return; }
    const src = import.meta.env.BASE_URL + sayfaYolu('e1', s.sayfa);
    if (img.getAttribute('src') !== src) { img.src = src; $('kKaydir').scrollTop = 0; }
    img.alt = 'Bulaşanlar Yönetmeliği Ek-1, sayfa ' + s.sayfa;
    img.style.width = (d.zoom * 100) + '%';
    $('kGorselBaslik').textContent = 'Ek-1, sayfa ' + s.sayfa;
  }

  function seciliSatir() { return satirlar.find(s => s.anahtar === d.secili)!; }
  function alanSecildi() { const a = $<HTMLSelectElement>('kAlan').value as DuzeltilebilirAlan; $('kEski').textContent = alanDegeri(seciliSatir(), a) || '(boş)'; }
  function git(adim: number) {
    const l = liste(sonKararlar(birlesik().gecmis)), i = l.findIndex(s => s.anahtar === d.secili) + adim;
    if (l[i]) { d.secili = l[i].anahtar; d.duzelt = false; ciz(); }
  }
  /** Karar sonrası: süzgeçte kalan bir sonraki satıra geç (karar verilen satır süzgeçten çıkabilir). */
  function kaydet(k: Omit<KontrolKaydi, 'anahtar' | 'madde' | 'sayfa' | 'kontrol_eden' | 'zaman'>) {
    const s = seciliSatir(), adVal = ad.value.trim(); if (!adVal || !kararAcik(s)) return;
    const onceki = liste(sonKararlar(birlesik().gecmis)), i = onceki.findIndex(x => x.anahtar === s.anahtar);
    yerel = yerel.concat({ anahtar: s.anahtar, madde: s.madde, sayfa: s.sayfa, ...k, kontrol_eden: adVal, zaman: new Date().toISOString() });
    if (!sakla(ANAHTAR_KAYIT, jsonlYaz(yerel))) mesaj('Uyarı: tarayıcı kaydı saklayamadı; kayıtları hemen indirin.');
    const sonra = liste(sonKararlar(birlesik().gecmis));
    const hedef = sonra.find(x => x.anahtar === s.anahtar) ? onceki[i + 1] : sonra[i];
    if (hedef) d.secili = hedef.anahtar;
    d.duzelt = false; ciz();
  }

  kok.addEventListener('click', e => {
    const b = (e.target as Element).closest<HTMLElement>('[data-k]'); if (!b) return;
    const k = b.dataset.k;
    if (k === 'onceki') git(-1); else if (k === 'sonraki') git(1);
    else if (k === 'eslesti') kaydet({ karar: 'eslesti' });
    else if (k === 'duzelt') { d.duzelt = true; ciz(); }
    else if (k === 'vazgec') { d.duzelt = false; ciz(); }
  });
  kok.addEventListener('change', e => { if ((e.target as Element).id === 'kAlan') alanSecildi(); });
  kok.addEventListener('submit', e => {
    e.preventDefault();
    const a = $<HTMLSelectElement>('kAlan').value as DuzeltilebilirAlan, yeni = $<HTMLInputElement>('kYeni').value.trim(), not = $<HTMLTextAreaElement>('kNot').value.trim();
    if (!yeni) { $('kYeni').focus(); return; }
    kaydet({ karar: 'duzelt', alan: a, eski: alanDegeri(seciliSatir(), a), yeni, ...(not ? { not } : {}) });
  });
  ad.addEventListener('input', () => { sakla(ANAHTAR_AD, ad.value.trim()); ciz(); ad.focus(); });
  $<HTMLSelectElement>('kSuzDurum').addEventListener('change', e => { d.durum = (e.target as HTMLSelectElement).value as typeof d.durum; d.duzelt = false; ciz(); });
  $<HTMLSelectElement>('kKaynak').addEventListener('change', e => {
    d.kaynak = (e.target as HTMLSelectElement).value as typeof d.kaynak; satirlar = KAYNAK_SATIRLARI[d.kaynak];
    d.sayfa = 0; $<HTMLSelectElement>('kSuzSayfa').value = '0'; $('kSayfaEtiket').hidden = d.kaynak !== 'e1';
    d.secili = ''; d.duzelt = false; ciz();
  });
  $<HTMLSelectElement>('kSuzSayfa').addEventListener('change', e => { d.sayfa = Number((e.target as HTMLSelectElement).value); d.secili = ''; d.duzelt = false; ciz(); });
  $('kYakin').addEventListener('click', () => { d.zoom = Math.min(5, d.zoom + 0.5); ciz(); });
  $('kUzak').addEventListener('click', () => { d.zoom = Math.max(1, d.zoom - 0.5); ciz(); });
  $('kIndir').addEventListener('click', () => {
    const yeni = birlesik().eklenen; if (!yeni.length) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([jsonlYaz(yeni)], { type: 'application/jsonl' }));
    a.download = 'kontrol_kayitlari_' + new Date().toISOString().slice(0, 10) + '.jsonl';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    mesaj(yeni.length + ' kayıt indirildi. Depoya işlemek için: npm run kontrol:uygula -- <dosya> --yaz');
  });
  $<HTMLInputElement>('kYukle').addEventListener('change', async e => {
    const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return;
    try {
      const r = gecmisBirlestir(yerel, jsonlOku(await f.text()));
      yerel = r.gecmis; sakla(ANAHTAR_KAYIT, jsonlYaz(yerel));
      mesaj(r.eklenen.length + ' kayıt yüklendi.'); ciz();
    } catch (h) { mesaj('Dosya okunamadı: ' + (h as Error).message); }
    (e.target as HTMLInputElement).value = '';
  });
  /* Klavye: E eşleşti, D düzelt, ←/→ önceki/sonraki (yazı alanındayken devre dışı) */
  document.addEventListener('keydown', e => {
    if (kok.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.target as Element).closest('input, textarea, select')) return;
    if (e.key === 'ArrowRight') git(1); else if (e.key === 'ArrowLeft') git(-1);
    else if ((e.key === 'e' || e.key === 'E') && ad.value.trim()) kaydet({ karar: 'eslesti' });
    else if ((e.key === 'd' || e.key === 'D') && ad.value.trim() && kararAcik(seciliSatir())) { d.duzelt = true; ciz(); }
  });

  ciz();
}
