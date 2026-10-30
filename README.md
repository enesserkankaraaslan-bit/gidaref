# GıdaRef

Türkiye'deki gıda mühendisleri için resmî kaynaklı, hızlı mevzuat başucu uygulaması (PWA).
Şu anki kapsam: Türk Gıda Kodeksi Bulaşanlar Yönetmeliği Ek-1 (RG 5.11.2023, 32360) ve Bakanlık Bulaşanlar Talimatı Ek-2 karşılaştırma değerleri.

Proje kuralları, arama davranışı ve yol haritası için: [CLAUDE.md](CLAUDE.md).

## Kurulum ve çalıştırma

Gerekenler: Node.js 22+ (LTS) ve npm.

```bash
npm install
npm run dev          # geliştirme sunucusu: http://localhost:5173
npm test             # birim testleri (Vitest): 27 kabul testi + veri tutarlılığı + normalleştirme
npm run test:e2e     # uçtan uca testler (Playwright, 375 px telefon genişliği, kurulu Google Chrome ile)
npm run build        # üretim derlemesi: dist/
```

Chrome kurulu değilse: `node node_modules/@playwright/test/cli.js install chromium` ve `PW_KANAL=chromium` ile çalıştırın.
Komutlar araçları `node node_modules/...` ile çağırır; klasör yolunda `&` olduğunda `npx` kısayolları Windows'ta bozulur.

Uygulama içinde `#testler` adresi aynı kabul testlerini tarayıcıda çalıştırır (30 test).

## Klasörler

| Yol | İçerik |
|---|---|
| `src/core/` | Arama çekirdeği (DOM'dan bağımsız): normalleştirme, madde atıfları, ürün eşleştirme, tarih mantığı |
| `src/kabul/` | Prototipten taşınan 27 çekirdek kabul testi (Vitest ve `#testler` ortak kullanır) |
| `src/ui/` | Arayüz (düz TypeScript, çatı yok) |
| `data/ek1/` | Veri: `gidaref_kayitlar_v2.json` (uygulamanın okuduğu), `ek1_satirlar.jsonl` (satır düzeyi), dipnotlar, dönüşüm betikleri |
| `public/kaynaklar/` | Orijinal PDF'ler (aşağıdaki tablo); uygulamada PDF.js ile açılır |
| `public/sayfalar/` | Kaynak sayfa görüntüleri (`e1/1..45.jpg`, `tl/9,10,14,15.jpg`), prototipten çıkarıldı; JPG numarası = PDF sayfa numarası |
| `reference/` | Çalışan prototip, **değiştirilmez**; davranış referansı |
| `docs/` | Doğrulama kaydı ve devir notları |
| `tests/unit`, `tests/e2e` | Vitest ve Playwright testleri |

## Resmî kaynaklar

| Dosya | Orijinal ad | Sayfa | SHA-256 |
|---|---|---|---|
| `public/kaynaklar/ek1.pdf` | BULAŞANLAR TEBLİĞİ EK1.pdf | 45 (taranmış, metin katmanı yok) | `1d6a36b5a800d2f4d69fe3981b5a9c1d7eb27ad3ab5d2a8cb6315c026bd898f5` |
| `public/kaynaklar/talimat.pdf` | BAKANLIK BULAŞANLAR TALİMATI 17.03.2025.pdf | 18 (metin katmanı var) | `3b62c8e25d81bfbe9e44c4bbf19e9161e1ffbcacb2fdc115c6c42ba62ff79d93` |
| `public/kaynaklar/yonetmelik.pdf` | GIDA BULAŞANLAR TEBLİĞİ.pdf | 3 | `84c733678f132988d7d7f13463316a6f137a19592b7b530b50ba38a27b22df6a` |

Görüntüleyici iki katmanlı: "Sayfayı gör" hızlı JPG görünümünü açar (telefonda sayfa başına ~100 KB); oradaki **PDF** düğmesi aynı sayfayı orijinal PDF'te PDF.js ile açar. PDF.js modülü yalnız bu düğmeye ilk basıldığında yüklenir; PDF'ler ilk açılışta çevrimdışı önbelleğe girer.

## Kontrol modu (ikinci okuma)

Uygulamada `#kontrol` (alt bilgide "Kontrol modu (editör)"): her Ek-1 değer satırı sayfa görüntüsünün yanında gösterilir; kontrol eden kişi adını yazar ve **Eşleşti** ya da **Düzelt** der (klavye: E, D, ←/→).

1. Kararlar tarayıcıda saklanır; **Kayıtları indir** yalnız henüz depoya işlenmemiş kararları `kontrol_kayitlari_<tarih>.jsonl` olarak verir. Başka cihazdaki kayıtlar **Kayıt yükle** ile birleştirilebilir.
2. Önce rapor, sonra yazma:
   ```bash
   npm run kontrol:uygula -- kontrol_kayitlari_2026-10-30.jsonl
   npm run kontrol:uygula -- kontrol_kayitlari_2026-10-30.jsonl --yaz
   ```
   `--yaz`: `../yedekler/` altına yedek alır, kayıtları `data/ek1/kontrol_gecmisi.jsonl`'e **ekler** (silmez), tüm değerleri eşleşen madde gruplarını `okundu → eslesti` yapar ve CSV'deki doğrulama sütununu günceller.
3. **Düzeltmeler hiçbir zaman otomatik işlenmez**; betik yalnız listeler. Değer değişikliği onayla, yedekle ve testle ayrıca yapılır. Kontrol modu `guncel` (hukuki güncellik) durumu veremez.
4. `npm test`: kabul testlerindeki "iki kez eşleşen grup" sayısı yeni değere güncellenir; değişiklik testle birlikte commit edilir.

Satır kimliği: madde + ürün ifadesi + analit + tarih (veri dosyasına yeni alan eklenmedi; tekilliği testle korunur).

## Yayın (Cloudflare Workers, statik varlıklar)

Uygulama sunucusuzdur; `dist/` klasörü herhangi bir statik barındırmada çalışır. Cloudflare'de **Workers** projesi olarak (Workers Builds, özel GitHub deposuna bağlı) yayınlanır; yapılandırma `wrangler.jsonc`'dedir (sunucu kodu yok, yalnız `dist/`).

| Workers Builds ayarı | Değer |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Build variables | `VITE_ONIZLEME` = `1` (önizleme) ya da `0` (herkese açık) |

Yerelde prova: `npm run build` ardından `node node_modules/wrangler/bin/wrangler.js deploy --dry-run`. Node sürümü `.node-version` dosyasından okunur (22). (Cloudflare Pages'te de çalışır: build `npm run build`, çıktı `dist`.) Güvenlik ve önbellek başlıkları `public/_headers`'tadır (CSP, HTML/service worker için `no-cache`, `/assets/*` için kalıcı önbellek).

**Önizleme ve herkese açık sürüm:** `VITE_ONIZLEME` `0` dışında her değerde (varsayılan) derleme önizlemedir: sayfada önizleme şeridi, `noindex` etiketi ve `robots.txt` ile arama motorlarına kapalı, alt bilgide kontrol modu bağlantısı. `0` olduğunda bunlar kalkar. İkinci okuma tamamlanmadan herkese açık yayın yapılmaz.

**Gizlilik:** yazı tipleri dahil tüm dosyalar aynı sunucudan gelir; üçüncü taraf istek, çerez ya da analitik yoktur (CSP `connect-src 'self'`).

**Telefona kurulum:** Android Chrome'da menü → "Uygulamayı yükle"; iPhone Safari'de Paylaş → "Ana Ekrana Ekle". Uygulama bir kez açıldıktan sonra arama ve sayfa görüntüleri çevrimdışı çalışır; PDF'ler ilk açıldıklarında çevrimdışı kullanılabilir hale gelir.

## Veri kuralları (özet)

- Değerler yalnız `data/ek1/` altındaki dosyalardan okunur; kodda değer kopyalanmaz.
- Veri dosyasını değiştirmeden önce yedek alın; her veri değişikliği bir testle gelir.
- `guncellik` alanı dolmadıkça hiçbir kayıt "güncel/onaylı" gösterilmez.
