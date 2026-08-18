/* ============================================
   Rotating switcher
   Any [data-switch] block with .m-switch-tab
   buttons and .m-switch-panel panels.

   Auto-advances only while the block is in
   view. Clicking a tab jumps and restarts the
   timer. Arrow keys move between tabs. Honours
   prefers-reduced-motion by not auto-advancing.
   ============================================ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initSwitch(root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('.m-switch-tab'));
    var panels = Array.prototype.slice.call(root.querySelectorAll('.m-switch-panel'));
    if (!tabs.length || tabs.length !== panels.length) return;

    var durationRaw = getComputedStyle(root).getPropertyValue('--m-switch-duration').trim();
    var duration = parseFloat(durationRaw) * (durationRaw.indexOf('ms') > -1 ? 1 : 1000);
    if (!duration || isNaN(duration)) duration = 7000;

    var active = 0;
    var timer = null;
    var inView = false;

    function show(i) {
      active = i;
      tabs.forEach(function (t, n) {
        var on = n === i;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) {
          // restart the CSS fill animation
          var bar = t.querySelector('.m-switch-progress');
          if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
        }
      });
      panels.forEach(function (p, n) { p.classList.toggle('is-active', n === i); });
    }

    function stop() { if (timer) { clearTimeout(timer); timer = null; } }

    function schedule() {
      stop();
      if (!inView || REDUCED || tabs.length < 2) return;
      timer = setTimeout(function () {
        show((active + 1) % tabs.length);
        schedule();
      }, duration);
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(i); schedule(); });
      t.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        if (next === null) return;
        e.preventDefault();
        show(next);
        tabs[next].focus();
        schedule();
      });
    });

    // Pause while off screen so the timer does not run through the whole page.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          inView = e.isIntersecting;
          if (inView) { schedule(); } else { stop(); }
        });
      }, { threshold: 0.3 }).observe(root);
    } else {
      inView = true;
      schedule();
    }

    // Stop cycling while a tab has keyboard focus or the pointer is over it.
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', schedule);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', schedule);
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-switch]'), initSwitch);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* ============================================
   Ambient loop videos (.m-video video)
   Play while in view, pause off screen.
   Chrome defers offscreen muted autoplay and
   does not always resume it, so ownership of
   play/pause lives here.
   ============================================ */
(function () {
  'use strict';

  function init() {
    var vids = Array.prototype.slice.call(document.querySelectorAll('.m-video video'));
    if (!vids.length) return;
    var inView = new WeakSet();
    function sync(v) {
      if (inView.has(v) && !document.hidden) { v.play().catch(function () {}); } else { v.pause(); }
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { inView.add(e.target); } else { inView.delete(e.target); }
          sync(e.target);
        });
      }, { threshold: 0.3 });
      vids.forEach(function (v) { io.observe(v); });
    } else {
      vids.forEach(function (v) { inView.add(v); sync(v); });
    }
    // Chrome pauses muted video in hidden documents; resume on return.
    document.addEventListener('visibilitychange', function () {
      vids.forEach(sync);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
