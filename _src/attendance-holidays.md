# Yoklamada tatil günleri

Yönetim panelinde yüz yüze veya online eğitim alanından **Yoklama raporları → Tatil günü** bölümüne geçin. Hafta içinden bir gün seçip **Tatil olarak işaretle** düğmesini kullanın. Tatil seçili eğitim türündeki bütün öğretmen ve öğrencileri kapsar; raporun öğretmen veya arama filtresi kapsamı daraltmaz. Diğer eğitim türü etkilenmez. Son 120 gün ve gelecek bir yıl için tarih seçilebilir.

Tatil günündeki bütün planlı dersler, daha sonra eklenen atamalar dahil, otomatik **Tatil** görünür. Bu dersler beklenen/tamamlanan yoklama, katılım, öğretmen/öğrenci oranları ve eksik yoklama listelerine dahil edilmez. Tatil günleri art arda devamsızlık sayısını artırmaz veya kesmez. Tarih aralığı yalnızca tatil günlerinden oluşuyorsa oran yerine veri bulunmadığı belirtilir. Tatil satırları raporun **Tatil** filtresinden ve CSV/Excel çıktısından görülebilir.

Öğretmen ekranı tatili haftalık takvimde ve ders kartında gösterir. Tatil gününde öğretmen veya yönetici yoklama değiştiremez; sunucu da bu isteği reddeder. **Tatili kaldır** ile normal programa dönülür. Önceden alınmış yoklama ve notlar silinmez; tatil kaldırıldığında tekrar geçerli olur.

`attendance-holiday-save` yalnızca yönetici oturumuna açıktır. Bir gün ve eğitim türü için tek `kind: "holiday"` kaydı şifreli `planning.enc.json` arşivinde tutulur; ders başına yapay yoklama kaydı oluşturulmaz. `GET /api/bia-applications` yöneticiye `holidays` dizisini, `teacher-data` ise ilgili derslerin etkin durumunu ve haftalık özetteki `holidays` sayısını döndürür. Öğretmen yeni tatil tanımlayamaz. Öğretmenin normal yoklama durumları değişmemiştir.

Doğrulama: `node --test tests/*.test.mjs`; `_src/ders` içinde `pnpm test` ve `pnpm build`. API testleri şifreli arşiv deposunu taklit eder; gerçek öğrenci verileri veya canlı ayarlar değiştirilmez. Masaüstü/mobil tarayıcı incelemesinde de örnek veriler kullanılır. Değişiklikler kullanıcı onayı olmadan yayımlanmaz.
