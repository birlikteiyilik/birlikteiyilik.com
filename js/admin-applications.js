(function () {
  'use strict';

  const API_URL = '/api/bia-applications';
  const fallbackMeta = {
    weekdays: ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma'],
    timeSlots: ['15:00-15:20', '15:20-15:40', '15:40-16:00', '16:00-16:20', '16:20-16:40', '16:40-17:00', '17:00-17:20', '17:20-17:40', '17:40-18:00']
  };
  const labels = {
    type: { 'yuz-yuze': 'Yüz yüze', online: 'Online' },
    gender: { erkek: 'Erkek', kiz: 'Kız', kadin: 'Kadın' },
    level: { 'hic-bilmiyor': 'Başlangıç', 'elif-ba': 'Elif Ba', okuyabiliyor: 'Okuyabiliyor', 'gelistirmek-istiyor': 'Okuyor, geliştirmek istiyor', tecvid: 'Tecvid' },
    relation: { anne: 'Anne', baba: 'Baba', 'yasal-vasi': 'Yasal vasi', diger: 'Diğer' },
    previous: { evet: 'Evet', hayir: 'Hayır' },
    media: { 'izin-veriyorum': 'İzin veriyor', 'izin-vermiyorum': 'İzin vermiyor', uygulanmiyor: 'Uygulanmıyor' },
    referral: { 'ogrenci-arkadasi': 'Öğrenci arkadaşından', 'arkadas-tavsiyesi': 'Arkadaş tavsiyesi', 'bilgilendirme-mesaji': 'Bilgilendirme mesajı', 'kendi-arastirmam': 'Kendi araştırmam', diger: 'Diğer' },
    days: { pazartesi: 'Pazartesi', sali: 'Salı', carsamba: 'Çarşamba', persembe: 'Perşembe', cuma: 'Cuma' },
    attendance: { katildi: 'Katıldı', gelmedi: 'Gelmedi', mazeretli: 'Mazeretli', eksik: 'Yoklama bekliyor' },
    status: {
      yeni: 'Yeni', inceleniyor: 'İnceleniyor', uygun: 'Uygun', yedek: 'Yedek',
      'kayit-tamamlandi': 'Kayıt tamamlandı', 'uygun-degil': 'Uygun değil'
    }
  };

  let applications = [];
  let teachers = [];
  let placements = [];
  let attendanceRecords = [];
  let meta = fallbackMeta;
  let loaded = false;
  let selectedId = '';
  let draftSchedule = {};
  let toastTimer = 0;

  function el(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[char]);
  }
  function formatDate(value, withTime) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '';
    return new Intl.DateTimeFormat('tr-TR', {
      dateStyle: 'medium', ...(withTime ? { timeStyle: 'short' } : {})
    }).format(date);
  }
  function formatPhone(value) {
    const d = String(value || '').replace(/\D/g, '').replace(/^90/, '0');
    if (d.length !== 11) return value || '';
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`;
  }
  function placementOf(applicationId) {
    return placements.find((item) => item.applicationId === applicationId);
  }
  function teacherOf(teacherId) { return teachers.find((item) => item.id === teacherId); }
  function toast(message, tone) {
    const node = el('appsToast');
    node.textContent = message;
    node.className = `apps-toast is-visible ${tone === 'error' ? 'is-error' : 'is-success'}`;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { node.className = 'apps-toast'; }, 3200);
  }

  async function api(method, body) {
    const response = await fetch(API_URL, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 401) {
      logout();
      throw new Error('Oturum süresi doldu.');
    }
    if (!response.ok) throw new Error(result.error || 'İşlem tamamlanamadı.');
    return result;
  }

  function filterData() {
    const query = el('appsSearch').value.trim().toLocaleLowerCase('tr-TR');
    const type = el('appsType').value;
    const gender = el('appsGender').value;
    const grade = el('appsGrade').value;
    const level = el('appsLevel').value;
    const previousTraining = el('appsPreviousTraining').value;
    const status = el('appsStatus').value;
    const planState = el('appsPlanState').value;
    const teacherId = el('appsTeacher').value;
    const from = el('appsFrom').value;
    const to = el('appsTo').value;

    return applications.filter((item) => {
      const placement = placementOf(item.id);
      const haystack = [item.studentName, item.guardianName, item.guardianPhone, item.reference, item.school,
        item.motherName, item.motherPhone, item.fatherName, item.fatherPhone, item.location]
        .join(' ').toLocaleLowerCase('tr-TR');
      const date = String(item.createdAt || '').slice(0, 10);
      return (!query || haystack.includes(query)) && (!type || item.applicationType === type) &&
        (!gender || item.gender === gender) && (!grade || item.grade === grade) &&
        (!level || item.quranLevel === level) &&
        (!previousTraining || item.previousTraining === previousTraining) &&
        (!status || item.status === status) &&
        (!planState || (planState === 'planned' ? Boolean(placement) : !placement)) &&
        (!teacherId || placement?.schedule?.some((entry) => entry.teacherId === teacherId)) &&
        (!from || date >= from) && (!to || date <= to);
    });
  }

  function renderStats() {
    el('appsTotal').textContent = applications.length;
    el('appsNew').textContent = applications.filter((item) => item.status === 'yeni').length;
    el('appsPlanned').textContent = placements.length;
    el('appsRegistered').textContent = applications.filter((item) => item.status === 'kayit-tamamlandi').length;
    el('appsTabApplicationCount').textContent = applications.length;
    el('appsTabTeacherCount').textContent = teachers.length;
    el('appsTabScheduleCount').textContent = placements.length;
    el('appsTabReportCount').textContent = attendanceRecords.length;
    const demoApplications = applications.filter((item) => item.isDemo).length;
    const demoTeachers = teachers.filter((item) => item.isDemo).length;
    const demoPlacements = placements.filter((item) => item.isDemo).length;
    const demoButton = el('programDemoSeed');
    const hasDemoData = demoApplications + demoTeachers + demoPlacements > 0;
    demoButton.dataset.mode = hasDemoData ? 'refresh' : 'seed';
    demoButton.textContent = hasDemoData ? 'Test verisini güncelle' : 'Test verisini kur';
    el('dataCountApplications').textContent = applications.length;
    el('dataCountTeachers').textContent = teachers.length;
    el('dataCountAssignments').textContent = placements.length;
    el('dataCountDemo').textContent = demoApplications + demoTeachers + demoPlacements;
  }

  function renderTeacherFilter() {
    const value = el('appsTeacher').value;
    el('appsTeacher').innerHTML = '<option value="">Tümü</option>' + teachers
      .slice().sort((a, b) => a.name.localeCompare(b.name, 'tr'))
      .map((teacher) => `<option value="${escapeHtml(teacher.id)}">${escapeHtml(teacher.name)}${teacher.active ? '' : ' · Pasif'}</option>`).join('');
    el('appsTeacher').value = value;
  }

  function compactProgram(item, placement) {
    if (!placement && item.applicationVersion === 'online-2026-09') return '<span class="program-state is-online">Online görüşme bekliyor</span>';
    if (!placement) return '<span class="program-state is-empty">Atama bekliyor</span>';
    const names = [...new Set((placement.schedule || []).map((entry) => entry.teacherName || teacherOf(entry.teacherId)?.name).filter(Boolean))];
    return `<span class="program-state is-ready">5 gün planlandı</span><span class="program-names">${escapeHtml(names.join(', '))}</span>`;
  }

  function renderTable() {
    const filtered = filterData();
    el('appsResultCount').textContent = `${filtered.length} başvuru gösteriliyor`;
    const body = el('appsTableBody');
    if (!filtered.length) {
      body.innerHTML = '<tr><td colspan="9" class="apps-empty">Filtrelerle eşleşen başvuru bulunamadı.</td></tr>';
      return;
    }
    body.innerHTML = filtered.map((item, index) => {
      const placement = placementOf(item.id);
      const messageButton = item.status === 'kayit-tamamlandi' && placement
        ? `<button type="button" class="btn app-copy" data-copy-id="${escapeHtml(item.id)}" aria-label="Bilgilendirme mesajını kopyala">Mesajı kopyala</button>` : '';
      return `<tr data-id="${escapeHtml(item.id)}" tabindex="0" style="--row-index:${index}" aria-label="${escapeHtml(item.studentName)} başvurusunu aç">
        <td>${escapeHtml(formatDate(item.createdAt, false))}</td>
        <td><span class="app-student">${escapeHtml(item.studentName)}</span><span class="app-ref">${escapeHtml(item.reference)}</span></td>
        <td>${escapeHtml(labels.type[item.applicationType] || item.applicationType)}</td>
        <td>${escapeHtml(labels.gender[item.gender] || item.gender)}</td>
        <td>${escapeHtml(item.grade)}. sınıf</td>
        <td>${escapeHtml(labels.level[item.quranLevel] || item.quranLevel)}</td>
        <td>${compactProgram(item, placement)}</td>
        <td><span class="app-status app-status-${escapeHtml(item.status)}">${escapeHtml(labels.status[item.status] || item.status)}</span></td>
        <td><div class="app-row-actions"><button type="button" class="btn btn-gray app-open" data-open-id="${escapeHtml(item.id)}">İncele</button>${messageButton}</div></td>
      </tr>`;
    }).join('');
  }

  function renderTeacherGrid() {
    const query = el('appsTeacherSearch').value.trim().toLocaleLowerCase('tr-TR');
    const state = el('appsTeacherState').value;
    const filtered = teachers.filter((teacher) => {
      const haystack = `${teacher.name} ${teacher.phone} ${teacher.username || ''}`.toLocaleLowerCase('tr-TR');
      return (!query || haystack.includes(query)) && (!state || (state === 'active' ? teacher.active : !teacher.active));
    });
    el('appsTeacherResult').textContent = `${filtered.length} öğretmen`;
    if (!filtered.length) {
      el('appsTeacherGrid').innerHTML = '<div class="teacher-empty"><strong>Henüz eşleşen öğretmen yok.</strong><span>Yeni bir öğretmen ekleyerek ders planlamaya başlayabilirsiniz.</span></div>';
      return;
    }
    el('appsTeacherGrid').innerHTML = filtered
      .slice().sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'tr'))
      .map((teacher, index) => {
        const assigned = placements.filter((placement) => placement.schedule?.some((entry) => entry.teacherId === teacher.id)).length;
        return `<article class="teacher-card ${teacher.active ? '' : 'is-passive'}" style="--card-index:${index}">
          <div class="teacher-card-top"><span class="teacher-avatar">${escapeHtml(teacher.name.charAt(0).toLocaleUpperCase('tr-TR'))}</span><span class="teacher-status">${teacher.active ? 'Aktif' : 'Pasif'}</span></div>
          <h3>${escapeHtml(teacher.name)}</h3><a href="tel:${escapeHtml(teacher.phone)}">${escapeHtml(formatPhone(teacher.phone))}</a>
          <div class="teacher-tags">${teacher.modes.map((mode) => `<span>${escapeHtml(labels.type[mode])}</span>`).join('')}<span>${teacher.hasLogin ? `Giriş: ${escapeHtml(teacher.username)}` : 'Giriş eksik'}</span></div>
          <div class="teacher-days-strip">${meta.weekdays.map((day) => `<span class="${teacher.days.includes(day) ? 'is-on' : ''}" title="${labels.days[day]}">${labels.days[day].slice(0, 2)}</span>`).join('')}</div>
          <div class="teacher-card-foot"><span>${escapeHtml(labels.gender[teacher.gender])} · ${assigned} öğrenci</span><button type="button" class="teacher-edit" data-teacher-id="${escapeHtml(teacher.id)}">Düzenle</button></div>
        </article>`;
      }).join('');
  }

  function programEntries() {
    return placements.flatMap((placement) => {
      const application = applications.find((item) => item.id === placement.applicationId);
      return (placement.schedule || []).map((entry) => ({
        ...entry,
        applicationId: placement.applicationId,
        applicationReference: placement.applicationReference || application?.reference || '',
        studentName: placement.studentName || application?.studentName || 'Öğrenci',
        applicationType: placement.applicationType || application?.applicationType || '',
        startDate: placement.startDate || '',
        teacherName: entry.teacherName || teacherOf(entry.teacherId)?.name || 'Arşiv öğretmen',
        isDemo: placement.isDemo === true || application?.isDemo === true
      }));
    });
  }

  function programTeachers(entries) {
    const result = teachers.slice();
    const known = new Set(result.map((teacher) => teacher.id));
    entries.forEach((entry) => {
      if (known.has(entry.teacherId)) return;
      known.add(entry.teacherId);
      const teacherEntries = entries.filter((item) => item.teacherId === entry.teacherId);
      result.push({
        id: entry.teacherId, name: entry.teacherName, phone: '', active: false, gender: '',
        modes: [...new Set(teacherEntries.map((item) => item.applicationType).filter(Boolean))],
        days: [...new Set(teacherEntries.map((item) => item.day))], archived: true
      });
    });
    return result;
  }

  function renderProgramFilters() {
    const entries = programEntries();
    const teacherValue = el('programTeacher').value;
    const slotValue = el('programSlot').value;
    el('programTeacher').innerHTML = '<option value="">Tüm öğretmenler</option>' + programTeachers(entries)
      .slice().sort((a, b) => a.name.localeCompare(b.name, 'tr'))
      .map((teacher) => `<option value="${escapeHtml(teacher.id)}">${escapeHtml(teacher.name)}${teacher.active ? '' : ' · Pasif'}</option>`).join('');
    el('programTeacher').value = [...el('programTeacher').options].some((option) => option.value === teacherValue) ? teacherValue : '';
    el('programSlot').innerHTML = '<option value="">Tüm saatler</option>' + meta.timeSlots
      .map((slot) => `<option value="${escapeHtml(slot)}">${escapeHtml(slot)}</option>`).join('');
    el('programSlot').value = meta.timeSlots.includes(slotValue) ? slotValue : '';
  }

  function renderProgramSummary(entries) {
    el('programActiveTeachers').textContent = teachers.filter((teacher) => teacher.active).length;
    el('programAssignedStudents').textContent = new Set(entries.map((entry) => entry.applicationId)).size;
    el('programWeeklyLessons').textContent = entries.length;
    const slotCounts = new Map();
    entries.forEach((entry) => slotCounts.set(entry.slot, (slotCounts.get(entry.slot) || 0) + 1));
    const busiest = [...slotCounts.entries()].sort((a, b) => b[1] - a[1] || meta.timeSlots.indexOf(a[0]) - meta.timeSlots.indexOf(b[0]))[0];
    el('programBusiestSlot').textContent = busiest ? busiest[0].replace(/:/g, '.') : '—';
  }

  function programLesson(entry, index) {
    const start = entry.startDate ? formatDate(`${entry.startDate}T00:00:00`, false) : '';
    const demo = entry.isDemo ? '<span class="program-demo-tag">Test</span>' : '';
    return `<li class="program-lesson is-${escapeHtml(entry.applicationType)}" style="--lesson-index:${index}">
      <time>${escapeHtml(entry.slot.replace('-', ' – '))}</time>
      <div class="program-student"><strong>${escapeHtml(entry.studentName)} ${demo}</strong><small>${escapeHtml(labels.type[entry.applicationType] || entry.applicationType)}${start ? ` · Başlangıç ${escapeHtml(start)}` : ''}</small></div>
      <button type="button" data-program-open="${escapeHtml(entry.applicationId)}" aria-label="${escapeHtml(entry.studentName)} başvurusunu incele">İncele</button>
    </li>`;
  }

  function renderProgram() {
    const entries = programEntries();
    renderProgramSummary(entries);
    const query = el('programSearch').value.trim().toLocaleLowerCase('tr-TR');
    const dayFilter = el('programDay').value;
    const teacherFilter = el('programTeacher').value;
    const typeFilter = el('programType').value;
    const slotFilter = el('programSlot').value;
    const hasEntryFilter = Boolean(dayFilter || typeFilter || slotFilter);
    const cards = [];

    programTeachers(entries)
      .slice().sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'tr'))
      .forEach((teacher) => {
        if (teacherFilter && teacher.id !== teacherFilter) return;
        const teacherQueryMatch = `${teacher.name} ${teacher.phone || ''}`.toLocaleLowerCase('tr-TR').includes(query);
        const allTeacherEntries = entries.filter((entry) => entry.teacherId === teacher.id);
        const visibleEntries = allTeacherEntries.filter((entry) => {
          const studentQueryMatch = `${entry.studentName} ${entry.applicationReference}`.toLocaleLowerCase('tr-TR').includes(query);
          return (!query || teacherQueryMatch || studentQueryMatch) && (!dayFilter || entry.day === dayFilter) &&
            (!typeFilter || entry.applicationType === typeFilter) && (!slotFilter || entry.slot === slotFilter);
        });
        if (!visibleEntries.length && (hasEntryFilter || (query && !teacherQueryMatch))) return;

        const totalStudents = new Set(allTeacherEntries.map((entry) => entry.applicationId)).size;
        const totalLessons = allTeacherEntries.length;
        const capacity = Math.max(1, (teacher.days || []).length * meta.timeSlots.length);
        const occupancy = Math.min(100, Math.round(totalLessons / capacity * 100));
        const scheduledDays = new Set(allTeacherEntries.map((entry) => entry.day));
        let displayDays = dayFilter ? [dayFilter] : meta.weekdays.filter((day) => (teacher.days || []).includes(day) || scheduledDays.has(day));
        if ((query || typeFilter || slotFilter) && !dayFilter) {
          displayDays = meta.weekdays.filter((day) => visibleEntries.some((entry) => entry.day === day));
        }
        if (!displayDays.length && !hasEntryFilter && (!query || teacherQueryMatch)) displayDays = teacher.days || [];
        const dayColumns = displayDays.map((day, dayIndex) => {
          const dayEntries = visibleEntries.filter((entry) => entry.day === day)
            .sort((a, b) => meta.timeSlots.indexOf(a.slot) - meta.timeSlots.indexOf(b.slot) || a.studentName.localeCompare(b.studentName, 'tr'));
          return `<section class="program-day-column" style="--day-index:${dayIndex}">
            <header><div><span>${escapeHtml(labels.days[day].slice(0, 2).toLocaleUpperCase('tr-TR'))}</span><h4>${escapeHtml(labels.days[day])}</h4></div><em>${dayEntries.length} ders</em></header>
            ${dayEntries.length ? `<ol>${dayEntries.map(programLesson).join('')}</ol>` : '<div class="program-day-empty"><span>＋</span> Henüz ders yok</div>'}
          </section>`;
        }).join('');
        const testTag = teacher.isDemo ? '<span class="program-demo-tag">Test</span>' : '';
        cards.push(`<article class="program-teacher-card ${teacher.active ? '' : 'is-passive'}" style="--program-index:${cards.length}">
          <header class="program-teacher-head">
            <div class="program-teacher-identity"><span class="teacher-avatar">${escapeHtml(teacher.name.charAt(0).toLocaleUpperCase('tr-TR'))}</span><div><div class="program-teacher-name"><h3>${escapeHtml(teacher.name)}</h3>${testTag}<span class="teacher-status">${teacher.active ? 'Aktif' : teacher.archived ? 'Arşiv' : 'Pasif'}</span></div><small>${escapeHtml((teacher.days || []).map((day) => labels.days[day]).join(', ') || 'Çalışma günü yok')}</small></div></div>
            <div class="program-load-summary"><div><span><strong>${totalStudents}</strong> öğrenci</span><span><strong>${totalLessons}</strong> ders / hafta</span></div><div class="program-load-meter" aria-label="Yüzde ${occupancy} doluluk"><i style="--load:${occupancy}%"></i></div><small>${occupancy}% haftalık doluluk</small></div>
          </header>
          <div class="program-week" style="--day-count:${Math.max(1, displayDays.length)}">${dayColumns || '<div class="program-card-empty">Bu öğretmene henüz ders atanmamış.</div>'}</div>
        </article>`);
      });

    el('programFilterResult').textContent = `${cards.length} öğretmen gösteriliyor`;
    if (!cards.length) {
      const hasTeachers = teachers.length > 0;
      el('programBoard').innerHTML = `<div class="program-empty-state"><span aria-hidden="true">${hasTeachers ? '⌕' : '+'}</span><strong>${hasTeachers ? 'Filtrelerle eşleşen ders bulunamadı.' : 'Henüz öğretmen kaydı yok.'}</strong><p>${hasTeachers ? 'Filtreleri temizleyin veya Başvurular bölümünden bir öğrenciye program atayın.' : 'Önce Öğretmenler bölümünden çalışma günleriyle birlikte öğretmen ekleyin.'}</p></div>`;
      return;
    }
    el('programBoard').innerHTML = cards.join('');
  }

  function dateValue(date) {
    const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return shifted.toISOString().slice(0, 10);
  }

  function addDays(value, amount) {
    const date = new Date(`${value}T12:00:00`);
    date.setDate(date.getDate() + amount);
    return dateValue(date);
  }

  function thisWeekRange() {
    const today = new Date();
    const day = today.getDay() || 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - day + 1);
    return { from: dateValue(monday), to: dateValue(today) };
  }

  function dayForDate(value) {
    return meta.weekdays[(new Date(`${value}T12:00:00`).getDay() || 7) - 1] || '';
  }

  function renderReportFilters() {
    const value = el('reportsTeacher').value;
    const attendanceTeachers = attendanceRecords.map((item) => ({ id: item.teacherId, name: item.teacherName })).filter((item) => item.id);
    const choices = [...teachers.map((teacher) => ({ id: teacher.id, name: teacher.name })), ...attendanceTeachers]
      .filter((teacher, index, list) => list.findIndex((item) => item.id === teacher.id) === index)
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    el('reportsTeacher').innerHTML = '<option value="">Tüm öğretmenler</option>' + choices
      .map((teacher) => `<option value="${escapeHtml(teacher.id)}">${escapeHtml(teacher.name)}</option>`).join('');
    el('reportsTeacher').value = choices.some((teacher) => teacher.id === value) ? value : '';
  }

  function reportRows(includeStatusFilter) {
    const from = el('reportsFrom').value;
    const requestedTo = el('reportsTo').value;
    const today = dateValue(new Date());
    const to = requestedTo && requestedTo < today ? requestedTo : today;
    const teacherId = el('reportsTeacher').value;
    const query = el('reportsSearch').value.trim().toLocaleLowerCase('tr-TR');
    const status = includeStatusFilter ? el('reportsStatus').value : '';
    if (!from || !to || from > to) return [];

    const saved = new Map(attendanceRecords.map((item) => [
      `${item.teacherId}|${item.applicationId}|${item.lessonDate}|${item.slot}`, item
    ]));
    const rows = [];
    const known = new Set();
    let date = from;
    let guard = 0;
    while (date <= to && guard < 370) {
      const day = dayForDate(date);
      if (day) {
        placements.filter((placement) => !placement.startDate || placement.startDate <= date).forEach((placement) => {
          (placement.schedule || []).filter((entry) => entry.day === day).forEach((entry) => {
            const key = `${entry.teacherId}|${placement.applicationId}|${date}|${entry.slot}`;
            const record = saved.get(key);
            known.add(key);
            rows.push({
              teacherId: entry.teacherId, teacherName: entry.teacherName || teacherOf(entry.teacherId)?.name || 'Arşiv öğretmen',
              applicationId: placement.applicationId, applicationReference: placement.applicationReference,
              studentName: placement.studentName, applicationType: placement.applicationType,
              lessonDate: date, day, slot: entry.slot, status: record?.status || 'eksik', note: record?.note || '',
              updatedAt: record?.updatedAt || ''
            });
          });
        });
      }
      date = addDays(date, 1);
      guard += 1;
    }
    attendanceRecords.forEach((record) => {
      if (record.lessonDate < from || record.lessonDate > to) return;
      const key = `${record.teacherId}|${record.applicationId}|${record.lessonDate}|${record.slot}`;
      if (known.has(key)) return;
      rows.push({ ...record });
    });
    return rows.filter((row) => {
      const haystack = `${row.studentName || ''} ${row.applicationReference || ''} ${row.teacherName || ''}`.toLocaleLowerCase('tr-TR');
      return (!teacherId || row.teacherId === teacherId) && (!query || haystack.includes(query)) && (!status || row.status === status);
    });
  }

  function renderReports() {
    if (!el('reportsFrom').value || !el('reportsTo').value) {
      const range = thisWeekRange();
      el('reportsFrom').value = range.from;
      el('reportsTo').value = range.to;
    }
    const all = reportRows(false);
    const filtered = reportRows(true).sort((a, b) => b.lessonDate.localeCompare(a.lessonDate) ||
      meta.timeSlots.indexOf(a.slot) - meta.timeSlots.indexOf(b.slot));
    const completed = all.filter((row) => row.status !== 'eksik');
    const present = all.filter((row) => row.status === 'katildi').length;
    const missing = all.filter((row) => row.status === 'eksik');
    const completionRate = all.length ? Math.round(completed.length / all.length * 100) : 0;
    const attendanceRate = completed.length ? Math.round(present / completed.length * 100) : 0;
    el('reportsExpected').textContent = all.length;
    el('reportsCompleted').textContent = completed.length;
    el('reportsPresent').textContent = present;
    el('reportsMissing').textContent = missing.length;
    el('reportsCompletionText').textContent = `%${completionRate} tamamlama`;
    el('reportsAttendanceText').textContent = `%${attendanceRate} katılım`;
    el('reportsProgressValue').textContent = `%${completionRate}`;
    el('reportsProgressBar').style.transform = `scaleX(${completionRate / 100})`;
    const grouped = new Map();
    all.forEach((row) => {
      const key = row.teacherId || row.teacherName;
      if (!grouped.has(key)) grouped.set(key, { id: row.teacherId, name: row.teacherName || 'Arşiv öğretmen', expected: 0, completed: 0, present: 0 });
      const group = grouped.get(key);
      group.expected += 1;
      if (row.status !== 'eksik') group.completed += 1;
      if (row.status === 'katildi') group.present += 1;
    });
    const teacherRows = [...grouped.values()].sort((a, b) => b.expected - a.expected || a.name.localeCompare(b.name, 'tr'));
    el('reportsTeacherResult').textContent = `${teacherRows.length} öğretmen`;
    el('reportsTeacherSummary').innerHTML = teacherRows.length ? teacherRows.map((teacher) => {
      const rate = teacher.expected ? Math.round(teacher.completed / teacher.expected * 100) : 0;
      return `<article class="report-teacher-row"><div class="report-teacher-name"><span class="teacher-avatar">${escapeHtml(teacher.name.charAt(0).toLocaleUpperCase('tr-TR'))}</span><span><strong>${escapeHtml(teacher.name)}</strong><small>${teacher.completed}/${teacher.expected} yoklama · ${teacher.present} katılım</small></span></div><strong>%${rate}</strong><span class="report-mini-meter"><i style="--value:${rate}%"></i></span></article>`;
    }).join('') : '<div class="report-empty">Bu aralıkta planlanmış ders bulunmuyor.</div>';

    el('reportsMissingResult').textContent = `${missing.length} kayıt`;
    el('reportsMissingList').innerHTML = missing.length ? missing.slice(0, 40).map((row) => {
      const date = new Date(`${row.lessonDate}T12:00:00`);
      return `<article class="report-missing-row"><span class="report-missing-date"><strong>${date.getDate()}</strong>${new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(date)}</span><span class="report-missing-copy"><strong>${escapeHtml(row.studentName)}</strong><small>${escapeHtml(row.teacherName)} · ${escapeHtml(labels.days[row.day] || row.day)}</small></span><time>${escapeHtml(row.slot)}</time></article>`;
    }).join('') : '<div class="report-empty">Harika—seçilen aralıkta eksik yoklama yok.</div>';

    el('reportsResultCount').textContent = `${filtered.length} kayıt`;
    el('reportsTableBody').innerHTML = filtered.length ? filtered.map((row) => `<tr>
      <td>${escapeHtml(formatDate(`${row.lessonDate}T12:00:00`, false))}</td><td>${escapeHtml(row.teacherName)}</td>
      <td><span class="app-student">${escapeHtml(row.studentName)}</span><span class="app-ref">${escapeHtml(row.applicationReference)}</span></td>
      <td>${escapeHtml(row.slot)}</td><td>${escapeHtml(labels.type[row.applicationType] || row.applicationType)}</td>
      <td><span class="report-status report-status-${escapeHtml(row.status)}">${escapeHtml(labels.attendance[row.status] || row.status)}</span></td><td>${escapeHtml(row.note || '—')}</td>
    </tr>`).join('') : '<tr><td colspan="7" class="apps-empty">Filtrelerle eşleşen yoklama kaydı bulunamadı.</td></tr>';
  }

  async function load(force) {
    if (loaded && !force) {
      renderStats(); renderTeacherFilter(); renderProgramFilters(); renderTable(); renderTeacherGrid(); renderProgram(); renderReportFilters(); renderReports();
      return;
    }
    el('appsTableBody').innerHTML = '<tr><td colspan="9"><div class="apps-loading"><span class="spin"></span>Şifreli kayıtlar açılıyor...</div></td></tr>';
    el('appsNotice').innerHTML = '';
    try {
      const result = await api('GET');
      applications = Array.isArray(result.data) ? result.data : [];
      teachers = Array.isArray(result.teachers) ? result.teachers : [];
      placements = Array.isArray(result.placements) ? result.placements : [];
      attendanceRecords = Array.isArray(result.attendance) ? result.attendance : [];
      meta = result.meta?.weekdays && result.meta?.timeSlots ? result.meta : fallbackMeta;
      loaded = true;
      renderStats(); renderTeacherFilter(); renderProgramFilters(); renderTable(); renderTeacherGrid(); renderProgram(); renderReportFilters(); renderReports();
      if (force) toast('Başvurular ve ders planı güncellendi.');
    } catch (error) {
      el('appsTableBody').innerHTML = `<tr><td colspan="9" class="apps-empty">${escapeHtml(error.message)}</td></tr>`;
      el('appsNotice').innerHTML = `<div class="notice err">${escapeHtml(error.message)}</div>`;
    }
  }

  function detail(label, value, wide) {
    return `<div class="apps-detail${wide ? ' is-wide' : ''}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || 'Belirtilmedi')}</dd></div>`;
  }

  function occupiedBy(applicationId, teacherId, day, slot) {
    if (!teacherId || !slot) return null;
    return placements.find((placement) => placement.applicationId !== applicationId &&
      placement.schedule?.some((entry) => entry.teacherId === teacherId && entry.day === day && entry.slot === slot));
  }

  function eligibleTeachers(item, day, currentId) {
    const expectedGender = item.gender === 'kiz' ? 'kadin' : 'erkek';
    return teachers.filter((teacher) => (teacher.active || teacher.id === currentId) &&
      teacher.gender === expectedGender && teacher.modes.includes(item.applicationType) && teacher.days.includes(day));
  }

  function renderScheduleRows(item) {
    const availability = Array.isArray(item.availabilitySlots) && item.availabilitySlots.length ? item.availabilitySlots : meta.timeSlots;
    el('appsScheduleRows').innerHTML = meta.weekdays.map((day, index) => {
      const draft = draftSchedule[day] || { teacherId: '', slot: '' };
      const eligible = eligibleTeachers(item, day, draft.teacherId);
      const teacherOptions = eligible.map((teacher) => `<option value="${escapeHtml(teacher.id)}" ${teacher.id === draft.teacherId ? 'selected' : ''}>${escapeHtml(teacher.name)}${teacher.active ? '' : ' · Pasif'}</option>`).join('');
      const slotOptions = availability.map((slot) => {
        const conflict = occupiedBy(item.id, draft.teacherId, day, slot);
        const suffix = conflict ? ` · Dolu: ${conflict.studentName || conflict.applicationReference}` : '';
        return `<option value="${escapeHtml(slot)}" ${slot === draft.slot ? 'selected' : ''} ${conflict ? 'disabled' : ''}>${escapeHtml(slot + suffix)}</option>`;
      }).join('');
      const conflict = occupiedBy(item.id, draft.teacherId, day, draft.slot);
      const complete = draft.teacherId && draft.slot && !conflict;
      return `<div class="schedule-row ${complete ? 'is-complete' : ''}" style="--day-index:${index}">
        <div class="schedule-day"><span>${index + 1}</span><strong>${labels.days[day]}</strong></div>
        <label><span>Öğretmen</span><select data-schedule-teacher="${day}"><option value="">Öğretmen seç</option>${teacherOptions}</select></label>
        <label><span>Saat</span><select data-schedule-slot="${day}" ${draft.teacherId ? '' : 'disabled'}><option value="">Saat seç</option>${slotOptions}</select></label>
        <span class="schedule-check" aria-hidden="true">${complete ? '✓' : '—'}</span>
      </div>`;
    }).join('');
    updateAssignmentFeedback(item);
  }

  function updateAssignmentFeedback(item) {
    const completeCount = meta.weekdays.filter((day) => draftSchedule[day]?.teacherId && draftSchedule[day]?.slot &&
      !occupiedBy(item.id, draftSchedule[day].teacherId, day, draftSchedule[day].slot)).length;
    const feedback = el('appsAssignmentFeedback');
    feedback.className = `assignment-feedback ${completeCount === 5 ? 'is-ready' : ''}`;
    feedback.innerHTML = `<span class="assignment-meter"><i style="--progress:${completeCount * 20}%"></i></span><strong>${completeCount}/5 gün hazır</strong><span>${completeCount === 5 ? 'Program kaydedilmeye hazır.' : 'Eksik günlerde öğretmen ve saat seçin.'}</span>`;
  }

  function openDetail(id) {
    const item = applications.find((record) => record.id === id);
    if (!item) return;
    const isNewOnline = item.applicationVersion === 'online-2026-09';
    selectedId = id;
    const placement = placementOf(id);
    draftSchedule = Object.fromEntries(meta.weekdays.map((day) => {
      const entry = placement?.schedule?.find((row) => row.day === day);
      return [day, { teacherId: entry?.teacherId || '', slot: entry?.slot || '' }];
    }));
    el('appsModalTitle').textContent = item.studentName;
    el('appsModalReference').textContent = `${item.reference} · ${formatDate(item.createdAt, true)}`;
    el('appsModalDetails').innerHTML = isNewOnline ? `
      <section class="apps-detail-section"><h3>Öğrenci bilgileri</h3><dl class="apps-detail-grid">
        ${detail('Doğum tarihi', formatDate(`${item.birthDate}T00:00:00`, false))}${detail('Cinsiyet', labels.gender[item.gender])}
        ${detail('Sınıf', `${item.grade}. sınıf`)}${detail('Kur’an seviyesi', labels.level[item.quranLevel])}
      </dl></section>
      <section class="apps-detail-section"><h3>Veli ve iletişim</h3><dl class="apps-detail-grid">
        ${detail('Anne', item.motherName || item.guardianName)}${detail('Anne telefonu', formatPhone(item.motherPhone || item.guardianPhone))}
        ${detail('Baba', item.fatherName || item.secondGuardianName)}${detail('Baba telefonu', formatPhone(item.fatherPhone || item.secondGuardianPhone))}
        ${detail('Öğrenci telefonu', formatPhone(item.studentPhone))}${detail('İlçe / şehir', item.location || item.address)}
      </dl></section>
      <section class="apps-detail-section"><h3>Online eğitim tercihleri</h3><dl class="apps-detail-grid">
        ${detail('Başvuru türü', 'Online eğitim')}${detail('Daha önce eğitim aldı', labels.previous[item.previousTraining])}
        ${detail('Önceki program', item.previousTrainingDetail)}${detail('Bizi nereden duydu', `${labels.referral[item.referralSource] || item.referralSource || 'Belirtilmedi'}${item.referralOther ? ` · ${item.referralOther}` : ''}`)}
        ${detail('Öğrencinin seçtiği saat aralıkları', (item.availabilityRanges || []).join(', '), true)}
      </dl></section>
      <section class="apps-detail-section"><h3>Onaylar</h3><dl class="apps-detail-grid">
        ${detail('KVKK bilgilendirmesi', item.consents?.privacyAcknowledged ? 'Okundu' : 'Eksik')}
        ${detail('Online hizmet şartları', item.consents?.termsAccepted ? 'Kabul edildi' : 'Eksik')}
      </dl></section>` : `
      <section class="apps-detail-section"><h3>Öğrenci bilgileri</h3><dl class="apps-detail-grid">
        ${detail('T.C. kimlik numarası', item.tckn)}${detail('Doğum tarihi', formatDate(`${item.birthDate}T00:00:00`, false))}
        ${detail('Cinsiyet', labels.gender[item.gender])}${detail('Sınıf', `${item.grade}. sınıf`)}${detail('Okul', item.school, true)}
      </dl></section>
      <section class="apps-detail-section"><h3>Veli ve iletişim</h3><dl class="apps-detail-grid">
        ${detail('Veli', item.guardianName)}${detail('Yakınlık', labels.relation[item.guardianRelation])}
        ${detail('Veli telefonu', formatPhone(item.guardianPhone))}${detail('Öğrenci telefonu', formatPhone(item.studentPhone))}
        ${detail('İkinci veli', item.secondGuardianName)}${detail('İkinci veli telefonu', formatPhone(item.secondGuardianPhone))}${detail('Adres', item.address, true)}
      </dl></section>
      <section class="apps-detail-section"><h3>Eğitim bilgileri</h3><dl class="apps-detail-grid">
        ${detail('Başvuru türü', labels.type[item.applicationType])}${detail('Kur’an seviyesi', labels.level[item.quranLevel])}
        ${detail('Daha önce eğitim aldı', labels.previous[item.previousTraining])}${detail('Önceki program', item.previousTrainingDetail)}
        ${detail('Öğrencinin seçtiği müsait saatler', (item.availabilitySlots || []).join(', '), true)}${detail('Veli notu', item.notes, true)}
      </dl></section>
      <section class="apps-detail-section"><h3>Onaylar</h3><dl class="apps-detail-grid">
        ${detail('Program kuralları', item.consents?.rulesAccepted ? 'Kabul edildi' : 'Eksik')}
        ${detail('KVKK bilgilendirmesi', item.consents?.privacyAcknowledged ? 'Okundu' : 'Eksik')}
        ${detail('Hizmet şartları', item.consents?.termsAccepted ? 'Kabul edildi' : 'Eksik')}
        ${detail('Görsel paylaşımı', labels.media[item.consents?.mediaConsent])}
      </dl></section>`;
    const availability = isNewOnline ? (item.availabilityRanges || []) :
      (Array.isArray(item.availabilitySlots) && item.availabilitySlots.length ? item.availabilitySlots : meta.timeSlots);
    el('appsAvailability').innerHTML = availability.map((slot) => `<span>${escapeHtml(slot)}</span>`).join('');
    el('appsAssignmentSection').hidden = isNewOnline;
    el('appsStartDate').value = placement?.startDate || '';
    el('appsAssignmentState').textContent = placement ? 'Plan kaydedildi' : 'Planlanmadı';
    el('appsAssignmentState').className = `assignment-state ${placement ? 'is-ready' : ''}`;
    el('appsRemoveAssignment').hidden = !placement;
    if (!isNewOnline) renderScheduleRows(item);
    el('appsReviewStatus').value = item.status || 'yeni';
    el('appsAdminNote').value = item.adminNote || '';
    el('appsDeleteApplication').disabled = false;
    el('appsDeleteApplication').textContent = 'Öğrenciyi sil';
    el('appsModalNotice').textContent = '';
    const dialog = el('appsDialog');
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  }

  function closeDetail() {
    const dialog = el('appsDialog');
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
    selectedId = '';
  }

  async function saveAssignment() {
    const item = applications.find((record) => record.id === selectedId);
    if (!item) return;
    const button = el('appsSaveAssignment');
    button.disabled = true; button.textContent = 'Plan kontrol ediliyor...';
    el('appsAssignmentFeedback').classList.add('is-saving');
    try {
      const result = await api('POST', {
        action: 'placement-save', applicationId: item.id, applicationCreatedAt: item.createdAt,
        startDate: el('appsStartDate').value,
        schedule: meta.weekdays.map((day) => ({ day, ...draftSchedule[day] }))
      });
      const index = placements.findIndex((placement) => placement.applicationId === item.id);
      if (index >= 0) placements[index] = result.data; else placements.push(result.data);
      el('appsAssignmentState').textContent = 'Plan kaydedildi';
      el('appsAssignmentState').className = 'assignment-state is-ready';
      el('appsRemoveAssignment').hidden = false;
      renderStats(); renderTable(); renderTeacherGrid(); renderProgramFilters(); renderProgram(); renderScheduleRows(item);
      toast('Beş günlük ders planı güvenle kaydedildi.');
    } catch (error) {
      toast(error.message, 'error');
      el('appsAssignmentFeedback').className = 'assignment-feedback is-error';
      el('appsAssignmentFeedback').innerHTML = `<strong>Plan kaydedilemedi</strong><span>${escapeHtml(error.message)}</span>`;
    } finally {
      button.disabled = false; button.textContent = 'Ders planını kaydet';
    }
  }

  async function removeAssignment() {
    const item = applications.find((record) => record.id === selectedId);
    if (!item) return;
    const accepted = await confirmModal('Bu öğrencinin beş günlük ders planı kaldırılacak. Başvuru kaydı korunur.', 'Ders planını kaldır', 'Programı kaldır');
    if (!accepted) return;
    try {
      await api('POST', { action: 'placement-remove', applicationId: item.id });
      placements = placements.filter((placement) => placement.applicationId !== item.id);
      el('appsStartDate').value = '';
      el('appsAssignmentState').textContent = 'Planlanmadı';
      el('appsAssignmentState').className = 'assignment-state';
      el('appsRemoveAssignment').hidden = true;
      draftSchedule = Object.fromEntries(meta.weekdays.map((day) => [day, { teacherId: '', slot: '' }]));
      renderStats(); renderTable(); renderTeacherGrid(); renderProgramFilters(); renderProgram(); renderScheduleRows(item);
      toast('Ders planı kaldırıldı.');
    } catch (error) { toast(error.message, 'error'); }
  }

  async function saveReview() {
    const item = applications.find((record) => record.id === selectedId);
    if (!item) return;
    const button = el('appsSaveReview');
    button.disabled = true; button.textContent = 'Kaydediliyor...';
    el('appsModalNotice').textContent = '';
    try {
      const result = await api('POST', {
        action: 'update', id: item.id, createdAt: item.createdAt, status: el('appsReviewStatus').value,
        adminNote: el('appsAdminNote').value
      });
      Object.assign(item, result.data);
      renderStats(); renderTable();
      el('appsModalNotice').textContent = 'Değişiklikler kaydedildi.';
      el('appsModalNotice').className = 'apps-modal-notice is-success';
      toast(item.status === 'kayit-tamamlandi' ? 'Kayıt tamamlandı; mesaj kopyalanmaya hazır.' : 'Başvuru durumu güncellendi.');
    } catch (error) {
      el('appsModalNotice').textContent = error.message;
      el('appsModalNotice').className = 'apps-modal-notice is-error';
    } finally {
      button.disabled = false; button.textContent = 'Değişiklikleri kaydet';
    }
  }

  function messageFor(item, placement) {
    const schedule = placement.schedule || [];
    const groups = [];
    schedule.forEach((entry) => {
      const key = `${entry.teacherId}|${entry.slot}`;
      let group = groups.find((row) => row.key === key);
      if (!group) {
        group = { key, teacher: entry.teacherName || teacherOf(entry.teacherId)?.name || 'Belirtilmedi', slot: entry.slot, days: [] };
        groups.push(group);
      }
      group.days.push(labels.days[entry.day] || entry.day);
    });
    const place = item.applicationType === 'online' ? 'online olarak' : "BİRLİKTE İYİLİK AKADEMİ'de";
    let programText = '';
    if (groups.length === 1 && schedule.length === 5) {
      const group = groups[0];
      programText = `${group.days.join(', ')} günleri ${group.slot.replace(':', '.').replace('-', ' - ').replace(':', '.')} saatleri arasında ${place} gerçekleşecektir.\n\nHoca Adı: ${group.teacher.toLocaleUpperCase('tr-TR')}`;
    } else {
      programText = `haftalık olarak ${place} gerçekleşecektir.\n\nDers programı:\n${groups.map((group) => `• ${group.days.join(', ')}: ${group.slot.replace(':', '.').replace('-', ' - ').replace(':', '.')} — Hoca Adı: ${group.teacher.toLocaleUpperCase('tr-TR')}`).join('\n')}`;
    }
    const start = new Date(`${placement.startDate}T00:00:00`);
    const startText = Number.isFinite(start.getTime())
      ? new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }).format(start).toLocaleUpperCase('tr-TR')
      : placement.startDate;
    return `🌸 BİRLİKTE İYİLİK AKADEMİ BİLGİLENDİRME 🌸\n\nDeğerli Velimiz,\n\n${item.studentName}'ın Kur'an-ı Kerim ve Güzel Ahlak Kursu'ndaki programı ${programText}\n\nKursumuza ${startText} günü itibariyle başlayabilir.\n\nEğitimlerimizin verimli geçebilmesi için öğrencimizin ders saatlerine riayet etmesi, ders saatinden 5 dakika önce sınıfında bulunması konusunda sizlerin de hassasiyet göstermenizi rica ederiz.\n\nTeşekkür eder, hayırlı günler dileriz. 😊\n\nBİRLİKTE İYİLİK AKADEMİ`;
  }

  async function copyMessage(id) {
    const item = applications.find((record) => record.id === id);
    const placement = placementOf(id);
    if (!item || !placement) return toast('Önce ders planını tamamlayın.', 'error');
    const message = messageFor(item, placement);
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(message);
      else {
        const area = document.createElement('textarea');
        area.value = message; area.style.position = 'fixed'; area.style.opacity = '0';
        document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
      }
      toast(`${item.studentName} için mesaj panoya kopyalandı.`);
    } catch (_) { toast('Mesaj kopyalanamadı.', 'error'); }
  }

  function exportRows() {
    return filterData().map((item) => {
      const placement = placementOf(item.id);
      const row = {
        'Başvuru No': item.reference, 'Başvuru Tarihi': formatDate(item.createdAt, true),
        'Başvuru Türü': labels.type[item.applicationType] || item.applicationType,
        'Durum': labels.status[item.status] || item.status, 'Öğrenci Adı Soyadı': item.studentName,
        'T.C. Kimlik No': String(item.tckn || ''), 'Doğum Tarihi': item.birthDate,
        'Cinsiyet': labels.gender[item.gender] || item.gender, 'Okul': item.school, 'Sınıf': item.grade,
        'Kur’an Seviyesi': labels.level[item.quranLevel] || item.quranLevel,
        'Müsait Saatler': (item.availabilityRanges || item.availabilitySlots || []).join(', '), 'Veli Adı Soyadı': item.guardianName,
        'Yakınlık': labels.relation[item.guardianRelation] || item.guardianRelation,
        'Veli Telefonu': formatPhone(item.guardianPhone), 'Öğrenci Telefonu': formatPhone(item.studentPhone),
        'İkinci Veli': item.secondGuardianName, 'İkinci Veli Telefonu': formatPhone(item.secondGuardianPhone),
        'Anne Adı': item.motherName || '', 'Anne Telefonu': formatPhone(item.motherPhone),
        'Baba Adı': item.fatherName || '', 'Baba Telefonu': formatPhone(item.fatherPhone),
        'Adres': item.address, 'İlçe / Şehir': item.location || '', 'Daha Önce Eğitim': labels.previous[item.previousTraining] || item.previousTraining,
        'Önceki Program': item.previousTrainingDetail, 'Veli Notu': item.notes,
        'Bizi Nereden Duydu': labels.referral[item.referralSource] || item.referralSource || '', 'Diğer Kaynak': item.referralOther || '',
        'Görsel Paylaşım İzni': labels.media[item.consents?.mediaConsent] || item.consents?.mediaConsent,
        'Başlangıç Günü': placement?.startDate || '', 'Yönetici Notu': item.adminNote
      };
      meta.weekdays.forEach((day) => {
        const entry = placement?.schedule?.find((scheduled) => scheduled.day === day);
        row[`${labels.days[day]} Öğretmen`] = entry?.teacherName || teacherOf(entry?.teacherId)?.name || '';
        row[`${labels.days[day]} Saat`] = entry?.slot || '';
      });
      return row;
    });
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
    URL.revokeObjectURL(url);
  }
  function exportCsv() {
    const rows = exportRows();
    if (!rows.length) return toast('Dışa aktarılacak başvuru bulunamadı.', 'error');
    const headers = Object.keys(rows[0]);
    const safe = (value) => {
      let text = String(value == null ? '' : value);
      if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const csv = [headers.map(safe).join(';'), ...rows.map((row) => headers.map((key) => safe(row[key])).join(';'))].join('\r\n');
    download(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }), `bia-basvurular-${new Date().toISOString().slice(0, 10)}.csv`);
    toast('Filtrelenmiş başvurular CSV olarak indirildi.');
  }
  function exportExcel() {
    const rows = exportRows();
    if (!rows.length) return toast('Dışa aktarılacak başvuru bulunamadı.', 'error');
    if (!window.XLSX) return toast('Excel bileşeni yüklenemedi; CSV kullanabilirsiniz.', 'error');
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet['!cols'] = Object.keys(rows[0]).map((key) => ({ wch: Math.min(42, Math.max(13, key.length + 2)) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Başvurular');
    XLSX.writeFile(workbook, `bia-basvurular-${new Date().toISOString().slice(0, 10)}.xlsx`, { compression: true });
    toast('Filtrelenmiş başvurular Excel olarak indirildi.');
  }

  function reportExportRows() {
    return reportRows(true).map((row) => ({
      'Ders Tarihi': row.lessonDate,
      'Gün': labels.days[row.day] || row.day,
      'Saat': row.slot,
      'Öğretmen': row.teacherName,
      'Öğrenci': row.studentName,
      'Başvuru No': row.applicationReference,
      'Eğitim Türü': labels.type[row.applicationType] || row.applicationType,
      'Yoklama Durumu': labels.attendance[row.status] || row.status,
      'Not': row.note || '',
      'Son Güncelleme': row.updatedAt ? formatDate(row.updatedAt, true) : ''
    }));
  }

  function exportReportCsv() {
    const rows = reportExportRows();
    if (!rows.length) return toast('Dışa aktarılacak yoklama kaydı bulunamadı.', 'error');
    const headers = Object.keys(rows[0]);
    const safe = (value) => {
      let text = String(value == null ? '' : value);
      if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const csv = [headers.map(safe).join(';'), ...rows.map((row) => headers.map((key) => safe(row[key])).join(';'))].join('\r\n');
    download(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }), `bia-yoklama-${dateValue(new Date())}.csv`);
    toast('Yoklama raporu CSV olarak indirildi.');
  }

  function exportReportExcel() {
    const rows = reportExportRows();
    if (!rows.length) return toast('Dışa aktarılacak yoklama kaydı bulunamadı.', 'error');
    if (!window.XLSX) return toast('Excel bileşeni yüklenemedi; CSV kullanabilirsiniz.', 'error');
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet['!cols'] = Object.keys(rows[0]).map((key) => ({ wch: Math.min(36, Math.max(13, key.length + 2)) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Yoklama Raporu');
    XLSX.writeFile(workbook, `bia-yoklama-${dateValue(new Date())}.xlsx`, { compression: true });
    toast('Yoklama raporu Excel olarak indirildi.');
  }

  function resetReportFilters() {
    const range = thisWeekRange();
    el('reportsFrom').value = range.from;
    el('reportsTo').value = range.to;
    el('reportsTeacher').value = '';
    el('reportsStatus').value = '';
    el('reportsSearch').value = '';
    renderReports();
  }

  function resetFilters() {
    ['appsSearch', 'appsType', 'appsGender', 'appsGrade', 'appsLevel', 'appsPreviousTraining', 'appsStatus', 'appsPlanState', 'appsTeacher', 'appsFrom', 'appsTo']
      .forEach((id) => { el(id).value = ''; });
    renderTable();
  }

  function nextMondayValue() {
    const date = new Date();
    date.setDate(date.getDate() + (((8 - date.getDay()) % 7) || 7));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function mergePlacements(records) {
    (records || []).forEach((record) => {
      const index = placements.findIndex((placement) => placement.applicationId === record.applicationId);
      if (index >= 0) placements[index] = record; else placements.push(record);
    });
  }

  function showAutoFeedback(created, skipped) {
    const feedback = el('programAutoFeedback');
    if (!skipped.length) {
      feedback.className = 'program-auto-feedback is-success';
      feedback.innerHTML = `<strong>✓ ${created} öğrenci düzenli programa atandı.</strong><span>Çakışma oluşmadı; cinsiyet, gün ve müsait saat kuralları doğrulandı.</span>`;
      return;
    }
    feedback.className = `program-auto-feedback ${created ? 'is-warning' : 'is-error'}`;
    feedback.innerHTML = `<strong>${created} öğrenci atandı, ${skipped.length} başvuru yedek listeye alındı.</strong><span>${skipped.slice(0, 3).map((item) => `${escapeHtml(item.studentName)}: ${escapeHtml(item.reason)}`).join(' · ')}</span>`;
  }

  async function autoAssignAll() {
    const startDate = el('programAutoStartDate').value;
    if (!startDate) return toast('Otomatik atama için başlangıç günü seçin.', 'error');
    const unplanned = applications.filter((item) => item.applicationVersion !== 'online-2026-09' &&
      ['yeni', 'inceleniyor', 'uygun'].includes(item.status) && !placementOf(item.id));
    if (!unplanned.length) return toast('Planlanmayı bekleyen uygun başvuru yok.', 'error');
    const accepted = await confirmModal(
      `${unplanned.length} başvuru; cinsiyet, müsait saat ve öğretmen doluluğu kontrol edilerek otomatik planlanacak.`,
      'Düzenli otomatik atama', 'Atamayı başlat'
    );
    if (!accepted) return;
    const button = el('programAutoAssign');
    button.disabled = true; button.textContent = 'Programlar hesaplanıyor...';
    try {
      const result = await api('POST', { action: 'auto-plan', startDate });
      mergePlacements(result.data);
      renderStats(); renderTable(); renderTeacherGrid(); renderProgramFilters(); renderProgram();
      showAutoFeedback((result.data || []).length, result.skipped || []);
      toast(`${(result.data || []).length} öğrenci otomatik programa alındı.`);
    } catch (error) { toast(error.message, 'error'); }
    finally { button.disabled = false; button.textContent = 'Planlanmayanları ata'; }
  }

  async function autoPlanSelected() {
    const item = applications.find((record) => record.id === selectedId);
    if (!item) return;
    const startDate = el('appsStartDate').value;
    if (!startDate) return toast('Önce başlangıç gününü seçin.', 'error');
    const existing = placementOf(item.id);
    if (existing) {
      const accepted = await confirmModal(
        'Mevcut beş günlük program, en düzenli yeni atamayla değiştirilecek.',
        'Programı yeniden hesapla', 'Yeniden planla'
      );
      if (!accepted) return;
    }
    const button = el('appsAutoAssignment');
    button.disabled = true; button.textContent = 'Hesaplanıyor...';
    try {
      const result = await api('POST', {
        action: 'auto-plan', startDate, applicationIds: [item.id], replaceExisting: Boolean(existing)
      });
      if (!result.data?.length) throw new Error(result.skipped?.[0]?.reason || 'Uygun program bulunamadı.');
      mergePlacements(result.data);
      const placement = placementOf(item.id);
      draftSchedule = Object.fromEntries(meta.weekdays.map((day) => {
        const entry = placement.schedule.find((scheduled) => scheduled.day === day);
        return [day, { teacherId: entry?.teacherId || '', slot: entry?.slot || '' }];
      }));
      el('appsAssignmentState').textContent = 'Otomatik planlandı';
      el('appsAssignmentState').className = 'assignment-state is-ready';
      el('appsRemoveAssignment').hidden = false;
      renderStats(); renderTable(); renderTeacherGrid(); renderProgramFilters(); renderProgram(); renderScheduleRows(item);
      toast(`${item.studentName} için en düzenli program kaydedildi.`);
    } catch (error) { toast(error.message, 'error'); }
    finally { button.disabled = false; button.textContent = '✦ Otomatik planla'; }
  }

  async function seedDemoData() {
    const refreshing = el('programDemoSeed').dataset.mode === 'refresh';
    const accepted = await confirmModal(
      refreshing
        ? '10 test öğrencisinin müsait saatleri gerçekçi biçimde dağıtılacak ve programları yeniden hesaplanacak. Gerçek kayıtlar değişmeyecek.'
        : 'Gerçek kayıtlardan “Test” etiketiyle ayrılan 5 kız, 5 erkek öğrenci ve 5 öğretmen oluşturulup otomatik planlanacak.',
      refreshing ? 'Test verisini güncelle' : 'Test verisini kur', refreshing ? 'Saatleri dağıt ve planla' : '10 öğrenci + 5 öğretmen ekle'
    );
    if (!accepted) return;
    const button = el('programDemoSeed');
    button.disabled = true; button.textContent = 'Test verisi hazırlanıyor...';
    try {
      const result = await api('POST', {
        action: 'demo-seed', startDate: el('programAutoStartDate').value || nextMondayValue()
      });
      loaded = false;
      await load(false);
      switchView('schedule');
      showAutoFeedback((result.data?.placements || []).length, result.skipped || []);
      toast('10 test öğrencisi ve 5 test öğretmeni hazır.');
    } catch (error) {
      button.disabled = false; button.textContent = refreshing ? 'Test verisini güncelle' : 'Test verisini kur'; toast(error.message, 'error');
    }
  }

  async function removeDemoData() {
    const demoApplications = applications.filter((item) => item.isDemo).length;
    const demoTeachers = teachers.filter((item) => item.isDemo).length;
    const accepted = await confirmModal(
      `${demoApplications} test öğrencisi, ${demoTeachers} test öğretmeni ve bunlara bağlı ders atamaları silinecek. Gerçek kayıtlar korunacak.`,
      'Test verilerini sil', 'Test verilerini sil'
    );
    if (!accepted) return;
    const button = el('programDemoSeed');
    button.disabled = true; button.textContent = 'Test verileri siliniyor...';
    try {
      const result = await api('POST', { action: 'bulk-delete', scope: 'demo' });
      loaded = false;
      await load(false);
      toast(`${result.data.removedApplications || 0} test öğrencisi ve ${result.data.removedTeachers || 0} test öğretmeni silindi.`);
    } catch (error) {
      button.disabled = false; button.textContent = 'Test verilerini sil'; toast(error.message, 'error');
    }
  }

  async function deleteApplication() {
    const item = applications.find((record) => record.id === selectedId);
    if (!item) return;
    const hasAssignment = Boolean(placementOf(item.id));
    const accepted = await confirmModal(
      `${item.studentName} adlı öğrencinin başvurusu${hasAssignment ? ' ve beş günlük ders ataması' : ''} silinecek.`,
      'Öğrenciyi sil', 'Öğrenciyi sil'
    );
    if (!accepted) return;
    const button = el('appsDeleteApplication');
    button.disabled = true; button.textContent = 'Siliniyor...';
    try {
      await api('POST', {
        action: 'application-delete', applicationId: item.id, applicationCreatedAt: item.createdAt
      });
      applications = applications.filter((record) => record.id !== item.id);
      placements = placements.filter((placement) => placement.applicationId !== item.id);
      closeDetail();
      renderStats(); renderTeacherFilter(); renderProgramFilters(); renderTable(); renderTeacherGrid(); renderProgram();
      toast(`${item.studentName} panelden silindi.`);
    } catch (error) {
      button.disabled = false; button.textContent = 'Öğrenciyi sil'; toast(error.message, 'error');
    }
  }

  async function deleteTeacher() {
    const teacher = teacherOf(el('teacherId').value);
    if (!teacher) return;
    const assigned = placements.filter((placement) =>
      placement.schedule?.some((entry) => entry.teacherId === teacher.id)).length;
    const accepted = await confirmModal(
      `${teacher.name} silinecek.${assigned ? ` Öğretmene bağlı ${assigned} öğrenci programı da kaldırılacak; öğrenci başvuruları korunacak.` : ''}`,
      'Öğretmeni sil', 'Öğretmeni sil'
    );
    if (!accepted) return;
    const button = el('teacherDelete');
    button.disabled = true; button.textContent = 'Siliniyor...';
    try {
      await api('POST', { action: 'teacher-delete', teacherId: teacher.id, removeAssignments: true });
      teachers = teachers.filter((item) => item.id !== teacher.id);
      placements = placements.filter((placement) =>
        !placement.schedule?.some((entry) => entry.teacherId === teacher.id));
      closeTeacherDialog();
      renderStats(); renderTeacherFilter(); renderProgramFilters(); renderTable(); renderTeacherGrid(); renderProgram();
      toast(`${teacher.name} ve ${assigned} bağlı program silindi.`);
    } catch (error) {
      button.disabled = false; button.textContent = 'Öğretmeni sil'; toast(error.message, 'error');
    }
  }

  function openDataManagement() {
    renderStats();
    el('dataManagementFeedback').textContent = '';
    const counts = {
      demo: applications.filter((item) => item.isDemo).length + teachers.filter((item) => item.isDemo).length + placements.filter((item) => item.isDemo).length,
      assignments: placements.length, teachers: teachers.length, applications: applications.length
    };
    document.querySelectorAll('[data-bulk-delete]').forEach((button) => { button.disabled = !counts[button.dataset.bulkDelete]; });
    const dialog = el('dataManagementDialog');
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  }

  function closeDataManagement() {
    const dialog = el('dataManagementDialog');
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
  }

  async function bulkDelete(scope, button) {
    const definitions = {
      demo: {
        title: 'Test verilerini sil', action: 'Test verilerini sil',
        message: 'Yalnız Test etiketli öğrenciler, öğretmenler ve bunlara bağlı atamalar silinecek. Gerçek kayıtlar korunacak.'
      },
      assignments: {
        title: 'Tüm atamaları sil', action: 'Tüm atamaları sil',
        message: `${placements.length} haftalık ders ataması silinecek. Öğrenci ve öğretmen kayıtları korunacak.`
      },
      teachers: {
        title: 'Tüm öğretmenleri sil', action: 'Öğretmenleri ve atamaları sil',
        message: `${teachers.length} öğretmen ve ${placements.length} haftalık ders ataması silinecek. Öğrenci başvuruları korunacak.`
      },
      applications: {
        title: 'Tüm öğrencileri sil', action: 'Öğrencileri ve atamaları sil',
        message: `${applications.length} öğrenci başvurusu ve bunlara bağlı ders atamaları silinecek. Öğretmen kayıtları korunacak.`
      }
    };
    const definition = definitions[scope];
    if (!definition) return;
    const accepted = await confirmModal(definition.message, definition.title, definition.action);
    if (!accepted) return;
    const originalText = button.textContent;
    button.disabled = true; button.textContent = 'Siliniyor...';
    try {
      const result = await api('POST', { action: 'bulk-delete', scope });
      loaded = false;
      closeDataManagement();
      await load(false);
      const removed = result.data || {};
      toast(`${(removed.removedApplications || 0) + (removed.removedTeachers || 0) + (removed.removedAssignments || 0)} kayıt silindi.`);
    } catch (error) {
      button.disabled = false; button.textContent = originalText;
      el('dataManagementFeedback').textContent = error.message;
      el('dataManagementFeedback').className = 'data-management-feedback is-error';
    }
  }

  function resetProgramFilters() {
    ['programSearch', 'programDay', 'programTeacher', 'programType', 'programSlot'].forEach((id) => { el(id).value = ''; });
    renderProgram();
  }

  function switchView(view) {
    const views = { applications: 'appsApplicationsView', teachers: 'appsTeachersView', schedule: 'appsScheduleView', reports: 'appsReportsView' };
    const tabs = { applications: 'appsTabApplications', teachers: 'appsTabTeachers', schedule: 'appsTabSchedule', reports: 'appsTabReports' };
    Object.entries(views).forEach(([name, id]) => {
      const active = name === view;
      el(id).hidden = !active;
      el(id).classList.toggle('is-active', active);
      el(tabs[name]).classList.toggle('is-active', active);
      el(tabs[name]).setAttribute('aria-selected', String(active));
    });
    if (view === 'schedule') renderProgram();
    if (view === 'reports') renderReports();
  }

  function closeTeacherDialog() {
    const dialog = el('teacherDialog');
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
  }
  function openTeacherDialog(teacherId) {
    const teacher = teacherId ? teacherOf(teacherId) : null;
    el('teacherForm').reset();
    el('teacherId').value = teacher?.id || '';
    el('teacherName').value = teacher?.name || '';
    el('teacherPhone').value = teacher ? formatPhone(teacher.phone) : '';
    el('teacherUsername').value = teacher?.username || '';
    el('teacherPassword').value = '';
    el('teacherPassword').required = !teacher?.hasLogin;
    el('teacherPassword').type = 'password';
    el('teacherPasswordToggle').textContent = 'Göster';
    el('teacherLoginState').textContent = teacher?.hasLogin ? 'Giriş hazır' : teacher ? 'Giriş eksik' : 'Yeni hesap';
    el('teacherLoginState').className = teacher?.hasLogin ? 'is-ready' : '';
    el('teacherPasswordHint').textContent = teacher?.hasLogin ? 'Boş bırakırsanız mevcut şifre değişmez.' : 'En az 8 karakter; bu hesap için zorunludur.';
    document.querySelectorAll('[name="teacherGender"]').forEach((input) => { input.checked = input.value === teacher?.gender; });
    document.querySelectorAll('[name="teacherModes"]').forEach((input) => { input.checked = teacher?.modes?.includes(input.value) || false; });
    document.querySelectorAll('[name="teacherDays"]').forEach((input) => { input.checked = teacher?.days?.includes(input.value) || false; });
    el('teacherActive').checked = teacher ? teacher.active : true;
    el('teacherDelete').hidden = !teacher;
    el('teacherDelete').disabled = false;
    el('teacherDelete').textContent = 'Öğretmeni sil';
    el('teacherDialogTitle').textContent = teacher ? 'Öğretmeni düzenle' : 'Yeni öğretmen';
    el('teacherFormNotice').textContent = '';
    const dialog = el('teacherDialog');
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    window.setTimeout(() => el('teacherName').focus(), 80);
  }
  async function saveTeacher(event) {
    event.preventDefault();
    const gender = document.querySelector('[name="teacherGender"]:checked')?.value || '';
    const modes = [...document.querySelectorAll('[name="teacherModes"]:checked')].map((input) => input.value);
    const days = [...document.querySelectorAll('[name="teacherDays"]:checked')].map((input) => input.value);
    const currentTeacher = teacherOf(el('teacherId').value);
    const username = el('teacherUsername').value.trim().toLowerCase().replace(/ı/g, 'i').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    const password = el('teacherPassword').value;
    if (!el('teacherName').value.trim() || !el('teacherPhone').value.trim() || !username ||
      (!currentTeacher?.hasLogin && password.length < 8) || !gender || !modes.length || !days.length) {
      el('teacherFormNotice').textContent = 'Ad, telefon, geçerli kullanıcı adı, şifre, cinsiyet, eğitim türü ve çalışma günlerini tamamlayın.';
      el('teacherFormNotice').className = 'teacher-form-notice is-error';
      return;
    }
    const button = el('teacherSave');
    button.disabled = true; button.textContent = 'Kaydediliyor...';
    try {
      const result = await api('POST', {
        action: 'teacher-save', teacher: {
          id: el('teacherId').value, name: el('teacherName').value, phone: el('teacherPhone').value,
          username, password, gender, modes, days, active: el('teacherActive').checked
        }
      });
      const index = teachers.findIndex((teacher) => teacher.id === result.data.id);
      if (index >= 0) teachers[index] = result.data; else teachers.push(result.data);
      renderStats(); renderTeacherFilter(); renderProgramFilters(); renderTeacherGrid(); renderTable(); renderProgram();
      closeTeacherDialog(); toast(`${result.data.name} kaydedildi.`);
    } catch (error) {
      el('teacherFormNotice').textContent = error.message;
      el('teacherFormNotice').className = 'teacher-form-notice is-error';
    } finally { button.disabled = false; button.textContent = 'Öğretmeni kaydet'; }
  }

  window.showApplications = function () { showScreen('applicationsScreen'); load(false); };

  document.addEventListener('DOMContentLoaded', () => {
    const filterIds = ['appsSearch', 'appsType', 'appsGender', 'appsGrade', 'appsLevel', 'appsPreviousTraining', 'appsStatus', 'appsPlanState', 'appsTeacher', 'appsFrom', 'appsTo'];
    filterIds.forEach((id) => el(id).addEventListener(id === 'appsSearch' ? 'input' : 'change', renderTable));
    el('appsReset').addEventListener('click', resetFilters);
    el('appsRefresh').addEventListener('click', () => load(true));
    el('appsCsv').addEventListener('click', exportCsv);
    el('appsExcel').addEventListener('click', exportExcel);
    el('appsTabApplications').addEventListener('click', () => switchView('applications'));
    el('appsTabTeachers').addEventListener('click', () => switchView('teachers'));
    el('appsTabSchedule').addEventListener('click', () => switchView('schedule'));
    el('appsTabReports').addEventListener('click', () => switchView('reports'));
    ['reportsFrom', 'reportsTo', 'reportsTeacher', 'reportsStatus'].forEach((id) => el(id).addEventListener('change', renderReports));
    el('reportsSearch').addEventListener('input', renderReports);
    el('reportsReset').addEventListener('click', resetReportFilters);
    el('reportsCsv').addEventListener('click', exportReportCsv);
    el('reportsExcel').addEventListener('click', exportReportExcel);
    ['programSearch', 'programDay', 'programTeacher', 'programType', 'programSlot'].forEach((id) => {
      el(id).addEventListener(id === 'programSearch' ? 'input' : 'change', renderProgram);
    });
    el('programReset').addEventListener('click', resetProgramFilters);
    el('programAutoAssign').addEventListener('click', autoAssignAll);
    el('programDemoSeed').addEventListener('click', seedDemoData);
    el('programDataTools').addEventListener('click', openDataManagement);
    el('programAutoStartDate').value = nextMondayValue();
    el('programBoard').addEventListener('click', (event) => {
      const button = event.target.closest('[data-program-open]');
      if (button) openDetail(button.dataset.programOpen);
    });
    el('appsTeacherSearch').addEventListener('input', renderTeacherGrid);
    el('appsTeacherState').addEventListener('change', renderTeacherGrid);
    el('appsAddTeacher').addEventListener('click', () => openTeacherDialog(''));
    el('appsTeacherGrid').addEventListener('click', (event) => {
      const button = event.target.closest('[data-teacher-id]');
      if (button) openTeacherDialog(button.dataset.teacherId);
    });
    el('teacherForm').addEventListener('submit', saveTeacher);
    el('teacherDelete').addEventListener('click', deleteTeacher);
    el('teacherClose').addEventListener('click', closeTeacherDialog);
    el('teacherCancel').addEventListener('click', closeTeacherDialog);
    el('teacherPasswordToggle').addEventListener('click', () => {
      const input = el('teacherPassword');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      el('teacherPasswordToggle').textContent = show ? 'Gizle' : 'Göster';
      el('teacherPasswordToggle').setAttribute('aria-label', show ? 'Şifreyi gizle' : 'Şifreyi göster');
    });
    el('appsClose').addEventListener('click', closeDetail);
    el('appsCancel').addEventListener('click', closeDetail);
    el('appsSaveReview').addEventListener('click', saveReview);
    el('appsDeleteApplication').addEventListener('click', deleteApplication);
    el('appsSaveAssignment').addEventListener('click', saveAssignment);
    el('appsAutoAssignment').addEventListener('click', autoPlanSelected);
    el('appsRemoveAssignment').addEventListener('click', removeAssignment);
    el('appsScheduleRows').addEventListener('change', (event) => {
      const item = applications.find((record) => record.id === selectedId);
      if (!item) return;
      if (event.target.matches('[data-schedule-teacher]')) {
        const day = event.target.dataset.scheduleTeacher;
        draftSchedule[day] = { teacherId: event.target.value, slot: '' };
        renderScheduleRows(item);
      } else if (event.target.matches('[data-schedule-slot]')) {
        const day = event.target.dataset.scheduleSlot;
        draftSchedule[day].slot = event.target.value;
        renderScheduleRows(item);
      }
    });
    el('appsTableBody').addEventListener('click', (event) => {
      const copy = event.target.closest('[data-copy-id]');
      if (copy) { event.stopPropagation(); copyMessage(copy.dataset.copyId); return; }
      const open = event.target.closest('[data-open-id]');
      if (open) { event.stopPropagation(); openDetail(open.dataset.openId); return; }
      const row = event.target.closest('tr[data-id]');
      if (row) openDetail(row.dataset.id);
    });
    el('appsTableBody').addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('tr[data-id]')) {
        event.preventDefault(); openDetail(event.target.dataset.id);
      }
    });
    el('appsDialog').addEventListener('click', (event) => { if (event.target === el('appsDialog')) closeDetail(); });
    el('teacherDialog').addEventListener('click', (event) => { if (event.target === el('teacherDialog')) closeTeacherDialog(); });
    el('dataManagementClose').addEventListener('click', closeDataManagement);
    el('dataManagementDone').addEventListener('click', closeDataManagement);
    el('dataManagementDialog').addEventListener('click', (event) => {
      if (event.target === el('dataManagementDialog')) { closeDataManagement(); return; }
      const button = event.target.closest('[data-bulk-delete]');
      if (button) bulkDelete(button.dataset.bulkDelete, button);
    });
  });
})();
