(function () {
  'use strict';

  var root = document.documentElement;
  var themeButton = document.getElementById('theme-button');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var shareButton = document.getElementById('share-button');
  var toast = document.getElementById('toast');
  var toastTimer;

  function applyTheme(theme) {
    var isDark = theme === 'dark';
    root.dataset.theme = theme;
    themeButton.setAttribute('aria-pressed', String(isDark));
    themeButton.setAttribute('aria-label', isDark ? 'Açık temaya geç' : 'Koyu temaya geç');
    themeMeta.setAttribute('content', isDark ? '#0c1726' : '#f7f2e9');
  }

  function showToast(message) {
    toast.querySelector('span').textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2400);
  }

  applyTheme(root.dataset.theme || 'light');

  themeButton.addEventListener('click', function () {
    var nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  });

  shareButton.addEventListener('click', async function () {
    var shareData = {
      title: 'Birlikte İyilik Akademi',
      text: 'Birlikte İyilik Akademi bağlantıları',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error && error.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Bağlantı kopyalandı');
    } catch (error) {
      showToast('Bağlantı: ' + window.location.href);
    }
  });

  var revealItems = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  revealItems.forEach(function (item, index) {
    item.style.setProperty('--reveal-delay', Math.min(index * 55, 220) + 'ms');
  });

  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px -24px' });

    revealItems.forEach(function (item) { observer.observe(item); });
  }

  document.querySelectorAll('a[href]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'qr_link_click', {
          link_url: link.href,
          link_label: link.textContent.trim().replace(/\s+/g, ' ').slice(0, 80)
        });
      }
    });
  });
}());
