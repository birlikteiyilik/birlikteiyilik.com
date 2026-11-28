// Sağlık kontrolü, API yönlendirmesi, Request/Response uyarlayıcısı, gövde sınırı ve istemci IP'si.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { API_ROUTES } from '../uygulama.mjs';
import { resetLoginAttempts } from '../../api/_bia-rate-limit.js';
import { createTestStore } from '../../tests/_pglite-store.mjs';
import { startTestApp } from './_yardimci.mjs';

process.env.BIA_JWT_SECRET = 'api-test-jwt-secret';
process.env.BIA_LISTE_PASSWORD = 'api-test-directory-password';
process.env.BIA_GITHUB_TOKEN = 'test-token';

let store;
let realApp;
let stubApp;
let seen = [];
const logs = [];
const originalConsoleError = console.error;

before(async () => {
  store = await createTestStore();
  await store.reset({ 'planning.enc.json': [{ kind: 'program-hours', id: 'program-hours:yuz-yuze', applicationType: 'yuz-yuze', slots: ['16:00-16:20'], revision: 3 }] });
  realApp = await startTestApp({ ping: async () => true, version: 'abc1234' });
  const echo = async (request, context) => {
    const body = request.method === 'GET' || request.method === 'HEAD' ? '' : await request.text();
    seen.push({ method: request.method, url: request.url, headers: Object.fromEntries(request.headers), bodyLength: body.length, context });
    if (body === 'patla') throw new Error('işleyici içinde beklenmeyen hata');
    const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'X-Ozel': 'evet' });
    headers.append('Set-Cookie', 'a=1; Path=/');
    headers.append('Set-Cookie', 'b=2; Path=/');
    return new Response(JSON.stringify({ ok: true }), { status: 201, headers });
  };
  stubApp = await startTestApp({
    ping: async () => true,
    routes: {
      '/api/bia-applications': { handler: echo, bodyLimit: API_ROUTES['/api/bia-applications'].bodyLimit },
      '/api/bia-news': { handler: echo, bodyLimit: API_ROUTES['/api/bia-news'].bodyLimit }
    }
  });
  console.error = (...args) => logs.push(args.join(' '));
});
after(async () => {
  console.error = originalConsoleError;
  await realApp.close();
  await stubApp.close();
  await store.close();
});

test('sağlık kontrolü: veritabanı yanıt veriyorsa 200 ve sürüm', async () => {
  const response = await realApp.request('/__saglik', { headers: { Host: '127.0.0.1:3001' } });
  assert.equal(response.status, 200);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.deepEqual(JSON.parse(response.body), { ok: true, uygulama: 'site', surum: 'abc1234' });
  const head = await realApp.request('/__saglik', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.body.length, 0);
});

test('sağlık kontrolü: veritabanı hatasında ya da 3 sn yanıt gelmezse 503', async () => {
  const failing = await startTestApp({ ping: async () => { throw Object.assign(new Error('connect ENOENT /var/run/postgresql/.s.PGSQL.5432'), { code: 'ENOENT' }); }, version: null });
  const hanging = await startTestApp({ ping: () => new Promise(() => {}), version: null });
  try {
    const response = await failing.request('/__saglik');
    assert.equal(response.status, 503);
    assert.deepEqual(JSON.parse(response.body), { ok: false, uygulama: 'site', surum: null, hata: 'veritabani' });
    assert.ok(logs.some((line) => line.includes('sağlık kontrolü') && line.includes('ENOENT')));
    const started = Date.now();
    assert.equal((await hanging.request('/__saglik')).status, 503);
    assert.ok(Date.now() - started < 5000);
  } finally {
    await failing.close();
    await hanging.close();
  }
});

test('sağlık kontrolü yalnızca doğrudan yerel isteğe açıktır; Caddy üzerinden gelen istek 404 alır', async () => {
  const response = await realApp.request('/__saglik', { headers: { 'X-Forwarded-For': '203.0.113.5' } });
  assert.equal(response.status, 404);
  assert.equal((await realApp.request('/__saglik', { method: 'POST' })).status, 404);
});

test('API yolları gerçek işleyicilere gider (başvurular: PostgreSQL, haberler: GitHub\'a çıkmadan)', async () => {
  const hours = await realApp.request('/api/bia-applications?action=program-hours');
  assert.equal(hours.status, 200);
  assert.deepEqual(JSON.parse(hours.body), { ok: true, slots: ['16:00-16:20'], revision: 3 });
  const news = await realApp.request('/api/bia-news?type=gizli&public=1');
  assert.equal(news.status, 400);
  assert.deepEqual(JSON.parse(news.body), { error: 'Geçersiz tip' });
  const preflight = await realApp.request('/api/bia-applications', { method: 'OPTIONS', headers: { Origin: 'https://www.birlikteiyilik.com' } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers['access-control-allow-origin'], 'https://www.birlikteiyilik.com');
  const unauthorized = await realApp.request('/api/bia-applications', { headers: { Origin: 'https://www.birlikteiyilik.com' } });
  assert.equal(unauthorized.status, 401);
});

test('istemci IP: X-Forwarded-For\'daki ilk adres deneme sınırına ulaşır', async () => {
  resetLoginAttempts();
  const login = (ip, password) => realApp.request('/api/bia-applications', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `${ip}, 10.0.0.1` },
    body: JSON.stringify({ action: 'directory-login', password })
  });
  for (let i = 0; i < 10; i += 1) assert.equal((await login('203.0.113.10', 'yanlis-sifre')).status, 401);
  const blocked = await login('203.0.113.10', process.env.BIA_LISTE_PASSWORD);
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers['retry-after']) > 0);
  assert.equal((await login('203.0.113.11', process.env.BIA_LISTE_PASSWORD)).status, 200, 'başka istemci etkilenmez');
  assert.equal((await login('10.0.0.1', process.env.BIA_LISTE_PASSWORD)).status, 200, 'yalnızca ilk adres istemcidir');
});

test('uyarlayıcı: adres Host\'tan kurulur, gövde ve başlıklar iletilir, birden çok Set-Cookie korunur', async () => {
  seen = [];
  const response = await stubApp.request('/api/bia-news?type=news&public=1&x=%C3%A7', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer t', 'X-Forwarded-For': '198.51.100.20', Connection: 'keep-alive' },
    body: JSON.stringify({ a: 'ç' })
  });
  assert.equal(response.status, 201);
  assert.equal(response.headers['x-ozel'], 'evet');
  assert.deepEqual(response.headers['set-cookie'], ['a=1; Path=/', 'b=2; Path=/']);
  assert.equal(response.headers['x-frame-options'], 'SAMEORIGIN');
  const [call] = seen;
  assert.equal(call.method, 'POST');
  assert.equal(call.url, 'https://www.birlikteiyilik.com/api/bia-news?type=news&public=1&x=%C3%A7');
  assert.equal(call.headers.authorization, 'Bearer t');
  assert.equal(call.headers.connection, undefined);
  assert.equal(call.bodyLength, JSON.stringify({ a: 'ç' }).length);
  assert.deepEqual(call.context, { clientIp: '198.51.100.20' });
  await stubApp.request('/api/bia-applications');
  assert.equal(seen[1].context.clientIp, '127.0.0.1', 'X-Forwarded-For yoksa bağlantı adresi');
});

test('uyarlayıcı: işleyici hata fırlatırsa ayrıntısız 500 döner ve tek satır günlüğe yazılır', async () => {
  const response = await stubApp.request('/api/bia-applications', { method: 'POST', body: 'patla' });
  assert.equal(response.status, 500);
  assert.deepEqual(JSON.parse(response.body), { error: 'Sunucu hatası.' });
  const line = logs.find((item) => item.includes('işleyici içinde beklenmeyen hata'));
  assert.ok(line);
  assert.ok(!line.includes('\n'));
});

test('gövde sınırı: başvurular 1 MB, haberler 8 MB (5 MB görselin base64 hâli geçer)', async () => {
  const MB = 1024 * 1024;
  assert.equal(API_ROUTES['/api/bia-applications'].bodyLimit, MB);
  assert.equal(API_ROUTES['/api/bia-news'].bodyLimit, 8 * MB);
  seen = [];
  assert.equal((await stubApp.request('/api/bia-applications', { method: 'POST', body: 'x'.repeat(MB) })).status, 201);
  const tooLarge = await stubApp.request('/api/bia-applications', { method: 'POST', body: 'x'.repeat(MB + 1) });
  assert.equal(tooLarge.status, 413);
  assert.deepEqual(JSON.parse(tooLarge.body), { error: 'İstek gövdesi çok büyük.' });
  // Content-Length bildirmeden (parça parça) gönderilen büyük gövde de durdurulur.
  const chunked = await stubApp.request('/api/bia-applications', { method: 'POST', headers: { 'Transfer-Encoding': 'chunked' }, body: 'y'.repeat(MB + 10) });
  assert.equal(chunked.status, 413);
  const upload = JSON.stringify({ type: 'upload', filename: 'foto.jpg', content: Buffer.alloc(5 * MB, 7).toString('base64') });
  assert.ok(upload.length > 6.6 * MB);
  assert.equal((await stubApp.request('/api/bia-news', { method: 'POST', body: upload })).status, 201);
  assert.equal((await stubApp.request('/api/bia-news', { method: 'POST', body: 'z'.repeat(8 * MB + 1) })).status, 413);
  assert.equal(seen.length, 2, 'sınırı aşan istekler işleyiciye ulaşmaz');
});
