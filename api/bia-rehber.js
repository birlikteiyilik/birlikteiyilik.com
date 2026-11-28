// Sistem rehberi API'si (/yonetim/rehber). Yalnızca yönetici oturumuyla çalışır.
//
// Depo herkese açık olduğu için rehberin içeriği depoda değil, veritabanında durur:
//   rehber.json         → [ { bolumler, sablon } ]    düz metin, yalnızca yöneticiye döner
//   rehber-kasa.json    → [ { v, kdf, iterations, salt, iv, data } ]  tarayıcıda şifrelenmiş kasa
//   rehber-gecmis.json  → önceki rehber sürümleri (son 15)
//   rehber-kasa-gecmis.json → önceki kasa sürümleri (son 15, hepsi şifreli)
// Kasa, yönetim şifresinden ayrı bir kasa şifresiyle tarayıcıda açılır. Sunucu kasa şifresini ve
// kasanın içeriğini hiçbir zaman görmez; yalnızca biçimini ve boyutunu denetler.
//
//   GET  /api/bia-rehber                                   → rehber, kasa, sürümler, geçmiş özeti
//   GET  /api/bia-rehber?gecmis=rehber|kasa&sira=N         → geçmişteki N. sürümün içeriği
//   POST { action: 'rehber-kaydet', rehber, surum }        → { ok, surum }
//   POST { action: 'kasa-kaydet', kasa, surum }            → { ok, surum }
import { loadArchive, saveArchive, storeConfigured } from './_bia-store.js';

export const REHBER_ARSIVI = 'rehber.json';
export const KASA_ARSIVI = 'rehber-kasa.json';
export const REHBER_GECMISI = 'rehber-gecmis.json';
export const KASA_GECMISI = 'rehber-kasa-gecmis.json';
const GECMIS_SINIRI = 15;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

class IstekHatasi extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function bytesFromBase64Url(value) {
  const base64 = String(value).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(Buffer.from(base64 + '='.repeat((4 - (base64.length % 4)) % 4), 'base64'));
}

// bia-news.js ile aynı imza (HS256, BIA_JWT_SECRET). Yönetici: rolü öğretmen ya da kayıt rehberi
// olmayan her yönetim oturumu (bia-applications.js checkAdmin ile aynı tanım).
async function yonetici(req) {
  const secret = process.env.BIA_JWT_SECRET || process.env.BIA_ADMIN_PASSWORD || '';
  const header = req.headers.get('authorization') || '';
  if (!secret || !header.startsWith('Bearer ')) return null;
  try {
    const [h, body, sig] = header.slice(7).split('.');
    if (!h || !body || !sig) return null;
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!await crypto.subtle.verify('HMAC', key, bytesFromBase64Url(sig), encoder.encode(`${h}.${body}`))) return null;
    const payload = JSON.parse(decoder.decode(bytesFromBase64Url(body)));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.role === 'teacher' || payload.role === 'directory') return null;
    return payload;
  } catch {
    return null;
  }
}

function yanit(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}

function metin(value, max, alan, { bos = true } = {}) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') throw new IstekHatasi(`${alan} metin olmalı.`);
  if (!bos && !value.trim()) throw new IstekHatasi(`${alan} boş olamaz.`);
  if (value.length > max) throw new IstekHatasi(`${alan} en fazla ${max} karakter olabilir.`);
  return value;
}

/** Rehber belgesini denetler ve yalnızca bilinen alanları bırakır. */
export function rehberiDenetle(rehber) {
  if (!rehber || typeof rehber !== 'object' || Array.isArray(rehber)) throw new IstekHatasi('Rehber biçimi geçersiz.');
  const bolumler = Array.isArray(rehber.bolumler) ? rehber.bolumler : null;
  if (!bolumler || !bolumler.length || bolumler.length > 40) throw new IstekHatasi('Rehberde 1-40 bölüm olmalı.');
  const kimlikler = new Set();
  const temiz = bolumler.map((bolum, i) => {
    if (!bolum || typeof bolum !== 'object') throw new IstekHatasi(`${i + 1}. bölüm geçersiz.`);
    const id = metin(bolum.id, 60, 'Bölüm kimliği', { bos: false });
    if (!/^[a-z0-9-]+$/.test(id) || kimlikler.has(id)) throw new IstekHatasi(`Bölüm kimliği geçersiz ya da tekrar ediyor: ${id}`);
    kimlikler.add(id);
    return {
      id,
      baslik: metin(bolum.baslik, 120, 'Bölüm başlığı', { bos: false }).trim(),
      ikon: metin(bolum.ikon, 8, 'Bölüm simgesi'),
      metin: metin(bolum.metin, 40000, 'Bölüm metni')
    };
  });
  const sablon = Array.isArray(rehber.sablon) ? rehber.sablon.slice(0, 100).map((kayit, i) => {
    if (!kayit || typeof kayit !== 'object') throw new IstekHatasi(`${i + 1}. hesap şablonu geçersiz.`);
    return {
      hizmet: metin(kayit.hizmet, 120, 'Hizmet', { bos: false }),
      amac: metin(kayit.amac, 300, 'Amaç'),
      adres: metin(kayit.adres, 500, 'Adres'),
      kullanici: metin(kayit.kullanici, 200, 'Kullanıcı'),
      not: metin(kayit.not, 2000, 'Not')
    };
  }) : [];
  const sonuc = { bolumler: temiz, sablon };
  if (Buffer.byteLength(JSON.stringify(sonuc)) > 400 * 1024) throw new IstekHatasi('Rehber çok büyük (en fazla 400 KB).', 413);
  return sonuc;
}

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
function base64Alan(value, alan, enAz, enCok) {
  if (typeof value !== 'string' || !BASE64.test(value)) throw new IstekHatasi(`Kasa alanı geçersiz: ${alan}`);
  const uzunluk = Buffer.from(value, 'base64').length;
  if (uzunluk < enAz || uzunluk > enCok) throw new IstekHatasi(`Kasa alanı geçersiz: ${alan}`);
  return value;
}

/** Şifreli kasa zarfını denetler (içeriği sunucu çözemez, yalnızca biçim ve boyut). */
export function kasayiDenetle(kasa) {
  if (!kasa || typeof kasa !== 'object' || Array.isArray(kasa)) throw new IstekHatasi('Kasa biçimi geçersiz.');
  if (kasa.v !== 1 || kasa.kdf !== 'PBKDF2-SHA256') throw new IstekHatasi('Kasa sürümü desteklenmiyor.');
  const iterations = Number(kasa.iterations);
  if (!Number.isInteger(iterations) || iterations < 200000 || iterations > 5000000) throw new IstekHatasi('Kasa ayarı geçersiz: iterations');
  return {
    v: 1,
    kdf: 'PBKDF2-SHA256',
    iterations,
    salt: base64Alan(kasa.salt, 'salt', 16, 64),
    iv: base64Alan(kasa.iv, 'iv', 12, 12),
    data: base64Alan(kasa.data, 'data', 17, 512 * 1024)
  };
}

function kimin(user) {
  return String(user?.name || user?.id || 'Yönetici').slice(0, 80);
}

async function gecmiseEkle(arsiv, kayit) {
  // Geçmiş en iyi çabayla tutulur: eşzamanlı bir yazma kazanırsa bir kez yeniden denenir.
  for (let deneme = 0; deneme < 2; deneme += 1) {
    const mevcut = await loadArchive(arsiv);
    const yeni = [kayit, ...mevcut.records].slice(0, GECMIS_SINIRI);
    if (await saveArchive(arsiv, yeni, mevcut.version) !== null) return;
  }
}

async function kaydet(arsiv, gecmisArsivi, deger, surum, user) {
  const mevcut = await loadArchive(arsiv);
  if (Number(surum || 0) !== mevcut.version) {
    throw new IstekHatasi('Bu arada başka biri değiştirmiş. Sayfayı yenileyip değişikliklerinizi yeniden yapın.', 409);
  }
  const kayit = { ...deger, guncellendi: new Date().toISOString(), guncelleyen: kimin(user) };
  const yeniSurum = await saveArchive(arsiv, [kayit], mevcut.version);
  if (yeniSurum === null) throw new IstekHatasi('Bu arada başka biri değiştirmiş. Sayfayı yenileyip yeniden deneyin.', 409);
  if (mevcut.records[0]) {
    await gecmiseEkle(gecmisArsivi, { ...mevcut.records[0], surum: mevcut.version })
      .catch((error) => console.error(`[bia-rehber] geçmiş yazılamadı: ${String(error?.message || error).slice(0, 200)}`));
  }
  return yeniSurum;
}

function ozet(kayitlar) {
  return kayitlar.map((kayit, sira) => ({ sira, surum: kayit.surum ?? null, guncellendi: kayit.guncellendi || null, guncelleyen: kayit.guncelleyen || null }));
}

/**
 * @param {Request} req
 */
export default async function handler(req) {
  if (!['GET', 'POST'].includes(req.method)) return yanit({ error: 'Yalnızca GET ve POST.' }, 405);
  const user = await yonetici(req);
  if (!user) return yanit({ error: 'Yönetici oturumu gerekli. Yönetim paneline yeniden giriş yapın.' }, 401);
  if (!storeConfigured()) return yanit({ error: 'Veri deposu ayarlı değil.' }, 503);
  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const tur = url.searchParams.get('gecmis');
      if (tur) {
        if (!['rehber', 'kasa'].includes(tur)) throw new IstekHatasi('Geçmiş türü geçersiz.');
        const sira = Number(url.searchParams.get('sira'));
        const gecmis = await loadArchive(tur === 'rehber' ? REHBER_GECMISI : KASA_GECMISI);
        const kayit = Number.isInteger(sira) ? gecmis.records[sira] : undefined;
        if (!kayit) throw new IstekHatasi('Bu sürüm bulunamadı.', 404);
        return yanit({ kayit });
      }
      const [rehber, kasa, rehberGecmisi, kasaGecmisi] = await Promise.all([
        loadArchive(REHBER_ARSIVI), loadArchive(KASA_ARSIVI), loadArchive(REHBER_GECMISI), loadArchive(KASA_GECMISI)
      ]);
      return yanit({
        rehber: rehber.records[0] || null,
        rehberSurum: rehber.version,
        kasa: kasa.records[0] || null,
        kasaSurum: kasa.version,
        gecmis: { rehber: ozet(rehberGecmisi.records), kasa: ozet(kasaGecmisi.records) },
        kullanici: kimin(user)
      });
    }

    let body;
    try { body = await req.json(); } catch { throw new IstekHatasi('İstek biçimi geçersiz.'); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new IstekHatasi('İstek biçimi geçersiz.');
    if (body.action === 'rehber-kaydet') {
      const surum = await kaydet(REHBER_ARSIVI, REHBER_GECMISI, rehberiDenetle(body.rehber), body.surum, user);
      return yanit({ ok: true, surum });
    }
    if (body.action === 'kasa-kaydet') {
      const surum = await kaydet(KASA_ARSIVI, KASA_GECMISI, kasayiDenetle(body.kasa), body.surum, user);
      return yanit({ ok: true, surum });
    }
    throw new IstekHatasi('Bilinmeyen işlem.');
  } catch (error) {
    if (error instanceof IstekHatasi) return yanit({ error: error.message }, error.status);
    console.error(`[bia-rehber] ${String(error?.message || error).replace(/\s+/g, ' ').slice(0, 300)}`);
    return yanit({ error: 'Rehber şu anda yüklenemedi. Biraz sonra yeniden deneyin.' }, 503);
  }
}
