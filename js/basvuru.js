(function () {
  'use strict';

  const form = document.getElementById('applicationForm');
  if (!form) return;

  const steps = Array.from(form.querySelectorAll('.form-step'));
  const progressItems = Array.from(document.querySelectorAll('[data-progress]'));
  const progressFill = document.getElementById('progressFill');
  const backButton = document.getElementById('backButton');
  const nextButton = document.getElementById('nextButton');
  const submitButton = document.getElementById('submitButton');
  const stepSummary = document.getElementById('stepSummary');
  const notice = document.getElementById('formNotice');
  const successState = document.getElementById('successState');
  const startedAt = document.getElementById('startedAt');
  let currentStep = 0;

  startedAt.value = String(Date.now());

  const messages = {
    studentName: 'Öğrencinin adını ve soyadını yazın.',
    tckn: 'Geçerli bir T.C. kimlik numarası yazın.',
    birthDate: 'Doğum tarihini seçin.',
    gender: 'Cinsiyet seçimi yapın.',
    school: 'Öğrencinin okulunu yazın.',
    grade: 'Sınıf seçimi yapın.',
    guardianName: 'Veli adını ve soyadını yazın.',
    guardianRelation: 'Yakınlık bilgisini seçin.',
    guardianPhone: 'Geçerli bir telefon numarası yazın.',
    studentPhone: 'Telefon numarasını kontrol edin.',
    secondGuardianPhone: 'İkinci veli telefonunu kontrol edin.',
    quranLevel: 'Kur’an-ı Kerim seviyesini seçin.',
    previousTraining: 'Önceki eğitim durumunu seçin.',
    availabilitySlots: 'En az bir müsait saat aralığı seçin.',
    rulesAccepted: 'Devam etmek için program kurallarını kabul edin.',
    privacyAcknowledged: 'KVKK aydınlatma metnini okuduğunuzu onaylayın.',
    termsAccepted: 'Hizmet şartlarını kabul edin.',
    mediaConsent: 'Görsel paylaşım tercihinizi belirtin.'
  };

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

  function formatPhone(value) {
    let phone = digits(value).slice(0, 11);
    if (phone.length && phone[0] !== '0') phone = `0${phone}`.slice(0, 11);
    const parts = [];
    if (phone.length) parts.push(phone.slice(0, 4));
    if (phone.length > 4) parts.push(phone.slice(4, 7));
    if (phone.length > 7) parts.push(phone.slice(7, 9));
    if (phone.length > 9) parts.push(phone.slice(9, 11));
    return parts.join(' ');
  }

  function fieldErrorElement(name) {
    return document.getElementById(`${name}Error`);
  }

  function setError(input, message) {
    const name = input.name;
    const group = form.querySelectorAll(`[name="${CSS.escape(name)}"]`);
    group.forEach((item) => item.setAttribute('aria-invalid', message ? 'true' : 'false'));
    const error = fieldErrorElement(name);
    if (error) error.textContent = message || '';
    const container = input.closest('.field, section');
    container?.classList.toggle('has-error', Boolean(container.querySelector('[aria-invalid="true"]')));
  }

  function validateField(input) {
    const name = input.name;
    if (!name || name === 'website' || input.type === 'hidden') return true;
    if (input.disabled || input.closest('[hidden]')) return true;

    if (input.type === 'radio') {
      const selected = form.querySelector(`[name="${CSS.escape(name)}"]:checked`);
      const valid = Boolean(selected);
      setError(input, valid ? '' : messages[name]);
      return valid;
    }

    if (input.type === 'checkbox') {
      if (name === 'availabilitySlots') {
        const valid = Boolean(form.querySelector('[name="availabilitySlots"]:checked'));
        setError(input, valid ? '' : messages[name]);
        return valid;
      }
      const valid = !input.required || input.checked;
      setError(input, valid ? '' : messages[name]);
      return valid;
    }

    const value = input.value.trim();
    let valid = !input.required || Boolean(value);
    if (valid && value && name === 'tckn') valid = isValidTckn(value);
    if (valid && name === 'guardianPhone') valid = isValidPhone(value, false);
    if (valid && (name === 'studentPhone' || name === 'secondGuardianPhone')) valid = isValidPhone(value, true);
    if (valid && input.type === 'date' && value) {
      const date = new Date(`${value}T00:00:00`);
      valid = Number.isFinite(date.getTime()) && date <= new Date();
    }
    if (valid && value && input.minLength > 0) valid = value.length >= input.minLength;

    setError(input, valid ? '' : (messages[name] || 'Bu alanı kontrol edin.'));
    return valid;
  }

  function validateStep(index) {
    const controls = Array.from(steps[index].querySelectorAll('input, select, textarea'));
    const visitedGroups = new Set();
    let firstInvalid = null;
    let valid = true;

    controls.forEach((input) => {
      if (input.type === 'radio' || input.name === 'availabilitySlots') {
        if (visitedGroups.has(input.name)) return;
        visitedGroups.add(input.name);
      }
      if (!validateField(input)) {
        valid = false;
        if (!firstInvalid) firstInvalid = input;
      }
    });

    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      const invalidContainer = firstInvalid.closest('.field, section');
      invalidContainer?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (invalidContainer) {
        invalidContainer.classList.remove('is-shaking');
        void invalidContainer.offsetWidth;
        invalidContainer.classList.add('is-shaking');
        window.setTimeout(() => invalidContainer.classList.remove('is-shaking'), 420);
      }
    }
    return valid;
  }

  function updateStep(nextStep, focusHeading) {
    currentStep = Math.max(0, Math.min(steps.length - 1, nextStep));
    steps.forEach((step, index) => {
      const active = index === currentStep;
      step.classList.toggle('is-active', active);
      step.hidden = !active;
    });
    progressItems.forEach((item, index) => {
      item.classList.toggle('is-current', index === currentStep);
      item.classList.toggle('is-complete', index < currentStep);
      item.classList.remove('is-entering');
      if (index === currentStep) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    const activeProgress = progressItems[currentStep];
    if (activeProgress) {
      void activeProgress.offsetWidth;
      activeProgress.classList.add('is-entering');
    }
    progressFill.style.width = `${(currentStep / (steps.length - 1)) * 100}%`;
    stepSummary.textContent = `${currentStep + 1} / ${steps.length}`;
    backButton.hidden = currentStep === 0;
    nextButton.hidden = currentStep === steps.length - 1;
    submitButton.hidden = currentStep !== steps.length - 1;
    clearNotice();

    if (focusHeading) {
      document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
      const legend = steps[currentStep].querySelector('legend span');
      if (legend) {
        legend.setAttribute('tabindex', '-1');
        window.setTimeout(() => legend.focus({ preventScroll: true }), 350);
      }
    }
  }

  function showNotice(message, type) {
    notice.textContent = message;
    notice.className = `form-notice is-${type || 'error'}`;
    notice.hidden = false;
  }

  function clearNotice() {
    notice.hidden = true;
    notice.textContent = '';
  }

  function setSubmitting(loading) {
    submitButton.disabled = loading;
    submitButton.classList.toggle('is-loading', loading);
    submitButton.querySelector('.button-label').hidden = loading;
    submitButton.querySelector('.button-loading').hidden = !loading;
    backButton.disabled = loading;
  }

  function serialize() {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    return {
      action: 'submit',
      website: data.website || '',
      startedAt: Number(data.startedAt),
      applicationType: data.applicationType,
      studentName: data.studentName,
      tckn: digits(data.tckn),
      birthDate: data.birthDate,
      gender: data.gender,
      school: data.school,
      grade: data.grade,
      guardianName: data.guardianName,
      guardianRelation: data.guardianRelation,
      guardianPhone: digits(data.guardianPhone),
      studentPhone: digits(data.studentPhone),
      address: data.address,
      secondGuardianName: data.secondGuardianName,
      secondGuardianPhone: digits(data.secondGuardianPhone),
      quranLevel: data.quranLevel,
      previousTraining: data.previousTraining,
      previousTrainingDetail: data.previousTrainingDetail,
      availabilitySlots: formData.getAll('availabilitySlots'),
      notes: data.notes,
      rulesAccepted: data.rulesAccepted === 'on',
      privacyAcknowledged: data.privacyAcknowledged === 'on',
      termsAccepted: data.termsAccepted === 'on',
      mediaConsent: data.mediaConsent
    };
  }

  nextButton.addEventListener('click', () => {
    if (validateStep(currentStep)) updateStep(currentStep + 1, true);
  });

  backButton.addEventListener('click', () => updateStep(currentStep - 1, true));

  form.addEventListener('input', (event) => {
    const input = event.target;
    if (input.matches('[type="tel"]')) input.value = formatPhone(input.value);
    if (input.name === 'tckn') input.value = digits(input.value).slice(0, 11);
    if (input.getAttribute('aria-invalid') === 'true') validateField(input);
  });

  form.addEventListener('change', (event) => {
    const input = event.target;
    if (input.name) validateField(input);
    if (input.name === 'availabilitySlots') {
      const count = form.querySelectorAll('[name="availabilitySlots"]:checked').length;
      const hint = document.getElementById('availabilitySlotsHint');
      const warning = document.getElementById('availabilityWarning');
      hint.textContent = count ? `${count} uygun saat işaretlendi. Atama bu seçenekler arasından yapılacak.` : 'Henüz saat seçilmedi.';
      warning.classList.toggle('has-selection', count > 0);
    }
  });

  document.getElementById('addSecondGuardian').addEventListener('change', (event) => {
    const fields = document.getElementById('secondGuardianFields');
    fields.hidden = !event.target.checked;
    if (!event.target.checked) {
      fields.querySelectorAll('input').forEach((input) => {
        input.value = '';
        setError(input, '');
      });
    }
  });

  form.querySelectorAll('[name="previousTraining"]').forEach((input) => {
    input.addEventListener('change', () => {
      const wrap = document.getElementById('previousTrainingDetailWrap');
      const detail = document.getElementById('previousTrainingDetail');
      const show = input.checked && input.value === 'evet';
      wrap.hidden = !show;
      detail.required = show;
      if (!show) detail.value = '';
    });
  });

  form.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA' && currentStep < steps.length - 1) {
      event.preventDefault();
      nextButton.click();
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateStep(currentStep)) return;
    setSubmitting(true);
    clearNotice();

    try {
      const response = await fetch('/api/bia-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serialize())
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Başvuru şu anda gönderilemedi.');

      form.hidden = true;
      document.querySelector('.form-progress').hidden = true;
      successState.hidden = false;
      successState.classList.add('is-visible');
      document.getElementById('applicationReference').textContent = result.reference || 'BIA';
      successState.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      showNotice(`${error.message} Lütfen bağlantınızı kontrol edip tekrar deneyin veya 0534 811 77 57 üzerinden bize ulaşın.`, 'error');
      notice.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      setSubmitting(false);
    }
  });

  updateStep(0, false);
})();
