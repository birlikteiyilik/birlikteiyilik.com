(function () {
  'use strict';

  const API_URL = '/api/bia-applications';
  const labels = {
    type: { 'yuz-yuze': 'Yüz yüze', online: 'Online' },
    gender: { erkek: 'Erkek', kiz: 'Kız' },
    level: { 'hic-bilmiyor': 'Başlangıç', 'elif-ba': 'Elif Ba', okuyabiliyor: 'Okuyabiliyor', tecvid: 'Tecvid' },
    relation: { anne: 'Anne', baba: 'Baba', 'yasal-vasi': 'Yasal vasi', diger: 'Diğer' },
    previous: { evet: 'Evet', hayir: 'Hayır' },
    media: { 'izin-veriyorum': 'İzin veriyor', 'izin-vermiyorum': 'İzin vermiyor' },
    status: {
      yeni: 'Yeni', inceleniyor: 'İnceleniyor', uygun: 'Uygun', yedek: 'Yedek',
      'kayit-tamamlandi': 'Kayıt tamamlandı', 'uygun-degil': 'Uygun değil'
    }
  };

  let applications = [];
  let loaded = false;
  let selectedId = '';

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

  async function api(method, body) {
    const response = await fetch(API_URL, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 401) {
      logout();
      throw new Error('Oturum süresi doldu.');
    }
    if (!response.ok) throw new Error(result.error || 'Başvurular yüklenemedi.');
    return result;
  }

  function filterData() {
    const query = el('appsSearch').value.trim().toLocaleLowerCase('tr-TR');
    const type = el('appsType').value;
    const gender = el('appsGender').value;
    const grade = el('appsGrade').value;
    const level = el('appsLevel').value;
    const status = el('appsStatus').value;
    const from = el('appsFrom').value;
    const to = el('appsTo').value;

    return applications.filter((item) => {
      const haystack = [item.studentName, item.guardianName, item.guardianPhone, item.reference, item.school]
        .join(' ').toLocaleLowerCase('tr-TR');
      const date = String(item.createdAt || '').slice(0, 10);
      return (!query || haystack.includes(query)) &&
        (!type || item.applicationType === type) &&
        (!gender || item.gender === gender) &&
        (!grade || item.grade === grade) &&
        (!level || item.quranLevel === level) &&
        (!status || item.status === status) &&
        (!from || date >= from) && (!to || date <= to);
    });
  }

  function renderStats() {
    el('appsTotal').textContent = applications.length;
    el('appsNew').textContent = applications.filter((item) => item.status === 'yeni').length;
    el('appsFace').textContent = applications.filter((item) => item.applicationType === 'yuz-yuze').length;
    el('appsRegistered').textContent = applications.filter((item) => item.status === 'kayit-tamamlandi').length;
  }

  function renderTable() {
    const filtered = filterData();
    el('appsResultCount').textContent = `${filtered.length} başvuru gösteriliyor`;
    const body = el('appsTableBody');
    if (!filtered.length) {
      body.innerHTML = '<tr><td colspan="8" class="apps-empty">Filtrelerle eşleşen başvuru bulunamadı.</td></tr>';
      return;
    }
    body.innerHTML = filtered.map((item) => `
      <tr data-id="${escapeHtml(item.id)}" tabindex="0" aria-label="${escapeHtml(item.studentName)} başvurusunu aç">
        <td>${escapeHtml(formatDate(item.createdAt, false))}</td>
        <td><span class="app-student">${escapeHtml(item.studentName)}</span><span class="app-ref">${escapeHtml(item.reference)}</span></td>
        <td>${escapeHtml(labels.type[item.applicationType] || item.applicationType)}</td>
        <td>${escapeHtml(labels.gender[item.gender] || item.gender)}</td>
        <td>${escapeHtml(item.grade)}. sınıf</td>
        <td>${escapeHtml(labels.level[item.quranLevel] || item.quranLevel)}</td>
        <td><span class="app-status app-status-${escapeHtml(item.status)}">${escapeHtml(labels.status[item.status] || item.status)}</span></td>
        <td><button type="button" class="btn btn-gray app-open" data-id="${escapeHtml(item.id)}" style="padding:6px 10px;font-size:.72rem;">İncele</button></td>
      </tr>`).join('');
  }

  async function load(force) {
    if (loaded && !force) {
      renderStats();
      renderTable();
      return;
    }
    el('appsTableBody').innerHTML = '<tr><td colspan="8"><div class="apps-loading"><span class="spin" style="border-color:#ddd;border-top-color:#d7193f"></span>Başvurular açılıyor...</div></td></tr>';
    el('appsNotice').innerHTML = '';
    try {
      const result = await api('GET');
      applications = Array.isArray(result.data) ? result.data : [];
      loaded = true;
      renderStats();
      renderTable();
    } catch (error) {
      el('appsTableBody').innerHTML = `<tr><td colspan="8" class="apps-empty">${escapeHtml(error.message)}</td></tr>`;
      el('appsNotice').innerHTML = `<div class="notice err">${escapeHtml(error.message)}</div>`;
    }
  }

  function detail(label, value, wide) {
    return `<div class="apps-detail${wide ? ' is-wide' : ''}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || 'Belirtilmedi')}</dd></div>`;
  }

  function openDetail(id) {
    const item = applications.find((record) => record.id === id);
    if (!item) return;
    selectedId = id;
    el('appsModalTitle').textContent = item.studentName;
    el('appsModalReference').textContent = `${item.reference} · ${formatDate(item.createdAt, true)}`;
    el('appsModalDetails').innerHTML = `
      <section class="apps-detail-section"><h3>Öğrenci bilgileri</h3><dl class="apps-detail-grid">
        ${detail('T.C. kimlik numarası', item.tckn)}
        ${detail('Doğum tarihi', formatDate(`${item.birthDate}T00:00:00`, false))}
        ${detail('Cinsiyet', labels.gender[item.gender])}
        ${detail('Sınıf', `${item.grade}. sınıf`)}
        ${detail('Okul', item.school, true)}
      </dl></section>
      <section class="apps-detail-section"><h3>Veli ve iletişim</h3><dl class="apps-detail-grid">
        ${detail('Veli', item.guardianName)}
        ${detail('Yakınlık', labels.relation[item.guardianRelation])}
        ${detail('Veli telefonu', formatPhone(item.guardianPhone))}
        ${detail('Öğrenci telefonu', formatPhone(item.studentPhone))}
        ${detail('İkinci veli', item.secondGuardianName)}
        ${detail('İkinci veli telefonu', formatPhone(item.secondGuardianPhone))}
        ${detail('Adres', item.address, true)}
      </dl></section>
      <section class="apps-detail-section"><h3>Eğitim bilgileri</h3><dl class="apps-detail-grid">
        ${detail('Başvuru türü', labels.type[item.applicationType])}
        ${detail('Kur’an seviyesi', labels.level[item.quranLevel])}
        ${detail('Daha önce eğitim aldı', labels.previous[item.previousTraining])}
        ${detail('Önceki program', item.previousTrainingDetail)}
        ${detail('Veli notu', item.notes, true)}
      </dl></section>
      <section class="apps-detail-section"><h3>Onaylar</h3><dl class="apps-detail-grid">
        ${detail('Program kuralları', item.consents?.rulesAccepted ? 'Kabul edildi' : 'Eksik')}
        ${detail('KVKK bilgilendirmesi', item.consents?.privacyAcknowledged ? 'Okundu' : 'Eksik')}
        ${detail('Hizmet şartları', item.consents?.termsAccepted ? 'Kabul edildi' : 'Eksik')}
        ${detail('Görsel paylaşımı', labels.media[item.consents?.mediaConsent])}
      </dl></section>`;
    el('appsReviewStatus').value = item.status || 'yeni';
    el('appsAdminNote').value = item.adminNote || '';
    el('appsModalNotice').textContent = '';
    const dialog = el('appsDialog');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeDetail() {
    const dialog = el('appsDialog');
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    selectedId = '';
  }

  async function saveReview() {
    const item = applications.find((record) => record.id === selectedId);
    if (!item) return;
    const button = el('appsSaveReview');
    button.disabled = true;
    button.textContent = 'Kaydediliyor...';
    el('appsModalNotice').textContent = '';
    try {
      const result = await api('POST', {
        action: 'update', id: item.id, createdAt: item.createdAt,
        status: el('appsReviewStatus').value,
        adminNote: el('appsAdminNote').value
      });
      Object.assign(item, result.data);
      renderStats();
      renderTable();
      el('appsModalNotice').textContent = 'Değişiklikler kaydedildi.';
      el('appsModalNotice').style.color = '#19703b';
    } catch (error) {
      el('appsModalNotice').textContent = error.message;
      el('appsModalNotice').style.color = '#c31737';
    } finally {
      button.disabled = false;
      button.textContent = 'Değişiklikleri kaydet';
    }
  }

  function exportRows() {
    return filterData().map((item) => ({
      'Başvuru No': item.reference,
      'Başvuru Tarihi': formatDate(item.createdAt, true),
      'Başvuru Türü': labels.type[item.applicationType] || item.applicationType,
      'Durum': labels.status[item.status] || item.status,
      'Öğrenci Adı Soyadı': item.studentName,
      'T.C. Kimlik No': String(item.tckn || ''),
      'Doğum Tarihi': item.birthDate,
      'Cinsiyet': labels.gender[item.gender] || item.gender,
      'Okul': item.school,
      'Sınıf': item.grade,
      'Kur’an Seviyesi': labels.level[item.quranLevel] || item.quranLevel,
      'Veli Adı Soyadı': item.guardianName,
      'Yakınlık': labels.relation[item.guardianRelation] || item.guardianRelation,
      'Veli Telefonu': formatPhone(item.guardianPhone),
      'Öğrenci Telefonu': formatPhone(item.studentPhone),
      'İkinci Veli': item.secondGuardianName,
      'İkinci Veli Telefonu': formatPhone(item.secondGuardianPhone),
      'Adres': item.address,
      'Daha Önce Eğitim': labels.previous[item.previousTraining] || item.previousTraining,
      'Önceki Program': item.previousTrainingDetail,
      'Veli Notu': item.notes,
      'Görsel Paylaşım İzni': labels.media[item.consents?.mediaConsent] || item.consents?.mediaConsent,
      'Yönetici Notu': item.adminNote
    }));
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const rows = exportRows();
    if (!rows.length) return alert('Dışa aktarılacak başvuru bulunamadı.');
    const headers = Object.keys(rows[0]);
    const safe = (value) => {
      let text = String(value == null ? '' : value);
      if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const csv = [headers.map(safe).join(';'), ...rows.map((row) => headers.map((key) => safe(row[key])).join(';'))].join('\r\n');
    download(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }), `bia-basvurular-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function exportExcel() {
    const rows = exportRows();
    if (!rows.length) return alert('Dışa aktarılacak başvuru bulunamadı.');
    if (!window.XLSX) return alert('Excel bileşeni yüklenemedi. CSV olarak indirebilirsiniz.');
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet['!cols'] = Object.keys(rows[0]).map((key) => ({ wch: Math.min(42, Math.max(13, key.length + 2)) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Başvurular');
    XLSX.writeFile(workbook, `bia-basvurular-${new Date().toISOString().slice(0, 10)}.xlsx`, { compression: true });
  }

  function resetFilters() {
    ['appsSearch', 'appsType', 'appsGender', 'appsGrade', 'appsLevel', 'appsStatus', 'appsFrom', 'appsTo']
      .forEach((id) => { el(id).value = ''; });
    renderTable();
  }

  window.showApplications = function () {
    showScreen('applicationsScreen');
    load(false);
  };

  document.addEventListener('DOMContentLoaded', () => {
    ['appsSearch', 'appsType', 'appsGender', 'appsGrade', 'appsLevel', 'appsStatus', 'appsFrom', 'appsTo']
      .forEach((id) => el(id).addEventListener(id === 'appsSearch' ? 'input' : 'change', renderTable));
    el('appsReset').addEventListener('click', resetFilters);
    el('appsRefresh').addEventListener('click', () => load(true));
    el('appsCsv').addEventListener('click', exportCsv);
    el('appsExcel').addEventListener('click', exportExcel);
    el('appsClose').addEventListener('click', closeDetail);
    el('appsCancel').addEventListener('click', closeDetail);
    el('appsSaveReview').addEventListener('click', saveReview);
    el('appsTableBody').addEventListener('click', (event) => {
      const target = event.target.closest('[data-id]');
      if (target) openDetail(target.dataset.id);
    });
    el('appsTableBody').addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('tr[data-id]')) {
        event.preventDefault();
        openDetail(event.target.dataset.id);
      }
    });
    el('appsDialog').addEventListener('click', (event) => {
      if (event.target === el('appsDialog')) closeDetail();
    });
  });
})();
