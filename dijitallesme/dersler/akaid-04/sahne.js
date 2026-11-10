/* Akaid 4 · Yeryüzünün Sırları — sahne: "Yaşayan Minyatür", Toros eteklerinde bir vadi, bir yıl.
   Bakış doğuya döner: dağ solda (kuzey), deniz sağda (güney); dere her sahnede soldan sağa, yokuş aşağı akar.
   Ders tek sahnede dönmez: yeşil yaprağın yakın planıyla açılır, vadiye yükselir, bahçeden yaprağın içine girer,
   fabrika şemasında durur, sonbaharda yaprak düşer, toprağın altına inilir, dağda kar yağar ve azar azar erir,
   bir yaz gecesi zirvede kayan yıldız görülür, uzaydan havanın ince mavi çizgisine bakılır, sabah dereyle denize
   inilir; Allahü teâlâdan söz edilen bölümde boya çekilir, kâğıt ve yazı kalır; sırda tepedeki kayadan kopan taş
   dereyle kuma döner, ders akşam kumsalında biter. Her olay anlatıcının kelimesine bağlıdır (t); a ortam saatidir.
   Fizik: yaprak şekeri yalnız ışıkta yapar; su sapın içinden yaprağa çıkar, şeker aynı damarın öbür şeridinden
   elmaya iner; karbondioksit gözenekten girer, oksijen çıkar. Düşen yaprak salınarak iner, rüzgâr hep soldan eser.
   Kayan yıldız gökte söner, yere ulaşmaz (yalnız "hava çok ince" ucunda ulaşır). Dere taşı aşağı indikçe küçülür.
   İnsan figürü yoktur. Güneş'te ve Ay'da yüz yoktur. Gece göğünde hilâl yoktur. */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-04'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['vadi-yaz', 'vadi-kis', 'vadi-bahar', 'bahce', 'bahce-sonbahar', 'yaprak-ici', 'toprak', 'dag-gece', 'uzay-kenar', 'dere', 'deniz', 'kagit',
      'dal', 'yaprak', 'yaprak-sari', 'solucan', 'mantar', 'gunes', 'kabuk', 'plankton', 'kum-taneleri', 'kaya', 'tas', 'cakil', 'kum-grup'];
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
    // kamera anahtarları: [[zaman, {x, y, z}], …] arası yumuşak geçer
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
    var D = {}; ['uretir', 'fabrika', 'toprak', 'hava', 'gorev', 'buyuk'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {
      duman: C(1), calisir: C(2), sir: C(3), kumsal: C(4), cevap: C(5), vadi: C(6), tepe: C(7), tahmin: C(8),
      elma: C(9), kim: C(10), yan: C(11), gir: C(12),
      kok: C(13), tirman: C(14), delik: C(15), gaz: C(16), nefes: C(17), guc: C(18), seker: C(19), oksijen: C(20), yani: C(21), siraSende: C(22),
      yaz: C(23), sonbahar: C(24), cop: C(25), degil: C(26), ordu: C(27), solucanlar: C(28), kasik: C(29), yer: C(30), kazar: C(31), kokler: C(32),
      bahar: C(33), bosa: C(34), tek: C(35), olmasa: C(36), cikar: C(37),
      su: C(38), yukari: C(39), kis: C(40), serin: C(41), sel: C(42), kilit: C(43), erir: C(44),
      gece: C(45), kayan: C(46), aslinda: C(47), carpinca: C(48), kalkan: C(49), yorgan: C(50), ay: C(51), elmaK: C(52), ince: C(53), dene: C(54),
      olcu: C(55), sabah: C(56), dere: C(57), denizF: C(58), yarisi: C(59), kumsala: C(60), buyutec: C(61), renk: C(62), kimi: C(63), isci: C(64), hangisi: C(65), esles: C(66),
      bilmiyor: C(67), dag: C(68), solucanB: C(69), hepsi: C(70), kimVerdi: C(71),
      yaratan: C(72), olcuyle: C(73), sanat: C(74), nimet: C(75),
      coz: C(76), neredeydi: C(77), tepesinde: C(78), catlak: C(79), dondu: C(80), genisler: C(81), catlatti: C(82), dereAldi: C(83), yillar: C(84), yolcu: C(85),
      gelecek: C(86), emanet: C(87)
    };
    AN.wDag = kel('dağ'); AN.wBahce = kel('bahçesi'); AN.wDeniz = kel('deniz');
    AN.wKum = kel('tanesi'); AN.wCo2 = kel('karbondioksit.'); AN.wO2 = kel('oksijen');
    // bölümler arası kesmeler (cümle başlarına düşer)
    var KES = {
      sir: AN.sir - 0.1, vadi: AN.vadi - 0.1, bahce: AN.tahmin - 0.1, dal: AN.yan - 0.1, ic: AN.gir + 1.3, fab: AN.siraSende - 0.15,
      sonbahar: AN.sonbahar - 0.1, toprak: AN.ordu - 0.15, bahar: AN.bahar - 0.1, bosa: AN.bosa - 0.1, dag: AN.su - 0.1,
      gece: AN.gece - 0.25, uzay: AN.elmaK - 0.2, dere: AN.sabah - 0.2, deniz: AN.denizF - 0.2, buyuk: AN.bilmiyor - 0.3,
      kagit: AN.yaratan - 0.3, sir2: AN.coz - 0.2, sirDere: AN.dereAldi - 0.15, sirDeniz: AN.yolcu - 0.2, son: AN.gelecek - 0.2
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
    // [yazı, sınıf, x, y, başlangıç, bitiş, dünya]: dünya işaretli yazı kamerayla birlikte gider
    var AKIS = [
      ['?', 'sor', 1150, 300, kel('neredeydi?') - 0.2, AN.vadi - 0.3],
      ['dağ', 'etiket', 150, 150, AN.wDag, AN.tahmin - 0.4, 1],
      ['elma bahçesi', 'etiket', 760, 400, AN.wBahce, AN.tahmin - 0.4, 1],
      ['deniz', 'etiket', 1500, 560, AN.wDeniz, AN.tahmin - 0.4, 1],
      ['?', 'sor', 735, 255, AN.kim + 0.3, AN.yan - 0.2, 1],
      ['yaprak', 'etiket', 905, 70, AN.yan + 0.6, AN.gir + 0.8, 1],
      ['su', 'etiket', 700, 470, AN.kok + 0.6, AN.delik - 0.1, 1],
      ['küçük delikler', 'etiket', 830, 700, AN.delik + 0.5, AN.gaz - 0.1, 1],
      ['karbondioksit', 'etiket', 430, 700, AN.wCo2, AN.guc - 0.1, 1],
      ['Güneş ışığı', 'etiket', 380, 120, AN.guc + 0.3, AN.seker - 0.1, 1],
      ['şeker', 'etiket', 1260, 210, AN.seker + 0.6, AN.oksijen - 0.1, 1],
      ['oksijen', 'etiket', 1230, 700, AN.wO2, KES.fab - 0.2, 1],
      ['bir çay kaşığı toprakta: yüz milyonlarca canlı', 'etiket', 800, 96, AN.kasik + 0.6, AN.yer - 0.1],
      ['Hiçbir şey boşa gitmez.', 'etiket', 1180, 96, AN.bosa + 0.1, D.toprak - 0.7],
      ['kar aylarca kalır', 'etiket', 800, 96, AN.serin + 0.4, AN.sel - 0.1],
      ['bir anda erise: sel', 'etiket', 800, 96, AN.sel + 0.2, AN.kilit - 0.1],
      ['hiç erimese: su dağda kalır', 'etiket', 800, 96, AN.kilit + 0.2, AN.erir - 0.1],
      ['azar azar erir, dere yaz boyu akar', 'etiket', 800, 96, AN.erir + 0.6, KES.gece - 0.2],
      ['çoğu kum tanesi kadar bir taş', 'etiket', 1250, 420, AN.aslinda + 0.8, AN.carpinca + 0.6],
      ['hava: kalkan', 'etiket', 800, 96, AN.kalkan + 0.3, AN.yorgan - 0.1],
      ['hava: yorgan', 'etiket', 800, 96, AN.yorgan + 0.4, AN.ay - 0.1],
      ['havası olmayan Ay', 'etiket', 1250, 305, AN.ay + 0.3, KES.uzay - 0.2],
      ['gündüz 120 °C', 'etiket', 1250, 365, kel('yirmi') - 0.3, KES.uzay - 0.2],
      ['gece −130 °C', 'etiket', 1250, 425, kel('otuz') - 0.3, KES.uzay - 0.2],
      ['elmanın kabuğu kadar ince', 'etiket', 1200, 320, AN.elmaK + 1.2, D.hava - 0.7],
      ['Hava tam ölçüsünde.', 'etiket', 800, 96, AN.olcu + 0.3, KES.dere - 0.2],
      ['gözle görülmeyen yeşil canlılar', 'etiket', 1150, 380, AN.denizF + 2.2, AN.kumsala - 0.2, 1],
      ['oksijenin yaklaşık yarısı', 'etiket', 800, 96, AN.yarisi + 0.6, AN.kumsala - 0.1],
      ['taş parçası', 'etiket', 700, 592, AN.kimi + 0.2, AN.isci - 0.1, 1],
      ['kabuk parçası', 'etiket', 945, 655, kel('kabuğunun'), AN.isci - 0.1, 1],
      ['Hepsi birbirine yetişiyor.', 'etiket', 800, 96, AN.hepsi + 1.2, AN.kimVerdi - 0.1],
      ['Dağları, denizleri, ağaçları ve meyveleri yaratan, Allahü teâlâdır.', 'kagit iri', 800, 330, AN.yaratan, AN.sanat - 0.4],
      ['Her şeyi bir ölçüyle yaratmış, her birini bir iş için var etmiştir.', 'kagit', 800, 560, AN.olcuyle, AN.sanat - 0.4],
      ['Bir yaprak da, bir kum tanesi de, Onun kudretini gösteren birer sanat eseridir.', 'kagit', 800, 330, AN.sanat, AN.coz - 0.5],
      ['Elmadaki şeker de, soluduğun temiz hava da, Onun sana verdiği birer nimettir.', 'kagit', 800, 560, AN.nimet, AN.coz - 0.5],
      ['su donunca genişler', 'etiket', 1250, 640, AN.genisler + 0.4, AN.catlatti + 0.6],
      ['yüzlerce, belki binlerce yıl', 'etiket', 800, 96, AN.yillar + 0.2, KES.sirDeniz - 0.2],
      ['Gelecek ders: Canlılardaki incelik', 'etiket', 800, 110, AN.gelecek + 0.2, AN.emanet + 0.9]
    ].map(function (s) { return { e: yazi(s[0], s[1], s[2], s[3]), kagit: /^kagit/.test(s[1]), bas: s[4], son: s[5], dunya: !!s[6], x: s[2], y: s[3] }; });
    var kagitYazisi = false;
    function yazilar(t) {
      kagitYazisi = false;
      AKIS.forEach(function (s) {
        var o = pencere(t, s.bas, s.son, s.kagit ? 0.8 : 0.3, 0.4);
        if (s.dunya && o > 0.003) { var p = T.ekran(s.x, s.y, 1); s.e._x = p.x; s.e._y = p.y; }
        gos(s.e, o, s.kagit ? kr(8, 0, tw(t, s.bas, 0.8)) : 0);
        if (s.kagit && o > 0.2) kagitYazisi = true;
      });
    }

    /* ——— SVG: oklar, halkalar, tüneller, şerit ——— */
    var defs = E2('defs', {}, svg);
    var dg = E2('linearGradient', { id: 'kd4-cerceve', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    [['0', '#f3d584'], ['1', '#c9972f']].forEach(function (d) { E2('stop', { offset: d[0], 'stop-color': d[1] }, dg); });
    function yol(oz) { var p = E2('path', Object.assign({ d: 'M0 0', fill: 'none' }, oz || {}), svg); p.style.opacity = 0; p._o = 0; return p; }
    function gizle(p) { if (p._o !== 0) { p.style.opacity = 0; p._o = 0; } }
    function goster(p, d, o) { if (o <= 0.003) { gizle(p); return; } p.setAttribute('d', d); p.style.opacity = o; p._o = o; }
    function daire(cx, cy, r) { return 'M' + f1(cx - r) + ' ' + f1(cy) + ' a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0 a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
    function elips(cx, cy, rx, ry) { return 'M' + f1(cx - rx) + ' ' + f1(cy) + ' a' + f1(rx) + ' ' + f1(ry) + ' 0 1 0 ' + f1(2 * rx) + ' 0 a' + f1(rx) + ' ' + f1(ry) + ' 0 1 0 ' + f1(-2 * rx) + ' 0Z'; }
    function f1(x) { return x.toFixed(1); }
    function cizgi(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]); }).join(' '); }
    // ok ucu: p ucunda, q yönünden gelen
    function ucYol(p, q, b) { var dx = p[0] - q[0], dy = p[1] - q[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; b = b || 22;
      return 'M' + f1(p[0] + ux * 4) + ' ' + f1(p[1] + uy * 4) + ' L' + f1(p[0] - ux * b - uy * b * 0.6) + ' ' + f1(p[1] - uy * b + ux * b * 0.6) + ' L' + f1(p[0] - ux * b + uy * b * 0.6) + ' ' + f1(p[1] - uy * b - ux * b * 0.6) + 'Z'; }
    var halkalar = [0, 1, 2, 3].map(function () { return yol({ stroke: '#ffe29a', 'stroke-width': 4 }); });
    var buyutecHalka = yol({ stroke: 'url(#kd4-cerceve)', 'stroke-width': 10 });
    var buyutecSap = yol({ stroke: '#c9972f', 'stroke-width': 16, 'stroke-linecap': 'round' });
    var deredeSel = yol({ stroke: 'rgba(96,178,222,0.85)', 'stroke-width': 26, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    var deredeIp = yol({ stroke: 'rgba(235,252,255,0.9)', 'stroke-width': 4, 'stroke-dasharray': '18 26', 'stroke-linecap': 'round' });
    var tuneller = [0, 1, 2, 3].map(function () { return yol({ stroke: 'rgba(70,38,18,0.5)', 'stroke-width': 20, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); });
    var miseller = [0, 1, 2, 3, 4, 5, 6].map(function () { return yol({ stroke: 'rgba(250,244,226,0.75)', 'stroke-width': 2.4 }); });
    var dongu = yol({ stroke: '#ffe29a', 'stroke-width': 5, 'stroke-dasharray': '16 14', 'stroke-linecap': 'round' });
    var donguUc = [0, 1, 2].map(function () { return yol({ fill: '#ffe29a' }); });
    var gol = yol({ fill: 'rgba(120,190,235,0.72)', stroke: 'rgba(230,248,255,0.85)', 'stroke-width': 3 });
    var havaParilti = yol({ stroke: 'rgba(120,190,255,0.22)', 'stroke-linecap': 'round' });
    var havaSerit = yol({ stroke: 'rgba(130,200,255,0.72)', 'stroke-linecap': 'round' });
    var havaKalkan = yol({ stroke: 'rgba(200,230,255,0.6)', 'stroke-width': 3, 'stroke-dasharray': '4 12', 'stroke-linecap': 'round' });
    var cerceve = yol({ stroke: '#d9a93f', 'stroke-width': 6 });
    var catlakSu = yol({ stroke: '#6fd0ff', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    var siseGovde = yol({ stroke: 'rgba(225,245,255,0.95)', 'stroke-width': 5, fill: 'rgba(190,225,240,0.18)', 'stroke-linejoin': 'round' });
    var siseSu = yol({ fill: 'rgba(90,180,235,0.85)' });
    var siseCatlak = yol({ stroke: 'rgba(255,255,255,0.95)', 'stroke-width': 3 });
    var esIp = yol({ stroke: '#ffe29a', 'stroke-width': 4, 'stroke-dasharray': '3 10', 'stroke-linecap': 'round' });
    // fabrika şeması
    var OK = {};
    [['isik', '#ffe08a'], ['su', '#7fd4ff'], ['co2', '#c8d2e6'], ['o2', '#ffffff'], ['seker', '#f3c34a']].forEach(function (k) {
      OK[k[0]] = { cizgi: yol({ stroke: k[1], 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), uc: yol({ fill: k[1] }) };
    });
    var stoma = { kap: yol({ fill: 'rgba(214,236,196,0.95)', stroke: 'url(#kd4-cerceve)', 'stroke-width': 7 }), sol: yol({ fill: '#3f8a3a', stroke: '#2a5f28', 'stroke-width': 2 }),
      sag: yol({ fill: '#3f8a3a', stroke: '#2a5f28', 'stroke-width': 2 }), bag: yol({ stroke: '#ffe29a', 'stroke-width': 3, 'stroke-dasharray': '4 9' }) };
    var SVG_HEPSI = [buyutecHalka, buyutecSap, deredeSel, deredeIp, dongu, gol, havaParilti, havaSerit, havaKalkan, cerceve, catlakSu, siseGovde, siseSu, siseCatlak, esIp]
      .concat(halkalar, tuneller, miseller, donguUc, [stoma.kap, stoma.sol, stoma.sag, stoma.bag]);
    Object.keys(OK).forEach(function (k) { SVG_HEPSI.push(OK[k].cizgi, OK[k].uc); });
    var kullanildi = [];
    function kullan(p) { kullanildi.push(p); }

    /* ——— ortak katmanlar ——— */
    var PG = 1696, PH = 954, K = PG / 1672;
    function P(px, py) { return [800 + (px - 836) * K, 450 + (py - 470.5) * K]; }   // ham görsel pikseli → sahne noktası
    // toprak kesiti biraz büyük ve aşağıda çizilir: durakta yüzeydeki yapraklar ve mantar tepsinin üstündeki bantta kalsın
    var TS = 1.25, TY = 570;
    function PT(px, py) { return [800 + (px - 836) * K * TS, TY + (py - 470.5) * K * TS]; }
    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    // sade gök: yaz vadisinin sağ üstü (bulutlar ve uzak tepeler); yakın plan nesnelerin arkasında kalabalık etmez
    function gok(d, carp) { T.ciz('vadi-yaz', { x: -159, y: 813, g: PG * 2.1, h: PH * 2.1, d: d, carp: carp, doy: 0.85 }); }
    function ekranR(x, y, r) { var e = T.ekran(x, y, 1), e2 = T.ekran(x + r, y, 1); return { x: e.x, y: e.y, r: e2.x - e.x }; }
    function isima(x, y, r, renk, o) { var s = ekranR(x, y, r); T.iz(s.x, s.y, s.r, s.r, 0, renk[0], renk[1], renk[2], o); T.izBitir(); }
    // çoklu çizgi üzerinde s (0..1) oranındaki nokta
    function hazirla(pts) { var L = [0]; for (var i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { p: pts, L: L, top: L[L.length - 1] }; }
    function uzerinde(y, s) {
      var h = sinirla(s, 0, 1) * y.top, i = 1;
      while (i < y.L.length - 1 && y.L[i] < h) i++;
      var a = y.p[i - 1], b = y.p[i], k = (h - y.L[i - 1]) / ((y.L[i] - y.L[i - 1]) || 1);
      return [kr(a[0], b[0], k), kr(a[1], b[1], k), Math.atan2(b[1] - a[1], b[0] - a[0])];
    }
    function dunyaCizgi(pts) { return cizgi(pts.map(function (p) { var e = T.ekran(p[0], p[1], 1); return [e.x, e.y]; })); }
    // akan parçacıklar: yol boyunca n tane, hız (oran/sn), renk; dunya true ise kamera ile gider
    function akis(y, a, n, hiz, renk, b, o, dunya, ters) {
      if (o <= 0.01) return;
      for (var i = 0; i < n; i++) {
        var s = (i / n + a * hiz) % 1; if (ters) s = 1 - s;
        var q = uzerinde(y, s), e = dunya ? T.ekran(q[0], q[1], 1) : { x: q[0], y: q[1] };
        var u = Math.sin(Math.PI * (ters ? 1 - s : s));
        T.iz(e.x, e.y, b, b, 0, renk[0], renk[1], renk[2], o * Math.min(1, u * 3));
      }
      T.izBitir();
    }
    function yildizlar(a, o, ust, alt) {
      if (o <= 0.01) return;
      for (var i = 0; i < 130; i++) {
        var x = hash(i, 1) * 1600, y = (ust || 0) + hash(i, 2) * ((alt || 560) - (ust || 0));
        var p = 0.55 + 0.45 * Math.sin(a * (0.7 + hash(i, 3)) + i * 1.7);
        var b = 1.4 + hash(i, 4) * 2.2;
        T.iz(x, y, b, b, 0, 1, 0.95, 0.82, o * p);
      }
      T.izBitir();
    }
    function kar(a, o, sol, sag, ust, alt) {
      if (o <= 0.01) return;
      var s0 = sol == null ? -20 : sol, gen = (sag == null ? 1620 : sag) - s0, u = ust || 0, h0 = (alt || 900) - u, kucuk = gen < 800;
      for (var i = 0; i < 160; i++) {
        if (kucuk && i % 3) continue;
        var yakin = i >= 110, hz = yakin ? 90 + hash(i, 5) * 40 : 36 + hash(i, 5) * 24, b = yakin ? 5 + hash(i, 7) * 3.5 : 2 + hash(i, 7) * 2;
        if (kucuk) { hz *= 0.4; b *= 0.55; }
        var y = u + ((a * hz + hash(i, 6) * h0) % h0);
        var x = s0 + hash(i, 8) * gen + Math.sin(a * (0.6 + hash(i, 9)) + i) * (yakin ? 22 : 10) + (y - u) * 0.06;   // rüzgâr soldan
        T.iz(x, y, b, b, 0, 1, 1, 1, (yakin ? 0.92 : 0.7) * o);
      }
      T.izBitir();
    }
    function buyutec(x, y, r, o) {
      if (o <= 0.01) return;
      goster(buyutecHalka, daire(x, y, r), o); kullan(buyutecHalka);
      goster(buyutecSap, 'M' + f1(x + r * 0.72) + ' ' + f1(y + r * 0.72) + ' L' + f1(x + r * 1.15) + ' ' + f1(y + r * 1.15), o); kullan(buyutecSap);
    }
    function halka(i, x, y, r, o) { goster(halkalar[i], daire(x, y, r), o); kullan(halkalar[i]); }

    /* ——— yollar (ham görsel pikselinden) ——— */
    var VADI_DERE = hazirla([[205, 445], [260, 503], [340, 546], [420, 578], [500, 613], [580, 650], [660, 651], [740, 661], [820, 699], [900, 705], [980, 713], [1060, 748], [1140, 752], [1220, 741], [1300, 759]].map(function (p) { return P(p[0], p[1]); }));
    var BAHCE_DERE = hazirla([[1470, 520], [1420, 560], [1330, 610], [1290, 660], [1360, 720], [1430, 780], [1400, 850], [1320, 941]].map(function (p) { return P(p[0], p[1]); }));
    var YAPRAK_SU = hazirla([[250, 640], [300, 628], [487, 578], [652, 555], [838, 487], [967, 467], [1197, 378], [1422, 313], [1518, 262], [1640, 200]].map(function (p) { return P(p[0], p[1]); }));
    var YAPRAK_SEKER = hazirla([[250, 600], [300, 590], [487, 540], [652, 517], [838, 449], [967, 429], [1197, 340], [1422, 275], [1518, 224], [1640, 162]].map(function (p) { return P(p[0], p[1]); }));
    var STOMA = [[243, 830], [628, 830], [1033, 830], [1433, 830]].map(function (p) { return P(p[0], p[1]); });
    var DERE_TAS = hazirla([[190, 250], [320, 330], [440, 430], [560, 540], [700, 600], [860, 610], [1020, 620], [1180, 650], [1350, 690], [1500, 740]].map(function (p) { return P(p[0], p[1]); }));
    var KOKLER = [[[700, 380], [520, 330], [330, 250], [272, 196], [272, 0]], [[600, 600], [430, 450], [300, 290], [272, 196], [272, 0]], [[150, 520], [215, 350], [258, 225], [272, 196], [272, 0]]]
      .map(function (y) { return hazirla(y.map(function (p) { return PT(p[0], p[1]); })); });
    var TUNEL = [[[860, 300], [930, 360], [1010, 380], [1090, 420], [1150, 470]], [[980, 190], [995, 250], [1010, 310], [1000, 380]], [[1150, 470], [1190, 540], [1170, 610]], [[660, 190], [670, 250], [720, 300]]];
    var MISEL = [[[1110, 194], [1060, 240], [1010, 262], [950, 262]], [[1110, 194], [1140, 250], [1190, 290], [1260, 310]], [[1110, 194], [1110, 270], [1090, 330], [1060, 360]],
      [[1110, 194], [1170, 224], [1240, 236], [1310, 280]], [[1060, 240], [1030, 300], [1000, 330]], [[1190, 290], [1185, 350], [1210, 390]], [[760, 194], [810, 236], [880, 248], [930, 270]]];

    /* ——— durak durumu ——— */
    var dolu = {}, cikan = null, hv = 50, aSimdi = 0, acik = null;

    /* ——— bölümler ——— */
    // 0. Kanca: güneşe karşı tek yeşil yaprak; damarında su yapraka, şeker sapa doğru akar
    var YAP = { x: 820, y: 470, g: 900, r: -14 };
    function yaprakNokta(px, py, r) {     // yaprak görselindeki nokta (900×536) → sahne
      var aa = r * Math.PI / 180, dx = (px - 450) * YAP.g / 900, dy = (py - 268) * YAP.g / 900;
      return [YAP.x + dx * Math.cos(aa) - dy * Math.sin(aa), YAP.y + dx * Math.sin(aa) + dy * Math.cos(aa)];
    }
    function kanca(t, a) {
      T.bas(a, { x: 800, y: 450, z: kr(1.0, 1.1, tw(t, 0, KES.sir, Y.sin)) });
      gok(0.25, [0.62, 0.7, 0.88]);
      var e = T.ekran(240, 120, 0.4); T.iz(e.x, e.y, 420, 420, 0, 1, 0.9, 0.6, 0.22); T.iz(e.x, e.y, 160, 160, 0, 1, 0.95, 0.75, 0.3); T.izBitir();
      var r = YAP.r + Math.sin(a * 0.9) * 1.6;
      T.ciz('yaprak', { x: YAP.x, y: YAP.y, g: YAP.g, r: r, d: 1, parilti: 0.4, ekle: [0.03, 0.05, 0.01] });
      // ana damar: sapın ucundan yaprağın ucuna
      var s0 = yaprakNokta(30, 268, r), s1 = yaprakNokta(880, 268, r), damar = hazirla([s0, s1]);
      var cal = tw(t, AN.calisir, 1.2);
      akis(damar, a, 6, 0.16, [0.55, 0.85, 1], 4.5, 0.85 * cal, true);           // su sapın içinden yaprağa
      akis(damar, a + 0.5, 6, 0.12, [1, 0.82, 0.32], 4.5, 0.9 * cal, true, true);  // şeker yapraktan sapa
      for (var i = 0; i < 26; i++) {                                              // ışığın içinde toz zerreleri
        var k = (a * 0.03 + hash(i, 21)) % 1, x = 120 + hash(i, 22) * 900 + k * 160, y = 80 + hash(i, 23) * 520 - k * 90;
        T.iz(x, y, 2.4, 2.4, 0, 1, 0.96, 0.82, 0.45 * Math.sin(k * Math.PI));
      }
      T.izBitir();
    }
    // 1. Açık sır: kumsal, büyüteçte kum taneleri
    function sirAcilis(t, a) {
      var k = ic(t, KES.sir, KES.vadi - KES.sir);
      T.bas(a, { x: kr(560, 720, k), y: 722, z: 2.2 });
      plaka('deniz', { d: 1, su: 0.8, parilti: 0.6 });
      var b = tw(t, AN.wKum, 0.7) * (1 - tw(t, AN.cevap + 0.6, 0.6));
      if (b > 0.01) {
        var r = 215 * kr(0.85, 1, b);
        T.ciz('kum-taneleri', { x: 800, y: 450, g: r * 2, d: 0, o: b, parilti: 0.4 });
        buyutec(800, 450, r, b);
      }
    }
    // 2. Vadi: dağdan denize uzanan geniş plan, dere soldan sağa akar
    function vadiSahne(t, a) {
      var kam = kameraYolu(t, [[KES.vadi, { x: 430, y: 300, z: 1.7 }], [AN.wDag + 0.6, { x: 450, y: 300, z: 1.7 }], [AN.wBahce + 0.2, { x: 760, y: 480, z: 1.45 }],
        [AN.wDeniz + 0.3, { x: 1150, y: 560, z: 1.45 }], [AN.tahmin - 0.6, { x: 800, y: 450, z: 1.02 }]]);
      T.bas(a, kam);
      plaka('vadi-yaz', { d: 1, parilti: 0.6 });
      akis(VADI_DERE, a, 22, 0.035, [0.92, 1, 1], 3, 0.7, true);
    }
    // 3. Bahçe: elma ağacı; durakta sahne durur, sonra elmaya yaklaşılır
    var ELMA = P(700, 355);
    function bahceSahne(t, a) {
      var yak = tw(t, AN.elma, AN.yan - AN.elma - 0.4, Y.ikili);
      T.bas(a, { x: kr(800, ELMA[0], yak), y: kr(450, ELMA[1] + 10, yak), z: kr(1.02, 2.4, yak) });
      plaka('bahce', { d: 1, ruzgar: 0.35, parilti: 0.5 });
      akis(BAHCE_DERE, a, 12, 0.05, [0.92, 1, 1], 3, 0.6, true);
      var h = pencere(t, AN.elma + 1.2, AN.yan - 0.2, 0.5, 0.3);
      if (h > 0.01) { var e = ekranR(ELMA[0], ELMA[1], 24); halka(0, e.x, e.y, e.r * (1 + 0.08 * Math.sin(a * 4)), h); }
    }
    // 4. Elma dalı: yaprak parlar, sonra yaprağın içine dalınır
    var DAL = { x: 800, y: 450, g: 700 }, DAL_YAPRAK = [908, 278];
    function dalSahne(t, a) {
      var dal = tw(t, AN.gir + 0.2, KES.ic - AN.gir - 0.2, Y.gir);
      T.bas(a, { x: kr(800, DAL_YAPRAK[0], dal), y: kr(450, DAL_YAPRAK[1], dal), z: kr(1, 4.2, dal) });
      gok(0.3, [0.7, 0.78, 0.94]);
      var parla = pencere(t, AN.yan + 0.2, KES.ic, 0.6, 0.3);
      if (parla > 0.01) isima(DAL_YAPRAK[0], DAL_YAPRAK[1], 230, [0.85, 1, 0.55], 0.28 * parla);
      T.ciz('dal', { x: DAL.x, y: DAL.y, g: DAL.g, d: 1, r: Math.sin(a * 0.7) * 1.4, parilti: 0.3 });
    }
    // 5. Yaprağın içi: su kanalda yukarı, şeker öbür şeritte aşağı; gözeneklerden gaz girer, oksijen çıkar
    function icSahne(t, a) {
      var kam = kameraYolu(t, [[KES.ic, { x: 800, y: 450, z: 1.35 }], [KES.ic + 1.4, { x: 800, y: 450, z: 1.06 }], [AN.delik - 0.2, { x: 800, y: 450, z: 1.06 }],
        [AN.delik + 1, { x: 800, y: 567, z: 1.25 }], [AN.guc - 0.4, { x: 800, y: 567, z: 1.25 }], [AN.guc + 0.6, { x: 700, y: 360, z: 1.2 }],
        [AN.seker + 0.4, { x: 920, y: 400, z: 1.15 }], [AN.oksijen - 0.3, { x: 920, y: 400, z: 1.15 }], [AN.oksijen + 0.6, { x: 800, y: 567, z: 1.25 }],
        [AN.yani + 1.5, { x: 800, y: 567, z: 1.25 }], [KES.fab - 0.3, { x: 800, y: 470, z: 1.06 }]]);
      T.bas(a, { x: kam.x + Math.sin(a * 0.08) * 10, y: kam.y, z: kam.z });
      var gun = tw(t, AN.guc, 1.2);
      plaka('yaprak-ici', { d: 1, parilti: 0.5 + 0.5 * gun, ekle: [0.06 * gun, 0.05 * gun, 0] });
      // güneş: sol üstten
      var e = T.ekran(120, 40, 1); T.iz(e.x, e.y, 360, 300, 0, 1, 0.92, 0.6, 0.12 + 0.22 * gun); T.izBitir();
      if (gun > 0.01) {                                                     // kloroplastlarda ışık
        for (var i = 0; i < 60; i++) { var q = T.ekran(P(hash(i, 31) * 1672, 0)[0], P(0, 140 + hash(i, 32) * 230)[1], 1); var p = Math.pow(0.5 + 0.5 * Math.sin(a * (1.2 + hash(i, 33)) + i), 4);
          T.iz(q.x, q.y, 6, 6, 0, 0.85, 1, 0.55, gun * 0.7 * p); }
        T.izBitir();
      }
      akis(YAPRAK_SU, a, 12, 0.06, [0.55, 0.88, 1], 11, tw(t, AN.kok, 1), true);
      akis(YAPRAK_SEKER, a, 12, 0.05, [1, 0.78, 0.22], 10, tw(t, AN.seker, 1), true, true);
      // gözenekler
      var dl = pencere(t, AN.delik, KES.fab, 0.6, 0.3);
      STOMA.forEach(function (s, i) { if (i < 4 && dl > 0.01) { var q = ekranR(s[0], s[1], 46); halka(i, q.x, q.y, q.r * (1 + 0.06 * Math.sin(a * 3 + i)), dl * 0.9); } });
      var co = tw(t, AN.wCo2 - 0.3, 0.8), ok = tw(t, AN.wO2 - 0.3, 0.8);
      for (var j = 0; j < 4; j++) {
        var s = STOMA[j];
        for (var m = 0; m < 4; m++) {
          var f = (a * 0.42 + m / 4 + j * 0.13) % 1;
          if (co > 0.01) { var y1 = kr(s[1] + 85, s[1] - 85, f), q1 = T.ekran(s[0] - 14 + Math.sin(f * 9 + m) * 10, y1, 1); T.iz(q1.x, q1.y, 10, 10, 0, 0.62, 0.68, 0.8, co * Math.sin(f * Math.PI)); }
          if (ok > 0.01) { var y2 = kr(s[1] - 85, s[1] + 85, (f + 0.5) % 1), q2 = T.ekran(s[0] + 14 + Math.sin(f * 7 + m) * 10, y2, 1); T.iz(q2.x, q2.y, 10, 10, 0, 1, 1, 1, ok * Math.sin(((f + 0.5) % 1) * Math.PI)); }
        }
      }
      T.izBitir();
    }
    // 6. Fabrika şeması: elma dalı, oklar, gözenek yakın planı
    var FAB = { dal: { x: 560, y: 335, g: 700 }, gunes: [1250, 128] };   // Güneş pul tepsisinin (sağ üst köşe) altında kalmaz
    var FAB_YOL = {
      isik: hazirla([[1158, 160], [950, 156], [735, 152]]),
      su: hazirla([[232, 548], [330, 440], [412, 342], [448, 300], [466, 270]]),
      seker: hazirla([[484, 282], [450, 318], [438, 348], [470, 392], [494, 440], [492, 500]]),
      co2: hazirla([[870, 572], [905, 532], [932, 498]]),      // gözenek çemberinin kenarında biter
      o2: hazirla([[1088, 468], [1160, 515], [1236, 545]])
    };
    var FAB_RENK = { isik: [1, 0.88, 0.54], su: [0.5, 0.83, 1], co2: [0.78, 0.82, 0.9], o2: [1, 1, 1], seker: [0.95, 0.76, 0.29] };
    var FAB_SIRA = { isik: 0, su: 1, co2: 2, o2: 3, seker: 4 };
    function fabrikaSahne(t, a) {
      T.bas(a, { x: 800, y: 450, z: 1 });
      gok(1, [0.55, 0.62, 0.8]);
      T.ciz('gunes', { x: FAB.gunes[0], y: FAB.gunes[1], g: 176, r: a * 2, d: 1, parilti: 1 });
      T.ciz('dal', { x: FAB.dal.x, y: FAB.dal.y, g: FAB.dal.g, d: 1, parilti: 0.3 });
      var ac = tw(t, KES.fab + 0.2, 1.2), bitti = api.bitti('fabrika') || (t > D.fabrika + 0.05 && acik !== 'fabrika');
      // gözenek yakın planı: yaprağın altından alınmış bir delik ve iki bekçi hücre
      var cx = 1000, cy = 420, r = 95;
      goster(stoma.kap, daire(cx, cy, r), ac); goster(stoma.bag, 'M770 212 L' + f1(cx - r * 0.7) + ' ' + f1(cy - r * 0.7), ac * 0.9);
      goster(stoma.sol, 'M' + (cx - 6) + ' ' + (cy - 46) + ' C' + (cx - 58) + ' ' + (cy - 44) + ' ' + (cx - 58) + ' ' + (cy + 44) + ' ' + (cx - 6) + ' ' + (cy + 46) + ' C' + (cx - 22) + ' ' + (cy + 20) + ' ' + (cx - 22) + ' ' + (cy - 20) + ' ' + (cx - 6) + ' ' + (cy - 46) + 'Z', ac);
      goster(stoma.sag, 'M' + (cx + 6) + ' ' + (cy - 46) + ' C' + (cx + 58) + ' ' + (cy - 44) + ' ' + (cx + 58) + ' ' + (cy + 44) + ' ' + (cx + 6) + ' ' + (cy + 46) + ' C' + (cx + 22) + ' ' + (cy + 20) + ' ' + (cx + 22) + ' ' + (cy - 20) + ' ' + (cx + 6) + ' ' + (cy - 46) + 'Z', ac);
      [stoma.kap, stoma.bag, stoma.sol, stoma.sag].forEach(kullan);
      Object.keys(FAB_YOL).forEach(function (k, n) {
        var y = FAB_YOL[k], i = FAB_SIRA[k];
        var calisir = k === 'isik' || bitti || (acik === 'fabrika' && (k === 'seker' ? dolu[1] && dolu[2] && dolu[3] : dolu[i]));
        var o = ac * (calisir ? 1 : 0.6);
        goster(OK[k].cizgi, cizgi(y.p), o); goster(OK[k].uc, ucYol(y.p[y.p.length - 1], y.p[y.p.length - 2]), Math.max(o, ac * 0.7));
        kullan(OK[k].cizgi); kullan(OK[k].uc);
        if (calisir) akis(y, a + n * 0.21, k === 'isik' ? 7 : 6, k === 'isik' ? 0.5 : 0.28, FAB_RENK[k], k === 'isik' ? 5 : 6.5, ac, false);
      });
      // şeker elmaya ulaşınca elma ışır
      var tatli = bitti ? 1 : (acik === 'fabrika' && dolu[1] && dolu[2] && dolu[3] ? 1 : 0);
      if (tatli) isima(489, 536, 170, [1, 0.45, 0.3], 0.22 + 0.06 * Math.sin(a * 3));
    }
    // 7. Sonbahar: bahçe sararır, yapraklar salınarak düşer (rüzgâr soldan)
    function sonbaharSahne(t, a) {
      var kam = kameraYolu(t, [[KES.sonbahar, { x: 800, y: 450, z: 1.02 }], [AN.cop, { x: 760, y: 470, z: 1.15 }], [KES.toprak, { x: 600, y: 640, z: 1.6 }]]);
      T.bas(a, kam);
      plaka('bahce', { d: 1 });
      var g = tw(t, AN.sonbahar + 0.3, 2.2, Y.sin);
      if (g > 0.01) plaka('bahce-sonbahar', { d: 1, gecis: { k: g, yon: 0, yumusak: 0.18, ac: true } });
      var gec = Math.max(0, t - (AN.sonbahar + 1.2));
      for (var i = 0; i < 18; i++) {
        var bas = hash(i, 41) * 4.5, u = gec - bas; if (u <= 0) continue;
        var x0 = P(280 + hash(i, 42) * 660, 0)[0], y0 = P(0, 120 + hash(i, 43) * 380)[1], zemin = P(0, 700 + hash(i, 44) * 120)[1];
        var hz = 70 + hash(i, 45) * 40, y = Math.min(zemin, y0 + u * hz), yere = y >= zemin;
        var x = x0 + (yere ? (zemin - y0) / hz : u) * (18 + hash(i, 46) * 14) + (yere ? 0 : Math.sin(u * (1.6 + hash(i, 47)) + i) * 26);
        var rr = yere ? hash(i, 48) * 140 - 70 : Math.sin(u * 2.1 + i) * 50 + hash(i, 49) * 40;
        T.ciz('yaprak-sari', { x: x, y: y, g: 46 + hash(i, 50) * 22, r: rr, d: 1 });
      }
    }
    // 8. Toprak: kökler, solucan ve tünelleri, mantar ve iplikleri, minik canlılar; durakta çıkan işçinin yokluğu görünür
    var SOLUCAN0 = [1000, 450], MANTAR = [1110, 192];   // solucan sahne noktasında, mantar ham görselde (yüzeyde)
    function solucanYer(a) { var f = Math.sin(a * 0.22); return [SOLUCAN0[0] + f * 26, SOLUCAN0[1] + Math.sin(a * 0.22 + 1.2) * 8, Math.cos(a * 0.22) * 0.12]; }   // tutulacak halkanın içinde kalır
    function toprakSahne(t, a) {
      var P = PT;                                                   // bu bölümde ham görsel noktası büyük kesite göre çevrilir
      var durakta = acik === 'toprak', c = durakta ? cikan : null;
      var kam = kameraYolu(t, [[KES.toprak, { x: 485, y: 300, z: 1.5 }], [AN.solucanlar + 0.4, { x: 800, y: 450, z: 1.02 }], [AN.olmasa - 1.2, { x: 800, y: 450, z: 1.02 }], [AN.olmasa - 0.2, { x: 800, y: 450, z: 1 }]]);
      T.bas(a, kam);
      var sert = c === 'solucan' ? 1 : 0, fakir = c === 'yaprak' || c === 'mantar' ? 1 : 0;
      plaka('toprak', { y: TY, g: PG * TS, h: PH * TS, d: 1, carp: sert ? [0.78, 0.72, 0.68] : fakir ? [1.08, 1.0, 0.86] : [1, 1, 1], doy: fakir ? 0.72 : 1 });
      // tüneller: solucan kazdıkça görünür; solucan çıkarılınca kapanır
      var tu = tw(t, AN.solucanlar, 1.2) * (sert ? 0 : 1);
      TUNEL.forEach(function (y, i) { goster(tuneller[i], dunyaCizgi(y.map(function (p) { return P(p[0], p[1]); })), tu * (i === 0 || t > AN.kazar ? 1 : 0.4)); kullan(tuneller[i]); });
      // mantar iplikleri ve mantarlar
      var ma = tw(t, AN.solucanlar + 0.8, 1) * (c === 'mantar' ? 0 : 1);
      MISEL.forEach(function (y, i) { goster(miseller[i], dunyaCizgi(y.map(function (p) { return P(p[0], p[1]); })), ma * 0.85); kullan(miseller[i]); });
      if (ma > 0.01) T.ciz('mantar', { x: P(MANTAR[0], MANTAR[1])[0], y: P(MANTAR[0], MANTAR[1])[1] + 4, h: 150 * kr(0.4, 1, ma), ax: 0.5, ay: 1, d: 1, o: ma });
      // düşen yapraklar: toprağın üstünde; yavaş yavaş toprağa karışır, yeni düşenler gelir
      var cu = tw(t, AN.yer, 3.5), yy = c === 'yaprak' ? 0 : 1, yigin = c === 'mantar' ? 1 : 0;
      var nY = yigin ? 20 : 8;
      for (var i = 0; i < nY; i++) {
        var px = 540 + hash(i, 61) * (yigin ? 330 : 260), py = 188 - (yigin ? hash(i, 62) * 18 : hash(i, 62) * 3);
        var q = P(px, py), o = yy * (yigin ? 1 : kr(1, i < 4 ? 0.25 : 0.85, cu)), sk = yigin ? 1 : kr(1, i < 4 ? 0.6 : 1, cu);
        // yere düşmüş yaprak yatık durur: yalnız biraz eğik, yukarı bakmaz
        if (o > 0.01) T.ciz('yaprak-sari', { x: q[0], y: q[1], g: 96 * sk, h: 40 * sk, r: hash(i, 63) * 16 - 8, d: 1, o: o, carp: [0.92, 0.8, 0.6] });
      }
      // solucan
      if (t > AN.solucanlar - 0.2 && !sert) {
        var sy = solucanYer(a), so = tw(t, AN.solucanlar - 0.2, 0.6), q2 = [sy[0], sy[1]];
        T.ciz('solucan', { x: q2[0], y: q2[1], g: 240, r: sy[2] * 57.3, d: 1, o: so, sal: 5, faz: a * 3 });
      }
      // minik canlılar
      var mi = tw(t, AN.solucanlar + 1.6, 1) * (fakir ? 0.35 : 1);
      if (mi > 0.01) {
        for (var j = 0; j < 70; j++) {
          var bx = j < 40 ? 540 + hash(j, 71) * 420 : 200 + hash(j, 71) * 600, by = j < 40 ? 200 + hash(j, 72) * 120 : 260 + hash(j, 72) * 420;
          var w = T.ekran(P(bx, by)[0] + Math.sin(a * (1 + hash(j, 73)) + j) * 6, P(bx, by)[1] + Math.cos(a * (1.3 + hash(j, 74)) + j) * 5, 1);
          T.iz(w.x, w.y, 2.2, 2.2, 0, 0.95, 0.9, 0.7, 0.55 * mi);
        }
        T.izBitir();
      }
      // çay kaşığı kadar toprak: büyüteçte kaynaşan canlılar
      var ka = pencere(t, AN.kasik, AN.yer + 0.4, 0.5, 0.4);
      if (ka > 0.01) {
        var m = P(1250, 420), mm = ekranR(m[0], m[1], 105);
        T.iz(mm.x, mm.y, mm.r, mm.r, 0, 0.3, 0.17, 0.08, 0.85 * ka);
        for (var n = 0; n < 160; n++) { var aa = hash(n, 81) * 6.283, rr = Math.sqrt(hash(n, 82)) * mm.r * 0.9;
          T.iz(mm.x + Math.cos(aa + a * 0.3 * (hash(n, 83) - 0.5)) * rr, mm.y + Math.sin(aa + a * 0.3 * (hash(n, 83) - 0.5)) * rr, 2.2, 2.2, 0, 1, 0.92, 0.7, ka); }
        T.izBitir();
        buyutec(mm.x, mm.y, mm.r, ka);
      }
      // yağmur suyu tünellerden aşağı süzülür (solucan yoksa üstte göllenir)
      var ya = (t > AN.kazar ? tw(t, AN.kazar, 0.8) : 0) * (durakta ? (sert ? 1 : 0.6) : 1) * (t > AN.kokler + 1 && !durakta ? 0 : 1);
      if (ya > 0.01) {
        for (var d1 = 0; d1 < 16; d1++) {
          var f = (a * 0.35 + d1 / 16) % 1, tun = TUNEL[d1 % 2 === 0 ? 1 : 0];
          var py2 = sert ? kr(-40, 172, Math.min(1, f * 1.4)) : null;
          var pos = sert ? P(900 + hash(d1, 91) * 300, py2) : uzerinde(hazirla(tun.map(function (p) { return P(p[0], p[1]); })), f);
          var w2 = T.ekran(pos[0], pos[1], 1);
          T.iz(w2.x, w2.y, 6, 9, 0, 0.55, 0.82, 1, ya * (sert && f > 0.7 ? 0 : 0.9));
        }
        T.izBitir();
      }
      if (sert) { var gq = T.ekran(P(1000, 190)[0], P(1000, 190)[1], 1); goster(gol, elips(gq.x, gq.y, 150 + 6 * Math.sin(a * 2), 12), 0.9); kullan(gol); }
      // kökler besini suyla birlikte çeker, gövdeden yukarı çıkar
      var ko = pencere(t, AN.kokler, AN.bahar - 0.2, 0.6, 0.4);
      KOKLER.forEach(function (y, i) { akis(y, a + i * 0.3, 9, 0.12, [1, 0.84, 0.3], 8, ko, true); });
      // hiçbir şey boşa gitmez: yaprak → toprak → kök → ağaç → yaprak
      var dn = pencere(t, AN.bosa + 0.2, D.toprak - 0.6, 0.6, 0.4);
      if (dn > 0.01) {
        var o0 = T.ekran(P(470, 255)[0], P(470, 255)[1], 1), R = ekranR(0, 0, 330).r, ry = R * 0.42;   // yüzeydeki yaprak, toprak, kökler ve gövde aynı halkada
        var off = (a * 40) % 30;
        dongu.setAttribute('stroke-dashoffset', f1(-off));
        goster(dongu, elips(o0.x, o0.y, R, ry), dn); kullan(dongu);
        [0.1, 0.43, 0.76].forEach(function (u, i) {
          var ang = -u * Math.PI * 2, p = [o0.x + Math.cos(ang) * R, o0.y + Math.sin(ang) * ry], q = [o0.x + Math.cos(ang + 0.2) * R, o0.y + Math.sin(ang + 0.2) * ry];
          goster(donguUc[i], ucYol(p, q, 20), dn); kullan(donguUc[i]);
        });
      }
    }
    // 8b. Bahar: aynı bahçe çiçek açmış, taze yapraklar
    function baharAni(t, a) {
      T.bas(a, { x: kr(700, 760, ic(t, KES.bahar, 3.3)), y: 480, z: 1.9 });
      plaka('vadi-bahar', { d: 1, parilti: 0.5 });
      for (var i = 0; i < 30; i++) {                                    // çiçek yaprakları rüzgârla sağa savrulur
        var k = (a * (0.08 + hash(i, 101) * 0.05) + hash(i, 102)) % 1, x = -40 + k * 1700, y = 160 + hash(i, 103) * 460 + Math.sin(k * 9 + i) * 30;
        T.iz(x, y, 5, 3.2, k * 9, 1, 0.94, 0.95, 0.75 * Math.sin(k * Math.PI));
      }
      T.izBitir();
    }
    // 9. Dağ: kışın kar yağar, kar aylarca kalır, bahar gelince azar azar erir
    function dagSahne(t, a) {
      var kam = kameraYolu(t, [[KES.dag, { x: 760, y: 520, z: 1.6 }], [AN.yukari + 0.3, { x: 760, y: 500, z: 1.6 }], [AN.kis, { x: 420, y: 250, z: 1.8 }],
        [AN.sel - 0.2, { x: 560, y: 330, z: 1.4 }], [AN.erir, { x: 640, y: 420, z: 1.25 }], [KES.gece, { x: 800, y: 450, z: 1.02 }]]);
      T.bas(a, kam);
      var kis = tw(t, AN.kis, 1.6, Y.sin), bahar = tw(t, AN.erir + 0.6, 2.4, Y.sin), yaz = tw(t, AN.erir + 3.4, 1.6, Y.sin);
      plaka('vadi-yaz', { d: 1, parilti: 0.5 });
      if (kis > 0.01 && yaz < 1) plaka('vadi-kis', { d: 1, gecis: { k: kis, yon: 0, yumusak: 0.2, ac: true }, o: 1 - (bahar > 0.99 ? 1 : 0) });
      if (bahar > 0.01 && yaz < 1) plaka('vadi-bahar', { d: 1, gecis: { k: bahar, yon: 0, yumusak: 0.2, ac: true } });
      if (yaz > 0.01) plaka('vadi-yaz', { d: 1, parilti: 0.5, gecis: { k: yaz, yon: 0, yumusak: 0.2, ac: true } });
      kar(a, kis * (1 - tw(t, AN.sel - 0.4, 0.8)));
      // bir anda erise sel: dere kabarır; hiç erimese su dağda kalır: dere incelir
      var sel = pencere(t, AN.sel, AN.kilit - 0.1, 0.3, 0.4), ince = pencere(t, AN.kilit, AN.erir - 0.1, 0.3, 0.4);
      if (sel > 0.01) {
        var d = dunyaCizgi(VADI_DERE.p);
        deredeSel.setAttribute('stroke-width', f1(ekranR(0, 0, 44 + 6 * Math.sin(a * 5)).r)); goster(deredeSel, d, sel); kullan(deredeSel);
        deredeIp.setAttribute('stroke-dashoffset', f1(-(a * 260) % 44)); goster(deredeIp, d, sel); kullan(deredeIp);
      }
      var akO = sel > 0.01 ? 0 : (ince > 0.01 ? 0.25 : 0.7) * (kis > 0.5 && bahar < 0.3 ? 0.5 : 1);
      akis(VADI_DERE, a, 22, 0.035 * (bahar > 0.3 ? 1 : 0.6), [0.92, 1, 1], 3, akO, true);
    }
    // 10. Gece zirvesi: yıldızlar, kayan yıldızlar yukarıda yanıp söner; hava kalkan ve yorgan; havası olmayan Ay
    function kayanYildiz(t0, t, x0, y0, aci, boy, sure, sinirY) {
      var k = (t - t0) / sure; if (k <= 0 || k >= 1) return;
      var hx = Math.cos(aci), hy = Math.sin(aci), L = boy * Math.min(1, k * 2.2), x = x0 + hx * boy * 1.6 * k, y = y0 + hy * boy * 1.6 * k;
      if (sinirY != null && y > sinirY) { y = sinirY; }
      var p = Math.sin(Math.PI * k);
      for (var i = 0; i < 14; i++) { var u = i / 14; T.iz(x - hx * L * u, y - hy * L * u, (1 - u) * 5 + 1, (1 - u) * 5 + 1, 0, 1, 0.92 - u * 0.3, 0.7 - u * 0.4, p * (1 - u) * 0.9); }
      T.iz(x, y, 14 * p, 14 * p, 0, 1, 0.85, 0.5, 0.35 * p); T.izBitir();
    }
    function geceSahne(t, a) {
      T.bas(a, { x: 800, y: kr(470, 440, tw(t, KES.gece, 8, Y.sin)), z: kr(1.04, 1.1, tw(t, KES.gece, 10, Y.sin)) });
      plaka('dag-gece', { d: 1, parilti: 0.4 });
      yildizlar(a, 1, 0, 540);
      var kal = tw(t, AN.kalkan, 0.8), sinir = kal > 0.5 ? 255 : null;
      kayanYildiz(kel('kayan') - 0.1, t, 260, 70, 0.5, 220, 1.4);
      kayanYildiz(AN.carpinca + 0.2, t, 640, 50, 0.62, 200, 1.5);
      for (var i = 0; i < 6; i++) kayanYildiz(AN.kalkan + 0.2 + i * 1.35, t, 160 + hash(i, 111) * 1100, 30 + hash(i, 112) * 60, 0.45 + hash(i, 113) * 0.3, 180, 1.2, 255);
      // kum tanesi kadar: büyüteçte küçük taş, sürtünmeyle ısınır
      var bu = pencere(t, AN.aslinda + 0.4, AN.carpinca + 0.9, 0.5, 0.4);
      if (bu > 0.01) { T.iz(1250, 300, 82, 82, 0, 0.1, 0.12, 0.26, 0.9 * bu); T.iz(1250, 300, 44, 44, 0, 1, 0.65, 0.3, 0.45 * bu * (0.7 + 0.3 * Math.sin(a * 9))); T.izBitir();
        T.ciz('kum-grup', { x: 1250, y: 300, g: 70, d: 0, o: bu, ekle: [0.25, 0.12, 0] }); buyutec(1250, 300, 82, bu); }
      if (kal > 0.01) { goster(havaKalkan, 'M-20 285 Q800 215 1620 285', kal * (1 - tw(t, KES.uzay - 0.6, 0.4))); kullan(havaKalkan); }
      // yorgan: yerden yükselen ılık hava, kalkanın altında geri döner
      var yo = pencere(t, AN.yorgan, AN.ay + 0.2, 0.6, 0.4);
      if (yo > 0.01) { for (var j = 0; j < 30; j++) { var f = (a * 0.18 + hash(j, 121)) % 1, x = 100 + hash(j, 122) * 1400, yk = f < 0.5 ? kr(720, 300, f * 2) : kr(300, 560, (f - 0.5) * 2);
        T.iz(x + Math.sin(f * 12 + j) * 10, yk, 7, 7, 0, 1, 0.66, 0.38, yo * 0.8 * Math.sin(f * Math.PI)); } T.izBitir(); }
      // havası olmayan Ay: dolunay gibi tam yuvarlak, yüzsüz
      var ay = tw(t, AN.ay - 0.1, 0.8);
      if (ay > 0.01) {
        var mx = 1250, my = 190, mr = 70;
        T.iz(mx, my, mr * 1.5, mr * 1.5, 0, 0.9, 0.9, 0.85, 0.12 * ay); T.iz(mx, my, mr, mr, 0, 0.82, 0.82, 0.8, ay); T.iz(mx + 8, my + 6, mr * 0.92, mr * 0.92, 0, 0.74, 0.74, 0.74, 0.5 * ay);
        [[-24, -18, 16], [18, 14, 20], [26, -26, 10], [-12, 28, 12], [-34, 10, 8]].forEach(function (k) { T.iz(mx + k[0], my + k[1], k[2], k[2] * 0.85, 0, 0.6, 0.6, 0.62, 0.6 * ay); });
        T.izBitir();
      }
    }
    // 11. Uzay: Dünya'nın kenarı ve ince mavi hava çizgisi; durakta çocuk kalınlığı değiştirir
    var LIMB = { x: 800 + (831 - 836) * K, y: 450 + (2498 - 470.5) * K, r: 2058.4 * K };
    function kalinlik(v) { return v < 50 ? 4 + v / 50 * 26 : 30 + (v - 50) / 50 * 110; }
    function kalinliktanDeger(th) { th = sinirla(th, 4, 140); return th < 30 ? (th - 4) / 26 * 50 : 50 + (th - 30) / 110 * 50; }
    function limbY(x, r) { var dx = x - LIMB.x; return LIMB.y - Math.sqrt(Math.max(0, r * r - dx * dx)); }
    var PEN = { x: 265, y: 170, g: 420, h: 236 };
    function uzaySahne(t, a) {
      var g = tw(t, KES.uzay, 2.2, Y.cik);
      T.bas(a, { x: 800, y: 450, z: kr(1.12, 1, g) });
      plaka('uzay-kenar', { d: 1, parilti: 0.4 });
      var v = acik === 'hava' ? hv : (t > D.hava && api.bitti('hava') ? hv : 50);
      var th = kalinlik(v), c = T.ekran(LIMB.x, LIMB.y, 1), Rs = ekranR(LIMB.x, LIMB.y, LIMB.r).r, z = Rs / LIMB.r;
      var thS = th * z, Rm = Rs + thS / 2;
      var x0 = -40, x1 = 1640, y0 = c.y - Math.sqrt(Rm * Rm - (x0 - c.x) * (x0 - c.x)), y1 = c.y - Math.sqrt(Rm * Rm - (x1 - c.x) * (x1 - c.x));
      var d = 'M' + f1(x0) + ' ' + f1(y0) + ' A' + f1(Rm) + ' ' + f1(Rm) + ' 0 0 1 ' + f1(x1) + ' ' + f1(y1);
      havaSerit.setAttribute('stroke-width', f1(Math.max(2, thS))); havaParilti.setAttribute('stroke-width', f1(thS * 2.2 + 10));
      goster(havaParilti, d, 0.9); goster(havaSerit, d, 0.95); kullan(havaParilti); kullan(havaSerit);
      // uzaydan gelen küçük taşlar: kalın havada yukarıda yanar, çok ince havada yere ulaşır
      var ulasir = th < 10;
      for (var i = 0; i < 7; i++) {
        var per = 2.4 + hash(i, 131) * 1.6, f = ((a + hash(i, 132) * 10) % per) / per, xs = 120 + hash(i, 133) * 1360;
        var sonR = ulasir ? Rs : Rs + thS * 0.55, yh = c.y - Math.sqrt(Math.max(0, sonR * sonR - (xs - c.x) * (xs - c.x)));
        var ys = yh - 330, y = kr(ys, yh, Math.min(1, f * 1.25)), x = xs + (y - ys) * 0.35;
        if (f * 1.25 > 1.18) continue;
        var vur = f * 1.25 >= 1;
        if (vur && ulasir) { T.iz(x, y, 16, 8, 0, 1, 0.75, 0.4, 0.8); continue; }
        var parla = Math.max(0, (y - (yh - 70)) / 70);
        for (var j = 0; j < 8; j++) T.iz(x - j * 6 * 0.35, y - j * 6, 2.2 + parla * 3 - j * 0.2, 2.2 + parla * 3 - j * 0.2, 0, 1, 0.9 - parla * 0.3, 0.7 - parla * 0.4, (0.5 + parla * 0.5) * (1 - j / 8));
      }
      T.izBitir();
      // elma: kabuğu kadar ince
      var el2 = pencere(t, AN.elmaK + 0.8, D.hava - 0.5, 0.6, 0.4);
      if (el2 > 0.01) T.ciz('dal', { x: 1200, y: 190, g: 170, d: 0, o: el2 });
      // köşe penceresi: vadinin gecesi
      var pe = acik === 'hava' ? 1 : pencere(t, D.hava - 0.4, AN.olcu + 2.2, 0.4, 0.5);
      if (pe > 0.01) penceredeVadi(a, v, pe);
      else gizle(cerceve);
    }
    function penceredeVadi(a, v, o) {
      var ince = sinirla((40 - v) / 40, 0, 1), kalin = sinirla((v - 60) / 40, 0, 1);
      T.ciz('vadi-yaz', { x: PEN.x, y: PEN.y, g: PEN.g, h: PEN.h, d: 0, o: o, ruzgar: kalin * 0.8,
        carp: [kr(kr(0.3, 0.42, ince), 0.95, kalin), kr(kr(0.34, 0.5, ince), 0.5, kalin), kr(kr(0.6, 0.72, ince), 0.3, kalin)],
        ekle: [0.12 * ince + 0.22 * kalin, 0.14 * ince + 0.08 * kalin, 0.2 * ince] });
      var x0 = PEN.x - PEN.g / 2, y0 = PEN.y - PEN.h / 2;
      goster(cerceve, 'M' + x0 + ' ' + y0 + ' h' + PEN.g + ' v' + PEN.h + ' h' + -PEN.g + 'Z', o); kullan(cerceve);
      if (kalin < 0.4) {
        for (var i = 0; i < 30; i++) { var b = 1 + hash(i, 141) * 1.4; T.iz(x0 + 8 + hash(i, 142) * (PEN.g - 16), y0 + 6 + hash(i, 143) * PEN.h * 0.4, b, b, 0, 1, 0.95, 0.85, o * (1 - kalin * 2.5) * (0.6 + 0.4 * Math.sin(a * 2 + i))); }
        T.izBitir();
      }
      var f = (a * 0.7) % 1;
      if (ince > 0.5) {                     // taşlar yanmadan iner, yere çarpar
        var x = x0 + 90 + f * 200, y = y0 + 10 + f * (PEN.h - 40);
        T.iz(x, y, 4, 4, 0, 1, 0.8, 0.5, o); if (f > 0.9) T.iz(x, y0 + PEN.h - 30, 14, 6, 0, 1, 0.7, 0.4, o * 0.8);
      } else if (kalin < 0.5) {             // tam ölçü: yukarıda yanıp söner
        if (f < 0.4) { var u = f / 0.4; T.iz(x0 + 120 + u * 120, y0 + 14 + u * 36, 3, 3, 0, 1, 0.92, 0.7, o * Math.sin(u * Math.PI)); }
      }
      T.izBitir();
    }
    // 12. Dere: sabah, akıntı yönünde; taşlar aşağı indikçe küçülür
    function dereSahne(t, a) {
      var k = ic(t, KES.dere, KES.deniz - KES.dere);
      T.bas(a, { x: kr(485, 1115, Y.sin(k)), y: kr(280, 620, Y.sin(k)), z: 1.5 });
      plaka('dere', { d: 1, su: 0.9, parilti: 0.7 });
      akis(DERE_TAS, a, 26, 0.06, [0.95, 1, 1], 3.2, 0.75, true);
    }
    // 13. Deniz: büyüteçte minik yeşil canlılar; kumsalda kum taneleri ve kabuk
    function denizSahne(t, a) {
      var kam = kameraYolu(t, [[KES.deniz, { x: 900, y: 450, z: 1.05 }], [AN.denizF + 1.2, { x: 1050, y: 500, z: 1.3 }], [AN.kumsala - 0.2, { x: 1050, y: 500, z: 1.3 }],
        [AN.buyutec, { x: 680, y: 646, z: 1.6 }], [AN.isci, { x: 700, y: 640, z: 1.6 }], [D.gorev - 0.3, { x: 800, y: 450, z: 1 }]]);
      T.bas(a, kam);
      // eşleştirme durağında sahne kararır: kartlardaki yazılar okunur
      var es = acik === 'gorev' ? 1 : 0;
      plaka('deniz', { d: 1, su: 0.9, parilti: 0.7, carp: es ? [0.42, 0.46, 0.6] : [1, 1, 1] });
      var pl = pencere(t, AN.denizF + 1.4, AN.kumsala - 0.1, 0.6, 0.4);
      if (pl > 0.01) { var p = ekranR(1150, 520, 120); T.ciz('plankton', { x: 1150, y: 520, g: 240, d: 1, o: pl, parilti: 0.3 }); buyutec(p.x, p.y, p.r, pl); }
      var ku = pencere(t, AN.buyutec + 0.4, D.gorev - 0.4, 0.6, 0.4);
      if (ku > 0.01) { var q = ekranR(700, 715, 115); T.ciz('kum-taneleri', { x: 700, y: 715, g: 230, d: 1, o: ku }); buyutec(q.x, q.y, q.r, ku); }
      var kb = pencere(t, kel('kabuğunun') - 0.3, D.gorev - 0.4, 0.5, 0.4);
      if (kb > 0.01) { T.ciz('kabuk', { x: 945, y: 740, g: 110, d: 1, o: kb, r: -12 }); var w = ekranR(945, 740, 72); halka(0, w.x, w.y, w.r, kb); }
    }
    // 14. Büyük soru: akşam ışığında bütün vadi; dağ, dere, bahçe ve deniz birbirine yetişir
    function buyukSahne(t, a) {
      T.bas(a, { x: 800, y: kr(470, 450, tw(t, KES.buyuk, 8, Y.sin)), z: kr(1.22, 1.02, tw(t, KES.buyuk, 10, Y.sin)) });
      var ak = tw(t, KES.buyuk, 2.5, Y.sin);
      plaka('vadi-yaz', { d: 1, parilti: 0.8, carp: [kr(1, 1.02, ak), kr(1, 0.84, ak), kr(1, 0.7, ak)], ekle: [0.05 * ak, 0.02 * ak, 0] });
      akis(VADI_DERE, a, 22, 0.035, [1, 0.95, 0.85], 3, 0.6, true);
      var h1 = pencere(t, AN.bilmiyor, AN.hepsi, 0.5, 0.5), h2 = pencere(t, AN.dag, AN.hepsi, 0.5, 0.5), h3 = pencere(t, AN.solucanB, AN.hepsi, 0.5, 0.5);
      var p1 = P(760, 500), p2 = P(150, 190), p3 = P(560, 760);
      if (h1 > 0.01) { var e1 = ekranR(p1[0], p1[1], 70); halka(0, e1.x, e1.y, e1.r * (1 + 0.05 * Math.sin(a * 3)), h1); }
      if (h2 > 0.01) { var e2 = ekranR(p2[0], p2[1], 90); halka(1, e2.x, e2.y, e2.r * (1 + 0.05 * Math.sin(a * 3 + 1)), h2); }
      if (h3 > 0.01) { var e3 = ekranR(p3[0], p3[1], 50); halka(2, e3.x, e3.y, e3.r * (1 + 0.05 * Math.sin(a * 3 + 2)), h3); }
      var ip = pencere(t, AN.hepsi + 0.6, D.buyuk - 0.5, 1, 0.4);
      if (ip > 0.01) { goster(esIp, dunyaCizgi([P(120, 120), P(205, 445), P(500, 613), P(760, 500), P(980, 713), P(1300, 759), P(1500, 680)]), ip); kullan(esIp); }
    }
    // 16. Sır: tepedeki kaya; çatlağa su dolar, gece donar, buz kayayı çatlatır; kopan taş dereyle kuma döner
    // kaya dağın sırtında durur, üst yarısı göğe karşı seçilir (ay: 1, alt kenarı sırtta)
    var KAYA = { x: 264, y: 228, g: 160 };
    var CATLAK = [[201, 10], [201, 25], [205, 50], [216, 75], [209, 100], [205, 125], [217, 150], [230, 175], [226, 200], [221, 225], [200, 250], [198, 275], [207, 300], [202, 325], [206, 350]];
    function kayaNokta(p) { var s = KAYA.g / 420; return [KAYA.x + (p[0] - 210) * s, KAYA.y - (380 - p[1]) * s]; }
    function sirKaya(t, a) {
      var gece = pencere(t, AN.dondu, AN.catlatti, 0.6, 0.8);
      T.bas(a, { x: 352 + Math.sin(a * 0.1) * 4, y: 198, z: 2.0 });
      var cp = [kr(1, 0.32, gece), kr(1, 0.38, gece), kr(1, 0.66, gece)];
      plaka('vadi-yaz', { d: 1, carp: cp });
      if (gece > 0.3) { for (var i = 0; i < 40; i++) { var q = T.ekran(P(hash(i, 151) * 700, 0)[0], P(0, hash(i, 152) * 120)[1], 1); T.iz(q.x, q.y, 1.6, 1.6, 0, 1, 0.95, 0.85, (gece - 0.3) * (0.6 + 0.4 * Math.sin(a * 2 + i))); } T.izBitir(); }
      var ko = tw(t, AN.tepesinde - 0.2, 0.8);
      var sars = ic(t, AN.catlatti, 0.6), titre = sars > 0 && sars < 1 ? Math.sin(sars * 60) * 3 * (1 - sars) : 0;
      if (ko > 0.01) {
        var km = kayaNokta([210, 190]), ke = ekranR(km[0], km[1], 120);
        T.ciz('kaya', { x: KAYA.x + titre, y: KAYA.y, g: KAYA.g, ax: 0.5, ay: 1, d: 1, o: ko, carp: cp, ekle: [0.04, 0.04, 0.05] });
        halka(1, ke.x, ke.y, ke.r * (1 + 0.04 * Math.sin(a * 3)), ko * (1 - tw(t, AN.catlak + 0.4, 0.6)));
      }
      // çatlağa su dolar (alttan yukarı), gece buza döner
      var dol = tw(t, AN.catlak + 0.2, 1.8, Y.sin);
      if (dol > 0.01 && t < KES.sirDere) {
        var n = Math.max(2, Math.round(CATLAK.length * dol)), pts = CATLAK.slice(CATLAK.length - n).map(function (p) { var k = kayaNokta(p), e = T.ekran(k[0] + titre, k[1], 1); return [e.x, e.y]; });
        var buz = tw(t, AN.dondu + 0.3, 1.2);
        catlakSu.setAttribute('stroke', buz > 0.5 ? '#f2fbff' : '#6fd0ff');
        catlakSu.setAttribute('stroke-width', f1(ekranR(0, 0, kr(3.2, 4.2, buz)).r));
        goster(catlakSu, cizgi(pts), 0.95); kullan(catlakSu);
        if (buz > 0.3) { pts.forEach(function (p, i) { if (i % 3 === 0) T.iz(p[0], p[1], 5, 5, 0, 1, 1, 1, buz * (0.5 + 0.5 * Math.sin(a * 5 + i))); }); T.izBitir(); }
      }
      // cam şişe: su donunca genişler, ağzından taşar, cam çatlar
      var si = pencere(t, AN.genisler - 0.1, AN.catlatti + 0.4, 0.5, 0.4);
      if (si > 0.01) {
        var bx = 1250, by = 380, don = tw(t, kel('genişler;') + 0.2, 1.6, Y.sin);
        goster(siseGovde, 'M' + (bx - 22) + ' ' + (by - 170) + ' L' + (bx - 22) + ' ' + (by - 110) + ' Q' + (bx - 78) + ' ' + (by - 80) + ' ' + (bx - 78) + ' ' + (by - 30) + ' L' + (bx - 78) + ' ' + (by + 130) +
          ' Q' + (bx - 78) + ' ' + (by + 150) + ' ' + (bx - 58) + ' ' + (by + 150) + ' L' + (bx + 58) + ' ' + (by + 150) + ' Q' + (bx + 78) + ' ' + (by + 150) + ' ' + (bx + 78) + ' ' + (by + 130) +
          ' L' + (bx + 78) + ' ' + (by - 30) + ' Q' + (bx + 78) + ' ' + (by - 80) + ' ' + (bx + 22) + ' ' + (by - 110) + ' L' + (bx + 22) + ' ' + (by - 170), si);
        var ust = kr(by - 110, by - 160, don);
        siseSu.setAttribute('fill', don > 0.5 ? 'rgba(238,248,255,0.92)' : 'rgba(90,180,235,0.85)');
        goster(siseSu, 'M' + (bx - 70) + ' ' + (by + 142) + ' L' + (bx + 70) + ' ' + (by + 142) + ' L' + (bx + 70) + ' ' + (by - 28) + ' Q' + (bx + 70) + ' ' + (by - 70) + ' ' + (bx + 16) + ' ' + (by - 102) +
          ' L' + (bx + 16) + ' ' + f1(ust) + ' L' + (bx - 16) + ' ' + f1(ust) + ' L' + (bx - 16) + ' ' + (by - 102) + ' Q' + (bx - 70) + ' ' + (by - 70) + ' ' + (bx - 70) + ' ' + (by - 28) + 'Z', si);
        var ct = tw(t, kel('çatlar.') - 0.2, 0.5);
        goster(siseCatlak, 'M' + (bx + 78) + ' ' + (by + 10) + ' l-26 18 l14 22 l-22 16 l10 20 M' + (bx - 78) + ' ' + (by + 60) + ' l24 -10 l-8 24 l20 8', si * ct);
        [siseGovde, siseSu, siseCatlak].forEach(kullan);
      }
      // kopan taş: çatlağın sağından ayrılıp yerçekimiyle aşağı düşer
      var ko2 = ic(t, AN.catlatti + 0.6, 1.4);
      if (ko2 > 0) {
        var bas = kayaNokta([290, 230]), x = bas[0] + ko2 * 70, y = bas[1] + ko2 * ko2 * 260;
        T.ciz('tas', { x: x, y: y, g: 104, r: ko2 * 160, d: 1, carp: cp, ekle: [0.06, 0.05, 0.03], o: 1 - tw(t, AN.catlatti + 1.8, 0.3) });
      }
    }
    function sirDere(t, a) {
      var s = tw(t, AN.dereAldi + 0.2, KES.sirDeniz - AN.dereAldi - 0.6, Y.sin), q = uzerinde(DERE_TAS, s);
      T.bas(a, { x: q[0], y: q[1] - 40, z: 1.6 });
      plaka('dere', { d: 1, su: 0.9, parilti: 0.6 });
      akis(DERE_TAS, a, 26, 0.06, [0.95, 1, 1], 3.2, 0.7, true);
      // taş yuvarlandıkça döner, küçülür, yuvarlaklaşır: taş → çakıl → kum
      var r = s * 1500, b1 = 1 - sinirla((s - 0.3) / 0.12, 0, 1), b3 = sinirla((s - 0.72) / 0.12, 0, 1), b2 = 1 - b1 - b3;
      var hop = Math.abs(Math.sin(s * 40)) * 6 * (1 - s);
      if (b1 > 0.01) T.ciz('tas', { x: q[0], y: q[1] - 26 - hop, g: kr(86, 64, s / 0.4), r: r, d: 1, o: b1, ekle: [0.08, 0.07, 0.04] });
      if (b2 > 0.01) T.ciz('cakil', { x: q[0], y: q[1] - 20 - hop, g: kr(60, 36, (s - 0.3) / 0.5), r: r, d: 1, o: b2, ekle: [0.08, 0.07, 0.04] });
      if (b3 > 0.01) T.ciz('kum-grup', { x: q[0], y: q[1] - 14, g: kr(30, 22, (s - 0.72) / 0.28), r: r * 0.5, d: 1, o: b3 });
      var w = T.ekran(q[0], q[1] - 20, 1); T.iz(w.x, w.y, 70, 70, 0, 1, 0.92, 0.6, 0.18); T.izBitir(); halka(0, w.x, w.y, kr(76, 46, s), 0.85);
    }
    function sirDeniz(t, a) {
      var k = tw(t, KES.sirDeniz, 2.4, Y.sin);
      T.bas(a, { x: kr(560, 700, k), y: 646, z: kr(1.9, 1.6, k) });
      plaka('deniz', { d: 1, su: 0.9, parilti: 0.7 });
      var p = [kr(520, 700, k), kr(700, 770, k) - Math.sin(k * Math.PI) * 30];
      T.ciz('kum-grup', { x: p[0], y: p[1], g: 22, d: 1 });
      var e = ekranR(p[0], p[1], 36); halka(0, e.x, e.y, e.r * (1 + 0.06 * Math.sin(a * 3)), 1 - tw(t, AN.yolcu + 1.6, 0.6));
      var bu = tw(t, AN.yolcu + 1.4, 0.8);
      if (bu > 0.01) { var q = ekranR(700, 715, 110); T.ciz('kum-taneleri', { x: 700, y: 715, g: 220, d: 1, o: bu }); buyutec(q.x, q.y, q.r, bu); }
    }
    // 17. Kapanış: akşam kumsalı, dalgalar
    function kapanis(t, a) {
      var ak = tw(t, KES.son, 4, Y.sin);
      T.bas(a, { x: kr(700, 800, ak), y: kr(600, 450, ak), z: kr(1.5, 1.02, ak) });
      plaka('deniz', { d: 1, su: 0.9, parilti: 0.9, carp: [kr(1, 1.0, ak), kr(1, 0.8, ak), kr(1, 0.72, ak)], ekle: [0.06 * ak, 0.02 * ak, 0] });
    }

    /* ——— perde: kesmelerde kısa bir an lacivert (kâğıt bölümünde krem) karartma ——— */
    var LACI = [0.07, 0.11, 0.3], KREM = [1, 1, 1];
    var PERDE = [[KES.sir], [KES.vadi], [KES.bahce], [KES.dal], [KES.ic], [KES.fab], [KES.sonbahar], [KES.toprak], [KES.bahar], [KES.bosa], [KES.dag], [KES.gece], [KES.uzay],
      [KES.dere], [KES.deniz], [KES.buyuk], [KES.kagit, KREM], [KES.sir2, KREM], [KES.sirDere], [KES.sirDeniz], [KES.son]];
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
    function ciz(t, a) {
      aSimdi = a; acik = api.acikDurak(); kullanildi = [];
      var b;
      if (t < KES.sir) b = 0;
      else if (t < KES.vadi) b = 1;
      else if (t < KES.bahce) b = 2;
      else if (t < KES.dal) b = 3;
      else if (t < KES.ic) b = 4;
      else if (t < KES.fab) b = 5;
      else if (t < KES.sonbahar) b = 6;
      else if (t < KES.toprak) b = 7;
      else if (t < KES.bahar) b = 8;
      else if (t < KES.bosa) b = 9;
      else if (t < KES.dag) b = 8;
      else if (t < KES.gece) b = 10;
      else if (t < KES.uzay) b = 11;
      else if (t < KES.dere) b = 12;
      else if (t < KES.deniz) b = 13;
      else if (t < KES.buyuk) b = 14;
      else if (t < KES.kagit) b = 15;
      else if (t < KES.sir2) b = 16;
      else if (t < KES.sirDere) b = 17;
      else if (t < KES.sirDeniz) b = 18;
      else if (t < KES.son) b = 19;
      else b = 20;

      if (b === 0) kanca(t, a);
      else if (b === 1) sirAcilis(t, a);
      else if (b === 2) vadiSahne(t, a);
      else if (b === 3) bahceSahne(t, a);
      else if (b === 4) dalSahne(t, a);
      else if (b === 5) icSahne(t, a);
      else if (b === 6) fabrikaSahne(t, a);
      else if (b === 7) sonbaharSahne(t, a);
      else if (b === 8) toprakSahne(t, a);
      else if (b === 9) baharAni(t, a);
      else if (b === 10) dagSahne(t, a);
      else if (b === 11) geceSahne(t, a);
      else if (b === 12) uzaySahne(t, a);
      else if (b === 13) dereSahne(t, a);
      else if (b === 14) denizSahne(t, a);
      else if (b === 15) buyukSahne(t, a);
      else if (b === 16) { T.bas(a, { x: 800, y: 450, z: 1 }); plaka('kagit', { d: 0 }); }
      else if (b === 17) sirKaya(t, a);
      else if (b === 18) sirDere(t, a);
      else if (b === 19) sirDeniz(t, a);
      else kapanis(t, a);

      // bu karede kullanılmayan SVG yolları kapanır (sarınca eski hâl ekranda kalmaz)
      SVG_HEPSI.forEach(function (p) { if (kullanildi.indexOf(p) < 0) gizle(p); });
      perde(t);
      yazilar(t);
    }

    return {
      hazir: hazir,
      ciz: ciz,
      // Allahü teâlâdan söz edilen kâğıt bölümünde yazı sahnenin kendisidir; altyazı ve dokunma oyunu yoktur
      altyazisiz: function (t) { return kagitYazisi || (t >= KES.kagit && t < KES.sir2); },
      durak: function (id, olay, veri) {
        if (id === 'fabrika') { if (olay === 'dogru') dolu[veri] = true; if (olay === 'ac') dolu = {}; }
        if (id === 'toprak') { if (olay === 'cikar') cikan = veri; if (olay === 'kapat' || olay === 'ac') cikan = null; }
        if (id === 'hava' && olay === 'deger') hv = veri;
      },
      // Havanın kenarı: çocuk mavi şeridin dış kenarını tutup yukarı (kalınlaştır) ya da aşağı (incelt) çeker
      tutamac: function (id, deger) {
        var th = kalinlik(deger);
        return { x: 800, y: limbY(800, LIMB.r + th), r: 62, ust: true };
      },
      tutDeger: function (id, x, y) {
        var th = limbY(800, LIMB.r) - y;
        return kalinliktanDeger(th);
      }
    };
  };
})();
