import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/admin-applications.js', import.meta.url), 'utf8');
const dates = ['2026-10-19', '2026-10-20', '2026-10-21'];
const slot = '15:00-15:20';
const teacher = { id: 'teacher', name: 'Örnek Öğretmen', modes: ['yuz-yuze'], active: true };
const application = { id: 'student', studentName: 'Örnek Öğrenci', applicationType: 'yuz-yuze' };
const placement = {
  applicationId: application.id, studentName: application.studentName, applicationType: 'yuz-yuze', startDate: dates[0],
  schedule: ['pazartesi', 'sali', 'carsamba'].map((day) => ({ teacherId: teacher.id, day, slot }))
};
const record = (date, status) => ({ teacherId: teacher.id, applicationId: application.id,
  studentName: application.studentName, applicationType: 'yuz-yuze', lessonDate: date, slot, status });
const holiday = { lessonDate: dates[1], applicationType: 'yuz-yuze' };

function reports(attendance, holidays = [holiday], placements = [placement]) {
  const nodes = new Map();
  const el = (id) => {
    if (!nodes.has(id)) {
      const node = { value: '', textContent: '', innerHTML: '', style: {}, setAttribute() {} };
      node.parentElement = node;
      nodes.set(id, node);
    }
    return nodes.get(id);
  };
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : ['2026-10-21T12:00:00Z'])); }
  }
  const context = { window: {}, document: { getElementById: el, addEventListener() {} }, Date: FixedDate };
  vm.createContext(context);
  const hook = `window.attendanceTest = {
    seed(data) { applications = data.applications; teachers = data.teachers; placements = data.placements;
      attendanceRecords = data.attendance; holidayRecords = data.holidays; activeApplicationType = 'yuz-yuze'; },
    rows: reportRows, render: renderReports, streaks: consecutiveAbsenceCounts, exportRows: reportExportRows
  };`;
  vm.runInContext(source.replace('  window.showApplications =', `  ${hook}\n  window.showApplications =`), context);
  const api = context.window.attendanceTest;
  api.seed({ applications: [application], teachers: [teacher], placements, attendance, holidays });
  el('reportsFrom').value = dates[0];
  el('reportsTo').value = dates[2];
  return { api, el };
}

test('whole-day holidays exclude saved absences from all rates, totals, teacher and student summaries', () => {
  const { api, el } = reports(dates.map((date, i) => record(date, i === 1 ? 'gelmedi' : 'katildi')));
  api.render();
  assert.equal(el('reportsExpected').textContent, 2);
  assert.equal(el('reportsCompleted').textContent, 2);
  assert.equal(el('reportsAttendanceText').textContent, '%100 katılım');
  assert.equal(el('reportsCompletionText').textContent, '%100 tamamlama');
  assert.equal(el('reportsDonutAbsent').textContent, 0);
  assert.equal(el('reportsDonutTotal').textContent, '2 ders');
  assert.match(el('reportsTeacherSummary').innerHTML, /2\/2 yoklama/);
  assert.match(el('reportsStudentTableBody').innerHTML, /2\/2 katılım/);
  assert.match(el('reportsHolidaySummary').textContent, /1 tatil dersi/);
  assert.match(el('reportsTableBody').innerHTML, /report-status-tatil/);
  assert.deepEqual(Array.from(api.rows(false), (row) => row.status), ['katildi', 'tatil', 'katildi']);
  el('reportsStatus').value = 'tatil';
  assert.equal(api.rows(true).length, 1, 'holiday records remain filterable and exportable');
  assert.equal(api.exportRows()[0]['Yoklama Durumu'], 'Tatil');
});

test('holidays do not become missing attendance; removing a holiday restores the previous absence', () => {
  const { api, el } = reports([record(dates[0], 'katildi'), record(dates[2], 'katildi')]);
  api.render();
  assert.equal(el('reportsMissing').textContent, 0);
  const restored = reports(dates.map((date, i) => record(date, i === 1 ? 'gelmedi' : 'katildi')), []);
  restored.api.render();
  assert.equal(restored.el('reportsExpected').textContent, 3);
  assert.equal(restored.el('reportsAttendanceText').textContent, '%67 katılım');
});

test('holidays apply to archived lessons and new placements on the same date, and remain scoped by education type', () => {
  const archived = reports([record(dates[1], 'gelmedi')], [holiday], []);
  assert.equal(archived.api.rows(false)[0].status, 'tatil');
  const newlyAssigned = reports([], [holiday]);
  assert.equal(newlyAssigned.api.rows(false).find((row) => row.lessonDate === dates[1]).status, 'tatil');
  const online = reports([record(dates[1], 'gelmedi')], [{ ...holiday, applicationType: 'online' }]);
  assert.equal(online.api.rows(false).find((row) => row.lessonDate === dates[1]).status, 'gelmedi');
});

test('holidays neither extend nor interrupt consecutive-absence streaks', () => {
  const { api } = reports(dates.map((date) => record(date, 'gelmedi')));
  assert.equal(api.streaks().get(`${application.id}|${application.studentName}`), 2);
});

test('an entirely closed day produces zero expected lessons without invalid percentages', () => {
  const { api, el } = reports([record(dates[1], 'gelmedi')]);
  el('reportsFrom').value = dates[1];
  el('reportsTo').value = dates[1];
  api.render();
  assert.equal(el('reportsExpected').textContent, 0);
  assert.equal(el('reportsCompleted').textContent, 0);
  assert.equal(el('reportsMissing').textContent, 0);
  assert.equal(el('reportsProgressBar').style.transform, 'scaleX(0)');
  assert.equal(el('reportsAttendanceText').textContent, 'Katılım verisi yok');
  assert.equal(el('reportsCompletionText').textContent, 'Hesaplanacak ders yok');
  assert.equal(el('reportsDonutRate').textContent, '—');
});
