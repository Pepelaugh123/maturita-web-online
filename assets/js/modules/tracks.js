import { qsa, formatTime, pauseAllMedia } from './utils.js';

export const initTrackPlayers = () => {
  const cards = qsa('[data-track]');
  if (!cards.length) return;

  cards.forEach((card) => {
    const audio = card.querySelector('audio');
    const playBtn = card.querySelector('[data-role="track-play"]');
    const current = card.querySelector('[data-role="track-current"]');
    const duration = card.querySelector('[data-role="track-duration"]');
    const seek = card.querySelector('[data-role="track-seek"]');

    if (!audio || !playBtn || !current || !duration || !seek) return;

    const getSafeDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) return audio.duration;

      if (audio.seekable && audio.seekable.length > 0) {
        const end = audio.seekable.end(audio.seekable.length - 1);
        if (Number.isFinite(end) && end > 0) return end;
      }

      return 0;
    };

    const syncDuration = () => {
      const total = getSafeDuration();
      if (total > 0) {
        duration.textContent = formatTime(total);
        seek.disabled = false;
      }
    };

    const setPlaying = (isPlaying) => {
      playBtn.textContent = isPlaying ? '❚❚' : '▶';
      playBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
      card.classList.toggle('is-playing', isPlaying);
    };

    seek.disabled = true;
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');

    ['loadedmetadata', 'loadeddata', 'durationchange', 'canplay', 'canplaythrough'].forEach((eventName) => {
      audio.addEventListener(eventName, syncDuration);
    });

    audio.addEventListener('timeupdate', () => {
      const total = getSafeDuration();
      current.textContent = formatTime(audio.currentTime);

      if (total > 0) {
        duration.textContent = formatTime(total);
        seek.disabled = false;
        seek.value = (audio.currentTime / total) * 100;
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

    const seekToPosition = () => {
      const total = getSafeDuration();
      if (!total) return;
      audio.currentTime = (parseFloat(seek.value) / 100) * total;
    };

    seek.addEventListener('input', seekToPosition);
    seek.addEventListener('change', seekToPosition);

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

    if (audio.readyState >= 1) {
      syncDuration();
    } else {
      audio.load();
    }
  });
};