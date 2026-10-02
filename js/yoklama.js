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

  let token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || '';
  let teacher = null;
  let selectedDate = initialDate();
  let week = [];
  let lessons = [];
  const saving = new Set();
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
  function attendanceKey(lesson, date) { return `${date}|${lessonKey(lesson)}`; }

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
    localStorage.removeItem(TOKEN_KEY);
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
      const isFuture = item.date > today;
      const complete = item.expected > 0 && item.completed === item.expected;
      return `<button class="week-day${isActive ? ' is-active' : ''}${complete ? ' is-complete' : ''}${isFuture ? ' is-future' : ''}" type="button" data-date="${item.date}" aria-pressed="${isActive}" aria-label="${labels.days[item.day]}, ${formatDate(item.date, { day: 'numeric', month: 'long' })}${isFuture ? ', ileri tarihli program' : ''}">
        <span>${labels.shortDays[item.day]}</span><strong>${Number(item.date.slice(8))}</strong><small>${isFuture ? `${item.expected} ders` : `${item.completed}/${item.expected}`}</small>
      </button>`;
    }).join('');
    const earliest = addDays(today, -120);
    const latest = addDays(today, 365);
    el('previousWeek').disabled = addDays(start, -3) < earliest;
    el('nextWeek').disabled = addDays(start, 7) > mondayFor(latest);
  }

  function renderLessons() {
    const list = el('lessonList');
    const isFuture = selectedDate > dateValue(new Date());
    el('loadingState').hidden = true;
    el('errorState').hidden = true;
    el('emptyState').hidden = lessons.length > 0;
    list.hidden = lessons.length === 0;
    const completed = lessons.filter((lesson) => lesson.status).length;
    el('completedCount').textContent = isFuture ? lessons.length : completed;
    el('dayScoreText').innerHTML = isFuture ? 'atanmış ders' : `/ <b>${lessons.length}</b> yoklama`;
    el('dayKicker').textContent = isFuture ? 'İleri tarihli program · yoklama alınamaz' : selectedDate === dateValue(new Date()) ? 'Bugünün programı' : formatDate(selectedDate, { weekday: 'long' });
    el('dayHeading').textContent = formatDate(selectedDate, { day: 'numeric', month: 'long' });
    el('daySubheading').textContent = isFuture
      ? lessons.length ? 'İleri tarihli ders programınızı önceden görüntülüyorsunuz. Yoklama, ders günü açılacaktır.' : 'Bu tarih için atanmış bir ders görünmüyor.'
      : lessons.length ? `${lessons.length} birebir ders planlandı. Yoklamayı ders sonrasında tamamlayın.` : 'Bu gün için planlanmış bir ders bulunmuyor.';
    list.innerHTML = lessons.map((lesson, index) => {
      const isSaving = saving.has(attendanceKey(lesson, selectedDate));
      const noteIsFromPreviousDay = Boolean(lesson.note && lesson.noteDate && lesson.noteDate < selectedDate);
      const active = (status) => lesson.status === status ? ' is-active' : '';
      return `<article class="lesson-card${isSaving ? ' is-saving' : ''}" style="--index:${index}" aria-busy="${isSaving}">
        <time class="lesson-time">${escapeHtml(lesson.slot.split('-')[0])}</time>
        <div class="lesson-surface">
          <header class="lesson-summary"><div class="student-info"><strong>${escapeHtml(lesson.studentName)}</strong><span>${escapeHtml(lesson.applicationReference || '')}</span></div><span class="lesson-mode">${escapeHtml(labels.type[lesson.applicationType] || lesson.applicationType)}</span></header>
          <div class="attendance-controls" role="group" aria-label="${escapeHtml(lesson.studentName)} yoklama durumu">
            ${['katildi', 'gelmedi', 'mazeretli'].map((status) => `<button type="button" class="status-action${active(status)}" data-lesson-key="${escapeHtml(lessonKey(lesson))}" data-status="${status}" aria-pressed="${lesson.status === status}" ${isFuture || isSaving ? 'disabled' : ''}><svg><use href="#${icon[status]}"></use></svg>${labels.status[status]}</button>`).join('')}
          </div>
          <details class="lesson-note" ${lesson.note ? 'open' : ''}><summary><svg><use href="#icon-note"></use></svg>Ders notu ${lesson.note ? noteIsFromPreviousDay ? `· önceki dersten, ${formatDate(lesson.noteDate, { day: 'numeric', month: 'short' })}` : '· eklendi' : 'ekle'}</summary><textarea data-note-key="${escapeHtml(lessonKey(lesson))}" maxlength="300" ${lesson.status && !isFuture && !isSaving ? '' : 'disabled'} placeholder="Yalnızca gerekli kısa notu yazın...">${escapeHtml(lesson.note)}</textarea><div class="lesson-note-actions"><span aria-live="polite" data-note-state="${escapeHtml(lessonKey(lesson))}">${lesson.note !== lesson.originalNote ? 'Kaydedilmemiş değişiklik' : 'Notlar sonraki ders gününde de görünür.'}</span><button type="button" data-note-save-key="${escapeHtml(lessonKey(lesson))}" ${lesson.status && !isFuture && !isSaving && lesson.note !== lesson.originalNote ? '' : 'disabled'}>${isSaving ? 'Kaydediliyor…' : 'Notu kaydet'}</button></div></details>
        </div>
      </article>`;
    }).join('');
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
      if (el('rememberSession').checked) {
        localStorage.setItem(TOKEN_KEY, token);
        sessionStorage.removeItem(TOKEN_KEY);
      } else {
        sessionStorage.setItem(TOKEN_KEY, token);
        localStorage.removeItem(TOKEN_KEY);
      }
      await loadDay();
    } catch (error) {
      el('loginFeedback').textContent = error.message;
      el('loginFeedback').className = 'login-feedback is-visible';
    } finally {
      button.disabled = false;
      button.querySelector('span').textContent = 'Giriş yap';
    }
  }

  async function saveAttendance(lesson, date, previous) {
    const key = attendanceKey(lesson, date);
    if (saving.has(key)) return;
    saving.add(key);
    if (date === selectedDate) renderLessons();
    toast('Yoklama kaydediliyor…');
    try {
      await api({ action: 'attendance-save', date, entries: [{
        applicationId: lesson.applicationId, slot: lesson.slot, status: lesson.status, note: lesson.note
      }] });
      lesson.originalStatus = lesson.status;
      lesson.originalNote = lesson.note;
      toast(lesson.status ? 'Yoklama kaydedildi.' : 'Yoklama seçimi kaldırıldı.');
      await loadDay({ quiet: true });
    } catch (error) {
      lesson.status = previous.status;
      lesson.note = previous.note;
      if (date === selectedDate) renderLessons();
      toast(error.message, 'error');
    } finally {
      saving.delete(key);
      if (date === selectedDate) renderLessons();
    }
  }

  function saveLessonNote(lesson) {
    if (!lesson || lesson.note === lesson.originalNote) return;
    const date = selectedDate;
    saveAttendance(lesson, date, { status: lesson.status, note: lesson.originalNote });
  }

  function closeAccountMenu() {
    el('accountMenu').hidden = true;
    el('accountButton').setAttribute('aria-expanded', 'false');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/yoklama' })
        .catch((error) => console.warn('E-Yoklama çevrimdışı önbelleği başlatılamadı.', error));
    }
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
      selectedDate = button.dataset.date;
      loadDay();
    });
    el('previousWeek').addEventListener('click', () => {
      selectedDate = addDays(mondayFor(selectedDate), -7);
      loadDay();
    });
    el('nextWeek').addEventListener('click', () => {
      if (el('nextWeek').disabled) return;
      selectedDate = addDays(mondayFor(selectedDate), 7);
      loadDay();
    });
    el('lessonList').addEventListener('click', (event) => {
      const button = event.target.closest('[data-status]');
      if (!button) return;
      const lesson = lessons.find((item) => lessonKey(item) === button.dataset.lessonKey);
      if (!lesson) return;
      if (lesson.note !== lesson.originalNote) return toast('Önce ders notunu kaydedin.', 'error');
      const date = selectedDate;
      const previous = { status: lesson.status, note: lesson.note };
      lesson.status = lesson.status === button.dataset.status ? '' : button.dataset.status;
      if (!lesson.status) lesson.note = '';
      saveAttendance(lesson, date, previous);
    });
    el('lessonList').addEventListener('input', (event) => {
      if (!event.target.matches('[data-note-key]')) return;
      const lesson = lessons.find((item) => lessonKey(item) === event.target.dataset.noteKey);
      if (!lesson || saving.has(attendanceKey(lesson, selectedDate))) return;
      lesson.note = event.target.value;
      const button = document.querySelector(`[data-note-save-key="${CSS.escape(lessonKey(lesson))}"]`);
      const state = document.querySelector(`[data-note-state="${CSS.escape(lessonKey(lesson))}"]`);
      if (button) button.disabled = !lesson.status || selectedDate > dateValue(new Date()) || lesson.note === lesson.originalNote;
      if (state) state.textContent = lesson.note === lesson.originalNote ? 'Notlar sonraki ders gününde de görünür.' : 'Kaydedilmemiş değişiklik';
    });
    el('lessonList').addEventListener('click', (event) => {
      const button = event.target.closest('[data-note-save-key]');
      if (!button || button.disabled) return;
      const lesson = lessons.find((item) => lessonKey(item) === button.dataset.noteSaveKey);
      saveLessonNote(lesson);
    });
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
