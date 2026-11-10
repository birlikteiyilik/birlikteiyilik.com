/* Ders Odası — İBREMETRE blokları (tefrit · fazilet · ifrat "ibre" dersleri)
   ibreAcilis  : animasyonlu açılış (kodla çizilir; video yok) → merak sorusu
   ibreTahmin  : ibreyi sürükleyerek tahmin + eminlik, sonra açıklama
   ibreKapilar : üç kapı (az · fazla · kararında): sahne, sonuç zinciri, iç ses sorusu
   ibreSenaryo : "Sen olsan?" dallanan senaryo, seçimin sonucu ibreyle gösterilir
   Hiçbiri puan vermez (max 0); her tahmin/seçim ctx.cevap ile rapora yazılır.
   Canlı ders: her anlamlı hareket ctx.eylem(...) ile; ctx.eylemTanimla(...) herkeste aynı çalışır.
   Çizimler SVG (1600×900), yüzler yok: yüzsüz piktogramlar. */
(function () {
  'use strict';
  var DO = window.DO, el = DO.el, sv = DO.svg, B = DO.Bloklar;
  var D = 70;
  var ZON = { az: '#4262B0', orta: '#17998A', fazla: '#E0674F' };
  var BG = { navy: '#14264A', az: '#2D4685', orta: '#0E8173', fazla: '#C94F38', amber: '#E8A33D', krem: '#F2EADB' };
  var ISARET = { az: '▼', orta: '◆', fazla: '▲' };
  var KUTUP = { az: 'AZ · TEFRİT', orta: 'KARARINDA · FAZİLET', fazla: 'FAZLA · İFRAT' };
  var MERKEZ = { az: -0.72, orta: 0, fazla: 0.72 };
  var FONT = "'Baloo 2','Nunito',system-ui,sans-serif";
  var SERIF = "'New York','Iowan Old Style',Georgia,serif";

  /* ——— matematik ——— */
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ilerle(k, bas, son) { return son <= bas ? (k >= bas ? 1 : 0) : clamp((k - bas) / (son - bas), 0, 1); }
  function yumusat(t) { return t * t * (3 - 2 * t); }
  function cikis(t) { return 1 - Math.pow(1 - t, 3); }
  function yay(k, bas, sure, sertlik) {
    sure = sure || 18; sertlik = sertlik || 1;
    var t = (k - bas) / sure; if (t <= 0) return 0; if (t >= 1.6) return 1;
    var z = 0.42 / sertlik, w = 9.5;
    return 1 - Math.exp(-z * w * t) * Math.cos(w * Math.sqrt(1 - z * z) * t);
  }
  function rnd(s) { var x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function zonDe(t, h) { return t < -h ? 'az' : (t > h ? 'fazla' : 'orta'); }
  function buyut(s) { return String(s).replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase(); }
  function hex(c) { c = c.replace('#', ''); var n = parseInt(c, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function karisim(a, b, w) { var x = hex(a), y = hex(b), u = clamp(w, 0, 1); return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(x[i] + (y[i] - x[i]) * u); }).join(',') + ')'; }
  function genislik(yazi, boyut) {
    var w = 0, i, c;
    for (i = 0; i < yazi.length; i++) {
      c = yazi.charAt(i);
      if (c === ' ') w += 0.27;
      else if ('iIılj.,:;!\'|ıİ'.indexOf(c) >= 0) w += 0.29;
      else if ('mwMWŞĞÖÜ%'.indexOf(c) >= 0) w += 0.86;
      else if ((c >= 'A' && c <= 'Z') || 'ÇÖÜĞŞİÂ'.indexOf(c) >= 0) w += 0.68;
      else if (c >= '0' && c <= '9') w += 0.6;
      else w += 0.56;
    }
    return w * boyut * 1.04;
  }

  /* ——— saat: tüm animasyonlar tek RAF döngüsünde (blok kapanınca durur). ?test=1 → elle ilerletilir ——— */
  var TEST = /[?&]test=1/.test(location.search);
  var REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || /[?&]sakin=1/.test(location.search);
  function Saat(ctx) {
    var fns = [], ms = 0, son = 0, calisiyor = false, ol = false, self = this;
    this.ms = function () { return ms; };
    this.ekle = function (fn) { fns.push(fn); uyan(); return function () { var i = fns.indexOf(fn); if (i >= 0) fns.splice(i, 1); }; };
    function adim(dt) { ms += dt; var l = fns.slice(); for (var i = 0; i < l.length; i++) { try { l[i](dt, ms * 0.03, ms); } catch (e) { if (window.console) console.error(e); } } }
    function dongu(now) {
      if (ol) return;
      var dt = Math.min(64, now - (son || now)); son = now; adim(dt);
      if (fns.length) requestAnimationFrame(dongu); else calisiyor = false;
    }
    function uyan() { if (TEST || calisiyor || ol) return; calisiyor = true; son = 0; requestAnimationFrame(dongu); }
    this.ilerlet = function (m) { var n = Math.ceil(m / 16); for (var i = 0; i < n; i++) adim(16); };
    this.kapat = function () { ol = true; fns = []; };
    if (TEST) { window.__ibre = window.__ibre || {}; window.__ibre.saat = this; }
    ctx.oynatici.temizlikler.push(function () { self.kapat(); });
  }

  /* ——— kadran (ibre): verilen SVG grubunun içine; orijin = ibrenin dönme noktası ——— */
  var KSAY = 0;
  function Kadran(ust, saat, o) {
    o = o || {}; var self = this, uid = 'ibk' + (++KSAY);
    this.o = o; this.h = o.h || 0.26; this.x = o.baslangic || 0; this.hedef = this.x; this.v = 0; this.zon = zonDe(this.x, this.h);
    this.kullanici = false; this.surukluyor = false; this.omega = 13; this.dokundu = false;
    var h = this.h, hd = h * D;
    this.kok = sv('g', { transform: 'translate(' + (o.x || 0) + ' ' + (o.y || 0) + ') scale(' + (o.s || 1) + ')' }); ust.appendChild(this.kok);
    function pol(r, deg) { var a = deg * Math.PI / 180; return [r * Math.sin(a), -r * Math.cos(a)]; }
    function arc(r, d1, d2) { var p1 = pol(r, d1), p2 = pol(r, d2); return 'M' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) + ' A' + r + ' ' + r + ' 0 0 1 ' + p2[0].toFixed(2) + ' ' + p2[1].toFixed(2); }
    this.kok.appendChild(sv('defs', null, [
      sv('linearGradient', { id: uid + 'b', x1: 0, y1: 0, x2: 1, y2: 1 }, [sv('stop', { offset: 0, 'stop-color': '#D9B66B' }), sv('stop', { offset: 0.5, 'stop-color': '#F4DFA6' }), sv('stop', { offset: 1, 'stop-color': '#8C6A2A' })]),
      sv('radialGradient', { id: uid + 'f', cx: 0.4, cy: 0.25, r: 1 }, [sv('stop', { offset: 0, 'stop-color': '#FFFDF5' }), sv('stop', { offset: 1, 'stop-color': '#F4EAD2' })]),
      sv('linearGradient', { id: uid + 'c', x1: 0, y1: 0, x2: 0, y2: 1 }, [sv('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.34 }), sv('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 })]),
      sv('clipPath', { id: uid + 'k' }, [sv('rect', { x: -200, y: -200, width: 400, height: 224 })])
    ]));
    this.kok.appendChild(sv('ellipse', { cx: 0, cy: 26, rx: 196, ry: 11, fill: 'rgba(0,0,0,0.22)' }));
    var yuz = sv('g', { 'clip-path': 'url(#' + uid + 'k)' }); this.kok.appendChild(yuz);
    yuz.appendChild(sv('circle', { r: 192, fill: 'url(#' + uid + 'b)' }));
    yuz.appendChild(sv('circle', { r: 181, fill: 'url(#' + uid + 'f)', stroke: 'rgba(0,0,0,0.14)', 'stroke-width': 1.5 }));
    this.arc = {
      az: sv('path', { d: arc(150, -D, -hd - 0.8), fill: 'none', stroke: ZON.az, 'stroke-width': 26 }),
      orta: sv('path', { d: arc(150, -hd + 0.8, hd - 0.8), fill: 'none', stroke: ZON.orta, 'stroke-width': 26 }),
      fazla: sv('path', { d: arc(150, hd + 0.8, D), fill: 'none', stroke: ZON.fazla, 'stroke-width': 26 })
    };
    yuz.appendChild(this.arc.az); yuz.appendChild(this.arc.orta); yuz.appendChild(this.arc.fazla);
    [['az', pol(150, (-D - hd) / 2)], ['orta', pol(150, 0)], ['fazla', pol(150, (hd + D) / 2)]].forEach(function (a) {
      yuz.appendChild(sv('text', { x: a[1][0], y: a[1][1] + 5, 'text-anchor': 'middle', 'font-size': 13, fill: '#fff', opacity: 0.95, text: ISARET[a[0]] }));
    });
    for (var i = -20; i <= 20; i++) {
      var tt = i / 20, ana = i === 0 || Math.abs(Math.abs(tt) - h) < 0.026, p1 = pol(132, tt * D), p2 = pol(ana ? 116 : 124, tt * D);
      yuz.appendChild(sv('line', { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], stroke: '#14264A', 'stroke-opacity': 0.55, 'stroke-width': ana ? 2.6 : 1.3 }));
    }
    this.hay = sv('g', { opacity: 0, style: 'transition:opacity .35s' }, [sv('path', { d: 'M0 -118 L5 0 L-5 0 Z', fill: 'none', stroke: '#14264A', 'stroke-width': 2, 'stroke-dasharray': '4 3' })]);
    yuz.appendChild(this.hay);
    this.igne = sv('g', null, [
      sv('path', { d: 'M3 -112 L9 4 L-1 4 Z', fill: 'rgba(0,0,0,0.30)', transform: 'translate(4 5)' }),
      sv('path', { d: 'M0 -122 L5.5 0 L-5.5 0 Z', fill: '#14264A' }),
      sv('rect', { x: -5, y: 0, width: 10, height: 22, rx: 4, fill: '#14264A' })
    ]);
    yuz.appendChild(this.igne);
    yuz.appendChild(sv('circle', { r: 13, fill: 'url(#' + uid + 'b)', stroke: 'rgba(0,0,0,0.35)' }));
    yuz.appendChild(sv('circle', { r: 5, fill: '#14264A' }));
    yuz.appendChild(sv('path', { d: 'M-138 -90 A152 152 0 0 1 -12 -150', fill: 'none', stroke: 'url(#' + uid + 'c)', 'stroke-width': 30, 'stroke-linecap': 'round', opacity: 0.7 }));
    this.etk = sv('g', { opacity: 0 }); this.kok.appendChild(this.etk); this.etiketler = {};
    if (o.etiket) this.etiketKur(o.etiket, o.etiketRenk);
    if (o.interaktif) {
      this.hit = sv('rect', { x: -205, y: -205, width: 410, height: 250, fill: 'transparent', style: 'cursor:grab;touch-action:none' });
      this.kok.appendChild(this.hit);
      this.hit.addEventListener('pointerdown', function (e) { self.indi(e); });
      this.hit.addEventListener('pointermove', function (e) { if (self.surukluyor) self.imle(e); });
      this.hit.addEventListener('pointerup', function (e) { self.birak(e); });
      this.hit.addEventListener('pointercancel', function (e) { self.birak(e); });
      this.hit.addEventListener('lostpointercapture', function (e) { self.birak(e); });
    }
    this.guncelle(true);
    this.kaldir = saat.ekle(function (dt) { self.adim(dt / 1000); });
  }
  var KP = Kadran.prototype;
  KP.etiketKur = function (e, renk) {
    var self = this; this.etk.innerHTML = '';
    [['az', -122], ['orta', 0], ['fazla', 122]].forEach(function (a) {
      var t = sv('text', { x: a[1], y: 58, 'text-anchor': 'middle', 'font-weight': 800, 'font-size': 17, fill: renk || '#fff', 'font-family': FONT, text: ISARET[a[0]] + ' ' + e[a[0]] });
      self.etiketler[a[0]] = t; self.etk.appendChild(t);
    });
  };
  KP.etiketGoster = function (op) { this.etk.setAttribute('opacity', op); };
  KP.konumla = function (x, y, s) { this.kok.setAttribute('transform', 'translate(' + x + ' ' + y + ') scale(' + s + ')'); };
  KP.vurgu = function (v) { for (var k in v) this.arc[k].setAttribute('opacity', v[k]); this.sabit = true; };
  KP.otoVurgu = function () { this.sabit = false; this.guncelle(true); };
  KP.nokta = function (e) {
    var root = this.kok.ownerSVGElement, pt = root.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var m = this.kok.getScreenCTM(); if (!m) return 0;
    var p = pt.matrixTransform(m.inverse()), dx = p.x, dy = -p.y, deg;
    if (dy <= 6) deg = dx < 0 ? -D : D; else deg = Math.atan2(dx, dy) * 180 / Math.PI;
    return clamp(deg, -D, D) / D;
  };
  KP.indi = function (e) {
    if (e.button > 0 || e.isPrimary === false || this.o.kilitli || (this.o.engel && this.o.engel())) return;
    this.surukluyor = true; this.ptr = e.pointerId; this.hit.style.cursor = 'grabbing';
    try { this.hit.setPointerCapture(e.pointerId); } catch (x) { }
    this.omega = 34; this.kullanici = true; this.dokundu = true; this.hedef = this.nokta(e); this.bildir();
  };
  KP.imle = function (e) { this.hedef = this.nokta(e); this.bildir(); };
  KP.birak = function (e) {
    if (!this.surukluyor || (e && e.pointerId !== undefined && this.ptr !== undefined && e.pointerId !== this.ptr)) return;
    this.surukluyor = false; this.omega = 13; this.hit.style.cursor = 'grab';
    try { this.hit.releasePointerCapture(e.pointerId); } catch (x) { }
    if (this.o.onBirak) this.o.onBirak(this.hedef, zonDe(this.hedef, this.h));
  };
  KP.tus = function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || this.o.kilitli || (this.o.engel && this.o.engel())) return false;
    var k = e.key, a = e.shiftKey ? 0.2 : 0.05, t = this.hedef, y = null;
    if (k === 'ArrowLeft' || k === 'ArrowDown') y = t - a; else if (k === 'ArrowRight' || k === 'ArrowUp') y = t + a;
    else if (k === 'Home') y = -1; else if (k === 'End') y = 1; else if (k === '0') y = 0;
    if (y === null) return false;
    this.kullanici = true; this.dokundu = true; this.omega = 24; this.hedef = clamp(y, -1, 1); this.bildir(); return true;
  };
  KP.git = function (t, o) {
    o = o || {}; this.kullanici = !!o.kullanici; this.omega = o.hizli ? 26 : (o.yavas ? 8 : 13); this.hedef = clamp(t, -1, 1);
    if (REDUCED || o.anlik) { this.x = this.hedef; this.v = 0; this.guncelle(); }
    this.bildir();
  };
  KP.bildir = function () { if (this.o.onHedef) this.o.onHedef(this.hedef, zonDe(this.hedef, this.h)); };
  KP.adim = function (dt) {
    if (this.olu) return;
    if (REDUCED) { if (this.x !== this.hedef) { this.x = this.hedef; this.v = 0; this.guncelle(); } return; }
    var d = this.hedef - this.x;
    if (Math.abs(d) < 0.0006 && Math.abs(this.v) < 0.004) { if (this.x !== this.hedef) { this.x = this.hedef; this.v = 0; this.guncelle(); } return; }
    var w = this.omega, a = w * w * d - 2 * w * this.v; this.v += a * dt; this.x += this.v * dt;
    if ((d > 0 && this.x > this.hedef) || (d < 0 && this.x < this.hedef)) { this.x = this.hedef; this.v = 0; }
    this.guncelle();
  };
  KP.guncelle = function (zorla) {
    this.igne.setAttribute('transform', 'rotate(' + (this.x * D).toFixed(2) + ')');
    var z = zonDe(this.x, this.h);
    if (z !== this.zon || zorla) {
      var onceki = this.zon; this.zon = z;
      if (!this.sabit) { for (var k in this.arc) this.arc[k].setAttribute('opacity', this.o.notr ? (k === 'orta' ? 0.5 : 0.6) : (k === z ? 1 : 0.38)); }
      if (!zorla) {
        if (this.o.tik && this.kullanici && z === 'orta' && onceki !== 'orta') Sfx.tik();
        if (this.o.onZon) this.o.onZon(z, onceki);
      }
    }
  };
  KP.hayalet = function (t) {
    if (t === null || t === undefined) { this.hay.setAttribute('opacity', 0); return; }
    this.hay.setAttribute('transform', 'rotate(' + (t * D) + ')'); this.hay.setAttribute('opacity', 0.85);
  };
  KP.yoket = function () { this.olu = true; if (this.kaldir) this.kaldir(); if (this.kok.parentNode) this.kok.parentNode.removeChild(this.kok); };

  /* ——— yüzsüz piktogram (IK'li, nefes alan) ——— */
  var SR = [0.19, -0.695], SL = [-0.19, -0.695], LU = 0.19, LF = 0.17, TAU = Math.PI * 2;
  function yum(t) { var u = clamp(t, 0, 1); return 0.5 - 0.5 * Math.cos(Math.PI * u); }
  function lerpV(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function ik(S, T, yon) {
    var dx = T[0] - S[0], dy = T[1] - S[1], d = Math.sqrt(dx * dx + dy * dy) || 1e-6;
    var dd = Math.min(LU + LF - 0.002, Math.max(Math.abs(LU - LF) + 0.002, d)), ux = dx / d, uy = dy / d;
    var c = clamp((LU * LU + dd * dd - LF * LF) / (2 * LU * dd), -1, 1), s = yon * Math.acos(c);
    return [S[0] + LU * (ux * Math.cos(s) - uy * Math.sin(s)), S[1] + LU * (ux * Math.sin(s) + uy * Math.cos(s))];
  }
  function ulas(S, T) {
    var dx = T[0] - S[0], dy = T[1] - S[1], d = Math.sqrt(dx * dx + dy * dy) || 1e-6, m = LU + LF - 0.002;
    return d > m ? [S[0] + dx / d * m, S[1] + dy / d * m] : T;
  }
  function durus(e, t, hedef) {
    var nef = Math.sin(t / 60 * TAU), gevsek = [0.235, -0.41 + 0.008 * nef], gevsekL = [-0.235, -0.41 + 0.008 * Math.sin(t / 60 * TAU + 1)];
    var d = { sag: gevsek, sol: gevsekL, egim: 0, basEgim: 1.5 * nef, yOff: 0.004 * nef, bacak: 'dur', faz: 0, sallan: 0 }, p;
    switch (e) {
      case 'konus': p = t / 26 * TAU; d.sag = [0.40 + 0.06 * Math.sin(p), -0.64 + 0.07 * Math.cos(p)]; d.sol = [-0.30 + 0.04 * Math.sin(p * 0.7 + 1), -0.52 + 0.05 * Math.sin(p * 0.9)]; d.basEgim = 4 * Math.sin(t / 38 * TAU); d.yOff = -0.010 * Math.abs(Math.sin(p / 2)); break;
      case 'yuru': p = t / 26 * TAU; d.sag = [0.19 + 0.12 * Math.sin(p), -0.45]; d.sol = [-0.19 - 0.12 * Math.sin(p), -0.45]; d.bacak = 'yuru'; d.faz = p; d.egim = 2.5; d.yOff = -0.014 * Math.abs(Math.sin(p)); break;
      case 'el-salla': p = t / 11 * TAU; d.sag = [0.27 + 0.075 * Math.sin(p), -1.0 + 0.02 * Math.cos(p)]; d.basEgim = 3; break;
      case 'isaret': var h = hedef || [0.62, -0.72], nab = 0.025 * Math.max(0, Math.sin(t / 34 * TAU)); d.sag = [h[0] + nab, h[1] - nab * 0.2]; d.egim = -2; d.basEgim = -2; break;
      case 'sevinc': p = t / 24 * TAU; d.sag = [0.33, -1.16 + 0.06 * Math.sin(p)]; d.sol = [-0.33, -1.16 + 0.06 * Math.cos(p)]; d.yOff = -0.07 * Math.abs(Math.sin(p / 2)); d.basEgim = 5 * Math.sin(p / 2); break;
      case 'saskin': var g = yum(t / 7); d.sag = lerpV(gevsek, [0.14, -0.82], g); d.sol = lerpV(gevsekL, [-0.14, -0.82], g); d.egim = -7 * g; d.basEgim = -7 * g; d.sallan = t < 22 ? Math.sin(t * 1.9) * (1 - t / 22) * 1.8 : 0; break;
      case 'dusun': d.sag = [0.05, -0.80]; d.sol = [-0.1, -0.56]; d.basEgim = 7 + 2.5 * nef; d.egim = 2; break;
      case 'hayir': d.sag = [0.32 + 0.085 * Math.sin(t / 9 * TAU), -0.98]; d.basEgim = 2 * Math.sin(t / 18 * TAU); break;
      case 'yaslan': var g2 = yum(t / 10); d.sag = lerpV(gevsek, [0.22, -0.46], g2); d.sol = lerpV(gevsekL, [-0.2, -0.46], g2); d.egim = -9 * g2; d.basEgim = -3 * g2 + 1.5 * nef; break;
      case 'egil': var g3 = yum(t / 10); d.egim = 18 * g3; d.basEgim = 6 * g3; break;
      case 'otur': d.sag = [0.25, -0.44]; d.sol = [-0.21, -0.44]; d.bacak = 'otur'; break;
      default: break;
    }
    return d;
  }
  function Figur(ust, o) {
    var self = this; o = o || {};
    this.boy = o.boy || 300; this.renk = o.renk || '#F2EADB'; this.vurgu = o.vurgu || null;
    this.eylem = o.eylem || 'nefes'; this.bas = 0; this.olcek = 1; this.ters = !!o.ters; this.hedef = o.hedef; this.faz = o.faz || 0;
    this.eski = null; this.gecisBas = -99;
    this.kok = sv('g', { transform: 'translate(' + (o.x || 0) + ' ' + (o.y || 0) + ')' }); ust.appendChild(this.kok);
    this.golge = sv('ellipse', { cx: 0, cy: 0, rx: 0.2 * this.boy, ry: 0.035 * this.boy, fill: 'rgba(0,0,0,0.16)' });
    this.g = sv('g'); this.bl = sv('line', { 'stroke-linecap': 'round' }); this.br = sv('line', { 'stroke-linecap': 'round' });
    this.kolL = sv('path', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); this.kolR = sv('path', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    this.elL = sv('circle'); this.elR = sv('circle'); this.govde = sv('path'); this.serit = sv('path'); this.kafa = sv('circle');
    this.ic = sv('g'); this.dis = sv('g');
    this.kok.appendChild(this.golge); this.kok.appendChild(this.dis); this.dis.appendChild(this.g);
    this.g.appendChild(this.bl); this.g.appendChild(this.br); this.g.appendChild(this.ic);
    [this.kolL, this.elL, this.govde, this.serit, this.kolR, this.elR, this.kafa].forEach(function (n) { self.ic.appendChild(n); });
    this.ayar(this.renk, this.vurgu); this.cizPose(durus(this.eylem, 0, this.hedef), 0);
  }
  var FP = Figur.prototype;
  FP.ayar = function (renk, vurgu) {
    this.renk = renk; var h = this.boy, bw = 0.112 * h, sw = 0.094 * h;
    [this.bl, this.br].forEach(function (n) { n.setAttribute('stroke', renk); n.setAttribute('stroke-width', bw); });
    [this.kolL, this.kolR].forEach(function (n) { n.setAttribute('stroke', renk); n.setAttribute('stroke-width', sw); });
    [this.elL, this.elR].forEach(function (n) { n.setAttribute('fill', renk); n.setAttribute('r', 0.056 * h); });
    this.govde.setAttribute('fill', renk); this.kafa.setAttribute('fill', renk); this.kafa.setAttribute('r', 0.104 * h);
    this.vurgu = vurgu; this.serit.setAttribute('fill', vurgu || 'none');
  };
  FP.konumla = function (x, y) { this.kok.setAttribute('transform', 'translate(' + x + ' ' + y + ')'); };
  FP.eylemYap = function (e, k, hedef) { if (e === this.eylem && !hedef) return; this.eski = this.sonPose; this.eylem = e; this.bas = k; this.gecisBas = k; if (hedef) this.hedef = hedef; };
  FP.guncelle = function (k) {
    var t = Math.max(0, k - this.bas) + this.faz, p = durus(this.eylem, t, this.hedef);
    var b = this.eski ? yum((k - this.gecisBas) / 8) : 1;
    if (this.eski && b < 1) {
      var q = this.eski;
      p = { sag: lerpV(q.sag, p.sag, b), sol: lerpV(q.sol, p.sol, b), egim: lerp(q.egim, p.egim, b), basEgim: lerp(q.basEgim, p.basEgim, b), yOff: lerp(q.yOff, p.yOff, b), bacak: p.bacak, faz: p.faz, sallan: p.sallan };
    }
    this.sonPose = p; this.cizPose(p, k);
  };
  FP.cizPose = function (d, k) {
    var h = this.boy, E = function (v) { return [v[0] * h, v[1] * h]; };
    var kalcaY = -0.37, omuzY = -0.725, omuzX = 0.178, ust = omuzY - 0.025;
    var elR = ulas(SR, d.sag), elL = ulas(SL, d.sol), dirR = ik(SR, elR, 1), dirL = ik(SL, elL, -1);
    function kol(S, Dd, El) { var a = E(S), b = E(Dd), c = E(El); return 'M ' + a[0] + ' ' + a[1] + ' L ' + b[0] + ' ' + b[1] + ' L ' + c[0] + ' ' + c[1]; }
    this.kolL.setAttribute('d', kol(SL, dirL, elL)); this.kolR.setAttribute('d', kol(SR, dirR, elR));
    var eL = E(elL), eR = E(elR);
    this.elL.setAttribute('cx', eL[0]); this.elL.setAttribute('cy', eL[1]); this.elR.setAttribute('cx', eR[0]); this.elR.setAttribute('cy', eR[1]);
    var hx = 0.068 * h, hy = kalcaY * h, self = this;
    [[this.bl, -1], [this.br, 1]].forEach(function (a) {
      var n = a[0], tr = a[1], x = tr * hx, genlik = d.bacak === 'yuru' ? 24 : 0, aci = genlik * Math.sin(d.faz + (tr === 1 ? 0 : Math.PI));
      if (d.bacak === 'otur') { n.setAttribute('x1', x); n.setAttribute('y1', hy); n.setAttribute('x2', x + 0.26 * h * (tr === 1 ? 1 : 0.9)); n.setAttribute('y2', hy); n.removeAttribute('transform'); return; }
      n.setAttribute('x1', x); n.setAttribute('y1', hy); n.setAttribute('x2', x); n.setAttribute('y2', -0.04 * h);
      n.setAttribute('transform', 'rotate(' + aci + ' ' + x + ' ' + hy + ')');
    });
    this.govde.setAttribute('d',
      'M ' + (-omuzX * h) + ' ' + ((omuzY + 0.05) * h) + ' Q ' + (-omuzX * h) + ' ' + (ust * h) + ' ' + ((-omuzX + 0.075) * h) + ' ' + (ust * h) +
      ' L ' + ((omuzX - 0.075) * h) + ' ' + (ust * h) + ' Q ' + (omuzX * h) + ' ' + (ust * h) + ' ' + (omuzX * h) + ' ' + ((omuzY + 0.05) * h) +
      ' L ' + (0.135 * h) + ' ' + ((kalcaY + 0.02) * h) + ' Q ' + (0.135 * h) + ' ' + ((kalcaY + 0.06) * h) + ' ' + (0.10 * h) + ' ' + ((kalcaY + 0.06) * h) +
      ' L ' + (-0.10 * h) + ' ' + ((kalcaY + 0.06) * h) + ' Q ' + (-0.135 * h) + ' ' + ((kalcaY + 0.06) * h) + ' ' + (-0.135 * h) + ' ' + ((kalcaY + 0.02) * h) + ' Z');
    this.serit.setAttribute('d', 'M ' + (-0.06 * h) + ' ' + ((ust + 0.005) * h) + ' L ' + (0.06 * h) + ' ' + ((ust + 0.005) * h) + ' L ' + (0.045 * h) + ' ' + ((kalcaY + 0.05) * h) + ' L ' + (-0.045 * h) + ' ' + ((kalcaY + 0.05) * h) + ' Z');
    this.kafa.setAttribute('cx', 0); this.kafa.setAttribute('cy', -0.875 * h); this.kafa.setAttribute('transform', 'rotate(' + d.basEgim + ' 0 ' + (-0.775 * h) + ')');
    this.ic.setAttribute('transform', 'rotate(' + d.egim + ' 0 ' + hy + ')');
    var nefes = 1 + 0.012 * Math.sin(k / 60 * TAU);
    this.govde.setAttribute('transform', 'translate(0 ' + hy + ') scale(1 ' + nefes + ') translate(0 ' + (-hy) + ')');
    this.serit.setAttribute('transform', this.govde.getAttribute('transform'));
    this.g.setAttribute('transform', 'translate(' + (d.sallan * h * 0.012) + ' ' + (d.yOff * h) + ')');
    this.dis.setAttribute('transform', 'scale(' + (this.ters ? -this.olcek : this.olcek) + ' ' + this.olcek + ')');
  };

  /* ——— etkiler ——— */
  function parcacik(ust, saat, x, y, o) {
    o = o || {};
    var adet = o.adet || 18, renkler = o.renkler || ['#F4C95D', '#E8A33D', '#F2EADB', '#6FB3B5'], hiz = o.hiz || 420, omur = o.omur || 34, boyut = o.boyut || 16, yer = o.yercekimi == null ? 260 : o.yercekimi;
    var g = sv('g'); ust.appendChild(g); var ps = [], i;
    for (i = 0; i < adet; i++) {
      var tip = i % 3, n = tip === 0 ? sv('path', { d: 'M0 -1 L0.3 -0.3 L1 0 L0.3 0.3 L0 1 L-0.3 0.3 L-1 0 L-0.3 -0.3 Z' }) : tip === 1 ? sv('circle', { r: 0.55 }) : sv('path', { d: 'M0 -1 L0.7 0 L0 1 L-0.7 0 Z' });
      n.setAttribute('fill', renkler[i % renkler.length]); g.appendChild(n); ps.push(n);
    }
    var bas = null, kaldir = saat.ekle(function (dt, k) {
      if (bas === null) bas = k; var t = (k - bas) / omur;
      if (t >= 1) { kaldir(); if (g.parentNode) g.parentNode.removeChild(g); return; }
      var e = cikis(t);
      ps.forEach(function (n, i) {
        var r1 = rnd(i * 13.1 + 1), r2 = rnd(i * 7.7 + 6), r3 = rnd(i * 3.3 + 10), a = r1 * TAU, sp = hiz * (0.45 + 0.75 * r2);
        var s = boyut * (0.6 + r3 * 0.9) * (1 - t * 0.7);
        n.setAttribute('transform', 'translate(' + (x + Math.cos(a) * sp * e) + ' ' + (y + Math.sin(a) * sp * e + yer * t * t) + ') rotate(' + ((r2 - 0.5) * 540 * t) + ') scale(' + s + ')');
        n.setAttribute('opacity', 1 - t * t);
      });
    });
  }
  function sok(ust, saat, x, y, o) {
    o = o || {}; var r0 = o.r0 || 20, r1 = o.r1 || 380, kal = o.kalinlik || 14, omur = o.omur || 22;
    var c = sv('circle', { cx: x, cy: y, fill: 'none', stroke: o.renk || '#F4C95D' }); ust.appendChild(c);
    var bas = null, kaldir = saat.ekle(function (dt, k) {
      if (bas === null) bas = k; var t = (k - bas) / omur;
      if (t >= 1) { kaldir(); if (c.parentNode) c.parentNode.removeChild(c); return; }
      c.setAttribute('r', r0 + (r1 - r0) * cikis(t)); c.setAttribute('stroke-width', kal * (1 - t)); c.setAttribute('opacity', 1 - t);
    });
  }

  /* kinetik yazı: her kelime kendi anında "patlar" */
  function Patla(ust, saat, kelimeler, o) {
    var self = this; o = o || {}; this.o = o; this.k = kelimeler; this.g = sv('g'); ust.appendChild(this.g); this.ogeler = [];
    var boyut = o.boyut || 120, maxW = o.maxW || 1400, buyuk = o.buyuk !== false, satirlar = [], cur = [], top = 0, i;
    kelimeler.forEach(function (w) {
      var y = buyuk ? buyut(w.k) : w.k, gw = genislik(y, w.boyut || boyut) * 1.1 + boyut * 0.24;
      if (cur.length && top + gw > maxW) { satirlar.push(cur); cur = []; top = 0; }
      cur.push({ w: w, y: y, gw: gw }); top += gw;
    });
    if (cur.length) satirlar.push(cur);
    satirlar.forEach(function (s, si) {
      var toplam = 0; s.forEach(function (c) { toplam += c.gw; }); toplam -= boyut * 0.24;
      var cx = (o.x || 0) - toplam / 2;
      s.forEach(function (c) {
        var bs = c.w.boyut || boyut, merkez = cx + (c.gw - boyut * 0.24) / 2; cx += c.gw;
        var gg = sv('g', { opacity: 0 }), tx = sv('text', { x: 0, y: 0, 'text-anchor': 'middle', 'font-family': o.font || FONT, 'font-weight': o.agirlik || 800, 'font-size': bs, fill: c.w.renk || o.renk || '#F2EADB', text: c.y });
        if (o.kontur) { tx.setAttribute('stroke', o.kontur); tx.setAttribute('stroke-width', 8); tx.setAttribute('paint-order', 'stroke'); }
        gg.appendChild(tx); self.g.appendChild(gg);
        self.ogeler.push({ g: gg, x: merkez, y: (o.y || 0) + si * boyut * (o.satirAraligi || 1.12), at: c.w.at, rot: (rnd(self.ogeler.length * 3.3) - 0.5) * 7 });
      });
    });
  }
  Patla.prototype.guncelle = function (ms) {
    var k = ms * 0.03;
    this.ogeler.forEach(function (c) {
      var t = k - c.at * 0.03;
      if (t < 0) { c.g.setAttribute('opacity', 0); return; }
      var g = REDUCED ? 1 : yay(k, c.at * 0.03, 14, 1.15), rot = c.rot * (1 - Math.min(1, t / 24) * 0.7);
      c.g.setAttribute('opacity', clamp(g * 2, 0, 1));
      c.g.setAttribute('transform', 'translate(' + c.x + ' ' + c.y + ') rotate(' + rot + ') scale(' + Math.max(0.001, g) + ')');
    });
  };
  Patla.prototype.goster = function (a) { this.g.style.display = a ? '' : 'none'; };

  /* perde: renkli şerit sahneyi süpürür */
  function Perde(ust) {
    this.p = sv('polygon', { fill: '#E8A33D', opacity: 0 }); ust.appendChild(this.p);
  }
  Perde.prototype.ciz = function (t, yon, renk) {
    if (t <= 0 || t >= 1) { this.p.setAttribute('opacity', 0); return; }
    var e = yumusat(t), kal = 900, W = 1600, H = 900, x = yon === 1 ? -kal + (W + kal * 1.4) * e : W - (W + kal * 1.4) * e;
    this.p.setAttribute('fill', renk || '#E8A33D'); this.p.setAttribute('opacity', 1);
    this.p.setAttribute('points', x + ',0 ' + (x + kal) + ',0 ' + (x + kal - 140 * yon) + ',' + H + ' ' + (x - 140 * yon) + ',' + H);
  };

  /* ortak: tam sahne SVG + alan zemini */
  function sahneKur(ctx, sinif) {
    var kap = el('div', { class: 'ib-sahne ' + (sinif || '') });
    var svg = sv('svg', { viewBox: '0 0 1600 900', class: 'ib-svg', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' });
    var zemin = sv('rect', { width: 1600, height: 900, fill: BG.navy });
    svg.appendChild(zemin);
    kap.appendChild(svg); ctx.kap.appendChild(kap);
    return { kap: kap, svg: svg, zemin: zemin };
  }
  function arkaHareket(ust, saat, renk) {
    var g = sv('g', { opacity: 1 }); ust.appendChild(g); var N = 14, ogeler = [], i;
    for (i = 0; i < N; i++) {
      var sz = 24 + rnd(i * 5.1 + 4) * 70, c = i % 3 === 0 ? sv('circle', { r: sz, fill: 'none', 'stroke-width': 6 }) : i % 3 === 1 ? sv('circle', { r: sz * 0.35 }) : sv('path', { d: 'M ' + (-sz * 0.5) + ' 0 L ' + (sz * 0.5) + ' 0 M 0 ' + (-sz * 0.5) + ' L 0 ' + (sz * 0.5), fill: 'none', 'stroke-width': 8, 'stroke-linecap': 'round' });
      if (i % 3 === 0 || i % 3 === 2) c.setAttribute('stroke', renk || '#F2EADB'); else c.setAttribute('fill', renk || '#F2EADB');
      c.setAttribute('opacity', 0.09 + rnd(i * 5.1 + 4) * 0.06); g.appendChild(c); ogeler.push(c);
    }
    var kaldirArka = saat.ekle(function (dt, k) {
      if (REDUCED) { ogeler.forEach(function (c, i) { c.setAttribute('transform', 'translate(' + (rnd(i * 3.7) * 1720 - 60) + ' ' + (rnd(i * 8.3 + 2) * 800) + ')'); }); kaldirArka(); return; }
      ogeler.forEach(function (c, i) {
        var r1 = rnd(i * 3.7), r2 = rnd(i * 8.3 + 2), r3 = rnd(i * 5.1 + 4);
        var x = r1 * 1720 - 60 + Math.sin(k / (50 + r2 * 40) + i) * 50, y = ((((r2 * 1160 - k * (0.5 + r3 * 1.1)) % 1160) + 1160) % 1160) - 130;
        c.setAttribute('transform', 'translate(' + x + ' ' + y + ') rotate(' + (k * (0.4 + r2 * 0.8) * (i % 2 ? 1 : -1)) + ')');
      });
    });
    return g;
  }
  function metinKutu(svg, x, y, w, yazi, o) { // SVG içinde satır sarmalı metin
    o = o || {}; var bs = o.boyut || 40, satirlar = [], cur = '';
    String(yazi).split(' ').forEach(function (k) {
      var d = cur ? cur + ' ' + k : k;
      if (genislik(d, bs) > w && cur) { satirlar.push(cur); cur = k; } else cur = d;
    });
    if (cur) satirlar.push(cur);
    var g = sv('g'); svg.appendChild(g);
    satirlar.forEach(function (s, i) {
      g.appendChild(sv('text', { x: x, y: y + i * bs * (o.satirAraligi || 1.28), 'text-anchor': o.hiza || 'start', 'font-family': o.font || FONT, 'font-weight': o.agirlik || 800, 'font-size': bs, fill: o.renk || '#F2EADB', text: s }));
    });
    g.satir = satirlar.length;
    return g;
  }
  function kayitSayisi() { return 0; }

  /* dışa ver (diğer blok dosyaları ve testler için) */

  /* ——— ses efektleri ve müzik yatağı (WebAudio sentezi; dosya yok) ——— */
  var Sfx = (function () {
    var c = null;
    function ac() {
      if (!DO.sesAcik) return null;
      if (!c) { try { c = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { c = null; } }
      if (c && c.state === 'suspended') c.resume();
      return c;
    }
    function ton(f0, f1, sure, tip, ses, gec) {
      var x = ac(); if (!x) return; var t = x.currentTime + (gec || 0), o = x.createOscillator(), g = x.createGain();
      o.type = tip || 'sine'; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + sure);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(ses || 0.1, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
      o.connect(g); g.connect(x.destination); o.start(t); o.stop(t + sure + 0.03);
    }
    function gur(sure, f0, f1, ses) {
      var x = ac(); if (!x) return; var n = Math.floor(x.sampleRate * sure), b = x.createBuffer(1, n, x.sampleRate), d = b.getChannelData(0), i;
      for (i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      var s = x.createBufferSource(); s.buffer = b; var f = x.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.1; var t = x.currentTime;
      f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + sure);
      var g = x.createGain(); g.gain.setValueAtTime(ses || 0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
      s.connect(f); f.connect(g); g.connect(x.destination); s.start(t);
    }
    return {
      ac: ac,
      pop: function () { ton(420, 880, 0.09, 'sine', 0.09); },
      tik: function () { ton(1500, 900, 0.05, 'square', 0.1); ton(230, 230, 0.09, 'sine', 0.11); if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) { } } },
      tok: function () { ton(180, 90, 0.14, 'sine', 0.16); },
      vus: function () { gur(0.32, 500, 2800, 0.07); },
      yuk: function () { ton(260, 760, 0.38, 'triangle', 0.07); },
      dus: function () { ton(520, 200, 0.3, 'triangle', 0.07); },
      parilti: function () { ton(1320, 1760, 0.18, 'sine', 0.045); ton(1760, 2350, 0.22, 'sine', 0.035, 0.07); },
      muhur: function () { ton(196, 196, 0.6, 'sine', 0.09); ton(294, 294, 0.6, 'sine', 0.06, 0.03); ton(392, 392, 0.7, 'sine', 0.05, 0.06); }
    };
  })();

  /* müzik yatağı: yumuşak pad + seyrek arpej; anlatım varken kısılır; ♫ düğmesi (DO.sesAcik) kapatır.
     Altı ön ayar (ders JSON'undaki "muzik" ailesi): benlik · soz · iliski · caba · cesaret · inanc.
     ritim: 8 sekizlik adım; sayı = akordaki nota sırası (0-3), -1 = sus. vur/hat: yumuşak vuruş/fısıltı adımları. Tümü kısık; anlatımda zaten 0.2'ye iner. */
  var MUZIK_ONAYAR = {
    benlik:  { bpm: 84,  akor: [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 60, 64], [55, 59, 62, 67]], ritim: [0, -1, 2, -1, 1, 3, 2, -1], pad: 'triangle', padSes: 0.018, padAtak: 0.5, arp: 'sine', arpSes: 0.03, arpSure: 0.5, arpOkt: 12, bas: 0.05, basTip: 'sine' },
    soz:     { bpm: 100, akor: [[50, 53, 57, 60], [55, 59, 62, 65], [48, 52, 55, 59], [57, 60, 64, 67]], ritim: [0, -1, 2, 1, -1, 3, 2, -1], pad: 'triangle', padSes: 0.014, padAtak: 0.25, arp: 'triangle', arpSes: 0.03, arpSure: 0.28, arpOkt: 12, bas: 0.045, basTip: 'sine', vur: [0, 4], hat: [1, 3, 5, 7] },
    iliski:  { bpm: 88,  akor: [[55, 59, 62, 67], [52, 55, 59, 64], [48, 55, 60, 64], [50, 57, 62, 66]], ritim: [0, -1, 1, -1, 2, -1, 1, 3], pad: 'sine', padSes: 0.024, padAtak: 0.7, arp: 'sine', arpSes: 0.03, arpSure: 0.8, arpOkt: 12, bas: 0.05, basTip: 'sine', pad2: 'triangle' },
    caba:    { bpm: 104, akor: [[52, 55, 59, 64], [48, 52, 55, 60], [55, 59, 62, 67], [50, 54, 57, 62]], ritim: [0, 1, 2, 3, 2, 1, 2, 3], pad: 'triangle', padSes: 0.014, padAtak: 0.3, arp: 'triangle', arpSes: 0.026, arpSure: 0.3, arpOkt: 12, bas: 0.04, basTip: 'triangle', basNabiz: true, vur: [0, 4] },
    cesaret: { bpm: 96,  akor: [[50, 57, 62, 69], [45, 52, 57, 64], [47, 54, 59, 66], [43, 50, 55, 62]], ritim: [0, -1, 2, -1, 1, -1, 3, 2], pad: 'triangle', padSes: 0.02, padAtak: 0.35, arp: 'triangle', arpSes: 0.034, arpSure: 0.55, arpOkt: 12, bas: 0.055, basTip: 'sine', davul: [0, 3, 4] },
    inanc:   { bpm: 72,  akor: [[50, 57, 60, 64], [55, 59, 62, 64], [48, 55, 59, 64], [50, 57, 59, 62]], ritim: [0, -1, -1, -1, 2, -1, -1, -1], pad: 'sine', padSes: 0.026, padAtak: 1.4, arp: 'sine', arpSes: 0.03, arpSure: 1.5, arpOkt: 12, bas: 0.055, basTip: 'sine', drone: true }
  };
  var Muzik = (function () {
    var c = null, master = null, tim = null, sonrakiT = 0, adim = 0, aktif = false, kapat = null, kisik = false, P = MUZIK_ONAYAR.benlik, ad = 'benlik', gurBuf = null;
    function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function aile() {
      var O = DO.Oynatici, d = (O && O.ders) || DO._ders || {};
      return MUZIK_ONAYAR[d.muzik] ? d.muzik : 'benlik';
    }
    function not(x, hedef, f, t, sure, tip, ses, atak) {
      var o = x.createOscillator(), g = x.createGain(); o.type = tip; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(ses, t + (atak || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(sure, (atak || 0.01) + 0.05));
      o.connect(g); g.connect(hedef); o.start(t); o.stop(t + sure + 0.05);
    }
    function vurus(x, hedef, t, tip, ses) {   /* yumuşak vuruş: 'tok' = alçak davul, 'hat' = kısa fısıltı */
      if (tip === 'hat') {
        if (!gurBuf || gurBuf.sampleRate !== x.sampleRate) { var n = Math.floor(x.sampleRate * 0.05), b = x.createBuffer(1, n, x.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); gurBuf = b; }
        var s = x.createBufferSource(); s.buffer = gurBuf; var f = x.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6500; var g = x.createGain(); g.gain.value = ses;
        s.connect(f); f.connect(g); g.connect(hedef); s.start(t);
      } else {
        var o = x.createOscillator(), g2 = x.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(tip === 'davul' ? 96 : 120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
        g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(ses, t + 0.008); g2.gain.exponentialRampToValueAtTime(0.0001, t + (tip === 'davul' ? 0.34 : 0.2));
        o.connect(g2); g2.connect(hedef); o.start(t); o.stop(t + 0.4);
      }
    }
    /* tek bir adımı planla (x: bağlam, hedef: çıkış düğümü, p: ön ayar, a: adım sayacı, t: zaman) */
    function adimPlanla(x, hedef, p, a, t) {
      var beat = 60 / p.bpm / 2, bar = Math.floor(a / 8) % p.akor.length, ak = p.akor[bar], k = a % 8;
      if (k === 0) {
        ak.forEach(function (m) { not(x, hedef, hz(m - 12), t, beat * 8.4, p.pad, p.padSes, p.padAtak); });
        if (p.pad2) ak.forEach(function (m) { not(x, hedef, hz(m), t, beat * 8.2, p.pad2, p.padSes * 0.5, p.padAtak + 0.2); });
        not(x, hedef, hz(ak[0] - 24), t, beat * 8, p.basTip, p.bas, 0.1);
        if (p.drone && bar % 2 === 0) not(x, hedef, hz(26), t, beat * 16, 'sine', 0.03, 1.6);
      }
      if (p.basNabiz && k % 2 === 0 && k > 0) not(x, hedef, hz(ak[0] - 24), t, beat * 1.6, p.basTip, p.bas * 0.8, 0.01);
      var r = p.ritim[k]; if (r >= 0) not(x, hedef, hz(ak[r] + p.arpOkt), t, p.arpSure, p.arp, p.arpSes, 0.005);
      if (p.vur && p.vur.indexOf(k) >= 0) vurus(x, hedef, t, 'tok', 0.045);
      if (p.davul && p.davul.indexOf(k) >= 0) vurus(x, hedef, t, 'davul', k === 0 ? 0.06 : 0.04);
      if (p.hat && p.hat.indexOf(k) >= 0) vurus(x, hedef, t, 'hat', 0.012);
    }
    function planla() {
      if (!aktif || !c) return;
      var hedefSes = !DO.sesAcik ? 0.0001 : (kisik ? 0.2 : 0.55);
      if (hedefSes !== sonSes) ses(hedefSes);
      if (!DO.sesAcik) { sonrakiT = Math.max(sonrakiT, c.currentTime + 0.1); return; }
      while (sonrakiT < c.currentTime + 0.7) { adimPlanla(c, master, P, adim, sonrakiT); sonrakiT += 60 / P.bpm / 2; adim++; }
    }
    var sonSes = -1;
    function ses(v) { sonSes = v; if (master && c) master.gain.setTargetAtTime(v, c.currentTime, 0.3); }
    return {
      baslat: function () {
        var x = Sfx.ac(); if (!x || REDUCED) return; c = x;
        if (kapat) { clearTimeout(kapat); kapat = null; }
        if (aktif) { ses(kisik ? 0.2 : 0.55); return; }
        ad = aile(); P = MUZIK_ONAYAR[ad];
        master = c.createGain(); master.gain.value = 0.0001; master.connect(c.destination); sonSes = -1; ses(kisik ? 0.2 : 0.55);
        aktif = true; sonrakiT = c.currentTime + 0.15; adim = 0; tim = setInterval(planla, 200); planla();
      },
      birak: function (sn) {
        if (!aktif) return; if (kapat) clearTimeout(kapat);
        kapat = setTimeout(function () { if (!aktif) return; ses(0.0001); aktif = false; clearInterval(tim); setTimeout(function () { try { master.disconnect(); } catch (e) { } }, 1500); }, (sn || 1.2) * 1000);
      },
      kis: function (k) { kisik = !!k; if (aktif) ses(!DO.sesAcik ? 0.0001 : (k ? 0.2 : 0.55)); },
      /* test/ölçüm: ön ayarı çevrimdışı çal (OfflineAudioContext), AudioBuffer döndür */
      render: function (aileAd, sn, oc) {
        var p = MUZIK_ONAYAR[aileAd]; if (!p) return null; var m = oc.createGain(); m.gain.value = 1; m.connect(oc.destination);
        var t = 0.05, a = 0, beat = 60 / p.bpm / 2; while (t < sn) { adimPlanla(oc, m, p, a, t); t += beat; a++; }
        return oc.startRendering();
      },
      aile: function () { return aktif ? ad : aile(); },
      onayarlar: MUZIK_ONAYAR
    };
  })();

  /* ——— anlatım: sesli satırlar + altyazı + kelime zamanları (ders.sesler) ——— */
  function sade(s) { return String(s).toLowerCase().replace(/I/g, 'ı').replace(/İ/g, 'i').replace(/[^a-zçğıöşüâîû0-9]/g, ''); }
  function Anlat(ctx) {
    var self = this; this.ctx = ctx; this.ses = (ctx.ders && ctx.ders.sesler) || {}; this.calan = null; this.olu = false; this.kisTim = null;
    ctx.oynatici.temizlikler.push(function () { self.kapat(); });
  }
  var AP = Anlat.prototype;
  AP.sure = function (id) { return this.ses[id] ? this.ses[id].sure : 3; };
  /** satırdaki kelimenin (tam eşleşme) başlangıcı, sn */
  AP.kelime = function (id, ara, n) {
    var s = this.ses[id]; if (!s) return 0; var a = sade(ara), c = 0, i;
    for (i = 0; i < s.k.length; i++) if (sade(s.k[i][0]) === a) { c++; if (c === (n || 1)) return s.k[i][1]; }
    return 0;
  };
  AP.kelimeSon = function (id, ara) {
    var s = this.ses[id]; if (!s) return 0; var a = sade(ara), i; for (i = 0; i < s.k.length; i++) if (sade(s.k[i][0]) === a) return s.k[i][2]; return s.sure;
  };
  AP.acik = function () { var O = this.ctx.oynatici; return !!(O.ayar && O.ayar.anlatim && (!this.ctx.sesBende || this.ctx.sesBende())); };
  AP.cal = function (id) {
    var self = this, s = this.ses[id]; if (!s || this.olu) return 0;
    this.sustur(); this.ctx.altyazi(s.m); Muzik.kis(true);
    var kayit = { id: id, audio: null };
    if (this.acik()) {
      try { kayit.audio = new Audio(this.ctx.yol(s.d)); kayit.audio.preload = 'auto'; var p = kayit.audio.play(); if (p && p.catch) p.catch(function () { }); } catch (e) { }
    }
    this.calan = kayit;
    kayit.zaman = this.ctx.zaman(function () { if (self.calan === kayit) { self.calan = null; self.ctx.altyazi(''); Muzik.kis(false); } }, s.sure * 1000 + 250);
    return s.sure;
  };
  AP.sustur = function () {
    var k = this.calan; if (!k) return; this.calan = null; if (k.audio) { try { k.audio.pause(); k.audio.src = ''; } catch (e) { } }
    this.ctx.altyazi(''); Muzik.kis(false);
  };
  AP.degisti = function (acik) { /* konuşma düğmesi: çalan satırı sustur; yenisi açıkken çalar */ if (!acik) { var k = this.calan; if (k && k.audio) { try { k.audio.pause(); } catch (e) { } } } };
  AP.kapat = function () { this.sustur(); this.olu = true; };
  /** satırları art arda planla: [{id, gec(sn)}] → {id: başlangıç ms}; toplam ms */
  AP.plan = function (liste, bas) {
    var t = bas || 0, o = { bas: {}, toplam: 0 }, self = this;
    liste.forEach(function (l) { t += (l.gec == null ? 0 : l.gec * 1000); o.bas[l.id] = t; t += self.sure(l.id) * 1000; });
    o.toplam = t; return o;
  };

  DO.Ibre = { Kadran: Kadran, Figur: Figur, Patla: Patla, Perde: Perde, Saat: Saat, parcacik: parcacik, sok: sok, sahneKur: sahneKur, arkaHareket: arkaHareket, metinKutu: metinKutu, Sfx: Sfx, Muzik: Muzik, Anlat: Anlat,
    ZON: ZON, BG: BG, ISARET: ISARET, KUTUP: KUTUP, MERKEZ: MERKEZ, FONT: FONT, SERIF: SERIF, clamp: clamp, lerp: lerp, ilerle: ilerle, yumusat: yumusat, cikis: cikis, yay: yay, rnd: rnd,
    zonDe: zonDe, buyut: buyut, karisim: karisim, genislik: genislik, TEST: TEST, REDUCED: REDUCED };
  function titret(kap) { kap.classList.remove('ib-titre'); void kap.offsetWidth; kap.classList.add('ib-titre'); }

  var I = DO.Ibre;
  function aciklamaMetin(a) { return a; }

  /* =====================================================================
     İBRE AÇILIŞ — sesli, kelimeye kilitli animasyonlu tanıtım (video gibi, ama kodla) ve merak sorusu
     Alanlar: huy, olculen, kanca, uclar{az,orta,fazla}, soru, yesil. Sesler: a1 (kanca), a2 (ibre fikri), a3 (soru)
     ===================================================================== */
  B.ibreAcilis = {
    canli: 'bireysel-sabit', zorunlu: true, max: function () { return 0; },
    ciz: function (ctx) {
      var b = ctx.blok, saat = new Saat(ctx), S = sahneKur(ctx, 'ib-acilis'), svg = S.svg, h = b.yesil || 0.26, A = new Anlat(ctx);
      Muzik.baslat(); ctx.oynatici.temizlikler.push(function () { Muzik.birak(1.4); });
      var P = A.plan([{ id: 'a1', gec: 0.6 }, { id: 'a2', gec: 1.1 }, { id: 'a3', gec: 0.9 }]);
      var L1 = P.bas.a1, L2 = P.bas.a2, L3 = P.bas.a3, E1 = L1 + A.sure('a1') * 1000, E2 = L2 + A.sure('a2') * 1000, T_BIR = E1 + 650, T_UC = E2 + 250, END = P.toplam + 1100;
      var gA = sv('g'), gB = sv('g'), gC = sv('g'); svg.appendChild(arkaHareket(svg, saat)); svg.appendChild(gA); svg.appendChild(gB); svg.appendChild(gC);

      /* — A: kanca (kelime kelime, sesle) — */
      var kanca = String(b.kanca).split(' '), s1 = A.ses.a1;
      var kel = kanca.map(function (w, i) { return { k: w, at: L1 + (s1 ? s1.k[Math.min(i, s1.k.length - 1)][1] * 1000 : i * 430) - 60, renk: i === kanca.length - 1 ? '#F4C95D' : null }; });
      var pa = new Patla(gA, saat, kel, { x: 800, y: 250, boyut: 112, maxW: 1380, satirAraligi: 1.14 });
      var soruA = sv('text', { x: 1090, y: 700, 'text-anchor': 'middle', 'font-family': FONT, 'font-weight': 900, 'font-size': 130, fill: '#F4C95D', text: '?', opacity: 0 }); gA.appendChild(soruA);

      /* — B: ibre fikri — */
      var yaziB1 = metinKutu(gB, 110, 250, 560, 'Birçok güzel huy bir ibre gibidir.', { boyut: 60, agirlik: 700 });
      var tHuy = L2 + A.kelime('a2', b.huyAnahtar || b.huy) * 1000 - 60, tOlc = L2 + A.kelime('a2', 'ölçer') * 1000 - 400, tUc = L2 + A.kelime('a2', 'üç') * 1000 - 100;
      var pb = new Patla(gB, saat, [{ k: b.huy, at: tHuy, renk: '#F4C95D', boyut: 128 }], { x: 390, y: 440, boyut: 128, maxW: 620 });
      var chip = sv('g', { opacity: 0 }); gB.appendChild(chip);
      chip.appendChild(sv('rect', { x: 100, y: 485, width: 600, height: 170, rx: 30, fill: 'rgba(255,255,255,0.14)', stroke: '#fff', 'stroke-opacity': 0.55, 'stroke-width': 3 }));
      chip.appendChild(sv('text', { x: 132, y: 531, 'font-family': FONT, 'font-weight': 800, 'font-size': 26, 'letter-spacing': 3, fill: '#F4C95D', text: 'ÖLÇÜLEN' }));
      metinKutu(chip, 132, 580, 540, b.olculen, { boyut: 36, agirlik: 700 });
      var zonYazi = sv('text', { x: 110, y: 735, 'font-family': FONT, 'font-weight': 900, 'font-size': 96, fill: '#fff', opacity: 0, text: '' }); gB.appendChild(zonYazi);
      var tAz = L2 + A.kelime('a2', 'az') * 1000 - 80, tOr = L2 + A.kelime('a2', 'kararında') * 1000 - 80, tFa = L2 + A.kelime('a2', 'fazla') * 1000 - 80;

      /* — C: soru — */
      var kart = sv('g', { opacity: 0 }); gC.appendChild(kart);
      kart.appendChild(sv('rect', { x: 200, y: 130, width: 1200, height: 210, rx: 40, fill: '#FFFBF1' }));
      kart.appendChild(sv('text', { x: 244, y: 250, 'font-family': SERIF, 'font-weight': 700, 'font-size': 190, fill: '#E8A33D', opacity: 0.9, text: '“' }));
      metinKutu(kart, 800, 240, 1000, b.kanca, { boyut: 76, hiza: 'middle', renk: '#14264A', font: FONT });
      var soruMetin = sv('g', { opacity: 0 }); gC.appendChild(soruMetin);
      metinKutu(soruMetin, 800, 440, 1300, b.soru, { boyut: 68, hiza: 'middle', renk: '#F4C95D' });
      var soruC = sv('text', { x: 1290, y: 700, 'text-anchor': 'middle', 'font-family': FONT, 'font-weight': 900, 'font-size': 190, fill: '#F4C95D', text: '?', opacity: 0 }); gC.appendChild(soruC);

      var gG = sv('g'); svg.appendChild(gG);
      var kd = new Kadran(gG, saat, { x: 800, y: 705, s: 0.8, h: h, etiket: b.uclar, notr: false });
      var perde = new Perde(svg);
      var atla = el('button', { class: 'ib-atla', text: 'Atla ⏭', onclick: function () { git(END); } });
      var basla = el('button', { class: 'dug ana ib-basla', style: { display: 'none' }, text: 'Tahmin etmeye hazırım →', onclick: function () { ctx.ileri(); } });
      S.kap.appendChild(atla); S.kap.appendChild(basla);

      var t = 0, faz = '', bitti = false, atlandi = false, F = {};
      function once(ad, fn) { if (!F[ad]) { F[ad] = 1; fn(); } }
      function zon(ad, a) { zonYazi.textContent = ISARET[ad] + ' ' + (ad === 'orta' ? 'KARARINDA' : ad === 'az' ? 'AZ' : 'FAZLA'); zonYazi.setAttribute('opacity', a); }
      function cizim(ms) {
        var yeni = ms < T_BIR ? 'A' : (ms < T_UC ? 'B' : 'C');
        if (yeni !== faz) {
          faz = yeni; gA.style.display = yeni === 'A' ? '' : 'none'; gB.style.display = yeni === 'B' ? '' : 'none'; gC.style.display = yeni === 'C' ? '' : 'none';
          if (yeni === 'A') kd.konumla(800, 705, 0.8);
          if (yeni === 'B') { kd.konumla(1060, 610, 2.0); kd.git(0, { anlik: true }); kd.etiketGoster(0); }
          if (yeni === 'C') { kd.konumla(800, 705, 1.12); kd.etiketGoster(1); }
        }
        if (ms >= L1) once('a1', function () { A.cal('a1'); });
        if (ms >= L2) once('a2', function () { A.cal('a2'); });
        if (ms >= L3) once('a3', function () { A.cal('a3'); });
        var bg = BG.navy;
        if (yeni === 'B') {
          if (ms >= tAz && ms < tOr) bg = karisim(BG.navy, BG.az, ilerle(ms, tAz, tAz + 300));
          else if (ms >= tOr && ms < tFa) bg = karisim(BG.navy, BG.orta, ilerle(ms, tOr, tOr + 300));
          else if (ms >= tFa && ms < tFa + 900) bg = karisim(BG.navy, BG.fazla, ilerle(ms, tFa, tFa + 300) * (1 - ilerle(ms, tFa + 650, tFa + 900)));
        }
        S.zemin.setAttribute('fill', bg);
        if (yeni === 'A') {
          pa.guncelle(ms);
          kel.forEach(function (w, i) { once('kw' + i, function () { if (ms - w.at < 400) Sfx.pop(); }); });
          var ay = yay(ms * 0.03, (E1 + 100) * 0.03, 16); soruA.setAttribute('opacity', clamp(ay * 2, 0, 1)); soruA.setAttribute('transform', 'translate(0 ' + (1 - Math.min(1, ay)) * 40 + ')');
          if (ms >= E1 + 100) once('q1', function () { Sfx.yuk(); });
          kd.git(0.86 * Math.sin(ms / 430) * (1 - ilerle(ms, E1 - 700, E1 + 300)), { hizli: true });
          kd.kok.setAttribute('opacity', clamp(ms / 500, 0, 1));
        }
        if (yeni === 'B') {
          yaziB1.setAttribute('opacity', clamp((ms - L2) / 300, 0, 1)); yaziB1.setAttribute('transform', 'translate(0 ' + (1 - cikis(ilerle(ms, L2, L2 + 350))) * 30 + ')');
          pb.guncelle(ms); if (ms >= tHuy) once('huy', function () { Sfx.pop(); });
          var cy = yay(ms * 0.03, tOlc * 0.03, 16); chip.setAttribute('opacity', clamp(cy * 2, 0, 1)); chip.setAttribute('transform', 'translate(0 ' + (1 - Math.min(1, cy)) * 40 + ')');
          kd.kok.setAttribute('opacity', 1); kd.etiketGoster(ilerle(ms, tUc, tUc + 350));
          var hedef = ms < tAz ? 0 : ms < tOr ? MERKEZ.az : ms < tFa ? 0 : ms < tFa + 900 ? MERKEZ.fazla : 0;
          if (hedef !== kd.hedef) kd.git(hedef);
          if (ms >= tAz && ms < tOr) { zon('az', ilerle(ms, tAz + 40, tAz + 340)); once('zaz', function () { Sfx.vus(); titret(S.kap); }); }
          else if (ms >= tOr && ms < tFa) zon('orta', ilerle(ms, tOr + 40, tOr + 340));
          else if (ms >= tFa && ms < tFa + 900) { zon('fazla', ilerle(ms, tFa + 40, tFa + 340)); once('zfa', function () { Sfx.vus(); titret(S.kap); }); }
          else zonYazi.setAttribute('opacity', 0);
          if (ms >= tOr + 330) once('tik', function () { Sfx.tik(); Sfx.parilti(); titret(S.kap); parcacik(svg, saat, 1060, 610 - 150 * 2.0, { adet: 22, hiz: 300 }); sok(svg, saat, 1060, 610 - 120 * 2.0, { r1: 360, renk: '#F4C95D' }); });
        }
        if (yeni === 'C') {
          var ky = yay(ms * 0.03, (T_UC + 100) * 0.03, 18); kart.setAttribute('opacity', clamp(ky * 2, 0, 1)); kart.setAttribute('transform', 'translate(0 ' + (1 - Math.min(1, ky)) * -60 + ')');
          var sy = yay(ms * 0.03, (L3 + 50) * 0.03, 16); soruMetin.setAttribute('opacity', clamp(sy * 2, 0, 1)); soruMetin.setAttribute('transform', 'translate(0 ' + (1 - Math.min(1, sy)) * 40 + ')');
          var qy = yay(ms * 0.03, (L3 + 800) * 0.03, 16); soruC.setAttribute('opacity', clamp(qy * 2, 0, 1)); soruC.setAttribute('transform', 'translate(0 ' + (1 - Math.min(1, qy)) * 40 + ')');
          if (ms >= T_UC + 100) once('kart', function () { Sfx.pop(); });
          if (ms >= L3 + 800) once('q2', function () { Sfx.yuk(); });
          kd.git(0.55 * Math.sin((ms - T_UC) / 520), { hizli: true });
        }
        var pt = ms >= T_BIR - 300 && ms < T_BIR + 250 ? ilerle(ms, T_BIR - 300, T_BIR + 250) : (ms >= T_UC - 300 && ms < T_UC + 250 ? ilerle(ms, T_UC - 300, T_UC + 250) : 0);
        perde.ciz(pt, ms < T_UC - 400 ? 1 : -1, ms < T_UC - 400 ? BG.amber : BG.orta);
        if (ms >= T_BIR - 300) once('p1', function () { Sfx.vus(); });
        if (ms >= T_UC - 300) once('p2', function () { Sfx.vus(); });
        if (ms >= END && !bitti) bit();
      }
      function bit() {
        bitti = true; atla.style.display = 'none'; basla.style.display = '';
        ctx.etkiles('acilis', 'Açılış izlendi', { atlandi: atlandi });
        ctx.tamamla({ puan: 0, max: 0 });
        if (!REDUCED) basla.classList.add('ib-nabiz');
      }
      function git(ms) { if (ms >= END) { atlandi = t < END - 400; A.sustur(); F.a1 = F.a2 = F.a3 = 1; } t = Math.min(ms, END); cizim(t); }
      saat.ekle(function (dt) { if (bitti) return; t = Math.min(END, t + dt); cizim(t); });
      if (REDUCED) { t = END; A.sustur(); F.a1 = F.a2 = F.a3 = 1; cizim(t); } else cizim(0);
      if (TEST) window.__ibre.git = git;
      return { anlatimDegisti: function (a) { A.degisti(a); } };
    }
  };

  /* =====================================================================
     İBRE TAHMİN — "Bu cümle ibrenin neresinde?" Önce karar ver (ibre + eminlik), sonra aç. Sesler: t1 (yönerge), t2 (açıklama), t3 (kapıya geçiş)
     ===================================================================== */
  var EMIN = [{ v: 'bilmiyorum', m: 'Bilmiyorum' }, { v: 'galiba', m: 'Galiba' }, { v: 'eminim', m: 'Eminim' }];
  B.ibreTahmin = {
    canli: 'bireysel', zorunlu: true, xapiTur: 'assessment', max: function () { return 0; },
    ciz: function (ctx) {
      var b = ctx.blok, saat = new Saat(ctx), S = sahneKur(ctx, 'ib-tahmin'), svg = S.svg, h = b.yesil || 0.26, A = new Anlat(ctx);
      Muzik.baslat(); ctx.oynatici.temizlikler.push(function () { Muzik.birak(1.4); });
      ctx.zaman(function () { A.cal('t1'); }, 500);
      svg.appendChild(arkaHareket(svg, saat));
      var kart = sv('g'); svg.appendChild(kart);
      kart.appendChild(sv('rect', { x: 90, y: 110, width: 660, height: 300, rx: 44, fill: '#FFFBF1' }));
      kart.appendChild(sv('text', { x: 124, y: 250, 'font-family': SERIF, 'font-weight': 700, 'font-size': 220, fill: '#E8A33D', opacity: 0.9, text: '“' }));
      metinKutu(kart, 420, 238, 540, b.cumle, { boyut: 56, hiza: 'middle', renk: '#14264A' });
      var yonerge = el('div', { class: 'ib-yonerge' }, [el('b', { text: b.yonerge || 'İbreyi sürükle: bu cümle hangi uca yakın?' }), el('span', { text: 'Önce karar ver; sonra göreceğiz.' })]);
      var gG = sv('g'); svg.appendChild(gG);
      var durum = { t: 0, emin: null, kilit: false, dokundu: false };
      var kd = new Kadran(gG, saat, {
        x: 1130, y: 600, s: 2.0, h: h, notr: true, interaktif: true, etiket: b.uclar, etiketRenk: '#fff',
        onBirak: function (t) { ctx.eylem('birak', { t: Math.round(t * 100) / 100 }); },
        onHedef: function (t, z) { if (!durum.kilit) { durum.dokundu = true; kontrol(); } kd.hit.setAttribute('aria-valuenow', t.toFixed(2)); kd.hit.setAttribute('aria-valuetext', (z === 'az' ? 'sol uç' : z === 'fazla' ? 'sağ uç' : 'orta') + ': ' + b.uclar[z]); },
        engel: function () { return ctx.izliyor && ctx.izliyor(); }
      });
      svg.removeAttribute('aria-hidden'); kd.hit.setAttribute('aria-valuemin', '-1'); kd.hit.setAttribute('aria-valuemax', '1'); kd.hit.setAttribute('aria-valuenow', '0');
      kd.etiketGoster(0);
      var etiketBtn = el('div', { class: 'ib-emin', role: 'group', 'aria-label': 'Ne kadar eminsin?' }, [el('span', { class: 'ib-emin-et', text: 'Ne kadar eminsin?' })]);
      EMIN.forEach(function (e) { etiketBtn.appendChild(el('button', { class: 'ib-chip', 'data-v': e.v, text: e.m, onclick: function () { ctx.eylem('emin', { v: e.v }); } })); });
      var tamam = el('button', { class: 'dug ana ib-karar', disabled: true, text: 'Bıraktım', onclick: function () { ctx.eylem('karar', {}); } });
      var panel = el('div', { class: 'ib-panel', style: { display: 'none' } });
      S.kap.appendChild(yonerge); S.kap.appendChild(etiketBtn); S.kap.appendChild(tamam); S.kap.appendChild(panel);
      function kontrol() { tamam.disabled = !(durum.dokundu && durum.emin) || durum.kilit; }
      kd.hit.setAttribute('tabindex', '0'); kd.hit.setAttribute('role', 'slider'); kd.hit.setAttribute('aria-label', 'Tahmin ibresi. Cümle: ' + b.cumle);
      kd.hit.addEventListener('keydown', function (e) { if (kd.tus(e)) { e.preventDefault(); ctx.eylem('birak', { t: kd.hedef }); } });

      ctx.eylemTanimla('birak', function (v, k) { if (durum.kilit) return; durum.t = v.t; durum.dokundu = true; if (!k.yerel || Math.abs(kd.hedef - v.t) > 0.01) kd.git(v.t); if (!k.tekrar) Sfx.tok(); kontrol(); });
      ctx.eylemTanimla('emin', function (v, k) {
        if (durum.kilit) return; durum.emin = v.v;
        Array.prototype.forEach.call(etiketBtn.querySelectorAll('.ib-chip'), function (c) { var a = c.getAttribute('data-v') === v.v; c.classList.toggle('secili', a); c.setAttribute('aria-pressed', a ? 'true' : 'false'); });
        if (!k.tekrar) Sfx.pop(); kontrol();
      });
      ctx.eylemTanimla('karar', function (v, k) {
        if (durum.kilit || !durum.emin) return; durum.kilit = true; kd.o.kilitli = true; tamam.style.display = 'none';
        Array.prototype.forEach.call(etiketBtn.querySelectorAll('.ib-chip'), function (c) { c.disabled = true; });
        var t = kd.hedef, z = zonDe(t, h), dogru = z === b.hedefZon;
        if (!k.tekrar) { Sfx.vus(); Sfx.yuk(); titret(S.kap); }
        kd.etiketGoster(1); kd.hayalet(MERKEZ[b.hedefZon]); kd.o.notr = false;
        for (var a in kd.arc) kd.arc[a].setAttribute('opacity', a === b.hedefZon ? 1 : 0.38);
        var bas = saat.ms();
        saat.ekle(function () { var u = ilerle(saat.ms() - bas, 0, 600); S.zemin.setAttribute('fill', karisim(BG.navy, BG[b.hedefZon], yumusat(u))); });
        var baslik = dogru ? 'Dersin okumasıyla aynı yere koydun.' :
          (durum.emin === 'eminim' ? 'Emindin ve farklı okudun. Şaşırdığımız yer, öğrendiğimiz yerdir.' : durum.emin === 'bilmiyorum' ? 'Bilmiyorum demek de başlangıçtır.' : 'Farklı bir okuma yaptın; ikisine de bakalım.');
        var par = (b.aciklama || []).map(function (p) { return el('p', { text: p }); });
        panel.innerHTML = ''; panel.style.display = '';
        DO.ekle(panel, [
          el('div', { class: 'ib-rozet z-' + b.hedefZon, text: ISARET[b.hedefZon] + ' ' + KUTUP[b.hedefZon] }),
          el('h3', { text: baslik })
        ].concat(par).concat([
          b.merak ? el('p', { class: 'ib-merak', text: b.merak }) : null,
          el('button', { class: 'dug ana', text: 'Kapıları aç →', onclick: function () { ctx.ileri(); } })
        ]));
        yonerge.style.display = 'none'; etiketBtn.style.display = 'none'; kart.style.display = 'none';
        var pb = panel.querySelector('button'); if (pb) pb.focus({ preventScroll: true });
        if (!k.tekrar) ctx.zaman(function () { var d = A.cal('t2'); ctx.zaman(function () { A.cal('t3'); }, d * 1000 + 450); }, 900);
        if (k.yerel) {
          ctx.cevap({ oge: 'tahmin', ad: b.cumle, yanit: 'ibre=' + z + ' (' + Math.round(t * 100) / 100 + ') · eminlik=' + durum.emin, dogru: null, dogruYanit: b.hedefZon, etkilesim: 'performance', puan: 0, max: 0 });
          ctx.tamamla({ puan: 0, max: 0 });
        }
      });
      if (TEST) window.__ibre.kd = kd;
      return { anlatimDegisti: function (a) { A.degisti(a); } };
    }
  };

  /* =====================================================================
     İBRE KAPILAR — merak ettiğin kapıyı aç: kısa, sesli bir sahne; sonra "iç ses" sorusu (isteğe bağlı).
     Zorunlu değil: bir kapıdan sonra devam edebilir, istersen diğerlerini de açarsın.
     Alanlar: huy, uclar, yesil, baslik, yonerge, kapilar[{zon, soru, ad, tanim, soz, eylem, anahtar{ad,soz}, zincir[], zincirAnahtar[], ic{soru, secenekler[{m,dogru,not}]}}]
     Sesler: k0 (açılış), kaz1-3 / kfa1-3 / kor1-3 (sahne, zincir, soru), k9 (diğer kapılar)
     ===================================================================== */
  var KSES = { az: 'kaz', fazla: 'kfa', orta: 'kor' };
  B.ibreKapilar = {
    canli: 'ortak', ortakDestek: true, zorunlu: true, xapiTur: 'assessment', max: function () { return 0; },
    ciz: function (ctx) {
      var b = ctx.blok, kapilar = b.kapilar, h = b.yesil || 0.26, A = new Anlat(ctx);
      Muzik.baslat(); ctx.oynatici.temizlikler.push(function () { Muzik.birak(1.4); });
      var kok = el('div', { class: 'ib-kapilar' }); ctx.kap.appendChild(kok);
      var acilan = {}, biten = {}, cevaplanan = {}, aktif = null, sahne = null, tamamlandi = false, k9 = false;
      var sira = ctx.karistir(kapilar.map(function (k) { return k.zon; }), 'kapilar');
      var hub = el('div', { class: 'ib-hub' }); kok.appendChild(hub);
      function bitenSay() { return Object.keys(biten).length; }

      function hubCiz() {
        hub.innerHTML = ''; var n = bitenSay();
        hub.appendChild(el('div', { class: 'ib-hub-ust' }, [
          el('h2', { text: b.baslik || 'Üç kapı' }),
          el('p', { text: n ? 'İstersen başka bir kapı da aç; ya da devam et.' : (b.yonerge || 'Hangi kapıyı açmak istersin?') })
        ]));
        var satir = el('div', { class: 'ib-kapi-satir' }); hub.appendChild(satir);
        sira.forEach(function (zn, i) {
          var k = kapilar.filter(function (x) { return x.zon === zn; })[0], a = !!biten[zn];
          var aci = MERKEZ[zn] * D;
          var mini = '<svg viewBox="-120 -130 240 150" class="ib-kapi-mini"><path d="M-100 0 A100 100 0 0 1 100 0" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="16" stroke-linecap="round"/>' +
            '<g transform="rotate(' + aci + ')"><path d="M0 -92 L7 0 L-7 0Z" fill="#fff"/></g><circle r="11" fill="#fff"/></svg>';
          satir.appendChild(el('button', { class: 'ib-kapi z-' + zn + (a ? ' acik' : ''), style: { animationDelay: (i * 0.12) + 's' }, 'data-z': zn, onclick: function () { ctx.eylem('ac', { zon: zn }); } }, [
            el('span', { class: 'ib-kapi-isaret', text: ISARET[zn] }),
            el('span', { class: 'ib-kapi-mini-kap', html: mini }),
            el('span', { class: 'ib-kapi-soru', text: k.soru }),
            el('span', { class: 'ib-kapi-alt', text: a ? '✓ ' + k.ad : (n ? 'İsteğe bağlı' : 'Kapıyı aç') })
          ]));
        });
        hub.appendChild(el('div', { class: 'ib-hub-alt' }, [
          n >= kapilar.length ? el('span', { class: 'ib-sayac', text: 'Üç kapıyı da açtın' }) : null,
          n >= 1 ? el('button', { class: 'dug ana', text: 'Devam →', onclick: function () { ctx.ileri(); } }) : null
        ]));
      }

      function sahneAc(zn) {
        var k = kapilar.filter(function (x) { return x.zon === zn; })[0], pre = KSES[zn], l1 = pre + '1', l2 = pre + '2', l3 = pre + '3';
        aktif = zn; hub.style.display = 'none';
        var saat = new Saat(ctx), S = sahneKur(ctx, 'ib-kapi-sahne'); sahne = { S: S, saat: saat };
        S.kap.style.zIndex = 5; kok.appendChild(S.kap);
        var svg = S.svg, t0 = saat.ms(), asama = 0, F = {};
        saat.ekle(function () { S.zemin.setAttribute('fill', karisim(BG.navy, BG[zn], yumusat(ilerle(saat.ms() - t0, 0, 500)))); });
        svg.appendChild(arkaHareket(svg, saat));
        var gG = sv('g'); svg.appendChild(gG);
        var kd = new Kadran(gG, saat, { x: 400, y: 520, s: 1.7, h: h, etiket: b.uclar, notr: false });
        kd.git(0, { anlik: true }); kd.etiketGoster(1);
        var fig = new Figur(svg, { x: 1400, y: 790, boy: 340, vurgu: ZON[zn], eylem: 'nefes' });
        fig.olcek = zn === 'az' ? 0.9 : zn === 'fazla' ? 1.1 : 1;
        saat.ekle(function (dt, kk) { fig.guncelle(kk); });
        saat.ekle(function () { var g = REDUCED ? 1 : yay((saat.ms() - t0) * 0.03, 10, 16); fig.kok.setAttribute('opacity', clamp(g * 2, 0, 1)); });
        var yz = ISARET[zn] + ' ' + KUTUP[zn], w = genislik(yz, 30) + 70, tag = sv('g', { transform: 'translate(800 135)' }); svg.appendChild(tag);
        tag.appendChild(sv('rect', { x: -w / 2, y: -32, width: w, height: 64, rx: 32, fill: 'rgba(255,255,255,0.16)', stroke: '#fff', 'stroke-opacity': 0.6, 'stroke-width': 2.5 }));
        tag.appendChild(sv('text', { x: 0, y: 11, 'text-anchor': 'middle', 'font-family': FONT, 'font-weight': 800, 'font-size': 30, 'letter-spacing': 3, fill: '#fff', text: yz }));

        var P = A.plan([{ id: l1, gec: 0.9 }, { id: l2, gec: 0.45 }, { id: l3, gec: 0.4 }]);
        var tAd = P.bas[l1] + A.kelime(l1, k.anahtar.ad) * 1000 - 60, tSoz = P.bas[l1] + A.kelime(l1, k.anahtar.soz) * 1000 - 80;
        var pad = new Patla(svg, saat, [{ k: k.ad, at: tAd, renk: '#F4C95D' }], { x: 400, y: 705, boyut: Math.min(104, 600 / Math.max(1, genislik(buyut(k.ad), 1) * 1.1)), maxW: 700 });
        var bal = sv('g', { opacity: 0 }); svg.appendChild(bal);
        var sw = 470, bg = sv('rect', { x: -sw / 2, y: -150, width: sw, height: 170, rx: 36, fill: '#FFFBF1' });
        bal.appendChild(sv('path', { d: 'M -150 15 L -190 90 L -90 15 Z', fill: '#FFFBF1' })); bal.appendChild(bg);
        bal.appendChild(sv('text', { x: -sw / 2 + 24, y: -85, 'font-family': SERIF, 'font-weight': 700, 'font-size': 120, fill: ZON[zn], opacity: 0.9, text: '“' }));
        metinKutu(bal, 20, -80, sw - 100, k.soz, { boyut: 38, hiza: 'middle', renk: '#14264A' });
        fig.eylemYap(k.eylem || 'konus', 0, zn === 'fazla' ? [-0.62, -0.74] : undefined); if (zn === 'fazla') fig.ters = true;

        var panel = el('div', { class: 'ib-kpanel z-' + zn }); S.kap.appendChild(panel);
        var geri = el('button', { class: 'ib-geri', style: { display: 'none' }, text: 'Kapılara dön →', onclick: function () { ctx.eylem('don', { zon: zn }); } }); S.kap.appendChild(geri);
        var atla = el('button', { class: 'ib-atla', text: 'Soruya geç ⏭', onclick: function () { A.sustur(); F.l1 = F.l2 = F.l3 = 1; t0 = saat.ms() - P.bas[l3] - 50; asamaYaz(2); } }); S.kap.appendChild(atla);
        var beats = [];

        function asamaYaz(a) {
          if (a <= asama && a !== 0) { if (a === asama) return; }
          asama = a; panel.innerHTML = ''; panel.classList.add('goruldu'); beats = [];
          if (a === 1) {
            panel.appendChild(el('h3', { text: 'Sonra ne olur?' }));
            var liste = el('ol', { class: 'ib-zincir' }); panel.appendChild(liste);
            k.zincir.forEach(function (m, i) {
              var li = el('li', { text: m }); liste.appendChild(li);
              beats.push({ li: li, at: P.bas[l2] + A.kelime(l2, (k.zincirAnahtar || [])[i] || '') * 1000 - 40 });
            });
          } else if (a === 2) {
            atla.style.display = 'none';
            panel.appendChild(el('h3', { text: k.ic.soru }));
            var kutu = el('div', { class: 'ib-ic' }); panel.appendChild(kutu);
            ctx.karistir(k.ic.secenekler.map(function (s, i) { return { s: s, i: i }; }), 'ic-' + zn).forEach(function (o) {
              kutu.appendChild(el('button', { class: 'ib-ic-sec', 'data-i': o.i, text: '“' + o.s.m + '”', onclick: function () { ctx.eylem('ic', { zon: zn, i: o.i }); } }));
            });
            panel.appendChild(el('button', { class: 'ib-gec', text: 'Şimdilik cevaplamadan dön', onclick: function () { ctx.eylem('don', { zon: zn }); } }));
            if (cevaplanan[zn] != null) ickoy(zn, cevaplanan[zn], true);
          }
        }
        sahne.ickoy = null;
        saat.ekle(function (dt, kk, ms) {
          var t = ms - t0;
          if (!F.l1 && t >= P.bas[l1]) { F.l1 = 1; A.cal(l1); kd.git(MERKEZ[zn]); Sfx.vus(); titret(S.kap); }
          if (t >= tAd) { if (!F.ad) { F.ad = 1; Sfx.pop(); } }
          pad.guncelle(t);
          var bg2 = REDUCED ? 1 : yay(t * 0.03, tSoz * 0.03, 18); var goster = t >= tSoz && asama < 1;
          bal.setAttribute('opacity', goster ? clamp(bg2 * 2, 0, 1) : 0); bal.setAttribute('transform', 'translate(1320 ' + (400 + (1 - Math.min(1, bg2)) * 40) + ') scale(' + (0.6 + 0.4 * Math.min(1.08, bg2)) + ')');
          if (goster && !F.soz) { F.soz = 1; Sfx.pop(); }
          if (!F.l2 && t >= P.bas[l2]) { F.l2 = 1; A.cal(l2); if (asama < 1) { asamaYaz(1); Sfx.vus(); } }
          if (!F.l3 && t >= P.bas[l3]) { F.l3 = 1; A.cal(l3); if (asama < 2) { asamaYaz(2); Sfx.yuk(); } }
          beats.forEach(function (bt) { if (t >= bt.at && !bt.li.classList.contains('goster')) { bt.li.classList.add('goster'); Sfx.pop(); } });
        });
        setTimeout(function () { try { atla.focus({ preventScroll: true }); } catch (e) { } }, 60);
      }

      function ickoy(zn, i, sessiz) {
        var k = kapilar.filter(function (x) { return x.zon === zn; })[0], s = k.ic.secenekler[i], panel = sahne.S.kap.querySelector('.ib-kpanel');
        var dogruI = 0; k.ic.secenekler.forEach(function (x, j) { if (x.dogru) dogruI = j; });
        Array.prototype.forEach.call(panel.querySelectorAll('.ib-ic-sec'), function (bt) {
          bt.disabled = true; var j = +bt.getAttribute('data-i'); if (j === i) bt.classList.add('secildi'); if (j === dogruI) bt.classList.add('uygun');
        });
        var g = panel.querySelector('.ib-gec'); if (g) g.style.display = 'none';
        panel.appendChild(el('p', { class: 'ib-not', text: (s.dogru ? 'Bu ses bu ucun sesi. ' : 'Bu ses başka bir ucun sesi gibi duruyor. ') + (s.not || '') }));
        panel.scrollTop = panel.scrollHeight;
        sahne.S.kap.querySelector('.ib-geri').style.display = '';
        if (!sessiz) { Sfx.tok(); }
      }
      function sahneKapat() {
        A.sustur(); if (sahne) { if (sahne.S.kap.parentNode) sahne.S.kap.parentNode.removeChild(sahne.S.kap); sahne.saat.kapat(); sahne = null; }
        aktif = null; hub.style.display = ''; hubCiz();
        var d0 = hub.querySelector('.ib-kapi'); if (d0) d0.focus({ preventScroll: true });
        if (!k9 && bitenSay() === 1 && bitenSay() < kapilar.length) { k9 = true; ctx.zaman(function () { A.cal('k9'); }, 600); }
      }

      ctx.eylemTanimla('ac', function (v, kk) {
        if (aktif) return;
        if (!acilan[v.zon] && kk.yerel) ctx.etkiles('kapi-' + v.zon, 'Kapı açıldı: ' + v.zon);
        acilan[v.zon] = true; A.sustur(); sahneAc(v.zon); if (!kk.tekrar) Sfx.tok();
      });
      ctx.eylemTanimla('ic', function (v, kk) {
        if (!sahne || aktif !== v.zon || cevaplanan[v.zon] != null) return;
        var k = kapilar.filter(function (x) { return x.zon === v.zon; })[0], s = k.ic.secenekler[v.i]; cevaplanan[v.zon] = v.i;
        var dogruI = 0; k.ic.secenekler.forEach(function (x, j) { if (x.dogru) dogruI = j; });
        ickoy(v.zon, v.i, kk.tekrar);
        if (kk.yerel) ctx.cevap({ oge: 'ic-ses-' + v.zon, ad: k.ic.soru, yanit: s.m, dogru: !!s.dogru, dogruYanit: k.ic.secenekler[dogruI].m, etkilesim: 'choice', puan: 0, max: 0 });
      });
      ctx.eylemTanimla('don', function (v) {
        if (!sahne) return; biten[v.zon] = true;
        if (!tamamlandi) { tamamlandi = true; ctx.tamamla({ puan: 0, max: 0 }); }
        sahneKapat();
      });
      hubCiz(); ctx.zaman(function () { A.cal('k0'); }, 700);
      return { temizle: function () { if (sahne) sahne.saat.kapat(); }, anlatimDegisti: function (a) { A.degisti(a); } };
    }
  };

  /* =====================================================================
     İBRE SENARYO — "Sen olsan?" Seçimin sonucu sesle, ibreyle ve çevredekilerin tepkisiyle gösterilir.
     İstersen üç sonucu yan yana görürsün; istersen devam edersin. Doğru/yanlış damgası yok.
     Alanlar: huy, uclar, yesil, baslik, karsiSes, sonSes, sonBaslik, sonMetin,
     senaryolar[{id, baslik, tetik, ses, secenekler[{m, zon, sonuc, not, ses}]}]
     ===================================================================== */
  var TEPKI = {
    az: { arkadas: 'dusun', ters: true, dx: 70, olcek: 0.9, opak: 0.6, kisi: 'yaslan', ibre: -0.72 },
    fazla: { arkadas: 'saskin', ters: false, dx: 110, olcek: 0.82, opak: 0.75, kisi: 'isaret', ibre: 0.72 },
    orta: { arkadas: 'sevinc', ters: false, dx: -55, olcek: 1, opak: 1, kisi: 'konus', ibre: 0 }
  };
  B.ibreSenaryo = {
    canli: 'ortak', ortakDestek: true, zorunlu: true, xapiTur: 'assessment', max: function () { return 0; },
    ciz: function (ctx) {
      var b = ctx.blok, h = b.yesil || 0.26, sens = b.senaryolar, A = new Anlat(ctx);
      Muzik.baslat(); ctx.oynatici.temizlikler.push(function () { Muzik.birak(1.4); });
      var si = 0, denenen = {}, tamam = false, konusuldu = {};
      var saat = new Saat(ctx), S = sahneKur(ctx, 'ib-senaryo'), svg = S.svg;
      var bgHedef = BG.navy, bgSimdi = BG.navy, bgT = 1;
      saat.ekle(function (dt) { bgT = Math.min(1, bgT + dt / 500); S.zemin.setAttribute('fill', karisim(bgSimdi, bgHedef, yumusat(bgT))); });
      function bgGit(c) { bgSimdi = bgHedef; bgHedef = c; bgT = 0; }
      svg.appendChild(arkaHareket(svg, saat));
      var gG = sv('g'); svg.appendChild(gG);
      var kd = new Kadran(gG, saat, { x: 440, y: 400, s: 1.35, h: h, etiket: b.uclar, notr: true }); kd.etiketGoster(1); kd.vurgu({ az: 0.5, orta: 0.5, fazla: 0.5 });
      var ana = new Figur(svg, { x: 440, y: 782, boy: 290, vurgu: '#F4C95D', eylem: 'nefes' });
      var f1 = new Figur(svg, { x: 215, y: 788, boy: 200, renk: '#C9D3E8', eylem: 'nefes', faz: 9 }), f2 = new Figur(svg, { x: 665, y: 788, boy: 200, renk: '#C9D3E8', eylem: 'nefes', faz: 21, ters: true });
      var hedefDx = 0, dx = 0, hedefOlcek = 1, olcek = 1, hedefOpak = 1, opak = 1;
      saat.ekle(function (dt, kk) {
        dx += (hedefDx - dx) * Math.min(1, dt / 220); olcek += (hedefOlcek - olcek) * Math.min(1, dt / 220); opak += (hedefOpak - opak) * Math.min(1, dt / 220);
        f1.konumla(215 - dx, 788); f2.konumla(665 + dx, 788); f1.olcek = f2.olcek = olcek; f1.kok.setAttribute('opacity', opak); f2.kok.setAttribute('opacity', opak);
        ana.guncelle(kk); f1.guncelle(kk); f2.guncelle(kk);
      });
      var panel = el('div', { class: 'ib-sen-panel' }); S.kap.appendChild(panel);
      function baslangic() {
        var k = saat.ms() * 0.03; hedefDx = 0; hedefOlcek = 1; hedefOpak = 1; f1.eylemYap('nefes', k); f2.eylemYap('nefes', k); ana.eylemYap('nefes', k);
        kd.git(0); kd.vurgu({ az: 0.5, orta: 0.5, fazla: 0.5 }); bgGit(BG.navy); f1.ters = true; f2.ters = true; ana.ters = false;
      }
      function ust(s) { return el('div', { class: 'ib-sen-ust' }, [el('span', { class: 'ib-sen-no', text: (b.baslik || 'Sen olsan?') + ' · ' + (si + 1) + '/' + sens.length }), el('h3', { text: s.baslik })]); }
      function secenekler() {
        var s = sens[si]; panel.innerHTML = '';
        DO.ekle(panel, [ust(s), el('p', { class: 'ib-sen-tetik', text: s.tetik }), el('div', { class: 'ib-sen-sorus', text: 'Ne yaparsın? Birini seç; istersen sonra diğerlerine de bakarsın.' })]);
        var kutu = el('div', { class: 'ib-sen-sec' }); panel.appendChild(kutu);
        ctx.karistir(s.secenekler.map(function (o, i) { return { o: o, i: i }; }), 'sen' + si).forEach(function (x) {
          var d = (denenen[si] || {})[x.i];
          kutu.appendChild(el('button', { class: 'ib-sen-btn' + (d ? ' denendi' : ''), 'data-i': x.i, onclick: function () { ctx.eylem('sec', { s: si, i: x.i }); } }, [el('span', { class: 'ib-sen-ok', text: d ? '✓' : '•' }), el('span', { text: '“' + x.o.m + '”' })]));
        });
        if (!konusuldu[si]) { konusuldu[si] = 1; ctx.zaman(function () { A.cal(s.ses); }, 600); }
      }
      function butonlar() {
        var satir = el('div', { class: 'ib-sen-butonlar' });
        satir.appendChild(el('button', { class: 'dug ikincil', text: 'Üçünü yan yana gör', onclick: function () { ctx.eylem('karsi', { s: si }); } }));
        satir.appendChild(el('button', { class: 'dug ikincil', text: '← Başka seçenek', onclick: function () { ctx.eylem('don', { s: si }); } }));
        if (si < sens.length - 1) satir.appendChild(el('button', { class: 'dug ikincil', text: 'Bir durum daha', onclick: function () { ctx.eylem('sonraki', { s: si }); } }));
        satir.appendChild(el('button', { class: 'dug ana', text: 'Devam →', onclick: function () { ctx.eylem('son', { s: si }); } }));
        return satir;
      }
      function sonuc(i, tekrar) {
        var s = sens[si], o = s.secenekler[i], t = TEPKI[o.zon], k = saat.ms() * 0.03; panel.innerHTML = '';
        kd.vurgu({ az: o.zon === 'az' ? 1 : 0.35, orta: o.zon === 'orta' ? 1 : 0.35, fazla: o.zon === 'fazla' ? 1 : 0.35 });
        kd.git(t.ibre); bgGit(BG[o.zon]); hedefDx = t.dx; hedefOlcek = t.olcek; hedefOpak = t.opak;
        ana.eylemYap(t.kisi, k, o.zon === 'fazla' ? [-0.6, -0.8] : undefined); ana.ters = o.zon === 'fazla';
        f1.eylemYap(t.arkadas, k); f2.eylemYap(t.arkadas, k); f1.ters = o.zon === 'az'; f2.ters = o.zon !== 'az';
        if (!tekrar) { Sfx.vus(); titret(S.kap); if (o.zon === 'orta') Sfx.parilti(); ctx.zaman(function () { A.cal(o.ses); }, 450); }
        DO.ekle(panel, [
          el('div', { class: 'ib-rozet z-' + o.zon, text: ISARET[o.zon] + ' ' + KUTUP[o.zon] }),
          el('p', { class: 'ib-sen-secim', text: 'Sen: “' + o.m + '”' }),
          el('h3', { text: o.sonuc }),
          o.not ? el('p', { class: 'ib-not', text: o.not }) : null,
          butonlar()
        ]);
      }
      function karsi() {
        var s = sens[si]; panel.innerHTML = '';
        kd.vurgu({ az: 0.5, orta: 0.5, fazla: 0.5 }); bgGit(BG.navy); hedefDx = 0; hedefOlcek = 1; hedefOpak = 1;
        var kartlar = el('div', { class: 'ib-karsi' });
        ['az', 'orta', 'fazla'].forEach(function (zn, j) {
          var o = s.secenekler.filter(function (x) { return x.zon === zn; })[0];
          var mini = '<svg viewBox="-120 -130 240 150" class="ib-karsi-mini"><path d="M-100 0 A100 100 0 0 1 100 0" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="16" stroke-linecap="round"/><g transform="rotate(' + (MERKEZ[zn] * D) + ')"><path d="M0 -92 L7 0 L-7 0Z" fill="#fff"/></g><circle r="11" fill="#fff"/></svg>';
          kartlar.appendChild(el('div', { class: 'ib-karsi-kart z-' + zn, style: { animationDelay: (0.2 + j * 0.45) + 's' } }, [
            el('span', { class: 'ib-karsi-mini-kap', html: mini }), el('b', { text: ISARET[zn] + ' ' + (zn === 'az' ? 'Az' : zn === 'fazla' ? 'Fazla' : 'Kararında') }),
            el('span', { class: 'ib-karsi-m', text: '“' + o.m + '”' }), el('span', { class: 'ib-karsi-s', text: o.sonuc })
          ]));
        });
        DO.ekle(panel, [ust(s), el('h3', { text: 'Aynı sahne, üç ayrı ibre' }), kartlar,
          el('div', { class: 'ib-sen-butonlar' }, [el('button', { class: 'dug ikincil', text: '← Seçeneklere dön', onclick: function () { ctx.eylem('don', { s: si }); } }), el('button', { class: 'dug ana', text: 'Devam →', onclick: function () { ctx.eylem('son', { s: si }); } })])]);
        panel.classList.add('genis');
        if (b.karsiSes) ctx.zaman(function () { A.cal(b.karsiSes); }, 400);
      }
      ctx.eylemTanimla('sec', function (v, kk) {
        if (v.s !== si) return; var s = sens[si], o = s.secenekler[v.i]; (denenen[si] = denenen[si] || {})[v.i] = true; panel.classList.remove('genis');
        if (kk.yerel) ctx.cevap({ oge: 'senaryo-' + s.id, ad: s.baslik + ' — ' + s.tetik, yanit: o.m + ' (' + o.zon + ')', dogru: null, etkilesim: 'choice', puan: 0, max: 0 });
        if (!tamam) { tamam = true; ctx.tamamla({ puan: 0, max: 0 }); }
        A.sustur(); sonuc(v.i, kk.tekrar);
      });
      ctx.eylemTanimla('karsi', function (v, kk) { if (v.s !== si) return; A.sustur(); if (!kk.tekrar) { Sfx.yuk(); } karsi(); });
      ctx.eylemTanimla('don', function (v) { if (v.s !== si) return; A.sustur(); panel.classList.remove('genis'); baslangic(); secenekler(); });
      ctx.eylemTanimla('sonraki', function (v) { if (v.s !== si || si >= sens.length - 1) return; A.sustur(); si++; panel.classList.remove('genis'); baslangic(); secenekler(); });
      ctx.eylemTanimla('son', function (v, kk) {
        if (v.s !== si) return; A.sustur(); baslangic(); panel.classList.remove('genis'); panel.innerHTML = '';
        DO.ekle(panel, [
          el('h3', { text: b.sonBaslik || 'Aynı durum, farklı ibre.' }),
          el('p', { class: 'ib-sen-tetik', text: b.sonMetin || '' }),
          el('button', { class: 'dug ana', text: 'Devam →', onclick: function () { ctx.ileri(); } })
        ]);
        if (!tamam) { tamam = true; ctx.tamamla({ puan: 0, max: 0 }); }
        if (!kk.tekrar && b.sonSes) ctx.zaman(function () { A.cal(b.sonSes); }, 500);
        var pb = panel.querySelector('button'); if (pb) pb.focus({ preventScroll: true });
      });
      baslangic(); secenekler();
      return { anlatimDegisti: function (a) { A.degisti(a); } };
    }
  };

})();

/* ——— Dikey telefonda dersi 90° döndür (yalnız ibre-* dersleri) ———
   Telefonun ekran kilidi açık/kapalı olsun, ders girişte tam ekran görünür; okumak için telefonu yan çevirmek yeter.
   Telefon yatay olunca (ya da geniş ekranda) bu mod kendiliğinden kapanır. Ölçek/sürükleme düzeltmeleri oynatici.js'te (O.rot, O.delta). */
(function () {
  'use strict';
  var d = new URLSearchParams(location.search).get('d') || '';
  if (!/^ibre-/.test(d) || !window.matchMedia) return;
  var mq = window.matchMedia('(orientation: portrait) and (max-width: 700px)');
  function uygula() {
    var dikey = mq.matches, O = window.DO && window.DO.Oynatici;
    document.documentElement.classList.toggle('do-dikey', dikey);
    if (O) O.rot = dikey ? 90 : 0;
    window.dispatchEvent(new Event('resize'));
    var n = 0, iv = setInterval(function () { window.dispatchEvent(new Event('resize')); if (++n > 25) clearInterval(iv); }, 300);   /* sahne geç kurulursa ölçek yenilensin */
  }
  var ipucuGosterildi = false;
  function ipucu() {   /* dikey okunur kısa uyarı: içerik yan döndü, telefonu çevirince okunur */
    if (ipucuGosterildi || !mq.matches) return; ipucuGosterildi = true;
    var e = document.createElement('div'); e.className = 'do-dikey-ipucu'; e.innerHTML = '<span>📱↻</span> Ders yan yatık görünür: telefonunu yan çevirerek oku';
    e.onclick = function () { if (e.parentNode) e.parentNode.removeChild(e); };
    document.body.appendChild(e); setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 9000);
  }
  uygula();
  window.addEventListener('load', function () { setTimeout(ipucu, 500); });
  if (mq.addEventListener) mq.addEventListener('change', uygula); else if (mq.addListener) mq.addListener(uygula);
  window.addEventListener('load', function () { uygula(); setTimeout(uygula, 600); });
})();
