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
    level: { 'hic-bilmiyor': 'Başlangıç', 'elif-ba': 'Elif Ba', okuyabiliyor: 'Okuyabiliyor', tecvid: 'Tecvid' },
    relation: { anne: 'Anne', baba: 'Baba', 'yasal-vasi': 'Yasal vasi', diger: 'Diğer' },
    previous: { evet: 'Evet', hayir: 'Hayır' },
    media: { 'izin-veriyorum': 'İzin veriyor', 'izin-vermiyorum': 'İzin vermiyor' },
    days: { pazartesi: 'Pazartesi', sali: 'Salı', carsamba: 'Çarşamba', persembe: 'Perşembe', cuma: 'Cuma' },
    status: {
      yeni: 'Yeni', inceleniyor: 'İnceleniyor', uygun: 'Uygun', yedek: 'Yedek',
      'kayit-tamamlandi': 'Kayıt tamamlandı', 'uygun-degil': 'Uygun değil'
    }
  };

  let applications = [];
  let teachers = [];
  let placements = [];
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
    const status = el('appsStatus').value;
    const planState = el('appsPlanState').value;
    const teacherId = el('appsTeacher').value;
    const from = el('appsFrom').value;
    const to = el('appsTo').value;

    return applications.filter((item) => {
      const placement = placementOf(item.id);
      const haystack = [item.studentName, item.guardianName, item.guardianPhone, item.reference, item.school]
        .join(' ').toLocaleLowerCase('tr-TR');
      const date = String(item.createdAt || '').slice(0, 10);
      return (!query || haystack.includes(query)) && (!type || item.applicationType === type) &&
        (!gender || item.gender === gender) && (!grade || item.grade === grade) &&
        (!level || item.quranLevel === level) && (!status || item.status === status) &&
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
  }

  function renderTeacherFilter() {
    const value = el('appsTeacher').value;
    el('appsTeacher').innerHTML = '<option value="">Tümü</option>' + teachers
      .slice().sort((a, b) => a.name.localeCompare(b.name, 'tr'))
      .map((teacher) => `<option value="${escapeHtml(teacher.id)}">${escapeHtml(teacher.name)}${teacher.active ? '' : ' · Pasif'}</option>`).join('');
    el('appsTeacher').value = value;
  }

  function compactProgram(placement) {
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
        <td>${compactProgram(placement)}</td>
        <td><span class="app-status app-status-${escapeHtml(item.status)}">${escapeHtml(labels.status[item.status] || item.status)}</span></td>
        <td><div class="app-row-actions"><button type="button" class="btn btn-gray app-open" data-open-id="${escapeHtml(item.id)}">İncele</button>${messageButton}</div></td>
      </tr>`;
    }).join('');
  }

  function renderTeacherGrid() {
    const query = el('appsTeacherSearch').value.trim().toLocaleLowerCase('tr-TR');
    const state = el('appsTeacherState').value;
    const filtered = teachers.filter((teacher) => {
      const haystack = `${teacher.name} ${teacher.phone}`.toLocaleLowerCase('tr-TR');
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
          <div class="teacher-tags">${teacher.modes.map((mode) => `<span>${escapeHtml(labels.type[mode])}</span>`).join('')}</div>
          <div class="teacher-days-strip">${meta.weekdays.map((day) => `<span class="${teacher.days.includes(day) ? 'is-on' : ''}" title="${labels.days[day]}">${labels.days[day].slice(0, 2)}</span>`).join('')}</div>
          <div class="teacher-card-foot"><span>${escapeHtml(labels.gender[teacher.gender])} · ${assigned} öğrenci</span><button type="button" class="teacher-edit" data-teacher-id="${escapeHtml(teacher.id)}">Düzenle</button></div>
        </article>`;
      }).join('');
  }

  async function load(force) {
    if (loaded && !force) { renderStats(); renderTeacherFilter(); renderTable(); renderTeacherGrid(); return; }
    el('appsTableBody').innerHTML = '<tr><td colspan="9"><div class="apps-loading"><span class="spin"></span>Şifreli kayıtlar açılıyor...</div></td></tr>';
    el('appsNotice').innerHTML = '';
    try {
      const result = await api('GET');
      applications = Array.isArray(result.data) ? result.data : [];
      teachers = Array.isArray(result.teachers) ? result.teachers : [];
      placements = Array.isArray(result.placements) ? result.placements : [];
      meta = result.meta?.weekdays && result.meta?.timeSlots ? result.meta : fallbackMeta;
      loaded = true;
      renderStats(); renderTeacherFilter(); renderTable(); renderTeacherGrid();
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
    return teachers.filter((teacher) => (teacher.active || teacher.id === currentId) &&
      teacher.modes.includes(item.applicationType) && teacher.days.includes(day));
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
    selectedId = id;
    const placement = placementOf(id);
    draftSchedule = Object.fromEntries(meta.weekdays.map((day) => {
      const entry = placement?.schedule?.find((row) => row.day === day);
      return [day, { teacherId: entry?.teacherId || '', slot: entry?.slot || '' }];
    }));
    el('appsModalTitle').textContent = item.studentName;
    el('appsModalReference').textContent = `${item.reference} · ${formatDate(item.createdAt, true)}`;
    el('appsModalDetails').innerHTML = `
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
        ${detail('Daha önce eğitim aldı', labels.previous[item.previousTraining])}${detail('Önceki program', item.previousTrainingDetail)}${detail('Veli notu', item.notes, true)}
      </dl></section>
      <section class="apps-detail-section"><h3>Onaylar</h3><dl class="apps-detail-grid">
        ${detail('Program kuralları', item.consents?.rulesAccepted ? 'Kabul edildi' : 'Eksik')}
        ${detail('KVKK bilgilendirmesi', item.consents?.privacyAcknowledged ? 'Okundu' : 'Eksik')}
        ${detail('Hizmet şartları', item.consents?.termsAccepted ? 'Kabul edildi' : 'Eksik')}
        ${detail('Görsel paylaşımı', labels.media[item.consents?.mediaConsent])}
      </dl></section>`;
    const availability = Array.isArray(item.availabilitySlots) && item.availabilitySlots.length ? item.availabilitySlots : meta.timeSlots;
    el('appsAvailability').innerHTML = availability.map((slot) => `<span>${escapeHtml(slot)}</span>`).join('');
    el('appsStartDate').value = placement?.startDate || '';
    el('appsAssignmentState').textContent = placement ? 'Plan kaydedildi' : 'Planlanmadı';
    el('appsAssignmentState').className = `assignment-state ${placement ? 'is-ready' : ''}`;
    el('appsRemoveAssignment').hidden = !placement;
    renderScheduleRows(item);
    el('appsReviewStatus').value = item.status || 'yeni';
    el('appsAdminNote').value = item.adminNote || '';
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
      renderStats(); renderTable(); renderTeacherGrid(); renderScheduleRows(item);
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
      renderStats(); renderTable(); renderTeacherGrid(); renderScheduleRows(item);
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
        'Müsait Saatler': (item.availabilitySlots || []).join(', '), 'Veli Adı Soyadı': item.guardianName,
        'Yakınlık': labels.relation[item.guardianRelation] || item.guardianRelation,
        'Veli Telefonu': formatPhone(item.guardianPhone), 'Öğrenci Telefonu': formatPhone(item.studentPhone),
        'İkinci Veli': item.secondGuardianName, 'İkinci Veli Telefonu': formatPhone(item.secondGuardianPhone),
        'Adres': item.address, 'Daha Önce Eğitim': labels.previous[item.previousTraining] || item.previousTraining,
        'Önceki Program': item.previousTrainingDetail, 'Veli Notu': item.notes,
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

  function resetFilters() {
    ['appsSearch', 'appsType', 'appsGender', 'appsGrade', 'appsLevel', 'appsStatus', 'appsPlanState', 'appsTeacher', 'appsFrom', 'appsTo']
      .forEach((id) => { el(id).value = ''; });
    renderTable();
  }

  function switchView(view) {
    const applicationsView = view === 'applications';
    el('appsApplicationsView').hidden = !applicationsView;
    el('appsTeachersView').hidden = applicationsView;
    el('appsApplicationsView').classList.toggle('is-active', applicationsView);
    el('appsTeachersView').classList.toggle('is-active', !applicationsView);
    el('appsTabApplications').classList.toggle('is-active', applicationsView);
    el('appsTabTeachers').classList.toggle('is-active', !applicationsView);
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
    document.querySelectorAll('[name="teacherGender"]').forEach((input) => { input.checked = input.value === teacher?.gender; });
    document.querySelectorAll('[name="teacherModes"]').forEach((input) => { input.checked = teacher?.modes?.includes(input.value) || false; });
    document.querySelectorAll('[name="teacherDays"]').forEach((input) => { input.checked = teacher?.days?.includes(input.value) || false; });
    el('teacherActive').checked = teacher ? teacher.active : true;
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
    if (!el('teacherName').value.trim() || !el('teacherPhone').value.trim() || !gender || !modes.length || !days.length) {
      el('teacherFormNotice').textContent = 'Ad, telefon, cinsiyet, en az bir eğitim türü ve çalışma günü seçin.';
      el('teacherFormNotice').className = 'teacher-form-notice is-error';
      return;
    }
    const button = el('teacherSave');
    button.disabled = true; button.textContent = 'Kaydediliyor...';
    try {
      const result = await api('POST', {
        action: 'teacher-save', teacher: {
          id: el('teacherId').value, name: el('teacherName').value, phone: el('teacherPhone').value,
          gender, modes, days, active: el('teacherActive').checked
        }
      });
      const index = teachers.findIndex((teacher) => teacher.id === result.data.id);
      if (index >= 0) teachers[index] = result.data; else teachers.push(result.data);
      renderStats(); renderTeacherFilter(); renderTeacherGrid(); renderTable();
      closeTeacherDialog(); toast(`${result.data.name} kaydedildi.`);
    } catch (error) {
      el('teacherFormNotice').textContent = error.message;
      el('teacherFormNotice').className = 'teacher-form-notice is-error';
    } finally { button.disabled = false; button.textContent = 'Öğretmeni kaydet'; }
  }

  window.showApplications = function () { showScreen('applicationsScreen'); load(false); };

  document.addEventListener('DOMContentLoaded', () => {
    const filterIds = ['appsSearch', 'appsType', 'appsGender', 'appsGrade', 'appsLevel', 'appsStatus', 'appsPlanState', 'appsTeacher', 'appsFrom', 'appsTo'];
    filterIds.forEach((id) => el(id).addEventListener(id === 'appsSearch' ? 'input' : 'change', renderTable));
    el('appsReset').addEventListener('click', resetFilters);
    el('appsRefresh').addEventListener('click', () => load(true));
    el('appsCsv').addEventListener('click', exportCsv);
    el('appsExcel').addEventListener('click', exportExcel);
    el('appsTabApplications').addEventListener('click', () => switchView('applications'));
    el('appsTabTeachers').addEventListener('click', () => switchView('teachers'));
    el('appsTeacherSearch').addEventListener('input', renderTeacherGrid);
    el('appsTeacherState').addEventListener('change', renderTeacherGrid);
    el('appsAddTeacher').addEventListener('click', () => openTeacherDialog(''));
    el('appsTeacherGrid').addEventListener('click', (event) => {
      const button = event.target.closest('[data-teacher-id]');
      if (button) openTeacherDialog(button.dataset.teacherId);
    });
    el('teacherForm').addEventListener('submit', saveTeacher);
    el('teacherClose').addEventListener('click', closeTeacherDialog);
    el('teacherCancel').addEventListener('click', closeTeacherDialog);
    el('appsClose').addEventListener('click', closeDetail);
    el('appsCancel').addEventListener('click', closeDetail);
    el('appsSaveReview').addEventListener('click', saveReview);
    el('appsSaveAssignment').addEventListener('click', saveAssignment);
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
  });
})();
