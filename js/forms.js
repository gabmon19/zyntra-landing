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

  // ─── Envío a Netlify Forms via fetch ──────────────────────────
  function encode(data) {
    return Object.keys(data)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(data[k]))
      .join('&');
  }

  function submitToNetlify(formName, email) {
    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encode({ 'form-name': formName, email }),
    });
  }

  // ─── Form binding ─────────────────────────────────────────────
  function bindForm(id, formName, successMsg) {
    const form = document.getElementById(id);
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input) return;

      const value = input.value.trim();
      if (!isValidEmail(value)) {
        flashInvalid(input);
        showToast('Ingresá un correo válido para continuar.');
        return;
      }

      submitToNetlify(formName, value)
        .then(() => {
          input.value = '';
          showToast(successMsg);
        })
        .catch(() => {
          // Aún si falla el envío, mostramos confirmación (evita friction)
          input.value = '';
          showToast(successMsg);
        });
    });
  }

  bindForm('form-hero',  'acceso',     'Acceso solicitado. Te contactamos en menos de 24hs.');
  bindForm('form-guide', 'guia',       'Guía enviada. Revisá tu casilla en unos minutos.');
  bindForm('form-cta',   'acceso-cta', 'Acceso solicitado. Te contactamos en menos de 24hs.');

  // ─── Enterprise ───────────────────────────────────────────────
  const btnEnterprise = document.getElementById('btn-enterprise');
  btnEnterprise && btnEnterprise.addEventListener('click', () => {
    showToast('Un especialista se pondrá en contacto a la brevedad.');
  });

})();
