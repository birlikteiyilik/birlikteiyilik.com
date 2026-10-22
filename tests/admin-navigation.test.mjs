import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePanelRoute, panelRouteHash, createPanelNavigation, PANEL_ROUTE_STORAGE_KEY } from '../js/admin-navigation.js';

test('panel routes restore education mode, workspace tab and attendance student view', () => {
  for (const mode of ['yuz-yuze', 'online']) for (const view of ['applications', 'teachers', 'reports', ...(mode === 'yuz-yuze' ? ['schedule'] : [])]) {
    const route = { section: 'applications', mode, view, reportView: 'overview' };
    assert.deepEqual(parsePanelRoute(panelRouteHash(route)), route);
  }
  assert.deepEqual(parsePanelRoute('#basvurular/yuz-yuze/yoklama/ogrenciler'),
    { section: 'applications', mode: 'yuz-yuze', view: 'reports', reportView: 'students' });
  assert.deepEqual(parsePanelRoute('#basvurular'), { section: 'applications' });
});

test('all top-level sections and stable content editor links roundtrip', () => {
  for (const section of ['news', 'events', 'site', 'homepage', 'faq', 'programs']) {
    assert.deepEqual(parsePanelRoute(panelRouteHash({ section })), { section });
  }
  for (const section of ['news', 'events']) for (const item of ['new', 'ornek-haber', 'Türkçe başlık']) {
    assert.deepEqual(parsePanelRoute(panelRouteHash({ section, item })), { section, item });
  }
  for (const section of ['news', 'events']) {
    assert.deepEqual(parsePanelRoute(panelRouteHash({ section, newItem: true })), { section, newItem: true });
  }
});

test('invalid links fall back to safe sections and online has no face-to-face schedule', () => {
  for (const hash of ['', '#bilinmeyen', '#%zz', '#__proto__']) assert.deepEqual(parsePanelRoute(hash), { section: 'news' });
  assert.deepEqual(parsePanelRoute('#basvurular/bilinmeyen/ders-programi'), { section: 'applications' });
  assert.equal(parsePanelRoute('#basvurular/online/ders-programi').view, 'applications');
  assert.equal(panelRouteHash({ section: 'applications', mode: 'online', view: 'schedule' }), '#basvurular/online/ogrenciler');
  assert.equal(panelRouteHash({ section: '__proto__' }), '#haberler');
});

function browser(initial = '', storage = new Map()) {
  const listeners = new Map(), writes = [];
  const page = { location: { hash: initial }, history: {},
    sessionStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    addEventListener(name, callback) { listeners.set(name, callback); } };
  for (const method of ['pushState', 'replaceState']) page.history[method] = (state, title, hash) => {
    page.location.hash = hash; writes.push({ method, hash });
  };
  return { page, writes, listeners, storage };
}

test('a reload that returns to the bare panel URL restores the last location from the same tab', async () => {
  const first = browser();
  const initial = createPanelNavigation(first.page, () => {});
  await initial.start();
  initial.sync({ section: 'applications', mode: 'yuz-yuze', view: 'reports', reportView: 'students' });
  const reload = browser('', first.storage);
  const rendered = [];
  await createPanelNavigation(reload.page, (route) => rendered.push(route)).start();
  assert.deepEqual(rendered, [{ section: 'applications', mode: 'yuz-yuze', view: 'reports', reportView: 'students' }]);
  assert.equal(reload.page.location.hash, '#basvurular/yuz-yuze/yoklama/ogrenciler');
  assert.equal(reload.writes[0].method, 'replaceState');
});

test('an explicit deep link wins over a saved location, including the news home link', async () => {
  for (const hash of ['#haberler', '#basvurular/online/hocalar']) {
    const saved = new Map([[PANEL_ROUTE_STORAGE_KEY, '#basvurular/yuz-yuze/ders-programi']]);
    const { page } = browser(hash, saved);
    const rendered = [];
    await createPanelNavigation(page, (route) => rendered.push(route)).start();
    assert.deepEqual(rendered, [parsePanelRoute(hash)]);
    assert.equal(saved.get(PANEL_ROUTE_STORAGE_KEY), hash);
  }
});

test('saved navigation is tab-scoped and a cleared login session returns to the default section', async () => {
  const first = browser();
  const nav = createPanelNavigation(first.page, () => {});
  await nav.navigate({ section: 'site' });
  assert.equal(first.storage.get(PANEL_ROUTE_STORAGE_KEY), '#ayarlar');
  first.storage.clear();
  const fresh = browser('', first.storage);
  const rendered = [];
  await createPanelNavigation(fresh.page, (route) => rendered.push(route)).start();
  assert.deepEqual(rendered, [{ section: 'news' }]);
});

test('unavailable session storage does not break navigation or URL-based restoration', async () => {
  const { page } = browser('#basvurular/yuz-yuze/ders-programi');
  Object.defineProperty(page, 'sessionStorage', { get() { throw new Error('Storage disabled'); } });
  const rendered = [];
  const nav = createPanelNavigation(page, (route) => rendered.push(route));
  await nav.start();
  await nav.navigate({ section: 'site' });
  assert.equal(rendered[0].view, 'schedule');
  assert.equal(page.location.hash, '#ayarlar');
});

test('reload restores the current URL and UI changes add a single history entry', async () => {
  const { page, writes } = browser('#basvurular/yuz-yuze/ders-programi');
  const rendered = [];
  const nav = createPanelNavigation(page, (route) => rendered.push(route));
  await nav.start();
  assert.equal(rendered[0].view, 'schedule');
  assert.equal(writes.length, 0);
  nav.sync({ section: 'applications', mode: 'yuz-yuze', view: 'teachers' });
  assert.equal(writes.length, 1);
  assert.equal(writes[0].method, 'pushState');
  nav.sync({ section: 'applications', mode: 'yuz-yuze', view: 'teachers' });
  assert.equal(writes.length, 1);
});

test('back/forward restores once when both popstate and hashchange fire', async () => {
  const { page, writes, listeners } = browser('#haberler');
  const rendered = [];
  const nav = createPanelNavigation(page, (route) => rendered.push(route));
  await nav.start();
  await nav.navigate({ section: 'site' });
  page.location.hash = '#haberler';
  await listeners.get('popstate')();
  await listeners.get('hashchange')();
  assert.equal(rendered.length, 3);
  assert.equal(rendered.at(-1).section, 'news');
  assert.equal(writes.length, 1, 'history restoration never creates another history entry');
});

test('a slower previous section cannot override a newer navigation', async () => {
  const { page } = browser('#haberler');
  let release;
  const delayed = new Promise((resolve) => { release = resolve; });
  const rendered = [];
  const nav = createPanelNavigation(page, async (route, current) => {
    if (route.section === 'site') await delayed;
    if (current()) rendered.push(route.section);
  });
  const pending = nav.navigate({ section: 'site' });
  await nav.navigate({ section: 'applications' });
  release(); await pending;
  assert.deepEqual(rendered, ['applications']);
  assert.equal(page.location.hash, '#basvurular');
});
