// Serves the blog post page with per-post Open Graph / Twitter meta tags
// injected server-side, so crawlers (LinkedIn, X, Slack, etc.) that don't run
// JavaScript get the correct preview title, description, and image.
//
// Routed via vercel.json: /blog/:slug -> /api/og?slug=:slug
// The human-facing body is still rendered client-side by js/blog-post.js.

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');

  let slug = url.searchParams.get('slug') || '';
  if (!slug) {
    const m = url.pathname.match(/\/blog\/([^/?#]+)/);
    if (m) slug = decodeURIComponent(m[1]);
  }
  slug = slug.replace(/[^a-zA-Z0-9-]/g, '');

  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const base = `${proto}://${host}`;

  // Load the static shell. blog-post.html is NOT rewritten, so this is a plain
  // static fetch (no recursion back into this function).
  let template;
  try {
    const r = await fetch(`${base}/blog-post.html`);
    template = await r.text();
  } catch (e) {
    res.statusCode = 302;
    res.setHeader('Location', `/blog-post.html${slug ? '?slug=' + slug : ''}`);
    return res.end();
  }

  let post = null;
  if (slug) {
    try {
      const r = await fetch(`${base}/data/posts/${slug}.json`);
      if (r.ok) post = await r.json();
    } catch (e) {
      post = null;
    }
  }

  let html = template;

  if (post) {
    const image = /^https?:\/\//.test(post.image)
      ? post.image
      : `${base}/${String(post.image).replace(/^\//, '')}`;
    const title = `${post.title} — Magnetiz.ai`;
    const desc = post.excerpt || '';
    const pageUrl = `${base}/blog/${slug}`;

    const tags = [
      `<title>${esc(title)}</title>`,
      `<meta name="description" content="${esc(desc)}">`,
      `<meta property="og:title" content="${esc(title)}">`,
      `<meta property="og:description" content="${esc(desc)}">`,
      `<meta property="og:image" content="${esc(image)}">`,
      `<meta property="og:url" content="${esc(pageUrl)}">`,
      `<meta property="og:type" content="article">`,
      `<meta property="og:site_name" content="Magnetiz.ai">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${esc(title)}">`,
      `<meta name="twitter:description" content="${esc(desc)}">`,
      `<meta name="twitter:image" content="${esc(image)}">`,
    ].join('\n  ');

    // Remove the static title, description, and og:* tags, then inject fresh ones.
    html = html
      .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
      .replace(/\s*<meta\s+name="description"[^>]*>/i, '')
      .replace(/\s*<meta\s+property="og:[^"]*"[^>]*>/gi, '')
      .replace('</head>', `  ${tags}\n</head>`);
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=86400');
  return res.end(html);
}
