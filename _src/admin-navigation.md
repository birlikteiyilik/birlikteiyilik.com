# Yönetim panelinde konumu koruma

Paneldeki bölüm adresin `#` bölümünde tutulur. Sunucu adresi `/yonetim/panel` olarak kalır; Vercel'de ek yönlendirme veya veritabanı değişikliği gerekmez. Yenileme, doğrudan bağlantı ve tarayıcının geri/ileri düğmeleri aynı gezinme durumunu açar.

Son geçerli bölüm ayrıca aynı sekmenin `sessionStorage` alanında `biaPanelLastRoute:v1` anahtarıyla tutulur. Yenileme veya yönlendirme sonucunda adres yalnızca `/yonetim/panel` olarak açılırsa bu kayıt geri yüklenir. Adreste açık bir bölüm varsa her zaman o bağlantı önceliklidir. Çıkıştaki mevcut `sessionStorage.clear()` son konumu da temizler; farklı sekmeler birbirinin konumunu değiştirmez. Depolama kullanılamıyorsa adres tabanlı gezinme devam eder.

- `#basvurular`: Eğitim türü seçimi.
- `#basvurular/yuz-yuze/ders-programi`: Yüz yüze ders programı.
- `#basvurular/online/hocalar`: Online öğretmenler.
- `#basvurular/yuz-yuze/yoklama/ogrenciler`: Yoklama öğrenci listesi.
- `#haberler`, `#etkinlikler`, `#ayarlar`, `#ana-sayfa`, `#sss`, `#programlar`: Diğer bölümler.
- `#haberler/duzenle/<slug>`, `#etkinlikler/duzenle/<slug>` ve ilgili `/yeni` adresleri: Haber ve etkinlik düzenleme ekranları.

Başlangıçta haber verisi yüklemek kullanıcıyı haberler ekranına zorlamaz. Önceki gezinmeden kalan yavaş bir isteğin yanıtı yeni bölümü açmış kullanıcıyı geri çekemez. Geçersiz bağlantılar güvenli bir bölüme, silinmiş içerik bağlantıları ilgili listeye döner. Online eğitimde yüz yüze ders programı açılmaz.

Adres yalnızca bölüm, eğitim türü, sekme ve mevcut herkese açık içerik slug'ını içerir; öğrenci bilgileri, aramalar ve form taslakları adrese yazılmaz. Kaydedilmemiş taslaklar otomatik kaydedilmez. Oturum ve API yetki denetimleri devam eder.

`tests/admin-navigation.test.mjs` adres dönüşümlerini, geçmiş gezinmesini ve geç gelen yanıtları kapsar. Örnek verilerle gerçek Chromium'da tüm bölümler, haber/etkinlik düzenleme, doğrudan bağlantılar, yenileme, geri/ileri ve 390px mobil ekran kontrol edilir; gezinme testleri kayıt isteği göndermez.
