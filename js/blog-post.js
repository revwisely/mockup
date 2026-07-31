/* ==========================================================
   BLOG POST — Single Post Renderer
   Extracts slug from URL, fetches JSON, renders into template
   ========================================================== */

(function () {
  'use strict';

  var articleContainer = document.getElementById('blog-article');

  function getSlug() {
    // 1. Try clean URL path: /blog/slug (Vercel rewrite)
    var path = window.location.pathname;
    var parts = path.split('/blog/');
    if (parts.length > 1 && parts[1].replace(/\/$/, '')) {
      return parts[1].replace(/\/$/, '');
    }
    // 2. Fallback to query param: ?slug=slug (local dev)
    var params = new URLSearchParams(window.location.search);
    return params.get('slug');
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function renderTags(tags) {
    return tags.map(function (t) {
      return '<span class="post-tag">' + t + '</span>';
    }).join('');
  }

  // Posts store image paths relative (e.g. "assets/images/posts/x.jpeg").
  // On a clean /blog/:slug URL those would resolve to /blog/assets/... and 404,
  // so normalize to a root-absolute path. Leave full URLs untouched.
  function toAbsolute(path) {
    if (!path) return path;
    if (/^https?:\/\//.test(path) || path.charAt(0) === '/') return path;
    return '/' + path;
  }

  // Posts may carry an optional `heroVideo` (new video-in-post style). When present,
  // render a click-to-play <video> with the hero image as poster; otherwise the static image.
  function renderHero(post) {
    if (post.heroVideo) {
      return '<video class="post-featured-video" controls preload="metadata" playsinline ' +
               'poster="' + toAbsolute(post.image) + '">' +
               '<source src="' + toAbsolute(post.heroVideo) + '" type="video/mp4">' +
             '</video>';
    }
    return '<img src="' + toAbsolute(post.image) + '" alt="' + post.title + '" class="post-featured-image" loading="lazy">';
  }

  function renderPost(post) {
    // api/og.js renders the article server-side and marks the container with
    // data-ssr. When that has happened the DOM is already correct, and
    // re-rendering would only cause a visible flash while replacing markup with
    // identical markup. The ?slug= fallback path has no server render, so this
    // function still does the work there.
    if (articleContainer && articleContainer.getAttribute('data-ssr') === '1') {
      return;
    }

    // Update page title and meta
    document.title = post.title + ' — Magnetiz.ai';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', post.excerpt);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', post.title + ' — Magnetiz.ai');
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', post.excerpt);

    articleContainer.innerHTML =
      '<div class="blog-article-inner">' +
        '<div class="post-header">' +
          '<a href="/content.html" class="post-back">Content Hub</a>' +
          '<div class="post-tags">' + renderTags(post.tags) + '</div>' +
          '<h1 class="post-title">' + post.title + '</h1>' +
          '<div class="post-meta">' +
            '<span class="post-meta-author">' + post.author + '</span>' +
            '<span class="post-meta-separator">&bull;</span>' +
            '<span class="post-meta-date">' + formatDate(post.date) + '</span>' +
          '</div>' +
        '</div>' +
        renderHero(post) +
        '<div class="post-body">' + post.content + '</div>' +
        '<div class="post-footer">' +
          '<a href="/content.html" class="post-footer-back">Back to Content Hub</a>' +
        '</div>' +
      '</div>';
  }

  function renderError() {
    articleContainer.innerHTML =
      '<div class="post-error">' +
        '<h2>// 404 — Post Not Found</h2>' +
        '<p>The post you\'re looking for doesn\'t exist or has been moved.</p>' +
        '<a href="/content.html" class="btn-primary">Back to Content Hub</a>' +
      '</div>';
  }

  async function init() {
    var slug = getSlug();

    if (!slug) {
      renderError();
      return;
    }

    try {
      var res = await fetch('/data/posts/' + slug + '.json');
      if (!res.ok) throw new Error('Post not found');
      var post = await res.json();
      renderPost(post);
    } catch (err) {
      console.error('Blog post error:', err);
      renderError();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
