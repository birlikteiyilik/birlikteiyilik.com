(function () {
  'use strict';

  const progress = document.getElementById('readingProgress');
  const toggle = document.getElementById('indexToggle');
  const nav = document.getElementById('indexNav');
  const links = Array.from(nav?.querySelectorAll('a') || []);
  const sections = Array.from(document.querySelectorAll('[data-section]'));

  function updateProgress() {
    if (!progress) return;
    const root = document.documentElement;
    const available = root.scrollHeight - root.clientHeight;
    const percent = available > 0 ? Math.min(100, Math.max(0, root.scrollTop / available * 100)) : 0;
    progress.style.width = `${percent}%`;
  }

  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });

  links.forEach((link) => link.addEventListener('click', () => {
    toggle?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('is-open');
  }));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sections.forEach((section) => section.classList.toggle('is-visible', section === entry.target));
      links.forEach((link) => link.classList.toggle('is-active', link.hash === `#${entry.target.id}`));
    });
  }, { rootMargin: '-18% 0px -68%', threshold: 0 });

  sections.forEach((section) => observer.observe(section));
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();
})();
