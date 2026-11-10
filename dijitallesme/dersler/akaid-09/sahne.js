/* Akaid 9 · Peygamberler Kimdir? — sahne: "Yaşayan Minyatür", Doğu Karadeniz'de bir yayla; bir yaz günü.
   Ders tek sahnede dönmez: sabah yaylasından dereye inilir; dönüşte ormandaki çatal patikada sis vadiden yükselip her yeri yutar,
   çocuk ipuçlarını dener (durak 1); dedenin sesi sağdaki yoldan gelir, sis o yolda aralanır; dedenin evinde ocak yanar;
   bulutların üstünde aklın gördükleri ve tek başına bulamadıkları (durak 2); Allahü teâlâdan söz edilen bölümde boya çekilir,
   kâğıt ve yazı kalır; öğle yaylasında peygamberlerin sayısı akar, serender yanında durak 3; akşam yaylasında ufuk boyunca uzanan
   bir zaman çizgisi (sır); sırttaki dağ yolunda görevler: mektup, yol taşları, çit, ayak izleri (durak 4); ertesi gün dere kenarında
   meyve suyu kutusu ve ambalaj (durak 5), sonra torbaya girer; akşam yaylasında sırrın büyük sorusu (durak 6), sır kâğıtta çözülür;
   dedenin evinde ocak başında: peygamberlerin hepsine inanırız;
   ders akşam yaylasında, kamera uzaklaşırken biter. Her olay anlatıcının kelimesine bağlıdır (t); a ortam saatidir.
   Yön: yaylaya bakış kuzeye, doğu sağda; sabah ışığı sağdan, akşam ışığı soldan. Sis vadiden yamaca doğru yükselir.
   Fizik: sisin içinde uzak ağaçlar önce solar, yakındakiler görünür kalır; ses kaynağından halka halka yayılır;
   dere hep aşağı akar; nemli hava yamaçta yükselip soğuyunca damlacığa döner.
   İnsan figürü, yüz, el yoktur; hiçbir peygamber tasvir edilmez. Allahü teâlâ için hiçbir şekil, ışık ya da sembol kullanılmaz.
   Peygamberlerin adları anılırken sahnede dokunma oyunu yoktur. */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-09'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['yayla-sabah', 'yayla-aksam', 'dere', 'patika', 'ev-ic', 'sis-denizi', 'yayla-yol', 'kagit',
      'mektup', 'kus', 'meyve-kutusu', 'ambalaj', 'torba'];
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
    var DUZ = { x: 800, y: 450, z: 1 };   // durak açıkken kamera: dokunma noktaları sahne noktasıyla çakışır

    /* ——— anlatıcıya bağlı anlar ——— */
    var D = {}; ['sis', 'haber', 'secilme', 'gorev', 'ornek', 'sir'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {}; for (var n0 = 0; n0 <= 71; n0++) AN[n0] = C(n0);
    var W = {
      sis: kel('sis'), bembeyaz: kel('bembeyaz'), ikiye: kel('ikiye'), sesi: kel('sesi'), sagdaki: kel('sağdaki'),
      sisin2: kel('sisin', 2), emredildi: kel('emredildi'), ibadet: kel('ibadet'), olumden: kel('ölümden'), haber1: kel('haber'),
      yuz: kel('yüz'), binden: kel('binden'), binlerce: kel('binlerce'), gormedi: kel('görmedi'), ayniydi: kel('aynıydı'),
      sakindirdilar: kel('sakındırdılar'), izinden: kel('izinden'), alay: kel('alay'), korkmadan: kel('korkmadan'),
      kutun: kel('kutun'), atti: kel('attı'), yaparsan: kel('yaparsan'), senden: kel('senden')
    };
    // bölümler arası kesmeler (cümle başlarına düşer). Durak 4'ten sonraki cümle kayıtta duraktan hemen sonra başladığı için
    // dere kesmesi duraktan 0,35 sn sonradır: perde açık durağın üstüne düşmez.
    var KES = {
      dere: AN[4] - 0.1, patika: AN[5] - 0.1, ev: AN[15] - 0.1, deniz: AN[16] - 0.1, kagit: AN[26] - 0.3, sayi: AN[33] - 0.1,
      sir: AN[40] - 0.1, gorev: AN[46] - 0.1, ornek: D.gorev + 0.35, sirCoz: AN[62] - 0.1, kagit2: AN[65] - 0.3,
      inan: AN[68], son: AN[70] - 0.2
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
      ['Karadeniz yaylası', 'etiket', 800, 96, AN[1], AN[3] - 0.1],
      ['yol ikiye ayrıldı', 'etiket', 800, 96, W.ikiye - 0.2, D.sis - 0.6],
      ['yolu bilen, doğru söyleyen', 'etiket', 800, 96, AN[11] + 1.2, AN[12] - 0.1],
      ['aklımız çok iş görür', 'etiket', 800, 96, AN[17], W.sisin2 - 0.3],
      ['nemli hava yükselir, soğur: sis olur', 'etiket', 800, 96, W.sisin2 - 0.2, AN[19] - 0.1],
      ['ama tek başına bulamaz', 'etiket', 800, 96, AN[19], AN[20] - 0.1],
      ['ancak bir haber gelirse', 'etiket', 800, 96, AN[23], D.haber - 0.6],
      ['?', 'sor', 380, 330, W.emredildi - 0.2, D.haber - 0.4],
      ['emir ve yasak', 'etiket', 380, 450, W.emredildi - 0.2, D.haber - 0.4],
      ['?', 'sor', 800, 260, W.ibadet - 0.2, D.haber - 0.4],
      ['ibadet', 'etiket', 800, 380, W.ibadet - 0.2, D.haber - 0.4],
      ['?', 'sor', 1220, 330, W.olumden - 0.2, D.haber - 0.4],
      ['ölümden sonra', 'etiket', 1220, 450, W.olumden - 0.2, D.haber - 0.4],
      ['Allahü teâlâ çok merhametlidir.', 'kagit', 800, 300, AN[26], AN[28] - 0.4],
      ['Emirlerini ve yasaklarını duymayan insan kalmasın diye peygamberler gönderdi.', 'kagit', 800, 530, AN[27], AN[28] - 0.4],
      ['Peygamber, haber getiren demektir.', 'kagit iri', 800, 300, AN[28], AN[30] - 0.4],
      ['Peygamberler, Allahü teâlânın bildirdiklerini insanlara haber verdi.', 'kagit', 800, 540, AN[29], AN[30] - 0.4],
      ['Peygamberlik çalışarak kazanılmaz.', 'kagit', 800, 250, AN[30], KES.sayi - 0.4],
      ['Allahü teâlâ, dilediği kulunu seçer.', 'kagit', 800, 430, AN[31], KES.sayi - 0.4],
      ['Peygamberler insanlar arasından seçildi.', 'kagit', 800, 610, AN[32], KES.sayi - 0.4],
      ['İlk peygamber: Âdem aleyhisselâm', 'etiket', 800, 96, AN[36], AN[37] - 0.1],
      ['Son peygamber: Muhammed sallallahü aleyhi ve sellem', 'etiket', 800, 96, AN[37], D.secilme - 0.6],
      ['Âdem aleyhisselâm', 'kucuk', 300, 236, AN[41] + 0.3, AN[43] + 0.6],
      ['Resûlullah sallallahü aleyhi ve sellem', 'kucuk', 1150, 236, AN[41] + 2.2, AN[43] + 0.6],
      ['binlerce yıl', 'etiket', 800, 96, W.binlerce - 0.1, AN[42] + 1.2],
      ['?', 'sor', 800, 420, AN[44], KES.gorev - 0.3],
      ['Cevabı dersin sonunda', 'etiket', 800, 96, AN[45], KES.gorev - 0.2],
      ['emirleri değiştirmeden bildirdiler', 'etiket', 800, 96, AN[47], AN[48] - 0.1],
      ['doğru yolu gösterdiler', 'etiket', 800, 96, AN[48], W.sakindirdilar - 0.3],
      ['kötülükten sakındırdılar', 'etiket', 800, 96, W.sakindirdilar - 0.2, AN[50] - 0.1],
      ['önce kendileri yaptılar', 'etiket', 800, 96, AN[50], AN[52] - 0.1],
      ['korkmadan anlattılar', 'etiket', 800, 96, W.korkmadan - 0.2, D.gorev - 0.6],
      ['?', 'sor', 800, 420, AN[63], KES.kagit2 - 0.3],
      ['Çünkü peygamberler kendi sözlerini söylemedi.', 'kagit', 800, 250, AN[65], KES.inan - 0.4],
      ['Hepsine bildiren, Allahü teâlâ idi.', 'kagit', 800, 430, AN[66], KES.inan - 0.4],
      ['Onun için hepsi aynı imanı bildirdi: Bir olan Allahü teâlâya inanmayı.', 'kagit', 800, 630, AN[67], KES.inan - 0.4],
      ['hepsine inanırız', 'etiket', 800, 96, AN[68], KES.son - 0.2],
      ['Gelecek ders: İnsanlara rehber peygamberler', 'etiket', 800, 110, AN[70] + 0.2, AN[71] + 0.9]
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
    // peygamberlerin sayısı: sayı "yüz yirmi dört binden çok" boyunca akar, sonra "'den çok" eklenir
    var SAYI = yazi('0', 'sayi', 800, 230), sayiSon = '';
    function sayiYaz(t) {
      var o = pencere(t, W.yuz - 0.3, AN[36] - 0.2, 0.3, 0.5);
      if (o > 0.003) {
        var k = Y.ikili(ic(t, W.yuz - 0.1, W.binden + 0.3 - W.yuz));
        var m = (Math.round(124000 * k / 1000) * 1000).toLocaleString('tr-TR') + (t > W.binden + 0.35 ? '\'den çok' : '');
        if (m !== sayiSon) { SAYI.textContent = m; sayiSon = m; }
      }
      gos(SAYI, o);
    }

    /* ——— SVG ——— */
    var defs = E2('defs', {}, svg);
    var dg = E2('linearGradient', { id: 'kd9-cerceve', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    [['0', '#f3d584'], ['1', '#c9972f']].forEach(function (d) { E2('stop', { offset: d[0], 'stop-color': d[1] }, dg); });
    function yol(oz) { var p = E2('path', Object.assign({ d: 'M0 0', fill: 'none' }, oz || {}), svg); p.style.opacity = 0; p._o = 0; return p; }
    function gizle(p) { if (p._o !== 0) { p.style.opacity = 0; p._o = 0; } }
    function goster(p, d, o) { if (o <= 0.003) { gizle(p); return; } p.setAttribute('d', d); p.style.opacity = o; p._o = o; }
    function f1(x) { return x.toFixed(1); }
    function daire(cx, cy, r) { return 'M' + f1(cx - r) + ' ' + f1(cy) + ' a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(2 * r) + ' 0 a' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(-2 * r) + ' 0Z'; }
    function elips(cx, cy, rx, ry) { return 'M' + f1(cx - rx) + ' ' + f1(cy) + ' a' + f1(rx) + ' ' + f1(ry) + ' 0 1 0 ' + f1(2 * rx) + ' 0 a' + f1(rx) + ' ' + f1(ry) + ' 0 1 0 ' + f1(-2 * rx) + ' 0Z'; }
    var halkalar = [0, 1, 2, 3, 4, 5, 6, 7].map(function () { return yol({ stroke: '#ffe29a', 'stroke-width': 4 }); });
    var dalgalar = [0, 1, 2, 3, 4, 5].map(function () { return yol({ stroke: 'rgba(255,248,226,0.95)', 'stroke-width': 3 }); });
    var madalyon = [yol({ stroke: 'url(#kd9-cerceve)', 'stroke-width': 6 })];
    var oklar = [0, 1, 2].map(function () { return yol({ stroke: 'rgba(255,255,255,0.92)', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); });
    var zamanCizgi = yol({ stroke: '#fff3d6', 'stroke-width': 4, 'stroke-linecap': 'round' });
    var centik = yol({ stroke: 'rgba(255,248,230,0.85)', 'stroke-width': 3, 'stroke-linecap': 'round' });
    var centikAltin = yol({ stroke: '#f3d584', 'stroke-width': 3.5, 'stroke-linecap': 'round' });
    var izYolu = yol({ stroke: 'rgba(255,226,154,0.9)', 'stroke-width': 5, 'stroke-dasharray': '2 16', 'stroke-linecap': 'round' });
    var SVG_HEPSI = [].concat(halkalar, dalgalar, madalyon, oklar, [zamanCizgi, centik, centikAltin, izYolu]);
    var kullanildi = [];
    function kullan(p) { kullanildi.push(p); }

    /* ——— ortak yardımcılar ——— */
    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    function ekranR(x, y, r) { var e = T.ekran(x, y, 1), e2 = T.ekran(x + r, y, 1); return { x: e.x, y: e.y, r: e2.x - e.x }; }
    function isima(x, y, r, renk, o) { var s = ekranR(x, y, r); T.iz(s.x, s.y, s.r, s.r, 0, renk[0], renk[1], renk[2], o); T.izBitir(); }
    function halka(i, x, y, r, o) { goster(halkalar[i], daire(x, y, r), o); kullan(halkalar[i]); }
    function dunyaHalka(i, x, y, r, o) { var e = ekranR(x, y, r); halka(i, e.x, e.y, e.r, o); }
    function madalyonCiz(x, y, r, o, icerik) {
      var e = ekranR(x, y, r);
      goster(madalyon[0], daire(e.x, e.y, e.r), o); kullan(madalyon[0]);
      if (o <= 0.01) return;
      T.ciz('kagit', { x: x, y: y, g: r * 2, h: r * 2, d: 1, o: o, kure: { duz: true, isik: 0 }, carp: [0.12, 0.17, 0.4] });
      icerik(o);
    }
    // ses dalgası: kaynaktan yayılan halkalar (dünya noktası)
    function dalga(ilk, adet, x, y, a, hiz, menzil, o, yassi) {
      for (var i = 0; i < adet; i++) {
        var f = ((a * hiz + i / adet) % 1), e = ekranR(x, y, f * menzil), oo = o * (1 - f) * (1 - f);
        goster(dalgalar[ilk + i], yassi ? elips(e.x, e.y, Math.max(1, e.r), Math.max(1, e.r * yassi)) : daire(e.x, e.y, Math.max(1, e.r)), oo); kullan(dalgalar[ilk + i]);
      }
    }
    // duman: bacadan kıvrılarak yükselir, rüzgârla hafifçe sola yatar
    function duman(x, y, a, o, boy) {
      if (o <= 0.01) return;
      var s = ekranR(800, 450, 1).r;
      for (var j = 0; j < 12; j++) {
        var f = (a * 0.22 + j / 12) % 1, e = T.ekran(x + Math.sin(f * 7 + a * 0.8) * 8 * f - f * f * 40, y - f * (boy || 150), 1), r = (3 + f * 16) * s;
        T.iz(e.x, e.y, r, r, 0, 0.9, 0.9, 0.92, 0.22 * (1 - f) * o);
      }
      T.izBitir();
    }
    // sis: geniş bir perde ve rüzgârla kayan yumuşak lekeler; uzak (yukarıdaki) lekeler koyu, yakındakiler ince.
    // yolAc: sağdaki yolun boyunca sis aralanır. itki: rüzgâr ipucunda sis bir yana itilip geri gelir.
    var SAG_YOL = [P(800, 640), P(1100, 520), P(1430, 320)];
    function yolMesafe(x, y) {
      var en = 1e9;
      for (var i = 0; i < SAG_YOL.length - 1; i++) {
        var p = SAG_YOL[i], q = SAG_YOL[i + 1], dx = q[0] - p[0], dy = q[1] - p[1];
        var u = Math.max(0, Math.min(1, ((x - p[0]) * dx + (y - p[1]) * dy) / (dx * dx + dy * dy)));
        en = Math.min(en, Math.hypot(x - p[0] - u * dx, y - p[1] - u * dy));
      }
      return en;
    }
    function sis(a, yog, yukseklik, yolAc, itki) {
      if (yog <= 0.01) return;
      // uzak orman (sahnenin üst yarısı) silinir; yakındaki yol, çatal ve ipuçları görünür kalır
      var s0 = ekranR(800, 450, 1).r, e0 = T.ekran(800, 230, 1);
      T.iz(e0.x, e0.y, 1250 * s0, 330 * s0, 0, 0.9, 0.92, 0.94, 0.55 * yog * (1 - 0.4 * yolAc));
      T.iz(e0.x, e0.y + 120 * s0, 1500 * s0, 420 * s0, 0, 0.9, 0.92, 0.94, 0.16 * yog * (1 - 0.4 * yolAc));
      for (var i = 0; i < 44; i++) {
        var hz = 10 + hash(i, 3) * 20;
        var x = ((hash(i, 1) * 2100 + a * hz) % 2100) - 250 + itki * (0.6 + 0.4 * hash(i, 5));
        var y = 40 + hash(i, 2) * 620 + (1 - yukseklik) * 420;
        var r = 120 + hash(i, 4) * 190, yakin = ic(y, 300, 300);
        var o = (0.3 - 0.26 * yakin) * yog;
        if (yolAc > 0) o *= 1 - yolAc * (1 - ic(yolMesafe(x, y), 70, 240));
        var e = T.ekran(x, y, 1);
        T.iz(e.x, e.y, r * 1.45 * s0, r * s0, 0, 0.93, 0.94, 0.95, o);
      }
      T.izBitir();
    }

    /* ——— durak durumu ——— */
    var aNow = 0, dene = {}, dokunSu = null;
    function deneK(id, sure) { return dene[id] == null ? 0 : ic(aNow, dene[id], sure); }
    function deneVar(id, sure) { return dene[id] != null && aNow - dene[id] < sure; }

    /* ——— 0. Kanca: sabah yaylası; kamera evlerden patikaya, vadiye kayar ——— */
    var BACA1 = P(775, 385), BACA2 = P(1287, 352), SERENDER = P(1515, 545);
    function vadiSisi(a, o) {
      for (var i = 0; i < 12; i++) {
        var p = P(((hash(i, 21) * 420 + a * (6 + hash(i, 22) * 6)) % 460) - 60, 560 + hash(i, 23) * 230), e = T.ekran(p[0], p[1], 1), s = ekranR(800, 450, 1).r;
        T.iz(e.x, e.y, (110 + hash(i, 24) * 90) * s, (50 + hash(i, 25) * 30) * s, 0, 0.95, 0.96, 0.97, 0.22 * o);
      }
      T.izBitir();
    }
    function kanca(t, a) {
      T.bas(a, kameraYolu(t, [[0, { x: 1010, y: 430, z: 1.3 }], [AN[2], { x: 860, y: 470, z: 1.12 }], [AN[3], { x: 700, y: 500, z: 1.15 }], [KES.dere, { x: 430, y: 600, z: 1.4 }]]));
      plaka('yayla-sabah', { d: 1, parilti: 0.3, ruzgar: 0.06 });
      duman(BACA1[0], BACA1[1], a, 1); duman(BACA2[0], BACA2[1], a + 3, 1);
      vadiSisi(a, 1);
      isima(1640, 160, 360, [1, 0.88, 0.6], 0.12);
    }

    /* ——— 1. Dere: su getirmeye inilir ——— */
    function dere(t, a) {
      var k = tw(t, KES.dere, KES.patika - KES.dere, Y.sin);
      T.bas(a, { x: kr(700, 520, k), y: kr(520, 600, k), z: kr(1.12, 1.3, k) });
      plaka('dere', { d: 1, su: 1, parilti: 0.3, ruzgar: 0.05 });
      suDokun(a);
    }
    // anlatım sürerken suya dokunan çocuk halka halka dalga görür
    function suDokun(a) {
      if (!dokunSu || a - dokunSu.a > 1.6) return;
      for (var i = 0; i < 3; i++) {
        var f = ic(a, dokunSu.a + i * 0.25, 1.1), r = 10 + f * 120;
        if (f > 0 && f < 1) { goster(dalgalar[3 + i], elips(dokunSu.x, dokunSu.y, r, r * 0.35), 0.9 * (1 - f)); kullan(dalgalar[3 + i]); }
      }
    }

    /* ——— 2. Patika: sis çöker (durak 1), dedenin sesi sağdaki yoldan gelir ——— */
    var KUS = P(870, 607), DERE_P = P(180, 630), SAG_UZAK = P(1430, 320);
    var IZLER = [[700, 880], [650, 800], [610, 745], [565, 700], [505, 668], [450, 652], [380, 645], [300, 640]].map(function (p) { return P(p[0], p[1]); });
    function kusCiz(a) {
      // kızılgerdan kayada; dokununca sola, ormana uçar, biraz sonra yerine döner
      var x = KUS[0], y = KUS[1], o = 1, h = 72, r = 4 * Math.sin(a * 2.1);
      if (deneVar('kus', 4.2)) {
        var u = aNow - dene.kus, f = ic(u, 0, 1.6);
        if (u < 1.6) { x -= 560 * Y.gir(f) + 40 * f; y -= 330 * Y.cik(f); o = 1 - ic(u, 1.2, 0.4); h = 72 * (0.75 + 0.25 * Math.abs(Math.sin(a * 28))); r = -18; }
        else if (u < 3.4) o = 0;
        else o = ic(u, 3.4, 0.6);
      }
      if (o > 0.01) T.ciz('kus', { x: x, y: y + Math.abs(Math.sin(a * 1.3)) * -3, h: h * 1.25, ax: 0.5, ay: 1, d: 1, o: o, r: r });
    }
    function patika(t, a) {
      var acik = api.acikDurak() === 'sis';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.patika, { x: 900, y: 470, z: 1.2 }], [W.ikiye, { x: 800, y: 520, z: 1.16 }], [D.sis - 0.5, DUZ],
        [W.sagdaki, DUZ], [AN[14] + 0.4, { x: 1080, y: 440, z: 1.3 }], [KES.ev, { x: 1300, y: 360, z: 1.6 }]]));
      var itki = deneVar('ruzgar', 4) ? 280 * Y.sin(ic(aNow, dene.ruzgar, 1.4)) * (1 - ic(aNow, dene.ruzgar + 2.2, 1.6)) : 0;
      plaka('patika', { d: 1, ruzgar: 0.14 + (deneVar('ruzgar', 3.6) ? 0.55 * (1 - ic(aNow, dene.ruzgar + 1.6, 2)) : 0) });
      kusCiz(a);
      // sis vadiden yükselir; "bembeyaz"da en yoğun hâline gelir
      var yog = tw(t, W.sis - 0.4, W.bembeyaz + 0.9 - W.sis, Y.sin), yuk = tw(t, W.sis - 0.4, W.bembeyaz + 1.2 - W.sis, Y.cik);
      sis(a, yog, yuk, tw(t, W.sagdaki - 0.2, 2.4, Y.sin), itki);
      // ipuçları: ayak izleri ormana gider; dere sesi; kuşun ötüşü
      if (deneVar('iz', 4)) {
        IZLER.forEach(function (p, i) {
          var o = pencere(aNow - dene.iz, i * 0.22, 3.2, 0.25, 0.6);
          if (i < 6 && o > 0.01) dunyaHalka(i, p[0], p[1], 26, o);
        });
        var nok = IZLER.map(function (p) { var e = T.ekran(p[0], p[1], 1); return f1(e.x) + ' ' + f1(e.y); });
        goster(izYolu, 'M' + nok.join(' L'), 0.9 * pencere(aNow - dene.iz, 0.4, 3.4, 0.4, 0.6)); kullan(izYolu);
      }
      if (deneVar('dere', 3.6)) dalga(0, 3, DERE_P[0], DERE_P[1], aNow - dene.dere, 0.8, 150, 0.9 * (1 - ic(aNow, dene.dere + 2.6, 1)), 0.35);
      else if (acik && !deneVar('kus', 4.2)) dalga(0, 2, KUS[0] + 20, KUS[1] - 52, a, 0.5, 70, 0.55 * Math.max(0, Math.sin(a * 0.9)), 0);
      // dedenin sesi: sağdaki yolun ucundan halka halka gelir
      var sO = pencere(t, W.sesi - 0.2, AN[15], 0.4, 0.6);
      if (sO > 0.01) dalga(3, 3, SAG_UZAK[0], SAG_UZAK[1], a, 0.45, 430, 0.85 * sO, 0.55);
    }

    /* ——— 3. Dedenin evi: ocak yanar, pencerede sis ——— */
    var ATES = P(250, 700), PEN = [P(1290, 160), P(1570, 470)];
    function evIc(t, a, b) {
      var k = tw(t, b, 6, Y.sin);
      T.bas(a, { x: kr(560, 720, k), y: kr(520, 470, k), z: kr(1.3, 1.12, k) });
      plaka('ev-ic', { d: 1, parilti: 0.45 });
      var tit = 0.85 + 0.1 * Math.sin(a * 9) + 0.06 * Math.sin(a * 23);
      isima(ATES[0], ATES[1] - 30, 300, [1, 0.62, 0.25], 0.2 * tit);
      isima(ATES[0], ATES[1] - 10, 120, [1, 0.8, 0.4], 0.25 * tit);
      // kıvılcımlar yükselir
      for (var i = 0; i < 14; i++) {
        var f = (a * (0.5 + hash(i, 61) * 0.5) + hash(i, 62)) % 1, e = T.ekran(ATES[0] - 40 + hash(i, 63) * 80 + Math.sin(a * 3 + i) * 10 * f, ATES[1] - 20 - f * 150, 1);
        T.iz(e.x, e.y, 2.6, 2.6, 0, 1, 0.75, 0.3, 0.9 * (1 - f));
      }
      // pencerede sis kayar; çerçeveye taşmaz
      var w = PEN[1][0] - PEN[0][0], h = PEN[1][1] - PEN[0][1], s = ekranR(800, 450, 1).r;
      for (var j = 0; j < 10; j++) {
        var u = (hash(j, 71) + a * (0.012 + hash(j, 72) * 0.01)) % 1, x = PEN[0][0] + 45 + u * (w - 90), y = PEN[0][1] + 50 + hash(j, 73) * (h - 100);
        var e2 = T.ekran(x, y, 1); T.iz(e2.x, e2.y, 42 * s, 26 * s, 0, 0.97, 0.97, 0.98, 0.35 * Math.sin(Math.PI * u));
      }
      T.izBitir();
    }

    /* ——— 4. Bulutların üstü: akıl ve tek başına bulamadıkları (durak 2) ——— */
    var OKLAR = [[P(470, 640), P(600, 520), P(760, 430)], [P(880, 650), P(1010, 560), P(1150, 430)], [P(1260, 560), P(1330, 440), P(1400, 300)]];
    function bez(p, q, r, u) { var v = 1 - u; return [v * v * p[0] + 2 * v * u * q[0] + u * u * r[0], v * v * p[1] + 2 * v * u * q[1] + u * u * r[1]]; }
    function deniz(t, a) {
      var acik = api.acikDurak() === 'haber';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.deniz, { x: 800, y: 640, z: 1.3 }], [AN[18], { x: 900, y: 470, z: 1.12 }], [AN[20], DUZ], [D.haber, DUZ]]));
      plaka('sis-denizi', { d: 1, parilti: 0.3 });
      // bulut denizi yavaşça kayar
      var s = ekranR(800, 450, 1).r;
      for (var i = 0; i < 18; i++) {
        var p = P(((hash(i, 31) * 1900 - a * (5 + hash(i, 32) * 6)) % 1900 + 1900) % 1900 - 120, 600 + hash(i, 33) * 320), e = T.ekran(p[0], p[1], 1);
        T.iz(e.x, e.y, (160 + hash(i, 34) * 120) * s, (40 + hash(i, 35) * 26) * s, 0, 1, 1, 1, 0.16);
      }
      T.izBitir();
      // "sisin neden çöktüğünü": nemli hava denizden gelip yamaçta yükselir, soğuyup damlacığa döner
      var oO = pencere(t, W.sisin2 - 0.3, AN[19] + 0.6, 0.3, 0.5);
      OKLAR.forEach(function (b, i) {
        var f = Y.cik(ic(t, W.sisin2 - 0.2 + i * 0.25, 1.4)), n = 18, nok = [];
        if (oO <= 0.01 || f <= 0.01) { gizle(oklar[i]); return; }
        for (var j = 0; j <= n; j++) { var q = bez(b[0], b[1], b[2], f * j / n), e = T.ekran(q[0], q[1], 1); nok.push([e.x, e.y]); }
        var u = nok[nok.length - 1], v = nok[nok.length - 2], aci = Math.atan2(u[1] - v[1], u[0] - v[0]), L = 22;
        var d = 'M' + nok.map(function (z) { return f1(z[0]) + ' ' + f1(z[1]); }).join(' L') +
          ' M' + f1(u[0] - L * Math.cos(aci - 0.5)) + ' ' + f1(u[1] - L * Math.sin(aci - 0.5)) + ' L' + f1(u[0]) + ' ' + f1(u[1]) +
          ' L' + f1(u[0] - L * Math.cos(aci + 0.5)) + ' ' + f1(u[1] - L * Math.sin(aci + 0.5));
        goster(oklar[i], d, 0.92 * oO); kullan(oklar[i]);
        // okun ucunda damlacıklar belirir
        if (f > 0.85) for (var k = 0; k < 7; k++) {
          var e3 = T.ekran(b[2][0] - 30 + hash(k + i * 7, 41) * 60, b[2][1] - 20 + hash(k + i * 7, 42) * 40, 1);
          T.iz(e3.x, e3.y, 5, 5, 0, 0.82, 0.92, 1, oO * ic(f, 0.85, 0.15));
        }
      });
      T.izBitir();
    }

    /* ——— 5. Kâğıt: Allahü teâlâdan söz edilen bölüm ——— */
    function kagit(t, a) { T.bas(a, DUZ); plaka('kagit', { d: 0 }); }

    /* ——— 6. Öğle yaylası: peygamberlerin sayısı; serender yanında durak 3 ——— */
    function sayi(t, a) {
      var acik = api.acikDurak() === 'secilme';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.sayi, { x: 820, y: 420, z: 1.18 }], [AN[36], { x: 800, y: 450, z: 1.04 }], [D.secilme - 0.4, DUZ]]));
      plaka('yayla-sabah', { d: 1, parilti: 0.35, ruzgar: 0.06, carp: [1.03, 1.03, 1.0] });
      duman(BACA1[0], BACA1[1], a, 0.8); duman(BACA2[0], BACA2[1], a + 3, 0.8);
      vadiSisi(a, 0.5);
    }

    /* ——— 7. Akşam yaylası: zaman çizgisi (sır ve sırrın çözümü) ——— */
    var PENCERELER = [[520, 412], [560, 412], [690, 470], [745, 470], [850, 565], [915, 565], [975, 425], [1035, 425], [1160, 585], [1235, 585], [1250, 425], [1320, 425]].map(function (p) { return P(p[0], p[1]); });
    var ZC = { x0: 240, x1: 1360, y: 170 };
    var CENTIK = []; for (var c0 = 0; c0 < 64; c0++) CENTIK.push({ x: ZC.x0 + 30 + hash(c0, 81) * (ZC.x1 - ZC.x0 - 60), h: 10 + hash(c0, 82) * 12, t: hash(c0, 83) });
    function aksamYayla(a, kam, o) {
      T.bas(a, kam);
      plaka('yayla-aksam', { d: 1, parilti: 0.5, ruzgar: 0.05 });
      duman(BACA1[0], BACA1[1], a, 1); duman(BACA2[0], BACA2[1], a + 3, 1);
      PENCERELER.forEach(function (p, i) { isima(p[0], p[1], 16, [1, 0.8, 0.4], (0.35 + 0.08 * Math.sin(a * 2 + i)) * (o == null ? 1 : o)); });
      vadiSisi(a, 0.8);
    }
    function zamanCiz(cizgi, centikK, altin) {
      if (cizgi <= 0.01) { return; }
      var x1 = kr(ZC.x0, ZC.x1, cizgi);
      goster(zamanCizgi, 'M' + ZC.x0 + ' ' + ZC.y + ' L' + f1(x1) + ' ' + ZC.y +
        ' M' + ZC.x0 + ' ' + (ZC.y - 22) + ' L' + ZC.x0 + ' ' + (ZC.y + 22) + (cizgi > 0.98 ? ' M' + ZC.x1 + ' ' + (ZC.y - 22) + ' L' + ZC.x1 + ' ' + (ZC.y + 22) : ''), 1);
      kullan(zamanCizgi);
      var d = '';
      CENTIK.forEach(function (c) { if (c.t < centikK && c.x < x1) d += 'M' + f1(c.x) + ' ' + f1(ZC.y - c.h) + ' L' + f1(c.x) + ' ' + f1(ZC.y + c.h) + ' '; });
      if (d) { goster(centik, d, 0.9); kullan(centik); goster(centikAltin, d, altin); kullan(centikAltin); }
    }
    function sir(t, a) {
      var k = tw(t, KES.sir, KES.gorev - KES.sir, Y.sin);
      aksamYayla(a, { x: kr(860, 780, k), y: kr(400, 460, k), z: kr(1.2, 1.06, k) });
      zamanCiz(tw(t, AN[41] + 0.1, 2.4, Y.ikili), tw(t, W.gormedi - 1.2, 1.6), tw(t, W.ayniydi - 0.3, 1));
    }
    function sirCoz(t, a) {
      // büyük soru (durak 6) bu bölümde açılır; kamera duraktan önce yerine oturur
      var k = tw(t, KES.sirCoz, D.sir - 0.4 - KES.sirCoz, Y.sin);
      aksamYayla(a, { x: kr(780, 800, k), y: kr(470, 450, k), z: kr(1.12, 1.02, k) });
      zamanCiz(1, 1, 0.9);
    }

    /* ——— 8. Sırttaki dağ yolu: görevler (durak 4 sahnede açılır) ——— */
    var TASLAR = [[P(290, 455), 95], [P(890, 350), 72], [P(1215, 215), 52]], CIT = P(1000, 560), MEKTUP = [560, 230];
    var IZ2 = [[225, 850], [375, 790], [505, 700], [640, 640], [740, 580], [815, 537]].map(function (p) { return P(p[0], p[1]); });
    function gorev(t, a) {
      var es = api.acikDurak() === 'gorev';
      var bulut = pencere(t, W.alay - 0.3, W.korkmadan + 0.3, 0.8, 1.2);
      T.bas(a, es ? DUZ : kameraYolu(t, [[KES.gorev, { x: 760, y: 520, z: 1.18 }], [AN[48], { x: 700, y: 480, z: 1.1 }], [W.sakindirdilar, { x: 940, y: 520, z: 1.14 }],
        [AN[50], { x: 640, y: 600, z: 1.16 }], [AN[52], { x: 800, y: 460, z: 1.04 }], [D.gorev - 0.5, DUZ]]));
      var kar = es ? 0.55 : 1 - 0.2 * bulut;
      plaka('yayla-yol', { d: 1, parilti: 0.3, ruzgar: 0.1 + 0.3 * bulut, carp: [kar, kar, kr(kar, 0.65, es ? 1 : 0)] });
      if (!es) isima(1500, 60, 340, [1, 0.92, 0.65], 0.14 * (1 - bulut));
      if (es) return;
      // emirleri değiştirmeden bildirdiler: mühürlü mektup
      var mO = pencere(t, AN[47] - 0.1, D.gorev, 0.5, 0.3);
      madalyonCiz(MEKTUP[0], MEKTUP[1], 96 * kr(0.85, 1, mO), mO, function (oo) { T.ciz('mektup', { x: MEKTUP[0], y: MEKTUP[1], g: 140, d: 1, o: oo }); });
      // doğru yolu gösterdiler: yol taşları sırayla parlar
      TASLAR.forEach(function (s, i) { var o = pencere(t, AN[48] + i * 0.25, W.sakindirdilar - 0.2, 0.3, 0.4); if (o > 0.01) dunyaHalka(i, s[0][0], s[0][1], s[1], o); });
      // kötülükten sakındırdılar: uçurum kenarındaki çit
      var cO = pencere(t, W.sakindirdilar - 0.15, AN[50] - 0.1, 0.3, 0.4); if (cO > 0.01) dunyaHalka(3, CIT[0], CIT[1], 120, cO);
      // önce kendileri yaptılar, insanlar izlerinden gitti: izler sırayla parlar
      IZ2.forEach(function (p, i) { var o = pencere(t, AN[50] + 0.2 + i * 0.28, AN[52] - 0.1, 0.25, 0.4); if (o > 0.01) dunyaHalka(4 + (i % 4), p[0], p[1], 36, o); });
      // alay edenler, üzenler: kara bir bulut geçer; yol taşları yerinde durur
      if (bulut > 0.01) {
        var s = ekranR(800, 450, 1).r;
        for (var j = 0; j < 14; j++) {
          var x = -400 + (t - W.alay + 0.3) * 260 + hash(j, 91) * 900, y = 70 + hash(j, 92) * 170, e = T.ekran(x, y, 1);
          T.iz(e.x, e.y, (170 + hash(j, 93) * 130) * s, (75 + hash(j, 94) * 45) * s, 0, 0.28, 0.3, 0.36, 0.78 * bulut);
        }
        T.izBitir();
      }
    }

    /* ——— 9. Dere kenarı: meyve suyu kutusu ve ambalaj (durak 5), sonra torbaya girer ——— */
    var KUTU = P(690, 735), AMB = P(1290, 770), TORBA = P(1010, 735);
    function ucus(p, q, f, yukseklik) { return [kr(p[0], q[0], f), kr(p[1], q[1], f) - Math.sin(Math.PI * f) * yukseklik]; }
    function ornek(t, a) {
      var acik = api.acikDurak() === 'ornek';
      T.bas(a, acik ? DUZ : kameraYolu(t, [[KES.ornek, { x: 860, y: 640, z: 1.25 }], [W.atti, { x: 900, y: 620, z: 1.18 }], [D.ornek - 0.4, DUZ], [AN[60], DUZ], [KES.sirCoz, { x: 840, y: 600, z: 1.15 }]]));
      plaka('dere', { d: 1, su: 1, parilti: 0.3, ruzgar: 0.05 });
      suDokun(a);
      var tO = tw(t, W.yaparsan - 0.5, 0.5);
      if (tO > 0.01) {
        var ts = ekranR(TORBA[0], TORBA[1], 70); T.iz(ts.x, ts.y - 4, ts.r, ts.r * 0.22, 0, 0.15, 0.15, 0.18, 0.35 * tO); T.izBitir();
        T.ciz('torba', { x: TORBA[0], y: TORBA[1], h: 160 * kr(0.6, 1, tO), ax: 0.5, ay: 1, d: 1, o: tO });
      }
      // kutu: önce kendi kutun torbaya
      var kf = ic(t, W.yaparsan - 0.1, 1.0), kp = ucus(KUTU, [TORBA[0], TORBA[1] - 110], Y.ikili(kf), 140);
      if (kf < 1) T.ciz('meyve-kutusu', { x: kp[0], y: kp[1], h: 128 * kr(1, 0.6, kf), ax: 0.5, ay: 1, d: 1, r: 200 * kf, o: 1 - ic(kf, 0.85, 0.15) });
      // ambalaj: arkadaşın atar; sonra o da toplar
      var af = ic(t, W.atti - 0.4, 0.9), ag = ic(t, W.senden - 0.1, 1.0);
      if (af > 0 && ag < 1) {
        var ap = af < 1 ? ucus([1420, 330], AMB, af, 60) : ucus(AMB, [TORBA[0], TORBA[1] - 110], Y.ikili(ag), 160);
        T.ciz('ambalaj', { x: ap[0], y: ap[1], g: 140, ax: 0.5, ay: 0.8, d: 1, r: af < 1 ? 300 * af : 8 * Math.sin(a * 2) + 160 * ag, o: 1 - ic(ag, 0.85, 0.15) });
      }
    }

    /* ——— 10. Dedenin evi, akşam: peygamberlerin hepsine inanırız ——— */
    function inan(t, a) { evIc(t, a, KES.inan); }

    /* ——— 11. Kapanış: akşam yaylası, kamera uzaklaşır ——— */
    function kapanis(t, a) {
      var k = tw(t, KES.son, 6, Y.sin);
      aksamYayla(a, { x: kr(760, 800, k), y: kr(520, 450, k), z: kr(1.4, 1.02, k) });
    }

    /* ——— perde: kesmelerde kısa bir an lacivert (kâğıt bölümünde krem) karartma ——— */
    var LACI = [0.07, 0.11, 0.3], KREM = [1, 1, 1];
    var PERDE = [[KES.dere], [KES.patika], [KES.ev], [KES.deniz], [KES.kagit, KREM], [KES.sayi, KREM], [KES.sir], [KES.gorev], [KES.ornek],
      [KES.sirCoz], [KES.kagit2, KREM], [KES.inan, KREM], [KES.son]];
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
      [KES.dere, kanca], [KES.patika, dere], [KES.ev, patika], [KES.deniz, function (t, a) { evIc(t, a, KES.ev); }], [KES.kagit, deniz],
      [KES.sayi, kagit], [KES.sir, sayi], [KES.gorev, sir], [KES.ornek, gorev], [KES.sirCoz, ornek], [KES.kagit2, sirCoz],
      [KES.inan, kagit], [KES.son, inan], [Infinity, kapanis]
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
      // Allahü teâlâdan söz edilen kâğıt bölümlerinde yazı sahnenin kendisidir; altyazı ve dokunma oyunu yoktur
      altyazisiz: function (t) { return kagitYazisi || (t >= KES.kagit && t < KES.sayi) || (t >= KES.kagit2 && t < KES.inan); },
      // peygamberlerin adları anılırken oyun yoktur; derede suya dokunan çocuk dalga görür
      dokun: function (x, y, a) {
        var t = api.t();
        if ((t >= AN[36] - 0.2 && t < AN[39]) || (t >= AN[41] - 0.2 && t < AN[42])) return true;
        if ((t >= KES.dere && t < KES.patika) || (t >= KES.ornek && t < KES.sirCoz)) { dokunSu = { x: x, y: y, a: a }; return true; }
        return false;
      },
      durak: function (id, olay, veri) {
        if (id === 'sis' && olay === 'dene') dene[veri] = aNow;
        if (id === 'sis' && olay === 'ac') dene = {};
      }
    };
  };
})();
