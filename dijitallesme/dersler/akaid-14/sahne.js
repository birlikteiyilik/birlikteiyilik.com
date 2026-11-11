/* Akaid 14 · Melekler — sahne: "Yaşayan Minyatür", Harran ovası; bir gün sabahtan geceye.
   Ders tek sahnede dönmez: sabah ovasında kubbe evler ve kuyu; akşam kuyu başında dedenin sorusu, sır: kimse görmeden
   yapılan iyilik kaybolur mu; ovada hangisi hiç yorulmaz (durak 1); meleklerden söz edilen bölümde boya çekilir, kâğıt
   ve yazı kalır, özellik sorusu da kâğıtta (durak 2); tezhipli levhada dört büyük meleğin adı yazılı, görevleri altına
   yerleşir (durak 3); yağmurlu ovada buluta, ağaca, başaklara, taşlara dokunulur (durak 4); Kirâmen kâtibîn kâğıtta;
   kubbe evin içinde odanı topla (durak 5); akşam kuyu başında büyük soru (durak 6), sırrın çözümü; kâğıtta cevap;
   ders yıldızlı gecede biter. Her olay anlatıcının kelimesine bağlıdır (t); a ortam saatidir.
   Hiçbir melek görseli yoktur: kanat, ışık, insan şekli, yazı kalemi ya da defter çizilmez; meleklerin her yerdeki
   görevi ovanın kendisiyle (yağmur, yaprak, başak, taş) anlatılır. Yağmur yukarıdan aşağı, rüzgârla biraz eğik yağar.
   İnsan figürü, yüz, el yoktur. Allahü teâlâ için hiçbir şekil, ışık ya da sembol kullanılmaz. Meleklerin adları
   anılırken dokunma oyunu yoktur. */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-14'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['ova-sabah', 'ova-yagmur', 'kuyu-aksam', 'ev-ic', 'ova-gece', 'levha', 'kagit', 'fener'];
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
    function hash(i, s) { var x = Math.sin(i * 127.1 + (s || 0) * 311.7) * 43758.5453; return x - Math.floor(x); }
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
    var D = {}; ['yorulmaz', 'ozellik', 'gorev', 'heryer', 'oda', 'sir'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {}; for (var n0 = 0; n0 <= 46; n0++) AN[n0] = C(n0);
    var KES = {
      kuyu: AN[3] - 0.1, ova2: AN[7] - 0.1, kagit: AN[11] - 0.1, levha: AN[19] - 0.1, yagmur: AN[25] - 0.1,
      katibin: AN[29] - 0.1, ev: AN[32] - 0.1, kuyu2: AN[37] - 0.1, kagit2: AN[43] - 0.1, son: AN[44] - 0.1
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
      ['Harran ovası', 'etiket', 800, 96, AN[1], KES.kuyu - 0.1],
      ['insan yorulur · hayvan uyur · pil biter', 'etiket', 800, 96, AN[9], AN[10] - 0.1],
      ['melekler hiç yorulmaz', 'etiket', 800, 96, AN[10], KES.kagit - 0.2],
      // kâğıt üç sayfa: kimdir, ne yapar, nasıldır; yazılar üst üste binmez
      ['Melekler, Allahü teâlânın kullarıdır.', 'kagit iri', 800, 330, AN[11], AN[13] - 0.4],
      ['Nurdan yaratılmışlardır; onları göremeyiz.', 'kagit', 800, 560, AN[12], AN[13] - 0.4],
      ['Allahü teâlânın emirlerini yaparlar.', 'kagit iri', 800, 330, AN[13], AN[15] - 0.4],
      ['Hiç günah işlemezler, emre karşı gelmezler.', 'kagit', 800, 560, AN[14], AN[15] - 0.4],
      ['Yorulmazlar, uyumazlar, yiyip içmezler.', 'kagit', 800, 270, AN[15], D.ozellik - 0.6],
      ['Erkek ya da kız değildirler.', 'kagit', 800, 450, AN[16], D.ozellik - 0.6],
      ['Sayılarını, Allahü teâlâdan başka kimse bilmez.', 'kagit', 800, 630, AN[17], D.ozellik - 0.6],
      ['meleklerin en büyükleri dörttür', 'etiket', 800, 96, AN[19], AN[20] - 0.1],
      ['her yerde görevleri vardır', 'etiket', 800, 96, AN[26] + 0.4, D.heryer - 0.7],
      ['İnsanın iyi ve kötü işlerini yazan melekler de vardır.', 'kagit', 800, 270, AN[29], KES.ev - 0.4],
      ['Kirâmen kâtibîn', 'kagit iri', 800, 470, AN[30], KES.ev - 0.4],
      ['Sağdaki melek, iyilikleri yazar.', 'kagit', 800, 640, AN[31], KES.ev - 0.4],
      ['kimse görmese de doğru olanı yaparız', 'etiket', 800, 96, AN[36], KES.kuyu2 - 0.2],
      ['iyilik kaybolmaz', 'etiket', 800, 96, AN[41], KES.kagit2 - 0.2],
      ['Allahü teâlâ da her şeyi görür, her şeyi bilir.', 'kagit iri', 800, 450, AN[43], KES.son - 0.4],
      ['Gelecek ders: Dünya ve âhıret hayatı', 'etiket', 800, 110, AN[45] + 0.2, AN[46] + 0.9]
    ].map(function (s) { return { e: yazi(s[0], s[1], s[2], s[3]), kagit: /^kagit/.test(s[1]), bas: s[4], son: s[5] }; });

    // Kuyu başı: dedenin bankı (kimse görünmez) ve fener
    var KUYU = P(826, 600), FENER = P(933, 424), BANK = P(1213, 659);
    var sorKuyu = yazi('?', 'sor', BANK[0] + 40, BANK[1] - 160);

    // Levha: dört büyük meleğin adları üst çerçevelerde yazılıdır; görevleri alttaki çerçevelere yerleşir
    var LX = [277, 628, 977, 1325], AD_Y = 281, GOREV_Y = 600;   // levhanın üst ve alt çerçevelerinin ortaları
    var ADLAR = [['Cebrâîl', 'aleyhisselâm'], ['Mikâîl', 'aleyhisselâm'], ['İsrâfîl', 'aleyhisselâm'], ['Azrâîl', 'aleyhisselâm']];
    var GOREV = ['Vahiy getirir', 'Bolluk ve kıtlık işlerine bakar', 'Sûr\'a üfleyecek', 'Vakti gelince ruhu alır'];
    var LEVHA = ADLAR.map(function (a, i) {
      return { ad: yazi(a[0], 'etiket', LX[i], AD_Y - 22), hurmet: yazi(a[1], 'damga', LX[i], AD_Y + 22), gorev: yazi(GOREV[i], 'damga', LX[i], GOREV_Y), bas: AN[20 + i] };
    });

    var kagitYazisi = false;
    function bagla(e, x, y) { var p = T.ekran(x, y, 1); e._x = p.x; e._y = p.y; }   // kamera kayınca yazı yerinde kalır
    function yazilar(t) {
      kagitYazisi = false;
      AKIS.forEach(function (s) {
        var o = pencere(t, s.bas, s.son, s.kagit ? 0.8 : 0.3, 0.4);
        gos(s.e, o, s.kagit ? kr(8, 0, tw(t, s.bas, 0.8)) : 0);
        if (s.kagit && o > 0.2) kagitYazisi = true;
      });
      var acik = api.acikDurak();
      var kuyuAcik = t >= KES.kuyu && t < KES.ova2;
      bagla(sorKuyu, BANK[0] + 40, BANK[1] - 160);
      gos(sorKuyu, kuyuAcik ? pencere(t, AN[4], KES.ova2 - 0.2, 0.3, 0.3) : 0);
      var levhaAcik = t >= KES.levha && t < KES.yagmur;
      LEVHA.forEach(function (l, i) {
        var o = levhaAcik ? pencere(t, AN[19] + 0.3 + i * 0.25, KES.yagmur - 0.2, 0.5, 0.3) : 0;
        bagla(l.ad, LX[i], AD_Y - 22); bagla(l.hurmet, LX[i], AD_Y + 22); bagla(l.gorev, LX[i], GOREV_Y);
        gos(l.ad, o, 0, 1 + 0.08 * pencere(t, l.bas - 0.1, l.bas + 2, 0.3, 0.5)); gos(l.hurmet, o);
        // görev anlatılırken alttaki çerçevede belirir; durak açılınca yerini motorun yuvaları alır, bitince geri gelir
        var og = !levhaAcik || acik === 'gorev' ? 0 : t < D.gorev ? pencere(t, l.bas + 0.4, AN[24] - 0.2, 0.4, 0.4) : pencere(t, D.gorev, KES.yagmur - 0.2, 0.4, 0.3);
        gos(l.gorev, og);
      });
    }

    /* ——— SVG ——— */
    function yol(oz) { var p = E2('path', Object.assign({ d: 'M0 0', fill: 'none' }, oz || {}), svg); p.style.opacity = 0; p._o = 0; return p; }
    function gizle(p) { if (p._o !== 0) { p.style.opacity = 0; p._o = 0; } }
    function goster(p, d, o) { if (o <= 0.003) { gizle(p); return; } p.setAttribute('d', d); p.style.opacity = o; p._o = o; }
    function f1(x) { return x.toFixed(1); }
    function daire(cx, cy, r) { return 'M' + f1(cx - r) + ' ' + f1(cy) + ' a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0 a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
    var halkalar = [0, 1].map(function () { return yol({ stroke: '#c8452f', 'stroke-width': 5 }); });
    var yagmur = yol({ stroke: '#dfe9f2', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
    var SVG_HEPSI = [].concat(halkalar, [yagmur]);
    var kullanildi = [];
    function kullan(p) { kullanildi.push(p); }

    /* ——— ortak yardımcılar ——— */
    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    function ekranR(x, y, r) { var e = T.ekran(x, y, 1), e2 = T.ekran(x + r, y, 1); return { x: e.x, y: e.y, r: e2.x - e.x }; }
    function isima(x, y, r, renk, o) { var s = ekranR(x, y, r); T.iz(s.x, s.y, s.r, s.r, 0, renk[0], renk[1], renk[2], o); T.izBitir(); }
    function dunyaHalka(i, x, y, r, o) { var e = ekranR(x, y, r); goster(halkalar[i], daire(e.x, e.y, e.r), o); kullan(halkalar[i]); }

    /* ——— 0. Kanca ve ova: sabah (durak 1) ——— */
    var EVLER = P(760, 470);
    function ova(t, a, ikinci) {
      var acik = api.acikDurak() === 'yorulmaz';
      T.bas(a, acik ? DUZ : ikinci ? kameraYolu(t, [[KES.ova2, { x: 760, y: 440, z: 1.2 }], [AN[8], { x: 800, y: 450, z: 1.08 }], [D.yorulmaz - 0.5, DUZ], [D.yorulmaz + 1, DUZ], [KES.kagit, { x: EVLER[0], y: EVLER[1], z: 1.3 }]])
        : kameraYolu(t, [[0, { x: 700, y: 400, z: 1.2 }], [AN[1], { x: 760, y: 430, z: 1.15 }], [AN[2], { x: EVLER[0], y: EVLER[1], z: 1.4 }], [KES.kuyu, { x: 1200, y: 560, z: 1.5 }]]));
      plaka('ova-sabah', { d: 1, parilti: 0.35, ruzgar: 0.1 });
      var g = P(150, 180); isima(g[0], g[1], 380, [1, 0.9, 0.6], 0.16);   // doğan güneş
    }

    /* ——— 1. Kuyu başı: akşam; fener yanar, dedenin bankı boş (sır, durak 6, çözüm) ——— */
    function kuyu(t, a, ikinci) {
      var acik = api.acikDurak() === 'sir';
      T.bas(a, acik ? DUZ : ikinci ? kameraYolu(t, [[KES.kuyu2, { x: 860, y: 480, z: 1.25 }], [AN[38], { x: 820, y: 470, z: 1.12 }], [D.sir - 0.5, DUZ], [D.sir + 1, DUZ],
        [AN[40], { x: FENER[0], y: FENER[1] + 80, z: 1.5 }], [AN[42], { x: BANK[0] - 60, y: BANK[1] - 60, z: 1.4 }], [KES.kagit2, { x: 820, y: 470, z: 1.2 }]])
        : kameraYolu(t, [[KES.kuyu, { x: 760, y: 500, z: 1.35 }], [AN[3] + 2, { x: KUYU[0], y: KUYU[1] - 60, z: 1.5 }], [AN[4], { x: BANK[0] - 80, y: BANK[1] - 60, z: 1.55 }], [KES.ova2, { x: 900, y: 480, z: 1.3 }]]));
      plaka('kuyu-aksam', { d: 1, parilti: 0.45 });
      // fenerin alevi titrer; sır çözülürken biraz daha parlar
      var parla = ikinci ? 0.1 * pencere(t, AN[41], KES.kagit2, 0.8, 0.3) : 0;
      isima(FENER[0], FENER[1] + 10, 120 + 6 * Math.sin(a * 6), [1, 0.78, 0.4], 0.26 + parla + 0.04 * Math.sin(a * 4.7));
      isima(FENER[0], FENER[1] + 160, 420, [1, 0.72, 0.4], 0.08);
      var ho = ikinci ? pencere(t, AN[41], KES.kagit2 - 0.2, 0.4, 0.3) : pencere(t, AN[4], KES.ova2 - 0.2, 0.4, 0.3);
      if (ho > 0.01 && !acik) dunyaHalka(0, BANK[0], BANK[1] - 30, 120 + 3 * Math.sin(a * 3), ho);
    }

    /* ——— 2. Kâğıt: meleklerden ve Allahü teâlâdan söz edilen bölüm (durak 2 de burada) ——— */
    function kagit(t, a) { T.bas(a, DUZ); plaka('kagit', { d: 0 }); }

    /* ——— 3. Levha: dört büyük melek; adlar yazılı, görevler alttaki çerçevelere (durak 3) ——— */
    function levha(t, a) {
      var acik = api.acikDurak() === 'gorev';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.levha, { x: 800, y: 420, z: 1.12 }], [AN[20], { x: LX[0] + 120, y: 420, z: 1.25 }], [AN[21], { x: LX[1], y: 420, z: 1.25 }],
        [AN[22], { x: LX[2], y: 420, z: 1.25 }], [AN[23], { x: LX[3] - 120, y: 420, z: 1.25 }], [AN[24], { x: 800, y: 450, z: 1.04 }], [D.gorev - 0.5, DUZ]]));
      plaka('levha', { d: 1, parilti: 0.4 });
    }

    /* ——— 4. Yağmurlu ova: bulut, yaprak, başak, taş (durak 4) ——— */
    var BULUT = P(450, 160), AGAC = P(330, 330), BASAK = P(700, 520), TAS = P(1420, 540);
    function yagmurluOva(t, a) {
      var acik = api.acikDurak() === 'heryer';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.yagmur, { x: 700, y: 400, z: 1.2 }], [kel('yağmur'), { x: BULUT[0] + 100, y: BULUT[1] + 120, z: 1.35 }], [kel('ağaç'), { x: AGAC[0] + 140, y: AGAC[1], z: 1.35 }],
        [kel('otlarda,'), { x: BASAK[0], y: BASAK[1], z: 1.35 }], [kel('taşlarda;'), { x: TAS[0] - 120, y: TAS[1] - 40, z: 1.35 }], [AN[27], { x: 800, y: 450, z: 1.04 }], [D.heryer - 0.5, DUZ], [D.heryer + 1, DUZ],
        [KES.katibin, { x: 800, y: 430, z: 1.1 }]]));
      plaka('ova-yagmur', { d: 1, parilti: 0.4, ruzgar: 0.14 });
      // yağmur: buluttan ovaya ince çizgiler; rüzgârla biraz eğik, aşağı doğru akar
      var d = '';
      for (var i = 0; i < 70; i++) {
        var x0 = kr(40, 900, hash(i, 1)), hiz = 0.9 + 0.4 * hash(i, 2), u = (a * hiz + hash(i, 3)) % 1;
        var y0 = kr(150, 620, u), uz = 26 + 14 * hash(i, 4);
        var p = T.ekran(x0 + u * 60, y0, 1), q = T.ekran(x0 + u * 60 + 6, y0 + uz, 1);
        d += 'M' + f1(p.x) + ' ' + f1(p.y) + 'L' + f1(q.x) + ' ' + f1(q.y);
      }
      goster(yagmur, d, 0.55); kullan(yagmur);
    }

    /* ——— 5. Kubbe evin içi: odanı topla (durak 5) ——— */
    var OYUNCAK = P(860, 820);
    function ev(t, a) {
      var acik = api.acikDurak() === 'oda';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.ev, { x: 800, y: 380, z: 1.2 }], [AN[33], { x: OYUNCAK[0], y: OYUNCAK[1] - 160, z: 1.35 }], [D.oda - 0.5, DUZ], [D.oda + 1, DUZ], [KES.kuyu2, { x: 800, y: 400, z: 1.15 }]]));
      plaka('ev-ic', { d: 1, parilti: 0.45 });
      var tepe = P(836, 40); isima(tepe[0], tepe[1] + 120, 260, [1, 0.94, 0.72], 0.14);   // kubbedeki delikten giren ışık
    }

    /* ——— 6. Yıldızlı gece: kapanış ——— */
    function kapanis(t, a) {
      var k = tw(t, KES.son, 6, Y.sin);
      T.bas(a, { x: kr(800, 800, k), y: kr(330, 450, k), z: kr(1.4, 1.02, k) });
      plaka('ova-gece', { d: 1, parilti: 0.55 });
      for (var i = 0; i < 18; i++) {
        var p = P(80 + 1500 * hash(i, 7), 40 + 300 * hash(i, 8));
        isima(p[0], p[1], 8 + 6 * hash(i, 9), [1, 1, 0.9], 0.18 * (0.5 + 0.5 * Math.sin(a * (1 + hash(i, 5)) + i)));
      }
    }

    /* ——— perde: kesmelerde kısa bir an lacivert (kâğıt bölümünde krem) karartma ——— */
    var LACI = [0.07, 0.11, 0.3], KREM = [1, 1, 1];
    var PERDE = [[KES.kuyu], [KES.ova2], [KES.kagit, KREM], [KES.levha, KREM], [KES.yagmur], [KES.katibin, KREM], [KES.ev, KREM], [KES.kuyu2], [KES.kagit2, KREM], [KES.son, KREM]];
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
      [KES.kuyu, function (t, a) { ova(t, a, false); }], [KES.ova2, function (t, a) { kuyu(t, a, false); }], [KES.kagit, function (t, a) { ova(t, a, true); }],
      [KES.levha, kagit], [KES.yagmur, levha], [KES.katibin, yagmurluOva], [KES.ev, kagit], [KES.kuyu2, ev],
      [KES.kagit2, function (t, a) { kuyu(t, a, true); }], [KES.son, kagit], [Infinity, kapanis]
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
      // meleklerden ve Allahü teâlâdan söz edilen kâğıt bölümlerinde yazı sahnenin kendisidir; altyazı ve dokunma oyunu yoktur
      altyazisiz: function (t) { return kagitYazisi || (t >= KES.kagit && t < D.ozellik - 0.3) || (t >= KES.kagit2 && t < KES.son); },
      // büyük meleklerin adları anılırken oyun yoktur
      dokun: function () {
        var t = api.t();
        if (t >= AN[19] - 0.2 && t < AN[24]) return true;
        return false;
      }
    };
  };
})();
