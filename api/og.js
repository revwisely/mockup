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

// Post images are stored relative ("assets/images/posts/x.jpeg"). On a clean
// /blog/:slug URL those resolve to /blog/assets/... and 404, so normalize.
// Mirrors toAbsolute() in js/blog-post.js.
function toAbsolute(path) {
  if (!path) return path;
  if (/^https?:\/\//.test(path) || String(path).charAt(0) === '/') return path;
  return '/' + path;
}

function formatDate(dateStr) {
  const d = new Date(String(dateStr) + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return esc(dateStr || '');
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

function renderHero(post) {
  if (post.heroVideo) {
    return `<video class="post-featured-video" controls preload="metadata" playsinline poster="${esc(toAbsolute(post.image))}">` +
           `<source src="${esc(toAbsolute(post.heroVideo))}" type="video/mp4"></video>`;
  }
  if (!post.image) return '';
  return `<img src="${esc(toAbsolute(post.image))}" alt="${esc(post.title)}" class="post-featured-image">`;
}

// A post may carry its own CTA copy: { "cta": { "title": "...", "body": "..." } }.
// Only the title and body change; the button is always Schedule Call. Function
// replacements for the same $-reference reason noted below.
function personalizeCta(ctaHtml, post) {
  const c = post && post.cta;
  if (!c) return ctaHtml;
  let out = ctaHtml;
  if (c.title) out = out.replace(/(<h2 class="post-cta-title">)[\s\S]*?(<\/h2>)/, (m, a, b) => a + esc(c.title) + b);
  if (c.body) out = out.replace(/(<p class="post-cta-body">)[\s\S]*?(<\/p>)/, (m, a, b) => a + esc(c.body) + b);
  return out;
}

// Renders the article body into the HTML the server sends.
//
// This exists because every post used to arrive at a crawler as the string
// "Loading post". The body was rendered only by js/blog-post.js, so anything
// that does not execute JavaScript, which is most answer-engine crawlers, saw
// navigation and a placeholder where 1,700 words should be. Confirmed from the
// outside: ChatGPT could not read Magnetiz posts when asked.
//
// The markup below mirrors renderPost() in js/blog-post.js exactly so the same
// CSS applies. If one changes, change the other. post.content is already HTML
// and is inserted verbatim, same as the client does.
function renderArticle(post, cta = '', related = '') {
  const tags = (Array.isArray(post.tags) ? post.tags : [])
    .map(t => `<span class="post-tag">${esc(t)}</span>`).join('');

  return `    <div class="blog-article-inner">
      <div class="post-header">
        <a href="/content.html" class="post-back">Content Hub</a>
        <div class="post-tags">${tags}</div>
        <h1 class="post-title">${esc(post.title)}</h1>
        <div class="post-meta">
          <span class="post-meta-author">${esc(post.author || '')}</span>
          <span class="post-meta-separator">&bull;</span>
          <span class="post-meta-date">${formatDate(post.date)}</span>
        </div>
      </div>
      ${renderHero(post)}
      <div class="post-body">${post.content || ''}</div>
${cta}
${related}
      <div class="post-footer">
        <a href="/content.html" class="post-footer-back">Back to Content Hub</a>
      </div>
    </div>`;
}

// Related reading, rendered on the server. Before this, a post linked only back
// to the Content Hub, so the newest posts sat one hop from nothing and Search
// Console showed eight of the last ten with zero impressions. Each post now
// links to three others and to the playbook library.
//
// Relatedness is word overlap between titles and excerpts. Crude on purpose:
// no tags are filled in, and a ranking nobody can explain is worse than a
// plain one. Recent posts break ties so new work gets linked first.
const STOP = new Set(('a an and are as at be but by can do does for from has have how ' +
  'i if in into is it its not of on or our so that the their them then there these ' +
  'this to up was we what when where which who why will with you your ai').split(' '));

function words(s) {
  return new Set(String(s || '').toLowerCase().replace(/<[^>]+>/g, ' ')
    .match(/[a-z][a-z0-9-]{2,}/g)?.filter(w => !STOP.has(w)) || []);
}

function pickRelated(post, slug, index, n = 3) {
  const mine = words(`${post.title} ${post.title} ${post.excerpt}`);
  return index
    .filter(p => p.slug !== slug)
    .map((p, i) => {
      let overlap = 0;
      for (const w of words(`${p.title} ${p.title} ${p.excerpt}`)) if (mine.has(w)) overlap++;
      return { p, overlap, i };
    })
    .sort((a, b) => b.overlap - a.overlap || a.i - b.i)
    .slice(0, n)
    .map(x => x.p);
}

function renderRelated(related) {
  if (!related.length) return '';
  const items = related.map(p =>
    `          <li><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a></li>`).join('\n');
  return `      <nav class="post-related" aria-label="Related reading">
        <h2 class="post-related-label">// Related reading</h2>
        <ul class="post-related-list">
${items}
        </ul>
        <a href="/playbooks" class="post-related-more">Browse the playbooks</a>
      </nav>`;
}

// Canonical plus BlogPosting structured data, built from fields the post JSON
// already carries. Gives an answer engine the author, date and headline as
// facts rather than as something to infer from prose.
function canonicalAndSchema(post, pageUrl, image) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || '',
    datePublished: post.date || undefined,
    image: image || undefined,
    author: { '@type': 'Person', name: post.author || 'Magnetiz.ai' },
    publisher: {
      '@type': 'Organization',
      name: 'Magnetiz.ai',
      '@id': 'https://www.magnetiz.ai/#organization',
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    keywords: Array.isArray(post.tags) ? post.tags.join(', ') : undefined,
  };
  return `<link rel="canonical" href="${esc(pageUrl)}">\n  ` +
         `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
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

  // notFound only when the post file is confirmed missing. A failed fetch keeps
  // the 200 shell so a transient error never caches a real post as a 404.
  let post = null;
  let notFound = !slug;
  if (slug) {
    try {
      const r = await fetch(`${base}/data/posts/${slug}.json`);
      if (r.ok) post = await r.json();
      else if (r.status === 404) notFound = true;
    } catch (e) {
      post = null;
    }
  }

  // The post index feeds Related reading. A failure here costs the links, never
  // the page.
  let index = [];
  if (post) {
    try {
      const r = await fetch(`${base}/data/posts.json`);
      if (r.ok) index = await r.json();
    } catch (e) {
      index = [];
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
    //
    // FUNCTION replacements, not string ones, everywhere the replacement is
    // built from post content. A string replacement interprets $&, $1, $' and
    // friends as capture references, and 59 of the 145 posts contain dollar
    // amounts like "$1 million" or "$5B" in their prose. Passing those as a
    // string silently mangles the article body. A function replacement is
    // handed the text verbatim.
    const head = `  ${tags}\n  ${canonicalAndSchema(post, pageUrl, image)}\n</head>`;
    // Same CTA the browser clones from <template id="post-cta"> in the shell.
    const ctaMatch = html.match(/<template id="post-cta">([\s\S]*?)<\/template>/i);
    const article = renderArticle(
      post,
      ctaMatch ? personalizeCta(ctaMatch[1], post) : '',
      renderRelated(pickRelated(post, slug, Array.isArray(index) ? index : [])),
    );

    html = html
      .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
      .replace(/\s*<meta\s+name="description"[^>]*>/i, '')
      .replace(/\s*<meta\s+property="og:[^"]*"[^>]*>/gi, '')
      .replace('</head>', () => head)
      .replace(
        /(<article class="blog-article" id="blog-article")([^>]*)>[\s\S]*?<\/article>/i,
        (_m, open, attrs) => `${open} data-ssr="1"${attrs}>\n${article}\n  </article>`
      );
  }

  // A slug with no post is a real 404, so search engines drop it instead of
  // indexing the empty shell under every made-up address.
  if (notFound) {
    html = html.replace('</head>', () => '  <meta name="robots" content="noindex">\n</head>');
  }

  res.statusCode = notFound ? 404 : 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', notFound ? 's-maxage=60' : 's-maxage=600, stale-while-revalidate=86400');
  return res.end(html);
}
