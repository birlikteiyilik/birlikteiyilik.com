# Birlikte İyilik Akademi — Bağış Daveti

Bu klasör, build sistemi veya harici JavaScript paketi gerektirmeyen bağımsız bir `/bagis/` microsite paketidir.

## Hızlı düzenleme

1. **Bağış bağlantısı:** `script.js` dosyasının başındaki `const DONATION_URL = "#";` satırından değiştirilir. Şu an `#` olduğu için bütün “Bağış Yap” kontrolleri banka bilgileri bölümüne gider.
2. **Logo:** `assets/logo.png` şeffaf “b” sembolüdür. Yanındaki tek satır “Birlikte İyilik Akademi” yazısı `index.html` içinde metin olarak yer alır.
3. **Karşılama videosu:** `assets/welcome-intro.mp4` — ilk açılışta tam ekran, sessiz oynar; bittiğinde ana sayfaya geçer.
4. **Hero videosu:** `assets/hero-desktop.mp4`
5. **Poster:** `assets/poster-desktop.jpg`

Canlı Vercel sürümünde asset ve CSS/JS yolları `/bagis/` köküne sabitlenmiştir. Böylece mevcut `trailingSlash: false` ayarı `/bagis/` adresini `/bagis` biçimine yönlendirse bile tüm dosyalar doğru konumdan yüklenir.

## Yerelde açma

Canlı entegrasyondaki `/bagis/` kök yollarını doğru test etmek için depo kökünde basit bir yerel sunucu çalıştırın:

```bash
python3 -m http.server 8000
```

Ardından `http://localhost:8000/bagis/` adresini açın. Doğrudan açılabilen bağımsız teslim paketi ayrıca proje çıktılarında korunur.

## GitHub Pages

- `bagis` klasörünü deponuza ekleyin.
- GitHub’da **Settings → Pages** bölümünden yayınlanacak branch ve klasörü seçin.
- Klasör korunursa sayfa `https://kullanici.github.io/depo/bagis/` altında çalışır.

## Vercel

- Klasörü bir Git deposuna gönderip Vercel’e bağlayın veya Vercel panelinden klasörü içe aktarın.
- Framework seçimini **Other** bırakın; build komutu gerekmez.
- Projenin kökü bu klasörse yayın çıktısı `.` olarak kalabilir. Mevcut sitenin parçasıysa klasörü `/bagis/` altında koruyun.

> Canlı yayına geçmeden önce bağış URL’sini, banka hesaplarını, iletişim ve gizlilik bağlantılarını kurumun güncel bilgileriyle doğrulayın.
