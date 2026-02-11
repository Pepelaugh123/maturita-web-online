import { qsa } from './utils.js';

export const initScrollSpy = () => {
  const sections = qsa('main section[id]');
  const links = qsa('.site-nav a[href^="#"]');
  if (!sections.length || !links.length) return;

  const linkById = new Map();
  links.forEach((link) => {
    const id = link.getAttribute('href').replace('#', '');
    if (id) linkById.set(id, link);
  });

  const setActive = (id) => {
    const active = linkById.get(id);
    if (!active) return;
    links.forEach((link) => link.classList.remove('is-active'));
    active.classList.add('is-active');
  };

  if (!('IntersectionObserver' in window)) {
    setActive(sections[0].id);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0.1 }
  );

  sections.forEach((section) => observer.observe(section));
};
