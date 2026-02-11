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
