/* Akaid 13 · Görülen ve Görülemeyen Varlıklar — sahne: "Yaşayan Minyatür", Bozcaada; bir gün sabahtan akşama.
   Ders tek sahnede dönmez: sabah tepesinde beş yel değirmeninin kanatları rüzgârla döner; ninenin mutfağında rafta
   "boş değil" denen cam kavanoz durur, sır onun içidir; tepede kanatları ne döndürüyor (durak 1); iskele sokağında vapur
   düdük çalar (buharı görünür), fırından ekmek buğusu çıkar, pencereye bal konur, duyular eşleşir (durak 2); mutfakta
   sevgi (durak 3); gayb anlatılırken boya çekilir, kâğıt ve yazı kalır; iskelede hangisini bildirildiği için biliriz
   (durak 4); okul bahçesinde arkadaşa ne dersin (durak 5); akşam mutfağında kavanoz ters çevrilip leğene bastırılır,
   dibindeki kâğıt kuru kalır (durak 6), kabarcıklar havayı gösterir; kâğıtta cevap; ders akşam tepesinde biter.
   Her olay anlatıcının kelimesine bağlıdır (t); a ortam saatidir.
   Görünmeyen şey çizilmez: rüzgâr yalnız kanatların dönüşüyle, ses yalnız vapurun buharıyla, hava yalnız kabarcıkla
   görünür. Fizik: kanatlar rüzgâr esince hızlanır; ters kavanozda hava kalır, su ağzından içeri dolmaz; eğilince
   kabarcık yükselir. İnsan figürü, yüz, el yoktur; melek tasvir edilmez. Allahü teâlâ için hiçbir şekil, ışık ya da
   sembol kullanılmaz. Peygamber efendimizin adı anılırken dokunma oyunu yoktur. */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-13'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['tepe-sabah', 'tepe-aksam', 'mutfak', 'iskele', 'okul-bahce', 'kagit',
      'kanat', 'kavanoz', 'legen', 'vapur', 'ekmek', 'bal', 'degirmen', 'kagit-top'];
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
    var D = {}; ['kanat', 'duyu', 'sevgi', 'gayb', 'arkadas', 'sir'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {}; for (var n0 = 0; n0 <= 60; n0++) AN[n0] = C(n0);
    var W = { esiyor: kel('esiyor,'), vapur: kel('vapur'), ekmek: kel('ekmek'), bal: kel('bal'), kagit: kel('kâğıt'), ters: kel('ters') };
    var KES = {
      mutfak: AN[7] - 0.1, tepe2: AN[12] - 0.1, iskele: AN[17] - 0.1, ev: AN[26] - 0.1, kagit: AN[32] - 0.1,
      iskele2: AN[39] - 0.1, okul: AN[42] - 0.1, aksam: AN[46] - 0.1, kagit2: AN[57] - 0.2, son: AN[58] - 0.1
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
      ['Bozcaada', 'etiket', 800, 96, AN[3], KES.mutfak - 0.1],
      ['rüzgâr: görünmez, ama kanatları döndürür', 'etiket', 800, 96, AN[14], KES.iskele - 0.2],
      ['ses · koku · tat', 'etiket', 800, 96, AN[21], D.duyu - 0.7],
      ['kimini de yaptığı işten anlarız', 'etiket', 800, 96, AN[25], KES.ev - 0.2],
      ['sevgi · sevinç · merak: görünmez, ama vardır', 'etiket', 800, 96, AN[31], KES.kagit - 0.2],
      ['?', 'sor', 800, 380, AN[32], AN[33] - 0.2],
      ['Bazı varlıkları ne gözümüz görür, ne kulağımız duyar. Aklımız da kendi başına bulamaz.', 'kagit', 800, 280, AN[33], AN[37] - 0.4],
      ['Melekler ve âhıret böyledir.', 'kagit iri', 800, 470, AN[35], AN[37] - 0.4],
      ['Onları bize Allahü teâlâ bildirdi; Peygamber efendimiz sallallahü aleyhi ve sellem haber verdi.', 'kagit', 800, 650, AN[36], AN[37] - 0.4],
      ['Böyle varlıklara gayb denir.', 'kagit iri', 800, 330, AN[37], KES.iskele2 - 0.4],
      ['Görülen ve görülmeyen bütün varlıkları yaratan, Allahü teâlâdır.', 'kagit', 800, 560, AN[38], KES.iskele2 - 0.4],
      ['görmemek, yok olmak demek değildir', 'etiket', 800, 96, AN[44], KES.aksam - 0.2],
      ['hava yer kaplar', 'etiket', 800, 96, AN[53], AN[55] - 0.1],
      ['kavanoz boş değildi', 'etiket', 800, 96, AN[55], KES.kagit2 - 0.2],
      ['Meleklerin ve âhıretin varlığını da bize Allahü teâlâ bildirdi; biz de görmeden inanırız.', 'kagit', 800, 450, AN[57], KES.son - 0.4],
      ['Gelecek ders: Melekler', 'etiket', 800, 110, AN[59] + 0.2, AN[60] + 0.9]
    ].map(function (s) { return { e: yazi(s[0], s[1], s[2], s[3]), kagit: /^kagit/.test(s[1]), bas: s[4], son: s[5] }; });

    // Mutfak: rafta cam kavanoz (sabah); akşam masada leğen ve kavanoz deneyi
    var RAF = P(300, 389), MASA = P(813, 700), PENCERE = P(907, 400);
    var sorKavanoz = yazi('?', 'sor', RAF[0] + 120, RAF[1] - 90);
    // Mutfakta görünmeyen ama var olanlar: kelimeler pencerenin yanında belirir
    var DUYGU = [['sevgi', AN[29], 560, 300], ['sevinç', AN[31], 1080, 250], ['merak', AN[31] + 0.6, 1220, 380]].map(function (d) { return { e: yazi(d[0], 'etiket', d[2], d[3]), bas: d[1], x: d[2], y: d[3] }; });

    var kagitYazisi = false;
    function bagla(e, x, y) { var p = T.ekran(x, y, 1); e._x = p.x; e._y = p.y; }   // kamera kayınca yazı yerinde kalır
    function yazilar(t) {
      kagitYazisi = false;
      AKIS.forEach(function (s) {
        var o = pencere(t, s.bas, s.son, s.kagit ? 0.8 : 0.3, 0.4);
        gos(s.e, o, s.kagit ? kr(8, 0, tw(t, s.bas, 0.8)) : 0);
        if (s.kagit && o > 0.2) kagitYazisi = true;
      });
      var mutfakAcik = t >= KES.mutfak && t < KES.tepe2, evAcik = t >= KES.ev && t < KES.kagit;
      bagla(sorKavanoz, RAF[0] + 120, RAF[1] - 90);
      gos(sorKavanoz, mutfakAcik ? pencere(t, AN[9], KES.tepe2 - 0.2, 0.3, 0.3) : 0);
      DUYGU.forEach(function (d) {
        bagla(d.e, d.x, d.y);
        gos(d.e, evAcik && api.acikDurak() !== 'sevgi' ? pencere(t, d.bas, KES.kagit - 0.2, 0.5, 0.3) : 0, kr(10, 0, tw(t, d.bas, 0.6)));
      });
    }

    /* ——— SVG ——— */
    function yol(oz) { var p = E2('path', Object.assign({ d: 'M0 0', fill: 'none' }, oz || {}), svg); p.style.opacity = 0; p._o = 0; return p; }
    function gizle(p) { if (p._o !== 0) { p.style.opacity = 0; p._o = 0; } }
    function goster(p, d, o) { if (o <= 0.003) { gizle(p); return; } p.setAttribute('d', d); p.style.opacity = o; p._o = o; }
    function f1(x) { return x.toFixed(1); }
    function daire(cx, cy, r) { return 'M' + f1(cx - r) + ' ' + f1(cy) + ' a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0 a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
    var halkalar = [0, 1].map(function () { return yol({ stroke: '#c8452f', 'stroke-width': 5 }); });
    var kabarcik = yol({ stroke: '#ffffff', 'stroke-width': 3, fill: 'rgba(255,255,255,0.25)' });
    var SVG_HEPSI = [].concat(halkalar, [kabarcik]);
    var kullanildi = [];
    function kullan(p) { kullanildi.push(p); }

    /* ——— ortak yardımcılar ——— */
    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    function ekranR(x, y, r) { var e = T.ekran(x, y, 1), e2 = T.ekran(x + r, y, 1); return { x: e.x, y: e.y, r: e2.x - e.x }; }
    function isima(x, y, r, renk, o) { var s = ekranR(x, y, r); T.iz(s.x, s.y, s.r, s.r, 0, renk[0], renk[1], renk[2], o); T.izBitir(); }
    function dunyaHalka(i, x, y, r, o) { var e = ekranR(x, y, r); goster(halkalar[i], daire(e.x, e.y, e.r), o); kullan(halkalar[i]); }

    /* ——— yel değirmenleri: kanatlar rüzgârla döner (açı zamanın integrali; hız değişince sıçramaz) ——— */
    var GOBEK_S = [[289, 303], [533, 311], [777, 308], [1023, 323], [1264, 333]].map(function (p) { return P(p[0], p[1]); });
    var GOBEK_A = [[360, 250], [557, 263], [736, 273], [915, 293], [1080, 310]].map(function (p) { return P(p[0], p[1]); });
    function kanatAci(t, a, i, hiz) { return (a * hiz + i * 23) % 360; }
    function kanatlar(t, a, gobek, R, hiz, o) {
      gobek.forEach(function (g, i) { T.ciz('kanat', { x: g[0], y: g[1], g: 2 * R, d: 1, r: kanatAci(t, a, i, hiz * (1 + 0.08 * i)), o: o == null ? 1 : o }); });
    }

    /* ——— 0. Kanca ve tepe: sabah; kanatlar rüzgâr esince hızlanır (durak 1) ——— */
    function tepe(t, a, ikinci) {
      var acik = api.acikDurak() === 'kanat';
      T.bas(a, acik ? DUZ : ikinci ? kameraYolu(t, [[KES.tepe2, { x: 760, y: 420, z: 1.25 }], [AN[13], { x: 800, y: 430, z: 1.12 }], [D.kanat - 0.5, DUZ], [D.kanat + 1, DUZ],
        [AN[15], { x: GOBEK_S[2][0], y: GOBEK_S[2][1] + 40, z: 1.6 }], [KES.iskele, { x: GOBEK_S[2][0], y: GOBEK_S[2][1] + 40, z: 1.7 }]])
        : kameraYolu(t, [[0, { x: 640, y: 400, z: 1.18 }], [AN[3], { x: 760, y: 420, z: 1.12 }], [AN[4], { x: 820, y: 380, z: 1.3 }], [AN[6], { x: 1000, y: 440, z: 1.15 }],
          [KES.mutfak, { x: 1150, y: 560, z: 1.4 }]]));
      plaka('tepe-sabah', { d: 1, parilti: 0.35, su: 0.7, ruzgar: 0.12 });
      isima(60, 160, 420, [1, 0.92, 0.66], 0.12);
      // rüzgâr "esiyor" anında güçlenir; ikinci gelişte hep eser
      var hiz = ikinci ? 70 : kr(18, 70, tw(t, W.esiyor - 0.2, 1.5));
      kanatlar(t, a, GOBEK_S, 86, hiz);   // kanatlar külahın önünden döner, kulenin alt yarısı görünür
    }

    /* ——— 1. Mutfak: rafta kavanoz (sır); sevgi (durak 3); akşam: leğen ve ters kavanoz (durak 6) ——— */
    function kavanozCiz(x, y, r, o) { T.ciz('kavanoz', { x: x, y: y, h: 170, ax: 0.5, ay: 1, d: 1, r: r || 0, o: o == null ? 1 : o }); }
    function mutfak(t, a) {
      T.bas(a, kameraYolu(t, [[KES.mutfak, { x: 700, y: 420, z: 1.25 }], [AN[8], { x: RAF[0] + 60, y: RAF[1] - 40, z: 1.9 }], [AN[10], { x: RAF[0] + 80, y: RAF[1] - 40, z: 2.0 }],
        [KES.tepe2, { x: 500, y: 400, z: 1.4 }]]));
      plaka('mutfak', { d: 1, parilti: 0.4 });
      isima(PENCERE[0], PENCERE[1], 260, [1, 0.94, 0.7], 0.14);
      kavanozCiz(RAF[0], RAF[1] + 4);
      var ho = pencere(t, AN[8], KES.tepe2 - 0.1, 0.4, 0.3);
      if (ho > 0.01) dunyaHalka(0, RAF[0], RAF[1] - 82, 110 + 3 * Math.sin(a * 3), ho);
    }
    function ev(t, a) {
      var acik = api.acikDurak() === 'sevgi';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.ev, { x: 860, y: 430, z: 1.3 }], [AN[27], { x: 880, y: 420, z: 1.18 }], [D.sevgi - 0.5, DUZ], [D.sevgi + 1, DUZ], [KES.kagit, { x: 860, y: 420, z: 1.15 }]]));
      plaka('mutfak', { d: 1, parilti: 0.4, carp: [1, 0.96, 0.9] });
      // sarılma anında oda ılık bir ışıkla dolar (bir şekil değil, yalnız ışık)
      isima(PENCERE[0], PENCERE[1] + 80, 520, [1, 0.82, 0.55], 0.12 + 0.1 * pencere(t, AN[27], KES.kagit, 0.8, 0.5));
      kavanozCiz(RAF[0], RAF[1] + 4);
    }
    // akşam: masada leğen; kâğıt kavanozun dibine girer, kavanoz ters çevrilip suya bastırılır
    var LEGEN = [MASA[0] + 60, MASA[1] + 6], YAN = [MASA[0] - 260, MASA[1]], SU_Y = LEGEN[1] - 118;   // leğenin arka kenarının hemen altı: kavanoz suya buradan girer
    function aksamMutfak(t, a) {
      var acik = api.acikDurak() === 'sir';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.aksam, { x: 760, y: 520, z: 1.3 }], [AN[47], { x: YAN[0] + 40, y: YAN[1] - 90, z: 1.7 }], [AN[48] + 0.6, { x: 760, y: 560, z: 1.45 }],
        [AN[49], { x: LEGEN[0], y: LEGEN[1] - 120, z: 1.7 }], [D.sir - 0.5, DUZ], [D.sir + 1, DUZ], [AN[52], { x: LEGEN[0], y: LEGEN[1] - 110, z: 1.75 }],
        [AN[55], { x: 760, y: 540, z: 1.35 }], [KES.kagit2, { x: 760, y: 520, z: 1.3 }]]));
      plaka('mutfak', { d: 1, parilti: 0.45, carp: [0.86, 0.76, 0.7] });
      var lm = P(907, 330); isima(lm[0], lm[1], 300, [1, 0.72, 0.42], 0.12);
      // kavanozun yolu: yanda dik → çevrilir → leğenin üstüne gelir → suya iner; çözümde biraz eğilir, sonra çıkar ve dik konur
      var cevir = tw(t, W.ters, 0.8, Y.ikili), git = tw(t, W.ters + 0.5, 0.9, Y.ikili), in_ = tw(t, W.ters + 1.3, 0.8, Y.ikili);
      var cikA = tw(t, AN[54] + 0.1, 0.8, Y.ikili), donus = tw(t, AN[54] + 0.9, 0.8, Y.ikili), egil = pencere(t, AN[52], AN[54], 0.5, 0.5);
      var cy0 = YAN[1] - 85, cyUst = SU_Y - 130, cyIc = SU_Y - 5, xSon = YAN[0] + 30;   // çıkan kavanoz leğenin yanına, masaya dik konur
      var xx = kr(YAN[0], LEGEN[0], git), yy = kr(kr(cy0, cyUst, git), cyIc, in_);
      yy = kr(yy, cyUst, cikA); xx = kr(xx, xSon, donus); yy = kr(yy, cy0, donus);
      var r = 180 * cevir * (1 - donus) + 8 * egil;
      var o = tw(t, KES.aksam, 0.5);
      // kâğıt topu kavanozun dibine sıkışır ve kavanozla döner: dip, kavanoz ortasından 67 birim tabana doğrudur
      var rr = r * Math.PI / 180, kx = xx - 67 * Math.sin(rr), ky = yy + 67 * Math.cos(rr);
      var kt = tw(t, W.kagit, 0.8);
      function kavanozVeKagit() {
        if (kt > 0.01) {
          var px = kr(YAN[0] - 220, kx, Y.cik(kt)), py = kr(YAN[1] - 260, ky, Y.cik(kt)) - Math.sin(Math.PI * kt) * 60;
          T.ciz('kagit-top', { x: px, y: py, h: 52, d: 1, r: r, o: o * Math.min(1, kt * 3) });
        }
        T.ciz('kavanoz', { x: xx, y: yy, h: 170, d: 1, r: r, o: o });
      }
      // leğen önde çizilir: suya inen kavanozun alt yarısını örter, kavanoz suya girmiş görünür
      kavanozVeKagit();
      T.ciz('legen', { x: LEGEN[0], y: LEGEN[1], g: 360, ax: 0.5, ay: 1, d: 1, o: o });
      // kuru kâğıt: "ıslanmadı" anında halka
      var ho = pencere(t, AN[49], D.sir - 0.3, 0.3, 0.3);
      if (ho > 0.01 && !acik) dunyaHalka(0, kx, ky, 46 + 3 * Math.sin(a * 3), ho);
      // eğilince ağızdan kabarcık yükselir: içerideki hava
      if (egil > 0.05) {
        var d = '';
        for (var i = 0; i < 7; i++) {
          var u = ((a * 0.9 + i / 7) % 1), bx = LEGEN[0] + 46 + 10 * Math.sin(i * 2.1 + a * 3), by = kr(SU_Y + 40, SU_Y - 10, u);
          var e = ekranR(bx, by, 5 + 4 * (i % 3));
          d += daire(e.x, e.y, e.r);
        }
        goster(kabarcik, d, 0.9 * egil); kullan(kabarcik);
      }
      var so = pencere(t, AN[54] + 1.4, KES.kagit2 - 0.2, 0.4, 0.3);
      if (so > 0.01) dunyaHalka(1, kx, ky, 46 + 3 * Math.sin(a * 3), so);
    }

    /* ——— 2. İskele: vapur düdüğü (buhar), fırın buğusu, pencerede bal (durak 2); ikinci kez: gayb sorusu (durak 4) ——— */
    var FIRIN = P(300, 560), EKMEK = P(270, 690), PERVAZ = P(1460, 604), DENIZ_Y = P(0, 470)[1];
    function iskele(t, a, ikinci) {
      var acik = api.acikDurak() === 'duyu' || api.acikDurak() === 'gayb';
      T.bas(a, acik ? DUZ : ikinci ? kameraYolu(t, [[KES.iskele2, { x: 800, y: 440, z: 1.12 }], [D.gayb - 0.5, DUZ], [D.gayb + 1, DUZ], [KES.okul, { x: 820, y: 430, z: 1.1 }]])
        : kameraYolu(t, [[KES.iskele, { x: 800, y: 420, z: 1.2 }], [W.vapur, { x: 1000, y: 420, z: 1.35 }], [W.ekmek, { x: 420, y: 560, z: 1.4 }], [W.bal, { x: 1300, y: 520, z: 1.4 }],
          [AN[21], { x: 800, y: 450, z: 1.1 }], [D.duyu - 0.5, DUZ]]));
      plaka('iskele', { d: 1, parilti: 0.4, su: 0.8, ruzgar: 0.06 });
      isima(FIRIN[0], FIRIN[1], 170, [1, 0.62, 0.3], 0.18 + 0.04 * Math.sin(a * 6));   // fırının ateşi
      // vapur sağdan girer, iskelenin ardından geçer; düdükte bacasından buhar çıkar
      var vk = ikinci ? 1 : tw(t, W.vapur - 1.2, 3.0, Y.sin);
      var vx = kr(1720, 1060, vk), vy = DENIZ_Y + 18 + 3 * Math.sin(a * 1.3);
      T.ciz('vapur', { x: vx, y: vy, g: 260, ax: 0.5, ay: 0.85, d: 1, r: 0.8 * Math.sin(a * 1.1) });
      var bo = ikinci ? 0 : pencere(t, W.vapur + 0.1, W.vapur + 2.6, 0.2, 1.0);
      for (var i = 0; i < 4; i++) {
        var u = ic(t, W.vapur + 0.1 + i * 0.25, 1.6);
        if (u > 0 && u < 1 && bo > 0.01) isima(vx + 22 + u * 30, vy - 110 - u * 90, 18 + u * 34, [1, 1, 1], 0.5 * bo * (1 - u));
      }
      // fırından ekmek buğusu; pencere pervazına bal
      var eo = ikinci ? 0.5 : pencere(t, W.ekmek - 0.2, AN[24], 0.4, 0.6);
      for (var j = 0; j < 3; j++) {
        var w = (a * 0.35 + j / 3) % 1;
        if (eo > 0.01) isima(EKMEK[0] - 30 + j * 30 + 10 * Math.sin(a + j), EKMEK[1] - 60 - w * 120, 20 + w * 26, [1, 1, 1], 0.32 * eo * (1 - w));
      }
      var bk = ikinci ? 1 : tw(t, W.bal - 0.2, 0.6);
      if (bk > 0.01) T.ciz('bal', { x: PERVAZ[0], y: PERVAZ[1] - 6 * (1 - bk), h: 110, ax: 0.5, ay: 1, d: 1, o: bk });
      // eşleştirme sahnenin üstünde açılır: resimler ve adlar seçilsin diye sokak lacivert bir perdeyle koyulaşır
      if (api.acikDurak() === 'duyu') T.ciz('kagit', { x: 800, y: 450, g: 1800, h: 1012, d: 0, carp: [0.07, 0.11, 0.3], o: 0.66 });
    }

    /* ——— 3. Okul bahçesi: arkadaşa ne dersin (durak 5) ——— */
    function okul(t, a) {
      var acik = api.acikDurak() === 'arkadas';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.okul, { x: 700, y: 430, z: 1.2 }], [AN[43], { x: 800, y: 450, z: 1.08 }], [D.arkadas - 0.5, DUZ], [D.arkadas + 1, DUZ], [KES.aksam, { x: 760, y: 420, z: 1.15 }]]));
      plaka('okul-bahce', { d: 1, parilti: 0.4, ruzgar: 0.1 });
      isima(120, 180, 360, [1, 0.92, 0.66], 0.12);
    }

    /* ——— 4. Kâğıt: gaybdan, Allahü teâlâdan söz edilen bölüm ——— */
    function kagit(t, a) { T.bas(a, DUZ); plaka('kagit', { d: 0 }); }

    /* ——— 5. Akşam tepesi: kapanış, kanatlar akşam rüzgârında döner ——— */
    function kapanis(t, a) {
      var k = tw(t, KES.son, 6, Y.sin);
      T.bas(a, { x: kr(760, 800, k), y: kr(360, 450, k), z: kr(1.45, 1.02, k) });
      plaka('tepe-aksam', { d: 1, parilti: 0.5, su: 0.8, ruzgar: 0.08 });
      isima(1500, 420, 300, [1, 0.7, 0.4], 0.14);
      kanatlar(t, a, GOBEK_A, 72, 40);
    }

    /* ——— perde: kesmelerde kısa bir an lacivert (kâğıt bölümünde krem) karartma ——— */
    var LACI = [0.07, 0.11, 0.3], KREM = [1, 1, 1];
    var PERDE = [[KES.mutfak], [KES.tepe2], [KES.iskele], [KES.ev], [KES.kagit, KREM], [KES.iskele2, KREM], [KES.okul], [KES.aksam], [KES.kagit2, KREM], [KES.son, KREM]];
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
      [KES.mutfak, function (t, a) { tepe(t, a, false); }], [KES.tepe2, mutfak], [KES.iskele, function (t, a) { tepe(t, a, true); }],
      [KES.ev, function (t, a) { iskele(t, a, false); }], [KES.kagit, ev], [KES.iskele2, kagit], [KES.okul, function (t, a) { iskele(t, a, true); }],
      [KES.aksam, okul], [KES.kagit2, aksamMutfak], [KES.son, kagit], [Infinity, kapanis]
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
      // gayb ve Allahü teâlâdan söz edilen kâğıt bölümlerinde yazı sahnenin kendisidir; altyazı ve dokunma oyunu yoktur
      altyazisiz: function (t) { return kagitYazisi || (t >= KES.kagit && t < KES.iskele2) || (t >= KES.kagit2 && t < KES.son); },
      // Peygamber efendimizin adı anılırken oyun yoktur
      dokun: function () {
        var t = api.t();
        if (t >= AN[36] - 0.2 && t < AN[37]) return true;
        return false;
      }
    };
  };
})();
