/* Akaid 18 · Kader — sahne: "Yaşayan Minyatür", Van Gölü; bir gün sabahtan akşama.
   Ders tek sahnede dönmez: sabah gölü, Süphan Dağı ve kale sırtı; iskelede balıkçı reisin yelkenli teknesi, reis yelkeni yamar,
   ipleri bağlar, dümeni dener; sır: denize açılmadan önce yaptığı son iş; güneşin doğduğu yön (durak 1); Allahü teâlâdan söz
   edilen bölümde boya çekilir, kâğıt ve yazı kalır: ölçü ve düzen, kader, kazâ, hayır ve şer, kaderimizi bilmeyiz (durak 2);
   rüzgârlı gölde kütük rüzgârla sürüklenir, tekne iki yoldan birini seçer; kâğıtta irade ve sorumluluk (durak 3); öğleden sonra
   iskelede arkadaşın sözü ve "bahane olmaz" (durak 4); önce yapılan işler eşleştirilir (durak 5); kâğıtta tevekkül; akşam gölünde
   büyük soru (durak 6); sabaha dönülür, reisin hazırlığı gösterilir; kâğıtta cevap; tekne akşam iskeleye döner, ders biter.
   Her olay anlatıcının kelimesine bağlıdır (t); a ortam saatidir. İnsan figürü, yüz, el yoktur; reis görünmez.
   Allahü teâlâ için hiçbir şekil, ışık ya da sembol kullanılmaz. Kader bir yazı, defter ya da levha olarak çizilmez. */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-18'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['gol-sabah', 'iskele', 'gol-ruzgar', 'gol-aksam', 'kagit', 'tekne', 'kutuk'];
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
    var D = {}; ['gunes', 'bilir', 'irade', 'bahane', 'tevekkul', 'sir'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {}; for (var n0 = 0; n0 <= 49; n0++) AN[n0] = C(n0);
    var KES = {
      iskele: AN[3] - 0.1, gunes: AN[10] - 0.1, kagit: AN[13] - 0.1, ruzgar: AN[23] - 0.1, kagit2: AN[27] - 0.1,
      iskele2: AN[34] - 0.1, kagit3: AN[41] - 0.1, aksam: AN[42] - 0.1, iskele3: AN[45] - 0.1, kagit4: AN[46] - 0.1, son: AN[47] - 0.1
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
      ['Van Gölü', 'etiket', 800, 96, AN[1], KES.iskele - 0.1],
      ['ölçü ve düzen', 'etiket', 800, 96, AN[12], KES.kagit - 0.2],
      ['Allahü teâlâ, her şeyi bir ölçü ve düzenle yaratır.', 'kagit iri', 800, 260, AN[13], AN[16] - 0.4],
      ['Olacak her şeyi, ezelde, yani her şeyden önce bilir ve takdir eder. Buna kader denir.', 'kagit', 800, 600, AN[14], AN[16] - 0.4],
      ['Takdir edilen şeyin, zamanı gelince yaratılmasına da kazâ denir.', 'kagit', 800, 250, AN[16], AN[18] - 0.4],
      ['Hayrın da şerrin de, Allahü teâlâdan olduğuna inanırız.', 'kagit iri', 800, 560, AN[17], AN[18] - 0.4],
      ['Ama Allahü teâlâ, iyilikten razı olur; kötülükten razı olmaz.', 'kagit iri', 800, 330, AN[18], D.bilir - 0.6],
      ['Bilmeyiz. Kader, Allahü teâlânın bir sırrıdır.', 'kagit iri', 800, 300, AN[20], KES.ruzgar - 0.4],
      ['Bize düşen, doğru olanı seçip çalışmaktır.', 'kagit', 800, 580, AN[22], KES.ruzgar - 0.4],
      ['kütük seçemez', 'etiket', 800, 96, AN[25] + 1.2, AN[26] - 0.1],
      ['reis yönünü seçer', 'etiket', 800, 96, AN[26] + 0.6, KES.kagit2 - 0.2],
      ['Allahü teâlâ, insana da seçme gücü verdi. Buna irade denir.', 'kagit iri', 800, 280, AN[27], AN[30] - 0.4],
      ['İnsan, iyiyi de kötüyü de kendi iradesiyle seçer; seçtiğinden sorumludur.', 'kagit', 800, 590, AN[29], AN[30] - 0.4],
      ['Göz rengimizi, doğduğumuz yeri seçmeyiz; bunlardan sorumlu da tutulmayız.', 'kagit', 800, 330, AN[30], D.irade - 0.6],
      ['Doğruyu söylemeyi seçeriz. Bu, bizim elimizdedir.', 'kagit iri', 800, 420, AN[32], KES.iskele2 - 0.4],
      ['"Kaderimde ne varsa o olur."', 'etiket', 800, 150, AN[35] + 0.2, AN[39] - 0.2],
      ['bahane olmaz', 'damga', 800, 330, AN[37], AN[39] - 0.2],
      ['herkes önce kendine düşeni yapar', 'etiket', 800, 96, AN[39], D.tevekkul - 0.5],
      ['Üzerimize düşeni yapıp, sonra Allahü teâlâya güvenmeye tevekkül denir.', 'kagit iri', 800, 450, AN[41], KES.aksam - 0.4],
      ['sabah', 'etiket', 800, 96, AN[45], KES.kagit4 - 0.2],
      ['Sonra, denize açılmadan önce dua etti; Allahü teâlâya güvendi.', 'kagit iri', 800, 450, AN[46], KES.son - 0.4],
      ['Akaid dersleri tamamlandı', 'etiket', 800, 110, AN[48] + 0.2, AN[49] + 0.9]
    ].map(function (s) { return { e: yazi(s[0], s[1], s[2], s[3]), kagit: /^kagit/.test(s[1]), bas: s[4], son: s[5] }; });

    var SOZ = AKIS.filter(function (s) { return s.e.textContent.charAt(0) === '"'; })[0];
    // İskelede teknenin üç hazırlığı: yelkendeki yama, ip kangalı, dümen yekesi (ham görselde ölçüldü)
    var YAMA = P(1006, 433), IP = P(897, 582), YEKE = P(330, 522);
    var sorTekne = yazi('?', 'sor', P(1180, 300)[0], P(1180, 300)[1]);
    var GUNES = P(1441, 369);

    var kagitYazisi = false;
    function bagla(e, x, y) { var p = T.ekran(x, y, 1); e._x = p.x; e._y = p.y; }   // kamera kayınca yazı yerinde kalır
    function yazilar(t) {
      kagitYazisi = false;
      AKIS.forEach(function (s) {
        var o = pencere(t, s.bas, s.son, s.kagit ? 0.8 : 0.3, 0.4);
        gos(s.e, o, s.kagit ? kr(8, 0, tw(t, s.bas, 0.8)) : 0);
        if (s.kagit && o > 0.2) kagitYazisi = true;
      });
      // arkadaşın sözünün üstü çizilir: kader bahane olmaz (çizgi yazının kendisinde, etiket kutusunun altında kalmaz)
      var cizili = t >= AN[37] + 0.15;
      if (SOZ.e._ciz !== cizili) {
        SOZ.e.style.textDecoration = cizili ? 'line-through' : 'none';
        SOZ.e.style.textDecorationColor = '#c8452f'; SOZ.e.style.textDecorationThickness = '4px';
        SOZ.e._ciz = cizili;
      }
      var iskeleAcik = t >= KES.iskele && t < KES.gunes;
      bagla(sorTekne, P(1180, 300)[0], P(1180, 300)[1]);
      gos(sorTekne, iskeleAcik ? pencere(t, AN[6], KES.gunes - 0.3, 0.3, 0.3) : 0);
    }

    /* ——— SVG ——— */
    function yol(oz) { var p = E2('path', Object.assign({ d: 'M0 0', fill: 'none' }, oz || {}), svg); p.style.opacity = 0; p._o = 0; return p; }
    function gizle(p) { if (p._o !== 0) { p.style.opacity = 0; p._o = 0; } }
    function goster(p, d, o) { if (o <= 0.003) { gizle(p); return; } p.setAttribute('d', d); p.style.opacity = o; p._o = o; }
    function f1(x) { return x.toFixed(1); }
    function daire(cx, cy, r) { return 'M' + f1(cx - r) + ' ' + f1(cy) + ' a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0 a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
    var halka = [0, 1, 2].map(function () { return yol({ stroke: '#c8452f', 'stroke-width': 5 }); });
    var gunYolu = yol({ stroke: '#fff4d6', 'stroke-width': 4, 'stroke-dasharray': '10 12', 'stroke-linecap': 'round' });
    var yolA = yol({ stroke: '#fff4d6', 'stroke-width': 5, 'stroke-dasharray': '12 12', 'stroke-linecap': 'round' });
    var yolB = yol({ stroke: '#fff4d6', 'stroke-width': 5, 'stroke-dasharray': '12 12', 'stroke-linecap': 'round' });
    var SVG_HEPSI = halka.concat([gunYolu, yolA, yolB]);
    var kullanildi = [];
    function kullan(p) { kullanildi.push(p); }

    /* ——— ortak yardımcılar ——— */
    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    function ekranR(x, y, r) { var e = T.ekran(x, y, 1), e2 = T.ekran(x + r, y, 1); return { x: e.x, y: e.y, r: e2.x - e.x }; }
    function isima(x, y, r, renk, o) { var s = ekranR(x, y, r); T.iz(s.x, s.y, s.r, s.r, 0, renk[0], renk[1], renk[2], o); T.izBitir(); }
    function halkaGoster(i, x, y, r, o) { var e = ekranR(x, y, r); goster(halka[i], daire(e.x, e.y, e.r), o); kullan(halka[i]); }
    // bir kelimeden ötekine yanan halka: "yelkeni", "ipleri", "dümeni" (sıra: metinde kaçıncı geçiş)
    function hazirlik(t, sira) {
      var w = [kel('yelkeni', sira[0]), kel('ipleri', sira[1]), kel('dümeni', sira[2])];
      var yer = [[YAMA, 70], [IP, 66], [YEKE, 74]];
      for (var i = 0; i < 3; i++) {
        var o = pencere(t, w[i], (i < 2 ? w[i + 1] : w[i] + 1.6) + 0.2, 0.25, 0.3);
        if (o > 0.01) halkaGoster(i, yer[i][0][0], yer[i][0][1], yer[i][1], o * 0.9);
      }
    }

    /* ——— 0. Sabah gölü: kanca; durak 1 güneş ——— */
    function golSabah(t, a, ikinci) {
      var acik = api.acikDurak() === 'gunes';
      T.bas(a, acik ? DUZ : ikinci ? kameraYolu(t, [[KES.gunes, { x: 1100, y: 400, z: 1.3 }], [D.gunes - 0.5, DUZ], [D.gunes + 1, DUZ], [AN[12], { x: 900, y: 420, z: 1.1 }], [KES.kagit, { x: 820, y: 430, z: 1.05 }]])
        : kameraYolu(t, [[0, { x: 640, y: 470, z: 1.25 }], [AN[1], { x: 760, y: 440, z: 1.12 }], [KES.iskele, { x: 820, y: 420, z: 1.2 }]]));
      plaka('gol-sabah', { d: 1, parilti: 0.45, su: 1, ruzgar: 0.05 });
      var dogus = ikinci ? tw(t, AN[11], 1.2) : 0;
      isima(GUNES[0], GUNES[1] - 14 * dogus, kr(170, 230, dogus), [1, 0.9, 0.6], kr(0.16, 0.26, dogus));
      if (ikinci) {
        // güneşin her gün aynı yolu: doğudan doğar, gökyüzünü aşar
        var go = pencere(t, AN[11] + 0.6, KES.kagit - 0.2, 0.6, 0.3);
        if (go > 0.01) {
          var u = tw(t, AN[11] + 0.6, 2.4, Y.sin), d = '', N = 24;
          for (var i = 0; i <= N * u; i++) {
            var q = i / N, x = kr(GUNES[0], P(240, 369)[0], q), y = GUNES[1] - Math.sin(Math.PI * q) * 230, e = T.ekran(x, y, 1);
            d += (i ? 'L' : 'M') + f1(e.x) + ' ' + f1(e.y);
          }
          if (d) { goster(gunYolu, d, go * 0.85); kullan(gunYolu); }
        }
      }
    }

    /* ——— 1. İskele: reisin teknesi; sabah, öğleden sonra (durak 4-5) ve sırrın cevabı ——— */
    function iskele(t, a, kip) {
      var acik = api.acikDurak() === 'bahane' || api.acikDurak() === 'tevekkul';
      var kam = kip === 1 ? kameraYolu(t, [[KES.iskele, { x: 760, y: 430, z: 1.15 }], [AN[4], { x: 820, y: 420, z: 1.3 }], [AN[6], { x: 960, y: 380, z: 1.35 }], [KES.gunes, { x: 900, y: 400, z: 1.25 }]])
        : kip === 2 ? kameraYolu(t, [[KES.iskele2, { x: 980, y: 470, z: 1.2 }], [D.bahane - 0.5, DUZ], [KES.kagit3, DUZ]])
        : kameraYolu(t, [[KES.iskele3, { x: 700, y: 440, z: 1.25 }], [KES.kagit4, { x: 820, y: 430, z: 1.35 }]]);
      T.bas(a, acik ? DUZ : kam);
      plaka('iskele', { d: 1, parilti: 0.42, su: 1, ruzgar: 0.06, carp: kip === 2 ? [1, 0.93, 0.84] : null });
      var g = P(1500, 140); isima(g[0], g[1], 320, [1, 0.93, 0.7], kip === 2 ? 0.1 : 0.13);
      if (kip === 1) hazirlik(t, [1, 1, 1]);   // "yelkeni yamar, ipleri bağlar, dümeni dener"
      if (kip === 3) hazirlik(t, [2, 2, 3]);   // "yelkeni yamadı, ipleri bağladı, dümeni denedi"
      if (kip === 2) {
        // eşleştirme sahnenin üstünde açılır: resimler okunsun diye sahne kararır
        if (api.acikDurak() === 'tevekkul') T.ciz('kagit', { x: 800, y: 450, g: 1800, h: 1012, d: 0, carp: [0.07, 0.11, 0.3], o: 0.66 });
      }
    }

    /* ——— 2. Rüzgârlı göl: kütük sürüklenir, tekne yolunu seçer ——— */
    var KUTUK0 = P(120, 600), KUTUK1 = P(1560, 610);
    var TEKNE0 = P(300, 700), TEKNE_A = P(1180, 520), TEKNE_B = P(1500, 760);
    function bez(p0, p1, p2, q) { var u = 1 - q; return [u * u * p0[0] + 2 * u * q * p1[0] + q * q * p2[0], u * u * p0[1] + 2 * u * q * p1[1] + q * q * p2[1]]; }
    function golRuzgar(t, a) {
      T.bas(a, kameraYolu(t, [[KES.ruzgar, { x: 800, y: 470, z: 1.05 }], [AN[24], { x: 640, y: 540, z: 1.2 }], [AN[26], { x: 840, y: 540, z: 1.12 }], [KES.kagit2, { x: 900, y: 520, z: 1.1 }]]));
      plaka('gol-ruzgar', { d: 1, parilti: 0.4, su: 1, ruzgar: 0.12 });
      var g = P(800, 120); isima(g[0], g[1], 420, [1, 0.94, 0.72], 0.1);
      // kütük: rüzgâr nereye iterse oraya gider, dalgayla iner kalkar
      var kk = ic(t, AN[24] - 0.4, KES.kagit2 - AN[24] + 0.4), ko = pencere(t, AN[24] - 0.4, KES.kagit2 + 0.2, 0.5, 0.3);
      if (ko > 0.01) {
        var kx = kr(KUTUK0[0], KUTUK1[0], kk), ky = kr(KUTUK0[1], KUTUK1[1], kk) + Math.sin(a * 1.6) * 8;
        T.ciz('kutuk', { x: kx, y: ky, g: 230, d: 1, r: Math.sin(a * 1.3) * 5, o: ko });
      }
      // tekne: önünde iki yol açılır; reis dümeni çevirir, birini seçer
      var to = pencere(t, AN[26] - 0.3, KES.kagit2 + 0.2, 0.5, 0.3);
      if (to > 0.01) {
        var secim = kel('seçer', 1), yo = pencere(t, AN[26] + 0.2, secim + 1.2, 0.4, 0.4);
        var ara = P(760, 640);
        function egri(p2) {
          var d = '';
          for (var i = 0; i <= 20; i++) { var b = bez(TEKNE0, ara, p2, i / 20), e = T.ekran(b[0], b[1], 1); d += (i ? 'L' : 'M') + f1(e.x) + ' ' + f1(e.y); }
          return d;
        }
        if (yo > 0.01) { goster(yolA, egri(TEKNE_A), yo * 0.9); goster(yolB, egri(TEKNE_B), yo * 0.45 * (1 - tw(t, secim - 0.2, 0.5))); kullan(yolA); kullan(yolB); }
        var donus = kel('çevirir', 1), q = tw(t, donus, KES.kagit2 - donus + 0.2, Y.sin);
        var b0 = bez(TEKNE0, ara, TEKNE_A, q), b1 = bez(TEKNE0, ara, TEKNE_A, Math.min(1, q + 0.02));
        var aci = Math.atan2(b1[1] - b0[1], b1[0] - b0[0]) * 180 / Math.PI;
        T.ciz('tekne', { x: b0[0], y: b0[1] + Math.sin(a * 1.4) * 5, h: kr(260, 200, q), ax: 0.5, ay: 0.85, d: 1, r: aci * 0.5, o: to });
      }
    }

    /* ——— 3. Akşam gölü: büyük soru (durak 6); tekne iskeleye döner ——— */
    var ISKELE_UC = P(1186, 600);   // iskelenin göle uzanan ucu
    function golAksam(t, a, son) {
      var acik = api.acikDurak() === 'sir';
      T.bas(a, acik ? DUZ : son ? (function () { var k = tw(t, KES.son, 7, Y.sin); return { x: kr(700, 820, k), y: kr(470, 450, k), z: kr(1.3, 1.04, k) }; })()
        : kameraYolu(t, [[KES.aksam, { x: 760, y: 450, z: 1.12 }], [D.sir - 0.5, DUZ], [D.sir + 1, DUZ], [KES.iskele3, { x: 800, y: 450, z: 1.08 }]]));
      plaka('gol-aksam', { d: 1, parilti: 0.5, su: 1, ruzgar: 0.05 });
      var g = P(708, 350); isima(g[0], g[1], 300, [1, 0.72, 0.42], 0.16);
      var fener = P(1349, 470); isima(fener[0], fener[1], 70, [1, 0.85, 0.5], son ? 0.3 : 0.18);
      if (son) {
        // tekne selametle iskeleye döner
        var q = tw(t, KES.son + 0.3, AN[48] - KES.son + 0.6, Y.sin);
        var bx = kr(P(240, 640)[0], ISKELE_UC[0] - 120, q), by = kr(P(240, 640)[1], ISKELE_UC[1] + 20, q);
        T.ciz('tekne', { x: bx, y: by + Math.sin(a * 1.2) * 4 * (1 - q), h: kr(170, 210, q), ax: 0.5, ay: 0.85, d: 1, o: tw(t, KES.son, 0.6), carp: [1, 0.9, 0.82] });
      }
    }

    /* ——— 4. Kâğıt ——— */
    function kagit(t, a) { T.bas(a, DUZ); plaka('kagit', { d: 0 }); }

    /* ——— perde: kesmelerde kısa bir an lacivert (kâğıt bölümünde krem) karartma ——— */
    var LACI = [0.07, 0.11, 0.3], KREM = [1, 1, 1];
    var PERDE = [[KES.iskele], [KES.gunes], [KES.kagit, KREM], [KES.ruzgar, KREM], [KES.kagit2, KREM], [KES.iskele2, KREM], [KES.kagit3, KREM], [KES.aksam, KREM],
      [KES.iskele3], [KES.kagit4, KREM], [KES.son, KREM]];
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
      [KES.iskele, function (t, a) { golSabah(t, a, false); }], [KES.gunes, function (t, a) { iskele(t, a, 1); }], [KES.kagit, function (t, a) { golSabah(t, a, true); }],
      [KES.ruzgar, kagit], [KES.kagit2, golRuzgar], [KES.iskele2, kagit], [KES.kagit3, function (t, a) { iskele(t, a, 2); }], [KES.aksam, kagit],
      [KES.iskele3, function (t, a) { golAksam(t, a, false); }], [KES.kagit4, function (t, a) { iskele(t, a, 3); }], [KES.son, kagit],
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
      // Allahü teâlâdan söz edilen kâğıt bölümlerinde yazı sahnenin kendisidir; altyazı ve dokunma oyunu yoktur
      altyazisiz: function (t) { return kagitYazisi || (t >= KES.kagit && t < D.bilir - 0.3) || (t >= KES.kagit2 && t < D.irade - 0.3) || (t >= KES.kagit3 && t < KES.aksam) || (t >= KES.kagit4 && t < KES.son); },
      dokun: function () { return false; }
    };
  };
})();
