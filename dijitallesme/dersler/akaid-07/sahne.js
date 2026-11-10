/* Akaid 7 · Rahmân ve Rahîm — sahne: "Yaşayan Minyatür", Kars'ta Çıldır Gölü kıyısında karlı bir köy; bir kış günü.
   Üç katman sırayla gelir: evin içi ve köy (gün ilerler), karın altı (kesit sayfaları), yazın yaylası (sütün yolu).
   Ders tek sahnede dönmez: kış sabahı odada istemeden gelenler sayılır (ışık, süt); köyde sır kurulur, iki boş altın çerçeve;
   odada nimet sayma (durak 1); köyün her yerinde altın kıvılcımlar; Allahü teâlâdan ve isimlerinden söz edilen bölümde boya
   çekilir, kâğıt ve yazı kalır; kar yağan köy ve üç soru madalyonu; göl kesitinde buz parçası yüzer, balıklar dipte yüzer;
   tarla kesitinde kar örtüsünün üstü soğuk, altı sıcak; ormanda sincap; inde uyuyan ayı (durak 2, eşleştirme); köyde dört
   madalyon; sofrada süt bardağı; ahırda ot yiyen inek; yazın yaylası ve yağmur; bulut, ot ve inekten sütün yolu (durak 3);
   ahırda buzağısını yalayan inek (durak 4); yine kâğıt; karda üşüyen kedi (durak 5: doğru cevapta su ve yemek konur);
   akşam odası; besmele kâğıtta yazılır, içindeki iki isim altınla belirir; ders baharda biter.
   Her olay anlatıcının kelimesine bağlıdır (t); a ortam saatidir.
   Yön: köy gölün güney kıyısında, bakış kuzeye, göle: doğu sağda. Kış Güneşi alçak ve arkamızda, gölgeler kısa ve yumuşak.
   Oda penceresi güneye bakar: odaya bakan doğuyu solda görür, sabah ışığı soldan girer, sağ duvara düşer (oda görseli aynalandı).
   Fizik: göl yüzeyden donar; buz sudan hafiftir, suda yükselip buzun altına yapışır; balıklar dipte yavaş yüzer. Kar örtüsünün
   üstü soğuk, altı sıcak kalır. Sincap kış uykusuna yatmaz, dalda durur; ayı inde uyur, yavaş nefes alır. Yağmur buluttan aşağı
   yağar; sütün yolu gökten sofraya tek yönlüdür. Yeni doğan buzağı titrek bacaklarla kalkar; annesi onu yalar.
   İnsan figürü, yüz, el yoktur. Allahü teâlânın isimleri hiçbir durakta sürüklenmez ya da dokunulmaz; yalnız kâğıtta yazıdır. */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-07'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['oda', 'oda-aksam', 'koy', 'bahar', 'gol-kesit', 'orman', 'in', 'tarla', 'yayla', 'ahir', 'kapi', 'kagit',
      'sut-gugumu', 'sut-bardagi', 'yun-corap', 'balik', 'sincap', 'ayi', 'filiz', 'inek', 'buzagi', 'kedi', 'kap', 'kaz', 'ot-yigini', 'bulut'];
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
    var D = {}; ['nimet', 'kis', 'sut', 'veren', 'kedi'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {}; for (var n0 = 0; n0 <= 85; n0++) AN[n0] = C(n0);
    var W = {
      isik: kel('ışık'), gunes: kel("Güneş'e"), sut1: kel('süt', 1), ver: kel('ver'), liste: kel('liste'), nerede: kel('nerede'),
      yuva: kel('yuva'), aile: kel('aile'), saymaya: kel('saymaya'), bitmez: kel('bitmez'),
      rahman1: kel('rahmân', 1), rahim1: kel('rahîm', 1), herkese: kel('herkese'),
      kar: kel('kar', 1), balik: kel('balık', 1), sincap1: kel('sincap', 1), ayi1: kel('ayı', 1), dondu: kel('dondu'),
      hafif: kel('hafiftir'), batmaz: kel('batmaz'), kapak: kel('kapak'), yuzer: kel('yüzer'), sardi: kel('sardı'),
      sincap2: kel('sincap', 2), ayi2: kel('ayı', 2), kuru: kel('kuru'), yaylada: kel('yaylada'), yagmur1: kel('yağmur', 1),
      inek2: kel('inek', 2), ot4: kel('ot', 4), yagmur2: kel('yağmur', 2), hicbiri: kel('hiçbiri'), sirayla: kel('sırayla'),
      sebeptir: kel('sebeptir'), yaliyor: kel('yalıyor'), kalkmaya: kel('kalkmaya'), sefkati: kel('şefkati', 1),
      kedi: kel('kedi'), usuyor: kel('üşüyor'), yemege: kel('yemeğe'), derse: kel('derse'), ise: kel('işe'), besmele: kel('besmele'),
      rahman3: kel('rahmân', 3), rahim2: kel('rahîm', 2), lokmadan: kel('lokmadan')
    };
    // bölümler arası kesmeler (cümle başlarına düşer)
    var KES = {
      koy: AN[10] - 0.1, oda2: AN[16] - 0.1, koy2: AN[20] - 0.1, kagit: AN[24] - 0.3, kis: AN[33] - 0.1, gol: AN[36] - 0.1,
      tarla: AN[39] - 0.1, orman: AN[41] - 0.1, inn: AN[42] - 0.1, azik: AN[43] - 0.1, sofra: AN[44] - 0.1, ahir1: AN[46] - 0.1,
      yayla: AN[49] - 0.1, sebep: AN[52] - 0.1, ahir2: AN[59] - 0.1, kagit2: AN[64] - 0.3, kapi: AN[71] - 0.1, aksam: AN[76] - 0.1,
      kagit3: AN[82] - 0.3, son: AN[84] - 0.2
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
    function PM(px, py) { return P(1672 - px, py); }                                 // aynalanan oda görselinin ham pikseli
    var ALTIN = '#a8741c';
    var AKIS = [
      ['istemeden aldıkların', 'etiket', 800, 96, W.isik, KES.koy - 0.3],
      ['bugün iki isim', 'etiket', 800, 96, AN[11], AN[14] - 0.1],
      ['nimet: sana verilen iyilik', 'etiket', 800, 96, AN[21], KES.kagit - 0.3],
      ['Bütün bu nimetleri veren, Allahü teâlâdır.', 'kagit', 800, 420, AN[24], AN[25] - 0.4],
      ['Allahü teâlânın güzel isimleri vardır. Bu isimleri bize kendisi bildirdi.', 'kagit', 800, 340, AN[25], AN[28] - 0.4],
      ['Biz Ona kendimiz isim koyamayız.', 'kagit', 800, 560, AN[27], AN[28] - 0.4],
      ['İsimleri çoktur; doksan dokuzu bize bildirildi.', 'kagit', 800, 340, AN[28], AN[30] - 0.4],
      ['esmâ-i hüsnâ: en güzel isimler', 'kagit', 800, 540, AN[29], AN[30] - 0.4],
      ['Rahmân', 'kagit iri', 560, 300, W.rahman1, KES.kis - 0.3, 'altin'],
      ['Rahîm', 'kagit iri', 1040, 300, W.rahim1, KES.kis - 0.3, 'altin'],
      ['Rahmân: dünyada bütün canlılara nimet veren.', 'kagit', 800, 520, AN[31], KES.kis - 0.3],
      ['Hiç ayırmadan, herkese.', 'kagit', 800, 650, W.herkese, KES.kis - 0.3],
      ['kar her yeri örttü', 'etiket', 800, 96, W.kar, AN[35] - 0.1],
      ['göl üstten donar', 'etiket', 800, 96, W.dondu, AN[37]],
      ['buz sudan hafif: üstte kalır', 'etiket', 800, 96, AN[37] + 0.2, AN[38]],
      ['altında su donmaz', 'etiket', 800, 96, AN[38] + 0.1, KES.tarla - 0.2],
      ['kar: kalın bir örtü', 'etiket', 800, 96, W.sardi - 0.4, AN[40]],
      ['dışarısı buz gibi', 'etiket', 800, 96, AN[40], KES.orman - 0.2],
      ['örtünün altı daha sıcak', 'etiket', 800, 700, AN[40] + 1.2, KES.orman - 0.2],
      ['kuru ot', 'etiket', 800, 96, W.kuru, AN[49]],
      ['yazın yaylada yeşerdi', 'etiket', 800, 96, AN[49] + 0.1, W.yagmur1 - 0.1],
      ['yağmur yağdı', 'etiket', 800, 96, W.yagmur1, KES.sebep - 0.2],
      ['her biri bir sebep', 'etiket', 800, 96, W.sebeptir, D.sut - 0.7],
      ['annesi yanından ayrılmıyor', 'etiket', 800, 96, AN[61] + 0.6, AN[62] - 0.1],
      ['Yağmuru yağdıran, otu yeşerten, ineğe hem sütü hem şefkati veren Allahü teâlâdır.', 'kagit', 800, 330, AN[64], AN[66] - 0.4],
      ['Bu sabahki sütü sana veren de Odur.', 'kagit', 800, 570, AN[65], AN[66] - 0.4],
      ['Bir annenin yavrusuna merhameti büyüktür.', 'kagit', 800, 330, AN[66], AN[68] - 0.4],
      ['Allahü teâlânın kullarına merhameti, bundan çok daha fazladır.', 'kagit', 800, 540, AN[67], AN[68] - 0.4],
      ['O, Rahmândır: dünyada bütün canlılara nimet verir.', 'kagit', 800, 300, AN[68], KES.kapi - 0.4],
      ['O, Rahîmdir: merhameti çoktur. Âhırette de Ona inanan kullarına sonsuz ikram edecektir.', 'kagit', 800, 540, AN[69], KES.kapi - 0.4],
      ['merhametli olmak: güzel huy', 'etiket', 800, 96, AN[71] + 0.2, AN[72] - 0.1],
      ['yemeğe başlarken', 'etiket', 380, 120, W.yemege, KES.kagit3 - 0.3],
      ['derse otururken', 'etiket', 800, 120, W.derse, KES.kagit3 - 0.3],
      ['bir işe başlarken', 'etiket', 1220, 120, W.ise, KES.kagit3 - 0.3],
      ['besmele', 'etiket', 800, 240, W.besmele, KES.kagit3 - 0.3],
      ['Rahmân', 'kagit iri', 560, 560, W.rahman3, KES.son - 0.4, 'altin'],
      ['Rahîm', 'kagit iri', 1040, 560, W.rahim2, KES.son - 0.4, 'altin'],
      ['Yani her lokmadan önce, o nimeti verenin adını anıyorsun.', 'kagit', 800, 730, AN[83], KES.son - 0.4],
      ['Gelecek ders: Bilir, görür, işitir, her şeye gücü yeter', 'etiket', 800, 110, AN[84] + 0.2, AN[85] + 0.9]
    ].map(function (s) {
      var e = yazi(s[0], s[1], s[2], s[3]);
      if (s[6] === 'altin') e.style.color = ALTIN;
      return { e: e, kagit: /^kagit/.test(s[1]), bas: s[4], son: s[5], x: s[2], y: s[3] };
    });
    // besmele: Latin harfle, sessiz; içindeki iki isim altınla belirir. Sabit durur, dokunulmaz.
    var BES_P = ['Bismillâhir', 'rahmân', 'ir', 'rahîm'].map(function (m) { return el('span', { text: m }); });
    var BES = el('div', { class: 'kd-y kagit iri' }, BES_P);
    BES.style.width = 'auto'; BES.style.whiteSpace = 'nowrap'; BES._x = 800; BES._y = 340; BES._o = -1; api.yazi.appendChild(BES);
    var kagitYazisi = false;
    function renkKar(k) { var a = [23, 48, 127], b = [168, 116, 28]; return 'rgb(' + a.map(function (v, i) { return Math.round(kr(v, b[i], k)); }).join(',') + ')'; }
    function yazilar(t) {
      kagitYazisi = false;
      AKIS.forEach(function (s) {
        var o = pencere(t, s.bas, s.son, s.kagit ? 0.8 : 0.3, 0.4);
        gos(s.e, o, s.kagit ? kr(8, 0, tw(t, s.bas, 0.8)) : 0);
        if (s.kagit && o > 0.2) kagitYazisi = true;
      });
      var ob = pencere(t, AN[82], KES.son - 0.4, 0.9, 0.4);
      gos(BES, ob, kr(8, 0, tw(t, AN[82], 0.9)));
      if (ob > 0.003) {
        BES_P[1].style.color = renkKar(tw(t, W.rahman3 - 0.1, 0.6));
        BES_P[3].style.color = renkKar(tw(t, W.rahim2 - 0.1, 0.6));
        kagitYazisi = true;
      }
    }
    // sayaç: istemeden aldıkların
    var SAYI = yazi('0', 'sayi', 800, 180), sayiSon = '';
    function sayiGos(n, o, x, y) {
      var m = n >= 10000 ? '9999+' : String(n);
      if (m !== sayiSon) { SAYI.textContent = m; sayiSon = m; }
      SAYI._x = x; SAYI._y = y; gos(SAYI, o);
    }

    /* ——— SVG ——— */
    var defs = E2('defs', {}, svg);
    var dg = E2('linearGradient', { id: 'kd7-cerceve', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    [['0', '#f3d584'], ['1', '#c9972f']].forEach(function (d) { E2('stop', { offset: d[0], 'stop-color': d[1] }, dg); });
    function yol(oz) { var p = E2('path', Object.assign({ d: 'M0 0', fill: 'none' }, oz || {}), svg); p.style.opacity = 0; p._o = 0; return p; }
    function gizle(p) { if (p._o !== 0) { p.style.opacity = 0; p._o = 0; } }
    function goster(p, d, o) { if (o <= 0.003) { gizle(p); return; } p.setAttribute('d', d); p.style.opacity = o; p._o = o; }
    function f1(x) { return x.toFixed(1); }
    function daire(cx, cy, r) { return 'M' + f1(cx - r) + ' ' + f1(cy) + ' a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0 a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
    function cizgi(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]); }).join(' '); }
    function kutu(cx, cy, w, h, r) {
      var x0 = cx - w / 2, y0 = cy - h / 2;
      return 'M' + f1(x0 + r) + ' ' + f1(y0) + ' H' + f1(x0 + w - r) + ' Q' + f1(x0 + w) + ' ' + f1(y0) + ' ' + f1(x0 + w) + ' ' + f1(y0 + r) +
        ' V' + f1(y0 + h - r) + ' Q' + f1(x0 + w) + ' ' + f1(y0 + h) + ' ' + f1(x0 + w - r) + ' ' + f1(y0 + h) + ' H' + f1(x0 + r) +
        ' Q' + f1(x0) + ' ' + f1(y0 + h) + ' ' + f1(x0) + ' ' + f1(y0 + h - r) + ' V' + f1(y0 + r) + ' Q' + f1(x0) + ' ' + f1(y0) + ' ' + f1(x0 + r) + ' ' + f1(y0) + 'Z';
    }
    var halkalar = [0, 1, 2, 3, 4, 5, 6, 7].map(function () { return yol({ stroke: '#ffe29a', 'stroke-width': 4 }); });
    var madalyon = [0, 1, 2, 3].map(function () { return yol({ stroke: 'url(#kd7-cerceve)', 'stroke-width': 6 }); });
    var cerceve = [0, 1].map(function () { return yol({ stroke: 'url(#kd7-cerceve)', 'stroke-width': 6 }); });
    var cerceveIc = [0, 1].map(function () { return yol({ stroke: 'rgba(201,151,47,0.55)', 'stroke-width': 2, 'stroke-dasharray': '6 7' }); });
    var buzParca = yol({ fill: 'rgba(232,246,255,0.92)', stroke: 'rgba(255,255,255,0.95)', 'stroke-width': 3, 'stroke-linejoin': 'round' });
    var sutYolGolge = yol({ stroke: 'rgba(20,16,8,0.45)', 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    var sutYol = yol({ stroke: '#f3d584', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': '2 16' });
    var sutYolDolu = yol({ stroke: '#ffe8a8', 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    var SVG_HEPSI = [buzParca, sutYolGolge, sutYol, sutYolDolu].concat(halkalar, madalyon, cerceve, cerceveIc);
    var kullanildi = [];
    function kullan(p) { kullanildi.push(p); }

    /* ——— ortak yardımcılar ——— */
    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    function ekranR(x, y, r) { var e = T.ekran(x, y, 1), e2 = T.ekran(x + r, y, 1); return { x: e.x, y: e.y, r: e2.x - e.x }; }
    function isima(x, y, r, renk, o) { var s = ekranR(x, y, r); T.iz(s.x, s.y, s.r, s.r, 0, renk[0], renk[1], renk[2], o); T.izBitir(); }
    function halka(i, x, y, r, o) { goster(halkalar[i], daire(x, y, r), o); kullan(halkalar[i]); }
    function dunyaHalka(i, x, y, r, o) { var e = ekranR(x, y, r); halka(i, e.x, e.y, e.r, o); }
    function dunyaCizgi(pts) { return cizgi(pts.map(function (p) { var e = T.ekran(p[0], p[1], 1); return [e.x, e.y]; })); }
    function hazirla(pts) { var L = [0]; for (var i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { p: pts, L: L, top: L[L.length - 1] }; }
    function uzerinde(y, s) {
      var h = sinirla(s, 0, 1) * y.top, i = 1;
      while (i < y.L.length - 1 && y.L[i] < h) i++;
      var a = y.p[i - 1], b = y.p[i], k = (h - y.L[i - 1]) / ((y.L[i] - y.L[i - 1]) || 1);
      return [kr(a[0], b[0], k), kr(a[1], b[1], k)];
    }
    // madalyon: altın halka (SVG yalnız çizgi) + içinde koyu kâğıt (tuvalde) + içerik
    function madalyonCiz(i, x, y, r, o, icerik) {
      var e = ekranR(x, y, r);
      goster(madalyon[i], daire(e.x, e.y, e.r), o); kullan(madalyon[i]);
      if (o <= 0.01) return;
      T.ciz('kagit', { x: x, y: y, g: r * 2, h: r * 2, d: 1, o: o, kure: { duz: true, isik: 0 }, carp: [0.12, 0.17, 0.4] });
      icerik(o);
    }
    // kar yağışı ekranın önünde (kameradan bağımsız)
    function kar(a, o, n, hiz, iri) {
      if (o <= 0.01) return;
      for (var i = 0; i < n; i++) {
        var hz = (26 + hash(i, 53) * 34) * (hiz || 1), x = hash(i, 51) * 1700 - 50 + Math.sin(a * 0.7 + i * 1.3) * 16;
        var y = ((hash(i, 52) * 980 + a * hz) % 980) - 40, r = (1.6 + hash(i, 54) * 2.8) * (iri || 1);
        T.iz(x, y, r, r, 0, 1, 1, 1, o * (0.5 + 0.5 * hash(i, 55)));
        if (i % 800 === 799) T.izBitir();
      }
      T.izBitir();
    }
    // baca dumanı (dünya noktaları)
    function duman(pts, a, o) {
      if (o <= 0.01) return;
      pts.forEach(function (p, k) {
        for (var j = 0; j < 10; j++) {
          var f = (a * 0.22 + j / 10 + k * 0.37) % 1, e = T.ekran(p[0] + Math.sin(f * 6 + k) * 10 + f * 26, p[1] - f * 120, 1), r = (7 + f * 18) * ekranR(800, 450, 1).r;
          T.iz(e.x, e.y, r, r, 0, 0.96, 0.97, 1, 0.24 * (1 - f) * o);
        }
      });
      T.izBitir();
    }
    // altın kıvılcım (bir nimetin üstünde)
    function kivilcim(x, y, a, o, s) {
      if (o <= 0.01) return;
      var e = ekranR(x, y, 1), z = e.r * (s || 1), p = 0.6 + 0.4 * Math.sin(a * 5 + x);
      T.iz(e.x, e.y, 26 * z, 26 * z, 0, 1, 0.85, 0.45, 0.35 * o * p);
      T.iz(e.x, e.y, 7 * z, 7 * z, 0, 1, 0.97, 0.8, 0.95 * o);
      T.iz(e.x, e.y, 30 * z, 2.2 * z, 0, 1, 0.95, 0.75, 0.7 * o * p);
      T.iz(e.x, e.y, 2.2 * z, 30 * z, 0, 1, 0.95, 0.75, 0.7 * o * p);
    }

    /* ——— durak durumu ——— */
    var aNow = 0, sayilan = {}, sayilanA = {}, yerde = {}, yerdeA = {}, kediSec = -1, kediA = -9;
    function sayilanSay() { return Object.keys(sayilan).length; }

    /* ——— 0-1. Kış sabahı odası (kanca ve durak 1) ——— */
    var NIMET = {
      isik: PM(690, 300), soba: PM(210, 615), sut: PM(850, 700), corap: PM(1110, 570), su: PM(1525, 650), yorgan: PM(1450, 400)
    };
    var BARDAK = PM(850, 660), DUVAR = PM(350, 430), PENCERE = PM(690, 300), CAYDANLIK = PM(275, 225);
    function odaCiz(t, a, isik, ad) {
      plaka(ad || 'oda', { d: 1, parilti: 0.45 });
      // pencereden giren sabah ışığı: sağ duvara ve yere düşer, içinde toz zerreleri
      if (isik > 0.01) {
        isima(DUVAR[0], DUVAR[1], 230, [1, 0.86, 0.55], 0.16 * isik);
        isima(DUVAR[0] - 120, 690, 220, [1, 0.86, 0.55], 0.12 * isik);
        for (var j = 0; j < 46; j++) {
          var s = (hash(j, 21) + a * 0.012 * (0.5 + hash(j, 22))) % 1, x = kr(PENCERE[0] + 60, DUVAR[0], s) + (hash(j, 23) - 0.5) * 160, y = kr(PENCERE[1] + 30, 700, s) + Math.sin(a + j) * 6;
          var z = T.ekran(x, y, 1); T.iz(z.x, z.y, 2, 2, 0, 1, 0.95, 0.8, 0.5 * isik * Math.sin(s * Math.PI));
        }
        T.izBitir();
      }
      // çaydanlık ve süt buharı
      buhar(CAYDANLIK, a, 1, 0);
      buhar(BARDAK, a, 0.7, 3);
      // sobanın ateşi titrer
      var sb = NIMET.soba; isima(sb[0], sb[1], 120, [1, 0.55, 0.2], 0.16 + 0.05 * Math.sin(a * 7) + 0.03 * Math.sin(a * 13));
    }
    function buhar(p, a, o, k) {
      for (var j = 0; j < 8; j++) {
        var f = (a * 0.3 + j / 8 + k * 0.3) % 1, e = T.ekran(p[0] + Math.sin(f * 7 + j + k) * 9, p[1] - f * 80, 1), r = (5 + f * 7) * ekranR(800, 450, 1).r;
        T.iz(e.x, e.y, r, r, 0, 1, 1, 1, 0.18 * (1 - f) * o);
      }
      T.izBitir();
    }
    function kanca(t, a) {
      var kam = kameraYolu(t, [[0, { x: PENCERE[0], y: PENCERE[1] + 30, z: 1.42 }], [AN[3], { x: PENCERE[0], y: PENCERE[1] + 40, z: 1.34 }],
        [AN[5] + 0.4, { x: 900, y: 430, z: 1.12 }], [AN[7], { x: BARDAK[0], y: BARDAK[1] - 20, z: 1.45 }], [AN[9], { x: BARDAK[0], y: BARDAK[1] - 40, z: 1.38 }],
        [KES.koy, { x: 800, y: 450, z: 1.04 }]]);
      T.bas(a, kam);
      odaCiz(t, a, kr(0.35, 1, tw(t, W.isik - 0.2, 1.4)));
      // sayılan iki şey: ışık, süt; her birinin üstünde altın kıvılcım, sayaç işler
      var k1 = pencere(t, W.isik, KES.koy, 0.5, 0.4), k2 = pencere(t, W.sut1, KES.koy, 0.5, 0.4);
      kivilcim(PENCERE[0] + 120, PENCERE[1] - 60, a, k1, 1.3); kivilcim(BARDAK[0] + 40, BARDAK[1] - 50, a, k2, 1.3); T.izBitir();
      var n = t >= W.sut1 ? 2 : t >= W.isik ? 1 : 0;
      sayiGos(n, pencere(t, W.isik, KES.koy - 0.3, 0.3, 0.3), 800, 190);
    }
    function oda2(t, a) {
      var acik = api.acikDurak() === 'nimet';
      T.bas(a, kameraYolu(t, [[KES.oda2, { x: 800, y: 470, z: 1.08 }], [D.nimet, { x: 800, y: 450, z: 1 }]]));
      odaCiz(t, a, 0.9);
      // durakta: sayılmamış nimetler hafifçe parlar, dokunulanların çevresine altın halka konur
      var n = sayilanSay(), i = 0;
      Object.keys(NIMET).forEach(function (id) {
        var p = NIMET[id], s = sayilan[id];
        if (acik && !s) isima(p[0], p[1], 90, [1, 0.88, 0.55], 0.1 + 0.05 * Math.sin(a * 2.5 + i));
        if (s) { var k = tw(aNow, sayilanA[id], 0.5); dunyaHalka(i, p[0], p[1], kr(40, 78, k), 0.9 * (acik ? 1 : 1 - tw(t, AN[19], 0.8))); kivilcim(p[0], p[1] - 70, a, acik ? 1 : 0, 1); }
        i++;
      });
      T.izBitir();
      var so = acik ? (n ? 1 : 0) : pencere(t, D.nimet, KES.koy2 - 0.2, 0.2, 0.3) * (n ? 1 : 0);
      sayiGos(n, so, 600, 300);
    }

    /* ——— 2. Köy: sır (iki boş çerçeve) ve "sıcak bir yuva" ——— */
    var BACA = [P(262, 495), P(432, 432), P(748, 482), P(975, 540)];
    var PENCERELER = [P(138, 612), P(230, 612), P(445, 498), P(612, 590), P(720, 565), P(800, 565), P(905, 625), P(1015, 625), P(1200, 640)];
    function koyCiz(t, a, ad, carp) {
      plaka(ad || 'koy', { d: 1, parilti: 0.5, carp: carp });
      duman(BACA, a, 1);
      // bir kaz sürünün ardından ağır ağır yürür
      var kx = P(560 + ((a * 9) % 260), 870);
      T.ciz('kaz', { x: kx[0], y: kx[1], h: 62, ax: 0.5, ay: 1, d: 1, r: Math.sin(a * 6) * 2.5 });
    }
    function koy(t, a) {
      T.bas(a, { x: kr(700, 860, tw(t, KES.koy, 9, Y.sin)), y: kr(520, 480, tw(t, KES.koy, 9, Y.sin)), z: kr(1.32, 1.12, tw(t, KES.koy, 9, Y.sin)) });
      koyCiz(t, a);
      // "Nerede?": iki boş altın çerçeve
      var o = pencere(t, W.nerede - 0.1, KES.oda2 - 0.1, 0.5, 0.3);
      [[600, 330], [1000, 330]].forEach(function (c, i) {
        goster(cerceve[i], kutu(c[0], c[1], 300, 130, 22), o); kullan(cerceve[i]);
        goster(cerceveIc[i], kutu(c[0], c[1], 274, 104, 16), o * 0.9); kullan(cerceveIc[i]);
      });
      if (o > 0.01) { T.ciz('kagit', { x: 600, y: 330, g: 300, h: 130, d: 0, o: 0.55 * o, carp: [0.1, 0.14, 0.34] }); T.ciz('kagit', { x: 1000, y: 330, g: 300, h: 130, d: 0, o: 0.55 * o, carp: [0.1, 0.14, 0.34] }); }
    }
    function koy2(t, a) {
      var k = tw(t, KES.koy2, 8, Y.sin);
      T.bas(a, { x: kr(560, 800, k), y: kr(600, 470, k), z: kr(1.55, 1.06, k) });
      koyCiz(t, a);
      // "sıcak bir yuva": pencereler ısınır
      var py = tw(t, W.yuva - 0.2, 1.2);
      PENCERELER.forEach(function (p, i) { isima(p[0], p[1], 34, [1, 0.78, 0.4], (0.22 + 0.06 * Math.sin(a * 2 + i)) * py); });
      // köyün her yerinde altın kıvılcımlar çoğalır
      var cok = tw(t, AN[21], AN[23] + 1.4 - AN[21], Y.gir);
      var adet = Math.floor(6 + cok * 70);
      for (var i = 0; i < adet; i++) {
        var p = P(80 + hash(i, 61) * 1520, 380 + hash(i, 62) * 520), dog = AN[21] + hash(i, 63) * (AN[23] + 1.4 - AN[21]) * 0.9;
        kivilcim(p[0], p[1], a + i, tw(t, i < 6 ? AN[20] : dog, 0.4) * (1 - tw(t, KES.kagit - 0.6, 0.5)), 0.7 + hash(i, 64) * 0.5);
        if (i % 40 === 39) T.izBitir();
      }
      T.izBitir();
      // sayaç: çocuğun saydığından başlar, "saymaya kalksan" deyince hızlanıp bulanıklaşır
      var n0 = Math.max(sayilanSay(), 2), u = Math.max(0, t - W.saymaya), n = n0 + Math.floor(Math.pow(u * 2.2, 3.2));
      sayiGos(n, pencere(t, W.saymaya, W.bitmez + 0.2, 0.3, 0.6), 800, 190);
    }

    /* ——— 3. Kâğıt: Allahü teâlâdan ve isimlerinden söz edilen bölüm ——— */
    function kagit(t, a) { T.bas(a, { x: 800, y: 450, z: 1 }); plaka('kagit', { d: 0 }); }

    /* ——— 4. Kış: kar yağan köy, üç soru madalyonu ——— */
    var SORU = [['balik', 470, W.balik], ['sincap', 800, W.sincap1], ['ayi', 1130, W.ayi1]];
    function kis(t, a) {
      T.bas(a, { x: kr(800, 860, tw(t, KES.kis, 7, Y.sin)), y: kr(470, 430, tw(t, KES.kis, 7, Y.sin)), z: kr(1.02, 1.14, tw(t, KES.kis, 7, Y.sin)) });
      koyCiz(t, a);
      kar(a, tw(t, W.kar - 1, 1.2), 520, 1.1, 1.1);
      SORU.forEach(function (s, i) {
        var o = pencere(t, s[2] - 0.15, KES.gol - 0.2, 0.5, 0.3), p = [s[1], 330];
        madalyonCiz(i, p[0], p[1], 110 * kr(0.8, 1, o), o, function (oo) {
          if (s[0] === 'balik') T.ciz('balik', { x: p[0], y: p[1], g: 170, d: 1, o: oo, r: Math.sin(a * 2) * 3 });
          else if (s[0] === 'sincap') T.ciz('sincap', { x: p[0], y: p[1] + 4, h: 150, d: 1, o: oo });
          else T.ciz('ayi', { x: p[0], y: p[1] + 8, g: 180, d: 1, o: oo });
        });
      });
    }

    /* ——— 5. Göl kesiti: buz üstte kalır, balıklar dipte ——— */
    var BUZ_ALT = P(836, 226)[1];
    function gol(t, a) {
      T.bas(a, kameraYolu(t, [[KES.gol, { x: 800, y: 380, z: 1.12 }], [AN[38], { x: 800, y: 470, z: 1.08 }], [KES.tarla, { x: 800, y: 520, z: 1.16 }]]));
      plaka('gol-kesit', { d: 1, parilti: 0.35 });
      // buzun alt kenarında kristaller soldan sağa yayılır ("göl üstten dondu")
      var yay = tw(t, W.dondu - 0.4, 1.8);
      for (var i = 0; i < 70; i++) {
        var x = 20 + i * 23; if (x > 20 + yay * 1600) break;
        var e = T.ekran(x, BUZ_ALT + 4 + Math.sin(i * 1.7) * 5, 1); T.iz(e.x, e.y, 6, 3, 0, 1, 1, 1, 0.55 + 0.35 * Math.sin(a * 3 + i));
      }
      T.izBitir();
      // buz parçası: sudan hafif olduğu için yükselir, buzun altına yapışır
      var yk = tw(t, W.hafif - 0.3, 2.6, Y.ikili), bo = pencere(t, W.hafif - 0.5, KES.tarla, 0.4, 0.4);
      if (bo > 0.01) {
        var bx = 1180, by = kr(640, BUZ_ALT + 28, yk) + Math.sin(a * 2) * 3 * (1 - yk), pts = [[-70, -16], [-30, -30], [40, -26], [74, -6], [52, 22], [-10, 30], [-60, 18]];
        goster(buzParca, dunyaCizgi(pts.map(function (q) { var c = Math.cos(0.08 * Math.sin(a)), s = Math.sin(0.08 * Math.sin(a)); return [bx + q[0] * c - q[1] * s, by + q[0] * s + q[1] * c]; })) + 'Z', bo); kullan(buzParca);
        // yükselirken arkasında kabarcıklar
        for (var b = 0; b < 8; b++) { var f = (a * 0.5 + b / 8) % 1, q = T.ekran(bx + Math.sin(b * 2 + a) * 30, by + 40 + f * 120, 1); T.iz(q.x, q.y, 4, 4, 0, 0.9, 0.97, 1, 0.5 * (1 - f) * bo * (1 - yk)); }
        T.izBitir();
      }
      // balıklar dipte yavaş yüzer (soldan sağa); yanlarından kabarcık çıkar
      var bl = tw(t, W.yuzer - 1.2, 1);
      [[0, 640, 150, 0.06], [0.45, 720, 120, 0.05], [0.75, 590, 100, 0.07]].forEach(function (f, i) {
        var u = (f[0] + a * f[3]) % 1, x = -120 + u * 1840, y = f[1] + Math.sin(a * 1.3 + i * 2) * 10;
        T.ciz('balik', { x: x, y: y, g: f[2] * 1.6, d: 1, o: 0.35 + 0.65 * bl, r: Math.sin(a * 1.3 + i * 2) * 2 });
      });
    }

    /* ——— 6. Tarla kesiti: kar örtüsünün üstü buz gibi, altı daha sıcak ——— */
    var FILIZ_Y = P(836, 520)[1];
    function tarla(t, a) {
      T.bas(a, kameraYolu(t, [[KES.tarla, { x: 800, y: 330, z: 1.14 }], [AN[40], { x: 800, y: 470, z: 1.04 }], [KES.orman, { x: 800, y: 520, z: 1.08 }]]));
      plaka('tarla', { d: 1, parilti: 0.3 });
      kar(a, 0.9, 360, 1, 1);
      // soğuk: örtünün üstünde mavi soğuk ışıma; sıcak: filizlerin dibinde amber ışıma
      var so = tw(t, AN[40] - 0.2, 1.2), si = tw(t, AN[40] + 1.0, 1.4);
      for (var i = 0; i < 8; i++) isima(100 + i * 200, P(836, 250)[1], 190, [0.55, 0.75, 1], 0.22 * so);
      for (var j = 0; j < 13; j++) { var x = P(62 + j * 126.5, 0)[0]; isima(x, FILIZ_Y, 80, [1, 0.7, 0.32], (0.36 + 0.06 * Math.sin(a * 2 + j)) * si); }
    }

    /* ——— 7. Orman: dalda sincap ——— */
    var DAL = P(900, 432);
    function orman(t, a) {
      T.bas(a, { x: kr(820, 760, tw(t, KES.orman, 3, Y.sin)), y: 440, z: kr(1.3, 1.2, tw(t, KES.orman, 3, Y.sin)) });
      plaka('orman', { d: 1, parilti: 0.45 });
      kar(a, 0.6, 260, 0.8, 1);
      var zp = Math.max(0, Math.sin(a * 1.7)) * 4;
      T.ciz('sincap', { x: DAL[0], y: DAL[1] + 2 - zp, h: 150, ax: 0.5, ay: 1, d: 1, r: Math.sin(a * 0.9) * 2 });
    }

    /* ——— 8. İn: ayı uyur, yavaş nefes alır (durak 2 bu sahnede açılır) ——— */
    var IN_TABAN = P(800, 772);
    function inn(t, a) {
      var es = api.acikDurak() === 'kis';
      T.bas(a, { x: 800, y: kr(560, 500, tw(t, KES.inn, 3, Y.sin)), z: kr(1.25, 1.1, tw(t, KES.inn, 3, Y.sin)) });
      plaka('in', { d: 1, parilti: 0.35, carp: es ? [0.5, 0.52, 0.66] : null });
      var nf = Math.sin(a * 2 * Math.PI / 4.2);
      // eşleştirme açıkken ayı kartlarda; sahnedeki ayı çekilir
      if (!es) T.ciz('ayi', { x: IN_TABAN[0], y: IN_TABAN[1], g: 560, h: 304 * (1 + 0.025 * nf), ax: 0.5, ay: 1, d: 1 });
      kar(a, es ? 0.3 : 0.7, 200, 0.7, 1);
    }

    /* ——— 9. Köy: her canlının azığı hazır (dört madalyon) ——— */
    var AZIK = [['balik', 380], ['filiz', 660], ['sincap', 940], ['ayi', 1220]];
    function azik(t, a) {
      T.bas(a, { x: 800, y: kr(450, 470, tw(t, KES.azik, 4, Y.sin)), z: kr(1.12, 1.04, tw(t, KES.azik, 4, Y.sin)) });
      koyCiz(t, a, null, [0.72, 0.76, 0.88]);
      kar(a, 0.5, 260, 0.8, 1);
      AZIK.forEach(function (m, i) {
        var o = pencere(t, KES.azik + 0.15 + i * 0.35, KES.sofra - 0.1, 0.5, 0.3), p = [m[1], 360];
        madalyonCiz(i, p[0], p[1], 104 * kr(0.85, 1, o), o, function (oo) {
          if (m[0] === 'balik') T.ciz('balik', { x: p[0], y: p[1], g: 160, d: 1, o: oo });
          else if (m[0] === 'filiz') T.ciz('filiz', { x: p[0], y: p[1], h: 160, d: 1, o: oo });
          else if (m[0] === 'sincap') T.ciz('sincap', { x: p[0], y: p[1] + 4, h: 140, d: 1, o: oo });
          else T.ciz('ayi', { x: p[0], y: p[1] + 6, g: 170, d: 1, o: oo });
        });
        kivilcim(p[0] + 70, p[1] - 70, a + i, o, 0.9); T.izBitir();
      });
    }

    /* ——— 10. Sofra: süt bardağı ——— */
    function sofra(t, a) {
      T.bas(a, kameraYolu(t, [[KES.sofra, { x: 820, y: 520, z: 1.16 }], [AN[45], { x: BARDAK[0], y: BARDAK[1] - 10, z: 1.7 }], [KES.ahir1, { x: BARDAK[0], y: BARDAK[1] - 10, z: 1.8 }]]));
      odaCiz(t, a, 0.85);
      kivilcim(BARDAK[0] + 40, BARDAK[1] - 50, a, tw(t, KES.sofra + 0.4, 0.6), 1.2); T.izBitir();
    }

    /* ——— 11. Ahır: inek kuru otu yer ——— */
    var INEK = { x: 690, y: P(800, 790)[1], g: 600 }, BUZ = { x: 1080, y: P(800, 792)[1], g: 300 };
    var FENER = P(762, 300), KAPI = P(1350, 420);
    function ahirIsik(t, a, o) {
      isima(FENER[0], FENER[1], 260, [1, 0.72, 0.35], (0.18 + 0.03 * Math.sin(a * 9) + 0.02 * Math.sin(a * 17)) * o);
      isima(FENER[0], FENER[1], 60, [1, 0.92, 0.7], 0.3 * o);
    }
    function kapiKar(a) {
      for (var i = 0; i < 70; i++) {
        var x = P(1270 + hash(i, 71) * 170, 0)[0], y0 = P(0, 200)[1], y1 = P(0, 600)[1], y = y0 + ((hash(i, 72) * (y1 - y0) + a * (30 + hash(i, 73) * 20)) % (y1 - y0));
        var e = T.ekran(x + Math.sin(a + i) * 6, y, 1); T.iz(e.x, e.y, 2.2, 2.2, 0, 1, 1, 1, 0.8);
      }
      T.izBitir();
    }
    function ahir1(t, a) {
      T.bas(a, { x: kr(760, 720, tw(t, KES.ahir1, 6, Y.sin)), y: 520, z: kr(1.2, 1.12, tw(t, KES.ahir1, 6, Y.sin)) });
      plaka('ahir', { d: 1, parilti: 0.45 });
      ahirIsik(t, a, 1); kapiKar(a);
      // inek başını eğip otu yer, çene hafifçe oynar
      T.ciz('inek', { x: INEK.x, y: INEK.y, g: INEK.g, ax: 0.5, ay: 1, d: 1, r: Math.sin(a * 2.4) * 0.8 });
      var ot = INEK.x + INEK.g * 0.46; isima(ot, INEK.y - 8, 60, [1, 0.85, 0.4], 0.16 * tw(t, W.kuru - 0.2, 0.6));
    }

    /* ——— 12. Yaz yaylası: ot yeşerir, yağmur yağar ——— */
    var BULUT_Y = P(300, 130);
    function yagmur(x0, x1, y0, y1, a, o) {
      if (o <= 0.01) return;
      for (var i = 0; i < 140; i++) {
        var x = x0 + hash(i, 81) * (x1 - x0), f = (hash(i, 82) + a * 1.4) % 1, y = kr(y0, y1, f), e = T.ekran(x - f * 30, y, 1), e2 = ekranR(800, 450, 1).r;
        T.iz(e.x, e.y, 1.6 * e2, 15 * e2, 0.18, 0.75, 0.88, 1, 0.55 * o);
        if (i % 800 === 799) T.izBitir();
      }
      T.izBitir();
    }
    function yayla(t, a) {
      var k = tw(t, KES.yayla, 6, Y.sin);
      T.bas(a, { x: kr(1100, 760, k), y: kr(520, 470, k), z: kr(1.3, 1.08, k) });
      plaka('yayla', { d: 1, parilti: 0.55, ruzgar: 0.16 });
      yagmur(BULUT_Y[0] - 260, BULUT_Y[0] + 300, BULUT_Y[1] + 60, P(0, 520)[1], a, tw(t, W.yagmur1 - 0.2, 0.8));
    }

    /* ——— 13. Sebepler ve sütün yolu (durak 3) ——— */
    // dört durak madalyonlarda durur (yere basmayan şeyler havada asılı görünmesin); yol madalyonların altından geçer
    var ST = [
      { ad: 'bulut', x: 270, y: 330, g: 196, gel: function () { return W.yagmur2; } },
      { ad: 'ot-yigini', x: 620, y: 330, h: 176, gel: function () { return W.ot4; } },
      { ad: 'inek', x: 990, y: 330, g: 206, gel: function () { return W.inek2; } },
      { ad: 'sut-gugumu', x: 1340, y: 330, h: 168, gel: function () { return W.sirayla; } }
    ];
    var ST_R = 118;
    var YOL_N = [[270, 470], [445, 488], [620, 470], [805, 488], [990, 470], [1165, 488], [1340, 470]];
    var yolH = hazirla(YOL_N);
    var YOL_FR = ST.map(function (s) { var en = 1e9, fr = 0; for (var j = 0; j <= 200; j++) { var q = uzerinde(yolH, j / 200), dx = Math.abs(q[0] - s.x); if (dx < en) { en = dx; fr = j / 200; } } return fr; });
    function sebep(t, a) {
      var acik = api.acikDurak() === 'sut';
      T.bas(a, kameraYolu(t, [[KES.sebep, { x: 800, y: 470, z: 1.06 }], [D.sut - 0.4, { x: 800, y: 450, z: 1 }]]));
      plaka('yayla', { d: 1, parilti: 0.4, ruzgar: 0.1, carp: [0.42, 0.44, 0.52] });
      var hb = pencere(t, W.hicbiri - 0.1, W.sirayla - 0.2, 0.3, 0.4);
      ST.forEach(function (s, i) {
        var o = tw(t, s.gel() - 0.2, 0.6), yan = !!yerde[i];
        madalyonCiz(i, s.x, s.y, ST_R * kr(0.85, 1, o), o, function (oo) {
          var sall = s.ad === 'inek' ? Math.sin(a * 1.6) * 0.8 : s.ad === 'ot-yigini' ? Math.sin(a * 1.1) * 0.6 : 0;
          T.ciz(s.ad, { x: s.x, y: s.y + (s.ad === 'bulut' ? -6 : 6), g: s.g, h: s.h, d: 1, o: oo * (1 - 0.35 * hb), r: sall });
        });
        if (o > 0.01 && (acik || yan)) isima(s.x, s.y, 170, [1, 0.85, 0.5], (yan ? 0.16 : 0.05) + 0.04 * Math.sin(a * 2 + i));
        if (yan) dunyaHalka(i, s.x, s.y, ST_R + 16, 0.85 + 0.15 * Math.sin(a * 3));
      });
      // "hepsi sırayla birbirine yetişti": altın yol gökten sofraya çizilir; durakta yerleşen adımlara kadar dolar
      var yo = tw(t, W.sirayla, 2.2, Y.ikili);
      if (yo > 0.01) {
        var n = Math.max(2, Math.round(yo * 60)), pts = [];
        for (var j = 0; j <= n; j++) pts.push(uzerinde(yolH, j / n * yo));
        var d = dunyaCizgi(pts);
        goster(sutYolGolge, d, 0.8); goster(sutYol, d, 1); kullan(sutYolGolge); kullan(sutYol);
        var dolu = -1; for (var q = 0; q < 4 && yerde[q]; q++) dolu = q;
        var hepsi = dolu === 3;
        if (dolu >= 1) {
          var pd = [];
          for (var m = 0; m <= 40; m++) pd.push(uzerinde(yolH, m / 40 * YOL_FR[dolu]));
          goster(sutYolDolu, dunyaCizgi(pd), 0.9); kullan(sutYolDolu);
        }
        // yol tamamlanınca altın bir damla gökten sofraya akar
        if (hepsi || (!acik && t > D.sut)) {
          for (var r = 0; r < 3; r++) { var f = (a * 0.35 + r / 3) % 1, p = uzerinde(yolH, f), e = T.ekran(p[0], p[1], 1); T.iz(e.x, e.y, 10, 10, 0, 1, 0.95, 0.75, 0.9); T.iz(e.x, e.y, 26, 26, 0, 1, 0.85, 0.5, 0.35); }
          T.izBitir();
        }
      }
    }

    /* ——— 14. Ahır, gece: inek buzağısını yalar; buzağı kalkmayı dener (durak 4) ——— */
    function ahir2(t, a) {
      var acik = api.acikDurak() === 'veren';
      T.bas(a, kameraYolu(t, [[KES.ahir2, { x: 820, y: 560, z: 1.12 }], [AN[61], { x: 880, y: 600, z: 1.32 }], [AN[63] - 0.3, { x: 860, y: 540, z: 1.16 }], [D.veren, { x: 800, y: 450, z: 1 }]]));
      var los = tw(t, AN[62], 2.4);
      plaka('ahir', { d: 1, parilti: 0.4, carp: los > 0.01 ? [kr(1, 0.78, los), kr(1, 0.74, los), kr(1, 0.7, los)] : null });
      ahirIsik(t, a, 1 - 0.3 * los); kapiKar(a);
      // inek: başını buzağıya doğru indirip kaldırır (yalar)
      var yal = tw(t, W.yaliyor - 0.3, 0.5) * (acik ? 0.3 : 1), rr = -1.2 * Math.max(0, Math.sin(a * 2.2)) * yal;
      T.ciz('inek', { x: INEK.x - 0.35 * INEK.g, y: INEK.y, g: INEK.g, ax: 0.15, ay: 1, d: 1, r: rr });   // dayanak arka ayaklarda, yeri ahır 1 ile aynı
      // buzağı: önce çömelmiş; "kalkmaya çalışırken" titreyerek kalkar, bir kez sendeler, sonra ayakta durur
      var k1 = tw(t, W.kalkmaya - 0.2, 1.1), dus = pencere(t, W.kalkmaya + 1.1, W.kalkmaya + 1.6, 0.25, 0.35), k2 = tw(t, W.kalkmaya + 1.7, 1.0);
      var boy = Math.max(0.62, Math.min(1, 0.62 + 0.38 * (k1 - 0.3 * dus + 0.3 * k2 * dus)));
      if (t >= W.kalkmaya + 2.7 || acik) boy = 1;
      var tit = (boy < 0.999 ? 1 : 0) * Math.sin(a * 23) * 1.2;
      T.ciz('buzagi', { x: BUZ.x + tit, y: BUZ.y, g: BUZ.g, h: 257 * boy, ax: 0.5, ay: 1, d: 1, r: (1 - boy) * 6 * Math.sin(a * 5) });
      // "bu şefkati kim öğretti?": ikisinin çevresinde yumuşak altın ışık
      var sf = pencere(t, W.sefkati - 0.2, D.veren - 0.3, 0.6, 0.5);
      if (sf > 0.01) isima((INEK.x + BUZ.x) / 2 + 80, INEK.y - 140, 300, [1, 0.85, 0.55], 0.14 * sf);
    }

    /* ——— 15. Kapı önü: karda üşüyen kedi (durak 5: doğru cevapta su ve yemek konur) ——— */
    var KEDI = { x: P(700, 0)[0], y: P(0, 776)[1] }, KAP = { x: P(1000, 0)[0], y: P(0, 780)[1] };
    function kapi(t, a) {
      var acik = api.acikDurak() === 'kedi', iyi = kediSec === 3;
      T.bas(a, kameraYolu(t, [[KES.kapi, { x: 860, y: 520, z: 1.14 }], [AN[72], { x: 820, y: 560, z: 1.24 }], [D.kedi - 0.3, { x: 800, y: 450, z: 1 }]]));
      plaka('kapi', { d: 1, parilti: 0.45 });
      var pc = P(595, 440); isima(pc[0], pc[1], 150, [1, 0.8, 0.4], 0.16 + 0.03 * Math.sin(a * 2));
      kar(a, 0.85, 420, 0.9, 1.1);
      // durakta doğru seçilince kap konur; durak geçtikten sonra (öğretmen ekranı dahil) kap hep oradadır
      var gk = 0, yaklas = 0;
      if (iyi && acik) { gk = tw(aNow, kediA + 0.2, 0.6); yaklas = tw(aNow, kediA + 0.9, 1.4, Y.ikili); }
      else if (!acik && t > D.kedi) { gk = kediSec === 3 ? 1 : tw(t, D.kedi + 0.1, 0.6); yaklas = kediSec === 3 ? 1 : tw(t, D.kedi + 0.6, 1.4, Y.ikili); }
      if (gk > 0.01) {
        T.ciz('kap', { x: KAP.x, y: KAP.y, g: 230, ax: 0.5, ay: 1, d: 1, o: gk });
        isima(KAP.x, KAP.y - 40, 120, [1, 0.85, 0.5], 0.14 * gk);
      }
      // üşürken titrer; kap gelince ona yaklaşır, titremesi geçer
      var titre = (1 - yaklas) * Math.sin(a * 31) * 1.4;
      T.ciz('kedi', { x: kr(KEDI.x, KAP.x - 170, yaklas) + titre, y: KEDI.y, h: 190, ax: 0.5, ay: 1, d: 1 });
      if (yaklas > 0.5) isima(KAP.x - 120, KAP.y - 80, 170, [1, 0.8, 0.45], 0.1 * yaklas);
    }

    /* ——— 16. Akşam odası: sırrın çözümü başlar ——— */
    var LAMBA = PM(955, 690);
    function aksam(t, a) {
      T.bas(a, kameraYolu(t, [[KES.aksam, { x: 800, y: 450, z: 1.05 }], [W.besmele, { x: 800, y: 560, z: 1.3 }], [KES.kagit3, { x: 800, y: 580, z: 1.34 }]]));
      plaka('oda-aksam', { d: 1, parilti: 0.5 });
      isima(LAMBA[0], LAMBA[1] - 30, 230, [1, 0.75, 0.38], 0.2 + 0.03 * Math.sin(a * 8));
      var sb = NIMET.soba; isima(sb[0], sb[1], 130, [1, 0.55, 0.2], 0.18 + 0.05 * Math.sin(a * 7));
      buhar(BARDAK, a, 0.6, 2);
      // baştaki iki boş çerçeve yine gelir
      var o = pencere(t, AN[77] - 0.1, KES.kagit3 - 0.2, 0.5, 0.3);
      [[600, 400], [1000, 400]].forEach(function (c, i) {
        goster(cerceve[i], kutu(c[0], c[1], 300, 130, 22), o); kullan(cerceve[i]);
        goster(cerceveIc[i], kutu(c[0], c[1], 274, 104, 16), o * 0.9); kullan(cerceveIc[i]);
      });
      if (o > 0.01) { T.ciz('kagit', { x: 600, y: 400, g: 300, h: 130, d: 0, o: 0.55 * o, carp: [0.1, 0.14, 0.34] }); T.ciz('kagit', { x: 1000, y: 400, g: 300, h: 130, d: 0, o: 0.55 * o, carp: [0.1, 0.14, 0.34] }); }
    }
    // besmele kâğıdı: çerçeveler bu kez iki isimle dolar
    function kagit3(t, a) {
      kagit(t, a);
      var o = tw(t, KES.kagit3 + 0.3, 0.8);
      [[560, 560], [1040, 560]].forEach(function (c, i) {
        goster(cerceve[i], kutu(c[0], c[1], 360, 140, 24), o); kullan(cerceve[i]);
        goster(cerceveIc[i], kutu(c[0], c[1], 332, 112, 18), o * 0.9); kullan(cerceveIc[i]);
      });
    }

    /* ——— 17. Kapanış: bahar gelir, kar erir, göl çözülür ——— */
    function kapanis(t, a) {
      var ak = tw(t, KES.son, 7, Y.sin);
      T.bas(a, { x: kr(560, 800, ak), y: kr(600, 450, ak), z: kr(1.55, 1.02, ak) });
      plaka('bahar', { d: 1, parilti: 0.6, ruzgar: 0.14 });
      duman(BACA, a, 0.7);
      // açılan suda ışık pırıltısı
      for (var i = 0; i < 26; i++) { var p = P(380 + hash(i, 91) * 1250, 360 + hash(i, 92) * 150), e = T.ekran(p[0], p[1], 1); T.iz(e.x, e.y, 9, 2, 0, 1, 1, 0.95, 0.5 * Math.max(0, Math.sin(a * 2 + i * 1.7))); }
      T.izBitir();
    }

    /* ——— perde: kesmelerde kısa bir an lacivert (kâğıt bölümünde krem) karartma ——— */
    var LACI = [0.07, 0.11, 0.3], KREM = [1, 1, 1];
    var PERDE = [[KES.koy], [KES.oda2], [KES.koy2], [KES.kagit, KREM], [KES.kis, KREM], [KES.gol], [KES.tarla], [KES.orman], [KES.inn], [KES.azik],
      [KES.sofra], [KES.ahir1], [KES.yayla], [KES.sebep], [KES.ahir2], [KES.kagit2, KREM], [KES.kapi, KREM], [KES.aksam], [KES.kagit3, KREM], [KES.son, KREM]];
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
      [KES.koy, kanca], [KES.oda2, koy], [KES.koy2, oda2], [KES.kagit, koy2], [KES.kis, kagit], [KES.gol, kis], [KES.tarla, gol],
      [KES.orman, tarla], [KES.inn, orman], [KES.azik, inn], [KES.sofra, azik], [KES.ahir1, sofra], [KES.yayla, ahir1],
      [KES.sebep, yayla], [KES.ahir2, sebep], [KES.kagit2, ahir2], [KES.kapi, kagit], [KES.aksam, kapi], [KES.kagit3, aksam],
      [KES.son, kagit3], [Infinity, kapanis]
    ];
    function ciz(t, a) {
      aNow = a; kullanildi = [];
      gos(SAYI, 0);
      for (var i = 0; i < BOLUM.length; i++) { if (t < BOLUM[i][0]) { BOLUM[i][1](t, a); break; } }
      SVG_HEPSI.forEach(function (p) { if (kullanildi.indexOf(p) < 0) gizle(p); });
      perde(t);
      yazilar(t);
    }

    return {
      hazir: hazir,
      ciz: ciz,
      // Allahü teâlâdan ve isimlerinden söz edilen kâğıt bölümlerinde yazı sahnenin kendisidir; altyazı ve dokunma oyunu yoktur
      altyazisiz: function (t) { return kagitYazisi || (t >= KES.kagit && t < KES.kis) || (t >= KES.kagit2 && t < KES.kapi) || (t >= KES.kagit3 && t < KES.son); },
      durak: function (id, olay, veri) {
        if (id === 'nimet') {
          if (olay === 'ac') { sayilan = {}; sayilanA = {}; }
          if (olay === 'dene' && !sayilan[veri]) { sayilan[veri] = true; sayilanA[veri] = aNow; }
        }
        if (id === 'sut') { if (olay === 'ac') { yerde = {}; yerdeA = {}; } if (olay === 'dogru') { yerde[veri] = true; yerdeA[veri] = aNow; } }
        if (id === 'kedi') { if (olay === 'ac') { kediSec = -1; } if (olay === 'sec') { kediSec = veri; kediA = aNow; } }
      }
    };
  };
})();
