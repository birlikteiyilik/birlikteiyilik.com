export const config = { runtime: 'edge' };

const DEFAULT_REPO = 'birlikteiyilik/birlikteiyilik.com';
const GH_API = 'https://api.github.com';
const STATUS_VALUES = ['yeni', 'inceleniyor', 'uygun', 'yedek', 'kayit-tamamlandi', 'uygun-degil'];
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
    { name: 'AES-GCM', iv: bytesFromBase64(envelope.iv) },
    key,
    bytesFromBase64(envelope.data)
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

function digits(value) {
  return String(value || '').replace(/\D/g, '');
}

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

function requireEnum(body, key) {
  return ENUMS[key].includes(String(body[key] || ''));
}

function validateSubmission(body) {
  const requiredText = [
    ['studentName', 3], ['school', 2], ['guardianName', 3]
  ];
  for (const [key, min] of requiredText) {
    if (cleanText(body[key], 200).length < min) return `${key} alanı eksik.`;
  }
  if (!isValidTckn(body.tckn)) return 'T.C. kimlik numarası geçersiz.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.birthDate || ''))) return 'Doğum tarihi geçersiz.';
  const birthDate = new Date(`${body.birthDate}T00:00:00Z`);
  if (!Number.isFinite(birthDate.getTime()) || birthDate > new Date()) return 'Doğum tarihi geçersiz.';
  for (const key of Object.keys(ENUMS)) {
    if (!requireEnum(body, key)) return `${key} seçimi geçersiz.`;
  }
  if (!isValidPhone(body.guardianPhone, false)) return 'Veli telefon numarası geçersiz.';
  if (!isValidPhone(body.studentPhone, true) || !isValidPhone(body.secondGuardianPhone, true)) {
    return 'Telefon numaralarından biri geçersiz.';
  }
  if (body.rulesAccepted !== true || body.privacyAcknowledged !== true || body.termsAccepted !== true) {
    return 'Zorunlu onaylar eksik.';
  }
  return '';
}

function normalizeSubmission(body) {
  return {
    applicationType: String(body.applicationType),
    studentName: cleanText(body.studentName, 100),
    tckn: digits(body.tckn),
    birthDate: String(body.birthDate),
    gender: String(body.gender),
    school: cleanText(body.school, 140),
    grade: String(body.grade),
    guardianName: cleanText(body.guardianName, 100),
    guardianRelation: String(body.guardianRelation),
    guardianPhone: digits(body.guardianPhone).slice(0, 12),
    studentPhone: digits(body.studentPhone).slice(0, 12),
    address: cleanText(body.address, 400),
    secondGuardianName: cleanText(body.secondGuardianName, 100),
    secondGuardianPhone: digits(body.secondGuardianPhone).slice(0, 12),
    quranLevel: String(body.quranLevel),
    previousTraining: String(body.previousTraining),
    previousTrainingDetail: cleanText(body.previousTrainingDetail, 180),
    notes: cleanText(body.notes, 600),
    consents: {
      rulesAccepted: true,
      privacyAcknowledged: true,
      termsAccepted: true,
      mediaConsent: String(body.mediaConsent),
      version: '2026-09-08'
    }
  };
}

function referenceFor(date) {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Array.from(crypto.getRandomValues(new Uint8Array(4)), (n) => n.toString(36)).join('')
    .replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase().padEnd(6, '0');
  return `BIA-${stamp}-${random}`;
}

export default async function handler(req) {
  const githubToken = process.env.BIA_GITHUB_TOKEN || '';
  const jwtSecret = process.env.BIA_JWT_SECRET || process.env.BIA_ADMIN_PASSWORD || '';
  const encryptionSecret = process.env.BIA_APPLICATIONS_ENCRYPTION_KEY || jwtSecret;
  const dataRepo = process.env.BIA_APPLICATIONS_REPO || DEFAULT_REPO;
  const dataBranch = process.env.BIA_APPLICATIONS_BRANCH || 'main';
  const dataPath = (process.env.BIA_APPLICATIONS_PATH || 'content/applications').replace(/^\/+|\/+$/g, '');

  const requestOrigin = req.headers.get('origin') || '';
  const allowedOrigin = requestOrigin === 'https://birlikteiyilik.com' ||
    requestOrigin === 'https://www.birlikteiyilik.com' ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin);
  const cors = allowedOrigin ? {
    'Access-Control-Allow-Origin': requestOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin'
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
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'BIA-Applications/1.0'
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
    return {
      records: await decryptRecords(JSON.parse(envelopeText), encryptionSecret),
      sha: response.data.sha || ''
    };
  }

  async function putArchive(fileName, records, sha, message) {
    const envelope = await encryptRecords(records, encryptionSecret);
    const content = base64FromBytes(encoder.encode(JSON.stringify(envelope)));
    return github(`/repos/${dataRepo}/contents/${dataPath}/${fileName}`, 'PUT', {
      message,
      content,
      branch: dataBranch,
      ...(sha ? { sha } : {})
    });
  }

  async function mutateArchive(fileName, mutator, message) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await getArchive(fileName);
      const result = await mutator(current.records);
      const saved = await putArchive(fileName, result.records, current.sha, message);
      if (saved.ok && saved.data.content?.sha) return result.value;
      if (saved.status !== 409 && saved.status !== 422) throw new Error('Başvuru arşivi kaydedilemedi.');
    }
    throw new Error('Başvuru arşivi aynı anda güncellendi. Lütfen tekrar deneyin.');
  }

  async function checkAdmin() {
    const header = req.headers.get('authorization') || '';
    if (!header.startsWith('Bearer ')) return null;
    return verifyJwt(header.slice(7), jwtSecret);
  }

  if (req.method === 'GET') {
    const admin = await checkAdmin();
    if (!admin) return json({ error: 'Yetkisiz erişim.' }, 401, cors);

    const listing = await github(`/repos/${dataRepo}/contents/${dataPath}?ref=${encodeURIComponent(dataBranch)}`);
    if (listing.status === 404) return json({ data: [] }, 200, cors);
    if (!listing.ok || !Array.isArray(listing.data)) return json({ error: 'Başvuru arşivi listelenemedi.' }, 500, cors);

    const files = listing.data
      .filter((entry) => entry.type === 'file' && /^\d{4}-\d{2}\.enc\.json$/.test(entry.name))
      .sort((a, b) => b.name.localeCompare(a.name));
    try {
      const archives = await Promise.all(files.map((entry) => getArchive(entry.name)));
      const records = archives.flatMap((archive) => archive.records)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      return json({ data: records }, 200, cors);
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
        id: crypto.randomUUID(),
        reference: referenceFor(now),
        ...normalizeSubmission(body),
        status: 'yeni',
        adminNote: '',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      const fileName = `${now.toISOString().slice(0, 7)}.enc.json`;

      try {
        const reference = await mutateArchive(fileName, (records) => {
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

    if (body.action === 'update') {
      const admin = await checkAdmin();
      if (!admin) return json({ error: 'Yetkisiz erişim.' }, 401, cors);
      const id = cleanText(body.id, 80);
      const status = cleanText(body.status, 40);
      const adminNote = cleanText(body.adminNote, 1000);
      if (!id || !STATUS_VALUES.includes(status)) return json({ error: 'Güncelleme bilgisi geçersiz.' }, 400, cors);
      const createdAt = new Date(String(body.createdAt || ''));
      if (!Number.isFinite(createdAt.getTime())) return json({ error: 'Başvuru tarihi geçersiz.' }, 400, cors);
      const fileName = `${createdAt.toISOString().slice(0, 7)}.enc.json`;

      try {
        const updated = await mutateArchive(fileName, (records) => {
          const index = records.findIndex((item) => item.id === id);
          if (index < 0) throw new Error('Başvuru bulunamadı.');
          records[index] = {
            ...records[index],
            status,
            adminNote,
            updatedAt: new Date().toISOString(),
            updatedBy: cleanText(admin.name || admin.id || 'admin', 80)
          };
          return { records, value: records[index] };
        }, `BIA: başvuru durumu güncellendi`);
        return json({ ok: true, data: updated }, 200, cors);
      } catch (error) {
        return json({ error: error.message === 'Başvuru bulunamadı.' ? error.message : 'Başvuru güncellenemedi.' }, 500, cors);
      }
    }

    return json({ error: 'Geçersiz işlem.' }, 400, cors);
  }

  return json({ error: 'Yöntem desteklenmiyor.' }, 405, cors);
}
