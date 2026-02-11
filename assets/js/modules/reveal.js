import { qsa } from './utils.js';

export const initReveal = () => {
  const items = qsa('.reveal');
  if (!items.length) return;

  items.forEach((item) => {
    const delay = parseInt(item.dataset.delay || '0', 10);
    if (delay) item.style.setProperty('--delay', `${delay}ms`);
  });

  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
  );

  items.forEach((item) => observer.observe(item));
};
