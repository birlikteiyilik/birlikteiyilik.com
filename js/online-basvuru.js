(function () {
  'use strict';

  const form = document.getElementById('onlineForm');
  if (!form) return;

  const steps = Array.from(form.querySelectorAll('.form-step'));
  const markers = Array.from(document.querySelectorAll('.steps li'));
  const nextButton = document.getElementById('nextButton');
  const backButton = document.getElementById('backButton');
  const submitButton = document.getElementById('submitButton');
  const progressBar = document.getElementById('progressBar');
  const progressTrack = document.querySelector('.progress-track');
  const progressLabel = document.getElementById('progressLabel');
  const progressFraction = document.getElementById('progressFraction');
  const titles = ['Öğrenci bilgileri', 'Veli bilgileri', 'Ders programı', 'Kontrol ve onay'];
  let activeStep = 0;
  let sending = false;

  document.getElementById('startedAt').value = String(Date.now());

  function digits(value) { return String(value || '').replace(/\D/g, ''); }
  function validPhone(value, optional) {
    const phone = digits(value);
    if (optional && !phone) return true;
    return /^(?:90)?5\d{9}$/.test(phone) || /^05\d{9}$/.test(phone);
  }
  function setError(control, message) {
    const holder = control.closest('.field, .choice-field, .consent');
    if (!holder) return;
    holder.classList.toggle('has-error', Boolean(message));
    control.setAttribute('aria-invalid', message ? 'true' : 'false');
    const error = holder.querySelector('.field-error');
    if (error) error.textContent = message || '';
  }
  function clearStepErrors(step) {
    step.querySelectorAll('.has-error').forEach((node) => node.classList.remove('has-error'));
    step.querySelectorAll('[aria-invalid="true"]').forEach((node) => node.setAttribute('aria-invalid', 'false'));
  }
  function validateStep(index) {
    const step = steps[index];
    clearStepErrors(step);
    let firstInvalid = null;
    const requiredNames = new Set();

    step.querySelectorAll('[required]').forEach((control) => {
      if (control.type === 'radio' || control.type === 'checkbox') {
        if (requiredNames.has(control.name)) return;
        requiredNames.add(control.name);
        const checked = step.querySelectorAll(`[name="${control.name}"]:checked`).length > 0;
        if (!checked) {
          setError(control, 'Bu alanı yanıtlayın.');
          firstInvalid = firstInvalid || control;
        }
        return;
      }
      if (!control.value.trim()) {
        setError(control, 'Bu alanı doldurun.');
        firstInvalid = firstInvalid || control;
      } else if (control.minLength > 0 && control.value.trim().length < control.minLength) {
        setError(control, `En az ${control.minLength} karakter yazın.`);
        firstInvalid = firstInvalid || control;
      }
    });

    const availability = step.querySelector('[name="availabilityRanges"]');
    if (availability && !step.querySelector('[name="availabilityRanges"]:checked')) {
      setError(availability, 'En az bir uygun saat aralığı seçin.');
      firstInvalid = firstInvalid || availability;
    }

    step.querySelectorAll('[name$="Phone"]').forEach((control) => {
      if (control.value && !validPhone(control.value, control.name === 'studentPhone')) {
        setError(control, 'Geçerli bir cep telefonu numarası yazın.');
        firstInvalid = firstInvalid || control;
      }
    });

    const birth = step.querySelector('[name="birthDate"]');
    if (birth && birth.value && new Date(`${birth.value}T00:00:00`) > new Date()) {
      setError(birth, 'Doğum tarihi gelecekte olamaz.');
      firstInvalid = firstInvalid || birth;
    }

    const previous = form.elements.previousTraining;
    if (index === 2 && previous.value === 'evet' && !form.elements.previousTrainingDetail.value.trim()) {
      setError(form.elements.previousTrainingDetail, 'Kısaca eğitim bilgisini yazın.');
      firstInvalid = firstInvalid || form.elements.previousTrainingDetail;
    }
    const referral = form.elements.referralSource;
    if (index === 2 && referral.value === 'diger' && !form.elements.referralOther.value.trim()) {
      setError(form.elements.referralOther, 'Bizi nereden duyduğunuzu yazın.');
      firstInvalid = firstInvalid || form.elements.referralOther;
    }

    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      firstInvalid.closest('.field, .choice-field, .consent')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  }

  function updateStep(next) {
    activeStep = next;
    steps.forEach((step, index) => {
      step.hidden = index !== activeStep;
      step.classList.toggle('is-active', index === activeStep);
    });
    markers.forEach((marker, index) => {
      marker.classList.toggle('is-active', index === activeStep);
      marker.classList.toggle('is-done', index < activeStep);
      if (index < activeStep) marker.querySelector('span').textContent = '✓';
      else marker.querySelector('span').textContent = String(index + 1);
    });
    const progress = ((activeStep + 1) / steps.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressTrack.setAttribute('aria-valuenow', String(activeStep + 1));
    progressLabel.textContent = titles[activeStep];
    progressFraction.textContent = `${activeStep + 1} / ${steps.length}`;
    backButton.hidden = activeStep === 0;
    nextButton.hidden = activeStep === steps.length - 1;
    submitButton.hidden = activeStep !== steps.length - 1;
    if (activeStep === steps.length - 1) renderReview();
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function labelFor(name, value) {
    const control = form.querySelector(`[name="${name}"][value="${CSS.escape(value)}"]`);
    return control?.nextElementSibling?.textContent.trim() || value;
  }
  function renderReview() {
    const selectedTimes = Array.from(form.querySelectorAll('[name="availabilityRanges"]:checked')).map((input) => input.nextElementSibling.textContent.trim());
    const rows = [
      ['Öğrenci', form.elements.studentName.value],
      ['Sınıf / cinsiyet', `${form.elements.grade.value}. sınıf · ${labelFor('gender', form.elements.gender.value)}`],
      ['Kur’an seviyesi', labelFor('quranLevel', form.elements.quranLevel.value)],
      ['Veli', `${form.elements.motherName.value} / ${form.elements.fatherName.value}`],
      ['İletişim', form.elements.motherPhone.value],
      ['İlçe / şehir', form.elements.location.value],
      ['Uygun saatler', selectedTimes.join(', '), true],
      ['Daha önce eğitim', labelFor('previousTraining', form.elements.previousTraining.value)]
    ];
    document.getElementById('reviewCard').innerHTML = rows.map(([key, value, full]) => `<div class="review-item${full ? ' review-item--full' : ''}"><span>${key}</span><b>${escapeHtml(value || '—')}</b></div>`).join('');
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
  }
  function payload() {
    const data = new FormData(form);
    return {
      action: 'submit', applicationType: 'online', applicationVersion: 'online-2026-09', startedAt: data.get('startedAt'), website: data.get('website'),
      studentName: data.get('studentName'), birthDate: data.get('birthDate'), gender: data.get('gender'), grade: data.get('grade'),
      quranLevel: data.get('quranLevel'), studentPhone: data.get('studentPhone'), motherName: data.get('motherName'), motherPhone: data.get('motherPhone'),
      fatherName: data.get('fatherName'), fatherPhone: data.get('fatherPhone'), location: data.get('location'), availabilityRanges: data.getAll('availabilityRanges'),
      previousTraining: data.get('previousTraining'), previousTrainingDetail: data.get('previousTrainingDetail'), referralSource: data.get('referralSource'),
      referralOther: data.get('referralOther'), privacyAcknowledged: data.get('privacyAcknowledged') === 'on', termsAccepted: data.get('termsAccepted') === 'on'
    };
  }

  nextButton.addEventListener('click', () => { if (validateStep(activeStep)) updateStep(activeStep + 1); });
  backButton.addEventListener('click', () => updateStep(activeStep - 1));
  form.addEventListener('input', (event) => setError(event.target, ''));

  form.querySelectorAll('[name="previousTraining"]').forEach((radio) => radio.addEventListener('change', () => {
    const show = form.elements.previousTraining.value === 'evet';
    document.getElementById('previousDetailField').hidden = !show;
    form.elements.previousTrainingDetail.required = show;
  }));
  form.querySelectorAll('[name="referralSource"]').forEach((radio) => radio.addEventListener('change', () => {
    const show = form.elements.referralSource.value === 'diger';
    document.getElementById('referralOtherField').hidden = !show;
    form.elements.referralOther.required = show;
  }));
  form.querySelectorAll('[name="availabilityRanges"]').forEach((checkbox) => checkbox.addEventListener('change', () => {
    const count = form.querySelectorAll('[name="availabilityRanges"]:checked').length;
    const feedback = document.getElementById('selectionFeedback');
    feedback.textContent = count ? `${count} saat aralığı seçildi. Ne kadar çok aralık seçerseniz eşleştirme o kadar kolaylaşır.` : 'Henüz saat seçilmedi.';
    feedback.classList.toggle('has-selection', count > 0);
  }));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending || !validateStep(activeStep)) return;
    sending = true;
    submitButton.disabled = true;
    submitButton.firstChild.textContent = 'Gönderiliyor ';
    const error = document.getElementById('submitError');
    error.hidden = true;
    try {
      const response = await fetch('/api/bia-applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Başvuru gönderilemedi. Lütfen tekrar deneyin.');
      document.querySelector('.progress-wrap').hidden = true;
      form.hidden = true;
      document.getElementById('referenceNumber').textContent = result.reference || 'Başvurunuz kayıtlı';
      document.getElementById('successState').hidden = false;
      document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (requestError) {
      error.textContent = requestError.message;
      error.hidden = false;
      submitButton.disabled = false;
      submitButton.firstChild.textContent = 'Başvuruyu gönder ';
      sending = false;
    }
  });
}());
