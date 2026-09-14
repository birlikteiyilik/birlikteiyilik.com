(() => {
  'use strict';
  document.documentElement.classList.add('js-motion');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 901px)');
  const chapters = [...document.querySelectorAll('.journey-chapter')];
  const images = [...document.querySelectorAll('.journey-image')];
  const dots = [...document.querySelectorAll('.visual-dots i')];
  const video = document.getElementById('heroVideo');
  const motionToggle = document.getElementById('motionToggle');
  let centers = [], raf = 0, userPaused = false, heroVisible = false;
  const clamp = (x, low, high) => Math.max(low, Math.min(high, x));
  const smooth = x => x * x * (3 - 2 * x);
  function measure() {
    centers = chapters.map(chapter => { const rect = chapter.getBoundingClientRect(); return scrollY + rect.top + rect.height / 2; });
    schedule();
  }
  function draw() {
    raf = 0;
    if (!desktop.matches || centers.length !== 3) return;
    const focus = scrollY + innerHeight * .52;
    let position = 0;
    if (focus > centers[0]) {
      const section = focus < centers[1] ? 0 : 1;
      position = section + clamp((focus - centers[section]) / (centers[section + 1] - centers[section]), 0, 1);
    }
    const current = Math.round(position);
    const base = Math.min(1, Math.floor(position));
    const blend = smooth(clamp((position - base - .25) / .5, 0, 1));
    images.forEach((image, index) => {
      // Reading positions hold the complete image. Only images crossfade;
      // all text stays in normal document flow and never becomes a video frame.
      const opacity = reduced.matches ? Number(index === current) : index === base ? 1 : index === base + 1 ? blend : 0;
      image.style.opacity = String(opacity);
      image.style.transform = reduced.matches ? 'none' : `translateY(${(index - position) * 8}px) scale(1.04)`;
      dots[index].classList.toggle('active', index === current);
    });
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(draw); }
  function updateMotion() {
    if (reduced.matches || userPaused || !heroVisible || document.hidden) video.pause();
    else {
      const source = video.querySelector('source');
      if (!source.src) { source.src = source.dataset.src; video.load(); }
      video.play().catch(() => { motionToggle.hidden = true; });
    }
    motionToggle.setAttribute('aria-pressed', String(userPaused));
    motionToggle.setAttribute('aria-label', userPaused ? 'Görsel hareketini başlat' : 'Görsel hareketini durdur');
    motionToggle.firstElementChild.textContent = userPaused ? '▷' : 'Ⅱ';
  }
  video.addEventListener('playing', () => { motionToggle.hidden = false; });
  video.addEventListener('error', () => { motionToggle.hidden = true; });
  motionToggle.addEventListener('click', () => { userPaused = !userPaused; updateMotion(); });
  new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; updateMotion(); }, {threshold:.05}).observe(video);
  document.addEventListener('visibilitychange', updateMotion);
  reduced.addEventListener('change', () => { updateMotion(); schedule(); });
  desktop.addEventListener('change', measure);
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', measure, {passive:true});
  window.addEventListener('pageshow', measure);
  new ResizeObserver(measure).observe(document.querySelector('.journey-chapters'));
  document.fonts.ready.then(measure);
  measure();
})();
