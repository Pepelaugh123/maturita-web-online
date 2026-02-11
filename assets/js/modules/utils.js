export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

export const formatTime = (seconds) => {
  const value = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(value / 60);
  const secs = value % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const pauseAllMedia = (current) => {
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
