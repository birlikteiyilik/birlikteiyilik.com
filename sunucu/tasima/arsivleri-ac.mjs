#!/usr/bin/env node
// Tek seferlik taşıma: eski veritabanındaki (Neon) şifreli başvuru arşivlerini açar ve sunucudaki
// PostgreSQL'e düz JSONB olarak yazar.
//
//   KAYNAK_DATABASE_URL=<eski veritabanı>  DATABASE_URL=<yeni veritabanı>
//   BIA_JWT_SECRET=<Vercel'deki değer>  node sunucu/tasima/arsivleri-ac.mjs [--kuru]
//
// Anahtar, eski uygulamadaki gibi şu değişkenlerden ilk dolu olanın SHA-256 özetidir:
// BIA_APPLICATIONS_ENCRYPTION_KEY, BIA_JWT_SECRET, BIA_ADMIN_PASSWORD.
//
// Bütün yazma tek işlemdedir (transaction). Yazdıktan sonra iki taraf yeniden okunur; her arşiv
// kanonik JSON (anahtarlar sıralı, derin) ile, sürüm, son değişiklik zamanı ve kayıt sayısıyla
// karşılaştırılır. En küçük farkta işlem geri alınır ve betik sıfırdan farklı kodla çıkar.
// Hedefte zaten arşiv varsa hiçbir şey yazılmaz. Ekrana yalnızca arşiv adı, sürüm, kayıt sayısı,
// boyut ve özet (sha256) yazılır; başvuru içeriği hiçbir zaman yazılmaz.
//
// --kuru: yalnızca çözer ve raporlar; hiçbir yere yazmaz (DATABASE_URL verilirse hedefi okur).
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';
import { ARCHIVE_SCHEMA_SQL, ARCHIVE_TABLE } from '../../api/_bia-store.js';

export const SOURCE_TABLE = 'bia_encrypted_archives';
export const KEY_VARIABLES = ['BIA_APPLICATIONS_ENCRYPTION_KEY', 'BIA_JWT_SECRET', 'BIA_ADMIN_PASSWORD'];

export class TasimaError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TasimaError';
  }
}

/** Eski uygulamanın anahtar seçimi: ilk dolu değişken. Değer değil, yalnızca adı raporlanır. */
export function encryptionSecretFrom(env) {
  for (const name of KEY_VARIABLES) {
    if (env[name]) return { secret: env[name], source: name };
  }
  return null;
}

function bytesFromBase64(value) {
  return Uint8Array.from(Buffer.from(String(value).replace(/\s/g, ''), 'base64'));
}

/** Eski api/bia-applications.js decryptRecords ile birebir aynı algoritma (AES-256-GCM). */
export async function decryptEnvelope(envelope, secret) {
  if (!envelope || envelope.v !== 1 || !envelope.iv || !envelope.data) throw new TasimaError('zarf biçimi geçersiz');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['decrypt']);
  let plaintext;
  try {
    plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytesFromBase64(envelope.iv) }, key, bytesFromBase64(envelope.data));
  } catch {
    throw new TasimaError('şifre çözülemedi (anahtar yanlış ya da veri bozuk)');
  }
  let records;
  try {
    records = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plaintext));
  } catch {
    throw new TasimaError('çözülen veri JSON değil'); // ayrıştırıcı mesajı içerik parçası içerebilir; yazılmaz
  }
  if (!Array.isArray(records)) throw new TasimaError('çözülen veri kayıt dizisi değil');
  return records;
}

/** Anahtar sırasından bağımsız, derin ve kararlı JSON (JSONB anahtarları yeniden sıralar). */
export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => (item === undefined ? 'null' : canonicalJson(item))).join(',')}]`;
  return `{${Object.keys(value).filter((key) => value[key] !== undefined).sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}

const fingerprint = (records) => createHash('sha256').update(canonicalJson(records)).digest('hex');

async function readSource(kaynak, secret) {
  let rows;
  try {
    ({ rows } = await kaynak.query(
      `SELECT archive_name, envelope, version::text AS version, updated_at::text AS updated_at
       FROM ${SOURCE_TABLE} ORDER BY archive_name`, []));
  } catch (error) {
    if (error?.code === '42P01') throw new TasimaError(`kaynakta ${SOURCE_TABLE} tablosu yok`);
    throw error;
  }
  const archives = [];
  for (const row of rows) {
    let records;
    try {
      const envelope = typeof row.envelope === 'string' ? JSON.parse(row.envelope) : row.envelope;
      records = await decryptEnvelope(envelope, secret);
    } catch (error) {
      throw new TasimaError(`${row.archive_name}: ${error instanceof TasimaError ? error.message : 'zarf okunamadı'}`);
    }
    const text = JSON.stringify(records);
    archives.push({
      name: row.archive_name, version: String(row.version), updatedAt: String(row.updated_at),
      records, text, count: records.length, bytes: Buffer.byteLength(text), hash: fingerprint(records)
    });
  }
  return archives;
}

async function readTarget(hedef) {
  const { rows } = await hedef.query(
    `SELECT archive_name, data, version::text AS version, updated_at::text AS updated_at
     FROM ${ARCHIVE_TABLE} ORDER BY archive_name`, []);
  return rows.map((row) => {
    const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    return { name: row.archive_name, version: String(row.version), updatedAt: String(row.updated_at), records: data,
      count: Array.isArray(data) ? data.length : -1, hash: fingerprint(data), canonical: canonicalJson(data) };
  });
}

/** İki tarafı karşılaştırır; farkları (içerik değil, yalnızca hangi alanın farklı olduğu) döndürür. */
export function compareArchives(expected, actual) {
  const problems = [];
  if (expected.length !== actual.length) problems.push(`arşiv sayısı farklı: kaynak ${expected.length}, hedef ${actual.length}`);
  const byName = new Map(actual.map((archive) => [archive.name, archive]));
  for (const source of expected) {
    const target = byName.get(source.name);
    if (!target) { problems.push(`${source.name}: hedefte yok`); continue; }
    if (target.version !== source.version) problems.push(`${source.name}: sürüm farklı (${source.version} / ${target.version})`);
    if (target.updatedAt !== source.updatedAt) problems.push(`${source.name}: son değişiklik zamanı farklı`);
    if (target.count !== source.count) problems.push(`${source.name}: kayıt sayısı farklı (${source.count} / ${target.count})`);
    if ((target.canonical ?? canonicalJson(target.records)) !== canonicalJson(source.records)) problems.push(`${source.name}: içerik farklı`);
  }
  for (const target of actual) if (!expected.some((source) => source.name === target.name)) problems.push(`${target.name}: kaynakta yok`);
  return problems;
}

function report(log, archives) {
  log('arşiv                     sürüm   kayıt       bayt  sha256 (ilk 16)');
  for (const archive of archives) {
    log(`${archive.name.padEnd(24)} ${archive.version.padStart(6)} ${String(archive.count).padStart(7)} ${String(archive.bytes ?? '').padStart(10)}  ${archive.hash.slice(0, 16)}`);
  }
  const total = archives.reduce((sum, archive) => sum + archive.count, 0);
  log(`toplam: ${archives.length} arşiv, ${total} kayıt`);
}

/**
 * Taşımayı yapar. `kaynak` ve `hedef`, `query(text, params) → { rows }` sunan bağlantılardır
 * (pg.Client; testlerde PGlite). Başarısızlıkta hedefte hiçbir değişiklik kalmaz.
 */
export async function arsivleriAc({ kaynak, hedef, secret, kuru = false, log = console.log }) {
  if (!secret) throw new TasimaError(`şifre çözme anahtarı yok (${KEY_VARIABLES.join(', ')})`);
  await kaynak.query("SET TIME ZONE 'UTC'", []);
  const archives = await readSource(kaynak, secret);
  if (!archives.length) throw new TasimaError(`kaynakta hiç arşiv yok (${SOURCE_TABLE} boş)`);
  log('kaynak arşivler çözüldü:');
  report(log, archives);

  if (kuru) {
    if (hedef) {
      const { rows } = await hedef.query(`SELECT to_regclass('${ARCHIVE_TABLE}') IS NOT NULL AS var`, []);
      const count = rows[0]?.var ? Number((await hedef.query(`SELECT count(*)::int AS n FROM ${ARCHIVE_TABLE}`, [])).rows[0].n) : 0;
      log(count ? `hedefte ${count} arşiv var: gerçek taşıma reddedilir.` : 'hedef boş: taşımaya hazır.');
    }
    log('kuru çalışma: hiçbir şey yazılmadı.');
    return { written: false, archives };
  }
  if (!hedef) throw new TasimaError('hedef veritabanı (DATABASE_URL) yok');

  await hedef.query("SET TIME ZONE 'UTC'", []);
  await hedef.query('BEGIN', []);
  try {
    await hedef.query(ARCHIVE_SCHEMA_SQL, []);
    // Taşıma sürerken uygulamanın bu tabloya yazmasını engeller (okuma serbest).
    await hedef.query(`LOCK TABLE ${ARCHIVE_TABLE} IN EXCLUSIVE MODE`, []);
    const existing = Number((await hedef.query(`SELECT count(*)::int AS n FROM ${ARCHIVE_TABLE}`, [])).rows[0].n);
    if (existing) throw new TasimaError(`hedefte zaten ${existing} arşiv var; hiçbir şey üzerine yazılmadı`);
    for (const archive of archives) {
      await hedef.query(
        `INSERT INTO ${ARCHIVE_TABLE} (archive_name, data, version, updated_at) VALUES ($1, $2::jsonb, $3::bigint, $4::timestamptz)`,
        [archive.name, archive.text, archive.version, archive.updatedAt]
      );
    }
    // Doğrulama: hedef işlemin içinden, kaynak baştan okunup yeniden çözülür.
    const [written, fresh] = await Promise.all([readTarget(hedef), readSource(kaynak, secret)]);
    const problems = [...compareArchives(archives, fresh).map((problem) => `kaynak taşıma sırasında değişti: ${problem}`),
      ...compareArchives(fresh, written)];
    if (problems.length) throw new TasimaError(`doğrulama başarısız:\n  - ${problems.join('\n  - ')}`);
    await hedef.query('COMMIT', []);
  } catch (error) {
    await hedef.query('ROLLBACK', []).catch(() => {});
    if (error instanceof TasimaError) throw new TasimaError(`${error.message}\nişlem geri alındı; hedefte değişiklik yok.`);
    throw error;
  }

  // İşlem kapandıktan sonra son bir kez: kalıcı yazılanlar beklenenle aynı mı?
  const committed = await readTarget(hedef);
  const after = compareArchives(archives, committed);
  if (after.length) {
    const error = new TasimaError(`KAYIT SONRASI DOĞRULAMA BAŞARISIZ (işlem kaydedildi):\n  - ${after.join('\n  - ')}\n` +
      `${ARCHIVE_TABLE} tablosunu boşaltıp taşımayı yeniden çalıştırın.`);
    error.afterCommit = true;
    throw error;
  }
  log(`yazıldı ve doğrulandı: ${archives.length} arşiv, ${archives.reduce((sum, archive) => sum + archive.count, 0)} kayıt (sürümler ve zamanlar korundu).`);
  return { written: true, archives };
}

function safeMessage(error) {
  if (error instanceof TasimaError) return error.message;
  // pg hatalarının ayrıntı (detail/where) alanları veri parçası içerebilir; yalnızca kod ve mesaj.
  return `${error?.code ? `${error.code} ` : ''}${String(error?.message || error).replace(/\s+/g, ' ').slice(0, 300)}`;
}

async function main(argv, env) {
  const args = argv.slice(2);
  const unknown = args.filter((arg) => arg !== '--kuru');
  if (unknown.length) {
    console.error(`bilinmeyen seçenek: ${unknown.join(' ')}\nkullanım: node sunucu/tasima/arsivleri-ac.mjs [--kuru]`);
    return 1;
  }
  const kuru = args.includes('--kuru');
  const key = encryptionSecretFrom(env);
  if (!env.KAYNAK_DATABASE_URL) { console.error('KAYNAK_DATABASE_URL gerekli (eski Neon veritabanı).'); return 1; }
  if (!kuru && !env.DATABASE_URL) { console.error('DATABASE_URL gerekli (yeni veritabanı).'); return 1; }
  if (!key) { console.error(`şifre çözme anahtarı gerekli: ${KEY_VARIABLES.join(' / ')}`); return 1; }
  console.log(`anahtar kaynağı: ${key.source}${kuru ? ' · kuru çalışma' : ''}`);

  const { default: pg } = await import('pg');
  const connect = async (connectionString) => {
    const client = new pg.Client({ connectionString, connectionTimeoutMillis: 15_000, application_name: 'birlikte-arsiv-tasima' });
    await client.connect();
    return client;
  };
  let kaynak;
  let hedef;
  try {
    kaynak = await connect(env.KAYNAK_DATABASE_URL);
    if (env.DATABASE_URL) hedef = await connect(env.DATABASE_URL);
    await arsivleriAc({ kaynak, hedef, secret: key.secret, kuru });
    return 0;
  } catch (error) {
    console.error(`HATA: ${safeMessage(error)}`);
    return error?.afterCommit ? 2 : 1;
  } finally {
    await Promise.all([kaynak?.end().catch(() => {}), hedef?.end().catch(() => {})]);
  }
}

const isMain = (() => {
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
})();
if (isMain) process.exitCode = await main(process.argv, process.env);
