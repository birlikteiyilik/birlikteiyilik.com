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
const ENUMS = {
  applicationType: ['yuz-yuze', 'online'],
  gender: ['erkek', 'kiz'],
  grade: ['3', '4', '5', '6', '7', '8'],
  guardianRelation: ['anne', 'baba', 'yasal-vasi', 'diger'],
  quranLevel: ['hic-bilmiyor', 'elif-ba', 'okuyabiliyor', 'tecvid'],
  previousTraining: ['evet', 'hayir'],
  mediaConsent: ['izin-veriyorum', 'izin-vermiyorum']
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
    active: teacher.active !== false
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
  return result;
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

  async function checkAdmin() {
    const header = req.headers.get('authorization') || '';
    return header.startsWith('Bearer ') ? verifyJwt(header.slice(7), jwtSecret) : null;
  }

  async function requireApplication(applicationId, applicationCreatedAt) {
    const createdAt = new Date(String(applicationCreatedAt || ''));
    if (!applicationId || !Number.isFinite(createdAt.getTime())) throw new RequestError('Başvuru bilgisi geçersiz.');
    const archive = await getArchive(`${createdAt.toISOString().slice(0, 7)}.enc.json`);
    const application = archive.records.find((item) => item.id === applicationId);
    if (!application) throw new RequestError('Başvuru bulunamadı.', 404);
    return application;
  }

  if (req.method === 'GET') {
    const admin = await checkAdmin();
    if (!admin) return json({ error: 'Yetkisiz erişim.' }, 401, cors);
    try {
      const [listing, planning] = await Promise.all([
        github(`/repos/${dataRepo}/contents/${dataPath}?ref=${encodeURIComponent(dataBranch)}`), getArchive(PLANNING_FILE)
      ]);
      if (listing.status !== 404 && (!listing.ok || !Array.isArray(listing.data))) throw new Error('Arşiv listelenemedi.');
      const files = listing.status === 404 ? [] : listing.data
        .filter((entry) => entry.type === 'file' && /^\d{4}-\d{2}\.enc\.json$/.test(entry.name))
        .sort((a, b) => b.name.localeCompare(a.name));
      const archives = await Promise.all(files.map((entry) => getArchive(entry.name)));
      const records = archives.flatMap((archive) => archive.records)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      return json({
        data: records,
        teachers: planning.records.filter((item) => item.kind === 'teacher'),
        placements: planning.records.filter((item) => item.kind === 'placement'),
        meta: { weekdays: WEEKDAYS, timeSlots: TIME_SLOTS }
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

    const admin = await checkAdmin();
    if (!admin) return json({ error: 'Yetkisiz erişim.' }, 401, cors);

    if (body.action === 'teacher-save') {
      try {
        const input = validateTeacher(body);
        const now = new Date().toISOString();
        const saved = await mutateArchive(PLANNING_FILE, (records) => {
          const index = input.id ? records.findIndex((item) => item.kind === 'teacher' && item.id === input.id) : -1;
          const existing = index >= 0 ? records[index] : null;
          if (input.id && !existing) throw new RequestError('Öğretmen bulunamadı.', 404);
          if (existing) {
            const used = records.filter((item) => item.kind === 'placement')
              .flatMap((item) => (item.schedule || []).map((entry) => ({ ...entry, mode: item.applicationType })))
              .find((entry) => entry.teacherId === input.id && (!input.days.includes(entry.day) || !input.modes.includes(entry.mode)));
            if (used) throw new RequestError('Bu öğretmenin mevcut dersleri var. Kullanılan gün veya eğitim türü kaldırılamaz.', 409);
          }
          const teacher = {
            kind: 'teacher', id: existing?.id || crypto.randomUUID(), name: input.name, gender: input.gender,
            phone: input.phone, modes: input.modes, days: input.days, active: input.active,
            createdAt: existing?.createdAt || now, updatedAt: now, updatedBy: adminIdentity(admin)
          };
          if (index >= 0) records[index] = teacher; else records.push(teacher);
          return { records, value: teacher };
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
