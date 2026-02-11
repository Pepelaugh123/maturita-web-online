﻿import { qs, formatTime, pauseAllMedia } from './utils.js';

export const initHeroPlayer = () => {
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
