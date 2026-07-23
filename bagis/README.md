# Birlikte İyilik Akademi — Desteğin Yolculuğu

`/bagis/` rotası, aynı alan adı altında çalışan ancak ana sitenin navbar, uygulama bandı ve footer bileşenlerinden bağımsız tam ekran bir video anlatısıdır.

## Ana dosyalar

- Kaynak şablon: `_src/templates/pages/bagis.html`
- Kaynak stil: `_src/static/css/support-journey.css`
- Kaynak JavaScript: `_src/static/js/support-journey.js`
- Master video: `_src/static/assets/support-journey/support-journey-master.mp4`
- İlk kare posteri: `_src/static/assets/support-journey/support-journey-poster.jpg`
- Son kare görseli: `_src/static/assets/support-journey/support-journey-final.jpg`

Yayınlanan karşılıkları repo kökündeki `bagis/`, `css/`, `js/` ve `assets/support-journey/` klasörlerindedir.

## İçerik ve zamanlama

Video-sahne zamanları, scroll yoğunlukları ve mobil kadraj konumları `support-journey.js` içindeki `timeline` dizisinden düzenlenir. Dokuzuncu sahne master videoda 2× hızlandırılmıştır; son geniş kare bağış panelinden önce bekletilir.

Banka ve IBAN bilgileri `_src/templates/pages/bagis.html` içindeki banka panelindedir. Kopyalama işlemi erişilebilir bir canlı bildirimle doğrulanır.

## Yerel kontrol

Repo kökünde:

```bash
python3 -m http.server 8080
```

Ardından `http://localhost:8080/bagis/` adresini açın.

Şablonu yeniden üretmek için:

```bash
python3 _src/build.py
```

Vercel bu statik yapıyı build sistemi olmadan yayınlayabilir. GitHub Pages için repo kökü yayın kaynağı olarak seçilebilir.
