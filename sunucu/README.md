# Ana site sunucusu (site)

Site, Vercel yerine VPS'te tek bir Node 22 süreci olarak çalışır. Önde Caddy vardır (HTTPS, sıkıştırma, bakım modu, apex → www). Sözleşme: `sunucu-kurulum/SOZLESME.md`.

## Nasıl çalışır

`node sunucu/server.mjs` 127.0.0.1:`PORT` adresini dinler (sunucuda 3001). Ortam değişkenleri: `sunucu/ORTAM.md`.

- **Statik dosyalar** depo kökünden sunulur. Kaynak, test ve gizli dosyalar, paket ve yapılandırma dosyaları, `api/`, `sunucu/`, `content/applications/`, `yon/remotion/` ve `*.md` engellidir (404). Liste: `sunucu/lib/statik.mjs`.
- **vercel.json** açılışta okunur ve Vercel'in sırasıyla uygulanır: `cleanUrls`, `trailingSlash`, yönlendirmeler, başlık kuralları (`sunucu/lib/vercel.mjs`). www → apex kuralı atlanır, çünkü Caddy apex → www yapar. Kural uygulansaydı sonsuz döngü olurdu. Desteklenmeyen yeni bir kural eklenirse sunucu açılmaz ve testler hata verir.
- **API**: `/api/bia-applications` (gövde sınırı 1 MB) ve `/api/bia-news` (8 MB, çünkü panelin 5 MB'lık görseli base64 olarak gelir). Başvuru verileri PostgreSQL'deki `bia_archives` tablosunda düz JSONB olarak tutulur. Haber ve içerik kayıtları GitHub'a yazılmaya devam eder.
- **Giriş sınırı**: yönetim, öğretmen ve kayıt rehberi girişlerinde IP başına 10 hatalı deneme / 10 dakika, sonra 429. İstemci IP'si Caddy'nin `X-Forwarded-For` başlığındaki ilk adrestir.
- **Sağlık**: `GET /__saglik` → `200 {"ok":true,"uygulama":"site","surum":"<sha>"}`, veritabanına ulaşamazsa 503. Yalnızca porta doğrudan gelen isteğe açıktır, Caddy üzerinden 404 döner.
- **Kapanış**: SIGTERM'de yeni bağlantı alınmaz, açık istekler biter, veritabanı havuzu kapanır (en geç 10 sn).

Yerelde:

```sh
npm ci
npm test                                   # bütün testler (PGlite ile, ağ ve veritabanı gerekmez)
PORT=3001 APP_ENV=test DATABASE_URL=postgresql://... BIA_JWT_SECRET=... npm start
```

## Yayın

`main`'e her push `.github/workflows/sunucu-yayin.yml` iş akışını çalıştırır: testler → sürüm klasörü (`sunucu/surum-hazirla.mjs`, üretim bağımlılıklarıyla) → klasörün kendi başına denenmesi → `rsync` ile `/srv/site/gelen/<sha>/` → `sudo /usr/local/bin/birlikte-yayinla site <sha>`. Betik servisi yeniden başlatır, sağlık kontrolü geçmezse önceki sürüme döner. GitHub sırları: `SUNUCU_SSH_ANAHTARI`, `SUNUCU_BILINEN_HOST` (`SUNUCU_ADRESI` ile aynı adla yazılmış host anahtarı satırı), `SUNUCU_ADRESI`.

Haber panelindeki her kayıt `main`'e bir commit olduğu için yeni bir yayın başlatır. Herkese açık haber listesi kayıttan hemen sonra güncellenir, sayfalara gömülü içerik 1-3 dakika içinde gelir.

İlk yayından önce: sunucudaki kapı betiği (`birlikte-deploy-kapisi`) `--link-dest=/srv/site/simdiki/` biçimini bekliyor. rsync 3.2 bu seçeneği sunucu tarafına `--link-dest /srv/site/simdiki/` (eşittir yerine boşlukla) gönderebilir. İlk yayın kapıda "izin verilmeyen link-dest" ile durursa kapının bu biçimi de kabul etmesi gerekir.

## Arşivlerin taşınması (bir kez)

Eski Neon veritabanındaki şifreli arşivler `sunucu/tasima/arsivleri-ac.mjs` ile açılıp `bia_archives` tablosuna yazılır. Betik tek işlemde yazar, iki tarafı yeniden okuyup karşılaştırır ve en küçük farkta geri alır. Hedefte arşiv varsa hiçbir şey yazmaz. Ekrana yalnızca arşiv adı, sürüm, kayıt sayısı, boyut ve sha256 özeti yazılır. Neon'daki veri yalnızca okunur, değişmez.

Sıra:

1. Vercel'in `main`'den otomatik yayınını kapatın (Vercel → Project → Settings → Git). Bu dal `main`'e birleşince Vercel'deki site yeni kodla çalışırsa Neon'da `bia_archives` tablosunu boş bulur ve başvurular boş görünür.
2. Dalı `main`'e birleştirin. İş akışı sürümü sunucuya koyar.
3. Geçici ortam dosyası (yalnızca root okur). Değerleri Vercel'den alın:

   ```sh
   sudo install -m 600 /dev/null /root/arsiv-tasima.env
   sudo nano /root/arsiv-tasima.env
   # KAYNAK_DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
   # BIA_JWT_SECRET=<Vercel'deki değer>
   # BIA_APPLICATIONS_ENCRYPTION_KEY=<yalnızca Vercel'de tanımlıysa>
   ```

4. Kuru çalışma. Hiçbir şey yazmaz, arşivleri çözüp listeler ve hedefin boş olup olmadığını söyler:

   ```sh
   sudo bash -c 'set -a; . /root/arsiv-tasima.env; set +a; cd /srv/site/simdiki && DATABASE_URL="postgresql:///site?host=/var/run/postgresql" runuser -u site -- /usr/bin/node sunucu/tasima/arsivleri-ac.mjs --kuru'
   ```

5. Sessiz bir saatte bakım modunu açın (`sudo touch /etc/caddy/bakim-acik`), gerçek taşımayı çalıştırın, hemen ardından DNS'i sunucuya çevirin:

   ```sh
   sudo bash -c 'set -a; . /root/arsiv-tasima.env; set +a; cd /srv/site/simdiki && DATABASE_URL="postgresql:///site?host=/var/run/postgresql" runuser -u site -- /usr/bin/node sunucu/tasima/arsivleri-ac.mjs'
   ```

   Çıkış kodu 0 ve son satır "yazıldı ve doğrulandı" olmalı. 1: hiçbir şey yazılmadı (sebep ekranda). 2: kayıttan sonraki doğrulama tutmadı. Tabloyu boşaltıp (`TRUNCATE bia_archives`) yeniden çalıştırın.

6. Denetim, ardından bakım modunu kapatın (`sudo rm /etc/caddy/bakim-acik`):

   ```sh
   sudo -u site psql "postgresql:///site?host=/var/run/postgresql" -c "SELECT archive_name, version, updated_at, jsonb_array_length(data) FROM bia_archives ORDER BY 1"
   curl -s http://127.0.0.1:3001/__saglik
   ```

7. DNS yayıldıktan sonra kuru çalışmayı bir kez daha yapın. Sürümler taşıma çıktısıyla aynıysa Vercel'de taşımadan sonra yazma olmamıştır. Farklı olan arşiv varsa aradaki kayıtlar elle aktarılmalıdır.
8. Geçici dosyayı silin: `sudo shred -u /root/arsiv-tasima.env`.

## Geri dönüş

- **Uygulama sürümü**: yayın betiği sağlık kontrolü geçmeyen sürümü kendisi geri alır. Elle dönmek için tercih edilen yol, sorunlu commit'i `main`'de `git revert` edip push etmektir. Acil durumda son beş sürümden biri elle seçilebilir:

  ```sh
  ls -1t /srv/site/surumler/
  sudo ln -sfn /srv/site/surumler/<eski-sha> /srv/site/simdiki.yeni && sudo mv -Tf /srv/site/simdiki.yeni /srv/site/simdiki
  echo "SURUM=<eski-sha>" | sudo tee /etc/birlikte/site.surum && sudo systemctl restart birlikte@site
  ```

- **Vercel'e dönüş** (taşımadan sonra ciddi bir sorun çıkarsa): Neon'daki veri taşımada değişmediği için DNS'i Vercel'e geri çevirmek ve Vercel'in otomatik yayınını eski commit'te bırakmak yeter. Sunucuda bu arada alınan başvurular Neon'da yoktur, elle aktarılmalıdır.
- **Veri**: veritabanı yedekten geri yüklendiğinde servisi yeniden başlatmak gerekmez. Bellek önbelleği satır değişikliğini (sürüm + xmin) fark eder.
