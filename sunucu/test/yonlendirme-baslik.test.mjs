// vercel.json yönlendirmeleri ve başlık kuralları HTTP düzeyinde: Vercel ile aynı durum kodu,
// hedef ve birleşen başlıklar. www → apex kuralı uygulanmaz (Caddy apex → www yapar).
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { startTestApp } from './_yardimci.mjs';

const config = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
const SECURITY = Object.fromEntries(config.headers.find((rule) => rule.source === '/(.*)').headers.map(({ key, value }) => [key.toLowerCase(), value]));
const NOINDEX_NOSTORE = { 'x-robots-tag': 'noindex, nofollow, noarchive', 'cache-control': 'no-store, no-cache, must-revalidate' };
const IMMUTABLE = 'public, max-age=31536000, immutable';

let app;
before(async () => {
  app = await startTestApp({
    ping: async () => true,
    routes: {
      '/api/bia-applications': { bodyLimit: 1024, handler: async () => Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store, max-age=0' } }) },
      '/api/bia-news': { bodyLimit: 1024, handler: async () => Response.json({ ok: true }) }
    }
  });
});
after(async () => { await app.close(); });

function assertHeaders(response, expected, label) {
  for (const [key, value] of Object.entries(expected)) assert.equal(response.headers[key], value, `${label}: ${key}`);
}

test('vercel.json\'daki 8 yönlendirme aynı durum kodu ve hedefle çalışır; sorgu korunur', async () => {
  const cases = [
    ['/ders/assets/ahlak-mufredati/7-10/ahlak-egitim-programi-7-10-yas.pdf', '/ders/assets/ahlak-mufredati/7-10/birlikte-iyilik-ahlak-egitim-programi-7-10-yas.pdf'],
    ['/ders/assets/ahlak-mufredati/11-14/ahlak-egitim-programi-11-14-yas.pdf', '/ders/assets/ahlak-mufredati/11-14/birlikte-iyilik-ahlak-egitim-programi-11-14-yas.pdf'],
    ['/basvurular/online-egitim', '/basvurular/online'],
    ['/basvurular/yuz-yuze-egitim', '/basvuru'],
    ['/iletisim', '/#iletisim'],
    ['/uygulama', '/#uygulama'],
    ['/yazilar', '/#icerik'],
    ['/etki', '/#etki']
  ];
  assert.equal(cases.length, config.redirects.length - 1, 'www kuralı dışındaki her yönlendirme denenir');
  for (const [from, to] of cases) {
    const response = await app.request(from);
    assert.equal(response.status, 308, from);
    assert.equal(response.headers.location, to, from);
    assert.equal(response.body.length, 0);
    const withQuery = await app.request(`${from}?utm_source=x`);
    assert.equal(withQuery.headers.location, to.includes('#') ? to.replace('#', '?utm_source=x#') : `${to}?utm_source=x`);
    assert.equal((await app.request(`${from}/`)).headers.location, from, 'sondaki eğik çizgi önce kaldırılır');
    assert.equal((await app.request(from, { method: 'POST', body: '{}' })).status, 308, 'yönlendirme yöntemden bağımsızdır');
  }
  // Yönlendirme hedefleri gerçekten var (eski PDF bağlantıları kırılmasın).
  for (const target of cases.slice(0, 4).map(([, to]) => to)) assert.equal((await app.request(target, { method: 'HEAD' })).status, 200, target);
});

test('www.birlikteiyilik.com isteği apex\'e yönlendirilmez (döngü olmaz); apex Host da sayfayı alır', async () => {
  for (const host of ['www.birlikteiyilik.com', 'birlikteiyilik.com', '127.0.0.1:3001']) {
    const response = await app.request('/haberler', { headers: { Host: host } });
    assert.equal(response.status, 200, host);
    assert.equal(response.headers.location, undefined, host);
  }
});

test('Vercel\'deki gibi yönlendirme yanıtları vercel.json başlıklarını taşımaz', async () => {
  const response = await app.request('/iletisim');
  assert.equal(response.headers['x-frame-options'], undefined);
  assert.equal(response.headers['content-security-policy'], undefined);
});

test('11 başlık kuralının her biri uygulanır ve eşleşen kurallar birleşir', async () => {
  const cases = [
    ['/liste', { ...NOINDEX_NOSTORE, ...SECURITY }],                           // /liste
    ['/liste/manifest.webmanifest', { ...NOINDEX_NOSTORE, ...SECURITY }],      // /liste/(.*)
    ['/dijitallesme', { 'x-robots-tag': 'noindex, nofollow', 'cache-control': 'public, max-age=0, must-revalidate', ...SECURITY }],
    ['/dijitallesme/ders', { 'x-robots-tag': 'noindex, nofollow', ...SECURITY }],
    ['/sunum', { 'x-robots-tag': 'noindex, nofollow', ...SECURITY }],
    ['/sunum/css/sunum.css', { 'x-robots-tag': 'noindex, nofollow', ...SECURITY }],
    ['/yonetim/panel', { 'x-robots-tag': 'noindex, nofollow', 'cache-control': 'no-store, no-cache, must-revalidate', ...SECURITY }],
    ['/', { 'cache-control': 'public, max-age=0, must-revalidate', ...SECURITY }],                   // /(.*)
    ['/css/base.css', { 'cache-control': IMMUTABLE, ...SECURITY }],
    ['/js/basvuru.js', { 'cache-control': IMMUTABLE, ...SECURITY }],
    ['/images/qr/whatsapp.svg', { 'cache-control': IMMUTABLE, ...SECURITY }]
  ];
  for (const [url, expected] of cases) {
    const response = await app.request(url, { method: 'HEAD' });
    assert.equal(response.status, 200, url);
    assertHeaders(response, expected, url);
  }
  assert.equal((await app.request('/haberler', { method: 'HEAD' })).headers['x-robots-tag'], undefined);
  assert.equal((await app.request('/sunumlar-yok', { method: 'HEAD' })).headers['x-robots-tag'], undefined, '/sunum kuralı önek değildir');
});

test('Vercel düzenli ifadesi gereği /yonetim adresinin kendisi /yonetim/(.*) kuralını almaz', async () => {
  const response = await app.request('/yonetim', { method: 'HEAD' });
  assert.equal(response.status, 200);
  assert.equal(response.headers['x-robots-tag'], undefined);
  assert.equal(response.headers['cache-control'], 'public, max-age=0, must-revalidate');
  assertHeaders(response, SECURITY, '/yonetim');
});

test('başlık kuralları API ve 404 yanıtlarına da eklenir; işlevin kendi başlıkları korunur', async () => {
  const api = await app.request('/api/bia-applications');
  assert.equal(api.status, 200);
  assertHeaders(api, SECURITY, 'api');
  assert.equal(api.headers['cache-control'], 'no-store, max-age=0', 'işlevin Cache-Control\'ü ezilmez');
  const missing = await app.request('/yonetim/olmayan-sayfa');
  assert.equal(missing.status, 404);
  assertHeaders(missing, { 'x-robots-tag': 'noindex, nofollow', 'cache-control': 'no-store, no-cache, must-revalidate', ...SECURITY }, '404');
  const blocked = await app.request('/package.json');
  assert.equal(blocked.status, 404);
  assertHeaders(blocked, SECURITY, 'engelli');
});
