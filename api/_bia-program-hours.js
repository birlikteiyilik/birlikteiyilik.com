export const DEFAULT_PROGRAM_SLOTS = [
  '15:00-15:20', '15:20-15:40', '15:40-16:00', '16:00-16:20', '16:20-16:40',
  '16:40-17:00', '17:00-17:20', '17:20-17:40', '17:40-18:00'
];

class ProgramError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export function programDay(at = new Date().toISOString()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(at));
}

export function programHours(records) {
  const settings = records.find((item) => item.kind === 'program-hours' && item.applicationType === 'yuz-yuze');
  return { slots: settings?.slots || DEFAULT_PROGRAM_SLOTS, revision: settings?.revision || 0 };
}

export function teacherProgramSlots(records, teacherId) {
  const teacher = records.find((item) => item.kind === 'teacher' && item.id === teacherId);
  return teacher?.programSlots || programHours(records).slots;
}

export function availableProgramSlots(records) {
  return [...new Set([...programHours(records).slots, ...records.filter((item) => item.kind === 'teacher' && item.active &&
    item.modes?.includes('yuz-yuze')).flatMap((item) => item.programSlots || [])])].sort();
}

export function slotRange(slot) {
  const match = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(String(slot));
  if (!match) return null;
  const [, h1, m1, h2, m2] = match.map(Number);
  const start = h1 * 60 + m1, end = h2 * 60 + m2;
  return h1 < 24 && h2 < 24 && m1 < 60 && m2 < 60 && start < end ? { start, end } : null;
}

export function scheduleForDate(placement, date) {
  const version = (placement.programScheduleHistory || []).slice()
    .sort((a, b) => a.beforeDate.localeCompare(b.beforeDate)).find((item) => date < item.beforeDate);
  return version?.schedule || placement.schedule || [];
}

export function scheduleHistory(existing, schedule, date) {
  const history = (existing?.programScheduleHistory || []).slice();
  if (existing && JSON.stringify(existing.schedule || []) !== JSON.stringify(schedule) && !history.some((item) => item.beforeDate === date)) {
    history.push({ beforeDate: date, schedule: (existing.schedule || []).map((item) => ({ ...item })) });
  }
  return history;
}

export function applyProgramHours(records, changes, revision, actor, options = {}, at = new Date().toISOString()) {
  const current = programHours(records);
  if (!Number.isInteger(revision) || revision !== current.revision) throw new ProgramError('Program başka bir oturumda değişti. Sayfayı yenileyip tekrar deneyin.', 409);
  const scoped = options.scope === 'teachers';
  const teacherIds = scoped ? options.teacherIds : [];
  if (scoped && (!Array.isArray(teacherIds) || !teacherIds.length || teacherIds.length > 200 || new Set(teacherIds).size !== teacherIds.length)) {
    throw new ProgramError('En az bir hoca seçin.');
  }
  const selected = records.filter((item) => item.kind === 'teacher' && (scoped ? teacherIds.includes(item.id) : !Array.isArray(item.programSlots)) && item.modes?.includes('yuz-yuze'));
  if (scoped && selected.length !== teacherIds.length) throw new ProgramError('Seçilen hocalardan biri artık mevcut değil. Programı yeniden açın.', 409);
  const bases = scoped ? [...new Set(selected.flatMap((teacher) => teacherProgramSlots(records, teacher.id)))] : current.slots;
  if (options.reset && !scoped) throw new ProgramError('Ortak programa dönüş için hoca seçin.');
  if (options.reset) changes = current.slots.map((slot) => ({ previousSlot: bases.includes(slot) ? slot : '', slot }));
  if (!Array.isArray(changes) || (!scoped && !changes.length) || changes.length > 72) throw new ProgramError('En fazla 72 geçerli ders saati tanımlayın.');
  if (changes.some((item) => !item || typeof item !== 'object')) throw new ProgramError('Ders saati bilgileri geçersiz.');
  const previous = changes.map((item) => item.previousSlot).filter(Boolean);
  if (new Set(previous).size !== previous.length || previous.some((slot) => scoped ? !slotRange(slot) : !bases.includes(slot))) throw new ProgramError('Saat listesi değişti. Programı yeniden açın.', 409);
  const sorted = changes.map((item) => {
    const range = slotRange(item.slot);
    if (!range) throw new ProgramError('Başlangıç ve bitiş saatlerini kontrol edin.');
    return { ...item, ...range };
  }).sort((a, b) => a.start - b.start);
  if (sorted.some((item, index) => index && item.start < sorted[index - 1].end)) throw new ProgramError('Ders saatleri birbiriyle çakışamaz.');
  const slots = sorted.map((item) => item.slot);
  const mapping = new Map(changes.filter((item) => item.previousSlot).map((item) => [item.previousSlot, item.slot]));
  const date = programDay(at);
  const teacherSet = new Set(selected.map((teacher) => teacher.id));
  const next = structuredClone(records);
  let changedLessons = 0;
  for (const item of next) {
    if (item.kind !== 'placement' || item.applicationType !== 'yuz-yuze') continue;
    const schedule = (item.schedule || []).map((entry) => {
      if (!teacherSet.has(entry.teacherId)) return { ...entry };
      const slot = mapping.get(entry.slot) || entry.slot;
      if (!slots.includes(slot)) throw new ProgramError(`${entry.slot} saatinde atanmış ders var. Önce bu dersleri başka bir saate taşıyın; sonra saati kaldırın.`, 409);
      if (slot !== entry.slot) changedLessons += 1;
      return { ...entry, slot };
    });
    if (JSON.stringify(schedule) === JSON.stringify(item.schedule || [])) continue;
    item.programScheduleHistory = scheduleHistory(item, schedule, date);
    item.schedule = schedule;
    item.updatedAt = at; item.updatedBy = actor;
  }
  // Past days keep their actual times. Today's saved status/notes follow the
  // same lesson after a correction; retain its originally recorded time too.
  for (const item of next) {
    if (item.kind !== 'attendance' || item.lessonDate < date || !teacherSet.has(item.teacherId) || item.applicationType !== 'yuz-yuze') continue;
    const slot = mapping.get(item.slot) || item.slot;
    if (slot !== item.slot) { item.slotAtAttendance ||= item.slot; item.slot = slot; }
  }
  const keys = new Set();
  for (const item of next.filter((record) => record.kind === 'attendance')) {
    const key = `${item.teacherId}|${item.applicationId}|${item.lessonDate}|${item.slot}`;
    if (keys.has(key)) throw new ProgramError('Bu değişiklik mevcut yoklama kayıtlarıyla çakışıyor.', 409);
    keys.add(key);
  }
  if (scoped) for (const teacher of next.filter((item) => item.kind === 'teacher' && teacherSet.has(item.id))) {
    if (options.reset) delete teacher.programSlots; else teacher.programSlots = slots;
    teacher.updatedAt = at; teacher.updatedBy = actor;
  }
  const setting = { kind: 'program-hours', id: 'program-hours:yuz-yuze', applicationType: 'yuz-yuze',
    slots: scoped ? current.slots : slots, revision: current.revision + 1, updatedAt: at, updatedBy: actor };
  const index = next.findIndex((item) => item.kind === 'program-hours' && item.applicationType === 'yuz-yuze');
  if (index >= 0) next[index] = setting; else next.push(setting);
  return { records: next, value: { slots, revision: setting.revision, changedLessons, affectedTeachers: teacherSet.size } };
}
