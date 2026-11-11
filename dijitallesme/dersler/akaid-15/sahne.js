/* Akaid 15 · Dünya ve Âhıret Hayatı — sahne: "Yaşayan Minyatür", Malatya; dedenin kayısı bahçesinde bir yaz.
   Ders tek sahnede dönmez: odada açık yol çantası; baharda bahçede dede yeni fidanı açılmış çukura diker, sır:
   meyvesi yıllar sonra çıkacak fidan neden bugün dikilir; odada çanta sorusu (durak 1), çanta dolar; yaz bahçesinde
   ark akar, olgun kayısı dalından düşer, çocuk suya, gölgeye, kayısıya, fidana dokunur (durak 2); âhıretten ve
   Allahü teâlâdan söz edilen bölümde boya çekilir, kâğıt ve yazı kalır; yaz bahçesinde kayısının yolculuğu sıralanır
   (durak 3), hiç bitmeyecek olan sorulur (durak 4); eski sokakta komşunun sepeti (durak 5); akşam bahçesinde büyük
   soru (durak 6), sırrın çözümü; kâğıtta cevap; ders, dedenin yeni fidana can suyu dökmesiyle biter.
   Her olay anlatıcının kelimesine bağlıdır (t); a ortam saatidir.
   Fizik: fidan çukura dik iner; olgun kayısı daldan yay çizmeden dik düşer, çimende biraz seker; can suyu kovadan
   yay çizerek toprağa akar. Ölüm dili kullanılmaz, vefat anı canlandırılmaz; Cennet ve Cehennem tasvir edilmez.
   İnsan figürü, yüz, el yoktur. Allahü teâlâ için hiçbir şekil, ışık ya da sembol kullanılmaz. */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-15'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['oda-canta', 'bahce-bahar', 'bahce-yaz', 'sokak', 'bahce-aksam', 'kagit', 'fidan', 'kayisi', 'canta'];
    var liste = {};
    GORSELLER.forEach(function (a) { liste[a] = api.yol('gorsel/' + a + '.webp'); });
    var hazir = T.yukle(liste, api.yukleniyor);

    /* ——— zaman ve yumuşatma ——— */
    function ic(t, a, d) { return Math.min(1, Math.max(0, (t - a) / (d || 1))); }
    var Y = {
      cik: function (x) { var u = 1 - x; return 1 - u * u * u; },
      gir: function (x) { return x * x; },
      sin: function (x) { return 0.5 - 0.5 * Math.cos(Math.PI * x); }
    };
    function tw(t, a, d, e) { return (e || Y.cik)(ic(t, a, d)); }
    function kr(a, b, k) { return a + (b - a) * k; }
    function pencere(t, a, b, g, c) { return Math.min(tw(t, a, g || 0.4), 1 - tw(t, b, c || 0.4)); }
    function kameraYolu(t, an) {
      if (t <= an[0][0]) return an[0][1];
      for (var i = 1; i < an.length; i++) {
        if (t < an[i][0]) {
          var k = Y.sin(ic(t, an[i - 1][0], an[i][0] - an[i - 1][0])), p = an[i - 1][1], q = an[i][1];
          return { x: kr(p.x, q.x, k), y: kr(p.y, q.y, k), z: kr(p.z, q.z, k) };
        }
      }
      return an[an.length - 1][1];
    }
    var DUZ = { x: 800, y: 450, z: 1 };   // durak açıkken kamera: sahne noktası ekran noktasıyla çakışır

    /* ——— anlatıcıya bağlı anlar ——— */
    var D = {}; ['canta', 'gecer', 'sira', 'bitmez', 'sepet', 'sir'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {}; for (var n0 = 0; n0 <= 44; n0++) AN[n0] = C(n0);
    var W = { fidan: kel('fidan'), olgun: kel('olgunlaşıyor.'), can: kel('can') };
    var KES = {
      bahar: AN[4] - 0.1, oda2: AN[9] - 0.1, yaz: AN[13] - 0.1, kagit: AN[18] - 0.1, yaz2: AN[22] - 0.1,
      sokak: AN[28] - 0.1, aksam: AN[34] - 0.1, kagit2: AN[40] - 0.2, son: AN[41] - 0.1
    };

    /* ——— yazılar ——— */
    function yazi(metin, sinif, x, y) {
      var e = el('div', { class: 'kd-y ' + (sinif || ''), text: metin });
      e._x = x; e._y = y; e._o = -1; api.yazi.appendChild(e);
      return e;
    }
    function gos(e, o, dy, s) {
      if (o <= 0.003) { if (e._o !== 0) { e.style.opacity = 0; e.style.visibility = 'hidden'; e._o = 0; } return; }
      e._o = o; e.style.visibility = 'visible'; e.style.opacity = o.toFixed(3);
      e.style.transform = 'translate(' + e._x.toFixed(1) + 'px,' + (e._y + (dy || 0)).toFixed(1) + 'px) translate(-50%,-50%)' + (s ? ' scale(' + s.toFixed(3) + ')' : '');
    }
    var PG = 1696, PH = 954, K = PG / 1672;
    function P(px, py) { return [800 + (px - 836) * K, 450 + (py - 470.5) * K]; }   // ham görsel pikseli → sahne noktası
    var AKIS = [
      ['Malatya', 'etiket', 800, 96, AN[2], AN[3] + 0.6],
      ['hazırlık, yola çıkmadan yapılır', 'etiket', 800, 96, AN[12], KES.yaz - 0.2],
      ['dünyada her şey değişir, geçer', 'etiket', 800, 96, AN[15], D.gecer - 0.7],
      ['dünya hayatı kısadır, geçicidir', 'etiket', 800, 96, AN[17], KES.kagit - 0.2],
      ['Dünya hayatından sonra, hiç bitmeyecek bir hayat başlar.', 'kagit', 800, 250, AN[18], KES.yaz2 - 0.4],
      ['Buna âhıret hayatı denir.', 'kagit iri', 800, 410, AN[19], KES.yaz2 - 0.4],
      ['Âhırete inanmak, îmânın şartlarından biridir.', 'kagit', 800, 545, AN[20], KES.yaz2 - 0.4],
      ['Allahü teâlâ, dünyada yapılanların karşılığını âhırette verir.', 'kagit', 800, 675, AN[21], KES.yaz2 - 0.4],
      ['dünya, âhıretin tarlasıdır', 'etiket', 800, 96, AN[24], AN[25] - 0.1],
      ['burada ne ekersek, orada onu biçeriz', 'etiket', 800, 96, AN[25], D.bitmez - 0.7],
      ['âhıret hayatı hiç bitmez', 'etiket', 800, 96, AN[27], KES.sokak - 0.2],
      ['önce yardım, sonra oyun', 'etiket', 800, 96, AN[32], KES.aksam - 0.2],
      ['bugün ekmeyen, yarın biçemez', 'etiket', 800, 96, AN[37], KES.kagit2 - 0.2],
      ['Onların karşılığını Allahü teâlâ âhırette verir.', 'kagit iri', 800, 450, AN[40], KES.son - 0.4],
      ['Gelecek ders: Âhıret hayatının aşamaları', 'etiket', 800, 110, AN[43] + 0.2, AN[44] + 0.9]
    ].map(function (s) { return { e: yazi(s[0], s[1], s[2], s[3]), kagit: /^kagit/.test(s[1]), bas: s[4], son: s[5] }; });

    // Bahar: açılmış çukur; dede fidanı diker (kimse görünmez, fidan çukura iner)
    var CUKUR = P(795, 790), CANTA = P(973, 400);
    var sorFidan = yazi('?', 'sor', CUKUR[0] + 170, CUKUR[1] - 250);
    // Yaz: kayısının yolculuğu yuvaları (durak 3) ve aralarındaki oklar
    var YX = [300, 620, 940, 1260], YY = 520;

    var kagitYazisi = false;
    function bagla(e, x, y) { var p = T.ekran(x, y, 1); e._x = p.x; e._y = p.y; }   // kamera kayınca yazı yerinde kalır
    function yazilar(t) {
      kagitYazisi = false;
      AKIS.forEach(function (s) {
        var o = pencere(t, s.bas, s.son, s.kagit ? 0.8 : 0.3, 0.4);
        gos(s.e, o, s.kagit ? kr(8, 0, tw(t, s.bas, 0.8)) : 0);
        if (s.kagit && o > 0.2) kagitYazisi = true;
      });
      var baharAcik = t >= KES.bahar && t < KES.oda2;
      bagla(sorFidan, CUKUR[0] + 170, CUKUR[1] - 250);
      gos(sorFidan, baharAcik ? pencere(t, AN[6], KES.oda2 - 0.2, 0.3, 0.3) : 0);
    }

    /* ——— SVG ——— */
    function yol(oz) { var p = E2('path', Object.assign({ d: 'M0 0', fill: 'none' }, oz || {}), svg); p.style.opacity = 0; p._o = 0; return p; }
    function gizle(p) { if (p._o !== 0) { p.style.opacity = 0; p._o = 0; } }
    function goster(p, d, o) { if (o <= 0.003) { gizle(p); return; } p.setAttribute('d', d); p.style.opacity = o; p._o = o; }
    function f1(x) { return x.toFixed(1); }
    function daire(cx, cy, r) { return 'M' + f1(cx - r) + ' ' + f1(cy) + ' a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0 a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
    var halkalar = [0, 1].map(function () { return yol({ stroke: '#c8452f', 'stroke-width': 5 }); });
    var oklar = yol({ stroke: '#2f5fb3', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    var su = yol({ stroke: '#9fd3ea', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-dasharray': '14 10' });
    var SVG_HEPSI = [].concat(halkalar, [oklar, su]);
    var kullanildi = [];
    function kullan(p) { kullanildi.push(p); }

    /* ——— ortak yardımcılar ——— */
    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    function ekranR(x, y, r) { var e = T.ekran(x, y, 1), e2 = T.ekran(x + r, y, 1); return { x: e.x, y: e.y, r: e2.x - e.x }; }
    function isima(x, y, r, renk, o) { var s = ekranR(x, y, r); T.iz(s.x, s.y, s.r, s.r, 0, renk[0], renk[1], renk[2], o); T.izBitir(); }
    function dunyaHalka(i, x, y, r, o) { var e = ekranR(x, y, r); goster(halkalar[i], daire(e.x, e.y, e.r), o); kullan(halkalar[i]); }

    /* ——— 0. Oda: açık yol çantası; ikinci gelişte çanta dolar (durak 1) ——— */
    function oda(t, a, ikinci) {
      var acik = api.acikDurak() === 'canta';
      T.bas(a, acik ? DUZ : ikinci ? kameraYolu(t, [[KES.oda2, { x: CANTA[0] - 80, y: CANTA[1] + 20, z: 1.3 }], [AN[10], { x: 800, y: 440, z: 1.1 }], [D.canta - 0.5, DUZ], [D.canta + 1, DUZ],
        [AN[11], { x: CANTA[0], y: CANTA[1] + 10, z: 1.5 }], [KES.yaz, { x: CANTA[0], y: CANTA[1], z: 1.6 }]])
        : kameraYolu(t, [[0, { x: 760, y: 420, z: 1.15 }], [AN[1], { x: 520, y: 330, z: 1.4 }], [AN[3], { x: CANTA[0], y: CANTA[1] + 20, z: 1.55 }], [KES.bahar, { x: CANTA[0], y: CANTA[1], z: 1.6 }]]));
      plaka('oda-canta', { d: 1, parilti: 0.4 });
      var p = P(130, 160); isima(p[0], p[1], 300, [1, 0.94, 0.7], 0.14);   // pencereden sabah ışığı
      // "yolda lazım olacakları alırız": açık çantanın yerine dolu, kapalı çanta
      var dolu = ikinci ? tw(t, AN[11], 0.8) : 0;
      if (dolu > 0.01) T.ciz('canta', { x: CANTA[0] + 4, y: CANTA[1] + 104, h: 300, ax: 0.5, ay: 1, d: 1, o: dolu });   // dolu çanta açık çantanın önünü örter
    }

    /* ——— 1. Bahar bahçesi: fidan çukura dikilir (sır) ——— */
    function bahar(t, a) {
      T.bas(a, kameraYolu(t, [[KES.bahar, { x: 800, y: 420, z: 1.15 }], [W.fidan, { x: CUKUR[0], y: CUKUR[1] - 180, z: 1.5 }], [AN[6], { x: CUKUR[0] + 60, y: CUKUR[1] - 200, z: 1.55 }], [KES.oda2, { x: CUKUR[0], y: CUKUR[1] - 200, z: 1.6 }]]));
      plaka('bahce-bahar', { d: 1, parilti: 0.35, ruzgar: 0.08 });
      var g = P(200, 120); isima(g[0], g[1], 360, [1, 0.94, 0.72], 0.12);
      // fidan dik iner, kök topu çukura oturur
      var k = tw(t, W.fidan - 0.2, 1.2, Y.cik);
      if (k > 0.01) T.ciz('fidan', { x: CUKUR[0], y: CUKUR[1] + 18 - 140 * (1 - k), h: 330, ax: 0.5, ay: 1, d: 1, r: 1.5 * Math.sin(a * 1.4), o: Math.min(1, k * 2) });
      var ho = pencere(t, AN[6], KES.oda2 - 0.1, 0.4, 0.3);
      if (ho > 0.01) dunyaHalka(0, CUKUR[0], CUKUR[1] - 150, 150 + 3 * Math.sin(a * 3), ho);
    }

    /* ——— 2. Yaz bahçesi: ark akar, olgun kayısı düşer (durak 2); kayısının yolculuğu (durak 3), hiç bitmeyecek (durak 4) ——— */
    var DAL = P(470, 230), CIMEN_Y = P(0, 610)[1];
    function yaz(t, a, ikinci) {
      var acik = api.acikDurak() === 'gecer' || api.acikDurak() === 'sira' || api.acikDurak() === 'bitmez';
      T.bas(a, acik ? DUZ : ikinci ? kameraYolu(t, [[KES.yaz2, { x: 800, y: 440, z: 1.12 }], [D.sira - 0.5, DUZ], [D.sira + 1, DUZ], [AN[24], { x: 820, y: 430, z: 1.1 }], [D.bitmez - 0.5, DUZ], [D.bitmez + 1, DUZ], [KES.sokak, { x: 800, y: 430, z: 1.12 }]])
        : kameraYolu(t, [[KES.yaz, { x: 760, y: 420, z: 1.2 }], [kel('Ark'), { x: 760, y: 640, z: 1.35 }], [kel('gölgeler'), { x: 860, y: 520, z: 1.3 }], [W.olgun, { x: DAL[0] + 60, y: DAL[1] + 120, z: 1.4 }],
          [AN[15], { x: 800, y: 440, z: 1.08 }], [D.gecer - 0.5, DUZ], [D.gecer + 1, DUZ], [KES.kagit, { x: 800, y: 440, z: 1.1 }]]));
      plaka('bahce-yaz', { d: 1, parilti: 0.4, su: 0.9, ruzgar: 0.1 });
      var g = P(1500, 120); isima(g[0], g[1], 380, [1, 0.94, 0.7], 0.12);
      // olgun kayısı dalından dik düşer, çimende küçük bir sekme
      if (!ikinci) {
        var u = ic(t, W.olgun + 0.1, 0.7), y;
        if (u < 1) y = kr(DAL[1], CIMEN_Y, Y.gir(u));
        else { var b = ic(t, W.olgun + 0.8, 0.35); y = CIMEN_Y - 26 * Math.sin(Math.PI * b); }
        if (t > W.olgun) T.ciz('kayisi', { x: DAL[0] + 8 * Math.min(1, u * 2), y: y, h: 46, ax: 0.5, ay: 1, d: 1, r: 160 * u });
      } else {
        T.ciz('kayisi', { x: DAL[0] + 8, y: CIMEN_Y, h: 46, ax: 0.5, ay: 1, d: 1, r: 160 });
      }
      // kayısının yolculuğu: yuvalar arası oklar soldan sağa
      var oo = ikinci ? pencere(t, AN[22], AN[26] - 0.3, 0.4, 0.4) : 0;
      if (oo > 0.01) {
        var d = '';
        for (var i = 0; i < 3; i++) {
          var p = T.ekran(YX[i] + 105, YY, 1), q = T.ekran(YX[i + 1] - 105, YY, 1);
          d += 'M' + f1(p.x) + ' ' + f1(p.y) + 'L' + f1(q.x) + ' ' + f1(q.y) + 'M' + f1(q.x - 14) + ' ' + f1(q.y - 12) + 'L' + f1(q.x) + ' ' + f1(q.y) + 'L' + f1(q.x - 14) + ' ' + f1(q.y + 12);
        }
        goster(oklar, d, oo); kullan(oklar);
      }
    }

    /* ——— 3. Eski sokak: komşunun ağır sepeti (durak 5) ——— */
    var SEPET = P(773, 790);
    function sokak(t, a) {
      var acik = api.acikDurak() === 'sepet';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.sokak, { x: 800, y: 430, z: 1.2 }], [AN[30], { x: SEPET[0], y: SEPET[1] - 120, z: 1.45 }], [D.sepet - 0.5, DUZ], [D.sepet + 1, DUZ], [KES.aksam, { x: 800, y: 440, z: 1.15 }]]));
      plaka('sokak', { d: 1, parilti: 0.4 });
      var ho = pencere(t, AN[30], D.sepet - 0.3, 0.4, 0.3);
      if (ho > 0.01 && !acik) dunyaHalka(0, SEPET[0], SEPET[1] - 60, 120 + 3 * Math.sin(a * 3), ho);
    }

    /* ——— 4. Akşam bahçesi: büyük soru (durak 6), sırrın çözümü; can suyu ——— */
    var YENI_FIDAN = P(835, 720), KOVA = P(1080, 690);   // fidanın dibi ve kovanın gövdesi; su ağızdan akar
    function aksam(t, a, son) {
      var acik = api.acikDurak() === 'sir';
      T.bas(a, acik ? DUZ : son ? (function () { var k = tw(t, KES.son, 6, Y.sin); return { x: kr(YENI_FIDAN[0] + 60, 800, k), y: kr(YENI_FIDAN[1] - 160, 450, k), z: kr(1.6, 1.02, k) }; })()
        : kameraYolu(t, [[KES.aksam, { x: 780, y: 430, z: 1.15 }], [D.sir - 0.5, DUZ], [D.sir + 1, DUZ], [AN[38], { x: YENI_FIDAN[0], y: YENI_FIDAN[1] - 170, z: 1.5 }], [KES.kagit2, { x: YENI_FIDAN[0], y: YENI_FIDAN[1] - 170, z: 1.55 }]]));
      plaka('bahce-aksam', { d: 1, parilti: 0.5, ruzgar: 0.08 });
      var g = P(1550, 260); isima(g[0], g[1], 400, [1, 0.72, 0.42], 0.14);
      var ho = son ? 0 : pencere(t, AN[38], KES.kagit2 - 0.1, 0.4, 0.2);
      if (ho > 0.01) dunyaHalka(0, YENI_FIDAN[0], YENI_FIDAN[1] - 120, 140 + 3 * Math.sin(a * 3), ho);
      // can suyu: kovadan fidanın dibine yay çizerek akar
      if (son) {
        var so = pencere(t, W.can - 0.3, W.can + 2.6, 0.3, 0.6);
        if (so > 0.01) {
          var p = T.ekran(KOVA[0] - 60, KOVA[1] - 70, 1), q = T.ekran(YENI_FIDAN[0] + 30, YENI_FIDAN[1] - 6, 1);
          var c = { x: (p.x + q.x) / 2, y: Math.min(p.y, q.y) - 40 };
          su.setAttribute('stroke-dashoffset', f1(-a * 60));
          goster(su, 'M' + f1(p.x) + ' ' + f1(p.y) + ' Q' + f1(c.x) + ' ' + f1(c.y) + ' ' + f1(q.x) + ' ' + f1(q.y), 0.9 * so); kullan(su);
          isima(YENI_FIDAN[0], YENI_FIDAN[1], 70, [0.4, 0.3, 0.2], 0.2 * so);   // ıslanan toprak koyulaşır
        }
      }
    }

    /* ——— 5. Kâğıt: âhıretten ve Allahü teâlâdan söz edilen bölüm ——— */
    function kagit(t, a) { T.bas(a, DUZ); plaka('kagit', { d: 0 }); }

    /* ——— perde: kesmelerde kısa bir an lacivert (kâğıt bölümünde krem) karartma ——— */
    var LACI = [0.07, 0.11, 0.3], KREM = [1, 1, 1];
    var PERDE = [[KES.bahar], [KES.oda2], [KES.yaz], [KES.kagit, KREM], [KES.yaz2, KREM], [KES.sokak], [KES.aksam], [KES.kagit2, KREM], [KES.son, KREM]];
    var perdeSon = -1;
    function perde(t) {
      var k = 0, renk = LACI;
      PERDE.forEach(function (p) { var u = 1 - Math.abs(t - p[0]) / 0.3; if (u > k) { k = u; renk = p[1] || LACI; } });
      k = k > 0 ? Y.sin(k) : 0;
      if (k > 0.002) T.ciz('kagit', { x: 800, y: 450, g: 1800, h: 1012, d: 0, carp: renk, o: k * 0.94 });
      var o = Math.round((1 - k) * 100) / 100;
      if (o !== perdeSon) { svg.style.opacity = o; perdeSon = o; }
    }

    /* ——— kare ——— */
    var BOLUM = [
      [KES.bahar, function (t, a) { oda(t, a, false); }], [KES.oda2, bahar], [KES.yaz, function (t, a) { oda(t, a, true); }],
      [KES.kagit, function (t, a) { yaz(t, a, false); }], [KES.yaz2, kagit], [KES.sokak, function (t, a) { yaz(t, a, true); }],
      [KES.aksam, sokak], [KES.kagit2, function (t, a) { aksam(t, a, false); }], [KES.son, kagit], [Infinity, function (t, a) { aksam(t, a, true); }]
    ];
    function ciz(t, a) {
      kullanildi = [];
      for (var i = 0; i < BOLUM.length; i++) { if (t < BOLUM[i][0]) { BOLUM[i][1](t, a); break; } }
      SVG_HEPSI.forEach(function (p) { if (kullanildi.indexOf(p) < 0) gizle(p); });
      perde(t);
      yazilar(t);
    }

    return {
      hazir: hazir,
      ciz: ciz,
      // âhıretten ve Allahü teâlâdan söz edilen kâğıt bölümlerinde yazı sahnenin kendisidir; altyazı ve dokunma oyunu yoktur
      altyazisiz: function (t) { return kagitYazisi || (t >= KES.kagit && t < KES.yaz2) || (t >= KES.kagit2 && t < KES.son); },
      dokun: function () { return false; }
    };
  };
})();
