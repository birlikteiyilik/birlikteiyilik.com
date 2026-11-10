/* Kur'ân Yolu harf dersi sahnesi: "Yaşayan Minyatür". Her dersin dünyası ve nesneleri kendinedir.
   Harf bir nesneye benzetilir, nesne solda durur, harf levhaya yazılır; noktalar nesnenin üstünde de görünür.
   Her olay anlatıcının cümlesine bağlıdır (AN). Durakta t durur, a yürür. İnsan figürü yoktur. Harfler yazıdır. */
(function () {
  'use strict';
  var DO = window.DO;
  var CFG = {"id":"kuran-06","nesneler":["kepce","cengel","kurek"],"harfler":[{"m":"ف","nesne":"kepce","nokta":["ust",1]},{"m":"ق","nesne":"cengel","nokta":["ust",2]},{"m":"ك","nesne":"kurek","nokta":null}]};
  DO.KodDersSahne[CFG.id] = function (api) {
    var T = api.tuval, svg = api.svg, E2 = api.ciz.ogeler;
    var AN = {"w0":0.38,"w0_son":1.18,"w1":1.74,"w1_son":2.96,"sir1":3.4,"sir1_son":5.0,"sir2":5.28,"sir2_son":9.52,"sir3":9.8,"sir3_son":14.52,"sir4":14.8,"sir4_son":16.8,"hat1":17.2,"hat1_son":18.94,"hat2":19.5,"hat2_son":21.46,"d_hatirla":22.15,"onc1":22.6,"onc1_son":24.84,"onc2":25.12,"onc2_son":27.44,"d_onceden":27.97,"bu":28.54,"bu_son":30.1,"soz":30.66,"soz_son":33.1,"h0":33.66,"h0_son":34.44,"h0_1":35.0,"h0_1_son":38.24,"h0_2":38.8,"h0_2_son":40.32,"ad0":40.88,"ad0_son":41.5,"k_fe1":41.94,"k_fe1_son":42.82,"k_fe2":43.52,"k_fe2_son":44.4,"sen0":45.02,"sen0_son":45.64,"h1":48.4,"h1_son":49.8,"h1_1":50.36,"h1_1_son":52.64,"h1_2":53.2,"h1_2_son":54.44,"ad1":55.0,"ad1_son":55.72,"k_kaf1":56.16,"k_kaf1_son":56.96,"k_kaf2":57.66,"k_kaf2_son":58.46,"s1_0":59.08,"s1_0_son":61.88,"k_kaf3":62.32,"k_kaf3_son":63.12,"sen1":63.74,"sen1_son":64.34,"h2":67.1,"h2_son":67.8,"h2_1":68.36,"h2_1_son":70.34,"ad2":70.9,"ad2_son":71.62,"k_kef1":72.06,"k_kef1_son":72.9,"k_kef2":73.6,"k_kef2_son":74.44,"sen2":75.06,"sen2_son":75.66,"ayr":78.42,"ayr_son":80.68,"d_ayrim":81.37,"g_esles0":81.94,"g_esles0_son":84.4,"d_esles":85.09,"g_ikili0":85.66,"g_ikili0_son":87.54,"g_ikili1":88.1,"g_ikili1_son":90.26,"d_ikili":90.95,"g_ayir0":91.52,"g_ayir0_son":94.16,"g_ayir1":94.72,"g_ayir1_son":95.98,"d_ayir":96.67,"g_birlikte0":97.24,"g_birlikte0_son":99.34,"g_birlikte1":99.9,"g_birlikte1_son":102.02,"d_birlikte":102.71,"g_tek0":103.28,"g_tek0_son":104.78,"g_tek1":105.34,"g_tek1_son":107.98,"d_tek":108.67,"coz1":109.12,"coz1_son":110.8,"coz2":111.08,"coz2_son":114.04,"k_kaf4":114.32,"k_kaf4_son":115.12,"son1":115.84,"son1_son":117.28,"son3":117.84,"son3_son":118.68,"oz0":119.24,"oz0_son":123.76,"ev":124.32,"ev_son":126.26,"gel":126.82,"gel_son":128.74,"emanet":129.3,"emanet_son":130.78};
    var GORSELLER = ['dunya', 'on', 'levha'].concat(CFG.nesneler);
    var liste = {};
    GORSELLER.forEach(function (a) { liste[a] = api.yol('gorsel/' + a + '.webp'); });
    var hazir = T.yukle(liste, api.yukleniyor);
    var PG = 1696, PH = 954, AR = "'Amiri', serif", KOBALT = '#17307f', ALTIN = '#d9a93f';
    var H = CFG.harfler, N = H.length, HX = 1130, HY = 430, OX = 400, OY = 470;
    var XS = N === 3 ? [1100, 800, 500] : [1190, 930, 670, 410];

    function ic(t, a, d) { return Math.min(1, Math.max(0, (t - a) / (d || 1))); }
    function yum(x) { return 0.5 - 0.5 * Math.cos(Math.PI * x); }
    function cik(x) { var u = 1 - x; return 1 - u * u * u; }
    function tw(t, a, d, e) { return (e || cik)(ic(t, a, d)); }
    function kr(a, b, k) { return a + (b - a) * k; }
    function plaka(ad, o) { return T.ciz(ad, Object.assign({ g: PG, h: PH }, o || {})); }
    function harf(m, boy) {
      var e = E2('text', { 'text-anchor': 'middle', direction: 'rtl', 'font-family': AR, 'font-size': boy, fill: KOBALT, opacity: 0 }, svg);
      e.textContent = m; e.setAttribute('lang', 'ar'); return e;
    }
    function yer(e, x, y, o, s) {
      e.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')' + (s ? ' scale(' + s.toFixed(3) + ')' : ''));
      e.setAttribute('opacity', Math.max(0, Math.min(1, o)).toFixed(3));
    }
    var buyuk = H.map(function (h) { return harf(h.m, 230); });
    var dizi = H.map(function (h) { return harf(h.m, N === 3 ? 190 : 150); });
    var altin = [0, 1, 2].map(function () { return E2('path', { d: 'M0 -17 L19 0 L0 17 L-19 0Z', fill: '#f3d584', stroke: ALTIN, 'stroke-width': 2, opacity: 0 }, svg); });

    function basi(i) { return AN['h' + i]; }
    function sonu(i) { return i + 1 < N ? basi(i + 1) : AN.ayr; }
    function kutu(ad) {
      var b = T.boyut(ad), s = Math.min(400 / b.g, 460 / b.h);
      return { g: b.g * s, h: b.h * s };
    }
    function ciz(t, a) {
      var acik = api.acikDurak();
      T.bas(a, { x: 800, y: 450, z: 1.08 - 0.08 * tw(t, 0, 12, yum) });
      plaka('dunya', { d: 0.4, parilti: 0.6 });
      var yan = tw(t, AN.ad0 - 0.9, 0.8) * (1 - tw(t, AN.ayr - 0.25, 0.7));
      // nesneler: harf bölümünde solda; aynı nesne iki harf boyunca kalır
      var nesneO = tw(t, basi(0) - 0.3, 0.7) * (1 - tw(t, AN.ayr - 0.25, 0.6));
      var i = -1, k;
      for (k = 0; k < N; k++) if (t >= basi(k) - 0.3 && t < sonu(k)) i = k;
      if (i >= 0 && nesneO > 0.002) {
        var ad = H[i].nesne, ilk = i, b = kutu(ad);
        while (ilk > 0 && H[ilk - 1].nesne === ad) ilk--;
        var gir = ilk === 0 ? 1 : tw(t, basi(ilk) - 0.3, 0.7);
        // nesne resmin içinde kaybolmasın: arkasında krem bir ışık
        var ho = nesneO * gir;
        T.iz(OX, OY, 310, 310, 0, 0.99, 0.94, 0.8, 0.82 * ho); T.izBitir();
        T.ciz(ad, { x: OX, y: OY + Math.sin(a * 1.1) * 6, g: b.g, h: b.h, d: 0.3, r: Math.sin(a * 0.8) * 1.2, o: nesneO * gir, parilti: 0.5 });
      }
      plaka('on', { d: 1.05, ruzgar: 0.35, y: 455 });
      if (yan > 0.002) T.ciz('levha', { x: HX, y: 380, g: 780, d: 0, o: Math.min(1, yan * 1.5), parilti: 0.5 });
      var orta = Math.max(tw(t, AN.hat1 - 0.5, 0.7) * (1 - tw(t, AN.bu - 0.2, 0.7)), tw(t, AN.ayr - 0.25, 0.7) * (1 - tw(t, AN.ev - 0.2, 0.9)));
      if (acik === 'esles') orta = 0;   // eşleştirme kendi kâğıdında açılır
      if (orta > 0.002) T.ciz('levha', { x: 800, y: kr(980, 350, orta), g: 1180, d: 0, o: Math.min(1, orta * 1.5), parilti: 0.5 });
      T.izBitir();
      // levhadaki harf ve nesnenin noktaları
      H.forEach(function (h, n) {
        var o = n === i ? tw(t, AN['ad' + n] - 0.2, 0.7) * (1 - tw(t, sonu(n) - 0.15, 0.3)) * yan : 0;
        yer(buyuk[n], HX, HY, o);
      });
      var nok = i >= 0 ? H[i].nokta : null;
      altin.forEach(function (e, j) {
        if (!nok || j >= nok[1]) { e.setAttribute('opacity', 0); return; }
        var b = kutu(H[i].nesne), x = OX + (j - (nok[1] - 1) / 2) * 56, y = OY;
        if (nok[0] === 'ust') y = OY - b.h / 2 - 34; else if (nok[0] === 'yan') x = OX + b.g / 2 + 34;
        if (nok[1] === 3 && j === 2) { x = OX; y -= 44; } else if (nok[1] === 3) x = OX + (j - 0.5) * 56;
        yer(e, x, y + Math.sin(a * 1.6 + j) * 4, tw(t, basi(i) + 0.2 + j * 0.2, 0.4) * nesneO);
      });
      var dO = tw(t, AN.ayr - 0.25, 0.7) * (1 - tw(t, AN.ev - 0.2, 0.9)) * (acik && acik !== 'ayrim' ? 0 : 1);
      dizi.forEach(function (e, n) {
        e.setAttribute('fill', t >= AN.son3 ? '#2f7d4f' : KOBALT);
        yer(e, XS[n], N === 3 ? 410 : 400, dO);
      });
    }
    return { hazir: hazir, ciz: ciz };
  };
})();
