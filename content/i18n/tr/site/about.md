---
title: Anemone hakkında ve içerik nasıl hazırlandı
description: Anemone'yi kim yaptı; dersler nasıl araştırılıp yapay zekâ desteğiyle yazıldı ve denetlendi, neler henüz doğrulanmadı.
updated: 2026-09-20
---
**Anemone** (Yunanca *anemos*, "rüzgâr": mesajların rüzgâr gibi yayılması), üniversite öğrencileri için ücretsiz bir ders sistemidir. İlk dersi *Kitle İletişim Kuramları*dır. Dersler; kısa kartlar, sorular, sınavlar, aralıklı tekrar ve yalnızca kendi cihazında saklanan ilerlemeden oluşur.

## Kim yaptı?

Kodlayan: **Alperen Yavuz**. Yazan: **Alperen Yavuz**. Alperen projeyi tasarlar ve yönetir; yayımlanan her şeyin sorumluluğu ondadır.

## İçerik nasıl hazırlandı? (yapay zekâ destekli, kontrollü ve düzenlenmiş)

Bu sitedeki her şey, yazılım da metin de, Alperen Yavuz'un yönlendirmesiyle yapay zekâ desteğiyle üretildi (kullanılan model Anthropic'in Claude'udur). Bu, bir sohbet robotuna yöneltilmiş tek bir istek değildir. Bu proje için özel olarak hazırlanmış, kontrollü ve çok adımlı bir süreçtir:

1. **Araştırma.** Her ders için ders izlenceleri ve ders kitapları karşılaştırılır yanı sıra uluslararası ders kitapları ve her şeyden önce özgün eserler ve çalışmalar taranır.
2. **Taslak.** Dersler bu kaynaklardan, yapay zekânın kendi cümleleriyle, yazılı bir yazım rehberine uyularak taslaklanır (önce doğruluk, kart başına tek fikir, düşündüren sorular).
3. **Doğrulama.** Her atıf bağımsız bir veritabanına karşı sınanır (makaleler için Crossref, kitaplar için kütüphane ve yayınevi kayıtları). Doğrulanamayan kaynak kullanılmaz. Biyografiler için en az iki bağımsız kaynak aranır. Otomatik doğrulayıcılar; başvuruların çözüldüğünü, önkoşulların tutarlı olduğunu, her sorunun tek doğru cevabı olduğunu ve çevirilerin özgün metinle aynı yapıya sahip olduğunu denetler.
4. **Düzenleme.** Taslaklar sonraki turlarda gözden geçirilir; doğrulanamayan her şey tahmin edilmek yerine listelenir ve dışarıda bırakılır.

Anlatım özgündür. Metin kitaplardan kopyalanmaz: olgular, adlar, tarihler ve fikirler serbestçe kullanılır ve kaynağı her zaman belirtilir; alıntılar çok kısa ve atıflıdır. Burada hiçbir şey bir ders kitabı kopyalanarak yazılmadı.

## Bu ne değildir?

- Henüz **bir üniversite öğretim üyesi tarafından gözden geçirilmedi**. Yukarıdaki kontrollere rağmen hata olabilir. Bir hata bulursan lütfen bize bildir (İletişim sayfasına bak).
- Sınav sonucu konusunda hiçbir garanti vermez.

## Kaynaklar ve "son güncelleme" tarihi

Sayfalarda uzun kaynakça listeleri yoktur; kaynaklar, doğrulama durumlarıyla birlikte projenin açık deposunda tutulur. Her sayfa en son ne zaman güncellendiğini gösterir. Hazırlanmakta olan dersler "Yakında" diye işaretlidir ve arama motorlarına indekslettirilmez.

## Çeviriler

Kaynak dil Türkçedir. Diğer diller aynı yapı denetimleriyle yapay zekâ tarafından çevrilir ve anadili konuşan biri okuyana kadar **otomatik çeviri** diye etiketlenir. Her sayfada çeviri düzeltmesi önermek için bir bağlantı vardır.

## Erişilebilirlik

WCAG 2.2 AA düzeyini hedefliyoruz: hiçbir yerde ses yok, tam klavye kullanımı, görünür odak, cevaplar ve seviye atlamaları için ekran okuyucu duyuruları, ayarlanabilir yazı boyutu ve aralığı, disleksi dostu seçenek, azaltılmış hareket, yüksek kontrast, renk körlüğü dostu palet ve e-ink ekranlar için siyah-beyaz kâğıt modu. Otomatik denetimler ve klavye kontrolleri her sürümün parçasıdır. **Görme engelli kullanıcılarla gerçek ekran okuyucu testi henüz yapılmadı**; birini kullanıyorsan ve bir yer zorsa lütfen bize yaz.

## Lisans

Yazılım MIT lisanslıdır. Ders içeriği (metin, sorular ve veriler) CC BY-SA 4.0 lisanslıdır: kaynak göstererek ve aynı lisansla paylaşabilir ve uyarlayabilirsin. Kaynak kod GitHub'dadır.
