(() => {
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const formatTime = (seconds) => {
    const value = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(value / 60);
    const secs = value % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const pauseAllMedia = (current) => {
    const media = document.querySelectorAll('audio, video');
    media.forEach((item) => {
      if (current && item === current) return;
      if (item.paused) return;
      try {
        item.pause();
      } catch (err) {
        // Ignore media elements that refuse to pause.
      }
    });
  };

  const initMenu = () => {
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

  const initScrollSpy = () => {
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

  const initHeroPlayer = () => {
    const player = qs('[data-player="hero"]');
    if (!player) return;

    const audio = qs('[data-hero-audio]', player);
    const playBtn = qs('[data-hero-play]', player);
    const playIcon = qs('[data-hero-icon]', player);
    const playLabel = qs('[data-hero-label]', player);
    const current = qs('[data-hero-current]', player);
    const duration = qs('[data-hero-duration]', player);
    const seek = qs('[data-hero-seek]', player);
    const volume = qs('[data-hero-volume]', player);
    const errorSlot = player.querySelector('.audio-player__error');

    if (!audio || !playBtn || !playIcon || !playLabel || !current || !duration || !seek || !volume) return;

    const setPlaying = (isPlaying) => {
      playBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
      playIcon.textContent = isPlaying ? '❚❚' : '▶';
      playLabel.textContent = isPlaying ? 'Pauza' : 'Přehrát ukázku';
      player.classList.toggle('is-playing', isPlaying);
    };

    const setError = (message) => {
      playBtn.disabled = true;
      playLabel.textContent = message;
      if (errorSlot) errorSlot.textContent = 'Audio není dostupné.';
    };

    seek.disabled = true;
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');

    audio.addEventListener('loadedmetadata', () => {
      duration.textContent = formatTime(audio.duration);
      seek.disabled = false;
    });

    audio.addEventListener('timeupdate', () => {
      current.textContent = formatTime(audio.currentTime);
      if (audio.duration) {
        seek.value = ((audio.currentTime / audio.duration) * 100).toFixed(2);
      }
    });

    audio.addEventListener('play', () => {
      setPlaying(true);
      pauseAllMedia(audio);
    });
    audio.addEventListener('pause', () => setPlaying(false));
    audio.addEventListener('ended', () => setPlaying(false));
    audio.addEventListener('error', () => setError('Soubor nejde přehrát.'));

    seek.addEventListener('input', () => {
      if (!audio.duration) return;
      audio.currentTime = (seek.value / 100) * audio.duration;
    });

    volume.addEventListener('input', () => {
      audio.volume = parseFloat(volume.value);
    });

    playBtn.addEventListener('click', async () => {
      try {
        if (audio.paused) {
          pauseAllMedia(audio);
          await audio.play();
        } else {
          audio.pause();
        }
      } catch (err) {
        console.debug('Audio play blocked:', err);
      }
    });

    ['pointerdown', 'keydown'].forEach((eventName) => {
      window.addEventListener(
        eventName,
        () => {
          audio.play().then(() => audio.pause()).catch(() => {});
        },
        { once: true }
      );
    });

    audio.volume = parseFloat(volume.value || '0.8');
    setPlaying(false);
  };

  const initTrackPlayers = () => {
    const cards = qsa('[data-track]');
    if (!cards.length) return;

    cards.forEach((card) => {
      const audio = card.querySelector('audio');
      const playBtn = card.querySelector('[data-role="track-play"]');
      const current = card.querySelector('[data-role="track-current"]');
      const duration = card.querySelector('[data-role="track-duration"]');
      const seek = card.querySelector('[data-role="track-seek"]');

      if (!audio || !playBtn || !current || !duration || !seek) return;

      const setPlaying = (isPlaying) => {
        playBtn.textContent = isPlaying ? '❚❚' : '▶';
        playBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
        card.classList.toggle('is-playing', isPlaying);
      };

      seek.disabled = true;
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');

      audio.addEventListener('loadedmetadata', () => {
        duration.textContent = formatTime(audio.duration);
        seek.disabled = false;
      });

      audio.addEventListener('timeupdate', () => {
        current.textContent = formatTime(audio.currentTime);
        if (audio.duration) {
          seek.value = (audio.currentTime / audio.duration) * 100;
        }
      });

      audio.addEventListener('play', () => {
        setPlaying(true);
        pauseAllMedia(audio);
      });

      audio.addEventListener('pause', () => setPlaying(false));
      audio.addEventListener('ended', () => setPlaying(false));

      playBtn.addEventListener('click', () => {
        if (audio.paused) {
          pauseAllMedia(audio);
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
      });

      seek.addEventListener('input', () => {
        if (!audio.duration) return;
        audio.currentTime = (seek.value / 100) * audio.duration;
      });

      audio.addEventListener('error', () => {
        duration.textContent = '—';
        playBtn.disabled = true;
        seek.disabled = true;

        if (!card.querySelector('.track-card__error')) {
          const err = document.createElement('span');
          err.className = 'track-card__error';
          err.textContent = 'Soubor se nepodařilo načíst.';
          card.appendChild(err);
        }
      });

      setPlaying(false);
    });
  };

  const initGallery = () => {
    const items = qsa('[data-gallery]');
    if (!items.length) return;

    const data = items.map((item) => ({
      src: item.dataset.src,
      title: item.dataset.title || ''
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
            <img alt="" />
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
      const img = dialog.querySelector('img');
      const controls = dialog.querySelector('.media-modal__controls');
      const counter = dialog.querySelector('.media-modal__counter');
      const prevBtn = dialog.querySelector('[data-step="-1"]');
      const nextBtn = dialog.querySelector('[data-step="1"]');

      const total = data.length;
      const canNavigate = total > 1;

      if (controls) controls.hidden = !canNavigate;
      if (prevBtn) prevBtn.disabled = !canNavigate;
      if (nextBtn) nextBtn.disabled = !canNavigate;

      const update = (nextIndex) => {
        index = (nextIndex + total) % total;
        const item = data[index];
        if (!item || !item.src || !img) return;

        img.src = item.src;
        img.alt = item.title || 'Detail';

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

  const initVideos = () => {
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

  const initEvents = () => {
    const wrap = qs('#eventsList');
    if (!wrap) return;

    const eventsData = [
      {
        date: '2025-02-10',
        city: 'Praha',
        venue: 'Holešovice',
        title: 'Studio session / poslechovka',
        note: 'Malý listening večer, jen pro pozvané.'
      },
      {
        date: '2025-03-05',
        city: 'Plzeň',
        venue: 'Klub Panorama',
        title: 'Live show',
        note: 'Set s novým materiálem + hosté.'
      },
      {
        date: '2026-01-15',
        city: 'Praha',
        venue: 'SaSaZu Club',
        title: 'Tour',
        note: 'Věci z alba + hosté.'
      },
      {
        date: '2026-02-14',
        city: 'Brno',
        venue: 'Sono Music Club',
        title: 'Tour',
        note: 'Věci z alba + hosté.'
      }
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fmtDate = new Intl.DateTimeFormat('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const sorted = eventsData.slice().sort((a, b) => new Date(a.date) - new Date(b.date));

    if (!sorted.length) {
      wrap.innerHTML = '<p class="muted">Zatím nejsou vypsané žádné akce.</p>';
      return;
    }

    sorted.forEach((event, index) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      const isUpcoming = !Number.isNaN(eventDate.getTime()) && eventDate >= today;

      const card = document.createElement('article');
      card.className = 'event-card glass is-interactive reveal';
      card.setAttribute('data-delay', String(index * 60));

      card.innerHTML = `
        <div class="event-meta">
          <span>${fmtDate.format(eventDate)}</span>
          ${event.city ? `<span>${event.city}${event.venue ? ' — ' + event.venue : ''}</span>` : ''}
          ${isUpcoming ? '<span class="event-label">Nadcházející</span>' : ''}
        </div>
        <h3 class="event-title">${event.title || ''}</h3>
        ${event.note ? `<p class="event-note">${event.note}</p>` : ''}
      `;

      wrap.appendChild(card);
    });
  };

  const initForm = () => {
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

  const initReveal = () => {
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

  const initGlassEffects = () => {
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

  const initCursorGlow = () => {
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

  const initScrollProgress = () => {
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

  const initMagneticButtons = () => {
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

  const initAll = () => {
    if (window.__ksnInitDone) return;
    window.__ksnInitDone = true;

    document.documentElement.classList.add('js');
    initScrollProgress();
    initMenu();
    initScrollSpy();
    initHeroPlayer();
    initTrackPlayers();
    initGallery();
    initVideos();
    initEvents();
    initForm();
    initReveal();
    initGlassEffects();
    initCursorGlow();
    initMagneticButtons();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
