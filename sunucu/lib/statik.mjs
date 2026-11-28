// Depo kökünden statik dosya sunumu: yol çözümleme, engel listesi, içerik türleri,
// ETag/Last-Modified ile 304 ve Range (206) yanıtları.
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

// Vercel'in statik dosyalar için varsayılanı; vercel.json kuralları bunu ezer.
export const DEFAULT_CACHE_CONTROL = 'public, max-age=0, must-revalidate';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm',
  '.zip': 'application/zip',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

export function contentTypeFor(file) {
  return CONTENT_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

// Herkese açık olmaması gereken yollar (Vercel'de bugün sunuluyordu, sunucuda sunulmaz).
// Karşılaştırma küçük harfle yapılır; engellenen yol, varlığını belli etmemek için 404 alır.
const BLOCKED_ROOTS = new Set(['_src', 'tests', 'sunucu', 'node_modules', 'api']);
const BLOCKED_PREFIXES = ['content/applications', 'yon/remotion'];
const BLOCKED_NAMES = new Set(['package.json', 'package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock', 'vercel.json']);
const BLOCKED_EXTENSIONS = new Set(['.md']);

/** Depo köküne göre göreli yol ('/' ayraçlı) herkese kapalı mı? */
export function isBlocked(relativePath) {
  const lower = relativePath.toLowerCase();
  const segments = lower.split('/');
  if (segments.some((segment) => segment.startsWith('.'))) return true; // .git, .hallmark, .env ...
  if (BLOCKED_ROOTS.has(segments[0])) return true;
  if (BLOCKED_PREFIXES.some((prefix) => lower === prefix || lower.startsWith(`${prefix}/`))) return true;
  const name = segments[segments.length - 1];
  if (BLOCKED_NAMES.has(name)) return true;
  return BLOCKED_EXTENSIONS.has(path.extname(name));
}

/**
 * Yüzde kodlamasındaki ayrılmamış karakterleri (harf, rakam, - . _ ~) çözer; böylece
 * /y%6Fnetim ile /yonetim aynı kurallara takılır. Geçersiz kodlamada null döner.
 */
export function normalizePathname(raw) {
  if (!raw.startsWith('/')) return null;
  if (/%(?![0-9A-Fa-f]{2})/.test(raw)) return null;
  return raw.replace(/%([0-9A-Fa-f]{2})/g, (encoded, hex) => {
    const char = String.fromCharCode(parseInt(hex, 16));
    return /[A-Za-z0-9\-._~]/.test(char) ? char : encoded.toUpperCase();
  });
}

/** Yolu güvenli göreli parçalara çevirir; tehlikeli yolda null döner. */
function safeSegments(pathname) {
  if (pathname === '/') return [];
  const parts = pathname.slice(1).split('/');
  const segments = [];
  for (const part of parts) {
    let segment;
    try { segment = decodeURIComponent(part); } catch { return null; }
    if (!segment || segment === '.' || segment === '..' || /[\\/\0]/.test(segment)) return null;
    segments.push(segment);
  }
  return segments;
}

export function createStaticFiles({ root, cleanUrls }) {
  const rootDir = path.resolve(root);
  let realRootPromise = null;
  const realRoot = () => (realRootPromise ||= realpath(rootDir));

  async function fileAt(relative) {
    if (isBlocked(relative)) return null;
    const absolute = path.join(rootDir, ...relative.split('/'));
    let info;
    try { info = await stat(absolute); } catch { return null; }
    if (!info.isFile()) return null;
    // Bağlantı (symlink) kökün dışına ya da engelli bir dosyaya çıkamaz.
    const [real, base] = await Promise.all([realpath(absolute), realRoot()]);
    const realRelative = path.relative(base, real);
    if (!realRelative || realRelative.startsWith('..') || path.isAbsolute(realRelative)) return null;
    if (isBlocked(realRelative.split(path.sep).join('/'))) return null;
    return { absolute: real, relative, info };
  }

  /** İstek yoluna karşılık gelen dosya: tam ad, cleanUrls ile .html, dizin için index.html. */
  async function resolve(pathname) {
    const segments = safeSegments(pathname);
    if (!segments) return null;
    if (!segments.length) return fileAt('index.html');
    const relative = segments.join('/');
    return (await fileAt(relative)) ||
      (cleanUrls && !pathname.endsWith('/') ? await fileAt(`${relative}.html`) : null) ||
      (await fileAt(`${relative}/index.html`));
  }

  return { resolve };
}

function etagFor(info) {
  return `"${Math.floor(info.mtimeMs).toString(36)}-${info.size.toString(36)}"`;
}

// If-None-Match zayıf karşılaştırılır. Caddy sıkıştırdığı yanıtın ETag'ine -gzip/-zstd ekleyebilir;
// tarayıcı o değeri geri gönderdiğinde de 304 verilebilsin diye bu ekler yok sayılır.
function etagMatches(header, etag) {
  if (!header) return false;
  if (header.trim() === '*') return true;
  const bare = (value) => value.trim().replace(/^W\//, '').replace(/-(gzip|zstd|br)"$/, '"');
  const target = bare(etag);
  return header.split(',').some((candidate) => bare(candidate) === target);
}

function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(header).trim());
  if (!match) return null; // birden çok aralık ya da bilinmeyen birim: tam yanıt
  const [, startText, endText] = match;
  if (!startText && !endText) return null;
  let start;
  let end;
  if (!startText) {
    const suffix = Number(endText);
    if (suffix === 0) return 'unsatisfiable';
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(startText);
    end = endText ? Math.min(Number(endText), size - 1) : size - 1;
    if (endText && Number(endText) < start) return null;
  }
  if (start >= size || size === 0) return 'unsatisfiable';
  return { start, end };
}

/**
 * Dosyayı yanıtlar. `extraHeaders` (vercel.json kuralları) varsayılan Cache-Control'ü ezer.
 */
export async function sendFile(req, res, file, extraHeaders) {
  const { info } = file;
  const etag = etagFor(info);
  const lastModified = new Date(Math.floor(info.mtimeMs / 1000) * 1000).toUTCString();
  res.setHeader('Content-Type', contentTypeFor(file.absolute));
  res.setHeader('Cache-Control', DEFAULT_CACHE_CONTROL);
  res.setHeader('ETag', etag);
  res.setHeader('Last-Modified', lastModified);
  res.setHeader('Accept-Ranges', 'bytes');
  for (const [key, value] of extraHeaders) res.setHeader(key, value);

  const ifNoneMatch = req.headers['if-none-match'];
  const ifModifiedSince = req.headers['if-modified-since'];
  const notModified = ifNoneMatch
    ? etagMatches(ifNoneMatch, etag)
    : Boolean(ifModifiedSince && Date.parse(ifModifiedSince) >= Date.parse(lastModified));
  if (notModified) {
    res.removeHeader('Content-Type');
    res.statusCode = 304;
    res.end();
    return;
  }

  let range = null;
  const rangeHeader = req.headers.range;
  const ifRange = req.headers['if-range'];
  const ifRangeOk = !ifRange || (ifRange.trim().startsWith('"') ? ifRange.trim() === etag : ifRange.trim() === lastModified);
  if (rangeHeader && ifRangeOk && req.method === 'GET') range = parseRange(rangeHeader, info.size);
  if (range === 'unsatisfiable') {
    res.statusCode = 416;
    res.setHeader('Content-Range', `bytes */${info.size}`);
    res.removeHeader('Content-Type');
    res.setHeader('Content-Length', '0');
    res.end();
    return;
  }

  const start = range ? range.start : 0;
  const end = range ? range.end : info.size - 1;
  res.statusCode = range ? 206 : 200;
  if (range) res.setHeader('Content-Range', `bytes ${start}-${end}/${info.size}`);
  res.setHeader('Content-Length', String(info.size === 0 ? 0 : end - start + 1));
  if (req.method === 'HEAD' || info.size === 0) {
    res.end();
    return;
  }
  try {
    await pipeline(createReadStream(file.absolute, { start, end }), res);
  } catch (error) {
    // İstemci bağlantıyı kapattıysa (video atlatma vb.) hata sayılmaz.
    if (!['ERR_STREAM_PREMATURE_CLOSE', 'ECONNRESET', 'EPIPE'].includes(error?.code)) throw error;
  }
}
