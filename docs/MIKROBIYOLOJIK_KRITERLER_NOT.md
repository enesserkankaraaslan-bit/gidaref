# Mikrobiyolojik Kriterler modülü — veri notu

**Kaynak:** Türk Gıda Kodeksi Mikrobiyolojik Kriterler Yönetmeliği, Resmî Gazete 13.02.2025, sayı 32812 (2011 tarihli yönetmeliği yürürlükten kaldırdı; AB 2073/2005 uyumlu).
**Kaynak dosyalar:** Kullanıcının yüklediği yönetmelik metni (.doc) ve ekler (1-2.docx, 3-4.docx).

## Çıkarma yöntemi
Ekler metin tabanlı Word tablolarıdır (taranmış değil). Satırlar tablo hücrelerinden programla çekildi; görsel okuma veya OCR yoktur.
- Birleştirilmiş hücreler gerçek hücre yapısından okunarak m ve M ayrıldı (tek hücre = tek limit, m = M).
- Üst simgeler korundu: 10², 5×10¹, cm².
- Dipnot numaraları satırdan ayrıldı ve her tablonun dipnot listesiyle eşleştirildi. Ek-2'de "kriterin uygulanacağı basamak" ve "uygun çıkmazsa alınacak tedbir" sütunları dipnot metinleriyle dolduruldu.

## Dosyalar
- `mikrobiyolojik_kriterler.jsonl` / `.csv`: 174 satır (Ek-1 gıda güvenilirliği: 128, Ek-2 üretim hijyeni: 34, Ek-3 patojen limitleri: 12).
- `mikrobiyolojik_kriterler_dipnot_ve_degerlendirme.json`: her tablonun dipnotları ve "Analiz sonuçlarının değerlendirilmesi" metinleri (uygun / kabul edilir / uygun değil kuralları).
- `mikrobiyolojik_kriterler_ek4_numune_alma.json`: Ek-4 numune alma kuralları (paragraf metni; tablo değil).

## Alanlar
`id, ek, tablo, madde, ust_baslik, urun_ifadesi, kategori (ürün etiketleri), mikroorganizma, n, c, m, M, tek_limit, limit_turu (sayısal/yokluk), metot, basamak, tedbir, dipnot, dipnot_metinleri, uyari, durum, kaynak`
- Aksi belirtilmedikçe birim kob/g-mL'dir (Ek-1 dipnot 2). Birim limit metninde yazıyorsa (EMS/100 g, mg/kg, log kob/cm²) o geçerlidir.
- `limit_turu = yokluk`: "25 g-mL'de bulunmamalı" türü kriterler.
- `durum = tek_okuma`: otomatik çekildi, ikinci kontrol bekliyor.

## Dikkat edilmesi gerekenler
1. **Belgede atıf tutarsızlığı (2.5.4 ve 2.5.5):** Basamak/tedbir dipnot numaraları kaymış görünüyor; `uyari` alanında açıklandı. Değerler düzeltilmedi, resmî metinle teyit edilmeli.
2. **Aşamalı c değeri (2.1.9 kanatlı karkasında Campylobacter):** Tabloda c = 20; dipnota göre 31.12.2025 sonrası 15, 31.12.2026 sonrası 10. JSONL'de `c_asamali` alanı var; uygulama tarih mantığıyla göstermeli.
3. **1.1.1 madde numarası** belgede yazılı değil ("Pastörize süt"); sıradan çıkarıldı.
4. **Ek-2 süt tablosu dipnot 9:** Petri kabı çapları kaynak dosyada eksik (sembol/görsel olarak kaybolmuş olabilir).
5. **Ek-2 2.1.1 / 2.1.2:** n ve c belgede boş; limitler günlük ortalama değerdir (dipnot 4).
6. **Ürün etiketleri** (`kategori`) anahtar kelime + elle düzeltmeyle atandı; gıda mühendisi gözüyle gözden geçirilmeli.
7. Yönetmelik madde 2(2): Hayvansal gıdalar özel hijyen kuralları, içme suyu ve katkı maddesi spesifikasyonlarındaki mikrobiyolojik kriterler saklıdır; bu modül onları kapsamaz.
