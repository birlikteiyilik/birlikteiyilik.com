/* Kur'ân Yolu harf dersi sahnesi: "Yaşayan Minyatür". Her dersin dünyası ve nesneleri kendinedir.
   Harf bir nesneye benzetilir, nesne solda durur, harf levhaya yazılır; noktalar nesnenin üstünde de görünür.
   Her olay anlatıcının cümlesine bağlıdır (AN). Durakta t durur, a yürür. İnsan figürü yoktur. Harfler yazıdır. */
(function () {
  'use strict';
  var DO = window.DO;
  var CFG = {"id":"kuran-02","nesneler":["kanca"],"harfler":[{"m":"ج","nesne":"kanca","nokta":["ic",1]},{"m":"ح","nesne":"kanca","nokta":null},{"m":"خ","nesne":"kanca","nokta":["ust",1]}]};
  DO.KodDersSahne[CFG.id] = function (api) {
    var T = api.tuval, svg = api.svg, E2 = api.ciz.ogeler;
    var AN = {"w0":0.39,"w0_son":2.31,"w1":2.87,"w1_son":5.01,"sir1":5.45,"sir1_son":6.81,"sir2":7.09,"sir2_son":9.57,"sir3":9.77,"sir3_son":14.57,"sir4":14.85,"sir4_son":16.93,"hat1":17.25,"hat1_son":18.97,"hat2":19.53,"hat2_son":21.41,"d_hatirla":22.1,"onc1":22.55,"onc1_son":24.63,"onc2":24.91,"onc2_son":29.39,"d_onceden":29.92,"bu":30.49,"bu_son":32.01,"soz":32.57,"soz_son":34.89,"h0":35.45,"h0_son":36.19,"h0_1":36.75,"h0_1_son":39.41,"h0_2":39.97,"h0_2_son":41.51,"ad0":42.07,"ad0_son":42.55,"k_cim1":42.99,"k_cim1_son":43.75,"k_cim2":44.45,"k_cim2_son":45.21,"sen0":45.83,"sen0_son":46.43,"h1":49.19,"h1_son":49.99,"h1_1":50.55,"h1_1_son":52.33,"ad1":52.89,"ad1_son":53.57,"k_ha1":54.01,"k_ha1_son":54.78,"k_ha2":55.48,"k_ha2_son":56.25,"s1_0":56.87,"s1_0_son":59.49,"k_ha3":59.93,"k_ha3_son":60.7,"sen1":61.32,"sen1_son":61.9,"h2":64.66,"h2_son":66.02,"ad2":66.58,"ad2_son":67.22,"k_hi1":67.66,"k_hi1_son":68.43,"k_hi2":69.13,"k_hi2_son":69.9,"s2_0":70.52,"s2_0_son":73.3,"k_hi3":73.74,"k_hi3_son":74.51,"sen2":75.13,"sen2_son":75.71,"ayr":78.47,"ayr_son":79.65,"ayr1":80.21,"ayr1_son":81.93,"g_nokta0":82.49,"g_nokta0_son":83.59,"g_nokta1":84.15,"g_nokta1_son":85.27,"d_nokta":85.96,"g_av0":86.53,"g_av0_son":87.45,"g_av1":88.01,"g_av1_son":90.93,"d_av":91.62,"g_birlikte0":92.19,"g_birlikte0_son":94.21,"g_birlikte1":94.77,"g_birlikte1_son":96.79,"d_birlikte":97.48,"g_kulak0":98.05,"g_kulak0_son":98.91,"g_kulak1":99.47,"g_kulak1_son":101.93,"d_kulak":102.62,"g_tek0":103.19,"g_tek0_son":104.63,"g_tek1":105.19,"g_tek1_son":107.75,"d_tek":108.44,"coz1":108.89,"coz1_son":110.65,"coz2":110.93,"coz2_son":113.97,"k_cim3":114.25,"k_cim3_son":115.01,"son1":115.73,"son1_son":117.19,"son3":117.73,"son3_son":118.59,"oz0":119.15,"oz0_son":123.77,"ev":124.33,"ev_son":126.17,"gel":126.73,"gel_son":128.83,"emanet":129.39,"emanet_son":130.97};
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
