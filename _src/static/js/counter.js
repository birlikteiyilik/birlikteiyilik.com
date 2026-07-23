/* ============================================================
   Birlikte İyilik Akademi — Animated Counters
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const registered = new WeakSet();

  const formatFinal = (el) => {
    const target = Number.parseInt(el.dataset.counter || '0', 10);
    const suffix = el.dataset.suffix || '';
    el.textContent = target.toLocaleString('tr-TR') + suffix;
  };

  const animate = (el) => {
    if (el.dataset.counterAnimated === 'true') return;
    el.dataset.counterAnimated = 'true';

    const target = Number.parseInt(el.dataset.counter || '0', 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(eased * target);
      el.textContent = current.toLocaleString('tr-TR') + suffix;

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        formatFinal(el);
      }
    };

    window.requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animate(entry.target);
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.35,
    rootMargin: '0px 0px -8% 0px',
  });

  const register = (root = document) => {
    const counters = root.matches?.('[data-counter]')
      ? [root]
      : root.querySelectorAll?.('[data-counter]') || [];

    counters.forEach((el) => {
      if (registered.has(el)) return;
      registered.add(el);
      el.setAttribute('aria-live', 'off');

      if (reduceMotion.matches) {
        formatFinal(el);
        return;
      }

      el.textContent = `0${el.dataset.suffix || ''}`;
      observer.observe(el);
    });
  };

  register();

  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) register(node);
      });
    });
  });

  mutationObserver.observe(document.body, { childList: true, subtree: true });
});
