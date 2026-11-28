// Haber/içerik API'si (api/bia-news.js): yalnızca yönetici düzenler, giriş sınırı, herkese açık
// içeriğin 60 sn bellek önbelleği. GitHub API'si taklit edilir; ağa çıkılmaz.
import test, { beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import news, { clearNewsCache } from '../../api/bia-news.js';
import { resetLoginAttempts } from '../../api/_bia-rate-limit.js';

process.env.BIA_JWT_SECRET = 'news-test-jwt-secret';
process.env.BIA_ADMIN_PASSWORD = 'news-test-admin-password';
process.env.BIA_GITHUB_TOKEN = 'test-token';
delete process.env.BIA_USERS;

const originalFetch = globalThis.fetch;
let files, calls, failGithub;

beforeEach(() => {
  clearNewsCache();
  resetLoginAttempts();
  calls = [];
  failGithub = false;
  files = new Map([['content/news.json', { sha: 'sha-1', data: [{ title: 'İlk haber', date: '2026-11-01' }] }]]);
  globalThis.fetch = async (url, options = {}) => {
    const { hostname, pathname } = new URL(url);
    assert.equal(hostname, 'api.github.com', 'yalnızca GitHub API taklidi çağrılır');
    const method = options.method || 'GET';
    calls.push(`${method} ${pathname}`);
    if (failGithub) return Response.json({ message: 'Bad credentials' }, { status: 401 });
    const path = decodeURIComponent(pathname.replace('/repos/birlikteiyilik/birlikteiyilik.com/contents/', ''));
    if (method === 'GET') {
      const file = files.get(path);
      if (!file) return Response.json({ message: 'Not Found' }, { status: 404 });
      return Response.json({ sha: file.sha, content: Buffer.from(JSON.stringify(file.data, null, 2)).toString('base64') });
    }
    const body = JSON.parse(options.body);
    const sha = `sha-${calls.length}`;
    files.set(path, { sha, data: JSON.parse(Buffer.from(body.content, 'base64').toString('utf8')) });
    return Response.json({ content: { sha } }, { status: 201 });
  };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.timers.reset();
});

async function sign(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, ...payload })).toString('base64url');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(process.env.BIA_JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${Buffer.from(signature).toString('base64url')}`;
}

const call = (method, { path = '/api/bia-news', token, body, ip } = {}) => news(new Request(`https://www.birlikteiyilik.com${path}`, {
  method,
  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  ...(body ? { body: JSON.stringify(body) } : {})
}), ip ? { clientIp: ip } : undefined);
const publicNews = () => call('GET', { path: '/api/bia-news?type=news&public=1' });
const save = (token, data = [{ title: 'Yeni haber', date: '2026-11-20' }]) =>
  call('POST', { token, body: { type: 'news', data, sha: files.get('content/news.json')?.sha } });

test('öğretmen oturumu haber düzenleyemez ve yönetici içeriğini okuyamaz', async () => {
  const teacher = await sign({ sub: 't1', role: 'teacher', name: 'Hoca' });
  assert.equal((await save(teacher)).status, 401);
  assert.equal((await call('GET', { path: '/api/bia-news?type=news', token: teacher })).status, 401);
  assert.equal((await call('POST', { token: teacher, body: { type: 'upload', filename: 'a.png', content: 'iVBORw0KGgo=' } })).status, 401);
  assert.ok(!calls.some((line) => line.startsWith('PUT')), 'GitHub\'a yazılmadı');
});

test('kayıt rehberi rolündeki, süresi dolmuş ya da süresiz oturumlar da reddedilir', async () => {
  assert.equal((await save(await sign({ role: 'directory' }))).status, 401);
  assert.equal((await save(await sign({ role: 'admin', exp: Math.floor(Date.now() / 1000) - 10 }))).status, 401);
  assert.equal((await save(await sign({ role: 'admin', exp: undefined }))).status, 401);
  assert.equal((await save('bozuk.token.degeri')).status, 401);
});

test('yönetici girişiyle alınan oturum düzenleyebilir', async () => {
  const login = await call('POST', { body: { action: 'login', username: 'admin', password: process.env.BIA_ADMIN_PASSWORD }, ip: '192.0.2.1' });
  assert.equal(login.status, 200);
  const { token } = await login.json();
  const saved = await save(token);
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).ok, true);
  assert.equal(files.get('content/news.json').data[0].title, 'Yeni haber');
  const read = await call('GET', { path: '/api/bia-news?type=news', token });
  assert.equal(read.status, 200);
  assert.ok((await read.json()).sha);
});

test('yönetim girişi IP başına sınırlanır; boş ya da tanımsız şifre kabul edilmez', async () => {
  for (let i = 0; i < 10; i += 1) {
    assert.equal((await call('POST', { body: { action: 'login', username: 'admin', password: 'yanlis' }, ip: '192.0.2.2' })).status, 401);
  }
  const blocked = await call('POST', { body: { action: 'login', username: 'admin', password: process.env.BIA_ADMIN_PASSWORD }, ip: '192.0.2.2' });
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  assert.equal((await call('POST', { body: { action: 'login', username: 'admin', password: process.env.BIA_ADMIN_PASSWORD }, ip: '192.0.2.3' })).status, 200);

  const savedPassword = process.env.BIA_ADMIN_PASSWORD;
  delete process.env.BIA_ADMIN_PASSWORD; // oturum anahtarı BIA_JWT_SECRET'tan gelir
  assert.equal((await call('POST', { body: { action: 'login', username: 'admin', password: '' }, ip: '192.0.2.4' })).status, 401);
  assert.equal((await call('POST', { body: { action: 'login', username: 'admin' }, ip: '192.0.2.4' })).status, 401);
  process.env.BIA_ADMIN_PASSWORD = savedPassword;
});

test('BIA_USERS kullanıcıları ve Türkçe adlar oturum açabilir; boş şifreli kullanıcı açamaz', async () => {
  process.env.BIA_USERS = JSON.stringify([{ id: 'editor', name: 'Gülşen Öztürk', password: 'Editor-Sifre-1' }, { id: 'bos', name: 'Boş', password: '' }]);
  try {
    const ok = await call('POST', { body: { action: 'login', username: 'editor', password: 'Editor-Sifre-1' }, ip: '192.0.2.5' });
    assert.equal(ok.status, 200);
    const body = await ok.json();
    assert.equal(body.user.name, 'Gülşen Öztürk');
    assert.equal(JSON.parse(Buffer.from(body.token.split('.')[1], 'base64url').toString('utf8')).name, 'Gülşen Öztürk');
    assert.equal((await save(body.token)).status, 200);
    assert.equal((await call('POST', { body: { action: 'login', username: 'bos', password: '' }, ip: '192.0.2.5' })).status, 401);
  } finally {
    delete process.env.BIA_USERS;
  }
});

test('herkese açık içerik 60 sn bellekte tutulur ve aynı anda gelen istekler tek GitHub çağrısı yapar', async () => {
  mock.timers.enable({ apis: ['Date'], now: Date.now() });
  const responses = await Promise.all(Array.from({ length: 5 }, () => publicNews()));
  assert.deepEqual(responses.map((r) => r.status), [200, 200, 200, 200, 200]);
  assert.equal(calls.length, 1);
  assert.equal(responses[0].headers.get('cache-control'), 'public, max-age=60, s-maxage=60');
  assert.deepEqual(await responses[0].json(), { data: [{ title: 'İlk haber', date: '2026-11-01' }] });

  files.get('content/news.json').data = [{ title: 'GitHub\'da değişti', date: '2026-11-02' }];
  mock.timers.tick(59_000);
  assert.equal((await (await publicNews()).json()).data[0].title, 'İlk haber');
  assert.equal(calls.length, 1);
  mock.timers.tick(1_001);
  assert.equal((await (await publicNews()).json()).data[0].title, 'GitHub\'da değişti');
  assert.equal(calls.length, 2);
});

test('yönetici kaydı herkese açık önbelleği hemen günceller', async () => {
  await publicNews();
  const admin = await sign({ id: 'admin', name: 'Admin', role: 'admin' });
  assert.equal((await save(admin, [{ title: 'Eski', date: '2026-01-01' }, { title: 'Taze', date: '2026-11-25' }])).status, 200);
  const callsAfterSave = calls.length;
  const fresh = await (await publicNews()).json();
  assert.deepEqual(fresh.data.map((item) => item.title), ['Taze', 'Eski'], 'haberler tarihe göre sıralı');
  assert.equal(calls.length, callsAfterSave, 'GitHub\'a yeniden sorulmadı');
});

test('GitHub hata verirse son başarılı içerik sunulur; hiç içerik yoksa ayrıntısız hata döner', async () => {
  mock.timers.enable({ apis: ['Date'], now: Date.now() });
  failGithub = true;
  const failed = await publicNews();
  assert.equal(failed.status, 500);
  assert.doesNotMatch(JSON.stringify(await failed.json()), /Bad credentials/);

  failGithub = false;
  assert.equal((await publicNews()).status, 200);
  failGithub = true;
  mock.timers.tick(61_000);
  const stale = await publicNews();
  assert.equal(stale.status, 200);
  assert.equal((await stale.json()).data[0].title, 'İlk haber');
  const callsAfterStale = calls.length;
  assert.equal((await publicNews()).status, 200);
  assert.equal(calls.length, callsAfterStale, 'hata sonrası GitHub 10 sn boyunca yeniden denenmez');
});

test('bilinmeyen tip, bozuk gövde ve desteklenmeyen yöntem', async () => {
  assert.equal((await call('GET', { path: '/api/bia-news?type=gizli&public=1' })).status, 400);
  const bad = await news(new Request('https://www.birlikteiyilik.com/api/bia-news', { method: 'POST', body: '{bozuk' }));
  assert.equal(bad.status, 400);
  const nullBody = await news(new Request('https://www.birlikteiyilik.com/api/bia-news', { method: 'POST', body: 'null' }));
  assert.equal(nullBody.status, 400);
  assert.equal((await call('DELETE')).status, 405);
});
