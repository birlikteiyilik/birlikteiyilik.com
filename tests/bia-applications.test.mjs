import assert from 'node:assert/strict';
import handler from '../api/bia-applications.js';

process.env.BIA_GITHUB_TOKEN = 'test-token';
process.env.BIA_JWT_SECRET = 'test-jwt-secret-with-enough-entropy';
process.env.BIA_APPLICATIONS_ENCRYPTION_KEY = 'test-encryption-secret-with-enough-entropy';

let putPayload = null;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (_url, options = {}) => {
  if ((options.method || 'GET') === 'GET') {
    return new Response(JSON.stringify({ message: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  putPayload = JSON.parse(options.body);
  return new Response(JSON.stringify({ content: { sha: 'test-sha' } }), {
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

const missingMediaConsentResponse = await handler(new Request('http://localhost:4173/api/bia-applications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:4173' },
  body: JSON.stringify({ ...validSubmission, startedAt: Date.now() - 5000, mediaConsent: 'izin-vermiyorum' })
}));
assert.equal(missingMediaConsentResponse.status, 400);

globalThis.fetch = originalFetch;
console.log('bia-applications tests passed');
