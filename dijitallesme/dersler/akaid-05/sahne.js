/* Akaid 5 · Canlılardaki İncelik — sahne: "Yaşayan Minyatür", Bursa'da Uludağ eteğinde bir köy evi, dut bahçesi ve gölet; bir yaz.
   Bakış güneye, Uludağ'a döner: doğu solda. Sabah ışığı soldan, akşam ışığı sağdan gelir; öğlen Güneş önde ve yüksektedir.
   Ders tek sahnede dönmez: gece çayırında ateş böcekleriyle açılır, evin penceresinden ipek böceği odasına süzülür,
   ateş böceğinin yakın planında durur, ampulle karşılaştırılır, çayırda ışık dili görünür; şafakta odaya girilir, tırtıllar
   dut yaprağı yer, dalda koza örülür, kuşbakışı köyde bir kilometrelik iplik uzanır; öğlen dut gövdesinde ağustos böceği
   öter, karın kesitinde zar ve boş karın gösterilir; gölet, mikroskop ve terliksi hayvan; akşamüstü bahçenin kesitinde
   köstebek, ördek ve yarasa kendi yerine geçer; gece bahçesinde eşleştirme ve büyük soru; Allahü teâlâdan söz edilen
   bölümde boya çekilir, kâğıt ve yazı kalır; sırda iki hafta sonra koza açılır, kelebek çıkar; ders sabah bahçesinde biter.
   Her olay anlatıcının kelimesine bağlıdır (t); a ortam saatidir.
   Fizik: ateş böceğinin ışığı karnının ucundadır, yanıp söner, ısı titremesi yoktur (ampulde vardır). Evcil ipek böceği evde
   raflarda dut yaprağıyla beslenir, kozasını odadaki kuru dala örer; baş sekiz çizer, iplik kesintisizdir. Kelebek kozanın
   bir ucunu sıvıyla yumuşatıp çıkar, kanatları önce buruşuktur, uçmaz. Ağustos böceği gövdede başı yukarı durur, ses karnın
   yanındaki zardan gelir. Mikroskopta büyütme arttıkça görüş alanı daralır, aşırı büyütmede görüntü bulanıklaşır.
   Köstebek ileri (sola) kazar, toprak arkaya atılır; ördeğin gövdesi suyun üstünde, ayakları suyun altında kürek çeker;
   yarasanın ses halkaları önden çıkar, ağaca çarpıp daha soluk döner.
   İnsan figürü yoktur. Güneş'te ve Ay'da yüz yoktur. Gece göğünde hilâl yoktur; Ay tam yuvarlaktır. */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-05'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['bahce-gece', 'bahce-safak', 'bahce-aksam', 'oda-gece', 'oda-gun', 'dut-ogle', 'golet', 'kesit', 'koy-kusbakisi', 'kagit',
      'ates-bocegi', 'ipek-tirtil', 'koza', 'ipek-kelebek', 'dut-yaprak', 'agustos-bocegi', 'terliksi', 'kostebek', 'ordek', 'yarasa', 'ampul', 'mikroskop', 'cimen'];
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
    var D = {}; ['isik', 'koza', 'mikroskop', 'yer', 'sir', 'veren'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {}; for (var n0 = 0; n0 <= 70; n0++) AN[n0] = C(n0);
    var W = {
      // kelime sırası büyük küçük harf ayırmadan sayılır (ateş: 1. "ateş böcekleri", 5. "Ateş böceği ışığını")
      ates: kel('ateş'), kuru: kel('kuru'), isitmadan: kel('ısıtmadan'), ipek: kel('ipek'), tirman: kel('tırmanır,'), sekiz: kel('sekiz'),
      kilometre: kel('kilometre'), agustos: kel('ağustos'), ceviz: kel('ceviz'), zar: kel('zar'), tikir: kel('tıkırdatır.'), bos: kel('boştur,'),
      davul: kel('davul'), damla: kel('damla'), kostebek: kel('Köstebeğin'), ordek: kel('Ördeğin'), yarasa: kel('Yarasa'),
      atesB: kel('ateş', 5), ipekB: kel('ipek', 2), kostebekB: kel('köstebek', 2), ordekB: kel('ördek', 2),
      sivi: kel('sıvı'), kapi: kel('kapı'), yumurta: kel('yumurtalarını')
    };
    // bölümler arası kesmeler (cümle başlarına düşer)
    var KES = {
      sirDis: AN[3] - 0.1, sirOda: W.kuru - 0.15, ates: AN[9] - 0.1, soguk: AN[10] - 0.1, dil: AN[13] - 0.1, sabah: AN[16] - 0.1,
      oda: AN[18] - 0.1, orme: AN[20] - 0.1, km: AN[25] - 0.1, anne: AN[27] - 0.1, kusursuz: AN[29] - 0.1, ogle: AN[30] - 0.1,
      agKesit: AN[33] - 0.1, golet: AN[36] - 0.1, mik: AN[39] - 0.1, aksam: AN[45] - 0.1, gece: AN[53] - 0.1, buyuk: AN[56] - 0.1,
      kagit: AN[59] - 0.3, sirCoz: AN[62] - 0.2, son: AN[69] - 0.2
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
    var KOZA = P(872, 385);                                                           // dal demetinde kozanın yeri (oda)
    var MAYA = P(462, 400);                                                           // orta rafın ikinci tepsisi (oda)
    var AGB = { x: 662, y: 300, h: 156 };                                             // dut gövdesinde ağustos böceği
    // [yazı, sınıf, x, y, başlangıç, bitiş, dünya]: dünya işaretli yazı kamerayla birlikte gider
    var AKIS = [
      ['ateş böcekleri', 'etiket', 800, 96, W.ates, KES.sirDis - 0.2],
      ['?', 'sor', KOZA[0] + 70, KOZA[1] - 70, AN[7], KES.ates - 0.3, 1],
      ['ateş böceği', 'etiket', 1105, 150, AN[10] + 0.2, KES.dil - 0.2],
      ['eski ampul', 'etiket', 495, 150, AN[11], KES.dil - 0.2],
      ['ışık', 'kucuk', 352, 654, AN[11] + 1.2, KES.dil - 0.2],
      ['ısı', 'kucuk', 352, 704, AN[11] + 1.2, KES.dil - 0.2],
      ['ışık', 'kucuk', 962, 654, W.isitmadan, KES.dil - 0.2],
      ['ısı', 'kucuk', 962, 704, W.isitmadan, KES.dil - 0.2],
      ['her türün kendi ışık dili', 'etiket', 800, 96, AN[14] + 0.3, KES.sabah - 0.2],
      ['ipek böcekleri', 'etiket', 800, 96, W.ipek, AN[19] + 1.5],
      ['bütün gün dut yaprağı', 'etiket', 800, 96, AN[19] + 0.3, KES.orme - 0.2],
      ['baş sekiz çizer', 'etiket', 800, 96, W.sekiz, AN[22] - 0.1],
      ['üç gün, hiç durmadan', 'etiket', 800, 96, AN[22] + 0.1, D.koza - 0.7],
      ['tek iplik: neredeyse bir kilometre', 'etiket', 800, 96, W.kilometre - 0.2, KES.anne - 0.2],
      ['yumurtadan yeni çıkan tırtıl', 'etiket', 800, 96, AN[27] + 0.6, KES.kusursuz - 0.2],
      ['ağustos böceği', 'etiket', 800, 96, W.agustos - 0.2, AN[32] + 0.2],
      ['bir ceviz kadar', 'etiket', AGB.x + 190, AGB.y - 40, W.ceviz, AN[33] - 0.2, 1],
      ['ağızdan değil', 'etiket', 830, 150, AN[33] + 0.2, AN[34] - 0.1],
      ['ince zar', 'etiket', 900, 340, W.zar, KES.golet - 0.2],
      ['içi boş karın', 'etiket', 940, 480, W.bos, KES.golet - 0.2],
      ['gözle görülmeyen kalabalık', 'etiket', 800, 96, AN[38] + 0.4, KES.mik - 0.2],
      ['terliksi hayvan', 'etiket', 800, 96, AN[41], AN[42] - 0.1],
      ['bir noktadan bile küçük', 'etiket', 800, 96, AN[42], AN[43] - 0.1],
      ['nokta', 'kucuk', 870, 515, AN[42] + 0.9, AN[43] - 0.1],
      ['binlerce kirpik, kürek gibi', 'etiket', 800, 96, AN[43] + 0.4, KES.aksam - 0.2],
      ['?', 'sor', 1000, 215, AN[49], D.yer - 0.7, 1],
      ['?', 'sor', 1250, 500, AN[49] + 0.25, D.yer - 0.7, 1],
      ['?', 'sor', 400, 705, AN[49] + 0.5, D.yer - 0.7, 1],
      ['her birine yaşadığı yere uygun bir beden', 'etiket', 800, 96, AN[51] + 0.3, KES.gece - 0.2],
      ['Ateş böceğini ışığıyla, ipek böceğini ipliğiyle, her canlıyı yaşadığı yere uygun bir bedenle yaratan, Allahü teâlâdır.', 'kagit', 800, 330, AN[59], AN[62] - 0.5],
      ['Bütün insanlar bir araya gelse, küçücük bir karıncayı bile yoktan var edemez.', 'kagit', 800, 580, AN[60], AN[61] - 0.3],
      ['Bu küçücük canlıların her biri, Onun varlığını ve kudretini gösterir.', 'kagit', 800, 580, AN[61], AN[62] - 0.5],
      ['iki hafta sonra', 'etiket', 800, 96, AN[64], AN[65] + 0.8],
      ['özel bir sıvı', 'etiket', KOZA[0] - 150, KOZA[1] - 90, W.sivi, AN[67] - 0.2, 1],
      ['yumurtalar', 'etiket', KOZA[0] + 40, KOZA[1] + 190, W.yumurta + 0.3, KES.son - 0.3, 1],
      ['Gelecek ders: Kendi bedenimiz', 'etiket', 800, 110, AN[69] + 0.2, AN[70] + 0.9]
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
    // bekleyen canlıların adları (yerleştirme durağı): canlı yerine geçince ad kalkar
    var ADLAR = [yazi('Yarasa', 'etiket', 0, 0), yazi('Ördek', 'etiket', 0, 0), yazi('Köstebek', 'etiket', 0, 0)];

    /* ——— SVG ——— */
    var defs = E2('defs', {}, svg);
    var dg = E2('linearGradient', { id: 'kd5-cerceve', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    [['0', '#f3d584'], ['1', '#c9972f']].forEach(function (d) { E2('stop', { offset: d[0], 'stop-color': d[1] }, dg); });
    function yol(oz) { var p = E2('path', Object.assign({ d: 'M0 0', fill: 'none' }, oz || {}), svg); p.style.opacity = 0; p._o = 0; return p; }
    function gizle(p) { if (p._o !== 0) { p.style.opacity = 0; p._o = 0; } }
    function goster(p, d, o) { if (o <= 0.003) { gizle(p); return; } p.setAttribute('d', d); p.style.opacity = o; p._o = o; }
    function f1(x) { return x.toFixed(1); }
    function daire(cx, cy, r) { return 'M' + f1(cx - r) + ' ' + f1(cy) + ' a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0 a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
    function elips(cx, cy, rx, ry) { return 'M' + f1(cx - rx) + ' ' + f1(cy) + ' a' + f1(rx) + ' ' + f1(ry) + ' 0 1 0 ' + f1(2 * rx) + ' 0 a' + f1(rx) + ' ' + f1(ry) + ' 0 1 0 ' + f1(-2 * rx) + ' 0Z'; }
    function cizgi(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]); }).join(' '); }
    function kutu(x, y, g, h) { return 'M' + x + ' ' + y + ' h' + g + ' v' + h + ' h' + (-g) + 'Z'; }
    var halkalar = [0, 1, 2, 3, 4, 5].map(function () { return yol({ stroke: '#ffe29a', 'stroke-width': 4 }); });
    var sesHalka = [0, 1, 2, 3, 4, 5].map(function () { return yol({ stroke: '#fff3c4', 'stroke-width': 5 }); });
    var cerceveler = [0, 1].map(function () { return yol({ stroke: 'url(#kd5-cerceve)', 'stroke-width': 5, fill: 'rgba(10,16,44,0.35)' }); });
    var cubuklar = [0, 1, 2, 3].map(function (i) { return yol({ fill: i % 2 ? '#e2553a' : '#f6dd84' }); });
    var cubukZemin = [0, 1, 2, 3].map(function () { return yol({ fill: 'rgba(255,255,255,0.12)' }); });
    var sicak = [0, 1, 2].map(function () { return yol({ stroke: 'rgba(255,120,70,0.75)', 'stroke-width': 4, 'stroke-linecap': 'round' }); });
    var ipekGolge = yol({ stroke: 'rgba(70,36,0,0.55)', 'stroke-width': 11, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    var ipek = yol({ stroke: '#ffcf3a', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    var ipekIz = yol({ stroke: 'rgba(255,233,168,0.95)', 'stroke-width': 3, 'stroke-linecap': 'round' });
    var sekizIz = yol({ stroke: '#ffe29a', 'stroke-width': 3, 'stroke-dasharray': '6 8', 'stroke-linecap': 'round' });
    var bulusma = [0, 1].map(function () { return yol({ stroke: 'rgba(255,233,160,0.7)', 'stroke-width': 2.5, 'stroke-dasharray': '3 9', 'stroke-linecap': 'round' }); });
    var zarCizgi = [0, 1, 2, 3].map(function () { return yol({ stroke: '#ffe29a', 'stroke-width': 3, 'stroke-linecap': 'round' }); });
    var bosKarin = yol({ stroke: 'rgba(255,233,160,0.9)', 'stroke-width': 3, fill: 'rgba(255,248,220,0.28)', 'stroke-dasharray': '7 7' });
    var ici = [0, 1, 2].map(function () { return yol({ stroke: 'rgba(255,240,190,0.85)', 'stroke-width': 3 }); });
    var maske = yol({ fill: '#0b1230', 'fill-rule': 'evenodd' });
    var gorusHalka = yol({ stroke: 'url(#kd5-cerceve)', 'stroke-width': 12 });
    var dugme = { iz: yol({ stroke: 'rgba(243,213,132,0.55)', 'stroke-width': 4, 'stroke-dasharray': '2 10', 'stroke-linecap': 'round' }),
      govde: yol({ fill: '#b8862c', stroke: '#f3d584', 'stroke-width': 4 }), tirtik: yol({ stroke: '#6e4b14', 'stroke-width': 3 }),
      ibre: yol({ stroke: '#fff4cf', 'stroke-width': 7, 'stroke-linecap': 'round' }), tut: yol({ fill: '#f3d584', stroke: '#fff7dd', 'stroke-width': 3 }) };
    var murekkep = yol({ fill: 'rgba(28,24,30,0.9)' });
    var yankilar = [0, 1, 2, 3].map(function () { return yol({ stroke: 'rgba(255,240,200,0.9)', 'stroke-width': 3 }); });
    var tunel = yol({ stroke: 'rgba(44,24,10,0.85)', 'stroke-width': 46, 'stroke-linecap': 'round' });
    var madalyon = [0, 1, 2, 3].map(function () { return yol({ stroke: 'url(#kd5-cerceve)', 'stroke-width': 6 }); });
    var hayalet = yol({ stroke: 'rgba(255,226,154,0.75)', 'stroke-width': 3, 'stroke-dasharray': '5 7' });
    var SVG_HEPSI = [ipekGolge, ipek, ipekIz, sekizIz, bosKarin, maske, gorusHalka, murekkep, tunel, hayalet, dugme.iz, dugme.govde, dugme.tirtik, dugme.ibre, dugme.tut]
      .concat(halkalar, sesHalka, cerceveler, cubuklar, cubukZemin, sicak, bulusma, zarCizgi, ici, yankilar, madalyon);
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
    function parcaYol(y, s) { var h = sinirla(s, 0, 1) * y.top, pts = [y.p[0]]; for (var i = 1; i < y.p.length && y.L[i] <= h; i++) pts.push(y.p[i]); var q = uzerinde(y, s); pts.push([q[0], q[1]]); return pts; }
    function dunyaCizgi(pts) { return cizgi(pts.map(function (p) { var e = T.ekran(p[0], p[1], 1); return [e.x, e.y]; })); }
    function yildizlar(a, o, ust, alt) {
      if (o <= 0.01) return;
      for (var i = 0; i < 110; i++) {
        var x = hash(i, 1) * 1600, y = (ust || 0) + hash(i, 2) * ((alt || 300) - (ust || 0));
        var p = 0.55 + 0.45 * Math.sin(a * (0.7 + hash(i, 3)) + i * 1.7), b = 1.2 + hash(i, 4) * 1.8;
        T.iz(x, y, b, b, 0, 1, 0.95, 0.82, o * p);
      }
      T.izBitir();
    }
    // ateş böceğinin yanıp sönmesi: iki aile, iki ayrı dil (çift kısa çakış · tek uzun ışık)
    function parla(i, a, aile) {
      var f;
      if (aile === 0) { var p0 = 2.1 + hash(i, 16) * 0.5, u0 = ((a + hash(i, 17) * 9) % p0) / p0; f = Math.exp(-Math.pow((u0 - 0.1) / 0.055, 2)) + Math.exp(-Math.pow((u0 - 0.3) / 0.055, 2)); }
      else { var p1 = 3.0 + hash(i, 18) * 0.6, u1 = ((a + hash(i, 19) * 9) % p1) / p1; f = Math.exp(-Math.pow((u1 - 0.3) / 0.16, 2)); }
      return Math.min(1, f);
    }
    var ATES_RENK = [[0.78, 1, 0.36], [1, 0.82, 0.38]];
    // alan: [x0, x1, y0, y1] sahne noktası; uçanlar salınır, yerdekiler çimen ucunda durur
    function atesler(a, o, alan, n, iki) {
      if (o <= 0.01) return;
      var zz = ekranR(800, 450, 100).r / 100, say = 0;
      for (var i = 0; i < n; i++) {
        var aile = iki ? i % 2 : 0, fx = alan[0] + hash(i, 11) * (alan[1] - alan[0]), fy = alan[2] + hash(i, 12) * (alan[3] - alan[2]);
        var yerde = hash(i, 20) < 0.25;
        var x = fx + (yerde ? 0 : Math.sin(a * (0.16 + hash(i, 13) * 0.2) + i) * 46), y = fy + (yerde ? 0 : Math.sin(a * (0.3 + hash(i, 14) * 0.3) + i * 1.7) * 20);
        var f = parla(i, a, aile), e = T.ekran(x, y, 1), s = (0.7 + hash(i, 15) * 0.5) * kr(0.7, 1.35, (fy - alan[2]) / ((alan[3] - alan[2]) || 1)) * zz, c = ATES_RENK[aile];
        T.iz(e.x, e.y, 34 * s, 34 * s, 0, c[0], c[1], c[2], 0.3 * f * o);
        T.iz(e.x, e.y, 13 * s, 13 * s, 0, c[0], c[1], c[2], 0.55 * f * o);
        T.iz(e.x, e.y, 4.6 * s, 4.6 * s, 0, kr(c[0], 1, 0.7), kr(c[1], 1, 0.7), kr(c[2], 1, 0.7), (0.18 + 0.82 * f) * o);
        if ((say += 3) >= 600) { T.izBitir(); say = 0; }
      }
      T.izBitir();
    }

    /* ——— durak durumu ——— */
    var mv = 10, yerde = {}, acik = null, dn = { bas: null, aci: 0, v: 10 };

    /* ——— 0. Kanca: gece dut bahçesi, çayırda yüzlerce ateş böceği ——— */
    function kanca(t, a) {
      var kam = kameraYolu(t, [[0, { x: 760, y: 690, z: 1.6 }], [AN[1], { x: 780, y: 610, z: 1.38 }], [AN[2] + 0.4, { x: 800, y: 470, z: 1.06 }], [KES.sirDis, { x: 800, y: 462, z: 1.04 }]]);
      T.bas(a, kam);
      gece(a, 1);
      atesler(a, tw(t, 0.2, 1.4), [140, 1520, 560, 900], Math.round(kr(70, 300, tw(t, AN[1], 2.4))), false);
      atesler(a + 3, tw(t, AN[1], 1.6), [380, 1160, 330, 640], 70, false);
    }
    function gece(a, o, carp) {
      plaka('bahce-gece', { d: 1, parilti: 0.55, ruzgar: 0.12, carp: carp });
      var m = P(677, 109); isima(m[0], m[1], 150, [1, 0.92, 0.6], 0.12 * o); isima(m[0], m[1], 70, [1, 0.95, 0.75], 0.12 * o);
    }
    // 1. Sır (dışarıda): kamera evin açık penceresine doğru süzülür
    var PENCERE = P(292, 468);
    function sirDis(t, a) {
      var k = tw(t, KES.sirDis, KES.sirOda - KES.sirDis, Y.gir);
      T.bas(a, { x: kr(800, PENCERE[0], k), y: kr(462, PENCERE[1], k), z: kr(1.04, 3.2, k) });
      gece(a, 1);
      atesler(a, 1, [140, 1520, 560, 900], 300, false);
      atesler(a + 3, 1, [380, 1160, 330, 640], 70, false);
    }
    // 2. Sır (odada): ay ışığında kuru dalda bembeyaz koza; kapısı yok
    // koza dala gevşek ipek tellerle tutunur: teller kozanın kenarından komşu dallara uzanır, kozanın arkasında kalır
    var KOZA_IP = [[-74, -34], [-66, 26], [70, -38], [76, 20], [-22, -48], [28, 42]];
    function kozaCiz(x, y, g, r, o, carp) {
      var oo = o == null ? 1 : o, zz = ekranR(800, 450, 100).r / 100;
      if (oo > 0.05) {
        KOZA_IP.forEach(function (q, i) {
          for (var k = 0; k < 2; k++) {
            var a0 = T.ekran(x + q[0] * 0.48, y + q[1] * 0.42 + k * 3, 1), a1 = T.ekran(x + q[0] * (0.84 + k * 0.1), y + q[1] * (0.84 + k * 0.1) + k * 4, 1), L = Math.hypot(a1.x - a0.x, a1.y - a0.y) / 2;
            T.iz((a0.x + a1.x) / 2, (a0.y + a1.y) / 2, L, 0.45 * zz, Math.atan2(a1.y - a0.y, a1.x - a0.x), 1, 0.97, 0.9, 0.32 * oo);
          }
        });
        T.izBitir();
      }
      T.ciz('koza', { x: x, y: y, g: g, r: r, d: 1, o: oo, carp: carp, parilti: 0.25 });
    }
    function sirOda(t, a) {
      var kam = kameraYolu(t, [[KES.sirOda, { x: 900, y: 420, z: 1.25 }], [AN[5], { x: KOZA[0], y: KOZA[1] + 20, z: 2.1 }], [AN[6] + 0.6, { x: KOZA[0], y: KOZA[1] + 10, z: 2.35 }],
        [AN[8], { x: KOZA[0] + 20, y: KOZA[1] + 30, z: 2.2 }], [KES.ates, { x: KOZA[0] + 60, y: KOZA[1] + 60, z: 1.6 }]]);
      T.bas(a, kam);
      plaka('oda-gece', { d: 1, parilti: 0.4 });
      // ay ışığı: pencereden içeri, dal demetine doğru ince huzmeler ve içinde toz zerreleri
      var pe = P(1500, 330), hd = P(900, 640);
      for (var i = 0; i < 7; i++) {
        var u = (i + 0.5) / 7, q = T.ekran(kr(pe[0], hd[0], 0.5) + (u - 0.5) * 120, kr(pe[1], hd[1], 0.5) + (u - 0.5) * 60, 1);
        T.iz(q.x, q.y, 520, 26, Math.atan2(hd[1] - pe[1], hd[0] - pe[0]), 0.72, 0.82, 1, 0.035 + 0.02 * Math.sin(a * 0.6 + i));
      }
      for (var j = 0; j < 40; j++) {
        var s = (hash(j, 31) + a * 0.012 * (0.5 + hash(j, 32))) % 1, z = T.ekran(kr(pe[0], hd[0], s) + (hash(j, 33) - 0.5) * 160, kr(pe[1], hd[1], s) + (hash(j, 34) - 0.5) * 80 + Math.sin(a + j) * 6, 1);
        T.iz(z.x, z.y, 2, 2, 0, 0.85, 0.9, 1, 0.5 * Math.sin(s * Math.PI));
      }
      T.izBitir();
      // içindeki kıpırdar (pupa arada bir kımıldar), sonra durulur
      var kip = Math.max(pencere(t, AN[5] + 0.2, AN[5] + 1.0, 0.1, 0.2), pencere(t, AN[7] + 0.2, AN[7] + 0.9, 0.1, 0.2));
      var r = -18 + Math.sin(a * 22) * 3 * kip;
      isima(KOZA[0], KOZA[1], 90, [0.75, 0.85, 1], 0.12);
      kozaCiz(KOZA[0], KOZA[1], 96, r, 1, [0.82, 0.88, 1.02]);
      // kapısı yok: koza çevresinde altın halka döner
      var h = pencere(t, AN[6], KES.ates - 0.4, 0.5, 0.5);
      if (h > 0.01) { var e = ekranR(KOZA[0], KOZA[1], 66); halka(0, e.x, e.y, e.r * (1 + 0.05 * Math.sin(a * 3)), h); }
    }
    // 3. Ateş böceği yakın planı: çimen ucunda, karnının ucu yanıp söner (durak 1)
    var AB = { x: 760, y: 290, g: 430 };
    function atesIsik(a) { return 0.25 + 0.75 * Math.pow(Math.max(0, Math.sin(a * 1.9)), 3); }
    function atesYakin(t, a) {
      T.bas(a, { x: 800, y: 450, z: kr(1.08, 1, tw(t, KES.ates, 2.5)) });
      plaka('bahce-gece', { x: 880, y: 330, g: PG * 1.7, h: PH * 1.7, d: 0.25, carp: [0.42, 0.46, 0.66] });
      atesler(a + 7, 1, [60, 1540, 60, 560], 34, false);
      T.ciz('cimen', { x: 520, y: 900, h: 760, ax: 0.5, ay: 1, d: 1, ruzgar: 0.25, carp: [0.8, 0.85, 1] });
      var bob = Math.sin(a * 1.3) * 7, f = atesIsik(a);
      var lx = AB.x + (0.71 - 0.5) * AB.g, ly = AB.y + bob + (0.73 - 0.5) * AB.g / 1.902;
      isima(lx, ly, 120, [0.75, 1, 0.35], 0.22 * f); isima(lx, ly, 46, [0.9, 1, 0.6], 0.5 * f);
      T.ciz('ates-bocegi', { x: AB.x, y: AB.y + bob, g: AB.g, d: 1, r: -4 + Math.sin(a * 0.9) * 2 });
      isima(lx, ly, 20, [1, 1, 0.8], 0.85 * f);
    }
    // 4. Soğuk ışık: solda eski ampul (çevresinde ısı titrer), sağda ateş böceği; altta ışık ve ısı çubukları
    function soguk(t, a) {
      T.bas(a, { x: 800, y: 450, z: 1 });
      plaka('bahce-gece', { x: 800, y: 420, g: PG * 1.25, h: PH * 1.25, d: 0, carp: [0.3, 0.33, 0.5] });
      var sag = tw(t, KES.soguk + 0.1, 0.8), sol = tw(t, AN[11] - 0.1, 0.8);
      [[sol, 300], [sag, 910]].forEach(function (k, i) { goster(cerceveler[i], kutu(k[1], 120, 390, 620), k[0]); kullan(cerceveler[i]); });
      if (sol > 0.01) {
        isima(495, 300, 230, [1, 0.6, 0.25], 0.22 * sol); isima(495, 300, 90, [1, 0.85, 0.5], 0.35 * sol);
        T.ciz('ampul', { x: 495, y: 360, h: 330, d: 0, o: sol });
        var dal = tw(t, AN[11] + 0.6, 1);
        sicak.forEach(function (p, i) {
          var x0 = 440 + i * 55, pts = [];
          for (var k = 0; k <= 12; k++) { var u = k / 12; pts.push([x0 + Math.sin(u * 9 - a * 5 + i) * 10, 200 - u * 70 - ((a * 30 + i * 20) % 20)]); }
          goster(p, cizgi(pts), 0.85 * dal * sol); kullan(p);
        });
      }
      if (sag > 0.01) {
        var f = atesIsik(a), lx = 1105 + (0.71 - 0.5) * 300, ly = 360 + (0.73 - 0.5) * 300 / 1.902;
        isima(lx, ly, 150, [0.75, 1, 0.35], 0.2 * f * sag); isima(lx, ly, 50, [0.9, 1, 0.6], 0.5 * f * sag);
        T.ciz('ates-bocegi', { x: 1105, y: 360, g: 300, d: 0, o: sag });
        isima(lx, ly, 18, [1, 1, 0.8], 0.85 * f * sag);
      }
      // çubuklar: ampulde enerjinin çoğu ısıya, ateş böceğinde neredeyse hepsi ışığa gider
      var b1 = tw(t, AN[11] + 1.2, 1.2), b2 = tw(t, W.isitmadan, 1.2);
      [[b1, 400, 0.12, 0.88], [b2, 1010, 0.95, 0.05]].forEach(function (k, i) {
        if (k[0] <= 0.01) { [0, 1].forEach(function (j) { gizle(cubuklar[i * 2 + j]); gizle(cubukZemin[i * 2 + j]); }); return; }
        [0, 1].forEach(function (j) {
          var y = 640 + j * 50, L = 250 * k[2 + j] * k[0];
          goster(cubukZemin[i * 2 + j], kutu(k[1], y, 250, 28), k[0]); goster(cubuklar[i * 2 + j], kutu(k[1], y, Math.max(2, L), 28), k[0]);
          kullan(cubukZemin[i * 2 + j]); kullan(cubuklar[i * 2 + j]);
        });
      });
    }
    // 5. Işık dili: iki aile ayrı desenle yanıp söner; aynı desendekiler birbirini bulur
    function dil(t, a) {
      var k = ic(t, KES.dil, KES.sabah - KES.dil);
      T.bas(a, { x: kr(600, 1000, Y.sin(k)), y: 600, z: 1.5 });
      gece(a, 1);
      atesler(a, 1, [120, 1560, 520, 900], 150, true);
      atesler(a + 5, 1, [380, 1200, 330, 620], 50, true);
      // iki çift: uçan biri yerdekine yaklaşır, ikisi aynı anda çakar
      var bu = tw(t, AN[15] - 0.2, 1.2);
      [[760, 820, 0], [1120, 790, 1]].forEach(function (c, i) {
        var yerdeki = [c[0], c[1]], ucan = [c[0] - kr(170, 50, bu), c[1] - kr(150, 46, bu) + Math.sin(a * 1.4 + i) * 10];
        var f = parla(i * 2 + 1, a, c[2]), r = ATES_RENK[c[2]];
        [yerdeki, ucan].forEach(function (p) { var e = T.ekran(p[0], p[1], 1); T.iz(e.x, e.y, 38, 38, 0, r[0], r[1], r[2], 0.25 * f); T.iz(e.x, e.y, 10, 10, 0, 1, 1, 0.8, 0.25 + 0.75 * f); });
        T.izBitir();
        goster(bulusma[i], dunyaCizgi([ucan, yerdeki]), 0.8 * bu * (0.3 + 0.7 * f)); kullan(bulusma[i]);
      });
    }
    // 6. Şafak: Güneş solda (doğuda) doğar, kamera eve kayar
    function sabah(t, a) {
      var k = tw(t, KES.sabah, KES.oda - KES.sabah, Y.ikili);
      T.bas(a, { x: kr(900, PENCERE[0], k), y: kr(450, PENCERE[1], k), z: kr(1.04, 2.6, k) });
      plaka('bahce-safak', { d: 1, parilti: 0.6, ruzgar: 0.12 });
      isima(-40, 560, 360, [1, 0.8, 0.55], 0.18);
    }
    // 7. Oda (gündüz): rafta dut yaprakları; tırtıllar yer, büyür; gün geçer
    var TIRTIL = [[380, 398, 0], [425, 410, 1], [470, 392, 0], [512, 412, 1]].map(function (p) { var q = P(p[0], p[1]); return [q[0], q[1], p[2]]; });
    var YAPRAKLAR = [[400, 402, -20], [462, 396, 10], [520, 404, 30]].map(function (p) { var q = P(p[0], p[1]); return [q[0], q[1], p[2]]; });
    function odaGun(t, a, carp) { plaka('oda-gun', { d: 1, parilti: 0.5, carp: carp }); }
    function tirtilCiz(x, y, g, r, o, faz, carp) {
      var ink = Math.sin(faz) * 0.04;                                    // tırtıl ilerlerken boyu uzayıp kısalır
      T.ciz('ipek-tirtil', { x: x, y: y, g: g * (1 + ink), h: g / 3.49 * (1 - ink * 0.6), r: r, d: 1, o: o, carp: carp });
    }
    function oda(t, a) {
      var kam = kameraYolu(t, [[KES.oda, { x: 760, y: 440, z: 1.1 }], [AN[18] + 1.6, { x: MAYA[0] + 10, y: MAYA[1] - 10, z: 2.7 }], [KES.orme, { x: MAYA[0] + 20, y: MAYA[1] - 10, z: 2.8 }]]);
      T.bas(a, kam);
      var gun = ic(t, AN[19], AN[20] - AN[19]), isik = 0.5 - 0.5 * Math.cos(gun * Math.PI * 2);   // sabah → öğle → akşam
      odaGun(t, a, [kr(1, 1.06, isik), kr(1, 1.02, isik), kr(1, 0.92, isik)]);
      var ye = tw(t, AN[19], 3.4, Y.sin);
      YAPRAKLAR.forEach(function (y, i) { var s = kr(1, 0.55 + 0.1 * i, ye); T.ciz('dut-yaprak', { x: y[0], y: y[1], g: 62 * s, r: y[2], d: 1, o: kr(1, 0.85, ye) }); });
      var gor = tw(t, AN[18] + 0.8, 1);
      TIRTIL.forEach(function (p, i) {
        var g = kr(54, 74, ye), x = p[0] + Math.sin(a * 0.35 + i * 2) * 6, yon = p[2] ? 180 : 0;
        tirtilCiz(x, p[1], g, yon + Math.sin(a * 0.5 + i) * 6, gor, a * 3 + i, null);
      });
    }
    // 8. Koza örme: tırtıl dala tırmanır, başı sekiz çizer, iplik kat kat birikir; üç gün (durak 2)
    var TIRMAN = hazirla([P(830, 610), P(840, 540), P(852, 480), P(862, 430), P(872, 392)]);
    function orme(t, a) {
      var kam = kameraYolu(t, [[KES.orme, { x: 840, y: 470, z: 1.8 }], [AN[21], { x: KOZA[0], y: KOZA[1] + 10, z: 2.7 }], [D.koza, { x: KOZA[0], y: KOZA[1] + 30, z: 2.6 }],
        [AN[24], { x: KOZA[0] + 80, y: KOZA[1] + 20, z: 2.3 }], [KES.km, { x: KOZA[0] + 160, y: KOZA[1] + 10, z: 2.0 }]]);
      T.bas(a, kam);
      // üç gün: ışık üç kez gündüzden geceye döner
      var gunler = ic(t, AN[22], AN[23] - AN[22] - 0.2), dongu = gunler > 0 && gunler < 1 ? 0.5 - 0.5 * Math.cos(gunler * Math.PI * 6) : 0;
      odaGun(t, a, [kr(1, 0.34, dongu), kr(1, 0.4, dongu), kr(1, 0.7, dongu)]);
      var cik = tw(t, W.tirman - 0.3, AN[21] - W.tirman + 0.2, Y.sin);   // tırmanış
      var or = ic(t, AN[21], AN[23] - AN[21]);                              // örme ilerlemesi 0..1
      var q = uzerinde(TIRMAN, cik), gizli = sinirla((or - 0.55) / 0.3, 0, 1);
      if (gizli < 1) {
        var sal = or > 0 ? Math.sin(a * 5) * 10 : 0;
        tirtilCiz(q[0], q[1], 64, q[2] * 57.3 + (or > 0 ? 75 + sal : 0), 1 - gizli, a * 3, null);
      }
      // baş sekiz çizer: başın önünde altın sekiz izi
      var sk = pencere(t, W.sekiz - 0.2, AN[22] + 0.4, 0.4, 0.6);
      if (sk > 0.01) {
        var pts = [];
        for (var i = 0; i <= 48; i++) { var u = i / 48 * Math.PI * 2; pts.push([KOZA[0] + Math.sin(u) * 30, KOZA[1] - 26 + Math.sin(2 * u) * 12]); }
        goster(sekizIz, dunyaCizgi(pts), sk * 0.9); kullan(sekizIz);
      }
      // iplik katmanları: kozanın çevresinde ince beyaz çizgiler birikir, koza yavaş yavaş belirir
      if (or > 0) {
        var n = Math.round(or * 220), zz = ekranR(800, 450, 100).r / 100;
        for (var j = 0; j < n; j++) {
          var aa = hash(j, 41) * 6.283, rx = 52 * (0.8 + 0.25 * hash(j, 42)), ry = 22 * (0.8 + 0.3 * hash(j, 43));
          var e = T.ekran(KOZA[0] + Math.cos(aa) * rx, KOZA[1] + Math.sin(aa) * ry, 1);
          T.iz(e.x, e.y, 9 * zz, 0.9 * zz, aa + 1.2 + hash(j, 44), 1, 0.97, 0.88, 0.5 * (1 - 0.8 * Y.sin(sinirla((or - 0.6) / 0.4, 0, 1))));
        }
        T.izBitir();
        kozaCiz(KOZA[0], KOZA[1], 96, -18, Y.sin(sinirla((or - 0.2) / 0.75, 0, 1)), null);
      }
      if (t >= AN[23] - 0.2) kozaCiz(KOZA[0], KOZA[1], 96, -18, 1, null);
      // "Tek bir iplikten!": kozanın ucundan altın bir iplik çıkar, sağa uzanır
      var ip = tw(t, AN[24], 1.4);
      if (ip > 0.01) { var b0 = [KOZA[0] + 44, KOZA[1] - 8]; goster(ipekIz, dunyaCizgi([b0, [b0[0] + 520 * ip, b0[1] - 60 * ip]]), 0.95); kullan(ipekIz); }
    }
    // 9. Bir kilometre: kuşbakışı köy; altın iplik evden çıkıp yol boyunca uzanır
    var YOL = hazirla([[134, 790], [234, 761], [385, 686], [502, 627], [602, 585], [677, 585], [752, 569], [869, 535], [1003, 485], [1137, 426], [1271, 368], [1388, 309], [1471, 251], [1538, 184], [1605, 100], [1700, 0]].map(function (p) { return P(p[0], p[1]); }));
    function km(t, a) {
      var k = tw(t, KES.km, AN[26] - KES.km + 1, Y.sin);
      T.bas(a, { x: kr(330, 800, k), y: kr(700, 450, k), z: kr(2.3, 1.0, k) });
      plaka('koy-kusbakisi', { d: 1, parilti: 0.7 });
      var s = tw(t, KES.km + 0.2, AN[26] - KES.km + 0.6, Y.sin);
      var dy = dunyaCizgi(parcaYol(YOL, s)), kz = ekranR(800, 450, 100).r / 100;
      goster(ipekGolge, dy, 0.9); goster(ipek, dy, 1); kullan(ipekGolge); kullan(ipek);
      ipek.setAttribute('stroke-width', f1(Math.max(4, 5 * kz))); ipekGolge.setAttribute('stroke-width', f1(Math.max(9, 11 * kz)));
      // kopmadan, düğümsüz: iplik boyunca bir parıltı akar
      var pa = pencere(t, AN[26], KES.anne, 0.3, 0.3);
      if (pa > 0.01) { for (var i = 0; i < 3; i++) { var q = uzerinde(YOL, ((a * 0.25) + i / 3) % 1), e = T.ekran(q[0], q[1], 1); T.iz(e.x, e.y, 16, 16, 0, 1, 0.95, 0.7, 0.7 * pa); T.iz(e.x, e.y, 5, 5, 0, 1, 1, 1, pa); } T.izBitir(); }
      var bas = P(134, 790); if (t < AN[26]) isima(bas[0], bas[1], 40, [1, 0.9, 0.6], 0.3 * (1 - k));
    }
    // 10. Annesini görmedi: yaprağın üstünde yumurtalar; biri açılır, minik kara tırtıl tek başına çıkar
    var YUM = P(455, 392);
    function yumurtalar(x, y, n, o, zz, renk) {
      for (var i = 0; i < n; i++) { var e = T.ekran(x + (hash(i, 51) - 0.5) * 60, y + (hash(i, 52) - 0.5) * 26, 1); T.iz(e.x, e.y, 3.4 * zz, 2.8 * zz, 0, renk[0], renk[1], renk[2], o); }
      T.izBitir();
    }
    function anne(t, a) {
      T.bas(a, { x: YUM[0] + 10, y: YUM[1] - 6, z: kr(3.2, 3.6, tw(t, KES.anne, 4, Y.sin)) });
      odaGun(t, a, null);
      T.ciz('dut-yaprak', { x: YUM[0], y: YUM[1], g: 120, r: 70, d: 1 });
      var zz = ekranR(800, 450, 100).r / 100;
      yumurtalar(YUM[0] - 8, YUM[1] - 4, 26, 1, zz, [0.93, 0.88, 0.72]);
      var c = tw(t, AN[27] + 0.6, 1.4);
      if (c > 0.01) {
        var x = YUM[0] + 14 + c * 26 + Math.sin(a * 1.2) * 2;
        tirtilCiz(x, YUM[1] + 6, 26, -10, Math.min(1, c * 2), a * 4, [0.3, 0.27, 0.25]);     // yeni çıkan ipek böceği tırtılı yumurtanın üç katı kadar, koyu renklidir
        dunyaHalka(1, x, YUM[1] + 6, 24, Math.min(1, c * 2) * pencere(t, AN[27] + 0.8, KES.kusursuz, 0.4, 0.3));
      }
    }
    // 10b. İlk seferinde kusursuz: dalda koza, altın halka
    function kusursuz(t, a) {
      T.bas(a, { x: KOZA[0], y: KOZA[1] + 10, z: kr(2.0, 2.4, tw(t, KES.kusursuz, 3, Y.sin)) });
      odaGun(t, a, null);
      kozaCiz(KOZA[0], KOZA[1], 96, -18, 1, null);
      var h = tw(t, AN[29] + 0.6, 0.6); if (h > 0.01) dunyaHalka(0, KOZA[0], KOZA[1], 64 * (1 + 0.04 * Math.sin(a * 3)), h);
      for (var i = 0; i < 12; i++) { var aa = i / 12 * 6.283 + a * 0.4, e = T.ekran(KOZA[0] + Math.cos(aa) * 74, KOZA[1] + Math.sin(aa) * 40, 1); T.iz(e.x, e.y, 4, 4, 0, 1, 0.92, 0.6, h * (0.4 + 0.6 * Math.sin(a * 3 + i))); }
      T.izBitir();
    }
    // 11. Öğle: dut gövdesinde ağustos böceği, ses halkaları bahçeyi doldurur
    function agustos(x, y, h, o, d) { T.ciz('agustos-bocegi', { x: x, y: y, h: h, d: d == null ? 1 : d, o: o == null ? 1 : o }); }
    function sesHalkalari(cx, cy, maxR, o, hiz) {
      sesHalka.forEach(function (p, i) {
        var f = (aNow * (hiz || 1.6) + i / sesHalka.length) % 1, r = 20 + f * maxR;
        goster(p, daire(cx, cy, r), o * (1 - f) * 0.9); kullan(p);
      });
    }
    var aNow = 0;
    function ogle(t, a) {
      var kam = kameraYolu(t, [[KES.ogle, { x: 800, y: 430, z: 1.08 }], [AN[31] + 0.5, { x: AGB.x + 40, y: AGB.y + 30, z: 2.1 }], [W.ceviz + 0.3, { x: AGB.x + 40, y: AGB.y + 30, z: 2.3 }],
        [AN[32] + 2.2, { x: 800, y: 450, z: 1.0 }], [KES.agKesit, { x: 800, y: 450, z: 1.0 }]]);
      T.bas(a, kam);
      plaka('dut-ogle', { d: 1, parilti: 0.7, ruzgar: 0.22 });
      isima(800, -120, 420, [1, 0.95, 0.75], 0.16);                       // Güneş tepede (çerçevenin üstünde)
      agustos(AGB.x, AGB.y, AGB.h, 1);
      var so = tw(t, AN[31] + 0.3, 0.6);
      if (so > 0.01) {
        var e = ekranR(AGB.x + 6, AGB.y + 10, 1), buyu = tw(t, AN[32] + 1.3, 1.6);
        sesHalkalari(e.x, e.y, kr(160, 1100, buyu), so, 1.8);
      }
    }
    // 12. Karın kesiti: büyük ağustos böceği; yanındaki ince zar tıkırdar, içi boş karın sesi davul gibi büyütür
    var AGK = { x: 640, y: 470, h: 760 };
    function agNokta(fx, fy) { var g = AGK.h * 0.428; return [AGK.x + (fx - 0.5) * g, AGK.y + (fy - 0.5) * AGK.h]; }
    function agKesit(t, a) {
      T.bas(a, { x: 800, y: 450, z: kr(1.06, 1, tw(t, KES.agKesit, 3)) });
      plaka('dut-ogle', { x: 700, y: 400, g: PG * 1.5, h: PH * 1.5, d: 0.3, carp: [0.5, 0.48, 0.42], doy: 0.7 });
      agustos(AGK.x, AGK.y, AGK.h, 1, 1);
      // ağızdan değil: baş çevresinde soluk halka
      var bh = pencere(t, AN[33], AN[34], 0.3, 0.3), bs = agNokta(0.45, 0.08);
      if (bh > 0.01) dunyaHalka(0, bs[0], bs[1], 52, bh * 0.8);
      // zar: karnın yanında, kanat kökünün hemen altında; kaburgaları hızla içe dışa bükülür
      var zo = tw(t, W.zar - 0.1, 0.5), z = agNokta(0.47, 0.33);
      if (zo > 0.01) {
        dunyaHalka(1, z[0], z[1], 46 * (1 + 0.03 * Math.sin(a * 40)), zo);
        zarCizgi.forEach(function (p, i) {
          var b = Math.sin(a * 60 + i * 0.9) * 6 * tw(t, W.tikir - 0.3, 0.4), y0 = z[1] - 24 + i * 16;
          goster(p, dunyaCizgi([[z[0] - 18, y0], [z[0] + b, y0 + 3], [z[0] + 18, y0]]), zo); kullan(p);
        });
      }
      // içi boş karın: içerde ses dalgaları dolaşır, dışarı büyüyerek çıkar
      var ko = tw(t, W.bos - 0.2, 0.6), kc = agNokta(0.6, 0.5);
      if (ko > 0.01) {
        var kr0 = ekranR(kc[0], kc[1], 1), rx = AGK.h * 0.428 * 0.17 * (kr0.r), ry = AGK.h * 0.15 * kr0.r;
        goster(bosKarin, elips(kr0.x, kr0.y, rx, ry), ko); kullan(bosKarin);
        ici.forEach(function (p, i) { var f = (a * 1.4 + i / 3) % 1; goster(p, elips(kr0.x, kr0.y, rx * f, ry * f), ko * (1 - f)); kullan(p); });
        var dv = tw(t, W.davul - 0.3, 0.6);
        if (dv > 0.01) sesHalkalari(kr0.x, kr0.y, 900, dv, 1.5);
      }
    }
    // 13. Gölet: kurbağalar, balık gölgeleri; kamera suya iner
    var KURBAGA = [P(142, 719), P(1496, 727)];
    function golet(t, a) {
      var kam = kameraYolu(t, [[KES.golet, { x: 800, y: 420, z: 1.06 }], [AN[37] + 0.4, { x: 800, y: 470, z: 1.12 }], [AN[38], { x: 820, y: 520, z: 1.3 }], [KES.mik, { x: 836, y: 600, z: 2.2 }]]);
      T.bas(a, kam);
      plaka('golet', { d: 1, parilti: 0.7 });
      // halkalar: kurbağaların önünde ve suyun ortasında yayılan halkalar
      [[KURBAGA[0][0] + 70, KURBAGA[0][1] + 30], [KURBAGA[1][0] - 70, KURBAGA[1][1] + 30], [836, 560], [600, 640]].forEach(function (p, i) {
        var f = (a * 0.45 + i * 0.27) % 1, e = T.ekran(p[0], p[1], 1), zz = ekranR(p[0], p[1], 100).r / 100;
        goster(halkalar[i], elips(e.x, e.y, (14 + f * 110) * zz, (5 + f * 34) * zz), 0.7 * (1 - f)); kullan(halkalar[i]);
      });
      var go = tw(t, AN[38] + 0.2, 1.2);
      if (go > 0.01) { for (var j = 0; j < 60; j++) { var e2 = T.ekran(600 + hash(j, 61) * 480 + Math.sin(a * (0.8 + hash(j, 62)) + j) * 10, 520 + hash(j, 63) * 200 + Math.cos(a + j) * 6, 1); T.iz(e2.x, e2.y, 1.6, 1.6, 0, 1, 1, 0.9, 0.55 * go * (0.5 + 0.5 * Math.sin(a * 3 + j))); } T.izBitir(); }
    }
    // 14-15. Mikroskop: önce masada, sonra göz merceğinden görüş penceresi; çocuk düğmeyi çevirir (durak 3)
    var MIK = { x: 470, y: 470, h: 700 };
    function mikNokta(fx, fy) { var g = MIK.h * 0.551; return [MIK.x + (fx - 0.5) * g, MIK.y + (fy - 0.5) * MIK.h]; }
    var GV = { x: 760, y: 380, r: 290 };            // görüş penceresi (sahne noktası, ekrana yapışık)
    var KN = { x: 1250, y: 400, r: 66, R: 112 };   // büyütme düğmesi ve tutma yolu
    function dugmeAci(v) { return (-135 + 2.7 * v) * Math.PI / 180; }
    function boy(v) { return 330 * Math.pow(2, (v - 65) / 14); }      // terliksi hayvanın ekrandaki boyu
    function gorus(t, a, v, o) {
      var L = boy(v), kalabalik = [[0, 0, 0], [3.1, -1.6, 1.2], [-2.6, 1.9, 2.4], [2.2, 2.6, 0.6], [-3.4, -2.2, 1.8], [5.2, 0.4, 2.9], [-5.5, 0.9, 0.3]];
      // aydınlık alan
      // kâğıdın süslü kenarı görüş dairesinin dışında, maskenin altında kalsın diye görsel büyük çizilir
      T.ciz('kagit', { x: GV.x, y: GV.y, g: GV.r * 2.6, h: GV.r * 2.6, d: 0, o: o, kure: { duz: true, isik: 0 }, carp: [0.97, 1.0, 0.93], doy: 0.6 });
      // kırıntılar (canlı değil): büyüdükçe dışarı kaçar
      for (var i = 0; i < 40; i++) {
        var wx = (hash(i, 71) - 0.5) * 9, wy = (hash(i, 72) - 0.5) * 9, x = GV.x + wx * L * 0.5, y = GV.y + wy * L * 0.5;
        if (Math.hypot(x - GV.x, y - GV.y) > GV.r) continue;
        var b = Math.max(0.8, L * 0.012 * (0.5 + hash(i, 73)));
        T.iz(x, y, b, b * 0.7, hash(i, 74) * 3, 0.55, 0.5, 0.36, o * 0.5);
      }
      T.izBitir();
      var bul = sinirla((v - 80) / 20, 0, 1);
      kalabalik.forEach(function (c, i) {
        var yuz = a * 0.35 + c[2], x = GV.x + (c[0] + Math.cos(yuz) * 0.25) * L, y = GV.y + (c[1] + Math.sin(yuz * 0.8) * 0.18) * L;
        if (i === 0) { x = GV.x + Math.sin(a * 0.4) * L * 0.04; y = GV.y + Math.cos(a * 0.33) * L * 0.03; }
        var r = (i === 0 ? -8 + Math.sin(a * 0.5) * 6 : c[2] * 60 + a * 12), reach = L * 0.6;
        if (Math.hypot(x - GV.x, y - GV.y) - reach > GV.r) return;
        if (L < 14) { T.iz(x, y, Math.max(1.4, L * 0.5), Math.max(1, L * 0.22), r * Math.PI / 180, 0.45, 0.6, 0.45, o * 0.8); T.izBitir(); return; }
        if (bul > 0.01 && i === 0) {                                       // aşırı büyütme: görüntü yayılır, bulanıklaşır
          for (var k = 0; k < 6; k++) { var aa = k / 6 * 6.283; T.ciz('terliksi', { x: x + Math.cos(aa) * 14 * bul, y: y + Math.sin(aa) * 14 * bul, g: L, r: r, d: 0, o: o * 0.24 }); }
          T.ciz('terliksi', { x: x, y: y, g: L, r: r, d: 0, o: o * (1 - bul * 0.7) });
        } else T.ciz('terliksi', { x: x, y: y, g: L, r: r, d: 0, o: o });
        // kirpikler: kenar boyunca dalga dalga çarpar (yalnız ana canlıda, yakın büyütmede)
        if (i === 0 && L > 150 && L < 900) {
          var rr = r * Math.PI / 180, kn = Math.cos(rr), sn = Math.sin(rr), A = L * 0.47, B = L * 0.2;
          for (var j = 0; j < 90; j++) {
            var u = j / 90 * 6.283, ex = Math.cos(u) * A, ey = Math.sin(u) * B * (1 - 0.18 * Math.cos(u)), nx = Math.cos(u) * B, ny = Math.sin(u) * A, nl = Math.hypot(nx, ny);
            var px = x + ex * kn - ey * sn, py = y + ex * sn + ey * kn, aci = Math.atan2(nx * sn + ny * kn, nx * kn - ny * sn) + Math.sin(a * 9 - j * 0.55) * 0.55;
            var l = L * 0.022 * (1 + bul);
            T.iz(px + Math.cos(aci) * l, py + Math.sin(aci) * l, l, Math.max(0.6, L * 0.0016), aci, 0.95, 0.88, 0.55, o * 0.55 * (1 - bul * 0.5));
          }
          T.izBitir();
        }
      });
      // mürekkep noktası: kâğıttaki bir nokta, aynı büyütmede yanında (bir noktadan bile küçük)
      var nk = pencere(t, AN[42], AN[43], 0.4, 0.6);
      if (nk > 0.01) { var nr = L * 0.85; goster(murekkep, daire(GV.x + L * 1.25, GV.y + L * 0.2, nr), nk); kullan(murekkep); }
    }
    function gorusCerceve(v, o, tutulur) {
      var d = 'M-60 -60 H1660 V960 H-60Z ' + daire(GV.x, GV.y, GV.r);
      goster(maske, d, o); kullan(maske);
      goster(gorusHalka, daire(GV.x, GV.y, GV.r + 4), o); kullan(gorusHalka);
      var th = dugmeAci(v), gx = KN.x + KN.R * Math.sin(th), gy = KN.y - KN.R * Math.cos(th);
      var a0 = dugmeAci(0), a1 = dugmeAci(100);
      goster(dugme.iz, 'M' + f1(KN.x + KN.R * Math.sin(a0)) + ' ' + f1(KN.y - KN.R * Math.cos(a0)) + ' A' + KN.R + ' ' + KN.R + ' 0 1 1 ' + f1(KN.x + KN.R * Math.sin(a1)) + ' ' + f1(KN.y - KN.R * Math.cos(a1)), o * (tutulur ? 1 : 0.5));
      goster(dugme.govde, daire(KN.x, KN.y, KN.r), o);
      var tk = ''; for (var i = 0; i < 24; i++) { var u = i / 24 * 6.283 + th; tk += 'M' + f1(KN.x + Math.cos(u) * (KN.r - 12)) + ' ' + f1(KN.y + Math.sin(u) * (KN.r - 12)) + ' L' + f1(KN.x + Math.cos(u) * (KN.r - 2)) + ' ' + f1(KN.y + Math.sin(u) * (KN.r - 2)) + ' '; }
      goster(dugme.tirtik, tk, o);
      goster(dugme.ibre, 'M' + f1(KN.x) + ' ' + f1(KN.y) + ' L' + f1(KN.x + (KN.r - 16) * Math.sin(th)) + ' ' + f1(KN.y - (KN.r - 16) * Math.cos(th)), o);
      goster(dugme.tut, daire(gx, gy, tutulur ? 20 : 14), o * (tutulur ? 1 : 0.7));
      [dugme.iz, dugme.govde, dugme.tirtik, dugme.ibre, dugme.tut].forEach(kullan);
    }
    function mikroskop(t, a) {
      var ac = tw(t, AN[40] - 0.3, 1.1, Y.ikili);                            // göz merceğine dalış
      var mer = mikNokta(0.36, 0.02);
      T.bas(a, { x: kr(800, mer[0], ac * 0.85), y: kr(450, mer[1], ac * 0.85), z: kr(1, 3.2, ac) });
      plaka('golet', { x: 800, y: 470, g: PG * 1.5, h: PH * 1.5, d: 0.2, carp: [0.38, 0.45, 0.55], doy: 0.6 });
      T.ciz('mikroskop', { x: MIK.x, y: MIK.y, h: MIK.h, d: 1 });
      var dm = mikNokta(0.33, 0.575); isima(dm[0], dm[1], 22, [0.7, 0.95, 1], 0.5 + 0.2 * Math.sin(a * 2));
      var dd = tw(t, W.damla - 0.2, 0.6); if (dd > 0.01) dunyaHalka(0, dm[0], dm[1], 34, dd * (1 - ac));
      var go = tw(t, AN[40] + 0.3, 0.8);
      if (go > 0.01) {
        var acik = api.acikDurak() === 'mikroskop', v = acik ? mv : 10;
        gorus(t, a, v, go); gorusCerceve(v, go, acik);
        maske.setAttribute('d', 'M-60 -60 H1660 V960 H-60Z ' + daire(GV.x, GV.y, kr(4, GV.r, go)));
      }
    }
    function terliksi(t, a) {
      T.bas(a, { x: 800, y: 450, z: 1 });
      var v0 = api.bitti('mikroskop') ? sinirla(mv, 55, 75) : 65;
      var v = v0;
      var n1 = tw(t, AN[42] - 0.2, 1.4, Y.sin), n2 = tw(t, AN[43] - 0.2, 1.4, Y.sin);
      v = kr(kr(v0, 40, n1), 66, n2);
      gorus(t, a, v, 1); gorusCerceve(v, 1, false);
      gizle(dugme.tut);
    }
    // 16. Akşamüstü: bahçenin kesiti; köstebek, ördek, yarasa kendi yerine (durak 4)
    var YER = [
      { ad: 'yarasa', bekle: P(552, 262), yer: [1000, 205] },
      { ad: 'ordek', bekle: P(669, 500), yer: [1250, 432] },
      { ad: 'kostebek', bekle: P(250, 498), yer: [290, 705] }
    ];
    function yerlesti(i, t) { return yerde[i] || (t > D.yer + 0.05 && api.acikDurak() !== 'yer'); }
    function aksam(t, a) {
      T.bas(a, { x: 800, y: 450, z: kr(1.08, 1, tw(t, KES.aksam, 3)) });
      plaka('kesit', { d: 1, parilti: 0.5 });
      var gor = [tw(t, W.yarasa - 0.2, 0.6), tw(t, W.ordek - 0.2, 0.6), tw(t, W.kostebek - 0.2, 0.6)];
      // ? işaretleri: yerler (durak öncesi)
      // yarasa
      var y0 = YER[0], ky = yerlesti(0, t);
      if (gor[0] > 0.01) {
        if (!ky) {                                                          // ağacın yanında küçük daireler çizerek bekler
          var wx = y0.bekle[0] + Math.sin(a * 0.8) * 22, wy = y0.bekle[1] + Math.cos(a * 1.1) * 9, wk = 1 + Math.sin(a * 11) * 0.1;
          T.ciz('yarasa', { x: wx, y: wy, g: 150 * wk, h: 150 / 2.417, d: 1, o: gor[0] });
        } else {
          var u = a * 0.5, bx = y0.yer[0] + Math.cos(u) * 120, by = y0.yer[1] + Math.sin(u * 2) * 22, kan = 1 + Math.sin(a * 12) * 0.12;
          T.ciz('yarasa', { x: bx, y: by, g: 190 * kan, h: 190 / 2.417, d: 1 });
          // yankı: yarasadan yayılan ince ses halkaları; ağaca çarpınca daha soluk halkalar geri döner
          var ag = P(330, 200);
          yankilar.forEach(function (p, i) {
            var f = (a * 0.8 + (i % 2) * 0.5) % 1, cik = i < 2, merkez = cik ? [bx, by] : ag, e = ekranR(merkez[0], merkez[1], 1);
            var r = (cik ? 20 + f * 300 : 16 + f * 220) * e.r;
            goster(p, daire(e.x, e.y, r), (cik ? 0.75 : 0.32) * (1 - f)); kullan(p);
          });
        }
      }
      // ördek
      var o0 = YER[1], ko = yerlesti(1, t);
      if (gor[1] > 0.01) {
        if (!ko) T.ciz('ordek', { x: o0.bekle[0], y: o0.bekle[1], h: 170, ax: 0.5, ay: 0.97, d: 1, o: gor[1] });
        else {
          var ox = o0.yer[0] + Math.sin(a * 0.3) * 60, oy = o0.yer[1] + Math.sin(a * 1.6) * 2;
          T.ciz('ordek', { x: ox, y: oy, h: 170, ax: 0.5, ay: 0.78, d: 1 });               // gövde suyun üstünde, ayaklar suyun altında
          for (var j = 0; j < 8; j++) { var f2 = (a * 0.8 + j / 8) % 1, e2 = T.ekran(ox - 80 - f2 * 140, oy + (j % 2 ? -1 : 1) * f2 * 26, 1); T.iz(e2.x, e2.y, 10 * (1 - f2) + 2, 2, 0, 0.9, 1, 1, 0.6 * (1 - f2)); }
          for (var b = 0; b < 6; b++) { var f3 = (a * 0.6 + b / 6) % 1, e3 = T.ekran(ox + 10 + Math.sin(b * 2 + a * 3) * 8, oy + 40 - f3 * 36, 1); T.iz(e3.x, e3.y, 3, 3, 0, 0.9, 1, 1, 0.5 * (1 - f3)); }
          T.izBitir();
        }
      }
      // köstebek
      var k0 = YER[2], kk = yerlesti(2, t);
      if (gor[2] > 0.01) {
        if (!kk) T.ciz('kostebek', { x: k0.bekle[0], y: k0.bekle[1], g: 230, ax: 0.5, ay: 0.92, d: 1, o: gor[2] });
        else {
          var kx = k0.yer[0] + 30 + Math.sin(a * 0.4) * 34, kyy = k0.yer[1];            // tünelin içinde ileri geri kazar, yüzü solda
          T.ciz('kostebek', { x: kx, y: kyy, g: 230, ax: 0.5, ay: 0.7, d: 1, r: Math.sin(a * 8) * 2 });
          for (var q = 0; q < 10; q++) { var f4 = (a * 1.3 + q / 10) % 1, e4 = T.ekran(kx - 40 + f4 * 150, kyy + 10 - Math.sin(f4 * Math.PI) * 30 + (hash(q, 81) - 0.5) * 20, 1); T.iz(e4.x, e4.y, 4, 3, 0, 0.42, 0.28, 0.16, 0.8 * (1 - f4)); }
          T.izBitir();
        }
      }
      // özellik halkaları: ad geçerken altın halka
      var hk = [pencere(t, W.yarasa, AN[49], 0.3, 0.4), pencere(t, W.ordek, AN[48], 0.3, 0.4), pencere(t, W.kostebek, AN[47], 0.3, 0.4)];
      if (hk[2] > 0.01 && !kk) dunyaHalka(0, k0.bekle[0] - 80, k0.bekle[1] - 18, 46, hk[2]);       // kürek gibi ön ayaklar
      if (hk[1] > 0.01 && !ko) dunyaHalka(1, o0.bekle[0] + 6, o0.bekle[1] - 10, 50, hk[1]);        // perdeli ayaklar
      if (hk[0] > 0.01 && !ky) dunyaHalka(2, y0.bekle[0], y0.bekle[1] - 6, 52, hk[0]);             // büyük kulaklar
      // adlar: bekleyen canlıların altında
      [[0, y0.bekle[0] + 150, y0.bekle[1] + 10, ky], [1, o0.bekle[0] - 10, o0.bekle[1] + 28, ko], [2, k0.bekle[0] + 20, k0.bekle[1] + 46, kk]].forEach(function (s) {
        var e = ADLAR[s[0]], o = (s[3] || t > KES.gece) ? 0 : gor[s[0]];
        if (o > 0.003) { var p = T.ekran(s[1], s[2], 1); e._x = p.x; e._y = p.y; }
        gos(e, o);
      });
    }
    // 18. Gece: bahçe ve ateş böcekleri (durak 5: eşleştirmede sahne kararır)
    function geceSahne(t, a) {
      var es = api.acikDurak() === 'sir' ? 1 : 0;
      T.bas(a, { x: 800, y: kr(470, 450, tw(t, KES.gece, 3)), z: kr(1.12, 1.02, tw(t, KES.gece, 4)) });
      gece(a, 1, es ? [0.42, 0.46, 0.6] : null);
      atesler(a, es ? 0.5 : 1, [140, 1520, 560, 900], 170, true);
    }
    // 19. Büyük soru: bugünün canlıları madalyonlarda
    var MAD = [['ates-bocegi', 330, 290, 196, W.atesB], ['koza', 640, 250, 176, W.ipekB], ['kostebek', 960, 250, 196, W.kostebekB], ['ordek', 1270, 290, 100, W.ordekB]];
    function buyuk(t, a) {
      T.bas(a, { x: 800, y: 450, z: kr(1.04, 1, tw(t, KES.buyuk, 6, Y.sin)) });
      gece(a, 1, [0.55, 0.58, 0.75]);
      atesler(a, 0.6, [140, 1520, 600, 900], 90, true);
      MAD.forEach(function (m, i) {
        var o = tw(t, m[4] - 0.2, 0.7), s = kr(0.85, 1, o);
        goster(madalyon[i], daire(m[1], m[2], 112 * s), o); kullan(madalyon[i]);
        if (o > 0.01) {
          T.ciz('kagit', { x: m[1], y: m[2], g: 224 * s, h: 224 * s, d: 0, o: o, kure: { duz: true, isik: 0 }, carp: [0.12, 0.17, 0.4] });
          if (m[0] === 'ordek') T.ciz(m[0], { x: m[1], y: m[2], h: m[3] * 1.6 * s, d: 0, o: o });
          else T.ciz(m[0], { x: m[1], y: m[2], g: m[3] * s, d: 0, o: o });
        }
      });
    }
    // 21. Sırrın çözümü: iki hafta sonra koza açılır; kelebek çıkar, kanatlarını açar, yumurtalarını bırakır
    function sirCoz(t, a) {
      var kam = kameraYolu(t, [[KES.sirCoz, { x: KOZA[0], y: KOZA[1] + 20, z: 2.1 }], [AN[65], { x: KOZA[0] - 20, y: KOZA[1] + 10, z: 2.6 }], [AN[67], { x: KOZA[0] + 10, y: KOZA[1] + 50, z: 2.3 }], [KES.son, { x: KOZA[0] + 20, y: KOZA[1] + 70, z: 2.1 }]]);
      T.bas(a, kam);
      // iki hafta: ışık hızla gündüz gece döner, sonra şafakta durur
      var hf = ic(t, AN[64], AN[65] - AN[64]), dn = hf > 0 && hf < 1 ? 0.5 - 0.5 * Math.cos(hf * Math.PI * 14) : 0;
      var safak = [1.04, 0.92, 0.86];
      odaGun(t, a, [kr(safak[0], 0.34, dn), kr(safak[1], 0.4, dn), kr(safak[2], 0.7, dn)]);
      var hl = pencere(t, AN[63], AN[64], 0.4, 0.4); if (hl > 0.01) dunyaHalka(0, KOZA[0], KOZA[1], 64, hl);
      // sıvı: kozanın sol ucu ıslanır, yumuşar; kapı açılır
      var uc = [KOZA[0] - 44, KOZA[1] + 12], sv = tw(t, AN[65] - 0.2, 2.4);
      kozaCiz(KOZA[0], KOZA[1], 96, -18, 1, null);
      var zz = ekranR(800, 450, 100).r / 100;
      if (sv > 0.01) { var e = T.ekran(uc[0], uc[1], 1); T.iz(e.x, e.y, 15 * zz * sv, 13 * zz * sv, 0.3, 0.62, 0.52, 0.36, 0.55 * sv); T.iz(e.x, e.y, 8 * zz * sv, 7 * zz * sv, 0.3, 0.3, 0.24, 0.18, 0.6 * tw(t, W.kapi - 0.2, 0.6)); T.izBitir(); }
      // kelebek: kapıdan çıkar (sola), kanatları buruşuk ve dar başlar, yavaş yavaş açılır; uçmaz
      var ck = tw(t, W.kapi + 0.1, 2.2, Y.sin), ac = tw(t, AN[67], 3.2, Y.sin);
      if (ck > 0.01) {
        var mx = uc[0] - 6 - ck * 56, my = uc[1] + 6 + ck * 22, kan = kr(0.42, 1, ac);
        T.ciz('ipek-kelebek', { x: mx, y: my, g: 96 * kan, h: 96 / 1.657 * kr(0.75, 1, ac), r: -70 + ac * 40 + Math.sin(a * 6) * 2 * ac, d: 1, o: Math.min(1, ck * 1.6) });
      }
      // yumurtalar ve gelecekteki kozanın hayali
      var yu = tw(t, W.yumurta, 1.6);
      if (yu > 0.01) yumurtalar(KOZA[0] + 36, KOZA[1] + 118, Math.round(30 * yu), 1, zz, [0.96, 0.9, 0.6]);
      var hy = tw(t, AN[68] + 1.4, 1.2);
      if (hy > 0.01) { var c = ekranR(KOZA[0] + 140, KOZA[1] + 60, 1); goster(hayalet, elips(c.x, c.y, 46 * c.r, 18 * c.r), hy * 0.8); hayalet.setAttribute('transform', 'rotate(-14 ' + f1(c.x) + ' ' + f1(c.y) + ')'); kullan(hayalet); }
    }
    // 22. Kapanış: sabah bahçesi, kamera geriye çekilir
    function kapanis(t, a) {
      var ak = tw(t, KES.son, 5, Y.sin);
      T.bas(a, { x: kr(500, 800, ak), y: kr(500, 450, ak), z: kr(1.7, 1.02, ak) });
      plaka('bahce-safak', { d: 1, parilti: 0.7, ruzgar: 0.12 });
      isima(-40, 560, 360, [1, 0.8, 0.55], 0.14);
    }

    /* ——— perde: kesmelerde kısa bir an lacivert (kâğıt bölümünde krem) karartma ——— */
    var LACI = [0.07, 0.11, 0.3], KREM = [1, 1, 1];
    var PERDE = [[KES.sirOda], [KES.ates], [KES.soguk], [KES.dil], [KES.sabah], [KES.oda], [KES.orme], [KES.km], [KES.anne], [KES.kusursuz], [KES.ogle], [KES.agKesit],
      [KES.golet], [KES.mik], [KES.aksam], [KES.gece], [KES.buyuk], [KES.kagit, KREM], [KES.sirCoz, KREM], [KES.son]];
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
      [KES.sirDis, kanca], [KES.sirOda, sirDis], [KES.ates, sirOda], [KES.soguk, atesYakin], [KES.dil, soguk], [KES.sabah, dil], [KES.oda, sabah],
      [KES.orme, oda], [KES.km, orme], [KES.anne, km], [KES.kusursuz, anne], [KES.ogle, kusursuz], [KES.agKesit, ogle], [KES.golet, agKesit],
      [KES.mik, golet], [AN[41] - 0.1, mikroskop], [KES.aksam, terliksi], [KES.gece, aksam], [KES.buyuk, geceSahne], [KES.kagit, buyuk],
      [KES.sirCoz, function (t, a) { T.bas(a, { x: 800, y: 450, z: 1 }); plaka('kagit', { d: 0 }); }], [KES.son, sirCoz], [Infinity, kapanis]
    ];
    function ciz(t, a) {
      aNow = a; acik = api.acikDurak(); kullanildi = [];
      for (var i = 0; i < BOLUM.length; i++) { if (t < BOLUM[i][0]) { BOLUM[i][1](t, a); break; } }
      if (!(t >= KES.aksam && t < KES.gece)) ADLAR.forEach(function (e) { gos(e, 0); });
      SVG_HEPSI.forEach(function (p) { if (kullanildi.indexOf(p) < 0) gizle(p); });
      perde(t);
      yazilar(t);
    }

    return {
      hazir: hazir,
      ciz: ciz,
      // Allahü teâlâdan söz edilen kâğıt bölümünde yazı sahnenin kendisidir; altyazı ve dokunma oyunu yoktur
      altyazisiz: function (t) { return kagitYazisi || (t >= KES.kagit && t < KES.sirCoz); },
      durak: function (id, olay, veri) {
        if (id === 'mikroskop' && olay === 'deger') mv = veri;
        if (id === 'yer') { if (olay === 'dogru') yerde[veri] = true; if (olay === 'ac') yerde = {}; }
      },
      // Mikroskobun büyütme düğmesi: çocuk tutamacı düğmenin çevresinde döndürür (saat yönünde büyütür)
      tutamac: function (id, deger) {
        var th = dugmeAci(deger);
        return { x: KN.x + KN.R * Math.sin(th), y: KN.y - KN.R * Math.cos(th), r: 80, ust: true };
      },
      // gerçek bir düğme gibi: değer parmağın düğme çevresinde ne kadar döndüğüyle değişir, uçlarda durur, atlamaz
      tutDeger: function (id, x, y, bas) {
        var aci = Math.atan2(x - KN.x, -(y - KN.y)) * 180 / Math.PI;      // yukarı 0, saat yönünde artı
        if (bas !== dn.bas) { dn.bas = bas; dn.aci = bas ? Math.atan2(bas.x - KN.x, -(bas.y - KN.y)) * 180 / Math.PI : aci; dn.v = bas ? bas.deger : mv; }
        var fark = aci - dn.aci; fark -= Math.round(fark / 360) * 360;
        dn.aci = aci; dn.v = sinirla(dn.v + fark / 2.7, 0, 100);
        return dn.v;
      }
    };
  };
})();
