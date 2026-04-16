export const config = { runtime: 'edge' };

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

// ── JWT helpers (Web Crypto API — Edge uyumlu) ──
async function signJWT(payload, secret) {
  const enc = new TextEncoder();
  const urlsafe = s => s.replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const header = urlsafe(btoa(JSON.stringify({alg:'HS256',typ:'JWT'})));
  const body   = urlsafe(btoa(JSON.stringify(payload)));
  const msg    = `${header}.${body}`;
  const key    = await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const sig    = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  const sigB64 = urlsafe(btoa(String.fromCharCode(...new Uint8Array(sig))));
  return `${msg}.${sigB64}`;
}

async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const msg = `${header}.${body}`;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['verify']);
    const pad = s => { const r=s.length%4; return s.replace(/-/g,'+').replace(/_/g,'/')+(r===2?'==':(r===3?'=':'')); };
    const sigBytes = Uint8Array.from(atob(pad(sig)), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(msg));
    if (!valid) return null;
    const payload = JSON.parse(atob(pad(body)));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch(e) { return null; }
}

// ── Auth: yalnızca JWT Bearer token ──
async function checkAuth(req, body, ADMIN_PW, jwtSecret) {
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const payload = await verifyJWT(authHeader.slice(7), jwtSecret);
    if (payload) return { valid: true, user: payload };
  }
  return { valid: false };
}

export default async function handler(req) {
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

  const dec = new TextDecoder();
  const decode = (b64) => JSON.parse(dec.decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), c => c.charCodeAt(0))));
  const encode = (obj) => btoa(Array.from(new TextEncoder().encode(JSON.stringify(obj, null, 2)), b => String.fromCharCode(b)).join(''));

  if (req.method === 'GET') {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'news';
    const file = FILES[type];
    if (!file) return json({ error: 'Geçersiz tip' }, 400);

    const isPublic = searchParams.has('public');

    if (!isPublic) {
      const auth = await checkAuth(req, null, ADMIN_PW, JWT_SECRET);
      if (!auth.valid) return json({ error: 'Yetkisiz erişim' }, 401);
    }

    try {
      const res = await gh(`/repos/${REPO}/contents/${file}`);
      if (res.status !== 200 || !res.data?.content) {
        return json({ error: res.data?.message || 'Dosya okunamadi' }, res.status === 404 ? 404 : 500);
      }
      const content = decode(res.data.content);
      if (isPublic) {
        const publicCors = { ...cors, 'Cache-Control': 'public, max-age=60, s-maxage=60' };
        return new Response(JSON.stringify({ data: content }), { status: 200, headers: publicCors });
      }
      return json({ data: content, sha: res.data.sha });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  if (req.method === 'POST') {
    const body = await req.json();

    // ── Giriş endpoint'i ──
    if (body.action === 'login') {
      const { username = 'admin', password } = body;
      let user = null;

      if (BIA_USERS) {
        try {
          const users = JSON.parse(BIA_USERS);
          const found = users.find(u => u.id === username || u.name === username);
          if (found && found.password === password) {
            user = { id: found.id, name: found.name, role: found.role || 'admin' };
          }
        } catch(e) {}
      }

      if (!user && password === ADMIN_PW) {
        user = { id: 'admin', name: 'Admin', role: 'admin' };
      }

      if (!user) return json({ error: 'Yanlış kullanıcı adı veya şifre' }, 401);

      const exp = Math.floor(Date.now() / 1000) + 28800; // 8 saat
      const token = await signJWT({ ...user, exp }, JWT_SECRET);
      const cookieVal = `bia_auth=${token}; Path=/yonetim; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`;
      return new Response(JSON.stringify({ ok: true, token, user, exp }), {
        status: 200,
        headers: { ...cors, 'Set-Cookie': cookieVal }
      });
    }

    // ── Diğer tüm işlemler için auth kontrolü ──
    const auth = await checkAuth(req, body, ADMIN_PW, JWT_SECRET);
    if (!auth.valid) return json({ error: 'Yanlış şifre' }, 401);

    // Görsel yükleme
    if (body.type === 'upload') {
      const { filename, content: imgBase64 } = body;
      if (!filename || !imgBase64) return json({ error: 'filename ve content gerekli' }, 400);

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
      return json({ ok: true, sha: putRes.data.content.sha });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  return new Response('Method not allowed', { status: 405 });
}
