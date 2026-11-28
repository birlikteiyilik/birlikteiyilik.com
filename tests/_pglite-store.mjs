// Testler için bellekte çalışan gerçek PostgreSQL (PGlite). Ağa ya da canlı veritabanına
// bağlanmaz. Uygulamanın deposu (api/_bia-store.js) bu yürütücüyle çalışır; yazma
// sayısı, yazma hatası ve yazmadan hemen önce araya giren başka bir yazma taklit edilebilir.
import { PGlite } from '@electric-sql/pglite';
import { ARCHIVE_TABLE, configureStore, ensureArchiveSchema } from '../api/_bia-store.js';

const WRITE = new RegExp(`^\\s*(INSERT INTO|UPDATE) ${ARCHIVE_TABLE}\\b`);

export async function createTestStore() {
  const db = new PGlite();
  await db.waitReady;
  const state = { queries: [], writes: 0, failWrite: null, beforeWrite: null };
  const executor = {
    async query(text, params = []) {
      state.queries.push(text);
      if (WRITE.test(text)) {
        state.writes += 1;
        if (state.failWrite) throw state.failWrite;
        if (state.beforeWrite) {
          const effect = state.beforeWrite;
          state.beforeWrite = null;
          await effect(db);
        }
      }
      return db.query(text, params);
    },
    async end() {}
  };

  async function seed(name, records, version = 1) {
    await db.query(
      `INSERT INTO ${ARCHIVE_TABLE} (archive_name, data, version) VALUES ($1, $2::jsonb, $3)
       ON CONFLICT (archive_name) DO UPDATE SET data = EXCLUDED.data, version = EXCLUDED.version, updated_at = now()`,
      [name, JSON.stringify(records), version]
    );
  }

  /** Tabloyu boşaltır, depoyu bu yürütücüye bağlar ve verilen arşivleri ekler. */
  async function reset(archives = {}) {
    await db.query(`DROP TABLE IF EXISTS ${ARCHIVE_TABLE}`);
    configureStore(executor);
    await ensureArchiveSchema();
    for (const [name, value] of Object.entries(archives)) {
      const { records, version } = Array.isArray(value) ? { records: value, version: 1 } : value;
      await seed(name, records, version);
    }
    state.queries = [];
    state.writes = 0;
    state.failWrite = null;
    state.beforeWrite = null;
  }

  async function row(name) {
    const { rows } = await db.query(`SELECT data, version FROM ${ARCHIVE_TABLE} WHERE archive_name = $1`, [name]);
    return rows[0] ? { data: rows[0].data, version: Number(rows[0].version) } : null;
  }

  async function names() {
    const { rows } = await db.query(`SELECT archive_name FROM ${ARCHIVE_TABLE} ORDER BY archive_name`);
    return rows.map((item) => item.archive_name);
  }

  async function close() {
    configureStore(null);
    await db.close();
  }

  return { db, executor, state, seed, reset, row, names, close };
}
