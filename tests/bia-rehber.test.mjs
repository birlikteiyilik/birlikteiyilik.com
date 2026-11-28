import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import handler, { KASA_ARSIVI, KASA_GECMISI, REHBER_ARSIVI, REHBER_GECMISI } from '../api/bia-rehber.js';
import { createTestStore } from './_pglite-store.mjs';

// Sistem rehberi API'si: yalnızca yönetici okur ve yazar; kasa sunucuda yalnızca şifreli durur.
// Gerçek işleyici, bellekte gerçek PostgreSQL (PGlite). Ağa çıkılmaz.
process.env.BIA_JWT_SECRET = 'rehber-test-jwt-secret';
let store;

before(async () => { store = await createTestStore(); });
after(async () => { await store.close(); });
beforeEach(async () => { await store.reset(); });

async function token(role = 'admin', { exp = Math.floor(Date.now() / 1000) + 3600, secret = process.env.BIA_JWT_SECRET } = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ name: 'Test yönetici', role, exp })).toString('base64url');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${payload}`));
  return `${header}.${payload}.${Buffer.from(signature).toString('base64url')}`;
}

async function istek({ method = 'GET', body, sorgu = '', yetki } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (yetki !== null) headers.Authorization = `Bearer ${yetki || await token()}`;
  const response = await handler(new Request(`https://www.birlikteiyilik.com/api/bia-rehber${sorgu}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body)
  }));
  return { status: response.status, headers: response.headers, body: await response.json() };
}

const rehber = (metin = 'Başvurular yönetim panelinden takip edilir.') => ({
  bolumler: [{ id: 'baslarken', baslik: 'Başlarken', ikon: '👋', metin }],
  sablon: [{ hizmet: 'Hostinger', amac: 'Sunucu', adres: 'https://hpanel.hostinger.com', kullanici: '', not: '' }]
});

function kasa(ek = {}) {
  return {
    v: 1, kdf: 'PBKDF2-SHA256', iterations: 600000,
    salt: Buffer.alloc(16, 1).toString('base64'), iv: Buffer.alloc(12, 2).toString('base64'),
    data: Buffer.alloc(64, 3).toString('base64'), ...ek
  };
}

test('oturum olmadan, öğretmen ya da rehber oturumuyla, süresi geçmiş ya da yanlış imzalı anahtarla erişilemez', async () => {
  await store.reset({ [REHBER_ARSIVI]: [rehber()] });
  assert.equal((await istek({ yetki: null })).status, 401);
  assert.equal((await istek({ yetki: await token('teacher') })).status, 401);
  assert.equal((await istek({ yetki: await token('directory') })).status, 401);
  assert.equal((await istek({ yetki: await token('admin', { exp: 10 }) })).status, 401);
  assert.equal((await istek({ yetki: await token('admin', { secret: 'baska-anahtar' }) })).status, 401);
  const yazma = await istek({ method: 'POST', yetki: await token('teacher'), body: { action: 'rehber-kaydet', rehber: rehber(), surum: 1 } });
  assert.equal(yazma.status, 401);
  assert.deepEqual((await store.row(REHBER_ARSIVI)).data, [rehber()], 'öğretmen yazamaz');
});

test('yönetici rehberi, kasayı ve geçmiş özetini okur; yanıt önbelleğe alınmaz', async () => {
  const yanit = await istek();
  assert.equal(yanit.status, 200);
  assert.equal(yanit.headers.get('cache-control'), 'no-store');
  assert.equal(yanit.body.rehber, null);
  assert.equal(yanit.body.kasa, null);
  assert.deepEqual(yanit.body.gecmis, { rehber: [], kasa: [] });
  assert.equal(yanit.body.kullanici, 'Test yönetici');
});

test('rehber kaydedilir, eski sürüm geçmişe geçer ve geçmişten okunabilir', async () => {
  let r = await istek({ method: 'POST', body: { action: 'rehber-kaydet', rehber: rehber('ilk'), surum: 0 } });
  assert.equal(r.status, 200);
  assert.equal(r.body.surum, 1);
  r = await istek({ method: 'POST', body: { action: 'rehber-kaydet', rehber: rehber('ikinci'), surum: 1 } });
  assert.equal(r.body.surum, 2);

  const okunan = await istek();
  assert.equal(okunan.body.rehber.bolumler[0].metin, 'ikinci');
  assert.equal(okunan.body.rehber.guncelleyen, 'Test yönetici');
  assert.ok(okunan.body.rehber.guncellendi);
  assert.equal(okunan.body.rehberSurum, 2);
  assert.equal(okunan.body.gecmis.rehber.length, 1);
  assert.equal(okunan.body.gecmis.rehber[0].surum, 1);

  const eski = await istek({ sorgu: '?gecmis=rehber&sira=0' });
  assert.equal(eski.body.kayit.bolumler[0].metin, 'ilk');
  assert.equal((await istek({ sorgu: '?gecmis=rehber&sira=5' })).status, 404);
  assert.equal((await istek({ sorgu: '?gecmis=baska&sira=0' })).status, 400);
});

test('eski sürüm üzerinden kaydetmek reddedilir (iki yönetici aynı anda düzenlerse)', async () => {
  await istek({ method: 'POST', body: { action: 'rehber-kaydet', rehber: rehber('ilk'), surum: 0 } });
  const r = await istek({ method: 'POST', body: { action: 'rehber-kaydet', rehber: rehber('çakışan'), surum: 0 } });
  assert.equal(r.status, 409);
  assert.equal((await store.row(REHBER_ARSIVI)).data[0].bolumler[0].metin, 'ilk');
});

test('rehber biçimi denetlenir: bilinmeyen alanlar atılır, hatalı bölüm reddedilir', async () => {
  const fazlasi = { ...rehber(), gizli: 'x', bolumler: [{ ...rehber().bolumler[0], fazla: 1 }] };
  let r = await istek({ method: 'POST', body: { action: 'rehber-kaydet', rehber: fazlasi, surum: 0 } });
  assert.equal(r.status, 200);
  const kayit = (await store.row(REHBER_ARSIVI)).data[0];
  assert.equal(kayit.gizli, undefined);
  assert.equal(kayit.bolumler[0].fazla, undefined);

  for (const bozuk of [
    { bolumler: [] },
    { bolumler: [{ id: 'Büyük Harf', baslik: 'x', metin: '' }] },
    { bolumler: [{ id: 'a', baslik: 'x', metin: '' }, { id: 'a', baslik: 'y', metin: '' }] },
    { bolumler: [{ id: 'a', baslik: '', metin: '' }] },
    { bolumler: [{ id: 'a', baslik: 'x', metin: 'x'.repeat(40001) }] }
  ]) {
    r = await istek({ method: 'POST', body: { action: 'rehber-kaydet', rehber: bozuk, surum: 1 } });
    assert.equal(r.status, 400, JSON.stringify(bozuk).slice(0, 80));
  }
});

test('kasa yalnızca şifreli zarf olarak saklanır; biçimi ve boyutu denetlenir', async () => {
  let r = await istek({ method: 'POST', body: { action: 'kasa-kaydet', kasa: kasa(), surum: 0 } });
  assert.equal(r.status, 200);
  const satir = (await store.row(KASA_ARSIVI)).data[0];
  assert.deepEqual(Object.keys(satir).sort(), ['data', 'guncellendi', 'guncelleyen', 'iterations', 'iv', 'kdf', 'salt', 'v']);

  for (const bozuk of [
    kasa({ v: 2 }), kasa({ kdf: 'MD5' }), kasa({ iterations: 1000 }), kasa({ iv: Buffer.alloc(8).toString('base64') }),
    kasa({ salt: 'düz metin değil base64' }), kasa({ data: '' }), { ...kasa(), data: undefined }
  ]) {
    r = await istek({ method: 'POST', body: { action: 'kasa-kaydet', kasa: bozuk, surum: 1 } });
    assert.equal(r.status, 400, JSON.stringify(bozuk).slice(0, 80));
  }
  r = await istek({ method: 'POST', body: { action: 'kasa-kaydet', kasa: kasa({ data: Buffer.alloc(600 * 1024).toString('base64') }), surum: 1 } });
  assert.equal(r.status, 400, 'çok büyük kasa');

  r = await istek({ method: 'POST', body: { action: 'kasa-kaydet', kasa: kasa({ iv: Buffer.alloc(12, 9).toString('base64') }), surum: 1 } });
  assert.equal(r.body.surum, 2);
  assert.equal((await store.row(KASA_GECMISI)).data.length, 1, 'önceki kasa geçmişte durur');
});

test('geçmiş en fazla 15 sürüm tutar', async () => {
  for (let i = 0; i < 18; i += 1) {
    const r = await istek({ method: 'POST', body: { action: 'rehber-kaydet', rehber: rehber(`sürüm ${i}`), surum: i } });
    assert.equal(r.status, 200);
  }
  const gecmis = (await store.row(REHBER_GECMISI)).data;
  assert.equal(gecmis.length, 15);
  assert.equal(gecmis[0].bolumler[0].metin, 'sürüm 16');
});

test('bilinmeyen işlem ve bozuk gövde reddedilir; desteklenmeyen yöntem 405', async () => {
  assert.equal((await istek({ method: 'POST', body: { action: 'sil' } })).status, 400);
  const bozuk = await handler(new Request('https://www.birlikteiyilik.com/api/bia-rehber', {
    method: 'POST', headers: { Authorization: `Bearer ${await token()}` }, body: '{bozuk'
  }));
  assert.equal(bozuk.status, 400);
  const sil = await handler(new Request('https://www.birlikteiyilik.com/api/bia-rehber', { method: 'DELETE', headers: { Authorization: `Bearer ${await token()}` } }));
  assert.equal(sil.status, 405);
});

test('sayfanın kendisi içerik ya da gizli değer taşımaz (depo herkese açık)', async () => {
  const sayfa = await readFile(new URL('../yonetim/rehber.html', import.meta.url), 'utf8');
  for (const yasak of ['179.67.208.123', 'BIA_JWT_SECRET', 'birlikte_vps', 'hpanel', 'natro', 'livekit.cloud']) {
    assert.ok(!sayfa.toLowerCase().includes(yasak.toLowerCase()), `rehber.html içinde "${yasak}" olmamalı`);
  }
  assert.match(sayfa, /\/api\/bia-rehber/);
});
