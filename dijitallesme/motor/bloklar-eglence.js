/* Ders Odası — eğlence blokları
   yakala (bereket sepeti) · sirala (adım adım yol) · hikaye (seçimli resimli hikâye)
   cark (soru çarkı) · hataBul (resimde hataları bul) · sofra (dolan bereket sofrası)

   Canlı eşleme kuralları bloklar-oyun.js ile aynıdır: her hamle ctx.eylem ile yapılır,
   işleyici her cihazda aynı sonucu üretir; puan ve kayıt hamleyi yapanındır (k.yerel).
   yakala, hız turu gibi "herkes kendi" oynanır; başlatma canlı derste Hocamızdadır. */
(function () {
  'use strict';
  var DO = window.DO, el = DO.el, B = DO.Bloklar;

  /* ---------- ortak yardımcılar ---------- */
  function efekt(dogru, k) { if (k && k.tekrar) return; (dogru ? DO.efekt.dogru : DO.efekt.yanlis)(); }
  function kimEtiketi(ctx, k) {
    if (!ctx.ortak() || !k || !k.kim || k.yerel) return null;
    return el('span', { class: 'kim-etiket', text: (k.kim.rol === 'ogretmen' ? 'Hocamız' : k.kim.ad) + ' cevapladı' });
  }
  function siraci(ctx) {
    var bekleyen = null, zaman = null;
    return {
      sonra: function (fn, ms, k) {
        if (k && k.tekrar) { fn(); return; }
        bekleyen = fn;
        zaman = ctx.zaman(function () { var f = bekleyen; bekleyen = null; if (f) f(); }, ms);
      },
      bosalt: function () { if (!bekleyen) return; clearTimeout(zaman); var f = bekleyen; bekleyen = null; f(); }
    };
  }
  var ORTAK = { canli: 'ortak', ortakDestek: true };   // varsayılan: tek ortak ekran
  function tanim(o) { return Object.assign({}, ORTAK, o); }
  /* Bir ögenin resmi: gorsel (dosya) → emoji → ikon */
  function resim(ctx, o, boy) {
    if (o.gorsel) {
      var im = el('img', { class: 'og-resim', src: ctx.yol(o.gorsel), alt: '', draggable: 'false' });
      if (o.emoji) im.onerror = function () { var e = el('span', { class: 'og-emoji', text: o.emoji, style: { fontSize: Math.round((boy || 80) * 0.8) + 'px' } }); if (im.parentNode) im.parentNode.replaceChild(e, im); };
      return im;
    }
    if (o.emoji) return el('span', { class: 'og-emoji', text: o.emoji, style: { fontSize: Math.round((boy || 80) * 0.8) + 'px' } });
    if (o.ikon) return el('span', { class: 'og-ikon', html: DO.ikonSvg(o.ikon, o.renk, boy || 80) });
    return null;
  }
  /* Yükselen puan yazısı (+10) */
  function ucanYazi(kap, x, y, metin, sinif) {
    var u = el('div', { class: 'ucan-yazi ' + (sinif || ''), text: metin, style: { left: x + 'px', top: y + 'px' } });
    kap.appendChild(u);
    setTimeout(function () { u.remove(); }, 1100);
  }
  /* Yıldız patlaması */
  function patlama(kap, x, y, renk) {
    var g = el('div', { class: 'patlama', style: { left: x + 'px', top: y + 'px' } });
    for (var i = 0; i < 10; i++) {
      var a = i / 10 * Math.PI * 2;
      g.appendChild(el('i', { style: { '--dx': Math.round(Math.cos(a) * 90) + 'px', '--dy': Math.round(Math.sin(a) * 90) + 'px', background: renk || ['#e9b949', '#7fb069', '#e76f51', '#4fa3d1'][i % 4] } }));
    }
    kap.appendChild(g);
    setTimeout(function () { g.remove(); }, 900);
  }
  function yildizSay(oran) { return oran >= 0.9 ? 3 : oran >= 0.6 ? 2 : oran > 0 ? 1 : 0; }

  /* =====================================================================
     YAKALA — "Bereket sepeti": yukarıdan güzel davranışlar ve hatalar düşer.
     Güzel olanları sepete al, hatalardan kaç. Kombo, can ve süre var.
     ===================================================================== */
  B.yakala = {
    zorunlu: true, xapiTur: 'assessment', canli: 'bireysel-sabit',
    max: function (b) { return b.max || 100; },
    ciz: function (ctx) {
      var b = ctx.blok, MAX = b.max || 100, SURE = b.sure || 45, HEDEF = b.hedef || 200, OGE = b.oge || 'güzel davranış';   // HEDEF bereket = tam puan
      var k = DO.oyunKabuk(ctx, { rozet: b.rozet || '🧺 Bereket sepeti', sinif: 'oyun-yakala', yonerge: b.yonerge || 'Güzel davranışları sepetine topla, hatalardan kaç! Sepeti fareyle, parmağınla ya da ← → tuşlarıyla yönet.' });
      var G = 1460, Y = 590;                                   // oyun alanı (sahne pikseli)
      var sahne = el('div', { class: 'yk-sahne' });
      sahne.innerHTML =
        '<svg class="yk-zemin" viewBox="0 0 1460 590" preserveAspectRatio="none">' +
        '<defs><linearGradient id="ykGok" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe8b8"/><stop offset="1" stop-color="#fff6e2"/></linearGradient>' +
        '<pattern id="ykKare" width="46" height="46" patternUnits="userSpaceOnUse"><rect width="46" height="46" fill="#f3e2c0"/><rect width="23" height="23" fill="#ecd3a6"/><rect x="23" y="23" width="23" height="23" fill="#ecd3a6"/></pattern></defs>' +
        '<rect width="1460" height="590" fill="url(#ykGok)"/>' +
        '<g class="yk-pencere" transform="translate(1180 60)"><rect width="200" height="230" rx="100" fill="#2f4a6b"/><circle cx="130" cy="80" r="34" fill="#fff3c4"/><circle cx="145" cy="70" r="30" fill="#2f4a6b"/>' +
        '<circle class="yk-yildiz" cx="60" cy="70" r="4" fill="#fff"/><circle class="yk-yildiz" cx="90" cy="150" r="3" fill="#fff" style="animation-delay:.8s"/><circle class="yk-yildiz" cx="150" cy="170" r="3.5" fill="#fff" style="animation-delay:1.6s"/>' +
        '<path d="M100 0v230M0 120h200" stroke="#c9a46a" stroke-width="10"/><rect width="200" height="230" rx="100" fill="none" stroke="#c9a46a" stroke-width="12"/></g>' +
        '<g transform="translate(70 90)"><rect width="300" height="16" rx="8" fill="#b9854a"/><circle cx="60" cy="-26" r="26" fill="#e9c46a"/><rect x="120" y="-62" width="44" height="62" rx="10" fill="#7fb069"/><rect x="190" y="-46" width="70" height="46" rx="12" fill="#e76f51"/></g>' +
        '<path d="M0 520 Q 730 470 1460 520 V590 H0z" fill="url(#ykKare)"/>' +
        '</svg>';
      var dusen = el('div', { class: 'yk-katman' });
      var sepet = el('div', { class: 'yk-sepet' });
      sepet.innerHTML = '<div class="yk-sepet-ic"></div><svg viewBox="0 0 240 150" width="240" height="150"><path d="M20 40 Q120 0 220 40" fill="none" stroke="#8a5a2b" stroke-width="12" stroke-linecap="round"/>' +
        '<path d="M10 52h220l-24 92H34z" fill="#c98b45"/><path d="M10 52h220l-6 22H16z" fill="#a8702f"/>' +
        '<g stroke="#a8702f" stroke-width="5" opacity=".7"><path d="M40 80 L52 140M80 78 L86 142M120 78v66M160 78 L154 142M200 80 L188 140"/><path d="M22 100h196M28 122h184"/></g>' +
        '<circle cx="92" cy="104" r="7" fill="#3b2710"/><circle cx="148" cy="104" r="7" fill="#3b2710"/><path class="yk-agiz" d="M100 122 Q120 136 140 122" fill="none" stroke="#3b2710" stroke-width="5" stroke-linecap="round"/></svg>';
      var hud = el('div', { class: 'yk-hud' }, [
        el('div', { class: 'yk-puan', html: '<small>Bereket</small><b>0</b>' }),
        el('div', { class: 'yk-sure' }, el('i')),
        el('div', { class: 'yk-can', html: '<span>❤</span><span>❤</span><span>❤</span>' })
      ]);
      var kombo = el('div', { class: 'yk-kombo' });
      var sinif = el('div', { class: 'yk-sinif' });
      sahne.appendChild(dusen); sahne.appendChild(sepet); sahne.appendChild(hud); sahne.appendChild(kombo); sahne.appendChild(sinif);
      k.govde.appendChild(sahne);

      var puanEl = hud.querySelector('.yk-puan b'), sureEl = hud.querySelector('.yk-sure i'), canEl = hud.querySelector('.yk-can');
      var ham = 0, can = 3, seri = 0, enSeri = 0, iyiSay = 0, kotuSay = 0, kacan = 0, yakalananKotu = {}, oyunda = false, bitti = false;
      var sepetX = G / 2, hedefX = G / 2, ogeler = [], cerceve = null, sonT = 0, basT = 0, sonDog = 0, uretilen = 0;
      var skorlar = {}, sonSkorYolla = 0;
      // Herkes aynı sırayla aynı ögeleri görsün (tohumlu)
      var havuz = [];
      (b.iyiler || []).forEach(function (o) { havuz.push({ o: o, iyi: true }, { o: o, iyi: true }, { o: o, iyi: true }); });
      (b.kotuler || []).forEach(function (o) { havuz.push({ o: o, iyi: false }, { o: o, iyi: false }); });
      var dizi = ctx.karistir(havuz, 'yakala'), rx = DO.tohum('yakala|' + b.id);

      function puanYaz() { puanEl.textContent = ham; puanEl.parentNode.classList.remove('zipla'); void puanEl.offsetWidth; puanEl.parentNode.classList.add('zipla'); }
      function canYaz() { Array.prototype.forEach.call(canEl.children, function (c, i) { c.classList.toggle('bos', i >= can); }); }
      function sinifYaz() {
        if (!ctx.canliMi()) return;
        var s = Object.keys(skorlar).map(function (ad) { return { ad: ad, p: skorlar[ad] }; }).sort(function (a, c) { return c.p - a.p; }).slice(0, 4);
        sinif.innerHTML = s.length ? '<b>Sınıf</b> ' + s.map(function (x) { return DO.kacis(x.ad) + ' <i>' + x.p + '</i>'; }).join(' · ') : '';
      }
      ctx.dinle('skor', function (m) {
        if (m.veri.blok !== b.id || m.gonderen.rol === 'ogretmen') return;
        skorlar[m.gonderen.ad] = m.veri.puan; sinifYaz();
      });
      function skorYolla(son) {
        if (!DO.Canli.acik || ctx.rol === 'ogretmen') return;
        var t = Date.now();
        if (!son && t - sonSkorYolla < 1500) return;
        sonSkorYolla = t;
        DO.Canli.gonder('skor', { blok: b.id, puan: ham, son: !!son });
      }

      /* Sepet kontrolü */
      function sahneX(e) { var r = sahne.getBoundingClientRect(); return (e.clientX - r.left) / ctx.oynatici.olcek; }
      // Yansıtan ekranda (Hocamız) sepeti öğrencinin hamleleri yönetir
      sahne.addEventListener('pointermove', function (e) { if (oyunda && !ctx.izliyor()) hedefX = sahneX(e); });
      sahne.addEventListener('pointerdown', function (e) { if (oyunda && !ctx.izliyor()) hedefX = sahneX(e); });
      var tuslar = {}, sonSepet = -1, sonSepetT = 0;
      function tusBas(e) { if (!oyunda || ctx.izliyor()) return; if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { tuslar[e.key] = true; e.preventDefault(); } }
      function tusBirak(e) { tuslar[e.key] = false; }
      document.addEventListener('keydown', tusBas); document.addEventListener('keyup', tusBirak);

      function uret(t) {
        if (!dizi.length) return;
        var d = dizi[uretilen % dizi.length]; uretilen++;
        var x = 110 + rx() * (G - 220);
        var kart = el('div', { class: 'yk-oge' }, [el('div', { class: 'yk-oge-resim' }, resim(ctx, d.o, 88)), el('span', { text: d.o.metin })]);
        kart.style.transform = 'translate(' + (x - 75) + 'px,-170px)';
        dusen.appendChild(kart);
        var ilerleme = (t - basT) / (SURE * 1000);
        ogeler.push({ n: uretilen - 1, el: kart, x: x, y: -170, v: 150 + ilerleme * 190 + rx() * 40, iyi: d.iyi, o: d.o, don: (rx() - 0.5) * 30 });
      }
      function dongu(t) {
        if (!oyunda) return;
        var dt = Math.min(0.05, (t - sonT) / 1000); sonT = t;
        var gecen = (t - basT) / 1000, kalan = Math.max(0, SURE - gecen);
        sureEl.style.width = (kalan / SURE * 100) + '%';
        sureEl.classList.toggle('az', kalan < 10);
        // sepet
        if (tuslar.ArrowLeft) hedefX -= 900 * dt;
        if (tuslar.ArrowRight) hedefX += 900 * dt;
        hedefX = Math.max(120, Math.min(G - 120, hedefX));
        var onceX = sepetX;
        sepetX += (hedefX - sepetX) * Math.min(1, dt * 14);
        sepet.style.transform = 'translateX(' + (sepetX - 120) + 'px) rotate(' + Math.max(-12, Math.min(12, (sepetX - onceX) * 0.6)) + 'deg)';
        // üretim
        var aralik = 1150 - Math.min(1, gecen / SURE) * 550;
        if (t - sonDog > aralik) { sonDog = t; uret(t); }
        // düşüş ve yakalama (yakalamaya öğrencinin kendi ekranı karar verir; Hocamızın ekranı yansıtır)
        var izle = ctx.izliyor(), tutulan = [];
        for (var i = ogeler.length - 1; i >= 0; i--) {
          var o = ogeler[i];
          o.y += o.v * dt;
          o.el.style.transform = 'translate(' + (o.x - 75) + 'px,' + o.y + 'px) rotate(' + (Math.sin(o.y / 60) * o.don * 0.3) + 'deg)';
          if (!izle && o.y > Y - 260 && o.y < Y - 150 && Math.abs(o.x - sepetX) < 112) { tutulan.push(o.n); continue; }
          if (o.y > Y + 10) { if (o.iyi) kacan++; o.el.remove(); ogeler.splice(i, 1); }
        }
        tutulan.forEach(function (n) { ctx.eylem('yakala', { n: n }); });
        if (!izle && ctx.canliMi() && Math.abs(hedefX - sonSepet) > 6 && t - sonSepetT > 140) { sonSepet = hedefX; sonSepetT = t; ctx.eylem('sepet', { x: Math.round(hedefX) }); }
        if (kalan <= 0 || can <= 0) { bitir(); return; }
        cerceve = requestAnimationFrame(dongu);
      }
      ctx.eylemTanimla('sepet', function (v, kk) { if (!kk.yerel) hedefX = v.x; });
      ctx.eylemTanimla('yakala', function (v, kk) {
        if (bitti) return;
        var j = -1; for (var m = 0; m < ogeler.length; m++) if (ogeler[m].n === v.n) { j = m; break; }
        var o = j >= 0 ? ogeler.splice(j, 1)[0] : (function () { var d = dizi[v.n % dizi.length]; return { n: v.n, el: null, iyi: d.iyi, o: d.o }; })();
        yakala(o, kk);
      });
      function yakala(o, kk) {
        if (o.el) o.el.remove();
        var x = sepetX, y = Y - 190;
        if (o.iyi) {
          seri++; enSeri = Math.max(enSeri, seri); iyiSay++;
          var kat = seri >= 8 ? 3 : seri >= 4 ? 2 : 1, p = 10 * kat;
          ham += p; puanYaz();
          DO.efekt.dogru();
          ucanYazi(sahne, x, y - 40, '+' + p + (kat > 1 ? ' ×' + kat : ''), 'iyi');
          patlama(sahne, x, y);
          sepet.classList.remove('hop', 'salla'); void sepet.offsetWidth; sepet.classList.add('hop');
          var ic = sepet.querySelector('.yk-sepet-ic');
          var minik = resim(ctx, o.o, 40); if (minik) { ic.appendChild(el('span', { class: 'yk-minik', style: { left: (20 + (iyiSay * 37) % 160) + 'px' } }, minik)); if (ic.children.length > 6) ic.removeChild(ic.firstChild); }
          if (kat > 1) { kombo.textContent = 'Kombo ×' + kat + '!'; kombo.classList.remove('gor'); void kombo.offsetWidth; kombo.classList.add('gor'); }
        } else {
          seri = 0; kotuSay++; can--; canYaz();
          yakalananKotu[o.o.metin] = (yakalananKotu[o.o.metin] || 0) + 1;
          ham = Math.max(0, ham - 5); puanYaz();
          DO.efekt.yanlis();
          ucanYazi(sahne, x, y - 40, '−5', 'kotu');
          sepet.classList.remove('hop', 'salla'); void sepet.offsetWidth; sepet.classList.add('salla');
          sahne.classList.remove('kirmizi'); void sahne.offsetWidth; sahne.classList.add('kirmizi');
          ctx.bildir(o.o.aciklama || ('“' + o.o.metin + '” sofra edebine uymaz.'), 'uyari');
        }
        if (kk && kk.yerel) skorYolla(false);
      }
      function baslat() {
        if (oyunda || bitti) return;
        k.govde.querySelectorAll('.yk-perde').forEach(function (p) { p.remove(); });
        var n = 3, sayim = el('div', { class: 'yk-sayim', text: n });
        sahne.appendChild(sayim); DO.efekt.tik();
        var t = ctx.aralik(function () {
          n--;
          if (n > 0) { sayim.textContent = n; sayim.classList.remove('vur'); void sayim.offsetWidth; sayim.classList.add('vur'); DO.efekt.tik(); }
          else {
            clearInterval(t); sayim.textContent = 'Bismillah!'; sayim.classList.add('bitti');
            ctx.zaman(function () { sayim.remove(); }, 700);
            oyunda = true; basT = sonT = sonDog = performance.now();
            cerceve = requestAnimationFrame(dongu);
          }
        }, 750);
      }
      function bitir() {
        oyunda = false; bitti = true;
        cancelAnimationFrame(cerceve);
        ogeler.forEach(function (o) { o.el.remove(); }); ogeler = [];
        var puan = Math.min(MAX, Math.round(ham * MAX / HEDEF));
        var kotuListe = Object.keys(yakalananKotu), izle = ctx.izliyor();
        if (!izle) ctx.cevap({ oge: 'sepet', ad: b.baslik || 'Bereket sepeti', yanit: iyiSay + ' ' + OGE + ', ' + kotuSay + ' hata' + (kotuListe.length ? ' (' + kotuListe.join(', ') + ')' : ''),
          dogru: puan >= MAX * 0.6, puan: puan, max: MAX, sureMs: Date.now() - ctx.basla, etkilesim: 'performance' });
        if (!izle) { skorYolla(true); ctx.tamamla({ puan: puan }); }
        var bilgi = el('div', {}, [
          el('p', { text: can <= 0 ? 'Canların bitti, ama ' + iyiSay + ' ' + OGE + ' sepetine topladın.' : iyiSay + ' ' + OGE + ' topladın · en uzun seri: ' + enSeri }),
          kotuListe.length ? el('p', { class: 'yk-ozet-kotu', text: 'Dikkat: ' + kotuListe.join(' · ') }) : null
        ]);
        DO.oyunSonu(ctx, k.govde, { puan: puan, max: MAX, metin: '', tekrar: ctx.canliMi() ? null : function () { ctx.eylem('tekrar'); } });
        var son = k.govde.querySelector('.oyun-sonu');
        if (son) son.insertBefore(bilgi, son.querySelector('.sonu-puan'));
        if (ctx.canliMi() && son) { sinif.className = 'yk-sinif son'; son.appendChild(sinif); }
      }
      function perde() {
        var bekle = ctx.canliMi() && ctx.rol !== 'ogretmen';
        var p = el('div', { class: 'yk-perde' }, [
          el('div', { class: 'yk-perde-kart' }, [
            el('h3', { text: 'Hazır mısın?' }),
            el('div', { class: 'yk-ornek' }, [
              el('div', { class: 'yk-ornek-satir iyi' }, [el('b', { text: '✓ Topla' }), el('span', { text: (b.iyiler || []).slice(0, 3).map(function (o) { return o.metin; }).join(' · ') + ' …' })]),
              el('div', { class: 'yk-ornek-satir kotu' }, [el('b', { text: '✗ Kaç' }), el('span', { text: (b.kotuler || []).slice(0, 2).map(function (o) { return o.metin; }).join(' · ') + ' …' })])
            ]),
            el('p', { text: SURE + ' saniye · 3 can · ' + HEDEF + ' bereket = tam puan · art arda doğru = kombo!' }),
            bekle ? el('p', { class: 'bekle-not', text: '⏳ Hocamız başlatınca herkes aynı anda başlayacak' })
              : el('button', { class: 'dug ana buyuk', text: ctx.canliMi() ? 'Herkes için başlat' : 'Başla!', onclick: baslatIste })
          ])
        ]);
        k.govde.appendChild(p);
      }
      function baslatIste() {
        if (ctx.canliMi()) { if (ctx.rol === 'ogretmen') ctx.eylem('basla', {}, { ogretmen: true }); }
        else baslat();
      }
      ctx.eylemTanimla('basla', function (v, kk) { if (!kk.tekrar) baslat(); });
      ctx.eylemTanimla('tekrar', function () {
        ctx.yeniTur(); dizi = ctx.karistir(havuz, 'yakala'); rx = DO.tohum('yakala|' + b.id + '|' + Date.now());
        ham = 0; can = 3; seri = 0; enSeri = 0; iyiSay = 0; kotuSay = 0; kacan = 0; yakalananKotu = {}; bitti = false; uretilen = 0;
        puanEl.textContent = '0'; canYaz(); sureEl.style.width = '100%';
        sepet.querySelector('.yk-sepet-ic').innerHTML = '';
        k.govde.innerHTML = ''; k.govde.appendChild(sahne);
        baslat();
      });
      sepet.style.transform = 'translateX(' + (sepetX - 120) + 'px)';
      perde();
      return {
        temizle: function () { oyunda = false; cancelAnimationFrame(cerceve); document.removeEventListener('keydown', tusBas); document.removeEventListener('keyup', tusBirak); },
        tusAl: function () { return oyunda; },     // oyun sürerken ok tuşları sepeti yönetir, ekranı değiştirmez
        ogretmenAraci: function () {
          if (!ctx.canliMi() || oyunda || bitti) return null;
          return el('button', { class: 'dug kucuk tam', text: '🧺 Bereket sepetini herkes için başlat', onclick: function () { baslatIste(); ctx.oynatici.panelYaz(); } });
        }
      };
    }
  };

  /* =====================================================================
     SIRALA — adımları doğru sıraya diz; her doğru adımda Yusuf bir durak ilerler
     ===================================================================== */
  B.sirala = tanim({
    zorunlu: true, xapiTur: 'assessment',
    max: function (b) { return b.adimlar.length * 10; },
    ciz: function (ctx) {
      var b = ctx.blok, n = b.adimlar.length;
      var k = DO.oyunKabuk(ctx, { rozet: b.rozet || 'Sırala', sinif: 'oyun-sirala', yonerge: b.yonerge || 'Hangisi önce? Kartlara sırayla dokun.' });
      var konan = 0, puan = 0, hata = {}, bas = Date.now(), z = siraci(ctx), bitti = false;
      var W = 1460, H = 250, xs = [], i;
      for (i = 0; i < n; i++) xs.push(90 + i * (W - 180) / Math.max(1, n - 1));
      function yy(x) { return 120 + Math.sin(x / 190) * 34; }
      var d = 'M0 ' + yy(0);
      for (var x = 20; x <= W; x += 20) d += ' L' + x + ' ' + yy(x).toFixed(1);
      var svg = DO.svg('svg', { class: 'sr-svg', viewBox: '0 0 ' + W + ' ' + H });
      var duraklar = '';
      xs.forEach(function (x, j) {
        duraklar += '<g class="sr-durak" data-i="' + j + '" transform="translate(' + x.toFixed(1) + ' ' + yy(x).toFixed(1) + ')"><circle r="34" class="sr-halka"/><text y="11" text-anchor="middle" class="sr-no">' + (j + 1) + '</text>' +
          '<path class="sr-tik" d="M-14 0 l9 10 l19 -22" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></g>';
      });
      svg.innerHTML = '<path d="' + d + '" fill="none" stroke="#e8d7b4" stroke-width="44" stroke-linecap="round"/>' +
        '<path class="sr-dolu" d="' + d + '" fill="none" stroke="#a7c957" stroke-width="16" stroke-linecap="round" stroke-dasharray="4 16"/>' + duraklar +
        '<g class="sr-yolcu"><ellipse cx="0" cy="44" rx="24" ry="7" fill="#000" opacity=".15"/><path d="M-20 40c0-28 9-42 20-42s20 14 20 42z" fill="#4f7a3a"/><circle cy="-20" r="18" fill="#f2c9a0"/><path d="M-18 -25c4-15 32-15 36 0-7-5-29-5-36 0z" fill="#fffaf0"/><circle cx="-6" cy="-20" r="2.4" fill="#3b2710"/><circle cx="6" cy="-20" r="2.4" fill="#3b2710"/><path d="M-5 -12q5 4 10 0" stroke="#3b2710" stroke-width="2" fill="none" stroke-linecap="round"/></g>';
      var yolcu = svg.querySelector('.sr-yolcu');
      var etiketler = el('div', { class: 'sr-etiketler' });
      xs.forEach(function (x, j) { etiketler.appendChild(el('div', { class: 'sr-etiket', 'data-i': j, style: { left: (x / W * 100) + '%' } })); });
      var ust = el('div', { class: 'sr-yol' }, [svg, etiketler]);
      var tepsi = el('div', { class: 'sr-tepsi' });
      var kartEl = {};
      ctx.karistir(b.adimlar, 'sirala').forEach(function (a, j) {
        var kart = el('button', { class: 'sr-kart', 'data-id': a.id, style: { animationDelay: (j * 0.06) + 's' }, onclick: function () { if (!kart.disabled) ctx.eylem('koy', { id: a.id }); } },
          [resim(ctx, a, 70), el('span', { text: a.metin })]);
        kartEl[a.id] = kart; tepsi.appendChild(kart);
      });
      k.govde.appendChild(ust); k.govde.appendChild(tepsi);
      function yolcuKoy(j, anim) {
        var x0 = j < 0 ? xs[0] - 70 : xs[j];
        if (!anim) { yolcu.setAttribute('transform', 'translate(' + x0 + ' ' + (yy(x0) - 56) + ')'); return; }
        var onceki = j - 1 < 0 ? xs[0] - 70 : xs[j - 1], t0 = performance.now(), sure = 700;
        (function adim(t) {
          var o = Math.min(1, (t - t0) / sure), xx = onceki + (x0 - onceki) * o;
          yolcu.setAttribute('transform', 'translate(' + xx + ' ' + (yy(xx) - 56 - Math.sin(o * Math.PI) * 50) + ')');
          if (o < 1) requestAnimationFrame(adim);
        })(t0);
      }
      yolcuKoy(-1, false);
      ctx.eylemTanimla('koy', function (v, kk) {
        z.bosalt();
        var kart = kartEl[v.id], a = b.adimlar[konan];
        if (!kart || kart.disabled || bitti || !a) return;
        var dogru = v.id === a.id, ilk = !hata[konan];
        var secilen = b.adimlar.find(function (x) { return x.id === v.id; });
        if (kk.yerel) ctx.cevap({ oge: a.id, ad: (konan + 1) + '. adım: ' + a.metin, yanit: secilen.metin, dogru: dogru, dogruYanit: a.metin, puan: dogru && ilk ? 10 : 0, max: 10, deneme: (hata[konan] || 0) + 1, sureMs: Date.now() - bas, etkilesim: 'sequencing' });
        bas = Date.now();
        if (dogru) {
          if (ilk && kk.yerel) puan += 10;
          efekt(true, kk);
          kart.disabled = true; kart.classList.add('kondu');
          var durak = svg.querySelector('.sr-durak[data-i="' + konan + '"]'); durak.classList.add('tamam');
          var et = etiketler.querySelector('[data-i="' + konan + '"]');
          et.appendChild(el('b', { text: a.metin })); et.classList.add('dolu');
          yolcuKoy(konan, !kk.tekrar);
          if (!kk.tekrar) { var r0 = k.govde.getBoundingClientRect(), r1 = durak.getBoundingClientRect(), s = ctx.oynatici.olcek; patlama(k.govde, (r1.left + r1.width / 2 - r0.left) / s, (r1.top + r1.height / 2 - r0.top) / s); }
          if (a.aciklama && !kk.tekrar) ctx.bildir('✓ ' + a.aciklama, 'puan');
          var et2 = kimEtiketi(ctx, kk); if (et2 && !kk.tekrar) ctx.bildir(et2.textContent, 'bilgi');
          konan++;
          svg.querySelector('.sr-dolu').style.strokeDashoffset = '0';
          if (konan === n && !bitti) {
            bitti = true;
            z.sonra(function () { ctx.tamamla({ puan: puan }); DO.oyunSonu(ctx, k.govde, { puan: puan, max: n * 10, baslik: b.sonBaslik, metin: b.sonMetin }); }, 1300, kk);
          }
        } else {
          hata[konan] = (hata[konan] || 0) + 1;
          efekt(false, kk);
          kart.classList.remove('salla'); void kart.offsetWidth; kart.classList.add('salla');
          if (!kk.tekrar) ctx.bildir(a.ipucu || ('Bu adımın sırası henüz gelmedi. ' + (konan + 1) + '. adımda ne yapılır?'), 'uyari');
        }
      });
      return {};
    }
  });

  /* =====================================================================
     HİKÂYE — resimli, seçimli hikâye. Her seçim bir sonuç doğurur.
     ===================================================================== */
  B.hikaye = tanim({
    zorunlu: true, xapiTur: 'assessment',
    max: function (b) { return b.sahneler.filter(function (s) { return s.secenekler; }).length * 10; },
    ciz: function (ctx) {
      var b = ctx.blok, sahneler = b.sahneler, n = sahneler.length;
      var k = DO.oyunKabuk(ctx, { rozet: b.rozet || '📖 Hikâye', sinif: 'oyun-hikaye' });
      var sira = 0, puan = 0, yildiz = 0, hata = {}, ekran = null, anlatim = null, maxYildiz = sahneler.filter(function (s) { return s.secenekler; }).length;
      var cerceve = el('div', { class: 'hy-cerceve' });
      var panel = el('div', { class: 'hy-panel' });
      var sayac = el('div', { class: 'hy-yildizlar' });
      for (var i = 0; i < maxYildiz; i++) sayac.appendChild(el('i', { html: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>' }));
      k.ust.appendChild(sayac);
      k.govde.appendChild(cerceve); k.govde.appendChild(panel);
      function yaz(p, metin, kk) {
        if (kk && kk.tekrar) { p.textContent = metin; return; }
        p.textContent = ''; p.classList.add('yaziyor');
        var j = 0, t = ctx.aralik(function () {
          j += 2; p.textContent = metin.slice(0, j);
          if (j >= metin.length) { clearInterval(t); p.classList.remove('yaziyor'); }
        }, 22);
        p.onclick = function () { clearInterval(t); p.textContent = metin; p.classList.remove('yaziyor'); };
      }
      function sesKapat() { if (anlatim) anlatim.kapat(); anlatim = null; }
      function goster(kk) {
        var s = sahneler[sira], buSira = sira;
        sesKapat();
        if (s.ses && !(kk && kk.tekrar) && !ctx.izliyor()) anlatim = ctx.anlatim(s.ses);   // her sahnenin kendi anlatımı (öğrenci izlenirken okunmaz)
        cerceve.innerHTML = '';
        var img = el('img', { class: 'hy-resim', src: ctx.yol(s.gorsel), alt: '', draggable: 'false' });
        cerceve.appendChild(img);
        cerceve.appendChild(el('div', { class: 'hy-sayfa', text: (sira + 1) + ' / ' + n }));
        if (s.balon) cerceve.appendChild(el('div', { class: 'hy-balon', style: { left: (s.balon.x || 60) + '%', top: (s.balon.y || 12) + '%' }, text: s.balon.metin }));
        panel.innerHTML = '';
        var p = el('p', { class: 'hy-metin' });
        panel.appendChild(p);
        yaz(p, s.metin, kk);
        ekran = { sira: sira, cozuldu: !s.secenekler };
        if (s.secenekler) {
          panel.appendChild(el('h4', { class: 'hy-soru', text: s.soru || 'Sen olsan ne yapardın?' }));
          var sec = el('div', { class: 'hy-secenekler' });
          ctx.karistir(s.secenekler.map(function (o, j) { return { o: o, j: j }; }), 'hk' + sira).forEach(function (x, m) {
            sec.appendChild(el('button', { class: 'secenek hy-sec', 'data-i': x.j, style: { animationDelay: (0.3 + m * 0.1) + 's' }, text: x.o.metin, onclick: function () { ctx.eylem('sec', { s: buSira, i: x.j }); } }));
          });
          panel.appendChild(sec);
          ekran.sec = sec;
        } else {
          panel.appendChild(devamDug(buSira));
        }
      }
      function devamDug(s) {
        var son = s === n - 1;
        return el('button', { class: 'dug ana hy-devam', text: son ? 'Hikâyeyi bitir ✓' : 'Devam →', onclick: function () { ctx.eylem('devam', { s: s }); } });
      }
      ctx.eylemTanimla('sec', function (v, kk) {
        if (!ekran || v.s !== ekran.sira || ekran.cozuldu) return;
        var s = sahneler[v.s], o = s.secenekler[v.i], dugme = ekran.sec.querySelector('[data-i="' + v.i + '"]');
        if (!o || !dugme || dugme.disabled) return;
        var ilk = !hata[v.s], iyi = !!o.iyi;
        if (kk.yerel) ctx.cevap({ oge: s.id || ('sahne' + v.s), ad: s.soru || s.metin, yanit: o.metin, dogru: iyi, dogruYanit: (s.secenekler.find(function (x) { return x.iyi; }) || {}).metin, puan: iyi && ilk ? 10 : 0, max: 10, deneme: (hata[v.s] || 0) + 1 });
        dugme.disabled = true;
        var sonuc = el('div', { class: 'hy-sonuc ' + (iyi ? 'iyi' : 'dur') }, [el('b', { text: iyi ? '✓ Güzel seçim' : '✋ Bir dakika…' }), el('span', { text: o.sonuc || '' })]);
        var et = kimEtiketi(ctx, kk); if (et) sonuc.appendChild(et);
        ekran.sec.querySelectorAll('.hy-sonuc').forEach(function (x) { x.remove(); });
        if (iyi) {
          ekran.cozuldu = true;
          efekt(true, kk);
          dugme.classList.add('dogru');
          ekran.sec.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
          if (ilk) {
            if (kk.yerel) puan += 10;
            var y = sayac.children[yildiz]; if (y) y.classList.add('dolu'); yildiz++;
            if (!kk.tekrar) patlama(cerceve, 800, 80);
          }
          ekran.sec.appendChild(sonuc);
          panel.appendChild(devamDug(v.s));
        } else {
          hata[v.s] = (hata[v.s] || 0) + 1;
          efekt(false, kk);
          dugme.classList.add('yanlis');
          ekran.sec.appendChild(sonuc);
        }
      });
      ctx.eylemTanimla('devam', function (v, kk) {
        if (!ekran || v.s !== ekran.sira || !ekran.cozuldu) return;
        if (v.s >= n - 1) {
          ekran = null; sesKapat();
          ctx.tamamla({ puan: puan });
          DO.oyunSonu(ctx, panel, { puan: puan, max: maxYildiz * 10, baslik: b.sonBaslik || 'Hikâye bitti!', metin: b.sonMetin });
          return;
        }
        sira = v.s + 1; goster(kk);
      });
      goster();
      return {
        anlatimDegisti: function (acik) { if (!anlatim) return; if (acik) anlatim.cal(); else anlatim.durdur(); }
      };
    }
  });

  /* =====================================================================
     ÇARK — soru çarkı: çevir, gelen dilimin sorusunu cevapla
     Hedef dilim çeviren cihazda seçilir ve eylemle herkese aynı gider.
     ===================================================================== */
  B.cark = tanim({
    zorunlu: true, xapiTur: 'assessment',
    max: function (b) { return b.dilimler.length * 10; },
    ciz: function (ctx) {
      var b = ctx.blok, D = b.dilimler, n = D.length, aci = 360 / n;
      var k = DO.oyunKabuk(ctx, { rozet: b.rozet || '🎡 Soru çarkı', sinif: 'oyun-cark', yonerge: b.yonerge || 'Çarkı çevir; gelen konunun sorusunu cevapla.' });
      var donus = 0, donuyor = false, acik = null, biten = {}, puan = 0, sayi = 0, z = siraci(ctx), bitti = false;
      var renk = ['#e76f51', '#e9c46a', '#7fb069', '#4fa3d1', '#b388eb', '#f4a261', '#2a9d8f', '#f28ab2'];
      var svg = DO.svg('svg', { class: 'cark-svg', viewBox: '-300 -300 600 600' });
      var dilim = '';
      D.forEach(function (d, i) {
        var a0 = (i * aci - 90) * Math.PI / 180, a1 = ((i + 1) * aci - 90) * Math.PI / 180, R = 270;
        var orta = (i + 0.5) * aci;
        dilim += '<g class="cark-dilim" data-i="' + i + '"><path d="M0 0 L' + (Math.cos(a0) * R).toFixed(1) + ' ' + (Math.sin(a0) * R).toFixed(1) + ' A' + R + ' ' + R + ' 0 0 1 ' + (Math.cos(a1) * R).toFixed(1) + ' ' + (Math.sin(a1) * R).toFixed(1) + 'z" fill="' + (d.renk || renk[i % renk.length]) + '" stroke="#fffaf0" stroke-width="6"/>' +
          '<g transform="rotate(' + orta + ')"><text y="-170" text-anchor="middle" dominant-baseline="middle" class="cark-yazi"' + (orta > 90 && orta < 270 ? ' transform="rotate(180 0 -170)"' : '') + '>' + DO.kacis(d.etiket) + '</text>' +
          (d.emoji ? '<text y="-112" text-anchor="middle" dominant-baseline="middle" class="cark-emoji"' + (orta > 90 && orta < 270 ? ' transform="rotate(180 0 -112)"' : '') + '>' + DO.kacis(d.emoji) + '</text>' : '') +
          '<text y="-200" text-anchor="middle" class="cark-tik">✓</text></g></g>';
      });
      var ampuller = '';
      for (var i = 0; i < 24; i++) { var a = i / 24 * Math.PI * 2; ampuller += '<circle class="cark-ampul" style="animation-delay:' + (i % 2 ? .5 : 0) + 's" cx="' + (Math.cos(a) * 287).toFixed(1) + '" cy="' + (Math.sin(a) * 287).toFixed(1) + '" r="7"/>'; }
      svg.innerHTML = '<circle r="298" fill="#8a5a2b"/><circle r="280" fill="#fffaf0"/>' + ampuller +
        '<g class="cark-don">' + dilim + '</g><circle r="54" fill="#fffaf0" stroke="#8a5a2b" stroke-width="10"/><circle r="22" fill="#e9b949"/>' +
        '<path class="cark-ok" d="M-26 -308 L26 -308 L0 -250z" fill="#c0392b" stroke="#fffaf0" stroke-width="5"/>';
      var don = svg.querySelector('.cark-don');
      var cevirDug = el('button', { class: 'dug ana buyuk cark-dug', text: '🎡 Çevir!', onclick: function () { iste(); } });
      var sol = el('div', { class: 'cark-sol' }, [svg, cevirDug]);
      var sag = el('div', { class: 'cark-sag' });
      var durum = el('div', { class: 'cark-durum', text: '0 / ' + n });
      k.ust.appendChild(durum);
      k.govde.appendChild(sol); k.govde.appendChild(sag);
      function bosKart() {
        sag.innerHTML = '';
        sag.appendChild(el('div', { class: 'cark-bekle' }, [el('div', { class: 'cark-bekle-ikon', text: '🎡' }), el('h3', { text: sayi ? 'Sıradaki konu için çarkı çevir!' : 'Çarkı çevir, şansına hangi konu çıkacak?' }), el('p', { text: (n - sayi) + ' konu kaldı' })]));
      }
      function iste() {
        if (donuyor || acik != null || bitti) return;
        var kalan = []; for (var j = 0; j < n; j++) if (!biten[j]) kalan.push(j);
        if (!kalan.length) return;
        ctx.eylem('cevir', { i: kalan[Math.floor(Math.random() * kalan.length)], tur: sayi });
      }
      ctx.eylemTanimla('cevir', function (v, kk) {
        z.bosalt();
        if (donuyor || acik != null || biten[v.i] || v.tur !== sayi) return;
        donuyor = true; cevirDug.disabled = true;
        var hedef = ((-(v.i + 0.5) * aci) % 360 + 360) % 360, simdi = ((donus % 360) + 360) % 360;
        donus += 360 * 5 + ((hedef - simdi) + 360) % 360;
        if (kk.tekrar) { don.style.transition = 'none'; don.style.transform = 'rotate(' + donus + 'deg)'; }
        else {
          don.style.transition = 'transform 3.4s cubic-bezier(.15,.75,.15,1)';
          don.style.transform = 'rotate(' + donus + 'deg)';
          [0, 120, 250, 390, 540, 700, 880, 1080, 1300, 1560, 1850, 2200, 2600, 3050].forEach(function (t) { ctx.zaman(function () { DO.efekt.tik(); }, t); });
        }
        var et = kimEtiketi(ctx, kk);
        z.sonra(function () { donuyor = false; soru(v.i, et, kk); }, 3500, kk);
      });
      function soru(i, et, kk) {
        var d = D[i], dilEl = svg.querySelector('.cark-dilim[data-i="' + i + '"]');
        dilEl.classList.add('secildi');
        if (!(kk && kk.tekrar)) DO.efekt.gecis();
        sag.innerHTML = '';
        var kart = el('div', { class: 'cark-kart', style: { '--r': d.renk || renk[i % renk.length] } }, [
          el('span', { class: 'cark-konu', text: (d.emoji ? d.emoji + ' ' : '') + d.etiket }),
          d.gorsel ? el('img', { class: 'cark-resim', src: ctx.yol(d.gorsel), alt: '' }) : null,
          el('h3', { text: d.soru })
        ]);
        if (et) kart.appendChild(el('span', { class: 'kim-etiket', text: et.textContent.replace('cevapladı', 'çevirdi') }));
        var sec = el('div', { class: 'cark-secenekler' });
        ctx.karistir(d.secenekler.map(function (m, j) { return { m: m, j: j }; }), 'cark' + i).forEach(function (x, m) {
          sec.appendChild(el('button', { class: 'secenek', 'data-i': x.j, style: { animationDelay: (m * 0.08) + 's' }, text: x.m, onclick: function () { ctx.eylem('sec', { d: i, i: x.j }); } }));
        });
        kart.appendChild(sec);
        sag.appendChild(kart);
        acik = { i: i, kart: kart, sec: sec, cevap: false, bas: Date.now() };
      }
      ctx.eylemTanimla('sec', function (v, kk) {
        z.bosalt();
        if (!acik || acik.i !== v.d || acik.cevap) return;
        var d = D[v.d], dogru = v.i === d.dogru;
        acik.cevap = true;
        acik.sec.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
        var s = acik.sec.querySelector('[data-i="' + v.i + '"]'); if (s) s.classList.add(dogru ? 'dogru' : 'yanlis');
        if (!dogru) { var dd = acik.sec.querySelector('[data-i="' + d.dogru + '"]'); if (dd) dd.classList.add('dogru'); }
        efekt(dogru, kk);
        if (kk.yerel) {
          if (dogru) puan += 10;
          ctx.cevap({ oge: d.id || ('d' + v.d), ad: d.soru, yanit: d.secenekler[v.i], dogru: dogru, dogruYanit: d.secenekler[d.dogru], puan: dogru ? 10 : 0, max: 10, sureMs: Date.now() - acik.bas });
        }
        var et = kimEtiketi(ctx, kk); if (et) acik.kart.appendChild(et);
        acik.kart.appendChild(el('div', { class: 'geri-bildirim ' + (dogru ? 'd' : 'y') }, [el('b', { text: dogru ? '✓ Doğru' : '✗ Doğrusu işaretli' }), d.aciklama ? el('span', { text: d.aciklama }) : null]));
        var son = sayi + 1 >= n;
        acik.kart.appendChild(el('button', { class: 'dug ana devam', text: son ? 'Bitir' : 'Çarka dön →', onclick: function () { ctx.eylem('devam', { d: v.d }); } }));
        var dilEl = svg.querySelector('.cark-dilim[data-i="' + v.d + '"]');
        dilEl.classList.remove('secildi'); dilEl.classList.add(dogru ? 'bitti' : 'bitti-y');
      });
      ctx.eylemTanimla('devam', function (v) {
        if (!acik || acik.i !== v.d || !acik.cevap) return;
        biten[v.d] = true; sayi++; acik = null;
        durum.textContent = sayi + ' / ' + n;
        if (sayi >= n) {
          bitti = true; cevirDug.disabled = true;
          ctx.tamamla({ puan: puan });
          DO.oyunSonu(ctx, sag, { puan: puan, max: n * 10, baslik: b.sonBaslik, metin: b.sonMetin });
          return;
        }
        cevirDug.disabled = false; bosKart();
      });
      bosKart();
      return {};
    }
  });

  /* =====================================================================
     HATA BUL — resimdeki yanlışları bul (koordinatlar 1600×900 resim düzleminde)
     ===================================================================== */
  B.hataBul = tanim({
    zorunlu: true, xapiTur: 'assessment',
    max: function (b) { return b.hatalar.length * 10; },
    ciz: function (ctx) {
      var b = ctx.blok, H = b.hatalar, n = H.length, RW = b.genislik || 1600, RH = b.yukseklik || 900;
      var k = DO.oyunKabuk(ctx, { rozet: b.rozet || '🔍 Hataları bul', sinif: 'oyun-hata', yonerge: b.yonerge || 'Resimde sofra edebine uymayan ' + n + ' şey var. Gördüğün yere dokun!' });
      var bulunan = {}, sayi = 0, iska = 0, ipucu = {}, puan = 0, bas = Date.now(), bitti = false, z = siraci(ctx);
      var kutu = el('div', { class: 'hb-kutu' });
      var img = el('img', { class: 'hb-resim', src: ctx.yol(b.gorsel), alt: '', draggable: 'false' });
      var katman = DO.svg('svg', { class: 'hb-katman', viewBox: '0 0 ' + RW + ' ' + RH, preserveAspectRatio: 'none' });
      kutu.appendChild(img); kutu.appendChild(katman);
      var liste = el('div', { class: 'hb-liste' });
      var baslik = el('div', { class: 'hb-sayac', html: '<b>0</b> / ' + n + ' bulundu' });
      liste.appendChild(baslik);
      var yuvalar = el('ol', { class: 'hb-yuvalar' });
      for (var i = 0; i < n; i++) yuvalar.appendChild(el('li', { class: 'hb-yuva', html: '<span>?</span>' }));
      liste.appendChild(yuvalar);
      var ipDug = el('button', { class: 'dug ikincil kucuk hb-ipucu', text: '💡 İpucu', onclick: function () { ctx.eylem('ipucu', { sayi: sayi }); } });
      liste.appendChild(ipDug);
      k.govde.appendChild(kutu); k.govde.appendChild(liste);
      kutu.addEventListener('click', function (e) {
        if (bitti) return;
        var r = kutu.getBoundingClientRect();
        var x = Math.round((e.clientX - r.left) / r.width * RW), y = Math.round((e.clientY - r.top) / r.height * RH);
        ctx.eylem('dokun', { x: x, y: y });
      });
      ctx.eylemTanimla('dokun', function (v, kk) {
        z.bosalt();
        if (bitti) return;
        var hit = -1, en = 1e9;
        H.forEach(function (h, j) {
          if (bulunan[j]) return;
          var d = Math.hypot(v.x - h.x, v.y - h.y);
          if (d <= (h.r || 110) && d < en) { en = d; hit = j; }
        });
        if (hit < 0) {
          // zaten bulunmuş bir hatanın üstüne dokunmak ıska sayılmaz
          var eski = H.some(function (h, j) { return bulunan[j] && Math.hypot(v.x - h.x, v.y - h.y) <= (h.r || 110); });
          if (eski) return;
          iska++;
          if (!kk.tekrar) {
            var x = DO.svg('g', { class: 'hb-iska', transform: 'translate(' + v.x + ' ' + v.y + ')' });
            x.innerHTML = '<circle r="34" fill="#c0392b" opacity=".85"/><path d="M-13 -13 13 13 M13 -13 -13 13" stroke="#fff" stroke-width="7" stroke-linecap="round"/>';
            katman.appendChild(x); setTimeout(function () { x.remove(); }, 700);
            DO.efekt.yanlis();
          }
          return;
        }
        var h = H[hit], p = ipucu[hit] ? 5 : 10;
        bulunan[hit] = true; sayi++;
        if (kk.yerel) {
          puan += p;
          ctx.cevap({ oge: h.id, ad: h.ad, yanit: 'bulundu', dogru: true, dogruYanit: h.ad, puan: p, max: 10, sureMs: Date.now() - bas, etkilesim: 'other' });
          bas = Date.now();
        }
        efekt(true, kk);
        var g = DO.svg('g', { class: 'hb-bulundu', transform: 'translate(' + h.x + ' ' + h.y + ')' });
        var rr = Math.round((h.r || 110) * 0.85);
        g.innerHTML = '<circle r="' + rr + '" fill="rgba(127,176,105,.18)" stroke="#4f7a3a" stroke-width="10" stroke-dasharray="' + Math.round(2 * Math.PI * rr) + '" style="--uz:' + Math.round(2 * Math.PI * rr) + '"/>' +
          '<g transform="translate(' + Math.round(rr * 0.72) + ' ' + Math.round(-rr * 0.72) + ')"><circle r="30" fill="#4f7a3a" stroke="#fff" stroke-width="5"/><text y="11" text-anchor="middle" class="hb-no">' + sayi + '</text></g>';
        katman.appendChild(g);
        var yuva = yuvalar.children[sayi - 1];
        yuva.className = 'hb-yuva dolu';
        yuva.innerHTML = '';
        yuva.appendChild(el('b', { text: h.ad }));
        if (h.aciklama) yuva.appendChild(el('small', { text: h.aciklama }));
        var et = kimEtiketi(ctx, kk); if (et) yuva.appendChild(et);
        baslik.innerHTML = '<b>' + sayi + '</b> / ' + n + ' bulundu';
        katman.querySelectorAll('.hb-ipucu-halka[data-i="' + hit + '"]').forEach(function (x) { x.remove(); });
        if (!kk.tekrar) { var r0 = k.govde.getBoundingClientRect(), r1 = kutu.getBoundingClientRect(), s = ctx.oynatici.olcek; patlama(k.govde, (r1.left - r0.left) / s + h.x / RW * r1.width / s, (r1.top - r0.top) / s + h.y / RH * r1.height / s); }
        if (sayi === n && !bitti) {
          bitti = true; ipDug.disabled = true;
          var son = function () {
            if (!ctx.ortak() && iska) puan = Math.max(Math.min(puan, n * 4), puan - iska * 2);
            ctx.tamamla({ puan: puan });
            DO.oyunSonu(ctx, liste, { puan: puan, max: n * 10, baslik: b.sonBaslik || 'Hepsini buldun!', metin: iska ? iska + ' kez boş yere dokundun.' : 'Hiç boşa dokunmadın, mâşallah!' });
          };
          z.sonra(son, 1200, kk);
        }
      });
      ctx.eylemTanimla('ipucu', function (v, kk) {
        if (v.sayi !== sayi || bitti) return;
        var j = -1; for (var m = 0; m < n; m++) if (!bulunan[m] && !ipucu[m]) { j = m; break; }
        if (j < 0) { if (!kk.tekrar) ctx.bildir('Kalan hatalar için ipucu zaten verildi.', 'bilgi'); return; }
        ipucu[j] = true;
        var h = H[j], ox = (j % 2 ? 1 : -1) * (h.r || 110) * 0.35, oy = (j % 3 - 1) * (h.r || 110) * 0.3;
        var c = DO.svg('circle', { class: 'hb-ipucu-halka', 'data-i': j, cx: Math.round(h.x + ox), cy: Math.round(h.y + oy), r: Math.round((h.r || 110) * 1.6) });
        katman.appendChild(c);
        if (!kk.tekrar) { DO.efekt.tik(); ctx.bildir('💡 Parlayan bölgeye dikkatle bak (bu hata 5 puan)', 'bilgi'); }
      });
      return {};
    }
  });

  /* =====================================================================
     SÖZ — hadîs-i şerîf / büyüklerimizin sözü için vakur bir kart
     ===================================================================== */
  B.soz = {
    xapiTur: 'media',
    ciz: function (ctx) {
      var b = ctx.blok, renk = b.renk || '#4f7a3a';
      var gul = '';
      for (var i = 0; i < 8; i++) gul += '<path d="M0 -150 Q40 -60 0 0 Q-40 -60 0 -150z" transform="rotate(' + (i * 45) + ')"/>';
      var kap = el('div', { class: 'soz', style: { '--r': renk } });
      kap.innerHTML = '<svg class="soz-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs><pattern id="sozKare" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0v40" fill="none" stroke="#e7dcc4"/></pattern></defs>' +
        '<rect width="1600" height="900" fill="#f7f0e1"/><rect width="1600" height="900" fill="url(#sozKare)" opacity=".6"/>' +
        '<g class="soz-gul" transform="translate(160 160)" fill="none" stroke="' + renk + '" stroke-width="3" opacity=".35">' + gul + '<circle r="60"/></g>' +
        '<g class="soz-gul ters" transform="translate(1440 740)" fill="none" stroke="#e9b949" stroke-width="3" opacity=".5">' + gul + '<circle r="60"/></g></svg>';
      var kart = el('div', { class: 'soz-kart' }, [
        el('span', { class: 'soz-ust', text: b.ust || 'Hadîs-i şerîf' }),
        b.baslik ? el('h2', { class: 'soz-baslik', text: b.baslik }) : null,
        b.giris ? el('p', { class: 'soz-giris', text: b.giris }) : null,
        el('blockquote', { class: 'soz-vurgu', text: b.metin }),
        b.kaynak ? el('cite', { class: 'soz-kaynak', text: b.kaynak }) : null,
        b.aciklama ? el('p', { class: 'soz-aciklama', text: b.aciklama }) : null
      ]);
      kap.appendChild(kart);
      ctx.kap.appendChild(kap);
      DO.efekt.gecis();
      var a = ctx.anlatim(b.ses);
      ctx.tamamla({ puan: 0, max: 0 });
      return {
        anlatimDegisti: function (acik) { if (!a) return; if (acik) a.cal(); else a.durdur(); }
      };
    }
  };

  /* =====================================================================
     SOFRA — dersteki oyunlar bitirildikçe sofraya bir tabak gelir (SVG animasyonu)
     ===================================================================== */
  var TABAK = {
    corba: '<ellipse cx="0" cy="10" rx="62" ry="22" fill="#d9c7a7"/><path d="M-60 0 a60 34 0 0 0 120 0z" fill="#fffaf0"/><ellipse cx="0" cy="0" rx="60" ry="18" fill="#e8962e"/><ellipse cx="-14" cy="-3" rx="10" ry="3" fill="#f4d58d"/><circle cx="18" cy="2" r="4" fill="#7fb069"/>' +
      '<path class="buhar" d="M-16 -22 q-10 -16 0 -30 t0 -30" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/><path class="buhar" style="animation-delay:.7s" d="M14 -22 q-10 -16 0 -30 t0 -30" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>',
    pilav: '<ellipse cx="0" cy="8" rx="66" ry="24" fill="#e9dcc2"/><ellipse cx="0" cy="2" rx="60" ry="20" fill="#fffaf0"/><path d="M-44 0 q44 -46 88 0z" fill="#fff6dc"/><g fill="#f1e2b8"><circle cx="-20" cy="-8" r="3"/><circle cx="6" cy="-14" r="3"/><circle cx="22" cy="-6" r="3"/><circle cx="-6" cy="-4" r="3"/></g>',
    ekmek: '<ellipse cx="0" cy="14" rx="70" ry="20" fill="#c98b45" opacity=".35"/><path d="M-62 10 q-6 -40 62 -44 q68 4 62 44 z" fill="#d9a05b"/><path d="M-38 -14 l14 18 M-6 -24 l12 20 M28 -18 l12 18" stroke="#a8702f" stroke-width="6" stroke-linecap="round"/>',
    salata: '<ellipse cx="0" cy="8" rx="58" ry="22" fill="#4fa3d1"/><ellipse cx="0" cy="2" rx="52" ry="17" fill="#a7c957"/><circle cx="-20" cy="-4" r="11" fill="#e76f51"/><circle cx="14" cy="-8" r="10" fill="#e76f51"/><ellipse cx="2" cy="4" rx="12" ry="6" fill="#d8f3dc"/><path d="M-36 6 q10 -18 22 -4" fill="#52b788"/>',
    su: '<path d="M-26 40 L-32 -40 H32 L26 40z" fill="#bde0fe" opacity=".75" stroke="#8ecae6" stroke-width="4"/><path d="M-30 -14 H30 L26 40 H-26z" fill="#8ecae6" opacity=".7"/><ellipse cx="0" cy="-40" rx="32" ry="7" fill="#e0f2fe" stroke="#8ecae6" stroke-width="3"/>',
    hurma: '<ellipse cx="0" cy="8" rx="56" ry="20" fill="#fffaf0" stroke="#d9c7a7" stroke-width="4"/><g fill="#7a3e1d"><ellipse cx="-24" cy="0" rx="16" ry="9" transform="rotate(-20 -24 0)"/><ellipse cx="4" cy="-6" rx="16" ry="9" transform="rotate(15 4 -6)"/><ellipse cx="26" cy="4" rx="16" ry="9" transform="rotate(-10 26 4)"/></g>',
    ayran: '<path d="M-24 44 L-28 -34 H28 L24 44z" fill="#fff" stroke="#d9c7a7" stroke-width="4"/><ellipse cx="0" cy="-34" rx="28" ry="7" fill="#fffaf0" stroke="#d9c7a7" stroke-width="3"/><circle cx="-6" cy="-30" r="3" fill="#e4eed6"/><circle cx="8" cy="-33" r="2.5" fill="#e4eed6"/>',
    meyve: '<ellipse cx="0" cy="12" rx="62" ry="20" fill="#b9854a"/><circle cx="-24" cy="-6" r="20" fill="#e63946"/><circle cx="12" cy="-12" r="20" fill="#f4a261"/><circle cx="32" cy="2" r="16" fill="#a7c957"/><path d="M-24 -26 q4 -10 12 -10" stroke="#4f7a3a" stroke-width="4" fill="none"/>',
    kofte: '<ellipse cx="0" cy="8" rx="64" ry="22" fill="#fffaf0" stroke="#d9c7a7" stroke-width="4"/><g fill="#8c4a2f"><ellipse cx="-26" cy="0" rx="17" ry="11"/><ellipse cx="0" cy="-6" rx="17" ry="11"/><ellipse cx="26" cy="2" rx="17" ry="11"/></g><circle cx="-6" cy="10" r="6" fill="#e76f51"/><path d="M14 12 q10 -10 22 -2" stroke="#52b788" stroke-width="6" fill="none" stroke-linecap="round"/>',
    tatli: '<ellipse cx="0" cy="12" rx="60" ry="20" fill="#fffaf0" stroke="#d9c7a7" stroke-width="4"/><path d="M-40 6 L0 -30 L40 6z" fill="#e9b949"/><path d="M-40 6 H40 L36 16 H-36z" fill="#c98b45"/><g fill="#52b788"><circle cx="-10" cy="-6" r="4"/><circle cx="10" cy="-4" r="4"/><circle cx="0" cy="-18" r="4"/></g>'
  };
  TABAK.zeytin = '<ellipse cx="0" cy="8" rx="50" ry="18" fill="#fffaf0" stroke="#d9c7a7" stroke-width="4"/><g fill="#3f4a2a"><ellipse cx="-18" cy="0" rx="10" ry="7"/><ellipse cx="2" cy="-6" rx="10" ry="7"/><ellipse cx="20" cy="2" rx="10" ry="7"/><ellipse cx="0" cy="8" rx="10" ry="7" fill="#6b7a3a"/></g><path d="M-36 4 q10 -12 20 -4" stroke="#7fb069" stroke-width="5" fill="none"/>';
  TABAK.yogurt = '<ellipse cx="0" cy="10" rx="52" ry="20" fill="#4fa3d1"/><path d="M-50 4 a50 26 0 0 0 100 0z" fill="#2f7fb0"/><ellipse cx="0" cy="2" rx="46" ry="15" fill="#fffdf7"/><path d="M-16 0 q16 -10 32 0" stroke="#e4eed6" stroke-width="4" fill="none"/><circle cx="12" cy="-2" r="3" fill="#7fb069"/>';
  var TABAK_SIRA = ['corba', 'ekmek', 'pilav', 'salata', 'su', 'kofte', 'hurma', 'ayran', 'meyve', 'yogurt', 'zeytin', 'tatli'];
  B.sofra = {
    xapiTur: 'module',
    ciz: function (ctx) {
      var b = ctx.blok, O = ctx.oynatici;
      var oyunlar = O.sira.filter(function (x) { var t = DO.Bloklar[x.tur]; return t && t.max && t.max(x) > 0; });
      var kazanilan = [];
      // Canlı derste Hocamızın sofrası izlenen öğrencinin sofrasıdır (iki ekran aynı)
      var durum = O.durum, iz = ctx.rol === 'ogretmen' && ctx.canliMi() ? O.izlenenId() : null;
      if (iz) durum = O.ogrDurum[iz] || {};
      oyunlar.forEach(function (x) {
        var d = durum[x.id];
        if (d && d.tamam) kazanilan.push({ id: x.id, yildiz: yildizSay(d.max ? d.puan / d.max : 1) });
      });
      var sonGoruldu = iz ? 0 : DO.depo.oku('do:sofra:' + O.ders.id, 0);
      var yer = [[0, -100], [-260, -80], [260, -80], [-400, 20], [400, 20], [-250, 105], [250, 105], [0, 130], [-130, 15], [130, 15], [-430, -60], [430, -60]];
      var tabaklar = '';
      for (var i = 0; i < Math.min(oyunlar.length, TABAK_SIRA.length); i++) {
        var p = yer[i], kz = kazanilan[i];
        if (kz) {
          var yeni = i >= sonGoruldu;
          tabaklar += '<g transform="translate(' + p[0] + ' ' + p[1] + ') scale(1.45)"><g class="sofra-tabak' + (yeni ? ' yeni' : '') + (kz.yildiz >= 3 ? ' altin' : '') + '" style="animation-delay:' + (yeni ? 0.6 + (i - sonGoruldu) * 0.45 : 0) + 's">' +
            TABAK[TABAK_SIRA[i]] + (kz.yildiz >= 3 ? '<g class="sofra-isilti"><path d="M58 -40 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5z" fill="#e9b949"/></g>' : '') + '</g></g>';
        } else {
          tabaklar += '<g transform="translate(' + p[0] + ' ' + p[1] + ') scale(1.45)" class="sofra-bos"><ellipse rx="58" ry="22" fill="none" stroke="#b9854a" stroke-width="4" stroke-dasharray="10 10"/><text y="10" text-anchor="middle">?</text></g>';
        }
      }
      if (!iz) DO.depo.yaz('do:sofra:' + O.ders.id, Math.max(sonGoruldu, kazanilan.length));
      var kap = el('div', { class: 'sofra' });
      kap.innerHTML = '<svg class="sofra-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">' +
        '<defs><radialGradient id="sofraIsik" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="#fff3d6"/><stop offset="1" stop-color="#f1dfbd"/></radialGradient>' +
        '<pattern id="kilim" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#b5523b"/><path d="M30 6 L54 30 30 54 6 30z" fill="#d9874f"/><path d="M30 18 L42 30 30 42 18 30z" fill="#f4d58d"/></pattern></defs>' +
        '<rect width="1600" height="900" fill="url(#sofraIsik)"/>' +
        '<g class="sofra-fener" transform="translate(240 120)"><path d="M0 -120 V-40" stroke="#8a5a2b" stroke-width="4"/><path d="M-30 -40 h60 l10 70 h-80z" fill="#e9b949"/><rect x="-22" y="-30" width="44" height="54" rx="8" fill="#fff3c4" class="sofra-alev"/><path d="M-40 30 h80 l-10 16 h-60z" fill="#8a5a2b"/></g>' +
        '<g class="sofra-fener" transform="translate(1360 140)" style="animation-delay:1s"><path d="M0 -140 V-40" stroke="#8a5a2b" stroke-width="4"/><path d="M-30 -40 h60 l10 70 h-80z" fill="#7fb069"/><rect x="-22" y="-30" width="44" height="54" rx="8" fill="#fff3c4" class="sofra-alev"/><path d="M-40 30 h80 l-10 16 h-60z" fill="#8a5a2b"/></g>' +
        '<ellipse cx="800" cy="720" rx="760" ry="170" fill="url(#kilim)" opacity=".9"/>' +
        '<g transform="translate(800 560)"><ellipse cx="0" cy="40" rx="560" ry="200" fill="#6d4321"/><ellipse cx="0" cy="20" rx="560" ry="200" fill="#a8702f"/><ellipse cx="0" cy="14" rx="520" ry="178" fill="#c98b45"/><ellipse cx="0" cy="14" rx="470" ry="156" fill="none" stroke="#e0ad6a" stroke-width="6" stroke-dasharray="2 14"/>' +
        tabaklar + '</g></svg>';
      var oran = oyunlar.length ? kazanilan.length / oyunlar.length : 0;
      kap.appendChild(el('div', { class: 'sofra-metin' }, [
        el('span', { class: 'kapak-ust', text: b.ust || 'Bereket sofrası' }),
        el('h1', { text: b.baslik || (kazanilan.length ? 'Sofrana ' + Math.min(kazanilan.length, TABAK_SIRA.length) + ' nimet geldi!' : 'Sofra seni bekliyor') }),
        el('p', { text: b.alt || (oran >= 1 ? 'Sofra tamamen kuruldu. Bereketli olsun!' : 'Her etkinlikte sofraya yeni bir nimet gelecek.') })
      ]));
      ctx.kap.appendChild(kap);
      if (kazanilan.length > sonGoruldu) ctx.zaman(function () { DO.efekt.zafer(); }, 600);
      ctx.tamamla({ puan: 0, max: 0 });
      // Öğrenci bir oyunu sonradan bitirirse Hocamızın sofrası da güncellenir
      return { ogrenciBitirdi: function (id) { if (id === O.izlenenId()) ctx.zaman(function () { O.git(O.i); }, 300); } };
    }
  };
})();
