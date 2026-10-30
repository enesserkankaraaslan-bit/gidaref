# Açık tutarsızlıklar (30.10.2026)

Devir incelemesinde bulundu. Kullanıcı kararıyla **şimdilik olduğu gibi bırakıldı**; hiçbir değer değiştirilmedi.
Çözülen: 3.1.9.1 mükerrer kaydı (commit 4a974ec).

## 1. "Başka ürüne özgü" kuralı genel satırları da gizliyor
`urunBagla` (src/core/arama.ts), satırın etiketlerinde başka bir ürün adı geçiyor ve bu ad satır metninde de varsa satırı gizler. Satır o ürünü anıp üst kategoriyi de kapsadığında bu yanlış olur:

| Satır | Belgedeki ifade | Sonuç vermeyen arama |
|---|---|---|
| 1.1.16, 3.1.16 | Çiğ süt, **ısıl işlem görmüş süt**, süt bazlı ürünlerin üretiminde kullanılan süt | içme sütü (pastörize, UHT) |
| 4.1.11 | Çiğ süt ve **süt ürünleri** | yoğurt, içme sütü |
| 1.1.4 | Yerfıstığı ve **diğer yağlı tohumlar** | susam, ayçiçeği çekirdeği, keten, soya vb. |
| 1.5.4 | Ekmek, **pastacılık ürünleri**, bisküvi, **tahıl bazlı atıştırmalıklar**… | kek, kraker |
| 4.2.1.1 | Et: **sığır**, domuz ve kanatlı hayvan eti | sığır eti (etiketlerde "sığır eti" yok) |

Önerilen çözüm (uygulanmadı): `kismi` benzeri `genel: true` bayrağı (1.1.4, 1.1.16, 3.1.16, 4.1.11, 1.5.4), 4.2.1.1 etiketlerine "sığır eti", içme sütü üst kategorisi `ısıl işlem görmüş süt, süt`.

Gıda mühendisi kararı gerekenler: 2.4.5/2.4.6 (bebeğe yönelik ifadenin bitkisel infüzyonları kapsayıp kapsamadığı → "nane"), 2.5.2 (haşhaşlı fırıncılık ürünleri → "ekmek", belki "istisnayı kontrol edin").

## 2. Ölçüm esası adlandırması
1.2.19.3'te "kuru baz", 5 satırda "kuru madde", 9 satırda "kuru ürün". Aynı anlam mı, sayfa görüntüsünden teyit edilmeli.

## 3. Dipnot 1 hiçbir satırda yok
"Meyve limitleri sert kabuklu meyveleri kapsamaz" yalnız arama mantığıyla (ürün sınıflandırması) uygulanıyor; satırların `dipnot` alanında geçmiyor.

## 4. Doğrulama kaydı #1'in talimat önerileri uygulanmadı
- BL-009: kestane, çam fıstığı, ceviz, kaju için nikel 10 mg/kg ayrı kaydı yok.
- BL-011: hazır (çözünebilir) kahve akrilamid 850 µg/kg ayrı kaydı yok.
- BL-010: patates ürünleri ailesi (cips 750 vb.) yok.
