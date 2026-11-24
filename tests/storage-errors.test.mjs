import test, { beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { neonConfig } from '@neondatabase/serverless';
import handler from '../api/bia-applications.js';

// Depolama arızalarında panelin ve yoklamanın gerçek sebebi göstermesini ve
// Vercel loglarına iz bırakmasını doğrular. Uzak SQL servisi taklit edilir.
process.env.BIA_APPLICATIONS_STORAGE = 'neon';
process.env.DATABASE_URL = 'postgresql://test:test@storage-test.neon.tech/test';
process.env.BIA_JWT_SECRET = 'storage-test-jwt-secret';
process.env.BIA_APPLICATIONS_ENCRYPTION_KEY = 'storage-test-encryption-secret';

const originalFetch = neonConfig.fetchFunction;
const originalConsoleError = console.error;
let neonResponse, logs;

neonConfig.fetchFunction = async () => neonResponse();
after(() => { neonConfig.fetchFunction = originalFetch; console.error = originalConsoleError; });
beforeEach(() => { logs = []; console.error = (...args) => logs.push(args.join(' ')); });

const rows = (list) => Response.json({
  fields: [{ name: 'archive_name', dataTypeID: 25 }, { name: 'envelope', dataTypeID: 3802 }, { name: 'version', dataTypeID: 20 }],
  rows: list
});

async function encryptedWith(secret, records) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(records)));
  return { v: 1, alg: 'AES-256-GCM', iv: Buffer.from(iv).toString('base64'), data: Buffer.from(data).toString('base64') };
}

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

async function teacherLogin() {
  const response = await handler(new Request('http://localhost/api/bia-applications', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'teacher-login', username: 'ogretmen', password: 'parola123' })
  }));
  return { status: response.status, body: await response.json() };
}

test('Neon kotası dolunca panel kota sebebini gösterir ve loga yazar', async () => {
  neonResponse = () => Response.json({
    message: 'Your account or project has exceeded the compute time quota. Upgrade your plan to increase limits.'
  }, { status: 400 });
  const result = await panelLoad();
  assert.equal(result.status, 500);
  assert.match(result.body.error, /kotası dolmuş/);
  assert.ok(logs.some((line) => line.includes('panel-verileri') && line.includes('neon-kota')));
});

test('Neon giriş bilgisi geçersizse DATABASE_URL kontrolü istenir', async () => {
  neonResponse = () => Response.json({ message: 'password authentication failed for user \'test\'' }, { status: 400 });
  const result = await panelLoad();
  assert.match(result.body.error, /DATABASE_URL/);
  assert.ok(logs.some((line) => line.includes('neon-kimlik')));
});

test('Neon sunucusu yanıt vermezse bağlantı sorunu bildirilir', async () => {
  neonResponse = () => new Response('Service unavailable', { status: 503 });
  const result = await panelLoad();
  assert.match(result.body.error, /Neon veritabanına ulaşılamadı/);
  assert.ok(logs.some((line) => line.includes('neon-baglanti')));
});

test('Anahtar değişmişse şifre çözme sorunu ayrıca belirtilir', async () => {
  const envelope = await encryptedWith('eski-anahtar', []);
  neonResponse = () => rows([['planning.enc.json', JSON.stringify(envelope), '3']]);
  const result = await panelLoad();
  assert.match(result.body.error, /mevcut anahtarla açılamadı/);
  assert.ok(logs.some((line) => line.includes('sifre-cozme')));
});

test('Yoklama girişinde altyapı ayrıntısı herkese açılmaz ama loga yazılır', async () => {
  neonResponse = () => Response.json({ message: 'Your project has exceeded the compute time quota.' }, { status: 400 });
  const result = await teacherLogin();
  assert.equal(result.status, 500);
  assert.match(result.body.error, /Öğretmen oturumu şu anda açılamadı/);
  assert.doesNotMatch(result.body.error, /Neon|kota/i);
  assert.ok(logs.some((line) => line.includes('teacher-login') && line.includes('neon-kota')));
});
