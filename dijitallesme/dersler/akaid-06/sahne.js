/* Akaid 6 · Kendi Bedenimiz — sahne: "Yaşayan Minyatür", Mardin'de bal rengi taştan bir ev ve bedenin içi; bir yaz günü.
   İki katman sırayla gelir: evin içi ve dışı (gün ilerler) ile bedenin içi (koyu kobalt, altın tezhipli organ sayfaları).
   Ders tek sahnede dönmez: tezhipli sayfada atan kalp ve kalp çizgisiyle açılır; sabah avlusunda yan yatmış bisiklet ve
   yara bandı kutusu sırrı kurar; gece penceresinde ilk soru; kalp sayfasında nar ile boy, yüz bin atış, damarlara itilen kan;
   dolaşım haritası; şafak penceresinde derin nefes; akciğer, nar ağacının ters dönüp bronş ağacına dönüşmesi; keselerin yakın
   planında oksijen ve kirli hava; kubbe kasla nefes (durak 2); taraçada kahvaltı; sindirim sayfası, baş aşağı dönen sayfa,
   midede ezilme, ince bağırsaktan kana karışma (durak 3); beyin; öğle avlusunda kameraya uçan top ve eğilme; sinir yolları;
   organ madalyonları (durak 4); ikindi odasında bayram hatırası; kuyumcuda hassas terazi (durak 5); yine gece penceresi
   (durak 6); Allahü teâlâdan söz edilen bölümde boya çekilir, kâğıt ve yazı kalır; deri kesitinde yara adım adım kapanır;
   avluda bisiklet yeniden ayakta; yarayı kapatanın Allahü teâlâ olduğu yine kâğıtta yazılır; ders akşamüstü Mardin'inde biter. Her olay anlatıcının kelimesine bağlıdır (t); a ortam saatidir.
   Yön: pencere ve taraça güneye, ovaya bakar: doğu solda, Güneş solda doğar, akşam ışığı sağdan gelir; avluya kapıdan,
   kuzeye bakılır: sabah ışığı sağdan gelir. Ay tam yuvarlaktır, yüzsüzdür, hilâl yoktur.
   Fizik: kalp iki vuruşlu atar (küt-küt); kan kalpten akciğere gidip oksijen alır, kalbe döner, vücuda dağılır, geri akmaz.
   Kubbe kas inince akciğer uzar ve genişler, hava girer; kas kalkınca akciğer küçülür, hava çıkar; akciğer hiç boşalmaz.
   Lokmayı yemek borusunun kas dalgası iter; sayfa ters dönünce de mideye gider. Top yay çizer, kamera eğilince üstten geçer.
   Terazinin kolu kefeler hep dik asılıyken döner; ağır gelen kefe iner, sönümlü salınır; tüy ve köpük çok az indirir.
   Yara sırası: tıpa, kabuk, bekçi hücreler, kenarlardan yeni deri, kabuğun düşmesi.
   İnsan figürü, yüz, el, göz ve iskelet yoktur; kan yalnız küçük mercan noktalarla gösterilir. */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-06'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['gece-pencere', 'safak-pencere', 'avlu', 'teras', 'oda-ikindi', 'kuyumcu', 'aksam-mardin', 'organ-sayfa', 'alveol',
      'deri-yara', 'deri-iyi', 'kagit', 'kalp', 'akciger', 'diyafram', 'sindirim', 'mide', 'beyin', 'nar', 'nar-agaci', 'bisiklet-yatik',
      'bisiklet', 'top', 'yara-bandi', 'ekmek', 'terazi-ayak', 'terazi-kol', 'terazi-kefe', 'balon', 'tuy'];
    var liste = {};
    GORSELLER.forEach(function (a) { liste[a] = api.yol('gorsel/' + a + '.webp'); });
    var hazir = T.yukle(liste, api.yukleniyor);

    /* ——— zaman ve yumuşatma ——— */
    function ic(t, a, d) { return Math.min(1, Math.max(0, (t - a) / (d || 1))); }
    var Y = {
      cik: function (x) { var u = 1 - x; return 1 - u * u * u; },
      gir: function (x) { return x * x * x; },
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

    /* ——— anlatıcıya bağlı anlar ——— */
    var D = {}; ['uyku', 'nefes', 'lokma', 'gorev', 'terazi', 'veren'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {}; for (var n0 = 0; n0 <= 72; n0++) AN[n0] = C(n0);
    var W = {
      kut1: kel('küt', 1), kut2: kel('küt', 2), kut3: kel('küt', 3), kut4: kel('küt', 4), kut5: kel('küt', 5), dogmadan: kel('doğmadan'),
      bisiklet: kel('bisikletten'), kaybolmus: kel('kaybolmuş'), dikis: kel('dikiş'), yumruk: kel('Yumruğun'), yuz: kel('yüz'),
      damar: kel('damarlara'), dakika: kel('dakika'), nefesAl: kel('nefes', 1), ters: kel('ters'), salkim: kel('salkımı'), kana1: kel('kana', 1),
      kirli: kel('kirli'), kubbe: kel('kubbe'), ceker: kel('çeker'), yirmi: kel('yirmi'), ekmek: kel('ekmeğe'), yuttun: kel('yuttun'),
      boru: kel('borusundan'), bas: kel('baş'), dalga: kel('dalga', 1), midede: kel('midede'), corba: kel('çorba'), ince: kel('ince', 1),
      suzulur: kel('süzülür'), karisir: kel('karışır'), beyin1: kel('beynin', 1), gozun: kel('gözün'), beyin2: kel('beynin', 2),
      egil: kel('eğilirsin'), sinir: kel('sinirlerde'), tren: kel('trenden'), dusun: kel('düşünürsün'), anla: kel('anlarsın'),
      hatirla: kel('hatırlarsın', 1), bayram: kel('bayramı'), sever: kel('seversin'), tipa: kel('tıpa'), kabuk: kel('kabuk', 1),
      bekci: kel('bekçi'), kenar: kel('kenarlardan'), bulusur: kel('buluşur'), duser: kel('düşer'), terzi: kel('terzi')
    };
    // bölümler arası kesmeler (cümle başlarına düşer)
    var KES = {
      sir: AN[6] - 0.1, gece: AN[12] - 0.1, kalp: AN[13] - 0.1, dolasim: AN[17] - 0.1, safak: AN[18] - 0.1, akciger: AN[20] - 0.1,
      alveol: AN[22] - 0.1, nefes: AN[25] - 0.1, teras: AN[30] - 0.1, sindirim: AN[32] - 0.1, beyin: AN[40] - 0.1, top: AN[41] - 0.1,
      sinir: AN[43] - 0.1, gorev: AN[45] - 0.1, oda: AN[46] - 0.1, kuyumcu: AN[50] - 0.1, gece2: AN[53] - 0.1, kagit: AN[59] - 0.3,
      sirCoz: AN[62] - 0.2, avluSon: AN[69] - 0.1, kagit2: AN[70] - 0.3, son: AN[71] - 0.2
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
    var YARA = P(800, 290);                                                           // deri kesitinde yaranın ortası
    var AKIS = [
      ['sen doğmadan önce başladı', 'etiket', 800, 96, W.dogmadan, AN[4] + 0.2],
      ['o günden beri hiç durmadı', 'etiket', 800, 96, AN[4] + 0.2, KES.sir - 0.2],
      ['bir iki hafta sonra: yara yok', 'etiket', 800, 96, AN[8] + 0.3, AN[10]],
      ['?', 'sor', 0, 0, AN[10], KES.gece - 0.3, 'kutu'],
      ['yumruğun kadar', 'etiket', 800, 96, W.yumruk, AN[15]],
      ['her atışta kan damarlara', 'etiket', 800, 96, AN[16] + 0.2, KES.dolasim - 0.2],
      ['bütün vücut: bir dakika kadar', 'etiket', 800, 96, W.dakika - 0.2, KES.safak - 0.2],
      ['ters dönmüş bir ağaç', 'etiket', 800, 96, W.ters + 1.2, KES.alveol - 0.2],
      ['üzüm salkımı gibi keseler', 'etiket', 800, 96, W.salkim, AN[23]],
      ['oksijen kana geçer', 'etiket', 800, 96, AN[23] + 0.1, AN[24]],
      ['kirli hava dışarı', 'etiket', 800, 96, AN[24] + 0.2, KES.nefes - 0.2],
      ['kubbe kas', 'etiket', 1130, 600, W.kubbe, D.nefes - 0.7],
      ['günde yirmi bin nefes', 'etiket', 800, 96, W.yirmi, KES.teras - 0.2],
      ['yemek borusu', 'etiket', 560, 150, W.boru, AN[34]],
      ['baş aşağı bile', 'etiket', 800, 96, W.bas + 0.4, AN[35] - 0.2],
      ['mide', 'etiket', 1110, 240, W.midede, AN[36]],
      ['ince bağırsak', 'etiket', 450, 560, W.ince, D.lokma - 0.7],
      ['kan', 'etiket', 1290, 476, W.karisir, D.lokma - 0.7],
      ['haber merkezi: beyin', 'etiket', 800, 96, W.beyin1 - 0.2, KES.top - 0.2],
      ['sinirler: haber yolları', 'etiket', 800, 96, W.sinir, AN[44]],
      ['hızlı trenden bile hızlı', 'etiket', 800, 96, W.tren - 0.3, D.gorev - 0.7],
      ['düşünmek', 'etiket', 430, 180, W.dusun, KES.kuyumcu - 0.3],
      ['anlamak', 'etiket', 800, 130, W.anla, KES.kuyumcu - 0.3],
      ['hatırlamak', 'etiket', 1170, 180, W.hatirla, KES.kuyumcu - 0.3],
      ['sevmek', 'etiket', 800, 230, W.sever, KES.kuyumcu - 0.3],
      ['Kalbini, akciğerini, bütün bedenini ve rûhunu yaratan, Allahü teâlâdır.', 'kagit', 800, 300, AN[59], AN[62] - 0.5],
      ['Sen uyurken de kalbini O çalıştırır.', 'kagit', 800, 530, AN[60], AN[61] - 0.3],
      ['Atan kalbin, aldığın nefes, düşünen aklın; hepsi Onun sana verdiği nimetlerdir.', 'kagit', 800, 560, AN[61], AN[62] - 0.5],
      ['tıpa', 'etiket', 800, 96, W.tipa, AN[65]],
      ['kabuk', 'etiket', 800, 96, W.kabuk, AN[66]],
      ['bekçi hücreler', 'etiket', 800, 96, W.bekci, AN[67]],
      ['kenarlardan yeni deri', 'etiket', 800, 96, W.kenar, AN[68]],
      ['O terziyi içine koyan, yarayı kapatan Allahü teâlâdır.', 'kagit', 800, 420, AN[70], AN[71] - 0.5],
      ['Gelecek ders: Rahmân ve Rahîm', 'etiket', 800, 110, AN[71] + 0.2, AN[72] + 0.9]
    ].map(function (s) { return { e: yazi(s[0], s[1], s[2], s[3]), kagit: /^kagit/.test(s[1]), bas: s[4], son: s[5], dunya: s[6] || null, x: s[2], y: s[3] }; });
    var kagitYazisi = false, KUTU = P(1505, 742);
    function yazilar(t) {
      kagitYazisi = false;
      AKIS.forEach(function (s) {
        var o = pencere(t, s.bas, s.son, s.kagit ? 0.8 : 0.3, 0.4);
        if (s.dunya === 'kutu' && o > 0.003) { var p = T.ekran(KUTU[0] + 70, KUTU[1] - 110, 1); s.e._x = p.x; s.e._y = p.y; }
        gos(s.e, o, s.kagit ? kr(8, 0, tw(t, s.bas, 0.8)) : 0);
        if (s.kagit && o > 0.2) kagitYazisi = true;
      });
    }
    // "Günde yüz bin kereden fazla": sayı akar
    var SAYI = yazi('0', 'sayi', 800, 170);
    var sayiSon = '';
    function sayiYaz(t) {
      var o = pencere(t, W.yuz - 0.1, AN[16] + 0.4, 0.3, 0.4);
      if (o > 0.003) {
        var n = Math.round(100000 * Y.cik(ic(t, W.yuz, 1.6)) / 100) * 100;
        var m = n.toLocaleString('tr-TR') + (n >= 100000 ? '+' : '');
        if (m !== sayiSon) { SAYI.textContent = m; sayiSon = m; }
      }
      gos(SAYI, o);
    }

    /* ——— SVG ——— */
    var defs = E2('defs', {}, svg);
    var dg = E2('linearGradient', { id: 'kd6-cerceve', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    [['0', '#f3d584'], ['1', '#c9972f']].forEach(function (d) { E2('stop', { offset: d[0], 'stop-color': d[1] }, dg); });
    function yol(oz) { var p = E2('path', Object.assign({ d: 'M0 0', fill: 'none' }, oz || {}), svg); p.style.opacity = 0; p._o = 0; return p; }
    function gizle(p) { if (p._o !== 0) { p.style.opacity = 0; p._o = 0; } }
    function goster(p, d, o) { if (o <= 0.003) { gizle(p); return; } p.setAttribute('d', d); p.style.opacity = o; p._o = o; }
    function f1(x) { return x.toFixed(1); }
    function daire(cx, cy, r) { return 'M' + f1(cx - r) + ' ' + f1(cy) + ' a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0 a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
    function cizgi(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]); }).join(' '); }
    var halkalar = [0, 1, 2, 3, 4, 5].map(function () { return yol({ stroke: '#ffe29a', 'stroke-width': 4 }); });
    var atisHalka = [0, 1, 2].map(function () { return yol({ stroke: '#ffd38a', 'stroke-width': 4 }); });
    var ekg = yol({ stroke: '#f3d584', 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    var ekgIz = yol({ stroke: 'rgba(243,213,132,0.25)', 'stroke-width': 10, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    var dolasimYol = [0, 1].map(function (i) { return yol({ stroke: i ? 'rgba(96,110,210,0.8)' : 'rgba(232,86,62,0.9)', 'stroke-width': 16, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); });
    var agDamar = [0, 1, 2, 3, 4, 5, 6, 7].map(function () { return yol({ stroke: 'rgba(232,96,70,0.85)', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); });
    var halka2 = [0, 1, 2].map(function () { return yol({ stroke: 'rgba(243,213,132,0.9)', 'stroke-width': 4, 'stroke-dasharray': '7 7' }); });
    var boru = [0, 1].map(function () { return yol({ stroke: '#fff1c8', 'stroke-width': 5, 'stroke-linecap': 'round' }); });
    var mideDalga = [0, 1, 2].map(function () { return yol({ stroke: 'rgba(255,236,190,0.85)', 'stroke-width': 4, 'stroke-linecap': 'round' }); });
    var damarGolge = yol({ stroke: 'rgba(70,14,10,0.7)', 'stroke-width': 20, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    var damar = yol({ stroke: '#e8603f', 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    var gosterge = [0, 1, 2, 3].map(function () { return yol({ stroke: 'rgba(243,213,132,0.85)', 'stroke-width': 2.5, 'stroke-dasharray': '4 6' }); });
    var sinirGolge = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function () { return yol({ stroke: 'rgba(8,12,40,0.55)', 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); });
    var sinirler = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function () { return yol({ stroke: '#e9c46a', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); });
    var isaret = yol({ stroke: 'rgba(255,230,160,0.95)', 'stroke-width': 3, 'stroke-dasharray': '3 8', 'stroke-linecap': 'round' });
    var madalyon = [0, 1, 2, 3].map(function () { return yol({ stroke: 'url(#kd6-cerceve)', 'stroke-width': 6 }); });
    var kopuk = [0, 1].map(function (i) { return yol({ stroke: i ? 'rgba(180,230,255,0.9)' : 'rgba(255,200,240,0.7)', 'stroke-width': i ? 3 : 2, fill: i ? 'rgba(220,240,255,0.12)' : 'none' }); });
    var yeniDeri = [0, 1].map(function () { return yol({ fill: '#f6e3bd', stroke: '#d9a93f', 'stroke-width': 2 }); });
    var kabukYol = yol({ fill: '#6b2a1c', stroke: '#3f160d', 'stroke-width': 3 });
    var SVG_HEPSI = [ekg, ekgIz, damarGolge, damar, isaret, kabukYol].concat(halkalar, atisHalka, dolasimYol, agDamar, halka2, boru, mideDalga, gosterge, sinirGolge, sinirler, madalyon, kopuk, yeniDeri);
    var kullanildi = [];
    function kullan(p) { kullanildi.push(p); }

    /* ——— ortak yardımcılar ——— */
    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    function ekranR(x, y, r) { var e = T.ekran(x, y, 1), e2 = T.ekran(x + r, y, 1); return { x: e.x, y: e.y, r: e2.x - e.x }; }
    function isima(x, y, r, renk, o) { var s = ekranR(x, y, r); T.iz(s.x, s.y, s.r, s.r, 0, renk[0], renk[1], renk[2], o); T.izBitir(); }
    function halka(i, x, y, r, o) { goster(halkalar[i], daire(x, y, r), o); kullan(halkalar[i]); }
    function dunyaHalka(i, x, y, r, o) { var e = ekranR(x, y, r); halka(i, e.x, e.y, e.r, o); }
    function hazirla(pts) { var L = [0]; for (var i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { p: pts, L: L, top: L[L.length - 1] }; }
    function uzerinde(y, s) {
      var h = sinirla(s, 0, 1) * y.top, i = 1;
      while (i < y.L.length - 1 && y.L[i] < h) i++;
      var a = y.p[i - 1], b = y.p[i], k = (h - y.L[i - 1]) / ((y.L[i] - y.L[i - 1]) || 1);
      return [kr(a[0], b[0], k), kr(a[1], b[1], k), Math.atan2(b[1] - a[1], b[0] - a[0])];
    }
    // köşeleri yumuşatılmış çizgi (Catmull-Rom → Bezier)
    function yumusak(pts) {
      if (pts.length < 3) return cizgi(pts);
      var d = 'M' + f1(pts[0][0]) + ' ' + f1(pts[0][1]);
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        d += ' C' + f1(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + f1(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f1(p2[0]) + ' ' + f1(p2[1]);
      }
      return d;
    }
    function dunyaCizgi(pts) { return cizgi(pts.map(function (p) { var e = T.ekran(p[0], p[1], 1); return [e.x, e.y]; })); }
    function boyut(ad) { return T.boyut(ad); }
    // görselin içindeki bir noktanın (oran) sahnedeki yeri: görsel (x, y)'de, h yüksekliğinde, (ax, ay) dayanakla çizildiyse
    function icNokta(ad, x, y, h, ax, ay, fx, fy) { var b = boyut(ad), g = h * b.g / b.h; return [x + (fx - ax) * g, y + (fy - ay) * h]; }
    function yildizlar(a, o, x0, x1, y0, y1, n) {
      if (o <= 0.01) return;
      for (var i = 0; i < n; i++) {
        var p = T.ekran(x0 + hash(i, 1) * (x1 - x0), y0 + hash(i, 2) * (y1 - y0), 1), k = 0.5 + 0.5 * Math.sin(a * (0.7 + hash(i, 3)) + i * 1.7), b = 1.2 + hash(i, 4) * 1.6;
        T.iz(p.x, p.y, b, b, 0, 1, 0.95, 0.82, o * k);
      }
      T.izBitir();
    }
    // kalp atışı: iki vuruş (küt-küt); u 0..1 atış evresi
    function vurus(u) { return Math.exp(-Math.pow((u - 0.06) / 0.045, 2)) + 0.55 * Math.exp(-Math.pow((u - 0.26) / 0.05, 2)); }
    function atisA(a, P) { return vurus(((a % P) + P) % P / P); }
    function kalpCiz(x, y, h, atis, o, carp) { var s = 1 + 0.055 * atis; T.ciz('kalp', { x: x, y: y + h * 0.04, h: h * s, ax: 0.5, ay: 0.54, d: 1, o: o == null ? 1 : o, carp: carp }); }
    // madalyon: altın halka (SVG yalnız çizgi) + içinde koyu kâğıt (tuvalde) + içerik
    function madalyonCiz(i, x, y, r, o, icerik) {
      goster(madalyon[i], daire(x, y, r), o); kullan(madalyon[i]);
      if (o <= 0.01) return;
      T.ciz('kagit', { x: x, y: y, g: r * 2, h: r * 2, d: 0, o: o, kure: { duz: true, isik: 0 }, carp: [0.12, 0.17, 0.4] });
      icerik(o);
    }

    /* ——— durak durumu ——— */
    var mv = 50, mvOnce = 50, mvA = -9, aNow = 0, yerde = {}, secilen = -1, secA = -9, egimOnce = 0, dn = { bas: null, v: 50 };

    /* ——— 0. Kanca: tezhipli sayfada atan kalp, altta kalp çizgisi ——— */
    // atışlar "küt" kelimelerine oturur: aynı aralıkla öncesine ve sonrasına uzar
    var KP = (W.kut3 - W.kut1) / 2 || 0.65;
    function kancaAtis(t) { return vurus((((t - W.kut1 + 0.04) % KP) + KP) % KP / KP); }
    function kanca(t, a) {
      T.bas(a, { x: 800, y: kr(470, 450, tw(t, 0, 3)), z: kr(1.18, 1.0, tw(t, 0.2, 4, Y.sin)) + 0.08 * tw(t, W.dogmadan, 4, Y.sin) });
      plaka('organ-sayfa', { d: 1, parilti: 0.4 });
      var at = kancaAtis(t), o = tw(t, 0.1, 0.8);
      isima(800, 430, 300, [1, 0.45, 0.3], 0.12 * o + 0.08 * at * o);
      kalpCiz(800, 420, 560, at, o);
      // her vuruşta altın halka yayılır
      var u = (((t - W.kut1 + 0.04) % KP) + KP) % KP / KP;
      atisHalka.forEach(function (p, i) { var f = (u + i / 3) % 1; if (i) { gizle(p); return; } var e = ekranR(800, 440, 1); goster(p, daire(e.x, e.y, (240 + f * 260) * e.r), o * 0.6 * (1 - f)); kullan(p); });
      // kalp çizgisi: sağda yazan uç, geçmiş sola kayar; "sen doğmadan önce" deyince soldan başlar
      var ac = tw(t, W.dogmadan - 0.2, 1.6, Y.sin), uc = 1450, x0 = kr(uc, 150, ac), v = 300;
      if (ac > 0.002) {
        var pts = [];
        for (var x = x0; x <= uc; x += 4) {
          var tx = t - (uc - x) / v, ux = (((tx - W.kut1 + 0.04) % KP) + KP) % KP / KP;
          var dy = -Math.exp(-Math.pow((ux - 0.06) / 0.018, 2)) * 90 + Math.exp(-Math.pow((ux - 0.1) / 0.02, 2)) * 34 - Math.exp(-Math.pow((ux - 0.27) / 0.04, 2)) * 26;
          pts.push(T.ekran(x, 790 + dy, 1));
        }
        var d = cizgi(pts.map(function (p) { return [p.x, p.y]; }));
        goster(ekgIz, d, ac * o); goster(ekg, d, ac * o); kullan(ekgIz); kullan(ekg);
        var son = pts[pts.length - 1]; T.iz(son.x, son.y, 9, 9, 0, 1, 0.92, 0.65, ac); T.iz(son.x, son.y, 22, 22, 0, 1, 0.85, 0.5, 0.35 * ac); T.izBitir();
      }
    }

    /* ——— 1. Sır: sabah avlusu; yan yatmış bisiklet, basamakta yara bandı kutusu ——— */
    var BIS = P(560, 790);
    function avlu(t, a, carp) { plaka('avlu', { d: 1, parilti: 0.5, ruzgar: 0.12, carp: carp }); }
    function sir(t, a) {
      var kam = kameraYolu(t, [[KES.sir, { x: 800, y: 470, z: 1.02 }], [W.bisiklet + 0.6, { x: 700, y: 560, z: 1.3 }], [AN[9], { x: 820, y: 560, z: 1.28 }],
        [AN[10], { x: KUTU[0] - 140, y: KUTU[1] - 80, z: 1.55 }], [KES.gece, { x: KUTU[0] - 160, y: KUTU[1] - 90, z: 1.6 }]]);
      T.bas(a, kam);
      avlu(t, a, null);
      T.ciz('bisiklet-yatik', { x: BIS[0], y: BIS[1], g: 420, ax: 0.5, ay: 0.9, d: 1 });
      // ön tekerlek yavaşlayarak döner, durur: tekerleğin üstünde ince ışık parıltıları
      var don = 1 - tw(t, KES.sir, 3.5, Y.cik);
      if (don > 0.02) {
        var tk = icNokta('bisiklet-yatik', BIS[0], BIS[1], 420 * boyut('bisiklet-yatik').h / boyut('bisiklet-yatik').g, 0.5, 0.9, 0.58, 0.82);
        var aci = (t - KES.sir) * 9 * don;
        for (var i = 0; i < 6; i++) { var u = aci + i * Math.PI / 3, e = T.ekran(tk[0] + Math.cos(u) * 52, tk[1] + Math.sin(u) * 26, 1); T.iz(e.x, e.y, 3, 3, 0, 1, 0.95, 0.75, 0.6 * don); }
        T.izBitir();
      }
      T.ciz('yara-bandi', { x: KUTU[0], y: KUTU[1], g: 150, ax: 0.5, ay: 0.85, d: 1 });
      var h = pencere(t, AN[10], KES.gece - 0.3, 0.5, 0.4);
      if (h > 0.01) dunyaHalka(0, KUTU[0], KUTU[1] - 50, 90 * (1 + 0.05 * Math.sin(a * 3)), h);
    }

    /* ——— 2. Gece penceresi (durak 1 ve 6): yataktan pencereye bakış; köşede kalp madalyonu ——— */
    var NAR = P(470, 742), AY = P(1065, 290);
    function gecePencere(t, a, koyu) {
      var c = koyu ? [0.72, 0.76, 0.95] : null;
      plaka('gece-pencere', { d: 1, parilti: 0.45, carp: c });
      var pe = P(360, 130), pe2 = P(1330, 470);
      yildizlar(a, 0.8, pe[0], pe2[0], pe[1] + 40, pe2[1] - 30, 70);
      isima(AY[0], AY[1], 160, [1, 0.92, 0.65], 0.12); isima(AY[0], AY[1], 70, [1, 0.95, 0.78], 0.14);
      // ovadaki köy ışıkları titrer
      for (var i = 0; i < 26; i++) { var p = P(700 + hash(i, 5) * 620, 500 + hash(i, 6) * 80), e = T.ekran(p[0], p[1], 1); T.iz(e.x, e.y, 2.4, 2.4, 0, 1, 0.85, 0.5, 0.45 + 0.35 * Math.sin(a * (1 + hash(i, 7)) + i)); }
      T.izBitir();
      T.ciz('nar', { x: NAR[0], y: NAR[1], h: 116, ax: 0.5, ay: 0.95, d: 1, carp: c || [0.82, 0.84, 1] });
    }
    function gece(t, a) {
      T.bas(a, { x: 800, y: kr(470, 440, tw(t, KES.gece, 4, Y.sin)), z: kr(1.12, 1.04, tw(t, KES.gece, 4, Y.sin)) });
      gecePencere(t, a, false);
      var o = tw(t, AN[12] + 0.6, 0.8);
      madalyonCiz(0, 520, 250, 96, o, function (oo) { kalpCiz(520, 250, 150, atisA(a, 1.05), oo); });
    }
    function gece2(t, a) {
      T.bas(a, { x: 800, y: 440, z: kr(1.02, 1.08, tw(t, KES.gece2, 10, Y.sin)) });
      gecePencere(t, a, true);
      // "Küt, küt": madalyondaki kalp kelimelere vurur, sonra uykudaki gibi yavaş atar
      var k4 = Math.exp(-Math.pow((t - W.kut4 - 0.05) / 0.07, 2)) + Math.exp(-Math.pow((t - W.kut5 - 0.05) / 0.07, 2));
      var at = t < W.kut4 - 0.3 ? atisA(a, 1.05) : t < W.kut5 + 0.5 ? k4 : atisA(a, 1.1);
      var o = tw(t, KES.gece2 + 0.2, 0.8);
      madalyonCiz(0, 800, 290, 150, o, function (oo) { kalpCiz(800, 290, 230, at, oo); });
      if (at > 0.3) { var e = ekranR(800, 290, 1); goster(atisHalka[0], daire(e.x, e.y, (160 + at * 40) * e.r), 0.5 * at * o); kullan(atisHalka[0]); }
    }

    /* ——— 3. Kalp: nar ile boy, yüz bin atış, her atışta damarlara itilen kan ——— */
    var KALP = { x: 800, y: 470, h: 620 };
    // kalbin damarları (görsel içinde oran): aort yayının üç dalı ve akciğer atardamarı
    var KALP_DAMAR = [[[0.5, 0.36], [0.45, 0.2], [0.42, 0.08], [0.4, 0.02]], [[0.5, 0.36], [0.54, 0.16], [0.57, 0.05], [0.57, 0.0]],
      [[0.5, 0.36], [0.62, 0.17], [0.72, 0.08], [0.78, 0.04]], [[0.52, 0.36], [0.66, 0.29], [0.82, 0.24], [0.95, 0.22]]];
    function kalp(t, a) {
      var kam = kameraYolu(t, [[KES.kalp, { x: 800, y: 470, z: 1.14 }], [AN[14], { x: 800, y: 460, z: 1.02 }], [AN[16], { x: 800, y: 450, z: 1.0 }], [KES.dolasim, { x: 800, y: 420, z: 1.12 }]]);
      T.bas(a, kam);
      plaka('organ-sayfa', { d: 1, parilti: 0.4 });
      // önce uykudaki gibi yavaş, "yumruğun kadar"dan sonra gündüz hızında
      var P0 = t < AN[14] ? 1.05 : 0.72, at = atisA(a, P0);
      var yan = pencere(t, W.yumruk - 0.1, AN[16], 0.9, 0.8);
      var hx = kr(KALP.x, 610, yan), hh = kr(KALP.h, 330, yan);
      isima(hx, KALP.y - 20, hh * 0.55, [1, 0.45, 0.3], 0.1 + 0.08 * at);
      kalpCiz(hx, KALP.y, hh, at, 1);
      if (yan > 0.01) T.ciz('nar', { x: kr(1250, 990, yan), y: KALP.y + 150, h: 300, ax: 0.5, ay: 1, d: 1, o: yan });
      // her atışta kan, kalbin üstündeki damarların içinden dışarı doğru itilir: damar boyunca parlak bir dalga akar
      var fo = tw(t, AN[16] - 0.2, 0.6) * (1 - tw(t, KES.dolasim - 0.3, 0.3));
      if (fo > 0.01) {
        var u = (((a % P0) + P0) % P0) / P0;
        KALP_DAMAR.forEach(function (yl, j) {
          var pts = yl.map(function (q) { return icNokta('kalp', hx, KALP.y + hh * 0.04, hh, 0.5, 0.54, q[0], q[1]); });
          var y = hazirla(pts);
          for (var k = 0; k < 3; k++) {
            var f = sinirla(u * 1.6 - k * 0.12, 0, 1), q2 = uzerinde(y, f), e = T.ekran(q2[0], q2[1], 1), zz = ekranR(800, 450, 1).r * hh / 620;
            var g = Math.sin(f * Math.PI) * (1 - k * 0.25);
            T.iz(e.x, e.y, 22 * zz, 22 * zz, 0, 1, 0.55, 0.4, 0.35 * g * fo); T.iz(e.x, e.y, 8 * zz, 8 * zz, 0, 1, 0.9, 0.75, 0.9 * g * fo);
          }
        });
        T.izBitir();
      }
    }

    /* ——— 4. Dolaşım haritası: akciğer, kalp, vücut; kan hep aynı yönde döner ——— */
    var DOL = { ak: [800, 200], kalp: [800, 450] };
    var DOL_YOL = hazirla([[838, 430], [900, 360], [900, 250], [850, 210], [800, 205], [750, 210], [700, 250], [700, 360], [762, 440],
      [700, 520], [560, 620], [520, 740], [640, 800], [800, 790], [960, 800], [1080, 740], [1040, 620], [900, 520], [838, 430]]);
    function dolasim(t, a) {
      T.bas(a, { x: 800, y: kr(470, 460, tw(t, KES.dolasim, 4)), z: kr(1.08, 1.0, tw(t, KES.dolasim, 2)) });
      plaka('organ-sayfa', { d: 1, parilti: 0.4 });
      var o = tw(t, KES.dolasim, 0.8);
      // vücut: kalpten aşağı dağılan ince damar ağı
      var DAL = [[[800, 520], [800, 610]], [[800, 600], [620, 680], [520, 760]], [[800, 600], [980, 680], [1080, 760]], [[700, 650], [690, 770]],
        [[900, 650], [910, 770]], [[620, 700], [580, 820]], [[980, 700], [1020, 820]], [[800, 610], [800, 800]]];
      agDamar.forEach(function (p, i) { goster(p, dunyaCizgi(DAL[i]), o * 0.75); kullan(p); });
      // halka yolu: akciğerden çıkan kan (mercan) kalbe, oradan vücuda; vücuttan dönen (koyu) kalbe, oradan akciğere
      goster(dolasimYol[0], dunyaCizgi(DOL_YOL.p.slice(4, 14)), o * 0.55); goster(dolasimYol[1], dunyaCizgi(DOL_YOL.p.slice(13).concat(DOL_YOL.p.slice(0, 5))), o * 0.5);
      kullan(dolasimYol[0]); kullan(dolasimYol[1]);
      T.ciz('akciger', { x: DOL.ak[0], y: DOL.ak[1] + 10, h: 300, d: 1, o: o });
      kalpCiz(DOL.kalp[0], DOL.kalp[1], 230, atisA(a, 0.72), o);
      for (var i = 0; i < 46; i++) {
        var s = (a * 0.11 + i / 46) % 1, q = uzerinde(DOL_YOL, s), e = T.ekran(q[0], q[1], 1);
        var kizil = s > 0.22 && s < 0.74;   // akciğerden sonra kalbe ve vücuda giden kan oksijenlidir
        T.iz(e.x, e.y, 9, 9, 0, kizil ? 1 : 0.55, kizil ? 0.42 : 0.5, kizil ? 0.32 : 0.95, 0.95 * o); T.iz(e.x, e.y, 4, 4, 0, 1, 0.95, 0.9, 0.8 * o);
      }
      T.izBitir();
      // tek parlak nokta yolu bir kez dolaşır ("bir dakika kadar")
      var bir = ic(t, AN[17] + 0.2, AN[17 + 1] - AN[17] - 0.6);
      if (bir > 0 && bir < 1) { var q2 = uzerinde(DOL_YOL, bir), e2 = T.ekran(q2[0], q2[1], 1); T.iz(e2.x, e2.y, 26, 26, 0, 1, 0.85, 0.55, 0.45); T.iz(e2.x, e2.y, 9, 9, 0, 1, 1, 0.9, 1); T.izBitir(); }
    }

    /* ——— 5. Şafak penceresi: Güneş solda doğar; "derin bir nefes al" deyince hava içeri akar ——— */
    var GUNES = P(648, 468);
    function safak(t, a) {
      var nf = tw(t, AN[19], 1.4, Y.sin);
      T.bas(a, { x: 800, y: kr(450, 440, tw(t, KES.safak, 4)), z: kr(1.1, 1.0, tw(t, KES.safak, 3)) + 0.07 * nf });
      plaka('safak-pencere', { d: 1, parilti: 0.55 });
      isima(GUNES[0], GUNES[1], 260, [1, 0.75, 0.45], 0.18); isima(GUNES[0], GUNES[1], 70, [1, 0.92, 0.7], 0.3);
      // kırlangıçlar: sağa doğru süzülür
      for (var k = 0; k < 4; k++) { var f = (a * 0.06 + k * 0.27) % 1, x = kr(420, 1300, f), y = 250 + k * 30 + Math.sin(f * 9 + k) * 14, e = T.ekran(x, y, 1); T.iz(e.x - 6, e.y, 7, 1.6, -0.35, 0.15, 0.15, 0.3, 0.7); T.iz(e.x + 6, e.y, 7, 1.6, 0.35, 0.15, 0.15, 0.3, 0.7); }
      T.izBitir();
      // hava zerreleri pencereden kameraya doğru akar (nefes alırken), büyüyerek kaybolur
      var ho = tw(t, AN[19] - 0.1, 0.5) * (1 - tw(t, KES.akciger - 0.3, 0.3));
      if (ho > 0.01) {
        for (var i = 0; i < 90; i++) {
          var u = (a * 0.35 + hash(i, 9)) % 1, bx = 420 + hash(i, 10) * 760, by = 180 + hash(i, 11) * 360;
          var px = kr(bx, 800 + (bx - 800) * 2.6, u * u), py = kr(by, 450 + (by - 450) * 2.6, u * u), e3 = T.ekran(px, py, 1), r = 2.5 + u * 9;
          var yon = Math.atan2(py - 450, px - 800), parla = ho * Math.sin(u * Math.PI);
          T.iz(e3.x, e3.y, r * 2.6, r * 0.7, yon, 1, 0.97, 0.88, 0.7 * parla); T.iz(e3.x, e3.y, r * 0.8, r * 0.5, yon, 1, 1, 1, 0.9 * parla);
        }
        T.izBitir();
      }
    }

    /* ——— 6. Akciğer: sayfada yavaş nefes alır; nar ağacı ters döner, bronş ağacına dönüşür ——— */
    var AKC = { x: 800, y: 80, h: 720 };
    function akciger(t, a) {
      T.bas(a, { x: 800, y: kr(430, 450, tw(t, KES.akciger, 3)), z: kr(1.1, 1.0, tw(t, KES.akciger, 3)) });
      plaka('organ-sayfa', { d: 1, parilti: 0.4 });
      var nf = Math.sin(a * 2 * Math.PI / 3.6) * 0.5 + 0.5, s = 1 + 0.025 * nf;
      var ag = ic(t, W.ters - 0.1, 0.4), don = tw(t, W.ters + 0.3, 1.3, Y.ikili), geri = tw(t, W.ters + 1.8, 0.9);
      var aOpak = 1 - 0.85 * Math.min(ag, 1 - geri), o = tw(t, KES.akciger, 0.6);
      T.ciz('akciger', { x: AKC.x, y: AKC.y, h: AKC.h * s, g: AKC.h * s * boyut('akciger').g / boyut('akciger').h * (1 + 0.012 * nf), ax: 0.5, ay: 0, d: 1, o: o * aOpak, parilti: 0.6 * geri });
      // "Havadaki oksijen akciğerine doldu": hava soluk borusundan iner, bronş dallarına dağılır
      var ha = pencere(t, AN[20], W.ters - 0.2, 0.4, 0.4);
      if (ha > 0.01) {
        var hh = AKC.h * s;
        for (var i = 0; i < 60; i++) {
          var f = (a * 0.45 + hash(i, 35)) % 1, sol = i % 2 ? 1 : -1, dal = 0.5 + 0.5 * hash(i, 36);
          var y = f < 0.4 ? AKC.y + hh * kr(0.02, 0.42, f / 0.4) : AKC.y + hh * kr(0.42, 0.42 + 0.45 * dal, (f - 0.4) / 0.6);
          var x = f < 0.4 ? AKC.x : AKC.x + sol * hh * 0.97 * kr(0.02, 0.18 + 0.2 * hash(i, 37), (f - 0.4) / 0.6);
          var e = T.ekran(x, y, 1);
          T.iz(e.x, e.y, 10, 10, 0, 0.75, 0.92, 1, 0.3 * ha * Math.sin(f * Math.PI)); T.iz(e.x, e.y, 4.5, 4.5, 0, 0.92, 0.98, 1, 0.95 * ha * Math.sin(f * Math.PI));
        }
        T.izBitir();
      }
      var to = Math.min(ag, 1 - geri);
      if (to > 0.01) T.ciz('nar-agaci', { x: AKC.x, y: AKC.y + AKC.h * 0.5, h: 620, d: 1, r: 180 * don, o: to });
    }

    /* ——— 7. Keselerin yakın planı: oksijen keselere girip kana geçer, kirli hava dışarı çıkar ——— */
    var KESE = [[890, 140], [1390, 190], [150, 440], [590, 450], [780, 500], [1150, 520], [260, 700], [680, 710], [1560, 620], [1440, 800]].map(function (p) { return P(p[0], p[1]); });
    var GIRIS = [P(30, 50), P(250, 175), P(380, 230)];
    function alveol(t, a) {
      var kam = kameraYolu(t, [[KES.alveol, { x: 800, y: 450, z: 1.0 }], [AN[23], { x: 900, y: 470, z: 1.22 }], [KES.nefes, { x: 860, y: 460, z: 1.3 }]]);
      T.bas(a, kam);
      plaka('alveol', { d: 1, parilti: 0.35 });
      var ox = tw(t, AN[23] - 0.3, 0.8), kh = tw(t, W.kirli - 0.3, 0.8);
      for (var i = 0; i < 70; i++) {
        var hedef = KESE[i % KESE.length], f = (a * 0.18 + hash(i, 12)) % 1, p;
        if (f < 0.45) { var g = f / 0.45; p = g < 0.5 ? [kr(GIRIS[0][0], GIRIS[2][0], g * 2), kr(GIRIS[0][1], GIRIS[2][1], g * 2)] : [kr(GIRIS[2][0], hedef[0], (g - 0.5) * 2), kr(GIRIS[2][1], hedef[1], (g - 0.5) * 2)]; }
        else { var h2 = (f - 0.45) / 0.55; p = [hedef[0] + Math.cos(i * 2.4 + h2 * 3) * 40 * h2, hedef[1] + Math.sin(i * 1.7 + h2 * 3) * 30 * h2]; }
        var kana = f > 0.6 ? Math.min(1, (f - 0.6) / 0.2) : 0, e = T.ekran(p[0], p[1], 1);
        // oksijen: mavi-beyaz; kana geçince mercan olur
        var oo = ox * Math.min(1, f * 6) * (1 - Math.max(0, f - 0.9) * 10), zz = ekranR(800, 450, 1).r;
        T.iz(e.x, e.y, 15 * zz, 15 * zz, 0, kr(0.55, 1, kana), kr(0.85, 0.35, kana), kr(1, 0.25, kana), 0.3 * oo);
        T.iz(e.x, e.y, 7 * zz, 7 * zz, 0, kr(0.82, 0.98, kana), kr(0.96, 0.3, kana), kr(1, 0.22, kana), oo);
        if (kh > 0.01) {   // kirli hava: keseden çıkıp giriş borusundan dışarı
          var f2 = (a * 0.16 + hash(i, 13)) % 1, k2 = KESE[(i + 3) % KESE.length];
          var q = f2 < 0.5 ? [kr(k2[0], GIRIS[2][0], f2 * 2), kr(k2[1], GIRIS[2][1], f2 * 2)] : [kr(GIRIS[2][0], GIRIS[0][0] - 60, (f2 - 0.5) * 2), kr(GIRIS[2][1], GIRIS[0][1] - 40, (f2 - 0.5) * 2)];
          var e2 = T.ekran(q[0], q[1], 1);
          var ko = kh * Math.sin(f2 * Math.PI);
          T.iz(e2.x, e2.y, 10 * zz, 10 * zz, 0, 0.92, 0.92, 0.95, 0.5 * ko); T.iz(e2.x, e2.y, 7 * zz, 7 * zz, 0, 0.25, 0.27, 0.36, 0.95 * ko);
        }
        if (i % 15 === 14) T.izBitir();
      }
      T.izBitir();
    }

    /* ——— 8. Nefes: akciğer, kalp ve kubbe kas; çocuk kası tutup çeker (durak 2) ——— */
    // v: kubbenin yüksekliği (0 en derin nefes, 100 bütün hava verilmiş)
    var NF = { x: 800, ust: 70, tepe: 590, yol: 1.5 };
    function kubbeY(v) { return NF.tepe - (v - 50) * NF.yol; }
    function otoNefes(a, P) { return 50 + 16 * Math.cos(a * 2 * Math.PI / P); }
    function nefesCiz(t, a, v, dv, karanlik) {
      var ky = kubbeY(v), carp = karanlik ? [0.62, 0.66, 0.9] : null;
      // kubbe: inince yassılaşır
      var kh = 300 * kr(0.78, 1.12, v / 100);
      T.ciz('diyafram', { x: NF.x, y: ky - 18, g: 700, h: kh, ax: 0.5, ay: 0, d: 1, carp: carp });
      kalpCiz(NF.x + 40, ky - 120, 230, atisA(a, karanlik ? 1.05 : 0.75), 1, carp);
      // akciğer: soluk borusu üstte sabit, alt kenarı kubbenin tepesine oturur
      var h = (ky - NF.ust) / 0.9, g = h * boyut('akciger').g / boyut('akciger').h * (1 + 0.5 * (h / ((NF.tepe - NF.ust) / 0.9) - 1));
      T.ciz('akciger', { x: NF.x, y: NF.ust, h: h, g: g, ax: 0.5, ay: 0, d: 1, carp: carp });
      // hava: nefes alırken (v azalırken) soluk borusundan aşağı, verirken yukarı akar
      var akis = sinirla(-dv / 40, -1, 1);
      if (Math.abs(akis) > 0.03) {
        for (var i = 0; i < 26; i++) {
          var f = (a * 0.9 + hash(i, 14)) % 1, yy = akis > 0 ? kr(NF.ust - 40, NF.ust + h * 0.4, f) : kr(NF.ust + h * 0.4, NF.ust - 60, f);
          var xx = NF.x + (hash(i, 15) - 0.5) * 30 + (yy > NF.ust + h * 0.36 ? (hash(i, 16) - 0.5) * 160 * ((yy - NF.ust - h * 0.36) / (h * 0.1)) : 0), e = T.ekran(xx, yy, 1);
          T.iz(e.x, e.y, 4, 4, 0, 0.85, 0.95, 1, 0.75 * Math.abs(akis) * Math.sin(f * Math.PI));
        }
        T.izBitir();
      }
    }
    function nefes(t, a) {
      var acik = api.acikDurak() === 'nefes';
      T.bas(a, { x: 800, y: kr(470, 450, tw(t, KES.nefes, 3)), z: kr(1.08, 1.0, tw(t, KES.nefes, 3)) });
      var gecePay = tw(t, W.yirmi - 1.2, 1.2);
      plaka('organ-sayfa', { d: 1, parilti: 0.4, carp: gecePay > 0.01 ? [kr(1, 0.62, gecePay), kr(1, 0.66, gecePay), kr(1, 0.9, gecePay)] : null });
      var v, dv;
      if (acik) { v = mv; dv = aNow - mvA < 0.35 ? (mv - mvOnce) / Math.max(0.05, aNow - mvA) * 0.15 : 0; }
      else if (t < W.ceker - 0.2) { v = 50; dv = 0; }
      else if (t < D.nefes) { var P1 = 3.4; v = otoNefes(a, P1); dv = -16 * Math.sin(a * 2 * Math.PI / P1) * 2 * Math.PI / P1 * 3; }
      else { var P2 = t > W.yirmi - 1.2 ? 4.6 : 3.8; v = otoNefes(a, P2); dv = -16 * Math.sin(a * 2 * Math.PI / P2) * 2 * Math.PI / P2 * 3; }
      nefesCiz(t, a, v, dv, gecePay > 0.5);
      var hk = pencere(t, W.kubbe, D.nefes - 0.4, 0.4, 0.4);
      if (hk > 0.01) dunyaHalka(1, NF.x, kubbeY(v) + 40, 150 * (1 + 0.04 * Math.sin(a * 3)), hk);
    }

    /* ——— 9. Taraçada kahvaltı: ısırılmış ekmek ——— */
    var EKMEK = P(812, 568), KOPAN = P(930, 618);
    function teras(t, a) {
      var kam = kameraYolu(t, [[KES.teras, { x: 800, y: 440, z: 1.02 }], [W.ekmek + 0.3, { x: 800, y: 460, z: 1.08 }], [AN[31], { x: EKMEK[0] + 40, y: EKMEK[1] - 20, z: 1.6 }], [KES.sindirim, { x: KOPAN[0], y: KOPAN[1] - 10, z: 1.9 }]]);
      T.bas(a, kam);
      plaka('teras', { d: 1, parilti: 0.5 });
      // çaydan ince buhar yükselir
      [P(1043, 410), P(1200, 430)].forEach(function (c, j) { for (var i = 0; i < 8; i++) { var f = (a * 0.3 + i / 8 + j * 0.4) % 1, e = T.ekran(c[0] + Math.sin(f * 7 + i) * 10, c[1] - f * 90, 1); T.iz(e.x, e.y, 5 + f * 6, 5 + f * 6, 0, 1, 1, 1, 0.16 * (1 - f)); } });
      T.izBitir();
      var h = pencere(t, W.yuttun - 0.4, KES.sindirim, 0.4, 0.3);
      if (h > 0.01) dunyaHalka(0, KOPAN[0], KOPAN[1], 52 * (1 + 0.05 * Math.sin(a * 3)), h);
    }

    /* ——— 10. Sindirim: lokma yemek borusunda itilir; sayfa baş aşağı döner; mide ezer; bağırsakta süzülüp kana karışır (durak 3) ——— */
    var SD = { x: 800, y: 482, h: 776 };
    function SN(fx, fy) { return icNokta('sindirim', SD.x, SD.y, SD.h, 0.5, 0.5, fx, fy); }
    var LOKMA_YOL = [[0.49, 0.0], [0.49, 0.1], [0.49, 0.19], [0.52, 0.235], [0.58, 0.26], [0.66, 0.3], [0.7, 0.33], [0.62, 0.39], [0.5, 0.4], [0.42, 0.38],
      [0.34, 0.37], [0.28, 0.41], [0.29, 0.47], [0.33, 0.52], [0.42, 0.55], [0.55, 0.54], [0.66, 0.57], [0.62, 0.62], [0.48, 0.61], [0.36, 0.64],
      [0.32, 0.7], [0.45, 0.72], [0.6, 0.7], [0.7, 0.74], [0.6, 0.79], [0.45, 0.8]];
    var BORU_S = 0.155, MIDE_S = 0.27;   // yol üstünde yemek borusunun ve midenin bittiği yerler (oran)
    var sdYol = null, damarYol = null;
    function sdHazir() {
      if (sdYol) return;
      sdYol = hazirla(LOKMA_YOL.map(function (p) { return SN(p[0], p[1]); }));
      damarYol = hazirla([SN(0.6, 0.63), SN(0.82, 0.6), SN(1.02, 0.56), [1110, 488], [1190, 476]]);
    }
    function don(p, aci) { if (!aci) return p; var c = Math.cos(aci), s = Math.sin(aci), x = p[0] - 800, y = p[1] - 450; return [800 + x * c - y * s, 450 + x * s + y * c]; }
    function sindirim(t, a) {
      sdHazir();
      var acik = api.acikDurak() === 'lokma', sonra = t > D.lokma + 0.05 && !acik;
      var kam = kameraYolu(t, [[KES.sindirim, { x: 800, y: 470, z: 1.04 }], [W.boru, { x: 800, y: 300, z: 1.5 }], [W.bas - 0.2, { x: 800, y: 380, z: 1.3 }],
        [W.bas + 0.3, { x: 800, y: 450, z: 1.0 }], [W.midede - 0.2, { x: 800, y: 450, z: 1.0 }], [W.midede + 0.5, { x: 870, y: 330, z: 1.55 }],
        [W.ince - 0.1, { x: 860, y: 380, z: 1.4 }], [W.ince + 0.7, { x: 820, y: 560, z: 1.35 }], [AN[37], { x: 800, y: 470, z: 1.0 }], [AN[38], { x: 800, y: 450, z: 1.0 }]]);
      T.bas(a, kam);
      // baş aşağı: sayfa 180° döner, lokma yine mideye doğru gider; sonra geri döner
      var aci = Math.PI * (tw(t, W.bas - 0.1, 1.0, Y.ikili) - tw(t, AN[35] - 0.9, 0.85, Y.ikili)), drc = aci * 180 / Math.PI;
      plaka('organ-sayfa', { d: 1, parilti: 0.4, r: drc });
      var c0 = don([SD.x, SD.y], aci);
      T.ciz('sindirim', { x: c0[0], y: c0[1], h: SD.h, d: 1, r: drc });
      // damar (kan): bağırsaktan sağa uzanır; içinde mercan noktalar akar
      var dmo = Math.max(tw(t, W.suzulur - 0.2, 0.8), acik || sonra ? 1 : 0);
      if (dmo > 0.01) {
        var dd = dunyaCizgi(damarYol.p.map(function (p) { return don(p, aci); }));
        goster(damarGolge, dd, dmo); goster(damar, dd, dmo); kullan(damarGolge); kullan(damar);
        for (var j = 0; j < 14; j++) { var q = uzerinde(damarYol, (a * 0.22 + j / 14) % 1), qe = T.ekran.apply(null, don(q, aci).concat([1])); T.iz(qe.x, qe.y, 4, 4, 0, 1, 0.75, 0.62, 0.9 * dmo); }
        T.izBitir();
      }
      // lokmanın yolu: yemek borusu → mide → bağırsak
      var s;
      if (acik || sonra) s = -1;
      else if (t < W.boru - 0.2) s = 0;
      else if (t < W.midede - 0.3) s = kr(0, BORU_S, Y.sin(ic(t, W.boru - 0.2, W.midede - 0.5 - W.boru)));
      else if (t < W.ince - 0.2) s = kr(BORU_S, MIDE_S, ic(t, W.midede - 0.3, 0.8));
      else s = kr(MIDE_S, 1, ic(t, W.ince - 0.2, W.karisir - W.ince + 0.6));
      if (s >= 0) {
        var q0 = uzerinde(sdYol, s), qp = don(q0, aci), ez = s >= MIDE_S - 0.001 ? 1 : tw(t, W.corba - 0.2, 0.8) * (s > BORU_S ? 1 : 0);
        if (s < MIDE_S - 0.02 && ez < 0.5) {
          var eb = T.ekran(qp[0], qp[1], 1), zz = ekranR(800, 450, 1).r;
          T.iz(eb.x, eb.y, 26 * zz, 22 * zz, q0[2] + aci, 1, 0.9, 0.6, 0.35); T.iz(eb.x, eb.y, 15 * zz, 12 * zz, q0[2] + aci, 0.96, 0.82, 0.55, 1); T.iz(eb.x, eb.y, 9 * zz, 7 * zz, q0[2] + aci, 1, 0.95, 0.8, 1); T.izBitir();
          // yemek borusunun kas dalgası: lokmanın arkasında boru halka gibi sıkışır
          if (s < BORU_S + 0.005) {
            var arka = uzerinde(sdYol, Math.max(0, s - 0.03)), dk = arka[2] + Math.PI / 2;
            [-1, 1].forEach(function (yon, k) {
              var m = don([arka[0] + Math.cos(dk) * 16 * yon, arka[1] + Math.sin(dk) * 16 * yon], aci), m2 = don([arka[0] + Math.cos(dk) * 6 * yon, arka[1] + Math.sin(dk) * 6 * yon], aci);
              goster(boru[k], dunyaCizgi([m, m2]), 0.9); kullan(boru[k]);
            });
          }
        }
        // midede ezilip çorba olan lokma: küçük noktalar halinde ilerler
        if (ez > 0.01 || s >= MIDE_S) {
          var n = 26;
          for (var i = 0; i < n; i++) {
            var si = s >= MIDE_S ? Math.max(MIDE_S, s - i * 0.006) : s, qi = uzerinde(sdYol, si), dx = (hash(i, 17) - 0.5) * 34 * ez, dy = (hash(i, 18) - 0.5) * 26 * ez;
            if (s < MIDE_S) { dx += Math.cos(a * 2 + i) * 10 * ez; dy += Math.sin(a * 2.3 + i) * 8 * ez; }
            var pi = don([qi[0] + dx, qi[1] + dy], aci), ei = T.ekran(pi[0], pi[1], 1);
            T.iz(ei.x, ei.y, 5, 5, 0, 0.98, 0.86, 0.6, 0.95);
          }
          T.izBitir();
        }
        // midenin duvarı dalga dalga sıkar
        var mo = pencere(t, W.midede - 0.1, W.ince - 0.2, 0.3, 0.4);
        if (mo > 0.01) {
          var mc = SN(0.7, 0.32);
          mideDalga.forEach(function (p, i) {
            var f = (a * 0.8 + i / 3) % 1, r = 40 + f * 70, pts = [];
            for (var k = 0; k <= 16; k++) { var u = -1.9 + k / 16 * 1.6; pts.push(don([mc[0] + Math.cos(u) * r * 1.2, mc[1] + Math.sin(u) * r], aci)); }
            goster(p, dunyaCizgi(pts), mo * (1 - f)); kullan(p);
          });
        }
        // bağırsakta işe yarayan kısım (altın noktalar) damara geçer
        var ko = tw(t, W.suzulur - 0.1, 0.6);
        if (ko > 0.01 && s > 0.5) {
          for (var b = 0; b < 16; b++) { var f2 = (a * 0.45 + b / 16) % 1, q2 = uzerinde(damarYol, f2 * 0.6), qq = don([q2[0], q2[1] + Math.sin(b + a * 3) * 6], aci), e2 = T.ekran(qq[0], qq[1], 1); T.iz(e2.x, e2.y, 4.5, 4.5, 0, 1, 0.88, 0.35, ko * (1 - f2 * 0.6)); }
          T.izBitir();
        }
      } else {
        // durakta ve sonrasında fabrika hep çalışır: yol boyunca lokmalar akar
        for (var i2 = 0; i2 < 22; i2++) {
          var f3 = (a * 0.05 + i2 / 22) % 1, q3 = uzerinde(sdYol, f3), e3 = T.ekran(q3[0], q3[1], 1);
          T.iz(e3.x, e3.y, f3 < BORU_S ? 8 : 4.5, f3 < BORU_S ? 6.5 : 4.5, q3[2], 0.98, 0.86, 0.6, acik ? 0.55 : 0.9);
        }
        T.izBitir();
        // yerine oturan adın çizimi altın halkayla parlar
        var ORG = [SN(0.49, 0.1), SN(0.7, 0.32), SN(0.5, 0.66), [1110, 488]];
        ORG.forEach(function (p, i) { if ((yerde[i] && acik) || false) dunyaHalka(2 + i, p[0], p[1], i === 0 ? 40 : 64, 0.85 + 0.15 * Math.sin(a * 3)); });
      }
      // durakta adlar ile çizimler arasında ince işaret çizgileri
      var go = acik ? 1 : 0;
      var GOS = [[[648, 150], SN(0.47, 0.1)], [[1030, 240], SN(0.8, 0.29)], [[540, 560], SN(0.3, 0.64)]];
      gosterge.forEach(function (p, i) { if (go && GOS[i]) { goster(p, dunyaCizgi(GOS[i]), 0.85); kullan(p); } });
    }

    /* ——— 11. Beyin: haber merkezi ——— */
    function beyin(t, a) {
      T.bas(a, { x: 800, y: 440, z: kr(1.12, 1.0, tw(t, KES.beyin, 3.2)) });
      plaka('organ-sayfa', { d: 1, parilti: 0.4 });
      T.ciz('beyin', { x: 800, y: 420, g: 640, d: 1, o: tw(t, KES.beyin, 0.6) });
      // kıvrımlarda küçük haber ışıkları yanıp söner
      for (var i = 0; i < 28; i++) { var e = T.ekran(560 + hash(i, 19) * 470, 240 + hash(i, 20) * 260, 1), f = Math.pow(Math.max(0, Math.sin(a * (1.5 + hash(i, 21) * 2) + i * 2.1)), 6); T.iz(e.x, e.y, 10, 10, 0, 1, 0.9, 0.55, 0.65 * f); T.iz(e.x, e.y, 3, 3, 0, 1, 1, 0.9, f); }
      T.izBitir();
    }

    /* ——— 12. Öğle avlusu: top kameraya doğru uçar; göz haber verir, beyin hesap yapar, kamera eğilir ——— */
    function top(t, a) {
      var eg = tw(t, W.egil - 0.05, 0.35, Y.ikili);
      T.bas(a, { x: 800, y: kr(430, 560, eg), z: 1.16 });
      avlu(t, a, [1.05, 1.0, 0.92]);
      // ağır çekim: önce yavaş, eğilirken hızlanır; boyu uzaklığın tersiyle büyür
      var u = Y.gir(ic(t, AN[41] + 0.2, W.egil + 0.45 - AN[41] - 0.2)) * 0.55 + 0.45 * ic(t, AN[41] + 0.2, W.egil + 0.45 - AN[41] - 0.2);
      if (u < 1) {
        var bas = P(836, 640), uzak = 1 - 0.93 * u, g = 46 / uzak;
        var x = kr(bas[0], 930, u), y = kr(bas[1], -260, u * u) - 120 * Math.sin(Math.PI * Math.min(1, u * 1.2)) * 0.4;
        T.ciz('top', { x: x, y: y, g: g, d: 1, r: u * 540 });
      }
      // göz haber verir (top ile beyin madalyonu arasında ışık), beyin hesap yapar
      var mo = pencere(t, W.gozun - 0.2, W.egil + 0.2, 0.4, 0.3);
      if (mo > 0.01) {
        var flas = Math.exp(-Math.pow((t - W.beyin2 - 0.4) / 0.35, 2));
        madalyonCiz(0, 220, 190, 92, mo, function (oo) { T.ciz('beyin', { x: 220, y: 190, g: 150, d: 0, o: oo, ekle: [0.3 * flas, 0.22 * flas, 0.05 * flas] }); });
        var sg = tw(t, W.gozun, 0.9), b0 = P(836, 640), b1 = T.ekran(b0[0], b0[1], 1);
        goster(isaret, cizgi([[b1.x, b1.y], [kr(b1.x, 280, sg), kr(b1.y, 230, sg)]]), mo); kullan(isaret);
      }
    }

    /* ——— 13. Sinir yolları: beyinden inen altın yollarda haber ışıkları koşar ——— */
    var SINIR = [[[790, 330], [790, 520], [790, 860]], [[790, 430], [600, 520], [420, 640], [300, 820]], [[790, 430], [980, 520], [1180, 640], [1300, 820]],
      [[790, 560], [640, 640], [560, 800]], [[790, 560], [940, 640], [1040, 800]], [[600, 520], [470, 470], [330, 470]], [[980, 520], [1110, 470], [1270, 470]],
      [[420, 640], [300, 640], [200, 700]], [[1180, 640], [1300, 640], [1400, 700]], [[790, 700], [700, 760], [690, 860]]];
    var sinirYol = SINIR.map(hazirla);
    function sinir(t, a) {
      T.bas(a, { x: 800, y: kr(420, 450, tw(t, KES.sinir, 4)), z: kr(1.1, 1.0, tw(t, KES.sinir, 3)) });
      plaka('organ-sayfa', { d: 1, parilti: 0.4 });
      T.ciz('beyin', { x: 800, y: 215, g: 380, d: 1 });
      var o = tw(t, KES.sinir + 0.1, 1.0);
      sinirler.forEach(function (p, i) {
        var k = tw(t, KES.sinir + 0.1 + i * 0.12, 0.8), d = yumusak(SINIR[i].map(function (q) { var e = T.ekran(q[0], q[1], 1); return [e.x, e.y]; }));
        goster(sinirGolge[i], d, o * k * 0.8); goster(p, d, o * k); kullan(sinirGolge[i]); kullan(p);
      });
      for (var i = 0; i < 20; i++) {
        var yl = sinirYol[i % sinirYol.length], f = (a * (0.5 + hash(i, 22) * 0.4) + hash(i, 23)) % 1, q = uzerinde(yl, f), e = T.ekran(q[0], q[1], 1);
        T.iz(e.x, e.y, 18, 18, 0, 1, 0.88, 0.45, 0.4 * o); T.iz(e.x, e.y, 6, 6, 0, 1, 1, 0.9, o);
      }
      T.izBitir();
      // "hızlı trenden bile hızlı": ana yolda tek ışık iz bırakarak koşar
      var hz = pencere(t, W.tren - 0.2, D.gorev - 0.3, 0.3, 0.3);
      if (hz > 0.01) {
        var f2 = (a * 1.6) % 1, q2 = uzerinde(sinirYol[0], f2);
        for (var k = 0; k < 12; k++) { var q3 = uzerinde(sinirYol[0], Math.max(0, f2 - k * 0.018)), e3 = T.ekran(q3[0], q3[1], 1); T.iz(e3.x, e3.y, 7 - k * 0.4, 7 - k * 0.4, 0, 1, 0.95, 0.7, hz * (1 - k / 12)); }
        var e2 = T.ekran(q2[0], q2[1], 1); T.iz(e2.x, e2.y, 22, 22, 0, 1, 0.9, 0.55, 0.5 * hz); T.izBitir();
      }
    }

    /* ——— 14. Organ madalyonları (durak 4: eşleştirmede sahne kararır) ——— */
    var MAD = [['kalp', 330, 300, 200], ['akciger', 640, 260, 196], ['mide', 960, 260, 180], ['beyin', 1270, 300, 150]];
    function gorev(t, a) {
      var es = api.acikDurak() === 'gorev' ? 1 : 0;
      T.bas(a, { x: 800, y: 450, z: kr(1.04, 1, tw(t, KES.gorev, 4, Y.sin)) });
      plaka('organ-sayfa', { d: 1, parilti: 0.4, carp: es ? [0.5, 0.52, 0.66] : null });
      MAD.forEach(function (m, i) {
        var o = es ? 0 : tw(t, KES.gorev + 0.1 + i * 0.25, 0.7);   // eşleştirme açıkken resimler kartlarda; sahnedeki madalyonlar çekilir
        madalyonCiz(i, m[1], m[2], 112 * kr(0.85, 1, o), o, function (oo) {
          if (m[0] === 'kalp') kalpCiz(m[1], m[2], m[3] * 0.82, atisA(a, 0.75), oo);
          else T.ciz(m[0], { x: m[1], y: m[2], h: m[0] === 'beyin' ? m[3] * 0.82 : m[3], d: 0, o: oo });
        });
      });
    }

    /* ——— 15. İkindi odası: bayram hatırası; düşünmek, anlamak, hatırlamak, sevmek ——— */
    var AYAKKABI = P(780, 820), SEKER = P(990, 800);
    function oda(t, a) {
      var kam = kameraYolu(t, [[KES.oda, { x: 800, y: 440, z: 1.04 }], [W.bayram, { x: 860, y: 600, z: 1.38 }], [W.sever + 0.6, { x: 860, y: 580, z: 1.3 }], [KES.kuyumcu, { x: 800, y: 470, z: 1.12 }]]);
      T.bas(a, kam);
      plaka('oda-ikindi', { d: 1, parilti: 0.5 });
      // pencereden giren güneş huzmeleri ve içinde toz zerreleri; huzme zamanla yere doğru kayar
      var pe = P(1560, 300), kay = ic(t, KES.oda, KES.kuyumcu - KES.oda) * 40;
      for (var i = 0; i < 6; i++) { var hd = P(980 - i * 60 - kay, 880), q = T.ekran(kr(pe[0], hd[0], 0.5), kr(pe[1], hd[1], 0.5), 1); T.iz(q.x, q.y, 520, 22, Math.atan2(hd[1] - pe[1], hd[0] - pe[0]), 1, 0.9, 0.6, 0.05 + 0.02 * Math.sin(a * 0.5 + i)); }
      for (var j = 0; j < 40; j++) { var s = (hash(j, 24) + a * 0.01 * (0.5 + hash(j, 25))) % 1, z = T.ekran(kr(pe[0], 900, s) + (hash(j, 26) - 0.5) * 200, kr(pe[1], 860, s) + Math.sin(a + j) * 6, 1); T.iz(z.x, z.y, 2, 2, 0, 1, 0.95, 0.8, 0.5 * Math.sin(s * Math.PI)); }
      T.izBitir();
      var bh = pencere(t, W.bayram, W.sever + 0.6, 0.4, 0.5);
      if (bh > 0.01) { dunyaHalka(0, AYAKKABI[0], AYAKKABI[1], 105, bh); dunyaHalka(1, SEKER[0], SEKER[1], 80, bh); isima(AYAKKABI[0], AYAKKABI[1], 160, [1, 0.85, 0.55], 0.1 * bh); }
    }

    /* ——— 16. Kuyumcu: hassas terazi; çocuğun seçtiği şey kefeye konur (durak 5) ——— */
    var TZ = { x: 800, taban: P(836, 760)[1], h: 430, kol: 460, kefe: 260 };
    var EGIM = [-9, -3, -1.5, 0];   // balon, tüy, köpük, hatıra (sol kefe iner)
    function teraziEgim() {
      var hedef = secilen >= 0 && secilen < 3 ? EGIM[secilen] : 0, dt = Math.max(0, aNow - secA);
      return hedef + (egimOnce - hedef) * Math.exp(-dt * 2.2) * Math.cos(dt * 5.5);   // sönümlü salınım
    }
    function kuyumcu(t, a) {
      var acik = api.acikDurak() === 'terazi';
      var kam = kameraYolu(t, [[KES.kuyumcu, { x: 800, y: 470, z: 1.12 }], [AN[50] + 1.4, { x: 800, y: 450, z: 1.04 }], [AN[52], { x: 800, y: 450, z: 1.04 }], [KES.gece2, { x: 800, y: 440, z: 1.0 }]]);
      T.bas(a, kam);
      var los = tw(t, AN[52], 2.4);
      plaka('kuyumcu', { d: 1, parilti: 0.5, carp: los > 0.01 ? [kr(1, 0.82, los), kr(1, 0.78, los), kr(1, 0.72, los)] : null });
      [P(397, 232), P(1277, 232)].forEach(function (l) { isima(l[0], l[1], 120, [1, 0.8, 0.45], 0.16 + 0.04 * Math.sin(a * 2)); });
      var pivot = [TZ.x, TZ.taban - TZ.h * 0.99];
      T.ciz('terazi-ayak', { x: TZ.x, y: TZ.taban, h: TZ.h, ax: 0.5, ay: 1, d: 1 });
      var th = (acik || (secilen >= 0 && t < D.terazi + 0.1)) ? teraziEgim() : 0, r = th * Math.PI / 180;
      var kh = TZ.kol * boyut('terazi-kol').h / boyut('terazi-kol').g, uc = [[-0.46 * TZ.kol, (0.82 - 0.15) * kh], [0.46 * TZ.kol, (0.82 - 0.15) * kh]].map(function (d) {
        return [pivot[0] + d[0] * Math.cos(r) - d[1] * Math.sin(r), pivot[1] + d[0] * Math.sin(r) + d[1] * Math.cos(r)];
      });
      // kefeler hep dik asılı kalır; kol döner
      uc.forEach(function (u, i) {
        T.ciz('terazi-kefe', { x: u[0], y: u[1], h: TZ.kefe, ax: 0.5, ay: 0.03, d: 1 });
        if (i === 0 && acik && secilen >= 0 && secilen < 3) {
          var kenar = [u[0], u[1] + TZ.kefe * 0.77];
          if (secilen === 0) T.ciz('balon', { x: kenar[0] + 10, y: kenar[1] - 52, h: 150, r: -78, d: 1 });
          else if (secilen === 1) T.ciz('tuy', { x: kenar[0], y: kenar[1] - 14, h: 70, r: 8, d: 1 });
          else {
            var e = ekranR(kenar[0], kenar[1] - 2, 1), R = 46 * e.r;
            var kub = 'M' + f1(e.x - R) + ' ' + f1(e.y) + ' A' + f1(R) + ' ' + f1(R) + ' 0 0 1 ' + f1(e.x + R) + ' ' + f1(e.y);
            goster(kopuk[1], kub, 0.95); goster(kopuk[0], 'M' + f1(e.x - R * 0.7) + ' ' + f1(e.y - R * 0.5) + ' A' + f1(R * 0.8) + ' ' + f1(R * 0.8) + ' 0 0 1 ' + f1(e.x + R * 0.2) + ' ' + f1(e.y - R * 0.9), 0.8);
            kullan(kopuk[0]); kullan(kopuk[1]);
          }
        }
      });
      T.ciz('terazi-kol', { x: pivot[0], y: pivot[1], g: TZ.kol, ax: 0.5, ay: 0.15, r: th, d: 1 });
    }

    /* ——— 17. Kâğıt: Allahü teâlâdan söz edilen bölüm ——— */
    function kagit(t, a) { T.bas(a, { x: 800, y: 450, z: 1 }); plaka('kagit', { d: 0 }); }

    /* ——— 18. Sırrın çözümü: deri kesitinde yara kapanır ——— */
    function kabukSekli(x, y, g, h, o, aci) {
      var pts = [];
      for (var i = 0; i <= 24; i++) { var u = i / 24 * Math.PI * 2, rr = 1 + 0.09 * Math.sin(u * 7 + 1.3) + 0.05 * Math.sin(u * 13), px = Math.cos(u) * g * rr, py = Math.sin(u) * h * rr * (Math.sin(u) > 0 ? 1.1 : 0.6); pts.push([x + px * Math.cos(aci) - py * Math.sin(aci), y + px * Math.sin(aci) + py * Math.cos(aci)]); }
      return dunyaCizgi(pts) + 'Z';
    }
    function sirCoz(t, a) {
      var kam = kameraYolu(t, [[KES.sirCoz, { x: 800, y: 430, z: 1.05 }], [AN[63] + 0.4, { x: YARA[0], y: YARA[1] + 90, z: 1.75 }], [AN[66], { x: YARA[0], y: YARA[1] + 110, z: 1.95 }],
        [AN[68], { x: YARA[0], y: YARA[1] + 80, z: 1.7 }], [KES.avluSon, { x: YARA[0], y: YARA[1] + 60, z: 1.45 }]]);
      T.bas(a, kam);
      var iyi = tw(t, W.duser + 0.1, 1.4);
      plaka('deri-yara', { d: 1, parilti: 0.3 });
      if (iyi > 0.01) plaka('deri-iyi', { d: 1, parilti: 0.3, o: iyi });
      var hl = pencere(t, AN[63], AN[64] + 0.3, 0.4, 0.4); if (hl > 0.01) dunyaHalka(0, YARA[0], YARA[1] + 6, 70, hl);
      // tıpa: kılcal damarlardan gelen kan noktaları yaranın ağzında toplanır
      var tp = tw(t, W.tipa - 0.6, 2.2), kb = tw(t, W.kabuk - 0.2, 1.2), dus = tw(t, W.duser, 1.4, Y.sin);
      if (tp > 0.01 && kb < 1) {
        for (var i = 0; i < 60; i++) {
          var f = Math.min(1, tp * 1.4 - hash(i, 27) * 0.4), hx = YARA[0] + (hash(i, 28) - 0.5) * 120, hy = YARA[1] + 140 + hash(i, 29) * 60;
          var tx = YARA[0] + (hash(i, 30) - 0.5) * 120 * (1 - 0.4 * hash(i, 31)), ty = YARA[1] + 8 + (hash(i, 32) - 0.5) * 22;
          if (f <= 0) continue;
          var e = T.ekran(kr(hx, tx, f), kr(hy, ty, f), 1), zz = ekranR(800, 450, 1).r;
          T.iz(e.x, e.y, 6 * zz, 6 * zz, 0, 0.82, 0.18, 0.14, Math.min(1, f * 2) * (1 - kb));
        }
        T.izBitir();
      }
      // kabuk: tıpanın üstü kurur, koyulaşır; sonunda kalkıp düşer
      if (kb > 0.01) {
        var ky = YARA[1] + 4 - dus * 90, kx = YARA[0] + dus * 50;
        goster(kabukYol, kabukSekli(kx, ky, 78, 20, kb, dus * 0.5), kb * (1 - tw(t, W.duser + 0.8, 0.6))); kullan(kabukYol);
      }
      // bekçi hücreler mikropları kovalar ve temizler
      var bk = pencere(t, W.bekci - 0.3, W.kenar + 0.6, 0.4, 0.6);
      if (bk > 0.01) {
        for (var j = 0; j < 7; j++) {
          var mx = YARA[0] + (hash(j, 33) - 0.5) * 220, my = YARA[1] + 40 + hash(j, 34) * 70, son = W.bekci + 0.4 + j * 0.3, yok = tw(t, son, 0.4);
          var me = T.ekran(mx + Math.sin(a * 4 + j) * 4, my + Math.cos(a * 3 + j) * 3, 1);
          var zm = ekranR(800, 450, 1).r; T.iz(me.x, me.y, 9 * zm, 6 * zm, j, 0.9, 1, 0.75, 0.5 * bk * (1 - yok)); T.iz(me.x, me.y, 7 * zm, 4.5 * zm, j, 0.16, 0.45, 0.14, bk * (1 - yok));
          var bx = kr(YARA[0] + (j % 2 ? 160 : -160), mx, ic(t, W.bekci - 0.2 + j * 0.2, son + 0.3 - (W.bekci - 0.2 + j * 0.2))), by = kr(YARA[1] + 160, my, ic(t, W.bekci - 0.2 + j * 0.2, son + 0.3 - (W.bekci - 0.2 + j * 0.2)));
          var be = T.ekran(bx, by, 1), zb = ekranR(800, 450, 1).r;
          T.iz(be.x, be.y, 16 * zb, 13 * zb, a + j, 0.97, 0.97, 0.93, 0.85 * bk); T.iz(be.x, be.y, 6 * zb, 6 * zb, 0, 0.75, 0.72, 0.85, 0.8 * bk);
        }
        T.izBitir();
      }
      // yeni deri: kabuğun altında iki kenardan ortaya doğru ilerler
      var yd = tw(t, W.kenar - 0.1, W.bulusur - W.kenar + 0.2, Y.sin) * (1 - iyi);
      if (yd > 0.01) {
        [-1, 1].forEach(function (yon, k) {
          var x0 = YARA[0] + yon * 82, x1 = kr(x0, YARA[0] + yon * 2, yd), ust = YARA[1] - 18, alt = YARA[1] + 30;
          goster(yeniDeri[k], dunyaCizgi([[x0, ust], [kr(x0, x1, 0.6), ust + 8], [x1, (ust + alt) / 2 + 4], [kr(x0, x1, 0.6), alt - 6], [x0, alt]]) + 'Z', 0.95); kullan(yeniDeri[k]);
        });
      }
    }

    /* ——— 19. Avlu, bir hafta sonra: bisiklet yine ayakta ——— */
    function avluSon(t, a) {
      T.bas(a, { x: kr(760, 800, tw(t, KES.avluSon, 5, Y.sin)), y: 520, z: kr(1.3, 1.2, tw(t, KES.avluSon, 5, Y.sin)) });
      avlu(t, a, null);
      T.ciz('bisiklet', { x: BIS[0] + 20, y: BIS[1], g: 380, ax: 0.5, ay: 0.98, d: 1 });
    }

    /* ——— 20. Kapanış: akşamüstü Mardin, kamera geriye çekilir ——— */
    function kapanis(t, a) {
      var ak = tw(t, KES.son, 5, Y.sin);
      T.bas(a, { x: kr(520, 800, ak), y: kr(480, 450, ak), z: kr(1.6, 1.02, ak) });
      plaka('aksam-mardin', { d: 1, parilti: 0.6, ruzgar: 0.12 });
      var gs = P(1512, 412); isima(gs[0], gs[1], 260, [1, 0.72, 0.4], 0.16); isima(gs[0], gs[1], 70, [1, 0.9, 0.7], 0.28);
    }

    /* ——— perde: kesmelerde kısa bir an lacivert (kâğıt bölümünde krem) karartma ——— */
    var LACI = [0.07, 0.11, 0.3], KREM = [1, 1, 1];
    var PERDE = [[KES.sir], [KES.gece], [KES.kalp], [KES.dolasim], [KES.safak], [KES.akciger], [KES.alveol], [KES.nefes], [KES.teras], [KES.sindirim],
      [KES.beyin], [KES.top], [KES.sinir], [KES.gorev], [KES.oda], [KES.kuyumcu], [KES.gece2], [KES.kagit, KREM], [KES.sirCoz, KREM], [KES.avluSon], [KES.kagit2, KREM], [KES.son, KREM]];
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
      [KES.sir, kanca], [KES.gece, sir], [KES.kalp, gece], [KES.dolasim, kalp], [KES.safak, dolasim], [KES.akciger, safak], [KES.alveol, akciger],
      [KES.nefes, alveol], [KES.teras, nefes], [KES.sindirim, teras], [KES.beyin, sindirim], [KES.top, beyin], [KES.sinir, top], [KES.gorev, sinir],
      [KES.oda, gorev], [KES.kuyumcu, oda], [KES.gece2, kuyumcu], [KES.kagit, gece2], [KES.sirCoz, kagit], [KES.avluSon, sirCoz], [KES.kagit2, avluSon], [KES.son, kagit],
      [Infinity, kapanis]
    ];
    function ciz(t, a) {
      aNow = a; kullanildi = [];
      for (var i = 0; i < BOLUM.length; i++) { if (t < BOLUM[i][0]) { BOLUM[i][1](t, a); break; } }
      SVG_HEPSI.forEach(function (p) { if (kullanildi.indexOf(p) < 0) gizle(p); });
      perde(t);
      yazilar(t);
      sayiYaz(t);
    }

    return {
      hazir: hazir,
      ciz: ciz,
      // Allahü teâlâdan söz edilen kâğıt bölümünde yazı sahnenin kendisidir; altyazı ve dokunma oyunu yoktur
      altyazisiz: function (t) { return kagitYazisi || (t >= KES.kagit && t < KES.sirCoz) || (t >= KES.kagit2 && t < KES.son); },
      durak: function (id, olay, veri) {
        if (id === 'nefes' && olay === 'deger') { mvOnce = mv; mv = veri; mvA = aNow; }
        if (id === 'lokma') { if (olay === 'dogru') yerde[veri] = true; if (olay === 'ac') yerde = {}; }
        if (id === 'terazi') {
          if (olay === 'ac') { secilen = -1; egimOnce = 0; }
          if (olay === 'sec') { egimOnce = teraziEgim(); secilen = veri; secA = aNow; }
        }
      },
      // Kubbe kas: çocuk kubbenin tepesindeki tutamacı aşağı yukarı çeker (aşağı: nefes alır)
      tutamac: function (id, deger) { return { x: NF.x, y: kubbeY(deger) + 20, r: 80, ust: false }; },
      // değer parmağın ne kadar kaydığıyla değişir; tutulduğu yerden başlar, sıçramaz
      tutDeger: function (id, x, y, bas) {
        if (bas !== dn.bas) { dn.bas = bas; dn.v = bas ? bas.deger : mv; dn.y = bas ? bas.y : y; }
        return sinirla(dn.v + (dn.y - y) / NF.yol, 0, 100);
      }
    };
  };
})();
