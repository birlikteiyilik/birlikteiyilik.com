import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/bia-applications.js';
import { programDay } from '../api/_bia-program-hours.js';
import { createTestStore } from './_pglite-store.mjs';

// Gerçek işleyici ve gerçek PostgreSQL sorguları (bellekte PGlite). Testler canlı bir
// veritabanına hiçbir zaman bağlanmaz.
process.env.BIA_JWT_SECRET = 'program-test-jwt-secret';

const planning = 'planning.enc.json';
const slots = ['15:00-15:20', '15:20-15:40', '15:40-16:00'];
const today = programDay();
const yesterday = programDay(new Date(Date.now() - 86400000).toISOString());
let store;

before(async () => { store = await createTestStore(); });
after(async () => { await store.close(); });

async function token(role = 'admin') {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ name: 'Test yönetici', role, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  const message = `${header}.${payload}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(process.env.BIA_JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return `${message}.${Buffer.from(signature).toString('base64url')}`;
}

async function request(body, role = 'admin') {
  const headers = { 'Content-Type': 'application/json' };
  if (role) headers.Authorization = `Bearer ${await token(role)}`;
  const response = await handler(new Request('http://localhost/api/bia-applications', {
    headers, ...(body ? { method: 'POST', body: JSON.stringify(body) } : {})
  }));
  return { status: response.status, body: await response.json() };
}
const publicHours = async () => (await handler(new Request('http://localhost/api/bia-applications?action=program-hours'))).json();
const changes = (values = slots) => values.map((slot) => ({ previousSlot: slot, slot }));
const edit = (extra = {}) => ({ action: 'program-hours-save', scope: 'general', revision: 0,
  changes: [{ previousSlot: slots[0], slot: '14:00-14:20' }, ...changes(slots.slice(1))], ...extra });

function records() {
  return [
    { kind: 'program-hours', id: 'program-hours:yuz-yuze', applicationType: 'yuz-yuze', slots, revision: 0 },
    ...['a', 'b', 'c'].map((id) => ({ kind: 'teacher', id, name: `Hoca ${id}`, active: true, modes: ['yuz-yuze'], days: ['persembe'],
      ...(id === 'c' ? { programSlots: ['18:00-18:20'] } : {}) })),
    ...['a', 'b'].map((id) => ({ kind: 'placement', id: `p-${id}`, applicationId: `s-${id}`, applicationType: 'yuz-yuze',
      schedule: [{ teacherId: id, teacherName: `Hoca ${id}`, day: 'persembe', slot: slots[0] }] })),
    ...[yesterday, today].map((date) => ({ kind: 'attendance', id: date, applicationId: 's-a', teacherId: 'a',
      applicationType: 'yuz-yuze', lessonDate: date, slot: slots[0], status: 'katildi', note: 'Korunacak not' }))
  ];
}

beforeEach(async () => {
  await store.reset({ [planning]: records(), '2026-10.enc.json': [] });
});

test('save persists program, assignments and attendance in one plain JSONB write and reads back in a fresh request', async () => {
  const applicationArchive = await store.row('2026-10.enc.json');
  const saved = await request(edit({ changes: [edit().changes[0], changes()[1], { previousSlot: '', slot: '19:00-19:20' }] }));
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.equal(saved.body.ok, true);
  assert.equal(store.state.writes, 1, 'one atomic archive write');
  const stored = await store.row(planning);
  assert.equal(stored.version, 2);
  assert.ok(Array.isArray(stored.data), 'archive is stored as a plain JSON array');
  assert.equal(stored.data.find((item) => item.kind === 'attendance' && item.lessonDate === today).note, 'Korunacak not');
  assert.deepEqual(await store.row('2026-10.enc.json'), applicationArchive);
  const fresh = (await request()).body;
  assert.deepEqual(fresh.meta.timeSlots, ['14:00-14:20', slots[1], '19:00-19:20']);
  assert.equal(fresh.meta.programRevision, 1);
  assert.ok(fresh.placements.every((item) => item.schedule[0].slot === '14:00-14:20'));
  assert.ok(fresh.placements.every((item) => item.programScheduleHistory[0].schedule[0].slot === slots[0]));
  assert.deepEqual(fresh.teachers.find((item) => item.id === 'c').programSlots, ['18:00-18:20']);
  assert.equal(fresh.attendance.find((item) => item.lessonDate === yesterday).slot, slots[0]);
  const present = fresh.attendance.find((item) => item.lessonDate === today);
  assert.equal(present.slot, '14:00-14:20');
  assert.equal(present.status, 'katildi');
  assert.equal(present.note, 'Korunacak not');
});

test('teacher-specific save and reset preserve other teachers and the general program', async () => {
  const before = (await request()).body;
  assert.equal((await request(edit({ scope: 'teachers', teacherIds: ['a'] }))).status, 200);
  const fresh = (await request()).body;
  assert.deepEqual(fresh.meta.timeSlots, slots);
  assert.equal(fresh.teachers.find((item) => item.id === 'a').programSlots[0], '14:00-14:20');
  for (const id of ['b', 'c']) assert.deepEqual(fresh.teachers.find((item) => item.id === id), before.teachers.find((item) => item.id === id));
  assert.deepEqual(fresh.placements.find((item) => item.id === 'p-b'), before.placements.find((item) => item.id === 'p-b'));
  assert.equal((await request(edit({ scope: 'teachers', teacherIds: ['c'], revision: 1, reset: true }))).status, 200);
  assert.ok(!('programSlots' in (await request()).body.teachers.find((item) => item.id === 'c')));
});

test('two simultaneous program saves cannot overwrite one another', async () => {
  const outcomes = await Promise.all([request(edit()), request(edit({ changes: [{ previousSlot: slots[0], slot: '13:00-13:20' }, ...changes(slots.slice(1))] }))]);
  assert.deepEqual(outcomes.map((item) => item.status).sort(), [200, 409]);
  assert.match(outcomes.find((item) => item.status === 409).body.error, /Sayfayı yenileyip/);
  const winner = outcomes.find((item) => item.status === 200);
  const fresh = (await request()).body;
  assert.equal(fresh.meta.programRevision, 1);
  assert.deepEqual(fresh.meta.timeSlots, winner.body.data.slots);
  assert.equal((await store.row(planning)).version, 2);
});

test('archive conflict retries preserve an unrelated concurrent update', async () => {
  store.state.beforeWrite = async (db) => {
    await db.query('UPDATE bia_archives SET data = $2::jsonb, version = 2 WHERE archive_name = $1', [planning,
      JSON.stringify([...records(), { kind: 'holiday', id: 'concurrent-holiday', date: today, applicationType: 'yuz-yuze' }])]);
  };
  assert.equal((await request(edit())).status, 200);
  assert.equal(store.state.writes, 2);
  assert.equal((await store.row(planning)).version, 3);
  const fresh = (await request()).body;
  assert.equal(fresh.holidays[0].id, 'concurrent-holiday');
  assert.equal(fresh.meta.timeSlots[0], '14:00-14:20');
});

test('write failure reports failure, preserves the archive and permits a clean retry', async () => {
  const before = await store.row(planning);
  store.state.failWrite = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), { code: 'ECONNREFUSED' });
  const failed = await request(edit());
  assert.equal(failed.status, 500);
  assert.ok(failed.body.error);
  assert.ok(!failed.body.ok);
  assert.deepEqual(await store.row(planning), before);
  store.state.failWrite = null;
  assert.equal((await request(edit())).status, 200);
  assert.equal((await request()).body.meta.timeSlots[0], '14:00-14:20');
});

test('invalid, occupied and stale changes perform no write', async () => {
  const before = await store.row(planning);
  for (const [body, status] of [[edit({ revision: 9 }), 409], [edit({ changes: changes(slots.slice(1)) }), 409],
    [edit({ changes: [{ slot: '24:00-24:20' }] }), 400], [edit({ changes: [{ slot: '15:00-15:30' }, { slot: '15:20-15:40' }] }), 400]]) {
    assert.equal((await request(body)).status, status);
  }
  assert.equal(store.state.writes, 0);
  assert.deepEqual(await store.row(planning), before);
});

test('first program save creates a missing archive and anonymous or teacher sessions cannot write', async () => {
  await store.reset({});
  const body = edit({ changes: [{ slot: '09:00-09:20' }] });
  assert.equal((await request(body, null)).status, 401);
  assert.equal((await request(body, 'teacher')).status, 401);
  assert.equal(store.state.queries.length, 0);
  assert.equal((await request(body)).status, 200);
  assert.equal((await store.row(planning)).version, 1);
  assert.deepEqual((await request()).body.meta.timeSlots, ['09:00-09:20']);
});

test('public program hours are cached until the planning archive changes, including changes made outside the app', async () => {
  const first = await publicHours();
  assert.deepEqual(first.slots, [...slots, '18:00-18:20']);
  store.state.queries = [];
  assert.deepEqual(await publicHours(), first);
  assert.equal(store.state.queries.length, 1, 'a cached answer costs one small version query');
  assert.ok(!/\bdata\b/.test(store.state.queries[0]), 'the archive body is not read again');

  assert.equal((await request(edit())).status, 200);
  assert.equal((await publicHours()).slots[0], '14:00-14:20', 'a save through the app invalidates the cache');

  // Yedekten geri yükleme gibi uygulama dışı bir yazma, sürüm numarası aynı kalsa bile görülür.
  const { version } = await store.row(planning);
  await store.db.query('UPDATE bia_archives SET data = $2::jsonb WHERE archive_name = $1', [planning,
    JSON.stringify([{ kind: 'program-hours', id: 'program-hours:yuz-yuze', applicationType: 'yuz-yuze', slots: ['10:00-10:20'], revision: 5 }])]);
  assert.equal((await store.row(planning)).version, version);
  assert.deepEqual(await publicHours(), { ok: true, slots: ['10:00-10:20'], revision: 5 });
});

test('panel reads list archive versions instead of whole archives and reuse unchanged archives', async () => {
  assert.equal((await request()).status, 200);
  store.state.queries = [];
  assert.equal((await request()).status, 200);
  const dataReads = store.state.queries.filter((text) => /CASE WHEN version/.test(text));
  assert.ok(store.state.queries.some((text) => /SELECT archive_name, version, xmin::text AS xmin FROM bia_archives ORDER BY/.test(text)));
  assert.ok(dataReads.length <= 1, 'only the planning archive is version-checked; listed archives come from memory');
});
