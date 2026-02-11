import { qsa } from './utils.js';

export const initGlassEffects = () => {
  const cards = qsa('.glass.is-interactive');
  if (!cards.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  cards.forEach((card) => {
    card.style.setProperty('--mx', '50%');
    card.style.setProperty('--my', '50%');

    if (!finePointer || prefersReduced) return;

    const tilt = parseFloat(card.dataset.tilt || '0');

    const onMove = (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);

      if (tilt) {
        const tiltX = ((x - 50) / 50) * tilt;
        const tiltY = ((y - 50) / 50) * tilt;
        card.style.setProperty('--shift-x', `${tiltX}px`);
        card.style.setProperty('--shift-y', `${tiltY}px`);
      }
    };

    const reset = () => {
      card.style.setProperty('--mx', '50%');
      card.style.setProperty('--my', '50%');
      card.style.setProperty('--shift-x', '0px');
      card.style.setProperty('--shift-y', '0px');
    };

    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', reset);
  });
};

export const initCursorGlow = () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  if (prefersReduced || !finePointer) return;

  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.appendChild(glow);

  let rafId = null;
  let x = 0;
  let y = 0;

  const update = () => {
    rafId = null;
    glow.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  };

  const onMove = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    x = event.clientX;
    y = event.clientY;
    if (!rafId) rafId = requestAnimationFrame(update);
    document.body.classList.add('cursor-glow-active');
  };

  const onLeave = () => {
    document.body.classList.remove('cursor-glow-active');
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('mouseout', (event) => {
    if (!event.relatedTarget) onLeave();
  });
};

export const initScrollProgress = () => {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  const update = () => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const progress = height > 0 ? window.scrollY / height : 0;
    bar.style.transform = `scaleX(${progress})`;
  };

  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update);
};

export const initMagneticButtons = () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const buttons = qsa('.btn--accent');

  if (prefersReduced || !finePointer || !buttons.length) return;

  buttons.forEach((btn) => {
    const strength = 10;

    const onMove = (event) => {
      const rect = btn.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      btn.style.setProperty('--btn-x', `${(x / rect.width) * strength}px`);
      btn.style.setProperty('--btn-y', `${(y / rect.height) * strength}px`);
    };

    const reset = () => {
      btn.style.setProperty('--btn-x', '0px');
      btn.style.setProperty('--btn-y', '0px');
    };

    btn.addEventListener('pointermove', onMove);
    btn.addEventListener('pointerleave', reset);
  });
};
