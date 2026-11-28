import { clientIpFrom, rateLimitMessage, takeLoginAttempt } from './_bia-rate-limit.js';

const REPO = 'birlikteiyilik/birlikteiyilik.com';
const GH_API = 'https://api.github.com';
const BASE = 'content/';

const FILES = {
  news:     BASE + 'news.json',
  events:   BASE + 'events.json',
  site:     BASE + 'site.json',
  faq:      BASE + 'faq.json',
  homepage: BASE + 'homepage.json',
  programs: BASE + 'programs.json',
};
const IMAGES_PATH = 'images/uploads/';

// Herkese açık içerik (?public=1) Vercel'deki `s-maxage=60` CDN önbelleğinin karşılığı olarak
// bellekte 60 sn tutulur. GitHub geçici olarak yanıt vermezse en fazla bir günlük son başarılı
// içerik sunulmaya devam eder. Kayıttan sonra önbellek yeni içerikle hemen güncellenir.
const PUBLIC_CACHE_MS = 60_000;
const PUBLIC_STALE_MS = 24 * 60 * 60 * 1000;
const PUBLIC_RETRY_MS = 10_000;
const publicCache = new Map(); // type → { at, body, pending }
const publicGeneration = new Map(); // type → kayıt sayacı; kayıttan önce başlamış okuma önbelleği ezmesin

// ── JWT yardımcıları (Web Crypto) ──
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlFromBytes(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function bytesFromBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function signJWT(payload, secret) {
  const header = base64UrlFromBytes(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body   = base64UrlFromBytes(encoder.encode(JSON.stringify(payload)));
  const msg    = `${header}.${body}`;
  const key    = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig    = await crypto.subtle.sign('HMAC', key, encoder.encode(msg));
  return `${msg}.${base64UrlFromBytes(new Uint8Array(sig))}`;
}

async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('HMAC', key, bytesFromBase64Url(sig), encoder.encode(`${header}.${body}`));
    if (!valid) return null;
    const payload = JSON.parse(decoder.decode(bytesFromBase64Url(body)));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) { return null; }
}

// ── Yetki: yalnızca yönetici oturumu (JWT Bearer) ──
// Öğretmen (yoklama) oturumları da aynı anahtarla imzalanır; içerik düzenleyemezler.
// Yönetici tanımı bia-applications.js'teki checkAdmin ile aynıdır: yönetim girişinin verdiği
// her oturum (rolü öğretmen ya da kayıt rehberi olmayan).
async function checkAuth(req, jwtSecret) {
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const payload = await verifyJWT(authHeader.slice(7), jwtSecret);
    if (payload && payload.role !== 'teacher' && payload.role !== 'directory') return { valid: true, user: payload };
  }
  return { valid: false };
}

/**
 * @param {Request} req
 * @param {{ clientIp?: string }} [context] Sunucunun güvendiği istemci IP'si (deneme sınırı için).
 */
export default async function handler(req, context) {
  const ADMIN_PW   = process.env.BIA_ADMIN_PASSWORD || '';
  const TOKEN      = process.env.BIA_GITHUB_TOKEN || '';
  const JWT_SECRET = process.env.BIA_JWT_SECRET || ADMIN_PW;
  const BIA_USERS  = process.env.BIA_USERS || '';

  // Güvenlik: secret yoksa hiçbir işleme izin verme
  if (!JWT_SECRET) {
    return new Response(JSON.stringify({ error: 'Sunucu yapilandirma hatasi' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  // CORS: yalnızca kendi origin'lerimize izin ver
  const allowedOrigins = ['https://birlikteiyilik.com', 'https://www.birlikteiyilik.com'];
  const reqOrigin = req.headers.get('origin') || '';
  const origin = allowedOrigins.includes(reqOrigin) ? reqOrigin : null;

  const corsBase = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };
  const cors = origin
    ? { ...corsBase, 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }
    : corsBase;

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const gh = async (path, method = 'GET', data = null) => {
    const r = await fetch(`${GH_API}${path}`, {
      method,
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'BIA-Admin/1.0',
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    const body = await r.json();
    return { status: r.status, data: body };
  };

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: cors });

  const decode = (b64) => JSON.parse(decoder.decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), c => c.charCodeAt(0))));
  const encode = (obj) => btoa(Array.from(encoder.encode(JSON.stringify(obj, null, 2)), b => String.fromCharCode(b)).join(''));

  const publicResponse = (body) =>
    new Response(body, { status: 200, headers: { ...cors, 'Cache-Control': 'public, max-age=60, s-maxage=60' } });

  // Aynı anda gelen istekler tek GitHub çağrısını paylaşır.
  const publicContent = (type, file) => {
    const now = Date.now();
    const entry = publicCache.get(type);
    if (entry?.body && now - entry.at < PUBLIC_CACHE_MS) return Promise.resolve(entry.body);
    if (entry?.pending) return entry.pending;
    const generation = publicGeneration.get(type) || 0;
    const pending = (async () => {
      const res = await gh(`/repos/${REPO}/contents/${file}`);
      if (res.status !== 200 || !res.data?.content) {
        const error = new Error(`GitHub ${res.status}`);
        error.status = res.status === 404 ? 404 : 500;
        throw error;
      }
      return JSON.stringify({ data: decode(res.data.content) });
    })().then((body) => {
      if ((publicGeneration.get(type) || 0) !== generation) return body; // arada kayıt yapıldı
      publicCache.set(type, { at: Date.now(), body });
      return body;
    }, (error) => {
      if ((publicGeneration.get(type) || 0) !== generation) throw error;
      if (entry?.body && now - entry.at < PUBLIC_STALE_MS) {
        // Son başarılı içerik sunulur; GitHub 10 sn sonra yeniden denenir.
        publicCache.set(type, { at: Date.now() - PUBLIC_CACHE_MS + PUBLIC_RETRY_MS, body: entry.body });
        console.error(`[bia-news] ${type} herkese açık içerik yenilenemedi, önceki içerik sunuluyor: ${String(error?.message || error).slice(0, 200)}`);
        return entry.body;
      }
      publicCache.delete(type);
      throw error;
    });
    publicCache.set(type, { ...entry, pending });
    return pending;
  };

  if (req.method === 'GET') {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'news';
    const file = FILES[type];
    if (!file) return json({ error: 'Geçersiz tip' }, 400);

    const isPublic = searchParams.has('public');

    if (isPublic) {
      try {
        return publicResponse(await publicContent(type, file));
      } catch (e) {
        console.error(`[bia-news] ${type} herkese açık içerik okunamadı: ${String(e?.message || e).slice(0, 200)}`);
        return json({ error: e?.status === 404 ? 'Dosya bulunamadi' : 'Icerik su anda yuklenemedi' }, e?.status === 404 ? 404 : 500);
      }
    }

    const auth = await checkAuth(req, JWT_SECRET);
    if (!auth.valid) return json({ error: 'Yetkisiz erişim' }, 401);

    try {
      const res = await gh(`/repos/${REPO}/contents/${file}`);
      if (res.status !== 200 || !res.data?.content) {
        return json({ error: res.data?.message || 'Dosya okunamadi' }, res.status === 404 ? 404 : 500);
      }
      const content = decode(res.data.content);
      return json({ data: content, sha: res.data.sha });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch (_) { return json({ error: 'İstek biçimi geçersiz' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'İstek biçimi geçersiz' }, 400);

    // ── Giriş endpoint'i (IP başına deneme sınırıyla) ──
    if (body.action === 'login') {
      const attempt = takeLoginAttempt('yonetim', clientIpFrom(context));
      if (!attempt.ok) {
        return new Response(JSON.stringify({ error: rateLimitMessage(attempt.retryAfter) }), {
          status: 429, headers: { ...cors, 'Retry-After': String(attempt.retryAfter) }
        });
      }
      const { username = 'admin', password } = body;
      let user = null;

      // Boş şifre hiçbir zaman kabul edilmez (ör. BIA_ADMIN_PASSWORD tanımlanmamışsa).
      if (typeof password === 'string' && password) {
        if (BIA_USERS) {
          try {
            const users = JSON.parse(BIA_USERS);
            const found = users.find(u => u.id === username || u.name === username);
            if (found && typeof found.password === 'string' && found.password && found.password === password) {
              user = { id: found.id, name: found.name, role: found.role || 'admin' };
            }
          } catch(e) {}
        }

        if (!user && ADMIN_PW && password === ADMIN_PW) {
          user = { id: 'admin', name: 'Admin', role: 'admin' };
        }
      }

      if (!user) return json({ error: 'Yanlış kullanıcı adı veya şifre' }, 401);
      attempt.refund();

      const exp = Math.floor(Date.now() / 1000) + 28800; // 8 saat
      const token = await signJWT({ ...user, exp }, JWT_SECRET);
      const cookieVal = `bia_auth=${token}; Path=/yonetim; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`;
      return new Response(JSON.stringify({ ok: true, token, user, exp }), {
        status: 200,
        headers: { ...cors, 'Set-Cookie': cookieVal }
      });
    }

    // ── Diğer tüm işlemler için yönetici oturumu gerekir ──
    const auth = await checkAuth(req, JWT_SECRET);
    if (!auth.valid) return json({ error: 'Yanlış şifre' }, 401);

    // Görsel yükleme
    if (body.type === 'upload') {
      const { filename, content: imgBase64 } = body;
      if (typeof filename !== 'string' || typeof imgBase64 !== 'string' || !filename || !imgBase64) return json({ error: 'filename ve content gerekli' }, 400);

      // Server-side MIME doğrulaması (magic bytes)
      const ALLOWED_MAGIC = { '/9j/': 'jpg', 'iVBOR': 'png', 'R0lGO': 'gif', 'UklGR': 'webp' };
      const prefix = imgBase64.substring(0, 5);
      if (!Object.keys(ALLOWED_MAGIC).some(m => prefix.startsWith(m))) {
        return json({ error: 'Yalnizca JPEG, PNG, GIF ve WebP yuklenebilir' }, 400);
      }

      // Dosya adı güvenliği: çift uzantı ve tehlikeli uzantıları engelle
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.(html|htm|svg|js|php)$/i, '.blocked');
      const filePath = IMAGES_PATH + safeName;
      let existingSha = '';
      try {
        const existing = await gh(`/repos/${REPO}/contents/${filePath}`);
        if (existing.data?.sha) existingSha = existing.data.sha;
      } catch(_) {}
      const upRes = await gh(`/repos/${REPO}/contents/${filePath}`, 'PUT', {
        message: `BIA: görsel yüklendi — ${safeName}`,
        content: imgBase64,
        ...(existingSha ? { sha: existingSha } : {}),
      });
      if (!upRes.data?.content) {
        return json({ error: upRes.data?.message || 'Gorsel yuklenemedi' }, 500);
      }
      const rawUrl = `https://raw.githubusercontent.com/${REPO}/main/${filePath}`;
      return json({ ok: true, url: rawUrl, path: filePath });
    }

    const type = body.type || 'news';
    const file = FILES[type];
    if (!file) return json({ error: 'Geçersiz tip' }, 400);
    try {
      let payload = body.data;
      if ((type === 'news' || type === 'events') && Array.isArray(payload)) {
        payload = payload.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      }
      const content = encode(payload);
      const msg = body.message || `BIA: ${type} güncellendi`;

      // İlk deneme
      let putRes = await gh(`/repos/${REPO}/contents/${file}`, 'PUT', {
        message: msg, content, sha: body.sha || '',
      });

      // SHA conflict veya hata → güncel sha ile tekrar dene
      if (putRes.status === 409 || putRes.status === 422 || !putRes.data?.content?.sha) {
        const current = await gh(`/repos/${REPO}/contents/${file}`);
        const freshSha = current.data?.sha || '';
        putRes = await gh(`/repos/${REPO}/contents/${file}`, 'PUT', {
          message: msg, content, sha: freshSha,
        });
      }

      if (!putRes.data?.content?.sha) {
        return json({ error: putRes.data?.message || 'GitHub kayit hatasi' }, 500);
      }
      // Ziyaretçiler yeni içeriği 60 sn beklemeden görsün.
      publicGeneration.set(type, (publicGeneration.get(type) || 0) + 1);
      if (payload === undefined) publicCache.delete(type);
      else publicCache.set(type, { at: Date.now(), body: JSON.stringify({ data: payload }) });
      return json({ ok: true, sha: putRes.data.content.sha });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  return new Response('Method not allowed', { status: 405 });
}

/** Testler için. */
export function clearNewsCache() {
  publicCache.clear();
  publicGeneration.clear();
}
