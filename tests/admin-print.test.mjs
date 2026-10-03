import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/admin-applications.js', import.meta.url), 'utf8');
const weekdays = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma'];
const days = { pazartesi: 'Pazartesi', sali: 'Salı', carsamba: 'Çarşamba', persembe: 'Perşembe', cuma: 'Cuma' };
const extract = (name) => {
  const start = source.indexOf(`  function ${name}(`);
  return source.slice(start, source.indexOf('\n  function ', start + 1));
};

export function renderNoteSheet(records) {
  const root = { innerHTML: '' };
  let printed = false;
  const context = {
    meta: { weekdays }, activeApplicationType: 'yuz-yuze',
    labels: { days, type: { 'yuz-yuze': 'Yüz yüze' } },
    programEntries: () => records,
    programTeachers: () => [{ id: 'teacher', name: 'Örnek Öğretmen' }],
    slotsForType: () => [...new Set(records.map((entry) => entry.slot))].sort(),
    el: () => root,
    escapeHtml: (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]),
    toast: (message) => { throw new Error(message); },
    document: { body: { classList: { add() {} } } },
    window: { setTimeout: (callback) => callback(), print: () => { printed = true; } }
  };
  vm.createContext(context);
  vm.runInContext(['rangeMinutes', 'printTeacherProgram'].map(extract).join('\n'), context);
  vm.runInContext("printTeacherProgram('teacher')", context);
  return { html: root.innerHTML, printed };
}

test('teacher note sheet has chronological students, five daily note columns, and no attendance grid', () => {
  const records = [
    { applicationId: 'a', studentName: 'Ali Geç', day: 'pazartesi', slot: '17:40-18:00' },
    { applicationId: 'z', studentName: 'Zeynep Erken', day: 'cuma', slot: '15:00-15:20' },
    { applicationId: 'm', studentName: 'Mehmet Çok Gün', day: 'pazartesi', slot: '17:00-17:20' },
    { applicationId: 'm', studentName: 'Mehmet Çok Gün', day: 'sali', slot: '15:20-15:40' },
    { applicationId: 'b', studentName: 'Buse Aynı Saat', day: 'carsamba', slot: '15:20-15:40' },
    { applicationId: 'other', studentName: 'Başka Hoca', day: 'sali', slot: '15:00-15:20', teacherId: 'other' }
  ].map((entry) => ({ teacherId: 'teacher', ...entry }));
  const { html, printed } = renderNoteSheet(records);
  assert.deepEqual([...html.matchAll(/class="print-student-name"><strong>(.*?)<\/strong>/g)].map((match) => match[1]),
    ['Zeynep Erken', 'Buse Aynı Saat', 'Mehmet Çok Gün', 'Ali Geç']);
  assert.equal((html.match(/<table /g) || []).length, 1);
  assert.equal((html.match(/class="print-note-day"/g) || []).length, 5);
  assert.equal((html.match(/class="print-note-space"/g) || []).length, 5);
  assert.equal((html.match(/class="print-note-cell is-off"/g) || []).length, 15);
  assert.ok(html.includes('Pa') && html.includes('17.00 – 17.20') && html.includes('15.20 – 15.40'));
  assert.ok(!/attendance-box|YOKLAMA|\. hafta|Başka Hoca/.test(html));
  assert.ok(printed);
});

test('student and teacher content is escaped in the print document', () => {
  const { html } = renderNoteSheet([{ teacherId: 'teacher', applicationId: 'x', studentName: '<script>example</script>', day: 'sali', slot: '15:00-15:20' }]);
  assert.ok(html.includes('&lt;script&gt;example&lt;/script&gt;'));
  assert.ok(!html.includes('<script>'));
});
