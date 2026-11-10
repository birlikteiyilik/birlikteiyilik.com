/* Ders Odası — İBREMETRE vitrin blokları (üç yeni mekanik). bloklar-ibre.js'den SONRA yüklenir; DO.Ibre'yi kullanır.
   ibrePay   (Tevâzu) : "Payı kime yazıyorsun?" — 100 parça alkışı sen + 3 arkadaş arasında dört kaydırıcıyla dağıt; ibre kendi payına bakar
   ibreGun   (Azim)   : "Bir günün ibresi" — 5 duraklı gün çizgisi; her durakta 3 seçenek, seçince ibre oynar ve gün grafiği oluşur; durak atlanabilir
   ibreNefes (Hilm)   : öfke ölçeği — ibre kendiliğinden sağa (Hiddet) kayar; "Nefes al" basılı tutulur (Boşluk / dokunma-tut) ya da halka izlenir; sonra "Ne söylersin?"
   Hiçbiri puan/rozet/sıralama/konfeti vermez (max 0), doğru-yanlış damgası yok, hiçbir şey zorunlu değil ("Şimdilik geç" her blokta var).
   Canlı ders: her anlamlı hareket ctx.eylem(...) ile; ctx.eylemTanimla(...) her cihazda aynı çalışır. Sahne 1600×900; alt HUD y>~760'ı örter, kontroller o çizginin üstünde.
   İnsan figürleri yüzsüz piktogram. Sesler: ders.sesler içinde v1…v8 (ses_uretim/<ders>-vitrin/). */
(function () {
  'use strict';
  var DO = window.DO, I = DO && DO.Ibre;
  if (!DO || !I || !I.Kadran) { if (window.console) console.error('bloklar-ibre2.js: bloklar-ibre.js önce yüklenmeli'); return; }
  var el = DO.el, sv = DO.svg, B = DO.Bloklar;
  var Kadran = I.Kadran, Figur = I.Figur, Saat = I.Saat, Sfx = I.Sfx, Muzik = I.Muzik, Anlat = I.Anlat;
  var ZON = I.ZON, BG = I.BG, ISARET = I.ISARET, KUTUP = I.KUTUP, MERKEZ = I.MERKEZ, FONT = I.FONT;
  var clamp = I.clamp, lerp = I.lerp, ilerle = I.ilerle, yumusat = I.yumusat, cikis = I.cikis, zonDe = I.zonDe, karisim = I.karisim, genislik = I.genislik;
  var sahneKur = I.sahneKur, arkaHareket = I.arkaHareket;
  var REDUCED = I.REDUCED, TEST = I.TEST;
  var ADLAR = { az: 'Az', orta: 'Kararında', fazla: 'Fazla' };

  /* ——— ortak yardımcılar ——— */
  function titret(kap) { if (REDUCED) return; kap.classList.remove('ib-titre'); void kap.offsetWidth; kap.classList.add('ib-titre'); }
  function varsay(o, v) { o = o || {}; var r = {}, k; for (k in v) r[k] = o[k] != null ? o[k] : v[k]; for (k in o) if (!(k in r)) r[k] = o[k]; return r; }
  function temel(ctx, sinif) {
    var saat = new Saat(ctx), S = sahneKur(ctx, sinif), A = new Anlat(ctx);
    Muzik.baslat(); ctx.oynatici.temizlikler.push(function () { Muzik.birak(1.4); });
    return { saat: saat, S: S, svg: S.svg, A: A };
  }
  /** sesli satırları art arda çalar (olmayan satırı atlar); yeni çağrı eskisini iptal eder. Toplam süreyi ms döndürür. */
  function SiraOlustur(ctx, A) {
    var jt = 0;
    var f = function (liste, gec) {
      var my = ++jt, t = gec || 0; A.sustur();
      liste.forEach(function (id) {
        if (!id || !A.ses[id]) return;
        ctx.zaman(function () { if (jt === my) A.cal(id); }, t);
        t += A.sure(id) * 1000 + 350;
      });
      return t;
    };
    f.iptal = function () { jt++; A.sustur(); };
    return f;
  }
  function metinSes(A, id, yedek) { return (A.ses[id] && A.ses[id].m) || yedek || ''; }
  function gecDugme(ctx, sinif, yaz) {   /* hiçbir şey zorunlu değil: kayıt yazmadan geç */
    return el('button', { class: 'ib2-gec ' + (sinif || ''), type: 'button', text: yaz || 'Şimdilik geç →', onclick: function () { ctx.tamamla({ puan: 0, max: 0 }); ctx.ileri(); } });
  }
  function rozet(z, yazi) { return el('div', { class: 'ib-rozet z-' + z, text: yazi || (ISARET[z] + ' ' + KUTUP[z]) }); }
  function canliBolge(kap) { var d = el('div', { class: 'ib2-sr', 'aria-live': 'polite', role: 'status' }); kap.appendChild(d); return function (m) { d.textContent = ''; setTimeout(function () { d.textContent = m; }, 30); }; }
  function harman(a, b, w) {   /* iki #rrggbb rengi karıştırıp #rrggbb döndürür (bgGit için) */
    function ay(c) { var n = parseInt(c.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    var x = ay(a), y = ay(b), u = clamp(w, 0, 1), r = [0, 1, 2].map(function (i) { var v = Math.round(x[i] + (y[i] - x[i]) * u); return (v < 16 ? '0' : '') + v.toString(16); });
    return '#' + r.join('');
  }

  /* =====================================================================
     İBRE PAY — "Payı kime yazıyorsun?"
     Alanlar: huy, uclar{az,orta,fazla}, yesil, baslik, tetik, kisiler[4], ses{acilis,yonerge,az,orta,fazla,arkadas,yeniden}
     Sesler: v1 açılış, v2 yönerge, v3 az, v4 orta, v5 fazla, v6 arkadaşın payı çok küçük, v7 yeniden dağıt + kapanış
     ===================================================================== */
  var PAY_SES = { acilis: 'v1', yonerge: 'v2', az: 'v3', orta: 'v4', fazla: 'v5', arkadas: 'v6', yeniden: 'v7' };
  var PAY_METIN = {
    v1: 'Takımınız turnuvayı kazandı! Salondaki alkış tam yüz parça; bu alkışı kimlere yazarsın?',
    v2: 'Dört kişi var: sen ve üç arkadaşın. Kaydırıcılarla payları dağıt; toplam hep yüz kalır.',
    v3: 'Kendine çok az pay yazdın; ibre sola, tezellüle kaydı. Senin emeğin de bu kazanmanın içinde.',
    v4: 'Payların dengeli; ibre ortada, tevâzuda. Kendi emeğini de, arkadaşlarının emeğini de görüyorsun.',
    v5: 'Alkışın çoğunu kendine yazdın; ibre sağa, kibre kaydı. Arkadaşların da bu kazanmak için çok uğraştı.',
    v6: 'Bir arkadaşının payı çok küçük kaldı. Onun emeği de görünüyor mu, bir bak.',
    v7: 'İstersen payları yeniden dağıt. İbre bir karne değil; alkışı paylaşırken kendimize baktığımız bir aynadır.'
  };
  var PAY_RENK = ['#F4C95D', '#8FB8DE', '#B79CE0', '#7FCB9A'];
  function payT(p) { return clamp(p < 25 ? (p - 25) / 25 : (p - 25) / 55, -1, 1); }
  /** i. kişinin payını v yapar; kalan, diğerlerine mevcut oranlarıyla bölünür; toplam tam 100 kalır */
  function payDagit(p, i, v) {
    v = clamp(Math.round(v), 0, 100); var kalan = 100 - v, dig = [], top = 0, j, yeni = p.slice();
    for (j = 0; j < p.length; j++) if (j !== i) { dig.push(j); top += p[j]; }
    var ham = dig.map(function (x) { return top > 0 ? p[x] * kalan / top : kalan / dig.length; });
    var taban = ham.map(Math.floor), art = kalan - taban.reduce(function (a, b) { return a + b; }, 0);
    ham.map(function (h, n) { return { n: n, k: h - Math.floor(h) }; }).sort(function (a, b) { return b.k - a.k; }).slice(0, art).forEach(function (o) { taban[o.n]++; });
    yeni[i] = v; dig.forEach(function (x, n) { yeni[x] = taban[n]; });
    return yeni;
  }
  B.ibrePay = {
    canli: 'ortak', ortakDestek: true, zorunlu: true, xapiTur: 'assessment', max: function () { return 0; },
    ciz: function (ctx) {
      var b = ctx.blok, h = b.yesil || 0.26, T = temel(ctx, 'ib-sahne ibp'), saat = T.saat, S = T.S, svg = T.svg, A = T.A, sira = SiraOlustur(ctx, A);
      var uc = varsay(b.uclar, { az: 'Tezellül', orta: 'Tevâzu', fazla: 'Kibr' }), ses = varsay(b.ses, PAY_SES);
      var kisi = b.kisiler || ['Sen', 'Arkadaş 1', 'Arkadaş 2', 'Arkadaş 3'];
      var pay = [25, 25, 25, 25], kilit = false, tamam = false, bitti = false, yorumVar = false, ilkEtk = false;
      var bgHedef = BG.navy, bgSimdi = BG.navy, bgT = 1;
      saat.ekle(function (dt) { bgT = Math.min(1, bgT + dt / 500); S.zemin.setAttribute('fill', karisim(bgSimdi, bgHedef, yumusat(bgT))); });
      function bgGit(c) { bgSimdi = bgHedef; bgHedef = c; bgT = 0; }
      svg.appendChild(arkaHareket(svg, saat));
      var duyur = canliBolge(S.kap);

      /* başlık kartı */
      S.kap.appendChild(el('div', { class: 'ibp-ust' }, [el('h2', { text: b.baslik || 'Payı kime yazıyorsun?' }), el('p', { text: b.tetik || 'Takımınız kazandı! Alkış tam 100 parça: sen ve üç arkadaşın arasında paylaştır.' })]));

      /* dört figür + kaydırıcılar */
      var CX = [185, 465, 745, 1025], YER = 560, figs = [], poz = [], satirlar = [], araliklar = [], sayilar = [], eksiler = [], artilar = [];
      var gF = sv('g'); svg.appendChild(gF);
      kisi.forEach(function (ad, i) {
        var f = new Figur(gF, { x: CX[i], y: YER, boy: 250, renk: i === 0 ? '#F2EADB' : '#C9D3E8', vurgu: PAY_RENK[i], eylem: 'nefes', faz: i * 13, ters: i > 1 });
        figs.push(f); poz.push('nefes');
        var inp = el('input', { type: 'range', min: 0, max: 100, step: 1, value: 25, 'aria-label': ad + ' için alkış payı (toplam 100 parça)', style: { '--c': PAY_RENK[i] } });
        var say = el('output', { class: 'ibp-sayi', 'aria-hidden': 'true', text: '25' });
        var eksi = el('button', { class: 'ibp-pm', type: 'button', 'aria-label': ad + ': payı 5 parça azalt', text: '−' });
        var arti = el('button', { class: 'ibp-pm', type: 'button', 'aria-label': ad + ': payı 5 parça artır', text: '+' });
        inp.addEventListener('input', function () { if (kilit) return; yerel(i, +inp.value); });
        inp.addEventListener('change', function () { if (kilit) return; ctx.eylem('dagit', { p: pay.slice() }); });
        eksi.addEventListener('click', function () { if (kilit) return; ctx.eylem('dagit', { p: payDagit(pay, i, pay[i] - 5) }); });
        arti.addEventListener('click', function () { if (kilit) return; ctx.eylem('dagit', { p: payDagit(pay, i, pay[i] + 5) }); });
        var kap = el('div', { class: 'ibp-kisi' + (i === 0 ? ' sen' : ''), style: { left: (CX[i] - 125) + 'px', '--c': PAY_RENK[i] } }, [
          el('div', { class: 'ibp-ad' }, [el('b', { text: ad }), say]),
          el('div', { class: 'ibp-kontrol' }, [eksi, inp, arti])
        ]);
        S.kap.appendChild(kap); araliklar.push(inp); sayilar.push(say); eksiler.push(eksi); artilar.push(arti); satirlar.push(kap);
      });
      saat.ekle(function (dt, kk) { figs.forEach(function (f) { f.guncelle(REDUCED ? 24 : kk); }); });

      /* alkış çubuğu: 100 parça */
      svg.appendChild(sv('text', { x: 60, y: 696, 'font-family': FONT, 'font-weight': 800, 'font-size': 20, 'letter-spacing': 2, fill: '#F2EADB', opacity: 0.85, text: 'ALKIŞ · 100 PARÇA' }));
      var hucre = [], gB = sv('g'); svg.appendChild(gB);
      for (var n = 0; n < 100; n++) { var r = sv('rect', { x: 60 + n * 10.9, y: 704, width: 10.1, height: 34, rx: 3, fill: PAY_RENK[0], style: 'transition:fill .25s' }); gB.appendChild(r); hucre.push(r); }

      /* ibre + sağ sütun */
      var gG = sv('g'); svg.appendChild(gG);
      var kd = new Kadran(gG, saat, { x: 1372, y: 290, s: 0.9, h: h, etiket: uc, notr: false, tik: true });
      kd.etiketGoster(1);
      var sag = el('div', { class: 'ibp-sag' }); S.kap.appendChild(sag);
      var yaz = { durum: el('div', { class: 'ibp-durum' }) };

      function zonSimdi() { return zonDe(payT(pay[0]), h); }
      function pozAyarla() {
        var z = zonSimdi(), k = saat.ms() * 0.03;
        figs.forEach(function (f, i) {
          var e = i === 0 ? (z === 'az' ? 'egil' : z === 'fazla' ? 'isaret' : 'nefes') : (pay[i] < 10 ? 'dusun' : pay[i] >= 30 ? 'sevinc' : 'nefes');
          if (e !== poz[i]) { poz[i] = e; f.eylemYap(e, k, e === 'isaret' ? [0.12, -0.6] : undefined); }
        });
      }
      function goster(sessiz) {
        var z = zonSimdi(), t = payT(pay[0]), ucA = 0, i, j, s = 0;
        for (i = 0; i < 4; i++) {
          if (+araliklar[i].value !== pay[i]) araliklar[i].value = pay[i];
          sayilar[i].textContent = pay[i]; araliklar[i].setAttribute('aria-valuetext', pay[i] + ' parça');
          araliklar[i].disabled = kilit; eksiler[i].disabled = kilit || pay[i] <= 0; artilar[i].disabled = kilit || pay[i] >= 100;
          for (j = 0; j < pay[i]; j++) { if (hucre[s]) hucre[s].setAttribute('fill', PAY_RENK[i]); s++; }
        }
        kd.git(t, { kullanici: !sessiz, hizli: true }); kd.vurgu({ az: z === 'az' ? 1 : 0.4, orta: z === 'orta' ? 1 : 0.4, fazla: z === 'fazla' ? 1 : 0.4 });
        yaz.durum.innerHTML = ''; yaz.durum.appendChild(rozet(z, ISARET[z] + ' ' + uc[z].toUpperCase() + ' · senin payın ' + pay[0]));
        if (!yorumVar) bgGit(harman(BG.navy, BG[z], 0.35)); else bgGit(BG[z]);
        pozAyarla();
      }
      var sonZon = 'orta';
      function yerel(i, v) {   /* sürüklerken önizleme (eylem 'change'te gönderilir) */
        pay = payDagit(pay, i, v); goster(false); var z = zonSimdi(); if (z !== sonZon) { sonZon = z; duyur('İbre: ' + uc[z] + '. Senin payın ' + pay[0] + ', toplam 100.'); }
      }

      function sagCiz() {
        sag.innerHTML = '';
        sag.appendChild(yaz.durum);
        if (!tamam) {
          sag.appendChild(el('p', { class: 'ibp-ipucu', text: 'Kendi payın azsa ibre sola, çoksa sağa gider. İstediğin gibi dağıt; sonra “Tamam” de.' }));
          sag.appendChild(el('button', { class: 'dug ana ibp-tamam', type: 'button', text: 'Tamam, payları yazdım', onclick: function () { ctx.eylem('tamam', { p: pay.slice() }); } }));
          sag.appendChild(el('div', { class: 'ibp-alt' }, [
            el('button', { class: 'ib2-gec', type: 'button', text: 'Başa al', onclick: function () { if (!kilit) ctx.eylem('dagit', { p: [25, 25, 25, 25] }); } }),
            gecDugme(ctx, 'ibp-gec')]));
        } else {
          var z = zonSimdi(), kucuk = pay.slice(1).some(function (x) { return x < 10; });
          var p = el('div', { class: 'ibp-yorum' }, [el('p', { text: metinSes(A, ses[z], PAY_METIN[ses[z]]) }), kucuk ? el('p', { class: 'ib-not', text: metinSes(A, ses.arkadas, PAY_METIN[ses.arkadas]) }) : null]);
          sag.appendChild(p);
          sag.appendChild(el('div', { class: 'ib-sen-butonlar' }, [
            el('button', { class: 'dug ikincil', type: 'button', text: 'Yeniden dağıt', onclick: function () { ctx.eylem('yeniden', {}); } }),
            el('button', { class: 'dug ana', type: 'button', text: 'Devam →', onclick: function () { ctx.ileri(); } })
          ]));
        }
      }

      ctx.eylemTanimla('dagit', function (v, k) {
        if (kilit || !v.p || v.p.length !== 4) return;
        pay = v.p.map(function (x) { return clamp(Math.round(+x || 0), 0, 100); });
        var top = pay.reduce(function (a, c) { return a + c; }, 0); if (top !== 100) pay = [25, 25, 25, 25];
        goster(!!k.tekrar); if (!k.tekrar) Sfx.tok();
        if (k.yerel && !ilkEtk) { ilkEtk = true; ctx.etkiles('pay-dagit', 'Payları dağıtmaya başladı'); }
        var z = zonSimdi(); if (z !== sonZon) { sonZon = z; duyur('İbre: ' + uc[z] + '. Senin payın ' + pay[0] + ', toplam 100.'); }
      });
      ctx.eylemTanimla('tamam', function (v, k) {
        if (kilit) return;
        if (v.p && v.p.length === 4) { pay = v.p.slice(); }
        kilit = true; tamam = true; yorumVar = true; goster(!!k.tekrar); sagCiz(); var z = zonSimdi();
        if (!k.tekrar) { Sfx.vus(); titret(S.kap); if (z === 'orta') Sfx.parilti(); }
        duyur(metinSes(A, ses[z], PAY_METIN[ses[z]]));
        if (!k.tekrar) {
          var kucuk = pay.slice(1).some(function (x) { return x < 10; });
          sira([ses[z], kucuk ? ses.arkadas : null, ses.yeniden], 500);
        }
        if (k.yerel) {
          ctx.cevap({ oge: 'pay-dagilim', ad: (b.baslik || 'Payı kime yazıyorsun?') + ' — 100 parça alkış', yanit: 'Sen ' + pay[0] + ' · A ' + pay[1] + ' · B ' + pay[2] + ' · C ' + pay[3] + ' → ibre: ' + z, dogru: null, etkilesim: 'performance', puan: 0, max: 0 });
          if (!bitti) { bitti = true; ctx.tamamla({ puan: 0, max: 0 }); }
        }
      });
      ctx.eylemTanimla('yeniden', function (v, k) {
        sira.iptal(); kilit = false; tamam = false; yorumVar = false; goster(true); sagCiz();
        if (!k.tekrar) Sfx.pop(); setTimeout(function () { try { araliklar[0].focus({ preventScroll: true }); } catch (e) { } }, 40);
      });

      goster(true); sagCiz();
      ctx.zaman(function () { sira([ses.acilis, ses.yonerge], 0); }, 500);
      if (TEST) { window.__ibre = window.__ibre || {}; window.__ibre.pay = { durum: function () { return { pay: pay.slice(), zon: zonSimdi(), poz: poz.slice(), kilit: kilit, hedef: kd.hedef }; }, kd: kd }; }
      return { temizle: function () { sira.iptal(); }, anlatimDegisti: function (a) { A.degisti(a); } };
    }
  };

  /* =====================================================================
     İBRE GÜN — "Bir günün ibresi": 5 durak, her durakta 3 seçenek, gün grafiği
     Alanlar: huy, uclar, yesil, baslik, yonerge, ozetBaslik, ozetNot, duraklar[{id, ad, baslik, durum, ses, secenekler[{m, zon, t, not}]}], ses{acilis, son}
     Sesler: v1 açılış, v2…v6 durak girişleri, v7 kapanış
     ===================================================================== */
  var GUN_SES = { acilis: 'v1', son: 'v7' };
  var GUN_METIN = { v1: 'Okul çıkışından yatma vaktine kadar beş durağımız var. Her durakta ibre biraz oynar.', v7: 'İşte bugünün ibre yolu. İbre gün içinde oynar; bu normaldir, yarın yine ayarlanır.' };
  B.ibreGun = {
    canli: 'ortak', ortakDestek: true, zorunlu: true, xapiTur: 'assessment', max: function () { return 0; },
    ciz: function (ctx) {
      var b = ctx.blok, h = b.yesil || 0.26, T = temel(ctx, 'ib-sahne ibg'), saat = T.saat, S = T.S, svg = T.svg, A = T.A, sira = SiraOlustur(ctx, A);
      var uc = varsay(b.uclar, { az: 'Tesvîf', orta: 'Azim', fazla: 'Telaş' }), ses = varsay(b.ses, GUN_SES), dur = b.duraklar || [], N = dur.length;
      var sec = [], gt = [], ga = [], aktif = 0, faz = 'durak', yarin = null, ilkEtk = false, bitti = false, soylendi = {}, acilisSoyledi = false;
      var bgHedef = BG.navy, bgSimdi = BG.navy, bgT = 1;
      saat.ekle(function (dt) { bgT = Math.min(1, bgT + dt / 500); S.zemin.setAttribute('fill', karisim(bgSimdi, bgHedef, yumusat(bgT))); });
      function bgGit(c) { bgSimdi = bgHedef; bgHedef = c; bgT = 0; }
      svg.appendChild(arkaHareket(svg, saat));
      var duyur = canliBolge(S.kap);
      var gG = sv('g'); svg.appendChild(gG);
      var kd = new Kadran(gG, saat, { x: 440, y: 308, s: 1.05, h: h, etiket: uc, notr: true }); kd.etiketGoster(1);

      /* — gün çizgisi grafiği (sol alt) — */
      var PX = [200, 338, 476, 614, 752], CY = 552, GENLIK = 134;
      var gc = sv('g'); svg.appendChild(gc);
      gc.appendChild(sv('rect', { x: 50, y: 396, width: 780, height: 352, rx: 30, fill: 'rgba(255,255,255,0.07)', stroke: 'rgba(255,255,255,0.22)', 'stroke-width': 2 }));
      gc.appendChild(sv('text', { x: 78, y: 430, 'font-family': FONT, 'font-weight': 800, 'font-size': 21, 'letter-spacing': 2, fill: '#F4C95D', text: 'GÜN ÇİZGİSİ' }));
      var BANT = [['fazla', 442, 517], ['orta', 517, 587], ['az', 587, 686]];
      BANT.forEach(function (x) { gc.appendChild(sv('rect', { x: 150, y: x[1], width: 640, height: x[2] - x[1], fill: ZON[x[0]], opacity: 0.26 })); });
      [['fazla', 480], ['orta', 557], ['az', 643]].forEach(function (x) { gc.appendChild(sv('text', { x: 142, y: x[1], 'text-anchor': 'end', 'font-family': FONT, 'font-weight': 800, 'font-size': 17, fill: '#F2EADB', text: ISARET[x[0]] + ' ' + uc[x[0]] })); });
      gc.appendChild(sv('line', { x1: 150, y1: CY, x2: 790, y2: CY, stroke: '#F2EADB', 'stroke-opacity': 0.3, 'stroke-dasharray': '6 8', 'stroke-width': 2 }));
      var tikler = [], hat = [], nok = [], sim = sv('circle', { r: 18, fill: 'none', stroke: '#F4C95D', 'stroke-width': 4, cy: 700 });
      var gl = sv('g'); gc.appendChild(gl);
      dur.forEach(function (d, i) {
        gc.appendChild(sv('line', { x1: PX[i], y1: 442, x2: PX[i], y2: 686, stroke: '#F2EADB', 'stroke-opacity': 0.12, 'stroke-width': 2 }));
        var c = sv('circle', { cx: PX[i], cy: 705, r: 14, fill: 'rgba(255,255,255,0.16)', stroke: '#fff', 'stroke-opacity': 0.6, 'stroke-width': 2 }); gc.appendChild(c);
        gc.appendChild(sv('text', { x: PX[i], y: 711, 'text-anchor': 'middle', 'font-family': FONT, 'font-weight': 900, 'font-size': 17, fill: '#fff', text: String(i + 1) }));
        gc.appendChild(sv('text', { x: PX[i], y: 738, 'text-anchor': 'middle', 'font-family': FONT, 'font-weight': 800, 'font-size': 16, fill: '#F2EADB', text: d.ad }));
        tikler.push(c);
        sec.push(null); gt.push(0); ga.push(0);
      });
      gc.appendChild(sim);
      for (var q = 0; q < N; q++) { hat.push(sv('line', { stroke: '#F2EADB', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0 })); gl.appendChild(hat[q]); }
      for (q = 0; q < N; q++) { var c2 = sv('circle', { r: 14, fill: '#fff', stroke: '#fff', 'stroke-width': 4, opacity: 0 }); gl.appendChild(c2); nok.push(c2); }
      function yDe(t) { return CY - t * GENLIK; }
      saat.ekle(function (dt, kk) {
        var kat = REDUCED ? 1 : Math.min(1, dt / 160), i, onc = -1;
        for (i = 0; i < N; i++) {
          var s = sec[i], hedefA = s && !s.atla ? 1 : 0;
          if (s && !s.atla) {
            gt[i] += (s.t - gt[i]) * kat; ga[i] += (hedefA - ga[i]) * Math.min(1, REDUCED ? 1 : dt / 130);
            nok[i].setAttribute('cx', PX[i]); nok[i].setAttribute('cy', yDe(gt[i])); nok[i].setAttribute('fill', ZON[s.zon]);
            nok[i].setAttribute('r', 14 * (0.4 + 0.6 * Math.min(1.12, ga[i]))); nok[i].setAttribute('opacity', clamp(ga[i] * 2, 0, 1));
            if (onc >= 0) {
              var a1 = ga[i], x0 = PX[onc], y0 = yDe(gt[onc]), x1 = PX[i], y1 = yDe(gt[i]), atlanan = i - onc > 1;
              hat[i].setAttribute('x1', x0); hat[i].setAttribute('y1', y0); hat[i].setAttribute('x2', lerp(x0, x1, Math.min(1, a1))); hat[i].setAttribute('y2', lerp(y0, y1, Math.min(1, a1)));
              hat[i].setAttribute('opacity', atlanan ? 0.55 : 0.9); hat[i].setAttribute('stroke-dasharray', atlanan ? '4 10' : '');
            } else hat[i].setAttribute('opacity', 0);
            onc = i;
          } else { ga[i] = 0; nok[i].setAttribute('opacity', 0); hat[i].setAttribute('opacity', 0); gt[i] = 0; }
          tikler[i].setAttribute('fill', s && s.atla ? 'rgba(255,255,255,0.05)' : (s ? ZON[s.zon] : 'rgba(255,255,255,0.16)'));
        }
        if (faz === 'durak') { sim.setAttribute('cx', PX[aktif]); sim.setAttribute('opacity', 1); sim.setAttribute('r', REDUCED ? 19 : 19 + 3 * Math.sin(kk / 9)); } else sim.setAttribute('opacity', 0);
      });

      /* — sağ panel — */
      var panel = el('div', { class: 'ibg-panel' }); S.kap.appendChild(panel);
      function adimlar() {
        var kutu = el('div', { class: 'ibg-adimlar', role: 'group', 'aria-label': 'Duraklar' });
        dur.forEach(function (d, i) {
          var s = sec[i], dur2 = s ? (s.atla ? 'atlandı' : 'seçildi: ' + ADLAR[s.zon]) : 'henüz yok';
          kutu.appendChild(el('button', { class: 'ibg-adim' + (faz === 'durak' && i === aktif ? ' simdi' : '') + (s && !s.atla ? ' z-' + s.zon : '') + (s && s.atla ? ' atla' : ''), type: 'button', 'aria-label': 'Durak ' + (i + 1) + ': ' + d.ad + ' (' + dur2 + ')', 'aria-current': faz === 'durak' && i === aktif ? 'step' : null, text: String(i + 1), onclick: function () { ctx.eylem('git', { d: i }); } }));
        });
        return kutu;
      }
      function ibreKur(i) {
        var s = sec[i];
        if (s && !s.atla) { kd.git(s.t); kd.vurgu({ az: s.zon === 'az' ? 1 : 0.35, orta: s.zon === 'orta' ? 1 : 0.35, fazla: s.zon === 'fazla' ? 1 : 0.35 }); bgGit(BG[s.zon]); }
        else { kd.git(0); kd.vurgu({ az: 0.5, orta: 0.5, fazla: 0.5 }); bgGit(BG.navy); }
      }
      function durakCiz(tekrar) {
        var d = dur[aktif], s = sec[aktif]; faz = 'durak'; panel.innerHTML = ''; panel.classList.remove('genis');
        var kutu = el('div', { class: 'ibg-sec', role: 'group', 'aria-label': 'Seçenekler' });
        d._sira = d._sira || ctx.karistir(d.secenekler.map(function (o, j) { return j; }), 'gun' + aktif);
        d._sira.forEach(function (j) {
          var o = d.secenekler[j], secili = s && !s.atla && s.i === j;
          kutu.appendChild(el('button', { class: 'ibg-btn' + (secili ? ' secili' : ''), type: 'button', 'data-i': j, 'aria-pressed': secili ? 'true' : 'false', onclick: function () { ctx.eylem('sec', { d: aktif, i: j }); } }, [el('span', { class: 'ib-sen-ok', text: secili ? '✓' : '•' }), el('span', { text: '“' + o.m + '”' })]));
        });
        var alt = el('div', { class: 'ibg-alt' });
        alt.appendChild(el('button', { class: 'ibg-atla', type: 'button', text: s && s.atla ? 'Bu durağı atladın (yine seçebilirsin)' : 'Bu durağı atla', onclick: function () { ctx.eylem('atla', { d: aktif }); } }));
        if (s) alt.appendChild(el('button', { class: 'dug ana', type: 'button', text: aktif < N - 1 ? 'Sonraki durak →' : 'Günün özeti →', onclick: function () { ctx.eylem('sonraki', { d: aktif }); } }));
        DO.ekle(panel, [adimlar(), el('span', { class: 'ib-sen-no', text: 'Durak ' + (aktif + 1) + '/' + N }), el('h3', { text: d.baslik || d.ad }), el('p', { class: 'ibg-durum', text: d.durum }),
          el('div', { class: 'ib-sen-sorus', text: 'Ne yaparsın? Birini seç; istersen sonra değiştirirsin.' }), kutu,
          s && !s.atla ? el('p', { class: 'ib-not', text: d.secenekler[s.i].not || '' }) : null, alt]);
        ibreKur(aktif);
      }
      function ozetCiz() {
        faz = 'ozet'; panel.innerHTML = ''; panel.classList.add('genis');
        var say = { az: 0, orta: 0, fazla: 0 }, atl = 0, sn = 0;
        sec.forEach(function (s) { if (!s) return; if (s.atla) atl++; else { say[s.zon]++; sn++; } });
        var bos = N - sn - atl; atl += bos;
        var parca = [];
        if (!sn) parca.push('Bugün hiçbir durakta ibreyi yerleştirmedin; bu da bir seçim. İstersen bir durağa dönüp bakabilirsin.');
        else {
          var kk = [];
          if (say.orta) kk.push(say.orta + ' durakta kararında');
          if (say.az) kk.push(say.az + ' durakta sol uca (' + uc.az + ')');
          if (say.fazla) kk.push(say.fazla + ' durakta sağ uca (' + uc.fazla + ')');
          parca.push('İbre ' + kk.join(', ') + ' yakındı.' + (atl ? ' ' + atl + ' durağı atladın; bu da serbest.' : ''));
        }
        var yar = el('div', { class: 'ibg-yarin', role: 'group', 'aria-label': 'Yarın hangi durakta ibreyi ayarlamak istersin?' });
        dur.forEach(function (d, i) { yar.appendChild(el('button', { class: 'ibg-chip' + (yarin === i ? ' secili' : ''), type: 'button', 'aria-pressed': yarin === i ? 'true' : 'false', text: d.ad, onclick: function () { ctx.eylem('yarin', { d: i }); } })); });
        DO.ekle(panel, [adimlar(), el('span', { class: 'ib-sen-no', text: b.ozetBaslik || 'Bugünün ibre yolu' }), el('h3', { text: 'İbre gün içinde oynar, bu normaldir.' }),
          el('p', { class: 'ibg-durum', text: parca.join(' ') }),
          el('div', { class: 'ib-sen-sorus', text: 'İstersen: yarın hangi durakta ibreni biraz ayarlamak istersin?' }), yar,
          el('div', { class: 'ib-sen-butonlar' }, [el('button', { class: 'dug ana', type: 'button', text: 'Devam →', onclick: function () { ctx.ileri(); } })])]);
        kd.git(0); kd.vurgu({ az: 0.5, orta: 0.5, fazla: 0.5 }); bgGit(BG.navy);
      }
      function tamamla() { if (!bitti) { bitti = true; ctx.tamamla({ puan: 0, max: 0 }); } }
      function etk(k) { if (k.yerel && !ilkEtk) { ilkEtk = true; ctx.etkiles('gun-basla', 'Gün çizgisinde ilk hareket'); } }
      function giris(i, k) {   /* durak girişi sesi (ilk gelişte) */
        if (k.tekrar || soylendi[i]) return; soylendi[i] = 1;
        var l = []; if (!acilisSoyledi) { acilisSoyledi = true; l.push(ses.acilis); } l.push(dur[i].ses); sira(l, 450);
      }

      ctx.eylemTanimla('sec', function (v, k) {
        var d = dur[v.d], o = d && d.secenekler[v.i]; if (!o) return; aktif = v.d;
        gt[v.d] = kd.x || 0; sec[v.d] = { i: v.i, zon: o.zon, t: o.t != null ? o.t : MERKEZ[o.zon] };
        if (faz !== 'durak') faz = 'durak'; durakCiz(k.tekrar); if (!k.tekrar) { Sfx.vus(); titret(S.kap); if (o.zon === 'orta') Sfx.parilti(); }
        duyur('İbre: ' + uc[o.zon] + '. ' + (o.not || ''));
        etk(k); if (k.yerel) { ctx.cevap({ oge: 'gun-' + (d.id || (v.d + 1)), ad: d.ad + ' — ' + d.durum, yanit: o.m + ' (' + o.zon + ')', dogru: null, etkilesim: 'choice', puan: 0, max: 0 }); tamamla(); }
      });
      ctx.eylemTanimla('atla', function (v, k) {
        var d = dur[v.d]; if (!d) return; aktif = v.d; sec[v.d] = { atla: true }; faz = 'durak'; durakCiz(k.tekrar);
        if (!k.tekrar) Sfx.pop(); etk(k); if (k.yerel) { ctx.cevap({ oge: 'gun-' + (d.id || (v.d + 1)), ad: d.ad + ' — ' + d.durum, yanit: 'atlandı', dogru: null, etkilesim: 'other', puan: 0, max: 0 }); tamamla(); }
      });
      ctx.eylemTanimla('git', function (v, k) {
        if (v.d < 0 || v.d >= N) return; aktif = v.d; if (!k.tekrar) { sira.iptal(); Sfx.tok(); } durakCiz(k.tekrar); giris(aktif, k);
      });
      ctx.eylemTanimla('sonraki', function (v, k) {
        if (!sec[v.d]) return;
        if (v.d < N - 1) { aktif = v.d + 1; if (!k.tekrar) { sira.iptal(); Sfx.tok(); } durakCiz(k.tekrar); giris(aktif, k); return; }
        if (!k.tekrar) { Sfx.yuk(); sira.iptal(); sira([ses.son], 500); } ozetCiz(); tamamla();
        if (k.yerel) ctx.cevap({ oge: 'gun-yol', ad: 'Bugünün ibre yolu', yanit: sec.map(function (s) { return s ? (s.atla ? 'atla' : s.zon) : '-'; }).join(' · '), dogru: null, etkilesim: 'performance', puan: 0, max: 0 });
      });
      ctx.eylemTanimla('yarin', function (v, k) {
        yarin = v.d; ozetCiz(); if (!k.tekrar) Sfx.pop();
        if (k.yerel) ctx.cevap({ oge: 'gun-yarin', ad: 'Yarın hangi durakta ibreni ayarlamak istersin?', yanit: dur[v.d] ? dur[v.d].ad : '', dogru: null, etkilesim: 'choice', puan: 0, max: 0 });
      });

      durakCiz(true); ctx.zaman(function () { giris(0, { tekrar: false }); }, 500);
      if (TEST) { window.__ibre = window.__ibre || {}; window.__ibre.gun = { durum: function () { return { aktif: aktif, faz: faz, sec: JSON.parse(JSON.stringify(sec)), hedef: kd.hedef }; }, kd: kd }; }
      return { temizle: function () { sira.iptal(); }, anlatimDegisti: function (a) { A.degisti(a); } };
    }
  };

  /* =====================================================================
     İBRE NEFES — öfke ölçeği: oyun parçan bozuldu, ibre sağa (Hiddet) kayar; nefes alarak ortaya (Hilm) iner
     Alanlar: huy, uclar{az,orta,fazla}, yesil, baslik, tetik, soru, secenekler[{m, zon, sonuc, not, ses}], ses{acilis, yonerge, ipucu, yatisti, soru}
     Sesler: v1 açılış (parça bozulur), v2 yönerge, v3 nefes ipucu, v4 yatıştı, v5 soru, v6/v7/v8 sonuç (az/orta/fazla)
     Kaybetme yok: ibre uca gelse de nefesle toparlanır; hiçbir şey zorunlu değil.
     ===================================================================== */
  var NEFES_SES = { acilis: 'v1', yonerge: 'v2', ipucu: 'v3', yatisti: 'v4', soru: 'v5' };
  var NEFES_METIN = {
    v1: 'Arkadaşın, çok sevdiğin oyun parçanı bozdu. Bak, ibre kendiliğinden sağa kayıyor.',
    v2: 'Kızmak herkesin yaşadığı bir duygu; sorun değil. “Nefes al” düğmesine basılı tut; istersen yalnızca halkayı izle.',
    v3: 'Yavaşça nefes al. Sonra yavaşça ver.',
    v4: 'Bak, ibre ortaya geldi. Buna hilm diyoruz: kızgınlıkta bile sakin kalabilmek.',
    v5: 'Şimdi arkadaşına ne söylersin? Üç yoldan birini seç.',
    v6: 'Umursamıyormuş gibi yapınca ibre sola kaydı. Seni neyin üzdüğünü arkadaşın bilemedi.',
    v7: 'Sakin ve net konuşunca ibre ortada kaldı. Arkadaşın seni dinledi; ikiniz de çözüm düşünebildiniz.',
    v8: 'Bağırıp suçlayınca ibre yine sağa kaydı. Arkadaşın savunmaya geçti ve söylemek istediğin şey duyulmadı.'
  };
  var NEFES_SEC = [
    { m: 'Önemli değil, boşver.', zon: 'az', ses: 'v6' },
    { m: 'Bu parça benim için önemliydi. Bir dahaki sefere önce bana sor, lütfen.', zon: 'orta', ses: 'v7' },
    { m: 'Hep yapıyorsun bunu! Hiç dikkat etmiyorsun, hep senin yüzünden!', zon: 'fazla', ses: 'v8' }
  ];
  var NEFES_TEPKI = { az: { kisi: 'yaslan', arkadas: 'nefes', ibre: -0.72 }, orta: { kisi: 'konus', arkadas: 'dusun', ibre: 0 }, fazla: { kisi: 'isaret', arkadas: 'saskin', ibre: 0.72 } };
  B.ibreNefes = {
    canli: 'bireysel', zorunlu: true, xapiTur: 'assessment', max: function () { return 0; },
    ciz: function (ctx) {
      var b = ctx.blok, h = b.yesil || 0.26, T = temel(ctx, 'ib-sahne ibn'), saat = T.saat, S = T.S, svg = T.svg, A = T.A, sira = SiraOlustur(ctx, A);
      var uc = varsay(b.uclar, { az: 'Kayıtsızlık', orta: 'Hilm', fazla: 'Hiddet' }), ses = varsay(b.ses, NEFES_SES), secenekler = b.secenekler || NEFES_SEC;
      var a = 0, faz = 'giris', tut = false, halka = 0, rehber = false, rehberFaz = 'al', bos = 0, ilkBasma = false, ipucuSoylendi = false, bitti = false, ilkEtk = false, yatisSure = 0, secildi = -1;
      var tekrarSesi = false, kickT = -1, kirikT = -1, kickBas = 0, KICK = 2200, secenekSirasi = null, bgHedef = BG.navy, bgSimdi = BG.navy, bgT = 1;
      var duyur = canliBolge(S.kap), nefesMs = 0;
      saat.ekle(function (dt) {
        bgT = Math.min(1, bgT + dt / 500);
        var ham = karisim(bgSimdi, bgHedef, yumusat(bgT));
        S.zemin.setAttribute('fill', faz === 'giris' || faz === 'nefes' ? karisim(BG.navy, BG.fazla, clamp(a * 0.75, 0, 0.75)) : ham);
      });
      function bgGit(c) { bgSimdi = bgHedef; bgHedef = c; bgT = 0; }
      svg.appendChild(arkaHareket(svg, saat));

      /* sahne: zemin + iki figür + bozulan oyun parçası */
      var YER = 735, gS = sv('g'); svg.appendChild(gS);
      gS.appendChild(sv('rect', { x: 0, y: YER + 6, width: 800, height: 24, fill: 'rgba(0,0,0,0.18)' }));
      var ana = new Figur(gS, { x: 235, y: YER, boy: 300, vurgu: '#F4C95D', eylem: 'nefes' });
      var arkadas = new Figur(gS, { x: 655, y: YER, boy: 300, renk: '#C9D3E8', vurgu: '#8FB8DE', eylem: 'nefes', ters: true, faz: 17 });
      var parca = sv('g', { transform: 'translate(445 ' + (YER - 4) + ')' }); gS.appendChild(parca);
      var pBas = sv('circle', { cx: 0, cy: -62, r: 24, fill: '#F4C95D' }), pGovde = sv('path', { d: 'M-17 -42 Q-8 -20 -26 -2 L26 -2 Q8 -20 17 -42 Z', fill: '#F4C95D' }), pTaban = sv('rect', { x: -32, y: -4, width: 64, height: 12, rx: 6, fill: '#E8A33D' });
      var catlak = sv('path', { d: 'M-6 -88 L4 -70 L-5 -56 L5 -44', fill: 'none', stroke: '#14264A', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0 });
      parca.appendChild(pGovde); parca.appendChild(pTaban); parca.appendChild(pBas); parca.appendChild(catlak);
      var kirik = 0;   /* 0 = sağlam, 1 = bozuk */
      function parcaCiz() {
        var u = yumusat(kirik);
        pBas.setAttribute('transform', 'translate(' + (52 * u) + ' ' + (36 * u) + ') rotate(' + (38 * u) + ' 0 -62)'); pGovde.setAttribute('transform', 'rotate(' + (-12 * u) + ' 0 -2)'); catlak.setAttribute('opacity', u);
      }
      saat.ekle(function (dt, kk) {
        var k = REDUCED ? 24 : kk; ana.guncelle(k); arkadas.guncelle(k);
        if (kirikT >= 0 && kirik < 1) { kirik = Math.min(1, kirik + dt / 380); parcaCiz(); }
      });

      /* başlık kartı (sol üst) */
      var kart = el('div', { class: 'ibn-kart', 'aria-live': 'polite' }); S.kap.appendChild(kart);
      function kartYaz(bas, metin) { kart.innerHTML = ''; DO.ekle(kart, [el('h2', { text: bas }), el('p', { text: metin })]); }
      kartYaz(b.baslik || 'Oyun parçan bozuldu', b.tetik || 'Arkadaşın, çok sevdiğin oyun parçanı bozdu. İbreye bak: o ne yapıyor?');

      /* ibre */
      var gG = sv('g'); svg.appendChild(gG);
      var kd = new Kadran(gG, saat, { x: 1170, y: 292, s: 1.0, h: h, etiket: uc, notr: false }); kd.etiketGoster(1); kd.git(0, { anlik: true });

      /* nefes halkası (SVG) + düğme (HTML) */
      var CXH = 1170, CYH = 566, gH = sv('g', { opacity: 0 }); svg.appendChild(gH);
      gH.appendChild(sv('circle', { cx: CXH, cy: CYH, r: 104, fill: 'none', stroke: 'rgba(255,255,255,0.35)', 'stroke-width': 3, 'stroke-dasharray': '6 9' }));
      var ic = sv('circle', { cx: CXH, cy: CYH, r: 40, fill: ZON.orta, opacity: 0.85 }); gH.appendChild(ic);
      var halkaYazi = sv('text', { x: CXH, y: CYH + 10, 'text-anchor': 'middle', 'font-family': FONT, 'font-weight': 900, 'font-size': 28, fill: '#fff', text: '' }); gH.appendChild(halkaYazi);
      var nefesKap = el('div', { class: 'ibn-nefes', style: { display: 'none' } });
      var dugme = el('button', { class: 'dug ana ibn-dugme', type: 'button', 'aria-pressed': 'false', 'aria-describedby': 'ibn-ipucu', text: 'Nefes al' });
      var ipucu = el('p', { class: 'ibn-ipucu', id: 'ibn-ipucu', text: 'Basılı tut (Boşluk tuşu da olur). İstersen yalnızca halkayı izle; o da ibreyi indirir.' });
      nefesKap.appendChild(dugme); nefesKap.appendChild(ipucu); S.kap.appendChild(nefesKap);
      var panel = el('div', { class: 'ibn-panel', style: { display: 'none' } }); S.kap.appendChild(panel);
      var gec = gecDugme(ctx, 'ibn-gec'); S.kap.appendChild(gec);

      /* nefes sesi (kısık; ♫/efekt kapalıysa çalmaz) */
      function nefesSes(al) {
        var x = Sfx.ac(); if (!x || REDUCED) return;
        try {
          var t = x.currentTime, o = x.createOscillator(), g = x.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(al ? 196 : 262, t); o.frequency.exponentialRampToValueAtTime(al ? 262 : 174, t + 1.2);
          g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
          o.connect(g); g.connect(x.destination); o.start(t); o.stop(t + 1.4);
        } catch (e) { }
      }

      function ibreGuncelle() { kd.git(a); }
      function nefesBaslat() {
        faz = 'nefes'; nefesKap.style.display = ''; gH.setAttribute('opacity', 1); kartYaz('Nefes zamanı', 'İbre sağda; sorun değil. Nefes aldıkça ibre ortaya iner. Acelen yok.');
        ana.eylemYap('nefes', saat.ms() * 0.03); arkadas.eylemYap('nefes', saat.ms() * 0.03);
        if (!tekrarSesi) sira([ses.yonerge], 250); try { dugme.focus({ preventScroll: true }); } catch (e) { }
      }
      function yatis() {
        faz = 'yatisti'; yatisSure = 0; nefesKap.style.display = 'none'; gH.setAttribute('opacity', 0); tut = false; rehber = false;
        bgGit(BG.orta); Sfx.tik(); Sfx.parilti();
        kartYaz('İbre ortada: Hilm', 'Kızgınlık yatıştı. Şimdi düşünerek konuşabilirsin.');
        ana.eylemYap('nefes', saat.ms() * 0.03); arkadas.eylemYap('nefes', saat.ms() * 0.03);
        duyur('İbre ortaya geldi: hilm.');
        var s = sira([ses.yatisti, ses.soru], 400);
        ctx.zaman(function () { if (faz === 'yatisti') soruCiz(); }, Math.max(1500, (A.ses[ses.yatisti] ? A.sure(ses.yatisti) * 1000 : 1500) + 700));
        ctx.etkiles('nefes-yatisti', 'İbre ortaya indi (hilm)', { sureMs: Math.round(nefesMs) });
      }
      function soruCiz() {
        faz = 'soru'; panel.style.display = ''; panel.innerHTML = ''; panel.classList.remove('genis');
        secenekSirasi = secenekSirasi || ctx.karistir(secenekler.map(function (o, i) { return i; }), 'nefes-soylem');
        var kutu = el('div', { class: 'ib-sen-sec', role: 'group', 'aria-label': 'Ne söylersin?' });
        secenekSirasi.forEach(function (i) {
          kutu.appendChild(el('button', { class: 'ib-sen-btn', type: 'button', 'data-i': i, onclick: function () { ctx.eylem('sec', { i: i }); } }, [el('span', { class: 'ib-sen-ok', text: '•' }), el('span', { text: '“' + secenekler[i].m + '”' })]));
        });
        DO.ekle(panel, [el('h3', { text: 'Ne söylersin?' }), el('div', { class: 'ib-sen-sorus', text: 'Birini seç; istersen sonra diğerlerine de bakarsın.' }), kutu]);
        var d0 = panel.querySelector('button'); if (d0) { try { d0.focus({ preventScroll: true }); } catch (e) { } }
      }
      function sonucCiz(i, tekrar) {
        faz = 'sonuc'; secildi = i; var o = secenekler[i], t = NEFES_TEPKI[o.zon], k = saat.ms() * 0.03;
        panel.style.display = ''; panel.innerHTML = '';
        kd.vurgu({ az: o.zon === 'az' ? 1 : 0.35, orta: o.zon === 'orta' ? 1 : 0.35, fazla: o.zon === 'fazla' ? 1 : 0.35 }); a = Math.max(0, t.ibre); kd.git(t.ibre);
        bgGit(BG[o.zon]); ana.eylemYap(t.kisi, k, o.zon === 'fazla' ? [0.62, -0.78] : undefined); arkadas.eylemYap(t.arkadas, k);
        var sonuc = metinSes(A, o.ses, NEFES_METIN[o.ses]);
        kartYaz(o.zon === 'az' ? 'İbre sola kaydı: ' + uc.az : o.zon === 'fazla' ? 'İbre sağa kaydı: ' + uc.fazla : 'İbre ortada: ' + uc.orta, o.zon === 'orta' ? 'Sakin ve net konuşmak, hilmin sesidir.' : 'Aynı durum, farklı ibre. İstersen başka bir yol dene.');
        DO.ekle(panel, [rozet(o.zon), el('p', { class: 'ib-sen-secim', text: 'Sen: “' + o.m + '”' }), el('h3', { text: sonuc }),
          el('div', { class: 'ib-sen-butonlar' }, [
            el('button', { class: 'dug ikincil', type: 'button', text: '← Başka söz', onclick: function () { ctx.eylem('don', {}); } }),
            el('button', { class: 'dug ikincil', type: 'button', text: 'Baştan nefes al', onclick: function () { ctx.eylem('bastan', {}); } }),
            el('button', { class: 'dug ana', type: 'button', text: 'Devam →', onclick: function () { ctx.ileri(); } })])]);
        if (!tekrar) { Sfx.vus(); titret(S.kap); if (o.zon === 'orta') Sfx.parilti(); sira([o.ses], 450); }
        duyur(sonuc);
      }

      /* ana sim: her kare */
      saat.ekle(function (dt) {
        var ds = dt / 1000;
        if (faz === 'giris') {
          if (kickT >= 0) {
            var u = clamp((saat.ms() - kickBas) / KICK, 0, 1); a = Math.max(a, yumusat(u));
            ibreGuncelle();
            if (u >= 1 && !bitti) { bitti = true; nefesBaslat(); }
          }
        } else if (faz === 'nefes') {
          nefesMs += dt;
          var al = tut || (rehber && rehberFaz === 'al');
          halka = al ? Math.min(1, halka + ds / 4) : Math.max(0, halka - ds / 4.5);
          if (rehber && !tut) { if (rehberFaz === 'al' && halka >= 1) rehberFaz = 'ver'; else if (rehberFaz === 'ver' && halka <= 0) { rehberFaz = 'al'; nefesSes(true); } }
          var hiz = 0;
          if (tut) hiz = halka < 1 ? 0.09 : 0.03; else if (rehber) hiz = rehberFaz === 'al' ? 0.035 : 0.03; else if (halka > 0) hiz = 0.07;
          a = Math.max(0, a - hiz * ds);
          if (!tut && !rehber && halka <= 0.001) { bos += ds; if (bos > 2.6) { rehber = true; rehberFaz = 'al'; halka = 0; nefesSes(true); } }
          ibreGuncelle();
          var r = 40 + 62 * (REDUCED ? (al ? 1 : 0.2) : yumusat(halka));
          ic.setAttribute('r', r); ic.setAttribute('opacity', 0.55 + 0.4 * halka);
          halkaYazi.textContent = tut ? (halka < 1 ? 'Nefes al…' : 'Tut…') : rehber ? (rehberFaz === 'al' ? 'Nefes al…' : 'Nefes ver…') : halka > 0 ? 'Nefes ver…' : '';
          dugme.classList.toggle('basili', tut);
          if (a < 0.17) yatis();
        } else if (faz === 'yatisti') { a = Math.max(0, a - 0.5 * ds); ibreGuncelle(); }
      });

      /* düğme + Boşluk tuşu: basılı tut */
      function bas(k) {
        if (faz !== 'nefes') return; ctx.eylem('nefes', { b: 1 });
      }
      function birak() { if (faz !== 'nefes' || !tut) return; ctx.eylem('nefes', { b: 0 }); }
      dugme.addEventListener('pointerdown', function (e) { if (e.button > 0) return; e.preventDefault(); try { dugme.setPointerCapture(e.pointerId); } catch (x) { } bas(); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) { dugme.addEventListener(n, function () { birak(); }); });
      dugme.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      dugme.addEventListener('keydown', function (e) { if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) bas(); } });
      dugme.addEventListener('keyup', function (e) { if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); birak(); } });
      function belgeTus(e, asagi) {
        if ((e.key !== ' ' && e.code !== 'Space') || e.altKey || e.ctrlKey || e.metaKey || faz !== 'nefes') return;
        var ae = document.activeElement; if (ae && ae !== document.body && /^(BUTTON|INPUT|SELECT|TEXTAREA|A)$/.test(ae.tagName)) return;
        e.preventDefault(); if (asagi) { if (!e.repeat) bas(); } else birak();
      }
      var kd1 = function (e) { belgeTus(e, true); }, ku1 = function (e) { belgeTus(e, false); };
      document.addEventListener('keydown', kd1); document.addEventListener('keyup', ku1);
      window.addEventListener('blur', birak);
      ctx.oynatici.temizlikler.push(function () { document.removeEventListener('keydown', kd1); document.removeEventListener('keyup', ku1); window.removeEventListener('blur', birak); });

      ctx.eylemTanimla('nefes', function (v, k) {
        if (faz !== 'nefes') return;
        if (v.b) {
          tut = true; rehber = false; bos = 0; dugme.setAttribute('aria-pressed', 'true'); if (!k.tekrar) nefesSes(true);
          if (!ilkBasma) { ilkBasma = true; if (!k.tekrar && !ipucuSoylendi) { ipucuSoylendi = true; sira([ses.ipucu], 150); } if (k.yerel) { if (!ilkEtk) { ilkEtk = true; ctx.etkiles('nefes-basla', 'Nefes al düğmesine ilk basış'); } ctx.tamamla({ puan: 0, max: 0 }); } }
        } else { tut = false; bos = 0; dugme.setAttribute('aria-pressed', 'false'); if (!k.tekrar) nefesSes(false); }
      });
      ctx.eylemTanimla('sec', function (v, k) {
        if (faz !== 'soru' && faz !== 'sonuc') return; var o = secenekler[v.i]; if (!o) return;
        sonucCiz(v.i, !!k.tekrar);
        if (k.yerel) { ctx.cevap({ oge: 'nefes-soylem', ad: 'Ne söylersin? (oyun parçanı bozan arkadaşa)', yanit: o.m + ' (' + o.zon + ')', dogru: null, etkilesim: 'choice', puan: 0, max: 0 }); ctx.tamamla({ puan: 0, max: 0 }); }
      });
      ctx.eylemTanimla('don', function () { sira.iptal(); if (faz === 'sonuc') { kd.git(0); kd.vurgu({ az: 0.5, orta: 0.5, fazla: 0.5 }); bgGit(BG.orta); a = 0; ana.eylemYap('nefes', saat.ms() * 0.03); arkadas.eylemYap('nefes', saat.ms() * 0.03); soruCiz(); } });
      ctx.eylemTanimla('bastan', function (v, k) {
        sira.iptal(); faz = 'giris'; bitti = false; tekrarSesi = true; a = 0; kirik = 1; kirikT = 1; kickT = 1; kickBas = saat.ms(); tut = false; halka = 0; rehber = false; bos = 0; nefesMs = 0; ilkBasma = true;
        panel.style.display = 'none'; nefesKap.style.display = 'none'; gH.setAttribute('opacity', 0); kd.vurgu({ az: 1, orta: 1, fazla: 1 }); kd.otoVurgu();
        kartYaz(b.baslik || 'Oyun parçan bozuldu', 'İbre yine sağa kayıyor. Bu kez nefesle indirmeyi dene.'); ana.eylemYap('hayir', saat.ms() * 0.03); arkadas.eylemYap('saskin', saat.ms() * 0.03);
        if (!k.tekrar) { Sfx.tok(); titret(S.kap); }
      });

      /* açılış: parça bozulur, ibre sağa kayar (v1'in "sağa" sözcüğüne kilitli) */
      ctx.zaman(function () { sira([ses.acilis], 0); }, 600);
      var vk = A.ses[ses.acilis], tBoz = 600 + (vk ? A.kelime(ses.acilis, 'bozdu') * 1000 : 900) + 150, tKick = 600 + (vk ? A.kelime(ses.acilis, 'kendiliğinden') * 1000 : 1500) - 100;
      var bozF = false, kickF = false;
      saat.ekle(function () {
        var ms = saat.ms();
        if (!bozF && ms >= tBoz) {
          bozF = true; kirikT = 1; Sfx.tok(); titret(S.kap);
          ana.eylemYap('hayir', ms * 0.03); arkadas.eylemYap('saskin', ms * 0.03);
          kartYaz(b.baslik || 'Oyun parçan bozuldu', 'Çok sevdiğin parça bozuldu. Kızgınlık yükselmeye başlıyor.');
        }
        if (!kickF && ms >= Math.max(tKick, tBoz)) {
          kickF = true; kickT = 1; kickBas = ms; Sfx.vus();
          kartYaz(b.baslik || 'Oyun parçan bozuldu', 'İbre kendiliğinden sağa, hiddete kayıyor. Bu, kızgınlığın bedende nasıl yükseldiğini gösterir.');
        }
      });
      gec.style.display = '';
      if (TEST) { window.__ibre = window.__ibre || {}; window.__ibre.nefes = { durum: function () { return { faz: faz, a: a, halka: halka, tut: tut, rehber: rehber, hedef: kd.hedef, secildi: secildi }; }, kd: kd, bas: function () { ctx.eylem('nefes', { b: 1 }); }, birak: function () { ctx.eylem('nefes', { b: 0 }); } }; }
      return { temizle: function () { sira.iptal(); }, anlatimDegisti: function (x) { A.degisti(x); } };
    }
  };
})();
