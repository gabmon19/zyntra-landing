(function () {
  'use strict';

  const toast    = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  let hideTimer;

  // ─── Toast ───────────────────────────────────────────────────
  function showToast(msg) {
    if (!toast || !toastMsg) return;
    clearTimeout(hideTimer);
    toastMsg.textContent = msg;
    toast.classList.add('show');
    hideTimer = setTimeout(() => toast.classList.remove('show'), 5000);
  }

  toast && toast.addEventListener('click', () => toast.classList.remove('show'));

  // ─── Email validation ─────────────────────────────────────────
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  }

  function flashInvalid(input) {
    input.style.outline = '2px solid var(--red)';
    input.focus();
    setTimeout(() => { input.style.outline = ''; }, 1800);
  }

  // ─── Form binding ─────────────────────────────────────────────
  function bindForm(id, successMsg) {
    const form = document.getElementById(id);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input) return;
      if (!isValidEmail(input.value)) {
        flashInvalid(input);
        showToast('Ingresá un correo válido para continuar.');
        return;
      }
      input.value = '';
      showToast(successMsg);
    });
  }

  bindForm('form-hero',  'Acceso solicitado. Te contactamos en menos de 24hs.');
  bindForm('form-guide', 'Guía enviada. Revisá tu casilla en unos minutos.');
  bindForm('form-cta',   'Acceso solicitado. Te contactamos en menos de 24hs.');

  // ─── Enterprise ───────────────────────────────────────────────
  const btnEnterprise = document.getElementById('btn-enterprise');
  btnEnterprise && btnEnterprise.addEventListener('click', () => {
    showToast('Un especialista se pondrá en contacto a la brevedad.');
  });

})();
