/* Akaid 17 · Âhıret İnancı ve Davranışlarımız — sahne: "Yaşayan Minyatür", İznik; bir gün sabahtan akşama.
   Ders tek sahnede dönmez: sabah İznik gölü ve surlar; çini atölyesinde ustanın yarım panosuna bugünün çinisi eklenir,
   sır: pano bitince ne görülecek; panonun güzelliği neye bağlı (durak 1); panodaki çinilere dokunulur, her biri bir güzel
   davranıştır (durak 2); âhıretten ve Allahü teâlâdan söz edilen bölümde boya çekilir, kâğıt ve yazı kalır, cezasız
   kalan haksızlık sorulur (durak 3); avluda kırık kalem (durak 4) ve kırıcı söz (durak 5); kâğıtta merhamet ve ümit;
   akşam gölünde büyük soru (durak 6); atölyede bugünün çinisi eklenir, boş kareler birer birer dolar, bitmiş pano
   görünür; kâğıtta cevap; ders akşam gölünde biter. Her olay anlatıcının kelimesine bağlıdır (t); a ortam saatidir.
   Fizik: çini yerine hafifçe oturur, ızgaranın karesine tam denk gelir. Çocuğun davranışı üzerinden imanı ölçülmez.
   İnsan figürü, yüz, el yoktur. Allahü teâlâ için hiçbir şekil, ışık ya da sembol kullanılmaz. */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-17'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['gol-sabah', 'atolye', 'avlu', 'gol-aksam', 'kagit', 'pano-cini', 'kalem'];
    var liste = {};
    GORSELLER.forEach(function (a) { liste[a] = api.yol('gorsel/' + a + '.webp'); });
    var hazir = T.yukle(liste, api.yukleniyor);

    /* ——— zaman ve yumuşatma ——— */
    function ic(t, a, d) { return Math.min(1, Math.max(0, (t - a) / (d || 1))); }
    var Y = {
      cik: function (x) { var u = 1 - x; return 1 - u * u * u; },
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
    var D = {}; ['pano', 'cini', 'adalet', 'kalem', 'pisman', 'sir'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {}; for (var n0 = 0; n0 <= 41; n0++) AN[n0] = C(n0);
    var KES = {
      atolye: AN[3] - 0.1, kagit: AN[14] - 0.1, avlu: AN[21] - 0.1, kagit2: AN[31] - 0.1, aksam: AN[33] - 0.1,
      atolye2: AN[36] - 0.1, kagit3: AN[38] - 0.1, son: AN[40] - 0.1
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
      ['İznik', 'etiket', 800, 96, AN[1], AN[3] - 0.1],
      ['her güzel davranış, bir çini gibi yerini alır', 'etiket', 800, 96, AN[12], D.cini - 0.7],
      ['Âhırette, dünyada yaptıklarımızın hesabını vereceğimize inanırız.', 'kagit iri', 800, 270, AN[14], AN[17] - 0.4],
      ['Bu inanç bize sorumluluk verir. Allahü teâlânın emirlerini yapmaya, yasaklarından sakınmaya çalışırız.', 'kagit', 800, 610, AN[15], AN[17] - 0.4],
      ['Dünyada bazı haksızlıklar cezasız kalır. Âhırette ise hak yerini bulur.', 'kagit', 800, 300, AN[17], D.adalet - 0.6],
      ['Allahü teâlâ, kimseye haksızlık etmez.', 'kagit iri', 800, 540, AN[19], D.adalet - 0.6],
      ['hatamızı söyler, özür dileriz', 'etiket', 800, 96, AN[25], AN[27] - 0.1],
      ['Allahü teâlâ merhametlidir; pişman olup tövbe edeni bağışlar.', 'kagit iri', 800, 330, AN[31], KES.aksam - 0.4],
      ['Âhırete inanmak bize ümit de verir; sevdiklerimizle orada buluşmayı umarız.', 'kagit', 800, 560, AN[32], KES.aksam - 0.4],
      ['bugün bir çini daha', 'etiket', 800, 96, AN[36], AN[37] - 0.1],
      ['hepsi birlikte görünecek', 'etiket', 800, 96, AN[37], KES.kagit3 - 0.2],
      ['Âhırette de, dünyada yaptıklarımızın hepsi karşımıza çıkar.', 'kagit', 800, 320, AN[38], KES.son - 0.4],
      ['Allahü teâlâ, her iyiliğin karşılığını verir.', 'kagit iri', 800, 560, AN[39], KES.son - 0.4],
      ['Gelecek ders: Kader', 'etiket', 800, 110, AN[40] + 0.2, AN[41] + 0.9]
    ].map(function (s) { return { e: yazi(s[0], s[1], s[2], s[3]), kagit: /^kagit/.test(s[1]), bas: s[4], son: s[5] }; });

    // Pano: sağdaki boş kareler (3 sütun × 4 satır, ham görselde ölçüldü); bugünün çinisi ilk boş kareye oturur.
    // Konan çini panonun kendi karosundan kesilmiştir; kareye tam denk gelir, desen soldaki çinilerle sürer.
    var BOS = [];
    [236, 363, 489, 610.5].forEach(function (y) { [1020, 1149.5, 1282].forEach(function (x) { BOS.push(P(x, y)); }); });
    var CINI_G = 128 * K, CINI_H = 124 * K;
    var PANO = { x0: P(418, 175), x1: P(1348, 668) };   // panonun iç kenarı
    var sorPano = yazi('?', 'sor', P(1149.5, 489)[0], P(1149.5, 489)[1]);

    var kagitYazisi = false;
    function bagla(e, x, y) { var p = T.ekran(x, y, 1); e._x = p.x; e._y = p.y; }   // kamera kayınca yazı yerinde kalır
    function yazilar(t) {
      kagitYazisi = false;
      AKIS.forEach(function (s) {
        var o = pencere(t, s.bas, s.son, s.kagit ? 0.8 : 0.3, 0.4);
        gos(s.e, o, s.kagit ? kr(8, 0, tw(t, s.bas, 0.8)) : 0);
        if (s.kagit && o > 0.2) kagitYazisi = true;
      });
      var atolyeAcik = t >= KES.atolye && t < KES.kagit;
      var q = P(1149.5, 489); bagla(sorPano, q[0], q[1]);
      gos(sorPano, atolyeAcik && !api.acikDurak() ? pencere(t, AN[5], D.pano - 0.7, 0.3, 0.3) : 0);
    }

    /* ——— SVG ——— */
    function yol(oz) { var p = E2('path', Object.assign({ d: 'M0 0', fill: 'none' }, oz || {}), svg); p.style.opacity = 0; p._o = 0; return p; }
    function gizle(p) { if (p._o !== 0) { p.style.opacity = 0; p._o = 0; } }
    function goster(p, d, o) { if (o <= 0.003) { gizle(p); return; } p.setAttribute('d', d); p.style.opacity = o; p._o = o; }
    function f1(x) { return x.toFixed(1); }
    function daire(cx, cy, r) { return 'M' + f1(cx - r) + ' ' + f1(cy) + ' a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0 a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
    var halka = yol({ stroke: '#c8452f', 'stroke-width': 5 });
    var SVG_HEPSI = [halka];
    var kullanildi = [];
    function kullan(p) { kullanildi.push(p); }

    /* ——— ortak yardımcılar ——— */
    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    function ekranR(x, y, r) { var e = T.ekran(x, y, 1), e2 = T.ekran(x + r, y, 1); return { x: e.x, y: e.y, r: e2.x - e.x }; }
    function isima(x, y, r, renk, o) { var s = ekranR(x, y, r); T.iz(s.x, s.y, s.r, s.r, 0, renk[0], renk[1], renk[2], o); T.izBitir(); }
    // çini biraz büyük ve yukarıdan gelir, kareye hafifçe oturur
    function cini(t, i, bas) {
      var k = tw(t, bas, 0.55);
      if (k <= 0.01) return;
      var s = kr(1.14, 1, k);
      T.ciz('pano-cini', { x: BOS[i][0], y: BOS[i][1] - 22 * (1 - k), g: CINI_G * s, h: CINI_H * s, d: 1, o: Math.min(1, k * 1.7) });
    }

    /* ——— 0. Sabah gölü ——— */
    function golSabah(t, a) {
      T.bas(a, kameraYolu(t, [[0, { x: 800, y: 420, z: 1.12 }], [AN[1], { x: 600, y: 400, z: 1.25 }], [KES.atolye, { x: 520, y: 380, z: 1.4 }]]));
      plaka('gol-sabah', { d: 1, parilti: 0.4, su: 1, ruzgar: 0.05 });
      var g = P(150, 140); isima(g[0], g[1], 380, [1, 0.93, 0.7], 0.13);
    }

    /* ——— 1. Atölye: bugünün çinisi (sır), durak 1-2; akşam: pano tamamlanır ——— */
    function atolye(t, a, ikinci) {
      var acik = api.acikDurak() === 'pano' || api.acikDurak() === 'cini';
      T.bas(a, acik ? DUZ : ikinci ? kameraYolu(t, [[KES.atolye2, { x: 1000, y: 420, z: 1.35 }], [AN[37], { x: 880, y: 400, z: 1.2 }], [KES.kagit3, { x: 820, y: 400, z: 1.15 }]])
        : kameraYolu(t, [[KES.atolye, { x: 760, y: 420, z: 1.2 }], [AN[4], { x: BOS[0][0], y: BOS[0][1] + 60, z: 1.6 }], [AN[6], { x: 1000, y: 400, z: 1.4 }], [AN[9], { x: 800, y: 430, z: 1.08 }],
          [D.pano - 0.5, DUZ], [D.cini + 1, DUZ], [KES.kagit, { x: 800, y: 420, z: 1.15 }]]));
      plaka('atolye', { d: 1, parilti: 0.45, carp: ikinci ? [0.92, 0.84, 0.78] : null });
      var p = P(140, 220); isima(p[0], p[1], 300, [1, 0.92, 0.66], ikinci ? 0.08 : 0.14);
      // sabah: bugünün çinisi ilk boş kareye oturur ("her gün bir çini ekler").
      // akşam: aynı çini halkayla gösterilir ("bugün bir çini daha büyüdü"); sonra pano bitince nasıl görüneceği: kalan kareler birer birer dolar
      cini(t, 0, ikinci ? -1 : AN[4] + 0.6);
      if (ikinci) {
        var hk = pencere(t, AN[36] + 1.4, AN[37] + 0.2, 0.4, 0.3);
        if (hk > 0.01) { var e = ekranR(BOS[0][0], BOS[0][1], 92); goster(halka, daire(e.x, e.y, e.r), hk * 0.9); kullan(halka); }
        for (var i = 1; i < BOS.length; i++) cini(t, i, AN[37] + 0.4 + (i - 1) * 0.15);
        // bitmiş pano: üstünden yumuşak bir ışık geçer
        var co = pencere(t, AN[37] + 2.0, KES.kagit3 - 0.05, 0.4, 0.2);
        if (co > 0.01) {
          var gx = kr(PANO.x0[0], PANO.x1[0], tw(t, AN[37] + 2.0, 1.4, Y.sin)), gy = (PANO.x0[1] + PANO.x1[1]) / 2;
          isima(gx, gy, 300, [1, 0.94, 0.72], co * 0.22);
        }
      }
    }

    /* ——— 2. Avlu: kırık kalem (durak 4), kırıcı söz (durak 5) ——— */
    var BANK = P(1040, 628);   // avludaki bankın oturağı
    function avlu(t, a) {
      var acik = api.acikDurak() === 'kalem' || api.acikDurak() === 'pisman';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.avlu, { x: 760, y: 420, z: 1.2 }], [AN[22], { x: BANK[0], y: BANK[1] - 120, z: 1.5 }], [D.kalem - 0.5, DUZ], [D.pisman + 1, DUZ], [KES.kagit2, { x: 800, y: 430, z: 1.12 }]]));
      plaka('avlu', { d: 1, parilti: 0.4, ruzgar: 0.08 });
      var g = P(300, 120); isima(g[0], g[1], 360, [1, 0.93, 0.7], 0.12);
      var ko = pencere(t, AN[22] - 0.2, AN[27], 0.4, 0.5);
      if (ko > 0.01) T.ciz('kalem', { x: BANK[0], y: BANK[1], h: 70, ax: 0.5, ay: 1, d: 1, o: ko });
    }

    /* ——— 3. Akşam gölü: büyük soru (durak 6), kapanış ——— */
    function golAksam(t, a, son) {
      var acik = api.acikDurak() === 'sir';
      T.bas(a, acik ? DUZ : son ? (function () { var k = tw(t, KES.son, 6, Y.sin); return { x: kr(560, 800, k), y: kr(400, 450, k), z: kr(1.45, 1.02, k) }; })()
        : kameraYolu(t, [[KES.aksam, { x: 760, y: 430, z: 1.12 }], [D.sir - 0.5, DUZ], [D.sir + 1, DUZ], [KES.atolye2, { x: 800, y: 440, z: 1.1 }]]));
      plaka('gol-aksam', { d: 1, parilti: 0.5, su: 1, ruzgar: 0.05 });
      var g = P(991, 327); isima(g[0], g[1], 300, [1, 0.72, 0.42], 0.16);
    }

    /* ——— 4. Kâğıt ——— */
    function kagit(t, a) { T.bas(a, DUZ); plaka('kagit', { d: 0 }); }

    /* ——— perde: kesmelerde kısa bir an lacivert (kâğıt bölümünde krem) karartma ——— */
    var LACI = [0.07, 0.11, 0.3], KREM = [1, 1, 1];
    var PERDE = [[KES.atolye], [KES.kagit, KREM], [KES.avlu, KREM], [KES.kagit2, KREM], [KES.aksam, KREM], [KES.atolye2], [KES.kagit3, KREM], [KES.son, KREM]];
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
      [KES.atolye, golSabah], [KES.kagit, function (t, a) { atolye(t, a, false); }], [KES.avlu, kagit], [KES.kagit2, avlu], [KES.aksam, kagit],
      [KES.atolye2, function (t, a) { golAksam(t, a, false); }], [KES.kagit3, function (t, a) { atolye(t, a, true); }], [KES.son, kagit],
      [Infinity, function (t, a) { golAksam(t, a, true); }]
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
      altyazisiz: function (t) { return kagitYazisi || (t >= KES.kagit && t < D.adalet - 0.3) || (t >= KES.kagit2 && t < KES.aksam) || (t >= KES.kagit3 && t < KES.son); },
      dokun: function () { return false; }
    };
  };
})();
