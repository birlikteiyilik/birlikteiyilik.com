// Statik dosya sunumu: depo kökü, içerik türleri, 304, Range, temiz adresler, engel listesi, 404.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { REPO_ROOT } from '../uygulama.mjs';
import { isBlocked, normalizePathname } from '../lib/statik.mjs';
import { startTestApp } from './_yardimci.mjs';

let app;
before(async () => { app = await startTestApp({ ping: async () => true, version: 'test' }); });
after(async () => { await app.close(); });

const file = (relative) => readFileSync(path.join(REPO_ROOT, relative));

test('ana sayfa ve temiz adresler dosyaları doğrudan (200) sunar', async () => {
  const home = await app.request('/');
  assert.equal(home.status, 200);
  assert.equal(home.headers['content-type'], 'text/html; charset=utf-8');
  assert.deepEqual(home.body, file('index.html'));
  for (const [url, relative] of [['/haberler', 'haberler/index.html'], ['/yonetim/panel', 'yonetim/panel.html'],
    ['/dijitallesme/ders', 'dijitallesme/ders.html'], ['/basvuru', 'basvuru/index.html'], ['/404', '404/index.html']]) {
    const response = await app.request(url);
    assert.equal(response.status, 200, url);
    assert.deepEqual(response.body, file(relative), url);
  }
});

test('/yoklama yönlendirmesiz 200 döner ve service worker kabuğundaki her dosya sunulur', async () => {
  const sw = file('sw.js').toString();
  const shell = JSON.parse(sw.slice(sw.indexOf('[', sw.indexOf('APP_SHELL')), sw.indexOf(']', sw.indexOf('APP_SHELL')) + 1).replace(/'/g, '"'));
  assert.ok(shell.includes('/yoklama'));
  for (const url of shell) {
    const response = await app.request(url);
    assert.equal(response.status, 200, url);
    assert.equal(response.headers.location, undefined, url);
  }
  assert.equal((await app.request('/sw.js')).headers['content-type'], 'application/javascript; charset=utf-8');
});

test('cleanUrls ve trailingSlash: her biçim 308 ile temiz adrese gider, sorgu korunur', async () => {
  const cases = [
    ['/index.html', '/'], ['/index', '/'], ['/index.html?x=1', '/?x=1'],
    ['/haberler.html', '/haberler'], ['/haberler/index.html', '/haberler'], ['/haberler/index', '/haberler'],
    ['/haberler/', '/haberler'], ['/haberler/?a=1&b=2', '/haberler?a=1&b=2'], ['/haberler/index.html?a=1', '/haberler?a=1'],
    ['/haberler.html/', '/haberler'], ['/haberler/index/', '/haberler'],
    ['/yonetim/panel.html', '/yonetim/panel'], ['/dijitallesme/ders.html', '/dijitallesme/ders'],
    ['/yoklama/', '/yoklama'], ['/css/base.css/', '/css/base.css'], ['/olmayan.html', '/olmayan'],
    ['/api/bia-applications.js', '/api/bia-applications'], ['/api/bia-news.js?type=news', '/api/bia-news?type=news'],
    ['//', '/']
  ];
  for (const [from, to] of cases) {
    const response = await app.request(from);
    assert.equal(response.status, 308, from);
    assert.equal(response.headers.location, to, from);
  }
  assert.equal((await app.request('/')).status, 200, 'kök yönlendirilmez');
});

test('içerik türleri, varsayılan önbellek ve doğrulayıcılar', async () => {
  const cases = [
    ['/css/base.css', 'text/css; charset=utf-8'], ['/js/basvuru.js', 'application/javascript; charset=utf-8'],
    ['/content/news.json', 'application/json; charset=utf-8'], ['/data/turkey-locations.json', 'application/json; charset=utf-8'],
    ['/liste/manifest.webmanifest', 'application/manifest+json; charset=utf-8'], ['/images/qr/whatsapp.svg', 'image/svg+xml'],
    ['/images/app_home.png', 'image/png'], ['/ders/assets/book-cards/elif-ba-grid-v2.webp', 'image/webp'],
    ['/assets/support-journey/support-journey-final.jpg', 'image/jpeg'], ['/sitemap.xml', 'application/xml; charset=utf-8'],
    ['/robots.txt', 'text/plain; charset=utf-8'], ['/sunum/assets/fonts/alegreya-italic-latin-ext.woff2', 'font/woff2'],
    ['/mihenk/fonts/caslon.ttf', 'font/ttf'], ['/dijitallesme/dersler/akaid-01/ses/anlatim.m4a', 'audio/mp4'],
    ['/ders/assets/ahlak-mufredati/11-14/birlikte-iyilik-ahlak-egitim-programi-11-14-yas.pdf', 'application/pdf']
  ];
  for (const [url, type] of cases) {
    const response = await app.request(url, { method: 'HEAD' });
    assert.equal(response.status, 200, url);
    assert.equal(response.headers['content-type'], type, url);
    assert.equal(response.headers['accept-ranges'], 'bytes', url);
    assert.match(response.headers.etag, /^"[0-9a-z]+-[0-9a-z]+"$/, url);
    assert.ok(response.headers['last-modified'], url);
    assert.equal(Number(response.headers['content-length']), statSync(path.join(REPO_ROOT, decodeURIComponent(url))).size, url);
    assert.equal(response.body.length, 0, `${url} HEAD gövdesiz`);
  }
  assert.equal((await app.request('/robots.txt')).headers['cache-control'], 'public, max-age=0, must-revalidate');
  assert.equal((await app.request('/css/base.css')).headers['cache-control'], 'public, max-age=31536000, immutable');
});

test('If-None-Match ve If-Modified-Since ile 304 (Caddy sıkıştırma ekleri ve zayıf ETag dahil)', async () => {
  const first = await app.request('/js/basvuru.js');
  const { etag } = first.headers;
  const lastModified = first.headers['last-modified'];
  for (const value of [etag, `W/${etag}`, etag.replace(/"$/, '-gzip"'), `W/${etag.replace(/"$/, '-zstd"')}`, `"baska", ${etag}`, '*']) {
    const response = await app.request('/js/basvuru.js', { headers: { 'If-None-Match': value } });
    assert.equal(response.status, 304, value);
    assert.equal(response.body.length, 0);
    assert.equal(response.headers.etag, etag);
    assert.equal(response.headers['cache-control'], 'public, max-age=31536000, immutable', 'kural başlıkları 304\'te de var');
  }
  assert.equal((await app.request('/js/basvuru.js', { headers: { 'If-None-Match': '"baska"' } })).status, 200);
  assert.equal((await app.request('/js/basvuru.js', { headers: { 'If-Modified-Since': lastModified } })).status, 304);
  assert.equal((await app.request('/js/basvuru.js', { headers: { 'If-Modified-Since': 'Thu, 01 Jan 2004 00:00:00 GMT' } })).status, 200);
  assert.equal((await app.request('/js/basvuru.js', { headers: { 'If-None-Match': '"baska"', 'If-Modified-Since': lastModified } })).status, 200,
    'If-None-Match varsa If-Modified-Since yok sayılır');
});

test('Range: mp4 ve pdf için kısmi içerik, sonek ve açık uçlu aralık, If-Range ve 416', async () => {
  const mp4 = '/assets/support-journey/support-journey-master.mp4';
  const mp4Path = path.join(REPO_ROOT, mp4);
  const size = statSync(mp4Path).size;
  const head = await app.request(mp4, { method: 'HEAD' });
  assert.equal(head.headers['content-type'], 'video/mp4');
  const first = await app.request(mp4, { headers: { Range: 'bytes=0-1023' } });
  assert.equal(first.status, 206);
  assert.equal(first.headers['content-range'], `bytes 0-1023/${size}`);
  assert.equal(first.body.length, 1024);
  const expected = readFileSync(mp4Path).subarray(0, 1024);
  assert.deepEqual(first.body, expected);
  const tail = await app.request(mp4, { headers: { Range: 'bytes=-500' } });
  assert.equal(tail.status, 206);
  assert.equal(tail.headers['content-range'], `bytes ${size - 500}-${size - 1}/${size}`);
  assert.equal(tail.body.length, 500);
  const open = await app.request(mp4, { headers: { Range: `bytes=${size - 10}-` } });
  assert.equal(open.body.length, 10);
  const beyond = await app.request(mp4, { headers: { Range: `bytes=0-${size + 100}` } });
  assert.equal(beyond.headers['content-range'], `bytes 0-${size - 1}/${size}`);
  const unsatisfiable = await app.request(mp4, { headers: { Range: `bytes=${size}-` } });
  assert.equal(unsatisfiable.status, 416);
  assert.equal(unsatisfiable.headers['content-range'], `bytes */${size}`);
  const sameEtag = await app.request(mp4, { headers: { Range: 'bytes=0-9', 'If-Range': head.headers.etag } });
  assert.equal(sameEtag.status, 206);
  const sameDate = await app.request(mp4, { headers: { Range: 'bytes=0-9', 'If-Range': head.headers['last-modified'] } });
  assert.equal(sameDate.status, 206);
  const changed = await app.request(mp4, { method: 'HEAD', headers: { Range: 'bytes=0-9', 'If-Range': '"eski"' } });
  assert.equal(changed.status, 200, 'dosya değiştiyse tam içerik');
  assert.equal(Number(changed.headers['content-length']), size);
  const multi = await app.request(mp4, { method: 'HEAD', headers: { Range: 'bytes=0-1,5-6' } });
  assert.equal(multi.status, 200, 'birden çok aralık istenirse tam içerik');

  const pdf = '/ders/assets/ahlak-mufredati/11-14/birlikte-iyilik-ahlak-egitim-programi-11-14-yas.pdf';
  const pdfPart = await app.request(pdf, { headers: { Range: 'bytes=0-4' } });
  assert.equal(pdfPart.status, 206);
  assert.equal(pdfPart.body.toString(), '%PDF-');
});

test('engel listesi: kaynak, test, gizli, paket ve yapılandırma dosyaları 404 alır', async () => {
  const blocked = [
    '/_src/build.py', '/_src/templates/base', '/_src/dist', '/_src/dist/haberler', '/_src', '/tests/bia-applications.test.mjs', '/tests',
    '/content/applications/planning.enc.json', '/content/applications/2026-09.enc.json', '/content/applications',
    '/.hallmark/log.json', '/.hallmark', '/.git/config', '/.git/HEAD', '/.gitignore', '/.gitattributes', '/.env',
    '/BASVURU-KURULUM.md', '/yon/README.md', '/liste/README.md', '/ders/assets/book-cards/prompts.md', '/README.MD',
    '/package.json', '/package-lock.json', '/pnpm-lock.yaml', '/vercel.json', '/Vercel.json',
    '/api/_bia-store.js', '/api/bia-news.js/x', '/api/_bia-program-hours', '/api', '/api/olmayan',
    '/sunucu/server.mjs', '/sunucu/uygulama.mjs', '/sunucu', '/sunucu/ORTAM.md',
    '/yon/remotion/package.json', '/yon/remotion/src/KendiYolunda.tsx', '/yon/remotion',
    '/node_modules/pg/package.json', '/node_modules/pg/lib/index.js',
    '/%2e%2e/etc/passwd', '/css/..%2f..%2fvercel.json', '/css/%2e%2e/vercel.json', '/haberler%2findex',
    '/.%2fgit/config', '/content/news.json%00.png'
  ];
  for (const url of blocked) {
    const response = await app.request(url);
    assert.equal(response.status, 404, url);
    assert.ok(!response.body.includes('import '), `${url} kaynak kodu sızdırmamalı`);
  }
  const apiSource = await app.request('/api/bia-applications.js');
  assert.equal(apiSource.status, 308, 'işlev dosyası temiz adrese yönlenir, kaynak sunulmaz');
  for (const name of ['_src/build.py', 'content/applications/planning.enc.json', '.hallmark/log.json', 'BASVURU-KURULUM.md', 'package.json', 'vercel.json']) {
    statSync(path.join(REPO_ROOT, name)); // dosya gerçekten var; 404 engel listesinden geliyor
  }
});

test('herkese açık kalması gerekenler sunulur', async () => {
  for (const url of ['/data/turkey-locations.json', '/content/news.json', '/content/events.json', '/content/site.json',
    '/content/faq.json', '/content/homepage.json', '/content/programs.json', '/sw.js', '/robots.txt', '/sitemap.xml',
    '/js/admin-applications.js', '/yonetim', '/liste', '/sunum', '/dijitallesme', '/mihenk', '/ders', '/bagis']) {
    assert.equal((await app.request(url, { method: 'HEAD' })).status, 200, url);
  }
});

test('yol normalleştirme ve geçersiz istekler', async () => {
  assert.equal(normalizePathname('/y%6Fnetim/panel'), '/yonetim/panel');
  assert.equal(normalizePathname('/a%2fb'), '/a%2Fb');
  assert.equal(normalizePathname('/a%zz'), null);
  const encoded = await app.request('/y%6Fnetim/panel');
  assert.equal(encoded.status, 200);
  assert.equal(encoded.headers['cache-control'], 'no-store, no-cache, must-revalidate', 'kodlanmış yol kuralları atlatamaz');
  assert.equal((await app.request('/%zz')).status, 400);
  assert.equal((await app.request('/', { headers: { Host: 'bad host' } })).status, 400);
  assert.equal((await app.request('/haberler/../index.html')).status, 308, 'cleanUrls önce uygulanır');
  assert.equal((await app.request('/haberler/../sitemap.xml')).status, 404);
  assert.equal((await app.request('/haberler//index.html')).status, 308);
  assert.equal((await app.request('/css//base.css')).status, 404);
});

test('bilinmeyen yol 404 sayfasını döndürür; statik dosyada izin verilmeyen yöntem 405', async () => {
  const missing = await app.request('/boyle-bir-sayfa-yok');
  assert.equal(missing.status, 404);
  assert.equal(missing.headers['content-type'], 'text/html; charset=utf-8');
  assert.deepEqual(missing.body, file('404/index.html'));
  assert.equal((await app.request('/boyle-bir-sayfa-yok', { method: 'HEAD' })).body.length, 0);
  const post = await app.request('/robots.txt', { method: 'POST', body: 'x' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.allow, 'GET, HEAD');
  assert.equal((await app.request('/boyle-bir-sayfa-yok', { method: 'DELETE' })).status, 404);
});

test('engel listesi işlevi', () => {
  for (const blocked of ['_src/a', '.git/x', 'x/.env', 'a/b/README.md', 'content/applications', 'content/applications/x', 'yon/remotion/x',
    'x/package.json', 'vercel.json', 'API/x', 'Tests/x', 'node_modules/x', 'sunucu/x']) {
    assert.equal(isBlocked(blocked), true, blocked);
  }
  for (const open of ['index.html', 'content/news.json', 'content/applicationsx/a', 'yon/index.html', 'data/turkey-locations.json', 'apix/a', 'markdown.html']) {
    assert.equal(isBlocked(open), false, open);
  }
});

test('kökün dışına ya da engelli dosyaya giden sembolik bağlantı sunulmaz', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'site-kok-'));
  const outside = mkdtempSync(path.join(os.tmpdir(), 'site-dis-'));
  try {
    writeFileSync(path.join(outside, 'gizli.txt'), 'gizli');
    writeFileSync(path.join(dir, 'acik.txt'), 'acik');
    mkdirSync(path.join(dir, 'sunucu'));
    writeFileSync(path.join(dir, 'sunucu', 'kaynak.txt'), 'kaynak');
    symlinkSync(path.join(outside, 'gizli.txt'), path.join(dir, 'dis.txt'));
    symlinkSync(path.join(dir, 'sunucu', 'kaynak.txt'), path.join(dir, 'ic.txt'));
    symlinkSync(path.join(dir, 'acik.txt'), path.join(dir, 'kisayol.txt'));
    const local = await startTestApp({ root: dir, vercelConfig: { cleanUrls: true, trailingSlash: false }, ping: async () => true });
    try {
      assert.equal((await local.request('/acik.txt')).status, 200);
      assert.equal((await local.request('/kisayol.txt')).body.toString(), 'acik');
      assert.equal((await local.request('/dis.txt')).status, 404);
      assert.equal((await local.request('/ic.txt')).status, 404);
      const missing = await local.request('/yok');
      assert.equal(missing.status, 404);
      assert.match(missing.body.toString(), /404/);
    } finally {
      await local.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
