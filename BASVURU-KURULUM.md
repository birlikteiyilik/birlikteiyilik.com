# Başvuru sistemi kurulum notları

Başvuru formu `/basvuru`, yönetim ekranı ise mevcut panel içindeki `Başvurular` sekmesidir.

## Veri saklama

- Başvurular, öğretmenler, ders programı ve yoklama sunucudaki PostgreSQL veritabanında, `bia_archives` tablosunda tutulur. Her satır bir arşivdir: `planning.enc.json` (planlama) ve aylık başvuru arşivleri (`YYYY-MM.enc.json`). Adlardaki `.enc` eki geçmişten kalmadır.
- Veriler düz JSONB olarak saklanır. Veritabanı yalnızca sunucunun içinden erişilebilir, yedekler ayrıca şifrelenir.
- Eşzamanlı kayıtlar sürüm numarasıyla korunur: araya başka bir kayıt girerse işlem güncel veriyle yeniden denenir.
- Yönetim paneli veriye yalnızca geçerli yönetici oturumuyla ulaşır. Öğretmen yalnızca kendi derslerini, kayıt rehberi yalnızca kaydı tamamlanan öğrencilerin iletişim bilgilerini görür.

Eski sistemde (Vercel + Neon) arşivler AES-256-GCM ile şifreliydi. Taşıma bir kez `sunucu/tasima/arsivleri-ac.mjs` ile yapılır.

## Ortam değişkenleri

Sunucunun ihtiyaç duyduğu değişkenler ve açıklamaları: `sunucu/ORTAM.md`. Kurulum, taşıma ve geri dönüş: `sunucu/README.md`. Gizli değerler kaynak koda eklenmez.
