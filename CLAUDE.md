# GıdaRef — proje talimatı (Claude Code)

## Ürün
Türkiye'deki gıda mühendisleri için resmî kaynaklı, hızlı mevzuat başucu uygulaması. Telefonda 10–15 saniyede: ürün yazınca o ürünü kapsayan limitler, bulaşan yazınca geçtiği tüm ürünler, her sonuçta madde no ve kaynak sayfa.
Kapsam yol haritası: (1) Bulaşanlar Yönetmeliği Ek-1 — bu paketle hazır, (2) Mikrobiyolojik Kriterler Yönetmeliği, (3) İnsani Tüketim Amaçlı Sular Hakkında Yönetmelik, (4) HACCP/BRC/FSSC/ISO/TSE rehber yazıları, (5) sektör süreçleri (et, süt, yağ, çikolata, gofret, catering).

## Mevcut durum
- `referans/GidaRef_v2_calisan_prototip.html`: claude.ai'de yayınlanmış, çalışan tek dosyalık prototip. Arama çekirdeği, tarih mantığı, görüntüleyici ve 30 kabul testi içinde (`#testler`). Yeni kodun davranış referansıdır; davranışlar korunmalı.
- `veri/ek1_satirlar.jsonl`: Ek-1'in 45 sayfasından elle (görsel okuma) çıkarılmış 482 değer satırı, 338 madde (30.10.2026: sayfa 18–19'a bölünmüş 3.1.9.1 iki kez girilmişti, tek satıra indirildi; önceki sayı 483). Alanlar: sayfa, madde, urun_ifadesi, kategori, istisna, analit, deger, birim, esas, tarih (itibaren), dipnot, not.
- `veri/gidaref_kayitlar_v2.json`: satırların madde bazında gruplanmış hali (343 kayıt; 6'sı Bakanlık talimatı karşılaştırma değeri) + ürün sınıflandırması (106 ürün), bulaşan aile eş anlamlıları, öneriler.
- `public/kaynaklar/` (devir paketinde `resmi_kaynaklar/`): üç orijinal PDF, ASCII adlarla; eşleme ve SHA-256 README'de. Ek-1 taranmış görüntüdür (metin katmanı yok); talimat PDF'inde metin katmanı var.

## Değişmez kurallar
1. **Resmî maksimum limit** (Ek-1) ile **Bakanlık karşılaştırma değeri** (talimat Ek-2) asla karıştırılmaz; ayrı tür, ayrı görünüm.
2. **Doğrulama kapısı:** Hiçbir kayıt kullanıcıya "güncel/onaylı" gösterilmez, ta ki `guncellik` alanı (teyit tarihi + kaynak) doldurulana kadar. Durumlar: `okundu` (tek okuma), `eslesti` (iki kez kontrol), `guncel` (hukuki güncellik teyitli).
3. OCR metni hiçbir zaman sayısal limit kaynağı olarak kullanılmaz.
4. Bir limitin listelenmesi "zorunlu analiz" anlamına gelmez; ürün aramalarında bu uyarı her zaman görünür.
5. "En çok aranan" yalnızca gerçek, anonim arama sayımı varsa gösterilir.
6. Resmî Gazete metni kullanılabilir; ISO, FSSC, BRCGS, IFS, TSE standartlarının metni telifli — yalnız kendi açıklamalarımız yazılır.
7. Veri dosyalarını üzerine yazmadan önce yedekle; her veri değişikliği testle gelir.

## Arama davranışı (prototipte uygulanmış hali korunacak)
- Türkçe normalleştirme (ı/i, ş, ğ, ü, ö, ç; ASCII yazım), ek atma ve ünsüz yumuşaması (çekirdeği → çekirdek).
- Sorgu terimlere ayrılır: ürün, ürün grubu, bulaşan ailesi, bulaşan grubu ("ağır metal", "mikotoksin"); kalan kelimeler satır metninde tam metin olarak aranır.
- Ürün eşleştirme üç seviye: (1) doğrudan ürün satırı, (2) üst kategori satırı (ör. fındık → sert kabuklu meyve), (3) istisnası ürünü anan satır → "istisnayı kontrol edin". Satır başka belirli bir ürüne özgüyse gösterilmez. İstisnası, ürünün doğrudan satırına madde numarasıyla yönlendiriyorsa gizlenir ve sayısı belirtilir; yalnız koşullu istisnalarda (`kismi: true`, ör. 1.1.12) gizlenmez.
- Dipnot 1: meyve limitleri sert kabuklu meyveleri kapsamaz.
- Aşamalı limitler: bugünün tarihine göre geçerli değer + sıradaki değer(ler). Tarihsiz değer başlangıç değeridir.

## Bilinen açıklar
- 482 satırın çoğu tek okuma; ilk 8 değer iki kez eşleşti. Kontrol modu hazır (sprint 4: `#kontrol`, `npm run kontrol:uygula`, geçmiş `data/ek1/kontrol_gecmisi.jsonl`); ikinci okumayı bir insanın (tercihen gıda mühendisi) yapması gerekiyor. Düzeltme önerileri otomatik işlenmez.
- Ürün sınıflandırması (`urun_siniflandirmasi_kaynak.py`) bir gıda mühendisi tarafından gözden geçirilmeli.
- Koşullu istisnalar yalnız 1.1.12'de işaretli; benzerleri olabilir.
- Bilinçli olarak bırakılan veri/arama tutarsızlıkları (içme sütü/yoğurt aramaları, kuru baz/kuru madde, dipnot 1, eksik talimat kayıtları): `docs/acik_tutarsizliklar.md`. Kullanıcı onayı olmadan düzeltilmez.
- Hukuki güncellik: Bulaşanlar Yönetmeliği (RG 5.11.2023, 32360) için sonraki değişiklik taraması elle yapılmalı; talimat "Revizyon 0".
- ~~Prototip görselleri dosyaya gömüyor~~ Çözüldü (sprint 3): sayfa görüntüleri `public/sayfalar/`, PDF'ler `public/kaynaklar/`, PDF.js görüntüleyici `src/ui/pdf.ts`.

## Teknik yön (öneri, gerekirse gerekçeyle değiştir)
- Önce sunucusuz: TypeScript + Vite ile PWA (telefona kurulabilir), veri JSON dosyaları, sayfa görüntüleri ve PDF'ler statik varlık. Barındırma: statik hosting (Cloudflare Pages / Netlify / Vercel).
- Veri şeması: her yönetmelik kendi tablo yapısıyla (mikrobiyolojik kriterlerde n, c, m, M ve aşama alanları farklı); ortak alanlar: kaynak, madde, sayfa, ürün, kategori, istisna, durum, güncellik. Ortak ürün sınıflandırması tüm yönetmelikleri bağlar.
- Hesap/abonelik (99 TL hipotezi) ve kaynaklı soru-cevap asistanı sonraki aşama; doğruluk ve saha pilotundan önce eklenmez.
- Test: arama çekirdeği için birim testleri (prototipteki 30 kabul testi taşınır) + Playwright ile mobil genişlikte uçtan uca test.

## İlk sprint
1. Git deposu kur, bu paketi `data/` ve `docs/` altına yerleştir; prototipi değiştirmeden `reference/` altında tut.
2. Arama çekirdeğini prototipten TypeScript modülüne taşı; 30 kabul testini birim/uçtan uca testlere çevir ve geçir.
3. Sayfa görüntülerini ve PDF'leri statik dosya yap; PDF.js ile ilgili sayfayı açan görüntüleyici.
4. Kontrol modu: satır listesi + sayfa görüntüsü, "eşleşti / düzelt" kaydı; değişiklik geçmişi tutulur.
5. PWA olarak yayınla; `npm install`, `npm run dev`, `npm test` talimatlarını README'ye yaz.
