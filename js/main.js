/* ==========================================================
   MAGNETIZ.AI — Main Controller
   Navigation, mobile menu, initialization
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initMobileMenu();
  initAnimations(); // from animations.js
});

/* -----------------------------------------------------------
   NAVIGATION SCROLL BEHAVIOR
   Adds background + border on scroll
   ----------------------------------------------------------- */
function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  function onScroll() {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // check initial state
}

/* -----------------------------------------------------------
   MOBILE MENU TOGGLE
   ----------------------------------------------------------- */
function initMobileMenu() {
  const toggle = document.getElementById('mobile-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    menu.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  });

  // Close menu when clicking a link
  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}
