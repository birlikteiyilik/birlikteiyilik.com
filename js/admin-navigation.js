const sections = { news: 'haberler', events: 'etkinlikler', applications: 'basvurular',
  site: 'ayarlar', homepage: 'ana-sayfa', faq: 'sss', programs: 'programlar' };
const views = { applications: 'ogrenciler', teachers: 'hocalar', schedule: 'ders-programi', reports: 'yoklama' };
const keyOf = (map, value) => Object.keys(map).find((key) => map[key] === value);

export function parsePanelRoute(hash = '') {
  let parts;
  try { parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent); }
  catch (_) { return { section: 'news' }; }
  const section = keyOf(sections, parts[0]);
  if (!section) return { section: 'news' };
  if (section === 'applications') {
    const mode = ['yuz-yuze', 'online'].includes(parts[1]) ? parts[1] : '';
    if (!mode) return { section };
    let view = keyOf(views, parts[2]) || 'applications';
    if (mode === 'online' && view === 'schedule') view = 'applications';
    return { section, mode, view, reportView: view === 'reports' && parts[3] === 'ogrenciler' ? 'students' : 'overview' };
  }
  if (section === 'news' || section === 'events') {
    if (parts[1] === 'yeni') return { section, newItem: true };
    if (parts[1] === 'duzenle' && parts[2]) return { section, item: parts[2] };
  }
  return { section };
}

export function panelRouteHash(route) {
  const section = Object.hasOwn(sections, route?.section) ? route.section : 'news';
  const parts = [sections[section]];
  if (section === 'applications' && ['yuz-yuze', 'online'].includes(route.mode)) {
    const view = Object.hasOwn(views, route.view) && !(route.mode === 'online' && route.view === 'schedule') ? route.view : 'applications';
    parts.push(route.mode, views[view]);
    if (view === 'reports' && route.reportView === 'students') parts.push('ogrenciler');
  } else if ((section === 'news' || section === 'events') && (route.item || route.newItem)) {
    if (route.newItem) parts.push('yeni');
    else parts.push('duzenle', encodeURIComponent(route.item));
  }
  return `#${parts.join('/')}`;
}

export function createPanelNavigation(browser, render) {
  let version = 0;
  let activeHash = null;
  function update(route, replace = false) {
    const hash = panelRouteHash(route);
    activeHash = hash;
    if (browser.location.hash !== hash) browser.history[replace ? 'replaceState' : 'pushState'](null, '', hash);
    return parsePanelRoute(hash);
  }
  async function navigate(route, { replace = false } = {}) {
    const current = update(route, replace);
    const ticket = ++version;
    await render(current, () => ticket === version);
  }
  function sync(route) { update(route); version += 1; }
  function restore() {
    if (browser.location.hash === activeHash) return;
    return navigate(parsePanelRoute(browser.location.hash), { replace: true });
  }
  browser.addEventListener('popstate', restore);
  browser.addEventListener('hashchange', restore);
  return { navigate, sync, start: restore };
}

if (typeof window !== 'undefined') window.BiaPanelNavigation = { createPanelNavigation };
