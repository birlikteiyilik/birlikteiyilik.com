/* Birlikte İyilik Akademi · sunum · yolculuk katmanı
   Müfredat slaydında (14) hazır kitaplara tıklayınca LMS'teki yolculuk haritası tam ekran açılır.
   Harita çizimi ve kaydırmayla çizilen yol assets/yolculuk/ altındaki LMS dosyalarından gelir
   (BiriJourney.render); bu dosya yalnız veriyi verir, katmanı açıp kapatır ve sunumun
   tekerlek / tuş / dokunma kumandasını katman açıkken susturur (js/sunum.js bakar: window.__yolculuk). */
(function () {
  'use strict';

  var doc = document, root = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var overlay = $('#yv'), bar = $('.yv-bar'), body = $('#yv-body'), fit = $('#yv-fit'), stage = $('#yv-stage'), host = $('#yv-map');
  var titleEl = $('#yv-title'), countEl = $('#yv-count'), closeBtn = $('#yv-close'), deckEl = $('#deck');
  if (!overlay || !host) return;

  /* Yollar sayfa köküne göredir; kök, bu betiğin kendi adresinden bulunur (yayında /sunum/ altına taşınsa da doğru çözülür). */
  var script = doc.currentScript;
  var BASE = script && script.src ? new URL('../', script.src) : new URL('./', location.href);
  function url(path) { return new URL(path, BASE).href; }

  var SLIDE = 13;            // Müfredat: 14. slayt
  var LOGICAL = 1180;        // haritanın mantıksal genişliği: altı duraklı geniş yerleşim
  var state = { open: false, series: '', opener: null, viaKey: false, closing: 0 };

  function deckSlide() { var d = window.__deck; return d && d.state ? d.state().cur : -1; }

  /* ---------- veri ---------- */
  function build(series) {
    var src = window.YOLCULUK_VERI && window.YOLCULUK_VERI[series];
    if (!src) return null;
    var lessons = src.lessons.map(function (l) {
      var copy = { id: l.id, order: l.order, title: l.title, series: l.series };
      if (l.pullar) copy.pullar = l.pullar.map(function (p) { return { id: p.id, ad: p.ad, gorsel: url(p.gorsel) }; });
      return copy;
    });
    // Sunumda yalnız hazır olan dersler açık; kalanı kilitli görünür.
    var states = lessons.map(function (_, i) { return i < src.open ? 'open' : 'locked'; });
    return { title: src.title, lessons: lessons, states: states, open: src.open };
  }

  /* ---------- ölçek ---------- */
  function metrics() {
    var vw = window.innerWidth;
    var s = Math.max(.75, Math.min(2.4, vw / 1366));
    var gutter = vw < 700 ? 16 : 32;
    return { s: s, w: Math.max(320, Math.min(LOGICAL, Math.floor((vw - 2 * gutter) / s))) };
  }
  function place() {
    var m = metrics();
    stage.style.width = m.w + 'px';
    fit.style.width = Math.round(m.w * m.s) + 'px';
    stage.style.transform = 'scale(' + m.s + ')';
    return m;
  }
  // Kısa harita (Elifbâ) ekranda yukarı yapışmasın: boş yer varsa dikeyde ortalanır.
  function fitHeight(m) {
    var h = Math.ceil(host.offsetHeight * m.s), avail = overlay.clientHeight - bar.offsetHeight;
    fit.style.height = h + 'px';
    fit.style.marginTop = Math.max(0, Math.round((avail - h) * .42 - 24)) + 'px';
  }

  /* ---------- çizim ---------- */
  var drawn = null;
  function draw(series, animate) {
    var data = build(series);
    if (!data || !window.BiriJourney) return;
    var m = place();
    var A = window.BiriArt;
    host.innerHTML = '';
    window.BiriJourney.render(host, {
      series: series, lessons: data.lessons, states: data.states, animate: animate && !RM,
      hilal: A ? A.hilal({ pose: 'selam' }) : '', runner: A ? A.hilal({ pose: 'kos' }) : ''
    });
    // Haritadaki düğmeler sunumda bir yere gitmez; klavye ile de odak tutmasın.
    $$('.jm-node', host).forEach(function (n) { n.tabIndex = -1; });
    fitHeight(m);
    drawn = { series: series, w: m.w, s: m.s };
  }

  /* ---------- aç / kapat ---------- */
  function open(series, opener, viaKey) {
    if (state.open || deckSlide() !== SLIDE) return;
    var data = build(series);
    if (!data) return;
    state.open = true; state.series = series; state.opener = opener || null; state.viaKey = !!viaKey;
    clearTimeout(state.closing);
    titleEl.textContent = data.title + ' yolculuğu';
    countEl.textContent = data.lessons.length === data.open
      ? data.lessons.length + ' ders'
      : data.lessons.length + ' ders · ilk ' + data.open + '’i hazır';
    overlay.hidden = false;
    overlay.scrollTop = 0;
    doc.body.classList.add('yv-open');
    if (deckEl) deckEl.inert = true;
    var hud = $('.hud'); if (hud) hud.inert = true;
    draw(series, true);
    void overlay.offsetWidth;
    overlay.classList.add('on');
    try { overlay.focus({ preventScroll: true }); } catch (e) { overlay.focus(); }
  }

  function close() {
    if (!state.open) return;
    state.open = false;
    overlay.classList.remove('on');
    if (deckEl) deckEl.inert = false;
    var hud = $('.hud'); if (hud) hud.inert = false;
    doc.body.classList.remove('yv-open');
    var opener = state.opener, viaKey = state.viaKey;
    state.opener = null;
    state.closing = setTimeout(function () {
      if (state.open) return;
      overlay.hidden = true; host.innerHTML = ''; drawn = null;
    }, RM ? 0 : 420);
    if (opener && viaKey) { try { opener.focus({ preventScroll: true }); } catch (e) {} }
    else { try { doc.activeElement && doc.activeElement.blur && doc.activeElement.blur(); } catch (e) {} }
  }

  closeBtn.addEventListener('click', function (e) { e.stopPropagation(); close(); });
  // Boş zemine (haritanın dışına) tıklamak da kapatır.
  overlay.addEventListener('click', function (e) { if (e.target === overlay || e.target === body) close(); });

  /* Esc kapatır; Tab odağı kapatma düğmesinde tutar. Ok / Boşluk / PageDown / Home / End katmanı kaydırır (varsayılan davranış). */
  window.addEventListener('keydown', function (e) {
    if (!state.open) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }
  });

  /* ---------- kitaplar ---------- */
  function wireBooks() {
    $$('#s14 .book').forEach(function (book) {
      var name = ($('.spine', book) || {}).textContent || '';
      var ready = book.classList.contains('ready');
      var series = /Elif/i.test(name) ? 'kuran' : /Akaid/i.test(name) ? 'akaid' : '';
      if (ready && series) {
        book.setAttribute('role', 'button');
        book.setAttribute('tabindex', '0');
        book.setAttribute('aria-label', name + ' yolculuğunu aç');
        book.dataset.series = series;
        // Fareyle tıklayınca odak kalmasın: Boşluk / Enter yine slaytı ilerletsin.
        book.addEventListener('mousedown', function (e) { e.preventDefault(); });
        book.addEventListener('click', function (e) { e.stopPropagation(); open(series, book, false); });
        book.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); open(series, book, true); }
        });
      } else if (!ready) {
        book.setAttribute('aria-label', name + ', hazırlanıyor');
        book.addEventListener('click', function () {
          if (RM) return;
          book.classList.remove('shake'); void book.offsetWidth; book.classList.add('shake');
        });
        book.addEventListener('animationend', function () { book.classList.remove('shake'); });
      }
    });
  }
  wireBooks();

  // Adres çubuğundan başka slayta gidilirse katman kapanır.
  window.addEventListener('hashchange', function () { if (state.open && deckSlide() !== SLIDE) close(); });

  /* ---------- pencere değişince ---------- */
  var rz;
  window.addEventListener('resize', function () {
    if (!state.open) return;
    clearTimeout(rz);
    rz = setTimeout(function () {
      if (!state.open) return;
      var m = metrics();
      if (drawn && Math.abs(m.s - drawn.s) < .001 && m.w === drawn.w) return;
      var ratio = overlay.scrollHeight > overlay.clientHeight ? overlay.scrollTop / (overlay.scrollHeight - overlay.clientHeight) : 0;
      draw(state.series, false);
      overlay.scrollTop = ratio * (overlay.scrollHeight - overlay.clientHeight);
    }, 160);
  });

  window.__yolculuk = {
    open: function (series) { open(series, null, false); },
    close: close,
    isOpen: function () { return state.open; }
  };
})();
