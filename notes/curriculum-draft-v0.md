# Anemone — Kitle İletişim Kuramları: müfredat taslağı v0

Durum: **onay bekliyor** (2026-09-20). Bu dosya proje sahibi (Alp) içindir; Türkçedir. Sitenin kendisi ve README İngilizce olacak.
Hiçbir ders içeriği yazılmadı. Aşağıdaki her künye ya ✓ (bağımsız bir veritabanında eşleşti) ya ◇ (içerik aşamasında doğrulanacak) ya ⚠ (kaynaklar çelişti) olarak işaretlidir.

---

## 1. Ad, repo, alan adı kontrolü

| Kontrol | Sonuç |
|---|---|
| `github.com/alplix/anemone` | **Boş** (gh: repo bulunamadı) |
| `github.com/alplix/anemone-course` | Boş |
| `alplix.github.io/anemone/` | 404 (boş) |
| Başkalarının `anemone` depoları | Var (Ruby web örümceği `chriskite/anemone`, iOS tema motoru, Zola teması, 3DS aracı vb.). Çakışma değil ama arama sonuçlarında "Anemone" kalabalık bir marka; sayfa başlıklarında "Anemone — Kitle İletişim Kuramları" gibi açıklayıcı ek şart. |
| Öneri | Repo adı **`anemone`**. |
| **Karar (Alp, 2026-09-20)** | **Özel alan adı alınmayacak; site GitHub Pages'te (`alplix.github.io/anemone/`) kalıcı.** `site.config.json` yine de `origin` ve `basePath` alanlarıyla canonical'ları tek yerden ayarlanabilir tutar (ileride fikir değişirse tek satır). Aşağıdaki aday listesi yalnızca kayıt için duruyor. |
| Alan adı adayları (RDAP; kesin teyit kayıt şirketinde) | `anemone.study`, `anemone.education`, `anemone.school`, `anemone.courses`, `anemone.academy`, `anemonelearn.org` → kayıt görünmüyor (muhtemelen boş). `anemone.org` ve `anemone.app` → **kayıtlı**. Satın alma kararı sende; fiyatlara bakmadım. |

## 2. Neye bakıldı, neye bakılamadı

**Okunanlar (yalnızca yapı/içindekiler; metin kopyalanmadı):**
- **AUZEF resmî ders notu**: Doç. Dr. Veli Polat, *Kitle İletişim Kuramları*, "Ortak Ders", İstanbul Üniversitesi AUZEF, 2016 — 14 ünite (aşağıda "P1…P14"). Yazarın kendi notuna göre "kapsamlı bir derleme"; yani **bağımsız kaynak sayılmaz**, doğrudan alıntı içeren bir derleme. Kendi sınıflaması (tutucu / değişimci yaklaşımlar) alanda ana-akım "egemen / eleştirel" ayrımıyla örtüşür ama aynı değildir; "Sınavda böyle sorulur" kartlarında AUZEF terimlerini de vereceğim.
- **İÜ EBS izlenceleri**: `GZTK1376` (Prof. Dr. Burcu Kaya Erdem; kaynaklar: Yaylagül, Erdoğan–Alemdar *Öteki Kuram*, Horkheimer–Adorno, Marx) ve `HILT2107` (Frankfurt Okulu, eleştirel ekonomi politik, kültürel çalışmalar, postmodernizm ve medya). Sayfalarda haftalık konu listesi **yok**.
- **Yaylagül**, *Kitle İletişim Kuramları: Egemen ve Eleştirel Yaklaşımlar*, Dipnot, Ankara, 2006 (1. baskı; ISBN 975-9051-21-4) içindekiler ("Y I–III").
- **Ankara Üniversitesi açık ders** İLT306 *İletişim Kuramları II* hafta listesi ("ANK").
- **McQuail** *Mass Communication Theory* içindekiler (LoC/Sage; 6. baskı yapısı doğrulandı, 7. baskı yalnızca "yeni bir *Canon of Media Effects* bölümü" notuyla), **Baran & Davis** bölüm yapısı (bölüm numaralarını doğrulamadım; "Section II/III/IV" düzeyinde atıf yapıyorum).

**Erişilemeyenler / doğrulanamayanlar:** Erdoğan–Alemdar *Öteki Kuram* içindekileri (bulunamadı; yayınevi kaynaklarda Erk olarak geçiyor, senin notundaki "Ürün" ile uyuşmuyor ◇); Anadolu AÖF ve diğer AÖF izlenceleri (bakılmadı); AUZEF'in *hangi programda hangi haftada* okutulduğu (public sayfalarda ders planı bulunamadı — Polat'ın 14 ünitesini "AUZEF omurgası" aldım, sen programını söylersen sınav dilini ona göre ayarlarım).

**Not (şeffaflık):** İçindekileri okumak için iki PDF'yi (AUZEF e-kitap, Yaylagül) geçici klasöre indirdim (~1,8 MB'şar). Repoya girmedi; PDF'leri ve çıkarılan metinleri sildim.

**Yabancı kaynaklar (senin son notun):** Uluslararası kaynakların hepsi serbest; her ders için en az bir uluslararası ikincil kaynak (McQuail/Baran & Davis) ve mümkünse birincil eser var. "Kusursuz bilgi" hedefini şöyle karşılayacağım: her künye betikle Crossref/kataloga karşı sınanır, çelişen/bulunamayan **yayımlanmaz, listeye girer**, biyografilerde iki bağımsız kaynak şartı aranır. Mutlak kusursuzluk sözü veremem; söz verdiğim şey doğrulanabilirlik ve şeffaf hata listesi.

## 3. Müfredat: 9 ünite, 39 ders, ~22 saat

Süreler dakika (12–14 kart × ~75 sn okuma + sorular). Önkoşullar DAG'dır (döngü yok; doğrulayıcı test edecek). Her ders sizin 12 bölümlük kalıbınızı izler (Bağlam → … → Özet kartı).

Kısaltmalar — **P**: Polat/AUZEF ünite no; **Y**: Yaylagül bölüm; **M**: McQuail bölümü/kısmı; **BD**: Baran & Davis kısmı; **ANK**: Ankara İLT306 hafta konusu.

### Ünite 1 — Temeller: toplum, iletişim, model
| ID | Ders | Önkoşul | dk | Kaynaklar |
|---|---|---|---|---|
| `what-is-theory` | Kuram nedir? İletişim çalışmalarının kısa tarihi ve kuram sınıflamaları (egemen/eleştirel; AUZEF: tutucu/değişimci) | – | 30 | P1, P12; Y I.1–5; M Part I–II; Gitlin 1978, *Theory and Society* 6(2) ✓; ANK-3 |
| `social-thought-roots` | Toplumsal düşüncenin kökleri: Comte, Spencer, Durkheim, Weber, Cooley | 1 | 35 | P1–P2; Y I.1; BD II; Durkheim *Règles* 1895 ◇; Weber ◇ |
| `functionalism-interactionism` | Yapısal işlevselcilik ve sembolik etkileşimcilik | social-thought-roots | 35 | P2; M Part II; Parsons 1937 ✓, Merton 1949 ✓, Mead 1934 ✓, Blumer 1969 ✓ |
| `mass-society` | Kitle toplumu ve kitle kültürü kuramı | social-thought-roots | 30 | BD II; M Part II; Y I.F.9; Le Bon ⚠, Tarde ⚠, Tönnies ⚠, Mills 1956 ✓ |
| `lasswell-shannon-weaver` | İletişim modelleri I: Lasswell, Shannon–Weaver | what-is-theory | 30 | P4; Y I.A.2; M Part II; Shannon & Weaver 1949 ✓; Lasswell 1948 ◇ |
| `process-models` | İletişim modelleri II: Schramm, Berlo (SMCR), Westley–MacLean, Newcomb ABX, Dance | lasswell-shannon-weaver | 35 | P6; Y I.C; M Part II; Westley & MacLean 1957 ✓; Newcomb 1953 ✓; Berlo 1960 ✓; Schramm 1954 ◇; Dance 1967 ◇ |

### Ünite 2 — Güçlü etki varsayımı ve propaganda
| ID | Ders | Önkoşul | dk | Kaynaklar |
|---|---|---|---|---|
| `propaganda-public-opinion` | Propaganda ve kamuoyu: Lippmann, Lasswell | mass-society, lasswell-shannon-weaver | 30 | P6.3; BD II; Lippmann 1922 ✓; Lasswell 1927 ✓ |
| `magic-bullet` | Şırınga / sihirli mermi ve erken etki araştırmaları (Payne Fund, "Mars'tan Gelen İstila") | propaganda-public-opinion | 30 | P10.1; Y I.A.1; BD II; Bineham 1988 ✓ (modelin "hiç savunulmadığı" tartışması); Cantril 1940 ✓ |
| `persuasion-attitudes` | İkna, tutum ve bilişsel uyum | magic-bullet | 35 | P4.3, P5; Y I.C.1; Hovland–Janis–Kelley 1953 ✓; Hovland & Weiss 1951 ✓; Festinger 1957 ✓; Bandura–Ross–Ross 1961 ✓ |

### Ünite 3 — Sınırlı etkiler dönemi
| ID | Ders | Önkoşul | dk | Kaynaklar |
|---|---|---|---|---|
| `voting-studies` | Seçmen araştırmaları, seçici maruz kalma, Klapper | persuasion-attitudes | 35 | P7.1; Y I.B; BD III; Lazarsfeld–Berelson–Gaudet 1944 ✓; Klapper 1960 ✓ |
| `two-step-flow` | İki aşamalı akış ve kanaat önderleri | voting-studies | 30 | P7.2–7.4; Y I.B; Katz 1957 ✓; Katz & Lazarsfeld 1955 ✓ |
| `gatekeeping` | Kapı bekçiliği ve haber değeri | lasswell-shannon-weaver | 30 | P7.4; Y I.F.5; M Part IV; Lewin 1947 ✓; White 1950 ✓; Galtung & Ruge 1965 ✓ |
| `diffusion` | Yeniliklerin yayılması ve modernleşme kuramları | two-step-flow | 35 | P7.9; Y I.F.8; Rogers 1962 ✓; Lerner 1958 ✓; Schramm 1964 ✓ |
| `dependency` | Toplumbilimsel yaklaşım ve bağımlılık modeli (Riley & Riley; Ball-Rokeach & DeFleur) | voting-studies, functionalism-interactionism | 30 | P7.5–7.8; Y I.D, I.F.7; Ball-Rokeach & DeFleur 1976 ✓; Riley & Riley 1959 ◇ |

### Ünite 4 — Etkilerin yeniden keşfi *(dikey dilim önerisi: `agenda-setting`, `cultivation`, `spiral-of-silence`)*
| ID | Ders | Önkoşul | dk | Kaynaklar |
|---|---|---|---|---|
| `uses-gratifications` | Kullanımlar ve doyumlar | voting-studies | 35 | Y I.F.1; M Part VI; BD IV; Katz–Blumler–Gurevitch 1973 ✓; Blumler 1979 ✓; Blumler & Katz 1974 ◇ |
| `agenda-setting` | Gündem belirleme ve öncüleme (priming) | voting-studies, gatekeeping | 40 | P9; Y I.F.3; McCombs & Shaw 1972 ✓; McCombs & Shaw 1993 ✓; Iyengar–Peters–Kinder 1982 ✓; Weaver 2007 ✓ |
| `framing` | Çerçeveleme | agenda-setting | 35 | M Part VII; Entman 1993 ✓; Scheufele 1999 ✓; Entman 2003 ✓; Goffman 1974 ✓; Iyengar 1991 ✓ (P/Y'de yok; yalnızca uluslararası kaynak) |
| `cultivation` | Kültivasyon (ekme) | magic-bullet, voting-studies | 40 | P8; Y I.F.2; Gerbner & Gross 1976 ✓; Gerbner ve ark. 1986 ◇ |
| `spiral-of-silence` | suskunluk sarmalı | cultivation | 40 | P10.2; Y I.F.4; Noelle-Neumann 1974 ✓; 1980 ✓ (Almanca), 1984 ◇ (İngilizce); 1973 ◇ |
| `knowledge-gap` | Bilgi açığı hipotezi | diffusion | 30 | Y I.F.6; Tichenor–Donohue–Olien 1970 ✓ |

### Ünite 5 — Teknoloji ve medya ortamı
| ID | Ders | Önkoşul | dk | Kaynaklar |
|---|---|---|---|---|
| `tech-determinism` | Teknolojik belirlenimcilik: Innis, McLuhan | what-is-theory | 35 | P11; Y I.E; Innis 1951 ✓; McLuhan 1962 ✓, 1964 ✓ |
| `media-ecology` | Medya ekolojisi: Ong, Postman, Meyrowitz | tech-determinism | 35 | ANK-4; Ong 1982 ✓; Postman 1985 ✓; Meyrowitz 1985 ✓ |

### Ünite 6 — Eleştirel yaklaşımlar
| ID | Ders | Önkoşul | dk | Kaynaklar |
|---|---|---|---|---|
| `marxist-foundations` | Marx'tan ideolojiye: altyapı–üstyapı, ideoloji, yabancılaşma | social-thought-roots | 35 | P3; Y II giriş; EBS GZTK1376 (Marx); Marx/Engels ◇ |
| `frankfurt-1` | Frankfurt Okulu I: Horkheimer, Adorno, kültür endüstrisi | marxist-foundations, mass-society | 40 | P13.1–13.3; Y II.A.2; EBS HILT2107; Horkheimer & Adorno 1947 ⚠ (1944 teksir) |
| `frankfurt-2` | Frankfurt Okulu II: Benjamin, Marcuse | frankfurt-1 | 30 | P13.4–13.5; Y II.A.1, II.A.3; Marcuse 1964 ⚠; Benjamin ◇ |
| `public-sphere` | Habermas: kamusal alan ve iletişimsel eylem | frankfurt-1 | 40 | P13.6; Y II.A.4; ANK-10; Habermas 1962 ⚠; Fraser 1990 ✓ |
| `hegemony-ideology` | Gramsci (hegemonya), Althusser (devletin ideolojik aygıtları) | marxist-foundations | 35 | Y II.B–C; M Part II; Gramsci ◇; Althusser 1970 ◇ |
| `political-economy` | İletişimin ekonomi politiği; propaganda modeli | marxist-foundations, propaganda-public-opinion | 40 | Y II.2; M Part III; Schiller 1969 ✓; Herman & Chomsky 1988 ✓; Smythe 1977 ◇; Golding & Murdock ◇; Garnham ◇; Mattelart ◇ |
| `globalization-imperialism` | Küreselleşme ve kültür emperyalizmi | political-economy, diffusion | 35 | Y III; M Part III; Schiller 1969 ✓; Tunstall 1977 ◇ |

### Ünite 7 — Kültür, dil, anlam
| ID | Ders | Önkoşul | dk | Kaynaklar |
|---|---|---|---|---|
| `semiotics` | Yapısalcı dilbilim ve göstergebilim: Saussure, Peirce, Lévi-Strauss, Barthes | what-is-theory | 35 | P14.1; Y II.D; Fiske 1982 ✓; Saussure ⚠; Barthes ⚠ |
| `cultural-studies` | Birmingham Kültürel Çalışmalar: Hoggart, Williams, Thompson, Hall | hegemony-ideology, semiotics | 35 | P14.1.6; Y II.E; EBS HILT2107; Hoggart 1957 ✓; Williams ◇ |
| `encoding-decoding` | Kodlama/kodaçımlama ve izleyici alımlama (Hall, Morley, Ang, Fiske) | cultural-studies, uses-gratifications | 40 | ANK-9; Fiske 1987 ✓; Hall 1973/80 ◇; Morley 1980 ◇; Ang ⚠ |
| `postmodernism` | Postmodernizm, simülakr ve hipergerçeklik | semiotics, frankfurt-1 | 35 | P14.1.4–5; ANK-5; EBS HILT2107; Baudrillard 1981 ✓; Lyotard ◇; Debord ⚠ |

### Ünite 8 — Normatif kuramlar ve medya sistemleri
| ID | Ders | Önkoşul | dk | Kaynaklar |
|---|---|---|---|---|
| `normative-theories` | Normatif kuramlar (basının dört kuramı ve sonrası) | mass-society, propaganda-public-opinion | 35 | M Part II; BD II; Siebert–Peterson–Schramm 1956 ✓ |
| `media-systems` | Medya sistemleri karşılaştırması | normative-theories | 30 | M Part III; Hallin & Mancini 2004 ✓ |

### Ünite 9 — Dijital çağ
| ID | Ders | Önkoşul | dk | Kaynaklar |
|---|---|---|---|---|
| `network-society` | Yeni medya ve ağ toplumu | tech-determinism, political-economy | 35 | M Part II (yeni medya); Castells 1996 ◇; Benkler 2006 ✓; van Dijk ◇ |
| `participatory-culture` | Katılımcı kültür, yakınsama, üretüketici | uses-gratifications, network-society | 30 | Jenkins 2006 ✓; Benkler 2006 ✓; Bruns 2008 ◇ |
| `filter-bubbles` | Filtre balonu ve yankı odaları | spiral-of-silence, network-society | 35 | Pariser 2011 ✓; Bakshy–Messing–Adamic 2015 ✓ (*Science* 348); Sunstein 2001 ◇ |
| `disinformation` | Dezenformasyon ve algoritmik medya | agenda-setting, filter-bubbles | 40 | Vosoughi–Roy–Aral 2018 ✓; Lazer ve ark. 2018 ✓; Wardle & Derakhshan 2017 ◇ |

Her ünitenin sonunda **patron sınavı** (9) + karma deneme havuzu. Ünite sırası "tarihsel"dir; önkoşul ağı bunun içinde serbest yol bırakır (ör. Ünite 6'ya doğrudan girilebilir).

**Kapsam notu:** AUZEF omurgasının (P1–P14) tamamı kapsandı. Ek: kullanımlar-doyumlar, çerçeveleme, bilgi açığı, normatif kuramlar, medya sistemleri, medya ekolojisi, dijital kuramlar (AUZEF kitabında yok; McQuail/Baran & Davis ve senin listenden). Polat'ın 12. ünitesi (genel değerlendirme) bağımsız ders yapılmadı; `what-is-theory` ve ünite sonu kartlarına dağıtıldı.

## 4. Kişi ve kavram sayfaları (aday listeleri; içerik yok)

**Kişiler (~95 aday, iki kademe):** tam biyografi (~60; her biri ≥2 bağımsız kaynak) + kısa girdi (~35).
- Sosyoloji/felsefe: Comte, Spencer, Durkheim, Weber, Marx, Tönnies, Simmel, Le Bon, Tarde, Cooley, Mead, Blumer, Parsons, Merton, Malinowski, Radcliffe-Brown, Mills.
- Erken iletişim/etki: Lippmann, Lasswell, Lazarsfeld, Berelson, Gaudet, Katz, Klapper, Hovland, Lewin, Festinger, Newcomb, Cantril, Shannon, Weaver, Schramm, Berlo, Westley, MacLean, Dance, Rogers, Lerner, Riley, Ball-Rokeach, DeFleur.
- Orta düzey etkiler: McCombs, Shaw, Gerbner, Noelle-Neumann, Tichenor, Blumler, Iyengar, Entman, Goffman, White, Galtung, Ruge, Bandura.
- Teknoloji: Innis, McLuhan, Ong, Postman, Meyrowitz.
- Eleştirel/kültürel: Horkheimer, Adorno, Marcuse, Benjamin, Habermas, Gramsci, Althusser, Schiller, Smythe, Herman, Chomsky, Golding, Murdock, Garnham, Mattelart, Saussure, Peirce, Lévi-Strauss, Barthes, Hoggart, Williams, Thompson, Hall, Morley, Ang, Fiske, Baudrillard, Lyotard, Debord.
- Sistemler/dijital: Siebert, Peterson, Hallin, Mancini, Castells, Benkler, Jenkins, Bruns, Pariser, Sunstein, Wardle, Derakhshan.

**Kavramlar (~120 sayfa, 150–250 sözcük; ince içerik riski nedeniyle 90 sözcükten kısa sayfa yapmayacağım).** Örnekler: gündem belirleme, öncüleme, çerçeveleme, kapı bekçiliği, kültivasyon, ana akım (mainstreaming), rezonans, suskunluk sarmalı, seçici maruz kalma, kanaat önderi, bilgi açığı, kültür endüstrisi, hegemonya, kodlama/kodaçımlama, hipergerçeklik, filtre balonu, dezenformasyon…

## 5. Dikey dilim önerisi

**Ünite 4'ten 3 ders**: `agenda-setting`, `cultivation`, `spiral-of-silence` (tam içerik, TR+EN) + tüm 39 dersin **iskeleti** (başlık, önkoşul, "planlanıyor" durumu). Böylece harita, kilit/açık mantığı ve DAG doğrulayıcısı tam ağ üzerinde çalışır; sadece 3 ders oynanır. Beraberinde ~25 kişi ve ~30 kavram sayfası.

## 6. Boyut ve maliyet tahmini (tahmin; ±%40)

**İçerik hacmi / dil:** 39 ders × ~3.900 sözcük (12 kart × ~250 sözcük + mini sorular + ders soruları) ≈ 150k; kişiler ~95 × ~300 ≈ 28k; kavramlar ~120 × ~160 ≈ 19k; site metinleri + patron sınavları ≈ 13k → **≈ 210.000 sözcük/dil**.

**Sayfa/dil:** ana sayfa 1 + kurs 1 + hakkında/yöntem/gizlilik/iletişim 4 + sözlük, kişiler, zaman çizelgesi 3 + ünite 9 + ders 39 + kişi ~95 + kavram ~120 ≈ **270 sayfa/dil**.

| Kapsam | Dil | Sayfa | Ham boyut* | Çıktı jetonu (yazım+çeviri) |
|---|---|---|---|---|
| Faz 1: TR (kaynak) + EN | 2 | ~540 | ~7 MB | ~0,9 M |
| Faz 2: de fr es pt-BR ru zh-Hans ja ko | 8 | ~2.200 | ~30 MB | ~3,5 M |
| Faz 3: kalan ~43 yerel ayar (yalnızca hedefe ulaşanlar yayımlanır) | ~43 | ~11.600 | ~150 MB | ~19 M |
| **Toplam (53 yerel ayar)** | 53 | **~14.300** | **~190 MB** | **~23 M (+ gözden geçirme ~%40)** |

\* HTML+JSON, sıkıştırmasız; Pages gzip ile sunar. Varsayım: ders sayfası ~35 KB, kişi ~9 KB, kavram ~6 KB. CJK/Tay daha küçük, Almanca/Fince daha büyük.

- **GitHub Pages sınırları (resmî dokümandan doğrulandı):** yayımlanan site ≤ 1 GB, kaynak depo önerisi ≤ 1 GB, 10 dk dağıtım zaman aşımı, ~10 derleme/saat yumuşak sınır, 100 GB/ay bant yumuşak sınırı. **190 MB ≈ %19 → aşılmıyor; Cloudflare Pages'e geçiş şart değil.** Depo büyümesi için tasarım kararı: derleme çıktısı *deterministik* olacak (yapım zamanı damgası yok), böylece yalnızca içeriği değişen sayfa git'te değişir.
- **Jeton gerçeği:** tam çeviri çok büyük; önceki projede iki dil bile haftalık limite yaklaştırdı. Fazlar arası duraklama ve `translation-progress.json` ile parti parti gideceğim. "Faz 3'ü tam bitirmek" muhtemelen **haftalar** sürer; bunu şimdiden söylüyorum.
- **Bazı dillerde yalnızca arayüz** (içerik İngilizceye düşer, o dilde ders sayfası üretilmez) mümkün; ince/kopya içerik indeksletmemek için önerim bu.

## 7. Dil listesi ve aşamalar (onayına)

**Önerilen 53 yerel ayar** (hreflang kodu → URL yolu):
- **Kaynak/Faz 1:** `tr`, `en`
- **Faz 2:** `de`, `fr`, `es`, `pt-BR`, `ru`, `zh-Hans`, `ja`, `ko`
- **Faz 3 (öncelik sırasıyla):** `it`, `pl`, `nl`, `uk`, `ar` (RTL), `hi`, `id`, `vi`, `th`, `fa` (RTL), `zh-Hant`, `pt-PT`, `bn`, `fil`, `ms`, `ur` (RTL), `he` (RTL), `ro`, `el`, `cs`, `sv`, `hu`, `bg`, `da`, `fi`, `sk`, `hr`, `nb`, `lt`, `lv`, `sl`, `et`, `sr-Latn`, `sr-Cyrl`, `bs`, `sq`, `mk`, `ca`, `is`, `eu`, `gl`, `ga`, `mt`
- AB'nin 24 resmî dili: bg hr cs da nl en et fi fr de el hu ga it lv lt mt pl pt(PT) ro sk sl es sv ✔ hepsi listede. Ekstra Avrupa: tr nb is ru uk sr(2 yazı) bs sq mk ca eu gl. Nynorsk (`nn`), Galce (`cy`), Beyaz Rusça, Gürcüce, Ermenice, Azerice, Kazakça, Tamilce, Telugu vb. **listede yok**; istersen eklerim.
- Yol biçimi: `/tr/`, `/pt-br/`, `/zh-hans/` (küçük harf); `hreflang="zh-Hans"` (özgün büyük/küçük harf). `x-default` → `/en/`.

**Kalite kapısı:** bir dil kapıyı geçene kadar `beta` etiketli, `noindex`, sitemap ve hreflang dışı. Kapı = doğrulayıcı yeşil + örnek metin incelemesi + terim sözlüğü uyumu. **Hatırlatma:** denetlenmemiş toplu makine çevirisini indekslettirmeyeceğiz; arama motorları bunu düşük kalite sayabilir.

**Slug politikası (dil başına karar):** slug bir *içerik alanıdır* (çevirmen sağlar, doğrulayıcı sınar); sıfır bağımlılıklı betik Çince/Japonca'yı otomatik romanize edemez.
| Yazı sistemi | Karar | Gerekçe |
|---|---|---|
| Latin (tr, de, fr, pl, vi, …) | ASCII'ye katlanmış (`ğ→g`, `ı→i`, `ß→ss`, `ł→l`, aksansız) | Paylaşımda/klavyede sorunsuz; aksanlı/aksansız çift URL riski yok |
| Kiril (ru, uk, bg, sr-Cyrl, mk), Yunan | ASCII transliterasyon (ISO 9 / ELOT 743 yakını) | Bu dillerde çevirili "translit" slug yaygın uygulama; %-kodlama karmaşası yok |
| zh-Hans/zh-Hant | Perde işaretsiz pinyin | Yüzde-kodlu Çince URL'ler paylaşımda uzuyor ve bazı botlarda güvenilirlik riski taşır (Baidu için *bildirim var, ben doğrulamadım*); pinyin belirsiz ama kimlik amaçlı yeterli |
| ja / ko / th | Hepburn romaji / Revised Romanization / RTGS | Aynı gerekçe; her üçünün de yerleşik romanizasyonu var |
| hi, bn | Sadeleştirilmiş ASCII (ISO 15919'dan) | Aynı |
| ar, fa, ur, he | **Unicode slug** | Ünlüsüz yazıda romanizasyon kayıplı ve okunaksız; sağdan sola dizede bile URL okunur kalır |

Derleme her sayfanın sabit iç kimliğini korur; slug değişirse eski slug `slug-history.json`'a yazılır ve eski URL için `canonical + meta refresh` durak sayfası üretilir. **Dürüst not:** GitHub Pages gerçek 301 veremez; 301 ancak Cloudflare Pages gibi bir sunucuda olur. Canonical'lar tek yerden (`site.config.json`: `origin`, `basePath`) ayarlanır; alan adı gelince tek satır değişir.

## 8. Hesap/profil/skor tablosu sunucusu: KV mi D1 mi?

Doğrulanan ücretsiz sınırlar: **KV** 1.000 yazma/gün, 100k okuma/gün, 1 GB. **D1** 100.000 satır yazma/gün, 5 milyon satır okuma/gün, 5 GB (veritabanı başına 500 MB).
Silent-archive'in KV tasarımı tek metrik için işe yarar; Anemone'nin ihtiyacı (XP, isabet, süre, seri × genel/haftalık/ders bazlı × arkadaş grupları × açık profil) sıralama ve filtreleme ister. KV'de günde ~1.000 kullanıcı yükleme yapınca yazma sınırına çarpılır. **Öneri: Cloudflare Worker + D1 (SQLite), ücretsiz plan, kredi kartsız.** Sunucu çökse bile uygulama yerelde tam çalışır. **Bu senin kararın** (aşağıda soruluyor).

## 9. Lisans önerisi (hukuki danışmanlık değil)

- **Kod:** MIT.
- **İçerik (özgün metin, sorular, veri):** **CC BY-SA 4.0**. Atıf zorunlu, türevler aynı lisansla kalır (kopya siteler için caydırıcı). Kuramların kendisi telifli değildir; ben metni kendi cümlelerimle yazacağım ve kaynak göstereceğim.
- **Küfür listeleri:** LDNOOBW **CC BY-4.0** (GitHub lisans alanından doğrulandı). Ancak yalnızca **28 dil dosyası** var (ar cs da de en eo es fa fi fil fr hi hu it ja kab ko nl no pl pt ru sv th tlh tr zh); bg, el, ro, hr, sk, sl, lt, lv, et, uk, vi, id, ms, bn, ur, he, ga, mt vb. için **liste yok** — bunlar için başka açık kaynak ya da elle derleme gerekecek. "Her yayımlanan dil için liste şartı" doğrulayıcıyla zorlanacak; bu, o dillerin yayınını bloklayabilir. README'ye de yazacağım: filtre kusursuz değildir.

## 10. Doğrulanması gereken bilgiler (henüz ayrı liste, içerikte kullanılmayacak)

**A. Kaynaklar çelişti (Open Library ilk-yayın yılı ≠ bilinen özgün yıl; büyük olasılıkla OL sonraki baskıyı/çeviriyi yakalıyor, ama ikinci kaynakla çözülene kadar yayımlanmaz):** Horkheimer & Adorno *Dialektik der Aufklärung* (OL 1944; 1947 Querido baskısı); Habermas *Strukturwandel der Öffentlichkeit* (OL 1965; benim bildiğim 1962); Marcuse *One-Dimensional Man* (OL 1963; 1964); Barthes *Mythologies* (OL 1953; 1957); Saussure *Cours* (OL 1931; 1916); Debord (OL 1992; 1967); Durkheim *Règles* (OL 1912; 1895); Le Bon (OL 1896; 1895); Tönnies (OL 1912; 1887); Tarde (OL 1895; 1890); Ang *Watching Dallas* (İngilizce 1985; Felemenkçe özgün 1982); Sunstein *Republic.com* (OL yalnızca 2.0 → 2007; ilk baskı 2001); McQuail *Mass Communication Theory* (ilk baskı yılı OL'de 2000).
**B. Doğrulanamadı (kaynak bulunamadı, içerikte kullanmadan önce ikinci kaynak şart):** Castells 1996, Lyotard 1979, Morley 1980, Smythe 1977, Noelle-Neumann 1973 ve 1984 İngilizce baskısı, Wardle & Derakhshan 2017 (Avrupa Konseyi raporu), Lasswell 1948, Schramm 1954, Dance 1967, Riley & Riley 1959, Gerbner ve ark. 1986, Blumler & Katz 1974, Hall 1973/1980, Williams, Gramsci, Althusser, Benjamin, Marx/Engels, Weber, Bruns 2008, Tunstall 1977, van Dijk, Golding & Murdock, Garnham, Mattelart, Payne Fund çalışmaları, Baran & Davis güncel baskı ve bölüm numaraları, McQuail 7. baskı bölüm yapısı.
**C. Sayfa aralığı eksik:** McCombs & Shaw 1972 *POQ* 36(2) — Crossref yalnızca "176" gösterdi (bitiş sayfası doğrulanmalı); Hovland & Weiss 1951, Katz 1957, Tichenor ve ark. 1970, Katz–Blumler–Gurevitch 1973, Fraser 1990 için de bitiş sayfaları Crossref'ten gelmedi.
**D. Derleme uyarısı:** Polat ders notu bazı kişi/görüş yorumları içeriyor (ör. Platon'un düşüncesini "ırk öğretisi"ne bağlayan ifade). Bunları **almayacağım**; her iddia birincil/bağımsız kaynakla desteklenecek. Metinde kodlama bozukluğu (Türkçe karakterler) vardı; yalnızca yapıyı okudum.
**E. Öteki Kuram** içindekileri ve yayınevi bilgisi (Erk mi, başka mı) doğrulanmadı.
**F. Henüz araştırılmadı:** "Türkiye'den örnek" kartları (emin olduğum kadar; her biri kaynaklı olacak), Türkçe alan terimleri sözlüğü (ör. *agenda-setting* = gündem belirleme; AUZEF, Yaylagül ve Türk Dil Kurumu/Yükseköğretim terminolojisiyle karşılaştırılacak).

## 11. Plan (kısa)

1. **Faz 0 (şimdi):** bu taslak → senin kararların (aşağıdaki 6 soru).
2. **Faz 1 – dikey dilim:** repo + `site.config.json` + veri şeması + doğrulayıcılar (yetim/döngü/boş soru/tek doğru cevap/dil paritesi/referans/küfür listesi/kontrast/hreflang/sitemap/kırık bağlantı) → `scripts/build.mjs` (statik HTML, JSON-LD, sitemap, robots, 404) → motor (kart, 6 soru tipi, XP/seviye, Leitner, hata defteri, kaldığın yerden devam, istatistik, sınav, kişi/kavram paneli, temalar + kâğıt/e-ink modu, erişilebilirlik ayarları, PWA) → Lighthouse + axe + klavye + ekran okuyucu simülasyonu → GitHub Pages'e canlı → sana rapor.
3. **Faz 2 (onayınla):** Worker + D1 (hesap, profil, skor tablosu, gruplar, küfür filtresi, şikâyet), müfredatın tamamı TR sonra EN.
4. **Faz 3:** dil dilim dilim, kalite kapısıyla; her aşamada commit + push + Pages doğrulaması + README.
5. **Yeni kurs/dil ekleme:** şablon + doğrulayıcı hazır olacak; README'de adım adım.

Dürüstlük notu: Gerçek ekran okuyucuyla (NVDA/JAWS/VoiceOver/TalkBack) test edemem; otomatik denetim + klavye testi + simülasyon yaparım ve sana görme engelli birine test ettirebileceğin **elle test kontrol listesi** veririm. Arama motoru sıralaması garantisi vermem; ölçülebilir teknik kaliteyi (Lighthouse, yapılandırılmış veri, hreflang, sitemap) raporlarım.
