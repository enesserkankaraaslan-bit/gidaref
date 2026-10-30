/* ===== Orijinal PDF görüntüleyici (PDF.js) =====
 * Bu modül uygulamaya dinamik import ile, "Orijinal PDF" ilk tıklandığında yüklenir.
 * Ek-1 taranmış görüntüdür (metin katmanı yok); talimat PDF'inde metin seçilebilir. */
import { GlobalWorkerOptions, getDocument, TextLayer, type PDFDocumentProxy, type RenderTask } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'pdfjs-dist/web/pdf_viewer.css';
import './pdf.css';
import { KAYNAKLAR, pdfYolu, type KaynakKodu } from '../core';

GlobalWorkerOptions.workerSrc = workerUrl;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export interface PdfGoruntuleyici { ac(kaynak: KaynakKodu, sayfa: number): void; kapat(): void }

export function pdfGoruntuleyici(): PdfGoruntuleyici {
  const belgeler = new Map<KaynakKodu, Promise<PDFDocumentProxy>>();
  const pv = { kaynak: 'e1' as KaynakKodu, sayfa: 1, toplam: 0, zoom: 1, onceki: null as Element | null };
  let gorev: RenderTask | null = null, metin: TextLayer | null = null, kusak = 0;

  function belge(k: KaynakKodu) {
    let p = belgeler.get(k);
    if (!p) {
      p = getDocument({ url: import.meta.env.BASE_URL + pdfYolu(k) }).promise;
      p.catch(() => belgeler.delete(k)); // ağ hatasında sonraki denemede yeniden indir
      belgeler.set(k, p);
    }
    return p;
  }
  function durumYaz(s: string, hazir: boolean) { $('pDurum').textContent = s; $('pSayfa').dataset.durum = hazir ? 'hazir' : 'yukleniyor'; }
  function dugmeler() {
    $('pKonum').textContent = pv.toplam ? pv.sayfa + ' / ' + pv.toplam : '';
    $<HTMLButtonElement>('pOnceki').disabled = pv.sayfa <= 1; $<HTMLButtonElement>('pSonraki').disabled = !pv.toplam || pv.sayfa >= pv.toplam;
    $<HTMLButtonElement>('pUzak').disabled = pv.zoom <= 1; $<HTMLButtonElement>('pYakin').disabled = pv.zoom >= 5;
    $('pSigdir').textContent = Math.round(pv.zoom * 100) + '%';
  }

  async function ciz() {
    const benim = ++kusak;
    gorev?.cancel(); metin?.cancel();
    $('pBaslik').textContent = KAYNAKLAR[pv.kaynak].ad + ', sayfa ' + pv.sayfa;
    durumYaz('Orijinal PDF yükleniyor…', false); dugmeler();
    try {
      const doc = await belge(pv.kaynak);
      if (benim !== kusak) return;
      pv.toplam = doc.numPages; if (pv.sayfa > pv.toplam) pv.sayfa = pv.toplam; dugmeler();
      const sayfa = await doc.getPage(pv.sayfa);
      if (benim !== kusak) return;
      const kaydir = $('pKaydir');
      const genislik = Math.max(200, kaydir.clientWidth - 16);
      const olcek = genislik / sayfa.getViewport({ scale: 1 }).width * pv.zoom;
      const vp = sayfa.getViewport({ scale: olcek });
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const tuval = $<HTMLCanvasElement>('pTuval'), kutu = $('pSayfa'), katman = $('pMetin');
      tuval.width = Math.floor(vp.width * dpr); tuval.height = Math.floor(vp.height * dpr);
      tuval.style.width = Math.floor(vp.width) + 'px'; tuval.style.height = Math.floor(vp.height) + 'px';
      kutu.style.width = Math.floor(vp.width) + 'px'; kutu.style.height = Math.floor(vp.height) + 'px';
      kutu.style.setProperty('--scale-factor', String(olcek));
      kaydir.scrollTop = 0; kaydir.scrollLeft = 0;
      gorev = sayfa.render({ canvasContext: tuval.getContext('2d')!, viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined });
      await gorev.promise;
      if (benim !== kusak) return;
      katman.replaceChildren();
      metin = new TextLayer({ textContentSource: sayfa.streamTextContent(), container: katman, viewport: vp });
      await metin.render();
      if (benim !== kusak) return;
      kutu.dataset.sayfa = String(pv.sayfa);
      kutu.dataset.metin = String(katman.querySelectorAll('span').length > 0);
      durumYaz(kutu.dataset.metin === 'true' ? 'Orijinal PDF · metin seçilebilir' : 'Orijinal PDF · taranmış görüntü', true);
    } catch (e) {
      if (benim !== kusak || (e as Error)?.name === 'RenderingCancelledException' || (e as Error)?.name === 'AbortException') return;
      durumYaz('PDF açılamadı. Çevrimdışıysanız sayfa görüntüsünü kullanın.', false);
    }
  }

  function ac(kaynak: KaynakKodu, sayfa: number) {
    if ($('pdfGoruntuleyici').hidden) pv.onceki = document.activeElement;
    if (kaynak !== pv.kaynak) pv.toplam = 0;
    pv.kaynak = kaynak; pv.sayfa = sayfa; pv.zoom = 1;
    $('pdfGoruntuleyici').hidden = false; document.body.style.overflow = 'hidden';
    $('pKapat').focus();
    void ciz();
  }
  function kapat() {
    if ($('pdfGoruntuleyici').hidden) return;
    kusak++; gorev?.cancel(); metin?.cancel();
    $('pdfGoruntuleyici').hidden = true;
    if ($('goruntuleyici').hidden) document.body.style.overflow = '';
    if (pv.onceki instanceof HTMLElement) pv.onceki.focus();
  }
  function git(d: number) { const n = pv.sayfa + d; if (n < 1 || (pv.toplam && n > pv.toplam)) return; pv.sayfa = n; void ciz(); }

  $('pKapat').addEventListener('click', kapat);
  $('pOnceki').addEventListener('click', () => git(-1)); $('pSonraki').addEventListener('click', () => git(1));
  $('pYakin').addEventListener('click', () => { pv.zoom = Math.min(5, pv.zoom + 0.5); void ciz(); });
  $('pUzak').addEventListener('click', () => { pv.zoom = Math.max(1, pv.zoom - 0.5); void ciz(); });
  $('pSigdir').addEventListener('click', () => { pv.zoom = 1; void ciz(); });
  document.addEventListener('keydown', e => {
    if ($('pdfGoruntuleyici').hidden) return;
    e.stopImmediatePropagation(); // alttaki sayfa görüntüleyici aynı tuşlara tepki vermesin
    if (e.key === 'Escape') kapat(); else if (e.key === 'ArrowLeft') git(-1); else if (e.key === 'ArrowRight') git(1);
  }, true);

  return { ac, kapat };
}
