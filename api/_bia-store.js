// Başvuru ve planlama arşivlerinin PostgreSQL deposu.
//
// Her arşiv bia_archives tablosunda tek satırdır: archive_name (ör. planning.enc.json,
// 2026-11.enc.json), düz JSONB veri (kayıt dizisi) ve iyimser eşzamanlılık için version.
// Adlardaki ".enc.json" eki geçmişten kalmadır; veri artık şifreli tutulmaz (veritabanı
// yalnızca sunucunun içinden erişilebilir, yedekler ayrıca şifrelenir).
//
// Tek Node süreci çalıştığı için okunan arşivler bellekte, ad + damga anahtarıyla tutulur.
// Damga = version + satırın xmin değeri: uygulama dışında yapılan bir yazma (ör. yedekten
// geri yükleme, sürüm numarası aynı kalsa bile) xmin'i değiştirir ve önbelleği geçersiz kılar.
// Her okuma veritabanına yalnızca damgayı sorar; değişmediyse büyük JSON tekrar taşınmaz.
// Çağıranlar kayıtları yerinde değiştirdiği için her okuma derin kopya döner.
import pg from 'pg';

export const ARCHIVE_TABLE = 'bia_archives';

export const ARCHIVE_SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS ${ARCHIVE_TABLE} (
  archive_name text PRIMARY KEY,
  data jsonb NOT NULL,
  version bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
)`;

export class StoreConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StoreConfigError';
  }
}

export class ArchiveFormatError extends Error {
  constructor(name) {
    super(`Arşiv beklenen biçimde değil: ${name}`);
    this.name = 'ArchiveFormatError';
  }
}

let executor = null; // { query(text, params) → { rows }, end() }
let injected = false;
let schemaReady = null;
const cache = new Map(); // archive_name → { stamp, version, records }

function createPool(connectionString) {
  const pool = new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 15_000,
    application_name: 'birlikte-site'
  });
  // Boştaki bir bağlantı koparsa (ör. PostgreSQL yeniden başladı) süreç çökmesin.
  pool.on('error', (error) => {
    console.error(`[bia-store] boştaki veritabanı bağlantısı hata verdi: ${oneLine(error?.message)}`);
  });
  return pool;
}

function oneLine(value) {
  return String(value || '').replace(/\s+/g, ' ').slice(0, 300);
}

function db() {
  if (injected) return executor;
  if (!executor) {
    const url = process.env.DATABASE_URL || '';
    if (!url) throw new StoreConfigError('DATABASE_URL tanımlı değil.');
    executor = createPool(url);
  }
  return executor;
}

/** Testler için: pg.Pool yerine `query(text, params)` ve `end()` sunan bir nesne kullan. */
export function configureStore(customExecutor) {
  executor = customExecutor || null;
  injected = Boolean(customExecutor);
  schemaReady = null;
  cache.clear();
}

export function storeConfigured() {
  return injected || Boolean(process.env.DATABASE_URL);
}

export function clearArchiveCache() {
  cache.clear();
}

export function ensureArchiveSchema() {
  if (!schemaReady) {
    let pending;
    try {
      pending = Promise.resolve(db().query(ARCHIVE_SCHEMA_SQL, []));
    } catch (error) {
      pending = Promise.reject(error);
    }
    schemaReady = pending.then(() => true, (error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

async function query(text, params) {
  await ensureArchiveSchema();
  return db().query(text, params);
}

function toVersion(value) {
  const version = Number(value);
  if (!Number.isSafeInteger(version) || version < 1) throw new Error('Arşiv sürümü geçersiz.');
  return version;
}

function stampOf(row) {
  return `${toVersion(row.version)}:${String(row.xmin)}`;
}

function fromCache(entry) {
  return { records: structuredClone(entry.records), version: entry.version, stamp: entry.stamp };
}

/** Bütün arşivlerin yalnızca adı, sürümü ve damgası (veri taşınmaz). */
export async function listArchiveVersions() {
  const { rows } = await query(`SELECT archive_name, version, xmin::text AS xmin FROM ${ARCHIVE_TABLE} ORDER BY archive_name`, []);
  return rows.map((row) => ({ name: row.archive_name, version: toVersion(row.version), stamp: stampOf(row) }));
}

/** Arşivin güncel damgası; arşiv yoksa '0'. Önbellek anahtarı olarak kullanılır. */
export async function archiveStamp(name) {
  const { rows } = await query(`SELECT version, xmin::text AS xmin FROM ${ARCHIVE_TABLE} WHERE archive_name = $1`, [name]);
  return rows.length ? stampOf(rows[0]) : '0';
}

/**
 * Arşivi okur: `{ records, version, stamp }`; arşiv yoksa `{ records: [], version: 0, stamp: '0' }`.
 * `knownStamp` az önce listelenen damgaysa ve bellekte o damga varsa veritabanına hiç sorulmaz.
 */
export async function loadArchive(name, knownStamp) {
  const cached = cache.get(name);
  if (cached && knownStamp !== undefined && cached.stamp === knownStamp) return fromCache(cached);
  // Bellekteki damga hâlâ güncelse veri sütunu boş döner; yalnızca damga karşılaştırılır.
  const { rows } = await query(
    `SELECT version, xmin::text AS xmin,
       CASE WHEN version = $2 AND xmin::text = $3 THEN NULL ELSE data END AS data
     FROM ${ARCHIVE_TABLE} WHERE archive_name = $1`,
    [name, cached ? cached.version : 0, cached ? cached.xmin : '']
  );
  if (!rows.length) {
    cache.delete(name);
    return { records: [], version: 0, stamp: '0' };
  }
  const version = toVersion(rows[0].version);
  const xmin = String(rows[0].xmin);
  if (cached && cached.version === version && cached.xmin === xmin) return fromCache(cached);
  const data = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
  if (!Array.isArray(data)) throw new ArchiveFormatError(name);
  const entry = { version, xmin, stamp: stampOf(rows[0]), records: data };
  cache.set(name, entry);
  return fromCache(entry);
}

/**
 * Arşivi yazar. `expectedVersion` 0 ise yeni arşiv eklenir, değilse yalnızca o sürüm hâlâ
 * güncelse güncellenir. Başarıda yeni sürüm, eşzamanlı bir yazma kazandıysa null döner.
 */
export async function saveArchive(name, records, expectedVersion) {
  if (!Array.isArray(records)) throw new ArchiveFormatError(name);
  const text = JSON.stringify(records);
  const { rows } = expectedVersion
    ? await query(
      `UPDATE ${ARCHIVE_TABLE} SET data = $2::jsonb, version = version + 1, updated_at = now()
       WHERE archive_name = $1 AND version = $3 RETURNING version, xmin::text AS xmin`,
      [name, text, expectedVersion]
    )
    : await query(
      `INSERT INTO ${ARCHIVE_TABLE} (archive_name, data, version) VALUES ($1, $2::jsonb, 1)
       ON CONFLICT (archive_name) DO NOTHING RETURNING version, xmin::text AS xmin`,
      [name, text]
    );
  if (!rows.length) {
    cache.delete(name);
    return null;
  }
  const version = toVersion(rows[0].version);
  // Bellekte veritabanına giden metnin karşılığı tutulur (undefined alanlar düşer).
  cache.set(name, { version, xmin: String(rows[0].xmin), stamp: stampOf(rows[0]), records: JSON.parse(text) });
  return version;
}

/** Sağlık kontrolü için ucuz sorgu. */
export async function pingStore() {
  await db().query('SELECT 1', []);
  return true;
}

export async function closeStore() {
  const current = executor;
  executor = null;
  schemaReady = null;
  cache.clear();
  if (current && !injected) await current.end();
  injected = false;
}
