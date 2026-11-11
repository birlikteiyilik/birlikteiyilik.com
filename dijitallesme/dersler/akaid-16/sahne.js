/* Akaid 16 · Âhıret Hayatının Aşamaları — sahne: "Yaşayan Minyatür", Anadolu'da bir tren yolculuğu; sabahtan akşama.
   Ders tek sahnede dönmez: sabah Eskişehir garında buharlı tren düdük öttürüp kalkar; kompartımanın penceresinden
   telgraf direkleri geçer, sır: trenin son durağı neresi, oraya iyi varmak için ne yapmalı; istasyonlar nasıl gelir
   (durak 1); kabir, kıyamet ve Allahü teâlâdan söz edilen bölümde boya çekilir, kâğıt ve yazı kalır, kıyametin vaktini
   kimin bildiği kâğıtta sorulur (durak 2); bozkırda uzanan rayların üstünde mahşer, hesap, mîzân, Sırat anlatılır,
   duraklar raylara sırayla yerleşir (durak 3), mîzân sorulur (durak 4), sınavdaki kopya sorusu (durak 5); akşam
   son istasyonda büyük soru (durak 6), sırrın çözümü; kâğıtta cevap; ders son istasyonda, fenerler yanarken biter.
   Her olay anlatıcının kelimesine bağlıdır (t); a ortam saatidir.
   Fizik: buhar bacadan çıkıp yükselir ve dağılır; pencereden direkler sağdan sola, yakındakiler hızlı geçer.
   Cennet ve Cehennem tasvir edilmez, azap sahnesi çizilmez; mîzân için terazi, Sırat için köprü çizilmez.
   İnsan figürü, yüz, el yoktur. Allahü teâlâ için hiçbir şekil, ışık ya da sembol kullanılmaz. */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-16'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['gar-sabah', 'kompartiman', 'bozkir-ray', 'gar-aksam', 'kagit', 'fener'];
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
    var D = {}; ['tren', 'kim', 'sira', 'mizan', 'kopya', 'sir'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {}; for (var n0 = 0; n0 <= 44; n0++) AN[n0] = C(n0);
    var W = { duduk: kel('düdüğünü') };
    var KES = { komp: AN[4] - 0.1, kagit: AN[13] - 0.1, bozkir: AN[20] - 0.1, aksam: AN[36] - 0.1, kagit2: AN[40] - 0.1, son: AN[42] - 0.1 };

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
      ['Eskişehir garı', 'etiket', 800, 96, AN[1], AN[3] + 0.6],
      ['?', 'sor', 1040, 300, AN[6], D.tren - 0.7],
      ['istasyonlar sırayla gelir', 'etiket', 800, 96, AN[11], AN[12] - 0.1],
      ['âhıret yolculuğunun da durakları vardır', 'etiket', 800, 96, AN[12], KES.kagit - 0.2],
      // kâğıt üç sayfa: kabir; kıyamet; diriliş
      ['Dünya hayatı bitince, ilk durak kabir hayatıdır.', 'kagit iri', 800, 330, AN[13], AN[15] - 0.4],
      ['İnsan, yeniden dirilene kadar orada bekler.', 'kagit', 800, 560, AN[14], AN[15] - 0.4],
      ['Sonra kıyamet kopar. İsrâfîl aleyhisselâm Sûr\'a üfler; dünyanın ve bütün varlıkların sonu gelir.', 'kagit', 800, 300, AN[15], AN[18] - 0.4],
      ['Kıyametin ne zaman kopacağını, yalnız Allahü teâlâ bilir.', 'kagit iri', 800, 560, AN[17], AN[18] - 0.4],
      ['Sûr\'a ikinci kez üflenince, herkes yeniden diriltilir.', 'kagit iri', 800, 420, AN[18], D.kim - 0.6],
      ['mahşer: herkes bir meydanda toplanır', 'etiket', 800, 96, AN[21], AN[22] - 0.1],
      ['hesap: amel defteri verilir', 'etiket', 800, 96, AN[22], AN[24] - 0.1],
      ['mîzân: iyilikler ve kötülükler tartılır', 'etiket', 800, 96, AN[24], AN[26] - 0.1],
      ['Sırat: doğru yolda gidenler kolayca geçer', 'etiket', 800, 96, AN[26], D.sira - 0.7],
      ['kolay yol her zaman doğru yol değildir', 'etiket', 800, 96, AN[34], KES.aksam - 0.2],
      ['son istasyon', 'etiket', 800, 96, AN[39], KES.kagit2 - 0.2],
      ['Âhıret yolculuğunun son durağı, Cennet ya da Cehennemdir.', 'kagit', 800, 330, AN[40], KES.son - 0.4],
      ['Allahü teâlâ, îmân edip iyilik yapanlara Cenneti hazırladı.', 'kagit iri', 800, 540, AN[41], KES.son - 0.4],
      ['oraya iyi varmak için bugünden doğru yolda yürürüz', 'etiket', 800, 96, AN[42], AN[43] - 0.1],
      ['Gelecek ders: Âhıret inancı ve davranışlarımız', 'etiket', 800, 110, AN[43] + 0.2, AN[44] + 0.9]
    ].map(function (s) { return { e: yazi(s[0], s[1], s[2], s[3]), kagit: /^kagit/.test(s[1]), bas: s[4], son: s[5] }; });

    var kagitYazisi = false;
    function yazilar(t) {
      kagitYazisi = false;
      AKIS.forEach(function (s) {
        var o = pencere(t, s.bas, s.son, s.kagit ? 0.8 : 0.3, 0.4);
        gos(s.e, o, s.kagit ? kr(8, 0, tw(t, s.bas, 0.8)) : 0);
        if (s.kagit && o > 0.2) kagitYazisi = true;
      });
    }

    /* ——— SVG ——— */
    function yol(oz) { var p = E2('path', Object.assign({ d: 'M0 0', fill: 'none' }, oz || {}), svg); p.style.opacity = 0; p._o = 0; return p; }
    function gizle(p) { if (p._o !== 0) { p.style.opacity = 0; p._o = 0; } }
    function goster(p, d, o) { if (o <= 0.003) { gizle(p); return; } p.setAttribute('d', d); p.style.opacity = o; p._o = o; }
    function f1(x) { return x.toFixed(1); }
    function daire(cx, cy, r) { return 'M' + f1(cx - r) + ' ' + f1(cy) + ' a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0 a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
    var halka = yol({ stroke: '#c8452f', 'stroke-width': 5 });
    var direkler = yol({ stroke: '#5a3b22', 'stroke-width': 7, 'stroke-linecap': 'round' });
    var oklar = yol({ stroke: '#2f5fb3', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': '2 12' });
    var SVG_HEPSI = [halka, direkler, oklar];
    var kullanildi = [];
    function kullan(p) { kullanildi.push(p); }

    /* ——— ortak yardımcılar ——— */
    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    function ekranR(x, y, r) { var e = T.ekran(x, y, 1), e2 = T.ekran(x + r, y, 1); return { x: e.x, y: e.y, r: e2.x - e.x }; }
    function isima(x, y, r, renk, o) { var s = ekranR(x, y, r); T.iz(s.x, s.y, s.r, s.r, 0, renk[0], renk[1], renk[2], o); T.izBitir(); }

    /* ——— 0. Sabah garı: buharlı tren düdük öttürüp kalkar ——— */
    var BACA = P(787, 540);
    function gar(t, a) {
      T.bas(a, kameraYolu(t, [[0, { x: 700, y: 420, z: 1.15 }], [AN[1], { x: 640, y: 440, z: 1.2 }], [AN[3], { x: BACA[0], y: BACA[1] + 20, z: 1.45 }], [KES.komp, { x: BACA[0] + 160, y: BACA[1] + 40, z: 1.5 }]]));
      plaka('gar-sabah', { d: 1, parilti: 0.35, ruzgar: 0.06 });
      var g = P(120, 140); isima(g[0], g[1], 360, [1, 0.93, 0.68], 0.12);
      // buhar: bacadan çıkan bulutçuklar yükselir, büyür, dağılır; düdükte yoğunlaşır
      var yog = 0.3 + 0.5 * pencere(t, W.duduk - 0.1, W.duduk + 2.2, 0.2, 0.8);
      for (var i = 0; i < 6; i++) {
        var u = (a * 0.45 + i / 6) % 1;
        isima(BACA[0] - u * 90, BACA[1] - 30 - u * 170, 22 + u * 60, [1, 1, 1], yog * 0.5 * (1 - u));
      }
    }

    /* ——— 1. Kompartıman: pencereden direkler geçer (sır, durak 1) ——— */
    var PEN = { x0: P(470, 0)[0], x1: P(1200, 0)[0], y0: P(0, 220)[1], y1: P(0, 470)[1] };
    function komp(t, a) {
      var acik = api.acikDurak() === 'tren';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.komp, { x: 800, y: 380, z: 1.3 }], [AN[6], { x: 840, y: 330, z: 1.5 }], [AN[9], { x: 800, y: 430, z: 1.12 }], [D.tren - 0.5, DUZ], [D.tren + 1, DUZ], [KES.kagit, { x: 820, y: 360, z: 1.35 }]]));
      plaka('kompartiman', { d: 1, parilti: 0.4 });
      // tren gidiyor: pencerede telgraf direkleri sağdan sola geçer; durakta tren istasyonda durur
      if (!acik) {
        var d = '';
        for (var i = 0; i < 3; i++) {
          var u = (a * 0.55 + i / 3) % 1, x = kr(PEN.x1 + 40, PEN.x0 - 40, u);
          if (x < PEN.x0 || x > PEN.x1) continue;
          var p = T.ekran(x, PEN.y0 + 20, 1), q = T.ekran(x, PEN.y1 - 10, 1), r = T.ekran(x - 26, PEN.y0 + 40, 1), s = T.ekran(x + 26, PEN.y0 + 40, 1);
          d += 'M' + f1(p.x) + ' ' + f1(p.y) + 'L' + f1(q.x) + ' ' + f1(q.y) + 'M' + f1(r.x) + ' ' + f1(r.y) + 'L' + f1(s.x) + ' ' + f1(s.y);
        }
        goster(direkler, d, 0.75); kullan(direkler);
      }
    }

    /* ——— 2. Kâğıt: kabir, kıyamet, Allahü teâlâdan söz edilen bölüm (durak 2 de burada) ——— */
    function kagit(t, a) { T.bas(a, DUZ); plaka('kagit', { d: 0 }); }

    /* ——— 3. Bozkırda raylar: mahşer, hesap, mîzân, Sırat (durak 3, 4, 5) ——— */
    var YUVA = [[190, 630], [440, 560], [690, 500], [940, 450], [1190, 420], [1420, 400]];
    function bozkir(t, a) {
      var acik = api.acikDurak() === 'sira' || api.acikDurak() === 'mizan' || api.acikDurak() === 'kopya';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.bozkir, { x: 420, y: 620, z: 1.35 }], [AN[22], { x: 700, y: 560, z: 1.3 }], [AN[24], { x: 980, y: 520, z: 1.3 }], [AN[26], { x: 1250, y: 500, z: 1.3 }],
        [AN[28], { x: 800, y: 450, z: 1.04 }], [D.sira - 0.5, DUZ], [D.kopya + 1, DUZ], [AN[35], { x: 1000, y: 500, z: 1.2 }], [KES.aksam, { x: 1100, y: 500, z: 1.25 }]]));
      plaka('bozkir-ray', { d: 1, parilti: 0.4, ruzgar: 0.12 });
      var g = P(1500, 120); isima(g[0], g[1], 380, [1, 0.94, 0.7], 0.12);
      // durak sırası: yuvalar arası noktalı yol, ilkten sona
      var oo = pencere(t, AN[28] - 0.2, D.mizan, 0.4, 0.4);
      if (oo > 0.01) {
        var d = '';
        for (var i = 0; i < 5; i++) {
          var p = T.ekran(YUVA[i][0] + 95, YUVA[i][1], 1), q = T.ekran(YUVA[i + 1][0] - 95, YUVA[i + 1][1], 1);
          d += 'M' + f1(p.x) + ' ' + f1(p.y) + 'L' + f1(q.x) + ' ' + f1(q.y);
        }
        goster(oklar, d, oo); kullan(oklar);
      }
    }

    /* ——— 4. Akşam: son istasyon; büyük soru (durak 6), çözüm ve kapanış ——— */
    var FENER = [P(1061, 445), P(1501, 445)], DURMA = P(1421, 690);
    function aksam(t, a, son) {
      var acik = api.acikDurak() === 'sir';
      T.bas(a, acik ? DUZ : son ? (function () { var k = tw(t, KES.son, 6, Y.sin); return { x: kr(1250, 800, k), y: kr(520, 450, k), z: kr(1.5, 1.02, k) }; })()
        : kameraYolu(t, [[KES.aksam, { x: 760, y: 470, z: 1.15 }], [D.sir - 0.5, DUZ], [D.sir + 1, DUZ], [AN[39], { x: 1250, y: 560, z: 1.45 }], [KES.kagit2, { x: 1280, y: 560, z: 1.5 }]]));
      plaka('gar-aksam', { d: 1, parilti: 0.5 });
      // fenerler yanar; tren durduğu için buhar azalır
      FENER.forEach(function (f, i) { isima(f[0], f[1], 70 + 5 * Math.sin(a * 5 + i), [1, 0.8, 0.45], 0.28 + 0.04 * Math.sin(a * 4 + i)); });
      for (var i = 0; i < 3; i++) { var u = (a * 0.3 + i / 3) % 1, b = P(905, 500); isima(b[0] - u * 30, b[1] - u * 90, 16 + u * 40, [1, 1, 1], 0.25 * (1 - u)); }
      var ho = son ? 0 : pencere(t, AN[39], KES.kagit2 - 0.2, 0.4, 0.3);
      if (ho > 0.01) { var e = ekranR(DURMA[0], DURMA[1] - 40, 110 + 3 * Math.sin(a * 3)); goster(halka, daire(e.x, e.y, e.r), ho); kullan(halka); }
    }

    /* ——— perde: kesmelerde kısa bir an lacivert (kâğıt bölümünde krem) karartma ——— */
    var LACI = [0.07, 0.11, 0.3], KREM = [1, 1, 1];
    var PERDE = [[KES.komp], [KES.kagit, KREM], [KES.bozkir, KREM], [KES.aksam], [KES.kagit2, KREM], [KES.son, KREM]];
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
      [KES.komp, gar], [KES.kagit, komp], [KES.bozkir, kagit], [KES.aksam, bozkir], [KES.kagit2, function (t, a) { aksam(t, a, false); }],
      [KES.son, kagit], [Infinity, function (t, a) { aksam(t, a, true); }]
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
      // kabir, kıyamet ve Allahü teâlâdan söz edilen kâğıt bölümlerinde yazı sahnenin kendisidir; altyazı ve dokunma oyunu yoktur
      altyazisiz: function (t) { return kagitYazisi || (t >= KES.kagit && t < D.kim - 0.3) || (t >= KES.kagit2 && t < KES.son); },
      // İsrâfîl aleyhisselâmın adı anılırken oyun yoktur
      dokun: function () {
        var t = api.t();
        if (t >= AN[16] - 0.2 && t < AN[17]) return true;
        return false;
      }
    };
  };
})();
