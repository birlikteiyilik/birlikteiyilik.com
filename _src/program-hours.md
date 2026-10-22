# Genel ve hocaya özel ders saatleri

Yüz yüze eğitim alanında **Ders programı → Genel program** başlığının yanındaki küçük kalem iki seçenek açar:

- **Genel programı düzenle:** Ortak programdaki başlangıç/bitiş saatlerini değiştirir, yeni saat ekler veya boş saati kaldırır. Ortak programı kullanan hocalara uygulanır. Özel programı olan hocalar kendi saatlerini korur. Yeni hocalar ortak programı kullanır.
- **Ekleme / düzeltme:** Aramayla bir veya birden fazla hoca seçilir. Düzenlenen saat listesi yalnızca bu hocalara uygulanır. Ortak program ve diğer hocalar değişmez. Hoca kartındaki küçük kalem aynı pencereyi o hocayı seçerek açar.

Hoca seçimi yapılırken saatler henüz değiştirilmemişse seçilen hocaların saatleri birleştirilerek açılır. Farklı programlar aynı listeye dönüştürülecekse seçim altında açıklama gösterilir. Saatler çalışma günlerinin tamamı için geçerlidir; mevcut hoca çalışma günü alanları korunur. Online eğitimdeki yalnızca hoca atama akışı değişmez.

Saatlerin başlangıcı bitişinden önce olmalı ve aynı programdaki saatler çakışmamalıdır. Atanmış derslerin bulunduğu bir saat doğrudan kaldırılamaz; önce öğrencilerin dersleri başka saate taşınır. Bu kural hem arayüzde hem API'de uygulanır. Saat değişikliği seçili kapsamın mevcut öğrenci atamalarını da aynı işlemde yeni saate taşır. Bir saati kullanmayan hocalar için boş saat ekleme veya çıkarma doğrudan yapılabilir. Özel programlı hocalar, mevcut atamaları ortak saatlere uyuyorsa **Ortak programa döndür** ile tekrar ortak programa bağlanabilir.

Saat alanları tarayıcı veya cihaz dili ne olursa olsun 24 saatlik `SS:DD` biçimindedir; AM/PM seçimi yoktur. `1500` yazıldığında `15:00` olarak düzenlenir. Alan dışına çıkıldığında `9:00` veya `900` da `09:00` olarak tamamlanır. `24:00`, geçersiz dakika ve AM/PM metinleri kaydedilemez.

Program, başvurudaki müsait saatler, hoca seçimine göre öğrenci atama saatleri, program filtreleri, Excel ve öğretmen ekranı aynı saatleri kullanır. Hocalara özel eklenmiş bir saat diğer hocalarda müsait görünmez.

## Kayıt ve tutarlılık

`program-hours-save` yalnızca yöneticilere açıktır. Ortak liste `planning.enc.json` içindeki `kind: "program-hours"` kaydında, özel liste hocanın `programSlots` alanında saklanır. `programRevision` eşzamanlı düzenlemelerde eski pencerenin yeni programı ezmesini engeller. Tüm program/atama değişikliği aynı şifreli arşiv yazımında yapılır; öğrenci geçmişi mevcut mekanizmayla kaydedilir. Öğretmen bilgilerini düzenlemek özel saatleri silmez.

Değişiklik günü İstanbul saatine göre belirlenir. Önceki günlerdeki program `programScheduleHistory` içinde korunur; yoklama ve devamsızlık raporları ilgili günün programını kullanır. Önceki günlerin yoklamaları ve saatleri değiştirilmez. Bugüne ait alınmış yoklamanın durumu ve notu aynı derse bağlı kalır; ilk kayıt saati `slotAtAttendance` alanında korunur. Eski günlere dönük yönetici yoklama düzeltmesi o günün programını kullanır.

`GET /api/bia-applications?action=program-hours` yalnızca başvuruda gösterilecek güncel saatler ve revizyonu döndürür. Öğrenci veya öğretmen bilgileri bu yanıta dahil edilmez. Public başvuru formu saatleri bu uçtan alır; bir hocaya ait özel saat yalnızca o hocaya atanabilir.

## Doğrulama

`node --test tests/*.test.mjs` ortak ve seçili hoca kapsamlarını, ekleme/değiştirme/boş saati kaldırmayı, çakışmaları, yetkileri, eski revizyonu, geçmiş günlerin oranlarını ve Excel modelini kapsar. API testleri şifreli arşivi taklit eder. Tarayıcı kontrolleri örnek kayıtlarla masaüstü, 390px ve 320px ekranlarda çalıştırılır; canlı öğrenci verileri veya program ayarları değiştirilmez. Kullanıcı incelemesinden önce yayın yapılmaz.
