import assert from 'node:assert/strict';
import handler from '../api/bia-applications.js';

process.env.BIA_GITHUB_TOKEN = 'test-token';
process.env.BIA_JWT_SECRET = 'test-jwt-secret-with-enough-entropy';
process.env.BIA_APPLICATIONS_ENCRYPTION_KEY = 'test-encryption-secret-with-enough-entropy';
process.env.BIA_LISTE_PASSWORD = 'test-directory-password-2026';

let putPayload = null;
let shaCounter = 0;
let conflictNextPut = false;
const remoteFiles = new Map();
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options = {}) => {
  const method = options.method || 'GET';
  const marker = '/contents/content/applications';
  const path = new URL(url).pathname;
  const fileName = decodeURIComponent(path.slice(path.indexOf(marker) + marker.length).replace(/^\//, ''));
  if (method === 'GET' && !fileName) {
    return new Response(JSON.stringify([...remoteFiles.keys()].map((name) => ({ type: 'file', name }))), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  if (method === 'GET') {
    const stored = remoteFiles.get(fileName);
    if (stored) {
      return new Response(JSON.stringify(stored), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ message: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  putPayload = JSON.parse(options.body);
  if (conflictNextPut) {
    conflictNextPut = false;
    return new Response(JSON.stringify({ message: 'Conflict' }), { status: 409 });
  }
  const current = remoteFiles.get(fileName);
  if (current && putPayload.sha !== current.sha) {
    return new Response(JSON.stringify({ message: 'Conflict' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
  }
  const sha = `test-sha-${++shaCounter}`;
  remoteFiles.set(fileName, { content: putPayload.content, sha });
  return new Response(JSON.stringify({ content: { sha } }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
};

const validSubmission = {
  action: 'submit',
  website: '',
  startedAt: Date.now() - 5000,
  applicationType: 'yuz-yuze',
  studentName: 'Test Öğrenci',
  tckn: '10000000146',
  birthDate: '2015-05-12',
  gender: 'kiz',
  school: 'Test Okulu',
  grade: '5',
  guardianName: 'Test Veli',
  guardianRelation: 'anne',
  guardianPhone: '05321112233',
  studentPhone: '',
  address: 'Test adresi',
  province: 'İstanbul',
  district: 'Üsküdar',
  secondGuardianName: '',
  secondGuardianPhone: '',
  quranLevel: 'elif-ba',
  previousTraining: 'hayir',
  previousTrainingDetail: '',
  availabilitySlots: ['15:00-15:20', '15:20-15:40'],
  notes: '',
  rulesAccepted: true,
  privacyAcknowledged: true,
  termsAccepted: true,
  mediaConsent: 'izin-veriyorum'
};

const response = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify(validSubmission)
}));
const result = await response.json();

assert.equal(response.status, 201);
assert.equal(result.ok, true);
assert.match(result.reference, /^BIA-\d{8}-[A-Z0-9]{6}$/);
assert.ok(putPayload?.content, 'GitHub payload should be produced');

const storedEnvelope = Buffer.from(putPayload.content, 'base64').toString('utf8');
assert.doesNotMatch(storedEnvelope, /Test Öğrenci|10000000146|05321112233/);
assert.equal(JSON.parse(storedEnvelope).alg, 'AES-256-GCM');

const invalidResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify({ ...validSubmission, startedAt: Date.now() - 5000, tckn: '11111111111' })
}));
assert.equal(invalidResponse.status, 400);

const missingAvailabilityResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify({ ...validSubmission, startedAt: Date.now() - 5000, availabilitySlots: [] })
}));
assert.equal(missingAvailabilityResponse.status, 400);

const declinedMediaResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify({ ...validSubmission, startedAt: Date.now() - 5000, mediaConsent: 'izin-vermiyorum' })
}));
assert.equal(declinedMediaResponse.status, 400);

const onlineSubmission = {
  action: 'submit', website: '', startedAt: Date.now() - 5000,
  applicationType: 'online', applicationVersion: 'online-2026-09',
  studentName: 'Online Test Öğrenci', birthDate: '2014-04-10', gender: 'erkek', grade: '6',
  quranLevel: 'gelistirmek-istiyor', studentPhone: '', motherName: 'Online Test Anne',
  motherPhone: '05321112234', fatherName: 'Online Test Baba', fatherPhone: '05321112235',
  location: 'Üsküdar / İstanbul', availabilityRanges: ['17:00-19:00', '19:00-21:00'],
  previousTraining: 'hayir', previousTrainingDetail: '', referralSource: 'kendi-arastirmam', referralOther: '',
  privacyAcknowledged: true, termsAccepted: true
};
const onlineResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify(onlineSubmission)
}));
assert.equal(onlineResponse.status, 201);
assert.equal((await onlineResponse.json()).ok, true);

const currentOnlineSubmission = {
  ...onlineSubmission, startedAt: Date.now() - 5000, studentName: 'Güncel Online Öğrenci',
  guardianName: 'Birinci Veli', guardianRelation: 'yasal-vasi', guardianPhone: '05321112236',
  motherName: undefined, motherPhone: undefined, fatherName: undefined, fatherPhone: undefined,
  secondGuardianName: '', secondGuardianPhone: '', province: 'İstanbul', district: 'Kadıköy',
  referralSource: 'aile', location: undefined
};
const currentOnlineResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify(currentOnlineSubmission)
}));
assert.equal(currentOnlineResponse.status, 201);
assert.equal((await currentOnlineResponse.json()).ok, true);

const invalidBirthDateResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify({ ...validSubmission, startedAt: Date.now() - 5000, birthDate: '2015-02-31' })
}));
assert.equal(invalidBirthDateResponse.status, 400);

const invalidOnlineResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify({ ...onlineSubmission, startedAt: Date.now() - 5000, availabilityRanges: [] })
}));
assert.equal(invalidOnlineResponse.status, 400);

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

async function adminToken() {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({ name: 'Test Admin', role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 }));
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(process.env.BIA_JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${payload}`));
  return `${header}.${payload}.${Buffer.from(signature).toString('base64url')}`;
}

function makeTckn(firstNine) {
  const n = String(firstNine).split('').map(Number);
  const odd = n[0] + n[2] + n[4] + n[6] + n[8];
  const even = n[1] + n[3] + n[5] + n[7];
  n.push(((odd * 7 - even) % 10 + 10) % 10);
  n.push(n.reduce((sum, digit) => sum + digit, 0) % 10);
  return n.join('');
}

const jwt = await adminToken();
const adminHeaders = { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173', 'Authorization': `Bearer ${jwt}` };
async function adminPost(body) {
  return handler(new Request('http://localhost:4173/api/bia-applications', {
    method: 'POST', headers: adminHeaders, body: JSON.stringify(body)
  }));
}

const mondayTeacherResponse = await adminPost({
  action: 'teacher-save', teacher: {
    name: 'Meryem Kaplan', phone: '05321110001', gender: 'kadin', modes: ['yuz-yuze'],
    days: ['pazartesi', 'sali', 'carsamba'], active: true,
    username: 'meryem.kaplan', password: 'GuvenliSifre-01'
  }
});
assert.equal(mondayTeacherResponse.status, 200);
const mondayTeacher = (await mondayTeacherResponse.json()).data;

const fridayTeacherResponse = await adminPost({
  action: 'teacher-save', teacher: {
    name: 'Ayşe Yılmaz', phone: '05321110002', gender: 'kadin', modes: ['yuz-yuze', 'online'],
    days: ['persembe', 'cuma'], active: true,
    username: 'ayse.yilmaz', password: 'GuvenliSifre-02'
  }
});
assert.equal(fridayTeacherResponse.status, 200);
const fridayTeacher = (await fridayTeacherResponse.json()).data;

const listResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'GET', headers: adminHeaders
}));
assert.equal(listResponse.status, 200);
const list = await listResponse.json();
const firstApplication = list.data.find((item) => item.studentName === validSubmission.studentName);
const onlineApplication = list.data.find((item) => item.studentName === onlineSubmission.studentName);
assert.ok(firstApplication?.id);
assert.equal(onlineApplication?.applicationVersion, 'online-2026-09');
assert.deepEqual(onlineApplication?.availabilityRanges, onlineSubmission.availabilityRanges);
assert.equal(onlineApplication?.motherName, onlineSubmission.motherName);
assert.equal(onlineApplication?.fatherName, onlineSubmission.fatherName);
assert.equal(onlineApplication?.consents?.mediaConsent, 'uygulanmiyor');
assert.deepEqual(list.meta.onlineTimeRanges, [
  '10:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00', '21:00-23:00'
]);
assert.equal(list.meta.onlineTimeSlots.length, 39);
assert.equal(list.meta.onlineTimeSlots[0], '10:00-10:20');
assert.equal(list.meta.onlineTimeSlots.at(-1), '22:40-23:00');
assert.equal(list.teachers.length, 2);
assert.equal(list.teachers.every((teacher) => !('passwordHash' in teacher) && !('passwordSalt' in teacher)), true);
assert.equal(list.teachers.every((teacher) => teacher.hasLogin), true);

const splitSchedule = [
  ['pazartesi', mondayTeacher.id], ['sali', mondayTeacher.id], ['carsamba', mondayTeacher.id],
  ['persembe', fridayTeacher.id], ['cuma', fridayTeacher.id]
].map(([day, teacherId]) => ({ day, teacherId, slot: '15:00-15:20' }));
const placementResponse = await adminPost({
  action: 'placement-save', applicationId: firstApplication.id, applicationCreatedAt: firstApplication.createdAt,
  startDate: '2020-01-01', schedule: splitSchedule
});
assert.equal(placementResponse.status, 200);
assert.equal((await placementResponse.json()).data.schedule.length, 5);

const completeResponse = await adminPost({
  action: 'update', id: firstApplication.id, createdAt: firstApplication.createdAt,
  status: 'kayit-tamamlandi', adminNote: 'Plan hazır.'
});
assert.equal(completeResponse.status, 200);

const getHistory = async () => {
  const response = await adminPost({ action: 'application-info', applicationId: firstApplication.id, applicationCreatedAt: firstApplication.createdAt });
  assert.equal(response.status, 200);
  return (await response.json()).data;
};
const initialHistory = await getHistory();
assert.ok(initialHistory.history.some((e) => e.type === 'application-created'));
assert.ok(initialHistory.history.some((e) => e.type === 'placement-created'));
assert.ok(initialHistory.history.some((e) => e.type === 'status-changed' && e.after === 'kayit-tamamlandi' && e.actor === 'Test Admin'));
assert.ok(!('tckn' in initialHistory.application));
assert.equal((await adminPost({ action: 'update', id: firstApplication.id, createdAt: firstApplication.createdAt, status: 'kayit-tamamlandi', adminNote: 'Plan hazır.' })).status, 200);
assert.equal((await getHistory()).history.length, initialHistory.history.length, 'no-op save must not duplicate history');
conflictNextPut = true;
assert.equal((await adminPost({ action: 'placement-save', applicationId: firstApplication.id, applicationCreatedAt: firstApplication.createdAt,
  startDate: '2020-01-01', schedule: splitSchedule.map((entry) => ({ ...entry, slot: '15:20-15:40' })) })).status, 200);
let changedHistory = await getHistory();
assert.equal(changedHistory.history.filter((e) => e.type === 'placement-changed').length, 1, 'CAS retry must only persist one event');
assert.equal(changedHistory.history.find((e) => e.type === 'placement-changed').before.schedule[0].slot, '15:00-15:20');
assert.equal((await adminPost({ action: 'placement-remove', applicationId: firstApplication.id })).status, 200);
changedHistory = await getHistory();
assert.equal(changedHistory.history.filter((e) => e.type === 'placement-removed').length, 1);
assert.equal(changedHistory.placement, null);
assert.equal((await adminPost({ action: 'placement-save', applicationId: firstApplication.id, applicationCreatedAt: firstApplication.createdAt,
  startDate: '2020-01-01', schedule: splitSchedule })).status, 200);
assert.equal((await getHistory()).history.filter((e) => e.type === 'placement-created').length, 2);
const unauthHistory = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'application-info', applicationId: firstApplication.id, applicationCreatedAt: firstApplication.createdAt })
}));
assert.equal(unauthHistory.status, 401);

const warningMessageSent = await adminPost({
  action: 'attendance-warning-message-update', applicationId: firstApplication.id,
  applicationCreatedAt: firstApplication.createdAt, sent: true
});
assert.equal(warningMessageSent.status, 200);
const warningMessageSentData = (await warningMessageSent.json()).data;
assert.equal(warningMessageSentData.sent, true);
assert.ok(warningMessageSentData.sentAt);
const persistedWarningList = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'GET', headers: adminHeaders
}));
assert.equal(persistedWarningList.status, 200);
const persistedWarningApplication = (await persistedWarningList.json()).data.find((item) => item.id === firstApplication.id);
assert.equal(persistedWarningApplication.warningMessageSentAt, warningMessageSentData.sentAt);

const warningMessageUnsent = await adminPost({
  action: 'attendance-warning-message-update', applicationId: firstApplication.id,
  applicationCreatedAt: firstApplication.createdAt, sent: false
});
assert.equal(warningMessageUnsent.status, 200);
assert.equal((await warningMessageUnsent.json()).data.sent, false);

const directoryUnauthorized = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify({ action: 'directory-search', mode: 'student', query: 'Test' })
}));
assert.equal(directoryUnauthorized.status, 401);

const directoryBadPassword = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify({ action: 'directory-login', password: 'wrong-password' })
}));
assert.equal(directoryBadPassword.status, 401);

const testDirectoryPassword = process.env.BIA_LISTE_PASSWORD;
delete process.env.BIA_LISTE_PASSWORD;
const directoryWithoutEnv = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify({ action: 'directory-login', password: 'wrong-password' })
}));
assert.equal(directoryWithoutEnv.status, 401);
process.env.BIA_LISTE_PASSWORD = testDirectoryPassword;

const directoryLoginResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify({ action: 'directory-login', password: process.env.BIA_LISTE_PASSWORD })
}));
assert.equal(directoryLoginResponse.status, 200);
const directoryToken = (await directoryLoginResponse.json()).token;
const directoryHeaders = { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173', 'Authorization': `Bearer ${directoryToken}` };
const directoryAdminAttempt = await handler(new Request('http://localhost:4173/api/bia-applications', { method: 'GET', headers: directoryHeaders }));
assert.equal(directoryAdminAttempt.status, 401);
const directoryStudentResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: directoryHeaders,
  body: JSON.stringify({ action: 'directory-search', mode: 'student', query: 'öğrenci' })
}));
assert.equal(directoryStudentResponse.status, 200);
const directoryStudentData = await directoryStudentResponse.json();
const directoryStudent = directoryStudentData.items.find((item) => item.studentName === validSubmission.studentName);
assert.ok(directoryStudent);
assert.equal(directoryStudent.school, validSubmission.school);
assert.equal(directoryStudent.guardianPhone, validSubmission.guardianPhone);
assert.equal(directoryStudent.teachers.length, 2);
assert.deepEqual(directoryStudent.teachers[0].schedule, [
  { day: 'pazartesi', slot: '15:00-15:20' },
  { day: 'sali', slot: '15:00-15:20' },
  { day: 'carsamba', slot: '15:00-15:20' }
]);
assert.deepEqual(directoryStudent.teachers[1].schedule, [
  { day: 'persembe', slot: '15:00-15:20' },
  { day: 'cuma', slot: '15:00-15:20' }
]);
assert.ok(!('tckn' in directoryStudent));
const directoryTeacherResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: directoryHeaders,
  body: JSON.stringify({ action: 'directory-search', mode: 'teacher', query: 'Meryem' })
}));
assert.equal(directoryTeacherResponse.status, 200);
const directoryTeacherData = await directoryTeacherResponse.json();
assert.equal(directoryTeacherData.groups[0].teacher.name, 'Meryem Kaplan');
assert.equal(directoryTeacherData.groups[0].students[0].studentName, validSubmission.studentName);
assert.deepEqual(directoryTeacherData.groups[0].students[0].teachers.find((teacher) => teacher.id === fridayTeacher.id).schedule, [
  { day: 'persembe', slot: '15:00-15:20' },
  { day: 'cuma', slot: '15:00-15:20' }
]);

const failedTeacherLogin = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify({ action: 'teacher-login', username: 'meryem.kaplan', password: 'yanlis-sifre' })
}));
assert.equal(failedTeacherLogin.status, 401);

const teacherLoginResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify({ action: 'teacher-login', username: 'meryem.kaplan', password: 'GuvenliSifre-01' })
}));
assert.equal(teacherLoginResponse.status, 200);
const teacherLogin = await teacherLoginResponse.json();
assert.equal(teacherLogin.teacher.name, 'Meryem Kaplan');
assert.ok(teacherLogin.token);

const teacherHeaders = { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173', 'Authorization': `Bearer ${teacherLogin.token}` };
const teacherAdminAttempt = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'GET', headers: teacherHeaders
}));
assert.equal(teacherAdminAttempt.status, 401);

const today = new Date();
const todayDay = today.getDay() || 7;
today.setDate(today.getDate() - todayDay + 1);
const attendanceDate = today.toISOString().slice(0, 10);
const teacherDataResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: teacherHeaders, body: JSON.stringify({ action: 'teacher-data', date: attendanceDate })
}));
assert.equal(teacherDataResponse.status, 200);
const teacherData = await teacherDataResponse.json();
assert.equal(teacherData.day, 'pazartesi');
assert.equal(teacherData.lessons.length, 1);
assert.equal(teacherData.lessons[0].studentName, validSubmission.studentName);
assert.equal(teacherData.lessons[0].guardianPhone, validSubmission.guardianPhone);
assert.equal(teacherData.lessons.every((lesson) => !('history' in lesson) && !('tckn' in lesson) && !('address' in lesson)), true);
const teacherHistory = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: teacherHeaders, body: JSON.stringify({ action: 'application-info', applicationId: firstApplication.id, applicationCreatedAt: firstApplication.createdAt })
}));
assert.equal(teacherHistory.status, 401);

const attendanceSaveResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: teacherHeaders, body: JSON.stringify({
    action: 'attendance-save', date: attendanceDate,
    entries: [{ applicationId: firstApplication.id, slot: '15:00-15:20', status: 'katildi', note: 'Derse zamanında katıldı.' }]
  })
}));
assert.equal(attendanceSaveResponse.status, 200);
const savedAttendance = (await attendanceSaveResponse.json()).data[0];
assert.equal(savedAttendance.status, 'katildi');

const nextAttendanceDate = new Date(`${attendanceDate}T12:00:00Z`);
nextAttendanceDate.setUTCDate(nextAttendanceDate.getUTCDate() + 1);
const nextDayDataResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: teacherHeaders,
  body: JSON.stringify({ action: 'teacher-data', date: nextAttendanceDate.toISOString().slice(0, 10) })
}));
assert.equal(nextDayDataResponse.status, 200);
const nextDayLessons = (await nextDayDataResponse.json()).lessons;
assert.equal(nextDayLessons[0].status, '');
assert.equal(nextDayLessons[0].note, 'Derse zamanında katıldı.');
assert.equal(nextDayLessons[0].noteDate, attendanceDate);

const attendanceClearResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: teacherHeaders, body: JSON.stringify({
    action: 'attendance-save', date: attendanceDate,
    entries: [{ applicationId: firstApplication.id, slot: '15:00-15:20', status: '', note: '' }]
  })
}));
assert.equal(attendanceClearResponse.status, 200);
assert.equal((await attendanceClearResponse.json()).data[0].cleared, true);

const adminAttendanceEdit = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: adminHeaders, body: JSON.stringify({
    action: 'attendance-admin-save', date: attendanceDate, teacherId: mondayTeacher.id,
    applicationId: firstApplication.id, slot: '15:00-15:20', status: 'gelmedi'
  })
}));
assert.equal(adminAttendanceEdit.status, 200);
assert.equal((await adminAttendanceEdit.json()).data.status, 'gelmedi');

const teacherAdminAttendanceEdit = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: teacherHeaders, body: JSON.stringify({
    action: 'attendance-admin-save', date: attendanceDate, teacherId: mondayTeacher.id,
    applicationId: firstApplication.id, slot: '15:00-15:20', status: 'katildi'
  })
}));
assert.equal(teacherAdminAttendanceEdit.status, 401);

const adminAttendanceClear = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: adminHeaders, body: JSON.stringify({
    action: 'attendance-admin-save', date: attendanceDate, teacherId: mondayTeacher.id,
    applicationId: firstApplication.id, slot: '15:00-15:20', status: 'eksik'
  })
}));
assert.equal(adminAttendanceClear.status, 200);
assert.equal((await adminAttendanceClear.json()).data.cleared, true);

const attendanceList = await (await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'GET', headers: adminHeaders
}))).json();
assert.equal(attendanceList.attendance.length, 0);

const secondSubmission = { ...validSubmission, studentName: 'İkinci Öğrenci', tckn: makeTckn('200000003'), startedAt: Date.now() - 5000 };
const secondResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify(secondSubmission)
}));
assert.equal(secondResponse.status, 201);

const refreshed = await (await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'GET', headers: adminHeaders
}))).json();
const secondApplication = refreshed.data.find((item) => item.studentName === secondSubmission.studentName);
const conflictResponse = await adminPost({
  action: 'placement-save', applicationId: secondApplication.id, applicationCreatedAt: secondApplication.createdAt,
  startDate: '2026-09-14', schedule: splitSchedule
});
assert.equal(conflictResponse.status, 409);
assert.match((await conflictResponse.json()).error, /dolu/);

const maleTeacherResponse = await adminPost({
  action: 'teacher-save', teacher: {
    name: 'Mustafa Kaplan', phone: '05321110003', gender: 'erkek', modes: ['yuz-yuze'],
    days: ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma'], active: true,
    username: 'mustafa.kaplan', password: 'GuvenliSifre-03'
  }
});
assert.equal(maleTeacherResponse.status, 200);
const maleTeacher = (await maleTeacherResponse.json()).data;

const onlineMaleTeacherResponse = await adminPost({
  action: 'teacher-save', teacher: {
    name: 'Online Erkek Öğretmen', phone: '05321110004', gender: 'erkek', modes: ['online'],
    days: ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma'], active: true,
    username: 'online.ogretmen', password: 'GuvenliSifre-04'
  }
});
assert.equal(onlineMaleTeacherResponse.status, 200);
const onlineMaleTeacher = (await onlineMaleTeacherResponse.json()).data;

const onlineOutsideRangeSchedule = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma']
  .map((day) => ({ day, teacherId: onlineMaleTeacher.id, slot: '10:00-10:20' }));
const onlineOutsideRangeResponse = await adminPost({
  action: 'placement-save', applicationId: onlineApplication.id, applicationCreatedAt: onlineApplication.createdAt,
  startDate: '2026-09-14', schedule: onlineOutsideRangeSchedule
});
assert.equal(onlineOutsideRangeResponse.status, 409);
assert.match((await onlineOutsideRangeResponse.json()).error, /yalnızca öğretmen ataması/);
const onlineTeacherAssignmentResponse = await adminPost({
  action: 'online-teacher-assign', applicationId: onlineApplication.id,
  applicationCreatedAt: onlineApplication.createdAt, teacherId: onlineMaleTeacher.id
});
assert.equal(onlineTeacherAssignmentResponse.status, 200);
const onlineTeacherAssignment = (await onlineTeacherAssignmentResponse.json()).data;
assert.equal(onlineTeacherAssignment.teacherId, onlineMaleTeacher.id);
assert.equal(onlineTeacherAssignment.schedule.length, 0);
assert.equal(onlineTeacherAssignment.startDate, '');
const onlineCompleteResponse = await adminPost({
  action: 'update', id: onlineApplication.id, createdAt: onlineApplication.createdAt,
  status: 'kayit-tamamlandi', adminNote: 'Öğretmen atandı.'
});
assert.equal(onlineCompleteResponse.status, 200);

const maleSubmission = {
  ...validSubmission, studentName: 'Erkek Test Öğrenci', gender: 'erkek',
  tckn: makeTckn('300000005'), availabilitySlots: ['17:40-18:00'], startedAt: Date.now() - 5000
};
const maleResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify(maleSubmission)
}));
assert.equal(maleResponse.status, 201);
const beforeAutoPlan = await (await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'GET', headers: adminHeaders
}))).json();
const maleApplication = beforeAutoPlan.data.find((item) => item.studentName === maleSubmission.studentName);

const wrongGenderSchedule = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma']
  .map((day) => ({ day, teacherId: fridayTeacher.id, slot: '15:20-15:40' }));
const wrongGenderResponse = await adminPost({
  action: 'placement-save', applicationId: maleApplication.id, applicationCreatedAt: maleApplication.createdAt,
  startDate: '2026-09-14', schedule: wrongGenderSchedule
});
assert.equal(wrongGenderResponse.status, 409);
assert.match((await wrongGenderResponse.json()).error, /erkek öğretmen/);

const scheduleOutsideRequestedTimes = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma']
  .map((day) => ({ day, teacherId: maleTeacher.id, slot: '15:00-15:20' }));
const outsidePreferencesResponse = await adminPost({
  action: 'placement-save', applicationId: maleApplication.id, applicationCreatedAt: maleApplication.createdAt,
  startDate: '2026-09-14', schedule: scheduleOutsideRequestedTimes
});
assert.equal(outsidePreferencesResponse.status, 200);
assert.equal((await outsidePreferencesResponse.json()).data.schedule.length, 5);

const demoSeedResponse = await adminPost({ action: 'demo-seed', startDate: '2026-09-14' });
assert.equal(demoSeedResponse.status, 200);
const demoSeed = await demoSeedResponse.json();
assert.equal(demoSeed.data.applications.length, 10);
assert.equal(demoSeed.data.teachers.length, 5);
assert.equal(demoSeed.data.placements.length, 0);
assert.ok(demoSeed.data.applications.some((item) => item.availabilitySlots.length === 1 && item.availabilitySlots[0] === '17:40-18:00'));
assert.ok(new Set(demoSeed.data.applications.map((item) => item.availabilitySlots.join('|'))).size >= 5);

const demoRefreshResponse = await adminPost({ action: 'demo-seed', startDate: '2026-09-14' });
assert.equal(demoRefreshResponse.status, 200);
const demoRefresh = await demoRefreshResponse.json();
assert.equal(demoRefresh.data.applications.length, 10);
assert.equal(demoRefresh.data.placements.length, 0);

const demoList = await (await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'GET', headers: adminHeaders
}))).json();
const teacherById = new Map(demoList.teachers.map((teacher) => [teacher.id, teacher]));
demoList.placements.filter((placement) => placement.isDemo).forEach((placement) => {
  const application = demoList.data.find((item) => item.id === placement.applicationId);
  const expectedGender = application.gender === 'kiz' ? 'kadin' : 'erkek';
  assert.ok(placement.schedule.every((entry) => teacherById.get(entry.teacherId)?.gender === expectedGender));
});

const deleteApplicationResponse = await adminPost({
  action: 'application-delete', applicationId: maleApplication.id, applicationCreatedAt: maleApplication.createdAt
});
assert.equal(deleteApplicationResponse.status, 200);
assert.equal((await deleteApplicationResponse.json()).removedAssignments, 1);

const deleteTeacherResponse = await adminPost({
  action: 'teacher-delete', teacherId: onlineMaleTeacher.id, removeAssignments: true
});
assert.equal(deleteTeacherResponse.status, 200);
assert.equal((await deleteTeacherResponse.json()).data.removedAssignments, 1);

const deleteAssignmentsResponse = await adminPost({ action: 'bulk-delete', scope: 'assignments' });
assert.equal(deleteAssignmentsResponse.status, 200);
assert.ok((await deleteAssignmentsResponse.json()).data.removedAssignments > 0);

const deleteDemoResponse = await adminPost({ action: 'bulk-delete', scope: 'demo' });
assert.equal(deleteDemoResponse.status, 200);
const deletedDemo = await deleteDemoResponse.json();
assert.equal(deletedDemo.data.removedApplications, 10);
assert.equal(deletedDemo.data.removedTeachers, 5);

const deleteAllApplicationsResponse = await adminPost({ action: 'bulk-delete', scope: 'applications' });
assert.equal(deleteAllApplicationsResponse.status, 200);
assert.ok((await deleteAllApplicationsResponse.json()).data.removedApplications >= 2);

const deleteAllTeachersResponse = await adminPost({ action: 'bulk-delete', scope: 'teachers' });
assert.equal(deleteAllTeachersResponse.status, 200);
assert.ok((await deleteAllTeachersResponse.json()).data.removedTeachers >= 3);

const emptyList = await (await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'GET', headers: adminHeaders
}))).json();
assert.equal(emptyList.data.length, 0);
assert.equal(emptyList.teachers.length, 0);
assert.equal(emptyList.placements.length, 0);
assert.equal(emptyList.attendance.length, 0);

globalThis.fetch = originalFetch;
console.log('bia-applications tests passed');
