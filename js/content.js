/* ==========================================================
   CONTENT HUB — Blog Listing Logic
   Fetches manifest, renders hero/grid, handles pagination
   ========================================================== */

(function () {
  'use strict';

  const POSTS_PER_PAGE = 12;
  let allPosts = [];
  let currentPage = 1;

  // DOM refs
  const heroContainer = document.getElementById('content-hero');
  const gridContainer = document.getElementById('blog-grid');
  const paginationContainer = document.getElementById('blog-pagination');
  const gridCount = document.getElementById('blog-grid-count');

  // --- Fetch manifest ---
  async function init() {
    try {
      const res = await fetch('data/posts.json');
      if (!res.ok) throw new Error('Failed to load posts');
      allPosts = await res.json();
      renderHero();
      renderGrid();
      renderPagination();
    } catch (err) {
      console.error('Content Hub error:', err);
      if (heroContainer) {
        heroContainer.innerHTML = '<div class="blog-empty">// Error loading posts. Please try again later.</div>';
      }
    }
  }

  // --- Format date ---
  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // --- Render tags ---
  function renderTags(tags, cls) {
    return tags.map(function (t) {
      return '<span class="' + cls + '">' + t + '</span>';
    }).join('');
  }

  // --- Render Hero (Latest Post + Featured Sidebar) ---
  function renderHero() {
    if (!heroContainer || allPosts.length === 0) return;

    var latest = allPosts[0];
    var featured = allPosts.filter(function (p) { return p.featured; }).slice(0, 6);

    var featuredItems = featured.map(function (p) {
      return '<li class="featured-item">' +
        '<span class="featured-item-icon">&rsaquo;</span>' +
        '<div class="featured-item-content">' +
          '<a href="/blog/' + p.slug + '" class="featured-item-title">' + p.title + '</a>' +
          '<span class="featured-item-date">' + formatDate(p.date) + '</span>' +
        '</div>' +
      '</li>';
    }).join('');

    heroContainer.innerHTML =
      '<div class="latest-post reveal">' +
        '<img src="' + latest.image + '" alt="' + latest.title + '" class="latest-post-image" loading="lazy">' +
        '<div class="latest-post-body">' +
          '<div class="latest-post-meta">' +
            '<span class="latest-post-date">' + formatDate(latest.date) + '</span>' +
            '<span>' + latest.author + '</span>' +
          '</div>' +
          '<h2><a href="/blog/' + latest.slug + '">' + latest.title + '</a></h2>' +
          '<p class="latest-post-excerpt">' + latest.excerpt + '</p>' +
          '<div class="latest-post-tags">' + renderTags(latest.tags, 'tag-badge') + '</div>' +
          '<a href="/blog/' + latest.slug + '" class="read-link">Read</a>' +
        '</div>' +
      '</div>' +
      '<div class="featured-sidebar reveal reveal-delay-1">' +
        '<div class="terminal">' +
          '<div class="terminal-header">' +
            '<div class="terminal-dots">' +
              '<span class="terminal-dot red"></span>' +
              '<span class="terminal-dot yellow"></span>' +
              '<span class="terminal-dot green"></span>' +
            '</div>' +
            '<span class="terminal-title">featured/ &mdash; magnetiz</span>' +
          '</div>' +
          '<div class="terminal-body">' +
            '<ul class="featured-list">' + featuredItems + '</ul>' +
          '</div>' +
          '<div class="terminal-status">' +
            '<div class="status-group">' +
              '<span>STATUS: <span class="status-ready">LIVE</span></span>' +
              '<span>POSTS: <span style="color:var(--accent-blue)">' + allPosts.length + '</span></span>' +
            '</div>' +
            '<span>' + featured.length + ' featured</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // --- Render Grid ---
  function renderGrid() {
    if (!gridContainer) return;

    // Grid posts exclude the hero (index 0)
    var gridPosts = allPosts.slice(1);
    var totalPages = Math.ceil(gridPosts.length / POSTS_PER_PAGE);
    var start = (currentPage - 1) * POSTS_PER_PAGE;
    var pagePosts = gridPosts.slice(start, start + POSTS_PER_PAGE);

    if (gridCount) {
      gridCount.textContent = gridPosts.length + ' posts';
    }

    if (pagePosts.length === 0) {
      gridContainer.innerHTML = '<div class="blog-empty">// No posts found.</div>';
      return;
    }

    gridContainer.innerHTML = pagePosts.map(function (post, i) {
      var delay = Math.min(Math.floor(i / 3) + 1, 4);
      return '<article class="blog-card reveal reveal-delay-' + delay + '">' +
        '<a href="/blog/' + post.slug + '">' +
          '<img src="' + post.image + '" alt="' + post.title + '" class="blog-card-image" loading="lazy">' +
        '</a>' +
        '<div class="blog-card-body">' +
          '<div class="blog-card-meta">' +
            '<span class="blog-card-date">' + formatDate(post.date) + '</span>' +
            '<span>' + post.author + '</span>' +
          '</div>' +
          '<h3><a href="/blog/' + post.slug + '">' + post.title + '</a></h3>' +
          '<p class="blog-card-excerpt">' + post.excerpt + '</p>' +
          '<div class="blog-card-tags">' + renderTags(post.tags, 'tag-badge') + '</div>' +
        '</div>' +
      '</article>';
    }).join('');

    // Re-trigger scroll reveal for new cards
    initScrollReveal();
  }

  // --- Render Pagination ---
  function renderPagination() {
    if (!paginationContainer) return;

    var gridPosts = allPosts.slice(1);
    var totalPages = Math.ceil(gridPosts.length / POSTS_PER_PAGE);

    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    var html = '';

    // Prev button
    html += '<button class="pagination-btn" data-page="prev"' +
      (currentPage === 1 ? ' disabled' : '') + '>&laquo; Prev</button>';

    // Page numbers
    for (var p = 1; p <= totalPages; p++) {
      html += '<button class="pagination-btn' +
        (p === currentPage ? ' active' : '') +
        '" data-page="' + p + '">' + p + '</button>';
    }

    // Next button
    html += '<button class="pagination-btn" data-page="next"' +
      (currentPage === totalPages ? ' disabled' : '') + '>Next &raquo;</button>';

    paginationContainer.innerHTML = html;

    // Bind events
    paginationContainer.querySelectorAll('.pagination-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var page = this.getAttribute('data-page');
        if (page === 'prev') {
          if (currentPage > 1) currentPage--;
        } else if (page === 'next') {
          var total = Math.ceil((allPosts.length - 1) / POSTS_PER_PAGE);
          if (currentPage < total) currentPage++;
        } else {
          currentPage = parseInt(page, 10);
        }
        renderGrid();
        renderPagination();
        // Scroll to grid
        var gridSection = document.getElementById('blog-grid-section');
        if (gridSection) {
          gridSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // --- Scroll reveal for dynamically added elements ---
  function initScrollReveal() {
    var reveals = document.querySelectorAll('.reveal:not(.revealed)');
    if (!reveals.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) { observer.observe(el); });
  }

  // --- Launch ---
  document.addEventListener('DOMContentLoaded', init);
})();
