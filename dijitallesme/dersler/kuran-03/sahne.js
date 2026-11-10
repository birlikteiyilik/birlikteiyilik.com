/* Kur'ân Yolu harf dersi sahnesi: "Yaşayan Minyatür". Her dersin dünyası ve nesneleri kendinedir.
   Harf bir nesneye benzetilir, nesne solda durur, harf levhaya yazılır; noktalar nesnenin üstünde de görünür.
   Her olay anlatıcının cümlesine bağlıdır (AN). Durakta t durur, a yürür. İnsan figürü yoktur. Harfler yazıdır. */
(function () {
  'use strict';
  var DO = window.DO;
  var CFG = {"id":"kuran-03","nesneler":["dal","hilal"],"harfler":[{"m":"د","nesne":"dal","nokta":null},{"m":"ذ","nesne":"dal","nokta":["ust",1]},{"m":"ر","nesne":"hilal","nokta":null},{"m":"ز","nesne":"hilal","nokta":["ust",1]}]};
  DO.KodDersSahne[CFG.id] = function (api) {
    var T = api.tuval, svg = api.svg, E2 = api.ciz.ogeler;
    var AN = {"w0":0.42,"w0_son":2.36,"w1":2.92,"w1_son":4.52,"sir1":4.96,"sir1_son":6.56,"sir2":6.84,"sir2_son":10.28,"sir3":10.56,"sir3_son":15.52,"sir4":15.8,"sir4_son":17.8,"hat1":18.2,"hat1_son":20.0,"hat2":20.56,"hat2_son":22.48,"d_hatirla":23.17,"onc1":23.62,"onc1_son":25.78,"onc2":26.06,"onc2_son":29.98,"d_onceden":30.43,"bu":31.0,"bu_son":32.52,"soz":33.08,"soz_son":35.48,"h0":36.04,"h0_son":36.62,"h0_1":37.18,"h0_1_son":38.26,"h0_2":38.82,"h0_2_son":40.8,"ad0":41.36,"ad0_son":42.18,"k_dal1":42.62,"k_dal1_son":43.44,"k_dal2":44.14,"k_dal2_son":44.96,"sen0":45.58,"sen0_son":46.18,"h1":48.94,"h1_son":50.02,"ad1":50.58,"ad1_son":51.52,"k_zel1":51.96,"k_zel1_son":52.93,"k_zel2":53.63,"k_zel2_son":54.6,"s1_0":55.22,"s1_0_son":58.84,"k_zel3":59.28,"k_zel3_son":60.25,"sen1":60.87,"sen1_son":61.45,"h2":64.21,"h2_son":65.05,"h2_1":65.61,"h2_1_son":67.81,"ad2":68.37,"ad2_son":69.19,"k_ra1":69.63,"k_ra1_son":70.46,"k_ra2":71.16,"k_ra2_son":71.99,"sen2":72.61,"sen2_son":73.21,"h3":75.97,"h3_son":77.07,"ad3":77.63,"ad3_son":78.39,"k_ze1":78.83,"k_ze1_son":79.63,"k_ze2":80.33,"k_ze2_son":81.13,"sen3":81.75,"sen3_son":82.35,"ayr":85.11,"ayr_son":86.07,"ayr1":86.63,"ayr1_son":88.27,"d_ayrim":88.96,"g_esles0":89.53,"g_esles0_son":91.97,"d_esles":92.66,"g_ikili0":93.23,"g_ikili0_son":95.07,"g_ikili1":95.63,"g_ikili1_son":97.73,"d_ikili":98.42,"g_av0":98.99,"g_av0_son":99.89,"g_av1":100.45,"g_av1_son":103.39,"d_av":104.08,"g_birlikte0":104.65,"g_birlikte0_son":106.69,"g_birlikte1":107.25,"g_birlikte1_son":109.25,"d_birlikte":109.94,"g_tek0":110.51,"g_tek0_son":112.01,"g_tek1":112.57,"g_tek1_son":115.15,"d_tek":115.84,"coz1":116.29,"coz1_son":118.05,"coz2":118.33,"coz2_son":121.37,"k_dal3":121.65,"k_dal3_son":122.47,"son1":123.19,"son1_son":124.65,"son3":125.21,"son3_son":126.07,"oz0":126.63,"oz0_son":130.33,"ev":130.89,"ev_son":132.71,"gel":133.27,"gel_son":135.87,"emanet":136.43,"emanet_son":137.95};
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
