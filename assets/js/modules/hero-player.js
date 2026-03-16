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

  ['loadedmetadata', 'loadeddata', 'durationchange', 'canplay', 'canplaythrough'].forEach((eventName) => {
    audio.addEventListener(eventName, syncDuration);
  });

  audio.addEventListener('timeupdate', () => {
    const total = getSafeDuration();
    current.textContent = formatTime(audio.currentTime);

    if (total > 0) {
      duration.textContent = formatTime(total);
      seek.disabled = false;
      seek.value = ((audio.currentTime / total) * 100).toFixed(2);
    }
  });

  audio.addEventListener('play', () => {
    setPlaying(true);
    pauseAllMedia(audio);
  });

  audio.addEventListener('pause', () => setPlaying(false));
  audio.addEventListener('ended', () => setPlaying(false));
  audio.addEventListener('error', () => setError('Soubor nejde přehrát.'));

  const seekToPosition = () => {
    const total = getSafeDuration();
    if (!total) return;
    audio.currentTime = (parseFloat(seek.value) / 100) * total;
  };

  seek.addEventListener('input', seekToPosition);
  seek.addEventListener('change', seekToPosition);

 volume.addEventListener('input', () => {
  try {
    audio.volume = parseFloat(volume.value);
  } catch (err) {
    console.debug('Volume control not supported on this device:', err);
  }
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

  if (audio.readyState >= 1) {
    syncDuration();
  } else {
    audio.load();
  }
};