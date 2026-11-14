/* ============================================================
   Birlikte İyilik Akademi — Bağış sayfası
   IBAN kopyalama ve erişilebilir bildirim
   ============================================================ */
(() => {
  const root = document.querySelector('[data-bia-support-bank]');
  if (!root) return;

  const copyButtons = [...root.querySelectorAll('[data-bia-support-copy]')];
  const toast = document.querySelector('[data-bia-support-toast]');
  let toastTimer = 0;

  const fallbackCopy = (text) => {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    return copied;
  };

  const showToast = (message) => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('bia-support-journey-toast-visible');
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('bia-support-journey-toast-visible');
    }, 2200);
  };

  const copyIban = async (button) => {
    const iban = button.dataset.biaSupportCopy;
    let copied = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(iban);
        copied = true;
      } else {
        copied = fallbackCopy(iban);
      }
    } catch (_) {
      copied = fallbackCopy(iban);
    }

    showToast(copied ? 'IBAN kopyalandı.' : 'IBAN kopyalanamadı.');
  };

  copyButtons.forEach((button) => {
    button.addEventListener('click', () => copyIban(button));
  });
})();
