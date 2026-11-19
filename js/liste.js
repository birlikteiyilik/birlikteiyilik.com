(() => {
  'use strict';
  const API = '/api/bia-applications';
  const STORAGE_KEY = 'biaDirectorySession';
  const DAYS = { pazartesi: 'Pazartesi', sali: 'Salı', carsamba: 'Çarşamba', persembe: 'Perşembe', cuma: 'Cuma' };
  const $ = (id) => document.getElementById(id);
  const ui = {
    loginView: $('loginView'), directory: $('directoryView'), loginForm: $('loginForm'),
    password: $('password'), loginButton: $('loginButton'), loginFeedback: $('loginFeedback'),
    showPassword: $('showPassword'), remember: $('rememberSession'), logout: $('logoutButton'),
    studentMode: $('studentMode'), teacherMode: $('teacherMode'), searchLabel: $('searchLabel'),
    input: $('searchInput'), clear: $('clearSearch'), hint: $('searchHint'),
    results: $('results'), count: $('resultCount'), eyebrow: $('resultsEyebrow'), title: $('resultsTitle'),
    report: $('calendarReport'), reportFeedback: $('calendarReportFeedback')
  };
  let excelLoading = null;
  let token = '';
  let mode = 'student';
  let timer = 0;
  let pendingSkeleton = 0;
  let sequence = 0;
  let controller = null;

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  }
  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.append(use);
    return svg;
  }
  function setLoginError(message) {
    ui.loginFeedback.textContent = message || '';
    ui.password.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
  function showLogin() {
    token = '';
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    clearTimeout(timer);
    clearTimeout(pendingSkeleton);
    if (controller) controller.abort();
    sequence += 1;
    ui.directory.hidden = true;
    ui.loginView.hidden = false;
    ui.password.value = '';
    ui.password.focus();
  }
  function showDirectory() {
    ui.loginView.hidden = true;
    ui.directory.hidden = false;
    ui.input.focus();
    renderEmpty('Bir ad yazarak başlayın', 'Öğrenci ya da öğretmen adından en az iki harf yazın.');
  }
  async function api(body, authorization) {
    const response = await fetch(API, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: `Bearer ${authorization}` } : {}) },
      body: JSON.stringify(body), signal: body.action === 'directory-search' ? controller?.signal : undefined
    });
    let data = {};
    try { data = await response.json(); } catch (_) { /* Network errors are shown below. */ }
    if (!response.ok) {
      const error = new Error(data.error || 'İşlem tamamlanamadı. Yeniden deneyin.');
      error.status = response.status;
      throw error;
    }
    return data;
  }
  async function login(event) {
    event.preventDefault();
    const password = ui.password.value;
    if (!password.trim()) { setLoginError('Şifrenizi yazıp yeniden deneyin.'); ui.password.focus(); return; }
    setLoginError('');
    ui.loginButton.disabled = true;
    ui.loginButton.dataset.loading = 'true';
    ui.loginButton.querySelector('span').textContent = 'Giriş yapılıyor…';
    try {
      const remember = ui.remember.checked;
      const data = await api({ action: 'directory-login', password, remember });
      token = data.token;
      const storage = remember ? localStorage : sessionStorage;
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
      storage.setItem(STORAGE_KEY, JSON.stringify({ token, expiresAt: data.expiresAt }));
      showDirectory();
    } catch (error) {
      setLoginError(error.message);
      ui.password.focus();
    } finally {
      ui.loginButton.disabled = false;
      ui.loginButton.dataset.loading = 'false';
      ui.loginButton.querySelector('span').textContent = 'Rehberi aç';
    }
  }
  function setMode(next) {
    if (mode === next) return;
    mode = next;
    for (const [name, button] of [['student', ui.studentMode], ['teacher', ui.teacherMode]]) {
      button.classList.toggle('is-active', name === mode);
      button.setAttribute('aria-pressed', String(name === mode));
    }
    ui.searchLabel.textContent = mode === 'student' ? 'Öğrenci adı' : 'Öğretmen adı';
    ui.title.textContent = mode === 'student' ? 'Öğrenciler' : 'Öğretmenler';
    ui.eyebrow.textContent = mode === 'student' ? 'Öğrenci araması' : 'Öğretmen araması';
    ui.input.value = '';
    ui.clear.hidden = true;
    ui.hint.textContent = 'En az iki harf yazın.';
    ui.hint.classList.remove('is-error');
    clearTimeout(timer);
    clearTimeout(pendingSkeleton);
    if (controller) controller.abort();
    sequence += 1;
    ui.count.textContent = '';
    renderEmpty('Bir ad yazarak başlayın', `${mode === 'student' ? 'Öğrenci' : 'Öğretmen'} adından en az iki harf yazın.`);
    ui.input.focus({ preventScroll: true });
  }
  function renderEmpty(title, description, error = false) {
    const wrap = node('div', 'empty-state');
    const mark = node('div', 'empty-state__mark');
    mark.append(icon(error ? 'close' : 'search'));
    wrap.append(mark, node('h3', '', title), node('p', '', description));
    ui.results.replaceChildren(wrap);
  }
  function showSkeleton() {
    const wrap = node('div', 'loading-skeleton');
    wrap.setAttribute('aria-label', 'Kayıtlar aranıyor');
    wrap.append(node('span'), node('span'), node('span'));
    ui.results.replaceChildren(wrap);
    ui.count.textContent = 'Aranıyor…';
  }
  function phoneParts(value) {
    const digits = String(value || '').replace(/\D/g, '');
    let local = digits;
    if (local.startsWith('90') && local.length === 12) local = `0${local.slice(2)}`;
    if (local.length === 10 && local.startsWith('5')) local = `0${local}`;
    const label = local.length === 11 ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7, 9)} ${local.slice(9)}` : (value || '—');
    return { label, href: digits ? `tel:+${local.startsWith('0') ? `90${local.slice(1)}` : digits}` : '' };
  }
  function phoneLine(value, person) {
    const wrap = node('span', 'phone-line');
    const phone = phoneParts(value);
    if (!phone.href) { wrap.append(node('span', '', '—')); return wrap; }
    const link = node('a', '', phone.label);
    link.href = phone.href;
    link.setAttribute('aria-label', `${person} telefonunu ara: ${phone.label}`);
    const copy = node('button', 'copy-button');
    copy.type = 'button';
    copy.title = 'Numarayı kopyala';
    copy.setAttribute('aria-label', `${person} numarasını kopyala`);
    copy.append(icon('copy'));
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(phone.label);
        copy.replaceChildren(icon('check'));
        copy.setAttribute('aria-label', 'Numara kopyalandı');
        copy.title = 'Kopyalandı';
        setTimeout(() => { copy.replaceChildren(icon('copy')); copy.setAttribute('aria-label', `${person} numarasını kopyala`); copy.title = 'Numarayı kopyala'; }, 2500);
      } catch (_) {
        ui.hint.textContent = 'Numara kopyalanamadı. Numarayı seçip kopyalayın.';
        ui.hint.classList.add('is-error');
      }
    });
    wrap.append(link, copy);
    return wrap;
  }
  function detail(label, content) {
    const wrap = node('div');
    wrap.append(node('span', 'detail-label', label));
    if (typeof content === 'string') wrap.append(node('span', 'detail-value', content || '—'));
    else { content.classList.add('detail-value'); wrap.append(content); }
    return wrap;
  }
  function lessonTimes(schedule) {
    const wrap = node('div', 'lesson-times');
    wrap.append(node('span', 'lesson-times__label', 'Ders saatleri'));
    const entries = node('div', 'lesson-times__entries');
    for (const lesson of schedule || []) {
      const slot = node('span', 'lesson-time');
      slot.append(node('strong', '', DAYS[lesson.day] || lesson.day), document.createTextNode((lesson.slot || '').replace('-', '–')));
      entries.append(slot);
    }
    if (!entries.childElementCount) entries.append(node('span', 'lesson-times__empty', 'Henüz saat atanmadı'));
    wrap.append(entries);
    return wrap;
  }
  function deliveryDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function calendarDelivery(item) {
    const state = item.calendarDelivery || { year: '2027', delivered: false, deliveredAt: '' };
    const year = state.year || '2027';
    const wrap = node('div', 'delivery-check');
    const label = node('label', 'delivery-check__option');
    const input = node('input');
    input.type = 'checkbox';
    input.checked = Boolean(state.delivered);
    const box = node('span', 'delivery-check__box');
    box.setAttribute('aria-hidden', 'true');
    box.append(icon('check'));
    const text = node('span', 'delivery-check__text', `${year} yılı takvimi Veliye teslim edildi`);
    label.append(input, box, text);
    const status = node('span', 'delivery-check__status');
    status.setAttribute('aria-live', 'polite');
    const paint = (delivered, deliveredAt, message = '', error = false) => {
      wrap.classList.toggle('is-done', delivered);
      status.classList.toggle('is-error', error);
      status.textContent = message || (delivered && deliveryDate(deliveredAt) ? `${deliveryDate(deliveredAt)} tarihinde işaretlendi` : '');
    };
    paint(input.checked, state.deliveredAt);
    input.addEventListener('change', async () => {
      const delivered = input.checked;
      input.disabled = true;
      wrap.dataset.saving = 'true';
      paint(delivered, '', 'Kaydediliyor…');
      try {
        const data = await api({ action: 'directory-calendar-delivery', applicationId: item.id, delivered }, token);
        item.calendarDelivery = { year: data.year || year, delivered: data.delivered, deliveredAt: data.deliveredAt };
        input.checked = data.delivered;
        paint(data.delivered, data.deliveredAt, data.delivered ? '' : 'Teslim işareti kaldırıldı');
      } catch (error) {
        if (error.status === 401) { showLogin(); setLoginError('Oturum süresi doldu. Yeniden giriş yapın.'); return; }
        input.checked = !delivered;
        paint(!delivered, item.calendarDelivery?.deliveredAt || '', error.message || 'Kaydedilemedi. Yeniden deneyin.', true);
      } finally {
        input.disabled = false;
        wrap.dataset.saving = 'false';
      }
    });
    wrap.append(label, status);
    return wrap;
  }
  function studentCard(item, showTeachers = true, selectedTeacherId = '') {
    const article = node('article', 'result-card');
    const top = node('div', 'result-card__top');
    top.append(node('h3', '', item.studentName), node('span', 'grade-badge', item.grade ? `${item.grade}. sınıf` : 'Sınıf yok'));
    const grid = node('div', 'detail-grid');
    grid.append(detail('Okul', item.school), detail('Veli telefonu', phoneLine(item.guardianPhone, 'Veli')));
    article.append(top, grid, calendarDelivery(item));
    if (selectedTeacherId) {
      const teacher = item.teachers.find((entry) => entry.id === selectedTeacherId);
      article.append(lessonTimes(teacher?.schedule));
    }
    if (showTeachers) {
      const list = node('div', 'teacher-list');
      list.append(node('div', 'teacher-list__heading', item.teachers.length > 1 ? 'Atanan öğretmenler' : 'Atanan öğretmen'));
      for (const teacher of item.teachers) {
        const row = node('div', 'teacher-row');
        const label = node('div');
        label.append(node('strong', '', teacher.name));
        label.append(lessonTimes(teacher.schedule));
        row.append(label, phoneLine(teacher.phone, 'Öğretmen'));
        list.append(row);
      }
      article.append(list);
    }
    return article;
  }
  function renderResults(data) {
    ui.results.replaceChildren();
    const count = data.items?.length || 0;
    ui.count.textContent = count ? `${count} öğrenci` : '0 sonuç';
    if (!count) {
      renderEmpty('Eşleşen kayıt bulunamadı', 'Adın farklı bir bölümünü deneyin. Yalnızca kaydı tamamlanan öğrenciler görünür.');
      return;
    }
    if (mode === 'teacher') {
      ui.count.textContent = `${data.groups.length} öğretmen · ${count} öğrenci`;
      for (const group of data.groups || []) {
        const section = node('section', 'teacher-group');
        const head = node('div', 'teacher-group__heading');
        const name = node('div');
        name.append(node('span', 'detail-label', 'Öğretmen'), node('h3', '', group.teacher.name));
        head.append(name, detail('Telefon', phoneLine(group.teacher.phone, 'Öğretmen')));
        section.append(head);
        for (const student of group.students) section.append(studentCard(student, false, group.teacher.id));
        ui.results.append(section);
      }
    } else {
      for (const item of data.items) ui.results.append(studentCard(item));
    }
    if (data.hasMore) ui.results.append(node('p', 'notice-line', 'Daha fazla kayıt var. Daha uzun bir ad yazarak aramayı daraltın.'));
  }
  async function search() {
    const query = ui.input.value.trim();
    ui.clear.hidden = !query;
    if (query.length < 2) {
      if (controller) controller.abort();
      sequence += 1;
      ui.count.textContent = '';
      renderEmpty('Bir ad yazarak başlayın', `${mode === 'student' ? 'Öğrenci' : 'Öğretmen'} adından en az iki harf yazın.`);
      return;
    }
    const requestId = ++sequence;
    if (controller) controller.abort();
    controller = new AbortController();
    const skeletonTimer = setTimeout(() => { if (requestId === sequence) showSkeleton(); }, 160);
    pendingSkeleton = skeletonTimer;
    try {
      const data = await api({ action: 'directory-search', query, mode }, token);
      if (requestId !== sequence) return;
      ui.hint.textContent = 'Ad veya soyadın bir bölümünü yazabilirsiniz.';
      ui.hint.classList.remove('is-error');
      renderResults(data);
    } catch (error) {
      if (requestId !== sequence || error.name === 'AbortError') return;
      if (error.status === 401) { showLogin(); setLoginError('Oturum süresi doldu. Yeniden giriş yapın.'); return; }
      ui.count.textContent = '';
      renderEmpty('Arama tamamlanamadı', error.message, true);
    } finally { clearTimeout(skeletonTimer); }
  }
  function scheduleSearch() {
    clearTimeout(timer);
    clearTimeout(pendingSkeleton);
    if (controller) controller.abort();
    sequence += 1;
    const query = ui.input.value.trim();
    ui.clear.hidden = !query;
    if (query.length < 2) { search(); return; }
    ui.hint.textContent = 'Arama hazırlanıyor…';
    timer = setTimeout(search, 280);
  }

  function loadExcel() {
    if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
    excelLoading = excelLoading || new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/js/vendor/exceljs-4.4.0.min.js';
      script.onload = () => window.ExcelJS ? resolve(window.ExcelJS) : reject(new Error('Excel bileşeni yüklenemedi.'));
      script.onerror = () => { script.remove(); reject(new Error('Excel bileşeni yüklenemedi. Yeniden deneyin.')); };
      document.head.append(script);
    }).catch((error) => { excelLoading = null; throw error; });
    return excelLoading;
  }
  function localDate(value, withTime = false) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('tr-TR', withTime
      ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  function calendarWorkbook(ExcelJS, report) {
    const year = report.year || '2027';
    const rows = [...(report.items || [])].sort((a, b) => Number(b.delivered) - Number(a.delivered) ||
      String(a.studentName).localeCompare(String(b.studentName), 'tr'));
    const deliveredCount = rows.filter((row) => row.delivered).length;
    const colors = { ink: 'FF17385C', white: 'FFFFFFFF', border: 'FFD5DFE8', muted: 'FF526579', done: 'FFC9E8D5', doneText: 'FF134C32', wait: 'FFF4E3D3', waitText: 'FF7A3E12', stripe: 'FFF7F9FB' };
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Birlikte İyilik Akademi';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet(`${year} Takvim Teslim`, { views: [{ state: 'frozen', ySplit: 4, showGridLines: false }] });
    const headers = ['Sıra', 'Öğrenci', 'Sınıf', 'Okul', 'Veli telefonu', 'Öğretmen', 'Takvim durumu', 'Teslim tarihi'];
    sheet.columns = [7, 28, 9, 30, 17, 30, 18, 15].map((width) => ({ width }));
    const paint = (cell, { fill = colors.white, color = colors.ink, bold = false, size = 11, center = false } = {}) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
      cell.font = { name: 'Calibri', size, bold, color: { argb: color } };
      cell.alignment = { vertical: 'middle', horizontal: center ? 'center' : 'left', wrapText: true, indent: center ? 0 : 1 };
      cell.border = { bottom: { style: 'thin', color: { argb: colors.border } }, right: { style: 'thin', color: { argb: colors.border } } };
    };
    sheet.mergeCells(1, 1, 1, headers.length);
    sheet.getCell(1, 1).value = `${year} YILI TAKVİM TESLİM LİSTESİ`;
    paint(sheet.getCell(1, 1), { fill: colors.ink, color: colors.white, bold: true, size: 17 });
    sheet.getRow(1).height = 40;
    sheet.mergeCells(2, 1, 2, headers.length);
    sheet.getCell(2, 1).value = `Birlikte İyilik Akademi · Yüz yüze kayıtlı öğrenciler · ${localDate(report.generatedAt || Date.now(), true)}\n` +
      `Toplam ${rows.length} öğrenci · ${deliveredCount} teslim edildi · ${rows.length - deliveredCount} teslim edilmedi`;
    paint(sheet.getCell(2, 1), { color: colors.muted, size: 10 });
    sheet.getRow(2).height = 36;
    sheet.getRow(3).height = 8;
    sheet.getRow(4).values = headers;
    headers.forEach((header, index) => paint(sheet.getCell(4, index + 1), { fill: colors.ink, color: colors.white, bold: true, center: true }));
    sheet.getRow(4).height = 28;
    rows.forEach((row, index) => {
      const excelRow = sheet.getRow(index + 5);
      excelRow.values = [index + 1, row.studentName, row.grade ? `${row.grade}. sınıf` : '', row.school || '',
        phoneParts(row.guardianPhone).label, (row.teachers || []).join(', '),
        row.delivered ? 'Teslim edildi' : 'Teslim edilmedi', row.delivered ? localDate(row.deliveredAt) : ''];
      const fill = index % 2 ? colors.stripe : colors.white;
      excelRow.eachCell({ includeEmpty: true }, (cell, col) => {
        if (col === 7) paint(cell, { fill: row.delivered ? colors.done : colors.wait, color: row.delivered ? colors.doneText : colors.waitText, bold: true, center: true });
        else paint(cell, { fill, center: col === 1 || col === 3 || col === 8 });
      });
      excelRow.height = 24;
    });
    sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: Math.max(4, rows.length + 4), column: headers.length } };
    sheet.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '4:4',
      margins: { left: 0.25, right: 0.25, top: 0.35, bottom: 0.35, header: 0.15, footer: 0.15 } };
    sheet.headerFooter = { oddFooter: '&LBirlikte İyilik Akademi&R&P / &N' };
    return { workbook, total: rows.length, delivered: deliveredCount };
  }
  async function downloadCalendarReport() {
    if (ui.report.disabled) return;
    const label = ui.report.querySelector('span');
    ui.report.disabled = true;
    ui.report.dataset.loading = 'true';
    label.textContent = 'Liste hazırlanıyor…';
    ui.reportFeedback.classList.remove('is-error');
    ui.reportFeedback.textContent = '';
    try {
      const [report, ExcelJS] = await Promise.all([api({ action: 'directory-calendar-report' }, token), loadExcel()]);
      const result = calendarWorkbook(ExcelJS, report);
      const buffer = await result.workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.year || '2027'}-takvim-teslim-listesi-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      ui.reportFeedback.textContent = `İndirildi: ${result.total} öğrenci, ${result.delivered} teslim.`;
    } catch (error) {
      if (error.status === 401) { showLogin(); setLoginError('Oturum süresi doldu. Yeniden giriş yapın.'); return; }
      ui.reportFeedback.classList.add('is-error');
      ui.reportFeedback.textContent = error.message || 'Liste hazırlanamadı. Yeniden deneyin.';
    } finally {
      ui.report.disabled = false;
      ui.report.dataset.loading = 'false';
      label.textContent = 'Takvim listesini indir';
    }
  }

  ui.report.addEventListener('click', downloadCalendarReport);
  ui.loginForm.addEventListener('submit', login);
  ui.password.addEventListener('input', () => { if (ui.password.getAttribute('aria-invalid') === 'true') setLoginError(''); });
  ui.showPassword.addEventListener('click', () => {
    const show = ui.password.type === 'password';
    ui.password.type = show ? 'text' : 'password';
    ui.showPassword.setAttribute('aria-label', show ? 'Şifreyi gizle' : 'Şifreyi göster');
    ui.showPassword.setAttribute('aria-pressed', String(show));
    ui.password.focus({ preventScroll: true });
  });
  ui.logout.addEventListener('click', showLogin);
  ui.studentMode.addEventListener('click', () => setMode('student'));
  ui.teacherMode.addEventListener('click', () => setMode('teacher'));
  ui.input.addEventListener('input', scheduleSearch);
  ui.input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { ui.input.value = ''; scheduleSearch(); }
  });
  ui.clear.addEventListener('click', () => { ui.input.value = ''; scheduleSearch(); ui.input.focus(); });

  try {
    for (const storage of [localStorage, sessionStorage]) {
      const saved = JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
      if (saved?.token && saved.expiresAt > Date.now()) {
        token = saved.token;
        if (storage === localStorage) sessionStorage.removeItem(STORAGE_KEY);
        showDirectory();
        break;
      }
      storage.removeItem(STORAGE_KEY);
    }
  } catch (_) {
    sessionStorage.removeItem(STORAGE_KEY);
  }
})();
