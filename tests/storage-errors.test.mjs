import test, { beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/bia-applications.js';
import { configureStore } from '../api/_bia-store.js';

// Depolama arızalarında panelin gerçek sebebi göstermesini, diğer kullanıcılara iç ayrıntı
// sızdırmamasını ve sunucu günlüğüne (stderr) iz bırakmasını doğrular. PostgreSQL sürücüsünün
// (pg) fırlattığı hatalar taklit edilir; gerçek veritabanına bağlanılmaz.
process.env.BIA_JWT_SECRET = 'storage-test-jwt-secret';

const originalConsoleError = console.error;
let respond, logs;

configureStore({ query: async (text, params) => respond(text, params), end: async () => {} });
after(() => { console.error = originalConsoleError; configureStore(null); });
beforeEach(() => {
  logs = [];
  console.error = (...args) => logs.push(args.join(' '));
  configureStore({ query: async (text, params) => respond(text, params), end: async () => {} });
});

const pgError = (message, code) => Object.assign(new Error(message), code ? { code } : {});

async function adminToken() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ name: 'Test', role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(process.env.BIA_JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${payload}`));
  return `${header}.${payload}.${Buffer.from(signature).toString('base64url')}`;
}

async function panelLoad() {
  const response = await handler(new Request('http://localhost/api/bia-applications', {
    headers: { Authorization: `Bearer ${await adminToken()}` }
  }));
  return { status: response.status, body: await response.json() };
}

async function adminPost(body) {
  const response = await handler(new Request('http://localhost/api/bia-applications', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await adminToken()}` },
    body: JSON.stringify(body)
  }));
  return { status: response.status, body: await response.json() };
}

async function anonymousPost(body) {
  const response = await handler(new Request('http://localhost/api/bia-applications', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  }));
  return { status: response.status, body: await response.json() };
}

test('PostgreSQL girişi reddedilirse panel DATABASE_URL kontrolünü ister ve loga yazar', async () => {
  respond = () => { throw pgError('password authentication failed for user "site"', '28P01'); };
  const result = await panelLoad();
  assert.equal(result.status, 500);
  assert.match(result.body.error, /DATABASE_URL/);
  assert.ok(logs.some((line) => line.includes('panel-verileri') && line.includes('veritabani-kimlik')));
});

test('PostgreSQL soketi yoksa bağlantı sorunu bildirilir', async () => {
  respond = () => { throw pgError('connect ENOENT /var/run/postgresql/.s.PGSQL.5432', 'ENOENT'); };
  const result = await panelLoad();
  assert.match(result.body.error, /Veritabanına ulaşılamadı/);
  assert.ok(logs.some((line) => line.includes('veritabani-baglanti')));
});

test('olmayan veritabanı ayrıca belirtilir', async () => {
  respond = () => { throw pgError('database "site" does not exist', '3D000'); };
  const result = await panelLoad();
  assert.match(result.body.error, /var olmayan bir veritabanını/);
  assert.ok(logs.some((line) => line.includes('veritabani-yok')));
});

test('bozuk arşiv kaydı biçim hatası olarak bildirilir', async () => {
  respond = (text) => {
    if (/^CREATE TABLE/.test(text)) return { rows: [] };
    if (/ORDER BY archive_name/.test(text)) return { rows: [] };
    return { rows: [{ version: '3', xmin: '9', data: { beklenmeyen: true } }] };
  };
  const result = await panelLoad();
  assert.equal(result.status, 500);
  assert.match(result.body.error, /beklenen biçimde değil/);
  assert.ok(logs.some((line) => line.includes('arsiv-bicimi')));
});

test('pg sürümleri metin olarak döndürdüğünde de (bigint) okuma ve yazma çalışır', async () => {
  const rows = new Map();
  respond = (text, params) => {
    if (/^CREATE TABLE/.test(text)) return { rows: [] };
    if (/ORDER BY archive_name/.test(text)) return { rows: [...rows].map(([name, row]) => ({ archive_name: name, version: String(row.version), xmin: String(row.version) })) };
    if (/^\s*INSERT INTO/.test(text)) {
      rows.set(params[0], { version: 1, data: JSON.parse(params[1]) });
      return { rows: [{ version: '1', xmin: '1' }] };
    }
    if (/^\s*UPDATE/.test(text)) {
      const row = rows.get(params[0]);
      if (!row || String(row.version) !== String(params[2])) return { rows: [] };
      row.version += 1; row.data = JSON.parse(params[1]);
      return { rows: [{ version: String(row.version), xmin: String(row.version) }] };
    }
    const row = rows.get(params[0]);
    if (!row) return { rows: [] };
    const unchanged = String(row.version) === String(params[1]) && String(row.version) === String(params[2]);
    return { rows: [{ version: String(row.version), xmin: String(row.version), data: unchanged ? null : structuredClone(row.data) }] };
  };
  // Bu haftanın pazartesisi: tatil kaydı için her zaman geçerli bir hafta içi gün.
  const weekday = (() => { const d = new Date(); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); })();
  const save = (flag) => adminPost({ action: 'attendance-holiday-save', date: weekday, applicationType: 'online', holiday: flag });
  assert.equal((await save(true)).status, 200);
  assert.equal(rows.get('planning.enc.json').version, 1);
  assert.equal((await save(false)).status, 200);
  assert.equal(rows.get('planning.enc.json').version, 2);
  assert.equal((await save(true)).status, 200);
  assert.equal(rows.get('planning.enc.json').version, 3);
  const list = await panelLoad();
  assert.equal(list.status, 200);
  assert.equal(list.body.holidays.length, 1);
});

test('öğretmen girişinde altyapı ayrıntısı herkese açılmaz ama loga yazılır', async () => {
  respond = () => { throw pgError('connect ECONNREFUSED 127.0.0.1:5432', 'ECONNREFUSED'); };
  const result = await anonymousPost({ action: 'teacher-login', username: 'ogretmen', password: 'parola123' });
  assert.equal(result.status, 500);
  assert.match(result.body.error, /Öğretmen oturumu şu anda açılamadı/);
  assert.doesNotMatch(result.body.error, /PostgreSQL|DATABASE_URL|ECONN/i);
  assert.ok(logs.some((line) => line.includes('teacher-login') && line.includes('veritabani-baglanti')));
});

test('kayıt rehberi aramasında depolama hatası iç ayrıntı döndürmez ama loga yazılır', async () => {
  process.env.BIA_LISTE_PASSWORD = 'storage-test-directory-pass';
  const login = await anonymousPost({ action: 'directory-login', password: process.env.BIA_LISTE_PASSWORD });
  assert.equal(login.status, 200);
  respond = () => { throw pgError('relation "bia_archives" does not exist at character 15', '42P01'); };
  const response = await handler(new Request('http://localhost/api/bia-applications', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${login.body.token}` },
    body: JSON.stringify({ action: 'directory-search', mode: 'student', query: 'Test' })
  }));
  const result = await response.json();
  assert.equal(response.status, 500);
  assert.equal(result.error, 'Arama şu anda yapılamıyor.');
  assert.ok(logs.some((line) => line.includes('directory-search') && line.includes('veritabani-tablo')));
});

test('herkese açık ders saatleri depolama hatasında ayrıntısız 503 döner', async () => {
  respond = () => { throw pgError('canceling statement due to statement timeout', '57014'); };
  const response = await handler(new Request('http://localhost/api/bia-applications?action=program-hours'));
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error, 'Ders saatleri yüklenemedi.');
  assert.ok(logs.some((line) => line.includes('program-hours') && line.includes('veritabani-zaman-asimi')));
});

test('veritabanı ayarlanmamışsa sistem yapılandırılmadı der', async () => {
  configureStore(null);
  const saved = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  const result = await panelLoad();
  assert.equal(result.status, 503);
  assert.match(result.body.error, /henüz yapılandırılmadı/);
  if (saved !== undefined) process.env.DATABASE_URL = saved;
});
