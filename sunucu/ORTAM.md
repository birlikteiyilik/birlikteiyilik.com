# Ortam değişkenleri (site)

Sunucuda değerler `/etc/birlikte/site.env` dosyasındadır (root:site, 640). Örnek: `sunucu/ornek.env`. Gerçek değer depoya hiçbir zaman yazılmaz.

| Değişken | Zorunlu | Amaç |
| --- | --- | --- |
| `PORT` | evet | Dinlenecek port. Sunucuda `3001`. |
| `HOST` | hayır | Dinlenecek adres, varsayılanı `127.0.0.1`. systemd birimi de bu değeri verir. |
| `APP_ENV` | hayır | `production` (varsayılan) ya da `test`. Başka bir değerde süreç açılmaz. Kodda buna bağlı karar yoktur. |
| `SURUM` | hayır | Yayındaki commit. Yayın betiği `/etc/birlikte/site.surum` dosyasına yazar. `/__saglik` yanıtında görünür. |
| `DATABASE_URL` | evet | PostgreSQL bağlantısı: `postgresql:///site?host=/var/run/postgresql`. Kullanıcı adı yazılmaz: unix soketinde işletim sistemi kullanıcısı (`site`) ile giriş yapılır. Havuz en fazla 10 bağlantı açar. `bia_archives` tablosu ilk kullanımda kendiliğinden kurulur. |
| `BIA_JWT_SECRET` | evet | Oturum belirteçlerini imzalar (yönetim, öğretmen yoklaması, kayıt rehberi). Vercel'deki değer aynen kullanılırsa geçişte açık oturumlar kapanmaz. Değiştirilirse herkes yeniden giriş yapar, başvuru verileri etkilenmez. |
| `BIA_ADMIN_PASSWORD` | yönetim girişi için | `/yonetim` girişinde `admin` kullanıcısının şifresi. Boş bırakılırsa bu kullanıcıyla giriş yapılamaz (boş şifre hiçbir zaman kabul edilmez). `BIA_JWT_SECRET` tanımlı değilse imza anahtarı olarak da kullanılır. Bu durum önerilmez. |
| `BIA_USERS` | hayır | Ek yönetim kullanıcıları, JSON dizisi: `[{"id":"...","name":"...","password":"...","role":"admin"}]`. Rolü `teacher` ya da `directory` olmayan her kullanıcı yöneticidir. |
| `BIA_LISTE_PASSWORD` | hayır | Kayıt rehberi (`/liste`) şifresi, en az 12 karakter. Tanımlı değilse koddaki PBKDF2 doğrulayıcısı geçerlidir. |
| `BIA_GITHUB_TOKEN` | evet | Haber ve içerik paneli: `content/*.json` ile `images/uploads/` dosyalarını `main` dalına yazar, herkese açık haberleri GitHub'dan okur. Depoda Contents yazma yetkisi gerekir. Bu yazmalar yeni bir yayın tetikler (1-3 dakika). |

systemd ayrıca `NODE_ENV=production` verir. Kod bunu kullanmaz.

## Yalnızca taşıma betiği için

`sunucu/tasima/arsivleri-ac.mjs` bir kez çalıştırılır. Bu değerler `site.env` dosyasına yazılmaz. Ayrıntı `sunucu/README.md` içinde.

| Değişken | Amaç |
| --- | --- |
| `KAYNAK_DATABASE_URL` | Eski Neon veritabanı (Vercel'deki `DATABASE_URL`). |
| `BIA_APPLICATIONS_ENCRYPTION_KEY`, `BIA_JWT_SECRET`, `BIA_ADMIN_PASSWORD` | Eski şifreli arşivlerin anahtarı: ilk dolu olanın SHA-256 özeti. Canlıda yalnızca `BIA_JWT_SECRET` ve `BIA_ADMIN_PASSWORD` tanımlı olduğu için anahtar `BIA_JWT_SECRET`'tan gelir. |
| `DATABASE_URL` | Yeni veritabanı (yukarıdaki değer). |

## Kaldırılan değişkenler

Bunlar artık okunmuyor, sunucuya taşınmaz:

- `BIA_APPLICATIONS_STORAGE`: GitHub depolama kipi kaldırıldı, tek depo PostgreSQL.
- `BIA_APPLICATIONS_REPO`, `BIA_APPLICATIONS_BRANCH`, `BIA_APPLICATIONS_PATH`: GitHub depolamasıyla birlikte kaldırıldı.
- `BIA_APPLICATIONS_ENCRYPTION_KEY`: veriler artık şifrelenmez (yalnızca taşıma betiği okur).
- `VERCEL`, `VERCEL_ENV`, `VERCEL_URL` ve Vercel'in eklediği diğer değişkenler.
