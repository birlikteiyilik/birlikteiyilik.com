import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({});
vm.runInContext(readFileSync(new URL('../js/admin-program-excel.js', import.meta.url), 'utf8'), context);
const { selectProgram, buildWorkbook, palette } = context.BIAProgramExcel;
const module = { exports: {} };
// Exercise the exact locally bundled browser exporter; no remote dependency in tests.
new Function('module', 'exports', readFileSync(new URL('../js/vendor/exceljs-4.4.0.min.js', import.meta.url), 'utf8'))(module, module.exports);
const ExcelJS = module.exports;
const days = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma'];
const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
const slots = Array.from({ length: 9 }, (_, i) => {
  const time = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  return `${time(900 + i * 20)}-${time(920 + i * 20)}`;
});
const teachers = [
  { id: 'a', name: 'Ahmet Örnek', gender: 'erkek', active: true, days },
  { id: 'b', name: 'Hatice Kübra Örnek', gender: 'kadin', active: true, days: ['pazartesi', 'carsamba', 'cuma'] },
  { id: 'c', name: 'Mehmet Arşiv', gender: 'erkek', active: false, days }
];
const entries = [
  { teacherId: 'a', day: 'pazartesi', slot: slots[0], studentName: 'Ali Talha Örnek', applicationId: '1' },
  { teacherId: 'a', day: 'sali', slot: slots[1], studentName: 'Ahmet Enver Uzun Öğrenci Adı', applicationId: '2' },
  { teacherId: 'b', day: 'pazartesi', slot: slots[0], studentName: 'Hatice Kübra Uzun Öğrenci Adı', applicationId: '3' },
  { teacherId: 'b', day: 'sali', slot: slots[2], studentName: 'Elif Özel Gün', applicationId: '4' }
];
const select = (filters = {}) => selectProgram({ teachers, entries, days, slots, filters });
const workbookFor = (view) => buildWorkbook(ExcelJS, { ...view, days: view.days.map((id) => ({ id, label: dayNames[days.indexOf(id)] })) }, {
  date: '2026-10-03', filterLabel: 'Tüm hocalar · Tüm hafta · Tüm saatler'
});

test('gender, teacher, day and slot filters share the board/export selection, including available teachers', () => {
  assert.deepEqual(Array.from(select({ gender: 'kadin' }).teachers, (teacher) => teacher.id), ['b']);
  assert.deepEqual(Array.from(select({ gender: 'erkek' }).teachers, (teacher) => teacher.id), ['a', 'c']);
  assert.equal(select({ teacher: 'b', gender: 'erkek' }).teachers.length, 0);
  const view = select({ gender: 'erkek', day: 'cuma', slot: slots[8] });
  assert.equal(view.teachers.length, 2);
  assert.equal(view.slots.length, 1);
  assert.equal(view.days.length, 1);
  assert.equal(view.cell(teachers[0], 'cuma', slots[8]).state, 'open');
});

test('only genuinely available hours are green; search-hidden and off-working-day assignments remain occupied', () => {
  const view = select({ query: 'Ali Talha' });
  assert.equal(view.teachers.length, 1);
  assert.equal(view.cell(teachers[0], 'sali', slots[1]).text, 'Dolu (filtre dışı)');
  assert.equal(view.cell(teachers[0], 'sali', slots[1]).state, 'busy');
  assert.equal(select().cell(teachers[1], 'sali', slots[2]).state, 'busy');
  assert.equal(select().cell(teachers[1], 'sali', slots[0]).state, 'off');
  assert.equal(select().cell(teachers[2], 'pazartesi', slots[0]).state, 'off');
});

test('general worksheet matches the reference: times in rows, teachers in columns and working days below names', () => {
  const wb = workbookFor(select());
  assert.equal(wb.worksheets.length, 2);
  const [general, individual] = wb.worksheets;
  assert.equal(general.getCell('A5').value, 'Hocalar');
  assert.equal(general.getCell('B5').value, teachers[0].name);
  assert.equal(general.getCell('C5').value, teachers[1].name);
  assert.equal(general.getCell('A6').value, 'Gün / Saat');
  assert.equal(general.getCell('B6').value, dayNames.join(' · '));
  assert.equal(general.getCell('A7').value, '15.00 – 15.20');
  assert.equal(general.getCell('A8').value, '15.20 – 15.40');
  assert.ok(general.getCell('B7').value.startsWith(entries[0].studentName + '\nPzt'));
  assert.ok(general.getCell('B7').value.includes('Müsait: Sal · Çar · Per · Cum'));
  assert.equal(general.getCell('B7').fill.fgColor.argb, palette.busy);
  assert.equal(general.getCell('B9').fill.fgColor.argb, palette.open);
  assert.equal(general.getCell('D7').fill.fgColor.argb, palette.off);
  assert.equal(general.getCell('B7').font.bold, true);
  assert.equal(general.getCell('B7').alignment.wrapText, true);
  assert.equal(general.views[0].xSplit, 1);
  assert.equal(general.views[0].ySplit, 6);
  assert.equal(individual.getCell('A5').value, 'Ahmet Örnek · Aktif');
  assert.equal(individual.getCell('A6').value, 'Saat');
  assert.equal(individual.getCell('B6').value, 'Pazartesi');
  assert.equal(individual.getCell('B7').value, entries[0].studentName);
  assert.equal(individual.getCell('A17').value, 'Hatice Kübra Örnek · Aktif');
  assert.ok(individual.getRow(7).height >= 36);
});

test('selected one-day, one-slot workbook remains narrow and has no extra legend column', () => {
  const wb = workbookFor(select({ gender: 'kadin', day: 'pazartesi', slot: slots[0] }));
  assert.equal(wb.worksheets[0].columnCount, 2);
  assert.equal(wb.worksheets[1].columnCount, 2);
  assert.equal(wb.worksheets[0].rowCount, 7);
  assert.equal(wb.worksheets[0].getCell('B5').value, teachers[1].name);
  assert.equal(wb.worksheets[0].getCell('B7').value, entries[2].studentName);
});

test('unexpected multiple assignments and out-of-range slots are preserved; names are text not formulas', () => {
  const extra = { teacherId: 'a', day: 'pazartesi', slot: '18:00-18:20', studentName: '=FORMULA is a literal name', applicationId: 'extra' };
  const view = selectProgram({ teachers, entries: [...entries, { ...entries[0], studentName: 'İkinci Öğrenci', applicationId: 'other' }, extra], days, slots });
  assert.equal(view.slots.at(-1), extra.slot);
  assert.ok(view.cell(teachers[0], 'pazartesi', slots[0]).text.includes('\nİkinci Öğrenci'));
  const wb = workbookFor(view);
  assert.ok(wb.worksheets[0].getCell('B16').value.startsWith(extra.studentName));
  assert.equal(wb.worksheets[0].getCell('B16').type, ExcelJS.ValueType.String);
});

test('same student on all working days is listed once; different-day students retain day labels', () => {
  const teacher = { ...teachers[0], days: ['pazartesi', 'sali'] };
  const schedule = ['pazartesi', 'sali'].map((day) => ({ ...entries[0], day }));
  const complete = workbookFor(selectProgram({ teachers: [teacher], entries: schedule, days, slots }));
  assert.equal(complete.worksheets[0].getCell('B7').value, entries[0].studentName);
  const split = workbookFor(selectProgram({ teachers: [teacher], entries: [schedule[0], { ...schedule[1], studentName: 'İkinci Öğrenci', applicationId: 'other' }], days, slots }));
  assert.equal(split.worksheets[0].getCell('B7').value, 'Ali Talha Örnek\nPzt\nİkinci Öğrenci\nSal');
});

test('actual XLSX roundtrip retains native Excel styles, frozen headers and print settings', async () => {
  const workbook = workbookFor(select());
  const buffer = await workbook.xlsx.writeBuffer();
  const reloaded = new ExcelJS.Workbook();
  await reloaded.xlsx.load(buffer);
  assert.equal(reloaded.worksheets.length, 2);
  assert.ok(reloaded.worksheets[0].getCell('B7').value.startsWith(entries[0].studentName));
  assert.equal(reloaded.worksheets[0].getCell('B7').fill.fgColor.argb, palette.busy);
  assert.equal(reloaded.worksheets[0].getCell('B9').fill.fgColor.argb, palette.open);
  assert.equal(reloaded.worksheets[0].views[0].state, 'frozen');
  assert.equal(reloaded.worksheets[0].pageSetup.orientation, 'landscape');
  assert.equal(reloaded.worksheets[0].pageSetup.printArea, 'A1:D15');
  assert.equal(reloaded.worksheets[0].pageSetup.printTitlesRow, '1:6');
  if (process.env.BIA_PROGRAM_QA_XLSX) writeFileSync(process.env.BIA_PROGRAM_QA_XLSX, buffer);
});
