/* Kur'ân Yolu harf dersi sahnesi: "Yaşayan Minyatür". Her dersin dünyası ve nesneleri kendinedir.
   Harf bir nesneye benzetilir, nesne solda durur, harf levhaya yazılır; noktalar nesnenin üstünde de görünür.
   Her olay anlatıcının cümlesine bağlıdır (AN). Durakta t durur, a yürür. İnsan figürü yoktur. Harfler yazıdır. */
(function () {
  'use strict';
  var DO = window.DO;
  var CFG = {"id":"kuran-05","nesneler":["gemi","halat"],"harfler":[{"m":"ط","nesne":"gemi","nokta":null},{"m":"ظ","nesne":"gemi","nokta":["yan",1]},{"m":"ع","nesne":"halat","nokta":null},{"m":"غ","nesne":"halat","nokta":["ust",1]}]};
  DO.KodDersSahne[CFG.id] = function (api) {
    var T = api.tuval, svg = api.svg, E2 = api.ciz.ogeler;
    var AN = {"w0":0.4,"w0_son":1.28,"w1":1.84,"w1_son":3.46,"sir1":3.9,"sir1_son":5.34,"sir2":5.62,"sir2_son":9.78,"sir3":10.06,"sir3_son":15.42,"sir4":15.62,"sir4_son":17.62,"hat1":18.02,"hat1_son":19.92,"hat2":20.48,"hat2_son":22.4,"d_hatirla":23.09,"onc1":23.54,"onc1_son":25.7,"onc2":25.98,"onc2_son":29.18,"d_onceden":29.63,"bu":30.2,"bu_son":31.74,"soz":32.3,"soz_son":34.64,"h0":35.2,"h0_son":35.74,"h0_1":36.3,"h0_1_son":39.16,"ad0":39.72,"ad0_son":40.4,"k_ti1":40.84,"k_ti1_son":41.38,"k_ti2":42.08,"k_ti2_son":42.62,"s0_0":43.24,"s0_0_son":46.1,"k_ti3":46.54,"k_ti3_son":47.08,"sen0":47.7,"sen0_son":48.28,"h1":51.04,"h1_son":52.5,"ad1":53.06,"ad1_son":53.78,"k_zi1":54.22,"k_zi1_son":55.02,"k_zi2":55.72,"k_zi2_son":56.52,"s1_0":57.14,"s1_0_son":60.64,"k_zi3":61.08,"k_zi3_son":61.88,"sen1":62.5,"sen1_son":63.06,"h2":65.82,"h2_son":67.22,"h2_1":67.78,"h2_1_son":70.52,"ad2":71.08,"ad2_son":72.0,"k_ayn1":72.44,"k_ayn1_son":73.36,"k_ayn2":74.06,"k_ayn2_son":74.98,"s2_0":75.6,"s2_0_son":77.32,"k_ayn3":77.76,"k_ayn3_son":78.68,"sen2":79.3,"sen2_son":79.88,"h3":82.64,"h3_son":83.74,"ad3":84.3,"ad3_son":85.22,"k_gayn1":85.66,"k_gayn1_son":86.63,"k_gayn2":87.33,"k_gayn2_son":88.3,"s3_0":88.92,"s3_0_son":91.38,"k_gayn3":91.82,"k_gayn3_son":92.79,"sen3":93.41,"sen3_son":93.99,"ayr":96.75,"ayr_son":99.91,"d_ayrim":100.6,"g_esles0":101.17,"g_esles0_son":103.53,"d_esles":104.22,"g_ayir0":104.79,"g_ayir0_son":107.27,"g_ayir1":107.83,"g_ayir1_son":109.07,"d_ayir":109.76,"g_dizi0":110.33,"g_dizi0_son":112.47,"d_dizi":113.16,"g_birlikte0":113.73,"g_birlikte0_son":115.79,"g_birlikte1":116.35,"g_birlikte1_son":118.37,"d_birlikte":119.06,"g_kulak0":119.63,"g_kulak0_son":120.49,"g_kulak1":121.05,"g_kulak1_son":123.55,"d_kulak":124.24,"g_tek0":124.81,"g_tek0_son":126.31,"g_tek1":126.87,"g_tek1_son":129.49,"d_tek":130.18,"coz1":130.63,"coz1_son":132.39,"coz2":132.67,"coz2_son":136.43,"k_ayn4":136.63,"k_ayn4_son":137.55,"son1":138.27,"son1_son":139.69,"son3":140.25,"son3_son":141.09,"oz0":141.65,"oz0_son":145.41,"ev":145.97,"ev_son":147.91,"gel":148.47,"gel_son":150.53,"emanet":151.09,"emanet_son":152.63};
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
