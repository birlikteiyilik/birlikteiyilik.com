# Öğretmen Kitabı

Canlı adres: https://birlikteiyilik.com/ders

Girişte Kur’an-ı Kerim, **Çocuklar ve Gençler İçin Temel Dini Bilgiler** (eski adıyla Güzel Ahlak; bağlantılarda `bolum=guzel-ahlak` korunur) ve Elifba bölümü seçilir. Bunların altında **Ahlak Eğitim Programları** başlığında Birlikte İyilik’in **7–10 yaş** ve **11–14 yaş** müfredatları ayrı kartlar olarak yer alır. Elifba giriş kartında “3 kitap · Video dersler” bilgisi gösterilir.

## Çocuklar ve Gençler İçin Temel Dini Bilgiler

Bölüm sadedir: üstte yalnızca **sınıf** (3–8) ve **ay** (1–9) seçimi, yanda **hafta** seçimi, ortada özgün arşivin sayfa çevrilen kitap (flipbook) hâli bulunur. Seçili sınıf grubunun ve ayın özgün içerik dosyası, metni değiştirilmeden okunaklı kitap sayfalarına dizilir; konu başlıkları sayfa başlığı olur, uzun sayfalarda yazı boyu sayfaya sığacak şekilde küçülür. “Yakınlaştır” sayfanın metnini büyük puntoyla gösterir. Eski 1. ve 2. sınıf bağlantıları 3. sınıfa düzeltilir.

Haftalar `src/archive-weeks.ts` ile bulunur: içerik dosyaları ayın konularını (çoğunlukla 20 konu) sırayla taşır; her hafta beş konuyla başlar. Konu başlığı az tanınan dosyalarda sayfalar dört eşit parçaya bölünür. Hafta düğmesi kitabı o haftanın ilk sayfasına çevirir; sayfa çevrildikçe etkin hafta güncellenir. Aynı başlıklı farklı dersler “· 1, · 2” biçiminde numaralanır. Bağlantı biçimi: `/ders?bolum=guzel-ahlak&sinif=5&ay=3&hafta=2` (isteğe bağlı `sayfa=`).

Önceki ayrıntılı ders planı, sınıf sunumu ve yazdırma araçları bu sadeleştirmeyle kaldırılmıştır.

## Birlikte İyilik yaş müfredatları

Verilen iki **Ahlak Eğitim Programı**, mevcut 3–8. sınıf Güzel Ahlak rehberinden ayrı bir alanda sunulur:

- `/ders?bolum=ahlak-mufredati&yas=7-10`: 56 konu, 175 sayfalık Nisan 2025 kaynağı temel alınır.
- `/ders?bolum=ahlak-mufredati&yas=11-14`: 59 konu, 187 sayfalık Mayıs 2025 kaynağı temel alınır.
- `/ders?bolum=ahlak-mufredati`: İki yaş grubunun seçim ekranı.

Bölüm sadedir: üstte yaş grubu, yanda konu dizini, ortada Birlikte İyilik PDF’sinin sayfa çevrilen kitap hâli. Geniş (yatay) sayfalar her ekranda tek sayfa gösterilir. PDF’deki bütün bağlantılar (Wordwall etkinlikleri, kaynak siteler) sayfa görselinin üzerinde tıklanabilir alanlar olarak korunur; açık konunun Wordwall etkinlikleri ayrıca kitabın üstünde düğme olarak listelenir. Sayfa görselleri `public/assets/ahlak-mufredati/<yaş>/pages/` altında 1600 piksel genişliğinde WebP’dir; bağlantı alanları `public/data/ahlak-mufredati-<yaş>-sayfalar.json` dosyasında sayfa yüzdesi olarak tutulur. Bağlantı biçimi: `/ders?bolum=ahlak-mufredati&yas=7-10&konu=7`.

Silinen Wordwall etkinliği (`resource/28325043`) yerine **Vatan Sevgisi** konusunda (7–10 yaş 7. konu, 11–14 yaş 34. konu) `https://wordwall.net/tr/resource/12756846/vatan-sevgisi` kullanılır; PDF’deki bağlantı yazısı ve adresi de güncellenmiştir. Aynı silinmiş etkinlik kaynakta Mesuliyet, Millî/Dinî Değerler ve İş Ahlakı konularında da geçer; bunlar için yeni etkinlik belirlenmediğinden değiştirilmemiştir.

Önceki sürümde içerik aşağıdaki dört alana dönüştürülerek gösteriliyordu; aktarım verisi (`ahlak-mufredati-<yaş>.json`) aramalar ve konu dizini için korunur:

- **Ders planı:** Konuya giriş sorusu, kazanımlar, kavramlar, anlatım/menkıbe/değerlendirmeye geçilen ders akışı ve okunabilir adlarla etkinlik bağlantıları.
- **Anlatım:** Verilecek mesajlar, okunabilir paragraflara ve listelere ayrılan açıklamalar, büyüklerin sözleri.
- **Menkıbeler:** Başlıkları korunarak yeniden akan, telefonda yakınlaştırma gerektirmeden okunan metinler.
- **Sorular:** Ders sonu soruları ve günlük yaşama aktarım sorusu.

Konu dizini başlıkta ve içerikte Türkçe arama yapar. Masaüstünde sabit yan dizin, telefonda açılır dizin kullanılır. Ders rehberlerinde ve basılı ders akışında süre/dakika bilgisi gösterilmez. Yöntem bilgileri süre belirtilmeden korunur. Aynı başlıkla gelen farklı konular kendi numaralarıyla korunur; 11–14 yaşın 43. ve 44. konuları olan iki **Oturma Âdâbı** birleştirilmez. Konu ve açık ders bölümü URL'de tutulur; yenileme, geri/ileri ve klavyeyle sekme geçişi desteklenir. Ders notları tüm bölümleriyle yazdırılabilir.

7–10 yaşın 41. konusundaki değerlendirme soruları kaynakta yanlışlıkla menkıbe başlığı altında yer aldığından soru alanına da alınmıştır. 11–14 yaşın 56. ve 57. konularında ayrı soru bölümü olmadığı için ilgili metinlere dayanan üçer tartışma sorusu hazırlanmıştır. Dinî alıntılar yeniden üretilmez. Dijital gösterimde önceki yazım tercihine uygun olarak `teâlâ` / `teala` küçük t ile yazılır.

**Kaynak PDF** bağlantıları Birlikte İyilik kapak ve sayfa markalamasıyla hazırlanmış dosyaları indirir. Eski kurumun ortak logo görseli kaldırılır; süre satırları dakika belirtmeyen yöntem bilgisine dönüştürülür. Hazırlayan isimleri ve ders içerikleri korunur. Açılır kaynak alanı ilgili PDF sayfasına ve ek okumalara bağlantı verir; sayfa çıkarılmamıştır. `public/data/ahlak-mufredati-<yaş>.json` konu dizinini, kaynak metnini ve özgün dosyanın `sourceSha256` ve yayımlanan PDF’nin `pdfSha256` değerlerini içerir. `public/assets/ahlak-mufredati/<yaş>/` yalnızca Birlikte İyilik PDF’sini barındırır. Sayfa görselleri üretilmez veya yüklenmez. İlgili yaş grubunun içeriği yalnızca o program açıldığında yüklenir.

`scripts/import-curricula.py --junior <7-10.pdf> --senior <11-14.pdf>` metinleri yeniden aktarır; PyMuPDF gerektirir. Kaynak özetleri:

- 7–10 yaş: `52d83511d10716414b277d69c9d346f19ec9ffa903898685e3a98c00269ccbc3`
- 11–14 yaş: `18469302f9d3951c003889f5659550b05700d489c3aab8e25467d1fa31368bd4`

`tests/age-curricula.test.ts` kaynak ve yayımlanan PDF özetlerini, 115 konunun sırasını, sayfa aralıklarını, metinlerin devamlılığını, tekrarlı başlıkları ve Türkçe aramayı doğrular. `tests/native-curriculum.test.ts` paragraf/listelere dönüşümü, süre bilgisinin kaldırılmasını, soruları ve okunabilir kaynak bağlantılarını kapsar. Chromium kontrolleri masaüstü ile 320px, 390px ve 768px ekranlarda gezinme, sekmeler, yenileme, yazdırma ve PDF indirme akışlarını kapsar.

Giriş kartları image_gen ile ayrı görseller olarak üretilmiştir; tüm görünen yazılar görsellerin içindedir. “Temel Dini Bilgiler” kartı (`temel-dini-bilgiler-*-v1.webp`) önceki Güzel Ahlak kartının çizimi korunarak yeni başlıkla dizilmiştir (Playfair Display ve Inter). Elifba kartlarında (`elifba-*-v4/v3.webp`) yalnızca alt bilgi “3 kitap · Video dersler” olarak güncellenmiştir. Kartın tamamı bağlantıdır. Açıklama ve sayfa bilgileri ekran okuyucuları için HTML’de de tutulur. Masaüstünde üç, tablette iki sütun kullanılır. Telefonda başlık, sayfa bilgisi ve eylem içeren 3:1 yatay görseller alt alta gösterilir; üç butonun ilk ekrana sığması için genişlik ekran yüksekliğine göre sınırlandırılır. Kısa yatay ekranlarda üç dikey kart yan yana sığdırılır. Görseller kırpılmaz. `public/assets/book-cards/` WebP görsellerini, `prompts.md` ve `mobile-prompts.md` üretim istemlerini içerir.

Elifba bölümündeki kitap seçiminden 56 sayfalık **Elifba**, 51 sayfalık **Elifba Mehmed Mert**, 52 sayfalık **Karabaş Tecvid** (Hakikat Kitabevi baskısı; `public/assets/karabas-tecvid.pdf` verilen dosyanın aynısıdır, SHA-256 `c0cd6b5b8b886553e81c34d75279c827e1316104ae1fabd1e48741245747622a`; sayfalar 1800 piksel yüksekliğinde WebP) ve **Video dersler** sayfasına ulaşılır.

Video dersler, Birlikteiyilik Akademi YouTube kanalındaki “ElifBa” oynatma listesini (`PLyi8Qf72STLgAI-MhiAnuZFNe9c6iIgx5`) kapaklı bir galeri olarak gösterir. Liste sayfa açılırken YouTube IFrame API’siyle okunur; listeye eklenen yeni videolar site güncellemesi gerekmeden görünür. Her dersin kartında videonun YouTube’daki kendi kapağı (`i.ytimg.com/vi/<id>/hqdefault.jpg`, 16:9 kırpılmış) gösterilir; kapak yüklenemezse çizili yedek kart görünür. Kartın altında “Ders 01 / Harfler” gibi başlıktan çıkarılan ders numarası ve konu yazar. CSP `img-src` zaten `https:` kaynaklarına izin verdiği için ek ayar gerekmez. Kapağa dokununca video sayfadan çıkmadan, youtube-nocookie gömülü oynatıcıyla açılır; önceki/sonraki ders düğmeleri ve `video=` bağlantısı vardır. Liste okunamazsa oynatma listesinin tamamı gömülü oynatıcıyla gösterilir. Bunun için `vercel.json` içindeki CSP `script-src` alanına `https://www.youtube.com` ve `https://s.ytimg.com` eklenmiştir. Elifba Mehmed Mert için verilen PDF’nin 52. ve son sayfası okuyucudan ve indirilen PDF’den çıkarılmıştır; ilk 51 sayfa değiştirilmemiştir. 56 sayfalık Elifba’nın indirilen PDF’si özgün dosyanın aynısıdır. Her iki Elifba ve 615 sayfalık Kur’an-ı Kerim, sağdan sola çevrilen flipbook’lardır. Kur’an-ı Kerim için verilen 616 sayfalık PDF’nin yalnızca son sayfası çıkarılmıştır. İndirme ve PDF açma bağlantıları da bu 615 sayfalık dosyayı kullanır. Tek sayıda yaprağı olan sağdan sola kitaplarda ilk sayfa tek gösterilir ve kalan yapraklar doğru sırayla eşlenir.

Güzel Ahlak arşivinin metinlerinde “teâlâ” ve “teala” kelimeleri küçük t ile yazılır; kaynakların diğer yazımları korunur. Başlıklar, kaynak metinleri, ders araçları ve yazdırma çıktıları aynı arşiv verisini kullanır.

Özgün arşivde metni aktarılmamış 11 sayfa bulunur. Okuma listesi boş sayfaları atlar; dosyada hangi özgün sayfaların eksik olduğu ayrıca belirtilir. Kalan metinler ve sayfa numaraları değiştirilmez. Özellikle 3. sınıf / 7. ay / 2–3. sayfalar ile 3, 5 ve 7. sınıf / 8. ay / 3. sayfa bu kapsamdadır. 8. ayda 3. ve 5. sınıflar aynı 7–8 kaynak grubunu kullandığı için ortak eksiklik gösterilir. Özgün PDF'ler depoda bulunmadığından bu içerikler yeniden oluşturulmamıştır. Arama sonucu yoksa önceki sayfanın metni gösterilmez.

Kitabın alt açıklaması “46 dosya ve 963 sayfalık özgün içeriğe dayalı pedagojik uyarlama.” şeklindedir.

Dar ekranlarda tek sayfa, geniş ekranlarda iki sayfa ekrana sığar. Mobilde alttaki büyük düğmeler, kısa dokunma ve yatay kaydırma ile sayfa değişir. Düğme yerleri, dokunma kenarı, kaydırma ve klavye okları her kitabın yönünü takip eder. Masaüstünde sayfa seçimi ve iki geçiş düğmesi tek bir gruptur; düğmeler sayfa göstergesinin hemen yanındadır. Sağdan sola kitaplarda Sonraki solda, Önceki sağdadır; soldan sağa kitaplarda sıralama tersidir. Yakınlaştırma düğmesi bu gruptan ayrı durur. Dikey hareket ve uzun basma sayfa çevirmez. Sayfa seçimi ve yakınlaştırma kullanılabilir. Uzun kitaplarda yalnızca yakın sayfaların görselleri DOM’da tutulur.

## Geliştirme

Bu klasörde `pnpm install --frozen-lockfile`, ardından `pnpm dev`.

Node.js 24 ile `pnpm test`, iki okuma yönünde dokunma ve kaydırma davranışlarını doğrular.

## Yayın

`pnpm build` TypeScript kontrolünden sonra statik dosyaları depo kökündeki `ders/` klasörüne üretir. Kaynak değişiklikleriyle birlikte bu klasörü de Git'e ekleyin. Mevcut ana sitenin Vercel Git yayını bu dosyaları sunar; çalışma sırasında Sites, Next.js veya ayrı bir sunucu gerektirmez.

Bağlantılar `/ders?bolum=guzel-ahlak&sinif=3&ay=1&hafta=1`, `/ders?bolum=elif-ba&sayfa=5`, `/ders?bolum=elif-ba&kitap=mehmed-mert&sayfa=5`, `/ders?bolum=elif-ba&kitap=karabas-tecvid`, `/ders?bolum=elif-ba&kitap=videolar` ve `/ders?bolum=kuran-i-kerim&sayfa=2` biçimindedir. Eski `kitap=mehmet-mert` bağlantıları da Elifba Mehmed Mert kitabını açar. Bölüm içindeki “Kitap seçimi” bağlantısı girişe döner. Eski Elifba bağlantıları özgün 56 sayfalık kitabı açmaya devam eder.

## Kaynaklar

`public/data/archive.json` özgün Güzel Ahlak arşivini, `public/assets/elif-ba-mufredat.pdf` verilen PDF'yi içerir. `public/assets/elif-ba-pages/` dosyaları bu PDF'den 1800 piksel yüksekliğinde üretilmiştir.

`public/assets/elifba-mehmed-mert.pdf`, verilen PDF’nin ilk 51 sayfasını içerir. `public/assets/elifba-mehmed-mert-pages/` dizinindeki 51 WebP, PDF sayfalarının sırasını ve en-boy oranlarını koruyarak 1800 piksel yüksekliğinde, 88 kaliteyle üretilmiştir. İlk 51 sayfanın PDF içerikleri ve render çıktıları özgün dosyayla karşılaştırılarak doğrulanmıştır.

Elifba Mehmed Mert özgün PDF SHA-256: `6e675a526f4886e0eb12ded335cfbdba684b61ec309a082973c5a67fa23b0439`

Elifba Mehmed Mert yayımlanan 51 sayfalık PDF SHA-256: `cdd14c981baaf92de39dbcee3758a2f208c6f4ba9c7a03a8ec42b318357a5b41`

`public/assets/kuran-i-kerim.pdf` son sayfası çıkarılan yeni kitabı, `public/assets/kuran-i-kerim-pages/` bu dosyanın 1800 piksel yüksekliğindeki 615 görselini içerir. Sayfa içerik akışları ve boyutları kaynak PDF’nin ilk 615 sayfasıyla karşılaştırılarak doğrulanmıştır.

Kur’an-ı Kerim kaynak PDF SHA-256: `fa88e87198fa9cadee797cd3ac1d3d41e4c4c7776d97b4fee02c32e0a14cb0f7`

Kur’an-ı Kerim yayımlanan PDF SHA-256: `bc31fdd0b9814e2d8553f57c059f00ea1e1a24ff2904d423f34ffd75e779fadf`

Özgün PDF SHA-256: `9785d303ff4aeccec4c68638e6aa3ec7cdf46f082b0b25e93b3852df5ae61b53`
