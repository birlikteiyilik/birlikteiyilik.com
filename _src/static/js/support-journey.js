/* ============================================================
   Birlikte İyilik Akademi — Desteğin Yolculuğu
   Scroll konumunu master videonun zaman çizelgesine bağlar.
   ============================================================ */

(() => {
  'use strict';

  const root = document.querySelector('[data-bia-support-journey]');
  if (!root) return;

  const video = root.querySelector('.bia-support-journey-video');
  const intro = root.querySelector('[data-bia-support-intro]');
  const progressBar = root.querySelector('[data-bia-support-progress]');
  const sceneCount = root.querySelector('[data-bia-support-scene-count]');
  const cards = [...root.querySelectorAll('[data-bia-support-card]')];
  const copyButtons = [...root.querySelectorAll('[data-bia-support-copy]')];
  const toast = root.querySelector('[data-bia-support-toast]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /*
   * İlk sekiz sahne %15 hızlandırıldı. Dokuzuncu sahne, talep edilen
   * hızlı topluluk açılımı için master videoda 2× hızlandırıldı.
   */
  const timeline = [
    { from: 0.00, to: 6.58, scrollVh: 150, scene: 1, desktop: '50% center', mobile: '50% center' },
    { from: 6.58, to: 13.06, scrollVh: 155, scene: 2, desktop: '50% center', mobile: '50% center' },
    { from: 13.06, to: 19.54, scrollVh: 155, scene: 3, desktop: '50% center', mobile: '52% center' },
    { from: 19.54, to: 26.02, scrollVh: 155, scene: 4, desktop: '50% center', mobile: '50% center' },
    { from: 26.02, to: 31.41, scrollVh: 135, scene: 5, desktop: '50% center', mobile: '49% center' },
    { from: 31.41, to: 37.45, scrollVh: 145, scene: 6, desktop: '50% center', mobile: '50% center' },
    { from: 37.45, to: 43.58, scrollVh: 145, scene: 7, desktop: '50% center', mobile: '55% center' },
    { from: 43.58, to: 50.15, scrollVh: 160, scene: 8, desktop: '50% center', mobile: '58% center' },
    { from: 50.15, to: 54.04, scrollVh: 48, scene: 9, desktop: '50% center', mobile: '50% center', phase: 'fast-final' },
    { from: 54.04, to: 54.04, scrollVh: 70, scene: 9, desktop: '50% center', mobile: '50% center', phase: 'final-hold' },
    { from: 54.04, to: 54.04, scrollVh: 140, scene: 9, desktop: '50% center', mobile: '50% center', phase: 'bank' }
  ];

  const cardWindows = [
    { start: 92, end: 280 },
    { start: 338, end: 525 },
    { start: 650, end: 842 },
    { start: 952, end: 1160 },
    { start: 1178, end: 1310 }
  ];

  let totalVh = 0;
  timeline.forEach((segment) => {
    segment.startVh = totalVh;
    totalVh += segment.scrollVh;
    segment.endVh = totalVh;
  });

  const videoEndVh = timeline[8].endVh;
  const bankStartVh = timeline[10].startVh;
  root.style.setProperty('--bia-support-story-vh', String(totalVh));

  let pageTop = 0;
  let vhPx = window.innerHeight / 100;
  let targetTime = 0.01;
  let animationFrame = 0;
  let scrollFrame = 0;
  let toastTimer = 0;
  let currentScene = 1;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

  const measure = () => {
    pageTop = root.getBoundingClientRect().top + window.scrollY;
    vhPx = Math.max(window.innerHeight / 100, 1);
    updateFromScroll();
  };

  const getScrollVh = () => clamp((window.scrollY - pageTop) / vhPx, 0, totalVh);

  const locateSegment = (scrollVh) => {
    for (let index = 0; index < timeline.length; index += 1) {
      if (scrollVh <= timeline[index].endVh) return timeline[index];
    }
    return timeline[timeline.length - 1];
  };

  const timeAtScroll = (scrollVh, segment) => {
    if (segment.to === segment.from) return segment.to;
    const local = clamp((scrollVh - segment.startVh) / segment.scrollVh, 0, 1);
    return segment.from + ((segment.to - segment.from) * local);
  };

  const fadeWindow = (scrollVh, start, end) => {
    const fadeDistance = 24;
    const fadeIn = clamp((scrollVh - start) / fadeDistance, 0, 1);
    const fadeOut = clamp((end - scrollVh) / fadeDistance, 0, 1);
    return easeOutCubic(Math.min(fadeIn, fadeOut));
  };

  const updateCards = (scrollVh) => {
    cards.forEach((card, index) => {
      const windowRange = cardWindows[index];
      const opacity = fadeWindow(scrollVh, windowRange.start, windowRange.end);
      card.style.setProperty('--bia-support-card-opacity', opacity.toFixed(3));
      card.style.setProperty('--bia-support-card-y', `${((1 - opacity) * 26).toFixed(2)}px`);
    });
  };

  const updateIntro = (scrollVh) => {
    const opacity = clamp(1 - (scrollVh / 96), 0, 1);
    intro.style.setProperty('--bia-support-intro-opacity', opacity.toFixed(3));
    intro.style.setProperty('--bia-support-intro-y', `${(-14 * (1 - opacity)).toFixed(2)}px`);
  };

  const updateBank = (scrollVh) => {
    const rawProgress = clamp((scrollVh - bankStartVh) / timeline[10].scrollVh, 0, 1);
    const bankProgress = easeOutCubic(rawProgress);
    root.style.setProperty('--bia-support-bank-progress', bankProgress.toFixed(4));
    root.classList.toggle('bia-support-journey-bank-active', bankProgress > 0.88);
  };

  const updateScenePresentation = (segment) => {
    if (segment.scene !== currentScene) currentScene = segment.scene;
    root.style.setProperty('--bia-support-video-position', segment.desktop);
    root.style.setProperty('--bia-support-video-position-mobile', segment.mobile);
    if (sceneCount) {
      sceneCount.textContent = `${String(segment.scene).padStart(2, '0')} / 09`;
    }
  };

  const scrub = () => {
    animationFrame = 0;
    if (!video || reducedMotion.matches || video.readyState < 1) return;

    const durationLimit = Number.isFinite(video.duration) ? Math.max(video.duration - 0.04, 0.01) : 54.04;
    const safeTarget = clamp(targetTime, 0.01, durationLimit);
    const difference = safeTarget - video.currentTime;

    if (Math.abs(difference) < 0.018) {
      if (Math.abs(difference) > 0.002) video.currentTime = safeTarget;
      return;
    }

    const gain = Math.abs(difference) > 1.2 ? 0.28 : 0.16;
    video.currentTime += difference * gain;
    animationFrame = window.requestAnimationFrame(scrub);
  };

  const requestScrub = () => {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = window.requestAnimationFrame(scrub);
  };

  const updateFromScroll = () => {
    scrollFrame = 0;
    if (reducedMotion.matches) return;

    const scrollVh = getScrollVh();
    const segment = locateSegment(scrollVh);
    targetTime = timeAtScroll(scrollVh, segment);

    updateScenePresentation(segment);
    updateIntro(scrollVh);
    updateCards(scrollVh);
    updateBank(scrollVh);

    if (progressBar) {
      const progress = clamp(scrollVh / videoEndVh, 0, 1);
      progressBar.style.setProperty('--bia-support-progress', progress.toFixed(4));
    }

    if (video && video.readyState >= 1) {
      const durationLimit = Number.isFinite(video.duration) ? Math.max(video.duration - 0.04, 0.01) : 54.04;
      const safeTarget = clamp(targetTime, 0.01, durationLimit);
      /*
       * Büyük scroll sıçramalarında doğrudan seek, küçük farklarda ise
       * yumuşatılmış rAF takibi kullanılır. Bu yaklaşım ters yönde de çalışır.
       */
      if (Math.abs(safeTarget - video.currentTime) > 0.34) {
        video.currentTime = safeTarget;
      } else {
        requestScrub();
      }
    }
  };

  const onScroll = () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateFromScroll);
  };

  const setupVideo = () => {
    if (!video) return;

    video.pause();
    video.addEventListener('play', () => video.pause());

    const initializeVideoTime = () => {
      try {
        video.currentTime = clamp(targetTime, 0.01, Math.max(video.duration - 0.04, 0.01));
      } catch (_) {
        // Bazı mobil tarayıcılar ilk kullanıcı etkileşimine kadar seek işlemini erteler.
      }
      updateFromScroll();
    };

    const markVideoReady = () => {
      root.classList.add('bia-support-journey-video-ready');
    };

    if (video.readyState >= 1) initializeVideoTime();
    else video.addEventListener('loadedmetadata', initializeVideoTime, { once: true });

    if (video.readyState >= 2) markVideoReady();
    else video.addEventListener('loadeddata', markVideoReady, { once: true });

    video.addEventListener('error', () => {
      root.classList.add('bia-support-journey-video-failed');
      root.classList.remove('bia-support-journey-video-ready');
    }, { once: true });
  };

  const fallbackCopy = (text) => {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    return copied;
  };

  const showToast = (message) => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('bia-support-journey-toast-visible');
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('bia-support-journey-toast-visible');
    }, 2200);
  };

  const copyIban = async (button) => {
    const iban = button.dataset.biaSupportCopy;
    let copied = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(iban);
        copied = true;
      } else {
        copied = fallbackCopy(iban);
      }
    } catch (_) {
      copied = fallbackCopy(iban);
    }

    showToast(copied ? 'IBAN kopyalandı.' : 'IBAN kopyalanamadı.');
  };

  copyButtons.forEach((button) => {
    button.addEventListener('click', () => copyIban(button));
  });

  reducedMotion.addEventListener?.('change', () => {
    if (reducedMotion.matches) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      video?.pause();
      root.classList.add('bia-support-journey-reduced');
    } else {
      root.classList.remove('bia-support-journey-reduced');
      measure();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      video?.pause();
    } else {
      updateFromScroll();
    }
  });

  if (reducedMotion.matches) {
    root.classList.add('bia-support-journey-reduced');
    video?.pause();
  } else {
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  window.addEventListener('resize', measure, { passive: true });
  setupVideo();
  measure();
})();
