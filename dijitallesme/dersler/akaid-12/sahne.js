/* Akaid 12 · İlâhî Kitaplar — sahne: "Yaşayan Minyatür", Amasya; Yeşilırmak kıyısında bir gün sabahtan akşama.
   Ders tek sahnede dönmez: sabah ırmağında kamera kıyıdaki ahşap evlerden birine yaklaşır; evin üst odasında kitaplığın
   en üst rafında işlemeli bir kese durur, sır onun yeridir (durak 1); Allahü teâlâdan söz edilen bölümde boya çekilir,
   kâğıt ve yazı kalır; kütüphane salonunda uzun masaya dört peygambere inen sayfalar (suhuf) dizilir, dört kemer dört
   büyük kitabı taşır, çocuk kemerlere dokunur (durak 2), Zebûr sorulur (durak 3); eski bir mektep sınıfında geçen yılın
   ve bu yılın ders programı (durak 4); salona dönülür, önceki kitapların emirleri dördüncü kemerde toplanır; gece masasında
   boş kâğıtlar boş kalır, okuma bitince ne yapılır (durak 5); oda: kese en üst rafta; akşam ırmağında büyük soru
   (durak 6); akşam odasında sırrın çözümü, kâğıtta cevap; ders akşam ırmağında biter. Her olay anlatıcının kelimesine
   bağlıdır (t); a ortam saatidir.
   Yön: bakış kuzeye, ırmak soldan sağa akar; sabah ışığı soldan, akşam ışığı sağdan. Fizik: kâğıtlar masaya düşer,
   yığınlar masanın üstünde durur. İnsan figürü, yüz, el yoktur. İlâhî kitap, Mushaf ve âyet oyun nesnesi olmaz: kese
   yalnız rafta durur, açılmaz, dokunulmaz; kitap görseli çizilmez, kemerlerin kapakları kapalı kalır. Allahü teâlâ için
   hiçbir şekil, ışık ya da sembol kullanılmaz. Peygamberlerin adı anılırken dokunma oyunu yoktur. */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-12'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['irmak-sabah', 'irmak-aksam', 'oda', 'salon', 'sinif', 'masa', 'kagit', 'kese', 'sayfa'];
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
    var D = {}; ['ezber', 'kemer', 'zebur', 'program', 'raf', 'sir'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {}; for (var n0 = 0; n0 <= 63; n0++) AN[n0] = C(n0);
    var W = {
      kese: kel('kese'), adem: kel('Âdem'), sit: kel('Şît'), idris: kel('İdrîs'), ibrahim: kel('İbrâhîm'),
      on1: kel('on', 3), elli: kel('elli', 2), otuz: kel('otuz', 2), on2: kel('on', 4), yuz: kel('yüz', 2)
    };
    var KES = {
      oda: AN[4] - 0.1, kagit: AN[15] - 0.1, salon: AN[20] - 0.1, sinif: AN[35] - 0.1, salon2: AN[39] - 0.1,
      masa: AN[45] - 0.1, oda2: AN[52] - 0.1, aksam: AN[54] - 0.1, oda3: AN[57] - 0.1, kagit2: AN[60] - 0.2,
      oda4: AN[61] - 0.1, son: AN[62] - 0.1
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
      ['Amasya', 'etiket', 800, 96, AN[1], AN[3] - 0.1],
      ['baştan sona ezbere bilen: hâfız', 'etiket', 800, 96, AN[13], KES.kagit - 0.2],
      ['İlâhî kitaplar, Allahü teâlânın peygamberlerine indirdiği kitaplardır.', 'kagit', 800, 270, AN[15], AN[19] - 0.4],
      ['Allahü teâlâ, emirlerini ve yasaklarını duymayan kimse kalmasın diye peygamberlerle birlikte kitaplar da gönderdi.', 'kagit', 800, 460, AN[16], AN[19] - 0.4],
      ['Hepsi Allahü teâlânın kelâmıdır. Hepsi doğrudur.', 'kagit', 800, 650, AN[17], AN[19] - 0.4],
      ['Kitaplara inanmak, îmânın altı şartından biridir.', 'kagit iri', 800, 450, AN[19], KES.salon - 0.4],
      ['bize bildirilen kitaplar: 104', 'etiket', 800, 96, AN[20], AN[22] - 0.1],
      ['suhuf: sayfalar', 'etiket', 800, 96, AN[22], AN[24] - 0.1],
      ['10 + 50 + 30 + 10 = 100', 'etiket', 800, 96, AN[24], AN[26] - 0.1],
      ['4 büyük kitap', 'etiket', 800, 96, AN[26], D.kemer - 0.7],
      ['önceki kitaplardaki emirleri de içinde toplar', 'etiket', 800, 96, AN[40], AN[41] - 0.1],
      ['bütün insanlar için', 'etiket', 800, 96, AN[41], AN[43] - 0.1],
      ['son kitap · kıyamete kadar', 'etiket', 800, 96, AN[43], KES.masa - 0.2],
      ['en büyük mucize', 'etiket', 800, 96, AN[45] + 0.3, AN[47]],
      ['bütün insanlar bir araya gelse de', 'etiket', 800, 96, AN[49], D.raf - 0.7],
      ['abdestli okunur · sağ elle tutulur', 'etiket', 800, 96, AN[52] + 0.2, AN[53] - 0.1],
      ['bitince kapatılır, yüksek bir yere konur', 'etiket', 800, 96, AN[53], KES.aksam - 0.2],
      ['kitapların en üstü, en kıymetlisi', 'etiket', 800, 96, AN[59], KES.kagit2 - 0.2],
      ['Kur\'ân-ı kerîm, Allahü teâlânın kıyamete kadar bütün insanlara gönderdiği son kitaptır.', 'kagit', 800, 450, AN[60], KES.oda4 - 0.4],
      ['rafın en üstü', 'etiket', 800, 96, AN[61], KES.son - 0.2],
      ['Gelecek ders: Görülen ve görülemeyen varlıklar', 'etiket', 800, 110, AN[62] + 0.2, AN[63] + 0.9]
    ].map(function (s) { return { e: yazi(s[0], s[1], s[2], s[3]), kagit: /^kagit/.test(s[1]), bas: s[4], son: s[5] }; });

    // Oda: kitaplığın en üst rafındaki kese (yalnız rafta durur; açılmaz, dokunulmaz)
    var KESE = P(1392, 255), PENCERE = P(395, 390);
    var SOR = [KESE[0] - 150, KESE[1] + 10];   // soru işareti kesenin solunda: kamera yaklaşınca üst şeride girmez
    var sorKese = yazi('?', 'sor', SOR[0], SOR[1]);

    // Salon: dört kemer (kapakları kapalı), adlar kemerin altında, kitabın adı kemerin üstünde
    var AX = [253, 618, 982, 1347], KAPI_Y = 439, AD_Y = 657, KITAP_Y = 224;
    var KITAP = ['Tevrât', 'Zebûr', 'İncîl', 'Kur\'ân-ı kerîm'];
    var PEYG = ['Mûsâ aleyhisselâm', 'Dâvüd aleyhisselâm', 'Îsâ aleyhisselâm', 'Muhammed aleyhisselâm'];
    var KEMER = KITAP.map(function (k, i) { return { kitap: yazi(k, 'etiket', AX[i], KITAP_Y), ad: yazi(PEYG[i], 'etiket', AX[i], AD_Y) }; });
    var dokunulan = {};

    // Salon masası: dört peygambere inen sayfalar (suhuf); yığın, sayının beşte biri kadar yaprakla gösterilir
    var SX = [429, 682, 936, 1190], TABAN = 744;
    var SUHUF = [
      { ad: 'Âdem aleyhisselâm', sayi: '10 sayfa', yaprak: 2, w: 'adem', vur: 'on1' },
      { ad: 'Şît aleyhisselâm', sayi: '50 sayfa', yaprak: 10, w: 'sit', vur: 'elli' },
      { ad: 'İdrîs aleyhisselâm', sayi: '30 sayfa', yaprak: 6, w: 'idris', vur: 'otuz' },
      { ad: 'İbrâhîm aleyhisselâm', sayi: '10 sayfa', yaprak: 2, w: 'ibrahim', vur: 'on2' }
    ];
    // adlar zikzak durur: yan yana uzun adlar birbirine değmez
    function suhufY(i) { return TABAN - 205 - (i % 2) * 64; }
    SUHUF.forEach(function (s, i) { s.adE = yazi(s.ad, 'etiket', SX[i], suhufY(i)); s.sayiE = yazi(s.sayi, 'damga', SX[i], suhufY(i) + 40); });

    // Sınıf: panoda geçen yılın ve bu yılın ders programı
    var PANO = [{ x: 629, y: 386 }, { x: 1060, y: 386 }], PANO_G = 390, PANO_H = 325;
    var YIL = [yazi('geçen yıl', 'etiket', PANO[0].x, 204), yazi('bu yıl', 'etiket', PANO[1].x, 204)];

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
      var odaAcik = t >= KES.oda && t < KES.kagit;
      bagla(sorKese, SOR[0], SOR[1]);
      gos(sorKese, odaAcik && acik !== 'ezber' ? pencere(t, AN[6], D.ezber - 0.7, 0.3, 0.4) : 0);
      // suhuf yığınlarının adları: adı anılınca açılır, "dört büyük kitap" anında kalkar
      var salonAcik = t >= KES.salon && t < KES.sinif, salon2Acik = t >= KES.salon2 && t < KES.masa;
      SUHUF.forEach(function (s, i) {
        var o = salonAcik ? pencere(t, W[s.w] - 0.1, AN[26] + 0.8, 0.4, 0.4) : 0;
        bagla(s.adE, SX[i], suhufY(i)); bagla(s.sayiE, SX[i], suhufY(i) + 40);
        gos(s.adE, o, kr(-8, 0, tw(t, W[s.w] - 0.1, 0.4))); gos(s.sayiE, o, 0, 1 + 0.18 * pencere(t, W[s.vur] - 0.05, W[s.vur] + 0.5, 0.15, 0.3));
      });
      // kemer adları: "adı yazılı" anından salonun sonuna; kemer durağında yerini motorun noktaları alır
      KEMER.forEach(function (k, i) {
        bagla(k.ad, AX[i], AD_Y); bagla(k.kitap, AX[i], KITAP_Y);
        var oa = (salonAcik && acik !== 'kemer') ? pencere(t, AN[28], KES.sinif - 0.2, 0.5, 0.3) : salon2Acik ? pencere(t, KES.salon2 + 0.3, KES.masa - 0.2, 0.5, 0.3) : 0;
        gos(k.ad, oa);
        // kitabın adı: durakta dokunulunca, sonra anlatıcı sırayla söyleyince; Zebûr sorusunda saklanır
        var ok = 0;
        if (salonAcik) {
          if (acik === 'kemer') ok = dokunulan['k' + (i + 1)] ? 1 : 0;
          else if (acik === 'zebur') ok = 0;
          // soru sorulurken kitap adları kalkar: cevap ekranda durmaz; durak bitince geri gelir
          else if (t >= D.kemer) ok = t < D.zebur ? pencere(t, AN[30 + i] - 0.1, AN[34] + 0.4, 0.4, 0.4) : pencere(t, D.zebur, KES.sinif - 0.2, 0.4, 0.3);
        } else if (salon2Acik) ok = pencere(t, KES.salon2 + 0.3, KES.masa - 0.2, 0.5, 0.3);
        gos(k.kitap, ok, 0, i === 3 && salon2Acik ? 1 + 0.1 * pencere(t, AN[43], AN[44] + 1, 0.3, 0.5) : 0);
      });
      var sinifAcik = t >= KES.sinif && t < KES.salon2;
      bagla(YIL[0], PANO[0].x, 204); bagla(YIL[1], PANO[1].x, 204);
      gos(YIL[0], sinifAcik ? pencere(t, AN[37], KES.salon2 - 0.2, 0.4, 0.3) : 0);
      gos(YIL[1], sinifAcik ? pencere(t, AN[38] - 0.2, KES.salon2 - 0.2, 0.4, 0.3) : 0);
    }

    /* ——— SVG ——— */
    var defs = E2('defs', {}, svg);
    var dg = E2('linearGradient', { id: 'kd12-altin', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    [['0', '#f3d584'], ['1', '#c9972f']].forEach(function (d) { E2('stop', { offset: d[0], 'stop-color': d[1] }, dg); });
    function yol(oz) { var p = E2('path', Object.assign({ d: 'M0 0', fill: 'none' }, oz || {}), svg); p.style.opacity = 0; p._o = 0; return p; }
    function gizle(p) { if (p._o !== 0) { p.style.opacity = 0; p._o = 0; } }
    function goster(p, d, o) { if (o <= 0.003) { gizle(p); return; } p.setAttribute('d', d); p.style.opacity = o; p._o = o; }
    function f1(x) { return x.toFixed(1); }
    function daire(cx, cy, r) { return 'M' + f1(cx - r) + ' ' + f1(cy) + ' a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0 a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
    var halkalar = [0, 1].map(function () { return yol({ stroke: '#ffe29a', 'stroke-width': 5 }); });
    var MERCAN = '#c8452f';
    var yaylar = [0, 1, 2].map(function () { return yol({ stroke: '#c8452f', 'stroke-width': 7, 'stroke-dasharray': '12 10', 'stroke-linecap': 'round' }); });
    // ders programı: her yıl için bir ızgara ve dört renkli ders kutusu (yazısız)
    var RENK = ['#2f5fb3', '#3fb3a8', '#e0674a', '#7fa36b'];
    var programlar = [0, 1].map(function () {
      return { izgara: yol({ stroke: '#8a6a3c', 'stroke-width': 2 }), kutu: RENK.map(function (r) { return yol({ fill: r, stroke: 'none' }); }) };
    });
    var SVG_HEPSI = [].concat(halkalar, yaylar, programlar[0].kutu, programlar[1].kutu, [programlar[0].izgara, programlar[1].izgara]);
    var kullanildi = [];
    function kullan(p) { kullanildi.push(p); }

    /* ——— ortak yardımcılar ——— */
    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    function ekranR(x, y, r) { var e = T.ekran(x, y, 1), e2 = T.ekran(x + r, y, 1); return { x: e.x, y: e.y, r: e2.x - e.x }; }
    function isima(x, y, r, renk, o) { var s = ekranR(x, y, r); T.iz(s.x, s.y, s.r, s.r, 0, renk[0], renk[1], renk[2], o); T.izBitir(); }
    // halka rengi zemine göre: koyu zeminde altın, altın taş duvarda mercan
    function dunyaHalka(i, x, y, r, o, renk) { var e = ekranR(x, y, r); halkalar[i].setAttribute('stroke', renk || '#ffe29a'); goster(halkalar[i], daire(e.x, e.y, e.r), o); kullan(halkalar[i]); }

    /* ——— 0. Kanca: sabah ırmağı; kamera kıyıdaki evlerden birine yaklaşır ——— */
    var EV = P(1520, 470);
    function kanca(t, a) {
      T.bas(a, kameraYolu(t, [[0, { x: 640, y: 470, z: 1.06 }], [AN[1], { x: 700, y: 470, z: 1.08 }], [AN[2], { x: 960, y: 455, z: 1.12 }],
        [AN[3], { x: 1300, y: 465, z: 1.45 }], [KES.oda, { x: EV[0], y: EV[1], z: 2.1 }]]));
      plaka('irmak-sabah', { d: 1, parilti: 0.35, su: 0.9, ruzgar: 0.05 });
      isima(80, 160, 420, [1, 0.92, 0.66], 0.12);
      // evin pencereleri sabah ışığıyla hafifçe parlar
      isima(EV[0], EV[1], 120, [1, 0.9, 0.6], 0.14 * pencere(t, AN[3], KES.oda, 0.6, 0.2));
    }

    /* ——— 1. Oda: kitaplığın en üst rafında kese (durak 1); sonra yüksek yer, akşam sırrın çözümü ——— */
    var AKSAM = [0.86, 0.76, 0.68];
    function keseCiz(o) { T.ciz('kese', { x: KESE[0], y: KESE[1] + 2, h: 112, d: 1, o: o }); }
    function oda(t, a) {
      var acik = api.acikDurak() === 'ezber';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.oda, { x: 1200, y: 420, z: 1.5 }], [W.kese, { x: KESE[0], y: KESE[1] + 30, z: 2.0 }],
        [AN[6], { x: 1150, y: 380, z: 1.45 }], [AN[9], { x: 900, y: 440, z: 1.12 }], [D.ezber - 0.5, DUZ], [D.ezber + 1, DUZ], [KES.kagit, { x: 1100, y: 400, z: 1.3 }]]));
      plaka('oda', { d: 1, parilti: 0.4 });
      isima(PENCERE[0], PENCERE[1], 300, [1, 0.92, 0.64], 0.12);
      // kese: "kese" anında ve "en üstte" sorusunda altın halka
      var ho = acik ? 0 : pencere(t, W.kese - 0.1, AN[8], 0.3, 0.5);
      if (ho > 0.01) { keseCiz(ho); dunyaHalka(0, KESE[0], KESE[1], 78 + 3 * Math.sin(a * 3), ho); }
    }
    function oda2(t, a) {
      T.bas(a, kameraYolu(t, [[KES.oda2, { x: 950, y: 460, z: 1.15 }], [AN[53], { x: 1250, y: 360, z: 1.5 }], [KES.aksam, { x: KESE[0], y: KESE[1] + 40, z: 2.0 }]]));
      plaka('oda', { d: 1, parilti: 0.4 });
      isima(PENCERE[0], PENCERE[1], 300, [1, 0.92, 0.64], 0.12);
      var ho = pencere(t, AN[53] + 0.4, KES.aksam, 0.4, 0.2);
      if (ho > 0.01) { keseCiz(ho); dunyaHalka(0, KESE[0], KESE[1], 78 + 3 * Math.sin(a * 3), ho); }
    }
    function oda3(t, a) {
      T.bas(a, kameraYolu(t, [[KES.oda3, { x: 1000, y: 430, z: 1.25 }], [AN[58], { x: KESE[0], y: KESE[1] + 20, z: 2.2 }], [KES.kagit2, { x: KESE[0], y: KESE[1] + 30, z: 2.0 }]]));
      plaka('oda', { d: 1, parilti: 0.45, carp: AKSAM });
      var lm = P(560, 150); isima(lm[0], lm[1], 220, [1, 0.78, 0.45], 0.12);   // akşam ışığı pencereden
      var ho = pencere(t, AN[58] - 0.1, KES.kagit2 - 0.1, 0.5, 0.2);
      if (ho > 0.01) { keseCiz(ho); dunyaHalka(0, KESE[0], KESE[1], 82 + 3 * Math.sin(a * 3), ho); dunyaHalka(1, KESE[0], KESE[1], 96 + 3 * Math.sin(a * 3 + 1), ho * 0.6); }
    }
    function oda4(t, a) {
      var k = tw(t, KES.oda4, KES.son - KES.oda4, Y.sin);
      T.bas(a, { x: kr(KESE[0], 1050, k), y: kr(KESE[1] + 30, 420, k), z: kr(2.0, 1.25, k) });
      plaka('oda', { d: 1, parilti: 0.45, carp: AKSAM });
      keseCiz(1 - k * 0.7);
      dunyaHalka(0, KESE[0], KESE[1], 82 + 3 * Math.sin(a * 3), 1 - k);
    }

    /* ——— 2. Kâğıt: Allahü teâlâdan söz edilen bölüm ——— */
    function kagit(t, a) { T.bas(a, DUZ); plaka('kagit', { d: 0 }); }

    /* ——— 3. Salon: masada suhuf (sayfalar), dört kemer (durak 2, durak 3); ikinci kez: dördüncü kemer ——— */
    function yigin(t, a, i) {
      var s = SUHUF[i], bas = W[s.w] - 0.05;
      if (t < bas) return;
      var vur = 1 + 0.12 * pencere(t, W[s.vur] - 0.05, W[s.vur] + 0.5, 0.15, 0.3);
      for (var j = 0; j < s.yaprak; j++) {
        var o = tw(t, bas + j * 0.07, 0.35);
        if (o <= 0.01) continue;
        var u = s.yaprak > 1 ? j / (s.yaprak - 1) - 0.5 : 0;
        // yapraklar masaya düşer: yukarıdan iner, tabanda yelpaze gibi açılır
        T.ciz('sayfa', { x: SX[i] + u * 26, y: TABAN - 26 * (1 - Y.cik(o)), h: 118 * vur, ax: 0.5, ay: 1, d: 1, r: u * 26, o: o });
      }
    }
    function salon(t, a) {
      var acik = api.acikDurak();
      var durakta = acik === 'kemer' || acik === 'zebur';
      T.bas(a, durakta ? DUZ : kameraYolu(t, [[KES.salon, { x: 800, y: 610, z: 1.3 }], [W.adem, { x: 700, y: 600, z: 1.28 }], [W.ibrahim, { x: 880, y: 600, z: 1.28 }],
        [AN[26], { x: 800, y: 560, z: 1.18 }], [AN[27], { x: 800, y: 470, z: 1.06 }], [D.kemer - 0.5, DUZ], [D.kemer + 1, DUZ],
        [AN[30], { x: AX[0] + 150, y: 440, z: 1.3 }], [AN[31], { x: AX[1], y: 440, z: 1.3 }], [AN[32], { x: AX[2], y: 440, z: 1.3 }], [AN[33], { x: AX[3] - 150, y: 440, z: 1.3 }],
        [AN[34], { x: 800, y: 450, z: 1.05 }], [D.zebur - 0.5, DUZ]]));
      plaka('salon', { d: 1, parilti: 0.45 });
      isima(560, 60, 260, [1, 0.94, 0.7], 0.1);
      for (var i = 0; i < 4; i++) yigin(t, a, i);
      // dört büyük kitap: kemerler sırayla hafifçe aydınlanır (kapaklar kapalı kalır)
      for (var k = 0; k < 4; k++) {
        var o = durakta ? 0 : Math.max(pencere(t, AN[26] + k * 0.3, AN[27] + 0.5, 0.4, 0.5), t >= D.kemer && t < D.zebur ? pencere(t, AN[30 + k] - 0.1, AN[30 + k] + 1.6, 0.3, 0.5) : 0);
        if (o > 0.01) isima(AX[k], KAPI_Y, 190, [1, 0.88, 0.58], 0.16 * o);
      }
    }
    function salon2(t, a) {
      T.bas(a, kameraYolu(t, [[KES.salon2, { x: 800, y: 440, z: 1.05 }], [AN[40], { x: 820, y: 400, z: 1.08 }], [AN[42], { x: 1000, y: 430, z: 1.15 }],
        [AN[43], { x: AX[3] - 120, y: 410, z: 1.3 }], [KES.masa, { x: AX[3] - 100, y: 410, z: 1.36 }]]));
      plaka('salon', { d: 1, parilti: 0.45 });
      isima(560, 60, 260, [1, 0.94, 0.7], 0.1);
      for (var i = 0; i < 4; i++) yigin(t, a, i);
      // önceki kitapların emirleri dördüncü kemerde toplanır: üç kemerden altın yay
      for (var k = 0; k < 3; k++) {
        var bas = AN[40] + k * 0.35, ilerle = tw(t, bas, 0.9), o = pencere(t, bas, AN[43], 0.3, 0.5);
        if (o <= 0.01 || ilerle <= 0) continue;
        var p = T.ekran(AX[k], KAPI_Y - 130, 1), q = T.ekran(AX[3], KAPI_Y - 130, 1);
        var mx = (p.x + q.x) / 2, my = Math.min(p.y, q.y) - 50 - 22 * (2 - k);
        var ex = kr(p.x, q.x, ilerle), ey = kr(p.y, q.y, ilerle) - Math.sin(Math.PI * ilerle) * 0;
        var cx = kr(p.x, mx, ilerle), cy = kr(p.y, my, ilerle);
        goster(yaylar[k], 'M' + f1(p.x) + ' ' + f1(p.y) + ' Q' + f1(cx) + ' ' + f1(cy) + ' ' + f1(ex) + ' ' + f1(ey), 0.85 * o); kullan(yaylar[k]);
      }
      // son kitap: dördüncü kemerde halka
      var ho = pencere(t, AN[43] - 0.1, KES.masa - 0.1, 0.4, 0.2);
      if (ho > 0.01) { dunyaHalka(0, AX[3], KAPI_Y, 215 + 4 * Math.sin(a * 2.5), ho, MERCAN); isima(AX[3], KAPI_Y, 200, [1, 0.88, 0.58], 0.15 * ho); }
    }

    /* ——— 4. Sınıf: geçen yılın ve bu yılın ders programı (durak 4) ——— */
    var DUZEN = [[0, 2, 1, 3, 0, 2, 3, 1, 2, 0, 1, 3, 0, 2, 1, 3, 1, 0, 3, 2], [1, 3, 0, 2, 2, 0, 1, 3, 3, 1, 2, 0, 0, 3, 2, 1, 2, 1, 0, 3]];
    function program(j, cx, cy, o, rot) {
      var g = PANO_G, h = PANO_H, kenar = 26, sut = 5, sat = 4;
      T.ciz('kagit', { x: cx, y: cy, g: g, h: h, d: 1, r: rot, o: o, carp: j === 0 ? [0.93, 0.87, 0.76] : null });
      // ızgara ve kutular dünyaya bağlı; döndürme küçük olduğu için çizgiler eksene paralel kalır
      var a = T.ekran(cx - g / 2 + kenar, cy - h / 2 + kenar + 14, 1), b = T.ekran(cx + g / 2 - kenar, cy + h / 2 - kenar, 1);
      var w = (b.x - a.x) / sut, hh = (b.y - a.y) / sat, d = '';
      for (var c = 0; c <= sut; c++) d += 'M' + f1(a.x + c * w) + ' ' + f1(a.y) + 'V' + f1(b.y);
      for (var r = 0; r <= sat; r++) d += 'M' + f1(a.x) + ' ' + f1(a.y + r * hh) + 'H' + f1(b.x);
      goster(programlar[j].izgara, d, o * 0.8); kullan(programlar[j].izgara);
      var yollar = ['', '', '', ''];
      for (var n = 0; n < sut * sat; n++) {
        var x = a.x + (n % sut) * w, y = a.y + Math.floor(n / sut) * hh, renk = DUZEN[j][n];
        yollar[renk] += 'M' + f1(x + 4) + ' ' + f1(y + 4) + 'h' + f1(w - 8) + 'v' + f1(hh - 8) + 'h' + f1(8 - w) + 'Z';
      }
      programlar[j].kutu.forEach(function (p, i) { goster(p, yollar[i], o * (j === 0 ? 0.55 : 0.9)); kullan(p); });
    }
    function sinif(t, a) {
      var acik = api.acikDurak() === 'program';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.sinif, { x: 800, y: 430, z: 1.22 }], [AN[36], { x: 860, y: 400, z: 1.15 }], [AN[37], { x: 760, y: 400, z: 1.18 }],
        [AN[38], { x: 960, y: 400, z: 1.18 }], [D.program - 0.5, DUZ]]));
      plaka('sinif', { d: 1, parilti: 0.35 });
      isima(120, 300, 320, [1, 0.92, 0.66], 0.12);
      program(0, PANO[0].x, PANO[0].y, 1, -0.6);
      // bu yılın programı panoya iner ve iğnelenir
      var k = tw(t, AN[36] + 0.3, 0.9, Y.cik);
      if (k > 0.01) program(1, PANO[1].x, PANO[1].y - 60 * (1 - k), k, 1.2 * (1 - k) + 0.4);
      if (!acik) {
        var g0 = pencere(t, AN[37], AN[38] - 0.1, 0.3, 0.3), g1 = pencere(t, AN[38] - 0.1, D.program - 0.4, 0.3, 0.3);
        if (g0 > 0.01) dunyaHalka(0, PANO[0].x, PANO[0].y, 225 + 3 * Math.sin(a * 3), g0, MERCAN);
        if (g1 > 0.01) dunyaHalka(1, PANO[1].x, PANO[1].y, 225 + 3 * Math.sin(a * 3), g1, MERCAN);
      }
    }

    /* ——— 5. Gece masası: en büyük mucize; boş kâğıtlar boş kalır; okuma bitince ne yapılır (durak 5) ——— */
    var ALEV = P(440, 470), MASA_K = [P(560, 640), P(1240, 600), P(720, 705), P(1080, 700)];
    function masa(t, a) {
      var acik = api.acikDurak() === 'raf';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.masa, { x: 800, y: 470, z: 1.15 }], [AN[46], { x: 820, y: 540, z: 1.25 }], [AN[49], { x: 800, y: 500, z: 1.12 }],
        [D.raf - 0.5, DUZ], [D.raf + 1, DUZ], [KES.oda2, { x: 800, y: 470, z: 1.1 }]]));
      plaka('masa', { d: 1, parilti: 0.45 });
      // kandilin alevi titrer
      isima(ALEV[0], ALEV[1], 110 + 6 * Math.sin(a * 7), [1, 0.82, 0.45], 0.24 + 0.04 * Math.sin(a * 5.3));
      isima(ALEV[0], ALEV[1] + 120, 330, [1, 0.8, 0.5], 0.08);
      // ustaların denemeleri: boş kâğıtlar birer birer masaya düşer, hepsi boş kalır, sonra kalkar
      MASA_K.forEach(function (p, i) {
        var bas = AN[46] + 0.3 + i * 0.7, o = pencere(t, bas, AN[49] + 1.2 + i * 0.2, 0.5, 0.6);
        if (o <= 0.01) return;
        var d = Y.cik(ic(t, bas, 0.6));
        T.ciz('sayfa', { x: p[0], y: p[1] - 40 * (1 - d), h: 150, d: 1, r: [-9, 7, -4, 11][i] + 4 * (1 - d), o: o });
      });
    }

    /* ——— 6. Akşam ırmağı: büyük soru (durak 6), kapanış ——— */
    function aksamIrmak(t, a, kam) {
      T.bas(a, kam);
      plaka('irmak-aksam', { d: 1, parilti: 0.5, su: 0.9, ruzgar: 0.05 });
      isima(1600, 200, 380, [1, 0.7, 0.4], 0.1);
    }
    function aksam(t, a) {
      var acik = api.acikDurak() === 'sir';
      aksamIrmak(t, a, acik ? DUZ : kameraYolu(t, [[KES.aksam, { x: 760, y: 430, z: 1.12 }], [D.sir - 0.5, DUZ]]));
    }
    function kapanis(t, a) { var k = tw(t, KES.son, 6, Y.sin); aksamIrmak(t, a, { x: kr(1150, 800, k), y: kr(430, 450, k), z: kr(1.5, 1.02, k) }); }

    /* ——— perde: kesmelerde kısa bir an lacivert (kâğıt bölümünde krem) karartma ——— */
    var LACI = [0.07, 0.11, 0.3], KREM = [1, 1, 1];
    var PERDE = [[KES.oda], [KES.kagit, KREM], [KES.salon, KREM], [KES.sinif], [KES.salon2], [KES.masa], [KES.oda2], [KES.aksam], [KES.oda3], [KES.kagit2, KREM], [KES.oda4, KREM], [KES.son]];
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
      [KES.oda, kanca], [KES.kagit, oda], [KES.salon, kagit], [KES.sinif, salon], [KES.salon2, sinif], [KES.masa, salon2],
      [KES.oda2, masa], [KES.aksam, oda2], [KES.oda3, aksam], [KES.kagit2, oda3], [KES.oda4, kagit], [KES.son, oda4], [Infinity, kapanis]
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
      altyazisiz: function (t) { return kagitYazisi || (t >= KES.kagit && t < KES.salon) || (t >= KES.kagit2 && t < KES.oda4); },
      // Peygamberlerin adları anılırken oyun yoktur
      dokun: function () {
        var t = api.t();
        if ((t >= AN[23] - 0.2 && t < AN[24]) || (t >= AN[30] - 0.2 && t < D.zebur) || (t >= AN[45] - 0.2 && t < AN[46])) return true;
        return false;
      },
      durak: function (id, olay, veri) {
        if (id === 'kemer' && olay === 'dene') dokunulan[veri] = true;
        if (id === 'kemer' && olay === 'ac') dokunulan = {};
      }
    };
  };
})();
