/* Ders Odası — temel bloklar: kapak, bölüm, slayt, video, kartlar, anket, düşün, kapanış
   Her blok türü: { ciz(ctx) → {temizle?, anlatimDegisti?, ogretmenAraci?}, max(blok)?, zorunlu? } */
(function () {
  'use strict';
  var DO = window.DO, el = DO.el, B = DO.Bloklar = DO.Bloklar || {};

  /* ---------- SVG ikon seti (viewBox 0 0 100 100) ---------- */
  var IK = DO.Ikon = {
    yildiz: function (r) {
      return '<circle cx="50" cy="50" r="46" fill="' + r + '" opacity=".12"/>' +
        '<path d="M50 14c3 18 11 28 30 36-19 6-27 16-30 36-3-20-11-30-30-36 19-8 27-18 30-36z" fill="' + r + '"/>' +
        '<path d="M76 18c1 6 4 9 10 11-6 2-9 5-10 11-1-6-4-9-10-11 6-2 9-5 10-11z" fill="' + r + '" opacity=".7"/>' +
        '<path d="M24 64c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8z" fill="' + r + '" opacity=".6"/>';
    },
    uyari: function (r) {
      return '<circle cx="50" cy="50" r="46" fill="' + r + '" opacity=".12"/>' +
        '<path d="M50 16 88 82H12z" fill="' + r + '" stroke="#5b3a12" stroke-width="5" stroke-linejoin="round"/>' +
        '<rect x="46" y="38" width="8" height="24" rx="4" fill="#3b2710"/><circle cx="50" cy="71" r="5" fill="#3b2710"/>';
    },
    kirik: function (r) {
      var dis = '';
      for (var i = 0; i < 16; i++) {
        var a = i / 16 * Math.PI * 2, rr = i % 2 ? 40 : 46;
        dis += (i ? 'L' : 'M') + (50 + Math.cos(a) * rr).toFixed(1) + ' ' + (50 + Math.sin(a) * rr).toFixed(1);
      }
      return '<path d="' + dis + 'z" fill="' + r + '"/>' +
        '<circle cx="50" cy="50" r="30" fill="none" stroke="#fff" stroke-width="3" opacity=".5"/>' +
        '<path d="M36 36l28 28M64 36 36 64" stroke="#fff" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M52 4 46 30l10 12-8 16 6 38" fill="none" stroke="#f7f0e1" stroke-width="5" stroke-linejoin="round"/>';
    },
    muhur: function (r) {
      var dis = '';
      for (var i = 0; i < 16; i++) {
        var a = i / 16 * Math.PI * 2, rr = i % 2 ? 40 : 46;
        dis += (i ? 'L' : 'M') + (50 + Math.cos(a) * rr).toFixed(1) + ' ' + (50 + Math.sin(a) * rr).toFixed(1);
      }
      return '<path d="' + dis + 'z" fill="' + r + '"/><circle cx="50" cy="50" r="29" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>' +
        '<path d="M35 51l10 10 20-22" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>';
    },
    kitap: function (r) {
      return '<path d="M12 28c14-6 26-6 38 4 12-10 24-10 38-4v48c-14-6-26-6-38 4-12-10-24-10-38-4z" fill="#fffaf0" stroke="' + r + '" stroke-width="5" stroke-linejoin="round"/>' +
        '<path d="M50 32v48" stroke="' + r + '" stroke-width="5"/><path d="M22 40h18M22 50h18M60 40h18M60 50h18" stroke="' + r + '" stroke-width="3" opacity=".5"/>';
    },
    goz: function (r) {
      return '<path d="M8 50c22-30 62-30 84 0-22 30-62 30-84 0z" fill="#fffaf0" stroke="' + r + '" stroke-width="5"/><circle cx="50" cy="50" r="15" fill="' + r + '"/><circle cx="55" cy="45" r="5" fill="#fff"/>';
    },
    el: function (r) {
      return '<path d="M34 54V24a6 6 0 0112 0v24-30a6 6 0 0112 0v30-24a6 6 0 0112 0v34-18a6 6 0 0112 0v22c0 20-12 32-30 32-12 0-20-6-26-16L18 66a6 6 0 0110-6z" fill="#fffaf0" stroke="' + r + '" stroke-width="5" stroke-linejoin="round"/>';
    },
    kalp: function (r) {
      return '<path d="M50 84C20 64 10 46 14 32c4-14 22-20 36-4 14-16 32-10 36 4 4 14-6 32-36 52z" fill="' + r + '"/>';
    },
    buyutec: function (r) {
      return '<circle cx="42" cy="42" r="26" fill="#fffaf0" stroke="' + r + '" stroke-width="8"/><path d="M62 62l24 24" stroke="' + r + '" stroke-width="12" stroke-linecap="round"/><path d="M30 42l9 9 16-18" fill="none" stroke="' + r + '" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>';
    },
    yol: function (r) {
      return '<path d="M20 92c10-30 50-20 46-48-3-20-30-18-26-36" fill="none" stroke="' + r + '" stroke-width="16" stroke-linecap="round"/><path d="M20 92c10-30 50-20 46-48-3-20-30-18-26-36" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 8" stroke-linecap="round"/>';
    },
    kilit: function (r) {
      return '<path d="M30 46V32a20 20 0 0140 0v14" fill="none" stroke="#6b5b4a" stroke-width="9"/><rect x="18" y="44" width="64" height="46" rx="10" fill="' + r + '"/><circle cx="50" cy="63" r="7" fill="#fff"/><rect x="47" y="64" width="6" height="14" rx="3" fill="#fff"/>';
    }
  };
  DO.ikonSvg = function (ad, renk, boy) {
    var f = IK[ad] || IK.yildiz;
    return '<svg viewBox="0 0 100 100" width="' + (boy || 96) + '" height="' + (boy || 96) + '" aria-hidden="true">' + f(renk || '#4f7a3a') + '</svg>';
  };

  /* Oyun ekranı ortak kabuğu */
  DO.oyunKabuk = function (ctx, o) {
    var kap = el('div', { class: 'oyun ' + (o.sinif || '') });
    var ust = el('div', { class: 'oyun-ust' }, [
      o.rozet ? el('span', { class: 'oyun-rozet', text: o.rozet }) : null,
      el('h2', { class: 'oyun-baslik', text: o.baslik || ctx.blok.baslik || '' }),
      o.yonerge || ctx.blok.yonerge ? el('p', { class: 'oyun-yonerge', text: o.yonerge || ctx.blok.yonerge }) : null
    ]);
    var govde = el('div', { class: 'oyun-govde' });
    kap.appendChild(ust); kap.appendChild(govde);
    if (ctx.onceki && ctx.onceki.tamam && ctx.onceki.max) {
      kap.appendChild(el('div', { class: 'onceki-rozet', text: '✓ Daha önce tamamlandı · ' + ctx.onceki.puan + '/' + ctx.onceki.max }));
    }
    ctx.kap.appendChild(kap);
    return { kap: kap, ust: ust, govde: govde };
  };
  function O_rol(ctx) { return ctx.rol; }
  /* Bitiş özeti
     Canlı derste Hocamızın ekranı öğrencinin sonucunu gösterir (iki ekran aynı olsun):
     izlenen öğrencinin "bitti" bildirimi gelince puan, yıldız ve başlık ona göre yazılır. */
  DO.oyunSonu = function (ctx, govde, o) {
    var O = ctx.oynatici, iz = ctx.rol === 'ogretmen' && ctx.canliMi && ctx.canliMi() && O.izlenenId ? O.izlenenId() : null;
    var kart = el('div', { class: 'oyun-sonu' });
    function ciz(puan, kim, ilk) {
      var oran = o.max ? puan / o.max : 1;
      var yildiz = oran >= 0.9 ? 3 : oran >= 0.6 ? 2 : oran > 0 ? 1 : 0;
      var yil = '';
      for (var i = 0; i < 3; i++) yil += '<svg viewBox="0 0 24 24" class="' + (i < yildiz ? 'dolu' : '') + '" style="animation-delay:' + (0.15 + i * 0.18) + 's"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
      kart.innerHTML = '';
      DO.ekle(kart, [
        el('div', { class: 'sonu-yildiz', html: yil }),
        el('h3', { text: o.baslik || (oran >= 0.9 ? 'Mâşallah, harika!' : oran >= 0.6 ? 'Güzel gidiyorsun!' : 'Tekrar edersek daha iyi olacak') }),
        o.metin ? el('p', { text: o.metin }) : null,
        o.max ? el('p', { class: 'sonu-puan', html: (kim ? DO.kacis(kim) + ' · ' : '') + '<b>' + puan + '</b> / ' + o.max + ' puan' }) : null,
        ctx.takipte && ctx.takipte() ? el('p', { class: 'bekle-not', text: '✓ Bitti — Hocamız devam ettirecek' }) :
        el('div', { class: 'sonu-dugmeler' }, [
          o.tekrar && !(ctx.ortak && ctx.ortak() && O_rol(ctx) !== 'ogretmen') ? el('button', { class: 'dug ikincil', text: 'Tekrar oyna', onclick: o.tekrar }) : null,
          el('button', { class: 'dug ana', text: 'Devam et →', onclick: function () { ctx.ileri(); } })
        ])
      ]);
      if (ilk && oran >= 0.6) { DO.efekt.zafer(); DO.konfeti(ctx.kap); }
    }
    govde.innerHTML = '';
    govde.appendChild(kart);
    if (!iz) { ciz(o.puan, null, true); return; }
    var kat = DO.Canli.katilimcilar[iz], ad = kat ? kat.ad : '';
    var d = O.ogrDurum && O.ogrDurum[iz] && O.ogrDurum[iz][ctx.blok.id];
    ciz(d ? d.puan : o.puan, ad, !!d);
    // Öğrencinin bu bitişe ait bildirimi (önceki denemenin puanı yerine yenisi)
    ctx.dinle('bitti', function (m) {
      if (m.veri.blok !== ctx.blok.id || m.gonderen.id !== iz) return;
      ciz(m.veri.puan || 0, ad, true);
    });
  };

  /* =====================================================================
     KAPAK — açılış sahnesi (SVG animasyonlu)
     ===================================================================== */
  B.kapak = {
    xapiTur: 'module',
    ciz: function (ctx) {
      var b = ctx.blok;
      var kap = el('div', { class: 'kapak' });
      var desen = '<defs><pattern id="kg" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0v40" fill="none" stroke="#e7dcc4" stroke-width="1"/></pattern>' +
        '<radialGradient id="kisik" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#f1e6cf"/></radialGradient></defs>' +
        '<rect width="1600" height="900" fill="url(#kisik)"/><rect width="1600" height="900" fill="url(#kg)" opacity=".7"/>';
      var kartlar = '';
      (b.kartlar || []).forEach(function (k, i) {
        var x = 800 + (i - ((b.kartlar || []).length - 1) / 2) * 300;
        kartlar += '<g class="kapak-kart" style="animation-delay:' + (0.3 + i * 0.22) + 's;--sal:' + (i * 0.7) + 's">' +
          '<g transform="translate(' + x + ' 470) scale(1.25)">' +
          '<rect x="-95" y="-120" width="190" height="250" rx="22" fill="#fffdf7" stroke="' + k.renk + '" stroke-width="6"/>' +
          '<rect x="-95" y="-120" width="190" height="20" rx="10" fill="' + k.renk + '"/>' +
          '<g transform="translate(-55 -80) scale(1.1)">' + (IK[k.ikon] || IK.yildiz)(k.renk) + '</g>' +
          '<text x="0" y="96" text-anchor="middle" class="kapak-kart-ad" fill="' + k.renk + '">' + DO.kacis(k.ad) + '</text>' +
          '</g></g>';
      });
      var yapraklar = '';
      for (var i = 0; i < 9; i++) {
        yapraklar += '<path class="kapak-yaprak" style="animation-delay:' + (i * 0.9) + 's" transform="translate(' + (120 + i * 170) + ' ' + (i % 2 ? 120 : 780) + ') rotate(' + (i * 40) + ')" d="M0 0c10-18 30-18 40 0-10 18-30 18-40 0z" fill="#7fb069" opacity=".35"/>';
      }
      kap.innerHTML = '<svg class="kapak-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">' + desen + yapraklar + kartlar + '</svg>';
      if (b.gorsel) {
        // Resimli kapak: büyük sahne + üstünde süzülen ışıltılar
        kap.classList.add('resimli');
        var isilti = '';
        for (var j = 0; j < 14; j++) {
          isilti += '<g class="kapak-isilti" style="animation-delay:' + (j * 0.55).toFixed(2) + 's" transform="translate(' + (80 + (j * 211) % 1440) + ' ' + (90 + (j * 137) % 620) + ')"><path d="M0 -14 L4 -4 14 0 4 4 0 14 -4 4 -14 0 -4 -4z" fill="#fff6c9"/></g>';
        }
        kap.innerHTML = '<img class="kapak-resim" src="' + DO.kacis(ctx.yol(b.gorsel)) + '" alt="" draggable="false"><div class="kapak-perde"></div>' +
          '<svg class="kapak-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">' + isilti + '</svg>';
      }
      var metin = el('div', { class: 'kapak-metin' }, [
        b.ust ? el('span', { class: 'kapak-ust', text: b.ust }) : null,
        el('h1', { class: 'kapak-baslik', text: b.baslik }),
        b.alt ? el('p', { class: 'kapak-alt', text: b.alt }) : null
      ]);
      var besmele = el('div', { class: 'besmele' }, [
        el('div', { class: 'besmele-arapca', lang: 'ar', dir: 'rtl', text: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ' }),
        el('div', { class: 'besmele-okunus', text: 'Bismillâhirrahmânirrahîm' })
      ]);
      var dug = el('button', { class: 'dug ana buyuk kapak-dug', text: b.dugme || 'Besmele ile başlayalım', onclick: function () { ctx.eylem('besmele'); } });
      ctx.eylemTanimla('besmele', function (v, k) {
        if (kap.classList.contains('besmeleli')) return;
        dug.disabled = true;
        kap.classList.add('besmeleli');
        DO.efekt.gecis();
        if (k.yerel) ctx.etkiles('besmele', 'Derse besmele ile başladı');
        ctx.tamamla({ puan: 0, max: 0 });
        if (!k.tekrar) ctx.zaman(function () { ctx.otoIleri(); }, 2600);
      });
      kap.appendChild(metin); kap.appendChild(besmele); kap.appendChild(dug);
      ctx.kap.appendChild(kap);
      return {};
    }
  };

  /* =====================================================================
     BÖLÜM — bölüm açılış kartı
     ===================================================================== */
  B.bolum = {
    xapiTur: 'module',
    ciz: function (ctx) {
      var b = ctx.blok;
      var kap = el('div', { class: 'bolum-kart', style: { '--r': b.renk || '#4f7a3a' } });
      kap.innerHTML =
        '<svg class="bolum-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs><pattern id="bg2" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0v40" fill="none" stroke="#e7dcc4"/></pattern></defs>' +
        '<rect width="1600" height="900" fill="#f7f0e1"/><rect width="1600" height="900" fill="url(#bg2)" opacity=".7"/>' +
        '<circle class="bolum-halka" cx="800" cy="360" r="190" fill="none" stroke="' + (b.renk || '#4f7a3a') + '" stroke-width="10" stroke-dasharray="1194" stroke-dashoffset="1194"/>' +
        '<circle cx="800" cy="360" r="160" fill="' + (b.renk || '#4f7a3a') + '" opacity=".1" class="bolum-dolgu"/>' +
        '<g class="bolum-ikon" transform="translate(690 250) scale(2.2)">' + (IK[b.ikon] || IK.yildiz)(b.renk || '#4f7a3a') + '</g></svg>';
      kap.appendChild(el('div', { class: 'bolum-metin' }, [
        b.numara ? el('span', { class: 'bolum-numara', text: b.numara }) : null,
        el('h1', { text: b.baslik }),
        b.alt ? el('p', { text: b.alt }) : null
      ]));
      ctx.kap.appendChild(kap);
      DO.efekt.gecis();
      ctx.tamamla({ puan: 0, max: 0 });
      return {};
    }
  };

  /* =====================================================================
     SLAYT — görsel + sesli anlatım + altyazı + dokunulabilir noktalar
     ===================================================================== */
  B.slayt = {
    xapiTur: 'media',
    ciz: function (ctx) {
      var b = ctx.blok;
      var kap = el('div', { class: 'slayt' + (b.kenburns === false ? '' : ' kenburns') });
      var img = el('img', { class: 'slayt-gorsel', src: ctx.yol(b.gorsel), alt: b.metin || b.baslik || '', draggable: 'false' });
      kap.appendChild(img);
      (b.vurgular || []).forEach(function (v, i) {
        var balon = el('div', { class: 'vurgu-balon', text: v.etiket });
        var nokta = el('button', {
          class: 'vurgu', style: { left: v.x + 'px', top: v.y + 'px', width: (v.r || 60) * 2 + 'px', height: (v.r || 60) * 2 + 'px', animationDelay: (i * 0.25) + 's' },
          'aria-label': v.etiket,
          onclick: function () { ctx.eylem('vurgu', { i: i }); }
        }, balon);
        kap.appendChild(nokta);
      });
      ctx.eylemTanimla('vurgu', function (v, k) {
        var nokta = kap.querySelectorAll('.vurgu')[v.i]; if (!nokta) return;
        kap.querySelectorAll('.vurgu').forEach(function (n) { n.classList.remove('acik'); });
        nokta.classList.add('acik', 'gorulmus');
        DO.efekt.tik();
        if (k.yerel) ctx.etkiles('vurgu-' + ((b.vurgular[v.i] || {}).id || v.i), (b.vurgular[v.i] || {}).etiket);
      });
      var tekrar = el('button', { class: 'slayt-tekrar', title: 'Anlatımı tekrar dinle', html: '↻ Dinle' });
      if (b.ses) kap.appendChild(tekrar);
      ctx.kap.appendChild(kap);
      if (b.metin) ctx.altyazi(b.metin);
      var a = ctx.anlatim(b.ses);
      if (a) {
        tekrar.onclick = function () { ctx.eylem('dinle'); };
        ctx.eylemTanimla('dinle', function (v, k) {
          if (k.tekrar) return;
          if (ctx.sesBende()) { a.ses.currentTime = 0; a.cal(); }
          if (k.yerel) ctx.etkiles('anlatim-tekrar', 'Anlatımı tekrar dinletti');
        });
      }
      ctx.tamamla({ puan: 0, max: 0 });
      return {
        anlatimDegisti: function (acik) { if (!a) return; if (acik) a.cal(); else a.durdur(); }
      };
    }
  };

  /* =====================================================================
     VİDEO — araya giren video, içinde duraklama soruları
     ===================================================================== */
  B.video = {
    xapiTur: 'media', zorunlu: true,
    max: function (b) { return (b.duraklar || []).length * 10; },
    ciz: function (ctx) {
      var b = ctx.blok, C = ctx.canli;
      var kap = el('div', { class: 'video-blok' });
      var v = el('video', { class: 'video-oge', poster: b.poster ? ctx.yol(b.poster) : null, playsinline: true, preload: 'auto', controls: true });
      // H.264 (mp4) her yerde; WebM yedeği H.264 çözemeyen tarayıcılar için
      [].concat(b.video || []).concat(b.videoWebm || []).forEach(function (kaynak) {
        v.appendChild(el('source', { src: ctx.yol(kaynak), type: /\.webm$/i.test(kaynak) ? 'video/webm' : 'video/mp4' }));
      });
      var perde = el('div', { class: 'video-perde' });
      var baslik = el('div', { class: 'video-baslik', html: '<span>▶ Video</span> ' + DO.kacis(b.baslik || '') });
      var basla = el('button', { class: 'video-basla', 'aria-label': 'Videoyu başlat', html: '<svg viewBox="0 0 100 100" width="150" height="150"><circle cx="50" cy="50" r="46" fill="#fffaf0" opacity=".95"/><path d="M40 30l32 20-32 20z" fill="#4f7a3a"/></svg>' });
      kap.appendChild(v); kap.appendChild(baslik); kap.appendChild(basla); kap.appendChild(perde);
      ctx.kap.appendChild(kap);
      // Canlı derste ses yalnızca bir yerde çalar (görüşmede çift ses olmasın)
      v.muted = !ctx.sesBende();

      var duraklar = (b.duraklar || []).map(function (d, i) { return Object.assign({ i: i, cevaplandi: false }, d); });
      var enUzak = 0, puan = 0, bitti = false, soruAcik = false, canliYonetim = false;
      var izlenen = {}; // saniye -> true
      var aktif = true;
      if (ctx.onceki && ctx.onceki.tamam) { enUzak = 1e9; duraklar.forEach(function (d) { d.cevaplandi = true; }); bitti = true; }

      basla.onclick = function () { oynat(); };
      function oynat() { var p = v.play(); if (p && p.catch) p.catch(function () { /* izin */ }); }
      var acikDurak = null;
      // Bu cihazdaki oynat/durdur başkalarına gitsin mi? (uzaktan gelen komutu geri yollamayız)
      function videoYay() { return C.acik && ctx.canliMi() && !canliYonetim && ctx.ortak(); }
      v.addEventListener('play', function () {
        if (!aktif) return;
        basla.style.display = 'none';
        if (!soruAcik) ctx.kaydet('oynatti', { id: 'video', ad: b.baslik }, null, { zaman: Math.round(v.currentTime * 10) / 10 });
        if (videoYay()) C.gonder('video', { olay: 'oynat', zaman: v.currentTime, blok: b.id });
      });
      v.addEventListener('pause', function () {
        if (!aktif || v.ended) return;
        ctx.kaydet('durdurdu', { id: 'video', ad: b.baslik }, null, { zaman: Math.round(v.currentTime * 10) / 10 });
        if (videoYay() && !soruAcik) C.gonder('video', { olay: 'durdur', zaman: v.currentTime, blok: b.id });
      });
      v.addEventListener('seeking', function () {
        if (!aktif) return;
        if (b.atlanamaz !== false && ctx.rol !== 'ogretmen' && v.currentTime > enUzak + 1.5 && !canliYonetim) {
          v.currentTime = enUzak;
          ctx.bildir('İlk izleyişte ileri sarılamaz', 'uyari');
          return;
        }
        ctx.kaydet('atladi', { id: 'video', ad: b.baslik }, null, { zaman: Math.round(v.currentTime * 10) / 10 });
        if (videoYay()) C.gonder('video', { olay: 'atla', zaman: v.currentTime, blok: b.id });
      });
      v.addEventListener('timeupdate', function () {
        if (!aktif) return;
        var t = v.currentTime;
        if (!v.seeking && t > enUzak && t - enUzak < 2) enUzak = t;
        izlenen[Math.floor(t)] = true;
        // Altyazı
        if (b.altyazilar) {
          var s = b.altyazilar.find(function (a) { return t >= a.bas && t < a.son; });
          ctx.altyazi(s ? s.metin : '');
        }
        // Durak
        var d = duraklar.find(function (d) { return !d.cevaplandi && d.zaman !== 'son' && t >= d.zaman; });
        if (d) soruGoster(d);
      });
      v.addEventListener('ended', function () {
        if (!aktif) return;
        ctx.altyazi('');
        var oran = Math.round(Object.keys(izlenen).length / Math.max(1, Math.floor(v.duration)) * 100) / 100;
        ctx.kaydet('tamamladi', { id: 'video', ad: b.baslik, tur: 'media' }, { tamam: true }, { izlenmeOrani: Math.min(1, oran) });
        var d = duraklar.find(function (d) { return !d.cevaplandi; });
        if (d) soruGoster(d); else bitir();
      });

      function soruGoster(d) {
        if (soruAcik) return;
        soruAcik = true;
        v.pause();
        perde.innerHTML = '';
        perde.classList.add('acik');
        var s = d.soru, bas = Date.now();
        var secenekler = ctx.karistir(s.secenekler.map(function (m, i) { return { m: m, i: i }; }), 'durak' + d.i);
        acikDurak = { d: d, liste: null, kart: null, secenekler: secenekler, bas: bas };
        var kart = el('div', { class: 'durak-kart' }, [
          el('span', { class: 'durak-etiket', text: '⏸ Durak sorusu' }),
          el('h3', { text: s.metin })
        ]);
        var liste = el('div', { class: 'durak-secenek' });
        secenekler.forEach(function (o) {
          liste.appendChild(el('button', { class: 'secenek', 'data-i': o.i, text: o.m, onclick: function () { ctx.eylem('durak', { d: d.i, i: o.i }); } }));
        });
        kart.appendChild(liste);
        perde.appendChild(kart);
        acikDurak.liste = liste; acikDurak.kart = kart;
      }
      // Durak cevabı ve "devam" birer hamledir: kim cevaplarsa herkesin ekranında aynısı olur
      ctx.eylemTanimla('durak', function (x, kk) {
        var d = duraklar.find(function (y) { return y.i === x.d; });
        if (!d || d.cevaplandi) return;
        if (!acikDurak || acikDurak.d !== d) { soruAcik = false; soruGoster(d); }
        var s = d.soru, liste = acikDurak.liste, kart = acikDurak.kart, dogru = x.i === s.dogru;
        liste.querySelectorAll('button').forEach(function (bb) { bb.disabled = true; });
        var secilen = liste.querySelector('[data-i="' + x.i + '"]'); if (secilen) secilen.classList.add(dogru ? 'dogru' : 'yanlis');
        if (!dogru) { var dd = liste.querySelector('[data-i="' + s.dogru + '"]'); if (dd) dd.classList.add('dogru'); }
        if (!kk.tekrar) (dogru ? DO.efekt.dogru : DO.efekt.yanlis)();
        if (kk.yerel) {
          var p = dogru ? 10 : 0; puan += p;
          ctx.cevap({ oge: 'durak-' + d.i, ad: s.metin, yanit: s.secenekler[x.i], dogru: dogru, dogruYanit: s.secenekler[s.dogru], puan: p, max: 10, sureMs: Date.now() - acikDurak.bas });
        }
        d.cevaplandi = true;
        kart.appendChild(el('p', { class: 'durak-aciklama ' + (dogru ? 'd' : 'y'), text: (dogru ? '✓ ' : '✗ ') + (s.aciklama || '') }));
        kart.appendChild(el('button', { class: 'dug ana', text: v.ended ? 'Devam' : 'Videoya devam ▶', onclick: function () { ctx.eylem('durakDevam', { d: d.i }); } }));
      });
      ctx.eylemTanimla('durakDevam', function (x, kk) {
        if (!acikDurak || acikDurak.d.i !== x.d || !acikDurak.d.cevaplandi) return;
        acikDurak = null;
        perde.classList.remove('acik'); soruAcik = false;
        if (v.ended) { var k = duraklar.find(function (y) { return !y.cevaplandi; }); if (k) soruGoster(k); else bitir(); }
        else if (!kk.tekrar) oynat();
      });
      function bitir() {
        bitti = true;
        ctx.tamamla({ puan: puan, max: duraklar.length * 10 });
        perde.innerHTML = '';
        perde.classList.add('acik');
        perde.appendChild(el('div', { class: 'durak-kart bitis' }, [
          el('h3', { text: '✓ Video tamamlandı' }),
          duraklar.length ? el('p', { text: 'Durak soruları: ' + puan + ' / ' + duraklar.length * 10 + ' puan' }) : null,
          el('div', { class: 'sonu-dugmeler' }, [
            el('button', { class: 'dug ikincil', text: '↻ Tekrar izle', onclick: function () { perde.classList.remove('acik'); v.currentTime = 0; oynat(); } }),
            ctx.takipte() ? el('p', { class: 'bekle-not', text: '✓ Hocamız devam ettirecek' }) : el('button', { class: 'dug ana', text: 'Devam et →', onclick: function () { ctx.ileri(); } })
          ])
        ]));
      }
      // Canlı derste video ortak oynar: kim oynatır/durdurursa herkeste aynı olur
      if (ctx.rol !== 'bireysel') {
        ctx.dinle('video', function (m) {
          if (m.veri.blok !== b.id || soruAcik) return;
          if (ctx.rol === 'ogrenci' && m.gonderen.rol === 'ogretmen' && !ctx.oynatici.kilit) return;
          canliYonetim = true;
          if (Math.abs(v.currentTime - m.veri.zaman) > 1.2) v.currentTime = m.veri.zaman;
          if (m.veri.olay === 'oynat') oynat();
          if (m.veri.olay === 'durdur') v.pause();
          setTimeout(function () { canliYonetim = false; }, 400);
        });
      }
      return {
        temizle: function () { aktif = false; v.pause(); v.innerHTML = ''; v.load(); },
        sesDegisti: function (bende) { v.muted = !bende; }
      };
    }
  };

  /* =====================================================================
     KARTLAR — dokun, çevir, tanı
     ===================================================================== */
  B.kartlar = {
    zorunlu: true,
    ciz: function (ctx) {
      var b = ctx.blok;
      var k = DO.oyunKabuk(ctx, { rozet: 'Keşfet', sinif: 'oyun-kartlar' });
      var izgara = el('div', { class: 'cevir-izgara', style: { '--adet': b.kartlar.length } });
      var cevrilen = {};
      b.kartlar.forEach(function (kart, i) {
        var c = el('button', { class: 'cevir-kart', style: { '--r': kart.renk || '#4f7a3a', animationDelay: (i * 0.12) + 's' }, 'aria-label': kart.on }, [
          el('div', { class: 'cevir-ic' }, [
            el('div', { class: 'cevir-on' }, [
              el('div', { class: 'cevir-ikon', html: kart.gorsel ? '<img src="' + DO.kacis(ctx.yol(kart.gorsel)) + '" alt="">' : DO.ikonSvg(kart.ikon, kart.renk, 150) }),
              el('h3', { text: kart.on }),
              el('span', { class: 'cevir-ipucu', text: 'Dokun, çevir' })
            ]),
            el('div', { class: 'cevir-arka' }, [
              el('h3', { text: kart.on }),
              el('p', { text: kart.arka }),
              kart.not ? el('em', { text: kart.not }) : null
            ])
          ])
        ]);
        // Mutlak durum gönderilir ("i. kart açık"), "çevir" değil: iki cihaz aynı anda dokunsa da sonuç aynı kalır
        c.onclick = function () { ctx.eylem('cevir', { i: i, acik: !c.classList.contains('donuk') }); };
        izgara.appendChild(c);
      });
      ctx.eylemTanimla('cevir', function (v, k) {
        var c = izgara.children[v.i], kart = b.kartlar[v.i]; if (!c) return;
        c.classList.toggle('donuk', !!v.acik);
        DO.efekt.tik();
        if (v.acik && !cevrilen[v.i]) {
          cevrilen[v.i] = true;
          if (k.yerel) ctx.etkiles('kart-' + v.i, kart.on + ' kartını çevirdi');
          if (Object.keys(cevrilen).length === b.kartlar.length) {
            ctx.tamamla({ puan: 0, max: 0 });
            if (!k.tekrar) ctx.bildir('Bütün kartlar tanındı ✓', 'puan');
          }
        }
      });
      k.govde.appendChild(izgara);
      return {};
    }
  };

  /* =====================================================================
     ANKET — doğru cevabı olmayan, sınıfın düşüncesini gösteren soru
     ===================================================================== */
  B.anket = {
    zorunlu: true, canli: 'bireysel-sabit',
    ciz: function (ctx) {
      var b = ctx.blok;
      var k = DO.oyunKabuk(ctx, { rozet: 'Sence?', sinif: 'oyun-anket', yonerge: b.soru });
      var oylar = {}; // kisiId -> secenek index
      var benim = null;
      var liste = el('div', { class: 'anket-secenek' });
      var grafik = el('div', { class: 'anket-grafik' });
      b.secenekler.forEach(function (s, i) {
        liste.appendChild(el('button', { class: 'secenek buyuk', 'data-i': i, style: { animationDelay: (i * 0.1) + 's' }, text: s, onclick: function () {
          if (benim == null) ctx.eylem('oy', { i: i });
        } }));
      });
      // Oy bir hamledir: öğrencinin seçimi Hocamızın ekranında da işaretlenir
      ctx.eylemTanimla('oy', function (v, kk) {
        if (benim != null) return;
        var dug = liste.querySelector('[data-i="' + v.i + '"]'); if (!dug) return;
        benim = v.i; dug.classList.add('secili'); liste.classList.add('oylandi');
        if (!kk.tekrar) DO.efekt.tik();
        if (kk.yerel) {
          oylar.ben = v.i;
          ctx.cevap({ oge: 'oy', ad: b.soru, yanit: b.secenekler[v.i], dogru: null, etkilesim: 'likert' });
          ctx.tamamla({ puan: 0, max: 0 });
        } else if (kk.kim) oylar[kk.kim.id] = v.i;
        ciz();
      });
      k.govde.appendChild(liste);
      k.govde.appendChild(grafik);
      var acildi = false;   // canlı derste sonuçları Hocamız açar (öğrenciler birbirinden etkilenmesin)
      ctx.dinle('cevap', function (m) { if (m.veri.blok === b.id) { oylar[m.gonderen.id] = b.secenekler.indexOf(m.veri.yanit); ciz(); } });
      ctx.eylemTanimla('goster', function (v) {
        acildi = true;
        if (v && v.oylar && ctx.rol !== 'ogretmen') {
          var benId = DO.Canli.ben && DO.Canli.ben.id, yeni = {};
          Object.keys(v.oylar).forEach(function (kisi) { if (kisi !== benId) yeni[kisi] = v.oylar[kisi]; });
          if (benim != null) yeni.ben = benim;
          oylar = yeni;
        }
        ciz();
      });
      function ciz() {
        var say = b.secenekler.map(function () { return 0; }), top = 0;
        for (var kisi in oylar) if (oylar[kisi] >= 0) { say[oylar[kisi]]++; top++; }
        if (benim == null && ctx.rol !== 'ogretmen') return;
        if (ctx.rol === 'ogrenci' && ctx.canliMi() && !acildi) {
          grafik.innerHTML = '';
          grafik.appendChild(el('p', { class: 'anket-ozet', text: '✓ Cevabın alındı. Sonuçları Hocamız açınca burada göreceksin.' }));
          return;
        }
        grafik.innerHTML = '';
        grafik.appendChild(el('p', { class: 'anket-ozet', text: top + ' kişi cevapladı' }));
        b.secenekler.forEach(function (s, i) {
          var oran = top ? say[i] / top : 0;
          grafik.appendChild(el('div', { class: 'anket-cubuk' + (i === benim ? ' benim' : '') }, [
            el('span', { class: 'anket-ad', text: s }),
            el('span', { class: 'anket-dolgu' }, el('i', { style: { width: (oran * 100) + '%' } })),
            el('b', { text: say[i] })
          ]));
        });
        // b.not öğretmen notudur, yalnızca öğretmen panelinde görünür; öğrenciye b.ogrenciNotu gösterilir
        if (b.ogrenciNotu && benim != null) grafik.appendChild(el('p', { class: 'anket-not', text: b.ogrenciNotu }));
      }
      if (ctx.rol === 'ogretmen') ciz();
      return {
        ogretmenAraci: function () {
          if (!ctx.canliMi()) return null;
          return el('button', { class: 'dug kucuk tam', text: acildi ? '✓ Sonuçlar öğrencilerde açık' : 'Anket sonuçlarını öğrencilere göster', onclick: function () {
            var o = {}; Object.keys(oylar).forEach(function (k) { if (k !== 'ben') o[k] = oylar[k]; });
            ctx.eylem('goster', { oylar: o }, { ogretmen: true });
            ctx.oynatici.panelYaz();
          } });
        }
      };
    }
  };

  /* =====================================================================
     DÜŞÜN — kendi cümlesi / niyet kartı (açık uçlu)
     ===================================================================== */
  B.dusun = {
    zorunlu: true, canli: 'bireysel-sabit',
    ciz: function (ctx) {
      var b = ctx.blok;
      var k = DO.oyunKabuk(ctx, { rozet: 'Kendi cümlen', sinif: 'oyun-dusun' });
      var secili = {};
      var form = el('div', { class: 'dusun-form' });
      var sorular = b.sorular || [{ soru: b.soru, secenekler: b.secenekler }];
      // Niyet kartında her soru tek seçimlidir; çoklu seçim yalnız açıkça istenirse açılır.
      var tekSecim = b.cokluSecim !== true;
      sorular.forEach(function (s, si) {
        var grup = el('div', { class: 'dusun-grup' }, [el('h3', { text: s.soru })]);
        var cipler = el('div', { class: 'cipler', role: 'group', 'aria-label': s.soru });
        (s.secenekler || []).forEach(function (c) {
          cipler.appendChild(el('button', { class: 'cip', type: 'button', 'aria-pressed': 'false', 'data-a': si + ':' + c, text: c, onclick: function () { ctx.eylem('cip', { a: si + ':' + c, c: c }); } }));
        });
        grup.appendChild(cipler);
        form.appendChild(grup);
      });
      var alan = el('textarea', { class: 'dusun-metin', rows: 3, maxlength: 400, placeholder: b.ipucu || 'İstersen kendi cümleni de yaz…' });
      if (b.metinAlani !== false) form.appendChild(alan);
      // Seçimler ve yazı birer hamledir: öğrencinin yazdığı Hocamızın ekranında da belirir
      ctx.eylemTanimla('cip', function (v, kk) {
        var d = form.querySelector('.cip[data-a="' + v.a.replace(/"/g, '\\"') + '"]'); if (!d) return;
        if (secili[v.a]) { delete secili[v.a]; d.classList.remove('secili'); d.setAttribute('aria-pressed', 'false'); }
        else {
          if (tekSecim) {
            var grupNo = v.a.slice(0, v.a.indexOf(':') + 1);
            Object.keys(secili).forEach(function (k) {
              if (k.indexOf(grupNo) !== 0) return;
              delete secili[k];
              var eski = form.querySelector('.cip[data-a="' + k.replace(/"/g, '\\"') + '"]');
              if (eski) { eski.classList.remove('secili'); eski.setAttribute('aria-pressed', 'false'); }
            });
          }
          secili[v.a] = v.c; d.classList.add('secili'); d.setAttribute('aria-pressed', 'true');
        }
        if (!kk.tekrar) DO.efekt.tik();
      });
      ctx.eylemTanimla('yaz', function (v, kk) { if (!kk.yerel) alan.value = v.metin; });
      var yazZaman = null;
      alan.addEventListener('input', function () {
        if (!ctx.canliMi()) return;
        clearTimeout(yazZaman);
        yazZaman = ctx.zaman(function () { ctx.eylem('yaz', { metin: alan.value }); }, 350);
      });
      if (ctx.izliyor && ctx.izliyor()) alan.readOnly = true;
      var kaydet = el('button', { class: 'dug ana', text: 'Kaydet ve paylaş', onclick: function () {
        var secimler = Object.keys(secili).map(function (k) { return secili[k]; });
        var metin = alan.value.trim();
        if (!secimler.length && !metin) { ctx.bildir('Bir seçim yap ya da birkaç kelime yaz 🙂', 'uyari'); return; }
        ctx.eylem('kaydet', { metin: metin });
      } });
      ctx.eylemTanimla('kaydet', function (v, kk) {
        if (!form.contains(kaydet)) return;
        var metin = (v.metin || '').trim();
        // Kayıt soru soru okunur: "Önemseyeceğim sünnet: … · Kaçınacağım mekruh: …".
        var satirlar = sorular.map(function (s, si) {
          var secim = Object.keys(secili).filter(function (k) { return k.indexOf(si + ':') === 0; }).map(function (k) { return secili[k]; });
          return secim.length ? (s.etiket || s.soru) + ': ' + secim.join(', ') : '';
        }).filter(Boolean);
        if (metin) satirlar.push('Not: ' + metin);
        var yanit = satirlar.join(' · ');
        if (kk.yerel) {
          ctx.cevap({ oge: 'dusunce', ad: b.baslik || 'Düşünce', yanit: yanit, dogru: null, etkilesim: 'fill-in' });
          ctx.tamamla({ puan: 0, max: 0 });
        }
        if (!kk.tekrar) DO.efekt.dogru();
        form.innerHTML = '';
        form.appendChild(el('div', { class: 'dusun-tesekkur' }, [
          el('div', { class: 'dusun-kalp', html: DO.ikonSvg('kalp', '#c0392b', 90) }),
          el('h3', { text: b.tesekkur || 'Niyetin kaydedildi. Allahü teâlâ kolaylık versin.' }),
          el('p', { class: 'dusun-ozet', text: yanit })
        ]));
      });
      form.appendChild(kaydet);
      k.govde.appendChild(form);
      return {};
    }
  };

  /* =====================================================================
     KAPANIŞ — rozet, özet, rapor
     ===================================================================== */
  B.kapanis = {
    xapiTur: 'module',
    ciz: function (ctx) {
      var b = ctx.blok, O = ctx.oynatici;
      var top = O.toplamPuan(), max = O.maxToplam, oran = max ? top / max : 1;
      var lmsIcinde = DO.Kayit.hedefAdlari().some(function (h) { return /SCORM/.test(h); });
      var kurumda = DO.LmsDers && DO.LmsDers.aktif, canliDers = kurumda && DO.LmsDers.session;
      var hoca = canliDers && DO.LmsDers.profile && DO.LmsDers.profile.role === 'ogretmen';
      // Hiç puanlı oyun açılmadıysa yüzde gösterilmez; "%100" yanıltıcı olur.
      var puanMetni = max ? '★ <b>' + top + '</b> / ' + max + ' puan · %' + Math.round(oran * 100) : 'Bu derste puanlı oyun yapılmadı.';
      var dugmeler;
      if (lmsIcinde) dugmeler = el('div', { class: 'sonu-dugmeler' }, [
        el('button', { class: 'dug ana', text: 'Dersi bitir ve kaydet', onclick: function () {
          DO.Kayit.kapat();
          this.disabled = true;
          this.textContent = '✓ Kaydedildi — pencereyi kapatabilirsin';
        } })
      ]);
      // Canlı derste kapanışı hoca üstteki düğmeyle yapar; özet panelde açılır.
      else if (canliDers) dugmeler = el('p', { class: 'kapanis-not', text: hoca ? 'Kapanış kartı birazdan altta açılır; dersi oradan tek düğmeyle bitirebilirsiniz. Ders özeti panelinizde de durur.' : 'Hocamız dersi bitirince ders özetin panelinde görünecek.' });
      else if (kurumda) dugmeler = el('div', { class: 'sonu-dugmeler' }, [el('a', { class: 'dug ana', href: 'panel.html', text: 'Panelime dön' })]);
      // Eski rapor sayfası kapandı; hesapsız derste rapor tutulmaz.
      else dugmeler = el('div', { class: 'sonu-dugmeler' }, [el('a', { class: 'dug ana', href: 'index.html', text: 'Ders listesine dön' })]);
      var kap = el('div', { class: 'kapanis' });
      var isinlar = '';
      for (var i = 0; i < 24; i++) isinlar += '<rect x="796" y="70" width="8" height="70" rx="4" fill="#e9b949" opacity=".5" transform="rotate(' + (i * 15) + ' 800 330)"/>';
      var maddeler = b.maddeler || [];
      var rozetIkon = '';
      maddeler.forEach(function (m, i) {
        var a = (-90 + (i - (maddeler.length - 1) / 2) * 52) * Math.PI / 180;
        var x = 800 + Math.cos(a) * 225 - 50, y = 330 + Math.sin(a) * 225 - 50;
        rozetIkon += '<g class="rozet-ikon" style="animation-delay:' + (0.9 + i * 0.2) + 's" transform="translate(' + x.toFixed(0) + ' ' + y.toFixed(0) + ') scale(.9)">' +
          '<circle cx="50" cy="50" r="50" fill="#fffaf0" stroke="' + m.renk + '" stroke-width="5"/><g transform="translate(15 15) scale(.7)">' + (IK[m.ikon] || IK.yildiz)(m.renk) + '</g></g>';
      });
      kap.innerHTML = '<svg class="kapanis-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">' +
        '<defs><pattern id="kp" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0v40" fill="none" stroke="#e7dcc4"/></pattern>' +
        '<radialGradient id="rz" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#7fb069"/><stop offset="1" stop-color="#4f7a3a"/></radialGradient></defs>' +
        '<rect width="1600" height="900" fill="#f7f0e1"/><rect width="1600" height="900" fill="url(#kp)" opacity=".7"/>' +
        '<g transform="translate(800 250) scale(.7) translate(-800 -330)"><g class="kapanis-isin">' + isinlar + '</g>' +
        '<g class="kapanis-rozet"><circle cx="800" cy="330" r="200" fill="#fffaf0" stroke="#e9b949" stroke-width="10"/>' +
        '<circle cx="800" cy="330" r="110" fill="url(#rz)"/>' +
        '<path d="M800 262l18 37 41 6-30 29 7 41-36-19-36 19 7-41-30-29 41-6z" fill="#f7e3a1"/>' +
        '<path d="M690 500l-40 110 60-25 35 50 30-120zM910 500l40 110-60-25-35 50-30-120z" fill="#c0392b" opacity=".85"/>' +
        '</g>' + rozetIkon + '</g></svg>';
      var metin = el('div', { class: 'kapanis-metin' }, [
        el('h1', { text: b.baslik || 'Ders tamamlandı' }),
        el('p', { class: max ? 'kapanis-puan' : 'kapanis-puan bos', html: puanMetni }),
        el('div', { class: 'kapanis-maddeler' }, maddeler.map(function (m) {
          return el('span', { style: { '--r': m.renk } }, [el('b', { text: m.baslik }), ' ', m.metin]);
        })),
        b.dua ? el('p', { class: 'kapanis-dua', text: b.dua }) : null,
        dugmeler
      ]);
      kap.appendChild(metin);
      ctx.kap.appendChild(kap);
      ctx.tamamla({ puan: 0, max: 0 });
      ctx.zaman(function () { DO.efekt.zafer(); DO.konfeti(ctx.kap, 120); }, 600);
      if (b.ses) ctx.anlatim(b.ses);
      return {};
    }
  };
})();
