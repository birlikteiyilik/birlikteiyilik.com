/* Akaid 2 · Allahü Teâlânın Varlığı ve Birliği — sahne: "Yaşayan Minyatür", Ege kıyısı.
   Ders bir arayıştır: kendini kendi var eden bir şey aranır. Aday olan her şey muhtaç çıkar ve sahneden
   çekilir; sonunda boş kâğıt kalır. Kanıt sahnenin kendisidir, Allahü teâlâ için hiçbir şekil çizilmez.
   Boyalı katmanlar kd-tuval ile canlanır, her görsel olay anlatıcının kelimesine bağlıdır (t).
   a ortam saatidir: durakta t durur, dalga ve rüzgâr sürer. İnsan figürü yoktur. */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-02'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['gok', 'kiyi-taban', 'kiyi-on', 'kum-zemin', 'kagit', 'gunes', 'agac', 'araba', 'cop-yigini', 'torba', 'tas', 'yaprak', 'kum-tanesi', 'eser-kitap'];
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
      ['akıl', 'etiket', 500, 150, AN.akil, AN.kisi + 0.4],
      ['hesap', 'etiket', 800, 96, AN.hesap, AN.kisi + 0.4],
      ['plan', 'etiket', 1100, 150, AN.plan, AN.kisi + 0.4],
      ['Hesap yok, plan yok: olur mu?', 'etiket', 800, 96, AN.plansiz + 0.5, AN.dene + 0.2],
      ['Sen sallayınca: sıraya girmediler.', 'etiket', 800, 96, AN.sallayinca, AN.dizince - 0.1],
      ['Sen düşünüp dizince: hepsi yerini buldu.', 'etiket', 800, 96, AN.dizince, AN.ontas - 0.1],
      ['On taş bile kendiliğinden sıraya girmiyor.', 'etiket', 800, 96, AN.ontas, AN.harf - 0.1],
      ['Rastgele harflerden cümle çıkmaz.', 'etiket', 800, 96, AN.harf + 1, AN.yaprak],
      ['ağacın dev mutfağı', 'etiket', 800, 92, kel('dev') - 0.2, AN.isik - 0.15],
      ['ışık', 'etiket', 1280, 180, AN.isik, AN.ince - 0.2],
      ['hava', 'etiket', 300, 300, AN.hava, AN.ince - 0.2],
      ['su', 'etiket', 620, 740, AN.su, AN.ince - 0.2],
      ['ağaca besin', 'etiket', 1020, 740, AN.besin - 0.4, AN.ince - 0.2],
      ['Arabadan çok daha ince bir iş', 'etiket', 800, 92, AN.ince, AN.kum - 0.15],
      ['Bir kum tanesinde bile ince bir sanat', 'etiket', 800, 92, AN.kum + 0.3, AN.varlik - 0.1],
      ['Her varlık bir sanat eseri', 'etiket', 800, 92, AN.varlik + 0.8, AN.donelim - 0.3],
      [ARAYIS, 'etiket', 800, 96, AN.donelim, AN.hic - 0.2],
      ['ustaya muhtaç', 'damga', 1130, 700, AN.usta, AN.y1 + 0.2],
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
    var soru = [yazi('?', 'sor', 1130, 330), yazi('?', 'sor', 1440, 150), yazi('?', 'sor', 360, 230)];
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
      gunes: yazi('kendini var edemez', 'damga', 360, 40), deniz: yazi('kendini var edemez', 'damga', 330, 330), dag: yazi('kendini var edemez', 'damga', 1180, 150)
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
    var ARABA = { x: 1130, y: 664, g: 430 }, AGAC = { x: 1440, y: 552, g: 470 }, COP = { x: 852, y: 806, g: 340 }, GUNES = { x: 360, y: 150, g: 230 };
    var TORBA = { x: 170, y: 470 }, SIRA = { x: 330, dx: 118, y: 560 }, HEDEF = { x: 330, dx: 118, y: 380 };
    // Arabanın çizim ölçüsüne göre parçaları (görsel merkezi 0,0; yükseklik sprite alt kenarından)
    var ORAN = ARABA.g / 1592, ARABA_H = 690 * ORAN;
    function arabaNokta(px, py) { return { x: ARABA.x + (px - 836) * ORAN, y: ARABA.y - ARABA_H + (py - 130) * ORAN }; }
    var CEVRE = [[46, 640], [66, 480], [130, 415], [500, 335], [650, 185], [760, 140], [1000, 135], [1180, 180], [1350, 345], [1530, 450], [1590, 625], [1630, 650], [1540, 690], [1200, 705], [470, 705], [190, 690], [46, 640]];

    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    function hepsi(o, ek) { return Object.assign({}, o || {}, ek); }

    /* ——— kamerayla birlikte parçacık ——— */
    var KZ = 1;
    function izE(x, y, rx, ry, renk, o) { var e = T.ekran(x, y, 1); T.iz(e.x, e.y, rx * KZ, ry * KZ, 0, renk[0], renk[1], renk[2], o); }
    var ALTIN_R = [1, 0.86, 0.42], KREM_R = [1, 0.97, 0.88], SU_R = [0.5, 0.86, 1], YESIL_R = [0.78, 0.95, 0.48];

    /* ——— kıyı: gök, Güneş, kıyı, nesneler, ön plan ——— */
    function kiyi(a, sec) {
      sec = sec || {};
      var ort = { carp: sec.carp, gecis: sec.gecis, doy: sec.doy };
      plaka('gok', hepsi(ort, { d: 0.25, parilti: 1, gecis: sec.gokGecis || sec.gecis, x: 800 + Math.sin(a * 0.05) * 8 }));
      var gy = sec.gunesY == null ? GUNES.y : sec.gunesY;
      if (sec.gunesO !== 0) T.ciz('gunes', hepsi(ort, { x: GUNES.x, y: gy, g: GUNES.g, r: a * 1.6, parilti: 1, d: 0.4, gecis: sec.gunesGecis || sec.gecis }));
      plaka('kiyi-taban', hepsi(ort, { d: 0.85, su: 1, parilti: 0.4, gecis: sec.tabanGecis || sec.gecis }));
      if (sec.agacO !== 0) T.ciz('agac', hepsi(ort, { x: AGAC.x, y: AGAC.y, g: AGAC.g, ax: 0.5, ay: 1, d: 0.9, ruzgar: 0.8, buk: Math.sin(a * 0.6) * 3, gecis: sec.agacGecis || sec.gecis }));
      if (sec.arabaO !== 0) T.ciz('araba', hepsi(ort, { x: ARABA.x, y: ARABA.y, g: ARABA.g, ax: 0.5, ay: 1, parilti: 0.5, gecis: sec.arabaGecis || sec.gecis }));
      if (sec.cop) T.ciz('cop-yigini', hepsi(ort, { x: COP.x, y: COP.y, g: COP.g, ax: 0.5, ay: 1, gecis: sec.copGecis || sec.gecis, o: sec.cop }));
      plaka('kiyi-on', hepsi(ort, { d: 1.12, ruzgar: 1, gecis: sec.onGecis || sec.gecis, x: 800, y: 456 }));
    }
    function halka(x, y, r, k, o) {   // tekerleğin çevresinde dönen altın noktalar
      for (var i = 0; i < 26; i++) {
        if (i / 26 > k) break;
        var f = i / 26 * Math.PI * 2 - 1.2;
        izE(x + Math.cos(f) * r, y + Math.sin(f) * r, 4, 4, ALTIN_R, o);
      }
    }
    function arabaIzi(k, o) {         // arabanın hesaplı hattı: altın noktalarla çizilir
      var n = 110, top = 0, i, parca = [];
      for (i = 1; i < CEVRE.length; i++) { var l = Math.hypot(CEVRE[i][0] - CEVRE[i - 1][0], CEVRE[i][1] - CEVRE[i - 1][1]); parca.push(l); top += l; }
      for (var j = 0; j < n * k; j++) {
        var s = j / n * top, p = 0; while (p < parca.length - 1 && s > parca[p]) { s -= parca[p]; p++; }
        var q = s / parca[p], u = arabaNokta(kr(CEVRE[p][0], CEVRE[p + 1][0], q), kr(CEVRE[p][1], CEVRE[p + 1][1], q));
        izE(u.x, u.y, 3.4, 3.4, ALTIN_R, o);
      }
    }

    /* ——— açılış: yol, araba, dalga ——— */
    function acilisKamera(t) {
      var yuru = tw(t, 0, AN.teker, Y.sin), ger = tw(t, AN.biri, 1.5, Y.ikili), dal = pencere(t, AN.dalga - 0.5, AN.yigin + 0.3, 0.9, 0.9);
      var c = { x: kr(kr(470, 1130, yuru), 800, ger), y: kr(kr(560, 560, yuru), 450, ger), z: kr(kr(1.5, 1.7, yuru), 1, ger) };
      c.x = kr(c.x, 880, dal); c.y = kr(c.y, 700, dal); c.z = kr(c.z, 1.45, dal);
      var yak = pencere(t, AN.her + 0.6, AN.plansiz, 1.1, 1);   // "hesapla, planla": arabaya yaklaşılır
      c.x = kr(c.x, 1130, yak); c.y = kr(c.y, 500, yak); c.z = kr(c.z, 1.5, yak);
      return c;
    }
    function acilisCiz(t, a) {
      var cop = tw(t, AN.dalga + 0.1, 1.2), kk = Math.max(pencere(t, AN.hangi - 0.1, D.eser + 0.7, 0.6, 0.7), 0);
      var koyu = api.acikDurak() === 'eser' ? 1 : kk, c = kr(1, 0.34, koyu), renk = [c, c * 1.02, kr(1, 0.5, koyu)];
      kiyi(a, { carp: renk, cop: cop > 0 ? 1 : 0, copGecis: { k: cop, yon: 1, yumusak: 0.1, ac: true } });
      // dalgaların sürüklediği kırıntılar
      if (t > AN.dalga - 0.8 && t < AN.ara) for (var i = 0; i < 30; i++) {
        var k = (a * 0.16 + hash(i, 11)) % 1, sx = 460 + hash(i, 12) * 240, sy = 560 + hash(i, 13) * 280;
        izE(kr(sx, COP.x - 120 + hash(i, 14) * 240, k), kr(sy, COP.y - 30, k), 7, 3, [0.62, 0.46, 0.28], Math.sin(k * Math.PI) * pencere(t, AN.dalga - 0.8, AN.ara - 0.3, 0.6, 0.6));
      }
      T.izBitir();
      var w1 = arabaNokta(345, 680), w2 = arabaNokta(1325, 680), c1 = arabaNokta(800, 285), c2 = arabaNokta(1085, 285), ro = 150 * ORAN;
      var ht = pencere(t, AN.teker - 0.1, AN.cam + 0.4, 0.3, 0.5);
      if (ht > 0) { halka(w1.x, w1.y, ro, tw(t, AN.teker - 0.1, 0.9), ht); halka(w2.x, w2.y, ro, tw(t, AN.teker + 0.1, 0.9), ht); }
      var ct = pencere(t, AN.cam - 0.1, AN.vida + 0.3, 0.3, 0.5);
      if (ct > 0) [c1, c2].forEach(function (p, i) {
        var f = (ic(t, AN.cam + i * 0.15, 0.9) * 2) - 1;
        for (var j = 0; j < 7; j++) izE(p.x + f * 40 + j * 5 - 15, p.y - 26 + j * 9, 5, 5, KREM_R, ct * 0.75);
      });
      var vt = pencere(t, AN.vida, AN.biri + 0.5, 0.3, 0.6);
      if (vt > 0) for (var v = 0; v < 8; v++) [w1, w2].forEach(function (w, m) {
        var f = v / 8 * Math.PI * 2, p = 0.5 + 0.5 * Math.sin(a * 7 + v + m);
        izE(w.x + Math.cos(f) * 52 * ORAN, w.y + Math.sin(f) * 52 * ORAN, 3 + p * 3.4, 3 + p * 3.4, ALTIN_R, vt);
      });
      var iz = pencere(t, AN.akil, AN.plansiz, 0.4, 0.7);
      if (iz > 0) arabaIzi(tw(t, AN.akil, AN.plan - AN.akil + 0.8, Y.sin), iz);
      T.izBitir();
      var s = [AN.s1, AN.s2, AN.s3];
      soru.forEach(function (e, i) { gos(e, pencere(t, s[i] - 0.1, AN.bul + 0.2, 0.25, 0.4), 0, Y.geri(ic(t, s[i] - 0.1, 0.35))); });
      var kt = pencere(t, AN.kitap - 0.1, AN.hangi - 0.1, 0.5, 0.4);
      if (kt > 0) T.ciz('eser-kitap', { x: 800, y: 440, g: 360, d: 0, s: kr(0.7, 1, tw(t, AN.kitap - 0.1, 0.5, Y.geri)), o: kt, parilti: 0.6 });
    }

    /* ——— torba: kum üstünde deneme ——— */
    var sallaA = -9;
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
      var sars = Math.exp(-(a - sallaA) * 3.2) * Math.sin((a - sallaA) * 34) * 11;
      var don = pencere(t, AN.salla, AN.bakalim + 0.8, 0.2, 0.3) * Math.sin(a * 22) * 3;
      if (dus > 0) T.ciz('torba', { x: TORBA.x, y: kr(-220, TORBA.y, dus), g: 190, r: sars + don, o: 1 - git, d: 0 });
      var acik = api.acikDurak() === 'torba';
      for (var i = 0; i < 10; i++) {
        if (acik) { gos(tasNo[i], 0); continue; }
        if (t < D.torba) {
          var ck = tw(t, AN.birden + i * 0.17, 0.36, Y.geri), gir = tw(t, AN.salla + i * 0.05, 0.5, Y.ikili);
          var x = kr(SIRA.x + i * SIRA.dx, TORBA.x, gir), yy = kr(SIRA.y, TORBA.y - 40, gir) - Math.sin(Math.PI * gir) * 120;
          tasCiz(i, x, yy, ck * (1 - gir * 0.5), Math.min(1, ck * 2) * (1 - Math.pow(gir, 6)), '#17307f');
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
      if (ks > 0) { var w1 = arabaNokta(345, 680), w2 = arabaNokta(1325, 680); halka(w1.x, w1.y, 150 * ORAN, 1, ks); halka(w2.x, w2.y, 150 * ORAN, 1, ks); T.izBitir(); }
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
        if (id === 'torba' && olay === 'salla') sallaA = aSimdi;
        if (id === 'arayis' && olay === 'dene') denendi[veri] = aSimdi;
      }
    };
  };
})();
