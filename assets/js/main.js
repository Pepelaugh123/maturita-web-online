import { initMenu } from './modules/menu.js';
import { initScrollSpy } from './modules/scrollspy.js';
import { initHeroPlayer } from './modules/hero-player.js';
import { initTrackPlayers } from './modules/tracks.js';
import { initGallery } from './modules/gallery.js';
import { initVideos } from './modules/videos.js';
import { initEvents } from './modules/events.js';
import { initForm } from './modules/form.js';
import { initReveal } from './modules/reveal.js';
import { initCursorGlow, initGlassEffects, initMagneticButtons, initScrollProgress } from './modules/effects.js';

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
