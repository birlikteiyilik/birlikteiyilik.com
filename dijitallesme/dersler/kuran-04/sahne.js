/* Kur'ân Yolu harf dersi sahnesi: "Yaşayan Minyatür". Her dersin dünyası ve nesneleri kendinedir.
   Harf bir nesneye benzetilir, nesne solda durur, harf levhaya yazılır; noktalar nesnenin üstünde de görünür.
   Her olay anlatıcının cümlesine bağlıdır (AN). Durakta t durur, a yürür. İnsan figürü yoktur. Harfler yazıdır. */
(function () {
  'use strict';
  var DO = window.DO;
  var CFG = {"id":"kuran-04","nesneler":["tarak","mekik"],"harfler":[{"m":"س","nesne":"tarak","nokta":null},{"m":"ش","nesne":"tarak","nokta":["ust",3]},{"m":"ص","nesne":"mekik","nokta":null},{"m":"ض","nesne":"mekik","nokta":["ust",1]}]};
  DO.KodDersSahne[CFG.id] = function (api) {
    var T = api.tuval, svg = api.svg, E2 = api.ciz.ogeler;
    var AN = {"w0":0.4,"w0_son":1.88,"w1":2.44,"w1_son":4.1,"sir1":4.54,"sir1_son":5.98,"sir2":6.26,"sir2_son":9.86,"sir3":10.14,"sir3_son":14.54,"sir4":14.82,"sir4_son":16.66,"hat1":17.06,"hat1_son":18.8,"hat2":19.36,"hat2_son":21.3,"d_hatirla":21.99,"onc1":22.44,"onc1_son":24.68,"onc2":24.96,"onc2_son":27.2,"d_onceden":27.73,"bu":28.3,"bu_son":29.9,"soz":30.46,"soz_son":32.92,"h0":33.48,"h0_son":34.2,"h0_1":34.76,"h0_1_son":35.42,"h0_2":35.98,"h0_2_son":37.74,"ad0":38.3,"ad0_son":38.98,"k_sin1":39.42,"k_sin1_son":40.31,"k_sin2":41.01,"k_sin2_son":41.9,"sen0":42.52,"sen0_son":43.12,"h1":45.88,"h1_son":47.56,"ad1":48.12,"ad1_son":48.9,"k_sin21":49.34,"k_sin21_son":50.28,"k_sin22":50.98,"k_sin22_son":51.92,"sen1":52.54,"sen1_son":53.16,"h2":55.92,"h2_son":56.82,"h2_1":57.38,"h2_1_son":59.62,"ad2":60.18,"ad2_son":61.0,"k_sad1":61.44,"k_sad1_son":62.56,"k_sad2":63.26,"k_sad2_son":64.38,"s2_0":65.0,"s2_0_son":66.04,"k_sad3":66.48,"k_sad3_son":67.6,"sen2":68.22,"sen2_son":68.8,"h3":71.56,"h3_son":73.16,"ad3":73.72,"ad3_son":74.5,"k_dad1":74.94,"k_dad1_son":76.12,"k_dad2":76.82,"k_dad2_son":78.0,"s3_0":78.62,"s3_0_son":79.62,"k_dad3":80.06,"k_dad3_son":81.24,"sen3":81.86,"sen3_son":82.46,"ayr":85.22,"ayr_son":88.46,"d_ayrim":89.15,"g_esles0":89.72,"g_esles0_son":92.08,"d_esles":92.77,"g_ayir0":93.34,"g_ayir0_son":95.88,"g_ayir1":96.44,"g_ayir1_son":97.74,"d_ayir":98.43,"g_av0":99.0,"g_av0_son":99.92,"g_av1":100.48,"g_av1_son":103.5,"d_av":104.19,"g_birlikte0":104.76,"g_birlikte0_son":106.72,"g_birlikte1":107.28,"g_birlikte1_son":109.32,"d_birlikte":110.01,"g_kulak0":110.58,"g_kulak0_son":111.4,"g_kulak1":111.96,"g_kulak1_son":114.64,"d_kulak":115.33,"g_tek0":115.9,"g_tek0_son":117.46,"g_tek1":118.02,"g_tek1_son":120.68,"d_tek":121.37,"coz1":121.82,"coz1_son":123.66,"coz2":123.94,"coz2_son":126.66,"k_sin3":126.94,"k_sin3_son":127.83,"son1":128.55,"son1_son":130.01,"son3":130.57,"son3_son":131.41,"oz0":131.97,"oz0_son":135.25,"ev":135.81,"ev_son":137.69,"gel":138.25,"gel_son":140.33,"emanet":140.89,"emanet_son":142.39};
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
