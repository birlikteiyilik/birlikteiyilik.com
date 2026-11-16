/* Akaid 3 · Gökyüzünün Düzeni — sahne: "Yaşayan Minyatür", bozkırda bir kervansaray, tek bir gece.
   Ders tek sahnede dönmez: kanca bardağın yakın planıyla açılır, kervansaraya yükselinir, damdaki küreden
   uzaya girilir, yıldızlar Kutup Yıldızı çevresinde döner, Ay damın ardından doğar, yörüngede yıl geçer,
   kamera Güneş sisteminden yıldız kümelerine geri çekilir; Allahü teâlâdan söz edilen bölümde boya çekilir,
   kâğıt ve yazı kalır; ders tan ağarırken biter. Her olay anlatıcının kelimesine bağlıdır (t); a ortam saatidir.
   Dünya her yerde kendi ekseninde dönen bir küredir (kd-tuval "kure"): kervansaray noktası haritaya yapışıktır,
   Dünya dönünce onunla birlikte geceye geçer. Ay'ın hâlleri Ay'ın kendi resmi Güneş yönünden aydınlanarak çizilir.
   İnsan figürü yoktur. Güneş'te ve Ay'da yüz yoktur. Hilâl ile yıldız yan yana çizilmez. */
(function () {
  'use strict';
  var DO = window.DO;

  /* ——— Dünya'nın yılı: yörünge geometrisi (saf işlevler; test sahnesiz çalıştırır) ———
     Yıl tek bir elips üzerindedir. f yıl kesri: 0 ocak (sol uç), 0,25 nisan (ön), 0,5 temmuz (sağ uç), 0,75 ekim (arka).
     Yukarıdan bakınca saat yönünün tersine ilerler: sol → ön → sağ → arka. Durak değeri v (0-100): 50 nisan,
     25 ocak, 75 temmuz; 0 ve 100 aynı yerdir (ekim, arka), yani çocuk bütün yılı yürüyebilir.
     Yörünge neredeyse dairedir: Güneş merkezden 8 px kayıktır, ocak-temmuz uzaklık farkı %3 (gerçek: %3,4). */
  var YOR = { x: 830, y: 455, rx: 520, ry: 165 };
  var GUNES_YOR = { x: 822, y: 455, r: 105 };
  function yilKonum(f) { var q = Math.PI - 2 * Math.PI * f; return { x: YOR.x + YOR.rx * Math.cos(q), y: YOR.y + YOR.ry * Math.sin(q), q: q }; }
  function yilDegeri(v) { return 0.25 + (v - 50) / 100; }
  // Küre ışığı: Güneş ekranda hangi yandaysa ışık oradan gelir; terminatör Güneş yönüne dik, aydınlık yarı Güneş'e bakar
  function gunesIsigi(p, g) { var dx = g.x - p.x, dy = -(g.y - p.y), b = Math.hypot(dx, dy) || 1; return [dx / b, dy / b, 0]; }
  // Teğet sürükleme: parmağın yörüngeye teğet hareketi yılı ilerletir. Tutulan yerden başlar (tutuş kaydı bas'a yazılır),
  // sıçrama ve yapışma yoktur; uçlarda (ekim) durur.
  function yorungeTut(bas, x, y) {
    if (bas.v == null) { bas.v = bas.deger; bas.px = bas.x; bas.py = bas.y; }
    var dx = x - bas.px, dy = y - bas.py, q = Math.PI - 2 * Math.PI * yilDegeri(bas.v);
    bas.px = x; bas.py = y;
    var tx = YOR.rx * Math.sin(q), ty = -YOR.ry * Math.cos(q), t2 = tx * tx + ty * ty;
    bas.v = Math.min(100, Math.max(0, bas.v + 100 * (dx * tx + dy * ty) / (2 * Math.PI * t2)));
    return bas.v;
  }
  // Öğle Güneşi'nin yüksekliği (radyan, 39° K): ocakta alçak, temmuzda yüksek
  function gunesYuksek(f) { return 0.89 - 0.41 * Math.cos(2 * Math.PI * (f + 0.03)); }
  var AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var MEVSIMLER = ['kış', 'kış', 'ilkbahar', 'ilkbahar', 'ilkbahar', 'yaz', 'yaz', 'yaz', 'sonbahar', 'sonbahar', 'sonbahar', 'kış'];
  function ayAdi(f) { return ((Math.floor((((f % 1) + 1) % 1) * 12 + 1e-6)) % 12 + 12) % 12; }

  DO.KodDersSahne['akaid-03'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var kureNokta = DO.KdTuval.kureNokta;
    var GORSELLER = ['aksam-gok', 'gece-gok', 'tan-gok', 'gun-gok', 'kis-gok', 'kervansaray', 'kervansaray-gece', 'dam', 'bardak', 'ucak',
      'dunya-harita', 'dunya', 'gunes', 'ay', 'ay-buyuyen', 'ay-kuculen', 'uzay', 'kagit', 'kervan', 'araba', 'kalem', 'gezegen-1', 'gezegen-2', 'gezegen-3', 'gezegen-4', 'gezegen-5', 'gezegen-6', 'gezegen-7', 'gezegen-8'];
    var liste = {};
    GORSELLER.forEach(function (a) { liste[a] = api.yol('gorsel/' + a + '.webp'); });
    var hazir = T.yukle(liste, api.yukleniyor);

    /* ——— zaman ve yumuşatma ——— */
    function ic(t, a, d) { return Math.min(1, Math.max(0, (t - a) / (d || 1))); }
    var Y = {
      cik: function (x) { var u = 1 - x; return 1 - u * u * u; },
      gir: function (x) { return x * x * x; },
      ikili: function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
      sin: function (x) { return 0.5 - 0.5 * Math.cos(Math.PI * x); },
      geri: function (x) { var c = 1.70158, u = x - 1; return 1 + (c + 1) * u * u * u + c * u * u; }
    };
    function tw(t, a, d, e) { return (e || Y.cik)(ic(t, a, d)); }
    function kr(a, b, k) { return a + (b - a) * k; }
    function pencere(t, a, b, g, c) { return Math.min(tw(t, a, g || 0.4), 1 - tw(t, b, c || 0.4)); }
    function hash(i, s) { var x = Math.sin(i * 127.1 + (s || 0) * 311.7) * 43758.5453; return x - Math.floor(x); }
    function sinirla(x, a, b) { return Math.min(b, Math.max(a, x)); }

    /* ——— anlatıcıya bağlı anlar ——— */
    var D = {}; ['gece', 'donus', 'ayyolu', 'mevsim', 'olmasaydi', 'buyuk'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {
      donuyor: C(1), hiz: C(2), ucak: C(3), sac: C(4), su: C(5), coz: C(6), gel: C(7), han: C(8), aksam: C(9), once: C(10),
      kure: C(12), buKure: C(13), nokta: C(14), tut: C(15),
      gordun: C(17), sonmedi: C(18), donen: C(19), yuz: C(20), tur: C(21), namaz: C(22),
      yildiz: C(23), onlar: C(24), yine: C(25), kutup: C(26), kervan: C(27),
      ay: C(28), isik: C(29), yolu: C(30), farkli: C(31), ramazan: C(32), buyur: C(33),
      sasmaz: C(35), zor: C(36), kis: C(37), uzak: C(38), cogu: C(39), ocak: C(40), temmuz: C(41), sir: C(42), egik: C(43), bozmaz: C(44),
      dik: C(47), yatik: C(48), egiklik: C(49), uc: C(50), olmasa: C(51),
      bagli: C(53), geri: C(54), milyon: C(55), sekiz: C(56), kendiYol: C(57), sistem: C(58), ufacik: C(59),
      buyuk: C(60), akilli: C(61), geciktiremez: C(62), kim: C(63),
      gunesAy: C(64), geceGunduz: C(65), yaratan: C(66), hareket: C(67), ettiren: C(68), bakip: C(69),
      basta: C(70), hizli: C(71), hava: C(72), araba: C(73), sasmiyor: C(74), yolcu: C(75),
      uyu: C(76), uyandirmaz: C(77), sabah: C(78), biliyorsun: C(79), doner: C(80), gelecek: C(81), emanet: C(82)
    };
    AN.dDonus = kel('dönüşü'); AN.dEgik = kel('eğik', 2); AN.dAy = AN.olmasa - 0.9;
    // Bölüm içindeki kesmeler: hepsi bir cümle başına düşer, perde bu anlarda kısa bir an kararır
    var KES = {
      ayYol: AN.yolu - 0.1, hilal: AN.ramazan - 0.2, haller: AN.buyur - 0.2,
      arabaGir: AN.araba - 0.2, arabaCik: AN.sasmiyor - 0.1
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
      e.style.transform = 'translate(' + e._x + 'px,' + (e._y + (dy || 0)).toFixed(1) + 'px) translate(-50%,-50%)' + (s ? ' scale(' + s.toFixed(3) + ')' : '');
    }
    // [yazı, sınıf, x, y, başlangıç, bitiş]
    var AKIS = [
      ['?', 'sor', 1060, 360, AN.sac - 0.05, AN.coz + 1.2],     // bardağın yanında, bulutun üstüne binmez
      ['kervansaray: yolcuların hanı', 'etiket', 800, 96, AN.han + 0.6, AN.aksam],
      ['Güneş sönmedi.', 'etiket', 800, 96, AN.sonmedi, AN.donen - 0.1],
      ['Dönen bizdik.', 'etiket', 800, 96, AN.donen, AN.tur - 0.1],
      ['Bir tam tur, bir gün', 'etiket', 800, 96, AN.tur, AN.namaz + 1.6],
      ['Kuzeye dönüyoruz', 'etiket', 800, 96, AN.yildiz - 0.1, AN.onlar - 0.2],      // damdan güneye bakılıyordu; Kutup Yıldızı kuzeydedir
      ['Kutup Yıldızı: kuzey', 'etiket', 1180, 250, AN.kutup + 0.5, AN.ay - 0.2],
      ['Güneye döndük: doğu solda', 'etiket', 800, 96, AN.ay, AN.isik - 0.1],
      ['Işığı Güneş’ten', 'etiket', 400, 445, AN.isik + 0.8, KES.ayYol - 0.1],       // Ay'ın altında
      ['yaklaşık bir ay', 'etiket', 800, 96, AN.yolu + 1.6, AN.farkli - 0.1],
      ['Dünya’dan bakınca', 'etiket', 1340, 336, AN.farkli + 0.3, KES.hilal - 0.1],
      ['Ramazan: ince hilâl görülünce', 'etiket', 800, 96, AN.ramazan + 0.3, KES.haller - 0.1],
      ['bir ay boyunca', 'etiket', 800, 92, AN.buyur, D.ayyolu + 0.6],  // beş hâl bir gecenin değil, bir ayın gökyüzüdür
      ['önce büyür', 'etiket', 430, 132, AN.buyur, D.ayyolu + 0.6],     // durakta ipucu olarak kalır
      ['sonra küçülür', 'etiket', 1170, 132, AN.buyur + 1.1, D.ayyolu + 0.6],
      ['Kışın neden üşürüz?', 'etiket', 800, 96, AN.kis, AN.ocak - 0.1],
      ['Güneş uzaklaştığı için mi?', 'etiket', 800, 170, AN.uzak, AN.ocak - 0.1],
      ['ocak: biraz daha yakın', 'etiket', 330, 300, kel('ocak'), AN.sir],
      ['temmuz: biraz daha uzak', 'etiket', 1330, 300, AN.temmuz, AN.sir],
      ['Sır uzaklıkta değil, duruşta.', 'etiket', 800, 96, AN.sir + 0.4, AN.egik + 0.8],
      ['Işık dik gelince: yaz', 'etiket', 400, 96, AN.dik, AN.yatik - 0.1],     // Güneş sağ üstte, etiket ona binmesin
      ['Işık yatık gelince: kış', 'etiket', 400, 96, AN.yatik, AN.egiklik + 1.2],
      ['Dönüş', 'etiket', 470, 650, AN.dDonus, D.olmasaydi - 0.7],     // durakta motorun etiketleri gelir
      ['Eğik duruş', 'etiket', 800, 120, AN.dEgik, D.olmasaydi - 0.7],
      ['Ay', 'etiket', 1250, 420, AN.dAy, D.olmasaydi - 0.7],
      ['Hepsi birbirine bağlı.', 'etiket', 800, 96, AN.bagli, AN.geri],
      ['1.300.000', 'sayi', 1110, 380, AN.milyon + 0.8, AN.sekiz - 0.2],
      ['Dünya', 'etiket', 330, 530, AN.milyon + 0.8, AN.sekiz - 0.2],
      ['sekiz gezegen, sekiz yol', 'etiket', 800, 96, AN.sekiz + 0.4, AN.sistem - 0.1],
      ['pek çok sistemden yalnız biri', 'etiket', 800, 96, AN.sistem + 1.2, AN.ufacik - 0.1],
      ['Dünya burada', 'etiket', 818, 392, AN.ufacik + 0.4, AN.buyuk - 0.2],
      ['Geceyi bir dakika geciktirebilir mi?', 'etiket', 800, 96, AN.akilli + 1.2, AN.kim - 0.1],
      ['Güneş, Ay, yıldızlar. Gece ve gündüz, yaz ve kış.', 'kagit', 800, 330, AN.gunesAy, AN.hareket - 0.4],
      ['Bunların hepsini yaratan, Allahü teâlâdır.', 'kagit iri', 800, 540, AN.yaratan, AN.hareket - 0.4],
      ['Hiçbir şey kendiliğinden hareket edemez.', 'kagit', 800, 340, AN.hareket, AN.bakip - 0.4],
      ['Her şeyi hareket ettiren, Allahü teâlânın kudretidir.', 'kagit', 800, 540, AN.ettiren, AN.bakip - 0.4],
      ['Gökyüzüne bakıp düşünmek, boş bir iş değildir.', 'kagit', 800, 450, AN.bakip, AN.basta - 0.3],
      ['Hep birlikte gidiyoruz.', 'etiket', 800, 96, AN.hava + 1.2, KES.arabaGir - 0.1],
      ['Geceyi ve sabahı getiren: Dünya\'nın dönüşü.', 'etiket', 800, 96, AN.biliyorsun + 1.2, AN.doner - 0.4],
      // sır Allahü teâlâya bağlanarak kapanır: boya çekilir, kâğıt ve yazı kalır
      ['Dünya\'yı döndüren, geceyi ve sabahı getiren, Allahü teâlâdır.', 'kagit', 800, 450, AN.doner, AN.gelecek - 0.5],
      ['Gelecek ders: Yeryüzünün sırları', 'etiket', 800, 110, AN.gelecek + 0.2, AN.emanet + 0.9]
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
    var hiz = yazi('0', 'sayi', 800, 170), hizBirim = yazi('km/saat', 'kucuk', 800, 245);
    function yaziMetin(e, m) { if (e._m !== m) { e.textContent = m; e._m = m; } }
    var etMevsim = yazi('', 'etiket', 830, 76);
    // Ay'ın hâlleri bir ayın günlerine yazılır: beş hâl bir gecenin değil, bir ayın gökyüzüdür (durakta boş yuvalarınkini motor yazar)
    var GUNLER = ['3. gün', '7. gün', '15. gün', '22. gün', '26. gün'];
    var etGun = GUNLER.map(function (m, i) { return yazi(m, 'kucuk', [250, 525, 800, 1075, 1350][i], [400, 300, 260, 300, 400][i] + 92); });                        // yörüngede: hangi ay, hangi mevsim
    var etOlcek = yazi('ölçekli değil', 'kucuk', 1330, 690);
    // "olmasaydı" kanıtları: dönüş yoksa aylarca gece ve gündüz, eğiklik yoksa hava hep aynı, Ay yoksa gece daha karanlık
    var etOlmasa = [yazi('aylarca gece', 'etiket', 250, 540), yazi('aylarca gündüz', 'etiket', 1040, 540)];
    var etEksen = [yazi('Ocak', 'etiket', 250, 440), yazi('hava hep aynı', 'etiket', 250, 494)], etAy = yazi('gece daha karanlık', 'etiket', 1050, 400);

    /* ——— SVG: işaretler, yollar, eksen, ışınlar ——— */
    var defs = E2('defs', {}, svg);
    function grad(id, durak, yon) {
      var g = E2('linearGradient', Object.assign({ id: id, x1: '0', y1: '0', x2: '1', y2: '1' }, yon || {}), defs);
      durak.forEach(function (d) { E2('stop', { offset: d[0], 'stop-color': d[1] }, g); });
    }
    grad('kd3-demet', [['0', 'rgba(255,236,170,0.1)'], ['1', 'rgba(255,236,170,0.32)']], { x2: '0', y2: '1' });
    var hava = E2('radialGradient', { id: 'kd3-hava', cx: '0.5', cy: '0.55', r: '0.5' }, defs);
    [['0', 'rgba(190,235,255,0)'], ['0.72', 'rgba(190,235,255,0.06)'], ['0.94', 'rgba(205,240,255,0.32)'], ['1', 'rgba(220,245,255,0)']]
      .forEach(function (d) { E2('stop', { offset: d[0], 'stop-color': d[1] }, hava); });
    function yol(oz) { var p = E2('path', Object.assign({ d: 'M0 0', fill: 'none' }, oz || {}), svg); p.style.opacity = 0; p._o = 0; return p; }
    function gizle(p) { if (p._o !== 0) { p.style.opacity = 0; p._o = 0; } }
    function goster(p, d, o) { p.setAttribute('d', d); p.style.opacity = o; p._o = o; }
    var noktaIz = yol({ stroke: '#ffe29a', 'stroke-width': 3, 'stroke-dasharray': '2 9', 'stroke-linecap': 'round' });
    var noktaHale = yol({ fill: 'rgba(255,214,110,0.42)' }), nokta = yol({ fill: '#ffd76a', stroke: '#fff7dc', 'stroke-width': 3 });
    var yorunge = yol({ stroke: '#ffe29a', 'stroke-width': 3, 'stroke-dasharray': '6 10' });
    var eksen = yol({ stroke: '#ffe29a', 'stroke-width': 6, 'stroke-linecap': 'round' });
    var donusOku = yol({ stroke: '#ffe29a', 'stroke-width': 6, 'stroke-linecap': 'round' });
    var okUcu = yol({ fill: '#ffe29a' });
    var demet = yol({ fill: 'url(#kd3-demet)' });                       // ışık demetinin gövdesi
    var isinlar = [0, 1, 2, 3, 4, 5, 6].map(function () { return yol({ stroke: '#ffe08a', 'stroke-width': 5, 'stroke-linecap': 'round' }); });
    var isikHavuz = yol({ fill: 'rgba(255,214,110,1)', stroke: 'rgba(255,240,190,0.9)', 'stroke-width': 3 });
    var kubbe = yol({ fill: 'url(#kd3-hava)', stroke: 'rgba(225,246,255,0.55)', 'stroke-width': 3, 'stroke-dasharray': '3 10', 'stroke-linecap': 'round' });
    var iplikler = [0, 1, 2].map(function () { return yol({ stroke: '#ffe29a', 'stroke-width': 3 }); });
    var gezegenYol = [0, 1, 2, 3, 4, 5, 6, 7].map(function () { return yol({ stroke: 'rgba(255,226,154,0.55)', 'stroke-width': 2 }); });
    var cerceve = yol({ stroke: '#d9a93f', 'stroke-width': 6 });
    var halka = yol({ stroke: '#ffe29a', 'stroke-width': 4 });
    var SVG_HEPSI = [noktaIz, noktaHale, nokta, yorunge, eksen, donusOku, okUcu, demet, isikHavuz, kubbe, cerceve, halka].concat(isinlar, iplikler, gezegenYol);
    function daire(cx, cy, r) { return 'M' + (cx - r) + ' ' + cy + ' a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0 a' + r + ' ' + r + ' 0 1 0 ' + -2 * r + ' 0Z'; }
    function elips(cx, cy, rx, ry) { return 'M' + (cx - rx) + ' ' + cy + ' a' + rx + ' ' + ry + ' 0 1 0 ' + 2 * rx + ' 0 a' + rx + ' ' + ry + ' 0 1 0 ' + -2 * rx + ' 0Z'; }
    function f1(x) { return x.toFixed(1); }

    /* ——— ortak katmanlar ——— */
    var PG = 1696, PH = 954;
    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    // Dam tepsisindeki küre dam görselinin içinde boyalıdır (kâseye oturur). Yaklaşırken dersin kendi Dünya'sı
    // (aşağıdaki "dunya" gölgelendiricisi) tam boyalı kürenin üstünde belirir ve kamera ona iner.
    var KURE = { x: 800, y: 527, R: 82 }; KURE.fy = KURE.y + KURE.R * 0.97;
    var BARDAK = { x: 800, y: 700, g: 250 };
    var Z_F = 2.93;                                      // yaklaşmanın sonundaki kamera yakınlığı: küre uzaydaki Dünya'nın boyuna gelir
    function yildizlar(a, o, merkez, donme, pay, sol, sag, ust, donMerkezi) {
      if (o <= 0.01) return;
      var x0 = sol == null ? -20 : sol, x1 = sag == null ? 1620 : sag, y0 = ust == null ? -20 : ust;
      var mx = merkez ? merkez[0] : 1180, my = merkez ? merkez[1] : 170;
      for (var i = 0; i < 150; i++) {
        // kuzeye bakınca yıldızlar Kutup Yıldızı çevresinde saat yönünün tersine döner; güneye bakınca (donMerkezi) ufkun
        // altındaki güney kutbu çevresinde, soldan sağa (saat yönünde) akar
        var r = 40 + hash(i, 1) * 1250, f = hash(i, 2) * Math.PI * 2 - (donMerkezi ? 0 : (donme || 0));
        var x = mx + Math.cos(f) * r, y = my + Math.sin(f) * r * 0.82;
        if (donMerkezi && donme) {
          var rx0 = x - donMerkezi[0], ry0 = y - donMerkezi[1], cs = Math.cos(donme), sn = Math.sin(donme);
          x = donMerkezi[0] + rx0 * cs - ry0 * sn; y = donMerkezi[1] + rx0 * sn + ry0 * cs;
        }
        if (y > (pay || 640) || y < y0 || x < x0 || x > x1) continue;
        var p = 0.55 + 0.45 * Math.sin(a * (0.6 + hash(i, 3)) + i);
        T.iz(x, y, 2.4 + hash(i, 4) * 2.2, 2.4 + hash(i, 4) * 2.2, 0, 1, 0.94, 0.78, o * p);
      }
      T.izBitir();
    }
    // Kar: uzakta küçük ve yavaş, yakında iri ve hızlı taneler; hafif sağa sola savrulur
    function kar(a, o, ust, alt, sol, sag) {
      if (o <= 0.01) return;
      var u = ust || 0, h0 = (alt || 900) - u, s0 = sol == null ? -20 : sol, gen = (sag == null ? 1620 : sag) - s0, kucuk = gen < 800;
      for (var i = 0; i < 170; i++) {
        if (kucuk && i % 3) continue;                            // köşe penceresinde daha seyrek
        var yakin = i >= 110, hz = yakin ? 95 + hash(i, 5) * 50 : 38 + hash(i, 5) * 26, b = yakin ? 5.5 + hash(i, 7) * 4 : 2.2 + hash(i, 7) * 2;
        if (kucuk) { hz *= 0.4; b *= 0.55; }
        var y = u + ((a * hz + hash(i, 6) * h0) % h0);
        var x = s0 + 6 + hash(i, 8) * (gen - 12) + Math.sin(a * (0.6 + hash(i, 9)) + i) * (kucuk ? 4 : yakin ? 26 : 12);
        T.iz(x, y, b, b, 0, 1, 1, 1, (yakin ? 0.95 : 0.7) * o);
      }
      T.izBitir();
    }
    function ekranR(x, y, r, d) { var e = T.ekran(x, y, d), e2 = T.ekran(x + r, y, d); return { x: e.x, y: e.y, r: e2.x - e.x }; }
    // Dünya: kendi ekseninde dönen küre, çevresinde ince bir hava ışıması
    function dunya(cx, cy, R, k, o) {
      o = o || {};
      var d = o.d == null ? 1 : o.d, s = ekranR(cx, cy, R, d), op = o.o == null ? 1 : o.o;
      if (op <= 0.01) return;
      if (!o.gecis && o.hale !== false) { T.iz(s.x, s.y, s.r * 1.13, s.r * 1.13, 0, 0.45, 0.8, 1, 0.3 * op); T.izBitir(); }
      T.ciz('dunya-harita', { x: cx, y: cy, g: R * 2, d: d, o: op, parilti: 0.3, gecis: o.gecis, carp: o.carp,
        kure: { boylam: k.boylam || 0, egim: k.egim || 0, bakis: k.bakis || 0, gunes: k.gunes || [1, 0, 0], isik: k.isik == null ? 0.96 : k.isik, yedek: 'dunya' } });
    }
    // Tepsideki küre: temas gölgesi, küre ve yay. k: 0 akşam damı, 1 uzaydaki Dünya'nın ışığı (yaklaşmanın sonu)
    function tepsiKure(carp, k) {
      k = k || 0;
      var op = Math.max(0, Math.min(1, (k - 0.2) / 0.3));          // yaklaşmada boyalı kürenin yerini canlı Dünya alır
      if (op <= 0.01) return;
      dunya(KURE.x, KURE.y, KURE.R, { boylam: KER.bo, bakis: EV.bakis, gunes: [kr(0.78, 1, k), kr(0.25, 0, k), kr(0.57, 0, k)], isik: kr(0.55, 0.96, k) }, { carp: carp, hale: false, o: op });
    }
    // Ay: f 0 yeni, 0.25 ilk dördün, 0.5 dolunay, 0.75 son dördün; ya da açıkça verilen Güneş yönü
    function ayYon(f) { var a = 2 * Math.PI * f; return [Math.sin(a), 0, -Math.cos(a)]; }
    function ay(cx, cy, r, gunes, o, gece, d) {
      if (o <= 0.01) return;
      var kure = gunes ? { duz: true, gunes: gunes, isik: 1, gece: gece == null ? 0.22 : gece, yedek: 'ay' } : null;
      T.ciz('ay', { x: cx, y: cy, g: r * 2, h: r * 2, d: d == null ? 1 : d, o: o, parilti: 0.35, kure: kure });
    }
    function ayHal(cx, cy, r, f, o, gece, d) { ay(cx, cy, r, Math.abs(f - 0.5) < 0.02 ? null : ayYon(f), o, gece, d); }
    function isima(x, y, r, renk, o, d) { var s = ekranR(x, y, r, d == null ? 1 : d); T.iz(s.x, s.y, s.r, s.r, 0, renk[0], renk[1], renk[2], o); T.izBitir(); }

    /* ——— durak durumu ——— */
    var gv = 50, mv = 50, cikan = null, ayYer = {}, aSimdi = 0;
    // Kervansarayın haritadaki yeri (radyan): Anadolu, 39° K, 35° D
    var KER = { en: 0.68, bo: 0.61 };
    var EV = { x: 760, y: 420, r: KURE.R * Z_F, bakis: 0.32 };    // uzaydaki Dünya; Güneş sağda. Yaklaşmanın sonunda tepsideki küre tam bu boya ve yere gelir
    function lam(v) { return (v - 50) / 50 * 1.2; }             // noktanın ekrandaki boylamı: 0 gece (sol), 50 sabah çizgisi, 100 gündüz (sağ)
    function evKure(l) { return { boylam: KER.bo - l, bakis: EV.bakis, gunes: [1, 0, 0] }; }
    function noktaYer(v) { return kureNokta(EV.x, EV.y, EV.r, KER.en, KER.bo, evKure(lam(v))); }
    var EGIM = 0.41;                                      // Dünya'nın ekseni: 23° eğik (olmasaydı sahnesi: sağa yatık)
    // Yörüngede kuzey kutbu yıl boyu sola yatık durur: ocakta Güneş sağda kalır, kuzey Güneş'ten uzağa bakar
    // (ışık yatık, kış); temmuzda Güneş solda, kuzey Güneş'e bakar (ışık dik, yaz)
    var EGIM_YOR = -0.41;
    // eksenin kutuplardan dışarı taşan iki ucu (eksen kürenin içinden geçer, içi görünmez). kes: Dünya Güneş'in
    // arkasındaysa ucun Güneş'in önüne taşan parçası çizilmez
    function diskDisi(x0, y0, x1, y1, c) {
      var dx = x1 - x0, dy = y1 - y0, fx = x0 - c.x, fy = y0 - c.y, A = dx * dx + dy * dy, B = 2 * (fx * dx + fy * dy), D = B * B - 4 * A * (fx * fx + fy * fy - c.r * c.r);
      if (D <= 0) return [[x0, y0, x1, y1]];
      var s = Math.sqrt(D), u0 = (-B - s) / (2 * A), u1 = (-B + s) / (2 * A), o = [];
      if (u0 >= 1 || u1 <= 0) return [[x0, y0, x1, y1]];
      if (u0 > 0) o.push([x0, y0, x0 + dx * u0, y0 + dy * u0]);
      if (u1 < 1) o.push([x0 + dx * u1, y0 + dy * u1, x1, y1]);
      return o;
    }
    function eksenYol(cx, cy, R, e, uz, kes) {
      var sx = Math.sin(e), sy = -Math.cos(e), a = R * 1.02, b = R * (uz || 1.5), d = '';
      [[cx + sx * a, cy + sy * a, cx + sx * b, cy + sy * b], [cx - sx * a, cy - sy * a, cx - sx * b, cy - sy * b]].forEach(function (g) {
        (kes ? diskDisi(g[0], g[1], g[2], g[3], kes) : [g]).forEach(function (p) { d += 'M' + f1(p[0]) + ' ' + f1(p[1]) + ' L' + f1(p[2]) + ' ' + f1(p[3]) + ' '; });
      });
      return d || 'M0 0';
    }

    /* ——— bölümler ——— */
    // 0. Kanca: bardağın yakın planı, kayan gök, sayaç, geçen uçak
    function kanca(t, a) {
      var z = kr(1.55, 1.18, tw(t, 0, AN.su, Y.sin)) + 0.25 * pencere(t, AN.su, AN.gel, 0.8, 1);
      T.bas(a, { x: 800, y: kr(600, 520, tw(t, 0, 6, Y.sin)), z: z });
      // gök tek parça ve geniş: kenarı hiç görünmez. Dünya batıdan doğuya döner; damdan güneye bakınca
      // doğu solda kalır, gök doğudan batıya, yani sağa akar (Güneş de sağda batar)
      var gx = 800 - 330 + Math.min(Math.max(0, t - AN.donuyor), AN.gel - AN.donuyor + 1) * 26;
      plaka('aksam-gok', { x: gx, g: PG * 1.32, h: PH * 1.32, d: 0.3, parilti: 1 });
      // hızın çizgileri: gök kayar, bardak kıpırdamaz
      var ru = pencere(t, AN.donuyor + 0.3, AN.gel, 0.8, 0.6);
      if (ru > 0) { for (var i = 0; i < 40; i++) { var k = (a * 0.9 + hash(i, 11)) % 1; T.iz(-100 + k * 1900, 80 + hash(i, 12) * 420, 60, 1.6, 0, 1, 0.97, 0.88, 0.5 * ru * Math.sin(k * Math.PI)); } T.izBitir(); }
      var uc = ic(t, AN.ucak - 0.3, 3.2);
      if (uc > 0 && uc < 1) T.ciz('ucak', { x: kr(-200, 1800, uc), y: 230 - Math.sin(uc * Math.PI) * 30, g: 300, d: 0.5, r: -2 });
      plaka('dam', { d: 1 });
      T.ciz('bardak', { x: BARDAK.x, y: BARDAK.y, g: BARDAK.g, ax: 0.5, ay: 1, d: 1, parilti: 0.5 });
      var so = pencere(t, AN.hiz - 0.2, AN.sac, 0.4, 0.6);
      gos(hiz, so, 0, kr(0.9, 1, tw(t, AN.hiz, 0.4))); gos(hizBirim, so);
      if (so > 0) hiz.textContent = Math.round(tw(t, AN.hiz, 2.2, Y.ikili) * 1300).toLocaleString('tr-TR');
    }
    // 1. Kervansaray: bozkırda geniş plan, kamera kapıya yaklaşıp yükselir
    function kervansaray(t, a) {
      var yak = tw(t, AN.gel, AN.aksam - AN.gel + 1.2, Y.sin), ak = tw(t, AN.aksam - 0.2, 2.2, Y.sin);
      T.bas(a, { x: kr(800, 930, yak), y: kr(470, 380, yak), z: kr(1.02, 1.5, yak) });
      plaka('kervansaray', { d: 0.9, parilti: 0.7, carp: [kr(1, 0.85, ak), kr(1, 0.72, ak), kr(1, 0.78, ak)] });
    }
    // 2. Dam: akşam göğü, batan Güneş, tepsideki küre. Yaklaşırken kamera tepsiye iner; plaka büyütülmez bulanmasın diye
    // sonunda dam çözülüp uzay açılır; canlı Dünya boyalı kürenin yerinde belirdiği için geçiş kesilmez.
    // k yaklaşma (0-1, kamera), ge yakın planın görünürlüğü
    function yaklasKamera(k) {
      var cx = 800 - (EV.x - 800) / Z_F, cy = KURE.y - (EV.y - 450) / Z_F;
      return { x: kr(800, cx, k), y: kr(450, cy, k), z: kr(1.04, Z_F, k) };
    }
    function dam(t, a, kamera, ge, k) {
      var ak = tw(t, AN.aksam, 6, Y.sin);
      T.bas(a, kamera || { x: 800 + Math.sin(a * 0.05) * 10, y: 450, z: kr(1.12, 1.04, tw(t, AN.aksam, 5, Y.sin)) });
      plaka('aksam-gok', { d: 0.25, parilti: 1 });
      T.ciz('gunes', { x: 1230, y: kr(300, 400, ak), g: 220, r: a * 1.5, d: 0.3, parilti: 1 });
      if (ge > 0.001) plaka('uzay', { d: 0, o: ge });                 // sonunda dam çözülür, uzay açılır; Dünya yerinde kalır
      if (!(ge > 0.999)) plaka('dam', { d: 1, o: 1 - (ge || 0) });
      tepsiKure(null, k || 0);
    }
    // 3. Uzay: Güneş sağda, Dünya kendi ekseninde döner, kervansaray noktası haritaya yapışık
    function dunyaUzay(t, a, ac, l) {
      T.bas(a, { x: 800, y: 450, z: 1 });
      plaka('uzay', { d: 0.2, parilti: 0.6 });                     // yaklaşmanın sonunda uzay ve Dünya zaten ekranda: yeniden açılmaz
      yildizlar(a, 0.45, [800, 450], a * 0.004, 900);
      // Güneş Dünya'dan çok daha büyüktür: ekrana yalnız bir yayı sığar (ölçekli değil)
      T.ciz('gunes', { x: 1760, y: 420, g: 900, r: a * 1.2, d: 0.4, parilti: 1, gecis: ac });
      dunya(EV.x, EV.y, EV.r, evKure(l));
      var go = ac ? ac.k : 1;
      // kervansarayın enlem yolu (yalnız önde kalan kısmı) ve nokta
      var d = '';
      for (var s = 0; s <= 30; s++) { var q = kureNokta(EV.x, EV.y, EV.r, KER.en, KER.bo + (s / 30 - 0.5) * 2.6, evKure(0)); d += (s ? ' L' : 'M') + f1(q.x) + ' ' + f1(q.y); }
      goster(noktaIz, d, 0.55 * go);
      var p = kureNokta(EV.x, EV.y, EV.r, KER.en, KER.bo, evKure(l)), on = sinirla(p.on * 6, 0, 1) * go;
      var nab = 0.5 + 0.5 * Math.sin(a * 4);
      if (on > 0.01) { goster(noktaHale, daire(p.x, p.y, 26 + nab * 6), 0.9 * on); goster(nokta, daire(p.x, p.y, 14), on); }
      else { gizle(noktaHale); gizle(nokta); }
      return p;
    }
    // köşe penceresi: damdan o anki gök (ışığın açısı burada okunur, küçük kalmasın)
    var PEN = { x: 230, y: 150, g: 380, h: 214 }, PEN_O = { x: 250, y: 300, g: 380, h: 214 };   // olmasa durağında sahne 130 px yukarı kayar
    function pencereCiz(x, y, g, h, gokler, kar0, isinAci, yesil, yon, isinO, ao) {
      ao = ao == null ? 1 : ao;
      gokler.forEach(function (o) { if (o[1] * ao > 0.01) T.ciz(o[0], { x: x, y: y, g: g, h: h, d: 0, o: o[1] * ao }); });
      T.ciz('dam', { x: x, y: y, g: g, h: h, d: 0, o: ao, carp: kar0 > 0 ? [1 + 0.25 * kar0, 1 + 0.25 * kar0, 1 + 0.3 * kar0] : yesil ? [0.9, 1.08, 0.85] : null, ekle: kar0 > 0 ? [0.3 * kar0, 0.32 * kar0, 0.36 * kar0] : null });
      goster(cerceve, 'M' + (x - g / 2) + ' ' + (y - h / 2) + ' h' + g + ' v' + h + ' h' + -g + 'Z', ao);
      if (isinAci != null) isinCiz(x - (yon || 1) * g * 0.18, y + h * 0.4, isinAci, 40, h * 0.9, 0.6 * ao * (isinO == null ? 1 : isinO), null, yon);
      else isinGizle();
    }
    // Paralel ışınlar: hep aynı genişlikte bir demet; yere dik gelince küçük ve parlak, yatık gelince geniş ve sönük bir yer aydınlatır
    function isinCiz(px, py, aci, gen, boy, o, gunes, yon) {
      var dx = (yon || 1) * Math.cos(aci), dy = -Math.sin(aci), sn = Math.sin(aci), d = '';   // yon 1: ışık sağdan, -1: soldan
      var yari = gen / 2 / sn, ust = [], alt = [];
      isinlar.forEach(function (p, i) {
        var k = (i / 6 - 0.5) * 2, fx = px + k * yari, bx = fx + dx * boy, by = py + dy * boy;
        goster(p, 'M' + f1(bx) + ' ' + f1(by) + ' L' + f1(fx) + ' ' + f1(py), o * 0.9);
        if (i === 0) { ust.push([bx, by]); alt.push([fx, py]); }
        if (i === 6) { ust.push([bx, by]); alt.push([fx, py]); }
      });
      d = 'M' + f1(ust[0][0]) + ' ' + f1(ust[0][1]) + ' L' + f1(ust[1][0]) + ' ' + f1(ust[1][1]) + ' L' + f1(alt[1][0]) + ' ' + f1(alt[1][1]) + ' L' + f1(alt[0][0]) + ' ' + f1(alt[0][1]) + 'Z';
      goster(demet, d, o);
      goster(isikHavuz, elips(px, py, yari, Math.max(6, gen * 0.12)), o * kr(0.35, 0.95, sn));
      if (gunes) T.ciz('gunes', { x: px + dx * (boy + gunes.uz), y: py + dy * (boy + gunes.uz), g: gunes.g, r: aSimdi * 1.5, d: 1, parilti: 1 });
    }
    function isinGizle() { isinlar.forEach(gizle); gizle(demet); gizle(isikHavuz); }
    // 4. Yıldızlar: gece kervansarayı, Kutup Yıldızı çevresinde uzun pozlu izler, kervan
    function yildizSahnesi(t, a) {
      var ust = tw(t, AN.yildiz - 0.4, 3, Y.sin);
      T.bas(a, { x: 800, y: kr(470, 400, ust), z: kr(1.05, 1.18, ust) });
      plaka('kervansaray-gece', { d: 0.9, parilti: 0.5 });
      var don = Math.max(0, t - AN.onlar) * 0.05;
      yildizlar(a, 1, [1180, 170], don, 560);
      // izler: her yıldız arkasında sönerek uzayan bir yay bırakır (başı parlak, kuyruğu silik)
      var uz = tw(t, AN.onlar, 4, Y.sin) * (1 - tw(t, AN.ay - 0.4, 0.6));
      if (uz > 0.01) {
        var m = ekranR(1180, 170, 100, 0.9), sk = m.r / 100;
        for (var i = 0; i < 52; i++) {
          var r = (50 + hash(i, 13) * 880) * sk, f0 = hash(i, 14) * Math.PI * 2 - don, L = uz * (0.5 + hash(i, 15) * 0.5), b = (2.2 + hash(i, 9) * 1.6) * sk;
          var n = Math.max(6, Math.round(L * r / (b * 1.6)));        // noktalar birbirine değsin: iz kesintisiz bir yay olsun
          n = Math.min(n, 60);
          for (var j = 0; j <= n; j++) {
            var f = f0 + L * j / n, x = m.x + Math.cos(f) * r, y = m.y + Math.sin(f) * r * 0.82;
            if (y > 520 || x < -20 || x > 1620) continue;
            var g = Math.pow(1 - j / n, 1.4);
            T.iz(x, y, b * (j ? 1 : 1.7), b * (j ? 1 : 1.7), 0, 1, 0.95, 0.84, (0.16 + 0.8 * g) * uz);
          }
          T.izBitir();
        }
      }
      var ku = pencere(t, AN.kutup - 0.2, AN.ay, 0.4, 0.6), e = T.ekran(1180, 170, 0.9), nb = 0.6 + 0.4 * Math.sin(a * 3);
      if (ku > 0) { T.iz(e.x, e.y, 40 * nb, 40 * nb, 0, 1, 0.9, 0.6, 0.35 * ku); T.iz(e.x, e.y, 9, 9, 0, 1, 1, 0.9, ku); T.izBitir(); }
      var kv = ic(t, AN.kervan - 0.4, 6);
      if (kv > 0) T.ciz('kervan', { x: kr(-160, 700, kv), y: 640, g: 360, ax: 0.5, ay: 1, d: 0.9, o: Math.min(1, kv * 5) * (1 - tw(t, AN.ay - 0.3, 0.5)) });
    }
    // 5. Ay: damın ardından doğar, Güneş'ten ışık alır, Dünya'nın çevresinde dolaşır, hâlleri görünür
    function aySahnesi(t, a) {
      if (t >= KES.ayYol && t < KES.hilal) { ayYorunge(t, a); return; }
      gizle(yorunge);
      if (t >= KES.hilal && t < KES.haller) { hilal(t, a); return; }
      if (t < KES.ayYol) { ayDogar(t, a); return; }
      ayHalleri(t, a);
    }
    function ayDogar(t, a) {
      var dog = tw(t, AN.ay - 0.4, 3.4, Y.cik);
      T.bas(a, { x: 800, y: 450, z: kr(1.1, 1.03, dog) });
      plaka('gece-gok', { d: 0.25, parilti: 1 });
      yildizlar(a, 0.8, [1180, 170], 0, 560);
      // doğu solda: dolunay, Güneş'in battığı yerin karşısından doğar ve sağa doğru yükselir
      var mx = kr(300, 380, dog), my = kr(640, 270, dog);
      // Dolunay Güneş'in tam karşısında doğar: Güneş'ten Ay'a düz bir ışık bandı çizilmez (ışık Dünya'nın yanından geçip Ay'a
      // ulaşır, bu bölümde yalnız "ışığı Güneş'ten" yazısı ve Ay'ın hafifçe parlaması gösterilir)
      var li = pencere(t, AN.isik, KES.ayYol - 0.15, 0.8, 0.4);
      isima(mx, my, 170, [1, 0.95, 0.8], 0.22 * dog + 0.12 * li * (0.5 + 0.5 * Math.sin(a * 3)), 0.3);
      ay(mx, my, 100, null, 1, null, 0.3);                           // damın ardından yükselir
      plaka('dam', { d: 1, carp: [0.5, 0.55, 0.82] });
      tepsiKure([0.62, 0.68, 0.95]);
    }
    function ayYorunge(t, a) {
      T.bas(a, { x: 800, y: 450, z: 1 });
      plaka('uzay', { d: 0.2, parilti: 0.6, carp: [0.8, 0.8, 0.9] });
      yildizlar(a, 0.5, [800, 450], 0, 900);
      // yukarıdan bakınca saat yönünün tersine: sağdan arkaya, sola, öne. th 0: Güneş yönü (yeni Ay), π: dolunay
      var th = 2.2 + Math.max(0, t - AN.yolu) * 0.55, mx = 800 + Math.cos(th) * 420, my = 470 - Math.sin(th) * 150, arkada = Math.sin(th) > 0;
      goster(yorunge, elips(800, 470, 420, 150), 0.7 * tw(t, KES.ayYol, 0.6));
      var gunes = [1, 0, 0.05];
      if (arkada) ay(mx, my, 46, gunes, 1, 0.3);
      dunya(800, 470, 120, { boylam: -a * 0.5, bakis: 0.3, gunes: gunes });
      if (!arkada) ay(mx, my, 46, gunes, 1, 0.3);
      // Dünya'dan bakınca Ay: konumuna göre büyür, küçülür
      var fa = pencere(t, AN.farkli, KES.hilal - 0.2, 0.6, 0.3);
      if (fa > 0.01) {
        var f = ((th / (Math.PI * 2)) % 1 + 1) % 1;
        T.ciz('gece-gok', { x: 1340, y: 200, g: 210, h: 210, d: 0, o: fa, kure: { duz: true, isik: 0 } });
        ayHal(1340, 200, 72, f, fa, 0.25, 0);
        goster(cerceve, daire(1340, 200, 106), fa);
      } else gizle(cerceve);
    }
    function hilal(t, a) {
      gizle(cerceve);
      var hil = tw(t, KES.hilal, 1.4, Y.sin);
      T.bas(a, { x: 800, y: 450, z: kr(1.08, 1.03, hil) });
      plaka('aksam-gok', { d: 0.25, parilti: 1, carp: [0.7, 0.62, 0.78] });
      // gün batımından sonra ufukta ince hilâl; yanında yıldız yok
      isima(1170, 400, 120, [1, 0.92, 0.78], 0.2 * hil, 0.3);
      ay(1170, 400, 66, [0.55, -0.3, -0.78], hil, 0.1, 0.3);
      plaka('dam', { d: 1, carp: [0.72, 0.62, 0.72] });
      tepsiKure([0.8, 0.7, 0.8]);
    }
    function ayHalleri(t, a) {
      gizle(cerceve);
      T.bas(a, { x: 800, y: 450, z: 1.02 });
      plaka('gece-gok', { d: 0.25, parilti: 1 });
      yildizlar(a, 0.7, [1180, 170], 0, 600);
      // Durakta boş yuvalara oturan Ay resimlerini motor kendisi çizer (canli): sahne yalnız ilk ve son hilâli ve
      // yerine oturan resmin ışımasını çizer; durak kapanınca beş hâl de sahnenin kendisinden görünür
      var ac = acik === 'ayyolu';
      AY_YER.forEach(function (y, i) {
        var gorun = ac ? (i === 0 || i === 4 || ayYer[i] ? 1 : 0) : tw(t, AN.buyur + i * 0.35, 0.5);
        if (gorun > 0.01) isima(y.x, y.y, 95, [1, 0.95, 0.8], 0.14 * gorun, 0.25);
        if (!ac || i === 0 || i === 4) { ayHal(y.x, y.y, 62, AY_HAL[i], gorun, 0.26, 0.25); gos(etGun[i], gorun * 0.95); } else gos(etGun[i], ayYer[i] ? 0.95 : 0);
      });
    }
    var AY_YER = [{ x: 250, y: 400 }, { x: 525, y: 300 }, { x: 800, y: 260 }, { x: 1075, y: 300 }, { x: 1350, y: 400 }];
    var AY_HAL = [0.12, 0.25, 0.5, 0.75, 0.88];
    // 6. Kış: karlı dam, sonra yörünge
    function kisSahnesi(t, a) {
      var yo = tw(t, AN.ocak - 0.4, 1.2, Y.sin);
      if (yo < 1) {
        T.bas(a, { x: 800, y: 450, z: kr(1.04, 1.2, tw(t, AN.kis, 4, Y.sin)) });
        plaka('kis-gok', { d: 0.25, parilti: 0.4 });
        kar(a, 0.6 * (1 - yo), 0, 620);
        plaka('dam', { d: 1, carp: [1.12, 1.14, 1.24], ekle: [0.2, 0.22, 0.26] });
        tepsiKure([1.05, 1.08, 1.16]);
        kar(a, 1 - yo);
        if (yo <= 0) { gizle(yorunge); gizle(eksen); gizle(cerceve); isinGizle(); gos(etMevsim, 0); return; }   // sarınca yörüngenin penceresi ve yazısı kalmasın
      }
      yorungeCiz(t, a, acik === 'mevsim' ? yilDegeri(mv) : yorungeF(t), yo < 1 ? { k: yo, yon: 3, yumusak: 0.14, ac: true } : null);
    }
    // Anlatımdaki yıl: ocakta durur, temmuza yürür, eğik duruşunu bozmadan Ekim ve Ocak'tan geçip bahara döner
    function yorungeF(t) {
      if (t < AN.temmuz) return 0;
      if (t < AN.sir) return tw(t, AN.temmuz, 1.6, Y.ikili) * 0.5;
      if (t < AN.egik) return 0.5;
      if (t < D.mevsim) return 0.5 + tw(t, AN.bozmaz, 3.4, Y.sin) * 0.75;
      // durak kapandı: çocuğun bıraktığı yerden bahara yumuşakça döner
      return kr(yilDegeri(mv), 0.25, Y.sin(ic(t, D.mevsim, 0.7)));
    }
    // Yörünge: tuvalde noktalı bir yol (Dünya'nın ve Güneş'in altından geçer)
    function yorungeNokta(o) {
      for (var i = 0; i < 96; i++) { var q = i / 96 * Math.PI * 2; T.iz(YOR.x + YOR.rx * Math.cos(q), YOR.y + YOR.ry * Math.sin(q), 3.4, 3.4, 0, 1, 0.89, 0.6, o); }
      T.izBitir();
    }
    function yorungeCiz(t, a, f, ac) {
      T.bas(a, { x: 800, y: 450, z: 1 });
      plaka('uzay', { d: 0.2, parilti: 0.6, gecis: ac, carp: [0.8, 0.8, 0.9] });
      yildizlar(a, 0.45, [800, 450], 0, 900);
      var go = ac ? ac.k : 1;
      yorungeNokta(0.8 * go);
      var p = yilKonum(f), r = 72 * (1 + 0.1 * Math.sin(p.q)), arkada = p.y < GUNES_YOR.y;
      var kure = { boylam: -a * 0.9, egim: EGIM_YOR, bakis: 0.12, gunes: gunesIsigi(p, GUNES_YOR) };
      // arkadaki Dünya Güneş'in arkasında kalır, öndeki Güneş'in önünden geçer
      if (arkada) dunya(p.x, p.y, r, kure, { gecis: ac });
      T.ciz('gunes', { x: GUNES_YOR.x, y: GUNES_YOR.y, g: 210, r: a * 2, d: 1, parilti: 1, gecis: ac });
      if (!arkada) dunya(p.x, p.y, r, kure, { gecis: ac });
      goster(eksen, eksenYol(p.x, p.y, r, EGIM_YOR, 1.55, arkada ? { x: GUNES_YOR.x, y: GUNES_YOR.y, r: 84 } : null), go);
      // dam penceresi: ışık dikleşir, kar erir; üstte hangi ayda ve hangi mevsimde olduğumuz
      if (acik === 'mevsim' || t >= AN.bozmaz) {
        var ek = gunesYuksek(f), kisK = sinirla((0.62 - ek) / 0.12, 0, 1), yazK = sinirla((ek - 1.0) / 0.2, 0, 1), m = ayAdi(f);
        pencereCiz(PEN.x, PEN.y, PEN.g, PEN.h, [['kis-gok', kisK], ['gun-gok', 1 - kisK]], kisK, ek, yazK > 0.2, 1, 1);
        kar(a, kisK * 0.8, PEN.y - PEN.h / 2 + 4, PEN.y + PEN.h / 2 - 4, PEN.x - PEN.g / 2, PEN.x + PEN.g / 2);
        yaziMetin(etMevsim, AYLAR[m] + ' · ' + MEVSIMLER[m]); gos(etMevsim, go);
      } else { gizle(cerceve); isinGizle(); gos(etMevsim, 0); }
      return p;
    }
    // 7. Işık: aynı demet dik ve yatık gelir
    function isikSahnesi(t, a) {
      var yatik = tw(t, AN.yatik - 0.2, 1.6, Y.sin), cik = tw(t, AN.dik - 0.4, 0.8, Y.cik);
      T.bas(a, { x: 800, y: 450, z: 1.04 });
      plaka('gun-gok', { d: 0.25, parilti: 0.6, carp: [0.86, 0.88, 0.95] });
      if (yatik > 0.01) plaka('kis-gok', { d: 0.25, o: yatik });
      var aci = kr(1.18, 0.4, yatik), P = { x: 560, y: 792 };
      plaka('dam', { d: 1, carp: [kr(0.66, 0.9, yatik), kr(0.7, 0.92, yatik), kr(0.66, 1, yatik)], ekle: yatik > 0 ? [0.12 * yatik, 0.13 * yatik, 0.16 * yatik] : null });
      kar(a, yatik * 0.85);
      isinCiz(P.x, P.y, aci, 150, kr(560, 800, yatik), cik, { uz: 120, g: 190 });
    }
    // 8. Olmasaydı: dönen Dünya, eğik eksen, dönüş halkası, Ay. Çıkarılan varlık doğru cevaptan sonra geri gelir (dondur),
    // yanlış cevapta çıkık kalır; çıkarılan şeyin sonucu sahnede görünür:
    //   dönüş yok: Dünya durur, bir yüzü aylarca gündüz, öbürü aylarca gece
    //   eğik duruş yok: pencerede ay ay geçer ama ışık ve hava hiç değişmez
    //   Ay yok: gece daha karanlık, Ay gökte yok
    function olmasaSahnesi(t, a) {
      T.bas(a, { x: 800, y: 450, z: kr(1.2, 1, tw(t, AN.uc - 0.4, 2, Y.sin)) });
      var yokAy = cikan === 'ay' ? 1 : 0, durdu = cikan === 'donus', duz = cikan === 'eksen';
      AY_KARA += (yokAy - AY_KARA) * 0.06; EKSEN_DUZ += ((duz ? 1 : 0) - EKSEN_DUZ) * 0.06; DON_K += ((durdu ? 1 : 0) - DON_K) * 0.06;
      if (!durdu) DON_A += 0.012;
      plaka('uzay', { d: 0.2, parilti: 0.6, carp: [0.85 - 0.3 * AY_KARA, 0.85 - 0.3 * AY_KARA, 0.92 - 0.26 * AY_KARA] });
      yildizlar(a, 0.6 + 0.4 * AY_KARA, [800, 450], 0, 900);
      T.ciz('gunes', { x: 1760, y: 470, g: 900, r: a * 1.2, d: 0.6, parilti: 1 });
      var eg = EGIM * (1 - EKSEN_DUZ), O = { x: 640, y: 480, r: 180 };
      dunya(O.x, O.y, O.r, { boylam: -DON_A, egim: eg, bakis: 0.18, gunes: [1, 0.05, 0.15] });
      var ek = T.ekran(O.x, O.y, 1), er = ekranR(O.x, O.y, O.r, 1).r;
      goster(eksen, eksenYol(ek.x, ek.y, er, eg, 1.55), cikan === 'eksen' ? 0.4 : 1);
      // dönüş halkası: Dünya'nın beline sarılan, önden geçip sağda arkaya dönen ok
      var oo = (durdu ? 0 : 1) * tw(t, AN.dDonus - 0.2, 0.6);
      if (oo > 0.01) {
        var rx = er * 1.28, ry = er * 0.3, ce = Math.cos(eg), se = Math.sin(eg);
        var sol = [ek.x - rx * ce, ek.y - rx * se], sag = [ek.x + rx * ce, ek.y + rx * se];
        goster(donusOku, 'M' + f1(sol[0]) + ' ' + f1(sol[1]) + ' A' + f1(rx) + ' ' + f1(ry) + ' ' + f1(eg * 57.296) + ' 0 0 ' + f1(sag[0]) + ' ' + f1(sag[1]), oo);
        var ux = se, uy = -ce, wx = ce, wy = se, L = 30;             // ok ucu: halkanın sağ ucunda yukarı, arkaya doğru
        goster(okUcu, 'M' + f1(sag[0] + ux * L) + ' ' + f1(sag[1] + uy * L) + ' L' + f1(sag[0] + wx * 15 - ux * 4) + ' ' + f1(sag[1] + wy * 15 - uy * 4) + ' L' + f1(sag[0] - wx * 15 - ux * 4) + ' ' + f1(sag[1] - wy * 15 - uy * 4) + 'Z', oo);
      } else { gizle(donusOku); gizle(okUcu); }
      ay(1250, 300, 66, [1, 0.05, 0.25], (1 - AY_KARA) * tw(t, AN.dAy - 0.3, 0.6), 0.3);
      // kanıtlar
      gos(etOlmasa[0], DON_K * 0.97); gos(etOlmasa[1], DON_K * 0.97); gos(etAy, AY_KARA * 0.97);
      if (EKSEN_DUZ > 0.02) {
        // ışık hep aynı açıdan gelir: pencere her ay aynı kalır, kar da yeşillik de olmaz
        pencereCiz(PEN_O.x, PEN_O.y, PEN_O.g, PEN_O.h, [['gun-gok', 1]], 0, 0.9, false, 1, 1, EKSEN_DUZ);
        yaziMetin(etEksen[0], AYLAR[[0, 3, 6, 9][Math.floor(a / 1.3) % 4]]);
        gos(etEksen[0], EKSEN_DUZ * 0.97); gos(etEksen[1], EKSEN_DUZ * 0.97);
      } else { gizle(cerceve); isinGizle(); gos(etEksen[0], 0); gos(etEksen[1], 0); }
    }
    var OLMASA_SIRA = ['donus', 'eksen', 'ay'];     // ders verisindeki varlık sırası
    var AY_KARA = 0, EKSEN_DUZ = 0, DON_A = 0, DON_K = 0;
    // 9. Geri çekilme: Dünya küçülür, dev Güneş, sekiz gezegen, yıldız kümeleri
    function geriSahnesi(t, a) {
      var g1 = tw(t, AN.geri, 2.4, Y.ikili), g2 = tw(t, AN.sekiz - 0.6, 1.6, Y.ikili), g3 = tw(t, AN.sistem + 0.4, 4, Y.ikili);
      T.bas(a, { x: 800, y: 450, z: 1 });
      gizle(eksen); gizle(donusOku); gizle(okUcu);
      if (t < AN.bagli + 2.2) {
        // hepsi birbirine bağlı: Dünya, Ay, Güneş arasında altın ipler
        plaka('uzay', { d: 0.2, parilti: 0.6, carp: [0.85, 0.85, 0.92] });
        yildizlar(a, 0.6, [800, 450], 0, 900);
        T.ciz('gunes', { x: 1760, y: 470, g: 900, r: a * 1.2, d: 0.6, parilti: 1 });
        dunya(640, 480, 180, { boylam: -DON_A - (t - AN.bagli) * 0.7, egim: EGIM, bakis: 0.18, gunes: [1, 0.05, 0.15] });
        ay(1250, 300, 66, [1, 0.05, 0.25], 1, 0.3);
        var ip = tw(t, AN.bagli, 1.4);
        goster(iplikler[0], 'M640 480 Q940 300 1250 300', ip); goster(iplikler[1], 'M640 480 Q1100 560 1560 470', ip); goster(iplikler[2], 'M1250 300 Q1420 360 1560 470', ip);
        return;
      }
      iplikler.forEach(gizle);
      // geri çekildikçe arka plan söner: küçülen Dünya ve gezegenler seçilsin
      plaka('uzay', { d: 0.2, parilti: 0.6, carp: [kr(0.85, 0.5, g1), kr(0.85, 0.5, g1), kr(0.92, 0.62, g1)] });
      yildizlar(a, 0.6 + 0.4 * g3, [800, 450], a * 0.003, 900);
      var hk = 0;
      if (g2 < 1) {
        // Güneş dev, Dünya bir nokta
        var dg = kr(180, 9, g1), dx = kr(640, 330, g1), dy = kr(480, 450, g1);
        T.ciz('gunes', { x: kr(1640, 1110, g1), y: kr(470, 450, g1), g: kr(380, 760, g1), r: a * 2, d: 1, parilti: 1, o: 1 - g2 });
        dunya(dx, dy, dg, { boylam: -DON_A - (t - AN.bagli) * 0.7, egim: EGIM, bakis: 0.18, gunes: [1, 0, 0.2] }, { o: 1 - g2 });
        var hr = pencere(t, AN.milyon + 0.6, AN.sekiz - 0.4, 0.5, 0.5);
        if (hr > 0) { goster(halka, daire(dx, dy, 30 + 4 * Math.sin(a * 4)), hr); hk = 1; }
      }
      if (g2 > 0) {
        // Güneş sistemi: sekiz yol, yolunda giden gezegenler; sonra küçülüp yıldızların arasına karışır
        var s = kr(1, 0.08, g3), cx = 800, cy = 470;
        T.ciz('gunes', { x: cx, y: cy, g: 110 * s, r: a * 2, d: 1, parilti: 1, o: g2 });
        GEZ.forEach(function (gz, i) {
          var rx = gz.r * s, ry = rx * 0.36, f = gz.f0 + a * gz.h;
          goster(gezegenYol[i], elips(cx, cy, rx, ry), 0.6 * g2 * (1 - g3 * 0.7));
          T.ciz('gezegen-' + (i + 1), { x: cx + Math.cos(f) * rx, y: cy - Math.sin(f) * ry, g: gz.g * Math.max(0.3, s), d: 1, o: g2 });   // yukarıdan bakınca saat yönünün tersine
        });
        if (g3 > 0) {
          // yıldız kümeleri: sistem pek çoğundan biri
          for (var k = 0; k < 12; k++) {
            var kx = 140 + hash(k, 31) * 1320, ky = 120 + hash(k, 32) * 560;
            if (Math.abs(kx - cx) < 180 && Math.abs(ky - cy) < 130) continue;
            T.iz(kx, ky, 70 * g3, 44 * g3, 0, 1, 0.9, 0.7, 0.16 * g3);
            for (var j = 0; j < 36; j++) { var aa = hash(j + k * 40, 33) * 6.28, rr = Math.pow(hash(j + k * 40, 34), 0.7) * 80 * g3; T.iz(kx + Math.cos(aa) * rr, ky + Math.sin(aa) * rr * 0.6, 3.4, 3.4, 0, 1, 0.94, 0.76, g3); }
          }
          T.izBitir();
          var uf = pencere(t, AN.ufacik, AN.buyuk, 0.5, 0.6);
          if (uf > 0) { goster(halka, daire(cx + GEZ[2].r * s, cy, 22 + 4 * Math.sin(a * 4)), uf); hk = 1; }
        }
      } else gezegenYol.forEach(gizle);
      if (!hk) gizle(halka);
    }
    var GEZ = [{ r: 120, g: 18, h: 0.9 }, { r: 170, g: 26, h: 0.7 }, { r: 225, g: 28, h: 0.55 }, { r: 280, g: 22, h: 0.45 }, { r: 380, g: 70, h: 0.25 }, { r: 470, g: 80, h: 0.18 }, { r: 560, g: 46, h: 0.12 }, { r: 640, g: 44, h: 0.09 }]
      .map(function (g, i) { g.f0 = hash(i, 41) * 6.28; return g; });
    // 10. Büyük soru: gece damı; Ay yolunda yürür, kimse onu durduramaz
    function buyukSahne(t, a) {
      T.bas(a, { x: 800, y: kr(450, 420, tw(t, AN.buyuk, 6, Y.sin)), z: kr(1.02, 1.12, tw(t, AN.buyuk, 9, Y.sin)) });
      plaka('gece-gok', { d: 0.25, parilti: 1 });
      yildizlar(a, 1, [1180, 170], (t - AN.buyuk) * 0.01, 600, null, null, null, [800, 1500]);   // güneye bakılıyor: gök soldan sağa akar
      var ayk = ic(t, AN.buyuk - 1, 18), mx = kr(260, 1340, ayk), my = 330 - Math.sin(ayk * Math.PI) * 90;   // üstteki yazının altından geçer
      isima(mx, my, 100, [1, 0.95, 0.8], 0.18, 0.3);
      ay(mx, my, 60, null, 1, null, 0.3);
      plaka('dam', { d: 1, carp: [0.55, 0.6, 0.85] });
      tepsiKure([0.7, 0.75, 1]);
    }
    // 12. Sır: bardak ve onu saran hava birlikte gider; arabada atılan kalem yine arabaya düşer
    function sirSahnesi(t, a) {
      if (t >= KES.arabaGir && t < KES.arabaCik) {
        gizle(kubbe);
        var k = ic(t, KES.arabaGir, KES.arabaCik - KES.arabaGir);
        T.bas(a, { x: 800, y: 470, z: 1.1 });
        plaka('kervansaray', { d: 0.6, parilti: 0.6 });
        var ax = kr(220, 1080, k), ay0 = 760;
        T.ciz('araba', { x: ax, y: ay0, g: 420, ax: 0.5, ay: 1, d: 1, buk: Math.sin(a * 6) * 0.6 });
        // kalem arabanın içinde dört kez yukarı atılır, döner ve yine ele düşer: araba ile birlikte gider.
        // Kapalı arabanın tavanını aşmaz; arabanın önünde, içini görüyormuşuz gibi çizilir
        var ka = (k * 4) % 1, ky = ay0 - 75 - Math.sin(ka * Math.PI) * 85, e = T.ekran(ax - 20, ky, 1);
        T.iz(e.x, e.y, 120, 26, ka * Math.PI * 2, 1, 0.97, 0.88, 0.55); T.izBitir();
        T.ciz('kalem', { x: ax - 20, y: ky, g: 210, d: 1, r: ka * 360 });
        return;
      }
      // bardak: arkada gök hızla kayar, bardak, su ve onu saran hava kıpırdamaz
      var yolcu = tw(t, AN.yolcu - 0.2, 3, Y.ikili), gx = 800 - 300 + Math.max(0, t - AN.basta) * 22;
      T.bas(a, { x: 800, y: kr(600, 450, yolcu), z: kr(1.5, 1, yolcu) });
      plaka('gece-gok', { d: 0.3, x: Math.min(gx, 800 + 300), g: PG * 1.32, h: PH * 1.32, parilti: 1 });
      yildizlar(a, 0.8, [1180, 170], 0, 600);
      var ru = pencere(t, AN.basta + 1, AN.uyu, 1, 0.6);
      if (ru > 0) { for (var i = 0; i < 30; i++) { var q = (a * 0.8 + hash(i, 11)) % 1; T.iz(-100 + q * 1900, 60 + hash(i, 12) * 420, 54, 1.4, 0, 0.85, 0.9, 1, 0.35 * ru * Math.sin(q * Math.PI)); } T.izBitir(); }
      plaka('dam', { d: 1, carp: [0.6, 0.65, 0.9] });
      T.ciz('bardak', { x: BARDAK.x, y: BARDAK.y, g: BARDAK.g, ax: 0.5, ay: 1, d: 1, carp: [0.85, 0.9, 1] });
      var hv = pencere(t, AN.hava - 0.2, KES.arabaGir - 0.1, 0.8, 0.3);
      if (hv > 0.01) {
        var m = T.ekran(BARDAK.x, BARDAK.y - 150, 1), mr = ekranR(BARDAK.x, BARDAK.y, 270, 1).r;
        goster(kubbe, elips(m.x, m.y, mr, mr * 1.02), hv);
        for (var j = 0; j < 46; j++) {
          var aa = hash(j, 51) * 6.28, rr = Math.sqrt(hash(j, 52)) * mr * 0.92;
          T.iz(m.x + Math.cos(aa + a * 0.25) * rr, m.y + Math.sin(aa + a * 0.25) * rr * 1.02, 5, 5, 0, 0.85, 0.96, 1, 0.75 * hv);
        }
        T.izBitir();
      } else gizle(kubbe);
    }
    // 13. Kapanış: gece, tan, Güneş doğar
    function kapanis(t, a) {
      var tan = tw(t, AN.sabah - 0.4, 3.2, Y.sin), don = tw(t, AN.biliyorsun, 4, Y.sin);
      T.bas(a, { x: 800, y: 450, z: kr(1.08, 1.02, tan) });
      plaka('gece-gok', { d: 0.25, parilti: 1, r: -don * 2 });
      if (tan > 0) plaka('tan-gok', { d: 0.25, parilti: 1, r: -don * 2, gecis: { k: tan, yon: 1, yumusak: 0.2, ac: true } });
      yildizlar(a, 1 - tan, [1180, 170], 0, 600);
      // Güneş doğudan doğar: damdan güneye bakınca solda (akşam sağda batmıştı)
      if (tan > 0.2) T.ciz('gunes', { x: 370, y: kr(640, 300, tw(t, AN.sabah - 0.2, 6, Y.sin)), g: 260, r: a * 1.5, d: 0.3, parilti: 1, o: tan });
      plaka('dam', { d: 1, carp: [kr(0.6, 1, tan), kr(0.65, 0.96, tan), kr(0.9, 0.92, tan)] });
      tepsiKure([kr(0.7, 1, tan), kr(0.75, 1, tan), kr(1, 1, tan)]);
    }

    /* ——— perde: kesmelerde kısa bir an lacivert (kâğıt bölümünde krem) karartma ——— */
    var LACI = [0.07, 0.11, 0.3], KREM = [1, 1, 1];
    var PERDE = [[AN.gel], [AN.yildiz - 0.4], [AN.ay - 0.3], [KES.ayYol], [KES.hilal], [KES.haller], [AN.sasmaz + 1], [AN.dik - 0.2],
      [AN.uc - 0.4], [AN.buyuk], [AN.gunesAy - 0.3, KREM], [AN.basta - 0.2, KREM], [KES.arabaGir], [KES.arabaCik], [AN.uyu],
      [AN.doner - 0.3, KREM], [AN.gelecek - 0.2, KREM]];
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
    var acik = null;
    function ciz(t, a) {
      aSimdi = a; acik = api.acikDurak();
      var bol;
      if (t < AN.gel) bol = 0;
      else if (t < AN.aksam + 0.8) bol = 1;
      else if (t < AN.kure + 1.6) bol = 2;
      else if (t < AN.yildiz - 0.4) bol = 3;
      else if (t < AN.ay - 0.3) bol = 4;
      else if (t < AN.sasmaz + 1) bol = 5;
      else if (t < AN.dik - 0.2) bol = 6;
      else if (t < AN.uc - 0.4) bol = 7;
      else if (t < AN.bagli) bol = 8;
      else if (t < AN.buyuk) bol = 9;
      else if (t < AN.gunesAy - 0.3) bol = 10;
      else if (t < AN.basta - 0.2) bol = 11;
      else if (t < AN.uyu) bol = 12;
      else if (t < AN.doner - 0.3 || t >= AN.gelecek - 0.2) bol = 13;
      else bol = 14;

      if (bol === 0) kanca(t, a);
      else if (bol === 1) {
        kervansaray(t, a);
        var gc = tw(t, AN.aksam + 0.1, 0.7, Y.sin);
        if (gc > 0) { T.bas2({ x: 800, y: 450, z: 1.12 }); plaka('aksam-gok', { d: 0.25, gecis: { k: gc, yon: 1, yumusak: 0.14, ac: true } }); plaka('dam', { d: 1, gecis: { k: gc, yon: 1, yumusak: 0.14, ac: true } }); }
      } else if (bol === 2) {
        // küreye yaklaşılır
        // 1 sn'de yaklaşılır (ikili yumuşatma), son 0,6 sn yakın plan sabit kalır; sonra uzaya geçilir
        var gir = tw(t, AN.kure, 1.0, Y.ikili), ge = tw(t, AN.kure + 0.72, 0.22, Y.sin);
        dam(t, a, gir > 0 ? yaklasKamera(gir) : null, ge, gir);
      } else if (bol === 3) {
        var ac3 = tw(t, AN.kure + 1.6, 1.1, Y.sin);
        // durakta çocuk çevirir; sonra Dünya bir tam tur döner ("bir tam tur, bir gün")
        var l = acik === 'donus' ? lam(gv) : t < D.donus ? lam(50) : lam(gv) + Math.max(0, t - AN.gordun) * 0.5;
        dunyaUzay(t, a, ac3 < 1 ? { k: ac3, yon: 3, yumusak: 0.14, ac: true } : null, l);
        if (acik === 'donus' || (t >= D.donus - 0.05 && t < AN.yildiz - 0.4)) {
          var s = Math.sin(l), gk = sinirla((-s - 0.1) / 0.35, 0, 1), gun = sinirla((s - 0.1) / 0.35, 0, 1);
          pencereCiz(PEN.x, PEN.y, PEN.g, PEN.h, [['gece-gok', gk], ['tan-gok', Math.max(0, 1 - gk - gun)], ['gun-gok', gun]], 0, null);
          if (gk > 0.3) { yildizlar(a, gk * 0.6, [PEN.x, PEN.y - 50], 0, PEN.y + 10, PEN.x - PEN.g / 2 + 6, PEN.x + PEN.g / 2 - 6, PEN.y - PEN.h / 2 + 6); }
        } else gizle(cerceve);
      } else if (bol === 4) yildizSahnesi(t, a);
      else if (bol === 5) aySahnesi(t, a);
      else if (bol === 6) kisSahnesi(t, a);
      else if (bol === 7) isikSahnesi(t, a);
      else if (bol === 8) olmasaSahnesi(t, a);
      else if (bol === 9) geriSahnesi(t, a);
      else if (bol === 10) buyukSahne(t, a);
      else if (bol === 11) { T.bas(a, { x: 800, y: 450, z: 1 }); plaka('kagit', { d: 0 }); }
      else if (bol === 12) sirSahnesi(t, a);
      else if (bol === 14) { T.bas(a, { x: 800, y: 450, z: 1 }); plaka('kagit', { d: 0 }); }
      else kapanis(t, a);

      gorunurluk(bol, t);
      perde(t);
      yazilar(t);
    }
    // bölüm dışına çıkan çizgiler ve yazılar kapanır
    function gorunurluk(bol, t) {
      if (bol !== 0) { gos(hiz, 0); gos(hizBirim, 0); }
      if (bol !== 3) { gizle(noktaIz); gizle(noktaHale); gizle(nokta); }
      if (bol !== 3 && bol !== 5 && bol !== 6 && bol !== 8) gizle(cerceve);
      if (bol !== 6 && bol !== 7 && bol !== 8) isinGizle();
      if (bol !== 6) gos(etMevsim, 0);
      if (bol !== 5 || t < KES.haller) etGun.forEach(function (e) { gos(e, 0); });
      if (bol !== 8) { etOlmasa.forEach(function (e) { gos(e, 0); }); etEksen.forEach(function (e) { gos(e, 0); }); gos(etAy, 0); }
      gos(etOlcek, (bol === 3 || bol === 8 || (bol === 6 && t >= AN.ocak) || (bol === 5 && t >= KES.ayYol && t < KES.hilal)) ? 0.85 : 0);
      if (bol !== 5 && bol !== 6) gizle(yorunge);
      if (bol !== 6 && bol !== 8) gizle(eksen);
      if (bol !== 8) { gizle(donusOku); gizle(okUcu); }
      if (bol !== 9) { iplikler.forEach(gizle); gezegenYol.forEach(gizle); gizle(halka); }
      if (bol !== 12) gizle(kubbe);
    }

    return {
      hazir: hazir,
      ciz: ciz,
      // Allahü teâlâdan söz edilen kâğıt bölümünde yazı sahnenin kendisidir; altyazı ve dokunma oyunu yoktur
      altyazisiz: function (t) { return kagitYazisi || (t >= AN.gunesAy - 0.3 && t < AN.basta - 0.2) || (t >= AN.doner - 0.3 && t < AN.gelecek - 0.2); },
      durak: function (id, olay, veri) {
        if (id === 'donus' && olay === 'deger') gv = veri;
        if (id === 'mevsim' && olay === 'deger') mv = veri;
        if (id === 'ayyolu' && olay === 'dogru') ayYer[veri] = aSimdi;
        // olmasa (hepsi): doğru cevaptan sonra motor 'dondur' ile varlığın sırasını bildirir; çıkarılan geri gelir
        if (id === 'olmasaydi') {
          if (olay === 'cikar') cikan = veri;
          if (olay === 'kapat') cikan = null;
          if (olay === 'dondur' && cikan === OLMASA_SIRA[veri]) cikan = null;
        }
      },
      // Küreyi çevirme: çocuk Dünya'yı herhangi bir yerinden tutup yana çeker. Kervansaray noktası haritada,
      // Anadolu'da yapışık kalır; dönen Dünya'dır, nokta onunla birlikte geceye ve gündüze geçer.
      tutamac: function (id, deger) {
        if (id === 'donus') return { x: EV.x, y: EV.y, r: EV.r * 1.04, ust: true };
        var q = yilKonum(yilDegeri(deger)); return { x: q.x, y: q.y, r: 92 };
      },
      tutDeger: function (id, x, y, bas) {
        if (id === 'donus') {
          var cx = EV.r * Math.cos(KER.en);
          // parmak ne kadar kaydıysa yüzey o kadar döner (tutulduğu yerdeki hıza göre)
          if (bas) return sinirla(bas.deger + (x - bas.x) / (cx * Math.max(0.45, Math.cos(lam(bas.deger)))) * 50 / 1.2, 0, 100);
          return sinirla(Math.asin(sinirla((x - EV.x) / cx, -1, 1)) / 1.2 * 50 + 50, 0, 100);
        }
        return yorungeTut(bas || { deger: 50, x: x, y: y }, x, y);   // teğet sürükleme: tutulan yerden, sıçramadan
      }
    };
  };
  DO.KodDersSahne['akaid-03'].geo = { YOR: YOR, GUNES: GUNES_YOR, yilKonum: yilKonum, yilDegeri: yilDegeri, gunesIsigi: gunesIsigi, yorungeTut: yorungeTut, gunesYuksek: gunesYuksek, ayAdi: ayAdi };
})();
