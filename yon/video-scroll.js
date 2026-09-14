(() => {
  'use strict';
  const video = document.getElementById('storyVideo');
  const story = document.getElementById('hikaye');
  const stage = document.getElementById('storyStage');
  const toggle = document.getElementById('watchFilm');
  const status = document.getElementById('filmStatus');
  const progress = document.getElementById('pageProgress');
  const chapterProgress = document.getElementById('chapterProgress');
  const chapterTitle = document.getElementById('chapterTitle');
  const step = document.getElementById('currentStep');
  const media = matchMedia('(orientation: portrait)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const frameCallbacks = typeof video.requestVideoFrameCallback === 'function';
  const START = 3.2;
  const labels = ['Başlangıç','Bir adım','6 haftalık rota','Yönünü gör','Sesini bul','Düzenini kur','Uygulama','Yol haritası','Güvenli alan','Pilot ve takip','Sonraki adım'];
  let mode = 'scroll';
  let target = START;
  let position = START;
  let raf = 0;
  let lastTick = 0;
  let ready = false;
  let generation = 0;
  const end = () => Math.max(START, (video.duration || 77) - .1);
  const ratio = () => Math.max(0, Math.min(1, (scrollY - story.offsetTop) / Math.max(1, story.offsetHeight - stage.offsetHeight)));
  // Mirrors the rendered camera in remotion/src/film/camera.ts.
  const cameraPage = (time) => {
    const progress = Math.max(0, Math.min(10, (time * 30 - 96) / 211.8));
    const page = Math.floor(progress), u = progress - page;
    return page + .18 * u + .82 * u * u * u * (u * (u * 6 - 15) + 10);
  };
  const scrollTime = (fraction) => {
    const targetPage = Math.max(0, Math.min(10, fraction * 10));
    if (targetPage === 10) return 73.8;
    const page = Math.floor(targetPage), within = targetPage - page;
    let low = 0, high = 1;
    for (let i = 0; i < 24; i++) {
      const u = (low + high) / 2;
      const travel = .18 * u + .82 * u * u * u * (u * (u * 6 - 15) + 10);
      if (travel < within) low = u; else high = u;
    }
    return (96 + (page + (low + high) / 2) * 211.8) / 30;
  };

  function updateUI(time) {
    const fraction = cameraPage(time) / 10;
    const chapter = Math.min(10, Math.max(0, Math.round(cameraPage(time))));
    step.textContent = String(chapter + 1).padStart(2, '0');
    chapterTitle.textContent = labels[chapter];
    progress.style.transform = `scaleX(${fraction})`;
    chapterProgress.style.transform = `scaleX(${fraction})`;
    stage.classList.toggle('is-last', cameraPage(time) > 9.96);
  }

  function tick(now) {
    raf = 0;
    if (!ready || mode !== 'scroll') return;
    // Only one decoder seek at a time. Repeated currentTime writes while seeking
    // cancel useful decoder work, especially on Safari and slower phones.
    if (video.seeking) return;
    const elapsed = Math.min(50, Math.max(8, now - (lastTick || now - 16.7)));
    lastTick = now;
    const distance = target - position;
    const easing = 1 - Math.exp(-elapsed / (Math.abs(distance) > 3 ? 55 : 110));
    position = reduced.matches ? target : position + distance * easing;
    if (Math.abs(target - position) < 1 / 60) position = target;
    if (Math.abs(video.currentTime - position) >= 1 / 60) video.currentTime = position;
    if (Math.abs(target - position) > 1 / 60 && !video.seeking) schedule();
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(tick); }
  function syncScroll() {
    if (mode !== 'scroll') return;
    target = scrollTime(ratio());
    schedule();
  }
  video.addEventListener('seeked', () => {
    if (ready) stage.classList.add('is-loaded');
    if (!frameCallbacks) updateUI(video.currentTime);
    if (mode === 'scroll' && Math.abs(target - video.currentTime) > 1 / 60) schedule();
  });
  video.addEventListener('loadeddata', () => {
    ready = true;
    status.textContent = 'Kaydırarak ilerle';
    toggle.disabled = false;
    position = scrollTime(ratio());
    video.currentTime = position;
    syncScroll();
  });
  video.addEventListener('timeupdate', () => { if (mode === 'watch' && !frameCallbacks) updateUI(video.currentTime); });
  // The chapter label follows the frame actually presented by the decoder,
  // rather than the requested seek time during fast scrolls.
  if (frameCallbacks) {
    const observeFrame = () => video.requestVideoFrameCallback((_, metadata) => {
      updateUI(metadata.mediaTime);
      observeFrame();
    });
    observeFrame();
  }
  video.addEventListener('error', () => {
    status.textContent = 'Video yüklenemedi. Aşağıdaki bağlantıdan açabilirsiniz.';
    stage.classList.add('has-error');
  });

  function scrollMode() {
    video.pause();
    mode = 'scroll';
    video.controls = false;
    toggle.textContent = 'Filmi izle ↗';
    toggle.setAttribute('aria-pressed', 'false');
    const fraction = cameraPage(video.currentTime) / 10;
    position = target = video.currentTime;
    window.scrollTo({top:story.offsetTop + fraction * (story.offsetHeight - stage.offsetHeight),behavior:'instant'});
    stage.classList.remove('is-watching');
    syncScroll();
  }
  toggle.addEventListener('click', async () => {
    if (mode === 'watch') { scrollMode(); return; }
    mode = 'watch';
    cancelAnimationFrame(raf); raf = 0;
    stage.classList.add('is-watching');
    toggle.textContent = 'Kaydırmaya dön';
    toggle.setAttribute('aria-pressed', 'true');
    video.controls = true;
    if (video.currentTime <= START + .1 || video.currentTime >= end() - .5) video.currentTime = 0;
    try { await video.play(); } catch { video.controls = true; }
  });
  video.addEventListener('ended', scrollMode);

  function loadSource() {
    generation++;
    ready = false;
    video.pause();
    stage.classList.remove('is-loaded');
    toggle.disabled = true;
    status.textContent = 'Film yükleniyor';
    video.poster = `/yon/assets/film-${media.matches ? 'mobile' : 'desktop'}-poster-v2.jpg`;
    video.src = `/yon/assets/kendi-yolunda-${media.matches ? 'mobile' : 'desktop'}-v2.mp4`;
    video.load();
    // If orientation changes during playback, return to deterministic scroll mode.
    mode = 'scroll'; video.controls = false;
    toggle.textContent = 'Filmi izle ↗';
    toggle.setAttribute('aria-pressed', 'false');
    stage.classList.remove('is-watching');
    const loadGeneration = generation;
    setTimeout(() => {
      if (!ready && generation === loadGeneration) status.textContent = 'Film hazırlanıyor; bağlantınıza göre biraz sürebilir.';
    }, 8000);
  }
  media.addEventListener('change', loadSource);
  window.addEventListener('scroll', syncScroll, {passive:true});
  window.addEventListener('resize', syncScroll, {passive:true});
  window.addEventListener('pageshow', syncScroll);
  loadSource();
})();
