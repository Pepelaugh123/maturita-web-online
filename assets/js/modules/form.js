import { qs } from './utils.js';

export const initForm = () => {
  const form = qs('#contactForm');
  if (!form) return;

  const status = qs('#formStatus');
  const sendBtn = qs('#sendBtn');
  const maxFileSize = 10 * 1024 * 1024;

  const setError = (name, message = '') => {
    const errorEl = form.querySelector(`.error[data-for="${name}"]`);
    if (errorEl) errorEl.textContent = message;

    const field = form.elements[name];
    if (field) field.setAttribute('aria-invalid', message ? 'true' : 'false');
  };

  const getValue = (name) => (form.elements[name]?.value || '').trim();

  const validate = () => {
    let ok = true;
    let firstInvalid = null;

    const markInvalid = (name, message) => {
      setError(name, message);
      ok = false;
      if (!firstInvalid && form.elements[name] && typeof form.elements[name].focus === 'function') {
        firstInvalid = form.elements[name];
      }
    };

    ['name', 'email', 'subject', 'message', 'phone', 'file', 'consent', 'recaptcha'].forEach((name) => setError(name, ''));

    if (!getValue('name')) {
      markInvalid('name', 'Vyplň jméno.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(getValue('email'))) {
      markInvalid('email', 'Zadej platný e-mail.');
    }

    if (!getValue('subject')) {
      markInvalid('subject', 'Vyber téma.');
    }

    if (!getValue('message')) {
      markInvalid('message', 'Napiš zprávu.');
    }

    const phone = getValue('phone');
    if (phone && !/^\+?[0-9\s-]{6,}$/.test(phone)) {
      markInvalid('phone', 'Telefon v neplatném formátu.');
    }

    const file = form.elements['file']?.files?.[0];
    if (file && file.size > maxFileSize) {
      markInvalid('file', 'Soubor je větší než 10 MB.');
    }

    const consent = form.elements['consent'];
    if (!consent?.checked) {
      markInvalid('consent', 'Potvrď souhlas.');
    }

    const captcha = form.querySelector('textarea[name="g-recaptcha-response"]');
    if (captcha && !captcha.value.trim()) {
      setError('recaptcha', 'Potvrď, že nejsi robot.');
      ok = false;
    }

    if (!ok && firstInvalid) {
      firstInvalid.focus();
    }

    return ok;
  };

  const postForm = async (url, formData) => {
    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }

    return res;
  };

  const submitForm = async (formData) => {
    const primary = form.dataset.endpoint || '/api/contact';

    try {
      await postForm(primary, formData);
      return true;
    } catch (err) {
      if (primary === '/') return false;

      try {
        await postForm('/', formData);
        return true;
      } catch (err2) {
        return false;
      }
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (status) status.textContent = '';

    if (!validate()) return;

    if (sendBtn) sendBtn.disabled = true;
    const oldText = sendBtn ? sendBtn.textContent : '';
    if (sendBtn) sendBtn.textContent = 'Odesílám...';

    const formData = new FormData(form);
    formData.set('form-name', form.getAttribute('name') || 'contact');

    try {
      const ok = await submitForm(formData);
      if (ok) {
        window.location.href = form.getAttribute('action') || '/thank-you.html';
        return;
      }

      throw new Error('Submission failed');
    } catch (err) {
      const to = 'booking@ksn-bendl.cz';
      const subject = encodeURIComponent(`Kontakt: ${getValue('subject') || 'Zpráva z webu'}`);
      const body = encodeURIComponent(
        `Jméno: ${getValue('name')}
E-mail: ${getValue('email')}
Telefon: ${getValue('phone')}

Zpráva:
${getValue('message')}`
      );
      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = oldText;
      }
    }
  });
};
