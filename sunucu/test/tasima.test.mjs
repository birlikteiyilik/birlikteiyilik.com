// Tek seferlik arşiv taşıma betiği (sunucu/tasima/arsivleri-ac.mjs). Kaynak ve hedef iki ayrı
// bellek içi PostgreSQL'dir (PGlite); kaynak arşivler eski uygulamanın algoritmasıyla ve bir test
// anahtarıyla şifrelenir.
import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import {
  SOURCE_TABLE, TasimaError, arsivleriAc, canonicalJson, compareArchives, decryptEnvelope, encryptionSecretFrom
} from '../tasima/arsivleri-ac.mjs';

const KEY = 'tasima-test-jwt-secret-yalnizca-test';
const SCRIPT = fileURLToPath(new URL('../tasima/arsivleri-ac.mjs', import.meta.url));

// Eski api/bia-applications.js encryptRecords ile aynı.
async function encryptRecords(records, secret = KEY) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(records)));
  return { v: 1, alg: 'AES-256-GCM', iv: Buffer.from(iv).toString('base64'), data: Buffer.from(data).toString('base64') };
}

const FIXTURES = {
  'planning.enc.json': {
    version: 57, updatedAt: '2026-11-27 18:03:11.123456+00',
    records: [
      { kind: 'program-hours', id: 'program-hours:yuz-yuze', applicationType: 'yuz-yuze', slots: ['15:00-15:20', '15:20-15:40'], revision: 4 },
      { kind: 'teacher', id: 't1', name: 'Gizli Öğretmen Adı', phone: '05329998877', modes: ['yuz-yuze'], days: ['pazartesi'], active: true,
        username: 'gizli.ogretmen', passwordHash: 'aGFzaA==', passwordSalt: 'c2FsdA==', programSlots: null },
      { kind: 'attendance', id: 'a1', applicationId: 'x1', teacherId: 't1', lessonDate: '2026-11-24', slot: '15:00-15:20', status: 'katildi', note: 'Ğğ Üü Şş İı Öö Çç — “tırnak” \\ ters eğik' }
    ]
  },
  '2026-09.enc.json': {
    version: 212, updatedAt: '2026-09-30 21:59:59.999999+00',
    records: [{ id: 'x1', reference: 'BIA-20260901-ABC123', studentName: 'Gizli Öğrenci Adı', tckn: '10000000146', createdAt: '2026-09-01T08:00:00.000Z',
      consents: { rulesAccepted: true, version: '2026-09-08' }, availabilitySlots: ['15:00-15:20'], history: [{ type: 'application-created', at: '2026-09-01T08:00:00.000Z' }],
      sayi: 1.5, buyuk: 12345678901234, bos: null }]
  },
  '2026-10.enc.json': { version: 3, updatedAt: '2026-10-02 10:00:00+00', records: [] },
  '2026-11.enc.json': { version: 1, updatedAt: '2026-11-28 07:00:00.5+00', records: [{ id: 'x2', studentName: 'İkinci Gizli Öğrenci', z: 1, a: { y: 2, b: [3, { d: 4, c: 5 }] } }] }
};
const SECRET_CONTENT = /Gizli|10000000146|05329998877|BIA-20260901|tırnak|aGFzaA/;

let kaynak;
let hedef;
let logs;

async function seedSource(db, fixtures = FIXTURES, secret = KEY) {
  await db.query(`CREATE TABLE ${SOURCE_TABLE} (archive_name text PRIMARY KEY, envelope jsonb NOT NULL, version bigint NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT now())`);
  for (const [name, fixture] of Object.entries(fixtures)) {
    await db.query(`INSERT INTO ${SOURCE_TABLE} (archive_name, envelope, version, updated_at) VALUES ($1, $2::jsonb, $3, $4::timestamptz)`,
      [name, JSON.stringify(await encryptRecords(fixture.records, secret)), fixture.version, fixture.updatedAt]);
  }
}

async function targetTableExists() {
  return (await hedef.query("SELECT to_regclass('bia_archives') IS NOT NULL AS var")).rows[0].var;
}

beforeEach(async () => {
  kaynak = new PGlite();
  hedef = new PGlite();
  await Promise.all([kaynak.waitReady, hedef.waitReady]);
  await seedSource(kaynak);
  logs = [];
});
afterEach(async () => {
  await Promise.all([kaynak.close(), hedef.close()]);
});

const run = (options = {}) => arsivleriAc({ kaynak, hedef, secret: KEY, log: (line) => logs.push(line), ...options });

test('anahtar eski uygulamadaki sırayla seçilir', () => {
  assert.deepEqual(encryptionSecretFrom({ BIA_JWT_SECRET: 'j', BIA_ADMIN_PASSWORD: 'p' }), { secret: 'j', source: 'BIA_JWT_SECRET' });
  assert.deepEqual(encryptionSecretFrom({ BIA_APPLICATIONS_ENCRYPTION_KEY: 'e', BIA_JWT_SECRET: 'j' }), { secret: 'e', source: 'BIA_APPLICATIONS_ENCRYPTION_KEY' });
  assert.deepEqual(encryptionSecretFrom({ BIA_JWT_SECRET: '', BIA_ADMIN_PASSWORD: 'p' }), { secret: 'p', source: 'BIA_ADMIN_PASSWORD' });
  assert.equal(encryptionSecretFrom({}), null);
});

test('kanonik JSON anahtar sırasından bağımsızdır, dizi sırasına duyarlıdır', () => {
  assert.equal(canonicalJson({ b: 1, a: { d: [1, 2], c: null } }), canonicalJson({ a: { c: null, d: [1, 2] }, b: 1 }));
  assert.notEqual(canonicalJson([1, 2]), canonicalJson([2, 1]));
  assert.notEqual(canonicalJson({ a: '1' }), canonicalJson({ a: 1 }));
  assert.equal(canonicalJson({ a: undefined, b: 1 }), canonicalJson({ b: 1 }));
});

test('başarılı taşıma: bütün arşivler sürüm ve zamanıyla düz JSONB olarak yazılır ve doğrulanır', async () => {
  const result = await run();
  assert.equal(result.written, true);
  await hedef.query("SET TIME ZONE 'UTC'");
  const { rows } = await hedef.query('SELECT archive_name, data, version::text AS version, updated_at::text AS updated_at FROM bia_archives ORDER BY archive_name');
  assert.deepEqual(rows.map((row) => row.archive_name), Object.keys(FIXTURES).sort());
  for (const row of rows) {
    const fixture = FIXTURES[row.archive_name];
    assert.equal(row.version, String(fixture.version), row.archive_name);
    assert.equal(row.updated_at, fixture.updatedAt, `${row.archive_name} zamanı mikrosaniyesiyle korunur`);
    assert.equal(canonicalJson(row.data), canonicalJson(fixture.records), row.archive_name);
    assert.deepEqual(row.data, fixture.records);
  }
  const output = logs.join('\n');
  for (const name of Object.keys(FIXTURES)) assert.match(output, new RegExp(name.replace(/\./g, '\\.')));
  assert.match(output, /toplam: 4 arşiv, 5 kayıt/);
  assert.match(output, /yazıldı ve doğrulandı/);
  assert.doesNotMatch(output, SECRET_CONTENT, 'çıktıda başvuru içeriği yok');
});

test('taşınan veri uygulamanın deposuyla okunabilir', async () => {
  await run();
  const { configureStore, loadArchive, listArchiveVersions } = await import('../../api/_bia-store.js');
  configureStore({ query: (text, params) => hedef.query(text, params), end: async () => {} });
  try {
    const planning = await loadArchive('planning.enc.json');
    assert.equal(planning.version, 57);
    assert.equal(planning.records.find((item) => item.kind === 'teacher').name, 'Gizli Öğretmen Adı');
    assert.deepEqual((await listArchiveVersions()).map((item) => item.version), [212, 3, 1, 57]);
  } finally {
    configureStore(null);
  }
});

test('kuru çalışma: çözer ve raporlar, hedefe hiçbir şey yazmaz', async () => {
  const result = await run({ kuru: true });
  assert.equal(result.written, false);
  assert.equal(await targetTableExists(), false);
  const output = logs.join('\n');
  assert.match(output, /hedef boş: taşımaya hazır/);
  assert.match(output, /kuru çalışma: hiçbir şey yazılmadı/);
  assert.doesNotMatch(output, SECRET_CONTENT);
  logs = [];
  await arsivleriAc({ kaynak, hedef: null, secret: KEY, kuru: true, log: (line) => logs.push(line) });
  assert.match(logs.join('\n'), /toplam: 4 arşiv/);
});

test('kurcalanmış şifreli arşiv taşımayı durdurur; hedefte hiçbir şey kalmaz', async () => {
  const { rows } = await kaynak.query(`SELECT envelope FROM ${SOURCE_TABLE} WHERE archive_name = '2026-09.enc.json'`);
  const bytes = Buffer.from(rows[0].envelope.data, 'base64');
  bytes[10] ^= 0x01;
  await kaynak.query(`UPDATE ${SOURCE_TABLE} SET envelope = jsonb_set(envelope, '{data}', to_jsonb($1::text)) WHERE archive_name = '2026-09.enc.json'`, [bytes.toString('base64')]);
  await assert.rejects(run(), (error) => error instanceof TasimaError && /2026-09\.enc\.json: şifre çözülemedi/.test(error.message));
  assert.equal(await targetTableExists(), false);
  await assert.rejects(run({ kuru: true }), /şifre çözülemedi/, 'kuru çalışma da bozuk arşivi bildirir');
});

test('yanlış anahtar taşımayı durdurur', async () => {
  await assert.rejects(run({ secret: 'baska-anahtar' }), /şifre çözülemedi/);
  assert.equal(await targetTableExists(), false);
  await assert.rejects(arsivleriAc({ kaynak, hedef, secret: '' }), /anahtarı yok/);
});

test('hedefe yazılırken veri bozulursa doğrulama yakalar ve işlemi geri alır', async () => {
  // Hedef bağlantısı ekleme sırasında bir kaydı değiştiriyor gibi davranır.
  const corrupting = {
    query(text, params) {
      if (/^INSERT INTO bia_archives/.test(text) && params[0] === '2026-11.enc.json') {
        const data = JSON.parse(params[1]);
        data[0].a.b[1].c = 6;
        return hedef.query(text, [params[0], JSON.stringify(data), params[2], params[3]]);
      }
      return hedef.query(text, params);
    }
  };
  await assert.rejects(arsivleriAc({ kaynak, hedef: corrupting, secret: KEY, log: () => {} }),
    (error) => /2026-11\.enc\.json: içerik farklı/.test(error.message) && /geri alındı/.test(error.message));
  assert.equal(await targetTableExists(), false, 'tablo bile kalmaz (DDL de işlemin içinde)');
});

test('hedefte sürüm ya da zaman değişirse doğrulama yakalar', async () => {
  const shifting = {
    query(text, params) {
      if (/^INSERT INTO bia_archives/.test(text) && params[0] === 'planning.enc.json') {
        return hedef.query(text, [params[0], params[1], '58', params[3]]);
      }
      if (/^INSERT INTO bia_archives/.test(text) && params[0] === '2026-10.enc.json') {
        return hedef.query(text, [params[0], params[1], params[2], '2026-10-02 10:00:00.000001+00']);
      }
      return hedef.query(text, params);
    }
  };
  await assert.rejects(arsivleriAc({ kaynak, hedef: shifting, secret: KEY, log: () => {} }),
    (error) => /planning\.enc\.json: sürüm farklı \(57 \/ 58\)/.test(error.message) && /2026-10\.enc\.json: son değişiklik zamanı farklı/.test(error.message));
  assert.equal(await targetTableExists(), false);
});

test('kaynak taşıma sırasında değişirse (eski site hâlâ yazıyorsa) işlem geri alınır', async () => {
  let reads = 0;
  const changing = {
    async query(text, params) {
      if (/FROM bia_encrypted_archives/.test(text) && ++reads === 2) {
        await kaynak.query(`UPDATE ${SOURCE_TABLE} SET envelope = $1::jsonb, version = version + 1 WHERE archive_name = '2026-11.enc.json'`,
          [JSON.stringify(await encryptRecords([...FIXTURES['2026-11.enc.json'].records, { id: 'yeni' }]))]);
      }
      return kaynak.query(text, params);
    }
  };
  await assert.rejects(arsivleriAc({ kaynak: changing, hedef, secret: KEY, log: () => {} }),
    (error) => /kaynak taşıma sırasında değişti: 2026-11\.enc\.json: sürüm farklı/.test(error.message));
  assert.equal(await targetTableExists(), false);
});

test('hedefte zaten arşiv varsa hiçbir şey yazılmaz', async () => {
  await hedef.query('CREATE TABLE bia_archives (archive_name text PRIMARY KEY, data jsonb NOT NULL, version bigint NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT now())');
  await hedef.query(`INSERT INTO bia_archives (archive_name, data) VALUES ('2026-12.enc.json', '[{"id":"canli"}]')`);
  await assert.rejects(run(), /hedefte zaten 1 arşiv var/);
  const { rows } = await hedef.query('SELECT archive_name, data FROM bia_archives');
  assert.deepEqual(rows, [{ archive_name: '2026-12.enc.json', data: [{ id: 'canli' }] }]);
  logs = [];
  await run({ kuru: true });
  assert.match(logs.join('\n'), /hedefte 1 arşiv var: gerçek taşıma reddedilir/);
});

test('veritabanının kabul etmediği veri (\\u0000) işlemi geri aldırır, içerik yazdırılmaz', async () => {
  const fresh = new PGlite();
  await fresh.waitReady;
  try {
    await seedSource(fresh, { 'planning.enc.json': { version: 1, updatedAt: '2026-11-01 00:00:00+00', records: [{ note: 'Gizli\u0000not' }] } });
    await assert.rejects(arsivleriAc({ kaynak: fresh, hedef, secret: KEY, log: () => {} }), (error) => {
      assert.doesNotMatch(String(error.message), SECRET_CONTENT);
      return error.code === '22P05';
    });
    assert.equal(await targetTableExists(), false);
  } finally {
    await fresh.close();
  }
});

test('boş ya da eksik kaynak tablo açık hata verir', async () => {
  const empty = new PGlite();
  await empty.waitReady;
  try {
    await assert.rejects(arsivleriAc({ kaynak: empty, hedef, secret: KEY, log: () => {} }), /bia_encrypted_archives tablosu yok/);
    await seedSource(empty, {});
    await assert.rejects(arsivleriAc({ kaynak: empty, hedef, secret: KEY, log: () => {} }), /hiç arşiv yok/);
  } finally {
    await empty.close();
  }
});

test('karşılaştırma fark türlerini adlandırır, içerik göstermez', () => {
  const source = [{ name: 'a', version: '1', updatedAt: 't', count: 1, records: [{ x: 'gizli' }] }];
  assert.deepEqual(compareArchives(source, [{ name: 'a', version: '1', updatedAt: 't', count: 1, records: [{ x: 'gizli' }] }]), []);
  assert.deepEqual(compareArchives(source, []), ['arşiv sayısı farklı: kaynak 1, hedef 0', 'a: hedefte yok']);
  assert.deepEqual(compareArchives(source, [{ name: 'a', version: '1', updatedAt: 't', count: 1, records: [{ x: 'baska' }] },
    { name: 'b', version: '1', updatedAt: 't', count: 0, records: [] }]), ['arşiv sayısı farklı: kaynak 1, hedef 2', 'a: içerik farklı', 'b: kaynakta yok']);
});

test('eski algoritmayla şifrelenmiş zarf çözülür; biçimsiz zarf reddedilir', async () => {
  assert.deepEqual(await decryptEnvelope(await encryptRecords([{ a: 'ş' }]), KEY), [{ a: 'ş' }]);
  await assert.rejects(decryptEnvelope({ v: 2 }, KEY), /zarf biçimi geçersiz/);
  await assert.rejects(decryptEnvelope(await encryptRecords({ dizi: false }), KEY), /kayıt dizisi değil/);
});

test('komut satırı: eksik ayar ve bilinmeyen seçenek açıklamayla çıkar', () => {
  const env = { PATH: process.env.PATH };
  const unknown = spawnSync(process.execPath, [SCRIPT, '--zorla'], { env, encoding: 'utf8' });
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /bilinmeyen seçenek/);
  const noSource = spawnSync(process.execPath, [SCRIPT], { env, encoding: 'utf8' });
  assert.equal(noSource.status, 1);
  assert.match(noSource.stderr, /KAYNAK_DATABASE_URL gerekli/);
  const noTarget = spawnSync(process.execPath, [SCRIPT], { env: { ...env, KAYNAK_DATABASE_URL: 'postgresql://x@127.0.0.1:1/x' }, encoding: 'utf8' });
  assert.equal(noTarget.status, 1);
  assert.match(noTarget.stderr, /DATABASE_URL gerekli/);
  const noKey = spawnSync(process.execPath, [SCRIPT, '--kuru'], { env: { ...env, KAYNAK_DATABASE_URL: 'postgresql://x@127.0.0.1:1/x' }, encoding: 'utf8' });
  assert.equal(noKey.status, 1);
  assert.match(noKey.stderr, /anahtarı gerekli/);
  const unreachable = spawnSync(process.execPath, [SCRIPT, '--kuru'], {
    env: { ...env, KAYNAK_DATABASE_URL: 'postgresql://kullanici:parola-gizli@127.0.0.1:1/x', BIA_JWT_SECRET: 'gizli-anahtar-degeri' }, encoding: 'utf8', timeout: 30_000
  });
  assert.equal(unreachable.status, 1);
  assert.match(unreachable.stdout, /anahtar kaynağı: BIA_JWT_SECRET · kuru çalışma/);
  assert.match(unreachable.stderr, /HATA: ECONNREFUSED/);
  assert.doesNotMatch(unreachable.stdout + unreachable.stderr, /parola-gizli|gizli-anahtar-degeri/);
});
