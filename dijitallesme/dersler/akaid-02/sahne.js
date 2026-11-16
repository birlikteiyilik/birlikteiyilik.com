/* Akaid 2 · Allahü Teâlânın Varlığı ve Birliği — sahne: "Yaşayan Minyatür", Ege kıyısı.
   Ders bir arayıştır: kendini kendi var eden bir şey aranır. Aday olan her şey muhtaç çıkar ve sahneden
   çekilir; sonunda boş kâğıt kalır. Kanıt sahnenin kendisidir, Allahü teâlâ için hiçbir şekil çizilmez.
   Boyalı katmanlar kd-tuval ile canlanır, her görsel olay anlatıcının kelimesine bağlıdır (t).
   a ortam saatidir: durakta t durur, dalga ve rüzgâr sürer. İnsan figürü yoktur.
   Araba kıyı plakasının içinde boyalıdır (kiyi-taban-arabali); silinirken altından arabasız plaka (kiyi-taban) açılır.
   Ayrıntıya bakmak için arabayı kamerayla büyütmek yerine T.odak ile araba.webp ortaya alınır (arabaIncele). */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-02'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['gok', 'kiyi-taban', 'kiyi-taban-arabali', 'kiyi-on', 'kum-zemin', 'kagit', 'gunes', 'agac', 'araba', 'cop-yigini', 'torba', 'tas', 'yaprak', 'kum-tanesi', 'eser-kitap'];
    var liste = {};
    GORSELLER.forEach(function (a) { liste[a] = api.yol('gorsel/' + a + '.webp'); });
    var hazir = T.yukle(liste, api.yukleniyor);

    /* ——— zaman ve yumuşatma ——— */
    function ic(t, a, d) { return Math.min(1, Math.max(0, (t - a) / (d || 1))); }
    var Y = {
      cik: function (x) { var u = 1 - x; return 1 - u * u * u; },
      gir: function (x) { return x * x * x; },
      ikili: function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
      sin: function (x) { return 0.5 - 0.5 * Math.cos(Math.PI * x); },
      geri: function (x) { var c = 1.70158, u = x - 1; return 1 + (c + 1) * u * u * u + c * u * u; }
    };
    function tw(t, a, d, e) { return (e || Y.cik)(ic(t, a, d)); }
    function kr(a, b, k) { return a + (b - a) * k; }
    function pencere(t, a, b, g, c) { return Math.min(tw(t, a, g || 0.4), 1 - tw(t, b, c || 0.4)); }
    function hash(i, s) { var x = Math.sin(i * 127.1 + (s || 0) * 311.7) * 43758.5453; return x - Math.floor(x); }

    /* ——— anlatıcıya bağlı anlar ——— */
    function kelSonra(m, an) { for (var n = 1; n < 12; n++) { var z = kel(m, n); if (z >= an) return z; } return an; }
    var D = {}; ['eser', 'torba', 'arayis', 'usta'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {
      araba: C(1), teker: C(2), cam: C(3), vida: C(4), biri: C(5), dersin: C(6), gul: C(7), dalga: C(8), yigin: C(9), ara: C(10),
      s1: C(11), s2: C(12), s3: C(13), bul: C(14), sonda: C(15), once: C(16), kitap: C(17), hangi: C(18), her: C(19),
      akil: kel('akılla'), hesap: kel('hesapla'), plan: kel('planla'), kisi: C(21), plansiz: C(22), dene: C(23), torba: C(24), birden: kel('birden'), salla: C(25), bakalim: C(26),
      gordun: C(27), sallayinca: C(28), dizince: C(29), ontas: C(30), harf: C(31), yaprak: C(32), incecik: C(33), fabrika: C(34),
      isik: kel('ışığı'), hava: kel('havayı'), su: kel('suyu'), besin: kel('besin'), ince: C(36), kum: C(37), varlik: C(38),
      donelim: C(39), a1: C(40), hayir: C(41), usta: C(42), tanim: C(43), y1: C(44), y2: C(45), ag1: C(46), ag2: C(47), sira: C(48),
      hic: C(50), yoktu: C(51), degis: C(52), edemez: C(53), buyuk: C(54), nasil: C(55), eger: C(56), olamaz: C(57),
      demek: C(58), o: C(59), varligi: C(60), yoktan: C(62), sahibi: C(63), ortak: C(64), kim: C(65), isini: C(66), kusur: C(68), bir: C(69), orta2: C(70), vahdet: C(71), ibadet: C(72),
      dikkat: C(73), hatirla: C(74), evet: C(76), ustasi: C(77), benzemez: C(79), dusun: C(80), basta: C(82), bulamadik: C(84), cunku: C(85), sen: C(86), hicMuh: C(87),
      artik: C(88), yaratan: C(89), gelecek: C(90), emanet: C(91)
    };

    /* ——— yazılar: her biri kendi zaman aralığında görünür ——— */
    function yazi(metin, sinif, x, y) {
      var e = el('div', { class: 'kd-y ' + (sinif || ''), text: metin });
      e._x = x; e._y = y; e._o = -1; api.yazi.appendChild(e);
      return e;
    }
    function gos(e, o, dy, s) {
      if (o <= 0.003) { if (e._o !== 0) { e.style.opacity = 0; e.style.visibility = 'hidden'; e._o = 0; } return; }
      e._o = o; e.style.visibility = 'visible'; e.style.opacity = o.toFixed(3);
      e.style.transform = 'translate(' + e._x + 'px,' + (e._y + (dy || 0)).toFixed(1) + 'px) translate(-50%,-50%)' + (s ? ' scale(' + s.toFixed(3) + ')' : '');
    }
    var ARAYIS = 'Aranıyor: Kendini kendi var eden bir şey';
    // [yazı, sınıf, x, y, başlangıç, bitiş]
    var AKIS = [
      ['“Bunu dalgalar bir araya getirdi.”', 'etiket', 800, 96, AN.biri + 0.6, AN.gul],
      ['?', 'sor', 800, 300, AN.dersin - 0.05, AN.gul + 0.5],
      ['Yığın yapar.', 'etiket', 560, 96, AN.yigin - 0.1, AN.ara - 0.2],
      ['Araba yapmaz.', 'etiket', 1040, 96, kel('araba', 2) - 0.1, AN.ara - 0.2],
      [ARAYIS, 'etiket', 800, 96, AN.ara + 0.5, AN.kitap],
      ['Her eserin bir yapanı vardır.', 'etiket', 800, 96, AN.her, AN.akil - 0.3],
      ['akıl', 'etiket', 877, 124, AN.akil, AN.kisi + 0.4],
      ['hesap', 'etiket', 784, 745, AN.hesap, AN.kisi + 0.4],
      ['plan', 'etiket', 1165, 745, AN.plan, AN.kisi + 0.4],
      ['Hesap yok, plan yok: olur mu?', 'etiket', 800, 96, AN.plansiz + 0.5, AN.dene + 0.2],
      ['Sallayınca: sıraya girmeleri çok zor.', 'etiket', 800, 96, AN.sallayinca, AN.dizince - 0.1],
      ['Sen düşünüp dizince: hepsi yerini buldu.', 'etiket', 800, 96, AN.dizince, AN.ontas - 0.1],
      ['On taşın kendi kendine sıraya girmesi çok zor.', 'etiket', 800, 96, AN.ontas, AN.harf - 0.1],
      ['Rastgele harflerden anlamlı cümle çıkması çok zor.', 'etiket', 800, 96, AN.harf + 1, AN.yaprak],
      ['ağacın dev mutfağı', 'etiket', 800, 92, kel('dev') - 0.2, AN.isik - 0.15],
      ['ışık', 'etiket', 1280, 180, AN.isik, AN.ince - 0.2],
      ['hava', 'etiket', 300, 300, AN.hava, AN.ince - 0.2],
      ['su', 'etiket', 620, 740, AN.su, AN.ince - 0.2],
      ['ağaca besin', 'etiket', 1020, 740, AN.besin - 0.4, AN.ince - 0.2],
      ['Arabadan çok daha ince bir iş', 'etiket', 800, 92, AN.ince, AN.kum - 0.15],
      ['Bir kum tanesinde bile ince bir sanat', 'etiket', 800, 92, AN.kum + 0.3, AN.varlik - 0.1],
      ['Her varlık bir sanat eseri', 'etiket', 800, 92, AN.varlik + 0.8, AN.donelim - 0.3],
      [ARAYIS, 'etiket', 800, 96, AN.donelim, AN.hic - 0.2],
      ['ustaya muhtaç', 'damga', 975, 758, AN.usta, AN.y1 + 0.2],
      ['muhtaç: ihtiyacı olan', 'etiket', 800, 190, AN.tanim, AN.y1],
      ['ağaca muhtaç', 'damga', 1010, 250, AN.y2, AN.ag1 + 0.1],
      ['toprağa muhtaç', 'damga', 1440, 640, kel('toprağa'), AN.sira],
      ['suya muhtaç', 'damga', 640, 470, kel('suya'), AN.sira],
      ['Güneş’e muhtaç', 'damga', 560, 150, kel('güneşe'), AN.sira],
      ['Hepsi bir zamanlar yoktu.', 'etiket', 800, 96, AN.yoktu, AN.degis - 0.1],
      ['Hepsi değişiyor.', 'etiket', 800, 96, AN.degis, AN.edemez - 0.1],
      ['Kendini var edemeyen, başka bir şeyi de var edemez.', 'etiket', 800, 96, AN.edemez, AN.buyuk - 0.1],
      ['Her şey muhtaçsa, bunlar nasıl var?', 'etiket', 800, 96, AN.nasil, AN.olamaz - 0.1],
      ['Var olmak için hiçbir şeye muhtaç olmayan bir Yaratan vardır.', 'kagit', 800, 320, AN.demek, AN.varligi - 0.3],
      ['O, Allahü teâlâdır.', 'kagit iri', 800, 540, AN.o, AN.varligi - 0.3],
      ['Onun varlığı kendindendir. O, hep vardır.', 'kagit', 800, 450, AN.varligi, AN.yoktan - 0.3],
      ['Her şeyi yoktan var eden, yalnız Odur.', 'kagit', 800, 350, AN.yoktan, AN.ortak - 0.4],
      ['Her varlığın yaratanı, sahibi Odur.', 'kagit', 800, 540, AN.sahibi, AN.ortak - 0.4],
      ['Ortağa kim muhtaç olur?', 'kagit', 800, 340, AN.kim, AN.kusur - 0.4],
      ['İşini tek başına yapamayan. Bu bir eksikliktir.', 'kagit', 800, 530, AN.isini, AN.kusur - 0.4],
      ['Allahü teâlâda hiçbir eksiklik, hiçbir kusur yoktur.', 'kagit', 800, 450, AN.kusur, AN.bir - 0.3],
      ['Allahü teâlâ birdir.', 'kagit iri', 800, 230, AN.bir, AN.dikkat - 0.3],
      ['Ortağı yoktur, benzeri yoktur.', 'kagit', 800, 370, AN.orta2, AN.dikkat - 0.3],
      ['Vahdâniyyet: birlik', 'kagit', 800, 510, AN.vahdet, AN.dikkat - 0.3],
      ['Yalnız Ona ibadet ederiz.', 'kagit', 800, 650, AN.ibadet, AN.dikkat - 0.3],
      ['Arabayı hatırla.', 'kagit', 800, 300, AN.hatirla, D.usta],
      ['Araba, ustasının var olduğunu gösterir.', 'kagit', 800, 450, AN.ustasi, AN.benzemez - 0.3],
      ['Allahü teâlâ, yaratılmış hiçbir şeye, hiçbir bakımdan benzemez.', 'kagit', 800, 320, AN.benzemez, AN.basta - 0.3],
      ['Yarattıklarını düşünürüz, nasıl olduğunu düşünmeyiz.', 'kagit', 800, 560, AN.dusun, AN.basta - 0.3],
      ['Kendini kendi var eden bir şey…', 'kagit', 800, 340, AN.basta + 1.9, AN.cunku - 0.3],
      ['Bulamadık.', 'kagit iri', 800, 520, AN.bulamadik, AN.cunku - 0.3],
      ['muhtaç', 'damga', 400, 600, kelSonra('araba', AN.cunku), AN.sen - 0.2],
      ['muhtaç', 'damga', 800, 600, kelSonra('yaprak', AN.cunku), AN.sen - 0.2],
      ['muhtaç', 'damga', 1200, 600, kelSonra('güneş', AN.cunku), AN.sen - 0.2],
      ['Sen de, ben de her nefeste muhtacız.', 'kagit', 800, 450, AN.sen, AN.hicMuh - 0.3],
      ['Hiçbir şeye muhtaç olmayan, yalnız Allahü teâlâdır.', 'kagit', 800, 450, AN.hicMuh, AN.artik - 0.15],
      ['Gelecek ders: Gökyüzünün düzeni', 'etiket', 800, 110, AN.gelecek + 0.2, AN.emanet + 0.8]
    ].map(function (s) { return { e: yazi(s[0], s[1], s[2], s[3]), kagit: /^kagit/.test(s[1]), bas: s[4], son: s[5], damga: s[1] === 'damga' }; });
    // akıl, hesap, plan etiketleri her karede incelenen arabanın noktalarına taşınır (arabaIncele)
    ETIKET_AKIL = AKIS[6].e; ETIKET_HESAP = AKIS[7].e; ETIKET_PLAN = AKIS[8].e;
    var kagitYazisi = false;
    function yazilar(t) {
      kagitYazisi = false;
      AKIS.forEach(function (s) {
        var o = pencere(t, s.bas, s.son, s.kagit ? 0.8 : 0.3, 0.4);
        gos(s.e, o, s.kagit ? kr(8, 0, tw(t, s.bas, 0.8)) : 0, s.damga ? kr(1.25, 1, tw(t, s.bas, 0.3, Y.cik)) : 0);
        if (s.kagit && o > 0.2) kagitYazisi = true;
      });
    }
    // Araba, ağaç ve Güneş sırayla sorulur
    var soru = [yazi('?', 'sor', 975, 462), yazi('?', 'sor', 1440, 150), yazi('?', 'sor', 360, 230)];
    [1, 2, 3].forEach(function (i) { soru[i - 1].style.fontSize = '110px'; });
    // Taşların numaraları
    var tasNo = []; for (var n = 0; n < 10; n++) tasNo.push(yazi(String(n + 1), 'tasno', 0, 0));
    // Rastgele dökülen harfler
    var HARFLER = 'KŞBAGRYÇNELİMZOTUFPDS'.split('').map(function (h, i) {
      var e = yazi(h, 'harf', 230 + hash(i, 61) * 1140, 300 + hash(i, 62) * 320);
      e.style.rotate = ((hash(i, 63) - 0.5) * 70).toFixed(0) + 'deg';
      return e;
    });
    // Denenen varlıkların damgası
    var damgalar = {
      gunes: yazi('kendini var edemez', 'damga', 610, 200), deniz: yazi('kendini var edemez', 'damga', 330, 415), agac: yazi('kendini var edemez', 'damga', 1420, 255), dag: yazi('kendini var edemez', 'damga', 1290, 215)
    };

    /* ——— altın çizgiler ——— */
    var ALTIN = '#ffe29a';
    function yol(d, oz) { var p = E2('path', Object.assign({ d: d, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, oz || {}), svg); p._boy = 0; return p; }
    function olc(p) { if (!p._boy) p._boy = p.getTotalLength(); return p._boy; }
    function cizgiCiz(p, k, o) {
      var b = olc(p);
      p.setAttribute('stroke-dasharray', b + ' ' + b); p.setAttribute('stroke-dashoffset', b * (1 - k));
      p.style.opacity = k <= 0 ? 0 : (o == null ? 1 : o);
    }
    var bag = {
      yaprak: yol('M1060 212 C1140 190 1220 200 1300 240', { stroke: ALTIN, 'stroke-width': 4 }),
      toprak: yol('M1440 470 C1450 520 1450 570 1440 618', { stroke: ALTIN, 'stroke-width': 4 }),
      su: yol('M1300 500 C1110 430 880 420 680 462', { stroke: ALTIN, 'stroke-width': 4 }),
      gunes: yol('M1250 240 C1040 110 780 100 600 146', { stroke: ALTIN, 'stroke-width': 4 })
    };

    /* ——— yerleşim: sahne noktaları ——— */
    var PG = 1696, PH = 954;
    // Kıyı plakası 1672×941 pikseldir ve (800, 450) merkezinde PG×PH çizilir; araba plakanın içinde boyalıdır.
    // P(px, py) plaka pikselini sahne noktasına çevirir. Plakaya bağlı her şey derinlik d = PD ile çizilir:
    // kamera oynayınca araba, çöp ve ağaç yol üstünde kaymaz.
    var PD = 0.85;
    function P(px, py) { return { x: 800 + (px - 836) * PG / 1672, y: 450 + (py - 470.5) * PH / 941 }; }
    var AGAC = { x: 1440, y: 552, g: 470 }, COP = { x: 790, y: 795, g: 310 }, GUNES = { x: 360, y: 150, g: 230 };
    // Plakadaki arabanın merkezi P(1009, 647) ≈ (975, 629); yazılar (soru işareti, ustaya muhtaç) bu noktaya göre elle yerleştirildi
    var TEKER = [P(972, 700), P(1120, 668)];                    // plakadaki iki tekerlek (ön, arka)
    var TORBA = { x: 280, y: 470 }, SIRA = { x: 450, dx: 110, y: 560 }, HEDEF = { x: 450, dx: 110, y: 380 };
    var TORBA_G = 230, TORBA_H = 263;                          // torbanın çizim ölçüsü (açık ağızlı torba, 1172×1342 oranı)
    var AGIZ = 0.34 * TORBA_H, DEVRIL = 70;                    // ağız merkezin yaklaşık 89 px üstündedir; devrilince ağız TORBA noktasına iner
    // İnceleme görünümü: araba.webp (1500×654) kaynağın 1900×828 ölçüsünden küçültüldü; noktalar kaynak pikselidir
    var AS = 1500 / 1900, INC = { x: 800, y: 415, g: 1160 };
    var NOK = {
      tekerO: [364, 657], tekerA: [1527, 657], cam1: [897, 187], cam2: [1247, 187], cam0: [658, 163], madalyon: [925, 497]
    };
    // Arabanın kenar çizgisi: kaynak pikselinde, opak yüzeyin konturu (saat yönünde, sol uçtan)
    var CEVRE = [[4, 595], [16, 554], [46, 540], [49, 519], [64, 500], [44, 479], [29, 435], [32, 393], [51, 356], [95, 346], [145, 301], [211, 276], [548, 239], [704, 68], [736, 46], [826, 18], [989, 4], [1109, 6], [1246, 20], [1338, 44], [1416, 82], [1472, 129], [1579, 272], [1713, 327], [1767, 375], [1796, 424], [1840, 441], [1853, 491], [1831, 529], [1837, 558], [1837, 559], [1842, 572], [1863, 568], [1880, 581], [1895, 619], [1885, 652], [1845, 664], [1702, 670], [1685, 727], [1657, 770], [1607, 809], [1550, 827], [1502, 827], [1427, 796], [1382, 748], [1355, 681], [1336, 683], [1308, 704], [1276, 708], [634, 708], [593, 702], [568, 682], [547, 678], [535, 680], [504, 755], [463, 796], [413, 820], [342, 827], [289, 812], [240, 778], [213, 744], [188, 676], [147, 673], [98, 681], [69, 672], [55, 654], [41, 662], [21, 659], [7, 638], [4, 595], [4, 595]];

    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    function hepsi(o, ek) { return Object.assign({}, o || {}, ek); }

    /* ——— kamerayla birlikte parçacık ——— */
    var KZ = 1;
    function izE(x, y, rx, ry, renk, o, d) { d = d == null ? 1 : d; var e = T.ekran(x, y, d), z = 1 + (KZ - 1) * d; T.iz(e.x, e.y, rx * z, ry * z, 0, renk[0], renk[1], renk[2], o); }
    var ALTIN_R = [1, 0.86, 0.42], KREM_R = [1, 0.97, 0.88], SU_R = [0.5, 0.86, 1], YESIL_R = [0.78, 0.95, 0.48];

    /* ——— kıyı: gök, Güneş, kıyı, nesneler, ön plan ——— */
    function kiyi(a, sec) {
      sec = sec || {};
      var ort = { carp: sec.carp, gecis: sec.gecis, doy: sec.doy };
      plaka('gok', hepsi(ort, { d: 0.25, parilti: 1, gecis: sec.gokGecis || sec.gecis, x: 800 + Math.sin(a * 0.05) * 8 }));
      var gy = sec.gunesY == null ? GUNES.y : sec.gunesY;
      if (sec.gunesO !== 0) T.ciz('gunes', hepsi(ort, { x: GUNES.x, y: gy, g: GUNES.g, r: a * 1.6, parilti: 1, d: 0.4, gecis: sec.gunesGecis || sec.gecis }));
      // Araba plakanın içinde boyalıdır. Silinirken altından arabasız plaka açılır: ikisi araba dışında aynıdır, aynı
      // dört köşeye çizildikleri için gecis lekesi de aynıdır (silinen yer altında aynı pikseli bulur).
      var arabali = sec.arabaO !== 0, zemin = { d: PD, su: 0.4, parilti: 0.4 };
      if (!arabali || sec.arabaGecis) plaka('kiyi-taban', hepsi(ort, hepsi(zemin, { gecis: sec.tabanGecis || sec.gecis })));
      if (arabali) plaka('kiyi-taban-arabali', hepsi(ort, hepsi(zemin, { gecis: sec.arabaGecis || sec.tabanGecis || sec.gecis })));
      if (sec.agacO !== 0) T.ciz('agac', hepsi(ort, { x: AGAC.x, y: AGAC.y, g: AGAC.g, ax: 0.5, ay: 1, d: PD, ruzgar: 0.8, buk: Math.sin(a * 0.6) * 3, gecis: sec.agacGecis || sec.gecis }));
      if (sec.cop) T.ciz('cop-yigini', hepsi(ort, { x: COP.x, y: COP.y, g: COP.g, ax: 0.5, ay: 1, d: PD, gecis: sec.copGecis || sec.gecis, o: sec.cop }));
      plaka('kiyi-on', hepsi(ort, { d: 1.12, ruzgar: 1, gecis: sec.onGecis || sec.gecis, x: 800, y: 456 }));
    }
    function halka(x, y, r, k, o, d) {   // plakadaki bir şeyin çevresinde dönen altın noktalar (kameraya bağlı)
      for (var i = 0; i < 26; i++) {
        if (i / 26 > k) break;
        var f = i / 26 * Math.PI * 2 - 1.2;
        izE(x + Math.cos(f) * r, y + Math.sin(f) * r, 3.6, 3.6, ALTIN_R, o, d);
      }
    }

    /* ——— inceleme: araba sahnenin parçasıdır, ayrıntıya bakılırken loş bir zeminin önünde ortaya gelir ———
       Çizgiler ve halkalar T.odak'ın verdiği nokta() ile arabanın piksellerine bağlıdır; kamera yoktur (odak ekrana yapışıktır). */
    function nk(f, p) { return f.nokta(p[0] * AS, p[1] * AS); }
    function ringD(x, y, rx, ry, k, o, n, boyut, ofs) {   // elips üstünde altın noktalar
      for (var i = 0; i < n; i++) {
        if (i / n > k) break;
        var f = i / n * Math.PI * 2 + (ofs == null ? -1.2 : ofs);
        T.iz(x + Math.cos(f) * rx, y + Math.sin(f) * ry, boyut, boyut, 0, ALTIN_R[0], ALTIN_R[1], ALTIN_R[2], o);
      }
    }
    function noktaCizgi(x0, y0, x1, y1, k, o) {            // iki nokta arasında altın noktalı çizgi
      var n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 13));
      for (var i = 0; i <= n; i++) { if (i / n > k) break; T.iz(kr(x0, x1, i / n), kr(y0, y1, i / n), 3.4, 3.4, 0, ALTIN_R[0], ALTIN_R[1], ALTIN_R[2], o); }
    }
    function arabaIzi(f, k, o) {      // arabanın hesaplı hattı: kontur boyunca altın noktalarla çizilir
      var n = 130, top = 0, i, parca = [];
      for (i = 1; i < CEVRE.length; i++) { var l = Math.hypot(CEVRE[i][0] - CEVRE[i - 1][0], CEVRE[i][1] - CEVRE[i - 1][1]); parca.push(l); top += l; }
      for (var j = 0; j < n * k; j++) {
        var s = j / n * top, p = 0; while (p < parca.length - 1 && s > parca[p]) { s -= parca[p]; p++; }
        var q = parca[p] ? s / parca[p] : 0, u = nk(f, [kr(CEVRE[p][0], CEVRE[p + 1][0], q), kr(CEVRE[p][1], CEVRE[p + 1][1], q)]);
        T.iz(u.x, u.y, 3.2, 3.2, 0, ALTIN_R[0], ALTIN_R[1], ALTIN_R[2], o);
      }
    }
    var ETIKET_AKIL, ETIKET_HESAP, ETIKET_PLAN;
    function arabaIncele(t, a) {
      var kA = pencere(t, AN.teker - 0.4, AN.biri - 0.55, 0.9, 0.8);         // "tekerlekler, camlar, vidalar"
      var kB = pencere(t, AN.her + 0.5, AN.plansiz, 1.1, 0.9);                // "akılla, hesapla, planla"
      var k = Math.max(kA, kB);
      if (k <= 0.001) return;
      var f = T.odak('araba', { k: k, x: INC.x, y: INC.y, g: INC.g, kararma: 0.66 });
      var g = Math.min(1, k * 2.4), u = f.g / INC.g, sc = f.g / 1900;   // u: INC.g'de 1; boyutlar o ölçü için yazılmıştır
      var hubO = nk(f, NOK.tekerO), hubA = nk(f, NOK.tekerA), c1 = nk(f, NOK.cam1), c2 = nk(f, NOK.cam2), c0 = nk(f, NOK.cam0), md = nk(f, NOK.madalyon);
      // A: tekerleklerin çevresi, camlara ışık çizgisi, tekerlek göbeğindeki sekiz vida
      var ht = pencere(t, AN.teker - 0.1, AN.cam + 0.4, 0.3, 0.5) * g;
      if (ht > 0) { ringD(hubO.x, hubO.y, 172 * sc, 172 * sc, tw(t, AN.teker - 0.1, 0.9), ht, 40, 4.2); ringD(hubA.x, hubA.y, 172 * sc, 172 * sc, tw(t, AN.teker + 0.1, 0.9), ht, 40, 4.2); }
      var ct = pencere(t, AN.cam - 0.1, AN.vida + 0.3, 0.3, 0.5) * g;
      if (ct > 0) [c1, c2, c0].forEach(function (p, i) {
        var ff = (ic(t, AN.cam + i * 0.15, 0.9) * 2) - 1;
        for (var j = 0; j < 8; j++) T.iz(p.x + ff * 60 * u + (j * 10 - 35) * u, p.y - 32 * u + j * 9 * u, 6 * u, 6 * u, 0, KREM_R[0], KREM_R[1], KREM_R[2], ct * 0.8);
      });
      var vt = pencere(t, AN.vida, AN.biri - 0.45, 0.3, 0.5) * g;
      if (vt > 0) [hubO, hubA].forEach(function (h, m) {
        for (var v = 0; v < 8; v++) {
          var fa = -Math.PI / 2 + v / 8 * Math.PI * 2, pp = 0.5 + 0.5 * Math.sin(a * 7 + v + m);
          var vx = h.x + Math.cos(fa) * 68 * sc, vy = h.y + Math.sin(fa) * 68 * sc;
          T.iz(vx, vy, (11 + pp * 7) * u, (11 + pp * 7) * u, 0, ALTIN_R[0], ALTIN_R[1], ALTIN_R[2], vt * 0.45);        // halka
          T.iz(vx, vy, (4 + pp * 2.5) * u, (4 + pp * 2.5) * u, 0, KREM_R[0], KREM_R[1], KREM_R[2], vt * 0.95);          // parlayan vida
        }
      });
      // B: akıl, hesap, plan: kontur çizilir, üç söz arabanın üç yerine bağlanır
      var iz = pencere(t, AN.akil, AN.plansiz, 0.4, 0.7) * g;
      if (iz > 0) arabaIzi(f, tw(t, AN.akil, AN.plan - AN.akil + 0.8, Y.sin), iz);
      var son = AN.kisi + 0.4, ya = f.y - f.h / 2 - 54, yb = f.y + f.h / 2 + 40;
      var ak = pencere(t, AN.akil - 0.1, son, 0.3, 0.5) * g, he = pencere(t, AN.hesap - 0.1, son, 0.3, 0.5) * g, pl = pencere(t, AN.plan - 0.1, son, 0.3, 0.5) * g;
      var xa = (c1.x + c2.x) / 2;
      ETIKET_AKIL._x = xa; ETIKET_AKIL._y = ya;
      ETIKET_HESAP._x = md.x; ETIKET_HESAP._y = yb;
      ETIKET_PLAN._x = hubA.x; ETIKET_PLAN._y = yb;
      if (ak > 0) {
        var ka = tw(t, AN.akil, 0.8, Y.sin);
        [c1, c2].forEach(function (p) { ringD(p.x, p.y, 190 * sc, 72 * sc, ka, ak, 46, 3.6, -Math.PI / 2); });
        ringD(c0.x, c0.y, 62 * sc, 74 * sc, ka, ak, 24, 3.6, -Math.PI / 2);
        noktaCizgi(xa, ya + 32, xa, c1.y - 72 * sc - 8, ka, ak);
      }
      if (he > 0) {
        var kh = tw(t, AN.hesap, 0.8, Y.sin);
        ringD(md.x, md.y, 108 * sc, 108 * sc, kh, he, 40, 3.6, -Math.PI / 2);
        noktaCizgi(md.x, yb - 32, md.x, md.y + 108 * sc + 8, kh, he);
      }
      if (pl > 0) {
        var kp = tw(t, AN.plan, 0.8, Y.sin);
        ringD(hubO.x, hubO.y, 172 * sc, 172 * sc, kp, pl, 52, 3.8, -Math.PI / 2); ringD(hubA.x, hubA.y, 172 * sc, 172 * sc, kp, pl, 52, 3.8, -Math.PI / 2);
      }
      T.izBitir();
    }

    /* ——— açılış: yol, araba, dalga ——— */
    function acilisKamera(t) {
      var yuru = tw(t, 0, AN.teker, Y.sin), ger = tw(t, AN.biri, 1.5, Y.ikili), dal = pencere(t, AN.dalga - 0.5, AN.yigin + 0.3, 0.9, 0.9);
      // Yürüyüş: yolda arabaya yaklaşılır (en çok 1,26×: plaka 1672 piksel). Ayrıntıya kamerayla değil inceleme görünümüyle bakılır.
      var c = { x: kr(kr(720, 990, yuru), 800, ger), y: kr(kr(500, 560, yuru), 450, ger), z: kr(kr(1.06, 1.26, yuru), 1, ger) };
      c.x = kr(c.x, 800, dal); c.y = kr(c.y, 581, dal); c.z = kr(c.z, 1.3, dal);   // dalgaların çöp yığdığı kıyı
      return c;
    }
    function acilisCiz(t, a) {
      var cop = tw(t, AN.dalga + 0.1, 1.2), kk = Math.max(pencere(t, AN.hangi - 0.1, D.eser + 0.7, 0.6, 0.7), 0);
      var koyu = api.acikDurak() === 'eser' ? 1 : kk, c = kr(1, 0.34, koyu), renk = [c, c * 1.02, kr(1, 0.5, koyu)];
      kiyi(a, { carp: renk, cop: cop > 0 ? 1 : 0, copGecis: { k: cop, yon: 1, yumusak: 0.1, ac: true } });
      // dalgaların sürüklediği kırıntılar
      if (t > AN.dalga - 0.8 && t < AN.ara) for (var i = 0; i < 30; i++) {
        var k = (a * 0.16 + hash(i, 11)) % 1, sx = 470 + hash(i, 12) * 220, sy = 640 + hash(i, 13) * 200;
        izE(kr(sx, COP.x - 110 + hash(i, 14) * 220, k), kr(sy, COP.y - 25, k), 7, 3, [0.62, 0.46, 0.28], Math.sin(k * Math.PI) * pencere(t, AN.dalga - 0.8, AN.ara - 0.3, 0.6, 0.6), PD);
      }
      T.izBitir();
      var s = [AN.s1, AN.s2, AN.s3];
      soru.forEach(function (e, i) { gos(e, pencere(t, s[i] - 0.1, AN.bul + 0.2, 0.25, 0.4), 0, Y.geri(ic(t, s[i] - 0.1, 0.35))); });
      var kt = pencere(t, AN.kitap - 0.1, AN.hangi - 0.1, 0.5, 0.4);
      if (kt > 0) T.ciz('eser-kitap', { x: 800, y: 440, g: 360, d: 0, s: kr(0.7, 1, tw(t, AN.kitap - 0.1, 0.5, Y.geri)), o: kt, parilti: 0.6 });
      arabaIncele(t, a);
    }

    /* ——— torba: çocuk torbayı tutar ve sallar ———
       Durak açıkken motor 'tut' {dx, dy, enerji} gönderir (yalnız bu ekrana, her karede). Torba parmağı yayla izler, ona doğru
       yatar, enerjiye göre titrer ve altın kıvılcım saçar. 'salla' gelince torba ağzı sağa doğru devrilir ve ağzı TORBA noktasına
       iner (motorun taşları belirdiği yer burasıdır, taşlar ağızdan dökülür). 'topla'da taşlar aynı noktaya, yani ağıza geri
       akar; 'hazir' gelince torba doğrulur. Fizik ortam saatiyle (a) yürür, ders saati durakta durur. */
    var tb = { x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0, dx: 0, dy: 0, tut: false, enerji: 0, enerjiS: 0, tip: 0, devrik: false, a0: null, topla: -9, salla: -9 };
    function sinir(v, a, b) { return Math.min(b, Math.max(a, v)); }
    function torbaFizik(a, durakta) {
      var dt = tb.a0 == null ? 0 : sinir(a - tb.a0, 0, 0.05);
      tb.a0 = a;
      if (!durakta) { tb.x = tb.y = tb.vx = tb.vy = tb.r = tb.vr = tb.tip = tb.enerjiS = 0; tb.tut = false; tb.devrik = false; return; }
      var tutuyor = tb.tut && !tb.devrik, tx = tutuyor ? sinir(tb.dx, -130, 130) : 0, ty = tutuyor ? sinir(tb.dy, -100, 100) : 0;
      tb.vx += ((tx - tb.x) * 220 - tb.vx * 16) * dt; tb.x += tb.vx * dt;
      tb.vy += ((ty - tb.y) * 220 - tb.vy * 16) * dt; tb.y += tb.vy * dt;
      var rh = tutuyor ? sinir((tx - tb.x) * 0.22 + tx * 0.06, -34, 34) : 0;      // parmak önde gider, torba geriden gelip yatar
      tb.vr += ((rh - tb.r) * 160 - tb.vr * 12) * dt; tb.r += tb.vr * dt;
      tb.enerjiS += ((tutuyor ? tb.enerji : 0) - tb.enerjiS) * Math.min(1, dt * 12);
      tb.tip += ((tb.devrik ? 1 : 0) - tb.tip) * (1 - Math.exp(-dt * (tb.devrik ? 18 : 7)));
    }
    function tasCiz(i, x, yy, s, o, renk) {
      if (o <= 0.01) { gos(tasNo[i], 0); return; }
      T.iz(x + 3, yy + 40 * s, 44 * s, 12 * s, 0, 0.2, 0.14, 0.1, 0.34 * o);
      T.izBitir();
      T.ciz('tas', { x: x, y: yy, g: 104, s: s, o: o, d: 0 });
      tasNo[i]._x = x; tasNo[i]._y = yy - 2; tasNo[i].style.color = renk;
      gos(tasNo[i], o, 0, s);
    }
    function torbaCiz(t, a) {
      var dus = tw(t, AN.torba - 0.2, 0.7, Y.geri), git = tw(t, AN.yaprak + 0.1, 0.8, Y.gir);
      var acik = api.acikDurak() === 'torba';
      torbaFizik(a, acik);
      var don = pencere(t, AN.salla, AN.bakalim + 0.8, 0.2, 0.3) * Math.sin(a * 22) * 3;   // anlatıcı "salla, dök" derken
      var tip = tb.tip, es = tb.enerjiS, tutuyor = tb.tut && !tb.devrik;
      var rot = tb.r + DEVRIL * tip + don + (tip < 0.5 ? Math.sin(a * 41) * es * 5 : 0);
      var bx = TORBA.x + tb.x - AGIZ * Math.sin(DEVRIL * Math.PI / 180) * tip + (tip < 0.5 ? Math.sin(a * 37) * es * 3 : 0);
      var by0 = kr(-220, TORBA.y, dus), by = by0 + tb.y + AGIZ * Math.cos(DEVRIL * Math.PI / 180) * tip + (tip < 0.5 ? Math.sin(a * 53 + 1) * es * 4 : 0);
      var yut = Math.max(0, 1 - (a - tb.topla) / 1.3) * Math.abs(Math.sin((a - tb.topla) * 17)) * 0.05;   // taşlar girdikçe torba şişip söner
      if (dus > 0 && !(git >= 1)) {
        // zeminde gölge: torba kalkınca gölge yerde kalır, devrilince yana uzar
        T.iz(TORBA.x + 8 + tb.x * 0.5 - 50 * tip, TORBA.y + TORBA_H * 0.47, (100 + 40 * tip) * (1 + yut), 17, 0, 0.2, 0.14, 0.1, 0.3 * (1 - git) * Math.min(1, dus * 2) * (1 - (tutuyor ? 0.25 : 0)));
        T.izBitir();
        T.ciz('torba', { x: bx, y: by, g: TORBA_G * (1 + yut + (tutuyor ? 0.04 : 0)), r: rot, o: 1 - git, d: 0, parilti: 0.2 + 0.6 * es });
        if (es > 0.2) for (var j = 0; j < 7; j++) {      // titreyen torbadan altın kıvılcım
          var kv = (a * 2.6 + hash(j, 5)) % 1, rr = rot * Math.PI / 180;
          T.iz(bx + AGIZ * Math.sin(rr) + (hash(j, 6) - 0.5) * 110 * kv, by - AGIZ * Math.cos(rr) - kv * 80, 3.6, 3.6, 0, ALTIN_R[0], ALTIN_R[1], ALTIN_R[2], es * Math.sin(kv * Math.PI));
        }
        // 'topla': her taş ağıza varınca bir kıvılcım (motor taşları k × 55 ms arayla ve ~0,5 sn'de getirir)
        var ta = a - tb.topla;
        if (ta > 0.45 && ta < 1.7) for (var q = 0; q < 10; q++) {
          var v = ta - (q * 0.055 + 0.5), o = v > 0 && v < 0.3 ? Math.sin(v / 0.3 * Math.PI) * 0.8 : 0;
          if (o > 0) for (var w = 0; w < 4; w++) { var fa = w * 1.57 + q; T.iz(TORBA.x + Math.cos(fa) * v * 90, TORBA.y + Math.sin(fa) * v * 90 - 6, 3, 3, 0, ALTIN_R[0], ALTIN_R[1], ALTIN_R[2], o); }
        }
        T.izBitir();
      }
      var agzi = { x: TORBA.x, y: TORBA.y - AGIZ };          // dururken ağız burada; taşlar çıkarken ve girerken burası
      for (var i = 0; i < 10; i++) {
        if (acik) { gos(tasNo[i], 0); continue; }
        if (t < D.torba) {
          var ck = tw(t, AN.birden + i * 0.17, 0.36, Y.geri), cik = tw(t, AN.birden + i * 0.17, 0.5, Y.cik), gir = tw(t, AN.salla + i * 0.05, 0.5, Y.ikili);
          var x0 = kr(agzi.x, SIRA.x + i * SIRA.dx, cik), y0 = kr(agzi.y, SIRA.y, cik) - Math.sin(Math.PI * cik) * 110;
          var x = kr(x0, agzi.x, gir), yy = kr(y0, agzi.y, gir) - (gir > 0 ? Math.sin(Math.PI * gir) * 120 : 0);
          tasCiz(i, x, yy, ck * (1 - gir * 0.5), Math.min(1, cik * 4) * (1 - Math.pow(gir, 6)), '#17307f');
        } else tasCiz(i, HEDEF.x + i * HEDEF.dx, HEDEF.y, 1, (1 - git) * (1 - tw(t, AN.harf - 0.2, 0.5)), '#d8452b');
      }
      var hk = pencere(t, AN.harf, AN.yaprak + 0.3, 0.3, 0.5);
      HARFLER.forEach(function (e, i) { var b = i * 0.05; gos(e, Math.min(hk, tw(t, AN.harf + b, 0.3)), kr(-40, 0, tw(t, AN.harf + b, 0.4)), 0); });
    }

    /* ——— yaprak: ağacın dev mutfağı ——— */
    var LY = { x: 800, y: 450, g: 640 };
    function yaprakKamera(t) {
      var yak = pencere(t, AN.fabrika + 0.2, AN.ince, 1.6, 1.1);
      return { x: 800, y: kr(450, 455, yak), z: kr(1, 1.34, yak) };
    }
    function yaprakUcus(t, a, sil, nabiz) {
      var ucus = tw(t, AN.yaprak - 0.1, 1.9, Y.ikili), kay = tw(t, AN.kum - 0.2, 1, Y.ikili);
      var lx = kr(kr(1420, LY.x, ucus), 300, kay), ly = kr(kr(210, LY.y, ucus), 500, kay);
      T.ciz('yaprak', { x: lx, y: ly + Math.sin(a * 0.9) * 5, g: kr(kr(60, LY.g, ucus), 340, kay), r: Math.sin(a * 0.7) * 2.4 + kr(kr(-80, 0, ucus), -14, kay), parilti: nabiz, ruzgar: 0.4, d: 1, gecis: sil });
    }
    function yaprakCiz(t, a, sil) {
      var nabiz = 0.4 + 0.5 * pencere(t, AN.isik, AN.ince, 0.6, 0.6);
      plaka('gok', { d: 0.2, parilti: 1, gecis: sil, carp: [0.86, 0.9, 1] });
      yaprakUcus(t, a, sil, nabiz);
      if (sil && sil.k >= 1) return;
      var kal = sil ? 1 - sil.k : 1, ak = 1 - tw(t, AN.ince - 0.1, 0.5);
      if (ak > 0 && t > AN.isik - 0.5) {
        var i, k;
        var o1 = pencere(t, AN.isik - 0.1, AN.ince, 0.5, 0.4) * kal, o2 = pencere(t, AN.hava - 0.1, AN.ince, 0.5, 0.4) * kal;
        var o3 = pencere(t, AN.su - 0.1, AN.ince, 0.5, 0.4) * kal, o4 = pencere(t, AN.besin - 0.1, AN.ince, 0.5, 0.4) * kal;
        for (i = 0; i < 44; i++) { k = (a * 0.34 + hash(i, 21)) % 1; izE(kr(1320 + hash(i, 22) * 240, 660 + hash(i, 23) * 300, k), kr(30 + hash(i, 24) * 120, 300 + hash(i, 25) * 300, k), 5, 5, ALTIN_R, o1 * Math.sin(k * Math.PI)); }
        for (i = 0; i < 26; i++) { k = (a * 0.26 + hash(i, 26)) % 1; var hy = 240 + hash(i, 27) * 400; izE(kr(100, 700, k), hy + Math.sin(k * 8 + i) * 22, 26, 2.2, KREM_R, o2 * 0.7 * Math.sin(k * Math.PI)); }
        for (i = 0; i < 30; i++) { k = (a * 0.3 + hash(i, 28)) % 1; var dal = hash(i, 29) - 0.5; izE(800 + dal * k * 520, kr(820, 240 + Math.abs(dal) * 170, k), 6, 6, SU_R, o3 * Math.sin(k * Math.PI)); }
        for (i = 0; i < 30; i++) { k = (a * 0.3 + hash(i, 30)) % 1; var d2 = hash(i, 31) - 0.5; izE(800 + d2 * (1 - k) * 520, kr(240 + Math.abs(d2) * 170, 860, k), 5, 5, YESIL_R, o4 * Math.sin(k * Math.PI)); }
        T.izBitir();
      }
      var km = pencere(t, AN.ince + 0.1, AN.kum + 0.1, 0.5, 0.5);
      if (km > 0) T.ciz('araba', { x: 1220, y: 640, g: 300, o: km * kal, d: 0 });
      var kum = tw(t, AN.kum - 0.05, 1, Y.geri);
      if (kum > 0) {
        T.ciz('kum-tanesi', { x: 960, y: 480, g: 420, s: kum, r: Math.sin(a * 0.4) * 4, parilti: 1, o: kal, d: 0, gecis: sil });
        for (var q = 0; q < 12; q++) { var f = a * 0.5 + q * 0.52; T.iz(960 + Math.cos(f) * (230 + 26 * Math.sin(a + q)), 480 + Math.sin(f) * (220 + 26 * Math.cos(a + q)), 4, 4, 0, 1, 0.9, 0.5, 0.8 * kal * Math.min(1, kum)); }
        T.izBitir();
      }
    }

    /* ——— zincir: her aday muhtaç çıkar, sahne boşalır ——— */
    var denendi = {}, aSimdi = 0;
    function sil(t, a, d) { var k = ic(t, a, d || 1.4); return k > 0 ? { k: k, yumusak: 0.13, sil: true } : null; }
    function zincirCiz(t, a, ac) {
      var ka = 1 - tw(t, D.arayis + 0.1, 0.6);
      var oge = {
        arabaO: t > AN.yoktu + 1.5 ? 0 : 1, agacO: t > AN.degis + 1.5 ? 0 : 1, gunesO: t > AN.edemez + 1.5 ? 0 : 1,
        arabaGecis: ac || sil(t, AN.yoktu), agacGecis: ac || sil(t, AN.degis), gunesGecis: ac || sil(t, AN.edemez),
        onGecis: ac || sil(t, AN.buyuk), tabanGecis: ac || sil(t, AN.eger + 0.6, 4.6), gokGecis: ac || sil(t, AN.olamaz - 0.3, 1.8), gecis: ac
      };
      plaka('kagit', { d: 0 });
      kiyi(a, oge);
      var yp = pencere(t, AN.y1 - 0.2, AN.ag1 + 0.1, 0.4, 0.5);
      if (yp > 0) T.ciz('yaprak', { x: 1010, y: 212, g: 120, o: yp, r: Math.sin(a) * 4, d: 0 });
      cizgiCiz(bag.yaprak, tw(t, AN.y2 - 0.1, 0.7, Y.sin), yp);
      var ag = pencere(t, AN.ag2 - 0.1, AN.sira, 0.3, 0.4);
      cizgiCiz(bag.toprak, tw(t, kel('toprağa') - 0.1, 0.5, Y.sin), ag);
      cizgiCiz(bag.su, tw(t, kel('suya') - 0.1, 0.5, Y.sin), ag);
      cizgiCiz(bag.gunes, tw(t, kel('güneşe') - 0.1, 0.5, Y.sin), ag);
      var ks = pencere(t, AN.a1 - 0.1, AN.usta + 1.4, 0.3, 0.5);
      if (ks > 0) { halka(TEKER[0].x, TEKER[0].y, 44, 1, ks, PD); halka(TEKER[1].x, TEKER[1].y, 40, 1, ks, PD); T.izBitir(); }
      Object.keys(damgalar).forEach(function (id) {
        var d0 = denendi[id];
        gos(damgalar[id], d0 == null || t >= AN.yoktu ? 0 : Math.min(1, (a - d0) / 0.3) * ka + (t > D.arayis ? 1 - ka : 0), 0, d0 == null ? 0 : kr(1.3, 1, Math.min(1, (a - d0) / 0.25)));
      });
      return ka;
    }

    /* ——— kâğıt: yalnız yazı ——— */
    function kagitCiz(t, a) {
      plaka('kagit', { d: 0 });
      var ok = pencere(t, AN.cunku, AN.sen - 0.2, 0.4, 0.5);
      if (ok > 0) {
        var at = [['araba', 400, 280, kelSonra('araba', AN.cunku)], ['yaprak', 800, 240, kelSonra('yaprak', AN.cunku)], ['gunes', 1200, 220, kelSonra('güneş', AN.cunku)]];
        at.forEach(function (o) {
          var k = tw(t, o[3] - 0.1, 0.45, Y.geri);
          if (k > 0) T.ciz(o[0], { x: o[1], y: 410, g: o[2], s: k, o: ok * Math.min(1, k * 2), d: 0 });
        });
      }
    }

    /* ——— dönüş: boyalar geri gelir ——— */
    function donusCiz(t, a, ac) {
      var ak = tw(t, AN.gelecek, 2.6, Y.sin), c = kr(1, 0.42, ak), renk = [c * kr(1, 1.08, ak), c * kr(1, 0.96, ak), kr(1, 0.66, ak)];
      plaka('kagit', { d: 0 });
      kiyi(a, { gecis: ac, carp: renk, gunesY: kr(GUNES.y, 430, tw(t, AN.gelecek - 0.2, 4.4, Y.sin)), cop: 0 });
      if (ak > 0) { for (var i = 0; i < 46; i++) { var o = (0.25 + 0.6 * (0.5 + 0.5 * Math.sin(a * (0.7 + hash(i, 3)) + i * 2.1))) * ak; T.iz(hash(i, 1) * 1600, hash(i, 2) * 250, 3.2, 3.2, 0, 1, 0.9, 0.62, o); } T.izBitir(); }
      var dus = ic(t, AN.artik + 0.7, 5.2);
      if (dus > 0 && dus < 1) T.ciz('yaprak', { x: 1250 - dus * 420 + Math.sin(dus * 9) * 60, y: 200 + dus * 480, g: 110, r: dus * 220, o: Math.min(1, dus * 6) * (1 - Math.pow(dus, 8)), d: 0 });
    }

    /* ——— kare ——— */
    function ciz(t, a) {
      aSimdi = a;
      var bol;
      if (t < AN.dene + 1.3) bol = 0;
      else if (t < AN.yaprak + 1.5) bol = 1;
      else if (t < AN.varlik + 1.6) bol = 2;
      else if (t < AN.olamaz + 1.7) bol = 3;
      else if (t < AN.artik) bol = 4;
      else bol = 5;

      if (bol === 0) {
        var ka = acilisKamera(t);
        T.bas(a, ka); KZ = ka.z;
        acilisCiz(t, a);
        var kk = tw(t, AN.dene - 0.1, 1.3, Y.sin);
        if (kk > 0) plaka('kum-zemin', { d: 0, gecis: { k: kk, yon: 3, yumusak: 0.14, ac: true } });
      } else if (bol === 1) {
        T.bas(a, { x: 800, y: 450, z: 1 }); KZ = 1;
        plaka('kum-zemin', { d: 0 });
        torbaCiz(t, a);
        var gk = tw(t, AN.yaprak, 1.5, Y.sin);
        if (gk > 0) { plaka('gok', { d: 0.2, parilti: 1, carp: [0.86, 0.9, 1], gecis: { k: gk, yon: 3, yumusak: 0.14, ac: true } }); yaprakUcus(t, a, null, 0.4); }
      } else if (bol === 2) {
        var yk = yaprakKamera(t);
        T.bas(a, yk); KZ = yk.z;
        var kg = tw(t, AN.varlik, 1.6, Y.sin);
        yaprakCiz(t, a, kg > 0 ? { k: kg, yon: 3, yumusak: 0.14, sil: true } : null);
      } else if (bol === 3) {
        T.bas(a, { x: 800, y: 450, z: 1 }); KZ = 1;
        var acKiyi = tw(t, AN.varlik, 1.6, Y.sin);
        zincirCiz(t, a, acKiyi < 1 ? { k: acKiyi, yon: 3, yumusak: 0.14, ac: true } : null);
      } else if (bol === 4) {
        T.bas(a, { x: 800, y: 450, z: 1 }); KZ = 1;
        kagitCiz(t, a);
      } else {
        var yuk = tw(t, AN.yaratan, 4, Y.sin) * (1 - tw(t, AN.gelecek - 1.2, 2, Y.ikili));
        T.bas(a, { x: kr(800, 1120, yuk), y: kr(450, 400, yuk), z: kr(1, 1.16, yuk) }); KZ = 1;
        var don = tw(t, AN.artik, 3, Y.sin);
        donusCiz(t, a, don < 1 ? { k: don, yon: 1, yumusak: 0.2, ac: true } : null);
      }
      if (bol !== 1) { for (var i = 0; i < 10; i++) gos(tasNo[i], 0); HARFLER.forEach(function (e) { gos(e, 0); }); }
      if (bol !== 0) soru.forEach(function (e) { gos(e, 0); });
      if (bol !== 3) {
        Object.keys(bag).forEach(function (k) { bag[k].style.opacity = 0; });
        Object.keys(damgalar).forEach(function (id) { gos(damgalar[id], 0); });
      }
      yazilar(t);
    }

    return {
      hazir: hazir,
      ciz: ciz,
      // Kâğıt bölümünde yazı sahnenin kendisidir, altyazı tekrar etmez
      altyazisiz: function () { return kagitYazisi; },
      durak: function (id, olay, veri) {
        if (id === 'torba') {
          if (olay === 'tut' && veri) { tb.tut = true; tb.dx = veri.dx; tb.dy = veri.dy; tb.enerji = veri.enerji; }
          else if (olay === 'birak') { tb.tut = false; tb.enerji = 0; }
          else if (olay === 'salla') { tb.devrik = true; tb.tut = false; tb.enerji = 0; tb.salla = aSimdi; }
          else if (olay === 'topla') tb.topla = aSimdi;                // taşlar ağıza akar, torba devrik kalır
          else if (olay === 'hazir' || olay === 'dizbasla') { tb.devrik = false; tb.tut = false; }
        }
        if (id === 'arayis' && olay === 'dene') denendi[veri] = aSimdi;
      }
    };
  };
})();
