(function () {
  'use strict';

  const API_URL = '/api/bia-applications';
  const TOKEN_KEY = 'bia_teacher_session';
  const THEME_KEY = 'bia_attendance_theme';
  const labels = {
    days: { pazartesi: 'Pazartesi', sali: 'Salı', carsamba: 'Çarşamba', persembe: 'Perşembe', cuma: 'Cuma' },
    shortDays: { pazartesi: 'Pzt', sali: 'Sal', carsamba: 'Çar', persembe: 'Per', cuma: 'Cum' },
    type: { 'yuz-yuze': 'Yüz yüze', online: 'Online' },
    status: { katildi: 'Katıldı', gelmedi: 'Gelmedi', mazeretli: 'Mazeretli' }
  };
  const icon = { katildi: 'icon-check', gelmedi: 'icon-close', mazeretli: 'icon-minus' };

  let token = sessionStorage.getItem(TOKEN_KEY) || '';
  let teacher = null;
  let selectedDate = initialDate();
  let week = [];
  let lessons = [];
  let dirty = new Map();
  let toastTimer = 0;

  function el(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[char]);
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
  function mondayFor(value) {
    const date = new Date(`${value}T12:00:00`);
    const day = date.getDay() || 7;
    date.setDate(date.getDate() - day + 1);
    return dateValue(date);
  }
  function initialDate() {
    const now = new Date();
    const day = now.getDay();
    if (day === 6) now.setDate(now.getDate() - 1);
    if (day === 0) now.setDate(now.getDate() - 2);
    return dateValue(now);
  }
  function formatDate(value, options) {
    return new Intl.DateTimeFormat('tr-TR', options).format(new Date(`${value}T12:00:00`));
  }
  function lessonKey(lesson) { return `${lesson.applicationId}|${lesson.slot}`; }

  async function api(body, authToken) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...((authToken || token) ? { Authorization: `Bearer ${authToken || token}` } : {}) },
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(result.error || 'İşlem tamamlanamadı.');
      error.status = response.status;
      throw error;
    }
    return result;
  }

  function setTheme(value) {
    const theme = value || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    const symbol = theme === 'dark' ? 'icon-sun' : 'icon-moon';
    document.querySelectorAll('#loginTheme use, #appTheme use').forEach((node) => node.setAttribute('href', `#${symbol}`));
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#0e1219' : '#f3f5f8';
  }
  function toggleTheme() { setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); }

  function toast(message, tone) {
    const node = el('toast');
    node.querySelector('span').textContent = message;
    node.className = `toast is-visible${tone === 'error' ? ' is-error' : ''}`;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { node.className = 'toast'; }, 3200);
  }

  function showLogin(message) {
    token = '';
    teacher = null;
    sessionStorage.removeItem(TOKEN_KEY);
    el('appView').hidden = true;
    el('loginView').hidden = false;
    el('loginTheme').hidden = false;
    if (message) {
      el('loginFeedback').textContent = message;
      el('loginFeedback').className = 'login-feedback is-visible';
    }
    history.replaceState({ screen: 'login' }, '', '/yoklama/');
  }

  function showApp() {
    el('loginView').hidden = true;
    el('loginTheme').hidden = true;
    el('appView').hidden = false;
    el('teacherNameTop').textContent = teacher.name;
    el('teacherNameMenu').textContent = teacher.name;
    el('teacherUsernameMenu').textContent = `@${teacher.username}`;
    el('teacherInitial').textContent = teacher.name.charAt(0).toLocaleUpperCase('tr-TR');
    history.replaceState({ screen: 'app' }, '', '/yoklama/');
  }

  function renderWeek() {
    const start = mondayFor(selectedDate);
    const end = addDays(start, 4);
    el('weekLabel').textContent = `${formatDate(start, { day: 'numeric', month: 'short' })} – ${formatDate(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    const today = dateValue(new Date());
    el('weekDays').innerHTML = week.map((item) => {
      const isActive = item.date === selectedDate;
      const complete = item.expected > 0 && item.completed === item.expected;
      return `<button class="week-day${isActive ? ' is-active' : ''}${complete ? ' is-complete' : ''}" type="button" data-date="${item.date}" ${item.date > today ? 'disabled' : ''} aria-pressed="${isActive}">
        <span>${labels.shortDays[item.day]}</span><strong>${Number(item.date.slice(8))}</strong><small>${item.completed}/${item.expected}</small>
      </button>`;
    }).join('');
    el('nextWeek').disabled = mondayFor(selectedDate) >= mondayFor(today);
  }

  function dirtyState(lesson) {
    return lesson.status !== lesson.originalStatus || lesson.note !== lesson.originalNote;
  }

  function syncDirty(lesson) {
    const key = lessonKey(lesson);
    if (dirtyState(lesson)) dirty.set(key, lesson);
    else dirty.delete(key);
    renderSaveDock();
  }

  function renderSaveDock() {
    el('saveDock').hidden = dirty.size === 0;
    el('dirtyCount').textContent = `${dirty.size} değişiklik`;
  }

  function renderLessons() {
    const list = el('lessonList');
    el('loadingState').hidden = true;
    el('errorState').hidden = true;
    el('emptyState').hidden = lessons.length > 0;
    list.hidden = lessons.length === 0;
    const completed = lessons.filter((lesson) => lesson.status).length;
    el('completedCount').textContent = completed;
    el('lessonCount').textContent = lessons.length;
    el('dayKicker').textContent = selectedDate === dateValue(new Date()) ? 'Bugünün programı' : formatDate(selectedDate, { weekday: 'long' });
    el('dayHeading').textContent = formatDate(selectedDate, { day: 'numeric', month: 'long' });
    el('daySubheading').textContent = lessons.length ? `${lessons.length} birebir ders planlandı. Yoklamayı ders sonrasında tamamlayın.` : 'Bu gün için planlanmış bir ders bulunmuyor.';
    list.innerHTML = lessons.map((lesson, index) => {
      const active = (status) => lesson.status === status ? ' is-active' : '';
      return `<article class="lesson-card${dirtyState(lesson) ? ' is-dirty' : ''}" style="--index:${index}">
        <time class="lesson-time">${escapeHtml(lesson.slot.split('-')[0])}</time>
        <div class="lesson-surface">
          <header class="lesson-summary"><div class="student-info"><strong>${escapeHtml(lesson.studentName)}</strong><span>${escapeHtml(lesson.applicationReference || '')}</span></div><span class="lesson-mode">${escapeHtml(labels.type[lesson.applicationType] || lesson.applicationType)}</span></header>
          <div class="attendance-controls" role="group" aria-label="${escapeHtml(lesson.studentName)} yoklama durumu">
            ${['katildi', 'gelmedi', 'mazeretli'].map((status) => `<button type="button" class="status-action${active(status)}" data-lesson-key="${escapeHtml(lessonKey(lesson))}" data-status="${status}" aria-pressed="${lesson.status === status}"><svg><use href="#${icon[status]}"></use></svg>${labels.status[status]}</button>`).join('')}
          </div>
          <details class="lesson-note" ${lesson.note ? 'open' : ''}><summary><svg><use href="#icon-note"></use></svg>Ders notu ${lesson.note ? '· eklendi' : 'ekle'}</summary><textarea data-note-key="${escapeHtml(lessonKey(lesson))}" maxlength="300" ${lesson.status ? '' : 'disabled'} placeholder="Yalnızca gerekli kısa notu yazın...">${escapeHtml(lesson.note)}</textarea></details>
        </div>
      </article>`;
    }).join('');
    renderSaveDock();
  }

  function showLoading() {
    el('loadingState').hidden = false;
    el('errorState').hidden = true;
    el('emptyState').hidden = true;
    el('lessonList').hidden = true;
  }

  async function loadDay(options) {
    const quiet = options?.quiet;
    if (!quiet) showLoading();
    el('refreshButton').classList.toggle('is-loading', Boolean(quiet));
    try {
      const result = await api({ action: 'teacher-data', date: selectedDate });
      teacher = result.teacher;
      week = result.week || [];
      lessons = (result.lessons || []).map((lesson) => ({
        ...lesson, originalStatus: lesson.status || '', originalNote: lesson.note || ''
      }));
      dirty.clear();
      showApp();
      renderWeek();
      renderLessons();
    } catch (error) {
      if (error.status === 401 || error.status === 403) return showLogin(error.message);
      el('loadingState').hidden = true;
      el('lessonList').hidden = true;
      el('emptyState').hidden = true;
      el('errorMessage').textContent = error.message;
      el('errorState').hidden = false;
    } finally {
      el('refreshButton').classList.remove('is-loading');
    }
  }

  async function login(event) {
    event.preventDefault();
    const username = el('username').value.trim();
    const password = el('password').value;
    if (!username || password.length < 8) {
      el('loginFeedback').textContent = 'Kullanıcı adı ve en az 8 karakterli şifrenizi girin.';
      el('loginFeedback').className = 'login-feedback is-visible';
      return;
    }
    const button = el('loginSubmit');
    button.disabled = true;
    button.querySelector('span').textContent = 'Giriş kontrol ediliyor…';
    el('loginFeedback').className = 'login-feedback';
    try {
      const result = await api({ action: 'teacher-login', username, password }, '');
      token = result.token;
      teacher = result.teacher;
      sessionStorage.setItem(TOKEN_KEY, token);
      await loadDay();
    } catch (error) {
      el('loginFeedback').textContent = error.message;
      el('loginFeedback').className = 'login-feedback is-visible';
    } finally {
      button.disabled = false;
      button.querySelector('span').textContent = 'Giriş yap';
    }
  }

  async function saveAttendance() {
    if (!dirty.size) return;
    const button = el('saveButton');
    button.disabled = true;
    button.querySelector('span').textContent = 'Kaydediliyor…';
    try {
      await api({ action: 'attendance-save', date: selectedDate, entries: [...dirty.values()].map((lesson) => ({
        applicationId: lesson.applicationId, slot: lesson.slot, status: lesson.status, note: lesson.note
      })) });
      toast('Yoklama güvenle kaydedildi.');
      await loadDay({ quiet: true });
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      button.disabled = false;
      button.querySelector('span').textContent = 'Yoklamayı kaydet';
    }
  }

  function closeAccountMenu() {
    el('accountMenu').hidden = true;
    el('accountButton').setAttribute('aria-expanded', 'false');
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTheme(localStorage.getItem(THEME_KEY));
    el('loginTheme').addEventListener('click', toggleTheme);
    el('appTheme').addEventListener('click', toggleTheme);
    el('loginForm').addEventListener('submit', login);
    el('passwordToggle').addEventListener('click', () => {
      el('password').type = el('password').type === 'password' ? 'text' : 'password';
    });
    el('weekDays').addEventListener('click', (event) => {
      const button = event.target.closest('[data-date]');
      if (!button || button.disabled || button.dataset.date === selectedDate) return;
      if (dirty.size && !window.confirm('Kaydedilmemiş yoklama değişiklikleri var. Başka güne geçilsin mi?')) return;
      selectedDate = button.dataset.date;
      loadDay();
    });
    el('previousWeek').addEventListener('click', () => {
      if (dirty.size && !window.confirm('Kaydedilmemiş değişiklikler var. Önceki haftaya geçilsin mi?')) return;
      selectedDate = addDays(mondayFor(selectedDate), -7);
      loadDay();
    });
    el('nextWeek').addEventListener('click', () => {
      if (el('nextWeek').disabled) return;
      if (dirty.size && !window.confirm('Kaydedilmemiş değişiklikler var. Sonraki haftaya geçilsin mi?')) return;
      const next = addDays(mondayFor(selectedDate), 7);
      selectedDate = next > dateValue(new Date()) ? initialDate() : next;
      loadDay();
    });
    el('lessonList').addEventListener('click', (event) => {
      const button = event.target.closest('[data-status]');
      if (!button) return;
      const lesson = lessons.find((item) => lessonKey(item) === button.dataset.lessonKey);
      if (!lesson) return;
      lesson.status = button.dataset.status;
      syncDirty(lesson);
      renderLessons();
    });
    el('lessonList').addEventListener('input', (event) => {
      if (!event.target.matches('[data-note-key]')) return;
      const lesson = lessons.find((item) => lessonKey(item) === event.target.dataset.noteKey);
      if (!lesson) return;
      lesson.note = event.target.value;
      syncDirty(lesson);
    });
    el('saveButton').addEventListener('click', saveAttendance);
    el('refreshButton').addEventListener('click', () => loadDay({ quiet: true }));
    el('retryButton').addEventListener('click', () => loadDay());
    el('accountButton').addEventListener('click', () => {
      const open = el('accountMenu').hidden;
      el('accountMenu').hidden = !open;
      el('accountButton').setAttribute('aria-expanded', String(open));
    });
    el('logoutButton').addEventListener('click', () => { closeAccountMenu(); showLogin(); el('username').focus(); });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('#accountButton') && !event.target.closest('#accountMenu')) closeAccountMenu();
    });
    window.addEventListener('popstate', () => {
      if (token) history.replaceState({ screen: 'app' }, '', '/yoklama/');
    });
    if (token) loadDay(); else showLogin();
  });
})();
