/* Akaid 10 · İnsanlara Rehber Peygamberler — sahne: "Yaşayan Minyatür", Safranbolu; bir sonbahar günü.
   Ders tek sahnede dönmez: sabah vadisinden dedenin konağına girilir, pencere kenarında kafesteki kanarya (durak 1);
   arasta çarşısında bakkal tezgâhındaki pirinç terazide cevizler paylaştırılır, kol ağır tarafa yatar (durak 2);
   akşam vadisinde sır; Allahü teâlâdan söz edilen bölümde boya çekilir, kâğıt ve yazı kalır; yedi kemerli han avlusunda
   yedi sıfat sırayla belirir, çocuk anlamları kemerlere yerleştirir (durak 3); akşam konakta okul çantası (durak 4);
   çarşıda fazla verilen para üstü (durak 5), sonra bakkala geri gider; akşam vadisinde büyük soru (durak 6), cevap kâğıtta;
   ders akşam vadisinde, kamera uzaklaşırken biter. Her olay anlatıcının kelimesine bağlıdır (t); a ortam saatidir.
   Yön: sabah ışığı sağdan, akşam ışığı soldan. Fizik: terazinin kolu ağır tarafa yatar, kefeler zincirden hep dik asılı kalır;
   kafes kancadan sarkar, hafifçe salınır. İnsan figürü, yüz, el yoktur; hiçbir peygamber tasvir edilmez.
   Allahü teâlâ için hiçbir şekil, ışık ya da sembol kullanılmaz. Peygamberlerin adları anılırken dokunma oyunu yoktur. */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-10'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['safranbolu-sabah', 'safranbolu-aksam', 'konak-oda', 'arasta', 'han-avlu', 'kagit',
      'kanarya', 'terazi-govde', 'terazi-kol', 'kefe', 'ceviz', 'kese', 'canta', 'para', 'sandik', 'terazi-tam'];
    var liste = {};
    GORSELLER.forEach(function (a) { liste[a] = api.yol('gorsel/' + a + '.webp'); });
    var hazir = T.yukle(liste, api.yukleniyor);

    /* ——— zaman ve yumuşatma ——— */
    function ic(t, a, d) { return Math.min(1, Math.max(0, (t - a) / (d || 1))); }
    var Y = {
      cik: function (x) { var u = 1 - x; return 1 - u * u * u; },
      ikili: function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
      sin: function (x) { return 0.5 - 0.5 * Math.cos(Math.PI * x); }
    };
    function tw(t, a, d, e) { return (e || Y.cik)(ic(t, a, d)); }
    function kr(a, b, k) { return a + (b - a) * k; }
    function pencere(t, a, b, g, c) { return Math.min(tw(t, a, g || 0.4), 1 - tw(t, b, c || 0.4)); }
    function hash(i, s) { var x = Math.sin(i * 127.1 + (s || 0) * 311.7) * 43758.5453; return x - Math.floor(x); }
    function sinirla(x, a, b) { return Math.min(b, Math.max(a, x)); }
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
    var D = {}; ['guven', 'terazi', 'kemer', 'haber', 'ornek', 'sir'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {}; for (var n0 = 0; n0 <= 55; n0++) AN[n0] = C(n0);
    var W = { ceviz: kel('ceviz'), fazla: kel('fazla') };
    var KES = {
      oda: AN[3] - 0.1, carsi: AN[9] - 0.1, sir: AN[17] - 0.1, kagit: AN[20] - 0.05, han: AN[22] - 0.2,
      oda2: AN[37] - 0.1, carsi2: AN[41] - 0.1, sirCoz: AN[44] - 0.1, kagit2: AN[47] - 0.3, son: AN[51] - 0.1
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
      ['Safranbolu', 'etiket', 800, 96, AN[1], AN[3] - 0.1],
      ['sözünü tutan, doğru söyleyen', 'etiket', 800, 96, AN[7], AN[9] - 0.2],
      ['ikinize eşit: terazi dengede', 'etiket', 800, 96, AN[13], AN[15] - 0.1],
      ['doğruluk · emanet · adalet · akıl', 'etiket', 800, 96, AN[15], KES.sir - 0.2],
      ['?', 'sor', 800, 380, AN[18], KES.kagit - 0.3],
      ['Allahü teâlâ, peygamberleri insanlara rehber olarak gönderdi.', 'kagit', 800, 330, AN[20], KES.han - 0.4],
      ['Peygamberlerin hepsinde yedi güzel sıfat vardır.', 'kagit', 800, 560, AN[21], KES.han - 0.4],
      ['haber eksiksiz iletilir', 'etiket', 800, 96, AN[40], KES.carsi2 - 0.2],
      ['?', 'sor', 800, 380, AN[45], KES.kagit2 - 0.3],
      ['Peygamberler hiç yalan söylemezdi; insanlar bunu bilirdi.', 'kagit', 800, 290, AN[47], AN[49] - 0.4],
      ['Allahü teâlâ da, onların doğru söylediğini göstermek için, onları mucizelerle destekledi.', 'kagit', 800, 520, AN[48], AN[49] - 0.4],
      ['Mucize, kimsenin benzerini yapamadığı olağanüstü bir iştir.', 'kagit', 800, 330, AN[49], KES.son - 0.4],
      ['Hiç kimse mucizelere karşı gelemedi.', 'kagit', 800, 560, AN[50], KES.son - 0.4],
      ['doğru söz · emanet · adalet', 'etiket', 800, 96, AN[53], AN[54] - 0.1],
      ['Gelecek ders: Peygamberlere gelen haber, vahiy', 'etiket', 800, 110, AN[54] + 0.2, AN[55] + 0.9]
    ].map(function (s) { return { e: yazi(s[0], s[1], s[2], s[3]), kagit: /^kagit/.test(s[1]), bas: s[4], son: s[5] }; });
    // Yedi kemer: adlar kemerlerin üstünde, anlamlar kemerin içinde; dünya noktasına bağlıdır, kamera kayınca birlikte kayar
    var SIFAT = ['Emânet', 'Sıdk', 'Teblîğ', 'Adâlet', 'İsmet', 'Fetânet', 'Emnül-azl'];
    var ANLAM = ['Güvenilir', 'Doğru sözlü', 'Eksiksiz iletir', 'Haksızlık etmez', 'Günah işlemez', 'Çok akıllı', 'Görevi alınmaz'];
    var KEMER_X = [318, 494, 664, 838, 1010, 1184, 1360].map(function (x) { return P(x, 0)[0]; });
    var KEMER = SIFAT.map(function (s, i) {
      var ust = i % 2 === 0 ? 445 : 505, alt = i % 2 === 0 ? 597 : 671;
      return { x: KEMER_X[i], ad: yazi(s, 'etiket', KEMER_X[i], ust), adY: ust, anlam: yazi(ANLAM[i], 'damga', KEMER_X[i], alt), anlamY: alt, bas: AN[22 + 2 * i], anlamBas: AN[23 + 2 * i] };
    });
    var kagitYazisi = false, hanAcik = false;
    function yazilar(t) {
      kagitYazisi = false;
      AKIS.forEach(function (s) {
        var o = pencere(t, s.bas, s.son, s.kagit ? 0.8 : 0.3, 0.4);
        gos(s.e, o, s.kagit ? kr(8, 0, tw(t, s.bas, 0.8)) : 0);
        if (s.kagit && o > 0.2) kagitYazisi = true;
      });
      KEMER.forEach(function (k) {
        var o = hanAcik ? pencere(t, k.bas, KES.oda2 - 0.2, 0.4, 0.3) : 0;
        var e = T.ekran(k.x, k.adY, 1); k.ad._x = e.x; k.ad._y = e.y; gos(k.ad, o, kr(-10, 0, tw(t, k.bas, 0.5)));
        // durak açılınca anlamların yerini motorun yuvaları alır
        var oa = hanAcik && t < D.kemer - 0.3 ? pencere(t, k.anlamBas, D.kemer - 0.3, 0.4, 0.2) : 0;
        var e2 = T.ekran(k.x, k.anlamY, 1); k.anlam._x = e2.x; k.anlam._y = e2.y; gos(k.anlam, oa);
      });
    }

    /* ——— SVG ——— */
    var defs = E2('defs', {}, svg);
    var dg = E2('linearGradient', { id: 'kd10-cerceve', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    [['0', '#f3d584'], ['1', '#c9972f']].forEach(function (d) { E2('stop', { offset: d[0], 'stop-color': d[1] }, dg); });
    function yol(oz) { var p = E2('path', Object.assign({ d: 'M0 0', fill: 'none' }, oz || {}), svg); p.style.opacity = 0; p._o = 0; return p; }
    function gizle(p) { if (p._o !== 0) { p.style.opacity = 0; p._o = 0; } }
    function goster(p, d, o) { if (o <= 0.003) { gizle(p); return; } p.setAttribute('d', d); p.style.opacity = o; p._o = o; }
    function f1(x) { return x.toFixed(1); }
    function daire(cx, cy, r) { return 'M' + f1(cx - r) + ' ' + f1(cy) + ' a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0 a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
    var halkalar = [0, 1, 2].map(function () { return yol({ stroke: '#ffe29a', 'stroke-width': 4 }); });
    var madalyon = [yol({ stroke: 'url(#kd10-cerceve)', 'stroke-width': 6 })];
    var SVG_HEPSI = [].concat(halkalar, madalyon);
    var kullanildi = [];
    function kullan(p) { kullanildi.push(p); }

    /* ——— ortak yardımcılar ——— */
    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    function ekranR(x, y, r) { var e = T.ekran(x, y, 1), e2 = T.ekran(x + r, y, 1); return { x: e.x, y: e.y, r: e2.x - e.x }; }
    function isima(x, y, r, renk, o) { var s = ekranR(x, y, r); T.iz(s.x, s.y, s.r, s.r, 0, renk[0], renk[1], renk[2], o); T.izBitir(); }
    function dunyaHalka(i, x, y, r, o) { var e = ekranR(x, y, r); goster(halkalar[i], daire(e.x, e.y, e.r), o); kullan(halkalar[i]); }
    function madalyonCiz(x, y, r, o, icerik) {
      var e = ekranR(x, y, r);
      goster(madalyon[0], daire(e.x, e.y, e.r), o); kullan(madalyon[0]);
      if (o <= 0.01) return;
      T.ciz('kagit', { x: x, y: y, g: r * 2, h: r * 2, d: 1, o: o, kure: { duz: true, isik: 0 }, carp: [0.12, 0.17, 0.4] });
      icerik(o);
    }

    /* ——— durak durumu ——— */
    var aNow = 0, aOnce = 0, kv = 50, aci = 0, dn = { bas: null, v: 50 };

    /* ——— 0. Kanca: sabah Safranbolu'su ——— */
    function kanca(t, a) {
      T.bas(a, kameraYolu(t, [[0, { x: 800, y: 440, z: 1.04 }], [AN[2], { x: 860, y: 480, z: 1.16 }], [KES.oda, { x: 1120, y: 470, z: 1.34 }]]));
      plaka('safranbolu-sabah', { d: 1, parilti: 0.35, su: 0.8, ruzgar: 0.06 });
      isima(1660, 120, 360, [1, 0.9, 0.62], 0.12);
    }

    /* ——— 1. Konak odası: pencere kenarında kanarya (durak 1) ——— */
    var KANCA = P(1383, 232);
    function kafes(a, o) {
      // kafes kancadan sarkar, hafifçe salınır; kuş tüneğinde kıpırdar
      T.ciz('kanarya', { x: KANCA[0], y: KANCA[1], h: 230, ax: 0.5, ay: 0, d: 1, r: 2.4 * Math.sin(a * 1.3), o: o == null ? 1 : o });
    }
    function oda(t, a, aksam, b) {
      var acik = api.acikDurak() === 'guven' || api.acikDurak() === 'haber';
      T.bas(a, acik ? DUZ : aksam ? kameraYolu(t, [[b, { x: 980, y: 470, z: 1.18 }], [D.haber - 0.4, DUZ]])
        : kameraYolu(t, [[b, { x: 1180, y: 330, z: 1.55 }], [AN[5], { x: 1000, y: 400, z: 1.2 }], [D.guven - 0.4, DUZ]]));
      plaka('konak-oda', { d: 1, parilti: 0.4, carp: aksam ? [0.86, 0.76, 0.66] : null });
      if (!aksam) isima(1500, 400, 420, [1, 0.88, 0.6], 0.1);
      kafes(a);
      if (aksam) {
        var c = P(1240, 640);
        T.ciz('canta', { x: c[0], y: c[1], h: 150, ax: 0.5, ay: 1, d: 1 });
        isima(c[0], c[1] - 70, 140, [1, 0.85, 0.5], 0.12 * pencere(t, AN[38] - 0.2, D.haber, 0.4, 0.3));
      }
    }

    /* ——— 2. Arasta: bakkal tezgâhında terazi (durak 2), sonra para üstü (durak 5) ——— */
    var TER = { x: 800, taban: P(0, 765)[1], gh: 360, kol: 540, kh: 230 }, PIV = [TER.x, TER.taban - TER.gh + 12];
    var KESE_Y = PIV[1] - 120, KESE_X0 = 520, KESE_X1 = 1080;
    function keseX(v) { return kr(KESE_X0, KESE_X1, v / 100); }
    function cevizCiz(x, y, n, s) {
      for (var k = 0; k < n; k++) {
        // üçerli sıralar halinde yığılır: kefenin kenarından yukarı taşar, uzaktan da seçilir
        var sira = Math.floor(k / 3), cx = x + ((k % 3) - 1) * 32 * s + (sira % 2) * 16 * s - (sira % 2 ? 16 * s : 0), cy = y - sira * 20 * s;
        T.ciz('ceviz', { x: cx, y: cy, g: 42 * s, ax: 0.5, ay: 1, d: 1, r: (hash(k, 7) - 0.5) * 40 });
      }
    }
    function terazi(t, a, v, keseO, keseDolu) {
      // sağ kefe senin, sol kefe kardeşinin; değer senin payın (0-100). Kol ağır tarafa yatar, kefeler dik asılı kalır.
      var sag = v == null ? 0 : Math.round(v / 10), sol = v == null ? 0 : 10 - sag;
      var hedef = sinirla((sag - sol) * 1.3, -12, 12), dt = Math.min(0.1, Math.max(0, a - aOnce));
      aci += (hedef - aci) * (1 - Math.exp(-dt * 6)); aOnce = a;
      var rad = aci * Math.PI / 180, L = TER.kol * 0.475, dy = 20;
      T.ciz('terazi-govde', { x: TER.x, y: TER.taban, h: TER.gh, ax: 0.5, ay: 1, d: 1 });
      [[-1, sol], [1, sag]].forEach(function (u) {
        var hx = PIV[0] + u[0] * L * Math.cos(rad) - dy * Math.sin(rad), hy = PIV[1] + u[0] * L * Math.sin(rad) + dy * Math.cos(rad);
        T.ciz('kefe', { x: hx, y: hy, h: TER.kh, ax: 0.5, ay: 0, d: 1 });
        cevizCiz(hx, hy + TER.kh * 0.8, u[1], 1);
      });
      T.ciz('terazi-kol', { x: PIV[0], y: PIV[1], g: TER.kol, d: 1, r: aci });
      if (keseO > 0.01) {
        var kx = keseX(v == null ? 50 : v);
        T.ciz('kese', { x: kx, y: KESE_Y + 40, h: 96, ax: 0.5, ay: 1, d: 1, o: keseO, r: 3 * Math.sin(a * 2) });
        if (keseDolu) cevizCiz(kx, KESE_Y - 52, 6, 0.8);
      }
    }
    var PARA = P(600, 775), BAKKAL = P(1180, 760);
    function carsi(t, a, ikinci, b) {
      var acikT = api.acikDurak() === 'terazi', acikO = api.acikDurak() === 'ornek';
      T.bas(a, acikT || acikO ? DUZ : ikinci ? kameraYolu(t, [[b, { x: 760, y: 560, z: 1.25 }], [D.ornek - 0.4, DUZ], [AN[43] + 2, DUZ], [KES.sirCoz, { x: 900, y: 600, z: 1.2 }]])
        : kameraYolu(t, [[b, { x: 800, y: 430, z: 1.08 }], [AN[11], { x: 800, y: 520, z: 1.22 }], [D.terazi - 0.4, DUZ], [AN[15], DUZ], [KES.sir, { x: 800, y: 420, z: 1.06 }]]));
      plaka('arasta', { d: 1, parilti: 0.35, ruzgar: 0.05 });
      isima(1640, 200, 340, [1, 0.9, 0.62], 0.1);
      if (!ikinci) {
        var oyun = acikT || t >= D.terazi;
        var keseO = tw(t, W.ceviz - 0.2, 0.6);
        terazi(t, a, oyun ? kv : null, keseO, !oyun);
      } else {
        terazi(t, a, 50, 0, false);
        // fazla verilen para üstü tezgâhta; doğru cevaptan sonra bakkala geri gider
        var gf = Y.ikili(ic(t, D.ornek + 0.2, 1.4)), px = kr(PARA[0], BAKKAL[0], gf), py = kr(PARA[1], BAKKAL[1], gf) - Math.sin(Math.PI * gf) * 60;
        T.ciz('para', { x: px, y: py, g: 120, ax: 0.5, ay: 1, d: 1, o: tw(t, W.fazla - 0.3, 0.5) });
        isima(px, py - 20, 90, [1, 0.88, 0.5], 0.14 * pencere(t, W.fazla - 0.3, D.ornek + 1.6, 0.4, 0.4));
      }
    }

    /* ——— 3. Akşam vadisi: sır, büyük soru, kapanış ——— */
    function aksam(t, a, kam) {
      T.bas(a, kam);
      plaka('safranbolu-aksam', { d: 1, parilti: 0.5, su: 0.8, ruzgar: 0.05 });
      isima(80, 160, 380, [1, 0.7, 0.4], 0.12);
    }
    function sir(t, a) { var k = tw(t, KES.sir, KES.kagit - KES.sir, Y.sin); aksam(t, a, { x: kr(760, 820, k), y: kr(420, 470, k), z: kr(1.06, 1.18, k) }); }
    function sirCoz(t, a) {
      var acik = api.acikDurak() === 'sir';
      aksam(t, a, acik ? DUZ : kameraYolu(t, [[KES.sirCoz, { x: 820, y: 470, z: 1.15 }], [D.sir - 0.4, DUZ]]));
    }
    function kapanis(t, a) { var k = tw(t, KES.son, 8, Y.sin); aksam(t, a, { x: kr(1000, 800, k), y: kr(520, 450, k), z: kr(1.35, 1.02, k) }); }

    /* ——— 4. Kâğıt: Allahü teâlâdan söz edilen bölüm ——— */
    function kagit(t, a) { T.bas(a, DUZ); plaka('kagit', { d: 0 }); }

    /* ——— 5. Han avlusu: yedi kemer, yedi sıfat (durak 3) ——— */
    var KEMER_Y = P(0, 635)[1];
    function han(t, a) {
      var acik = api.acikDurak() === 'kemer';
      T.bas(a, acik || t >= D.kemer ? DUZ : kameraYolu(t, [[KES.han, { x: 800, y: 470, z: 1.1 }], [AN[22] + 1, { x: 800, y: 460, z: 1.04 }], [D.kemer - 0.6, DUZ]]));
      plaka('han-avlu', { d: 1, parilti: 0.4, su: 1, ruzgar: 0.06 });
      // sırası gelen kemerin içi ışır; anlatılan sıfatlar hafif ışıkta kalır
      KEMER.forEach(function (k, i) {
        var son = i < 6 ? KEMER[i + 1].bas : AN[36];
        var o = 0.06 * tw(t, k.bas, 0.6) + 0.14 * pencere(t, k.bas, son, 0.4, 0.6);
        if (o > 0.01) { var s = ekranR(k.x, KEMER_Y, 1); T.iz(s.x, s.y, 62 * s.r, 82 * s.r, 0, 1, 0.86, 0.5, o); }
      });
      T.izBitir();
      if (acik) return;
      // emânet: kilitli sandık; adâlet: terazi
      var mo = pencere(t, AN[23] - 0.1, AN[24], 0.4, 0.4);
      madalyonCiz(420, 220, 92 * kr(0.85, 1, mo), mo, function (oo) { T.ciz('sandik', { x: 420, y: 222, g: 130, d: 1, o: oo }); });
      var to = pencere(t, AN[29] - 0.1, AN[30], 0.4, 0.4);
      if (to > 0.01) madalyonCiz(1180, 220, 92 * kr(0.85, 1, to), to, function (oo) { T.ciz('terazi-tam', { x: 1180, y: 226, h: 140, d: 1, o: oo }); });
    }

    /* ——— perde: kesmelerde kısa bir an lacivert (kâğıt bölümünde krem) karartma ——— */
    var LACI = [0.07, 0.11, 0.3], KREM = [1, 1, 1];
    var PERDE = [[KES.oda], [KES.carsi], [KES.sir], [KES.kagit, KREM], [KES.han, KREM], [KES.oda2], [KES.carsi2], [KES.sirCoz], [KES.kagit2, KREM], [KES.son, KREM]];
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
      [KES.oda, kanca], [KES.carsi, function (t, a) { oda(t, a, false, KES.oda); }], [KES.sir, function (t, a) { carsi(t, a, false, KES.carsi); }],
      [KES.kagit, sir], [KES.han, kagit], [KES.oda2, han], [KES.carsi2, function (t, a) { oda(t, a, true, KES.oda2); }],
      [KES.sirCoz, function (t, a) { carsi(t, a, true, KES.carsi2); }], [KES.kagit2, sirCoz], [KES.son, kagit], [Infinity, kapanis]
    ];
    function ciz(t, a) {
      aNow = a; kullanildi = [];
      hanAcik = t >= KES.han && t < KES.oda2;
      for (var i = 0; i < BOLUM.length; i++) { if (t < BOLUM[i][0]) { BOLUM[i][1](t, a); break; } }
      SVG_HEPSI.forEach(function (p) { if (kullanildi.indexOf(p) < 0) gizle(p); });
      perde(t);
      yazilar(t);
    }

    return {
      hazir: hazir,
      ciz: ciz,
      // Allahü teâlâdan söz edilen kâğıt bölümlerinde yazı sahnenin kendisidir; altyazı ve dokunma oyunu yoktur
      altyazisiz: function (t) { return kagitYazisi || (t >= KES.kagit && t < KES.han) || (t >= KES.kagit2 && t < KES.son); },
      // Peygamber efendimizin adı anılırken oyun yoktur
      dokun: function () { var t = api.t(); if (t >= AN[51] - 0.2 && t < AN[54]) return true; return false; },
      durak: function (id, olay, veri) {
        if (id === 'terazi' && olay === 'deger') kv = veri;
        if (id === 'terazi' && olay === 'ac') kv = 50;
      },
      // Ceviz kesesi: çocuk keseyi tutup sağa sola çeker (sağ: cevizler senin kefene)
      tutamac: function (id, deger) { return { x: keseX(deger), y: KESE_Y - 6, r: 80, ust: false }; },
      tutDeger: function (id, x, y, bas) {
        if (bas !== dn.bas) { dn.bas = bas; dn.v = bas ? bas.deger : kv; dn.x = bas ? bas.x : x; }
        return sinirla(dn.v + (x - dn.x) / ((KESE_X1 - KESE_X0) / 100), 0, 100);
      }
    };
  };
})();
