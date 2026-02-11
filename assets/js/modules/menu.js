import { qs, qsa } from './utils.js';

export const initMenu = () => {
  const btn = qs('.menu-toggle');
  const nav = qs('#siteNav');
  if (!btn || !nav) return;

  const close = () => {
    nav.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    btn.setAttribute('aria-expanded', 'false');
  };

  const open = () => {
    nav.classList.add('is-open');
    document.body.classList.add('nav-open');
    btn.setAttribute('aria-expanded', 'true');
  };

  const toggle = () => {
    if (nav.classList.contains('is-open')) {
      close();
    } else {
      open();
    }
  };

  btn.addEventListener('click', toggle);

  qsa('a', nav).forEach((link) => {
    link.addEventListener('click', close);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('is-open')) return;
    if (!nav.contains(event.target) && !btn.contains(event.target)) close();
  });

  const mediaQuery = window.matchMedia('(min-width: 981px)');
  mediaQuery.addEventListener('change', (event) => {
    if (event.matches) close();
  });
};
