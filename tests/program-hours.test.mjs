import test from 'node:test';
import assert from 'node:assert/strict';
import { applyProgramHours, availableProgramSlots, programHours, programDay, scheduleForDate, teacherProgramSlots } from '../api/_bia-program-hours.js';

const slots = ['15:00-15:20', '15:20-15:40', '15:40-16:00'];
const at = '2026-10-22T09:00:00Z';
const teacher = (id, programSlots) => ({ kind: 'teacher', id, modes: ['yuz-yuze'], active: true, ...(programSlots ? { programSlots } : {}) });
const placement = (id, teacherId, slot = slots[0]) => ({ kind: 'placement', id, applicationId: id, applicationType: 'yuz-yuze', startDate: '2026-10-01',
  schedule: [{ teacherId, teacherName: teacherId, day: 'persembe', slot }] });
const config = { kind: 'program-hours', id: 'program-hours:yuz-yuze', applicationType: 'yuz-yuze', slots, revision: 0 };
const base = () => [structuredClone(config), teacher('a'), teacher('b'), teacher('c', ['18:00-18:20']), placement('s1', 'a'), placement('s2', 'b'), placement('s3', 'c', '18:00-18:20')];
const rows = (values = slots) => values.map((slot) => ({ previousSlot: slot, slot }));
const edit = (records, changes, revision = 0, options = {}) => applyProgramHours(records, changes, revision, 'Yönetici', options, at);

test('common program adds, retimes and removes unused slots across inherited teachers while preserving custom programs', () => {
  const records = base();
  const result = edit(records, [{ previousSlot: slots[0], slot: '14:00-14:20' }, { previousSlot: slots[1], slot: slots[1] }, { previousSlot: '', slot: '19:00-19:30' }]);
  assert.deepEqual(programHours(result.records).slots, ['14:00-14:20', slots[1], '19:00-19:30']);
  assert.equal(result.value.affectedTeachers, 2);
  assert.equal(result.value.changedLessons, 2);
  assert.equal(result.records.find((item) => item.id === 's1').schedule[0].slot, '14:00-14:20');
  assert.equal(result.records.find((item) => item.id === 's2').schedule[0].slot, '14:00-14:20');
  assert.deepEqual(teacherProgramSlots(result.records, 'c'), ['18:00-18:20']);
  assert.deepEqual(records, base(), 'input records are never partially mutated');
});

test('a selected teacher group changes only those teachers and their assigned lessons', () => {
  const records = base();
  const result = edit(records, [{ previousSlot: slots[0], slot: '14:00-14:30' }, ...rows(slots.slice(1)), { previousSlot: '', slot: '20:00-20:20' }], 0, { scope: 'teachers', teacherIds: ['a'] });
  assert.deepEqual(programHours(result.records).slots, slots);
  assert.deepEqual(teacherProgramSlots(result.records, 'b'), slots);
  assert.equal(result.records.find((item) => item.id === 's2').schedule[0].slot, slots[0]);
  assert.equal(result.records.find((item) => item.id === 's1').schedule[0].slot, '14:00-14:30');
  assert.ok(teacherProgramSlots(result.records, 'a').includes('20:00-20:20'));
  assert.ok(availableProgramSlots(result.records).includes('20:00-20:20'));
  const grouped = edit(records, [...rows(), { previousSlot: '', slot: '19:00-19:20' }], 0, { scope: 'teachers', teacherIds: ['a', 'b'] });
  assert.ok(teacherProgramSlots(grouped.records, 'a').includes('19:00-19:20'));
  assert.ok(teacherProgramSlots(grouped.records, 'b').includes('19:00-19:20'));
  assert.deepEqual(teacherProgramSlots(grouped.records, 'c'), ['18:00-18:20']);
});

test('busy slots cannot be removed and rejecting a change preserves every record', () => {
  const records = base();
  assert.throws(() => edit(records, rows(slots.slice(1))), { status: 409 });
  assert.throws(() => edit(records, rows(slots.slice(1)), 0, { scope: 'teachers', teacherIds: ['a'] }), { status: 409 });
  assert.deepEqual(records, base());
});

test('past schedule and attendance times remain exact, while today keeps saved status and notes attached after a correction', () => {
  const records = base();
  records.push(...['2026-10-21', '2026-10-22'].map((date) => ({ kind: 'attendance', id: date, applicationId: 's1', teacherId: 'a',
    applicationType: 'yuz-yuze', lessonDate: date, slot: slots[0], status: 'katildi', note: 'Özgün not', createdAt: 'original-time' })));
  const result = edit(records, [{ previousSlot: slots[0], slot: '14:00-14:20' }, ...rows(slots.slice(1))]);
  const placed = result.records.find((item) => item.id === 's1');
  assert.equal(scheduleForDate(placed, '2026-10-21')[0].slot, slots[0]);
  assert.equal(scheduleForDate(placed, '2026-10-22')[0].slot, '14:00-14:20');
  assert.equal(result.records.find((item) => item.id === '2026-10-21').slot, slots[0]);
  const today = result.records.find((item) => item.id === '2026-10-22');
  assert.equal(today.slot, '14:00-14:20');
  assert.equal(today.slotAtAttendance, slots[0]);
  assert.equal(today.status, 'katildi'); assert.equal(today.note, 'Özgün not'); assert.equal(today.createdAt, 'original-time');
  const again = edit(result.records, [{ previousSlot: '14:00-14:20', slot: '13:00-13:20' }, ...rows(slots.slice(1))], 1);
  assert.equal(again.records.find((item) => item.id === 's1').programScheduleHistory.length, 1);
  assert.equal(scheduleForDate(again.records.find((item) => item.id === 's1'), '2026-10-21')[0].slot, slots[0]);
});

test('stale editors, invalid or overlapping times, duplicate origins and missing teachers are rejected', () => {
  for (const changes of [[{ slot: '15:10-15:30' }, ...rows()], [{ slot: '19:30-19:00' }], [{ slot: '24:00-25:00' }], [null],
    [{ previousSlot: slots[0], slot: slots[0] }, { previousSlot: slots[0], slot: slots[1] }]]) {
    assert.throws(() => edit(base(), changes));
  }
  assert.throws(() => edit(base(), rows(), 1), { status: 409 });
  assert.throws(() => edit(base(), rows(), 0, { scope: 'teachers', teacherIds: [] }));
  assert.throws(() => edit(base(), rows(), 0, { scope: 'teachers', teacherIds: ['missing'] }), { status: 409 });
});

test('custom teachers can return to the common template when their assigned lessons fit it', () => {
  const records = base().filter((item) => item.id !== 's3');
  const result = edit(records, [], 0, { scope: 'teachers', teacherIds: ['c'], reset: true });
  assert.ok(!('programSlots' in result.records.find((item) => item.id === 'c')));
  assert.deepEqual(teacherProgramSlots(result.records, 'c'), slots);
  assert.equal(programDay('2026-10-21T22:30:00Z'), '2026-10-22', 'day boundaries follow Istanbul');
});
