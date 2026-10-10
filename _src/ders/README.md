# Öğretmen Kitabı

Canlı adres: https://birlikteiyilik.com/ders

Girişte Kur’an-ı Kerim, Güzel Ahlak ders rehberi ve Elif Ba kitabı seçilir. Güzel Ahlak bölümündeki tüm ders, arşiv, sınıf sunumu ve yazdırma araçları korunmuştur.

Elif Ba 56 sayfalık, sağdan sola çevrilen bir flipbook’tur. Kur’an-ı Kerim kullanıcı isteğiyle soldan sağa çevrilir; verilen 616 sayfalık PDF’nin yalnızca son sayfası çıkarılarak 615 sayfa yayımlanmıştır. İndirme ve PDF açma bağlantıları da bu 615 sayfalık dosyayı kullanır. Elif Ba’nın indirilen PDF’si özgün dosyanın aynısıdır.

Dar ekranlarda tek sayfa, geniş ekranlarda iki sayfa ekrana sığar. Mobilde alttaki büyük düğmeler, kısa dokunma ve yatay kaydırma ile sayfa değişir. Düğme yerleri, dokunma kenarı, kaydırma ve klavye okları her kitabın yönünü takip eder. Dikey hareket ve uzun basma sayfa çevirmez. Sayfa seçimi ve yakınlaştırma kullanılabilir. Uzun kitaplarda yalnızca yakın sayfaların görselleri DOM’da tutulur.

## Geliştirme

Bu klasörde `pnpm install --frozen-lockfile`, ardından `pnpm dev`.

Node.js 24 ile `pnpm test`, iki okuma yönünde dokunma ve kaydırma davranışlarını doğrular.

## Yayın

`pnpm build` TypeScript kontrolünden sonra statik dosyaları depo kökündeki `ders/` klasörüne üretir. Kaynak değişiklikleriyle birlikte bu klasörü de Git'e ekleyin. Mevcut ana sitenin Vercel Git yayını bu dosyaları sunar; çalışma sırasında Sites, Next.js veya ayrı bir sunucu gerektirmez.

Bağlantılar `/ders?bolum=guzel-ahlak&sinif=3&ay=1&ders=1`, `/ders?bolum=elif-ba&sayfa=5` ve `/ders?bolum=kuran-i-kerim&sayfa=2` biçimindedir. Bölüm içindeki “Kitap seçimi” bağlantısı girişe döner.

## Kaynaklar

`public/data/archive.json` özgün Güzel Ahlak arşivini, `public/assets/elif-ba-mufredat.pdf` verilen PDF'yi içerir. `public/assets/elif-ba-pages/` dosyaları bu PDF'den 1800 piksel yüksekliğinde üretilmiştir.

`public/assets/kuran-i-kerim.pdf` son sayfası çıkarılan yeni kitabı, `public/assets/kuran-i-kerim-pages/` bu dosyanın 1800 piksel yüksekliğindeki 615 görselini içerir. Sayfa içerik akışları ve boyutları kaynak PDF’nin ilk 615 sayfasıyla karşılaştırılarak doğrulanmıştır.

Kur’an-ı Kerim kaynak PDF SHA-256: `fa88e87198fa9cadee797cd3ac1d3d41e4c4c7776d97b4fee02c32e0a14cb0f7`

Kur’an-ı Kerim yayımlanan PDF SHA-256: `bc31fdd0b9814e2d8553f57c059f00ea1e1a24ff2904d423f34ffd75e779fadf`

Özgün PDF SHA-256: `9785d303ff4aeccec4c68638e6aa3ec7cdf46f082b0b25e93b3852df5ae61b53`
