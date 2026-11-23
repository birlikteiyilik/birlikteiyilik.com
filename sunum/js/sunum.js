/* Birlikte İyilik Akademi · sunum motoru
   Tekerlek / ok tuşları ile slayt ve alt adım ilerletme, her slaytın kendi giriş koreografisi.
   GSAP yüklenemezse yalnız CSS geçişleriyle de gezilebilir. */
(function () {
  'use strict';

  var G = window.gsap || null;
  if (G && G.ticker) G.ticker.lagSmoothing(1000, 16);
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var slideEls = $$('.slide');
  var N = slideEls.length;
  var R = function () { return parseFloat(getComputedStyle(root).fontSize) || 16; };

  if (G) root.classList.add('gs');

  /* ------------------------------------------------------------ yardımcılar */
  function splitWords(el) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var parts = ch.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var i = document.createElement('span'); i.className = 'wi'; i.textContent = p;
            w.appendChild(i); frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && !ch.classList.contains('w')) walk(ch);
      });
    })(el);
  }
  $$('[data-split]').forEach(splitWords);
  var words = function (el) { return $$('.wi', el).filter(function (w) { return !w.querySelector('svg') || true; }); };

  function playV(v, t) {
    if (!v) return;
    try { v.currentTime = t || 0; } catch (e) {}
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  function stopV(v) { if (v) { try { v.pause(); } catch (e) {} } }

  function count(tl, el, at, dur) {
    var to = +el.getAttribute('data-to'), o = { v: 0 };
    el.textContent = '0';
    tl.to(o, { v: to, duration: dur || 1.4, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v); } }, at);
  }
  function numTween(el, from, to, dur, delay) {
    var o = { v: from };
    return G.to(o, { v: to, duration: dur, delay: delay || 0, ease: 'power3.inOut', onUpdate: function () { el.textContent = Math.round(o.v); } });
  }
  function revealWords(tl, el, at, o) {
    o = o || {};
    var w = words(el);
    tl.fromTo(w, { yPercent: 118, rotation: o.rot == null ? 3 : o.rot }, { yPercent: 0, rotation: 0, duration: o.dur || 1.2, ease: 'expo.out', stagger: o.stagger == null ? .055 : o.stagger }, at);
  }
  function hideWords(el) { G.set(words(el), { yPercent: 118 }); }
  function fold(tl, els, at, o) {
    o = o || {};
    G.set(els, { transformPerspective: 1500 });
    tl.fromTo(els, { rotationX: o.from == null ? -88 : o.from, opacity: 0, y: (o.y == null ? 2.5 : o.y) * R() },
      { rotationX: 0, opacity: 1, y: 0, duration: o.dur || 1.25, ease: o.ease || 'back.out(1.15)', stagger: o.stagger == null ? .17 : o.stagger }, at);
  }
  function drawSvg(svg) {
    $$('path,circle', svg).forEach(function (p) {
      var L = p.getTotalLength ? p.getTotalLength() : 200;
      p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p._L = L;
    });
  }
  function textBlockIn(tl, block, at) {
    tl.set(block, { autoAlpha: 1 }, at);
    var h = $('.h2', block), p = $('.lead2', block);
    if (h) tl.fromTo(words(h), { yPercent: 118, rotation: 3 }, { yPercent: 0, rotation: 0, duration: 1.1, ease: 'expo.out', stagger: .05 }, at);
    if (p) tl.fromTo(p, { opacity: 0, y: 1.6 * R() }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, at + .25);
  }
  function textBlockOut(tl, block, at) {
    var h = $('.h2', block), p = $('.lead2', block);
    if (h) tl.to(words(h), { yPercent: -118, duration: .5, ease: 'power3.in', stagger: .015 }, at);
    if (p) tl.to(p, { opacity: 0, y: -1 * R(), duration: .4, ease: 'power2.in' }, at);
    tl.set(block, { autoAlpha: 0 }, at + .62);
  }
  function instant(tl) { if (RM || !tl) { if (tl) tl.progress(1); } }

  /* ------------------------------------------------------------ kâğıt zemin */
  var Bg = (function () {
    var paper = $('#paper');
    var COL = { cream: '#F8F6F4', cream2: '#FFF8EC', pink: '#FDECEF', navy: '#26376A' };
    var seed = 11;
    function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
    var spec = [
      { d: .32, n: 8, size: [22, 36], colors: ['#F9DDE3', '#F1E7D6', '#DCEBDD', '#E3E8F2'], types: ['c', 'b', 'b'], shadow: true, op: .5 },
      { d: .68, n: 9, size: [9, 16], colors: ['#F4C3CE', '#DCE3F1', '#F3DFAE', '#CFE6D9'], types: ['c', 'b', 'r'], shadow: true, op: .42 },
      { d: 1.15, n: 10, size: [1.4, 3.6], colors: ['#E58AA0', '#7FBFA5', '#8FA0C8', '#E4C27A', '#E20439'], types: ['c', 'c', 'ring', 'ring'], shadow: false, op: .38 }
    ];
    var layers = spec.map(function (sp) {
      var L = document.createElement('div'); L.className = 'layer'; paper.appendChild(L);
      for (var i = 0; i < sp.n; i++) {
        var s = document.createElement('div'), t = sp.types[Math.floor(rnd() * sp.types.length)];
        var size = sp.size[0] + rnd() * (sp.size[1] - sp.size[0]);
        if (t === 'ring') size *= 1.9;
        s.className = 'sh ' + t;
        var col = sp.colors[Math.floor(rnd() * sp.colors.length)];
        s.style.cssText = 'left:' + (-6 + rnd() * 196).toFixed(1) + 'vw;top:' + (-8 + rnd() * 100).toFixed(1) + 'vh;width:' + size.toFixed(1) + 'vw;height:' +
          (t === 'r' ? size * .7 : size).toFixed(1) + 'vw;background:' + col + ';color:' + col + ';' +
          'opacity:' + sp.op + ';' +
          'transform:rotate(' + Math.round(rnd() * 80 - 40) + 'deg);' +
          (sp.shadow && t !== 'ring' ? 'box-shadow:0 .3rem .9rem rgba(110,70,50,.08),0 1.2rem 2.6rem rgba(110,70,50,.07);' : '');
        L.appendChild(s);
      }
      return { el: L, d: sp.d };
    });
    function go(i, quick) {
      var name = slideEls[i].getAttribute('data-bg') || 'cream';
      var dark = name === 'navy';
      var sx = innerWidth * .07, sy = innerHeight * .03;
      document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
      if (!G) {
        paper.style.transition = 'background-color 1s'; paper.style.backgroundColor = COL[name];
        layers.forEach(function (l) { l.el.style.transition = 'transform 1.4s cubic-bezier(.2,.7,.2,1),opacity 1s'; l.el.style.transform = 'translate(' + (-i * sx * l.d) + 'px,' + (Math.sin(i * 1.3) * sy * l.d) + 'px)'; l.el.style.opacity = dark ? .22 : 1; });
        root.style.backgroundColor = document.body.style.backgroundColor = COL[name];
        return;
      }
      var dur = quick || RM ? 0 : 1.5;
      G.to(paper, { backgroundColor: COL[name], duration: quick || RM ? 0 : 1.1, ease: 'power2.inOut' });
      layers.forEach(function (l) {
        G.to(l.el, { x: -i * sx * l.d, y: Math.sin(i * 1.3) * sy * l.d * 3, rotation: Math.cos(i * .9) * 1.6 * l.d, opacity: dark ? .2 : 1, duration: dur, ease: 'power3.inOut', overwrite: true });
      });
    }
    return { go: go };
  })();

  /* ------------------------------------------------------------ slayt tanımları */
  var defs = [];

  function pop(tl, lockupEl, at) {
    var mark = $('.cv-mark', lockupEl), word = $('.cv-word', lockupEl), r = R();
    G.set(mark, { transformPerspective: 1100, transformOrigin: '50% 100%' });
    tl.fromTo(mark, { rotationX: -88, y: 2.4 * r, opacity: 0, scale: .92 }, { rotationX: 0, y: 0, opacity: 1, scale: 1, duration: 1.5, ease: 'back.out(1.45)' }, at)
      .fromTo(word, { clipPath: 'inset(-12% 100% -12% 0%)', y: 1.4 * r, opacity: 0 }, { clipPath: 'inset(-12% 0% -12% 0%)', y: 0, opacity: 1, duration: 1.3, ease: 'expo.out' }, at + .55);
  }

  /* 1 · Kapak */
  defs[0] = function (el) {
    var disc = $('.cv-disc', el), hint = $('.cv-hint', el);
    return {
      steps: 0,
      enter: function (tl) {
        tl.fromTo(disc, { scale: .55, opacity: 0 }, { scale: 1, opacity: .9, duration: 1.9, ease: 'expo.out' }, 0);
        pop(tl, $('.cv-lockup', el), .1);
        var kind = $('.cv-kind', el), by = $('.cv-by', el);
        tl.fromTo(kind, { opacity: 0, letterSpacing: '.6em' }, { opacity: 1, letterSpacing: '.32em', duration: 1.3, ease: 'expo.out' }, .95);
        revealWords(tl, $('.cv-tag', el), 1.3, { stagger: .06 });
        tl.fromTo(by, { opacity: 0, y: 1.4 * R() }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, 2.0)
          .fromTo(hint, { opacity: 0 }, { opacity: 1, duration: 1 }, 2.8)
          .to(hint, { opacity: 0, duration: 1.4 }, 8);
      }
    };
  };

  /* 2 ve 3 · iki vuruşlu açıklama + video */
  function twoBeat(vidId, tilt) {
    return function (el) {
      var b1 = $('.b1', el), b2 = $('.b2', el), card = $('.vcard', el), v = document.getElementById(vidId), sub;
      return {
        steps: 1, vids: [v],
        enter: function (tl) {
          G.set(b2, { autoAlpha: 0 }); hideWords(b2); G.set(b1, { autoAlpha: 1 });
          G.set(card, { transformPerspective: 1600 });
          tl.fromTo(card, { rotationX: 38, y: 6 * R(), opacity: 0, rotation: tilt * 3 }, { rotationX: 0, y: 0, opacity: 1, rotation: tilt, duration: 1.5, ease: 'expo.out' }, 0);
          revealWords(tl, b1, .25, { stagger: .05 });
          tl.call(function () { playV(v, 0); }, null, .7);
        },
        step: function (n, inst) {
          if (sub) sub.kill();
          var a = n ? b1 : b2, b = n ? b2 : b1;
          if (inst) { G.set(a, { autoAlpha: 0 }); G.set(b, { autoAlpha: 1 }); G.set(words(b), { yPercent: 0 }); return; }
          sub = G.timeline();
          sub.to(words(a), { yPercent: -118, duration: .55, ease: 'power3.in', stagger: .012 }, 0)
            .set(a, { autoAlpha: 0 }, .65).set(b, { autoAlpha: 1 }, .6);
          sub.fromTo(words(b), { yPercent: 118, rotation: 3 }, { yPercent: 0, rotation: 0, duration: 1.15, ease: 'expo.out', stagger: .05 }, .62);
        },
        kill: function () { if (sub) sub.kill(); }
      };
    };
  }
  defs[1] = twoBeat('v-neden', 1.1);
  defs[2] = twoBeat('v-mesafe', -1.1);

  /* 4 · Nasıl */
  defs[3] = function (el) {
    var cards = $$('.card3', el), clip = $('.sb-clip', el), bar = $('.splitbar', el);
    return {
      steps: 0,
      enter: function (tl) {
        fold(tl, cards, 0, { stagger: .2, dur: 1.35 });
        cards.forEach(function (c, i) {
          $$('.cn', c).forEach(function (n) { count(tl, n, .45 + i * .2, 1.3); });
          tl.fromTo($$('.c-unit,.c-sub,.c-top', c), { opacity: 0, y: .8 * R() }, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .06 }, .7 + i * .2);
        });
        tl.fromTo(bar, { opacity: 0, y: 1.5 * R() }, { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }, 1.5)
          .fromTo(clip, { clipPath: 'inset(0 100% 0 0 round 2.7rem)' }, { clipPath: 'inset(0 0% 0 0 round 2.7rem)', duration: 1.5, ease: 'expo.inOut' }, 1.65)
          .fromTo($$('.seg span', clip), { opacity: 0 }, { opacity: 1, duration: .8, stagger: .35 }, 2.3);
      }
    };
  };

  /* 5 · Derste */
  defs[4] = function (el) {
    var v = $('#v-derste'), pts = $$('.pt', el), bars = $$('.pbar b', el), card = $('.vcard', el);
    var T = [0, 7.5, 11.5, 14.5], seg = -1, rev = [false, false, false], raf = 0, on = false;
    function tick() {
      if (!on) return;
      var t = v.currentTime || 0, s = t >= T[2] ? 2 : t >= T[1] ? 1 : 0;
      if (s !== seg) {
        seg = s;
        pts.forEach(function (p, i) {
          p.classList.toggle('on', i === s);
          if (i <= s && !rev[i]) { rev[i] = true; G.fromTo(p, { opacity: 0, y: 2 * R() }, { opacity: 1, y: 0, duration: .9, ease: 'expo.out', overwrite: true }); }
          else if (rev[i]) G.to(p, { opacity: i === s ? 1 : .5, duration: .5, overwrite: 'auto' });
        });
      }
      bars.forEach(function (b, i) {
        var f = i < s ? 1 : i > s ? 0 : Math.min(1, (t - T[i]) / (T[i + 1] - T[i]));
        G.set(b, { scaleX: f });
      });
      raf = requestAnimationFrame(tick);
    }
    function stop() { on = false; cancelAnimationFrame(raf); }
    return {
      steps: 0, vids: [v],
      enter: function (tl) {
        stop(); seg = -1; rev = [false, false, false];
        pts.forEach(function (p) { p.classList.remove('on'); });
        G.set(pts, { opacity: 0 }); G.set(bars, { scaleX: 0 });
        G.set(card, { transformPerspective: 1600 });
        tl.fromTo(card, { rotationX: 38, y: 6 * R(), opacity: 0, rotation: 3 }, { rotationX: 0, y: 0, opacity: 1, rotation: 1.1, duration: 1.5, ease: 'expo.out' }, 0);
        revealWords(tl, $('.h1', el), .2, { stagger: .07 });
        tl.call(function () { playV(v, 0); on = true; tick(); }, null, .85);
      },
      kill: stop
    };
  };

  /* 6 · Pul defteri */
  defs[5] = function (el) {
    var album = $('.album', el), slots = $$('.slot', el), sws = $$('.sw', el);
    return {
      steps: 0,
      enter: function (tl) {
        var r = R();
        G.set(album, { transformPerspective: 2200, transformOrigin: '50% 100%' });
        revealWords(tl, $('.h1', el), .15, { stagger: .07 });
        revealWords(tl, $('.lead', el), .5, { stagger: .02, dur: 1 });
        tl.fromTo(album, { rotationX: -38, y: 5 * r, opacity: 0 }, { rotationX: 0, y: 0, opacity: 1, duration: 1.6, ease: 'expo.out' }, .1)
          .fromTo(slots, { opacity: 0, scale: .86 }, { opacity: 1, scale: 1, duration: .8, ease: 'back.out(1.5)', stagger: .035 }, .8);
        var seed = 3; function rr() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 - .5; }
        sws.forEach(function (s, i) {
          var lesson = i < 3, at = lesson ? 1.5 + i * .3 : 2.5 + (i - 3) * .15;
          tl.fromTo(s, { opacity: 0, x: (lesson ? -16 : 14 + rr() * 8) * r, y: -22 * r - rr() * 6 * r, rotation: rr() * 90, scale: 1.55 },
            { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1, duration: 1.05, ease: 'back.out(1.35)' }, at);
        });
      }
    };
  };

  /* 7 · Başvurudan ilk derse */
  defs[6] = function (el) {
    var rs = $$('.rs', el), line = $('.rail-line b', el), blocks = $$('.s7s', el), phone = $('.dev-phone', el), lap = $('.dev-lap', el);
    var vs = [$('#v-k1'), $('#v-k2'), $('#v-k3'), $('#v-k4')], rail = $('.rail', el), cur = 0, sub;
    var ZOOM = [null, { s: 1.28, o: '50% 52%' }, { s: 1.4, o: '50% 64%' }, { s: 1.2, o: '50% 52%' }];
    function setRail(n) {
      rs.forEach(function (r, i) { r.classList.toggle('on', i === n); r.classList.toggle('done', i < n); });
      G.to(line, { scaleX: n / 3, duration: RM ? 0 : .9, ease: 'power3.inOut', overwrite: true });
    }
    function dev(n, inst) {
      var d = inst ? 0 : .9, r = R();
      if (n === 0) {
        G.to(phone, { autoAlpha: 1, scale: 1.12, y: 0, duration: d, ease: 'expo.out', overwrite: true });
        G.to(lap, { autoAlpha: 0, scale: .94, y: 2 * r, duration: d * .7, ease: 'power2.in', overwrite: true });
        vs.forEach(function (v, i) { if (i !== 0) stopV(v); });
        playV(vs[0], 0);
      } else {
        if (cur === 0) {
          G.to(phone, { autoAlpha: 0, scale: .9, y: -2 * r, duration: d * .7, ease: 'power2.in', overwrite: true });
          G.fromTo(lap, { autoAlpha: 0, scale: .92, y: 3 * r }, { autoAlpha: 1, scale: 1, y: 0, duration: d * 1.3, ease: 'expo.out', delay: inst ? 0 : .25, overwrite: true });
          stopV(vs[0]);
        } else G.to(lap, { autoAlpha: 1, scale: 1, y: 0, duration: d, overwrite: true });
        [1, 2, 3].forEach(function (i) {
          if (i === n) {
            playV(vs[i], 0);
            G.to(vs[i], { opacity: 1, duration: inst ? 0 : .7, overwrite: true });
            /* TV'de yazı okunsun: kayıt, işin geçtiği bölgeye yavaşça yaklaşır */
            G.fromTo(vs[i], { scale: 1, transformOrigin: ZOOM[i].o }, { scale: ZOOM[i].s, duration: inst || RM ? 0 : 2.6, ease: 'power2.inOut', delay: inst ? 0 : .7 });
          }
          else { G.to(vs[i], { opacity: 0, duration: inst ? 0 : .7, overwrite: true, onComplete: function () { stopV(vs[i]); G.set(vs[i], { scale: 1 }); } }); }
        });
      }
    }
    return {
      steps: 3,
      enter: function (tl) {
        cur = 0;
        var r = R();
        G.set(blocks, { autoAlpha: 0 }); blocks.forEach(function (b) { hideWords($('.h2', b)); });
        G.set(lap, { autoAlpha: 0 }); G.set(vs.slice(1), { opacity: 0, scale: 1 }); G.set(vs[1], { opacity: 1 });
        G.set(phone, { autoAlpha: 1, transformOrigin: '50% 50%' });
        G.set(line, { scaleX: 0 });
        rs.forEach(function (x) { x.classList.remove('on', 'done'); });
        tl.fromTo(rail, { opacity: 0, y: -1.5 * r }, { opacity: 1, y: 0, duration: 1, ease: 'expo.out' }, 0)
          .fromTo(rs, { opacity: 0, y: -1 * r }, { opacity: 1, y: 0, duration: .8, ease: 'power3.out', stagger: .08 }, .2)
          .fromTo(phone, { scale: .9, y: 6 * r, opacity: 0, rotation: -3 }, { scale: 1.12, y: 0, opacity: 1, rotation: 0, duration: 1.5, ease: 'expo.out' }, .3);
        textBlockIn(tl, blocks[0], .5);
        tl.call(function () { rs[0].classList.add('on'); playV(vs[0], 0); }, null, .7);
      },
      step: function (n, inst) {
        if (sub) sub.kill();
        sub = G.timeline();
        textBlockOut(sub, blocks[cur], 0);
        textBlockIn(sub, blocks[n], inst ? 0 : .6);
        setRail(n);
        dev(n, inst);
        cur = n;
      },
      kill: function () { if (sub) sub.kill(); vs.forEach(stopV); }
    };
  };

  /* 8 · Canlı ders */
  defs[7] = function (el) {
    return {
      steps: 0,
      enter: function (tl) {
        var r = R(), mark = $('.lv-mark', el);
        G.set(mark, { transformPerspective: 1000, transformOrigin: '50% 100%' });
        tl.fromTo($('.lv-disc', el), { scale: .5, opacity: 0 }, { scale: 1, opacity: .85, duration: 2, ease: 'expo.out' }, 0)
          .fromTo(mark, { rotationX: -85, y: 2 * r, opacity: 0 }, { rotationX: 0, y: 0, opacity: 1, duration: 1.4, ease: 'back.out(1.4)' }, .15);
        revealWords(tl, $('.lv-title', el), .6, { stagger: .12, dur: 1.4 });
        tl.fromTo($('.lv-sub', el), { opacity: 0, y: 1.4 * r }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, 1.4);
      }
    };
  };

  /* 9 · Veli takibi */
  defs[8] = function (el) {
    var cards = $$('.ac', el);
    return {
      steps: 0,
      enter: function (tl) {
        var r = R();
        tl.fromTo($('.eyebrow', el), { opacity: 0, y: -1 * r }, { opacity: 1, y: 0, duration: 1 }, 0);
        revealWords(tl, $('.h1', el), .1, { stagger: .05 });
        tl.fromTo($('.lead2', el), { opacity: 0, y: 1 * r }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, .55);
        fold(tl, cards, .7, { stagger: .2, dur: 1.3 });
        tl.fromTo($$('.ac-list li', el), { opacity: 0, x: -1.2 * r }, { opacity: 1, x: 0, duration: .7, ease: 'power3.out', stagger: .08 }, 1.5)
          .fromTo($$('.ac-bar b', el), { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: 'expo.out', stagger: .15 }, 1.6)
          .fromTo($$('.ac-chip', el), { scale: .6, opacity: 0 }, { scale: 1, opacity: 1, duration: .6, ease: 'back.out(2)', stagger: .08 }, 1.8)
          .fromTo($('.ac-quote', el), { opacity: 0, y: 1 * r }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 2.3);
      }
    };
  };

  /* 10 · Ölçme */
  defs[9] = function (el) {
    var cards = $$('.oc', el), lines = $$('.gc-line', el);
    return {
      steps: 0,
      enter: function (tl) {
        var r = R();
        tl.fromTo($('.eyebrow', el), { opacity: 0, y: -1 * r }, { opacity: 1, y: 0, duration: 1 }, 0);
        revealWords(tl, $('.h1', el), .1, { stagger: .06 });
        fold(tl, cards, .5, { stagger: .2, dur: 1.3 });
        $$('.cn', el).forEach(function (n, i) { count(tl, n, 1 + i * .2, 1.5); });
        tl.fromTo($$('.oc-weeks i', el), { scaleY: 0 }, { scaleY: 1, duration: .9, ease: 'expo.out', stagger: .1 }, 1.3)
          .fromTo($$('.oc-mini b', el), { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'expo.out', stagger: .12 }, 1.5);
        lines.forEach(function (p, i) {
          var L = p.getTotalLength ? p.getTotalLength() : 400;
          p.style.strokeDasharray = L;
          tl.fromTo(p, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' }, 1.4 + i * .15);
        });
        tl.fromTo($$('.kn-r i', el), { scale: .7, opacity: 0 }, { scale: 1, opacity: 1, duration: .5, ease: 'back.out(1.8)', stagger: .04 }, 1.4);
        tl.fromTo($('.pnote', el), { opacity: 0 }, { opacity: 1, duration: 1 }, 2.6);
      }
    };
  };

  /* 11 · Bugün */
  defs[10] = function (el) {
    var cards = $$('.big-card', el);
    return {
      steps: 0,
      enter: function (tl) {
        fold(tl, cards, .2, { stagger: .25, dur: 1.4 });
        tl.fromTo($('.eyebrow', el), { opacity: 0, y: -1 * R() }, { opacity: 1, y: 0, duration: 1 }, 0);
        cards.forEach(function (c, i) {
          count(tl, $('.cn', c), .7 + i * .25, 1.7);
          tl.fromTo($('.bc-name', c), { opacity: 0, y: 1 * R() }, { opacity: 1, y: 0, duration: .9 }, 1 + i * .25)
            .fromTo($('.bc-ready', c), { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, duration: .8, ease: 'back.out(2)' }, 2.2 + i * .25);
        });
        tl.fromTo($('.livenote', el), { opacity: 0, y: 1.2 * R() }, { opacity: 1, y: 0, duration: 1 }, 2.8);
      }
    };
  };

  /* 12 · Kapalı pilot */
  defs[11] = function (el) {
    var A = $('.grpA', el), B = $('.grpB', el), cardsA = $$('.pc', el), tiles = $$('.tile', el), verdict = $('.verdict', el), hA = $('.h1', A), hB = $('.h2', B);
    var svgs = $$('.tile svg', el), sub;
    function toB(tl, at) {
      var r = R();
      tl.to(words(hA), { yPercent: -118, duration: .5, ease: 'power3.in', stagger: .02 }, at)
        .to(cardsA, { opacity: 0, y: -2 * r, duration: .5, ease: 'power2.in', stagger: .06 }, at)
        .set(A, { autoAlpha: 0 }, at + .65).set(B, { autoAlpha: 1 }, at + .6);
      tl.fromTo(words(hB), { yPercent: 118, rotation: 3 }, { yPercent: 0, rotation: 0, duration: 1.1, ease: 'expo.out', stagger: .05 }, at + .62);
      G.set(tiles, { transformPerspective: 1500 });
      tl.fromTo(tiles, { rotationX: -80, opacity: 0, y: 2 * r }, { rotationX: 0, opacity: 1, y: 0, duration: 1.2, ease: 'back.out(1.2)', stagger: .15 }, at + 1);
      svgs.forEach(function (s, i) {
        $$('path,circle', s).forEach(function (p) {
          tl.fromTo(p, { strokeDashoffset: p._L }, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' }, at + 1.5 + i * .15);
        });
      });
      tl.fromTo(words(verdict), { yPercent: 118, rotation: 3 }, { yPercent: 0, rotation: 0, duration: 1.2, ease: 'expo.out', stagger: .06 }, at + 3.1);
    }
    function toA(tl) {
      var r = R();
      tl.to(words(hB), { yPercent: -118, duration: .45, ease: 'power3.in', stagger: .015 }, 0)
        .to(tiles, { opacity: 0, y: -2 * r, duration: .45, stagger: .05 }, 0)
        .to(words(verdict), { yPercent: -118, duration: .4, ease: 'power3.in' }, 0)
        .set(B, { autoAlpha: 0 }, .6).set(A, { autoAlpha: 1 }, .55);
      tl.fromTo(words(hA), { yPercent: 118, rotation: 3 }, { yPercent: 0, rotation: 0, duration: 1.1, ease: 'expo.out', stagger: .05 }, .6);
      tl.fromTo(cardsA, { opacity: 0, y: 2 * r }, { opacity: 1, y: 0, duration: .9, ease: 'expo.out', stagger: .12 }, .8);
    }
    return {
      steps: 1,
      enter: function (tl) {
        G.set(B, { autoAlpha: 0 }); G.set(A, { autoAlpha: 1 });
        hideWords(hB); hideWords(verdict); G.set(tiles, { opacity: 0 });
        svgs.forEach(drawSvg);
        G.set(cardsA, { transformPerspective: 1500 });
        revealWords(tl, hA, .1, { stagger: .07 });
        fold(tl, cardsA, .7, { stagger: .25, dur: 1.3 });
        cardsA.forEach(function (c, i) { $$('.cn', c).forEach(function (n) { count(tl, n, 1.1 + i * .25, 1.1); }); });
      },
      step: function (n, inst) {
        if (sub) sub.kill();
        sub = G.timeline();
        if (n === 1) toB(sub, 0); else toA(sub);
        if (inst) sub.progress(1);
      },
      kill: function () { if (sub) sub.kill(); }
    };
  };

  /* 13 · Ölçeklenme hesabı */
  defs[12] = function (el) {
    var field = $('#field'), nh = $('#n-hoca'), nk = $('#n-cocuk'), endline = $('.endline', el), assume = $('.assume', el), row = $('.sc-row', el);
    var grps = [], state = 0, sub, nums = [{ h: 1, k: 3 }, { h: 10, k: 30 }, { h: 100, k: 300 }], shown = { h: 0, k: 0 };
    for (var i = 0; i < 100; i++) {
      var g = document.createElement('div'); g.className = 'grp';
      g.innerHTML = '<i class="fg t"></i><i class="fg k k1"></i><i class="fg k k2"></i><i class="fg k k3"></i>';
      field.appendChild(g); grps.push(g);
    }
    function pos(s, i) {
      var r = R(), FW = 104 * r, FH = 23 * r, w = 22 * r, h = 17.5 * r, cx, cy, sc, vis = true;
      if (s === 0) {
        cx = FW / 2; cy = FH / 2; sc = 1; vis = i === 0;
        if (!vis) sc = 0;
      } else if (s === 1) {
        var j = i % 10; cx = (j + .5) * FW / 10; cy = FH / 2; sc = .42; vis = i < 10; if (!vis) sc = 0;
      } else {
        cx = ((i % 20) + .5) * FW / 20; cy = (Math.floor(i / 20) + .5) * FH / 5; sc = .2;
      }
      return { x: cx - w / 2, y: cy - h / 2, s: sc, o: vis ? 1 : 0 };
    }
    function layout(s, inst) {
      if (!G) { grps.forEach(function (g, i) { var p = pos(2, i); g.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) scale(' + p.s + ')'; }); nh.textContent = 100; nk.textContent = 300; return; }
      if (inst) {
        grps.forEach(function (g, i) { var p = pos(s, i); G.set(g, { x: p.x, y: p.y, scale: p.s, opacity: p.o }); });
        return;
      }
      G.to(grps, {
        x: function (i) { return pos(s, i).x; }, y: function (i) { return pos(s, i).y; },
        scale: function (i) { return pos(s, i).s; }, opacity: function (i) { return pos(s, i).o; },
        duration: 1.5, ease: 'expo.inOut', overwrite: true,
        stagger: { each: s === 0 ? .006 : .009, from: s === 0 ? 'end' : 'start' }
      });
    }
    function setNums(s, inst) {
      var t = nums[s];
      if (inst) { nh.textContent = t.h; nk.textContent = t.k; shown = { h: t.h, k: t.k }; return; }
      numTween(nh, shown.h, t.h, 1.5); numTween(nk, shown.k, t.k, 1.5, .08); shown = { h: t.h, k: t.k };
    }
    return {
      steps: 2,
      relayout: function () { layout(state, true); },
      enter: function (tl) {
        state = 0; shown = { h: 0, k: 0 };
        var r = R();
        hideWords(endline); hideWords(assume);
        layout(0, true);
        G.set(grps, { opacity: 0, scale: 0 });
        tl.fromTo($('.eyebrow', el), { opacity: 0, y: -1 * r }, { opacity: 1, y: 0, duration: 1 }, 0);
        revealWords(tl, assume, .25, { stagger: .05 });
        tl.fromTo(row, { opacity: 0, y: 1.5 * r }, { opacity: 1, y: 0, duration: 1, ease: 'expo.out' }, .9);
        tl.call(function () { setNums(0, false); }, null, 1.0);
        tl.fromTo(grps[0], { opacity: 0, scale: .8, y: pos(0, 0).y + 5 * r }, { opacity: 1, scale: 1, y: pos(0, 0).y, duration: 1.5, ease: 'back.out(1.5)' }, 1.0);
      },
      step: function (n, inst) {
        if (sub) sub.kill();
        state = n;
        setNums(n, inst);
        layout(n, inst);
        sub = G.timeline();
        if (n === 2) { sub.fromTo(words(endline), { yPercent: 118, rotation: 3 }, { yPercent: 0, rotation: 0, duration: 1.3, ease: 'expo.out', stagger: .06 }, 2.6); if (inst) sub.progress(1); }
        else sub.to(words(endline), { yPercent: 118, duration: .4, ease: 'power2.in' }, 0);
      },
      kill: function () { if (sub) sub.kill(); }
    };
  };

  /* 14 · Müfredat */
  defs[13] = function (el) {
    var ready = $$('.book.ready', el), soon = $$('.book.soon', el), plank = $('.plank', el);
    return {
      steps: 0,
      enter: function (tl) {
        var r = R();
        revealWords(tl, $('.h1', el), .1, { stagger: .07 });
        G.set(ready, { transformPerspective: 1600 });
        tl.fromTo(plank, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 1.4, ease: 'expo.out' }, .3)
          .fromTo(ready, { rotationX: -90, opacity: 0 }, { rotationX: 0, opacity: 1, duration: 1.3, ease: 'back.out(1.2)', stagger: .28 }, .9)
          .fromTo($$('.chk', el), { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: .7, ease: 'back.out(2.2)', stagger: .28 }, 1.7)
          .fromTo(soon, { x: 16 * r, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: .3 }, 2.6)
          .fromTo($$('.tag', el), { scale: 0, rotation: -25, transformOrigin: '50% 100%' }, { scale: 1, rotation: -3, duration: .7, ease: 'back.out(2)', stagger: .3 }, 3.1);
        G.set($$('.tag', el), { xPercent: -50 });
      }
    };
  };

  /* 15 · Kapanış */
  defs[14] = function (el) {
    return {
      steps: 0,
      enter: function (tl) {
        tl.fromTo($('.cv-disc', el), { scale: .55, opacity: 0 }, { scale: 1, opacity: .9, duration: 1.9, ease: 'expo.out' }, 0);
        pop(tl, $('.cv-lockup', el), .1);
        revealWords(tl, $('.cl-thanks', el), 1.2, { stagger: .12, dur: 1.4 });
        tl.fromTo($('.cl-url', el), { opacity: 0, y: 1.2 * R() }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 2);
      }
    };
  };

  /* ------------------------------------------------------------ motor */
  var S = slideEls.map(function (el, i) {
    var d = defs[i](el);
    d.el = el; d.in = $('.in', el); d.vidList = $$('video', el);
    return d;
  });
  var cur = -1, step = 0, lockUntil = 0;

  var dotsEl = $('#hud-dots'), hudN = $('#hud-n');
  $('#hud-t').textContent = pad(N);
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var dotBtns = slideEls.map(function (_, i) {
    var b = document.createElement('button'); b.setAttribute('aria-label', 'Slayt ' + (i + 1));
    b.addEventListener('click', function (e) { e.stopPropagation(); goTo(i); });
    dotsEl.appendChild(b); return b;
  });
  function hud() {
    hudN.textContent = pad(cur + 1);
    dotBtns.forEach(function (b, i) { b.classList.toggle('on', i === cur); b.classList.toggle('past', i < cur); });
  }

  function killSlide(s) {
    if (s.tl) { s.tl.kill(); s.tl = null; }
    if (s.kill) s.kill();
    if (G) G.killTweensOf($$('*', s.el));
    s.vidList.forEach(stopV);
  }

  function startSlide(s, dir) {
    if (!G) {
      s.vidList.forEach(function (v, i) { if (v.id !== 'v-k2' && v.id !== 'v-k3' && v.id !== 'v-k4') playV(v, 0); });
      var k2 = $('#v-k2'); if (s.el.id === 's7') playV(k2, 0);
      return;
    }
    s.tl = G.timeline({ delay: .3 });
    s.enter(s.tl, dir);
    if (RM) s.tl.progress(1);
  }

  function goTo(i, opt) {
    opt = opt || {};
    if (i < 0 || i >= N || i === cur) return;
    var dir = i > cur ? 1 : -1, old = cur >= 0 ? S[cur] : null, nw = S[i];
    cur = i; step = 0;
    hud();
    try { history.replaceState(null, '', '#' + (i + 1)); } catch (e) {}
    Bg.go(i, opt.quick);
    if (old) { old.el.style.zIndex = 1; }
    nw.el.style.zIndex = 2;
    killSlide(nw);
    if (G && nw.in) G.set(nw.in, { opacity: 1, y: 0, scale: 1 });
    nw.el.classList.add('is-active');
    startSlide(nw, dir);
    vReset(true);
    if (old) {
      if (G) {
        if (old.tl) old.tl.pause();
        G.to(old.in, {
          opacity: 0, y: -dir * 2.4 * R(), scale: .985, duration: RM ? .25 : .6, ease: 'power2.inOut',
          onComplete: function () { if (cur !== S.indexOf(old)) { old.el.classList.remove('is-active'); killSlide(old); } }
        });
      } else {
        old.el.classList.remove('is-active'); old.vidList.forEach(stopV);
      }
    }
  }

  function next() {
    var s = S[cur];
    if (G && step < s.steps) { step++; s.step(step, RM); vReset(false); }
    else goTo(cur + 1);
  }
  function prev() {
    var s = S[cur];
    if (G && step > 0) { step--; s.step(step, RM); vReset(false); }
    else goTo(cur - 1);
  }

  /* ------------------------------------------------------------ video denetimi
     Video olan slaytta sol altta durdur/oynat ve hız seçimi; videoya tıklamak da durdurur.
     Seçilen hız slayt içinde (alt adımlarda) korunur, başka slayta geçince 1×'e döner. */
  var vctl = $('#vctl'), vpp = $('#vc-pp'), spBtns = $$('#vctl .vc-sp button'), RATES = [.5, .75, 1, 1.5], rate = 1, userPaused = false;
  function effOpacity(el) {
    var o = 1;
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      var cs = getComputedStyle(n);
      if (cs.visibility === 'hidden' || cs.display === 'none') return 0;
      o *= parseFloat(cs.opacity);
    }
    return o;
  }
  function activeVideo() {
    var s = S[cur], best = null, bo = .05;
    if (!s) return null;
    s.vidList.forEach(function (v) { var o = effOpacity(v); if (o > bo) { bo = o; best = v; } });
    return best;
  }
  function vSync() {
    var v = activeVideo();
    document.body.classList.toggle('has-video', !!v);
    document.body.classList.toggle('vpaused', !!v && userPaused);
    var paused = !v || v.paused;
    vctl.classList.toggle('is-paused', paused);
    vpp.setAttribute('aria-label', paused ? 'Oynat' : 'Durdur');
    spBtns.forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-r') === rate); });
  }
  function setRate(r) {
    rate = r;
    $$('video').forEach(function (v) { v.defaultPlaybackRate = r; v.playbackRate = r; });
    vSync();
  }
  function vReset(slideChanged) {
    userPaused = false;
    if (slideChanged && rate !== 1) setRate(1);
    setTimeout(vSync, 60); setTimeout(vSync, 1300);
  }
  function flash(v, kind) {
    if (!G || !v || !v.parentElement) return;
    var f = document.createElement('div'); f.className = 'vflash';
    f.innerHTML = kind === 'pause'
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
    v.parentElement.appendChild(f);
    G.fromTo(f, { opacity: .95, scale: .7 }, { opacity: 0, scale: 1.3, duration: .75, ease: 'power2.out', onComplete: function () { f.remove(); } });
  }
  function togglePlay() {
    var v = activeVideo();
    if (!v) return;
    if (v.paused) { userPaused = false; v.playbackRate = rate; var p = v.play(); if (p && p.catch) p.catch(function () {}); flash(v, 'play'); }
    else { userPaused = true; v.pause(); flash(v, 'pause'); }
    vSync();
  }
  function stepRate(d) {
    var i = RATES.indexOf(rate) + d;
    if (i >= 0 && i < RATES.length) setRate(RATES[i]);
  }
  vpp.addEventListener('click', function (e) { e.stopPropagation(); togglePlay(); });
  spBtns.forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); setRate(+b.getAttribute('data-r')); }); });
  $$('.vwrap,.scr,.pscr').forEach(function (h) { h.addEventListener('click', function () { togglePlay(); }); });
  $$('video').forEach(function (v) {
    ['play', 'pause', 'ended'].forEach(function (ev) { v.addEventListener(ev, vSync); });
    v.addEventListener('play', function () { if (v.playbackRate !== rate) v.playbackRate = rate; });
  });
  function act(fn, ms) {
    var now = performance.now();
    if (now < lockUntil) return;
    lockUntil = now + (ms || 900);
    fn();
  }

  /* tekerlek: bir hareket = bir adım */
  var lastWheel = 0, lastMag = 0;
  addEventListener('wheel', function (e) {
    e.preventDefault();
    var d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    var m = Math.abs(d), now = performance.now(), gap = now - lastWheel, spike = m > lastMag * 1.7 + 8;
    lastWheel = now; lastMag = m;
    if (m < 4) return;
    if (now < lockUntil) return;
    if (gap > 140 || spike) act(function () { d > 0 ? next() : prev(); });
  }, { passive: false });

  addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Enter') { e.preventDefault(); act(next, 750); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); act(prev, 750); }
    else if (k === 'Home') { e.preventDefault(); act(function () { goTo(0); }, 750); }
    else if (k === 'End') { e.preventDefault(); act(function () { goTo(N - 1); }, 750); }
    else if (k === 'k' || k === 'K' || k === 'p' || k === 'P') { e.preventDefault(); togglePlay(); }
    else if (k === '-' || k === '_') { e.preventDefault(); stepRate(-1); }
    else if (k === '+' || k === '=') { e.preventDefault(); stepRate(1); }
    else if (k === 'f' || k === 'F') {
      e.preventDefault();
      if (document.fullscreenElement) document.exitFullscreen && document.exitFullscreen();
      else if (root.requestFullscreen) root.requestFullscreen().catch(function () {});
    }
  });

  var tx = 0, ty = 0, tt = 0;
  addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; tt = Date.now(); }, { passive: true });
  addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 50) return;
    var d = Math.abs(dy) > Math.abs(dx) ? -dy : -dx;
    act(function () { d > 0 ? next() : prev(); }, 800);
  }, { passive: true });

  /* imleç boşta kalınca gizlensin */
  var idleT;
  function wake() { document.body.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(function () { document.body.classList.add('idle'); }, 2600); }
  addEventListener('mousemove', wake); wake();

  addEventListener('hashchange', function () {
    var h = parseInt((location.hash || '').replace('#', ''), 10);
    if (h >= 1 && h <= N && h - 1 !== cur) goTo(h - 1);
  });

  var rz;
  addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () { Bg.go(cur, true); if (S[cur] && S[cur].relayout) S[cur].relayout(); }, 120);
  });

  /* başlangıç */
  function begin() {
    var h = parseInt((location.hash || '').replace('#', ''), 10);
    var start = h >= 1 && h <= N ? h - 1 : 0;
    cur = -1;
    goTo(start, { quick: true });
  }
  var started = false;
  function go() { if (started) return; started = true; begin(); }
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1500); })]).then(go);
  } else go();
  setTimeout(go, 1800);

  window.__deck = { goTo: goTo, next: next, prev: prev, state: function () { return { cur: cur, step: step, N: N }; } };
})();
