(() => {
  'use strict';
  const API = '/api/bia-applications';
  const STORAGE_KEY = 'biaDirectorySession';
  const DAYS = { pazartesi: 'Pazartesi', sali: 'Salı', carsamba: 'Çarşamba', persembe: 'Perşembe', cuma: 'Cuma' };
  const $ = (id) => document.getElementById(id);
  const ui = {
    loginView: $('loginView'), directory: $('directoryView'), loginForm: $('loginForm'),
    password: $('password'), loginButton: $('loginButton'), loginFeedback: $('loginFeedback'),
    showPassword: $('showPassword'), logout: $('logoutButton'),
    studentMode: $('studentMode'), teacherMode: $('teacherMode'), searchLabel: $('searchLabel'),
    input: $('searchInput'), clear: $('clearSearch'), hint: $('searchHint'),
    results: $('results'), count: $('resultCount'), eyebrow: $('resultsEyebrow'), title: $('resultsTitle')
  };
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
      const data = await api({ action: 'directory-login', password });
      token = data.token;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, expiresAt: data.expiresAt }));
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
  function studentCard(item, showTeachers = true) {
    const article = node('article', 'result-card');
    const top = node('div', 'result-card__top');
    top.append(node('h3', '', item.studentName), node('span', 'grade-badge', item.grade ? `${item.grade}. sınıf` : 'Sınıf yok'));
    const grid = node('div', 'detail-grid');
    grid.append(detail('Okul', item.school), detail('Veli telefonu', phoneLine(item.guardianPhone, 'Veli')));
    article.append(top, grid);
    if (showTeachers) {
      const list = node('div', 'teacher-list');
      list.append(node('div', 'teacher-list__heading', item.teachers.length > 1 ? 'Atanan öğretmenler' : 'Atanan öğretmen'));
      for (const teacher of item.teachers) {
        const row = node('div', 'teacher-row');
        const label = node('div');
        label.append(node('strong', '', teacher.name));
        if (teacher.days?.length) label.append(node('small', '', teacher.days.map((day) => DAYS[day] || day).join(' · ')));
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
        for (const student of group.students) section.append(studentCard(student, false));
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
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (saved?.token && saved.expiresAt > Date.now()) { token = saved.token; showDirectory(); }
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch (_) { sessionStorage.removeItem(STORAGE_KEY); }
})();
