import { neon } from '@neondatabase/serverless';

let clientUrl = '';
let client = null;

export function neonSql() {
  const databaseUrl = process.env.DATABASE_URL || '';
  if (!databaseUrl) throw new Error('Neon veritabanı bağlantısı yapılandırılmamış.');
  if (!client || clientUrl !== databaseUrl) {
    clientUrl = databaseUrl;
    client = neon(databaseUrl);
  }
  return client;
}

export async function ensureArchiveSchema() {
  const sql = neonSql();
  await sql`CREATE TABLE IF NOT EXISTS bia_encrypted_archives (
    archive_name text PRIMARY KEY,
    envelope jsonb NOT NULL,
    version bigint NOT NULL DEFAULT 1,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
}

export async function readArchiveEnvelope(name) {
  const rows = await neonSql()(
    'SELECT envelope, version FROM bia_encrypted_archives WHERE archive_name = $1 LIMIT 1',
    [name]
  );
  return rows[0] || null;
}

export async function listArchiveEnvelopes() {
  return neonSql()('SELECT archive_name, envelope, version FROM bia_encrypted_archives ORDER BY archive_name', []);
}

export async function insertArchiveEnvelope(name, envelope) {
  return neonSql()(
    'INSERT INTO bia_encrypted_archives (archive_name, envelope, version) VALUES ($1, $2::jsonb, 1) ON CONFLICT (archive_name) DO NOTHING RETURNING version',
    [name, JSON.stringify(envelope)]
  );
}

export async function updateArchiveEnvelope(name, envelope, expectedVersion) {
  return neonSql()(
    'UPDATE bia_encrypted_archives SET envelope = $2::jsonb, version = version + 1, updated_at = now() WHERE archive_name = $1 AND version = $3 RETURNING version',
    [name, JSON.stringify(envelope), expectedVersion]
  );
}
