# Kayıt rehberi kurulumu

`/liste` sayfası mevcut şifreli başvuru arşivinden yalnızca kaydı tamamlanan yüz yüze öğrencilerin gerekli iletişim bilgilerini arar.

Giriş için ayrıca Vercel ortam değişkeni tanımlamaya gerek yoktur. Belirlenen erişim şifresinin açık metni kaynak kodda tutulmaz; sunucu yalnızca tuzlu PBKDF2 doğrulayıcısını içerir. İstenirse `BIA_LISTE_PASSWORD` ortam değişkeni daha sonra ayrı bir şifreyle geçersiz kılma amacıyla kullanılabilir.

Oturum tarayıcı sekmesinde iki saat geçerlidir. Liste oturumu yönetici paneli veya e-yoklama için kullanılamaz.
