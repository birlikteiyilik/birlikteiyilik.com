# Kayıt rehberi kurulumu

`/liste` sayfası mevcut şifreli başvuru arşivinden yalnızca kaydı tamamlanan yüz yüze öğrencilerin gerekli iletişim bilgilerini arar.

Vercel projesine `BIA_LISTE_PASSWORD` adlı, en az 12 karakterli, ayrı ve güçlü bir ortam değişkeni ekleyin. Bu şifre yönetici veya öğretmen şifresinden farklı olmalıdır. Değişken Production ortamında tanımlanıp yeniden dağıtım yapıldığında giriş çalışır. Şifre kodda veya GitHub'da tutulmaz.

Oturum tarayıcı sekmesinde iki saat geçerlidir. Liste oturumu yönetici paneli veya e-yoklama için kullanılamaz.
