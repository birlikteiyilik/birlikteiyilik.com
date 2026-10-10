# Öğretmen Kitabı

Canlı adres: https://birlikteiyilik.com/ders

Girişte Güzel Ahlak ders rehberi ve 56 sayfalık Elif Ba kitabı seçilir. Güzel Ahlak bölümündeki tüm ders, arşiv, sınıf sunumu ve yazdırma araçları korunmuştur. Elif Ba, sağdan sola okunan; dokunarak veya sürükleyerek sayfa çevrilebilen bir flipbook olarak açılır. Dar ekranlarda tek sayfa, geniş ekranlarda iki sayfa ekrana sığar. Sol ok sonraki, sağ ok önceki sayfaya götürür. Mobilde alttaki büyük düğmeler, sol/sağ tarafa kısa dokunma ve yatay kaydırma ile sayfa değişir. Dikey hareket ve uzun basma sayfa çevirmez. Sayfa seçimi ve yakınlaştırma kullanılabilir; indirilen PDF, verilen özgün dosyanın aynısıdır.

## Geliştirme

Bu klasörde `pnpm install --frozen-lockfile`, ardından `pnpm dev`.

## Yayın

`pnpm build` TypeScript kontrolünden sonra statik dosyaları depo kökündeki `ders/` klasörüne üretir. Kaynak değişiklikleriyle birlikte bu klasörü de Git'e ekleyin. Mevcut ana sitenin Vercel Git yayını bu dosyaları sunar; çalışma sırasında Sites, Next.js veya ayrı bir sunucu gerektirmez.

Bağlantılar `/ders?bolum=guzel-ahlak&sinif=3&ay=1&ders=1` ve `/ders?bolum=elif-ba&sayfa=5` biçimindedir. Bölüm içindeki “Kitap seçimi” bağlantısı girişe döner.

## Kaynaklar

`public/data/archive.json` özgün Güzel Ahlak arşivini, `public/assets/elif-ba-mufredat.pdf` verilen PDF'yi içerir. `public/assets/elif-ba-pages/` dosyaları bu PDF'den 1800 piksel yüksekliğinde üretilmiştir.

Özgün PDF SHA-256: `9785d303ff4aeccec4c68638e6aa3ec7cdf46f082b0b25e93b3852df5ae61b53`
