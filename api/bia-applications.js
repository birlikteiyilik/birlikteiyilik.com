export const config = { runtime: 'edge' };

const DEFAULT_REPO = 'birlikteiyilik/birlikteiyilik.com';
const GH_API = 'https://api.github.com';
const PLANNING_FILE = 'planning.enc.json';
const STATUS_VALUES = ['yeni', 'inceleniyor', 'uygun', 'yedek', 'kayit-tamamlandi', 'uygun-degil'];
const WEEKDAYS = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma'];
const TIME_SLOTS = [
  '15:00-15:20', '15:20-15:40', '15:40-16:00',
  '16:00-16:20', '16:20-16:40', '16:40-17:00',
  '17:00-17:20', '17:20-17:40', '17:40-18:00'
];
const ATTENDANCE_STATUSES = ['katildi', 'gelmedi', 'mazeretli'];
const PASSWORD_ITERATIONS = 210000;
const ENUMS = {
  applicationType: ['yuz-yuze', 'online'],
  gender: ['erkek', 'kiz'],
  grade: ['3', '4', '5', '6', '7', '8'],
  guardianRelation: ['anne', 'baba', 'yasal-vasi', 'diger'],
  quranLevel: ['hic-bilmiyor', 'elif-ba', 'okuyabiliyor', 'tecvid'],
  previousTraining: ['evet', 'hayir'],
  mediaConsent: ['izin-veriyorum']
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

class RequestError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function json(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      ...corsHeaders
    }
  });
}

function base64FromBytes(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function bytesFromBase64(value) {
  const normalized = value.replace(/\s/g, '');
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  return bytesFromBase64(normalized + '='.repeat((4 - normalized.length % 4) % 4));
}

function base64UrlFromBytes(bytes) {
  return base64FromBytes(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function signJwt(payload, secret) {
  const header = base64UrlFromBytes(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = base64UrlFromBytes(encoder.encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${body}`));
  return `${header}.${body}.${base64UrlFromBytes(new Uint8Array(signature))}`;
}

async function hashPassword(password, saltValue) {
  const salt = saltValue ? bytesFromBase64(saltValue) : crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PASSWORD_ITERATIONS }, material, 256
  );
  return { passwordSalt: base64FromBytes(salt), passwordHash: base64FromBytes(new Uint8Array(bits)) };
}

async function passwordMatches(password, teacher) {
  if (!teacher?.passwordHash || !teacher?.passwordSalt) return false;
  const candidate = await hashPassword(password, teacher.passwordSalt);
  const expected = bytesFromBase64(teacher.passwordHash);
  const actual = bytesFromBase64(candidate.passwordHash);
  if (expected.length !== actual.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected[index] ^ actual[index];
  return difference === 0;
}

async function verifyJwt(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const valid = await crypto.subtle.verify(
      'HMAC', key, base64UrlToBytes(signature), encoder.encode(`${header}.${body}`)
    );
    if (!valid) return null;
    const payload = JSON.parse(decoder.decode(base64UrlToBytes(body)));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

async function getEncryptionKey(secret) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptRecords(records, secret) {
  const key = await getEncryptionKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(records))
  );
  return {
    v: 1,
    alg: 'AES-256-GCM',
    iv: base64FromBytes(iv),
    data: base64FromBytes(new Uint8Array(ciphertext))
  };
}

async function decryptRecords(envelope, secret) {
  if (!envelope || envelope.v !== 1 || !envelope.iv || !envelope.data) {
    throw new Error('Başvuru arşivi biçimi geçersiz.');
  }
  const key = await getEncryptionKey(secret);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytesFromBase64(envelope.iv) }, key, bytesFromBase64(envelope.data)
  );
  const records = JSON.parse(decoder.decode(plaintext));
  if (!Array.isArray(records)) throw new Error('Başvuru arşivi okunamadı.');
  return records;
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function cleanPassword(value) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 128);
}

function normalizeUsername(value) {
  return cleanText(value, 40).toLowerCase().replace(/ı/g, 'i').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

function digits(value) { return String(value || '').replace(/\D/g, ''); }

function isValidTckn(value) {
  const id = digits(value);
  if (!/^[1-9][0-9]{10}$/.test(id)) return false;
  const n = id.split('').map(Number);
  const odd = n[0] + n[2] + n[4] + n[6] + n[8];
  const even = n[1] + n[3] + n[5] + n[7];
  return ((odd * 7 - even) % 10 + 10) % 10 === n[9] &&
    n.slice(0, 10).reduce((sum, digit) => sum + digit, 0) % 10 === n[10];
}

function isValidPhone(value, optional) {
  const phone = digits(value);
  if (!phone && optional) return true;
  return /^(?:90)?5[0-9]{9}$/.test(phone) || /^05[0-9]{9}$/.test(phone);
}

function requireEnum(body, key) { return ENUMS[key].includes(String(body[key] || '')); }

function orderedUnique(values, allowed) {
  if (!Array.isArray(values)) return [];
  const set = new Set(values.map(String).filter((value) => allowed.includes(value)));
  return allowed.filter((value) => set.has(value));
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  return Number.isFinite(new Date(`${value}T00:00:00Z`).getTime());
}

function validateSubmission(body) {
  for (const [key, min] of [['studentName', 3], ['school', 2], ['guardianName', 3]]) {
    if (cleanText(body[key], 200).length < min) return `${key} alanı eksik.`;
  }
  if (!isValidTckn(body.tckn)) return 'T.C. kimlik numarası geçersiz.';
  if (!validDate(body.birthDate) || new Date(`${body.birthDate}T00:00:00Z`) > new Date()) return 'Doğum tarihi geçersiz.';
  for (const key of Object.keys(ENUMS)) if (!requireEnum(body, key)) return `${key} seçimi geçersiz.`;
  if (!isValidPhone(body.guardianPhone, false)) return 'Veli telefon numarası geçersiz.';
  if (!isValidPhone(body.studentPhone, true) || !isValidPhone(body.secondGuardianPhone, true)) {
    return 'Telefon numaralarından biri geçersiz.';
  }
  const availability = orderedUnique(body.availabilitySlots, TIME_SLOTS);
  if (!Array.isArray(body.availabilitySlots) || !availability.length || availability.length !== body.availabilitySlots.length) {
    return 'En az bir geçerli müsait saat aralığı seçin.';
  }
  if (body.rulesAccepted !== true || body.privacyAcknowledged !== true || body.termsAccepted !== true) {
    return 'Zorunlu onaylar eksik.';
  }
  return '';
}

function normalizeSubmission(body) {
  return {
    applicationType: String(body.applicationType), studentName: cleanText(body.studentName, 100),
    tckn: digits(body.tckn), birthDate: String(body.birthDate), gender: String(body.gender),
    school: cleanText(body.school, 140), grade: String(body.grade), guardianName: cleanText(body.guardianName, 100),
    guardianRelation: String(body.guardianRelation), guardianPhone: digits(body.guardianPhone).slice(0, 12),
    studentPhone: digits(body.studentPhone).slice(0, 12), address: cleanText(body.address, 400),
    secondGuardianName: cleanText(body.secondGuardianName, 100),
    secondGuardianPhone: digits(body.secondGuardianPhone).slice(0, 12), quranLevel: String(body.quranLevel),
    previousTraining: String(body.previousTraining), previousTrainingDetail: cleanText(body.previousTrainingDetail, 180),
    availabilitySlots: orderedUnique(body.availabilitySlots, TIME_SLOTS), notes: cleanText(body.notes, 600),
    consents: {
      rulesAccepted: true, privacyAcknowledged: true, termsAccepted: true,
      mediaConsent: String(body.mediaConsent), version: '2026-09-08'
    }
  };
}

function referenceFor(date) {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), (n) => n.toString(36)).join('')
    .replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase().padEnd(6, '0');
  return `BIA-${stamp}-${random}`;
}

function adminIdentity(admin) { return cleanText(admin.name || admin.id || admin.sub || 'admin', 80); }

function validateTeacher(body) {
  const teacher = body.teacher || body;
  const result = {
    id: cleanText(teacher.id, 80), name: cleanText(teacher.name, 100),
    gender: cleanText(teacher.gender, 20), phone: digits(teacher.phone).slice(0, 12),
    modes: orderedUnique(teacher.modes, ENUMS.applicationType), days: orderedUnique(teacher.days, WEEKDAYS),
    active: teacher.active !== false, username: normalizeUsername(teacher.username),
    password: cleanPassword(teacher.password)
  };
  if (result.name.length < 3) throw new RequestError('Öğretmen adı eksik.');
  if (!['erkek', 'kadin'].includes(result.gender)) throw new RequestError('Öğretmen cinsiyeti geçersiz.');
  if (!isValidPhone(teacher.phone, false)) throw new RequestError('Öğretmen telefon numarası geçersiz.');
  if (!Array.isArray(teacher.modes) || !result.modes.length || result.modes.length !== teacher.modes.length) {
    throw new RequestError('En az bir eğitim türü seçin.');
  }
  if (!Array.isArray(teacher.days) || !result.days.length || result.days.length !== teacher.days.length) {
    throw new RequestError('En az bir çalışma günü seçin.');
  }
  if (!/^[a-z0-9._-]{4,40}$/.test(result.username)) {
    throw new RequestError('Kullanıcı adı 4-40 karakter olmalı; yalnızca küçük harf, rakam, nokta, tire ve alt çizgi kullanılabilir.');
  }
  if (result.password && result.password.length < 8) throw new RequestError('Şifre en az 8 karakter olmalı.');
  return result;
}

function publicTeacher(teacher) {
  if (!teacher) return null;
  const { passwordHash, passwordSalt, ...safe } = teacher;
  return { ...safe, hasLogin: Boolean(passwordHash && passwordSalt && teacher.username) };
}

function attendanceDay(dateValue) {
  if (!validDate(dateValue)) return '';
  const index = new Date(`${dateValue}T12:00:00Z`).getUTCDay();
  return ['', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', ''][index] || '';
}

function mondayFor(dateValue) {
  const date = new Date(`${dateValue}T12:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

function isoPlusDays(dateValue, amount) {
  const date = new Date(`${dateValue}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function assertAttendanceDate(value) {
  const date = cleanText(value, 10);
  if (!validDate(date) || !attendanceDay(date)) throw new RequestError('Yoklama için hafta içinden geçerli bir gün seçin.');
  const today = new Date().toISOString().slice(0, 10);
  const earliest = isoPlusDays(today, -120);
  const latest = isoPlusDays(today, 7);
  if (date < earliest || date > latest) throw new RequestError('Yoklama yalnızca son 120 gün ve gelecek 7 gün içinde düzenlenebilir.');
  return date;
}

function normalizeSchedule(schedule) {
  if (!Array.isArray(schedule)) throw new RequestError('Beş günlük ders planı eksik.');
  const normalized = schedule.map((entry) => ({
    day: cleanText(entry.day, 20), teacherId: cleanText(entry.teacherId, 80), slot: cleanText(entry.slot, 20)
  }));
  const daySet = new Set(normalized.map((entry) => entry.day));
  if (normalized.length !== WEEKDAYS.length || daySet.size !== WEEKDAYS.length || WEEKDAYS.some((day) => !daySet.has(day))) {
    throw new RequestError('Pazartesiden cumaya tüm günler için öğretmen ve saat seçin.');
  }
  return WEEKDAYS.map((day) => normalized.find((entry) => entry.day === day));
}

function placementFor(records, applicationId) {
  return records.find((item) => item.kind === 'placement' && item.applicationId === applicationId);
}

function scheduleScore(schedule, currentLoads) {
  const teacherIds = schedule.map((entry) => entry.teacherId);
  const slots = schedule.map((entry) => entry.slot);
  const teacherCounts = teacherIds.reduce((counts, id) => ({ ...counts, [id]: (counts[id] || 0) + 1 }), {});
  const teacherCount = new Set(teacherIds).size;
  const slotCount = new Set(slots).size;
  const switches = teacherIds.slice(1).filter((id, index) => id !== teacherIds[index]).length;
  const projectedLoads = Object.entries(teacherCounts).map(([id, count]) => (currentLoads.get(id) || 0) + count);
  const maxLoad = Math.max(0, ...projectedLoads);
  const squaredLoad = projectedLoads.reduce((sum, load) => sum + load * load, 0);
  const slotOrder = slots.reduce((sum, slot) => sum + Math.max(0, TIME_SLOTS.indexOf(slot)), 0);
  return (teacherCount - 1) * 1e9 + (slotCount - 1) * 1e7 + switches * 1e5 + maxLoad * 1e3 + squaredLoad * 10 + slotOrder;
}

function automaticSchedule(application, teacherRecords, planningRecords) {
  const expectedGender = application.gender === 'kiz' ? 'kadin' : 'erkek';
  const teachers = teacherRecords.filter((teacher) => teacher.active && teacher.gender === expectedGender &&
    Array.isArray(teacher.modes) && teacher.modes.includes(application.applicationType));
  if (!teachers.length) {
    throw new RequestError(`${application.studentName} için uygun cinsiyette ve eğitim türünde aktif öğretmen yok.`, 409);
  }

  const availableSlots = orderedUnique(
    Array.isArray(application.availabilitySlots) && application.availabilitySlots.length ? application.availabilitySlots : TIME_SLOTS,
    TIME_SLOTS
  );
  const occupied = new Set(planningRecords.filter((item) => item.kind === 'placement')
    .flatMap((placement) => (placement.schedule || []).map((entry) => `${entry.teacherId}|${entry.day}|${entry.slot}`)));
  const loads = new Map();
  planningRecords.filter((item) => item.kind === 'placement').forEach((placement) => {
    (placement.schedule || []).forEach((entry) => loads.set(entry.teacherId, (loads.get(entry.teacherId) || 0) + 1));
  });

  const choicesByDay = WEEKDAYS.map((day) => teachers
    .filter((teacher) => Array.isArray(teacher.days) && teacher.days.includes(day))
    .flatMap((teacher) => availableSlots
      .filter((slot) => !occupied.has(`${teacher.id}|${day}|${slot}`))
      .map((slot) => ({ day, teacherId: teacher.id, teacherName: teacher.name, slot })))
    .sort((a, b) => (loads.get(a.teacherId) || 0) - (loads.get(b.teacherId) || 0) ||
      a.teacherName.localeCompare(b.teacherName, 'tr') || TIME_SLOTS.indexOf(a.slot) - TIME_SLOTS.indexOf(b.slot)));

  const missingDay = choicesByDay.findIndex((choices) => !choices.length);
  if (missingDay >= 0) {
    throw new RequestError(`${application.studentName} için ${WEEKDAYS[missingDay]} günü uygun öğretmen saati kalmadı.`, 409);
  }

  const perfectSchedules = [];
  teachers.forEach((teacher) => {
    availableSlots.forEach((slot) => {
      const schedule = WEEKDAYS.map((day, index) => choicesByDay[index]
        .find((choice) => choice.teacherId === teacher.id && choice.slot === slot));
      if (schedule.every(Boolean)) perfectSchedules.push({ schedule, score: scheduleScore(schedule, loads) });
    });
  });
  if (perfectSchedules.length) {
    perfectSchedules.sort((a, b) => a.score - b.score);
    return perfectSchedules[0].schedule;
  }

  let states = [{ schedule: [], score: 0 }];
  choicesByDay.forEach((choices) => {
    const candidates = [];
    states.forEach((state) => {
      choices.forEach((choice) => {
        const schedule = [...state.schedule, choice];
        candidates.push({ schedule, score: scheduleScore(schedule, loads) });
      });
    });
    candidates.sort((a, b) => a.score - b.score);
    states = candidates.slice(0, 1600);
  });
  if (!states.length) throw new RequestError(`${application.studentName} için çakışmasız program oluşturulamadı.`, 409);
  return states[0].schedule;
}

function nextMondayIso() {
  const date = new Date();
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() + (((8 - day) % 7) || 7));
  return date.toISOString().slice(0, 10);
}

function demoTckn(index) {
  const firstNine = String(900000000 + index).split('').map(Number);
  const odd = firstNine[0] + firstNine[2] + firstNine[4] + firstNine[6] + firstNine[8];
  const even = firstNine[1] + firstNine[3] + firstNine[5] + firstNine[7];
  const tenth = ((odd * 7 - even) % 10 + 10) % 10;
  return [...firstNine, tenth, ([...firstNine, tenth].reduce((sum, digit) => sum + digit, 0) % 10)].join('');
}

export default async function handler(req) {
  const githubToken = process.env.BIA_GITHUB_TOKEN || '';
  const jwtSecret = process.env.BIA_JWT_SECRET || process.env.BIA_ADMIN_PASSWORD || '';
  const encryptionSecret = process.env.BIA_APPLICATIONS_ENCRYPTION_KEY || jwtSecret;
  const dataRepo = process.env.BIA_APPLICATIONS_REPO || DEFAULT_REPO;
  const dataBranch = process.env.BIA_APPLICATIONS_BRANCH || 'main';
  const dataPath = (process.env.BIA_APPLICATIONS_PATH || 'content/applications').replace(/^\/+|\/+$/g, '');

  const requestOrigin = req.headers.get('origin') || '';
  const allowedOrigin = requestOrigin === 'https://birlikteiyilik.com' || requestOrigin === 'https://www.birlikteiyilik.com' ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin);
  const cors = allowedOrigin ? {
    'Access-Control-Allow-Origin': requestOrigin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Vary': 'Origin'
  } : {};

  if (req.method === 'OPTIONS') return new Response(null, { status: allowedOrigin ? 204 : 403, headers: cors });
  if (requestOrigin && !allowedOrigin) return json({ error: 'İzin verilmeyen istek kaynağı.' }, 403, cors);
  if (!githubToken || !jwtSecret || !encryptionSecret) {
    return json({ error: 'Başvuru sistemi henüz yapılandırılmadı.' }, 503, cors);
  }

  async function github(path, method, body) {
    const response = await fetch(`${GH_API}${path}`, {
      method: method || 'GET',
      headers: {
        'Authorization': `Bearer ${githubToken}`, 'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'BIA-Applications/2.0'
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (_) { data = {}; }
    return { status: response.status, ok: response.ok, data };
  }

  async function getArchive(fileName) {
    const path = `/repos/${dataRepo}/contents/${dataPath}/${fileName}?ref=${encodeURIComponent(dataBranch)}`;
    const response = await github(path);
    if (response.status === 404) return { records: [], sha: '' };
    if (!response.ok || !response.data.content) throw new Error('Başvuru arşivi okunamadı.');
    const envelopeText = decoder.decode(bytesFromBase64(response.data.content));
    return { records: await decryptRecords(JSON.parse(envelopeText), encryptionSecret), sha: response.data.sha || '' };
  }

  async function putArchive(fileName, records, sha, message) {
    const envelope = await encryptRecords(records, encryptionSecret);
    const content = base64FromBytes(encoder.encode(JSON.stringify(envelope)));
    return github(`/repos/${dataRepo}/contents/${dataPath}/${fileName}`, 'PUT', {
      message, content, branch: dataBranch, ...(sha ? { sha } : {})
    });
  }

  async function mutateArchive(fileName, mutator, message) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await getArchive(fileName);
      const result = await mutator([...current.records]);
      const saved = await putArchive(fileName, result.records, current.sha, message);
      if (saved.ok && saved.data.content?.sha) return result.value;
      if (saved.status !== 409 && saved.status !== 422) throw new Error('Başvuru arşivi kaydedilemedi.');
    }
    throw new RequestError('Veriler aynı anda güncellendi. Lütfen tekrar deneyin.', 409);
  }

  async function bearerPayload() {
    const header = req.headers.get('authorization') || '';
    return header.startsWith('Bearer ') ? verifyJwt(header.slice(7), jwtSecret) : null;
  }

  async function checkAdmin() {
    const payload = await bearerPayload();
    return payload && payload.role !== 'teacher' ? payload : null;
  }

  async function requireTeacherSession() {
    const payload = await bearerPayload();
    if (!payload || payload.role !== 'teacher' || !payload.sub) throw new RequestError('Öğretmen oturumu geçersiz.', 401);
    const planning = await getArchive(PLANNING_FILE);
    const teacher = planning.records.find((item) => item.kind === 'teacher' && item.id === payload.sub);
    if (!teacher || !teacher.active) throw new RequestError('Öğretmen hesabı aktif değil.', 403);
    return { payload, planning, teacher };
  }

  function teacherDayLessons(records, teacher, date) {
    const day = attendanceDay(date);
    if (!day) return [];
    const saved = new Map(records.filter((item) => item.kind === 'attendance' && item.teacherId === teacher.id && item.lessonDate === date)
      .map((item) => [`${item.applicationId}|${item.slot}`, item]));
    return records.filter((item) => item.kind === 'placement' && (!item.startDate || item.startDate <= date))
      .flatMap((placement) => (placement.schedule || [])
        .filter((entry) => entry.teacherId === teacher.id && entry.day === day)
        .map((entry) => {
          const attendance = saved.get(`${placement.applicationId}|${entry.slot}`);
          return {
            applicationId: placement.applicationId, applicationReference: placement.applicationReference,
            studentName: placement.studentName, applicationType: placement.applicationType,
            startDate: placement.startDate, day, slot: entry.slot,
            status: attendance?.status || '', note: attendance?.note || '',
            attendanceId: attendance?.id || '', updatedAt: attendance?.updatedAt || ''
          };
        }))
      .sort((a, b) => TIME_SLOTS.indexOf(a.slot) - TIME_SLOTS.indexOf(b.slot) || a.studentName.localeCompare(b.studentName, 'tr'));
  }

  function teacherWeekSummary(records, teacher, selectedDate) {
    const start = mondayFor(selectedDate);
    return WEEKDAYS.map((day, index) => {
      const date = isoPlusDays(start, index);
      const lessons = teacherDayLessons(records, teacher, date);
      return {
        day, date, expected: lessons.length,
        completed: lessons.filter((item) => item.status).length
      };
    });
  }

  async function requireApplication(applicationId, applicationCreatedAt) {
    const createdAt = new Date(String(applicationCreatedAt || ''));
    if (!applicationId || !Number.isFinite(createdAt.getTime())) throw new RequestError('Başvuru bilgisi geçersiz.');
    const archive = await getArchive(`${createdAt.toISOString().slice(0, 7)}.enc.json`);
    const application = archive.records.find((item) => item.id === applicationId);
    if (!application) throw new RequestError('Başvuru bulunamadı.', 404);
    return application;
  }

  async function getApplicationFiles() {
    const listing = await github(`/repos/${dataRepo}/contents/${dataPath}?ref=${encodeURIComponent(dataBranch)}`);
    if (listing.status !== 404 && (!listing.ok || !Array.isArray(listing.data))) throw new Error('Arşiv listelenemedi.');
    return listing.status === 404 ? [] : listing.data
      .filter((entry) => entry.type === 'file' && /^\d{4}-\d{2}\.enc\.json$/.test(entry.name))
      .map((entry) => entry.name)
      .sort((a, b) => b.localeCompare(a));
  }

  async function getAllApplications() {
    const files = await getApplicationFiles();
    const archives = await Promise.all(files.map((fileName) => getArchive(fileName)));
    return archives.flatMap((archive) => archive.records)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  async function markApplicationsAsReserve(skipped, admin) {
    const reserve = new Map((skipped || [])
      .filter((item) => item.applicationId && item.reason !== 'Programı zaten var.' && item.hadExisting !== true)
      .map((item) => [item.applicationId, cleanText(item.reason, 400)]));
    if (!reserve.size) return 0;
    const files = await getApplicationFiles();
    let updatedCount = 0;
    for (const fileName of files) {
      const current = await getArchive(fileName);
      if (!current.records.some((item) => reserve.has(item.id))) continue;
      const changed = await mutateArchive(fileName, (records) => {
        let count = 0;
        const now = new Date().toISOString();
        const next = records.map((item) => {
          if (!reserve.has(item.id)) return item;
          count += 1;
          const reason = reserve.get(item.id);
          const automaticNote = `Otomatik atama yapılamadı; yedek listeye alındı. ${reason}`;
          return {
            ...item, status: 'yedek', autoReserveReason: reason,
            adminNote: item.autoReserveReason === reason ? item.adminNote :
              (item.adminNote ? `${item.adminNote}\n${automaticNote}`.slice(0, 1000) : automaticNote),
            updatedAt: now, updatedBy: adminIdentity(admin)
          };
        });
        return { records: next, value: count };
      }, 'BIA: atanamayan başvurular yedek listeye alındı');
      updatedCount += changed;
    }
    return updatedCount;
  }

  async function saveAutomaticPlacements(targets, startDate, admin, replaceIds) {
    const replaceSet = new Set(replaceIds || []);
    return mutateArchive(PLANNING_FILE, (records) => {
      let working = records;
      const created = [];
      const skipped = [];
      const sortedTargets = targets.slice().sort((a, b) => {
        const aSlots = Array.isArray(a.availabilitySlots) ? a.availabilitySlots.length : TIME_SLOTS.length;
        const bSlots = Array.isArray(b.availabilitySlots) ? b.availabilitySlots.length : TIME_SLOTS.length;
        return aSlots - bSlots || String(a.createdAt).localeCompare(String(b.createdAt));
      });

      sortedTargets.forEach((application) => {
        const existing = placementFor(working, application.id);
        if (existing && !replaceSet.has(application.id)) {
          skipped.push({ applicationId: application.id, studentName: application.studentName, reason: 'Programı zaten var.' });
          return;
        }
        const recordsForPlan = existing
          ? working.filter((item) => !(item.kind === 'placement' && item.applicationId === application.id))
          : working;
        try {
          const teacherRecords = recordsForPlan.filter((item) => item.kind === 'teacher');
          const schedule = automaticSchedule(application, teacherRecords, recordsForPlan);
          const now = new Date().toISOString();
          const placement = {
            kind: 'placement', id: existing?.id || crypto.randomUUID(), applicationId: application.id,
            applicationCreatedAt: application.createdAt, applicationReference: application.reference,
            studentName: application.studentName, applicationType: application.applicationType,
            startDate, schedule, isDemo: application.isDemo === true,
            createdAt: existing?.createdAt || now, updatedAt: now, updatedBy: adminIdentity(admin),
            assignmentMethod: 'automatic'
          };
          working = [...recordsForPlan, placement];
          created.push(placement);
        } catch (error) {
          skipped.push({
            applicationId: application.id, studentName: application.studentName,
            reason: error.message, hadExisting: Boolean(existing)
          });
        }
      });
      return { records: working, value: { placements: created, skipped } };
    }, 'BIA: düzenli otomatik ders ataması yapıldı');
  }

  async function removeApplicationsFromArchives(predicate, message) {
    const files = await getApplicationFiles();
    const removed = [];
    for (const fileName of files) {
      const current = await getArchive(fileName);
      if (!current.records.some(predicate)) continue;
      const deleted = await mutateArchive(fileName, (records) => {
        const matches = records.filter(predicate);
        return { records: records.filter((item) => !predicate(item)), value: matches };
      }, message);
      removed.push(...deleted);
    }
    return removed;
  }

  if (req.method === 'GET') {
    const admin = await checkAdmin();
    if (!admin) return json({ error: 'Yetkisiz erişim.' }, 401, cors);
    try {
      const [records, planning] = await Promise.all([getAllApplications(), getArchive(PLANNING_FILE)]);
      return json({
        data: records,
        teachers: planning.records.filter((item) => item.kind === 'teacher').map(publicTeacher),
        placements: planning.records.filter((item) => item.kind === 'placement'),
        attendance: planning.records.filter((item) => item.kind === 'attendance'),
        meta: { weekdays: WEEKDAYS, timeSlots: TIME_SLOTS, attendanceStatuses: ATTENDANCE_STATUSES }
      }, 200, cors);
    } catch (_) {
      return json({ error: 'Şifreli başvuru arşivi açılamadı. Şifreleme anahtarını kontrol edin.' }, 500, cors);
    }
  }

  if (req.method === 'POST') {
    let body = {};
    try { body = await req.json(); } catch (_) { return json({ error: 'İstek biçimi geçersiz.' }, 400, cors); }

    if (body.action === 'submit') {
      if (cleanText(body.website, 200)) return json({ ok: true, reference: referenceFor(new Date()) }, 200, cors);
      if (!Number.isFinite(Number(body.startedAt)) || Date.now() - Number(body.startedAt) < 2500) {
        return json({ error: 'Form çok hızlı gönderildi. Lütfen alanları kontrol edip yeniden deneyin.' }, 429, cors);
      }
      const validationError = validateSubmission(body);
      if (validationError) return json({ error: validationError }, 400, cors);
      const now = new Date();
      const record = {
        id: crypto.randomUUID(), reference: referenceFor(now), ...normalizeSubmission(body),
        status: 'yeni', adminNote: '', createdAt: now.toISOString(), updatedAt: now.toISOString()
      };
      try {
        const reference = await mutateArchive(`${now.toISOString().slice(0, 7)}.enc.json`, (records) => {
          const duplicate = records.find((item) => item.tckn === record.tckn && item.applicationType === record.applicationType);
          if (duplicate) return { records, value: duplicate.reference };
          records.push(record);
          return { records, value: record.reference };
        }, `BIA: ${now.toISOString().slice(0, 7)} başvuru arşivi güncellendi`);
        return json({ ok: true, reference }, 201, cors);
      } catch (_) {
        return json({ error: 'Başvuru güvenli arşive kaydedilemedi.' }, 500, cors);
      }
    }

    if (body.action === 'teacher-login') {
      const username = normalizeUsername(body.username);
      const password = cleanPassword(body.password);
      if (!username || !password) return json({ error: 'Kullanıcı adı ve şifre gereklidir.' }, 400, cors);
      try {
        const planning = await getArchive(PLANNING_FILE);
        const teacher = planning.records.find((item) => item.kind === 'teacher' && item.username === username);
        let matches = false;
        if (teacher) matches = await passwordMatches(password, teacher);
        else await hashPassword(password, 'AAAAAAAAAAAAAAAAAAAAAA==');
        if (!teacher || !matches || !teacher.active) {
          return json({ error: 'Kullanıcı adı veya şifre hatalı.' }, 401, cors);
        }
        const now = Math.floor(Date.now() / 1000);
        const token = await signJwt({
          sub: teacher.id, role: 'teacher', name: teacher.name, iat: now, exp: now + (12 * 60 * 60)
        }, jwtSecret);
        return json({ ok: true, token, teacher: publicTeacher(teacher) }, 200, cors);
      } catch (_) {
        return json({ error: 'Öğretmen oturumu şu anda açılamadı.' }, 500, cors);
      }
    }

    if (body.action === 'teacher-data') {
      try {
        const date = assertAttendanceDate(body.date);
        const { planning, teacher } = await requireTeacherSession();
        return json({
          ok: true, teacher: publicTeacher(teacher), date, day: attendanceDay(date),
          lessons: teacherDayLessons(planning.records, teacher, date),
          week: teacherWeekSummary(planning.records, teacher, date),
          meta: { weekdays: WEEKDAYS, timeSlots: TIME_SLOTS, attendanceStatuses: ATTENDANCE_STATUSES }
        }, 200, cors);
      } catch (error) {
        return json({ error: error.message || 'Dersler yüklenemedi.' }, error.status || 500, cors);
      }
    }

    if (body.action === 'attendance-save') {
      try {
        const date = assertAttendanceDate(body.date);
        if (date > new Date().toISOString().slice(0, 10)) throw new RequestError('Gelecek bir ders için yoklama kaydedilemez.', 409);
        const entries = Array.isArray(body.entries) ? body.entries.slice(0, 100) : [];
        if (!entries.length) throw new RequestError('Kaydedilecek yoklama seçimi bulunamadı.');
        const session = await requireTeacherSession();
        const teacher = session.teacher;
        const day = attendanceDay(date);
        const now = new Date().toISOString();
        const saved = await mutateArchive(PLANNING_FILE, (records) => {
          const currentTeacher = records.find((item) => item.kind === 'teacher' && item.id === teacher.id);
          if (!currentTeacher?.active) throw new RequestError('Öğretmen hesabı aktif değil.', 403);
          const available = new Map(teacherDayLessons(records, currentTeacher, date)
            .map((lesson) => [`${lesson.applicationId}|${lesson.slot}`, lesson]));
          const seen = new Set();
          const result = [];
          entries.forEach((entry) => {
            const applicationId = cleanText(entry.applicationId, 80);
            const slot = cleanText(entry.slot, 20);
            const status = cleanText(entry.status, 20);
            const note = cleanText(entry.note, 300);
            const key = `${applicationId}|${slot}`;
            const lesson = available.get(key);
            if (!lesson || seen.has(key)) throw new RequestError('Ders ataması değişti. Programı yenileyip tekrar deneyin.', 409);
            if (!ATTENDANCE_STATUSES.includes(status)) throw new RequestError(`${lesson.studentName} için yoklama durumu seçin.`);
            seen.add(key);
            const index = records.findIndex((item) => item.kind === 'attendance' && item.teacherId === teacher.id &&
              item.applicationId === applicationId && item.lessonDate === date && item.slot === slot);
            const existing = index >= 0 ? records[index] : null;
            const attendance = {
              kind: 'attendance', id: existing?.id || crypto.randomUUID(), teacherId: teacher.id,
              teacherName: currentTeacher.name, applicationId, applicationReference: lesson.applicationReference,
              studentName: lesson.studentName, applicationType: lesson.applicationType,
              lessonDate: date, day, slot, status, note, isDemo: Boolean(existing?.isDemo ||
                records.find((item) => item.kind === 'placement' && item.applicationId === applicationId)?.isDemo),
              createdAt: existing?.createdAt || now, updatedAt: now, updatedBy: currentTeacher.name
            };
            if (index >= 0) records[index] = attendance; else records.push(attendance);
            result.push(attendance);
          });
          return { records, value: result };
        }, `BIA: ${date} öğretmen yoklaması güncellendi`);
        return json({ ok: true, data: saved }, 200, cors);
      } catch (error) {
        return json({ error: error.message || 'Yoklama kaydedilemedi.' }, error.status || 500, cors);
      }
    }

    const admin = await checkAdmin();
    if (!admin) return json({ error: 'Yetkisiz erişim.' }, 401, cors);

    if (body.action === 'auto-plan') {
      try {
        const startDate = cleanText(body.startDate, 10);
        if (!validDate(startDate)) throw new RequestError('Otomatik atama için başlangıç günü seçin.');
        const requestedIds = [...new Set((Array.isArray(body.applicationIds) ? body.applicationIds : [])
          .map((id) => cleanText(id, 80)).filter(Boolean))].slice(0, 100);
        const allApplications = await getAllApplications();
        const targets = requestedIds.length
          ? allApplications.filter((application) => requestedIds.includes(application.id))
          : allApplications.filter((application) => ['yeni', 'inceleniyor', 'uygun'].includes(application.status));
        if (!targets.length) throw new RequestError('Otomatik atanabilecek başvuru bulunamadı.', 404);
        const result = await saveAutomaticPlacements(
          targets, startDate, admin,
          body.replaceExisting === true ? requestedIds : []
        );
        const reserved = await markApplicationsAsReserve(result.skipped, admin);
        return json({ ok: true, data: result.placements, skipped: result.skipped, reserved }, 200, cors);
      } catch (error) {
        return json({ error: error.message || 'Otomatik ders ataması yapılamadı.' }, error.status || 500, cors);
      }
    }

    if (body.action === 'demo-seed') {
      try {
        const now = new Date();
        const monthFile = `${now.toISOString().slice(0, 7)}.enc.json`;
        const studentNames = [
          'Test Erkek Öğrenci 01', 'Test Erkek Öğrenci 02', 'Test Erkek Öğrenci 03',
          'Test Erkek Öğrenci 04', 'Test Erkek Öğrenci 05', 'Test Kız Öğrenci 01',
          'Test Kız Öğrenci 02', 'Test Kız Öğrenci 03', 'Test Kız Öğrenci 04', 'Test Kız Öğrenci 05'
        ];
        const demoAvailability = [
          ['17:40-18:00'],
          ['17:40-18:00'],
          ['17:20-17:40', '17:40-18:00'],
          ['16:40-17:00', '17:00-17:20'],
          ['15:00-15:20', '15:20-15:40', '15:40-16:00'],
          ['17:40-18:00'],
          ['17:40-18:00'],
          ['17:20-17:40', '17:40-18:00'],
          ['16:00-16:20', '16:20-16:40', '16:40-17:00'],
          ['15:20-15:40', '15:40-16:00', '16:00-16:20', '16:20-16:40']
        ];
        const demoApplications = await mutateArchive(monthFile, (records) => {
          studentNames.forEach((studentName, index) => {
            const demoKey = `bia-demo-student-${index + 1}`;
            const existingIndex = records.findIndex((item) => item.demoKey === demoKey);
            if (existingIndex >= 0) {
              records[existingIndex] = {
                ...records[existingIndex], availabilitySlots: demoAvailability[index],
                updatedAt: new Date().toISOString(), updatedBy: adminIdentity(admin)
              };
              return;
            }
            const createdAt = new Date(now.getTime() - index * 60000).toISOString();
            records.push({
              id: crypto.randomUUID(), reference: `BIA-TEST-${String(index + 1).padStart(2, '0')}`,
              applicationType: 'yuz-yuze', studentName, tckn: demoTckn(index + 1),
              birthDate: `${2013 + (index % 3)}-0${(index % 8) + 1}-15`, gender: index < 5 ? 'erkek' : 'kiz',
              school: 'Birlikte İyilik Test Okulu', grade: String(3 + (index % 6)),
              guardianName: `Test Veli ${String(index + 1).padStart(2, '0')}`, guardianRelation: index % 2 ? 'anne' : 'baba',
              guardianPhone: `050000000${String(index + 1).padStart(2, '0')}`, studentPhone: '',
              address: 'Test kaydıdır; gerçek kişiye ait değildir.', secondGuardianName: '', secondGuardianPhone: '',
              quranLevel: ENUMS.quranLevel[index % ENUMS.quranLevel.length], previousTraining: index % 3 === 0 ? 'evet' : 'hayir',
              previousTrainingDetail: '', availabilitySlots: demoAvailability[index], notes: 'Yönetim paneli test kaydı.',
              consents: { rulesAccepted: true, privacyAcknowledged: true, termsAccepted: true, mediaConsent: 'izin-veriyorum', version: '2026-09-08' },
              status: 'uygun', adminNote: 'Otomatik oluşturulan test kaydı.', isDemo: true, demoKey,
              createdAt, updatedAt: createdAt, updatedBy: adminIdentity(admin)
            });
          });
          return { records, value: records.filter((item) => item.isDemo === true && /^bia-demo-student-/.test(item.demoKey || '')) };
        }, 'BIA: 10 örnek öğrenci başvurusu eklendi');

        const teacherDefinitions = [
          ['Mehmet Kaya (Test)', 'erkek'], ['Mustafa Demir (Test)', 'erkek'],
          ['Ayşe Yıldız (Test)', 'kadin'], ['Zeynep Arslan (Test)', 'kadin'], ['Fatma Çelik (Test)', 'kadin']
        ];
        const demoTeachers = await mutateArchive(PLANNING_FILE, (records) => {
          teacherDefinitions.forEach(([name, gender], index) => {
            const demoKey = `bia-demo-teacher-${index + 1}`;
            if (records.some((item) => item.demoKey === demoKey)) return;
            const timestamp = new Date().toISOString();
            records.push({
              kind: 'teacher', id: crypto.randomUUID(), name, gender, phone: `050000001${String(index + 1).padStart(2, '0')}`,
              modes: [...ENUMS.applicationType], days: [...WEEKDAYS], active: true, isDemo: true, demoKey,
              createdAt: timestamp, updatedAt: timestamp, updatedBy: adminIdentity(admin)
            });
          });
          return { records, value: records.filter((item) => item.kind === 'teacher' && item.isDemo === true && /^bia-demo-teacher-/.test(item.demoKey || '')) };
        }, 'BIA: 5 örnek öğretmen eklendi');

        const startDate = validDate(body.startDate) ? String(body.startDate) : nextMondayIso();
        const planned = await saveAutomaticPlacements(demoApplications, startDate, admin, demoApplications.map((item) => item.id));
        const reserved = await markApplicationsAsReserve(planned.skipped, admin);
        return json({
          ok: true, data: { applications: demoApplications, teachers: demoTeachers, placements: planned.placements },
          skipped: planned.skipped, reserved
        }, 200, cors);
      } catch (error) {
        return json({ error: error.message || 'Test verisi oluşturulamadı.' }, error.status || 500, cors);
      }
    }

    if (body.action === 'application-delete') {
      try {
        const applicationId = cleanText(body.applicationId, 80);
        const application = await requireApplication(applicationId, body.applicationCreatedAt);
        const planningResult = await mutateArchive(PLANNING_FILE, (records) => {
          const assignments = records.filter((item) => item.kind === 'placement' && item.applicationId === applicationId);
          return {
            records: records.filter((item) => !(['placement', 'attendance'].includes(item.kind) && item.applicationId === applicationId)),
            value: assignments.length
          };
        }, `BIA: ${application.reference} öğrenci ataması silindi`);
        const createdAt = new Date(application.createdAt);
        const deleted = await mutateArchive(`${createdAt.toISOString().slice(0, 7)}.enc.json`, (records) => {
          const target = records.find((item) => item.id === applicationId);
          if (!target) throw new RequestError('Öğrenci başvurusu bulunamadı.', 404);
          return { records: records.filter((item) => item.id !== applicationId), value: target };
        }, `BIA: ${application.reference} öğrenci başvurusu silindi`);
        return json({ ok: true, data: deleted, removedAssignments: planningResult }, 200, cors);
      } catch (error) {
        return json({ error: error.message || 'Öğrenci başvurusu silinemedi.' }, error.status || 500, cors);
      }
    }

    if (body.action === 'teacher-delete') {
      try {
        const teacherId = cleanText(body.teacherId, 80);
        if (!teacherId) throw new RequestError('Öğretmen bilgisi geçersiz.');
        const deleted = await mutateArchive(PLANNING_FILE, (records) => {
          const teacher = records.find((item) => item.kind === 'teacher' && item.id === teacherId);
          if (!teacher) throw new RequestError('Öğretmen bulunamadı.', 404);
          const assignments = records.filter((item) => item.kind === 'placement' &&
            (item.schedule || []).some((entry) => entry.teacherId === teacherId));
          if (assignments.length && body.removeAssignments !== true) {
            throw new RequestError(`${teacher.name} için ${assignments.length} öğrenci programı var. Önce atamaları kaldırın.`, 409);
          }
          return {
            records: records.filter((item) => !(item.kind === 'teacher' && item.id === teacherId) &&
              !(item.kind === 'placement' && (item.schedule || []).some((entry) => entry.teacherId === teacherId))),
            value: { teacher, removedAssignments: assignments.length }
          };
        }, 'BIA: öğretmen ve bağlı ders atamaları silindi');
        return json({ ok: true, data: deleted }, 200, cors);
      } catch (error) {
        return json({ error: error.message || 'Öğretmen silinemedi.' }, error.status || 500, cors);
      }
    }

    if (body.action === 'bulk-delete') {
      try {
        const scope = cleanText(body.scope, 30);
        if (!['demo', 'assignments', 'teachers', 'applications'].includes(scope)) {
          throw new RequestError('Toplu silme kapsamı geçersiz.');
        }

        if (scope === 'assignments') {
          const result = await mutateArchive(PLANNING_FILE, (records) => {
            const removedAssignments = records.filter((item) => item.kind === 'placement').length;
            return { records: records.filter((item) => item.kind !== 'placement'), value: { removedAssignments } };
          }, 'BIA: tüm ders atamaları silindi');
          return json({ ok: true, data: result }, 200, cors);
        }

        if (scope === 'teachers') {
          const result = await mutateArchive(PLANNING_FILE, (records) => {
            const removedTeachers = records.filter((item) => item.kind === 'teacher').length;
            const removedAssignments = records.filter((item) => item.kind === 'placement').length;
            return {
              records: records.filter((item) => item.kind !== 'teacher' && item.kind !== 'placement'),
              value: { removedTeachers, removedAssignments }
            };
          }, 'BIA: tüm öğretmenler ve ders atamaları silindi');
          return json({ ok: true, data: result }, 200, cors);
        }

        if (scope === 'applications') {
          const planningResult = await mutateArchive(PLANNING_FILE, (records) => {
            const removedAssignments = records.filter((item) => item.kind === 'placement').length;
            const removedAttendance = records.filter((item) => item.kind === 'attendance').length;
            return {
              records: records.filter((item) => item.kind !== 'placement' && item.kind !== 'attendance'),
              value: { removedAssignments, removedAttendance }
            };
          }, 'BIA: tüm öğrenci ders atamaları silindi');
          const removedApplications = await removeApplicationsFromArchives(() => true, 'BIA: tüm öğrenci başvuruları silindi');
          return json({
            ok: true,
            data: { removedApplications: removedApplications.length, removedAssignments: planningResult.removedAssignments,
              removedAttendance: planningResult.removedAttendance }
          }, 200, cors);
        }

        const allApplications = await getAllApplications();
        const demoApplicationIds = new Set(allApplications.filter((item) => item.isDemo === true).map((item) => item.id));
        const planningResult = await mutateArchive(PLANNING_FILE, (records) => {
          const demoTeacherIds = new Set(records.filter((item) => item.kind === 'teacher' && item.isDemo === true).map((item) => item.id));
          const shouldRemovePlacement = (item) => item.kind === 'placement' &&
            (item.isDemo === true || demoApplicationIds.has(item.applicationId) ||
              (item.schedule || []).some((entry) => demoTeacherIds.has(entry.teacherId)));
          const shouldRemoveAttendance = (item) => item.kind === 'attendance' &&
            (item.isDemo === true || demoApplicationIds.has(item.applicationId) || demoTeacherIds.has(item.teacherId));
          const removedTeachers = records.filter((item) => item.kind === 'teacher' && item.isDemo === true).length;
          const removedAssignments = records.filter(shouldRemovePlacement).length;
          const removedAttendance = records.filter(shouldRemoveAttendance).length;
          return {
            records: records.filter((item) => !(item.kind === 'teacher' && item.isDemo === true) &&
              !shouldRemovePlacement(item) && !shouldRemoveAttendance(item)),
            value: { removedTeachers, removedAssignments, removedAttendance }
          };
        }, 'BIA: test öğretmenleri ve atamaları silindi');
        const removedApplications = await removeApplicationsFromArchives(
          (item) => item.isDemo === true,
          'BIA: test öğrenci başvuruları silindi'
        );
        return json({
          ok: true,
          data: { removedApplications: removedApplications.length, ...planningResult }
        }, 200, cors);
      } catch (error) {
        return json({ error: error.message || 'Toplu silme işlemi tamamlanamadı.' }, error.status || 500, cors);
      }
    }

    if (body.action === 'teacher-save') {
      try {
        const input = validateTeacher(body);
        const now = new Date().toISOString();
        const credentials = input.password ? await hashPassword(input.password) : null;
        const saved = await mutateArchive(PLANNING_FILE, (records) => {
          const index = input.id ? records.findIndex((item) => item.kind === 'teacher' && item.id === input.id) : -1;
          const existing = index >= 0 ? records[index] : null;
          if (input.id && !existing) throw new RequestError('Öğretmen bulunamadı.', 404);
          const usernameOwner = records.find((item) => item.kind === 'teacher' && item.username === input.username && item.id !== input.id);
          if (usernameOwner) throw new RequestError('Bu kullanıcı adı başka bir öğretmen tarafından kullanılıyor.', 409);
          if (!credentials && (!existing?.passwordHash || !existing?.passwordSalt)) {
            throw new RequestError('Öğretmen hesabı için en az 8 karakterli bir şifre belirleyin.');
          }
          if (existing) {
            const assignedEntries = records.filter((item) => item.kind === 'placement')
              .flatMap((item) => (item.schedule || []).map((entry) => ({ ...entry, mode: item.applicationType })))
              .filter((entry) => entry.teacherId === input.id);
            if (assignedEntries.length && input.gender !== existing.gender) {
              throw new RequestError('Mevcut dersleri olan öğretmenin cinsiyet bilgisi değiştirilemez.', 409);
            }
            const used = assignedEntries.find((entry) => !input.days.includes(entry.day) || !input.modes.includes(entry.mode));
            if (used) throw new RequestError('Bu öğretmenin mevcut dersleri var. Kullanılan gün veya eğitim türü kaldırılamaz.', 409);
          }
          const teacher = {
            kind: 'teacher', id: existing?.id || crypto.randomUUID(), name: input.name, gender: input.gender,
            phone: input.phone, modes: input.modes, days: input.days, active: input.active,
            username: input.username,
            passwordHash: credentials?.passwordHash || existing?.passwordHash,
            passwordSalt: credentials?.passwordSalt || existing?.passwordSalt,
            passwordUpdatedAt: credentials ? now : existing?.passwordUpdatedAt,
            createdAt: existing?.createdAt || now, updatedAt: now, updatedBy: adminIdentity(admin)
          };
          if (index >= 0) records[index] = teacher; else records.push(teacher);
          return { records, value: publicTeacher(teacher) };
        }, 'BIA: öğretmen bilgisi güncellendi');
        return json({ ok: true, data: saved }, 200, cors);
      } catch (error) {
        return json({ error: error.message || 'Öğretmen kaydedilemedi.' }, error.status || 500, cors);
      }
    }

    if (body.action === 'placement-save') {
      try {
        const applicationId = cleanText(body.applicationId, 80);
        const application = await requireApplication(applicationId, body.applicationCreatedAt);
        if (!validDate(body.startDate)) throw new RequestError('Başlangıç tarihi seçin.');
        const schedule = normalizeSchedule(body.schedule);
        const saved = await mutateArchive(PLANNING_FILE, (records) => {
          const teachers = new Map(records.filter((item) => item.kind === 'teacher').map((item) => [item.id, item]));
          const existing = placementFor(records, applicationId);
          const hydratedSchedule = schedule.map((entry) => {
            const teacher = teachers.get(entry.teacherId);
            if (!teacher) throw new RequestError(`${entry.day} için öğretmen seçin.`);
            if (!teacher.active) throw new RequestError(`${teacher.name} pasif durumda; yeni ders atanamaz.`, 409);
            const expectedGender = application.gender === 'kiz' ? 'kadin' : 'erkek';
            if (teacher.gender !== expectedGender) {
              throw new RequestError(`${application.studentName} için ${application.gender === 'kiz' ? 'kadın' : 'erkek'} öğretmen seçin.`, 409);
            }
            if (!teacher.modes.includes(application.applicationType)) throw new RequestError(`${teacher.name}, bu eğitim türünde ders vermiyor.`, 409);
            if (!teacher.days.includes(entry.day)) throw new RequestError(`${teacher.name}, seçilen günde çalışmıyor.`, 409);
            if (!TIME_SLOTS.includes(entry.slot)) throw new RequestError(`${entry.day} için saat seçin.`);
            if (Array.isArray(application.availabilitySlots) && application.availabilitySlots.length &&
              !application.availabilitySlots.includes(entry.slot)) {
              throw new RequestError(`${entry.slot}, öğrencinin bildirdiği müsait saatler arasında değil.`, 409);
            }
            const conflict = records.find((item) => item.kind === 'placement' && item.applicationId !== applicationId &&
              (item.schedule || []).some((assigned) => assigned.teacherId === entry.teacherId &&
                assigned.day === entry.day && assigned.slot === entry.slot));
            if (conflict) {
              throw new RequestError(`${teacher.name}, ${entry.day} ${entry.slot} saatinde ${conflict.studentName || conflict.applicationReference || 'başka bir öğrenci'} için dolu.`, 409);
            }
            return { ...entry, teacherName: teacher.name };
          });
          const now = new Date().toISOString();
          const placement = {
            kind: 'placement', id: existing?.id || crypto.randomUUID(), applicationId,
            applicationCreatedAt: application.createdAt, applicationReference: application.reference,
            studentName: application.studentName, applicationType: application.applicationType,
            startDate: String(body.startDate), schedule: hydratedSchedule,
            createdAt: existing?.createdAt || now, updatedAt: now, updatedBy: adminIdentity(admin)
          };
          const index = existing ? records.findIndex((item) => item.kind === 'placement' && item.applicationId === applicationId) : -1;
          if (index >= 0) records[index] = placement; else records.push(placement);
          return { records, value: placement };
        }, 'BIA: haftalık öğrenci programı güncellendi');
        return json({ ok: true, data: saved }, 200, cors);
      } catch (error) {
        return json({ error: error.message || 'Ders programı kaydedilemedi.' }, error.status || 500, cors);
      }
    }

    if (body.action === 'placement-remove') {
      try {
        const applicationId = cleanText(body.applicationId, 80);
        if (!applicationId) throw new RequestError('Başvuru bilgisi geçersiz.');
        const removed = await mutateArchive(PLANNING_FILE, (records) => {
          const existing = placementFor(records, applicationId);
          if (!existing) throw new RequestError('Kayıtlı ders programı bulunamadı.', 404);
          return {
            records: records.filter((item) => !(item.kind === 'placement' && item.applicationId === applicationId)), value: existing
          };
        }, 'BIA: haftalık öğrenci programı kaldırıldı');
        return json({ ok: true, data: removed }, 200, cors);
      } catch (error) {
        return json({ error: error.message || 'Ders programı kaldırılamadı.' }, error.status || 500, cors);
      }
    }

    if (body.action === 'update') {
      const id = cleanText(body.id, 80);
      const status = cleanText(body.status, 40);
      const adminNote = cleanText(body.adminNote, 1000);
      if (!id || !STATUS_VALUES.includes(status)) return json({ error: 'Güncelleme bilgisi geçersiz.' }, 400, cors);
      const createdAt = new Date(String(body.createdAt || ''));
      if (!Number.isFinite(createdAt.getTime())) return json({ error: 'Başvuru tarihi geçersiz.' }, 400, cors);
      try {
        if (status === 'kayit-tamamlandi') {
          const planning = await getArchive(PLANNING_FILE);
          const placement = placementFor(planning.records, id);
          if (!placement || !validDate(placement.startDate) || !Array.isArray(placement.schedule) || placement.schedule.length !== WEEKDAYS.length) {
            throw new RequestError('Kayıt tamamlanmadan önce başlangıç tarihiyle birlikte beş günlük ders planını kaydedin.', 409);
          }
        }
        const updated = await mutateArchive(`${createdAt.toISOString().slice(0, 7)}.enc.json`, (records) => {
          const index = records.findIndex((item) => item.id === id);
          if (index < 0) throw new RequestError('Başvuru bulunamadı.', 404);
          records[index] = {
            ...records[index], status, adminNote, updatedAt: new Date().toISOString(), updatedBy: adminIdentity(admin)
          };
          return { records, value: records[index] };
        }, 'BIA: başvuru durumu güncellendi');
        return json({ ok: true, data: updated }, 200, cors);
      } catch (error) {
        return json({ error: error.message || 'Başvuru güncellenemedi.' }, error.status || 500, cors);
      }
    }

    return json({ error: 'Geçersiz işlem.' }, 400, cors);
  }

  return json({ error: 'Yöntem desteklenmiyor.' }, 405, cors);
}
