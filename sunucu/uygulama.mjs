// Ana site uygulaması: statik dosyalar + vercel.json kuralları + iki API işlevi + sağlık kontrolü.
// Giriş noktası sunucu/server.mjs'tir; testler createSiteApp ile uygulamayı rastgele bir portta kurar.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import applicationsHandler from '../api/bia-applications.js';
import newsHandler from '../api/bia-news.js';
import { closeStore, ensureArchiveSchema, pingStore } from '../api/_bia-store.js';
import { compileVercelConfig, matchHeaders, matchRedirect, withQuery } from './lib/vercel.mjs';
import { DEFAULT_CACHE_CONTROL, createStaticFiles, normalizePathname, sendFile } from './lib/statik.mjs';

export const APP_NAME = 'site';
export const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

const MB = 1024 * 1024;
// Gövde sınırları: JSON için 1 MB (sözleşme varsayılanı). Haber paneli görselleri base64 JSON
// olarak gelir; panel en fazla 5 MB dosya kabul eder → base64 ~6,7 MB + JSON zarfı → 8 MB.
export const API_ROUTES = {
  '/api/bia-applications': { handler: applicationsHandler, bodyLimit: 1 * MB },
  '/api/bia-news': { handler: newsHandler, bodyLimit: 8 * MB }
};
// cleanUrls: Vercel işlevlerinde de uzantı kaldırılır (/api/bia-news.js → 308 /api/bia-news).
const API_EXTENSION = /^\/api\/(bia-applications|bia-news)\.js$/;

const HOP_BY_HOP = new Set(['connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'proxy-connection', 'te', 'trailer', 'content-length']);
const HEALTH_PATH = '/__saglik';
const HOST_PATTERN = /^(?:[A-Za-z0-9.-]+|\[[0-9A-Fa-f:.]+\])(?::\d{1,5})?$/;

function oneLine(value) {
  return String(value ?? '').replace(/\s+/g, ' ').slice(0, 500);
}

export function logError(context, error) {
  console.error(`[site] ${context}: ${oneLine(error?.stack?.split('\n')[0] || error?.message || error)}`);
}

function isLoopback(address) {
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

/** Caddy'nin eklediği X-Forwarded-For'a yalnızca bağlantı yerelden geliyorsa güvenilir (ilk adres). */
export function clientIpOf(req) {
  const remote = req.socket?.remoteAddress || '';
  const forwarded = req.headers['x-forwarded-for'];
  if (isLoopback(remote) && typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim().slice(0, 64);
  }
  return remote;
}

function sendPlain(res, status, body, headers = {}) {
  res.statusCode = status;
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  if (!res.hasHeader('Content-Type')) res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Length', String(Buffer.byteLength(body)));
  res.end(res.req?.method === 'HEAD' ? undefined : body);
}

function sendJson(res, status, data, headers = {}) {
  sendPlain(res, status, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8', ...headers });
}

class BodyTooLarge extends Error {}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length']);
    if (Number.isFinite(declared) && declared > limit) { reject(new BodyTooLarge()); return; }
    const chunks = [];
    let size = 0;
    let done = false;
    req.on('data', (chunk) => {
      if (done) return;
      size += chunk.length;
      if (size > limit) { done = true; req.pause(); reject(new BodyTooLarge()); return; }
      chunks.push(chunk);
    });
    req.on('end', () => { if (!done) { done = true; resolve(Buffer.concat(chunks)); } });
    req.on('error', (error) => { if (!done) { done = true; reject(error); } });
    req.on('aborted', () => { if (!done) { done = true; reject(new Error('istek yarıda kesildi')); } });
  });
}

/**
 * @param {object} [options]
 * @param {string} [options.root] Statik kök (varsayılan: depo kökü).
 * @param {object} [options.vercelConfig] vercel.json içeriği (varsayılan: kökteki dosya).
 * @param {object} [options.routes] API yolları (testler için).
 * @param {() => Promise<unknown>} [options.ping] Sağlık kontrolü sorgusu.
 * @param {string|null} [options.version] Sürüm (SURUM).
 */
export async function createSiteApp(options = {}) {
  const root = path.resolve(options.root || REPO_ROOT);
  const config = options.vercelConfig || JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
  const rules = compileVercelConfig(config);
  const routes = options.routes || API_ROUTES;
  const ping = options.ping || pingStore;
  const version = options.version === undefined ? (process.env.SURUM || null) : options.version;
  const files = createStaticFiles({ root, cleanUrls: rules.cleanUrls });
  let notFoundPage = null;
  try { notFoundPage = await readFile(path.join(root, '404', 'index.html')); } catch { notFoundPage = null; }

  async function health(req, res) {
    const body = { ok: true, uygulama: APP_NAME, surum: version };
    let timer;
    try {
      await Promise.race([ping(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('zaman aşımı')), 3000); })]);
      sendJson(res, 200, body, { 'Cache-Control': 'no-store' });
    } catch (error) {
      logError('sağlık kontrolü veritabanına ulaşamadı', error);
      sendJson(res, 503, { ...body, ok: false, hata: 'veritabani' }, { 'Cache-Control': 'no-store' });
    } finally {
      clearTimeout(timer);
    }
  }

  function notFound(req, res, headers) {
    res.statusCode = 404;
    res.setHeader('Content-Type', notFoundPage ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', DEFAULT_CACHE_CONTROL);
    for (const [key, value] of headers) res.setHeader(key, value);
    const body = notFoundPage || Buffer.from('404 - Sayfa bulunamadı');
    res.setHeader('Content-Length', String(body.length));
    res.end(req.method === 'HEAD' ? undefined : body);
  }

  async function api(req, res, route, url, headers) {
    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        body = await readBody(req, route.bodyLimit);
      } catch (error) {
        if (error instanceof BodyTooLarge) {
          sendJson(res, 413, { error: 'İstek gövdesi çok büyük.' }, { Connection: 'close' });
          return;
        }
        throw error;
      }
    }
    const requestHeaders = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (HOP_BY_HOP.has(key) || value === undefined) continue;
      if (Array.isArray(value)) value.forEach((item) => requestHeaders.append(key, item));
      else requestHeaders.set(key, value);
    }
    const request = new Request(url, { method: req.method, headers: requestHeaders, ...(body !== undefined ? { body } : {}) });
    let response;
    try {
      response = await route.handler(request, { clientIp: clientIpOf(req) });
    } catch (error) {
      logError(`${url.pathname} işleyicisi hata verdi`, error);
      response = Response.json({ error: 'Sunucu hatası.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
    res.statusCode = response.status;
    for (const [key, value] of response.headers) {
      if (key === 'set-cookie') continue;
      res.setHeader(key, value);
    }
    const cookies = response.headers.getSetCookie();
    if (cookies.length) res.setHeader('Set-Cookie', cookies);
    // vercel.json başlıkları API yanıtlarına da eklenir; işlevin kendi başlıkları önceliklidir.
    for (const [key, value] of headers) if (!res.hasHeader(key)) res.setHeader(key, value);
    const payload = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Length', String(payload.length));
    res.end(req.method === 'HEAD' ? undefined : payload);
  }

  async function handle(req, res) {
    const rawUrl = req.url || '';
    const host = req.headers.host || '';
    if (!rawUrl.startsWith('/') || !HOST_PATTERN.test(host)) {
      sendPlain(res, 400, 'Geçersiz istek');
      return;
    }
    const queryIndex = rawUrl.indexOf('?');
    const rawPath = queryIndex >= 0 ? rawUrl.slice(0, queryIndex) : rawUrl;
    const rawQuery = queryIndex >= 0 ? rawUrl.slice(queryIndex + 1) : '';
    const pathname = normalizePathname(rawPath);
    if (!pathname) {
      sendPlain(res, 400, 'Geçersiz istek');
      return;
    }

    // Sağlık kontrolünü yalnızca yayın betiği doğrudan porta sorar. Caddy üzerinden gelen
    // (X-Forwarded-For taşıyan) istekler için bu yol yoktur: dışarıya açılmaz.
    if (pathname === HEALTH_PATH && !req.headers['x-forwarded-for'] && (req.method === 'GET' || req.method === 'HEAD')) {
      await health(req, res);
      return;
    }

    const apiExtension = API_EXTENSION.exec(pathname);
    const redirect = apiExtension
      ? { status: 308, location: `/api/${apiExtension[1]}` }
      : matchRedirect(rules, pathname);
    if (redirect) {
      res.statusCode = redirect.status;
      res.setHeader('Location', withQuery(redirect.location, rawQuery));
      res.setHeader('Content-Length', '0');
      res.end();
      return;
    }

    const headers = matchHeaders(rules, pathname);
    const route = Object.hasOwn(routes, pathname) ? routes[pathname] : null;
    if (route) {
      await api(req, res, route, new URL(`https://${host}${rawUrl}`), headers);
      return;
    }

    const file = await files.resolve(pathname);
    if (file && (req.method === 'GET' || req.method === 'HEAD')) {
      await sendFile(req, res, file, headers);
      return;
    }
    if (file) {
      sendPlain(res, 405, 'İzin verilmeyen yöntem', { Allow: 'GET, HEAD' });
      return;
    }
    notFound(req, res, headers);
  }

  const server = http.createServer((req, res) => {
    handle(req, res).catch((error) => {
      logError(`istek işlenemedi (${req.method} ${oneLine(req.url).slice(0, 200)})`, error);
      if (!res.headersSent) sendJson(res, 500, { error: 'Sunucu hatası.' }, { 'Cache-Control': 'no-store' });
      else res.destroy();
    });
  });
  // Caddy bağlantıları yeniden kullanır (boşta 2 dk). Node bağlantıyı Caddy'den önce kapatırsa
  // yarış durumunda 502 olur; bu yüzden boşta bekleme süresi Caddy'ninkinden uzun tutulur.
  server.keepAliveTimeout = 125_000;
  server.headersTimeout = 60_000;
  server.requestTimeout = 120_000;

  return { server, rules, root };
}

/**
 * Sunucuyu başlatır; SIGTERM/SIGINT'te yeni bağlantı almayı keser, açık istekleri bitirir,
 * veritabanı havuzunu kapatır ve en geç 10 sn'de çıkar.
 */
export async function startSite({ port, host = '127.0.0.1', ...options } = {}) {
  const app = await createSiteApp(options);
  await new Promise((resolve, reject) => {
    app.server.once('error', reject);
    app.server.listen(port, host, () => { app.server.off('error', reject); resolve(); });
  });
  // Tabloyu açılışta hazırla; veritabanı henüz hazır değilse ilk istekte yeniden denenir.
  ensureArchiveSchema().catch((error) => logError('veritabanı şeması hazırlanamadı (ilk istekte yeniden denenecek)', error));

  let closing = null;
  app.shutdown = (exit = true) => {
    if (closing) return closing;
    closing = new Promise((resolve) => {
      const force = setTimeout(() => {
        logError('kapanış', new Error('açık istekler 9 sn içinde bitmedi, bağlantılar kapatılıyor'));
        app.server.closeAllConnections();
      }, 9_000);
      force.unref();
      app.server.close(async () => {
        clearTimeout(force);
        try { await closeStore(); } catch (error) { logError('veritabanı havuzu kapatılamadı', error); }
        resolve();
        if (exit) process.exit(0);
      });
      app.server.closeIdleConnections();
    });
    return closing;
  };
  return app;
}
