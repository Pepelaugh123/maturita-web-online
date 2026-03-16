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
    links.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  links.forEach((link) => {
    link.addEventListener('click', () => {
      const id = link.getAttribute('href').replace('#', '');
      if (id) setActive(id);
    });
  });

  if (!('IntersectionObserver' in window)) {
    setActive(sections[0].id);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length) {
        setActive(visible[0].target.id);
      }
    },
    {
      rootMargin: '-20% 0px -55% 0px',
      threshold: [0.15, 0.35, 0.55, 0.75]
    }
  );

  sections.forEach((section) => observer.observe(section));

  setActive(sections[0].id);
};