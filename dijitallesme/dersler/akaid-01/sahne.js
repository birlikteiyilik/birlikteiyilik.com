/* Akaid 1 · Evrendeki Düzen — sahne: "Yaşayan Minyatür".
   Ders tek bir vadide geçer: Matrakçı Nasuh'un insansız menzil minyatürleri, İznik paleti, altın varak gök.
   Boyalı katmanlar kd-tuval ile canlanır; her görsel olay anlatıcının kelimesine bağlıdır (t).
   a ortam saatidir: durakta t durur, rüzgâr ve su sürer.
   Bir çiçek bütün dersi taşır: her ipucu o çiçeğin bir ihtiyacıdır, sırrın çözümü de orada düğümlenir.
   İnsan figürü yoktur. Allahü teâlâdan söz edilen bölümde sahne boşalır, kâğıt ve yazı kalır:
   ışık, şekil, sembol kullanılmaz. */
(function () {
  'use strict';
  var DO = window.DO;
  DO.KodDersSahne['akaid-01'] = function (api) {
    var T = api.tuval, kel = api.kelime, C = api.cumle, CS = api.cumleSon, el = DO.el, svg = api.svg, E2 = api.ciz.ogeler;
    var GORSELLER = ['vadi-gece', 'vadi-gece-on', 'vadi-yaz', 'vadi-sonbahar', 'vadi-kis', 'vadi-taban', 'vadi-on', 'gok-altin', 'kagit', 'dergah', 'su-haritasi',
      'bahce', 'bahce-kuru', 'defter-cayirda', 'cayir', 'gunes', 'kalp', 'cicek-acik', 'cicek-soguk', 'cicek-yanik', 'defter', 'defter-kapali', 'takvim', 'agac', 'agac-yalin',
      'ari', 'ari-yan', 'tohum', 'filiz', 'damla', 'petek', 'canli-kus', 'canli-balik', 'canli-deve', 'canli-ari', 'bulut-1', 'bulut-2', 'bulut-3', 'bulut-yagmur',
      'sepet-1', 'sepet-2', 'sepet-3', 'sepet-bos', 'cini-a'];
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

    /* ——— anlatıcıya bağlı anlar ——— */
    var D = {}; ['defter', 'gunes', 'su', 'bahce', 'canli', 'arkadas'].forEach(function (id) { D[id] = api.durak(id); });
    var AN = {
      sabah: C(1), sorgu: C(3), uyudu: C(4), sayi: kel('yüz'), sayiSon: kel('atacak') + 0.5, habersiz: C(7),
      gun: C(8), defter: C(10), sir: C(11), taptuk: C(12), herkes: C(13), yunus: C(14), neden: C(15), ilk: C(17),
      guzel: C(19), gunes: C(21), takvim: C(22), yil: C(23), randevu: C(24), gec: C(25), erken: C(26), donus: C(27), mevsim: kel('mevsimler'),
      olcu: C(28), yaOyle: C(29), eline: C(30), gordun: C(33), yakar: kel('yakıyor'), donar: kel('donduruyor'), ikinci: C(35), susuz: C(36), su: C(37), dun: C(38),
      saskin: C(39), bulut: kel('bulut'), irmak: kel('ırmak'), deniz: kel('deniz'), yuksel: C(41), bulutOl: C(42), yagmur: C(43), toprak: C(44), yeniden: C(45), yarim: C(46),
      ucuncu: C(48), kucul: C(49), bak: C(50), ari: C(51), tohum: C(52), fabrika: C(53), verir: C(54), onemsiz: C(55), cikar: C(56),
      meger: C(57), nefes: C(58), aldin: C(59), oksijen: C(60), cok: C(61), az: C(62), nimet: C(63), beden: C(64), susa: C(65), goz: C(66), kus: C(67), hangi: C(68),
      doldu: C(70), s1: C(72), s2: C(73), s3: C(74), s4: C(75), s5: C(76), buyuk: C(77), kendilik: C(78), yerde: C(79), demezsin: C(80),
      hic: C(81), edemeyen: C(82), alem: C(83), yalniz: C(84), bugun: C(85), arkadas: C(86), sirZaman: C(87), yunus2: C(88), egil: C(89), kiyama: C(90),
      bakinca: C(91), gelecek: C(92), emanet: C(93)
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
    var y = {
      yaklasik: yazi('yaklaşık', 'kucuk', 800, 128), sayi: yazi('0', 'sayi', 800, 200), gunde: yazi('bir günde', 'kucuk', 800, 270),
      soru: yazi('?', 'sor', 1137, 232),
      ilk: yazi('İlk ipucu senden!', 'el', 508, 296),
      gec: yazi('Geç kalmıyor', 'etiket', 620, 700), erken: yazi('Erken gelmiyor', 'etiket', 980, 700),
      randevu: yazi('gökteki dev yıldızın randevusu', 'etiket', 800, 92),
      tam: yazi('tam ölçü', 'etiket', 856, 262),
      okula: yazi('okula gitmeden!', 'etiket', 980, 120), bilir: yazi('hangi ağaç olacağı içinde yazılı', 'etiket', 800, 92),
      fabrika: yazi('tohuma sıcak bir yuva', 'etiket', 800, 92),
      yuzde: yazi('%21', 'sayi', 400, 320), oksijen: yazi('oksijen', 'kucuk', 400, 400),
      yakar: yazi('Daha çok olsaydı…', 'kucuk', 400, 520), yasayamaz: yazi('Daha az olsaydı…', 'kucuk', 400, 520),
      nimet: yazi('Küçük bir ölçü, büyük bir nimet.', 'etiket', 400, 560),
      goz: yazi('göz', 'etiket', 520, 560), kulak: yazi('kulak', 'etiket', 800, 560), burun: yazi('burun', 'etiket', 1080, 560),
      buyuk: yazi('Bütün bunlar kendiliğinden olabilir mi?', '', 800, 450),
      kendi: yazi('“Bu yazı kendi kendine oluştu.”', 'etiket', 800, 78),
      k1: yazi('Hiçbir şey, yok iken kendi kendine var olamaz.', 'kagit', 800, 340),
      k2: yazi('Kendini var edemeyen, başka bir şeyi de var edemez.', 'kagit', 800, 540),
      k3: yazi('Bu âlemin var olması, onu yoktan var edenin bulunduğunu gösterir.', 'kagit', 800, 430),
      k4: yazi('Her şeyi yoktan var eden, yalnız Allahü teâlâdır.', 'kagit', 800, 330),
      k5: yazi('Bugün bulduğun her ipucu, Onun varlığını, kudretini ve merhametini gösterir.', 'kagit', 800, 540),
      gelecek: yazi('Gelecek ders: Allahü teâlânın varlığı ve birliği', 'etiket', 800, 110)
    };

    /* Takvim yaprağı: yarının gerçek tarihi ve gerçek gün doğumu (NOAA hesabı, İstanbul) */
    var AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    function dogus(tarih) {
      var g = Math.round((Date.UTC(tarih.getFullYear(), tarih.getMonth(), tarih.getDate()) - Date.UTC(tarih.getFullYear(), 0, 0)) / 864e5);
      var w = 2 * Math.PI / 365 * (g - 1 - 0.25), R = Math.PI / 180;
      var dk = 229.18 * (0.000075 + 0.001868 * Math.cos(w) - 0.032077 * Math.sin(w) - 0.014615 * Math.cos(2 * w) - 0.040849 * Math.sin(2 * w));
      var ey = 0.006918 - 0.399912 * Math.cos(w) + 0.070257 * Math.sin(w) - 0.006758 * Math.cos(2 * w) + 0.000907 * Math.sin(2 * w) - 0.002697 * Math.cos(3 * w) + 0.00148 * Math.sin(3 * w);
      var en = 41.01 * R, ha = Math.acos(Math.cos(90.833 * R) / (Math.cos(en) * Math.cos(ey)) - Math.tan(en) * Math.tan(ey)) / R;
      var d = Math.round(720 - 4 * (28.98 + ha) - dk + 180);
      return ('0' + Math.floor(d / 60)).slice(-2) + ':' + ('0' + d % 60).slice(-2);
    }
    var bugun = new Date(), yarin = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() + 1);
    function yaprak(k) { return new Date(yarin.getFullYear(), yarin.getMonth() + k, yarin.getDate()); }
    var tk = {
      gun: yazi('', 'takvim', 268, 440), ay: yazi('', 'takvim', 268, 526), yil: yazi('', 'takvim', 268, 566), saat: yazi('', 'takvim', 268, 622), not: yazi('Güneş doğuşu · İstanbul', 'takvim', 268, 672), ust: yazi('', 'takvim', 268, 362)
    };
    tk.gun.style.fontSize = '118px'; tk.ay.style.fontSize = '38px'; tk.yil.style.fontSize = '28px'; tk.saat.style.fontSize = '48px'; tk.not.style.fontSize = '20px'; tk.not.style.fontWeight = 500; tk.ust.style.fontSize = '30px'; tk.ust.style.color = '#c23a1f';
    var yaprakNo = -1;
    function takvimYaz(k) {
      if (k === yaprakNo) return; yaprakNo = k;
      var d = yaprak(k);
      tk.gun.textContent = d.getDate(); tk.ay.textContent = AYLAR[d.getMonth()]; tk.yil.textContent = d.getFullYear(); tk.saat.textContent = dogus(d);
      tk.ust.textContent = k === 0 ? 'Yarın' : k === 12 ? 'Bir yıl sonra' : '';
    }

    /* ——— defterdeki yazılar ——— */
    function satirBlok(x, y0, gen) {
      var e = el('div', { class: 'kd-satirlar', style: 'width:' + gen + 'px' }); e._x = x; e._y = y0; api.yazi.appendChild(e); return e;
    }
    var solSayfa = satirBlok(274, 140.7, 470), sagSayfa = satirBlok(856, 140.7, 474);
    var ogrenciBas = el('span', { class: 'kd-satir', text: 'Senin ipucun:' });
    var ogrenciSatir = el('span', { class: 'kd-satir ogrenci' });
    var ogrenciResim = el('img', { class: 'kd-satir-resim', alt: '', hidden: true });
    solSayfa.appendChild(ogrenciBas); solSayfa.appendChild(ogrenciSatir); solSayfa.appendChild(ogrenciResim);
    // Çocuğun seçtiği ipucu defterde görünür
    function ogrenciYaz() {
      var not = api.not('defter'), res = api.notResim('defter');
      if (ogrenciSatir._m !== not) { ogrenciSatir._m = not; ogrenciSatir.textContent = not; }
      if (ogrenciResim._r !== res) { ogrenciResim._r = res; ogrenciResim.hidden = !res; if (res) ogrenciResim.src = res; }
      return not;
    }
    var IPUCLARI = ['Dakikası dakikasına işleyen bir düzen', 'Tam bir ölçü', 'Dönen su', 'Görevli küçükler', 'Herkese uygun özellikler'];
    var satirlar = IPUCLARI.map(function (m) { var s = el('span', { class: 'kd-satir', text: m }); sagSayfa.appendChild(s); return s; });
    function blok(e, o, s, dx, dy) {
      if (o <= 0.003) { e.style.opacity = 0; e.style.visibility = 'hidden'; return; }
      e.style.visibility = 'visible'; e.style.opacity = o.toFixed(3);
      e.style.transform = 'translate(' + (e._x * (s || 1) + (dx || 0)).toFixed(1) + 'px,' + (e._y * (s || 1) + (dy || 0)).toFixed(1) + 'px) scale(' + (s || 1).toFixed(3) + ')';
    }

    /* ——— ipucu izleği ——— */
    var izlek = el('div', { class: 'kd-ipuclari' }, [el('img', { class: 'd', src: api.yol('gorsel/defter-kapali.webp'), alt: '' })]);
    var IKON = ['gunes', 'cicek-acik', 'damla', 'ari-yan', 'canli-kus'], ANLAR = [AN.donus - 0.4, AN.ikinci + 2.2, AN.ucuncu + 0.2, AN.nefes - 2.6, D.canli + 0.9];
    var NOTLAR = ['ipucu: düzen', 'ipucu: ölçü', 'ipucu: dönen su', 'ipucu: görevli küçükler', 'ipucu: uygun özellikler'];
    var noktalar = IKON.map(function (a) { var i = el('i', { style: "background-image:url('" + api.yol('gorsel/' + a + '.webp') + "')" }); i.style.backgroundImage = 'none'; i._ikon = "url('" + api.yol('gorsel/' + a + '.webp') + "')"; izlek.appendChild(i); return i; });
    var notKutu = el('div', { class: 'kd-ipucu-not' });
    api.yazi.appendChild(izlek); api.yazi.appendChild(notKutu);

    /* ——— altın çizgiler ——— */
    function yol(d, oz) { var p = E2('path', Object.assign({ d: d, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, oz || {}), svg); p._boy = 0; return p; }
    // Görsel üzerinde ölçülen çizgiler: tam sahneler %6 taşar, çizgi de aynı ölçeği alır
    var GORSELDE = { transform: 'matrix(1.06 0 0 1.06 -48 -27)' };
    function nokta(p, k) { var u = p.getPointAtLength(olc(p) * k); return { x: 800 + (u.x - 800) * 1.06, y: 450 + (u.y - 450) * 1.06 }; }
    var ALTIN = '#ffe29a';
    var olcuYolu = yol('M1050 245 L660 375', { stroke: ALTIN, 'stroke-width': 4 });
    var S1 = 'M1420 540 C1400 360 1300 170 1060 130', S2 = 'M1060 130 C860 90 640 90 430 120', S3 = 'M430 120 C330 140 210 150 125 222',
      S4 = 'M125 222 C150 240 190 285 215 318 C235 345 258 370 245 395 C236 412 205 418 190 425 C215 440 285 440 318 465 C335 480 320 495 400 505 C440 512 450 545 510 570 C560 585 595 515 610 480 C640 440 720 425 800 430 C860 425 960 450 975 490 C975 515 1000 530 1020 575 C1040 605 1120 612 1220 608 C1300 604 1350 590 1420 572';
    var dongu = [S1, S2, S3, S4].map(function (d) { return yol(d, Object.assign({ stroke: ALTIN, 'stroke-width': 7 }, GORSELDE)); });
    var iplikler = [0, 1, 2, 3, 4].map(function () { return yol('M0 0', { stroke: ALTIN, 'stroke-width': 3 }); });
    var ustCizgi = yol('M512 80 L1088 80', { stroke: '#d8452b', 'stroke-width': 7 });
    function olc(p) { if (!p._boy) { p._boy = p.getTotalLength(); } return p._boy; }
    function cizgiCiz(p, k, o) {
      var b = olc(p);
      p.setAttribute('stroke-dasharray', b + ' ' + b); p.setAttribute('stroke-dashoffset', b * (1 - k));
      p.style.opacity = k <= 0 ? 0 : (o == null ? 1 : o);
    }

    /* ——— ortak katmanlar ——— */
    var PG = 1696, PH = 954;
    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    function hepsi(o, ek) { return Object.assign({}, o || {}, ek); }

    function gunduzVadi(a, sec) {
      sec = sec || {};
      var c = sec.carp, d = sec.doy, ek = sec.ekle, g = sec.gecis, r = sec.ruzgar || 1;
      var ort = { carp: c, doy: d, ekle: ek, gecis: g };
      plaka('gok-altin', hepsi(ort, { d: 0.2, parilti: 1 }));
      var kay = a * (sec.bulutHiz || 3);
      [['bulut-1', 300, 110, 620, 0.5], ['bulut-3', 1180, 170, 300, 0.7], ['bulut-2', 1560, 70, 520, 0.4]].forEach(function (b, i) {
        var x = ((b[1] + kay * b[4]) % 2300) - 350;
        T.ciz(b[0], hepsi(ort, { x: x, y: b[2] + Math.sin(a * 0.2 + i) * 5, g: b[3], d: 0.4 }));
      });
      if (sec.gunesCiz) sec.gunesCiz();
      plaka('vadi-taban', hepsi(ort, { d: 0.85, su: 1, parilti: 0.35 }));
      plaka('vadi-on', hepsi(ort, { d: 1.2, ruzgar: r, x: 790, y: 460 }));
    }
    function geceVadi(a, sec) {
      sec = sec || {};
      plaka('vadi-gece', { su: 1, gecis: sec.gecis });
      plaka('vadi-gece-on', { d: 1.12, ruzgar: 0.7, gecis: sec.gecis, x: 800, y: 454 });
      var kk = sec.gecis ? 1 - sec.gecis.k : 1;
      for (var i = 0; i < 42; i++) {
        var o = (0.25 + 0.5 * (0.5 + 0.5 * Math.sin(a * (0.7 + hash(i, 3)) + i * 2.1))) * (sec.parla || 1) * kk;
        T.iz(hash(i, 1) * 1600, hash(i, 2) * 300, 3.4, 3.4, 0, 1, 0.9, 0.62, o);
      }
      T.izBitir();
    }
    function kalpCiz(t, a, x, yy, g, o) {
      var p = (t % 0.86) / 0.86, v = Math.exp(-p * 9) + (p > 0.24 ? 0.6 * Math.exp(-(p - 0.24) * 11) : 0);
      T.iz(x, yy, g * 0.86, g * 0.86, 0, 1, 0.42, 0.28, (0.14 + 0.28 * v) * o); T.izBitir();
      T.ciz('kalp', { x: x, y: yy, g: g, s: 1 + 0.085 * v, o: o, d: 0.3, parilti: 0.6 });
    }
    function defterCiz(t, k, sec) {
      sec = sec || {};
      var o = Math.min(1, k * 3);
      T.ciz('defter', { x: 800, y: kr(1400, 442, k), g: 1240, r: (1 - k) * -4, o: o, d: 0, gecis: sec.gecis });
    }
    function cicekCiz(a, x, zemin, h, sec) {
      sec = sec || {};
      var soguk = sec.soguk || 0, yanik = sec.yanik || 0, o = sec.o == null ? 1 : sec.o;
      var buk = (sec.buk || 0) + Math.sin(a * 0.8) * 7 + Math.sin(a * 1.9) * 2;
      var sal = soguk * 3 * Math.sin(a * 21);
      var ort = { x: x, y: zemin, h: h, ax: 0.5, ay: 1, buk: buk + sal, d: 1.3 };
      var taban = 1 - Math.max(soguk, yanik);
      T.ciz('cicek-acik', hepsi(ort, { o: o * Math.min(1, taban * 1.6), parilti: 0.5, carp: sec.carp }));
      if (soguk > 0) T.ciz('cicek-soguk', hepsi(ort, { o: o * soguk }));
      if (yanik > 0) T.ciz('cicek-yanik', hepsi(ort, { o: o * yanik }));
    }
    function yagmurCiz(a, x0, gen, y0, boy, n, o) {
      for (var i = 0; i < n; i++) {
        var h = (a * 620 + hash(i, 5) * boy) % boy;
        T.iz(x0 + hash(i, 6) * gen - h * 0.08, y0 + h, 2.2, 17, 0.08, 0.9, 0.97, 1, 0.92 * o * Math.min(1, (boy - h) / 40));
      }
      T.izBitir();
    }
    function buharCiz(a, x0, gen, y0, boy, n, o) {
      for (var i = 0; i < n; i++) {
        var h = (a * 34 + hash(i, 7) * boy) % boy, k = h / boy;
        T.iz(x0 + hash(i, 8) * gen + Math.sin(a * 0.9 + i) * 18, y0 - h, 10 + k * 16, 10 + k * 16, 0, 1, 0.98, 0.9, 0.62 * o * Math.sin(Math.PI * k));
      }
      T.izBitir();
    }

    /* ——— durak durumu ——— */
    var gv = 50, gvSon = 50, cikan = null, kuru = 0, agacYok = 0, meyveYok = 0, ariYok = 0, bulutYok = 0, suTamam = {}, aSimdi = 0;
    var GP0 = [1490, 120], GP1 = [820, 320];
    function gunesBoy(v) { return 74 * Math.pow(9.6, v / 100); }
    function gunesYer(v) { var k = v / 100; return [kr(GP0[0], GP1[0], k), kr(GP0[1], GP1[1], k)]; }
    function gunesEgri(t) {   // ders akarken Güneş'in değeri: yakar, donar, yerine oturur
      if (t < D.gunes) return 50;
      var v = kr(gvSon, 50, tw(t, D.gunes, 0.6));
      v = kr(v, 84, pencere(t, AN.yakar - 0.5, AN.yakar + 0.1, 0.45, 0.4));
      v = kr(v, 14, pencere(t, AN.donar - 0.3, AN.donar + 0.4, 0.4, 0.4));
      return v;
    }

    /* ——— sahne bölümleri ——— */
    function acilis(t) {
      var kx = kr(800, 1000, tw(t, 0, 19, Y.sin)), ky = kr(450, 470, tw(t, 0, 19, Y.sin)), z = kr(1, 1.14, tw(t, 0, 19, Y.sin));
      var ger = tw(t, AN.gun, 3.2, Y.ikili);
      return { x: kr(kx, 800, ger), y: kr(ky, 450, ger), z: kr(z, 1, ger) };
    }
    function acilisCiz(t, a) {
      var sil = { k: tw(t, AN.gun, 3.2, Y.sin), yumusak: 0.14, yon: 1, sil: true };
      if (sil.k < 1) geceVadi(a, { gecis: sil.k > 0 ? sil : null, parla: t > 0 ? 1 + 0.4 * Math.exp(-((t % 0.86) / 0.86) * 8) : 1 });
      if (t > AN.sabah - 0.3 && t < AN.gun + 1.2) {
        var cik = 1 - tw(t, AN.gun, 1, Y.sin), gir = tw(t, AN.sabah - 0.3, 1);
        var ev = [1136, 494], kucul = tw(t, AN.sorgu, 1.9, Y.ikili), don = tw(t, AN.habersiz, 2.2, Y.ikili);
        var x = kr(kr(800, ev[0], kucul), 800, don), yy = kr(kr(350, ev[1], kucul), 340, don), g = kr(kr(330, 58, kucul), 230, don);
        kalpCiz(t, a, x, yy, g, gir * cik);
      }
      var sa = pencere(t, AN.sayi - 0.3, AN.habersiz - 0.1, 0.4, 0.6);
      gos(y.sayi, sa); gos(y.yaklasik, sa); gos(y.gunde, sa);
      if (sa > 0) y.sayi.textContent = Math.round(tw(t, AN.sayi, AN.sayiSon - AN.sayi, Y.ikili) * 100000).toLocaleString('tr-TR');
    }
    function dergahCiz(t, a) {
      var gel = tw(t, AN.sir - 0.3, 1.8, Y.ikili);
      plaka('dergah', { s: kr(1.12, 1, gel), parilti: 0.8, d: 1 });
      var bas = [[105, 'sepet-1'], [265, 'sepet-2'], [425, 'sepet-3'], [585, 'sepet-2'], [1010, 'sepet-1'], [1170, 'sepet-3']];
      var karart = kr(1, 0.72, tw(t, AN.yunus, 0.9));
      bas.forEach(function (b, i) {
        var k = tw(t, AN.herkes - 0.15 + i * 0.28, 0.5, Y.geri);
        if (k <= 0) return;
        T.ciz(b[1], { x: b[0], y: 664, g: 168, ax: 0.5, ay: 1, s: 0.5 + 0.5 * k, o: Math.min(1, k * 2.4), carp: [karart, karart, karart] });
      });
      var bos = tw(t, AN.yunus + 0.15, 0.9, Y.cik);
      if (bos > 0) T.ciz('sepet-bos', { x: 1340, y: 664, g: 150, ax: 0.5, ay: 1, o: Math.min(1, bos * 2), s: 0.85 + 0.15 * bos });
      if (t < AN.herkes + 1) for (var i = 0; i < 26; i++) {   // toplanan çiçeklerin yaprakları dergâha doğru uçar
        var pr = hash(i, 11), yk = ic(t, AN.taptuk + pr * 3, 2.2);
        if (yk <= 0 || yk >= 1) continue;
        T.iz(kr(-40, 1640, yk), 300 + hash(i, 12) * 420 + Math.sin(yk * 9 + i) * 40, 8, 4.5, yk * 9 + i, 0.92, 0.3, 0.16, Math.sin(yk * Math.PI) * 0.9);
      }
      T.izBitir();
      var sor = T.ekran(1340, 500); y.soru._x = sor.x; y.soru._y = sor.y;
      gos(y.soru, pencere(t, AN.neden - 0.05, AN.ilk + 0.2, 0.3, 0.4), 0, Y.geri(ic(t, AN.neden - 0.05, 0.4)));
    }
    function dergahKamera(t) {
      var yak = tw(t, AN.neden - 1.1, 2.1, Y.ikili) * (1 - tw(t, AN.ilk, 1, Y.ikili));
      return { x: kr(800, 1250, yak), y: kr(450, 590, yak), z: kr(1, 1.5, yak) };
    }
    function gunesYolu(t) {   // doğuş: yükselir; dönüş: gökte yay çizer
      var yuks = tw(t, AN.gunes, 9, Y.sin), dd = ic(t, AN.donus, AN.mevsim - AN.donus);
      var x = 800, yy = kr(430, 176, yuks), g = kr(240, 260, yuks);
      if (dd > 0) { var f = dd * 2 % 1, s = Math.PI * f; x = 800 - Math.cos(s) * 780; yy = 430 - Math.sin(s) * 330; }
      var bit = tw(t, AN.mevsim, 2.2, Y.ikili);
      return { x: kr(x, 1150, bit), y: kr(yy, 225, bit), g: kr(g, gunesBoy(50), bit) };
    }
    function gunesSahnesi(t, a) {
      var s = gunesYolu(t), sabah = tw(t, AN.gunes - 0.6, 7, Y.sin);
      var c = kr(0.56, 1, sabah), renk = [c, kr(0.6, 1, sabah), kr(0.74, 1, sabah)];
      gunduzVadi(a, { carp: renk, gunesCiz: function () { T.ciz('gunes', { x: s.x, y: s.y, g: s.g, r: a * 2, parilti: 1, d: 0.3 }); } });
      // gece ve gündüz: Güneş batınca altın gök lacivertle örtülür
      var dd = ic(t, AN.donus, AN.mevsim - AN.donus);
      if (dd > 0 && dd < 1 && !api.azHareket) { var f = dd * 2 % 1, gece = Math.pow(Math.abs(Math.cos(Math.PI * f)), 3) * Math.sin(Math.PI * dd); plaka('vadi-gece', { o: gece, d: 0.85 }); }
      // mevsimler sırayla: kenardan kenara süzülür
      var m = AN.mevsim, ad = (AN.olcu - m) / 4.1;
      if (t >= m) {
        if (t < m + ad * 2) plaka('vadi-yaz', { gecis: { k: ic(t, m, ad), yon: 2, yumusak: 0.05, ac: true }, su: 1, parilti: 0.7 });
        if (t >= m + ad && t < m + ad * 3) plaka('vadi-sonbahar', { gecis: { k: ic(t, m + ad, ad), yon: 2, yumusak: 0.05, ac: true }, su: 1, parilti: 0.7 });
        if (t >= m + ad * 2 && t < m + ad * 3) plaka('vadi-kis', { gecis: { k: ic(t, m + ad * 2, ad), yon: 2, yumusak: 0.05, ac: true }, su: 1, parilti: 0.7 });
        // kıştan bahara dönüş: vadinin kendisi kıştan sıyrılır
        if (t >= m + ad * 3 && t < m + ad * 4.1) plaka('vadi-kis', { gecis: { k: ic(t, m + ad * 3, ad * 1.1), yon: 2, yumusak: 0.05, sil: true }, su: 1, parilti: 0.7 });
      }
      var tGir = tw(t, AN.takvim - 0.2, 0.7, Y.geri), tCik = tw(t, AN.donus - 0.5, 0.6, Y.gir), tx = kr(-260, 268, tGir) - tCik * 600;
      if (tGir > 0 && tCik < 1) {
        T.ciz('takvim', { x: tx, y: 472, g: 330, d: 0 });
        var k = t < AN.yil ? 0 : Math.round(12 * ic(t, AN.yil + 0.1, 1.05));
        takvimYaz(k);
        var o = Math.min(tGir, 1) * (1 - tCik);
        Object.keys(tk).forEach(function (n) { tk[n]._x = tx; gos(tk[n], o); });
      } else Object.keys(tk).forEach(function (n) { gos(tk[n], 0); });
      gos(y.randevu, pencere(t, AN.randevu + 0.8, AN.gec - 0.1), tw(t, AN.randevu + 0.8, 0.5) * -6 + 6);
      gos(y.gec, pencere(t, AN.gec - 0.05, AN.donus, 0.2, 0.3), 0, kr(1.25, 1, tw(t, AN.gec - 0.05, 0.25)));
      gos(y.erken, pencere(t, AN.erken - 0.05, AN.donus, 0.2, 0.3), 0, kr(1.25, 1, tw(t, AN.erken - 0.05, 0.25)));
    }
    function cayirYuksek(t) {
      return tw(t, AN.olcu - 0.3, 1.7, Y.ikili) * (1 - tw(t, AN.saskin + 0.4, 1.1, Y.gir));
    }
    function cicekSahnesi(t, a) {
      var yuk = cayirYuksek(t), v = api.acikDurak() === 'gunes' ? gv : gunesEgri(t);
      var soguk = Math.min(1, Math.max(0, (32 - v) / 26)), sicak = Math.min(1, Math.max(0, (v - 62) / 30));
      // Uzakta ışık azalır, her yer soğuk maviye döner; yakında ışık sertleşir, her yer kızıllaşır
      var los = kr(1, 0.72, soguk);
      var renk = [kr(kr(1, 0.62, soguk), 1.16, sicak) * los, kr(kr(1, 0.76, soguk), 0.84, sicak) * los, kr(kr(1, 1.02, soguk), 0.62, sicak) * los];
      var ekle = [0.12 * sicak, 0.02 * sicak, 0];
      var p = gunesYer(v), g = gunesBoy(v) * (1 + 0.05 * pencere(t, AN.eline, D.gunes) * Math.sin(a * 6)), susuz = pencere(t, AN.susuz, AN.saskin, 0.9, 0.5);
      var mevsim = Math.max(soguk, sicak);
      function gunes() { T.ciz('gunes', { x: p[0], y: p[1], g: g, r: a * 2, parilti: 1, d: 0.3 }); }
      gunduzVadi(a, {
        carp: renk, ekle: ekle, doy: kr(1, 0.62, soguk),
        gunesCiz: function () { if (g < 380 && mevsim < 0.02) gunes(); }
      });
      // Vadi gerçekten değişir: uzakta kar örter, yakında otlar sararıp kavrulur
      if (soguk > 0.01) plaka('vadi-kis', { o: Math.min(1, soguk * 1.2), su: 1, parilti: 0.5, carp: [0.8 * los, 0.88 * los, 1.04 * los] });
      if (sicak > 0.01) plaka('vadi-sonbahar', { o: Math.min(1, sicak * 1.15), parilti: 0.3, carp: [1.14, 0.74, 0.54], ekle: [0.06 * sicak, 0.01 * sicak, 0] });
      if (g < 380 && mevsim >= 0.02) gunes();
      // Yakın Güneş'in sıcak halesi
      if (sicak > 0.02) { T.iz(p[0], p[1], g * 1.5, g * 1.5, 0, 1, 0.66, 0.3, 0.32 * sicak); T.iz(p[0], p[1], g * 2.3, g * 2.3, 0, 1, 0.5, 0.2, 0.16 * sicak); T.izBitir(); }
      T.ciz('cayir', { g: PG, h: PH, y: 450 + (1 - yuk) * 560, d: 1.28, ruzgar: 1, carp: sicak > 0 ? [renk[0] * 1.06, renk[1] * 0.92, renk[2] * 0.62] : renk, ekle: [ekle[0] + 0.26 * soguk, ekle[1] + 0.3 * soguk, ekle[2] + 0.36 * soguk], doy: kr(kr(1, 0.7, soguk), 0.55, sicak) });
      if (g >= 380) gunes();
      if (soguk > 0.02) { for (var i = 0; i < 110; i++) { var h = (a * (46 + hash(i, 25) * 30) + hash(i, 21) * 900) % 900, bk = 3 + hash(i, 26) * 4.5 * soguk; T.iz(hash(i, 22) * 1600 + Math.sin(a + i) * 22, h, bk, bk, 0, 1, 1, 1, 0.85 * soguk); } T.izBitir(); }
      if (sicak > 0.02) { for (var j = 0; j < 70; j++) { var q = (a * 140 + hash(j, 23) * 520) % 520; T.iz(320 + hash(j, 24) * 520 + Math.sin(a * 2 + j) * 24, 900 - q, 3.4, 3.4, 0, 1, 0.56, 0.16, 0.9 * sicak * (1 - q / 520)); } T.izBitir(); }
      var boy = tw(t, AN.olcu + 0.1, 1.2, Y.geri) * (1 - tw(t, AN.saskin + 0.3, 0.8, Y.gir));
      if (boy > 0.01) cicekCiz(a, 540, 910, 700 * boy, { soguk: soguk, yanik: sicak, buk: 34 * sicak + 80 * susuz, carp: susuz ? [1 - susuz * 0.25, 1 - susuz * 0.2, 1 - susuz * 0.2] : null });
      // damla: "Su."
      var dm = ic(t, AN.su - 0.45, 0.55);
      if (dm > 0 && t < AN.saskin + 1.3) {
        var buyu = tw(t, AN.saskin + 0.1, 1.15, Y.gir), dy = kr(-60, 420, dm * dm);
        T.ciz('damla', { x: kr(600, 800, buyu), y: kr(dy, 450, buyu), g: kr(76, 1500, buyu), d: 0 });
      }
    }
    function haritaKamera(t) {
      var bak = [[900, 180, 1.55], [470, 500, 1.65], [1320, 600, 1.55]], k = { x: 800, y: 450, z: 1 };
      var g = tw(t, AN.bulut - 0.5, 0.8, Y.ikili), i1 = tw(t, AN.irmak - 0.4, 0.7, Y.ikili), i2 = tw(t, AN.deniz - 0.4, 0.7, Y.ikili), d = tw(t, AN.yuksel - 0.1, 1.2, Y.ikili);
      var x = kr(kr(bak[0][0], bak[1][0], i1), bak[2][0], i2), yy = kr(kr(bak[0][1], bak[1][1], i1), bak[2][1], i2), z = kr(kr(bak[0][2], bak[1][2], i1), bak[2][2], i2);
      k.x = kr(kr(800, x, g), 800, d); k.y = kr(kr(450, yy, g), 450, d); k.z = kr(kr(1, z, g), 1, d);
      var dalis = tw(t, AN.kucul - 0.1, 1.3, Y.ikili);
      k.x = kr(k.x, 640, dalis); k.y = kr(k.y, 620, dalis); k.z = kr(k.z, 2.6, dalis);
      return k;
    }
    function haritaCiz(t, a, sil) {
      plaka('su-haritasi', { su: 1, parilti: 0.8, gecis: sil });
      if (sil && sil.k >= 1) return;
      var bh = pencere(t, AN.yuksel, AN.bulutOl + 0.7, 0.5, 0.6);
      var d1 = suDolu(0, t, a), d2 = suDolu(1, t, a), d3 = suDolu(2, t, a), d4 = suDolu(3, t, a);
      if (bh > 0 || d1) buharCiz(a, 1220, 340, 520, 300, 44, Math.max(bh, d1 ? 0.8 : 0));
      if (bh > 0) { buharCiz(a, 660, 280, 520, 220, 18, bh); buharCiz(a, 300, 400, 620, 220, 16, bh); }
      var bg = tw(t, AN.bulutOl - 0.3, 0.8, Y.geri), bm = tw(t, AN.yagmur - 0.25, 0.8, Y.ikili), bcik = 1 - tw(t, AN.yeniden, 0.7);
      var ax = t > AN.bulut - 0.5 && t < AN.irmak ? 1 : 0;
      if (ax) T.ciz('bulut-3', { x: 900, y: 150, g: 360, o: pencere(t, AN.bulut - 0.3, AN.irmak - 0.25, 0.4, 0.3) });
      if (bg > 0 && bcik > 0) {
        T.ciz(bm > 0.5 ? 'bulut-yagmur' : 'bulut-1', { x: kr(1060, 430, bm), y: kr(130, 124, bm), g: kr(430, 400, bm), s: bg, o: bcik });
        if (t > AN.yagmur) yagmurCiz(a, 230, 400, 150, 280, 90, pencere(t, AN.yagmur, AN.yeniden - 0.2, 0.4, 0.4));
      }
      // akan damla ve bütün yol
      var ak = ic(t, AN.toprak, AN.yeniden - AN.toprak);
      var gor = t < AN.yarim ? 1 : 0;
      cizgiCiz(dongu[3], ak * gor, 1);
      if (ak > 0 && ak < 1) { var u = nokta(dongu[3], ak); T.ciz('damla', { x: u.x, y: u.y, g: 46 }); }
      var dn = ic(t, AN.yeniden, 1.5);
      [0, 1, 2].forEach(function (i) { cizgiCiz(dongu[i], tw(t, AN.yeniden + i * 0.4, 0.5) * gor, 1); });
      if (t >= AN.yarim) {
        // yol yarım kalır: duraktan sonra doldukça yeniden belirir
        var yolO = 1 - tw(t, AN.kucul - 0.1, 0.4);
        cizgiCiz(dongu[0], 1, yolO);
        cizgiCiz(dongu[1], d1 ? 1 : 0, yolO); cizgiCiz(dongu[2], d2 ? 1 : 0, yolO); cizgiCiz(dongu[3], d3 ? 1 : 0, yolO);
        if (d1) T.ciz('bulut-1', { x: 1060, y: 130, g: 400, s: Math.min(1, d1) });
        if (d2) { T.ciz('bulut-yagmur', { x: 430, y: 124, g: 400, s: Math.min(1, d2) }); yagmurCiz(a, 230, 400, 150, 280, 70, Math.min(1, d2)); }
        if (d3 && yolO > 0) {
          var p = nokta(dongu[3], (a * 0.11) % 1);
          T.ciz('damla', { x: p.x, y: p.y, g: 42, o: yolO });
        }
      } else if (dn > 0 && t < AN.yarim) { var q = nokta(dongu[0], dn); T.ciz('damla', { x: q.x, y: q.y, g: 40 }); }
    }
    function suDolu(i, t, a) {
      // 0: buhar hep vardır; 1 bulut, 2 yağmur, 3 toprak ve ırmak doldukça
      if (t >= D.su && api.acikDurak() !== 'su') return 1;
      if (i === 0) return t >= AN.yarim ? 1 : 0;
      var s = suTamam[i];
      return s == null ? 0 : Math.max(0.01, Math.min(1, (a - s) / 0.6));
    }
    function bahceKamera(t) {
      var k = { x: 800, y: 450, z: 1 }, g = tw(t, AN.kucul + 0.6, 1.2, Y.cik);
      k.z = kr(1.6, 1, g); k.y = kr(380, 450, g);
      var ar = pencere(t, AN.ari, AN.tohum, 0.6, 0.6), tm = pencere(t, AN.tohum - 0.1, AN.verir + 0.9, 0.7, 1.1), fb = tw(t, AN.fabrika, 1, Y.ikili);
      k.x = kr(k.x, 1040, ar * 0.7); k.y = kr(k.y, 340, ar); k.z = kr(k.z, 1.24, ar);
      k.y = kr(k.y, kr(600, 590, fb), tm); k.z = kr(k.z, kr(1.5, 1.22, fb), tm);
      return k;
    }
    function bahceCiz(t, a, sil) {
      plaka('bahce', { parilti: 0.9, ruzgar: 0.5, gecis: sil });
      if (kuru > 0.005) plaka('bahce-kuru', { gecis: { k: kuru, yumusak: 0.1, ac: true }, parilti: 0.4 });
      if (sil && sil.k >= 1) return;
      var kal = sil ? 1 - sil.k : 1;
      var buyu = tw(t, AN.verir + 0.2, 2.4, Y.cik);
      var hayalet = pencere(t, kel('ağaç') - 0.4, AN.fabrika + 0.1, 0.5, 0.5);
      var tohumO = pencere(t, AN.tohum - 0.2, AN.verir + 1.1, 0.4, 0.5);
      if (hayalet > 0) T.ciz('agac-yalin', { x: 800, y: 604, g: 540, ax: 0.5, ay: 1, doy: 0, carp: [1, 0.86, 0.5], o: hayalet * 0.34, parilti: 1 });
      if (buyu > 0 && agacYok < 0.995) {
        var meyve = tw(t, kel('meyve') - 0.1, 0.9);
        var silAgac = sil || (agacYok > 0 ? { k: agacYok, yumusak: 0.1, sil: true } : null);
        var ort = { x: 800, y: 604, g: 540, ax: 0.5, ay: 1, s: 0.1 + 0.9 * buyu, buk: Math.sin(a * 0.9) * 5, gecis: silAgac };
        // Susuz kalan ağaç da sararır, yaprağı solar, meyvesi azalır
        if (kuru > 0.005) { ort.carp = [1 - 0.1 * kuru, 1 - 0.3 * kuru, 1 - 0.55 * kuru]; ort.doy = 1 - 0.6 * kuru; ort.buk += 4 * kuru; }
        T.ciz('agac-yalin', ort);
        var mo = meyve * (1 - meyveYok) * (1 - 0.8 * kuru);
        if (mo > 0) T.ciz('agac', hepsi(ort, { gecis: silAgac || { k: mo, yumusak: 0.08, ac: true } }));
      }
      if (tohumO > 0) {
        T.ciz('tohum', { x: 800, y: 640, g: kr(150, 64, tw(t, AN.fabrika, 1)), o: tohumO, r: -8 });
        if (t > AN.fabrika && t < AN.verir + 1) for (var i = 0; i < 80; i++) {   // toprağın işi: gözenekten tohuma akan damlalar
          var k = (a * 0.16 + hash(i, 31)) % 1, kk = Y.ikili(k), yan = hash(i, 32) > 0.5 ? 1 : -1, sx = 800 + yan * (120 + hash(i, 33) * 620), sy = 650 + hash(i, 34) * 240;
          T.iz(kr(sx, 800, kk), kr(sy, 642, kk), 6, 6, 0, 1, 0.9, 0.56, Math.sin(k * Math.PI) * pencere(t, AN.fabrika + 0.1, AN.verir + 0.7));
        }
        T.izBitir();
      }
      if (t > AN.verir && agacYok > 0.6) T.ciz('tohum', { x: 800, y: 590, g: 74 });
      // arı
      var ariGel = tw(t, AN.ari - 0.5, 1.2, Y.cik), buyukAri = pencere(t, AN.ari - 0.5, AN.tohum - 0.4, 0.5, 0.6);
      if (buyukAri > 0) {
        var ax = kr(1760, 1010, ariGel) + Math.sin(a * 2.3) * 12, ay = 330 + Math.sin(a * 3.1) * 12;
        T.ciz('ari', { x: ax, y: ay, g: 340, r: Math.sin(a * 2.3) * 3, o: buyukAri });
        var pt = pencere(t, kel('bal') - 0.2, AN.tohum - 0.4, 0.3, 0.4);
        if (pt > 0) T.ciz('petek', { x: 1320, y: 330, g: 150, s: kr(0.6, 1, pt), o: pt });
      }
      var kucukGel = tw(t, AN.onemsiz - 0.5, 1.4, Y.ikili);
      if (kucukGel > 0 && ariYok < 0.99) {
        for (var b = 0; b < 3; b++) {
          var fz = a * (1.3 + b * 0.2) + b * 2;
          T.ciz('ari-yan', { x: kr(1640, 1120 + b * 90, kucukGel) + Math.cos(fz) * 44, y: 350 + b * 42 + Math.sin(fz * 1.4) * 26, g: 92, r: Math.cos(fz) * 12, o: (1 - ariYok) * kal });
        }
      }
      var bulutK = tw(t, AN.cikar - 0.4, 1.2, Y.ikili) * (1 - tw(t, D.bahce + 2.2, 1.3));
      if (bulutK > 0 && bulutYok < 0.99) {
        var bo = bulutK * (1 - bulutYok) * kal;
        T.ciz('bulut-yagmur', { x: kr(-260, 560, bulutK) - bulutYok * 600, y: 150, g: 460, o: bo });
        yagmurCiz(a, 390, 340, 210, 370, 54, bo);
      }
    }
    function nefesCiz(t, a, sil, kapali) {
      var al = tw(t, AN.nefes, 2.1, Y.sin), ver = tw(t, AN.aldin + 0.3, 1.6, Y.sin), r = 1 + 2.2 * al * (1 - ver);
      var dus = tw(t, AN.oksijen - 0.5, 0.9, Y.ikili), bed = tw(t, AN.beden, 1.1, Y.ikili);
      gunduzVadi(a, { ruzgar: r, bulutHiz: 3 + 34 * al * (1 - ver) });
      var koyu = Math.max(dus, bed);
      if (koyu > 0) plaka('vadi-gece', { o: koyu * 0.94, su: 1 });
      if (al > 0 && ver < 1) for (var i = 0; i < 24; i++) {   // nefesle gelen hava
        var h = (a * 0.24 + hash(i, 41)) % 1; T.iz(1660 - h * 1800, 120 + hash(i, 42) * 560 + Math.sin(h * 8 + i) * 26, 30, 2.4, 0.04, 1, 0.97, 0.88, 0.44 * Math.sin(h * Math.PI) * al * (1 - ver));
      }
      T.izBitir();
      var pano = pencere(t, AN.oksijen - 0.1, AN.beden, 0.7, 0.8);
      if (pano > 0) {
        var X0 = 736, Y0 = 118, O = 64, cok = pencere(t, AN.cok, AN.az - 0.1, 0.8, 0.6), az = pencere(t, AN.az, AN.nimet, 0.8, 0.7);
        var n = Math.round(21 + 19 * cok - 13 * az), sa = Math.floor(pano * 100 * 2.2);
        for (var q = 0; q < 100 && q < sa; q++) {
          var sira = tileSira[q], tx = X0 + (q % 10) * O + O / 2, ty = Y0 + Math.floor(q / 10) * O + O / 2, yan2 = sira < n;
          var fazla = sira >= 21 && yan2;
          T.ciz('cini-a', { x: tx, y: ty, g: O - 3, s: Math.min(1, (pano * 2.2 * 100 - q) / 26), o: pano, d: 0, parilti: yan2 ? 0.5 : 0, carp: !yan2 ? [0.17, 0.23, 0.5] : fazla ? [1.14, 0.56, 0.42] : null });
        }
      }
      gos(y.yuzde, pano); gos(y.oksijen, pano);
      if (pano > 0) y.yuzde.textContent = '%21';
      gos(y.yakar, pencere(t, AN.cok, AN.az - 0.1)); gos(y.yasayamaz, pencere(t, AN.az, AN.nimet - 0.1));
      gos(y.nimet, pencere(t, AN.nimet, AN.beden - 0.1), kr(10, 0, tw(t, AN.nimet, 0.4)), 0.86);
      // beden: yüz ve insan çizilmez, yalnız sözcükler
      var dp = pencere(t, AN.susa - 0.3, AN.goz - 0.1, 0.5, 0.4);
      if (dp > 0) { T.ciz('damla', { x: 800, y: 330, g: 130 + Math.sin(a * 3) * 6, o: dp, d: 0 }); }
      gos(y.goz, pencere(t, AN.goz + 0.02, AN.kus - 0.2, 0.3, 0.4), 0, Y.geri(ic(t, AN.goz + 0.02, 0.35)));
      gos(y.kulak, pencere(t, kel('kulağın') - 0.1, AN.kus - 0.2, 0.3, 0.4), 0, Y.geri(ic(t, kel('kulağın') - 0.1, 0.35)));
      gos(y.burun, pencere(t, kel('burnun') - 0.1, AN.kus - 0.2, 0.3, 0.4), 0, Y.geri(ic(t, kel('burnun') - 0.1, 0.35)));
      var MED = [[261, 'canli-kus', AN.kus], [620, 'canli-balik', kel('balık')], [980, 'canli-deve', kel('özellikler') - 0.6], [1339, 'canli-ari', kel('özellikler') - 0.2]];
      if (api.acikDurak() !== 'canli') MED.forEach(function (m) {
        var k = tw(t, m[2] - 0.15, 0.5, Y.geri), o = Math.min(1, k * 2) * (1 - tw(t, D.canli + 0.2, 0.9));
        if (o > 0) T.ciz(m[1], { x: m[0], y: 258, g: 258, s: 0.7 + 0.3 * k, o: o, d: 0, parilti: 0.6 });
      });
    }
    var tileSira = (function () { var d = []; for (var i = 0; i < 100; i++) d.push(i); return d.sort(function (a, b) { return hash(a, 51) - hash(b, 51); }).reduce(function (s, v, i) { s[v] = i; return s; }, []); })();

    function yazBittir(e, k) { e.style.maxWidth = k >= 1 ? 'none' : (k * 620).toFixed(0) + 'px'; }
    function satirlarCiz(t, a, o, s, dxSol, dxSag, dy) {
      var so = ogrenciYaz() ? o : 0;
      blok(solSayfa, so, s, dxSol, dy); blok(sagSayfa, o, s, dxSag, dy);
      [AN.s1, AN.s2, AN.s3, AN.s4, AN.s5].forEach(function (b, i) { yazBittir(satirlar[i], tw(t, b - 0.05, 0.9, Y.sin)); satirlar[i].style.opacity = t >= b - 0.05 ? 1 : 0; });
    }
    function sirSahnesi(t, a) {
      var yuk = tw(t, AN.yunus2 - 0.8, 1.6, Y.ikili) * (1 - tw(t, AN.bakinca + 0.4, 1.8, Y.ikili));
      gunduzVadi(a, { ruzgar: 0.9 });
      T.ciz('cayir', { g: PG, h: PH, y: 450 + (1 - yuk) * 560, d: 1.28, ruzgar: 1 });
      var ci = tw(t, AN.yunus2 - 0.4, 1.4, Y.geri) * (1 - tw(t, AN.bakinca + 0.3, 1.5, Y.ikili));
      var buyu = tw(t, AN.egil - 0.5, 2.2, Y.ikili);
      if (ci > 0.01) cicekCiz(a, kr(620, 800, buyu), 915, kr(620, 780, buyu) * ci, {});
      var sepet = pencere(t, AN.yunus2 - 0.2, AN.egil + 0.8, 0.7, 0.8);
      if (sepet > 0) T.ciz('sepet-bos', { x: 1060, y: 800, g: 230, ax: 0.5, ay: 1, o: sepet });
      var uclar = [[1270, 170, 'gunes', 210], [1310, 530, 'ari-yan', 200], [280, 500, 'tohum', 150], [310, 170, 'damla', 104], [1020, 88, 'canli-kus', 130]];
      var dag = tw(t, AN.kiyama, 2.2, Y.sin);
      uclar.forEach(function (u, i) {
        var bas = AN.egil + 0.25 + i * 0.72, k = tw(t, bas, 0.9, Y.ikili), o = (1 - dag) * Math.min(1, k * 2.2);
        var mx = 800, my = 305, nx = kr(mx, u[0], k), ny = kr(my, u[1], k);
        var d = 'M' + mx + ' ' + my + ' Q' + ((mx + u[0]) / 2) + ' ' + (Math.min(my, u[1]) - 50) + ' ' + nx.toFixed(1) + ' ' + ny.toFixed(1);
        iplikler[i].setAttribute('d', d);
        iplikler[i].style.opacity = k > 0 ? o : 0;
        if (k > 0.45 && o > 0) T.ciz(u[2], { x: u[0], y: u[1] + Math.sin(a * 0.8 + i) * 5, g: u[3], s: Y.geri(ic(t, bas + 0.4, 0.5)), o: o, d: 0, parilti: 0.7 });
      });
    }
    function iplikKapat() { iplikler.forEach(function (p) { p.style.opacity = 0; }); }

    /* ——— kare ——— */
    function ciz(t, a) {
      aSimdi = a;
      // durakların sahneye etkisi yavaşça oturur
      var kh = cikan === 'yagmur' || cikan === 'toprak' ? 1 : 0;
      kuru += (kh - kuru) * 0.05; agacYok += ((cikan === 'toprak' ? 1 : 0) - agacYok) * 0.05;
      meyveYok += ((cikan === 'ari' ? 0.62 : 0) - meyveYok) * 0.05;   // arı yoksa meyve azalır, hepsi gitmez ariYok += ((cikan === 'ari' ? 1 : 0) - ariYok) * 0.06;
      bulutYok += ((cikan === 'yagmur' ? 1 : 0) - bulutYok) * 0.05;

      var gerek = t < AN.sir + 1.5 ? acilis(t) : null;
      var bol;
      if (t < AN.sir + 0.2) bol = 0;
      else if (t < AN.gunes - 0.1) bol = 1;
      else if (t < AN.olcu) bol = 2;
      else if (t < AN.saskin + 1.5) bol = 3;
      else if (t < AN.bak) bol = 4;
      else if (t < AN.nefes - 0.15) bol = 5;
      else if (t < AN.doldu - 0.2) bol = 6;
      else if (t < AN.yerde) bol = 7;
      else if (t < AN.sirZaman + 2.5) bol = 8;
      else if (t < AN.gelecek + 0.2) bol = 9;
      else bol = 10;

      if (bol === 0) {
        T.bas(a, gerek);
        if (t > AN.gun) gunduzVadi(a, {});
        acilisCiz(t, a);
      } else if (bol === 1) {
        T.bas(a, dergahKamera(t));
        dergahCiz(t, a);
        var geciyor = 1 - tw(t, AN.sir - 0.2, 1.3, Y.sin);
        if (geciyor > 0) gunduzVadi(a, { gecis: { k: 1 - geciyor, yon: 2, yumusak: 0.1, sil: true } });
        if (t > AN.ilk - 0.4) defterCiz(t, tw(t, AN.ilk - 0.2, 1, Y.ikili) * (1 - tw(t, AN.guzel + 2.3, 0.8, Y.gir)));
        gos(y.ilk, pencere(t, AN.ilk + 0.4, D.defter - 0.2, 0.5, 0.2));
        var so = pencere(t, AN.guzel - 0.2, AN.guzel + 2.3, 0.5, 0.3);
        blok(solSayfa, ogrenciYaz() ? so : 0, 1, 0, 0);
      } else if (bol === 2) {
        T.bas(a, { x: 800, y: 450, z: 1 });
        gunesSahnesi(t, a);
        var s0 = tw(t, AN.gunes - 0.1, 1.2, Y.sin);
        if (s0 < 1) { plaka('dergah', { gecis: { k: s0, yon: 2, yumusak: 0.1, sil: true } }); }
      } else if (bol === 3) {
        T.bas(a, { x: 800, y: kr(450, 410, cayirYuksek(t)), z: 1 });
        cicekSahnesi(t, a);
        var ol = pencere(t, AN.olcu + 0.3, AN.yaOyle - 0.05, 0.5, 0.3);
        cizgiCiz(olcuYolu, tw(t, AN.olcu + 0.2, 1.3, Y.sin), ol); gos(y.tam, ol);
      } else if (bol === 4) {
        var hk = haritaKamera(t), gk = bahceKamera(t), dali = tw(t, AN.kucul + 0.5, 1.1, Y.sin);
        if (t >= AN.kucul + 0.2) {
          T.bas(a, gk); bahceCiz(t, a);
          T.bas2(hk); haritaCiz(t, a, { k: dali, yon: 3, yumusak: 0.1, sil: true });
        } else {
          T.bas(a, hk); haritaCiz(t, a, null);
          var ac = tw(t, AN.saskin + 0.75, 0.6, Y.sin);
          if (ac < 1) T.ciz('damla', { x: 800, y: 450, g: 1500, d: 0, gecis: { k: ac, yon: 3, yumusak: 0.1, sil: true } });
        }
      } else if (bol === 5) {
        var gkk = bahceKamera(t);
        T.bas(a, gkk); bahceCiz(t, a);
        dongu.forEach(function (p) { p.style.opacity = 0; });
      } else if (bol === 6) {
        var alz = tw(t, AN.nefes, 2.1, Y.sin) * (1 - tw(t, AN.aldin + 0.3, 1.6, Y.sin));
        T.bas(a, { x: 800, y: 430, z: 1 + 0.09 * alz });
        nefesCiz(t, a);
        var sb = tw(t, AN.nefes - 0.15, 1.2, Y.sin);
        if (sb < 1) { T.bas2({ x: 800, y: 450, z: 1 }); bahceCiz(t, a, { k: sb, yon: 1, yumusak: 0.12, sil: true }); }
      } else if (bol === 7) {
        T.bas(a, { x: 800, y: 450, z: 1 });
        plaka('vadi-gece', { su: 1 });
        var dk2 = tw(t, AN.doldu - 0.2, 1, Y.ikili) * (1 - tw(t, AN.buyuk + 0.4, 1, Y.gir));
        if (dk2 > 0) defterCiz(t, dk2);
        satirlarCiz(t, a, dk2 >= 0.97 ? 1 : 0, 1, 0, 0, 0);
        gos(y.buyuk, pencere(t, AN.kendilik - 0.3, AN.yerde - 0.45, 0.5, 0.4));
      } else if (bol === 8) {
        T.bas(a, { x: 800, y: 450, z: 1 });
        plaka('kagit', { d: 0 });
        var solma = tw(t, AN.hic, 3.2, Y.sin);
        var ks = tw(t, AN.yerde, 0.9, Y.sin);
        if (solma < 1) { plaka('defter-cayirda', { gecis: { k: solma, yumusak: 0.16, sil: true }, ruzgar: 0.4 }); }
        if (ks < 1) plaka('vadi-gece', { gecis: { k: ks, yon: 3, yumusak: 0.1, sil: true } });
        // defterin yazısı çayırda da duruyor
        var ty = pencere(t, AN.yerde + 0.3, AN.hic + 0.5, 0.6, 0.8);
        satirlarCiz(t, a, ty, 0.85, 105, 134, 51);
        var ku = pencere(t, AN.yerde + 1.6, AN.hic - 0.2, 0.5, 0.4);
        gos(y.kendi, ku);
        cizgiCiz(ustCizgi, tw(t, AN.demezsin, 0.4), ku);
        gos(y.k1, pencere(t, AN.hic + 0.1, AN.alem - 0.9, 0.9, 0.7), kr(8, 0, tw(t, AN.hic + 0.1, 0.9)));
        gos(y.k2, pencere(t, AN.edemeyen, AN.alem - 0.9, 0.9, 0.7), kr(8, 0, tw(t, AN.edemeyen, 0.9)));
        gos(y.k3, pencere(t, AN.alem, AN.yalniz - 0.5, 1.1, 0.5), kr(8, 0, tw(t, AN.alem, 1.1)));
        gos(y.k4, pencere(t, AN.yalniz, AN.arkadas - 0.5, 0.9, 0.6), kr(8, 0, tw(t, AN.yalniz, 0.9)));
        gos(y.k5, pencere(t, AN.bugun, AN.arkadas - 0.5, 0.9, 0.6), kr(8, 0, tw(t, AN.bugun, 0.9)));
        if (t > AN.arkadas - 0.2) { defterCiz(t, tw(t, AN.arkadas - 0.2, 1.1, Y.ikili) * (1 - tw(t, D.arkadas + 0.1, 0.9, Y.gir))); }
        if (t > AN.sirZaman - 0.5) {
          var ren = tw(t, AN.sirZaman - 0.3, 2.6, Y.sin);
          gunduzVadi(a, { ruzgar: 0.9, gecis: { k: ren, yon: 1, yumusak: 0.2, ac: true } });
        }
      } else if (bol === 9) {
        T.bas(a, { x: 800, y: kr(450, 410, tw(t, AN.yunus2 - 0.8, 1.6, Y.ikili) * (1 - tw(t, AN.bakinca + 0.4, 1.8, Y.ikili))), z: 1 });
        sirSahnesi(t, a);
      } else {
        T.bas(a, { x: 800, y: 450, z: kr(1, 1.05, tw(t, AN.gelecek, 7, Y.sin)) });
        gunduzVadi(a, {});
        var ge = tw(t, AN.gelecek + 1.3, 3.4, Y.sin);
        if (ge > 0) geceVadi(a, { gecis: { k: ge, yon: 1, yumusak: 0.16, ac: true } });
        gos(y.gelecek, pencere(t, AN.gelecek + 0.1, AN.emanet - 0.2, 0.5, 0.6));
        if (t > AN.emanet) kalpCiz(t, a, 1136, 494, 44, tw(t, AN.emanet, 1.4));
      }

      // bölüm dışına çıkan yazılar ve çizgiler kapanır
      gorunurluk(t, bol);
      ipucuIzlek(t);
    }
    function gorunurluk(t, bol) {
      if (bol !== 0) { gos(y.sayi, 0); gos(y.yaklasik, 0); gos(y.gunde, 0); }
      if (bol !== 1) { gos(y.soru, 0); gos(y.ilk, 0); }
      if (bol === 0) { gos(y.soru, 0); gos(y.ilk, 0); }
      if (bol !== 2) {
        Object.keys(tk).forEach(function (n) { gos(tk[n], 0); });
        gos(y.randevu, 0); gos(y.gec, 0); gos(y.erken, 0);
      }
      if (bol !== 3) { olcuYolu.style.opacity = 0; gos(y.tam, 0); }
      if (bol !== 4) { dongu.forEach(function (p) { p.style.opacity = 0; }); }
      if (bol !== 5 && bol !== 4) { gos(y.okula, 0); gos(y.bilir, 0); gos(y.fabrika, 0); }
      if (bol === 4 || bol === 5) {
        gos(y.okula, pencere(t, AN.ari + 0.3, AN.tohum - 0.3, 0.3, 0.3));
        gos(y.bilir, pencere(t, kel('ağaç') - 0.2, AN.fabrika - 0.1, 0.4, 0.3));
        gos(y.fabrika, pencere(t, AN.fabrika + 0.2, AN.verir + 0.3, 0.3, 0.4));
      }
      if (bol !== 6) {
        ['yuzde', 'oksijen', 'yakar', 'yasayamaz', 'nimet', 'goz', 'kulak', 'burun'].forEach(function (n) { gos(y[n], 0); });
      }
      if (bol !== 7) gos(y.buyuk, 0);
      if (bol !== 8) { ['k1', 'k2', 'k3', 'k4', 'k5', 'kendi'].forEach(function (n) { gos(y[n], 0); }); ustCizgi.style.opacity = 0; }
      if (bol !== 7 && bol !== 8) { blok(sagSayfa, 0); if (bol !== 1) blok(solSayfa, 0); }
      if (bol !== 9) iplikKapat();
      if (bol !== 10) gos(y.gelecek, 0);
    }
    var notSon = -1;
    function ipucuIzlek(t) {
      var defterAcik = t > AN.ilk - 0.3 && t < AN.gunes - 0.2;
      var gor = t > AN.defter && t < AN.doldu - 0.2 && !defterAcik && !api.acikDurak();   // durakta etkinlik öne çıkar
      izlek.classList.toggle('gor', gor);
      ANLAR.forEach(function (an, i) {
        var d = t >= an;
        if (noktalar[i]._d !== d) { noktalar[i]._d = d; noktalar[i].classList.toggle('dolu', d); noktalar[i].style.backgroundImage = d ? noktalar[i]._ikon : 'none'; }
      });
      var aktif = ANLAR.findIndex(function (an) { return t >= an && t < an + 2.3; });
      if (aktif !== notSon) { notSon = aktif; notKutu.classList.toggle('gor', aktif >= 0); if (aktif >= 0) notKutu.textContent = NOTLAR[aktif]; }
    }

    return {
      hazir: hazir,
      ciz: ciz,
      // Kâğıt bölümünde yazı sahnenin kendisidir, altyazı tekrar etmez
      altyazisiz: function (t) { return t >= AN.hic && t < AN.arkadas - 0.3; },
      durak: function (id, olay, veri) {
        if (id === 'gunes') {
          if (olay === 'deger') gv = veri;
          if (olay === 'kapat') gvSon = gv;
        }
        if (id === 'su' && olay === 'dogru') suTamam[veri] = aSimdi;
        if (id === 'bahce') {
          if (olay === 'cikar') cikan = veri;
          if (olay === 'kapat') cikan = null;
        }
      },
      tutamac: function (id, deger) {
        var p = gunesYer(deger), g = gunesBoy(deger);
        return { x: p[0], y: p[1], r: Math.max(64, g * 0.42) };
      },
      tutDeger: function (id, x, yy) {
        var dx = GP1[0] - GP0[0], dy = GP1[1] - GP0[1];
        return Math.max(0, Math.min(100, ((x - GP0[0]) * dx + (yy - GP0[1]) * dy) / (dx * dx + dy * dy) * 100));
      }
    };
  };
})();
