/* Akaid 11 · Peygamberlerin İlettiği Mesaj: Vahiy — sahne: "Yaşayan Minyatür", Sinop; bir gün sabahtan akşama.
   Ders tek sahnede dönmez: sabah limanında bir kayık denize açılır, kamera fenerin altındaki hana kayar; han odasında
   masada kırmızı mühürlü bir mektup durur (durak 1); burundaki fenerden bir haber çıkar, dört kayıkta kulaktan kulağa
   değişir, çocuk kayıklara dokunur (durak 2); Allahü teâlâdan söz edilen bölümde boya çekilir, kâğıt ve yazı kalır;
   tezhipli bir sayfada yirmi üç altın nokta (yıllar) dizilir, dört rozet vahyin yolunu taşır (durak 3); her yıl birlikte
   okuma noktalara halka olur (durak 4); Sinop çarşısında sepete ekmek, süt, peynir, zeytin girer (durak 5); akşam
   limanında büyük soru (durak 6); akşam han odasında mührün sağlamlığı, kâğıtta cevap; ders akşam limanında, fener
   yanarken biter. Her olay anlatıcının kelimesine bağlıdır (t); a ortam saatidir.
   Yön: bakış güneye, doğu solda; sabah ışığı soldan, akşam ışığı sağdan. Fizik: kayıklar su çizgisinden sallanır,
   rüzgâr yönü aynıdır; sepete giren eşya yay çizerek düşer. İnsan figürü, yüz, el yoktur; melek ve vahiy anı
   tasvir edilmez, soyut ışık figürü kullanılmaz. Allahü teâlâ için hiçbir şekil, ışık ya da sembol kullanılmaz.
   Peygamber efendimizin adı anılırken dokunma oyunu yoktur. */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-11'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['liman-sabah', 'liman-aksam', 'han-oda', 'burun-fener', 'carsi', 'sayfa', 'kagit',
      'mektup', 'kayik', 'rozet', 'sepet', 'ekmek', 'sut', 'peynir', 'zeytin'];
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
    var D = {}; ['mesaj', 'kulak', 'yol', 'nasil', 'liste', 'sir'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {}; for (var n0 = 0; n0 <= 56; n0++) AN[n0] = C(n0);
    var W = { kayik: kel('Kayıklar'), muhur: kel('mühür'), yirmi: kel('yirmi'),
      ekmek: kel('ekmek'), sut: kel('süt'), peynir: kel('peynir'), zeytin: kel('zeytin'), sapa: kel('Sapasağlam') };
    var KES = {
      oda: AN[5] - 0.1, burun: AN[12] - 0.1, kagit: AN[20] - 0.1, sayfa: AN[29] - 0.1, carsi: AN[42] - 0.1,
      aksam: AN[45] - 0.1, oda2: AN[47] - 0.1, kagit2: AN[52] - 0.2, sayfa2: AN[54] - 0.2, son: AN[55] - 0.1
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
      ['Sinop', 'etiket', 800, 96, AN[1], AN[4] - 0.1],
      ['?', 'sor', 1080, 330, AN[6], D.mesaj - 0.7],
      ['kulaktan kulağa', 'etiket', 800, 96, AN[12], AN[14] - 0.1],
      ['kelimesi kelimesine', 'etiket', 800, 96, AN[19], KES.kagit - 0.2],
      ['?', 'sor', 800, 380, AN[20], AN[21] - 0.2],
      ['Aklımızın eremediği çok şey vardır.', 'kagit', 800, 450, AN[21], AN[23] - 0.4],
      ['Allahü teâlâ, emirlerini ve yasaklarını peygamberlerine bildirdi.', 'kagit', 800, 290, AN[23], AN[26] - 0.4],
      ['Buna vahiy denir.', 'kagit iri', 800, 470, AN[24], AN[26] - 0.4],
      ['Vahyi getiren melek, Cebrâîl aleyhisselâmdır.', 'kagit', 800, 640, AN[25], AN[26] - 0.4],
      ['Kimine melek okudu, kimine yazılı levhalar indi, kimine melek olmadan işittirildi.', 'kagit', 800, 320, AN[26], KES.sayfa - 0.4],
      ['Bunlar meleğin ya da peygamberin kendi sözü değildir; Allahü teâlânın kelâmıdır.', 'kagit', 800, 580, AN[27], KES.sayfa - 0.4],
      ['Kadir gecesinde başladı, yirmi üç yılda tamamlandı', 'etiket', 800, 96, AN[29] + 0.2, AN[31] - 0.1],
      ['her yıl bir kez birlikte okurlardı', 'etiket', 800, 96, AN[38], AN[40] - 0.1],
      ['son yıl iki kez', 'etiket', 800, 96, AN[40], D.nasil - 0.7],
      ['ekmek · süt · peynir · zeytin', 'etiket', 800, 96, AN[43] + 0.4, D.liste - 0.7],
      ['mühür sapasağlam', 'etiket', 800, 96, W.sapa, KES.kagit2 - 0.2],
      ['Kur\'ân-ı kerîmde kıyamete kadar hiçbir yanlışlık, eksiklik ve fazlalık olmaz.', 'kagit', 800, 330, AN[52], KES.sayfa2 - 0.4],
      ['Çünkü o, Allahü teâlânın kelâmıdır.', 'kagit', 800, 560, AN[53], KES.sayfa2 - 0.4],
      ['Gelecek ders: İlâhî kitaplar', 'etiket', 800, 110, AN[55] + 0.2, AN[56] + 0.9]
    ].map(function (s) { return { e: yazi(s[0], s[1], s[2], s[3]), kagit: /^kagit/.test(s[1]), bas: s[4], son: s[5] }; });

    // Kulaktan kulağa: her kayığın duyduğu haber balonda; durakta dokunulunca, sonra hep görünür
    var KAYIK = [[700, 610], [950, 560], [1180, 605], [1410, 560]];
    var LAMBA = P(305, 165);
    var HABER = ['fırtına var · çıkmasın', 'fırtına var · çıksın', 'fırtına yok · çıksın', 'hava güzel · herkes çıksın!'];
    // balonlar kayığın üstünde; üst sıradaki iki balon birbirine değmesin, sonuncusu sağ kenardan taşmasın
    var BALON_X = [700, 900, 1180, 1330];
    var BALON = HABER.map(function (h, i) { var y = KAYIK[i][1] - (i % 2 ? 170 : 110), x = BALON_X[i]; return { e: yazi(h, 'etiket', x, y), x: x, y: y }; });
    var ilkHaber = yazi('fırtına var · çıkmasın', 'etiket', LAMBA[0] + 170, LAMBA[1] - 20);
    var dokunulan = {};

    // Vahyin yolu: dört rozet ve altındaki adlar; hürmet ifadesi adın altında, tam
    var DURAK_X = [305, 635, 965, 1295], ROZET_Y = 300, YUVA_Y = 560;
    var ADLAR = [['Cebrâîl', 'aleyhisselâm'], ['Peygamber efendimiz', 'sallallahü aleyhi ve sellem'], ['Eshâb-ı kirâm', 'radıyallahü anhüm'], ['Bugün', 'biz']];
    var ADIM = ['Getirip okudu', 'Ezberleyip Eshâbına okudu', 'Ezberleyip yazdılar', 'Aynısını okuyoruz'];
    var ISTASYON = ADLAR.map(function (a, i) {
      return { ad: yazi(a[0], 'etiket', DURAK_X[i], 398), hurmet: yazi(a[1], 'damga', DURAK_X[i], 442), adim: yazi(ADIM[i], 'damga', DURAK_X[i], YUVA_Y),
        bas: [AN[31], AN[32], AN[34], AN[35]][i] };
    });
    var NOKTA_Y = 172, NOKTA_X0 = 330, NOKTA_X1 = 1270;
    function noktaX(i) { return kr(NOKTA_X0, NOKTA_X1, i / 22); }

    var kagitYazisi = false, sayfaAcik = false, sayfa2Acik = false, burunAcik = false;
    function bagla(e, x, y) { var p = T.ekran(x, y, 1); e._x = p.x; e._y = p.y; }   // kamera kayınca yazı yerinde kalır
    function yazilar(t) {
      kagitYazisi = false;
      AKIS.forEach(function (s) {
        var o = pencere(t, s.bas, s.son, s.kagit ? 0.8 : 0.3, 0.4);
        gos(s.e, o, s.kagit ? kr(8, 0, tw(t, s.bas, 0.8)) : 0);
        if (s.kagit && o > 0.2) kagitYazisi = true;
      });
      var acik = api.acikDurak() === 'kulak';
      bagla(ilkHaber, LAMBA[0] + 170, LAMBA[1] - 20);
      gos(ilkHaber, burunAcik ? pencere(t, AN[13] + 0.6, AN[14] + 0.4, 0.4, 0.4) : 0);
      BALON.forEach(function (b, i) {
        var o = 0;
        bagla(b.e, b.x, b.y);
        if (burunAcik) {
          if (acik) o = dokunulan['k' + (i + 1)] ? 1 : 0;
          else if (t >= D.kulak) o = pencere(t, D.kulak, KES.kagit - 0.3, 0.4, 0.3);
        }
        // son kayığın balonu "hava güzel" anında büyür
        gos(b.e, o, 0, i === 3 && !acik ? 1 + 0.12 * pencere(t, AN[17], AN[18] + 1, 0.3, 0.6) : 0);
      });
      ISTASYON.forEach(function (s, i) {
        // ikinci sayfada (son cümle) adlar yeniden görünür: bugünden geriye aynı kelimeler
        var o = sayfaAcik ? pencere(t, s.bas, KES.carsi - 0.2, 0.5, 0.3) : sayfa2Acik ? pencere(t, KES.sayfa2 + 0.4 + (3 - i) * 0.5, KES.son - 0.2, 0.5, 0.3) : 0;
        bagla(s.ad, DURAK_X[i], 398); bagla(s.hurmet, DURAK_X[i], 442); bagla(s.adim, DURAK_X[i], YUVA_Y);
        gos(s.ad, o, kr(-10, 0, tw(t, s.bas, 0.5))); gos(s.hurmet, o);
        // durak açılınca yerini motorun yuvaları alır; durak bitince doğru kart yerinde yazı olarak kalır (4. durağın tepsisi açıkken saklanır)
        var oa = sayfaAcik && api.acikDurak() !== 'yol' && api.acikDurak() !== 'nasil' && t >= D.yol ? pencere(t, D.yol, KES.carsi - 0.2, 0.4, 0.3) : 0;
        gos(s.adim, oa);
      });
    }

    /* ——— SVG ——— */
    var defs = E2('defs', {}, svg);
    var dg = E2('linearGradient', { id: 'kd11-altin', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    [['0', '#f3d584'], ['1', '#c9972f']].forEach(function (d) { E2('stop', { offset: d[0], 'stop-color': d[1] }, dg); });
    function yol(oz) { var p = E2('path', Object.assign({ d: 'M0 0', fill: 'none' }, oz || {}), svg); p.style.opacity = 0; p._o = 0; return p; }
    function gizle(p) { if (p._o !== 0) { p.style.opacity = 0; p._o = 0; } }
    function goster(p, d, o) { if (o <= 0.003) { gizle(p); return; } p.setAttribute('d', d); p.style.opacity = o; p._o = o; }
    function f1(x) { return x.toFixed(1); }
    function daire(cx, cy, r) { return 'M' + f1(cx - r) + ' ' + f1(cy) + ' a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0 a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
    var yaylar = [0, 1, 2, 3].map(function () { return yol({ stroke: '#fff3c4', 'stroke-width': 4, 'stroke-dasharray': '10 12', 'stroke-linecap': 'round' }); });
    var zincir = yol({ stroke: 'url(#kd11-altin)', 'stroke-width': 5, 'stroke-dasharray': '2 14', 'stroke-linecap': 'round' });
    var halkalar = [0, 1, 2, 3].map(function () { return yol({ stroke: '#ffe29a', 'stroke-width': 4 }); });
    var yilHalka = yol({ stroke: '#c9972f', 'stroke-width': 3 });
    var SVG_HEPSI = [].concat(yaylar, [zincir], halkalar, [yilHalka]);
    var kullanildi = [];
    function kullan(p) { kullanildi.push(p); }

    /* ——— ortak yardımcılar ——— */
    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    function ekranR(x, y, r) { var e = T.ekran(x, y, 1), e2 = T.ekran(x + r, y, 1); return { x: e.x, y: e.y, r: e2.x - e.x }; }
    function isima(x, y, r, renk, o) { var s = ekranR(x, y, r); T.iz(s.x, s.y, s.r, s.r, 0, renk[0], renk[1], renk[2], o); T.izBitir(); }
    function dunyaHalka(i, x, y, r, o) { var e = ekranR(x, y, r); goster(halkalar[i], daire(e.x, e.y, e.r), o); kullan(halkalar[i]); }
    function kayikCiz(x, y, g, a, i, o) {
      // su çizgisinden sallanır: alt orta çapa, rüzgâr aynı yönden
      T.ciz('kayik', { x: x, y: y + 4 * Math.sin(a * 1.4 + i * 1.7), g: g, ax: 0.5, ay: 0.82, d: 1, r: 2.2 * Math.sin(a * 1.1 + i), o: o == null ? 1 : o });
    }

    /* ——— durak durumu ——— */
    var aNow = 0;

    /* ——— 0. Kanca: sabah limanı; bir kayık açılır, kamera hana kayar ——— */
    var HAN = P(1258, 520), LIMAN_LAMBA = P(1455, 282);
    function kanca(t, a) {
      T.bas(a, kameraYolu(t, [[0, { x: 800, y: 440, z: 1.04 }], [AN[3], { x: 760, y: 560, z: 1.2 }], [AN[4], { x: 900, y: 540, z: 1.24 }], [KES.oda, { x: HAN[0], y: HAN[1], z: 1.7 }]]));
      plaka('liman-sabah', { d: 1, parilti: 0.35, su: 0.8, ruzgar: 0.05 });
      // kayıklar denize açılıyor: iskeleden açığa doğru, uzaklaştıkça küçülür
      var k = Y.sin(ic(t, W.kayik - 0.3, 5));
      var j = P(1120, 650), u = P(1560, 760);
      kayikCiz(kr(j[0], u[0], k), kr(j[1], u[1], k), kr(170, 140, k), a, 0, tw(t, W.kayik - 0.6, 0.5));
      isima(LIMAN_LAMBA[0], LIMAN_LAMBA[1], 70, [1, 0.92, 0.6], 0.18 * pencere(t, AN[4], KES.oda, 0.6, 0.3));
      isima(60, 140, 380, [1, 0.9, 0.62], 0.1);
    }

    /* ——— 1. Han odası: masada mühürlü mektup (durak 1); akşam sırrın çözümü ——— */
    var MASA = P(835, 668), MUHUR = [MASA[0] + 3, MASA[1] + 8];
    function oda(t, a, aksam, b) {
      var acik = api.acikDurak() === 'mesaj';
      T.bas(a, acik ? DUZ : aksam ? kameraYolu(t, [[b, { x: 820, y: 560, z: 1.3 }], [AN[48], { x: MASA[0], y: MASA[1] - 20, z: 1.85 }], [AN[50] + 0.6, { x: MASA[0], y: MASA[1] - 40, z: 1.6 }], [KES.kagit2, { x: 800, y: 470, z: 1.2 }]])
        : kameraYolu(t, [[b, { x: 980, y: 420, z: 1.4 }], [AN[5], { x: MASA[0], y: MASA[1] - 30, z: 1.65 }], [AN[7], { x: 820, y: 520, z: 1.28 }], [D.mesaj - 0.5, DUZ]]));
      plaka('han-oda', { d: 1, parilti: 0.4, carp: aksam ? [0.84, 0.74, 0.66] : null });
      if (!aksam) isima(150, 420, 420, [1, 0.88, 0.6], 0.1);
      else { var lm = P(1295, 395); isima(lm[0], lm[1], 160, [1, 0.8, 0.45], 0.16); }   // akşam: nişteki lamba yanar
      // mektup masada; geldiği an hafifçe iner
      var g = tw(t, AN[4] + 0.2, 0.8);
      T.ciz('mektup', { x: MASA[0], y: MASA[1] - (aksam ? 0 : 30 * (1 - g)), g: 300, d: 1, o: aksam ? 1 : g });
      // mühür: "mühür var" anında ve "Sapasağlam" anında halka
      var mo = aksam ? pencere(t, AN[48], KES.kagit2 - 0.3, 0.4, 0.3) : pencere(t, W.muhur - 0.1, AN[6], 0.3, 0.5);
      if (mo > 0.01) { dunyaHalka(0, MUHUR[0], MUHUR[1], 46 + 4 * Math.sin(a * 3), mo); isima(MUHUR[0], MUHUR[1], 60, [1, 0.5, 0.35], 0.18 * mo); }
    }

    /* ——— 2. Burun: fenerden çıkan haber, dört kayıkta kulaktan kulağa (durak 2) ——— */
    function burun(t, a) {
      var acik = api.acikDurak() === 'kulak';
      T.bas(a, acik || (t >= D.kulak - 0.5 && t < AN[17]) ? DUZ : kameraYolu(t, [[KES.burun, { x: 520, y: 380, z: 1.3 }], [AN[13], { x: 600, y: 420, z: 1.16 }], [AN[14], { x: 860, y: 470, z: 1.06 }], [D.kulak - 0.5, DUZ],
        [AN[17], DUZ], [AN[18], { x: 1150, y: 480, z: 1.22 }], [AN[19], { x: 820, y: 460, z: 1.04 }]]));
      plaka('burun-fener', { d: 1, parilti: 0.4, su: 1, ruzgar: 0.06 });
      // fenerin ışığı haber çıkınca parlar (yalnız fener lambası; bir figür değildir)
      isima(LAMBA[0], LAMBA[1], 80, [1, 0.93, 0.62], 0.12 + 0.2 * pencere(t, AN[13], AN[15], 0.4, 0.6));
      KAYIK.forEach(function (k, i) { kayikCiz(k[0], k[1], 230, a, i + 1); });
      // haber kayıktan kayığa geçer: yaylar sırayla çizilir
      var noktalar = [[LAMBA[0] + 30, LAMBA[1] + 30]].concat(KAYIK.map(function (k) { return [k[0], k[1] - 70]; }));
      for (var i = 0; i < 4; i++) {
        var bas = AN[14] + i * 0.45, ilerle = tw(t, bas, 0.6), o = acik ? 0.5 : pencere(t, bas, KES.kagit - 0.3, 0.3, 0.3);
        if (o <= 0.01 || ilerle <= 0) { continue; }
        var p = T.ekran(noktalar[i][0], noktalar[i][1], 1), q = T.ekran(noktalar[i + 1][0], noktalar[i + 1][1], 1);
        var mx = (p.x + q.x) / 2, my = Math.min(p.y, q.y) - 70, ex = kr(p.x, q.x, ilerle), ey = kr(p.y, q.y, ilerle);
        var cx = kr(p.x, mx, ilerle), cy = kr(p.y, my, ilerle);
        goster(yaylar[i], 'M' + f1(p.x) + ' ' + f1(p.y) + ' Q' + f1(cx) + ' ' + f1(cy) + ' ' + f1(ex) + ' ' + f1(ey), o); kullan(yaylar[i]);
      }
      // son kayık: "hava güzel" anında halka
      var so = pencere(t, AN[17], AN[19], 0.3, 0.5);
      if (so > 0.01 && !acik) dunyaHalka(1, KAYIK[3][0], KAYIK[3][1] - 40, 120, so);
      // ilk haber ile son haber karşılaştırılır: "tam tersine döndü"
      var to = pencere(t, AN[18], AN[19], 0.3, 0.4);
      if (to > 0.01 && !acik) dunyaHalka(2, KAYIK[0][0], KAYIK[0][1] - 40, 120, to);
    }

    /* ——— 3. Kâğıt: Allahü teâlâdan söz edilen bölüm ——— */
    function kagit(t, a) { T.bas(a, DUZ); plaka('kagit', { d: 0 }); }

    /* ——— 4. Tezhipli sayfa: yirmi üç yıl, vahyin yolu (durak 3), her yıl birlikte okuma (durak 4) ——— */
    function sayfa(t, a, ikinci) {
      var acik = api.acikDurak() === 'yol' || api.acikDurak() === 'nasil';
      T.bas(a, acik || ikinci ? DUZ : kameraYolu(t, [[KES.sayfa, { x: 800, y: 300, z: 1.25 }], [AN[30], { x: 800, y: 240, z: 1.3 }], [AN[31], { x: 800, y: 420, z: 1.06 }], [D.yol - 0.5, DUZ]]));
      plaka('sayfa', { d: 1, parilti: 0.5 });
      // yirmi üç altın nokta: "yirmi üç yıl" anında soldan sağa dizilir
      var dizil = ikinci ? 23 : 23 * ic(t, W.yirmi - 0.2, 2.6);
      // her yıl birlikte okuma: noktalar sırayla halkalanır, son yıl iki halka
      var okuma = ikinci ? 23 : 23 * ic(t, AN[38] + 0.2, AN[40] - AN[38]);
      for (var i = 0; i < 23; i++) {
        var o = sinirla01(dizil - i), x = noktaX(i), y = NOKTA_Y;
        if (o <= 0.01) continue;
        var s = ekranR(x, y, 1);
        T.ciz('rozet', { x: x, y: y, g: 30 * kr(0.6, 1, o), d: 1, o: o });
        var ro = sinirla01(okuma - i);
        if (ro > 0.01) T.iz(s.x, s.y, 22 * s.r, 22 * s.r, 0, 1, 0.86, 0.5, 0.35 * ro);
      }
      T.izBitir();
      var so = ikinci ? 0 : pencere(t, AN[40], D.nasil - 0.3, 0.3, 0.3);
      if (so > 0.01) { var e = ekranR(noktaX(22), NOKTA_Y, 30 + 4 * Math.sin(a * 3)); goster(yilHalka, daire(e.x, e.y, e.r) + daire(e.x, e.y, e.r + 9), so); kullan(yilHalka); }
      // dört rozet: adı anılınca açılır, aralarındaki yol altın noktalarla çizilir
      ISTASYON.forEach(function (st, i) {
        var o = ikinci ? 1 : tw(t, st.bas - 0.2, 0.6);
        if (o <= 0.01) return;
        T.ciz('rozet', { x: DURAK_X[i], y: ROZET_Y, g: 150 * kr(0.7, 1, Y.cik(o)), d: 1, o: o, r: 6 * Math.sin(a * 0.4 + i) });
        if (!acik) isima(DURAK_X[i], ROZET_Y, 110, [1, 0.88, 0.55], 0.1 * o);
      });
      // ilk sayfada yol soldan sağa (Cebrâîl aleyhisselâmdan bugüne), ikincide bugünden geriye çizilir
      var zinc = ikinci ? ic(t, KES.sayfa2 + 0.4, 2.4) : ic(t, AN[31], AN[35] - AN[31]);
      if (zinc > 0.01) {
        var z0 = ikinci ? DURAK_X[3] : DURAK_X[0], z1 = ikinci ? DURAK_X[0] : DURAK_X[3];
        var p = T.ekran(z0, ROZET_Y, 1), q = T.ekran(kr(z0, z1, zinc), ROZET_Y, 1);
        goster(zincir, 'M' + f1(p.x) + ' ' + f1(p.y) + ' L' + f1(q.x) + ' ' + f1(q.y), 0.8); kullan(zincir);
      }
    }
    function sinirla01(x) { return Math.min(1, Math.max(0, x)); }

    /* ——— 5. Çarşı: sepete ekmek, süt, peynir, zeytin (durak 5) ——— */
    var SEPET = [800, 650];
    var ESYA = [
      { ad: 'ekmek', w: 'ekmek', kaynak: P(1500, 630), yer: [SEPET[0] - 46, SEPET[1] - 96], g: 120, h: null },
      { ad: 'sut', w: 'sut', kaynak: P(330, 610), yer: [SEPET[0] + 52, SEPET[1] - 120], g: null, h: 120 },
      { ad: 'peynir', w: 'peynir', kaynak: P(1560, 510), yer: [SEPET[0] + 6, SEPET[1] - 84], g: 104, h: null },
      { ad: 'zeytin', w: 'zeytin', kaynak: P(420, 660), yer: [SEPET[0] - 6, SEPET[1] - 64], g: 104, h: null }
    ];
    function carsi(t, a) {
      var acik = api.acikDurak() === 'liste';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.carsi, { x: 800, y: 380, z: 1.22 }], [AN[43], { x: 800, y: 520, z: 1.12 }], [D.liste - 0.5, DUZ], [D.liste + 1, DUZ], [KES.aksam, { x: 800, y: 470, z: 1.1 }]]));
      plaka('carsi', { d: 1, parilti: 0.45, ruzgar: 0.04 });
      isima(560, 120, 300, [1, 0.92, 0.65], 0.12);
      T.ciz('sepet', { x: SEPET[0], y: SEPET[1], h: 200, ax: 0.5, ay: 1, d: 1 });
      // eşya adı anılınca tezgâhtan yay çizerek sepete düşer; sepetin ağzından taşar, öne konan arkadakini örtmez
      ESYA.forEach(function (e) {
        var k = Y.ikili(ic(t, W[e.w] - 0.1, 0.9));
        if (k <= 0) return;
        var x = kr(e.kaynak[0], e.yer[0], k), y = kr(e.kaynak[1], e.yer[1], k) - Math.sin(Math.PI * k) * 120;
        T.ciz(e.ad, { x: x, y: y, g: e.g || undefined, h: e.h || undefined, ax: 0.5, ay: 1, d: 1, r: (1 - k) * 20 });
      });
    }

    /* ——— 6. Akşam limanı: büyük soru (durak 6), kapanış ——— */
    function aksamLimani(t, a, kam) {
      T.bas(a, kam);
      plaka('liman-aksam', { d: 1, parilti: 0.5, su: 0.8, ruzgar: 0.05 });
      // fener akşam yanar; lambanın ışığı yavaşça nefes alır
      isima(LIMAN_LAMBA[0], LIMAN_LAMBA[1], 90, [1, 0.86, 0.5], 0.22 + 0.06 * Math.sin(a * 1.6));
      isima(1600, 200, 380, [1, 0.7, 0.4], 0.1);
    }
    function aksam(t, a) {
      var acik = api.acikDurak() === 'sir';
      aksamLimani(t, a, acik ? DUZ : kameraYolu(t, [[KES.aksam, { x: 760, y: 430, z: 1.12 }], [D.sir - 0.5, DUZ]]));
    }
    function kapanis(t, a) { var k = tw(t, KES.son, 6, Y.sin); aksamLimani(t, a, { x: kr(1150, 800, k), y: kr(420, 450, k), z: kr(1.5, 1.02, k) }); }

    /* ——— perde: kesmelerde kısa bir an lacivert (kâğıt bölümünde krem) karartma ——— */
    var LACI = [0.07, 0.11, 0.3], KREM = [1, 1, 1];
    var PERDE = [[KES.oda], [KES.burun], [KES.kagit, KREM], [KES.sayfa, KREM], [KES.carsi], [KES.aksam], [KES.oda2], [KES.kagit2, KREM], [KES.sayfa2, KREM], [KES.son]];
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
      [KES.oda, kanca], [KES.burun, function (t, a) { oda(t, a, false, KES.oda); }], [KES.kagit, burun], [KES.sayfa, kagit],
      [KES.carsi, function (t, a) { sayfa(t, a, false); }], [KES.aksam, carsi], [KES.oda2, aksam],
      [KES.kagit2, function (t, a) { oda(t, a, true, KES.oda2); }], [KES.sayfa2, kagit], [KES.son, function (t, a) { sayfa(t, a, true); }], [Infinity, kapanis]
    ];
    function ciz(t, a) {
      aNow = a; kullanildi = [];
      sayfaAcik = t >= KES.sayfa && t < KES.carsi;
      sayfa2Acik = t >= KES.sayfa2 && t < KES.son;
      burunAcik = t >= KES.burun && t < KES.kagit;
      for (var i = 0; i < BOLUM.length; i++) { if (t < BOLUM[i][0]) { BOLUM[i][1](t, a); break; } }
      SVG_HEPSI.forEach(function (p) { if (kullanildi.indexOf(p) < 0) gizle(p); });
      perde(t);
      yazilar(t);
    }

    return {
      hazir: hazir,
      ciz: ciz,
      // Allahü teâlâdan söz edilen kâğıt bölümlerinde yazı sahnenin kendisidir; altyazı ve dokunma oyunu yoktur
      altyazisiz: function (t) { return kagitYazisi || (t >= KES.kagit && t < KES.sayfa) || (t >= KES.kagit2 && t < KES.sayfa2); },
      // Peygamber efendimizin adı anılırken oyun yoktur
      dokun: function () {
        var t = api.t();
        if ((t >= AN[32] - 0.2 && t < AN[33]) || (t >= AN[39] - 0.2 && t < AN[40]) || (t >= AN[54] - 0.2 && t < AN[55])) return true;
        return false;
      },
      durak: function (id, olay, veri) {
        if (id === 'kulak' && olay === 'dene') dokunulan[veri] = true;
        if (id === 'kulak' && olay === 'ac') dokunulan = {};
      }
    };
  };
})();
