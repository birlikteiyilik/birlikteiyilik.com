/* ============================================================
   Birlikte İyilik Akademi — sayfa geneli giriş hareketleri
   İçerik normal belge akışında kalır; kaydırmayı kilitlemez.
   ============================================================ */

(() => {
  'use strict';

  const page = document.body;
  if (!page.classList.contains('route-home')) return;

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealSelector = [
    '.values-hero-copy',
    '.route-section-heading',
    '.values-journey-heading',
    '.values-route-static',
    '.route-model-card',
    '.values-mobile-list article',
    '.route-promise-copy',
    '.route-promise-list article',
    '.route-programs .program-card',
    '.route-process .timeline-step',
    '.section-header',
    '.counter-item',
    '.carousel-card',
    '.event-card',
    '.route-followup .app-section',
    '#destek .support-card',
    '#iletisim .grid > *',
  ].join(',');

  const preparedElements = new WeakSet();
  let entranceObserver = null;
  let staggerIndex = 0;

  const show = (element) => {
    element.classList.add('is-visible');
    entranceObserver?.unobserve(element);
  };

  const createObserver = () => {
    if (entranceObserver || motionPreference.matches) return;

    entranceObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) show(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -6% 0px',
      }
    );
  };

  const prepare = (element) => {
    if (preparedElements.has(element)) return;
    preparedElements.add(element);

    element.classList.add('route-scroll-reveal');
    element.style.setProperty('--reveal-delay', `${(staggerIndex % 4) * 70}ms`);
    staggerIndex += 1;

    if (motionPreference.matches) {
      show(element);
      return;
    }

    createObserver();
    entranceObserver.observe(element);
  };

  const prepareTree = (root) => {
    if (!(root instanceof Element)) return;
    if (root.matches(revealSelector)) prepare(root);
    root.querySelectorAll(revealSelector).forEach(prepare);
  };

  const syncMotionPreference = () => {
    if (motionPreference.matches) {
      entranceObserver?.disconnect();
      entranceObserver = null;
      document.querySelectorAll('.route-scroll-reveal').forEach(show);
      return;
    }

    createObserver();
  };

  const start = () => {
    page.classList.add('route-motion-ready');
    createObserver();
    prepareTree(document.querySelector('main') || page);

    const contentObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) prepareTree(node);
        });
      });
    });

    contentObserver.observe(document.querySelector('main') || page, {
      childList: true,
      subtree: true,
    });

    if (typeof motionPreference.addEventListener === 'function') {
      motionPreference.addEventListener('change', syncMotionPreference);
    } else {
      motionPreference.addListener(syncMotionPreference);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
