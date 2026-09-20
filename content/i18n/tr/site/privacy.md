---
title: Gizlilik
description: Anemone neyi, nerede saklar; misafir ve hesaplı kullanım arasındaki fark ve verini nasıl indirip silebileceğin. Sade dille yazıldı.
updated: 2026-09-20
---
**Kısaca:** Misafir olarak girersen ilerleme yalnızca bu tarayıcıda kalır. Hesap açarsan ilerleme veritabanında saklanır. E-posta, çerez, reklam ve izleyici yok.

## Misafir

- Hiçbir şey sunucuya gönderilmez. İlerleme, XP, rozetler, istatistikler, tekrar kutuları, ayarlar ve çalışma süreleri tarayıcının yerel depolamasında durur (`anemone.` ile başlayan anahtarlar).
- Bunları Ayarlar sayfasından dışa aktarabilir ya da silebilirsin; tarayıcı verilerini temizlemek de aynı işi görür.

## Hesap

- Yalnızca kullanıcı adı ve şifre istenir; e-posta yok. Şifren cihazında bir anahtara dönüştürülür, şifrenin kendisi sunucuya hiç gitmez.
- Sunucu (Cloudflare Workers ve D1 veritabanı) şunları saklar: kullanıcı adı, cihazında türetilen anahtarın doğrulaması, ilerleme kaydın (kartlar, sorular, tekrar kutuları, XP, rozetler, ayarlar, çalışma süreleri) ve özet sayılar.
- Profil alanları (görünen ad, yaş aralığı vb.) isteğe bağlıdır ve varsayılan olarak gizlidir. Fotoğraf yüklenmez. Skor tablolarına ve profile girmek senin seçimindir.
- Hesap sayfasından her şeyi indirebilir ya da hesabını ve veritabanındaki tüm kayıtlarını istediğin an silebilirsin.
- 18 yaş altındakilerin adı ve serbest metinleri herkese açık gösterilmez. Sakıncalı ad ve metinler engellenir ve bildirilebilir.

## Her durumda

- Site çerez bırakmaz, analitik ya da reklam kullanmaz, üçüncü taraf betik veya yazı tipi yüklemez. Statik sayfalara kişisel veri yazılmaz.
- Çevrimdışı modu kullanırsan ders dosyaları tarayıcının önbelleğinde tutulur.
- Site GitHub Pages ile sunulur. Her web barındırıcısı gibi GitHub, sayfa istediğinde IP adresin gibi teknik verileri kendi gizlilik bildirimi çerçevesinde işleyebilir; bu verileri biz almayız.

## İletişim

Gizlilikle ilgili sorular için İletişim sayfasına bak.
