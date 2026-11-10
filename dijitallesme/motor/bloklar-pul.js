/* Pul: dersin ödülü. Derste her durak kesilmemiş dörtgen bir baskı bırakır, baskılar tepsiye uçar.
   Ders sonunda çocuk kolu bir kez çeker: baskılar sırayla makineye girer, zımba iner, kenarlar kopar,
   tırtıklı pullar çıkar; defter açılır, pullar yuvalarına kendiliğinden yapışır. Ders bitişi yorucu olmasın
   diye her pul için ayrı çekme ve elle yapıştırma yoktur.
   Pul doğru cevaba bağlı değildir; ders hocayla işlenince defterine kendiliğinden geçer (panel taught kaydına bakar).
   Öğrenci tek başına tekrar ederken makine çalışmaz, hoca ve yönetici önizler.
   Ders verisi: pullar [{id, ad, gorsel, renk, durak, x, y}], pulEtiket; blok tur 'pul'. */
(function () {
  'use strict';
  var DO = window.DO, el = DO.el, B = DO.Bloklar, S = window.PulSanat;
  var KLASOR = 'app/assets/pul/';
  var OLCEK = 1.5, W = S.G + S.PAY * 2, H = S.Y + S.PAY * 2;
  /* Sahne 1600×900. Makine görselinin ölçüleri scripts/akaid-gorsel.py çıktısından gelir */
  var MAKINE = { x: 264, y: 52, g: 1072, h: 768 };
  var PENCERE = { x: 639, y: 247, g: 321, h: 314 }, BOSLUK = { x: PENCERE.x + PENCERE.g / 2, y: PENCERE.y + PENCERE.h / 2 };
  var KOL = { x: 1089, y: 260, g: 64, h: 250, rx: 32, ry: 231, dur: 18, cek: 116 };
  var DISLI = { x: 510, y: 260, g: 176 };
  var BASKI_OLCEK = 0.64, PUL_OLCEK = 0.64;
  var GIRIS = [{ x: 130, y: 540, r: -2 }, { x: 138, y: 420, r: 3 }, { x: 132, y: 300, r: -5 }];
  var CIKIS = [{ x: 1468, y: 300, r: 4 }, { x: 1462, y: 424, r: -3 }, { x: 1470, y: 548, r: 2 }];
  var DEFTER_Y = 56, SOL_SAYFA = [{ x: 412, y: 215, r: -6 }, { x: 655, y: 330, r: 4 }, { x: 470, y: 552, r: -3 }];
  var YUVA_OLCEK = 0.46, YUVA_Y = 436;
  var YUVALAR = [{ x: 905 }, { x: 1060 }, { x: 1215 }];

  function kip(ctx) {
    var L = DO.LmsDers;
    if (!L || !L.aktif) return 'onizleme';
    if (L.session) return 'ders';
    return L.profile && L.profile.role === 'ogrenci' ? 'kapali' : 'onizleme';
  }
  function azHareket() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function T(x, y, s, r) { return 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + (r || 0) + 'deg) scale(' + s + ')'; }
  function ortada(x, y, s, r, g, h) { return T(x - g / 2, y - h / 2, s, r); }
  function hazirla(pullar, yol, olcek) {
    return S.yaziHazir().then(function () {
      return Promise.all(pullar.map(function (p) {
        return S.resimYukle(yol(p.gorsel)).then(function (r) { return S.kur(p, r, olcek); });
      }));
    });
  }
  function etiketli(ctx) {
    var e = ctx.ders.pulEtiket || '';
    return (ctx.ders.pullar || []).map(function (p) { return Object.assign({ seri: e }, p); });
  }

  /* Durağı biten dersin baskısı sahneden kopar, köşedeki tepsiye uçar */
  DO.PulTepsi = function (kok, ctx, duraklar) {
    var pullar = etiketli(ctx);
    if (!pullar.length || kip(ctx) === 'kapali') return null;
    var az = azHareket(), yuvalar = [], cizimler = null;
    var kutu = el('div', { class: 'kd-tepsi', 'aria-hidden': 'true' });
    pullar.forEach(function () { var y = el('i'); kutu.appendChild(y); yuvalar.push(y); });
    kok.appendChild(kutu);
    var hazir = hazirla(pullar, ctx.yol, 1).then(function (c) { cizimler = c; return c; });
    function otur(i) {
      var y = yuvalar[i]; if (y.firstChild) return;
      var c = document.createElement('canvas'); c.width = cizimler[i].ham.width; c.height = cizimler[i].ham.height;
      c.getContext('2d').drawImage(cizimler[i].ham, 0, 0);
      y.appendChild(c); y.classList.add('dolu');
    }
    // sessiz: geç katılan öğrencide geçilmiş duraklar uçuşsuz yerine oturur
    function ver(id, sessiz) {
      var i = pullar.findIndex(function (p) { return p.durak === id; });
      if (i < 0) return;
      hazir.then(function () {
        if (!kok.isConnected) return;
        if (az || sessiz) { otur(i); return; }
        var p = pullar[i], u = el('div', { class: 'kd-baski' }), hedef = yuvalar[i].getBoundingClientRect(), r = kok.getBoundingClientRect(), o = r.width / 1600;
        var c = cizimler[i].ham; u.appendChild(c); u.appendChild(el('span', { text: 'Yeni baskı: ' + p.ad }));
        kok.appendChild(u);
        var hx = (hedef.left + hedef.width / 2 - r.left) / o, hy = (hedef.top + hedef.height / 2 - r.top) / o;
        var kac = 0.5, ox = Math.max(250, Math.min(1350, p.x)), oy = Math.max(190, Math.min(500, p.y - 40));
        var bas = T(p.x - W / 2, p.y - H / 2, 0.12, -14), orta = T(ox - W / 2, oy - H / 2, kac, -3), son = T(hx - W / 2, hy - H / 2, 0.14, 2);
        u.style.transform = son;
        DO.efekt.cil();
        u.animate([
          { transform: bas, opacity: 0, offset: 0, easing: 'cubic-bezier(.2,1.3,.4,1)' }, { transform: orta, opacity: 1, offset: 0.2 },
          { transform: orta, opacity: 1, offset: 0.62, easing: 'cubic-bezier(.5,0,.2,1)' }, { transform: son, opacity: 1, offset: 1 }
        ], { duration: 2300 }).finished.then(function () {
          u.remove(); otur(i); DO.efekt.tik(); yuvalar[i].animate([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 240, easing: 'ease-out' });
        }).catch(function () { u.remove(); });
      });
    }
    if (duraklar.some(function (d) { return d.bitti; })) hazir.then(function () { pullar.forEach(function (p, i) { var d = duraklar.find(function (x) { return x.id === p.durak; }); if (d && d.bitti) otur(i); }); });
    return { ver: ver };
  };

  B.pul = {
    xapiTur: 'module', canli: 'bireysel',
    ciz: function (ctx) {
      var pullar = etiketli(ctx), O = ctx.oynatici, durum = kip(ctx);
      var kok = el('div', { class: 'pm' });
      var yazi = el('p', { class: 'pm-yazi' }), dugme = el('button', { class: 'dug ana pm-dug', type: 'button' }), alt = el('div', { class: 'pm-alt' }, [yazi, dugme]);
      kok.appendChild(alt);
      ctx.kap.appendChild(kok);
      var sonraki = ctx.oynatici.sira[ctx.oynatici.i + 1], gecAd = sonraki && sonraki.tur === 'kapanis' ? 'Ders özetine geç' : 'Devam et';
      function bitir() {
        ctx.tamamla({ puan: 0, max: 0 });
        yazi.textContent = durum === 'kapali' ? yazi.textContent : ctx.takipte() ? 'Pulların defterine yapıştı. Hocan ders özetini açacak.' : 'Pulların defterine yapıştı. Ne güzel oldu!';
        if (ctx.takipte()) { dugme.hidden = true; return; }
        dugme.textContent = gecAd; dugme.hidden = false; dugme.disabled = false; dugme.onclick = function () { ctx.ileri(); };
      }
      // Canlı derste pulları öğrenciler keser; Hocamız beklemeden ders özetine geçebilir
      if (ctx.rol === 'ogretmen' && ctx.canliMi() && durum !== 'kapali') {
        alt.appendChild(el('button', { class: 'dug ikincil pm-hoca-gec', type: 'button', text: gecAd, onclick: function () { ctx.ileri(); } }));
      }

      /* Öğrenci tek başına: baskılar görünür, makine hocalı derste çalışır */
      if (durum === 'kapali') {
        kok.classList.add('pm-tanitim');
        var fan = el('div', { class: 'pm-fan' }); kok.appendChild(fan);
        yazi.textContent = 'Bu dersin pulları, dersi hocanla işlediğinde defterine yapışır.';
        hazirla(pullar, ctx.yol, 1).then(function (c) { c.forEach(function (x, i) { x.ham.style.setProperty('--d', (i - 1) * 9 + 'deg'); fan.appendChild(x.ham); }); });
        bitir();
        return {};
      }

      var az = azHareket(), yasiyor = true, sira = Promise.resolve(), kesilen = 0, konan = {}, baskilar = [], defterAcik = false;
      O.temizlikler.push(function () { yasiyor = false; });
      function noop() {}
      function bekle(ms) { return new Promise(function (coz) { if (az) coz(); else ctx.zaman(coz, ms); }); }
      function git(e, hedef, sure, egri, ek) {
        var bas = e.style.transform;
        e.style.transform = hedef;
        if (az || !sure) return Promise.resolve();
        return e.animate([Object.assign({ transform: bas }, ek ? ek[0] : null), Object.assign({ transform: hedef }, ek ? ek[1] : null)], { duration: sure, easing: egri || 'cubic-bezier(.3,.7,.2,1)' }).finished.catch(noop);
      }

      /* ——— makine ——— */
      var makine = el('div', { class: 'pm-makine' });
      var ic = el('div', { class: 'pm-ic', style: { left: PENCERE.x - 8 + 'px', top: PENCERE.y - 8 + 'px', width: PENCERE.g + 16 + 'px', height: PENCERE.h + 16 + 'px' } });
      var kat = el('div', { class: 'pm-kat' }), talas = el('div', { class: 'pm-talas', style: { left: PENCERE.x + 'px', top: PENCERE.y + 'px', width: PENCERE.g + 'px', height: PENCERE.h + 'px' } });
      var zimba = zimbaCiz();
      var govde = el('img', { class: 'pm-govde', src: KLASOR + 'makine-govde.webp', alt: '', style: { left: MAKINE.x + 'px', top: MAKINE.y + 'px', width: MAKINE.g + 'px', height: MAKINE.h + 'px' } });
      var disli = el('img', { class: 'pm-disli', src: KLASOR + 'makine-disli.webp', alt: '', style: { left: DISLI.x - DISLI.g / 2 + 'px', top: DISLI.y - DISLI.g / 2 + 'px', width: DISLI.g + 'px' } });
      var kol = el('button', { class: 'pm-kol', type: 'button', 'aria-label': 'Kolu çek', style: { left: KOL.x - KOL.rx + 'px', top: KOL.y - KOL.ry + 'px', width: KOL.g + 'px', height: KOL.h + 'px', transformOrigin: KOL.rx + 'px ' + KOL.ry + 'px' } }, [el('img', { src: KLASOR + 'makine-kol.webp', alt: '' })]);
      kol.style.transform = 'rotate(' + KOL.dur + 'deg)';
      /* Kol tutulup aşağı çekilir: el çektikçe döner, yeterince inince makine çalışır. Dokunmak da yeter. */
      var kolTut = null, kolSurukledi = false;
      kol.onclick = function () { if (kolSurukledi) { kolSurukledi = false; return; } cek(); };
      kol.addEventListener('pointerdown', function (o) {
        if (kol.disabled || !kok.classList.contains('pm-hazir') || o.button > 0) return;
        o.preventDefault();
        try { kol.setPointerCapture(o.pointerId); } catch (x) { /* eski tarayıcı */ }
        kolTut = { y: o.clientY, s: 1600 / kok.getBoundingClientRect().width, k: 0 }; kolSurukledi = false;
      });
      kol.addEventListener('pointermove', function (o) {
        if (!kolTut) return;
        var dy = (o.clientY - kolTut.y) * kolTut.s;
        if (Math.abs(dy) > 6) kolSurukledi = true;
        kolTut.k = Math.max(0, Math.min(1, dy / 170));
        kol.style.transform = 'rotate(' + (KOL.dur + (KOL.cek - KOL.dur) * kolTut.k) + 'deg)';
      });
      function kolBirak() {
        if (!kolTut) return;
        var k = kolTut.k; kolTut = null;
        if (!kolSurukledi) return;
        if (k > 0.55) cek(); else git(kol, 'rotate(' + KOL.dur + 'deg)', 260, 'cubic-bezier(.3,1.3,.5,1)');
      }
      kol.addEventListener('pointerup', kolBirak); kol.addEventListener('pointercancel', kolBirak);
      disli.style.transform = 'rotate(0deg)';
      DO.ekle(makine, [ic, kat, zimba, talas, govde, disli, kol]);
      kok.insertBefore(makine, alt);

      function zimbaCiz() {
        var g = S.G * BASKI_OLCEK, h = S.Y * BASKI_OLCEK, b = 30, k = document.createElement('canvas'), c = k.getContext('2d');
        k.width = (g + b * 2) * 2; k.height = (h + b * 2) * 2; c.scale(2, 2);
        var a = c.createLinearGradient(0, 0, g + b * 2, h + b * 2);
        a.addColorStop(0, '#f2d783'); a.addColorStop(0.5, '#b98a2e'); a.addColorStop(1, '#e8c867');
        c.fillStyle = a; c.fillRect(0, 0, g + b * 2, h + b * 2);
        c.clearRect(b + 1, b + 1, g - 2, h - 2);
        c.strokeStyle = 'rgba(70,44,12,.7)'; c.lineWidth = 2; c.strokeRect(1, 1, g + b * 2 - 2, h + b * 2 - 2); c.strokeRect(b, b, g, h);
        var n = S.adimlar(S.G, S.Y), ax = n.ax * BASKI_OLCEK, ay = n.ay * BASKI_OLCEK, i;
        c.fillStyle = '#4a2f10';
        function igne(x, y) { c.beginPath(); c.arc(x, y, 2.6, 0, Math.PI * 2); c.fill(); }
        for (i = 0; i <= n.nx; i++) { igne(b + i * ax, b - 4); igne(b + i * ax, b + h + 4); }
        for (i = 0; i <= n.ny; i++) { igne(b - 4, b + i * ay); igne(b + g + 4, b + i * ay); }
        k.className = 'pm-zimba'; k.style.width = g + b * 2 + 'px'; k.style.height = h + b * 2 + 'px';
        k.style.left = BOSLUK.x - g / 2 - b + 'px'; k.style.top = BOSLUK.y - h / 2 - b + 'px';
        return k;
      }

      /* Bir baskı üç hâli de taşır; görünen hâl değişir */
      function baskiKur(c, i) {
        var e = el('div', { class: 'pm-baski', style: { width: W + 'px', height: H + 'px' } });
        c.ham.style.cssText = c.delikli.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
        c.kesik.style.cssText = 'position:absolute;left:' + (S.PAY - 2) + 'px;top:' + (S.PAY - 2) + 'px;width:' + (S.G + 4) + 'px;height:' + (S.Y + 4) + 'px';
        c.delikli.hidden = c.kesik.hidden = true;
        var isik = el('i', { class: 'pm-isik', style: { left: S.PAY + 'px', top: S.PAY + 'px', width: S.G + 'px', height: S.Y + 'px' } });
        DO.ekle(e, [c.ham, c.delikli, c.kesik, isik]);
        return { e: e, c: c, isik: isik, i: i };
      }
      function kapatKalan() { dugme.hidden = true; kok.classList.remove('pm-hazir'); kol.disabled = true; }
      function hazir(hizli) {
        if (!yasiyor) return null;
        if (kesilen >= pullar.length) return defterAc(hizli);
        kok.classList.add('pm-hazir'); kol.disabled = false;
        yazi.textContent = pullar.length + ' baskın hazır. Kolu bir kez aşağı çek; pul olup defterine yapışsınlar.';
        dugme.hidden = false; dugme.disabled = false; dugme.textContent = 'Kolu çek'; dugme.onclick = cek;
        return null;
      }
      function cek() { if (kok.classList.contains('pm-hazir')) ctx.eylem('cek', { n: kesilen }); }

      function kagitToz(b) {
        if (az) return;
        for (var i = 0; i < 34; i++) {
          var kenar = i % 4, t = Math.random(), x, y;
          if (kenar === 0) { x = t * S.G; y = 0; } else if (kenar === 1) { x = S.G; y = t * S.Y; } else if (kenar === 2) { x = t * S.G; y = S.Y; } else { x = 0; y = t * S.Y; }
          x = (x - S.G / 2) * BASKI_OLCEK + PENCERE.g / 2; y = (y - S.Y / 2) * BASKI_OLCEK + PENCERE.h / 2;
          var e = el('i', { style: { left: x + 'px', top: y + 'px', width: 5 + Math.random() * 3 + 'px' } });
          talas.appendChild(e);
          e.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(' + (Math.random() * 90 - 45) + 'px,' + (120 + Math.random() * 190) + 'px) rotate(' + (Math.random() * 500) + 'deg)', opacity: 0.9 }],
            { duration: 460 + Math.random() * 380, easing: 'cubic-bezier(.3,.1,.7,.6)' }).finished.then(function (a) { return function () { a.remove(); }; }(e)).catch(noop);
        }
      }
      function seritKop(b) {
        var yon = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        b.c.serit.forEach(function (c, i) {
          c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
          b.e.appendChild(c);
          var a = c.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(' + yon[i][0] * 150 + 'px,' + (yon[i][1] * 150 + 230) + 'px) rotate(' + (i % 2 ? 22 : -18) + 'deg)', opacity: 0 }], { duration: 620, delay: i * 60, easing: 'cubic-bezier(.4,0,.8,.6)', fill: 'both' });
          a.finished.then(function () { c.remove(); }).catch(noop);
        });
      }
      function titre() {
        if (!az) makine.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(5px)' }, { transform: 'translateY(-2px)' }, { transform: 'translateY(1px)' }, { transform: 'translateY(0)' }], { duration: 240 });
      }
      // seri: tek çekişte arka arkaya kesilen baskı; ilkinden sonrakiler daha çabuk geçer
      function kes(i, hizli, seri) {
        var b = baskilar[i], yer = CIKIS[i], h = seri ? 0.6 : 1;
        function bekleH(ms) { return bekle(ms * h); }
        kesilen = i + 1;
        if (hizli || az) {
          b.c.ham.hidden = true; b.c.kesik.hidden = false;
          b.e.style.transform = ortada(yer.x, yer.y, PUL_OLCEK, yer.r, W, H);
          ust.appendChild(b.e);
          return Promise.resolve();
        }
        kapatKalan();
        yazi.textContent = '';
        DO.efekt.dis();
        git(kol, 'rotate(' + KOL.cek + 'deg)', 300, 'cubic-bezier(.5,0,.7,.4)');
        git(disli, 'rotate(' + (i + 1) * 120 + 'deg)', 1500, 'cubic-bezier(.3,.6,.3,1)');
        b.e.classList.add('icerde');
        return git(b.e, ortada(BOSLUK.x, BOSLUK.y, BASKI_OLCEK, 0, W, H), 640 * h, 'cubic-bezier(.5,0,.2,1)').then(function () {
          zimba.style.opacity = 1;
          return git(zimba, 'scale(1)', 130, 'cubic-bezier(.7,0,1,.5)', [{ opacity: 0 }, { opacity: 1 }]);
        }).then(function () {
          if (!yasiyor) return null;
          DO.efekt.tak(); titre(); kagitToz(b);
          b.c.ham.hidden = true; b.c.delikli.hidden = false;
          return bekleH(170);
        }).then(function () {
          zimba.style.opacity = 0;
          return git(zimba, 'scale(1.26)', 230, 'cubic-bezier(.2,.8,.4,1)', [{ opacity: 1 }, { opacity: 0 }]);
        }).then(function () { return bekleH(170); }).then(function () {
          if (!yasiyor) return null;
          DO.efekt.tirt();
          b.c.delikli.hidden = true; b.c.kesik.hidden = false;
          seritKop(b);
          git(kol, 'rotate(' + KOL.dur + 'deg)', 520, 'cubic-bezier(.3,1.3,.5,1)');
          return bekleH(420);
        }).then(function () {
          DO.efekt.cil();
          b.isik.animate([{ backgroundPosition: '150% 0' }, { backgroundPosition: '-60% 0' }], { duration: 620, easing: 'ease-in-out' });
          return bekleH(480);
        }).then(function () {
          DO.efekt.hisir();
          return git(b.e, ortada(yer.x, yer.y, PUL_OLCEK, yer.r, W, H), 760 * h, 'cubic-bezier(.45,0,.15,1)');
        }).then(function () {
          b.e.classList.remove('icerde'); ust.appendChild(b.e);
          DO.efekt.tik();
        });
      }
      // Hamleler sıraya girer: baskılar çizilmeden gelen yansı da, çift dokunuş da düzgün işlenir
      // Tek çekiş bütün baskıları keser, sonra defter açılır; hamle sıraya girer, çift dokunuş işlenmez
      ctx.eylemTanimla('cek', function (x, k) {
        sira = sira.then(function () {
          if (x.n !== kesilen || kesilen >= pullar.length) return null;
          var p = Promise.resolve();
          pullar.forEach(function (_, i) { p = p.then(function () { return yasiyor ? kes(i, k.tekrar, i > 0) : null; }); });
          return p.then(function () { return hazir(k.tekrar); });
        });
      });

      /* ——— defter ——— */
      var defter = el('div', { class: 'pm-defter', hidden: true }), kapak = el('div', { class: 'pm-kapak' });
      var solSayfa = el('div', { class: 'pm-sayfa sol' }), sagSayfa = el('div', { class: 'pm-sayfa sag' });
      var ad = (O.ogrenci && O.ogrenci.ad || '').trim().split(/\s+/)[0] || '';
      DO.ekle(kapak, [
        el('div', { class: 'pm-kapak-on' }, [el('img', { src: KLASOR + 'defter-kapak.webp', alt: '' }), el('div', { class: 'pm-kapak-yazi' }, [el('b', { text: 'Pul Defterim' }), ad ? el('span', { text: ad }) : null])]),
        el('div', { class: 'pm-kapak-ic' }, [solSayfa])
      ]);
      // Pullar sayfadan kalkınca altındaki ders resmi görünür
      if (ctx.ders.kapakGorseli) solSayfa.appendChild(el('img', { class: 'pm-sayfa-resim', src: ctx.yol(ctx.ders.kapakGorseli), alt: '' }));
      DO.ekle(sagSayfa, [
        el('p', { class: 'pm-sayfa-ust', text: (ctx.ders.pulEtiket || '').toLocaleUpperCase('tr') }),
        el('h3', { text: ctx.ders.ad })
      ]);
      var yuvalar = pullar.map(function (p, i) {
        var g = S.G * YUVA_OLCEK, h = S.Y * YUVA_OLCEK, k = document.createElement('canvas'), c = k.getContext('2d');
        k.width = (g + 8) * 2; k.height = (h + 8) * 2; c.scale(2, 2);
        S.disYol(c, 4, 4, g, h, S.DELIK * YUVA_OLCEK);
        c.fillStyle = 'rgba(150,118,64,.13)'; c.fill();
        c.strokeStyle = 'rgba(150,118,64,.55)'; c.lineWidth = 1; c.setLineDash([3, 3]); c.stroke();
        var y = el('div', { class: 'pm-yuva' }, [k, el('span', { text: p.ad })]);
        y.style.left = YUVALAR[i].x - 800 - (g + 8) / 2 + 'px'; y.style.top = YUVA_Y - DEFTER_Y - h / 2 - 4 + 'px';
        sagSayfa.appendChild(y);
        return y;
      });
      var ust = el('div', { class: 'pm-ust' });
      DO.ekle(defter, [sagSayfa, kapak]);
      kok.insertBefore(defter, alt);
      kok.insertBefore(ust, alt);

      function solaGec(hizli) {
        var bitti = [];
        baskilar.forEach(function (b, i) {
          if (konan[i]) return;
          var y = SOL_SAYFA[i];
          b.son = ortada(y.x, y.y, PUL_OLCEK, y.r, W, H);
          if (hizli) { b.e.style.transform = b.son; return; }
          bitti.push(bekle(i * 170).then(function () { DO.efekt.hisir(); return git(b.e, b.son, 720, 'cubic-bezier(.4,0,.2,1)'); }));
        });
        return Promise.all(bitti);
      }
      function ac(hizli) {
        defter.hidden = false; defterAcik = true;
        if (hizli || az) {
          makine.hidden = true; defter.style.transform = 'translateY(0)'; kapak.classList.add('acik'); kapak.style.transform = 'rotateY(-180deg)';
          kok.classList.add('pm-defterde');
          solaGec(true);
          return Promise.resolve();
        }
        defter.style.transform = 'translateY(0)';
        kapak.style.transform = 'rotateY(0deg)';
        return Promise.all([
          makine.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(-260px) scale(.92)', opacity: 0 }], { duration: 620, easing: 'ease-in', fill: 'forwards' }).finished.catch(noop),
          defter.animate([{ transform: 'translateY(860px)' }, { transform: 'translateY(0)' }], { duration: 760, delay: 160, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' }).finished.catch(noop)
        ]).then(function () {
          if (!yasiyor) return null;
          makine.hidden = true; kok.classList.add('pm-defterde');
          return bekle(220);
        }).then(function () {
          DO.efekt.hisir();
          kapak.classList.add('acik');
          return git(kapak, 'rotateY(-180deg)', 1250, 'cubic-bezier(.5,.05,.2,1)');
        }).then(function () { return solaGec(); });
      }
      // Defter açılınca pullar sırayla yuvalarına uçup yapışır
      function defterAc(hizli) {
        kapatKalan();
        return ac(hizli).then(function () {
          if (!yasiyor) return null;
          kok.classList.add('pm-yapistir');
          yazi.textContent = 'Pulların defterine yapışıyor…';
          var p = Promise.resolve();
          baskilar.forEach(function (b, i) { p = p.then(function () { return yasiyor && !konan[i] ? yapistir(i, hizli) : null; }); });
          return p;
        });
      }
      function parilti(x, y) {
        if (az) return;
        for (var i = 0; i < 10; i++) {
          var a = i / 10 * Math.PI * 2, e = el('i', { class: 'pm-kivilcim', style: { left: x + 'px', top: y + 'px' } });
          kok.appendChild(e);
          e.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + Math.cos(a) * 118 + 'px,' + Math.sin(a) * 148 + 'px) scale(.2)', opacity: 0 }], { duration: 620, easing: 'cubic-bezier(.1,.7,.3,1)' }).finished.then(function (n) { return function () { n.remove(); }; }(e)).catch(noop);
        }
      }
      function yapistir(i, hizli) {
        var b = baskilar[i], y = YUVALAR[i], son = ortada(y.x, YUVA_Y, YUVA_OLCEK, 0, W, H), ust = ortada(y.x, YUVA_Y - 22, YUVA_OLCEK * 1.2, -3, W, H);
        konan[i] = true;
        b.e.classList.remove('tutulur'); b.e.removeAttribute('role'); b.e.tabIndex = -1;
        var bitis = function () { yuvalar[i].classList.add('dolu'); if (Object.keys(konan).length === pullar.length) { kok.classList.remove('pm-yapistir'); bitir(); } };
        if (hizli || az) { b.e.style.transform = son; b.e.classList.add('yapisti'); bitis(); return Promise.resolve(); }
        return git(b.e, ust, 560, 'cubic-bezier(.4,0,.2,1)').then(function () { return bekle(120); }).then(function () {
          return git(b.e, son, 150, 'cubic-bezier(.7,0,1,.6)');
        }).then(function () {
          if (!yasiyor) return;
          b.e.classList.add('yapisti');
          DO.efekt.yapis();
          parilti(y.x, YUVA_Y);
          bitis();
          if (Object.keys(konan).length === pullar.length) { DO.efekt.zafer(); DO.konfeti(kok, 70); }
        });
      }
      ctx.eylemTanimla('yapistir', function (x, k) {
        sira = sira.then(function () {
          if (konan[x.i] || !baskilar[x.i]) return null;
          if (!defterAcik) ac(true);
          return yapistir(x.i, k.tekrar);
        });
      });

      /* ——— başlangıç ——— */
      if (durum === 'onizleme') kok.appendChild(el('p', { class: 'pm-not', text: 'Önizleme: pullar bir öğrencinin defterine yazılmaz.' }));
      yazi.textContent = 'Baskılar hazırlanıyor…'; dugme.hidden = true; kol.disabled = true;
      zimba.style.opacity = 0; zimba.style.transform = 'scale(1.26)';
      sira = hazirla(pullar, ctx.yol, OLCEK).then(function (c) {
        if (!yasiyor) return;
        baskilar = c.map(baskiKur);
        baskilar.forEach(function (b, i) {
          var y = GIRIS[i];
          b.e.style.transform = ortada(y.x, y.y, BASKI_OLCEK * 0.88, y.r, W, H);
          kat.insertBefore(b.e, kat.firstChild);
        });
        // bitmiş dersi yeniden açınca defter hazır gelir
        if (ctx.onceki && ctx.onceki.tamam) {
          baskilar.forEach(function (b, i) { kes(i, true); });
          ac(true);
          baskilar.forEach(function (b, i) { yapistir(i, true); });
          return;
        }
        hazir();
      });
      return {};
    }
  };
})();
