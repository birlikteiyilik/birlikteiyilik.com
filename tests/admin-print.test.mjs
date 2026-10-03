import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/admin-applications.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../css/admin-applications.css', import.meta.url), 'utf8');
const weekdays = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma'];
const days = { pazartesi: 'Pazartesi', sali: 'Salı', carsamba: 'Çarşamba', persembe: 'Perşembe', cuma: 'Cuma' };
const extract = (name) => {
  const start = source.indexOf(`  function ${name}(`);
  return source.slice(start, source.indexOf('\n  function ', start + 1));
};

test('portrait note sheet reserves more than half the printable width for notes', () => {
  assert.match(styles, /teacher-print-sheet[^}]*padding: 5mm 2mm/);
  const width = (column) => Number(styles.match(new RegExp(`\\.print-${column}-col \\{ width: (\\d+)mm;`))[1]);
  const infoWidth = ['number', 'time', 'student', 'days'].reduce((sum, column) => sum + width(column), 0);
  assert.equal(infoWidth, 87);
  const noteWidth = 210 - 4 - infoWidth;
  assert.equal(noteWidth, 119);
  assert.ok(noteWidth / 90 >= 1.27);
  assert.match(styles, /print-note-col[^}]*calc\(100% - 87mm\)/);
  assert.match(styles, /@page teacher-notes \{ size: A4 portrait; margin: 0;/);
  assert.match(styles, /teacher-print-page[^}]*page: teacher-notes/);
});

export function renderNoteSheet(records) {
  const root = { innerHTML: '', querySelector: () => null };
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
  vm.runInContext(['rangeMinutes', 'fitTeacherNotePage', 'printTeacherProgram'].map(extract).join('\n'), context);
  vm.runInContext("printTeacherProgram('teacher')", context);
  return { html: root.innerHTML, printed };
}

test('teacher note sheet lists chronological time groups with days and a wide blank note column', () => {
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
    ['Zeynep Erken', 'Buse Aynı Saat', 'Mehmet Çok Gün', 'Mehmet Çok Gün', 'Ali Geç']);
  assert.equal((html.match(/<table /g) || []).length, 1);
  assert.equal((html.match(/class="print-note-space"/g) || []).length, 5);
  assert.ok(html.includes('<th>Saat</th>') && html.includes('<th>Ders günleri</th>'));
  assert.ok(html.includes('Pazartesi') && html.includes('17.00 - 17.20') && html.includes('15.20 - 15.40'));
  assert.ok(html.includes('4 öğrenci'));
  assert.ok(!/attendance-box|YOKLAMA|\. hafta|Başka Hoca/.test(html));
  assert.ok(printed);
});

test('same student and time groups days together; longer lists stay in one complete sheet without a footer', () => {
  const records = Array.from({ length: 13 }, (_, index) => ['pazartesi', 'sali'].map((day) => ({
    teacherId: 'teacher', applicationId: String(index), studentName: `Öğrenci ${String(index).padStart(2, '0')}`, day, slot: '15:00-15:20'
  }))).flat();
  const { html } = renderNoteSheet([...records, records[0]]);
  assert.equal((html.match(/class="teacher-print-sheet"/g) || []).length, 1);
  assert.equal((html.match(/class="print-student-name"/g) || []).length, 13);
  assert.equal((html.match(/class="print-note-space"/g) || []).length, 13);
  assert.equal((html.match(/<h1>Örnek Öğretmen<\/h1>/g) || []).length, 1);
  assert.equal((html.match(/<span>Pazartesi<\/span>/g) || []).length, 13);
  assert.equal((html.match(/<span>Salı<\/span>/g) || []).length, 13);
  assert.ok(!html.includes('Sayfa ') && !html.includes('<footer>'));
  assert.ok(html.includes('class="print-row-number">13</td>'));
});

test('twelve lesson time groups stay on a single portrait sheet', () => {
  const records = Array.from({ length: 12 }, (_, index) => ({
    teacherId: 'teacher', applicationId: String(index), studentName: `Öğrenci ${index}`, day: 'pazartesi', slot: '15:00-15:20'
  }));
  const { html } = renderNoteSheet(records);
  assert.equal((html.match(/class="teacher-print-sheet"/g) || []).length, 1);
  assert.equal((html.match(/class="print-note-space"/g) || []).length, 12);
  assert.ok(!html.includes('<footer>'));
});

test('one-page fitting uses the full sheet height and does not enlarge shorter lists', () => {
  const sheet = { style: {}, scrollHeight: 2000 };
  const root = { querySelector: (selector) => selector === '.teacher-print-page' ? { clientHeight: 1100 } : sheet, classList: { add() {}, remove() {} } };
  const context = { el: () => root };
  vm.createContext(context);
  vm.runInContext(extract('fitTeacherNotePage'), context);
  vm.runInContext('fitTeacherNotePage()', context);
  assert.equal(sheet.style.transform, 'scale(0.549)');
  sheet.scrollHeight = 800;
  vm.runInContext('fitTeacherNotePage()', context);
  assert.equal(sheet.style.transform, 'scale(1)');
});

test('student and teacher content is escaped in the print document', () => {
  const { html } = renderNoteSheet([{ teacherId: 'teacher', applicationId: 'x', studentName: '<script>example</script>', day: 'sali', slot: '15:00-15:20' }]);
  assert.ok(html.includes('&lt;script&gt;example&lt;/script&gt;'));
  assert.ok(!html.includes('<script>'));
});
