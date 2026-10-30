# GıdaRef

Türkiye'deki gıda mühendisleri için resmî kaynaklı, hızlı mevzuat başucu uygulaması (PWA).
Şu anki kapsam: Türk Gıda Kodeksi Bulaşanlar Yönetmeliği Ek-1 (RG 5.11.2023, 32360) ve Bakanlık Bulaşanlar Talimatı Ek-2 karşılaştırma değerleri.

Proje kuralları, arama davranışı ve yol haritası için: [CLAUDE.md](CLAUDE.md).

## Kurulum ve çalıştırma

Gerekenler: Node.js 20+ (LTS) ve npm.

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

## Veri kuralları (özet)

- Değerler yalnız `data/ek1/` altındaki dosyalardan okunur; kodda değer kopyalanmaz.
- Veri dosyasını değiştirmeden önce yedek alın; her veri değişikliği bir testle gelir.
- `guncellik` alanı dolmadıkça hiçbir kayıt "güncel/onaylı" gösterilmez.
