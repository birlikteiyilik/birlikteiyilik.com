// Gerçek süreç: `node sunucu/server.mjs` rastgele bir portta başlar, istek alır, SIGTERM'de
// açık bağlantılar beklenmeden temiz kapanır. Veritabanı olarak var olmayan bir soket verilir:
// gerçek pg sürücüsü bağlanamaz ve sağlık kontrolü 503 döner (ağa çıkılmaz).
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const SERVER = fileURLToPath(new URL('../server.mjs', import.meta.url));

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => { const { port } = probe.address(); probe.close(() => resolve(port)); });
  });
}

function run(env) {
  const child = spawn(process.execPath, [SERVER], {
    env: { PATH: process.env.PATH, ...env },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const output = { stdout: '', stderr: '' };
  child.stdout.on('data', (chunk) => { output.stdout += chunk; });
  child.stderr.on('data', (chunk) => { output.stderr += chunk; });
  const exited = new Promise((resolve) => child.on('exit', (code, signal) => resolve({ code, signal })));
  return { child, output, exited };
}

async function waitFor(check, timeout = 10_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('bekleme süresi doldu');
}

function get(port, path, agent) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path, agent, headers: { Host: 'www.birlikteiyilik.com' } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }).on('error', reject);
  });
}

test('PORT yoksa ya da APP_ENV geçersizse süreç açıklamayla çıkar', async () => {
  const missing = run({});
  assert.equal((await missing.exited).code, 1);
  assert.match(missing.output.stderr, /PORT ortam değişkeni zorunlu/);
  const badEnv = run({ PORT: '3999', APP_ENV: 'staging' });
  assert.equal((await badEnv.exited).code, 1);
  assert.match(badEnv.output.stderr, /APP_ENV/);
});

test('süreç başlar, sayfa ve API sunar, veritabanı yoksa sağlık 503 der, SIGTERM\'de temiz kapanır', async () => {
  const port = await freePort();
  const server = run({
    PORT: String(port), HOST: '127.0.0.1', APP_ENV: 'test', SURUM: 'deadbee',
    DATABASE_URL: 'postgresql:///site?host=/olmayan-soket-klasoru', BIA_JWT_SECRET: 'surec-test-secret'
  });
  try {
    await waitFor(() => server.output.stdout.includes('dinliyor'));
    const agent = new http.Agent({ keepAlive: true });
    const home = await get(port, '/', agent);
    assert.equal(home.status, 200);
    assert.match(home.body, /<html/i);
    assert.equal((await get(port, '/yoklama', agent)).status, 200);
    assert.equal((await get(port, '/iletisim', agent)).headers.location, '/#iletisim');
    const health = await get(port, '/__saglik');
    assert.equal(health.status, 503);
    assert.deepEqual(JSON.parse(health.body), { ok: false, uygulama: 'site', surum: 'deadbee', hata: 'veritabani' });
    const hours = await get(port, '/api/bia-applications?action=program-hours');
    assert.equal(hours.status, 503);
    assert.deepEqual(JSON.parse(hours.body), { error: 'Ders saatleri yüklenemedi.' });

    // Boşta bekleyen keep-alive bağlantısı kapanışı geciktirmez.
    const started = Date.now();
    server.child.kill('SIGTERM');
    const { code } = await server.exited;
    assert.equal(code, 0);
    assert.ok(Date.now() - started < 5_000, `kapanış ${Date.now() - started} ms sürdü`);
    agent.destroy();

    const errorLines = server.output.stderr.trim().split('\n').filter(Boolean);
    assert.ok(errorLines.length > 0, 'veritabanı hatası günlüğe yazıldı');
    for (const line of errorLines) {
      assert.match(line, /^\[(site|bia-applications|bia-store)\] /, `tek satırlık günlük: ${line}`);
      assert.doesNotMatch(line, /surec-test-secret/);
    }
    assert.ok(errorLines.some((line) => line.includes('veritabani-baglanti') || line.includes('ENOENT')));
  } finally {
    if (server.child.exitCode === null) server.child.kill('SIGKILL');
  }
});
