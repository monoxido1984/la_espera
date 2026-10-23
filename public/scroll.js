/**
 * scroll.js — Scrollytelling engine for SINTRA/CRESI data story
 *
 * Uses IntersectionObserver to trigger scene transitions.
 * Manages progress bar, navigation state, and scene rendering.
 */

const Scroll = (() => {
  'use strict';

  let activeScene = null;
  let sceneHandlers = {};
  let observer = null;

  // ---- Progress bar ----
  function updateProgress() {
    const bar = document.querySelector('.progress-bar');
    if (!bar) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${Math.min(100, pct)}%`;
  }

  // ---- Navigation highlight ----
  function updateNav(sceneId) {
    document.querySelectorAll('.nav button').forEach(btn => {
      const target = btn.dataset.scene;
      btn.setAttribute('aria-current', target === sceneId ? 'true' : 'false');
    });
  }

  // ---- Scene activation ----
  function activateScene(sceneId) {
    if (activeScene === sceneId) return;
    activeScene = sceneId;

    // Update step opacity
    document.querySelectorAll('.scene').forEach(el => {
      el.classList.toggle('is-active', el.dataset.scene === sceneId);
    });

    // Update nav
    updateNav(sceneId);

    // Call scene handler
    if (sceneHandlers[sceneId]) {
      sceneHandlers[sceneId](sceneId);
    }
  }

  // ---- Initialize ----
  function init(handlers) {
    sceneHandlers = handlers || {};

    // Progress bar
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    // Topbar auto-hide
    let lastScroll = 0;
    const topbar = document.querySelector('.topbar');
    if (topbar) {
      window.addEventListener('scroll', () => {
        const current = window.scrollY;
        if (current > 200) {
          topbar.classList.toggle('hidden', current > lastScroll && current - lastScroll > 5);
        } else {
          topbar.classList.remove('hidden');
        }
        lastScroll = current;
      }, { passive: true });
    }

    // Scene observer
    const scenes = document.querySelectorAll('.scene, .full-scene[data-scene]');
    observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length > 0) {
        const sceneId = visible[0].target.dataset.scene;
        if (sceneId) activateScene(sceneId);
      }
    }, {
      threshold: [0.15, 0.35, 0.55, 0.75],
      rootMargin: '-10% 0px -10% 0px',
    });

    scenes.forEach(scene => observer.observe(scene));

    // Nav clicks
    document.querySelectorAll('.nav button[data-scene]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.scene;
        const el = document.querySelector(`[data-scene="${target}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Scene entrance animations
    const enterObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          enterObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scene-enter').forEach(el => enterObserver.observe(el));

    // Initial scene
    if (scenes.length > 0) {
      const first = scenes[0].dataset.scene;
      if (first) activateScene(first);
    }
  }

  function getActiveScene() {
    return activeScene;
  }

  return { init, activateScene, getActiveScene };
})();
