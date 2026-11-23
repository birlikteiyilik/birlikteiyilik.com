/* Sunumdaki yolculuk haritasının ders verisi (LMS kataloğunun görünen dersleri: server/lesson-library.mjs, VISIBLE_LESSONS).
   Her ders {id, order, title, series}; Akaid derslerinde ilk pul {id, ad, gorsel} olarak gelir.
   Görseller bu klasördeki pul/ altında 256 px'e küçültülmüş olarak durur. Yollar sayfa köküne göredir (göreli). */
(function (root) {
  'use strict';
  root.YOLCULUK_VERI = {
    kuran: {
      title: 'Elifbâ', open: 8,
      lessons: [
      {id: 'kuran-01', order: 1, title: 'Besmele ve İlk Dört Harf', series: 'kuran'},
      {id: 'kuran-02', order: 2, title: 'Cim, Ha, Hı', series: 'kuran'},
      {id: 'kuran-03', order: 3, title: 'Dal, Zel, Ra, Ze', series: 'kuran'},
      {id: 'kuran-04', order: 4, title: 'Sin, Şın, Sad, Dad', series: 'kuran'},
      {id: 'kuran-05', order: 5, title: 'Tı, Zı, Ayn, Gayn', series: 'kuran'},
      {id: 'kuran-06', order: 6, title: 'Fe, Kaf, Kef', series: 'kuran'},
      {id: 'kuran-07', order: 7, title: 'Lam, Mim, Nun', series: 'kuran'},
      {id: 'kuran-08', order: 8, title: 'Vav, He, Lamelif, Ye', series: 'kuran'}
      ]
    },
    akaid: {
      title: 'Akaid', open: 8,
      lessons: [
      {id: 'akaid-01', order: 1, title: 'Evrendeki Düzen', series: 'akaid', pullar: [{id: 'gelincik', ad: 'Gelincik', gorsel: 'assets/yolculuk/pul/akaid-01.webp'}]},
      {id: 'akaid-02', order: 2, title: 'Allahü Teâlânın Varlığı ve Birliği', series: 'akaid', pullar: [{id: 'torba', ad: 'Taş Torbası', gorsel: 'assets/yolculuk/pul/akaid-02.webp'}]},
      {id: 'akaid-03', order: 3, title: 'Gökyüzünün Düzeni', series: 'akaid', pullar: [{id: 'gok-kuresi', ad: 'Gök Küresi', gorsel: 'assets/yolculuk/pul/akaid-03.webp'}]},
      {id: 'akaid-04', order: 4, title: 'Yeryüzünün Sırları', series: 'akaid', pullar: [{id: 'elma-yapragi', ad: 'Elma Yaprağı', gorsel: 'assets/yolculuk/pul/akaid-04.webp'}]},
      {id: 'akaid-05', order: 5, title: 'Canlılardaki İncelik', series: 'akaid', pullar: [{id: 'ates-bocegi', ad: 'Ateş Böceği', gorsel: 'assets/yolculuk/pul/akaid-05.webp'}]},
      {id: 'akaid-06', order: 6, title: 'Kendi Bedenimiz', series: 'akaid', pullar: [{id: 'nar', ad: 'Nar', gorsel: 'assets/yolculuk/pul/akaid-06.webp'}]},
      {id: 'akaid-07', order: 7, title: 'Rahmân ve Rahîm', series: 'akaid', pullar: [{id: 'yun-corap', ad: 'Yün Çorap', gorsel: 'assets/yolculuk/pul/akaid-07.webp'}]},
      {id: 'akaid-08', order: 8, title: 'Bilir, Görür, İşitir, Her Şeye Gücü Yeter', series: 'akaid', pullar: [{id: 'peri-bacasi', ad: 'Peri Bacası', gorsel: 'assets/yolculuk/pul/akaid-08.webp'}]},
      {id: 'akaid-09', order: 9, title: 'Peygamberler Kimdir?', series: 'akaid', pullar: [{id: 'kizilgerdan', ad: 'Kızılgerdan', gorsel: 'assets/yolculuk/pul/akaid-09.webp'}]},
      {id: 'akaid-10', order: 10, title: 'İnsanlara Rehber Peygamberler', series: 'akaid', pullar: [{id: 'kanarya', ad: 'Kanarya', gorsel: 'assets/yolculuk/pul/akaid-10.webp'}]},
      {id: 'akaid-11', order: 11, title: 'Peygamberlerin İlettiği Mesaj: Vahiy', series: 'akaid', pullar: [{id: 'mektup', ad: 'Mühürlü Mektup', gorsel: 'assets/yolculuk/pul/akaid-11.webp'}]},
      {id: 'akaid-12', order: 12, title: 'İlâhî Kitaplar', series: 'akaid', pullar: [{id: 'yali', ad: 'Yalı Evi', gorsel: 'assets/yolculuk/pul/akaid-12.webp'}]},
      {id: 'akaid-13', order: 13, title: 'Görülen ve Görülemeyen Varlıklar', series: 'akaid', pullar: [{id: 'degirmen', ad: 'Yel Değirmeni', gorsel: 'assets/yolculuk/pul/akaid-13.webp'}]},
      {id: 'akaid-14', order: 14, title: 'Melekler', series: 'akaid', pullar: [{id: 'kubbe', ad: 'Kubbe Ev', gorsel: 'assets/yolculuk/pul/akaid-14.webp'}]},
      {id: 'akaid-15', order: 15, title: 'Dünya ve Âhıret Hayatı', series: 'akaid', pullar: [{id: 'canta', ad: 'Yol Çantası', gorsel: 'assets/yolculuk/pul/akaid-15.webp'}]},
      {id: 'akaid-16', order: 16, title: 'Âhıret Hayatının Aşamaları', series: 'akaid', pullar: [{id: 'bilet', ad: 'Tren Bileti', gorsel: 'assets/yolculuk/pul/akaid-16.webp'}]},
      {id: 'akaid-17', order: 17, title: 'Âhıret İnancı ve Davranışlarımız', series: 'akaid', pullar: [{id: 'cini', ad: 'İznik Çinisi', gorsel: 'assets/yolculuk/pul/akaid-17.webp'}]},
      {id: 'akaid-18', order: 18, title: 'Kader', series: 'akaid', pullar: [{id: 'dumen', ad: 'Dümen', gorsel: 'assets/yolculuk/pul/akaid-18.webp'}]}
      ]
    }
  };
})(window);
