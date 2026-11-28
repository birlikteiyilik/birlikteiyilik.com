// Giriş uçlarında IP başına deneme sınırı: öğretmen (teacher-login) ve kayıt rehberi
// (directory-login). 10 hatalı deneme / 10 dakika, sonra 429 + Retry-After. Yönetim girişinin
// (bia-news login) sınırı haberler.test.mjs içinde sınanır.
import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import applications from '../../api/bia-applications.js';
import {
  LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS, clientIpFrom, resetLoginAttempts, takeLoginAttempt
} from '../../api/_bia-rate-limit.js';
import { createTestStore } from '../../tests/_pglite-store.mjs';

process.env.BIA_JWT_SECRET = 'rate-limit-test-jwt-secret';
process.env.BIA_LISTE_PASSWORD = 'rate-limit-directory-password';

let store;
before(async () => { store = await createTestStore(); });
after(async () => { await store.close(); });
beforeEach(async () => {
  resetLoginAttempts();
  await store.reset();
});

const post = (fn, body, ip) => fn(new Request('https://www.birlikteiyilik.com/api/x', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
}), ip === undefined ? undefined : { clientIp: ip });

test('sınırlayıcı: 10 hatalı denemeden sonra durur, pencere dolunca açılır', () => {
  const now = 1_000_000;
  for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i += 1) assert.equal(takeLoginAttempt('t', '1.1.1.1', now + i).ok, true);
  const blocked = takeLoginAttempt('t', '1.1.1.1', now + 100);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.retryAfter, Math.ceil((now + LOGIN_WINDOW_MS - (now + 100)) / 1000));
  assert.equal(takeLoginAttempt('t', '2.2.2.2', now + 100).ok, true, 'başka IP etkilenmez');
  assert.equal(takeLoginAttempt('baska', '1.1.1.1', now + 100).ok, true, 'başka kapsam etkilenmez');
  assert.equal(takeLoginAttempt('t', '1.1.1.1', now + LOGIN_WINDOW_MS).ok, true, 'ilk deneme pencereden çıkınca yer açılır');
});

test('sınırlayıcı: başarılı deneme hakkı geri verir', () => {
  for (let i = 0; i < 50; i += 1) {
    const attempt = takeLoginAttempt('t', '3.3.3.3');
    assert.equal(attempt.ok, true);
    attempt.refund();
    attempt.refund(); // iki kez geri vermek fazladan hak doğurmaz
  }
  for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i += 1) assert.equal(takeLoginAttempt('t', '3.3.3.3').ok, true);
  assert.equal(takeLoginAttempt('t', '3.3.3.3').ok, false);
});

test('istemci IP yalnızca sunucunun verdiği bağlamdan alınır', () => {
  assert.equal(clientIpFrom({ clientIp: ' 203.0.113.9 ' }), '203.0.113.9');
  assert.equal(clientIpFrom(undefined), 'bilinmeyen');
  assert.equal(clientIpFrom({}), 'bilinmeyen');
});

test('kayıt rehberi girişi: 10 hatalı denemeden sonra doğru şifre de 429 alır, başka IP girebilir', async () => {
  for (let i = 0; i < 10; i += 1) {
    assert.equal((await post(applications, { action: 'directory-login', password: 'yanlis-sifre' }, '198.51.100.1')).status, 401);
  }
  const blocked = await post(applications, { action: 'directory-login', password: process.env.BIA_LISTE_PASSWORD }, '198.51.100.1');
  assert.equal(blocked.status, 429);
  const retryAfter = Number(blocked.headers.get('retry-after'));
  assert.ok(retryAfter > 0 && retryAfter <= 600, `Retry-After ${retryAfter}`);
  assert.match((await blocked.json()).error, /dakika sonra yeniden deneyin/);
  assert.equal((await post(applications, { action: 'directory-login', password: process.env.BIA_LISTE_PASSWORD }, '198.51.100.2')).status, 200);
});

test('kayıt rehberi girişi: başarılı girişler sayılmaz', async () => {
  for (let i = 0; i < 15; i += 1) {
    assert.equal((await post(applications, { action: 'directory-login', password: process.env.BIA_LISTE_PASSWORD }, '198.51.100.3')).status, 200);
  }
});

test('öğretmen girişi: hatalı şifreler sınırlanır, kapsam kayıt rehberinden ayrıdır', async () => {
  const salt = Buffer.from('0123456789abcdef').toString('base64');
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode('Dogru-Sifre-1'), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: Buffer.from(salt, 'base64'), iterations: 210000 }, material, 256);
  await store.seed('planning.enc.json', [{ kind: 'teacher', id: 't1', name: 'Hoca', username: 'hoca.bir', active: true,
    passwordSalt: salt, passwordHash: Buffer.from(bits).toString('base64'), modes: ['yuz-yuze'], days: ['pazartesi'] }]);
  const ip = '198.51.100.4';
  assert.equal((await post(applications, { action: 'teacher-login', username: 'hoca.bir', password: 'Dogru-Sifre-1' }, ip)).status, 200);
  for (let i = 0; i < 10; i += 1) {
    assert.equal((await post(applications, { action: 'teacher-login', username: 'hoca.bir', password: `yanlis-${i}` }, ip)).status, 401);
  }
  const blocked = await post(applications, { action: 'teacher-login', username: 'hoca.bir', password: 'Dogru-Sifre-1' }, ip);
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  assert.equal((await post(applications, { action: 'directory-login', password: process.env.BIA_LISTE_PASSWORD }, ip)).status, 200);
});

test('öğretmen girişi: aynı anda gönderilen çok sayıda istek en fazla 10 şifre denemesi yaptırır', async () => {
  const outcomes = await Promise.all(Array.from({ length: 25 }, (_, i) =>
    post(applications, { action: 'teacher-login', username: 'yok.kullanici', password: `deneme-${i}` }, '198.51.100.5')));
  const statuses = outcomes.map((response) => response.status);
  assert.equal(statuses.filter((status) => status === 401).length, 10);
  assert.equal(statuses.filter((status) => status === 429).length, 15);
});
