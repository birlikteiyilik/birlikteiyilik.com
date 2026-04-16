/* ============================================================
   Birlikte İyilik Akademi — Main JS
   Navigation, scroll, lazy load, GA4 event tracking
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Scroll-aware nav ──
  const nav = document.querySelector('.site-nav');
  if (nav) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          nav.classList.toggle('scrolled', window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ── Mobile hamburger ──
  const hamburger = document.querySelector('.hamburger');
  const menu = document.querySelector('.nav-menu');
  if (hamburger && menu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      menu.classList.toggle('open');
      const expanded = hamburger.classList.contains('active');
      hamburger.setAttribute('aria-expanded', expanded);
    });

    // Mobile dropdown toggles
    document.querySelectorAll('.nav-item').forEach(item => {
      const link = item.querySelector('.nav-link');
      const dropdown = item.querySelector('.nav-dropdown');
      if (link && dropdown && window.innerWidth <= 1024) {
        link.addEventListener('click', (e) => {
          if (window.innerWidth <= 1024 && dropdown) {
            e.preventDefault();
            item.classList.toggle('open');
          }
        });
      }
    });
  }

  // ── FAQ Accordion ──
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      const isOpen = item.classList.contains('open');

      // Close others in same accordion
      item.closest('.accordion')?.querySelectorAll('.accordion-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.accordion-trigger')?.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Close mobile menu
        hamburger?.classList.remove('active');
        menu?.classList.remove('open');
      }
    });
  });

  // ── GA4 Event Tracking ──
  const trackEvent = (name, params = {}) => {
    if (typeof gtag === 'function') {
      gtag('event', name, params);
    }
  };

  // Track CTA clicks via data attributes
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (el) {
      trackEvent(el.dataset.track, {
        button_name: el.textContent.trim(),
        page_path: window.location.pathname,
        source_section: el.closest('section')?.id || '',
      });
    }

    // Track external links
    const link = e.target.closest('a[href^="http"]');
    if (link && !link.href.includes(window.location.hostname)) {
      trackEvent('outbound_click', {
        url: link.href,
        page_path: window.location.pathname,
      });
    }
  });

  // ── Intersection Observer for animations ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
});
