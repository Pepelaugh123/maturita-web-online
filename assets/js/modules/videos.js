import { qsa, pauseAllMedia } from './utils.js';

export const initVideos = () => {
  const items = qsa('[data-video]');
  if (!items.length) return;

  const data = items.map((item) => ({
    src: item.dataset.src,
    title: item.dataset.title || '',
    poster: item.dataset.poster || ''
  }));

  const openModal = (startIndex) => {
    const start = data[startIndex];
    if (!start || !start.src) return;
    if (!('HTMLDialogElement' in window)) {
      window.open(start.src, '_blank', 'noopener');
      return;
    }

    pauseAllMedia();
    let index = startIndex;

    const dialog = document.createElement('dialog');
    dialog.className = 'media-modal';

    dialog.innerHTML = `
      <div class="media-modal__content">
        <button class="media-modal__close" type="button" aria-label="Zavrit">&times;</button>
        <div class="media-modal__title"></div>
        <div class="media-modal__viewer">
          <video controls playsinline preload="metadata"></video>
        </div>
        <div class="media-modal__controls">
          <button class="media-modal__nav" type="button" data-step="-1" aria-label="Predchozi">&larr;</button>
          <span class="media-modal__counter"></span>
          <button class="media-modal__nav" type="button" data-step="1" aria-label="Dalsi">&rarr;</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);
    document.body.classList.add('modal-open');

    const closeBtn = dialog.querySelector('.media-modal__close');
    const titleEl = dialog.querySelector('.media-modal__title');
    const video = dialog.querySelector('video');
    const controls = dialog.querySelector('.media-modal__controls');
    const counter = dialog.querySelector('.media-modal__counter');
    const prevBtn = dialog.querySelector('[data-step="-1"]');
    const nextBtn = dialog.querySelector('[data-step="1"]');

    const total = data.length;
    const canNavigate = total > 1;

    if (controls) controls.hidden = !canNavigate;
    if (prevBtn) prevBtn.disabled = !canNavigate;
    if (nextBtn) nextBtn.disabled = !canNavigate;
    if (video) {
      video.addEventListener('play', () => pauseAllMedia(video));
    }

    const update = (nextIndex) => {
      index = (nextIndex + total) % total;
      const item = data[index];
      if (!item || !item.src || !video) return;

      video.pause();
      video.addEventListener(
        'loadeddata',
        () => {
          pauseAllMedia(video);
          video.play().catch(() => {});
        },
        { once: true }
      );
      video.setAttribute('src', item.src);
      if (item.poster) {
        video.setAttribute('poster', item.poster);
      } else {
        video.removeAttribute('poster');
      }
      video.load();

      if (titleEl) {
        titleEl.textContent = item.title;
        titleEl.hidden = !item.title;
      }

      if (counter) counter.textContent = `${index + 1} / ${total}`;
    };

    const step = (delta) => {
      if (!canNavigate) return;
      update(index + delta);
    };

    const close = () => {
      if (video) video.pause();
      try {
        dialog.close();
      } catch (err) {
        // Ignore when already closed.
      }
      document.body.classList.remove('modal-open');
      dialog.remove();
      document.removeEventListener('keydown', onKey);
    };

    const onKey = (event) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (prevBtn) prevBtn.addEventListener('click', () => step(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => step(1));
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) close();
    });
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      close();
    });
    document.addEventListener('keydown', onKey);

    update(startIndex);
    dialog.showModal();
  };

  items.forEach((item, index) => {
    item.addEventListener('click', () => {
      openModal(index);
    });
  });
};
