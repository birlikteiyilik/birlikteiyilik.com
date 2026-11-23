(function (root) {
  'use strict';
  // Yolculuk haritası: dersler yılan yolu (boustrophedon) düzeninde dizilir. Bir sıra soldan
  // sağa, sonraki sağdan sola akar; sıra sonları yumuşak bir dönemeçle bağlanır. Yol kaydırdıkça
  // çizilir, duraklar sırayla belirir, Hilal öğrencinin bulunduğu durağa yürür.
  var UNITS = {
    // siyer/content-v2.js içindeki modül sırasıyla aynıdır; testler eşleşmeyi denetler.
    siyer: {size: 6, names: ['Dünya, Mekke ve çocukluk', 'Gençlik, aile ve güven', 'İlk vahiy ve davet', 'Zorluklar ve yeni umutlar', 'Hicret ve Medine',
      'Medine’yi korumak', 'Barış ve yeni ufuklar', 'Mekke’ye dönüş', 'Son yıllar ve veda', 'Hayatımıza taşıyalım']}
  };
  var MILESTONE = 6, TERRAIN = {siyer: '#f7d9a8', fikih: '#cdeee1', adab: '#ffdbe4', ibre: '#dde1ff', akaid: '#f7e8c2'};
  var TONES = {fikih: ['#19b49a', '#0b6b62'], siyer: ['#ffae4d', '#d9572b'], adab: ['#ff8aa0', '#c8395b'], ibre: ['#7d8cff', '#3d45c4'], akaid: ['#e9c46a', '#b8862b']};

  function hash(value) { var h = 2166136261; value = String(value); for (var i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619); return h >>> 0; }
  function random(seed) {
    var a = seed >>> 0;
    return function () { a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function cubic(p0, p1, p2, p3, t) { var u = 1 - t; return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3; }
  function fixed(n) { return Math.round(n * 10) / 10; }

  /* ---------- Yerleşim ---------- */
  // count ders + bir hedef yuvası. Genişlik 760 pikselden fazlaysa sırada altı, değilse üç durak olur.
  function layout(count, width, options) {
    options = options || {};
    var cols = width >= 760 ? 6 : 3, unit = options.unitSize || 0;
    var side = Math.max(18, Math.min(64, Math.round(width * .05)));
    var colW = Math.min(cols === 6 ? 168 : 172, (width - side * 2) / cols), gridW = colW * cols, padX = (width - gridW) / 2;
    var pitch = cols === 6 ? 190 : 178, unitGap = unit ? 56 : 0, top = unit ? 168 : 112;
    var slots = count + 1, rows = Math.ceil(slots / cols), ys = [], y = top, r, s;
    for (r = 0; r < rows; r++) { if (r) { y += pitch; if (unit && (r * cols) % unit === 0 && r * cols < count) y += unitGap; } ys.push(y); }
    var points = [];
    for (s = 0; s < slots; s++) {
      r = Math.floor(s / cols); var c = s % cols, dir = r % 2 ? -1 : 1, col = dir > 0 ? c : cols - 1 - c;
      points.push({x: padX + colW * (col + .5), y: ys[r], row: r, col: col, dir: dir});
    }
    var rx = Math.max(24, Math.min(pitch * .5, padX + colW / 2 - 20));
    var start = {x: Math.max(12, points[0].x - colW * .62), y: points[0].y};
    var segments = [{x0: start.x, y0: start.y, c: [start.x, start.y, points[0].x, points[0].y], x1: points[0].x, y1: points[0].y, line: true}];
    var gaps = [], turns = [];
    for (s = 0; s < slots - 1; s++) {
      var a = points[s], b = points[s + 1];
      if (a.row === b.row) {
        var w = (s % 2 ? 1 : -1) * 6, dx = b.x - a.x;
        segments.push({x0: a.x, y0: a.y, c: [a.x + dx * .35, a.y + w, a.x + dx * .65, a.y - w], x1: b.x, y1: b.y});
        gaps.push({slot: s + 1, x: (a.x + b.x) / 2, y: a.y - 12});
      } else {
        var k = rx / .75;
        segments.push({x0: a.x, y0: a.y, c: [a.x + a.dir * k, a.y, a.x + a.dir * k, b.y], x1: b.x, y1: b.y});
        turns.push({slot: s + 1, x: a.x + a.dir * rx * .5, y: b.y - 40, dir: a.dir});
      }
    }
    // Uzunluklar örneklenerek bulunur; yol çizimi ve Hilal'in yürüyüşü aynı ölçüyü kullanır.
    var total = 0, lengths = [], path = 'M' + fixed(start.x) + ' ' + fixed(start.y);
    segments.forEach(function (seg, i) {
      var table = [[0, seg.x0, seg.y0]], px = seg.x0, py = seg.y0, length = 0, steps = seg.line ? 1 : 24;
      for (var j = 1; j <= steps; j++) {
        var t = j / steps, qx = seg.line ? seg.x1 : cubic(seg.x0, seg.c[0], seg.c[2], seg.x1, t), qy = seg.line ? seg.y1 : cubic(seg.y0, seg.c[1], seg.c[3], seg.y1, t);
        length += Math.hypot(qx - px, qy - py); table.push([length, qx, qy]); px = qx; py = qy;
      }
      seg.start = total; seg.length = length; seg.table = table; total += length;
      seg.d = seg.line ? ' L' + fixed(seg.x1) + ' ' + fixed(seg.y1) : ' C' + seg.c.map(fixed).join(' ') + ' ' + fixed(seg.x1) + ' ' + fixed(seg.y1);
      path += seg.d; lengths[i] = total;
    });
    var units = [];
    if (unit) for (r = 0; r < rows; r++) {
      var first = r * cols; if (first >= count || first % unit) continue;
      var turn = r ? points[first - 1].dir : 0, maxW = Math.min(400, gridW - (turn ? colW * .5 + rx + 16 : 24));
      units.push({slot: first, number: first / unit + 1, y: ys[r] - 140, align: turn > 0 ? 'left' : turn < 0 ? 'right' : 'center', maxWidth: Math.round(maxW),
        x: turn > 0 ? padX + 6 : turn < 0 ? width - padX - 6 : width / 2});
    }
    return {cols: cols, colW: colW, padX: padX, gridW: gridW, pitch: pitch, rx: rx, width: width, height: ys[rows - 1] + 112, points: points, start: start,
      segments: segments, lengths: lengths, total: total, path: path, gaps: gaps, turns: turns, units: units};
  }
  // from..to arası parçalar: 0. parça başlangıç bayrağından ilk durağa gider.
  function pathRange(plan, from, to) { var a = from ? plan.points[from - 1] : plan.start, d = 'M' + fixed(a.x) + ' ' + fixed(a.y); for (var i = from; i <= to; i++) d += plan.segments[i].d; return d; }
  function pointAt(plan, length) {
    length = Math.max(0, Math.min(plan.total, length));
    var seg = plan.segments.find(function (item) { return length <= item.start + item.length; }) || plan.segments[plan.segments.length - 1];
    var local = length - seg.start, table = seg.table;
    for (var i = 1; i < table.length; i++) if (table[i][0] >= local) {
      var a = table[i - 1], b = table[i], f = b[0] === a[0] ? 0 : (local - a[0]) / (b[0] - a[0]);
      return {x: a[1] + (b[1] - a[1]) * f, y: a[2] + (b[2] - a[2]) * f};
    }
    return {x: seg.x1, y: seg.y1};
  }
  // Dersten sonraki boşlukta çizim için yer: merkez x ve en çok genişlik. Kapı aynı sıradaysa aradaki boşluk
  // diskle kapının yarı genişliği (112 pikselin görünen yarısı, yaklaşık 44) arasında kalır; çizim oraya sığacak kadar küçülür.
  function lessonSpot(plan, slot, count, disc) {
    var a = plan.points[slot - 1], b = plan.points[slot], gap = Math.abs(b.x - a.x);
    if (slot === count && a.row === b.row) {
      var room = gap - disc / 2 - 44 - 8;
      // Dar ekranda yan tarafa sığmazsa çizim dersin durağının hemen üstünde, diskin üzerinde durur.
      if (room < 34) return {room: 52, x: a.x, ground: a.y - disc / 2 - 6};
      return {room: room, x: a.x + a.dir * (disc / 2 + 4 + room / 2), ground: a.y - 12};
    }
    return {room: gap - disc - 6, x: (a.x + b.x) / 2, ground: a.y - 12};
  }
  function unitOf(series, order) {
    var u = UNITS[series]; if (!u || !Number.isInteger(order) || order < 1) return null;
    var i = Math.floor((order - 1) / u.size); return u.names[i] ? {number: i + 1, title: u.names[i]} : null;
  }

  /* ---------- Hareket ---------- */
  function reducedMotion() {
    var doc = root.document && root.document.documentElement;
    return !!(doc && doc.classList.contains('reduce-motion')) || !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function tween(duration, step, done, ease) {
    var begin = null, id = 0, live = true;
    function frame(now) { if (!live) return; if (begin === null) begin = now; var t = Math.min(1, (now - begin) / duration); step((ease || easeInOut)(t)); if (t < 1) id = root.requestAnimationFrame(frame); else if (done) done(); }
    id = root.requestAnimationFrame(frame);
    return function () { live = false; root.cancelAnimationFrame(id); };
  }
  function play(node, frames, options) { if (node && node.animate) node.animate(frames, Object.assign({fill: 'backwards'}, options)); }

  /* ---------- Çizim ---------- */
  var active = null, serial = 0;
  function el(tag, className, text) { var node = root.document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; }
  function iconNode(name, className) { var node = el('span', className || 'ic'); node.dataset.icon = name; node.setAttribute('aria-hidden', 'true'); return node; }
  function pick(rand, pool, recent) {
    for (var i = 0; i < 6; i++) { var name = pool[Math.floor(rand() * pool.length)]; if (recent.indexOf(name) < 0) return name; }
    return pool[Math.floor(rand() * pool.length)];
  }

  function render(host, options) {
    if (active) active.destroy();
    var ART = root.BiriJourneyArt, lessons = options.lessons || [], states = options.states || [], series = options.series || 'fikih';
    var n = lessons.length, unit = UNITS[series], still = !options.animate || reducedMotion(), id = 'jm' + (++serial);
    var plan = layout(n, Math.round(host.clientWidth || 360), {unitSize: unit ? unit.size : 0});
    var inst = {stops: [], observer: null, destroy: function () { inst.stops.forEach(function (stop) { stop(); }); if (inst.observer) inst.observer.disconnect(); if (active === inst) active = null; }};
    active = inst;
    var tone = TONES[series] || TONES.fikih, wide = plan.cols === 6, rand = random(hash(series + ':' + n));
    var current = lessons.findIndex(function (lesson) { return lesson.id === options.currentId; });
    // Hilal sıradaki derste durur; o ders başka serideyse ilk açık derste, yol bittiyse hedef kapısında.
    var stand = current >= 0 ? current : states.indexOf('open');
    if (stand < 0) stand = states.indexOf('locked'); if (stand < 0) stand = n;
    var lit = -1; states.forEach(function (state, i) { if (state === 'taught' || i === current) lit = i; });
    var done = n > 0 && states.every(function (state) { return state === 'taught'; });
    if (done) lit = n;
    host.className = 'jm tone-' + series + (wide ? ' is-wide' : '') + (still ? '' : ' is-animated');
    host.style.height = plan.height + 'px';
    host.style.setProperty('--disc', (wide ? 66 : 58) + 'px');
    host.style.setProperty('--slot', Math.round(plan.colW) + 'px');

    // Zemin, yol ve altın iz tek SVG içinde; maske yolu baştan sona açar.
    var terrain = '', blobs = Math.ceil(plan.height / 150);
    for (var b = 0; b < blobs; b++) {
      var left = b % 2 === 0, bx = left ? rand() * plan.width * .3 : plan.width * (.7 + rand() * .3), by = 60 + b * 150 + rand() * 60;
      terrain += '<ellipse cx="' + fixed(bx) + '" cy="' + fixed(by) + '" rx="' + fixed(80 + rand() * 110) + '" ry="' + fixed(40 + rand() * 36) + '" fill="url(#' + id + 's)" opacity="' + (.4 + rand() * .3).toFixed(2) + '"/>';
    }
    var hidden = plan.total + 80, litPath = lit >= 0 ? pathRange(plan, 0, lit) : '', soil = TERRAIN[series] || TERRAIN.fikih;
    host.innerHTML = '<svg class="jm-ground" viewBox="0 0 ' + plan.width + ' ' + plan.height + '" aria-hidden="true" focusable="false"><defs>' +
      '<radialGradient id="' + id + 's"><stop offset="0" stop-color="' + soil + '"/><stop offset=".6" stop-color="' + soil + '" stop-opacity=".55"/><stop offset="1" stop-color="' + soil + '" stop-opacity="0"/></radialGradient>' +
      '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="-60" y="-60" width="' + (plan.width + 120) + '" height="' + (plan.height + 120) + '">' +
      '<path class="jm-reveal" d="' + plan.path + '" fill="none" stroke="#fff" stroke-width="76" stroke-linecap="round" stroke-linejoin="round" pathLength="' + fixed(plan.total) + '" stroke-dasharray="' + hidden + ' ' + hidden + '" stroke-dashoffset="' + (still ? 0 : hidden) + '"/></mask></defs>' +
      '<g class="jm-terrain">' + terrain + '</g><g mask="url(#' + id + ')">' +
      '<path class="jm-road-shadow" d="' + plan.path + '" transform="translate(0 5)"/><path class="jm-road-edge" d="' + plan.path + '"/><path class="jm-road" d="' + plan.path + '"/><path class="jm-road-dots" d="' + plan.path + '"/>' +
      (litPath ? '<path class="jm-lit-edge" d="' + litPath + '"/><path class="jm-lit" d="' + litPath + '"/><path class="jm-lit-flow" d="' + pathRange(plan, Math.max(0, lit - 1), lit) + '"/>' : '') + '</g></svg>';
    var reveal = host.querySelector('.jm-reveal');

    var bySlot = {}; function attach(slot, node) { (bySlot[slot] = bySlot[slot] || []).push(node); if (!still) node.classList.add('jm-wait'); host.append(node); }

    // Yol kenarı süsleri: her boşluğa seriye özgü bir çizim, ara ara gökyüzünde bir süs.
    var theme = ART.themes[series] || ART.themes.fikih, recent = [], base = wide ? 76 : 46;
    function decor(slot, x, ground, scale) {
      var sky = rand() < .22, name = pick(rand, sky ? theme.sky : theme.ground, recent), info = ART.info(name);
      if (!info) return; recent = [name].concat(recent).slice(0, 3);
      var size = base * info.size * (scale || 1) * (.9 + rand() * .2) * (info.sky ? .82 : 1), wrap = el('span', 'jm-decor' + (info.sky ? ' is-sky' : ''));
      wrap.style.left = fixed(x - size / 2) + 'px'; wrap.style.top = fixed(ground - size - (info.sky ? base * .5 : 0)) + 'px'; wrap.style.width = wrap.style.height = fixed(size) + 'px';
      var flip = el('span', 'jm-flip' + (rand() < .5 ? ' is-flipped' : '')); flip.innerHTML = ART.draw(name);
      var art = flip.firstChild; art.classList.add('jm-a-' + info.anim);
      art.style.setProperty('--dur', (3.6 + rand() * 3.4).toFixed(2) + 's'); art.style.setProperty('--delay', (-rand() * 4).toFixed(2) + 's');
      wrap.append(flip); attach(slot, wrap);
    }
    // Dersin kendi çizimi: harf karosu (Elifbâ) ya da ilk pulu; dersten sonraki boşlukta ya da dönemeçte durur.
    // Son dersin çizimi hedef kapısının önündeki boşluğa sığacak kadar küçülür.
    var dw = wide ? 66 : 58;
    function lessonDecor(i, slot, x, ground, scale, room) {
      var choice = ART.choose(lessons[i]), size = Math.min(base * 1.15 * (scale || 1), room);
      if (size < 34) return;
      var wrap = el('span', 'jm-decor jm-lesson is-' + choice.kind), flip = el('span', 'jm-flip'), tilt = (rand() - .5) * 8;
      wrap.style.left = fixed(x - size / 2) + 'px'; wrap.style.top = fixed(ground - size) + 'px'; wrap.style.width = wrap.style.height = fixed(size) + 'px';
      flip.style.transform = 'rotate(' + tilt.toFixed(1) + 'deg)'; flip.innerHTML = ART.lessonDraw(choice, size, i);
      var art = flip.firstChild; if (!art) return;
      art.classList.add('jm-a-float'); art.style.setProperty('--dur', (4.2 + rand() * 2.4).toFixed(2) + 's'); art.style.setProperty('--delay', (-rand() * 4).toFixed(2) + 's');
      if (art.tagName === 'IMG') art.addEventListener('error', function () { wrap.style.display = 'none'; });
      wrap.append(flip); attach(slot, wrap);
    }
    plan.gaps.forEach(function (gap) {
      if (ART.choose(lessons[gap.slot - 1]).kind !== 'theme') { var spot = lessonSpot(plan, gap.slot, n, dw); lessonDecor(gap.slot - 1, gap.slot, spot.x, spot.ground, 1, spot.room); return; }
      // Hedef kapısının önü boş kalır.
      if (gap.slot === n || rand() < .1) return; decor(gap.slot, gap.x, gap.y);
    });
    plan.turns.forEach(function (turn) {
      if (ART.choose(lessons[turn.slot - 1]).kind !== 'theme') { lessonDecor(turn.slot - 1, turn.slot, turn.x, turn.y, .9, 96); return; }
      if (turn.slot === n) return; decor(turn.slot, turn.x, turn.y, .7);
    });

    var flag = el('span', 'jm-start'); flag.innerHTML = ART.flag(tone[1]); flag.style.left = fixed(plan.start.x - 8) + 'px'; flag.style.top = fixed(plan.start.y - 58) + 'px';
    attach(0, flag);

    if (unit) plan.units.forEach(function (item) {
      var from = item.slot, taughtHere = states.slice(from, from + unit.size).filter(function (state) { return state === 'taught'; }).length;
      var pill = el('div', 'jm-unit is-' + item.align); pill.style.top = fixed(item.y) + 'px'; pill.style.maxWidth = item.maxWidth + 'px';
      if (item.align === 'left') pill.style.left = fixed(item.x) + 'px'; else if (item.align === 'right') pill.style.right = fixed(plan.width - item.x) + 'px'; else pill.style.left = fixed(item.x) + 'px';
      var copy = el('span', 'jm-unit-copy'); copy.append(el('small', '', item.number + '. ÜNİTE'), el('strong', '', unit.names[item.number - 1] || ''));
      pill.append(el('span', 'jm-unit-number', String(item.number)), copy, el('span', 'jm-unit-count' + (taughtHere === unit.size ? ' is-full' : ''), taughtHere + '/' + unit.size));
      attach(from, pill);
    });

    // Duraklar: işlenen altın sikke, sıradaki seri renginde, kilitli olanlar taş. Her altıncı durak ünite sonu.
    var nodes = [];
    lessons.forEach(function (lesson, i) {
      var state = states[i] || 'locked', point = plan.points[i], milestone = (i + 1) % MILESTONE === 0 && i < n - 1;
      var node = el('button', 'jm-node is-' + state + (i === current ? ' is-current' : '') + (milestone ? ' is-milestone' : ''));
      node.type = 'button'; node.dataset.slot = String(i); node.title = lesson.title;
      node.style.left = fixed(point.x) + 'px'; node.style.top = fixed(point.y) + 'px';
      node.setAttribute('aria-label', lesson.order + '. ders: ' + lesson.title + ' · ' + (state === 'taught' ? 'işlendi' : i === current ? 'sıradaki ders' : state === 'open' ? 'açık' : 'kilitli'));
      var disc = el('span', 'jm-disc'), face = el('span', 'jm-face');
      if (state === 'taught') { if (milestone) face.innerHTML = ART.trophy(); else face.append(iconNode('star')); var badge = el('span', 'jm-badge is-done'); badge.append(iconNode('check')); disc.append(badge); }
      else if (state === 'locked' && milestone) face.innerHTML = ART.chest();
      else face.append(el('span', 'jm-number', String(lesson.order)));
      if (state === 'locked') { var lock = el('span', 'jm-badge is-lock'); lock.append(iconNode('lock')); disc.append(lock); }
      if (state === 'taught') disc.style.setProperty('--shine', (rand() * 6).toFixed(2) + 's');
      disc.prepend(face); node.append(disc, el('span', 'jm-label', lesson.title));
      if (options.open) node.addEventListener('click', function () { options.open(lesson); });
      nodes.push(node); attach(i, node);
    });

    var finishPoint = plan.points[n], finish = el('div', 'jm-finish' + (done ? ' is-done' : ''));
    finish.setAttribute('role', 'img'); finish.setAttribute('aria-label', done ? 'Yolun sonu: bütün dersler işlendi' : 'Yolun sonu');
    finish.style.left = fixed(finishPoint.x) + 'px'; finish.style.top = fixed(finishPoint.y) + 'px'; finish.dataset.slot = String(n);
    var gateArt = el('span', 'jm-gate'); gateArt.innerHTML = ART.gate(tone[0], tone[1], done);
    finish.append(gateArt, el('span', 'jm-finish-label', done ? 'Tebrikler, yol tamam!' : 'Yolun sonu'));
    attach(n, finish);

    // Biri: sıradaki durağın üstünde bekler; yoksa başlangıç bayrağının yanında. Yürürken koşu pozuna geçer.
    var hilal = el('span', 'jm-hilal'), body = el('span', 'jm-hilal-body'); body.innerHTML = options.hilal || ''; hilal.append(body); host.append(hilal);
    var rest = plan.lengths[stand];
    // Durakta diskin, hedefte kapının üstüne oturur; aradaki yürüyüşte yükseklik yumuşakça değişir.
    // Kapı ilk sırada değilse üstteki dersin adını örtmemek için kapının içinde durur.
    // Maskot 430×610 oranındadır; ayakları çizimin %94'ünde, diskin üst kenarına basar.
    var size = wide ? 64 : 58, disc = wide ? 66 : 58, feet = size * 610 / 430 * .944, perch = disc / 2 + feet - 4, gateTop = finishPoint.row ? feet - size * .1 : 96 + feet - size * .38, lastX = null;
    function place(length, lift) {
      var p = pointAt(plan, length), near = n > 0 ? Math.max(0, Math.min(1, (length - plan.lengths[n - 1]) / Math.max(1, plan.lengths[n] - plan.lengths[n - 1]))) : 1;
      hilal.style.transform = 'translate(' + fixed(p.x - size / 2) + 'px,' + fixed(p.y - perch - (gateTop - perch) * near - (lift || 0)) + 'px)';
      if (lastX !== null && Math.abs(p.x - lastX) > .5) hilal.classList.toggle('is-left', p.x < lastX);
      lastX = p.x;
    }
    place(rest);

    if (still) { if (root.BiriIcons) root.BiriIcons(host); return inst; }

    hilal.classList.add('jm-wait');
    var revealed = -1, shown = 0, scrolled = false;
    function walk() {
      hilal.classList.remove('jm-wait');
      var from = stand > 0 ? plan.lengths[stand - 1] : 0, to = rest;
      if (to - from < 4) { play(hilal, [{opacity: 0}, {opacity: 1}], {duration: 400}); return; }
      hilal.classList.add('is-walking');
      if (options.runner) body.innerHTML = options.runner;
      inst.stops.push(tween(1100, function (t) { place(from + (to - from) * t, Math.abs(Math.sin(t * Math.PI * 3)) * 10); }, function () {
        hilal.classList.remove('is-walking', 'is-left');
        if (options.runner) body.innerHTML = options.hilal || '';
      }));
    }
    function pop(slot, delay) {
      (bySlot[slot] || []).forEach(function (node, i) {
        node.classList.remove('jm-wait');
        var isNode = node.classList.contains('jm-node') || node.classList.contains('jm-finish');
        var wait = Math.max(0, delay + (isNode ? 0 : -90 + i * 40));
        if (node.classList.contains('jm-unit')) play(node, [{opacity: 0, transform: 'translateY(10px) scale(.92)'}, {opacity: 1, transform: 'none'}], {duration: 520, delay: wait, easing: 'cubic-bezier(.2,.9,.3,1.2)'});
        else if (isNode) play(node, [{opacity: 0, transform: 'translateY(16px) scale(.55)'}, {opacity: 1, transform: 'none'}], {duration: 560, delay: wait, easing: 'cubic-bezier(.34,1.56,.64,1)'});
        else play(node, [{opacity: 0, transform: 'translateY(8px) scaleY(.4)'}, {opacity: 1, transform: 'none'}], {duration: 620, delay: wait, easing: 'cubic-bezier(.3,1.5,.6,1)'});
      });
      if (slot === stand) root.setTimeout(function () { if (active === inst) walk(); }, delay + 360);
    }
    // Hızlı kaydırmada ekranın üstünde kalan kısım beklemeden açılır; hareket görünen yerde başlar.
    function skipTo(slot) {
      if (slot <= revealed) return;
      for (var k = revealed + 1; k <= slot; k++) (bySlot[k] || []).forEach(function (node) { node.classList.remove('jm-wait'); });
      if (stand <= slot) hilal.classList.remove('jm-wait');
      revealed = slot; shown = Math.max(shown, plan.lengths[slot]); reveal.setAttribute('stroke-dashoffset', fixed(hidden - shown));
    }
    function revealTo(target) {
      if (target <= revealed) return;
      var first = revealed + 1, end = Math.min(plan.total, plan.lengths[target] + 46), begin = shown;
      revealed = target; shown = Math.max(shown, end);
      var span = Math.max(1, end - begin), duration = Math.max(420, Math.min(1500, span * 1.15));
      // Yol hızlı başlar, yavaşlayarak durur; her durak yol ona vardığında belirir.
      inst.stops.push(tween(duration, function (t) { reveal.setAttribute('stroke-dashoffset', fixed(hidden - (begin + span * t))); }, null, easeOut));
      for (var slot = first; slot <= target; slot++) pop(slot, Math.max(0, (1 - Math.cbrt(1 - Math.min(1, (plan.lengths[slot] - begin) / span))) * duration - 120));
    }
    function wanted(slot) {
      revealTo(slot);
      if (!scrolled && stand > 0 && stand < n && slot < stand) {
        // Sıradaki durak ekranın altında kaldıysa yol oraya kadar kayarak açılır.
        scrolled = true;
        root.setTimeout(function () {
          if (active !== inst) return; var box = nodes[stand].getBoundingClientRect();
          if (box.top > root.innerHeight * .78) nodes[stand].scrollIntoView({block: 'center', behavior: 'smooth'});
        }, 700);
      }
    }
    if (root.IntersectionObserver) {
      var pending = -1, queued = false;
      inst.observer = new root.IntersectionObserver(function (entries) {
        var low = Infinity;
        entries.forEach(function (entry) { if (!entry.isIntersecting) return; var slot = Number(entry.target.dataset.slot); pending = Math.max(pending, slot); low = Math.min(low, slot); });
        if (low !== Infinity && low - 1 > revealed) skipTo(low - 1);
        if (!queued && pending > revealed) { queued = true; root.requestAnimationFrame(function () { queued = false; wanted(pending); }); }
      }, {rootMargin: '0px 0px -8% 0px'});
      nodes.concat(finish).forEach(function (node) { inst.observer.observe(node); });
    } else revealTo(n);
    if (root.BiriIcons) root.BiriIcons(host);
    return inst;
  }

  root.BiriJourney = {layout: layout, pointAt: pointAt, lessonSpot: lessonSpot, unitOf: unitOf, units: UNITS, render: render};
})(typeof window !== 'undefined' ? window : globalThis);
