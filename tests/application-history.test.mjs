import test from 'node:test';
import assert from 'node:assert/strict';
import { applicationHistory, trackApplicationChanges } from '../api/_bia-application-history.js';

const at = '2026-10-05T10:00:00.000Z';
const app = { id: 'a1', createdAt: '2026-09-08T10:00:00.000Z', status: 'yeni' };
const placement = { kind: 'placement', id: 'p1', applicationId: 'a1', createdAt: '2026-09-28T08:00:00.000Z', updatedAt: '2026-09-29T08:00:00.000Z',
  startDate: '2026-09-28', schedule: [{ day: 'pazartesi', slot: '15:00-15:20', teacherId: 't1', teacherName: 'Test Hoca' }] };

test('application creation, status and note changes share the application archive', () => {
  const created = trackApplicationChanges([], [{ ...app }], { at, actor: 'Veli' });
  assert.equal(created[0].history[0].type, 'application-created');
  assert.equal(created[0].history[0].at, app.createdAt);
  const changed = trackApplicationChanges(structuredClone(created), [{ ...created[0], status: 'uygun', adminNote: 'Planlanacak' }], { at, actor: 'Admin' });
  assert.deepEqual(changed[0].history.slice(1).map((e) => e.type), ['status-changed', 'admin-note-changed']);
  assert.equal(changed[0].history[1].before, 'yeni');
  assert.equal(changed[0].history[1].after, 'uygun');
  const same = trackApplicationChanges(structuredClone(changed), structuredClone(changed), { at });
  assert.equal(same[0].history.length, 3);
});

test('placement deletion including bulk/teacher deletion keeps its previous program atomically', () => {
  const result = trackApplicationChanges([placement], [], { planning: true, actor: 'Admin', at });
  assert.equal(result[0].type, 'legacy-placement');
  assert.equal(result[0].at, placement.updatedAt);
  assert.equal(result[0].legacy, true);
  assert.equal(result[1].type, 'placement-removed');
  assert.equal(result[1].before.schedule[0].teacherName, 'Test Hoca');
  assert.equal(result[1].after, null);
  assert.equal(result[1].at, at);
  assert.equal(applicationHistory(app, result).length, 3);
});

test('same schedule in a different order does not create a false change', () => {
  const schedule = [...placement.schedule, { ...placement.schedule[0], day: 'sali' }];
  const old = { ...placement, schedule };
  const next = { ...old, schedule: [...schedule].reverse(), updatedAt: at };
  assert.equal(trackApplicationChanges([old], [next], { planning: true, at }).length, 1);
});

test('multiple placements changed in one write have separate histories and no unrelated events', () => {
  const p2 = { ...placement, id: 'p2', applicationId: 'a2' };
  const records = trackApplicationChanges([placement, p2], [], { planning: true, at });
  assert.equal(records.filter((e) => e.type === 'placement-removed').length, 2);
  assert.ok(applicationHistory(app, records).every((e) => !e.applicationId || e.applicationId === 'a1'));
});

test('legacy application history only uses known dates and labels old snapshots', () => {
  const history = applicationHistory(app, [placement]);
  assert.equal(history.length, 2);
  assert.ok(history.every((e) => e.legacy));
  assert.equal(history.find((e) => e.type === 'application-created').at, app.createdAt);
  assert.equal(history.find((e) => e.type === 'legacy-placement').at, placement.updatedAt);
});

test('legacy records without dates never receive a guessed historical date', () => {
  const { createdAt, updatedAt, ...undated } = placement;
  const result = trackApplicationChanges([undated], [], { planning: true, at });
  assert.equal(result.find((e) => e.type === 'legacy-placement').at, '');
  assert.equal(result.find((e) => e.type === 'placement-removed').at, at);
});
