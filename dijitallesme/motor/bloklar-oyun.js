/* Ders Odası — oyun blokları
   coktan · dogruYanlis · siniflandir · eslestir · hafiza · yol · gosterge · kilit · hizTuru

   Canlı ders eşlemesi (bkz. oynatici.js "Canlı eşleme"):
   • Her hamle bir eylemdir: ctx.eylem('ad', veri) → her cihazda aynı işleyici çalışır.
   • "Herkes kendi" modunda eylem yalnız o cihazda çalışır; sıralar herkeste aynıdır (ctx.karistir).
   • "Birlikte" modunda eylem herkese gider; puan ve kayıt hamleyi yapanındır (k.yerel).
   • Hamleler soru/adım numarası taşır. Bir geçiş animasyonu sürerken yeni hamle gelirse
     önce bekleyen geçiş bitirilir (sira.bosalt) — hiçbir hamle düşmez, cihazlar ayrışmaz.
   Puanlama: her öge ilk denemede doğruysa 10 puan (hız turunda hız bonusu ile). */
(function () {
  'use strict';
  var DO = window.DO, el = DO.el, B = DO.Bloklar;

  function onAdet(n) { return function (b) { return (b[n] || []).length * 10; }; }
  function geriBildirim(kap, dogru, metin) {
    var g = el('div', { class: 'geri-bildirim ' + (dogru ? 'd' : 'y') }, [
      el('b', { text: dogru ? '✓ Doğru' : '✗ Bir daha bakalım' }),
      metin ? el('span', { text: metin }) : null
    ]);
    kap.appendChild(g);
    return g;
  }
  function noktalar(adet) {
    var k = el('div', { class: 'ilerleme-nokta' });
    for (var i = 0; i < adet; i++) k.appendChild(el('i'));
    k.isaretle = function (i, durum) { if (k.children[i]) k.children[i].className = durum; };
    k.sifirla = function () { Array.prototype.forEach.call(k.children, function (c) { c.className = ''; }); };
    return k;
  }
  /* Bekleyen geçiş: bir sonraki hamle gelince beklemeden çalıştırılabilir */
  function siraci(ctx) {
    var bekleyen = null, zaman = null;
    return {
      sonra: function (fn, ms, k) {
        if (k && k.tekrar) { fn(); return; }
        bekleyen = fn;
        zaman = ctx.zaman(function () { var f = bekleyen; bekleyen = null; if (f) f(); }, ms);
      },
      bosalt: function () {
        if (!bekleyen) return;
        clearTimeout(zaman);
        var f = bekleyen; bekleyen = null; f();
      }
    };
  }
  function efekt(dogru, k) { if (k && k.tekrar) return; (dogru ? DO.efekt.dogru : DO.efekt.yanlis)(); }
  /* Kim cevapladı (birlikte modunda başkasının hamlesi görünür olsun) */
  function kimEtiketi(ctx, k) {
    if (!ctx.ortak() || !k || !k.kim || k.yerel) return null;
    return el('span', { class: 'kim-etiket', text: (k.kim.rol === 'ogretmen' ? 'Hocamız' : k.kim.ad) + ' cevapladı' });
  }
  var ORTAK = { canli: 'ortak', ortakDestek: true };   // varsayılan: tek ortak ekran
  function tanim(o) { return Object.assign({}, ORTAK, o); }

  /* =====================================================================
     ÇOKTAN SEÇMELİ — soru seti
     ===================================================================== */
  B.coktan = tanim({
    zorunlu: true, xapiTur: 'assessment', max: onAdet('sorular'),
    ciz: function (ctx) {
      var b = ctx.blok, k = DO.oyunKabuk(ctx, { rozet: b.rozet || 'Soru', sinif: 'oyun-coktan' });
      var sira = 0, puan = 0, nk = noktalar(b.sorular.length), z = siraci(ctx);
      var ekran = null; // {sira, secenekler, izgara, kart, cevaplandi, bas}
      k.ust.appendChild(nk);
      function goster() {
        if (sira >= b.sorular.length) {
          ctx.tamamla({ puan: puan });
          DO.oyunSonu(ctx, k.govde, { puan: puan, max: b.sorular.length * 10, tekrar: function () { ctx.eylem('tekrar'); } });
          ekran = null;
          return;
        }
        var s = b.sorular[sira];
        k.govde.innerHTML = '';
        var kart = el('div', { class: 'soru-kart' }, [
          el('span', { class: 'soru-no', text: (sira + 1) + '. soru' }),
          s.gorsel ? el('img', { class: 'soru-gorsel', src: ctx.yol(s.gorsel), alt: '' }) : null,
          el('h3', { class: 'soru-metin', text: s.metin })
        ]);
        var harf = 'ABCD', buSira = sira;
        var secenekler = ctx.karistir(s.secenekler.map(function (m, i) { return { m: m, i: i }; }), 'soru' + sira);
        var izgara = el('div', { class: 'secenek-izgara' + (secenekler.length > 2 ? ' dort' : '') });
        secenekler.forEach(function (o, j) {
          izgara.appendChild(el('button', { class: 'secenek', 'data-i': o.i, style: { animationDelay: (j * 0.08) + 's' }, html: '<i>' + harf[j] + '</i><span>' + DO.kacis(o.m) + '</span>', onclick: function () {
            if (!ekran || ekran.cevaplandi) return;
            ctx.eylem('sec', { sira: buSira, i: o.i });
          } }));
        });
        kart.appendChild(izgara);
        k.govde.appendChild(kart);
        ekran = { sira: sira, izgara: izgara, kart: kart, cevaplandi: false, bas: Date.now() };
      }
      ctx.eylemTanimla('sec', function (v, kk) {
        z.bosalt();
        if (!ekran || v.sira !== ekran.sira || ekran.cevaplandi) return;
        var s = b.sorular[v.sira], dogru = v.i === s.dogru, o = s.secenekler[v.i];
        ekran.cevaplandi = true;
        var iz = ekran.izgara;
        iz.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
        var secilen = iz.querySelector('[data-i="' + v.i + '"]');
        if (secilen) secilen.classList.add(dogru ? 'dogru' : 'yanlis');
        if (!dogru) { var d = iz.querySelector('[data-i="' + s.dogru + '"]'); if (d) d.classList.add('dogru'); }
        efekt(dogru, kk);
        nk.isaretle(v.sira, dogru ? 'd' : 'y');
        if (kk.yerel) {
          var p = dogru ? 10 : 0; puan += p;
          ctx.cevap({ oge: s.id || ('s' + v.sira), ad: s.metin, yanit: o, dogru: dogru, dogruYanit: s.secenekler[s.dogru], puan: p, max: 10, sureMs: Date.now() - ekran.bas });
        }
        var et = kimEtiketi(ctx, kk); if (et) ekran.kart.appendChild(et);
        geriBildirim(ekran.kart, dogru, s.aciklama);
        ekran.kart.appendChild(el('button', { class: 'dug ana devam', text: v.sira < b.sorular.length - 1 ? 'Sonraki soru →' : 'Bitir', onclick: function () { ctx.eylem('devam', { sira: v.sira }); } }));
      });
      ctx.eylemTanimla('devam', function (v) {
        if (!ekran || v.sira !== ekran.sira || !ekran.cevaplandi) return;
        sira = v.sira + 1; goster();
      });
      ctx.eylemTanimla('tekrar', function () { ctx.yeniTur(); sira = 0; puan = 0; nk.sifirla(); goster(); });
      goster();
      return {};
    }
  });

  /* =====================================================================
     DOĞRU / YANLIŞ — kartı sağa (doğru) veya sola (yanlış) kaydır
     ===================================================================== */
  B.dogruYanlis = tanim({
    zorunlu: true, xapiTur: 'assessment', max: onAdet('ifadeler'),
    ciz: function (ctx) {
      var b = ctx.blok, k = DO.oyunKabuk(ctx, { rozet: 'Doğru mu?', sinif: 'oyun-dy', yonerge: b.yonerge || 'Kartı sağa kaydır: Doğru · Sola kaydır: Yanlış' });
      var sira = 0, puan = 0, liste = ctx.karistir(b.ifadeler, 'dy'), nk = noktalar(liste.length);
      k.ust.appendChild(nk);
      var masa = el('div', { class: 'dy-masa' });
      var yanlisDug = el('button', { class: 'dy-dug y', html: '<b>✗</b><span>Yanlış</span>', onclick: function () { iste(false); } });
      var dogruDug = el('button', { class: 'dy-dug d', html: '<b>✓</b><span>Doğru</span>', onclick: function () { iste(true); } });
      var deste = el('div', { class: 'dy-deste' });
      masa.appendChild(yanlisDug); masa.appendChild(deste); masa.appendChild(dogruDug);
      k.govde.appendChild(masa);
      var aktif = null, bas = 0, karar = false, z = siraci(ctx);

      function kartCiz() {
        if (sira >= liste.length) {
          ctx.tamamla({ puan: puan });
          DO.oyunSonu(ctx, k.govde, { puan: puan, max: liste.length * 10, tekrar: function () { ctx.eylem('tekrar'); } });
          aktif = null;
          return;
        }
        deste.innerHTML = '';
        var s = liste[sira];
        aktif = el('div', { class: 'dy-kart' + (s.gorsel ? ' resimli' : '') }, [el('span', { class: 'dy-no', text: (sira + 1) + ' / ' + liste.length }), s.gorsel ? el('img', { class: 'dy-resim', src: ctx.yol(s.gorsel), alt: '', draggable: 'false' }) : null, el('p', { text: s.metin })]);
        deste.appendChild(aktif);
        if (sira + 1 < liste.length) deste.insertBefore(el('div', { class: 'dy-kart arka' }), aktif);
        bas = Date.now(); karar = false;
        surukle(aktif);
      }
      function iste(secim) {
        if (karar || !aktif) return;
        var kart = aktif;
        if (!ctx.eylem('karar', { sira: sira, secim: secim })) { kart.style.transform = ''; kart.classList.remove('egim-d', 'egim-y'); }
      }
      function surukle(kart) {
        var x0 = null, dx = 0;
        kart.addEventListener('pointerdown', function (e) { if (karar) return; x0 = e.clientX; dx = 0; kart.setPointerCapture(e.pointerId); kart.classList.add('tutuluyor'); });
        kart.addEventListener('pointermove', function (e) {
          if (x0 == null) return;
          dx = (e.clientX - x0) / ctx.oynatici.olcek;
          kart.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx / 18) + 'deg)';
          kart.classList.toggle('egim-d', dx > 60); kart.classList.toggle('egim-y', dx < -60);
        });
        function birak() {
          if (x0 == null) return; x0 = null; kart.classList.remove('tutuluyor');
          if (Math.abs(dx) > 160) iste(dx > 0); else { kart.style.transform = ''; kart.classList.remove('egim-d', 'egim-y'); }
        }
        kart.addEventListener('pointerup', birak); kart.addEventListener('pointercancel', birak);
      }
      ctx.eylemTanimla('karar', function (v, kk) {
        z.bosalt();
        if (v.sira !== sira || karar || !aktif) return;
        karar = true;
        var s = liste[sira], dogru = v.secim === s.dogru;
        nk.isaretle(sira, dogru ? 'd' : 'y');
        efekt(dogru, kk);
        if (kk.yerel) {
          var p = dogru ? 10 : 0; puan += p;
          ctx.cevap({ oge: s.id, ad: s.metin, yanit: v.secim ? 'Doğru' : 'Yanlış', dogru: dogru, dogruYanit: s.dogru ? 'Doğru' : 'Yanlış', puan: p, max: 10, sureMs: Date.now() - bas, etkilesim: 'true-false' });
        }
        aktif.style.transform = 'translateX(' + (v.secim ? 900 : -900) + 'px) rotate(' + (v.secim ? 30 : -30) + 'deg)';
        aktif.classList.add('ucuyor');
        var buSira = sira, et = kimEtiketi(ctx, kk);
        var gb = el('div', { class: 'dy-geri ' + (dogru ? 'd' : 'y') }, [
          el('b', { text: dogru ? '✓ Doğru bildin' : '✗ Bu ifade ' + (s.dogru ? 'doğru' : 'yanlış') }),
          et,
          el('p', { text: s.aciklama || '' }),
          el('button', { class: 'dug ana', text: 'Devam', onclick: function () { ctx.eylem('devam', { sira: buSira }); } })
        ]);
        z.sonra(function () { deste.appendChild(gb); }, 260, kk);
      });
      ctx.eylemTanimla('devam', function (v) {
        z.bosalt();
        if (v.sira !== sira || !karar) return;
        sira++; kartCiz();
      });
      ctx.eylemTanimla('tekrar', function () {
        ctx.yeniTur(); liste = ctx.karistir(b.ifadeler, 'dy'); sira = 0; puan = 0; nk.sifirla();
        k.govde.innerHTML = ''; k.govde.appendChild(masa); kartCiz();
      });
      kartCiz();
      return {};
    }
  });

  /* =====================================================================
     SINIFLANDIR — kartları doğru kutuya sürükle (veya dokun-seç)
     ===================================================================== */
  B.siniflandir = tanim({
    zorunlu: true, xapiTur: 'assessment', max: onAdet('kartlar'),
    ciz: function (ctx) {
      var b = ctx.blok, k = DO.oyunKabuk(ctx, { rozet: 'Yerleştir', sinif: 'oyun-sinif' });
      var puan = 0, yerlesen = 0, hatalar = {}, secili = null, z = siraci(ctx), bitti = false;
      var tepsi = el('div', { class: 'sinif-tepsi' });
      var alanlar = el('div', { class: 'sinif-alanlar', style: { '--adet': b.alanlar.length } });
      var alanEl = {}, kartEl = {};
      b.alanlar.forEach(function (a) {
        var liste = el('div', { class: 'alan-liste' });
        var kutu = el('div', { class: 'sinif-alan', style: { '--r': a.renk }, 'data-alan': a.id }, [
          el('div', { class: 'alan-bas' }, [
            el('span', { class: 'alan-ikon', html: a.gorsel ? '<img src="' + DO.kacis(ctx.yol(a.gorsel)) + '" alt="">' : DO.ikonSvg(a.ikon, a.renk, 54) }),
            el('div', {}, [el('b', { text: a.ad }), a.aciklama ? el('small', { text: a.aciklama }) : null])
          ]),
          liste
        ]);
        kutu.addEventListener('click', function () { if (secili) iste(secili, a.id); });
        alanEl[a.id] = { kutu: kutu, liste: liste };
        alanlar.appendChild(kutu);
      });
      ctx.karistir(b.kartlar, 'kartlar').forEach(function (c, i) {
        var kart = el('div', { class: 'sinif-kart' + (c.gorsel ? ' resimli' : ''), tabindex: 0, 'data-id': c.id, style: { animationDelay: (i * 0.05) + 's' } },
          [c.gorsel ? el('img', { src: ctx.yol(c.gorsel), alt: '', draggable: 'false' }) : null, el('span', { text: c.metin })]);
        kart._veri = c; kart._bas = Date.now();
        kartEl[c.id] = kart;
        surukleBagla(kart);
        tepsi.appendChild(kart);
      });
      k.govde.appendChild(tepsi);
      k.govde.appendChild(alanlar);

      function surukleBagla(kart) {
        var bas = null, tasindi = false;
        kart.addEventListener('pointerdown', function (e) {
          if (kart.classList.contains('yerlesti')) return;
          bas = { x: e.clientX, y: e.clientY }; tasindi = false;
          kart.setPointerCapture(e.pointerId);
        });
        kart.addEventListener('pointermove', function (e) {
          if (!bas) return;
          var dd = ctx.oynatici.delta(e.clientX - bas.x, e.clientY - bas.y), dx = dd.x, dy = dd.y;
          if (!tasindi && Math.abs(dx) + Math.abs(dy) < 8) return;
          tasindi = true;
          kart.classList.add('tasiniyor');
          kart.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (dx / 40) + 'deg)';
          var hedef = alanBul(e.clientX, e.clientY);
          for (var id in alanEl) alanEl[id].kutu.classList.toggle('uzerinde', id === hedef);
        });
        function son(e) {
          if (!bas) return;
          bas = null;
          kart.classList.remove('tasiniyor');
          for (var id in alanEl) alanEl[id].kutu.classList.remove('uzerinde');
          if (!tasindi) { sec(kart); return; }
          var hedef = alanBul(e.clientX, e.clientY);
          kart.style.transform = '';
          if (hedef) iste(kart, hedef);
        }
        kart.addEventListener('pointerup', son);
        kart.addEventListener('pointercancel', function () { bas = null; kart.style.transform = ''; kart.classList.remove('tasiniyor'); });
        kart.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sec(kart); } });
      }
      function sec(kart) {
        if (kart.classList.contains('yerlesti')) return;
        if (secili) secili.classList.remove('secili');
        secili = secili === kart ? null : kart;
        if (secili) { secili.classList.add('secili'); ctx.bildir('Şimdi doğru kutuya dokun', 'bilgi'); }
        DO.efekt.tik();
      }
      function alanBul(x, y) {
        for (var id in alanEl) {
          var r = alanEl[id].kutu.getBoundingClientRect();
          if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return id;
        }
        return null;
      }
      function iste(kart, alanId) {
        if (secili) { secili.classList.remove('secili'); secili = null; }
        ctx.eylem('birak', { kart: kart._veri.id, alan: alanId });
      }
      ctx.eylemTanimla('birak', function (v, kk) {
        z.bosalt();
        var kart = kartEl[v.kart], alanG = alanEl[v.alan];
        if (!kart || !alanG || kart.classList.contains('yerlesti')) return;
        var c = kart._veri, dogru = c.alan === v.alan;
        var alan = b.alanlar.find(function (a) { return a.id === v.alan; });
        var dogruAlan = b.alanlar.find(function (a) { return a.id === c.alan; });
        var ilk = !hatalar[c.id];
        if (kk.yerel) ctx.cevap({ oge: c.id, ad: c.metin, yanit: alan.ad, dogru: dogru, dogruYanit: dogruAlan.ad, puan: dogru && ilk ? 10 : 0, max: 10, deneme: (hatalar[c.id] || 0) + 1, sureMs: Date.now() - kart._bas, etkilesim: 'matching' });
        if (secili === kart) { kart.classList.remove('secili'); secili = null; }
        if (dogru) {
          if (ilk && kk.yerel) puan += 10;
          efekt(true, kk);
          kart.classList.add('yerlesti');
          kart.style.transform = '';
          alanG.liste.appendChild(kart);
          alanG.kutu.classList.add('parla');
          setTimeout(function () { alanG.kutu.classList.remove('parla'); }, 600);
          if (c.aciklama && !kk.tekrar) ctx.bildir('✓ ' + c.aciklama, 'puan');
          yerlesen++;
          if (yerlesen === b.kartlar.length && !bitti) {
            bitti = true;
            z.sonra(function () {
              ctx.tamamla({ puan: puan });
              DO.oyunSonu(ctx, k.govde, { puan: puan, max: b.kartlar.length * 10, metin: b.sonMetin });
            }, 900, kk);
          }
        } else {
          hatalar[c.id] = (hatalar[c.id] || 0) + 1;
          efekt(false, kk);
          alanG.kutu.classList.add('ret');
          kart.classList.add('salla');
          setTimeout(function () { alanG.kutu.classList.remove('ret'); kart.classList.remove('salla'); }, 550);
          if (!kk.tekrar) ctx.bildir(c.ipucu || ('“' + c.metin + '” bu kutuya ait değil. Bir daha düşün.'), 'uyari');
        }
      });
      return {};
    }
  });

  /* =====================================================================
     EŞLEŞTİR — soldakini sağdaki anlamıyla çizgiyle bağla
     ===================================================================== */
  B.eslestir = tanim({
    zorunlu: true, xapiTur: 'assessment', max: onAdet('ciftler'),
    ciz: function (ctx) {
      var b = ctx.blok, k = DO.oyunKabuk(ctx, { rozet: 'Eşleştir', sinif: 'oyun-eslestir', yonerge: b.yonerge || 'Soldan bir kavram, sağdan anlamını seç.' });
      var puan = 0, biten = 0, hata = {}, secSol = null, bas = Date.now(), z = siraci(ctx), bitti = false;
      var alan = el('div', { class: 'esle-alan' });
      var cizgi = DO.svg('svg', { class: 'esle-svg' });
      var sol = el('div', { class: 'esle-sutun sol' }), sag = el('div', { class: 'esle-sutun sag' });
      var solEl = {}, sagEl = {};
      ctx.karistir(b.ciftler, 'sol').forEach(function (c) {
        var d = el('button', { class: 'esle-oge', text: c.sol }); d._c = c; solEl[c.id] = d;
        d.onclick = function () { if (!d.classList.contains('bitti')) ctx.eylem('solSec', { id: c.id }); };
        sol.appendChild(d);
      });
      ctx.karistir(b.ciftler, 'sag').forEach(function (c) {
        var d = el('button', { class: 'esle-oge anlam', text: c.sag }); d._c = c; sagEl[c.id] = d;
        d.onclick = function () {
          if (d.classList.contains('bitti')) return;
          if (!secSol) { ctx.bildir('Önce soldan bir kavram seç', 'bilgi'); return; }
          ctx.eylem('esle', { sol: secSol._c.id, sag: c.id });
        };
        sag.appendChild(d);
      });
      alan.appendChild(sol); alan.appendChild(cizgi); alan.appendChild(sag);
      k.govde.appendChild(alan);
      ctx.eylemTanimla('solSec', function (v, kk) {
        var d = solEl[v.id]; if (!d || d.classList.contains('bitti')) return;
        sol.querySelectorAll('.secili').forEach(function (x) { x.classList.remove('secili'); });
        secSol = d; d.classList.add('secili');
        if (!kk.tekrar) DO.efekt.tik();
      });
      ctx.eylemTanimla('esle', function (v, kk) {
        z.bosalt();
        var a = solEl[v.sol], bb = sagEl[v.sag];
        if (!a || !bb || a.classList.contains('bitti') || bb.classList.contains('bitti')) return;
        var sc = a._c, dogru = v.sol === v.sag, ilk = !hata[sc.id];
        if (kk.yerel) ctx.cevap({ oge: sc.id, ad: sc.sol, yanit: bb._c.sag, dogru: dogru, dogruYanit: sc.sag, puan: dogru && ilk ? 10 : 0, max: 10, sureMs: Date.now() - bas, etkilesim: 'matching' });
        bas = Date.now();
        var cz = cizgiCiz(a, bb, dogru);
        if (dogru) {
          if (ilk && kk.yerel) puan += 10;
          efekt(true, kk);
          a.classList.remove('secili'); a.classList.add('bitti'); bb.classList.add('bitti');
          if (secSol === a) secSol = null;
          biten++;
          if (biten === b.ciftler.length && !bitti) {
            bitti = true;
            z.sonra(function () { ctx.tamamla({ puan: puan }); DO.oyunSonu(ctx, k.govde, { puan: puan, max: b.ciftler.length * 10 }); }, 900, kk);
          }
        } else {
          hata[sc.id] = (hata[sc.id] || 0) + 1;
          efekt(false, kk);
          bb.classList.add('salla');
          setTimeout(function () { bb.classList.remove('salla'); cz.remove(); }, 650);
        }
      });
      function cizgiCiz(a, bb, dogru) {
        var r0 = alan.getBoundingClientRect(), s = ctx.oynatici.olcek;
        var ra = a.getBoundingClientRect(), rb = bb.getBoundingClientRect();
        var x1 = (ra.right - r0.left) / s, y1 = (ra.top + ra.height / 2 - r0.top) / s;
        var x2 = (rb.left - r0.left) / s, y2 = (rb.top + rb.height / 2 - r0.top) / s;
        var mx = (x1 + x2) / 2;
        var p = DO.svg('path', { d: 'M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2, class: 'esle-cizgi ' + (dogru ? 'd' : 'y') });
        cizgi.appendChild(p);
        return p;
      }
      return {};
    }
  });

  /* =====================================================================
     HAFIZA — eşini bul
     ===================================================================== */
  B.hafiza = tanim({
    zorunlu: true, xapiTur: 'assessment', max: onAdet('ciftler'),
    ciz: function (ctx) {
      var b = ctx.blok, k = DO.oyunKabuk(ctx, { rozet: 'Hafıza', sinif: 'oyun-hafiza', yonerge: b.yonerge || 'Kartları çevir, kavramı anlamıyla eşleştir.' });
      var kartlar = [];
      b.ciftler.forEach(function (c) {
        kartlar.push({ id: c.id, yuz: c.a, gorsel: c.aGorsel, tur: 'a', renk: c.renk }); kartlar.push({ id: c.id, yuz: c.b, gorsel: c.bGorsel, tur: 'b', renk: c.renk });
      });
      kartlar = ctx.karistir(kartlar, 'hafiza');
      var acik = [], bulunan = 0, yanlisHamle = 0, hamle = 0, kapanacak = null, bitti = false;
      var benimBulunan = 0, benimYanlis = 0;
      var sayac = el('div', { class: 'hafiza-sayac', text: 'Hamle: 0' });
      k.ust.appendChild(sayac);
      var izgara = el('div', { class: 'hafiza-izgara', style: { '--sutun': Math.ceil(kartlar.length / 3) } });
      kartlar.forEach(function (c, i) {
        var d = el('button', { class: 'hafiza-kart', style: { '--r': c.renk || '#4f7a3a', animationDelay: (i * 0.04) + 's' }, 'aria-label': 'Kapalı kart' }, [
          el('div', { class: 'hk-ic' }, [
            el('div', { class: 'hk-arka', html: '<svg viewBox="0 0 100 100" width="70" height="70"><path d="M50 8 61 39 92 50 61 61 50 92 39 61 8 50 39 39z" fill="none" stroke="#e9b949" stroke-width="4"/><circle cx="50" cy="50" r="10" fill="#e9b949"/></svg>' }),
            c.gorsel ? el('div', { class: 'hk-on resimli ' + c.tur }, [el('img', { src: ctx.yol(c.gorsel), alt: '', draggable: 'false' }), el('span', { text: c.yuz })]) : el('div', { class: 'hk-on ' + c.tur, text: c.yuz })
          ])
        ]);
        d._c = c;
        d.onclick = function () { if (!d.classList.contains('acik') && !d.classList.contains('bulundu')) ctx.eylem('cevir', { i: i }); };
        izgara.appendChild(d);
      });
      k.govde.appendChild(izgara);
      // Eşleşmeyen iki kartı kapat (bekleyen kapanış varsa hemen)
      function kapat() {
        if (!kapanacak) return;
        clearTimeout(kapanacak.t);
        kapanacak.kartlar.forEach(function (x) { x.classList.remove('acik'); });
        kapanacak = null; acik = [];
      }
      ctx.eylemTanimla('cevir', function (v, kk) {
        kapat();                                     // önceki yanlış çift kapanmadan yeni hamle geldiyse
        var d = izgara.children[v.i];
        if (!d || d.classList.contains('acik') || d.classList.contains('bulundu')) return;
        d.classList.add('acik'); if (!kk.tekrar) DO.efekt.tik(); acik.push(d);
        if (acik.length < 2) return;
        hamle++; sayac.textContent = 'Hamle: ' + hamle;
        var a = acik[0], bb = acik[1], esit = a._c.id === bb._c.id && a._c.tur !== bb._c.tur;
        if (kk.yerel) ctx.cevap({ oge: 'hamle-' + hamle, ad: a._c.yuz + ' ↔ ' + bb._c.yuz, yanit: esit ? 'eşleşti' : 'eşleşmedi', dogru: esit, etkilesim: 'matching' });
        if (esit) {
          efekt(true, kk);
          a.classList.add('bulundu'); bb.classList.add('bulundu'); acik = []; bulunan++;
          if (kk.yerel) benimBulunan++;
          if (bulunan === b.ciftler.length && !bitti) {
            bitti = true;
            var max = b.ciftler.length * 10;
            var puan = ctx.ortak()
              ? Math.max(0, benimBulunan * 10 - benimYanlis * 3)                 // birlikte: kendi bulduğun çiftler
              : Math.max(Math.round(max * 0.4), max - yanlisHamle * 3);
            var bitir = function () { ctx.tamamla({ puan: puan }); DO.oyunSonu(ctx, k.govde, { puan: puan, max: max, metin: hamle + ' hamlede bitti.' }); };
            if (kk.tekrar) bitir(); else ctx.zaman(bitir, 800);
          }
        } else {
          yanlisHamle++; if (kk.yerel) benimYanlis++;
          if (kk.tekrar) { a.classList.remove('acik'); bb.classList.remove('acik'); acik = []; return; }
          kapanacak = { kartlar: [a, bb], t: setTimeout(function () { kapat(); }, 950) };
        }
      });
      return { temizle: function () { if (kapanacak) clearTimeout(kapanacak.t); } };
    }
  });

  /* =====================================================================
     YOL — her doğru cevapta yolcu bir taş ilerler (SVG yol animasyonu)
     ===================================================================== */
  B.yol = tanim({
    zorunlu: true, xapiTur: 'assessment', max: onAdet('adimlar'),
    ciz: function (ctx) {
      var b = ctx.blok, k = DO.oyunKabuk(ctx, { rozet: b.rozet || 'Yol', sinif: 'oyun-yol' });
      var n = b.adimlar.length, sira = 0, puan = 0, hata = {}, z = siraci(ctx), cozuldu = {};
      var d = 'M120 760 C 330 760, 300 600, 520 610 S 760 760, 930 650 S 1080 470, 1260 500 S 1400 420, 1440 330';
      var svg = DO.svg('svg', { class: 'yol-svg', viewBox: '0 0 1600 900', preserveAspectRatio: 'none' });
      svg.innerHTML =
        '<defs><linearGradient id="yolR" x1="0" x2="1"><stop offset="0" stop-color="#e9c46a"/><stop offset="1" stop-color="#f4d58d"/></linearGradient>' +
        '<radialGradient id="parilti"><stop offset="0" stop-color="#fff6c9"/><stop offset="1" stop-color="#fff6c9" stop-opacity="0"/></radialGradient></defs>' +
        '<path d="M0 640 C 300 560, 500 700, 800 620 S 1300 540, 1600 600 V900 H0z" fill="#dfe8c8"/>' +
        '<path d="M0 760 C 400 700, 700 820, 1000 760 S 1400 700, 1600 740 V900 H0z" fill="#cbdcae"/>' +
        '<path class="yol-zemin" d="' + d + '" fill="none" stroke="#d9b45a" stroke-width="64" stroke-linecap="round"/>' +
        '<path class="yol-ana" d="' + d + '" fill="none" stroke="url(#yolR)" stroke-width="52" stroke-linecap="round"/>' +
        '<path class="yol-dolu" d="' + d + '" fill="none" stroke="#7fb069" stroke-width="14" stroke-linecap="round" stroke-dasharray="6 18"/>' +
        '<g class="yol-hedef" transform="translate(1440 290)"><circle r="120" fill="url(#parilti)"/><rect x="-120" y="-120" width="240" height="84" rx="16" fill="#fffaf0" stroke="#b9852b" stroke-width="5"/>' +
        '<text y="-82" text-anchor="middle" class="yol-hedef-yazi">' + DO.kacis(b.hedef || 'GÜZEL YOL') + '</text><text y="-52" text-anchor="middle" class="yol-hedef-alt">' + DO.kacis(b.hedefAlt || '') + '</text><rect x="-6" y="-36" width="12" height="70" fill="#8a6a3a"/></g>';
      var yolPath = svg.querySelector('.yol-ana'), dolu = svg.querySelector('.yol-dolu');
      var uz = 0;
      var taslar = DO.svg('g'), cicekler = DO.svg('g');
      var yolcu = DO.svg('g', { class: 'yolcu' });
      yolcu.innerHTML = '<ellipse cx="0" cy="34" rx="26" ry="8" fill="#000" opacity=".15"/><path d="M-22 30c0-30 10-46 22-46s22 16 22 46z" fill="#4f7a3a"/><circle cy="-30" r="20" fill="#f2c9a0"/><path d="M-20 -36c4-16 36-16 40 0-8-6-32-6-40 0z" fill="#fffaf0"/><circle cx="-7" cy="-30" r="2.6" fill="#3b2710"/><circle cx="7" cy="-30" r="2.6" fill="#3b2710"/><path d="M-6 -21q6 5 12 0" stroke="#3b2710" stroke-width="2" fill="none" stroke-linecap="round"/>';
      svg.appendChild(taslar); svg.appendChild(cicekler); svg.appendChild(yolcu);
      var sahne = el('div', { class: 'yol-sahne' }, svg);
      var panel = el('div', { class: 'yol-panel' });
      k.govde.appendChild(sahne); k.govde.appendChild(panel);
      var hazir = false, bekleyenler = [];
      requestAnimationFrame(function () {
        uz = yolPath.getTotalLength();
        dolu.style.strokeDasharray = '0 ' + uz;
        for (var i = 0; i <= n; i++) {
          var p = nokta(i);
          taslar.appendChild(DO.svg('ellipse', { cx: p.x, cy: p.y + 6, rx: 34, ry: 16, class: 'yol-tas', 'data-i': i }));
          if (i > 0) taslar.appendChild(DO.svg('text', { x: p.x, y: p.y + 13, 'text-anchor': 'middle', class: 'yol-tas-no', text: i }));
        }
        konum(0, false);
        soru();
        hazir = true;
        bekleyenler.splice(0).forEach(function (f) { f(); });   // çizimden önce gelen hamleler (geç katılma)
      });
      function nokta(i) { return yolPath.getPointAtLength(uz * (i / (n + 0.6))); }
      function konum(i, anim) {
        var p;
        if (!anim) { p = nokta(i); yolcu.setAttribute('transform', 'translate(' + p.x + ' ' + (p.y - 30) + ')'); dolu.style.strokeDasharray = (uz * (i / (n + 0.6))) + ' ' + uz; if (i > 0) cicek(nokta(i), i - 1); return; }
        var bas = performance.now(), sure = 900, a = (i - 1) / (n + 0.6), son = i / (n + 0.6);
        (function adim(t) {
          var o = Math.min(1, (t - bas) / sure), e = o < .5 ? 2 * o * o : 1 - Math.pow(-2 * o + 2, 2) / 2;
          var L = uz * (a + (son - a) * e), p2 = yolPath.getPointAtLength(L);
          var zip = Math.sin(o * Math.PI * 3) * 10;
          yolcu.setAttribute('transform', 'translate(' + p2.x + ' ' + (p2.y - 30 - Math.abs(zip)) + ')');
          dolu.style.strokeDasharray = L + ' ' + uz;
          if (o < 1) requestAnimationFrame(adim);
          else cicek(p2, i - 1);
        })(bas);
      }
      function cicek(p, adim) {
        var g = DO.svg('g', { class: 'yol-cicek', transform: 'translate(' + (p.x + 40) + ' ' + (p.y - 20) + ')' });
        var renk = ['#e76f51', '#e9c46a', '#f4a6c1', '#fff'][adim % 4];
        for (var j = 0; j < 5; j++) g.appendChild(DO.svg('ellipse', { cx: 0, cy: -12, rx: 8, ry: 13, fill: renk, transform: 'rotate(' + (j * 72) + ')' }));
        g.appendChild(DO.svg('circle', { r: 6, fill: '#b9852b' }));
        cicekler.appendChild(g);
        var t = taslar.querySelector('[data-i="' + adim + '"]'); if (t) t.classList.add('gecildi');
      }
      var ekran = null;
      function soru() {
        panel.innerHTML = '';
        if (sira >= n) {
          svg.querySelector('.yol-hedef').classList.add('ulasti');
          ctx.tamamla({ puan: puan });
          DO.oyunSonu(ctx, panel, { puan: puan, max: n * 10, baslik: b.sonBaslik || 'Güzel yolun sonuna ulaştın!', metin: b.sonMetin });
          ekran = null;
          return;
        }
        var s = b.adimlar[sira], buSira = sira;
        var kart = el('div', { class: 'yol-soru' }, [el('span', { class: 'soru-no', text: (sira + 1) + '. taş' }), el('h3', { text: s.soru })]);
        var sec = el('div', { class: 'yol-secenek' });
        ctx.karistir(s.secenekler.map(function (m, i) { return { m: m, i: i }; }), 'adim' + sira).forEach(function (o) {
          sec.appendChild(el('button', { class: 'secenek', 'data-i': o.i, text: o.m, onclick: function () { ctx.eylem('sec', { adim: buSira, i: o.i }); } }));
        });
        kart.appendChild(sec);
        panel.appendChild(kart);
        ekran = { adim: sira, kart: kart, sec: sec, bas: Date.now() };
      }
      function secUygula(v, kk) {
        z.bosalt();
        if (!ekran || v.adim !== ekran.adim || cozuldu[v.adim]) return;
        var s = b.adimlar[v.adim], dugme = ekran.sec.querySelector('[data-i="' + v.i + '"]');
        if (!dugme || dugme.disabled) return;
        var dogru = v.i === s.dogru, ilk = !hata[v.adim];
        if (kk.yerel) ctx.cevap({ oge: s.id || ('adim' + v.adim), ad: s.soru, yanit: s.secenekler[v.i], dogru: dogru, dogruYanit: s.secenekler[s.dogru], puan: dogru && ilk ? 10 : 0, max: 10, sureMs: Date.now() - ekran.bas, deneme: (hata[v.adim] || 0) + 1 });
        if (dogru) {
          cozuldu[v.adim] = true;
          if (ilk && kk.yerel) puan += 10;
          efekt(true, kk);
          dugme.classList.add('dogru');
          ekran.sec.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
          var et = kimEtiketi(ctx, kk); if (et) ekran.kart.appendChild(et);
          ekran.kart.appendChild(el('p', { class: 'yol-aciklama', text: s.aciklama || '' }));
          sira = v.adim + 1;
          konum(sira, !kk.tekrar);
          z.sonra(soru, 1900, kk);
        } else {
          hata[v.adim] = (hata[v.adim] || 0) + 1;
          efekt(false, kk);
          dugme.classList.add('yanlis'); dugme.disabled = true;
          if (!kk.tekrar) {
            yolcu.classList.add('salla'); setTimeout(function () { yolcu.classList.remove('salla'); }, 500);
            ctx.bildir(s.ipucu || 'Yol bu taraftan değil; bir daha düşün.', 'uyari');
          }
        }
      }
      ctx.eylemTanimla('sec', function (v, kk) { if (hazir) secUygula(v, kk); else bekleyenler.push(function () { secUygula(v, kk); }); });
      return {};
    }
  });

  /* =====================================================================
     GÖSTERGE — huşû/sevap göstergesi: doğru kararla ibre yükselir
     ===================================================================== */
  B.gosterge = tanim({
    zorunlu: true, xapiTur: 'assessment', max: onAdet('durumlar'),
    ciz: function (ctx) {
      var b = ctx.blok, k = DO.oyunKabuk(ctx, { rozet: b.rozet || 'Gösterge', sinif: 'oyun-gosterge' });
      var liste = ctx.karistir(b.durumlar, 'durumlar'), sira = 0, puan = 0, deger = 60, ekran = null;
      var svg = DO.svg('svg', { class: 'gosterge-svg', viewBox: '0 0 600 360' });
      var dilim = '', renkler = ['#c0392b', '#e8962e', '#e9c46a', '#a7c957', '#4f7a3a'];
      for (var i = 0; i < 5; i++) {
        var a0 = Math.PI + i * Math.PI / 5, a1 = Math.PI + (i + 1) * Math.PI / 5;
        dilim += '<path d="M' + (300 + Math.cos(a0) * 250) + ' ' + (300 + Math.sin(a0) * 250) + ' A250 250 0 0 1 ' + (300 + Math.cos(a1) * 250) + ' ' + (300 + Math.sin(a1) * 250) +
          ' L' + (300 + Math.cos(a1) * 170) + ' ' + (300 + Math.sin(a1) * 170) + ' A170 170 0 0 0 ' + (300 + Math.cos(a0) * 170) + ' ' + (300 + Math.sin(a0) * 170) + 'z" fill="' + renkler[i] + '"/>';
      }
      svg.innerHTML = '<path d="M40 300 A260 260 0 0 1 560 300" fill="none" stroke="#fffaf0" stroke-width="30" stroke-linecap="round"/>' + dilim +
        '<g class="ibre"><path d="M300 300 L294 300 L300 90 L306 300z" fill="#3b2710"/><circle cx="300" cy="300" r="22" fill="#3b2710"/><circle cx="300" cy="300" r="8" fill="#e9b949"/></g>' +
        '<text x="300" y="350" text-anchor="middle" class="gosterge-ad">' + DO.kacis(b.gosterge || 'Huşû') + '</text>';
      var ibre = svg.querySelector('.ibre');
      var sol = el('div', { class: 'gosterge-sol' }, [svg, el('div', { class: 'gosterge-deger' })]);
      var sag = el('div', { class: 'gosterge-sag' });
      k.govde.appendChild(sol); k.govde.appendChild(sag);
      function ibreYaz() {
        ibre.style.transform = 'rotate(' + (-90 + deger / 100 * 180) + 'deg)';
        sol.querySelector('.gosterge-deger').textContent = (b.gosterge || 'Huşû') + ': %' + Math.round(deger);
      }
      ibreYaz();
      function kart() {
        sag.innerHTML = '';
        if (sira >= liste.length) {
          ctx.tamamla({ puan: puan });
          DO.oyunSonu(ctx, sag, { puan: puan, max: liste.length * 10, metin: b.sonMetin });
          ekran = null;
          return;
        }
        var s = liste[sira], buSira = sira;
        var kk = el('div', { class: 'gosterge-kart' }, [el('span', { class: 'soru-no', text: (sira + 1) + ' / ' + liste.length }), el('h3', { text: s.metin })]);
        var dug = el('div', { class: 'gosterge-dug' });
        b.secenekler.forEach(function (o) {
          dug.appendChild(el('button', { class: 'secenek ' + (o.sinif || ''), 'data-d': o.deger, html: (o.ikon || '') + '<span>' + DO.kacis(o.ad) + '</span>', onclick: function () { ctx.eylem('sec', { sira: buSira, deger: o.deger }); } }));
        });
        kk.appendChild(dug);
        sag.appendChild(kk);
        ekran = { sira: sira, kart: kk, dug: dug, cevaplandi: false, bas: Date.now() };
      }
      ctx.eylemTanimla('sec', function (v, k2) {
        if (!ekran || v.sira !== ekran.sira || ekran.cevaplandi) return;
        ekran.cevaplandi = true;
        var s = liste[v.sira], dogru = v.deger === s.cevap;
        var o = b.secenekler.find(function (x) { return x.deger === v.deger; }) || {};
        var dogruSec = b.secenekler.find(function (x) { return x.deger === s.cevap; });
        deger = Math.max(5, Math.min(100, deger + (dogru ? 9 : -18)));
        ibreYaz();
        efekt(dogru, k2);
        if (!dogru && !k2.tekrar) { svg.classList.add('salla'); setTimeout(function () { svg.classList.remove('salla'); }, 500); }
        if (k2.yerel) {
          var p = dogru ? 10 : 0; puan += p;
          ctx.cevap({ oge: s.id, ad: s.metin, yanit: o.ad, dogru: dogru, dogruYanit: dogruSec.ad, puan: p, max: 10, sureMs: Date.now() - ekran.bas });
        }
        ekran.dug.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
        var secilen = ekran.dug.querySelector('[data-d="' + v.deger + '"]'); if (secilen) secilen.classList.add(dogru ? 'dogru' : 'yanlis');
        var et = kimEtiketi(ctx, k2); if (et) ekran.kart.appendChild(et);
        geriBildirim(ekran.kart, dogru, s.aciklama);
        ekran.kart.appendChild(el('button', { class: 'dug ana devam', text: 'Sonraki →', onclick: function () { ctx.eylem('devam', { sira: v.sira }); } }));
      });
      ctx.eylemTanimla('devam', function (v) {
        if (!ekran || v.sira !== ekran.sira || !ekran.cevaplandi) return;
        sira = v.sira + 1; kart();
      });
      kart();
      return {};
    }
  });

  /* =====================================================================
     KİLİT — her doğru kararla kilidin bir dişi açılır
     ===================================================================== */
  B.kilit = tanim({
    zorunlu: true, xapiTur: 'assessment', max: onAdet('durumlar'),
    ciz: function (ctx) {
      var b = ctx.blok, k = DO.oyunKabuk(ctx, { rozet: b.rozet || 'Kilit', sinif: 'oyun-kilit' });
      var liste = ctx.karistir(b.durumlar, 'durumlar'), n = liste.length, sira = 0, puan = 0, hata = {}, ekran = null, z = siraci(ctx);
      var svg = DO.svg('svg', { class: 'kilit-svg', viewBox: '0 0 400 480' });
      var disler = '';
      for (var i = 0; i < n; i++) {
        var a = Math.PI * (0.15 + 0.7 * i / Math.max(1, n - 1));
        disler += '<circle class="dis" data-i="' + i + '" cx="' + (200 - Math.cos(a) * 110).toFixed(1) + '" cy="' + (330 + Math.sin(a) * 55 - 30).toFixed(1) + '" r="17"/>';
      }
      svg.innerHTML =
        '<path class="kilit-kanca" d="M110 220 V140 a90 90 0 0 1 180 0 V220" fill="none" stroke="#8d7b66" stroke-width="34" stroke-linecap="round"/>' +
        '<path class="kilit-kanca-ic" d="M110 220 V140 a90 90 0 0 1 180 0 V220" fill="none" stroke="#b8a68f" stroke-width="12" stroke-linecap="round"/>' +
        '<rect x="40" y="200" width="320" height="250" rx="40" fill="#c0392b"/><rect x="40" y="200" width="320" height="250" rx="40" fill="url(#kilitParilti)"/>' +
        '<defs><linearGradient id="kilitParilti" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".1"/></linearGradient></defs>' +
        '<circle cx="200" cy="300" r="34" fill="#7a1f16"/><rect x="190" y="300" width="20" height="60" rx="8" fill="#7a1f16"/>' + disler;
      var sol = el('div', { class: 'kilit-sol' }, [svg, el('p', { class: 'kilit-durum', text: '0 / ' + n + ' diş açıldı' })]);
      var sag = el('div', { class: 'kilit-sag' });
      k.govde.appendChild(sol); k.govde.appendChild(sag);
      function kart(kk) {
        sag.innerHTML = '';
        if (sira >= n) {
          svg.classList.add('acildi'); if (!(kk && kk.tekrar)) DO.efekt.kilit();
          ctx.tamamla({ puan: puan });
          z.sonra(function () { DO.oyunSonu(ctx, sag, { puan: puan, max: n * 10, baslik: b.sonBaslik || 'Kilit açıldı!', metin: b.sonMetin }); }, 900, kk);
          ekran = null;
          return;
        }
        var s = liste[sira], buSira = sira;
        var kart = el('div', { class: 'kilit-kart' }, [el('span', { class: 'soru-no', text: 'Durum ' + (sira + 1) + ' / ' + n }), el('h3', { text: s.metin })]);
        var dug = el('div', { class: 'kilit-dug' });
        b.secenekler.forEach(function (o) {
          dug.appendChild(el('button', { class: 'secenek karar', 'data-id': o.id, style: { '--r': o.renk }, html: '<b>' + DO.kacis(o.ad) + '</b><small>' + DO.kacis(o.alt || '') + '</small>', onclick: function () { ctx.eylem('sec', { sira: buSira, id: o.id }); } }));
        });
        kart.appendChild(dug);
        sag.appendChild(kart);
        ekran = { sira: sira, kart: kart, dug: dug, cozuldu: false, bas: Date.now() };
      }
      ctx.eylemTanimla('sec', function (v, kk) {
        z.bosalt();
        if (!ekran || v.sira !== ekran.sira || ekran.cozuldu) return;
        var s = liste[v.sira], dugme = ekran.dug.querySelector('[data-id="' + v.id + '"]');
        if (!dugme || dugme.disabled) return;
        var o = b.secenekler.find(function (x) { return x.id === v.id; });
        var dogru = v.id === s.cevap, ilk = !hata[v.sira];
        var dogruSec = b.secenekler.find(function (x) { return x.id === s.cevap; });
        if (kk.yerel) ctx.cevap({ oge: s.id, ad: s.metin, yanit: o.ad + ' (' + (o.alt || '') + ')', dogru: dogru, dogruYanit: dogruSec.ad, puan: dogru && ilk ? 10 : 0, max: 10, sureMs: Date.now() - ekran.bas, deneme: (hata[v.sira] || 0) + 1 });
        var dis = svg.querySelector('.dis[data-i="' + v.sira + '"]');
        if (dogru) {
          ekran.cozuldu = true;
          if (ilk && kk.yerel) puan += 10;
          if (!kk.tekrar) DO.efekt.kilit();
          dis.classList.add('acik');
          ekran.dug.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
          dugme.classList.add('dogru');
          sol.querySelector('.kilit-durum').textContent = (v.sira + 1) + ' / ' + n + ' diş açıldı';
          var et = kimEtiketi(ctx, kk); if (et) ekran.kart.appendChild(et);
          geriBildirim(ekran.kart, true, s.aciklama);
          ekran.kart.appendChild(el('button', { class: 'dug ana devam', text: 'Sonraki →', onclick: function () { ctx.eylem('devam', { sira: v.sira }); } }));
        } else {
          hata[v.sira] = (hata[v.sira] || 0) + 1;
          efekt(false, kk);
          dugme.classList.add('yanlis'); dugme.disabled = true;
          if (!kk.tekrar) {
            dis.classList.add('hata'); svg.classList.add('salla');
            setTimeout(function () { dis.classList.remove('hata'); svg.classList.remove('salla'); }, 600);
            ctx.bildir(s.ipucu || 'Bu durumda ibadete ne olur? Bir daha düşün.', 'uyari');
          }
        }
      });
      ctx.eylemTanimla('devam', function (v, kk) {
        if (!ekran || v.sira !== ekran.sira || !ekran.cozuldu) return;
        sira = v.sira + 1; kart(kk);
      });
      kart();
      return {};
    }
  });

  /* =====================================================================
     HIZ TURU — süreli tekrar; canlı derste Hocamız herkes için aynı anda başlatır
     Her öğrenci kendi cevabını verir (yarış), sıralama canlı görünür.
     ===================================================================== */
  B.hizTuru = {
    zorunlu: true, xapiTur: 'assessment', max: onAdet('sorular'), canli: 'bireysel-sabit',
    ciz: function (ctx) {
      var b = ctx.blok, k = DO.oyunKabuk(ctx, { rozet: '⏱ Hız turu', sinif: 'oyun-hiz' });
      var sure = b.sure || 10, sira = 0, puan = 0, liste = ctx.karistir(b.sorular, 'hiz'), zaman = null, basladi = false;
      var skorlar = {}; // ad -> puan (canlı)
      var sahne = el('div', { class: 'hiz-sahne' });
      var tablo = el('div', { class: 'hiz-tablo' });
      k.govde.appendChild(sahne); k.govde.appendChild(tablo);
      ctx.dinle('cevap', function (m) {
        if (m.veri.blok !== b.id || m.gonderen.rol === 'ogretmen') return;
        skorlar[m.gonderen.ad] = (skorlar[m.gonderen.ad] || 0) + (m.veri.puan || 0);
        tabloYaz();
      });
      function tabloYaz() {
        var satirlar = Object.keys(skorlar).map(function (ad) { return { ad: ad, p: skorlar[ad] }; });
        if (ctx.rol !== 'ogretmen') satirlar.push({ ad: (DO.Kayit.ogrenci.ad || 'Ben') + ' (sen)', p: puan, ben: true });
        satirlar.sort(function (a, c) { return c.p - a.p; });
        tablo.innerHTML = '';
        tablo.appendChild(el('h4', { text: ctx.canliMi() ? 'Sınıf sıralaması' : 'Puanın' }));
        satirlar.forEach(function (s, i) {
          tablo.appendChild(el('div', { class: 'hiz-satir' + (s.ben ? ' ben' : '') }, [el('span', { text: (i + 1) + '. ' + s.ad }), el('b', { text: s.p })]));
        });
      }
      // Canlı derste başlatma Hocamızdadır: herkes aynı anda başlar
      var ekran = null;
      ctx.eylemTanimla('basla', function (v, kk) { if (!basladi) { if (kk.tekrar) { basladi = true; soru(); } else geriSayim(); } });
      ctx.eylemTanimla('cevap', function (v, kk) {
        if (!basladi) { basladi = true; soru(); }          // yansıtma geç kurulduysa
        if (ekran && v.sira === ekran.sira) ekran.cevap(v, kk);
      });
      function baslatIste() {
        if (ctx.canliMi()) {
          if (ctx.rol !== 'ogretmen') return;
          ctx.eylem('basla', {}, { ogretmen: true });
        } else geriSayim();
      }
      function giris() {
        sahne.innerHTML = '';
        var bekle = ctx.canliMi() && ctx.rol !== 'ogretmen';
        var g = el('div', { class: 'hiz-giris' }, [
          el('h3', { text: liste.length + ' soru · her biri ' + sure + ' saniye' }),
          el('p', { text: 'Hızlı ve doğru cevap daha çok puan getirir.' }),
          bekle ? el('p', { class: 'bekle-not', text: '⏳ Hocamız başlatınca herkes aynı anda başlayacak' })
            : el('button', { class: 'dug ana buyuk', text: ctx.canliMi() ? 'Herkes için başlat' : 'Hazırım, başlat!', onclick: baslatIste })
        ]);
        sahne.appendChild(g);
        tabloYaz();
      }
      function geriSayim() {
        basladi = true;
        var n = 3; sahne.innerHTML = '';
        var s = el('div', { class: 'hiz-sayim', text: n }); sahne.appendChild(s);
        DO.efekt.tik();
        var t = ctx.aralik(function () {
          n--;
          if (n > 0) { s.textContent = n; s.classList.remove('vur'); void s.offsetWidth; s.classList.add('vur'); DO.efekt.tik(); }
          else { clearInterval(t); soru(); }
        }, 800);
      }
      function soru() {
        clearInterval(zaman);
        if (sira >= liste.length) {
          if (!ctx.izliyor()) ctx.tamamla({ puan: puan });
          tabloYaz();
          DO.oyunSonu(ctx, sahne, { puan: puan, max: liste.length * 10, metin: 'Hız turunu bitirdin.', tekrar: ctx.canliMi() ? null : function () { sira = 0; puan = 0; basladi = false; ctx.yeniTur(); liste = ctx.karistir(b.sorular, 'hiz'); giris(); } });
          return;
        }
        var s = liste[sira], bas = Date.now(), bitti = false;
        sahne.innerHTML = '';
        var buSira = sira;
        var halka = DO.svg('svg', { class: 'hiz-halka', viewBox: '0 0 120 120' });
        halka.innerHTML = '<circle cx="60" cy="60" r="52" fill="#fffaf0" stroke="#eadfc8" stroke-width="10"/><circle class="hiz-iz" cx="60" cy="60" r="52" fill="none" stroke="#4f7a3a" stroke-width="10" stroke-linecap="round" stroke-dasharray="327" stroke-dashoffset="0" transform="rotate(-90 60 60)"/><text x="60" y="72" text-anchor="middle" class="hiz-kalan">' + sure + '</text>';
        var kart = el('div', { class: 'hiz-kart' }, [el('div', { class: 'hiz-ust' }, [el('span', { class: 'soru-no', text: (sira + 1) + ' / ' + liste.length }), halka]), el('h3', { text: s.metin })]);
        var dug = el('div', { class: 'hiz-dug' });
        s.secenekler.forEach(function (o, i) {
          dug.appendChild(el('button', { class: 'secenek hiz-sec s' + i, text: o, onclick: function () { iste(i); } }));
        });
        kart.appendChild(dug);
        sahne.appendChild(kart);
        var iz = halka.querySelector('.hiz-iz'), yazi = halka.querySelector('.hiz-kalan');
        zaman = ctx.aralik(function () {
          var kalan = Math.max(0, sure - (Date.now() - bas) / 1000);
          iz.style.strokeDashoffset = (327 * (1 - kalan / sure)).toFixed(1);
          iz.style.stroke = kalan < sure * 0.3 ? '#c0392b' : kalan < sure * 0.6 ? '#e8962e' : '#4f7a3a';
          yazi.textContent = Math.ceil(kalan);
          if (kalan <= 0 && !ctx.izliyor()) iste(-1);     // yansıtan ekran öğrencinin cevabını bekler
        }, 100);
        function iste(i) { if (!bitti) ctx.eylem('cevap', { sira: buSira, i: i, gecen: Math.round((Date.now() - bas) / 100) / 10 }); }
        ekran = { sira: buSira, cevap: function (v, kk) {
          if (bitti) return; bitti = true; clearInterval(zaman);
          var i = v.i, dogru = i === s.dogru, gecen = v.gecen;
          var p = dogru ? Math.round(5 + 5 * Math.max(0, sure - gecen) / sure) : 0;
          if (kk.yerel) puan += p;
          efekt(dogru, kk);
          dug.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
          if (i >= 0 && dug.children[i]) dug.children[i].classList.add(dogru ? 'dogru' : 'yanlis');
          dug.children[s.dogru].classList.add('dogru');
          if (kk.yerel) ctx.cevap({ oge: s.id || ('h' + buSira), ad: s.metin, yanit: i < 0 ? '(süre doldu)' : s.secenekler[i], dogru: dogru, dogruYanit: s.secenekler[s.dogru], puan: p, max: 10, sureMs: Math.round(gecen * 1000) });
          tabloYaz();
          kart.appendChild(el('p', { class: 'hiz-sonuc ' + (dogru ? 'd' : 'y'), text: dogru ? '+' + p + ' puan' : (i < 0 ? 'Süre doldu' : 'Yanlış') + ' — doğrusu: ' + s.secenekler[s.dogru] }));
          var sonra = function () { sira = buSira + 1; soru(); };
          if (kk.tekrar) sonra(); else ctx.zaman(sonra, dogru ? 1100 : 2000);
        } };
      }
      giris();
      return {
        temizle: function () { clearInterval(zaman); },
        ogretmenAraci: function () {
          if (!ctx.canliMi() || basladi) return null;
          return el('button', { class: 'dug kucuk tam', text: '⏱ Hız turunu herkes için başlat', onclick: function () { baslatIste(); ctx.oynatici.panelYaz(); } });
        }
      };
    }
  };
})();
