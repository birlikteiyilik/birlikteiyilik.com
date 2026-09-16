'use strict';
// A native, progressively enhanced rail: no duplicate content or wheel hijacking.
// Fractional time-based position prevents low-speed scroll quantization/stutter.
(() => {
  const section = document.querySelector('#takvim');
  const viewport = section.querySelector('.calendar-viewport');
  const track = section.querySelector('.calendar-track');
  const pauseButton = section.querySelector('#calendar-toggle');
  const previous = section.querySelector('#calendar-prev');
  const next = section.querySelector('#calendar-next');
  const status = section.querySelector('#calendar-status');
  const monthButtons = [...section.querySelectorAll('[data-calendar-month]')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false, hovered = false, focused = false, visible = false;
  let position = viewport.scrollLeft, limit = 0, direction = 1, frame = 0;
  let lastTime = 0, holdUntil = 0, destination = null, monthOffsets = [];
  let touching = false, suspended = false, resumeTimer = 0, selectedMonth = null, lastControls = 0;
  const motionOff = () => reduce.matches || document.documentElement.classList.contains('motion-off');
  const blocked = () => suspended || document.hidden || !visible || touching || !!document.querySelector('dialog[open]');
  const canAuto = () => !blocked() && !paused && !hovered && !focused && !motionOff() && limit > 0;
  const clamp = value => Math.max(0, Math.min(limit, value));

  function updateControls() {
    const stopped = paused || motionOff();
    pauseButton.setAttribute('aria-pressed', String(stopped));
    pauseButton.setAttribute('aria-label', stopped ? 'Takvimin otomatik kaymasını başlat' : 'Takvimin otomatik kaymasını durdur');
    pauseButton.firstElementChild.textContent = stopped ? '▶' : 'Ⅱ';
    pauseButton.disabled = motionOff() || limit <= 0;
    previous.disabled = position <= 1;
    next.disabled = position >= limit - 1;
    status.textContent = motionOff() ? 'Hareket kapalı · Elle kaydır' : paused ? 'Otomatik kayma duraklatıldı' : hovered || focused || touching ? 'İncelerken duraklatıldı' : 'Yavaşça keşfet · Otomatik kayma';
    const active = selectedMonth ?? Math.max(0, monthOffsets.findLastIndex(offset => position + viewport.clientWidth / 2 >= offset));
    monthButtons.forEach((button, index) => button.setAttribute('aria-current', String(index === active)));
  }
  function stop() {cancelAnimationFrame(frame); clearTimeout(resumeTimer); frame = 0; lastTime = 0;}
  function wake() {
    updateControls();
    if (blocked() || (destination === null && !canAuto())) {stop();return;}
    if (!frame) frame = requestAnimationFrame(tick);
  }
  function tick(time) {
    frame = 0;
    const elapsed = lastTime ? Math.min(48, time - lastTime) : 0;
    lastTime = time;
    if (blocked()) {stop();return;}
    if (destination === null && time < holdUntil) {
      stop();
      if (canAuto()) resumeTimer = setTimeout(wake, holdUntil - time + 16);
      return;
    }
    if (destination !== null) {
      position += (destination - position) * (1 - Math.exp(-elapsed / 95));
      if (Math.abs(destination - position) < .5 || motionOff()) {position = destination; destination = null; holdUntil = time + 1800;}
    } else if (canAuto() && time >= holdUntil) {
      selectedMonth = null;
      // Ease down near either edge before reversing; no reset or visual jump.
      const distance = direction > 0 ? limit - position : position;
      const speed = 28 * Math.min(1, Math.max(.2, distance / 80));
      position = clamp(position + direction * speed * elapsed / 1000);
      if ((direction < 0 && position <= 0) || (direction > 0 && position >= limit)) {direction *= -1; holdUntil = time + 1600;}
    }
    viewport.scrollLeft = position;
    if (time - lastControls > 160) {updateControls();lastControls = time;}
    if (destination !== null || canAuto()) frame = requestAnimationFrame(tick);
    else stop();
  }
  function go(value) {
    selectedMonth = null;
    destination = clamp(value);
    if (motionOff()) {position = destination;viewport.scrollLeft = position;destination = null;}
    wake();
  }
  function measure() {
    limit = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    position = clamp(viewport.scrollLeft);
    monthOffsets = monthButtons.map(button => document.querySelector('#calendar-' + button.dataset.calendarMonth).offsetLeft - track.offsetLeft);
    if (destination !== null) destination = clamp(destination);
    wake();
  }
  previous.addEventListener('click', () => go(position - section.querySelector('.calendar-event').offsetWidth));
  next.addEventListener('click', () => go(position + section.querySelector('.calendar-event').offsetWidth));
  monthButtons.forEach((button, index) => button.addEventListener('click', () => {go(monthOffsets[index]);selectedMonth = index;updateControls();}));
  pauseButton.addEventListener('click', () => {paused = !paused;destination = null;wake();});
  viewport.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    go(event.key === 'Home' ? 0 : event.key === 'End' ? limit : position + (event.key === 'ArrowRight' ? 1 : -1) * section.querySelector('.calendar-event').offsetWidth);
  });
  viewport.addEventListener('pointerenter', event => {if(event.pointerType === 'mouse') {hovered = true;wake();}});
  viewport.addEventListener('pointerleave', () => {hovered = false;wake();});
  viewport.addEventListener('pointerdown', () => {touching = true;destination = null;wake();});
  const release = () => {if (!touching) return;touching = false;position = viewport.scrollLeft;holdUntil = performance.now() + 2500;wake();};
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  viewport.addEventListener('wheel', () => {destination = null;selectedMonth = null;holdUntil = performance.now() + 2500;wake();}, {passive:true});
  viewport.addEventListener('scroll', () => {
    // Native touch/keyboard scrolling owns the position only when animation is idle.
    if (!frame || touching || (destination === null && Math.abs(viewport.scrollLeft - position) > 2)) position = viewport.scrollLeft;
    if (!frame || touching) updateControls();
  }, {passive:true});
  section.addEventListener('focusin', event => {
    focused = true;
    if (viewport.contains(event.target) && event.target !== viewport) {
      const card = event.target.closest('.calendar-event,.calendar-future');
      if (card) {
        const left = card.offsetLeft - track.offsetLeft;
        if (left < position) go(left);
        else if (left + card.offsetWidth > position + viewport.clientWidth) go(left + card.offsetWidth - viewport.clientWidth);
      }
    }
    wake();
  });
  section.addEventListener('focusout', () => queueMicrotask(() => {focused = section.contains(document.activeElement);wake();}));
  const visibilityObserver = new IntersectionObserver(entries => {visible = entries[0].isIntersecting;wake();}, {threshold:.15});
  visibilityObserver.observe(section);
  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(viewport);
  const motionObserver = new MutationObserver(wake);
  motionObserver.observe(document.documentElement, {attributes:true,attributeFilter:['class']});
  document.querySelectorAll('dialog').forEach(modal => motionObserver.observe(modal, {attributes:true,attributeFilter:['open']}));
  document.addEventListener('visibilitychange', wake);
  reduce.addEventListener('change', () => {destination = null;wake();});
  window.addEventListener('pagehide', () => {suspended = true;stop();});
  window.addEventListener('pageshow', () => {suspended = false;measure();});
  document.fonts.ready.then(measure);
  measure();
})();
