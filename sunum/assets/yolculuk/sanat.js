/* Birlikte İyilik Akademi · çizimler
   Maskot Biri, logo, karakterler, seri amblemleri, ders kapakları ve tanıtım pulları.
   Hepsi satır içi SVG'dir; ağ isteği veya dış görsel gerektirmez. */
(function (root) {
  'use strict';
  var serial = 0;
  function uid(prefix) { serial += 1; return prefix + serial; }

  var SERIES = {
    fikih: {title: 'Fıkıh', from: '#19b49a', to: '#0b6b62', ink: '#063f3a', soft: '#dff6f0'},
    siyer: {title: 'Siyer', from: '#ffae4d', to: '#d9572b', ink: '#6b2408', soft: '#ffefdc'},
    adab: {title: 'Âdâb', from: '#ff8aa0', to: '#c8395b', ink: '#5e1026', soft: '#ffe6ec'},
    ibre: {title: 'İbremetre', from: '#7d8cff', to: '#3d45c4', ink: '#151a63', soft: '#e7e9ff'},
    akaid: {title: 'Akaid', from: '#e9c46a', to: '#b8862b', ink: '#4a3306', soft: '#fbf1d8'},
    okuma: {title: 'Okuma', from: '#2fc486', to: '#127a52', ink: '#063d28', soft: '#dcf7ea'}
  };
  var COLORS = {
    zumrut: ['#38d3a0', '#0f8b6a'], gece: ['#5a74d6', '#1f2c6b'], gunes: ['#ffcf5c', '#ee8f1f'],
    gul: ['#ff9fb3', '#d6456b'], mor: ['#b294ff', '#6640c9'], deniz: ['#5cc8ff', '#1670c4']
  };

  /* ---------- Maskot: Biri ----------
     Çizim app/maskot.js içindedir (scripts/maskot üreticisinden). Eski çağrılar
     mood ile gelir: smile, happy, celebrate, think, wow, sleep … ya da doğrudan poz adı. */
  function star(cx, cy, r, fill, extra) {
    var points = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 : r;
      points.push((cx + Math.cos(a) * rr).toFixed(2) + ' ' + (cy + Math.sin(a) * rr).toFixed(2));
    }
    return '<path d="M' + points.join(' L') + ' Z" fill="' + fill + '" stroke-linejoin="round" ' + (extra || '') + '/>';
  }
  function hilal(options) {
    options = options || {};
    var mood = options.pose || options.mood || 'smile', maskot = root.BiriMaskot;
    if (!maskot) return '';
    return maskot.svg(mood, {label: options.label || 'Biri', cls: 'maskot maskot-' + maskot.mood(mood), small: options.small, still: options.still, tema: options.tema, kit: options.kit});
  }
  function logo(options) { return root.BiriMaskot ? root.BiriMaskot.logo(options) : ''; }

  /* ---------- Karakterler ---------- */
  var FIGURES = {
    hilal: function (id) {
      return '<mask id="' + id + 'c"><rect width="64" height="64" fill="#fff"/><circle cx="41" cy="26" r="15" fill="#000"/></mask>' +
        '<circle cx="32" cy="33" r="18" fill="#fff4d6" mask="url(#' + id + 'c)"/>' + mini([22, 33], [29, 31], [26, 39]);
    },
    yildiz: function () { return star(32, 34, 19, '#fff4d6', 'stroke="#fff4d6" stroke-width="4"') + mini([27, 33], [37, 33], [32, 39]); },
    lale: function () {
      return '<path d="M32 48 V58" stroke="#d8f5c8" stroke-width="3.4" stroke-linecap="round"/><path d="M32 56 q-9 -2 -12 -9 q8 0 12 7z" fill="#d8f5c8"/><path d="M32 56 q9 -2 12 -9 q-8 0 -12 7z" fill="#d8f5c8"/>' +
        '<path d="M18 22 q2 18 14 26 q12 -8 14 -26 q-6 6 -9 4 q-3 -8 -5 -12 q-2 4 -5 12 q-3 2 -9 -4z" fill="#fff4d6"/>' + mini([27, 34], [37, 34], [32, 40]);
    },
    kitap: function () {
      return '<rect x="17" y="15" width="30" height="36" rx="5" fill="#fff4d6"/><rect x="17" y="45" width="30" height="6" rx="3" fill="#f2dcae"/><path d="M39 15 v14 l3.5 -3 l3.5 3 V15" fill="#ff8f86"/>' + mini([26, 31], [36, 31], [31, 37]);
    },
    fener: function () {
      return '<path d="M28 9 h8 M32 9 v5" stroke="#fff4d6" stroke-width="3" stroke-linecap="round"/><path d="M22 18 h20 l-3 -4 h-14z" fill="#fff4d6"/>' +
        '<rect x="19" y="18" width="26" height="32" rx="10" fill="#fff4d6"/><rect x="23.5" y="22" width="17" height="24" rx="7" fill="#ffe08a"/><path d="M22 50 h20 l-3 5 h-14z" fill="#fff4d6"/>' + mini([28, 33], [36, 33], [32, 38]);
    },
    damla: function () { return '<path d="M32 9 C40 21 48 30 48 39 a16 16 0 0 1 -32 0 C16 30 24 21 32 9z" fill="#fff4d6"/><path d="M23 38 a9 9 0 0 0 5 8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>' + mini([27, 37], [37, 37], [32, 43]); }
  };
  function mini(left, right, mouth) {
    return '<circle cx="' + left[0] + '" cy="' + left[1] + '" r="2.3" fill="#2b2140"/><circle cx="' + right[0] + '" cy="' + right[1] + '" r="2.3" fill="#2b2140"/>' +
      '<path d="M' + (mouth[0] - 3.4) + ' ' + mouth[1] + ' q3.4 3.6 6.8 0" fill="none" stroke="#2b2140" stroke-width="2" stroke-linecap="round"/>' +
      '<ellipse cx="' + (left[0] - 3) + '" cy="' + (left[1] + 4) + '" rx="2.4" ry="1.5" fill="#ff8f86" opacity=".6"/><ellipse cx="' + (right[0] + 3) + '" cy="' + (right[1] + 4) + '" rx="2.4" ry="1.5" fill="#ff8f86" opacity=".6"/>';
  }
  function avatar(value, options) {
    options = options || {};
    var figure = value && FIGURES[value.figure] ? value.figure : null;
    var color = value && COLORS[value.color] ? value.color : 'gece', pair = COLORS[color], id = uid('a');
    var svg = '<svg class="avatar-art" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs><linearGradient id="' + id + 'b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + pair[0] + '"/><stop offset="1" stop-color="' + pair[1] + '"/></linearGradient></defs>' +
      '<circle cx="32" cy="32" r="32" fill="url(#' + id + 'b)"/><circle cx="22" cy="16" r="14" fill="#fff" opacity=".14"/>';
    if (figure) svg += FIGURES[figure](id);
    else svg += '<text x="32" y="42" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="28" fill="#fff">' + escape(options.initial || '•') + '</text>';
    return svg + '</svg>';
  }
  function escape(value) { return String(value).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); }

  /* ---------- Seri amblemleri ---------- */
  var EMBLEMS = {
    fikih: '<path d="M11 41 V23 a13 13 0 0 1 26 0 V41" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linejoin="round"/><path d="M17 41 V25 a7 7 0 0 1 14 0 V41" fill="currentColor" opacity=".35"/><path d="M7 41 h34" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M24 4 a4.6 4.6 0 1 0 4 6.6 a3.6 3.6 0 1 1 -4 -6.6z" fill="currentColor"/>',
    siyer: '<path d="M3 42 q11 -9 22 -3 t20 -1 V45 H3z" fill="currentColor" opacity=".4"/><path d="M24 40 q2 -12 -2 -22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M22 18 q-8 -4 -14 2 q8 -1 14 -2zM22 18 q8 -5 15 1 q-8 -1 -15 -1zM22 18 q-3 -8 -11 -9 q5 5 11 9zM22 18 q4 -8 12 -8 q-6 4 -12 8z" fill="currentColor"/><circle cx="38" cy="9" r="3" fill="currentColor" opacity=".55"/>',
    adab: '<path d="M24 41 C9 31 5 23 5 17 a9.5 9.5 0 0 1 19 -2.6 A9.5 9.5 0 0 1 43 17 c0 6 -4 14 -19 24z" fill="currentColor"/><path d="M14 17 a5 5 0 0 1 5 -5" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.6" stroke-linecap="round"/>',
    ibre: '<path d="M6 34 a18 18 0 0 1 9 -15.6" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity=".55"/><path d="M18 16.6 a18 18 0 0 1 12 0" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M33 18.4 a18 18 0 0 1 9 15.6" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity=".55"/><path d="M24 34 L31 20" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><circle cx="24" cy="34" r="4.4" fill="currentColor"/><path d="M8 41 h32" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".4"/>',
    akaid: '<path d="M11 11 H37 V37 H11z M24 5.6 L42.4 24 L24 42.4 L5.6 24z" fill="currentColor" opacity=".35"/><path d="M11 11 H37 V37 H11z M24 5.6 L42.4 24 L24 42.4 L5.6 24z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><circle cx="24" cy="24" r="5.5" fill="currentColor"/>',
    okuma: '<path d="M24 13 C18 8 10 8 5 10 v26 c5 -2 13 -2 19 3 c6 -5 14 -5 19 -3 V10 c-5 -2 -13 -2 -19 3z" fill="currentColor" opacity=".35"/><path d="M24 13 C18 8 10 8 5 10 v26 c5 -2 13 -2 19 3 c6 -5 14 -5 19 -3 V10 c-5 -2 -13 -2 -19 3zM24 13 v26" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M34 14 l-1.4 15" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>'
  };
  function emblem(series, className) {
    return '<svg class="' + (className || 'emblem') + '" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' + (EMBLEMS[series] || EMBLEMS.fikih) + '</svg>';
  }

  /* ---------- Ders kapağı ---------- */
  function pattern(id, color) {
    // Sekiz köşeli yıldız (Rub el-Hizb) deseni.
    return '<pattern id="' + id + '" width="60" height="60" patternUnits="userSpaceOnUse"><g fill="none" stroke="' + color + '" stroke-width="1.2">' +
      '<rect x="19" y="19" width="22" height="22"/><rect x="19" y="19" width="22" height="22" transform="rotate(45 30 30)"/><path d="M0 0 l8 8 M60 0 l-8 8 M0 60 l8 -8 M60 60 l-8 -8"/></g></pattern>';
  }
  function cover(lesson, options) {
    options = options || {};
    var s = SERIES[lesson && lesson.series] || SERIES.fikih, id = uid('c'), seed = hash(lesson && lesson.id || 'x');
    // Amblem 4:3 kırpımda da görünür kalır; küçük kare resimlerde ortada durur.
    var dx = options.center ? 160 : 190 + seed % 26, dy = options.center ? 92 : 78 + seed % 30;
    var svg = '<svg class="cover-art" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + s.from + '"/><stop offset="1" stop-color="' + s.to + '"/></linearGradient>' +
      '<radialGradient id="' + id + 'r" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      pattern(id + 'p', '#ffffff') + '</defs>' +
      '<rect width="320" height="180" fill="url(#' + id + 'g)"/><rect width="320" height="180" fill="url(#' + id + 'p)" opacity=".16"/>' +
      '<circle cx="' + dx + '" cy="' + dy + '" r="96" fill="url(#' + id + 'r)"/>' +
      '<circle cx="' + (40 + seed % 60) + '" cy="168" r="64" fill="#fff" opacity=".08"/>' +
      '<g transform="translate(' + (dx - 50) + ' ' + (dy - 52) + ') scale(2.1)" color="#fff">' + (EMBLEMS[lesson && lesson.series] || EMBLEMS.fikih) + '</g>';
    if (options.number !== false && lesson && Number.isInteger(lesson.order)) {
      svg += '<text x="48" y="160" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="72" fill="#fff" opacity=".24">' + lesson.order + '</text>';
    }
    return svg + '</svg>';
  }
  function hash(value) { var h = 2166136261; for (var i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619); return h >>> 0; }

  /* ---------- Tanıtım pulları: tırtıklı kenar kodla çizilir (derslerin pulları motor/pul-sanat.js) ---------- */
  var PULLAR = {
    yaprak: {color: '#1f9c9c', icon: '<path d="M30 12 C42 22 46 36 30 54 C14 36 18 22 30 12z" fill="#fff4d6"/><path d="M30 18 V60 M30 30 L38 24 M30 30 L22 24 M30 40 L38 34 M30 40 L22 34" fill="none" stroke="#1f9c9c" stroke-width="2" stroke-linecap="round"/>'},
    kitap: {color: '#1d44a8', icon: '<path d="M30 24 C24 19 16 19 10 22 V48 C16 45 24 45 30 50 C36 45 44 45 50 48 V22 C44 19 36 19 30 24z" fill="#fff4d6"/><path d="M30 24 V50" fill="none" stroke="#1d44a8" stroke-width="2.4"/>'},
    damla: {color: '#cc4a30', icon: '<path d="M30 14 C38 26 44 32 44 41 a14 14 0 0 1 -28 0 C16 32 22 26 30 14z" fill="#fff4d6"/><path d="M24 42 a7 7 0 0 0 6 6" fill="none" stroke="#cc4a30" stroke-width="2.4" stroke-linecap="round"/>'}
  };
  function pulArt(key) {
    var item = PULLAR[key] || PULLAR.yaprak, w = 60, h = 76, r = 2.2, adim = 6, d = 'M' + r + ' 0', i;
    function isir(a, b) { d += 'L' + a + 'A' + r + ' ' + r + ' 0 0 0 ' + b; }
    for (i = adim; i < w; i += adim) isir((i - r) + ' 0', (i + r) + ' 0');
    isir((w - r) + ' 0', w + ' ' + r);
    for (i = adim; i < h; i += adim) isir(w + ' ' + (i - r), w + ' ' + (i + r));
    isir(w + ' ' + (h - r), (w - r) + ' ' + h);
    for (i = w - adim; i > 0; i -= adim) isir((i + r) + ' ' + h, (i - r) + ' ' + h);
    isir(r + ' ' + h, '0 ' + (h - r));
    for (i = h - adim; i > 0; i -= adim) isir('0 ' + (i + r), '0 ' + (i - r));
    isir('0 ' + r, r + ' 0');
    return '<svg class="pul-art" viewBox="-1 -1 62 78" aria-hidden="true" focusable="false"><path d="' + d + 'Z" fill="#fbf3df" stroke="rgba(60,40,10,.18)" stroke-width=".5"/>' +
      '<rect x="6" y="6" width="48" height="64" fill="' + item.color + '"/><rect x="8" y="8" width="44" height="60" fill="none" stroke="#e5bf68" stroke-width="1"/>' +
      '<g transform="translate(0 4)">' + item.icon + '</g></svg>';
  }
  function sky(count, seed, width, height) {
    var w = width || 400, h = height || 220;
    var out = '<svg class="sky-art" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">', a = hash(String(seed || 'gece'));
    function next() { a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
    for (var i = 0; i < (count || 26); i++) {
      var x = next() * w, y = next() * h, r = 0.6 + next() * 1.5;
      out += '<circle class="twinkle t' + (i % 4) + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="#fff" opacity="' + (0.35 + next() * 0.55).toFixed(2) + '"/>';
    }
    out += star(w * .88, h * .15, 6, '#ffe7a1', 'class="twinkle t2"') + star(w * .12, h * .8, 4.5, '#ffe7a1', 'class="twinkle t1"');
    return out + '</svg>';
  }

  /* ---------- Şehir silueti: kubbeler ve minareler ---------- */
  function skyline() {
    var d = 'M0 72 V60 H18 V54 H44 V58 H56 V50 H70 a10 10 0 0 1 20 0 H96 V58 H112 V48 H132 V58 H146 V36 h-2 v-3 h12 v3 h-2 V60 H162 V50 h4 a12 12 0 0 1 24 0 h-2 ' +
      'V46 H174 a26 26 0 0 1 52 0 H212 V50 h-2 a12 12 0 0 1 24 0 h4 V60 H246 V36 h-2 v-3 h12 v3 h-2 V58 H270 V52 H286 a9 9 0 0 1 18 0 H312 V56 H334 V48 H352 V58 H370 V52 H388 V60 H400 V72 Z';
    var minarets = 'M146 33 l6 -22 l6 22 z M246 33 l6 -22 l6 22 z';
    var finial = 'M200 20 V13 M197 9 a3.2 3.2 0 1 0 5.6 2.4 a2.4 2.4 0 1 1 -5.6 -2.4z';
    var palms = 'M122 48 q1 -12 -2 -20 M120 28 q-7 -4 -12 1 q6 -1 12 -1z M120 28 q7 -5 12 0 q-6 -1 -12 0z M120 28 q-2 -7 -9 -8 q5 4 9 8z M120 28 q3 -7 10 -7 q-6 3 -10 7z' +
      ' M342 48 q1 -12 -2 -20 M340 28 q-7 -4 -12 1 q6 -1 12 -1z M340 28 q7 -5 12 0 q-6 -1 -12 0z M340 28 q-2 -7 -9 -8 q5 4 9 8z M340 28 q3 -7 10 -7 q-6 3 -10 7z';
    return '<svg viewBox="0 0 400 72" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><path d="' + d + '" fill="currentColor"/><path d="' + minarets + '" fill="currentColor"/>' +
      '<path d="' + finial + '" fill="currentColor" stroke="currentColor" stroke-width="1.6"/><path d="' + palms + '" fill="currentColor" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
      '<g fill="#ffd25e" opacity=".75"><rect x="74" y="60" width="3" height="5" rx="1.5"/><rect x="178" y="56" width="3" height="6" rx="1.5"/><rect x="197" y="52" width="6" height="9" rx="3"/><rect x="219" y="56" width="3" height="6" rx="1.5"/><rect x="292" y="60" width="3" height="5" rx="1.5"/><rect x="358" y="62" width="3" height="4" rx="1.5"/></g></svg>';
  }

  // Sayfadaki [data-art] yer tutucularını bir kez boyar: logo, biri (maskot; eski adı hilal), sky, skyline, emblem, pul, avatar.
  function paint(scope) {
    (scope || document).querySelectorAll('[data-art]').forEach(function (node) {
      if (node.dataset.painted) return; node.dataset.painted = '1';
      var kind = node.dataset.art;
      node.innerHTML = kind === 'sky' ? sky(Number(node.dataset.count) || 40, node.dataset.seed || 'kapi', Number(node.dataset.width) || 0, Number(node.dataset.height) || 0) : kind === 'skyline' ? skyline() :
        kind === 'emblem' ? emblem(node.dataset.series, 'emblem') : kind === 'pul' ? pulArt(node.dataset.pul) : kind === 'avatar' ? avatar({figure: node.dataset.figure, color: node.dataset.color}) :
        kind === 'logo' ? logo({label: node.dataset.label}) : hilal({mood: node.dataset.mood || 'smile', pose: node.dataset.pose, label: node.dataset.label, still: node.hasAttribute('data-still')});
    });
  }
  if (root.document) root.document.addEventListener('DOMContentLoaded', function () { paint(root.document); });
  root.BiriArt = Object.freeze({SERIES: SERIES, COLORS: COLORS, FIGURES: Object.keys(FIGURES),
    hilal: hilal, biri: hilal, logo: logo, avatar: avatar, emblem: emblem, cover: cover, pul: pulArt, sky: sky, skyline: skyline, paint: paint, star: function (r, fill) { return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + star(12, 12.5, r || 11, fill || 'currentColor') + '</svg>'; }});
})(window);
