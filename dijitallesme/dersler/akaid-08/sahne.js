/* Akaid 8 · Bilir, Görür, İşitir, Her Şeye Gücü Yeter — sahne: "Yaşayan Minyatür", Kapadokya; bir yaz günü.
   Üç katman sırayla gelir: yerin üstü (şafak vadisi, gece odası, bağ, peri bacaları), yerin altı (yeraltı şehri, kandil ışığı), kâğıt.
   Ders tek sahnede dönmez: şafakta güvercin evinin önündeki taş kaba su dolar; yeraltı şehrinin kesitinde kamera kat kat iner;
   en dip oda simsiyah; gece odasında kandil yeni sönmüş (durak 1), sonra yanar; kesitte mutfak, ahır, kuyu, taş kapı;
   yeraltı odasında çocuk kandilin alevini tutup ışığı ayarlar (durak 2); damla, hava bacası ve yarasanın ince sesi; duyulmayan ses (durak 3);
   karanlıkta yol bulan dört canlı (durak 4); bağda sayılamayan yapraklar; dev peri bacası ve küçücük bağ evi; sabah vadisinde
   bir güvercin suyu içer (durak 5); Allahü teâlâdan söz edilen bölümde boya çekilir, kâğıt ve yazı kalır; gece odasında kandil kısık (durak 6);
   en dip oda yine simsiyah; sır kâğıtta çözülür; ders sabah vadisinde, kamera yükselirken biter. Her olay anlatıcının kelimesine bağlıdır (t); a ortam saatidir.
   Yön: vadiye bakış kuzeye, doğu sağda; şafak ve sabah ışığı sağdan gelir. Ay tam yuvarlaktır, yüzsüzdür.
   Fizik: alev hep yukarı bakar, titrer; fitil uzayınca alev büyür ve tüter, fitil yağa inince söner; ışık kandilden yayılır, uzaklaştıkça azalır.
   Damla taşa düşünce halka halka yankı yayılır; ses bacadan aşağı iner; yarasanın ince sesi kulağa varmadan söner.
   Göz, kulak ve el çizilmez; insan figürü, yüz yoktur. Allahü teâlâ için hiçbir şekil, ışık ya da sembol kullanılmaz. */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-08'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['vadi-safak', 'vadi-sabah', 'oda-gece', 'yeralti-kesit', 'yeralti-oda', 'bag', 'peri', 'kagit',
      'kandil', 'guvercin', 'karinca', 'yarasa', 'baykus', 'kedi', 'tas-kapi', 'damla', 'peri-bacasi'];
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
    var D = {}; ['karanlik', 'kandil', 'ses', 'yol', 'bildi', 'zor'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {}; for (var n0 = 0; n0 <= 72; n0++) AN[n0] = C(n0);
    var W = {
      doldurdun: kel('doldurdun'), sekiz: kel('sekiz'), karinca1: kel('karınca', 1), isiga: kel('ışığa'), mutfak: kel('mutfaklar'),
      ahir: kel('ahırlar'), kuyu: kel('kuyular'), yuvarlanan: kel('yuvarlanan'), fitil: kel('fitil', 1), damliyor: kel('damlıyor'),
      baca: kel('bacasından'), yarasa: kel('yarasa'), yanki: kel('yankısıyla'), yaprak: kel('yaprak', 1), sayamazsin: kel('sayamazsın'),
      peri: kel('peri'), yuz: kel('yüz'), sabaha: kel('sabaha'), bilen: kel('bilen'), dua: kel('dua'), zor1: kel('zor', 1),
      sirri: kel('sırrı'), kandilVar: kel('kandil', 3)
    };
    // bölümler arası kesmeler (cümle başlarına düşer). Durak 3'ten sonraki cümlenin başı kayıtta durakla çakıştığı için kesme duraktan sonradır.
    var KES = {
      sir: AN[8] - 0.1, dip: AN[11] - 0.1, oda: AN[16] - 0.1, kesit2: AN[19] - 0.1, kandil: AN[23] - 0.1, karinca: D.ses + 0.2,
      bag: AN[42] - 0.1, peri: AN[46] - 0.1, sabah: AN[48] - 0.1, kagit: AN[51] - 0.3, gece: AN[60] - 0.1, sirCoz: AN[66] - 0.1,
      kagit2: AN[69] - 0.3, son: AN[71] - 0.2
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
      ['kimse görmedi', 'etiket', 800, 96, AN[5], AN[7] + 0.4],
      ['sekiz kat aşağı', 'etiket', 800, 96, W.sekiz - 0.2, KES.dip - 0.2],
      ['?', 'sor', 800, 380, AN[13], KES.oda - 0.3],
      ['görmek için: göz ve ışık', 'etiket', 800, 96, W.isiga - 0.3, KES.kesit2 - 0.2],
      ['kayadan mutfak, ahır, kuyu', 'etiket', 800, 96, W.mutfak - 0.2, AN[21] - 0.1],
      ['tekerlek gibi taş kapı', 'etiket', 800, 96, AN[21], AN[22] - 0.1],
      ['fitil', 'etiket', 800, 96, W.fitil - 0.2, D.kandil - 0.7],
      ['kulak her sesi duymaz', 'etiket', 800, 96, AN[28], AN[30] - 0.1],
      ['yarasanın sesi: duyamayız', 'etiket', 800, 96, W.yarasa + 0.4, AN[36] - 0.1],
      ['ancak bir yere kadar', 'etiket', 800, 96, AN[42], AN[43] - 0.1],
      ['yüz kişi de oynatamaz', 'etiket', 800, 96, W.yuz - 0.2, KES.sabah - 0.2],
      ['Allahü teâlâ her şeyi görür, her şeyi işitir.', 'kagit', 800, 330, AN[51], AN[54] - 0.4],
      ['Onun görmesi bizim görmemize benzemez. Göze de ışığa da muhtaç değildir.', 'kagit', 800, 560, AN[52], AN[54] - 0.4],
      ['Her zaman, her şeyi görür; gece de gündüz de.', 'kagit', 800, 330, AN[54], AN[56] - 0.4],
      ['İşitmesi de kulağa muhtaç değildir.', 'kagit', 800, 540, AN[55], AN[56] - 0.4],
      ['Allahü teâlâ her şeyi bilir.', 'kagit', 800, 300, AN[56], AN[58] - 0.4],
      ['Gizliyi de açığı da bilir; asmadaki yaprakların sayısını da, en küçük zerreyi de.', 'kagit', 800, 520, AN[57], AN[58] - 0.4],
      ['Gücü her şeye yeter.', 'kagit', 800, 360, AN[58], KES.gece - 0.4],
      ['Onun gücü sonsuzdur.', 'kagit', 800, 520, AN[59], KES.gece - 0.4],
      ['kimse görmese de iyilik', 'etiket', 800, 96, AN[60], AN[61] - 0.1],
      ['sessiz dua da işitilir', 'etiket', 800, 96, AN[61], AN[62] - 0.1],
      ['zor işte: yardım iste, çalış', 'etiket', 800, 96, AN[62], D.zor - 0.7],
      ['Ama Allahü teâlâ onu görür, ayak sesini işitir.', 'kagit', 800, 330, AN[69], KES.son - 0.4],
      ['Karanlıkta koku izini takip edip yuvasını bulmayı da ona O vermiştir.', 'kagit', 800, 540, AN[70], KES.son - 0.4],
      ['Gelecek ders: Peygamberler kimdir?', 'etiket', 800, 110, AN[71] + 0.2, AN[72] + 0.9]
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
    // bağdaki yaprak sayacı: sayı akar, "sayamazsın"da bulanıp söner
    var SAYI = yazi('0', 'sayi', 800, 200), sayiSon = '';
    function sayiYaz(t) {
      var o = pencere(t, W.yaprak, W.sayamazsin + 0.6, 0.3, 0.5);
      if (o > 0.003) {
        var n = Math.floor(Math.pow(Math.max(0, t - W.yaprak) * 3.2, 3.4));
        var m = n >= 100000 ? '99999+' : n.toLocaleString('tr-TR');
        if (m !== sayiSon) { SAYI.textContent = m; sayiSon = m; }
        SAYI.style.filter = 'blur(' + (3 * tw(t, W.sayamazsin - 0.2, 0.6)).toFixed(1) + 'px)';
      }
      gos(SAYI, o);
    }

    /* ——— SVG ——— */
    var defs = E2('defs', {}, svg);
    var dg = E2('linearGradient', { id: 'kd8-cerceve', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    [['0', '#f3d584'], ['1', '#c9972f']].forEach(function (d) { E2('stop', { offset: d[0], 'stop-color': d[1] }, dg); });
    // karanlık: ekranın tamamını örten, kandilin çevresinde açılan ışık halkası
    var kg = E2('radialGradient', { id: 'kd8-karanlik', gradientUnits: 'userSpaceOnUse', cx: '800', cy: '450', r: '600' }, defs);
    var KSTOP = [['0', 0], ['0.35', 0.08], ['0.7', 0.62], ['1', 1]].map(function (d) { return E2('stop', { offset: d[0], 'stop-color': 'rgb(4,6,16)', 'stop-opacity': String(d[1]) }, kg); });
    var karanlikRect = E2('rect', { x: '-80', y: '-80', width: '1760', height: '1060', fill: 'url(#kd8-karanlik)' }, svg);
    karanlikRect.style.opacity = 0; karanlikRect._o = 0;
    function yol(oz) { var p = E2('path', Object.assign({ d: 'M0 0', fill: 'none' }, oz || {}), svg); p.style.opacity = 0; p._o = 0; return p; }
    function gizle(p) { if (p._o !== 0) { p.style.opacity = 0; p._o = 0; } }
    function goster(p, d, o) { if (o <= 0.003) { gizle(p); return; } p.setAttribute('d', d); p.style.opacity = o; p._o = o; }
    function f1(x) { return x.toFixed(1); }
    function daire(cx, cy, r) { return 'M' + f1(cx - r) + ' ' + f1(cy) + ' a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0 a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
    function elips(cx, cy, rx, ry) { return 'M' + f1(cx - rx) + ' ' + f1(cy) + ' a' + f1(rx) + ' ' + f1(ry) + ' 0 1 0 ' + f1(2 * rx) + ' 0 a' + f1(rx) + ' ' + f1(ry) + ' 0 1 0 ' + f1(-2 * rx) + ' 0Z'; }
    var halkalar = [0, 1, 2, 3, 4, 5].map(function () { return yol({ stroke: '#ffe29a', 'stroke-width': 4 }); });
    var dalgalar = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function () { return yol({ stroke: 'rgba(220,240,255,0.9)', 'stroke-width': 3 }); });
    var madalyon = [0, 1, 2, 3].map(function () { return yol({ stroke: 'url(#kd8-cerceve)', 'stroke-width': 6 }); });
    var SVG_HEPSI = [].concat(halkalar, dalgalar, madalyon);
    var kullanildi = [];
    function kullan(p) { kullanildi.push(p); }

    /* ——— ortak yardımcılar ——— */
    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    function ekranR(x, y, r) { var e = T.ekran(x, y, 1), e2 = T.ekran(x + r, y, 1); return { x: e.x, y: e.y, r: e2.x - e.x }; }
    function isima(x, y, r, renk, o) { var s = ekranR(x, y, r); T.iz(s.x, s.y, s.r, s.r, 0, renk[0], renk[1], renk[2], o); T.izBitir(); }
    function halka(i, x, y, r, o) { goster(halkalar[i], daire(x, y, r), o); kullan(halkalar[i]); }
    function dunyaHalka(i, x, y, r, o) { var e = ekranR(x, y, r); halka(i, e.x, e.y, e.r, o); }
    function madalyonCiz(i, x, y, r, o, icerik) {
      var e = ekranR(x, y, r);
      goster(madalyon[i], daire(e.x, e.y, e.r), o); kullan(madalyon[i]);
      if (o <= 0.01) return;
      T.ciz('kagit', { x: x, y: y, g: r * 2, h: r * 2, d: 1, o: o, kure: { duz: true, isik: 0 }, carp: [0.12, 0.17, 0.4] });
      icerik(o);
    }
    // ses dalgası: kaynaktan yayılan halkalar; menzil biterse kulağa varmadan söner
    function dalga(ilk, adet, x, y, a, hiz, menzil, o, yassi) {
      for (var i = 0; i < adet; i++) {
        var f = ((a * hiz + i / adet) % 1), e = ekranR(x, y, f * menzil), oo = o * (1 - f) * (1 - f);
        goster(dalgalar[ilk + i], yassi ? elips(e.x, e.y, e.r, e.r * yassi) : daire(e.x, e.y, Math.max(1, e.r)), oo); kullan(dalgalar[ilk + i]);
      }
    }
    // kandil alevi: dış turuncu, iç sarı, öz beyaz; boyu h, hep yukarı bakar ve titrer
    function alev(x, y, h, a, o) {
      if (h < 1 || o <= 0.01) return;
      var e = ekranR(x, y, 1), z = e.r, tit = 1 + 0.08 * Math.sin(a * 17) + 0.05 * Math.sin(a * 29), sal = Math.sin(a * 7) * 0.06;
      var hh = h * 1.5 * tit * z, ww = Math.max(6, h * 0.4) * z;
      T.iz(e.x, e.y - hh * 0.45, ww * 2.6, hh * 1.4, 0, 1, 0.62, 0.22, 0.22 * o);
      T.iz(e.x, e.y - hh * 0.5, ww, hh * 0.55, sal, 1, 0.55, 0.15, 0.9 * o);
      T.iz(e.x, e.y - hh * 0.42, ww * 0.62, hh * 0.38, sal, 1, 0.86, 0.35, 0.95 * o);
      T.iz(e.x, e.y - hh * 0.3, ww * 0.3, hh * 0.18, 0, 1, 1, 0.92, o);
      T.izBitir();
    }
    // duman: alevin ya da sönmüş fitilin üstünden kıvrılarak yükselir
    function duman(x, y, a, o, koyu) {
      if (o <= 0.01) return;
      for (var j = 0; j < 12; j++) {
        var f = (a * 0.35 + j / 12) % 1, e = T.ekran(x + Math.sin(f * 9 + a) * 10 * f, y - f * 130, 1), r = (3 + f * 14) * ekranR(800, 450, 1).r;
        var c = koyu ? 0.2 : 0.78, rr = koyu ? r * 1.6 : r; T.iz(e.x, e.y, rr, rr, 0, c, c, c * 1.05, (koyu ? 0.7 : 0.2) * (1 - f) * o);
      }
      T.izBitir();
    }
    // karanlık örtüsü: ışık halkasının merkezi (dünya noktası), yarıçapı ve koyuluğu
    var karanlikO = -1;
    function karanlik(x, y, r, o) {
      if (o <= 0.003) { if (karanlikO !== 0) { karanlikRect.style.opacity = 0; karanlikO = 0; } return; }
      var e = ekranR(x, y, Math.max(1, r));
      kg.setAttribute('cx', f1(e.x)); kg.setAttribute('cy', f1(e.y)); kg.setAttribute('r', f1(Math.max(2, e.r)));
      var o2 = Math.round(o * 100) / 100; if (o2 !== karanlikO) { karanlikRect.style.opacity = o2; karanlikO = o2; }
    }

    /* ——— durak durumu ——— */
    var aNow = 0, kv = 50, kvA = -9, dn = { bas: null, v: 50 };

    /* ——— 0. Kanca: şafak vadisi; güvercin evinin önündeki taş kaba su dolar ——— */
    var KAB = P(780, 806), KAB_R = [222 * K, 24 * K], GUV = P(935, 772);
    function suKabi(t, a, dolu) {
      if (dolu <= 0.01) return;
      var e = ekranR(KAB[0], KAB[1], KAB_R[0]), ry = KAB_R[1] / KAB_R[0] * e.r;
      T.iz(e.x, e.y + (1 - dolu) * ry * 0.4, e.r * 0.98 * kr(0.7, 1, dolu), ry * kr(0.6, 1, dolu), 0, 0.42, 0.78, 0.86, 0.85 * dolu);
      T.iz(e.x - e.r * 0.3, e.y - ry * 0.2, e.r * 0.25, ry * 0.25, 0, 1, 1, 1, 0.25 * dolu);
      T.izBitir();
    }
    function kanca(t, a) {
      T.bas(a, kameraYolu(t, [[0, { x: 900, y: 420, z: 1.12 }], [AN[3], { x: 760, y: 600, z: 1.32 }], [AN[5], { x: 760, y: 640, z: 1.42 }], [KES.sir, { x: 700, y: 560, z: 1.3 }]]));
      plaka('vadi-safak', { d: 1, parilti: 0.5 });
      // sağ ufukta şafak ısınır
      var sf = tw(t, 0, KES.sir, Y.sin); isima(1560, 300, 420, [1, 0.62, 0.32], 0.1 + 0.12 * sf);
      // "sessizce doldurdun": kapta su yükselir, yüzeyde halkalar
      var dl = tw(t, W.doldurdun - 0.3, 1.8, Y.sin);
      suKabi(t, a, dl);
      if (dl > 0.05 && t < AN[7]) dalga(0, 3, KAB[0], KAB[1], a, 0.5, 160, 0.6 * dl, 0.12);
    }

    /* ——— 1. Sır: yeraltı şehrine iniş, en dip oda simsiyah ——— */
    function sir(t, a) {
      var k = tw(t, KES.sir, KES.dip - KES.sir, Y.sin);
      T.bas(a, { x: kr(800, 760, k), y: kr(300, 610, k), z: kr(1.35, 1.3, k) });
      plaka('yeralti-kesit', { d: 1, parilti: 0.5, carp: [kr(1, 0.55, k), kr(1, 0.5, k), kr(1, 0.55, k)] });
      if (pencere(t, W.sekiz - 0.2, KES.dip, 0.4, 0.3) > 0.01) dunyaHalka(0, P(800, 840)[0], P(800, 840)[1], 150, pencere(t, W.sekiz, KES.dip, 0.4, 0.3));
    }
    function dip(t, a) {
      T.bas(a, { x: 800, y: 470, z: kr(1.08, 1.0, tw(t, KES.dip, 5, Y.sin)) });
      plaka('yeralti-oda', { d: 1 });
      // karıncanın yürüdüğü soluk bir iz: ancak sezilir
      var ky = P(800, 760)[1], kx = 560 + ((a * 14) % 520);
      T.ciz('karinca', { x: kx, y: ky, g: 46, d: 1, o: 0.35 * tw(t, W.karinca1 - 0.3, 0.8), r: Math.sin(a * 3) * 4 });
      karanlik(800, 470, 1, 0.985);
    }

    /* ——— 2. Gece odası: kandil yeni sönmüş (durak 1), sonra yanar ——— */
    var FITIL1 = P(103, 386), PENCERE = P(1450, 360);
    function oda(t, a) {
      T.bas(a, kameraYolu(t, [[KES.oda, { x: 640, y: 470, z: 1.15 }], [D.karanlik - 0.4, { x: 800, y: 450, z: 1 }], [AN[17], { x: 800, y: 450, z: 1 }], [KES.kesit2, { x: 560, y: 470, z: 1.2 }]]));
      plaka('oda-gece', { d: 1, parilti: 0.35 });
      var yan = tw(t, W.isiga - 0.1, 1.2);
      // sönmüş fitilden ince duman; kandil yanınca oda ısınır
      duman(FITIL1[0], FITIL1[1], a, 1 - yan, false);
      if (yan > 0.01) { alev(FITIL1[0], FITIL1[1], 26 * yan, a, yan); isima(FITIL1[0] + 40, FITIL1[1], 420, [1, 0.7, 0.35], 0.22 * yan); }
      // "gözün açık olsa da hiçbir şey göremezsin": oda zifiri karanlığa döner
      var zf = pencere(t, AN[17] - 0.1, W.isiga, 0.5, 0.6);
      karanlik(FITIL1[0] + 60, FITIL1[1], kr(1, 900, yan), Math.max(0.55 * (1 - yan), 0.97 * zf));
    }

    /* ——— 3. Yeraltı kesiti: mutfak, ahır, kuyu, taş kapı ——— */
    var MUTFAK = P(400, 245), AHIR = P(250, 470), KUYU = P(1380, 760), KAPI = P(590, 458);
    var LAMBALAR = [[460, 175], [1055, 180], [292, 390], [723, 410], [1127, 375], [1562, 410], [612, 605], [1090, 570], [1528, 588], [228, 775], [1540, 755]].map(function (p) { return P(p[0], p[1]); });
    function kesit2(t, a) {
      T.bas(a, kameraYolu(t, [[KES.kesit2, { x: 800, y: 450, z: 1.05 }], [W.mutfak, { x: 640, y: 320, z: 1.25 }], [W.kuyu, { x: 960, y: 560, z: 1.25 }], [AN[21], { x: 640, y: 450, z: 1.25 }], [KES.kandil, { x: 760, y: 470, z: 1.15 }]]));
      plaka('yeralti-kesit', { d: 1, parilti: 0.55 });
      LAMBALAR.forEach(function (l, i) { isima(l[0], l[1], 70, [1, 0.75, 0.35], 0.14 + 0.04 * Math.sin(a * 6 + i * 1.7)); });
      [[MUTFAK, W.mutfak, 130], [AHIR, W.ahir, 130], [KUYU, W.kuyu, 120], [KAPI, W.yuvarlanan, 80]].forEach(function (h, i) {
        var o = pencere(t, h[1] - 0.15, h[1] + 1.6, 0.3, 0.4); if (o > 0.01) dunyaHalka(i, h[0][0], h[0][1], h[2], o);
      });
    }

    /* ——— 4. Yeraltı odası: kandil (durak 2), sesler, karınca ve yol bulan canlılar ——— */
    var KND = { x: 800, y: P(0, 668)[1], g: 260 }, KND_H = 260 * 161 / 420;
    var FITIL = [KND.x - 0.5 * KND.g + 0.037 * KND.g, KND.y - KND_H + 0.137 * KND_H];
    var DAMLA = P(1500, 712), BACA = P(1385, 190), TAVAN_Y = P(0, 300)[1];
    function alevBoy(v) { return v <= 1 ? 0 : 10 + v * 1.4; }
    var NF = { yol: 1.4 };
    function kandilCiz(t, a, v, oKaranlik) {
      T.ciz('kandil', { x: KND.x, y: KND.y, g: KND.g, ax: 0.5, ay: 1, d: 1 });
      var h = alevBoy(v);
      alev(FITIL[0], FITIL[1], h, a, 1);
      if (v > 72) duman(FITIL[0], FITIL[1] - h * 1.5, a, ic(v, 72, 20), true);   // uzun fitil tüter: alevin ucundan is yükselir
      if (v <= 1) duman(FITIL[0], FITIL[1], a, 0.8, false);                   // sönmüş fitilden ince duman
      if (h > 0) isima(FITIL[0], FITIL[1] - h * 0.4, 120 + h * 2.2, [1, 0.7, 0.32], 0.18 + 0.002 * h);
      var r = v <= 1 ? 1 : 140 + v * 9.5 + 10 * Math.sin(a * 11);             // ışık halkası alevle büyür
      karanlik(FITIL[0], FITIL[1] - h * 0.4, r, oKaranlik);
    }
    function kandilSahne(t, a) {
      var acik = api.acikDurak() === 'kandil';
      T.bas(a, kameraYolu(t, [[KES.kandil, { x: FITIL[0], y: FITIL[1] - 20, z: 1.6 }], [W.fitil + 0.6, { x: FITIL[0] + 40, y: FITIL[1] - 30, z: 1.75 }], [D.kandil - 0.5, { x: 800, y: 450, z: 1 }]]));
      plaka('yeralti-oda', { d: 1 });
      // anlatımda: alev "fitil uzarsa" deyince büyür, "kısalırsa" deyince küçülür; durakta çocuğun değeri
      var v = acik || t >= D.kandil ? kv : 50 + 30 * pencere(t, AN[25], AN[25] + 1.4, 0.5, 0.5) - 26 * pencere(t, AN[25] + 1.5, AN[26], 0.4, 0.5);
      kandilCiz(t, a, v, 0.97);
    }
    function sesler(t, a) {
      var acik = api.acikDurak() === 'ses';
      T.bas(a, { x: 800, y: 450, z: kr(1.06, 1, tw(t, D.kandil, 4, Y.sin)) });
      plaka('yeralti-oda', { d: 1 });
      // damla taşa düşer: halka halka yankı
      var df = (a * 0.6) % 1, dx = DAMLA[0], dy0 = DAMLA[1] - 190, dyb = dy0 + df * 190;
      if (df < 0.92) { var de = T.ekran(dx, dyb, 1); T.iz(de.x, de.y, 4, 7, 0, 0.8, 0.92, 1, 0.9); T.izBitir(); }
      var dsO = pencere(t, W.damliyor - 0.2, acik ? 1e9 : AN[32], 0.4, 0.5);
      dalga(0, 3, DAMLA[0], DAMLA[1], a, 0.6, 260, 0.75 * dsO, 0.35);
      // hava bacasından güvercin sesi iner
      var bO = pencere(t, W.baca - 0.2, acik ? 1e9 : AN[33], 0.4, 0.5);
      dalga(3, 3, BACA[0], BACA[1] + 40, a, 0.45, 300, 0.7 * bO, 0.5);
      // yarasa tavanda süzülür; ince sesi kulağa varmadan söner
      var yO = pencere(t, W.yarasa - 0.3, acik ? 1e9 : AN[37], 0.5, 0.5), yx = 700 + Math.sin(a * 0.7) * 200, yy = TAVAN_Y + 60 + Math.sin(a * 1.9) * 18;
      if (yO > 0.01) {
        isima(yx, yy, 130, [1, 0.8, 0.5], 0.12 * yO);   // kandilin ışığı yarasaya vurur
        T.ciz('yarasa', { x: yx, y: yy, g: 250, h: 77 * (0.7 + 0.3 * Math.abs(Math.sin(a * 9))), d: 1, o: yO });
        dalga(6, 3, yx, yy, a, 1.1, 150, 0.9 * yO * tw(t, W.yanki - 1.4, 0.4), 0);
      }
      kandilCiz(t, a, 50, 0.95);
    }
    function karincaSahne(t, a) {
      var es = api.acikDurak() === 'yol';
      T.bas(a, { x: 800, y: 470, z: kr(1.12, 1.04, tw(t, KES.karinca, 5, Y.sin)) });
      plaka('yeralti-oda', { d: 1, carp: es ? [0.55, 0.55, 0.65] : null });
      // karınca yerde yürür: yanı başımızda olsa da ayak sesi duyulmaz
      if (!es) { var kx = 900 + ((a * 18) % 360) - 180; T.ciz('karinca', { x: kx, y: P(0, 770)[1], g: 96, d: 1, r: Math.sin(a * 4) * 3 }); isima(kx, P(0, 770)[1], 60, [1, 0.85, 0.5], 0.1); }
      kandilCiz(t, a, 50, 0.93);
      // karanlıkta yol bulan dört canlı; eşleştirme açıkken resimler kartlarda, madalyonlar çekilir
      [['yarasa', 380], ['karinca', 660], ['baykus', 940], ['kedi', 1220]].forEach(function (m, i) {
        var o = es ? 0 : pencere(t, AN[39] + i * 0.3, D.yol + 1e-3, 0.5, 0.01) * (t < D.yol ? 1 : 0), p = [m[1], 320];
        madalyonCiz(i, p[0], p[1], 104 * kr(0.85, 1, o), o, function (oo) {
          if (m[0] === 'baykus') T.ciz('baykus', { x: p[0], y: p[1], h: 150, d: 1, o: oo });
          else T.ciz(m[0], { x: p[0], y: p[1], g: m[0] === 'kedi' ? 170 : m[0] === 'yarasa' ? 180 : 130, d: 1, o: oo });
        });
      });
    }

    /* ——— 5. Bağ: sayılamayan yapraklar ——— */
    function bag(t, a) {
      T.bas(a, { x: kr(700, 860, tw(t, KES.bag, 8, Y.sin)), y: kr(600, 520, tw(t, KES.bag, 8, Y.sin)), z: kr(1.4, 1.15, tw(t, KES.bag, 8, Y.sin)) });
      plaka('bag', { d: 1, parilti: 0.6, ruzgar: 0.18 });
      // "kaç yaprak var?": yapraklar tek tek parlar, giderek çoğalır
      var cok = tw(t, W.yaprak - 0.2, W.sayamazsin + 0.6 - W.yaprak, Y.gir), adet = Math.floor(cok * 160);
      for (var i = 0; i < adet; i++) {
        var p = P(30 + hash(i, 41) * 1620, 520 + hash(i, 42) * 400), e = T.ekran(p[0], p[1], 1), k = 0.5 + 0.5 * Math.sin(a * 3 + i);
        T.iz(e.x, e.y, 9, 9, 0, 1, 0.92, 0.55, 0.6 * k); T.iz(e.x, e.y, 3, 3, 0, 1, 1, 0.9, 0.9);
        if (i % 300 === 299) T.izBitir();
      }
      T.izBitir();
    }

    /* ——— 6. Peri bacaları: dev kaya ve küçücük bağ evi ——— */
    var KULUBE = P(995, 840);
    function peri(t, a) {
      var k = tw(t, KES.peri, KES.sabah - KES.peri, Y.sin);
      T.bas(a, { x: 820, y: kr(260, 640, k), z: kr(1.5, 1.35, k) });
      plaka('peri', { d: 1, parilti: 0.5, ruzgar: 0.1 });
      var o = pencere(t, W.yuz - 0.3, KES.sabah, 0.4, 0.3); if (o > 0.01) dunyaHalka(0, KULUBE[0], KULUBE[1] - 30, 90, o);
    }

    /* ——— 7. Sabah vadisi: güvercinler dolu kaptan su içer (durak 5) ——— */
    function sabah(t, a) {
      T.bas(a, kameraYolu(t, [[KES.sabah, { x: 900, y: 470, z: 1.15 }], [D.bildi - 0.4, { x: 800, y: 450, z: 1 }]]));
      plaka('vadi-sabah', { d: 1, parilti: 0.55, ruzgar: 0.08 });
      isima(1580, 280, 300, [1, 0.8, 0.5], 0.14);
      // güvercin kabın kenarında: başını eğip su içer, kaldırır
      var gag = Math.max(0, Math.sin(a * 1.8));
      T.ciz('guvercin', { x: GUV[0], y: GUV[1] + 6, h: 78, ax: 0.5, ay: 1, d: 1, r: 18 * gag });
      dalga(0, 2, KAB[0] + 120, KAB[1], a, 0.4, 90, 0.5 * gag, 0.12);
    }

    /* ——— 8. Kâğıt: Allahü teâlâdan söz edilen bölüm ——— */
    function kagit(t, a) { T.bas(a, { x: 800, y: 450, z: 1 }); plaka('kagit', { d: 0 }); }

    /* ——— 9. Gece odası, kandil kısık: kimse görmese de iyilik, sessiz dua, zor ödev (durak 6) ——— */
    var DEFTER = P(780, 700);
    function gece(t, a) {
      T.bas(a, kameraYolu(t, [[KES.gece, { x: 820, y: 520, z: 1.12 }], [D.zor - 0.4, { x: 800, y: 450, z: 1 }]]));
      plaka('oda-gece', { d: 1, parilti: 0.35 });
      alev(FITIL1[0], FITIL1[1], 18, a, 1);
      isima(FITIL1[0] + 40, FITIL1[1], 380, [1, 0.7, 0.35], 0.2);
      var dO = pencere(t, W.zor1 - 0.3, KES.sirCoz, 0.5, 0.3); if (dO > 0.01) dunyaHalka(0, DEFTER[0], DEFTER[1] - 10, 150, dO);
      karanlik(FITIL1[0] + 60, FITIL1[1], 1300, 0.35);
    }

    /* ——— 10. Sırrın çözümü: en dip oda yine simsiyah ——— */
    function sirCoz(t, a) {
      T.bas(a, { x: 800, y: 470, z: kr(1.0, 1.08, tw(t, KES.sirCoz, 4, Y.sin)) });
      plaka('yeralti-oda', { d: 1 });
      karanlik(800, 470, 1, kr(0.9, 0.99, tw(t, W.kandilVar - 0.3, 1.2)));
    }

    /* ——— 11. Kapanış: sabah vadisi, güvercinler uçar, kamera yükselir ——— */
    function kapanis(t, a) {
      var ak = tw(t, KES.son, 6, Y.sin);
      T.bas(a, { x: kr(700, 820, ak), y: kr(640, 430, ak), z: kr(1.45, 1.05, ak) });
      plaka('vadi-sabah', { d: 1, parilti: 0.6, ruzgar: 0.1 });
      isima(1580, 280, 320, [1, 0.8, 0.5], 0.16);
      // güvercin evlerinin önünde sabah ışığında toz zerreleri süzülür
      for (var i = 0; i < 30; i++) { var p = P(80 + hash(i, 51) * 520, 300 + hash(i, 52) * 420), e = T.ekran(p[0] + Math.sin(a * 0.6 + i) * 12, p[1] - ((a * 8 + i * 30) % 60), 1); T.iz(e.x, e.y, 2.2, 2.2, 0, 1, 0.95, 0.8, 0.5 * Math.max(0, Math.sin(a + i))); }
      T.izBitir();
    }

    /* ——— perde: kesmelerde kısa bir an lacivert (kâğıt bölümünde krem) karartma ——— */
    var LACI = [0.07, 0.11, 0.3], KREM = [1, 1, 1];
    var PERDE = [[KES.sir], [KES.dip], [KES.oda], [KES.kesit2], [KES.kandil], [KES.karinca], [KES.bag], [KES.peri], [KES.sabah], [KES.kagit, KREM],
      [KES.gece, KREM], [KES.sirCoz], [KES.kagit2, KREM], [KES.son, KREM]];
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
      [KES.sir, kanca], [KES.dip, sir], [KES.oda, dip], [KES.kesit2, oda], [KES.kandil, kesit2], [D.kandil + 0.05, kandilSahne],
      [KES.karinca, sesler], [KES.bag, karincaSahne], [KES.peri, bag], [KES.sabah, peri], [KES.kagit, sabah], [KES.gece, kagit],
      [KES.sirCoz, gece], [KES.kagit2, sirCoz], [KES.son, kagit], [Infinity, kapanis]
    ];
    function ciz(t, a) {
      aNow = a; kullanildi = [];
      karanlik(0, 0, 1, 0);
      for (var i = 0; i < BOLUM.length; i++) { if (t < BOLUM[i][0]) { BOLUM[i][1](t, a); break; } }
      SVG_HEPSI.forEach(function (p) { if (kullanildi.indexOf(p) < 0) gizle(p); });
      perde(t);
      yazilar(t);
      sayiYaz(t);
    }

    return {
      hazir: hazir,
      ciz: ciz,
      // Allahü teâlâdan söz edilen kâğıt bölümlerinde yazı sahnenin kendisidir; altyazı ve dokunma oyunu yoktur
      altyazisiz: function (t) { return kagitYazisi || (t >= KES.kagit && t < KES.gece) || (t >= KES.kagit2 && t < KES.son); },
      durak: function (id, olay, veri) {
        if (id === 'kandil' && olay === 'deger') { kv = veri; kvA = aNow; }
        if (id === 'kandil' && olay === 'ac') { kv = 50; }
      },
      // Kandilin alevi: çocuk alevin ucunu tutup yukarı aşağı çeker (yukarı: fitil uzar, alev büyür)
      tutamac: function (id, deger) { return { x: FITIL[0], y: FITIL[1] - alevBoy(Math.max(deger, 8)) * 0.75, r: 80, ust: false }; },
      // değer parmağın ne kadar kaydığıyla değişir; tutulduğu yerden başlar, sıçramaz
      tutDeger: function (id, x, y, bas) {
        if (bas !== dn.bas) { dn.bas = bas; dn.v = bas ? bas.deger : kv; dn.y = bas ? bas.y : y; }
        return sinirla(dn.v + (dn.y - y) / NF.yol, 0, 100);
      }
    };
  };
})();
