/* Pul sanatı: pulun yüzü, kesilmemiş dörtgen baskı ve tırtıklı kenar tek yerde çizilir.
   Ders sonu makinesi (bloklar-pul.js) ve paneldeki pul defteri aynı çizimi kullanır.
   Pulun üzerine Allahü teâlânın ismi, âyet ya da hadîs yazısı konmaz: pul kesilen, damgalanan,
   yapıştırılan bir nesnedir; yalnız dersin eşyası ve doğası çizilir. */
(function (root) {
  'use strict';
  var G = 300, Y = 384, PAY = 42, ADIM = 19, DELIK = 6.4, YAZI = 'Alegreya, Georgia, serif';
  var PALET = {
    firuze: { zemin: '#1f9c9c', koyu: '#116a6c', acik: '#3fbfb6' },
    kobalt: { zemin: '#1d44a8', koyu: '#102a72', acik: '#3d6bd0' },
    mercan: { zemin: '#cc4a30', koyu: '#8e2a19', acik: '#e87552' },
    zumrut: { zemin: '#3a8a5e', koyu: '#205c3c', acik: '#5fb183' }
  };

  function tuval(g, y) { var c = document.createElement('canvas'); c.width = Math.ceil(g); c.height = Math.ceil(y); return c; }

  /* Tırtıklı kenar: delikler kenarın üstüne oturur, köşede çeyrek daire kalır */
  function adimlar(g, y) {
    var nx = Math.round(g / ADIM), ny = Math.round(y / ADIM);
    return { nx: nx, ny: ny, ax: g / nx, ay: y / ny };
  }
  function disYol(c, x, y, g, h, r) {
    var a = adimlar(g, h), i, m, PI = Math.PI;
    c.beginPath();
    c.moveTo(x + r, y);
    for (i = 1; i < a.nx; i++) { m = x + i * a.ax; c.lineTo(m - r, y); c.arc(m, y, r, PI, 0, true); }
    c.lineTo(x + g - r, y); c.arc(x + g, y, r, PI, PI / 2, true);
    for (i = 1; i < a.ny; i++) { m = y + i * a.ay; c.lineTo(x + g, m - r); c.arc(x + g, m, r, -PI / 2, PI / 2, true); }
    c.lineTo(x + g, y + h - r); c.arc(x + g, y + h, r, -PI / 2, PI, true);
    for (i = a.nx - 1; i > 0; i--) { m = x + i * a.ax; c.lineTo(m + r, y + h); c.arc(m, y + h, r, 0, PI, true); }
    c.lineTo(x + r, y + h); c.arc(x, y + h, r, 0, -PI / 2, true);
    for (i = a.ny - 1; i > 0; i--) { m = y + i * a.ay; c.lineTo(x, m + r); c.arc(x, m, r, PI / 2, -PI / 2, true); }
    c.lineTo(x, y + r); c.arc(x, y, r, PI / 2, 0, true);
    c.closePath();
  }
  function delikler(c, x, y, g, h, r) {
    var a = adimlar(g, h), i;
    function nokta(px, py) { c.moveTo(px + r, py); c.arc(px, py, r, 0, Math.PI * 2); }
    c.beginPath();
    for (i = 0; i <= a.nx; i++) { nokta(x + i * a.ax, y); nokta(x + i * a.ax, y + h); }
    for (i = 1; i < a.ny; i++) { nokta(x, y + i * a.ay); nokta(x + g, y + i * a.ay); }
    c.fill();
  }

  /* Pulun zemin deseni: ince baklava kafes ve küçük noktalar */
  function desen(c, x, y, g, h, renk) {
    var adim = 26, i, j;
    c.save(); c.beginPath(); c.rect(x, y, g, h); c.clip();
    c.strokeStyle = renk; c.lineWidth = 1;
    c.beginPath();
    for (i = -h; i < g + h; i += adim) { c.moveTo(x + i, y); c.lineTo(x + i + h, y + h); c.moveTo(x + i + h, y); c.lineTo(x + i, y + h); }
    c.stroke();
    c.fillStyle = renk;
    for (j = 0; j * adim / 2 <= h; j++) for (i = 0; i * adim <= g; i++) {
      c.beginPath(); c.arc(x + i * adim + (j % 2 ? adim / 2 : 0), y + j * adim / 2, 1.5, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }

  function yaziSig(c, metin, enFazla, boy, agirlik) {
    var b = boy;
    do { c.font = agirlik + ' ' + b + 'px ' + YAZI; b -= 1; } while (c.measureText(metin).width > enFazla && b > 12);
  }

  /* Resmin pul yüzündeki yeri: üst yazıyla alt bant arasındaki alana sığar, iç çerçeveye küçük pay bırakır.
     Kareye yakın resim (yeni 1024 px'lik çizimler) alanı doldurur; geniş eski resimler (340 px) ortalanır, kırpılmaz. */
  function resimKutusu(rg, rh, g, h, x, y) {
    var kutuG = g - 22, kutuH = h - 104, o = Math.min(kutuG / rg, kutuH / rh), w = rg * o, t = rh * o;
    return { x: x + g / 2 - w / 2, y: y + 38 + (kutuH - t) / 2, g: w, h: t };
  }

  /* Pulun yüzü: dörtgen, kâğıt kenarlı. g genişlik, Y boy; bütün çizim ölçekle büyür */
  function yuz(pul, resim, olcek) {
    var k = tuval(G * olcek, Y * olcek), c = k.getContext('2d'), P = PALET[pul.renk] || PALET.firuze;
    c.scale(olcek, olcek);
    c.fillStyle = '#fbf3df'; c.fillRect(0, 0, G, Y);
    var x = 19, y = 19, g = G - 38, h = Y - 38;
    var isik = c.createRadialGradient(x + g / 2, y + h * 0.42, 20, x + g / 2, y + h * 0.42, h * 0.72);
    isik.addColorStop(0, P.acik); isik.addColorStop(0.55, P.zemin); isik.addColorStop(1, P.koyu);
    c.fillStyle = isik; c.fillRect(x, y, g, h);
    desen(c, x, y, g, h, 'rgba(255,248,230,.13)');
    c.strokeStyle = '#e5bf68'; c.lineWidth = 3.5; c.strokeRect(x + 1.5, y + 1.5, g - 3, h - 3);
    c.strokeStyle = 'rgba(245,216,140,.75)'; c.lineWidth = 1; c.strokeRect(x + 8, y + 8, g - 16, h - 16);

    var ust = (pul.seri || 'Birlikte İyilik').toLocaleUpperCase('tr');
    // Üst yazı açık zeminde (firuze, zümrüt) kaybolmasın: pulun koyu tonunda şerit üstüne yazılır
    c.save(); c.fillStyle = P.koyu; c.globalAlpha = 0.88;
    c.beginPath(); if (c.roundRect) c.roundRect(x + 14, y + 12, g - 28, 26, 13); else c.rect(x + 14, y + 12, g - 28, 26); c.fill();
    c.restore();
    c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = '#fff6dc';
    yaziSig(c, ust, g - 48, 15, 800);
    c.fillText(ust, G / 2, y + 30);

    if (resim && resim.naturalWidth) {
      var rk = resimKutusu(resim.naturalWidth, resim.naturalHeight, g, h, x, y);
      c.save();
      c.shadowColor = 'rgba(8,14,40,.45)'; c.shadowBlur = 14; c.shadowOffsetY = 6;
      c.drawImage(resim, rk.x, rk.y, rk.g, rk.h);
      c.restore();
    }

    var bantH = 44, bantY = y + h - bantH - 13, bantX = x + 14, bantG = g - 28;
    c.fillStyle = '#fbf3df'; c.strokeStyle = '#d9a93f'; c.lineWidth = 2;
    c.beginPath();
    c.moveTo(bantX + 9, bantY); c.lineTo(bantX + bantG - 9, bantY); c.lineTo(bantX + bantG, bantY + bantH / 2); c.lineTo(bantX + bantG - 9, bantY + bantH);
    c.lineTo(bantX + 9, bantY + bantH); c.lineTo(bantX, bantY + bantH / 2); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#2b2419';
    yaziSig(c, pul.ad, bantG - 34, 26, 800);
    c.textBaseline = 'middle'; c.fillText(pul.ad, G / 2, bantY + bantH / 2 + 1);
    return k;
  }

  /* Kâğıdın lifi: aynı pulda hep aynı çıkar */
  function kagit(c, g, h) {
    var i, s = 7;
    c.fillStyle = '#f4e8cb'; c.fillRect(0, 0, g, h);
    c.fillStyle = 'rgba(120,88,40,.05)';
    for (i = 0; i < 260; i++) { s = (s * 16807) % 2147483647; c.fillRect(s % g, (s >> 8) % h, 1 + s % 3, 1); }
  }

  /* Bitmiş pul: tırtıklı kenarlı tek çizim */
  function kesikCiz(f, ks) {
    var kes = tuval((G + 4) * ks, (Y + 4) * ks), e = kes.getContext('2d');
    e.setTransform(ks, 0, 0, ks, 0, 0);
    disYol(e, 2, 2, G, Y, DELIK); e.clip(); e.drawImage(f, 2, 2, G, Y);
    return kes;
  }
  function pul(p, resim, olcek) { var f = yuz(p, resim, olcek), k = kesikCiz(f, olcek); birak(f); return k; }

  /* Makine için dört aşama, her biri gerektiğinde ayrı çizilir ve işi bitince bırakılır (bellek: iPad):
     baski    düz kenarlı, kâğıt payı olan ham baskı (yüz çizimi geçici kalır)
     delikli  zımba geçti: kenar boyunca delikler
     kesik    tırtıklı pul (ham ya da delikli baskıdan alınır)
     seritler kopan dört kenar şeridi; yalnız şeridin kapladığı dikdörtgen kadar yer tutar
     birak    çizimi sıfırlar: tarayıcı belleği hemen geri alır */
  function baski(pul, resim, olcek) {
    var ks = olcek || 1, f = yuz(pul, resim, ks), W = G + PAY * 2, H = Y + PAY * 2;
    var ham = tuval(W * ks, H * ks), c = ham.getContext('2d');
    c.scale(ks, ks); kagit(c, W, H);
    c.drawImage(f, PAY, PAY, G, Y);
    birak(f);
    c.strokeStyle = 'rgba(70,52,28,.55)'; c.lineWidth = 1.2;
    [[PAY, 10, PAY, 26], [W - PAY, 10, W - PAY, 26], [PAY, H - 26, PAY, H - 10], [W - PAY, H - 26, W - PAY, H - 10], [10, PAY, 26, PAY], [W - 26, PAY, W - 10, PAY], [10, H - PAY, 26, H - PAY], [W - 26, H - PAY, W - 10, H - PAY]].forEach(function (s) {
      c.beginPath(); c.moveTo(s[0], s[1]); c.lineTo(s[2], s[3]); c.stroke();
    });
    return ham;
  }
  function delikli(ham, olcek) {
    var ks = olcek || 1, del = tuval(ham.width, ham.height), d = del.getContext('2d');
    d.drawImage(ham, 0, 0);
    d.setTransform(ks, 0, 0, ks, 0, 0);
    d.globalCompositeOperation = 'destination-out'; d.fillStyle = '#000';
    delikler(d, PAY, PAY, G, Y, DELIK);
    return del;
  }
  function kesik(kaynak, olcek) {
    var ks = olcek || 1, k = tuval((G + 4) * ks, (Y + 4) * ks), e = k.getContext('2d');
    e.setTransform(ks, 0, 0, ks, 0, 0);
    disYol(e, 2, 2, G, Y, DELIK); e.clip();
    e.drawImage(kaynak, PAY * ks, PAY * ks, G * ks, Y * ks, 2, 2, G, Y);
    return k;
  }
  function seritler(del, olcek) {
    var ks = olcek || 1, W = G + PAY * 2, H = Y + PAY * 2;
    // [kutu x, y, g, h, çokgen (sırayla): üst, sağ, alt, sol]
    return [[0, 0, W, PAY, [0, 0, W, 0, W - PAY, PAY, PAY, PAY]], [W - PAY, 0, PAY, H, [W, 0, W, H, W - PAY, H - PAY, W - PAY, PAY]],
      [0, H - PAY, W, PAY, [W, H, 0, H, PAY, H - PAY, W - PAY, H - PAY]], [0, 0, PAY, H, [0, H, 0, 0, PAY, PAY, PAY, H - PAY]]].map(function (b) {
      var p = b[4], t = tuval(b[2] * ks, b[3] * ks), s = t.getContext('2d');
      s.setTransform(ks, 0, 0, ks, -b[0] * ks, -b[1] * ks);
      s.beginPath(); s.moveTo(p[0], p[1]); s.lineTo(p[2], p[3]); s.lineTo(p[4], p[5]); s.lineTo(p[6], p[7]); s.closePath(); s.clip();
      s.drawImage(del, 0, 0, W, H);
      s.globalCompositeOperation = 'destination-out'; s.fillStyle = '#000';
      disYol(s, PAY, PAY, G, Y, DELIK); s.fill();
      return { c: t, x: b[0], y: b[1], g: b[2], h: b[3] };
    });
  }
  function birak(c) { if (c) { c.width = 0; c.height = 0; } }

  function resimYukle(adres) {
    return new Promise(function (coz) {
      if (!adres) { coz(null); return; }
      var r = new Image(); r.decoding = 'async';
      r.onload = function () { coz(r); }; r.onerror = function () { coz(null); };
      r.src = adres;
    });
  }
  function yaziHazir() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.race([document.fonts.load('800 26px Alegreya', 'Çğıöşü'), new Promise(function (coz) { setTimeout(coz, 1500); })]).catch(function () { /* yedek yazı */ });
  }

  root.PulSanat = { resimKutusu: resimKutusu, G: G, Y: Y, PAY: PAY, ADIM: ADIM, DELIK: DELIK, PALET: PALET, baski: baski, delikli: delikli, kesik: kesik, seritler: seritler, birak: birak, pul: pul, disYol: disYol, adimlar: adimlar, resimYukle: resimYukle, yaziHazir: yaziHazir };
})(window);
