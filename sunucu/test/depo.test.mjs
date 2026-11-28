// Arşiv deposu (api/_bia-store.js): ekleme, okuma, sürüm koşullu güncelleme, çakışma,
// yalnızca sürüm listeleme ve bellek önbelleği. Bellekte gerçek PostgreSQL (PGlite).
import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { createTestStore } from '../../tests/_pglite-store.mjs';
import {
  ARCHIVE_TABLE, ArchiveFormatError, archiveStamp, configureStore, listArchiveVersions, loadArchive,
  saveArchive, storeConfigured
} from '../../api/_bia-store.js';

let store;
before(async () => { store = await createTestStore(); });
after(async () => { await store.close(); });
beforeEach(async () => { await store.reset(); });

test('tablo şeması beklenen sütunlarla ve tekrar çalıştırılabilir biçimde kurulur', async () => {
  const { rows } = await store.db.query(
    `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns
     WHERE table_name = $1 ORDER BY ordinal_position`, [ARCHIVE_TABLE]);
  assert.deepEqual(rows.map((row) => [row.column_name, row.data_type, row.is_nullable]), [
    ['archive_name', 'text', 'NO'], ['data', 'jsonb', 'NO'], ['version', 'bigint', 'NO'], ['updated_at', 'timestamp with time zone', 'NO']
  ]);
  const pk = await store.db.query(`SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = $1::regclass AND i.indisprimary`, [ARCHIVE_TABLE]);
  assert.deepEqual(pk.rows.map((row) => row.attname), ['archive_name']);
  configureStore(store.executor); // şema yeniden kurulur: CREATE TABLE IF NOT EXISTS hata vermez
  assert.equal((await loadArchive('yok.enc.json')).version, 0);
});

test('olmayan arşiv boş ve sürüm 0 döner; ilk kayıt sürüm 1 ile eklenir', async () => {
  assert.deepEqual(await loadArchive('2026-11.enc.json'), { records: [], version: 0, stamp: '0' });
  assert.equal(await archiveStamp('2026-11.enc.json'), '0');
  assert.equal(await saveArchive('2026-11.enc.json', [{ id: 'a', ad: 'Şükrü Çağ' }], 0), 1);
  const stored = await store.row('2026-11.enc.json');
  assert.deepEqual(stored, { data: [{ id: 'a', ad: 'Şükrü Çağ' }], version: 1 });
  const loaded = await loadArchive('2026-11.enc.json');
  assert.equal(loaded.version, 1);
  assert.deepEqual(loaded.records, [{ id: 'a', ad: 'Şükrü Çağ' }]);
});

test('güncelleme yalnızca beklenen sürüm hâlâ güncelse yapılır; eski sürüm çakışma (null) döner', async () => {
  assert.equal(await saveArchive('planning.enc.json', [{ n: 1 }], 0), 1);
  assert.equal(await saveArchive('planning.enc.json', [{ n: 2 }], 0), null, 'ikinci ekleme çakışır');
  assert.equal(await saveArchive('planning.enc.json', [{ n: 2 }], 1), 2);
  assert.equal(await saveArchive('planning.enc.json', [{ n: 3 }], 1), null, 'eski sürümle yazılamaz');
  assert.deepEqual(await store.row('planning.enc.json'), { data: [{ n: 2 }], version: 2 });
  const { rows } = await store.db.query(`SELECT updated_at > now() - interval '1 minute' AS fresh FROM ${ARCHIVE_TABLE}`);
  assert.equal(rows[0].fresh, true);
});

test('listeleme yalnızca ad, sürüm ve damga döndürür; veri sütunu okunmaz', async () => {
  await store.seed('2026-09.enc.json', [{ id: 1 }], 4);
  await store.seed('planning.enc.json', [{ id: 2 }], 7);
  store.state.queries = [];
  const list = await listArchiveVersions();
  assert.deepEqual(list.map(({ name, version }) => ({ name, version })), [
    { name: '2026-09.enc.json', version: 4 }, { name: 'planning.enc.json', version: 7 }
  ]);
  assert.ok(list.every((item) => /^\d+:\d+$/.test(item.stamp)));
  assert.doesNotMatch(store.state.queries[0], /\bdata\b/);
});

test('önbellek: değişmeyen arşiv veri taşımadan döner, dönen kopya değiştirilse de önbellek bozulmaz', async () => {
  await store.seed('planning.enc.json', [{ id: 'x', items: [1] }], 3);
  const first = await loadArchive('planning.enc.json');
  first.records[0].items.push(2);
  first.records.push({ id: 'y' });
  store.state.queries = [];
  const second = await loadArchive('planning.enc.json');
  assert.deepEqual(second.records, [{ id: 'x', items: [1] }]);
  assert.equal(store.state.queries.length, 1);
  const { rows } = await store.db.query(
    `SELECT CASE WHEN version = 3 THEN NULL ELSE data END AS data FROM ${ARCHIVE_TABLE}`);
  assert.equal(rows[0].data, null);
  // Listeden gelen damga bellektekiyle aynıysa veritabanına hiç sorulmaz.
  const [listed] = await listArchiveVersions();
  store.state.queries = [];
  assert.deepEqual((await loadArchive('planning.enc.json', listed.stamp)).records, [{ id: 'x', items: [1] }]);
  assert.equal(store.state.queries.length, 0);
});

test('önbellek uygulama dışı yazmayı (aynı sürüm numarasıyla bile) fark eder', async () => {
  await store.seed('planning.enc.json', [{ id: 'eski' }], 5);
  assert.deepEqual((await loadArchive('planning.enc.json')).records, [{ id: 'eski' }]);
  await store.db.query(`UPDATE ${ARCHIVE_TABLE} SET data = '[{"id":"geri-yuklenen"}]'::jsonb WHERE archive_name = 'planning.enc.json'`);
  const reloaded = await loadArchive('planning.enc.json');
  assert.equal(reloaded.version, 5);
  assert.deepEqual(reloaded.records, [{ id: 'geri-yuklenen' }]);
});

test('yazılan veri veritabanındakiyle aynı tutulur: undefined alanlar düşer, sonraki okuma veritabanına uyar', async () => {
  assert.equal(await saveArchive('planning.enc.json', [{ id: 't', passwordHash: undefined, ad: 'Ayşe' }], 0), 1);
  const cached = await loadArchive('planning.enc.json');
  assert.deepEqual(cached.records, [{ id: 't', ad: 'Ayşe' }]);
  assert.ok(!('passwordHash' in cached.records[0]));
  assert.deepEqual((await store.row('planning.enc.json')).data, [{ id: 't', ad: 'Ayşe' }]);
});

test('dizi olmayan arşiv verisi biçim hatası verir; dizi olmayan kayıt yazılmaz', async () => {
  await store.seed('bozuk.enc.json', { not: 'array' }, 1);
  await assert.rejects(loadArchive('bozuk.enc.json'), ArchiveFormatError);
  await assert.rejects(saveArchive('planning.enc.json', { not: 'array' }, 0), ArchiveFormatError);
  assert.equal(store.state.writes, 0);
});

test('depo ayarlı mı: enjekte edilmiş yürütücü ya da DATABASE_URL', async () => {
  assert.equal(storeConfigured(), true);
  configureStore(null);
  const saved = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  assert.equal(storeConfigured(), false);
  await assert.rejects(loadArchive('planning.enc.json'), { name: 'StoreConfigError' });
  process.env.DATABASE_URL = 'postgresql:///site?host=/var/run/postgresql';
  assert.equal(storeConfigured(), true);
  if (saved === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = saved;
  configureStore(store.executor);
});
