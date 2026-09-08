# Başvuru sistemi kurulum notları

Başvuru formu `/basvuru`, yönetim ekranı ise mevcut panel içindeki `Başvurular` sekmesidir. Sistem ayrı bir SQL/veritabanı kullanmaz.

## Veri saklama

- Başvurular AES-256-GCM ile şifrelenir.
- GitHub'da `content/applications/YYYY-MM.enc.json` aylık arşivleri olarak saklanır.
- Repoda ad, telefon, T.C. kimlik numarası veya adres düz metin görünmez.
- Yönetim paneli veriyi yalnızca geçerli yönetici oturumuyla açabilir.

## Vercel ortam değişkenleri

Mevcut yönetim panelinin kullandığı değişkenler gereklidir:

- `BIA_GITHUB_TOKEN`: hedef repoya Contents yazma yetkisi olan GitHub tokenı
- `BIA_JWT_SECRET`: yönetim oturumu imzalama anahtarı

Başvuru arşivi için ayrıca sabit ve güçlü bir anahtar tanımlanması önerilir:

- `BIA_APPLICATIONS_ENCRYPTION_KEY`: en az 32 karakter, rastgele ve değiştirilmeyecek şifreleme anahtarı

Bu değişken verilmezse sistem geriye dönük uyumluluk için `BIA_JWT_SECRET` değerini kullanır. Arşiv oluşturulduktan sonra kullanılan anahtarı yedeklemeden değiştirmek eski başvuruların açılamamasına neden olur.

İstenirse şifreli arşiv ayrı bir özel repoda tutulabilir:

- `BIA_APPLICATIONS_REPO`: örnek `birlikteiyilik/basvuru-arsivi`
- `BIA_APPLICATIONS_BRANCH`: varsayılan `main`
- `BIA_APPLICATIONS_PATH`: varsayılan `content/applications`

İlk başarılı başvuru ilgili ayın şifreli arşiv dosyasını otomatik oluşturur. GitHub veya Vercel gizli anahtarları kaynak koda eklenmemelidir.
