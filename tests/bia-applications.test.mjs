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
assert.equal(declinedMediaResponse.status, 201);

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
    name: 'Mustafa Kaplan', phone: '05321110001', gender: 'erkek', modes: ['yuz-yuze'],
    days: ['pazartesi', 'sali', 'carsamba'], active: true
  }
});
assert.equal(mondayTeacherResponse.status, 200);
const mondayTeacher = (await mondayTeacherResponse.json()).data;

const fridayTeacherResponse = await adminPost({
  action: 'teacher-save', teacher: {
    name: 'Ayşe Yılmaz', phone: '05321110002', gender: 'kadin', modes: ['yuz-yuze', 'online'],
    days: ['persembe', 'cuma'], active: true
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

const splitSchedule = [
  ['pazartesi', mondayTeacher.id], ['sali', mondayTeacher.id], ['carsamba', mondayTeacher.id],
  ['persembe', fridayTeacher.id], ['cuma', fridayTeacher.id]
].map(([day, teacherId]) => ({ day, teacherId, slot: '15:00-15:20' }));
const placementResponse = await adminPost({
  action: 'placement-save', applicationId: firstApplication.id, applicationCreatedAt: firstApplication.createdAt,
  startDate: '2026-09-14', schedule: splitSchedule
});
assert.equal(placementResponse.status, 200);
assert.equal((await placementResponse.json()).data.schedule.length, 5);

const completeResponse = await adminPost({
  action: 'update', id: firstApplication.id, createdAt: firstApplication.createdAt,
  status: 'kayit-tamamlandi', adminNote: 'Plan hazır.'
});
assert.equal(completeResponse.status, 200);

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

globalThis.fetch = originalFetch;
console.log('bia-applications tests passed');
