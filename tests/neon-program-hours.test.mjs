import test, { beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { neonConfig } from '@neondatabase/serverless';
import handler from '../api/bia-applications.js';
import { programDay } from '../api/_bia-program-hours.js';

// Exercise the real handler, encryption and Neon driver. Only the remote SQL
// service is replaced; tests never connect to a production database.
process.env.BIA_APPLICATIONS_STORAGE = 'neon';
process.env.DATABASE_URL = 'postgresql://test:test@program-test.neon.tech/test';
process.env.BIA_JWT_SECRET = 'program-test-jwt-secret';
process.env.BIA_APPLICATIONS_ENCRYPTION_KEY = 'program-test-encryption-secret';

const planning = 'planning.enc.json';
const slots = ['15:00-15:20', '15:20-15:40', '15:40-16:00'];
const today = programDay();
const yesterday = programDay(new Date(Date.now() - 86400000).toISOString());
const originalFetch = neonConfig.fetchFunction;
let archives, writes, failWrite, beforeUpdate, queries;

function result(fields, rows) {
  return Response.json({ fields: fields.map(([name, dataTypeID]) => ({ name, dataTypeID })), rows });
}

neonConfig.fetchFunction = async (url, options) => {
  assert.equal(new URL(url).hostname, 'api.neon.tech');
  assert.equal(options.headers['Neon-Connection-String'], process.env.DATABASE_URL);
  const { query, params } = JSON.parse(options.body);
  queries.push(query);
  if (query.startsWith('SELECT envelope, version')) {
    const row = archives.get(params[0]);
    return result([['envelope', 3802], ['version', 20]], row ? [[JSON.stringify(row.envelope), String(row.version)]] : []);
  }
  if (query.startsWith('SELECT archive_name, envelope, version')) {
    return result([['archive_name', 25], ['envelope', 3802], ['version', 20]],
      [...archives].map(([name, row]) => [name, JSON.stringify(row.envelope), String(row.version)]));
  }
  assert.match(query, /^(INSERT INTO|UPDATE) bia_encrypted_archives/);
  writes += 1;
  if (failWrite) return new Response('Database unavailable', { status: 503 });
  if (beforeUpdate) { const effect = beforeUpdate; beforeUpdate = null; await effect(); }
  const [name, envelope, expectedVersion] = params;
  const current = archives.get(name);
  const inserting = query.startsWith('INSERT');
  if (inserting ? current : !current || current.version !== Number(expectedVersion)) return result([['version', 20]], []);
  const version = inserting ? 1 : current.version + 1;
  archives.set(name, { envelope: JSON.parse(envelope), version });
  return result([['version', 20]], [[String(version)]]);
};
after(() => { neonConfig.fetchFunction = originalFetch; });

async function encrypted(records) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(process.env.BIA_APPLICATIONS_ENCRYPTION_KEY));
  const key = await crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(records)));
  return { v: 1, alg: 'AES-256-GCM', iv: Buffer.from(iv).toString('base64'), data: Buffer.from(data).toString('base64') };
}

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
  archives = new Map([[planning, { envelope: await encrypted(records()), version: 1 }],
    ['2026-10.enc.json', { envelope: await encrypted([]), version: 1 }]]);
  writes = 0; failWrite = false; beforeUpdate = null; queries = [];
});

test('Neon save persists encrypted program, assignments and attendance together and reads back in a fresh request', async () => {
  const applicationArchive = structuredClone(archives.get('2026-10.enc.json'));
  const saved = await request(edit({ changes: [edit().changes[0], changes()[1], { previousSlot: '', slot: '19:00-19:20' }] }));
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.equal(saved.body.ok, true);
  assert.equal(writes, 1, 'one atomic encrypted archive write');
  assert.equal(archives.get(planning).version, 2);
  assert.equal(archives.get(planning).envelope.alg, 'AES-256-GCM');
  assert.ok(!JSON.stringify(archives.get(planning).envelope).includes('Korunacak not'));
  assert.deepEqual(archives.get('2026-10.enc.json'), applicationArchive);
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

test('Neon teacher-specific save and reset preserve other teachers and the general program', async () => {
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

test('two simultaneous Neon program saves cannot overwrite one another', async () => {
  const outcomes = await Promise.all([request(edit()), request(edit({ changes: [{ previousSlot: slots[0], slot: '13:00-13:20' }, ...changes(slots.slice(1))] }))]);
  assert.deepEqual(outcomes.map((item) => item.status).sort(), [200, 409]);
  assert.match(outcomes.find((item) => item.status === 409).body.error, /Sayfayı yenileyip/);
  const winner = outcomes.find((item) => item.status === 200);
  const fresh = (await request()).body;
  assert.equal(fresh.meta.programRevision, 1);
  assert.deepEqual(fresh.meta.timeSlots, winner.body.data.slots);
  assert.equal(archives.get(planning).version, 2);
});

test('Neon archive conflict retries preserve an unrelated concurrent update', async () => {
  beforeUpdate = async () => {
    archives.set(planning, { version: 2, envelope: await encrypted([...records(),
      { kind: 'holiday', id: 'concurrent-holiday', date: today, applicationType: 'yuz-yuze' }]) });
  };
  assert.equal((await request(edit())).status, 200);
  assert.equal(writes, 2);
  assert.equal(archives.get(planning).version, 3);
  const fresh = (await request()).body;
  assert.equal(fresh.holidays[0].id, 'concurrent-holiday');
  assert.equal(fresh.meta.timeSlots[0], '14:00-14:20');
});

test('Neon write failure reports failure, preserves the archive and permits a clean retry', async () => {
  const before = structuredClone(archives.get(planning));
  failWrite = true;
  const failed = await request(edit());
  assert.equal(failed.status, 500);
  assert.ok(failed.body.error);
  assert.ok(!failed.body.ok);
  assert.deepEqual(archives.get(planning), before);
  failWrite = false;
  assert.equal((await request(edit())).status, 200);
  assert.equal((await request()).body.meta.timeSlots[0], '14:00-14:20');
});

test('invalid, occupied and stale changes perform no Neon write', async () => {
  const before = structuredClone(archives.get(planning));
  for (const [body, status] of [[edit({ revision: 9 }), 409], [edit({ changes: changes(slots.slice(1)) }), 409],
    [edit({ changes: [{ slot: '24:00-24:20' }] }), 400], [edit({ changes: [{ slot: '15:00-15:30' }, { slot: '15:20-15:40' }] }), 400]]) {
    assert.equal((await request(body)).status, status);
  }
  assert.equal(writes, 0);
  assert.deepEqual(archives.get(planning), before);
});

test('first program save creates a missing Neon archive and anonymous or teacher sessions cannot write', async () => {
  archives.delete(planning);
  const body = edit({ changes: [{ slot: '09:00-09:20' }] });
  assert.equal((await request(body, null)).status, 401);
  assert.equal((await request(body, 'teacher')).status, 401);
  assert.equal(queries.length, 0);
  assert.equal((await request(body)).status, 200);
  assert.equal(archives.get(planning).version, 1);
  assert.deepEqual((await request()).body.meta.timeSlots, ['09:00-09:20']);
});
