# Birlikte İyilik Akademi — Bağış sayfası

`/bagis/` rotası, ana sitenin navbar, uygulama bandı ve footer bileşenlerinden bağımsız, yalnızca banka ve IBAN bilgilerini gösteren sade bir sayfadır. Kaydırmaya bağlı video anlatısı, animasyon ve bölüm geçişleri kaldırılmıştır.

## Ana dosyalar

- Kaynak şablon: `_src/templates/pages/bagis.html`
- Kaynak stil: `_src/static/css/support-journey.css`
- Kaynak JavaScript (yalnızca IBAN kopyalama): `_src/static/js/support-journey.js`
- Arka plan görselleri: `_src/static/assets/support-journey/support-journey-final.jpg` ve `support-journey-mobile-final.jpg`

Yayınlanan karşılıkları repo kökündeki `bagis/`, `css/`, `js/` ve `assets/support-journey/` klasörlerindedir.

## İçerik

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
