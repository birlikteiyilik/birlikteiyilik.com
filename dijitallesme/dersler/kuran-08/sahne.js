/* Kur'ân Yolu harf dersi sahnesi: "Yaşayan Minyatür". Her dersin dünyası ve nesneleri kendinedir.
   Harf bir nesneye benzetilir, nesne solda durur, harf levhaya yazılır; noktalar nesnenin üstünde de görünür.
   Her olay anlatıcının cümlesine bağlıdır (AN). Durakta t durur, a yürür. İnsan figürü yoktur. Harfler yazıdır. */
(function () {
  'use strict';
  var DO = window.DO;
  var CFG = {"id":"kuran-08","nesneler":["gonca","yuzuk","pergel","serit"],"harfler":[{"m":"و","nesne":"gonca","nokta":null},{"m":"ه","nesne":"yuzuk","nokta":null},{"m":"لا","nesne":"pergel","nokta":null},{"m":"ى","nesne":"serit","nokta":null}]};
  DO.KodDersSahne[CFG.id] = function (api) {
    var T = api.tuval, svg = api.svg, E2 = api.ciz.ogeler;
    var AN = {"w0":0.42,"w0_son":1.0,"w1":1.56,"w1_son":3.14,"sir1":3.58,"sir1_son":4.7,"sir2":4.98,"sir2_son":7.62,"sir3":7.9,"sir3_son":12.78,"sir4":13.06,"sir4_son":15.06,"hat1":15.46,"hat1_son":17.18,"hat2":17.74,"hat2_son":19.7,"d_hatirla":20.39,"onc1":20.84,"onc1_son":22.92,"onc2":23.2,"onc2_son":25.68,"d_onceden":26.21,"bu":26.78,"bu_son":28.26,"soz":28.82,"soz_son":31.16,"h0":31.72,"h0_son":32.56,"h0_1":33.12,"h0_1_son":35.64,"ad0":36.2,"ad0_son":36.88,"k_vav1":37.32,"k_vav1_son":38.48,"k_vav2":39.18,"k_vav2_son":40.34,"sen0":40.96,"sen0_son":41.56,"h1":44.32,"h1_son":45.0,"h1_1":45.56,"h1_1_son":46.96,"ad1":47.52,"ad1_son":48.2,"k_he1":48.64,"k_he1_son":49.4,"k_he2":50.1,"k_he2_son":50.86,"sen1":51.48,"sen1_son":52.08,"h2":54.84,"h2_son":55.78,"h2_1":56.34,"h2_1_son":58.3,"h2_2":58.86,"h2_2_son":61.18,"ad2":61.74,"ad2_son":62.76,"k_lamelif1":63.2,"k_lamelif1_son":64.04,"k_lamelif2":64.74,"k_lamelif2_son":65.58,"sen2":66.2,"sen2_son":66.8,"h3":69.56,"h3_son":70.28,"h3_1":70.84,"h3_1_son":72.48,"ad3":73.04,"ad3_son":73.7,"k_ye1":74.14,"k_ye1_son":74.8,"k_ye2":75.5,"k_ye2_son":76.16,"sen3":76.78,"sen3_son":77.38,"ayr":80.14,"ayr_son":82.94,"d_ayrim":83.63,"g_esles0":84.2,"g_esles0_son":86.6,"d_esles":87.29,"g_av0":87.86,"g_av0_son":88.74,"g_av1":89.3,"g_av1_son":92.22,"d_av":92.91,"g_birlikte0":93.48,"g_birlikte0_son":95.52,"g_birlikte1":96.08,"g_birlikte1_son":98.16,"d_birlikte":98.85,"g_hepsi0":99.42,"g_hepsi0_son":100.66,"g_hepsi1":101.22,"g_hepsi1_son":103.8,"d_hepsi":104.49,"g_tek0":105.06,"g_tek0_son":106.56,"g_tek1":107.12,"g_tek1_son":109.74,"d_tek":110.43,"coz1":110.88,"coz1_son":112.64,"coz2":112.92,"coz2_son":116.36,"k_lamelif3":116.64,"k_lamelif3_son":117.48,"son1":118.2,"son1_son":119.66,"son3":120.22,"son3_son":121.06,"oz0":121.62,"oz0_son":127.94,"oz1":128.5,"oz1_son":130.1,"ev":130.66,"ev_son":132.48,"gel":133.04,"gel_son":135.56,"emanet":136.12,"emanet_son":137.64};
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
