// vercel.json derleyicisi Vercel'in kendi dönüşümüyle aynı düzenli ifadeleri üretmeli.
//
// Beklenen değerler @vercel/routing-utils 6.6.1 getTransformedRoutes(vercel.json) çıktısıdır.
// vercel.json değişirse bu tabloyu yeniden üretin (geçici bir klasörde):
//   npm i @vercel/routing-utils@6.6.1 && node -e 'const {getTransformedRoutes:g}=require("@vercel/routing-utils");
//   for (const r of g(require("/yol/vercel.json")).routes) console.log(JSON.stringify(r))'
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compileVercelConfig, fillTemplate, matchHeaders, matchRedirect, sourceToRegex, withQuery } from '../lib/vercel.mjs';

const config = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
const rules = compileVercelConfig(config);
const plain = (src) => src.replace(/\\\//g, '/'); // "\/" ile "/" düzenli ifadede aynı anlamdadır

const VERCEL_ROUTES = [
  { src: '^/(?:(.+)/)?index(?:\\.html)?/?$', status: 308, loc: '/$1' },
  { src: '^/(.*)\\.html/?$', status: 308, loc: '/$1' },
  { src: '^/(.*)/$', status: 308, loc: '/$1' },
  { src: '^/ders/assets/ahlak-mufredati/7-10/ahlak-egitim-programi-7-10-yas\\.pdf$', status: 308, loc: '/ders/assets/ahlak-mufredati/7-10/birlikte-iyilik-ahlak-egitim-programi-7-10-yas.pdf' },
  { src: '^/ders/assets/ahlak-mufredati/11-14/ahlak-egitim-programi-11-14-yas\\.pdf$', status: 308, loc: '/ders/assets/ahlak-mufredati/11-14/birlikte-iyilik-ahlak-egitim-programi-11-14-yas.pdf' },
  // has: host www.birlikteiyilik.com — sunucuda atlanır (Caddy apex → www yapar)
  { src: '^/basvurular/online-egitim$', status: 308, loc: '/basvurular/online' },
  { src: '^/basvurular/yuz-yuze-egitim$', status: 308, loc: '/basvuru' },
  { src: '^/iletisim$', status: 308, loc: '/#iletisim' },
  { src: '^/uygulama$', status: 308, loc: '/#uygulama' },
  { src: '^/yazilar$', status: 308, loc: '/#icerik' },
  { src: '^/etki$', status: 308, loc: '/#etki' }
];
const VERCEL_WWW_ROUTE = { src: '^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?$', loc: 'https://birlikteiyilik.com/$1' };
const VERCEL_HEADER_ROUTES = [
  ['/liste/(.*)', '^/liste(?:/(.*))$', ['X-Robots-Tag', 'Cache-Control']],
  ['/liste', '^/liste$', ['X-Robots-Tag', 'Cache-Control']],
  ['/dijitallesme', '^/dijitallesme$', ['X-Robots-Tag']],
  ['/dijitallesme/(.*)', '^/dijitallesme(?:/(.*))$', ['X-Robots-Tag']],
  ['/sunum', '^/sunum$', ['X-Robots-Tag']],
  ['/sunum/(.*)', '^/sunum(?:/(.*))$', ['X-Robots-Tag']],
  ['/yonetim/(.*)', '^/yonetim(?:/(.*))$', ['X-Robots-Tag', 'Cache-Control']],
  ['/(.*)', '^(?:/(.*))$', ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Strict-Transport-Security', 'Content-Security-Policy', 'Permissions-Policy']],
  ['/css/(.*)', '^/css(?:/(.*))$', ['Cache-Control']],
  ['/js/(.*)', '^/js(?:/(.*))$', ['Cache-Control']],
  ['/images/(.*)', '^/images(?:/(.*))$', ['Cache-Control']]
];

test('vercel.json Vercel tablosuyla aynı kurallara sahip (değişirse tablo yeniden üretilmeli)', () => {
  assert.deepEqual(config.redirects.map((rule) => rule.source).filter((source) => source !== '/:path*'),
    VERCEL_ROUTES.slice(3).map((route) => route.src.replace(/^\^|\$$/g, '').replace(/\\\./g, '.')));
  assert.deepEqual(config.headers.map((rule) => rule.source), VERCEL_HEADER_ROUTES.map(([source]) => source));
  assert.equal(config.redirects.length, 9);
  assert.equal(config.headers.length, 11);
});

test('yönlendirme rotaları Vercel ile aynı sırada, aynı düzenli ifade, durum ve hedefle derlenir', () => {
  assert.deepEqual(rules.redirects.map((rule) => ({ src: plain(rule.regex.source), status: rule.status, loc: rule.location })), VERCEL_ROUTES);
});

test('başlık rotaları Vercel ile aynı sırada ve aynı düzenli ifadeyle derlenir', () => {
  assert.deepEqual(rules.headers.map((rule) => [rule.source, rule.src, rule.headers.map(([key]) => key)]), VERCEL_HEADER_ROUTES);
});

test('www → apex kuralı atlanır ve nedeni kayıtlıdır; dönüştürücü yine de Vercel ile aynı ifadeyi üretir', () => {
  assert.equal(rules.skipped.length, 1);
  assert.deepEqual(rules.skipped[0].rule.has, [{ type: 'host', value: 'www.birlikteiyilik.com' }]);
  assert.match(rules.skipped[0].reason, /Caddy/);
  assert.equal(sourceToRegex('/:path*').src, VERCEL_WWW_ROUTE.src);
  assert.equal(matchRedirect(rules, '/haberler'), null, 'www isteği apex\'e yönlendirilmez');
  // Atlanmasaydı hedef aynı biçimde üretilirdi:
  const compiled = compileVercelConfig({ redirects: [{ source: '/eski/:path*', destination: '/yeni/:path*', permanent: false }] });
  assert.equal(compiled.redirects[0].location, '/yeni/$1');
  assert.deepEqual(matchRedirect(compiled, '/eski/a/b'), { status: 307, location: '/yeni/a/b', rule: compiled.redirects[0] });
});

test('kaynak dönüştürücü path-to-regexp 6.1.0 davranışını izler', () => {
  assert.equal(sourceToRegex('/a/:id').src, '^/a(?:/([^/]+?))$');
  assert.equal(sourceToRegex('/a/:id?').src, '^/a(?:/([^/]+?))?$');
  assert.equal(sourceToRegex('/a/:rest+').src, '^/a(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))$');
  assert.equal(sourceToRegex('/f.:ext').src, '^/f(?:\\.([^/]+?))$');
  assert.equal(sourceToRegex('/a/(\\d+)').src, '^/a(?:/(\\d+))$');
  assert.deepEqual(sourceToRegex('/x/:a/(.*)').segments, ['a', null]);
  for (const bad of ['/a+b', '/a/{b}', '/a/((x))', '/a/(?x)', 'no-slash', '/a/:']) {
    assert.throws(() => sourceToRegex(bad), /vercel\.json/, bad);
  }
});

test('desteklenmeyen ayar ya da koşul açılışta hata verir', () => {
  assert.throws(() => compileVercelConfig({ rewrites: [] }), /rewrites/);
  assert.throws(() => compileVercelConfig({ headers: [{ source: '/a', has: [{ type: 'query', key: 'x' }], headers: [] }] }), /has\/missing/);
  assert.throws(() => compileVercelConfig({ redirects: [{ source: '/a', destination: '/b', missing: [{ type: 'cookie', key: 'x' }] }] }), /has\/missing/);
});

test('başlıklar birleşir; aynı başlıkta sonraki kural kazanır', () => {
  const headers = new Map(matchHeaders(rules, '/yonetim/panel'));
  assert.equal(headers.get('X-Robots-Tag'), 'noindex, nofollow');
  assert.equal(headers.get('Cache-Control'), 'no-store, no-cache, must-revalidate');
  assert.equal(headers.get('X-Frame-Options'), 'SAMEORIGIN');
  const merged = compileVercelConfig({ headers: [
    { source: '/(.*)', headers: [{ key: 'Cache-Control', value: 'a' }, { key: 'X-A', value: '1' }] },
    { source: '/x/(.*)', headers: [{ key: 'cache-control', value: 'b' }] }
  ] });
  assert.deepEqual(matchHeaders(merged, '/x/y'), [['cache-control', 'b'], ['X-A', '1']]);
  assert.deepEqual(matchHeaders(merged, '/z'), [['Cache-Control', 'a'], ['X-A', '1']]);
  assert.deepEqual(matchHeaders(rules, '/yonetim').map(([key]) => key).includes('Cache-Control'), false,
    'Vercel\'deki gibi /yonetim/(.*) kuralı /yonetim adresinin kendisine uymaz');
});

test('yönlendirmede sorgu dizesi korunur', () => {
  assert.equal(withQuery('/x', ''), '/x');
  assert.equal(withQuery('/x', 'a=1&b=2'), '/x?a=1&b=2');
  assert.equal(withQuery('/#iletisim', 'utm=1'), '/?utm=1#iletisim');
  assert.equal(withQuery('/x?a=1', 'a=2&b=3'), '/x?a=1&b=3');
  assert.equal(fillTemplate('/$1/$2', ['', 'a']), '/a/');
});
