import assert from 'node:assert/strict';
import handler from '../api/bia-applications.js';

process.env.BIA_GITHUB_TOKEN = 'test-token';
process.env.BIA_JWT_SECRET = 'test-jwt-secret-with-enough-entropy';
process.env.BIA_APPLICATIONS_ENCRYPTION_KEY = 'test-encryption-secret-with-enough-entropy';

let putPayload = null;
let shaCounter = 0;
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

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

async function adminToken() {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({ name: 'Test Admin', exp: Math.floor(Date.now() / 1000) + 3600 }));
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
assert.ok(firstApplication?.id);
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

const attendanceSaveResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: teacherHeaders, body: JSON.stringify({
    action: 'attendance-save', date: attendanceDate,
    entries: [{ applicationId: firstApplication.id, slot: '15:00-15:20', status: 'katildi', note: 'Derse zamanında katıldı.' }]
  })
}));
assert.equal(attendanceSaveResponse.status, 200);
const savedAttendance = (await attendanceSaveResponse.json()).data[0];
assert.equal(savedAttendance.status, 'katildi');

const attendanceList = await (await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'GET', headers: adminHeaders
}))).json();
assert.equal(attendanceList.attendance.length, 1);
assert.equal(attendanceList.attendance[0].studentName, validSubmission.studentName);

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

const unavailableSchedule = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma']
  .map((day) => ({ day, teacherId: maleTeacher.id, slot: '15:00-15:20' }));
const unavailableResponse = await adminPost({
  action: 'placement-save', applicationId: maleApplication.id, applicationCreatedAt: maleApplication.createdAt,
  startDate: '2026-09-14', schedule: unavailableSchedule
});
assert.equal(unavailableResponse.status, 409);
assert.match((await unavailableResponse.json()).error, /müsait saatler/);

const autoPlanResponse = await adminPost({
  action: 'auto-plan', applicationIds: [maleApplication.id], startDate: '2026-09-14'
});
assert.equal(autoPlanResponse.status, 200);
const autoPlan = await autoPlanResponse.json();
assert.equal(autoPlan.data.length, 1);
assert.equal(new Set(autoPlan.data[0].schedule.map((entry) => entry.teacherId)).size, 1);
assert.equal(new Set(autoPlan.data[0].schedule.map((entry) => entry.slot)).size, 1);
assert.ok(autoPlan.data[0].schedule.every((entry) => entry.teacherId === maleTeacher.id));
assert.ok(autoPlan.data[0].schedule.every((entry) => maleSubmission.availabilitySlots.includes(entry.slot)));

const reserveSubmission = {
  ...validSubmission, applicationType: 'online', studentName: 'Yedek Test Öğrenci',
  tckn: makeTckn('400000007'), availabilitySlots: ['17:40-18:00'], startedAt: Date.now() - 5000
};
const reserveSubmitResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify(reserveSubmission)
}));
assert.equal(reserveSubmitResponse.status, 201);
const reserveBeforePlan = await (await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'GET', headers: adminHeaders
}))).json();
const reserveApplication = reserveBeforePlan.data.find((item) => item.studentName === reserveSubmission.studentName);
const reservePlanResponse = await adminPost({ action: 'auto-plan', applicationIds: [reserveApplication.id], startDate: '2026-09-14' });
assert.equal(reservePlanResponse.status, 200);
const reservePlan = await reservePlanResponse.json();
assert.equal(reservePlan.data.length, 0);
assert.equal(reservePlan.reserved, 1);
const reserveAfterPlan = await (await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'GET', headers: adminHeaders
}))).json();
assert.equal(reserveAfterPlan.data.find((item) => item.id === reserveApplication.id).status, 'yedek');

const demoSeedResponse = await adminPost({ action: 'demo-seed', startDate: '2026-09-14' });
assert.equal(demoSeedResponse.status, 200);
const demoSeed = await demoSeedResponse.json();
assert.equal(demoSeed.data.applications.length, 10);
assert.equal(demoSeed.data.teachers.length, 5);
assert.equal(demoSeed.data.placements.length, 10);
assert.ok(demoSeed.data.applications.some((item) => item.availabilitySlots.length === 1 && item.availabilitySlots[0] === '17:40-18:00'));
assert.ok(new Set(demoSeed.data.applications.map((item) => item.availabilitySlots.join('|'))).size >= 5);

const demoRefreshResponse = await adminPost({ action: 'demo-seed', startDate: '2026-09-14' });
assert.equal(demoRefreshResponse.status, 200);
const demoRefresh = await demoRefreshResponse.json();
assert.equal(demoRefresh.data.applications.length, 10);
assert.equal(demoRefresh.data.placements.length, 10);

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

const demoTeacherWithLessons = demoList.teachers.find((teacher) => teacher.isDemo &&
  demoList.placements.some((placement) => placement.schedule.some((entry) => entry.teacherId === teacher.id)));
const deleteTeacherResponse = await adminPost({
  action: 'teacher-delete', teacherId: demoTeacherWithLessons.id, removeAssignments: true
});
assert.equal(deleteTeacherResponse.status, 200);
assert.ok((await deleteTeacherResponse.json()).data.removedAssignments > 0);

const deleteAssignmentsResponse = await adminPost({ action: 'bulk-delete', scope: 'assignments' });
assert.equal(deleteAssignmentsResponse.status, 200);
assert.ok((await deleteAssignmentsResponse.json()).data.removedAssignments > 0);

const deleteDemoResponse = await adminPost({ action: 'bulk-delete', scope: 'demo' });
assert.equal(deleteDemoResponse.status, 200);
const deletedDemo = await deleteDemoResponse.json();
assert.equal(deletedDemo.data.removedApplications, 10);
assert.equal(deletedDemo.data.removedTeachers, 4);

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
