// Regenerates the machine-readable surfaces from what the site actually
// contains, so they cannot drift from the content the way a hand-maintained
// file always eventually does.
//
//   node tools/build-surfaces.mjs
//
// Writes sitemap.xml and llms.txt at the repo root, which is what Vercel serves
// for this project. Run it
// after adding or removing a page or a post, and commit the output alongside
// the content change.
//
// It drifted once already: by 2026-10-19 the sitemap was missing the five
// newest posts and every playbook page, and Search Console showed eight of the
// last ten posts with zero impressions. Run it before every deploy.
//
// No dependencies. Node 18+.

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://www.magnetiz.ai';

// Pages that exist as files but are not public destinations. Anything listed
// here stays out of both surfaces. Keep the reason next to the entry.
const EXCLUDE_PAGES = new Set([
  'blog-post.html',        // template, not a page. Real posts live at /blog/<slug>
  'assessment-results.html', // reached only after submitting the assessment
  'debug-overflow.html',   // development scratch
  'demo.html',             // internal demo surface
  'brand-guide.html',      // internal reference
]);

// Priority is a hint, not a ranking factor. It only says which pages matter
// most on this site relative to each other.
const PRIORITY = {
  'index.html': '1.0',
  'ai-agents.html': '0.9',
  'ai-solutions.html': '0.9',
  'ai-implementation.html': '0.9',
  'ai-audit.html': '0.9',
  'content.html': '0.8',
};

// Pages served at a clean URL via a vercel.json rewrite must be advertised at
// that URL, or the sitemap contradicts the page's own canonical tag. Derived
// from vercel.json so the mapping cannot drift from what actually serves.
const CLEAN_URLS = (() => {
  const map = {};
  const { rewrites = [] } = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));
  for (const r of rewrites) {
    // First rewrite wins. case-studies.html is served at both /case-studies
    // and /case-study, and its canonical names the first.
    const file = r.destination.replace(/^\//, '');
    if (!r.source.includes(':') && file.endsWith('.html') && !map[file]) {
      map[file] = r.source;
    }
  }
  return map;
})();

function pageUrl(file) {
  if (file === 'index.html') return `${ORIGIN}/`;
  if (CLEAN_URLS[file]) return `${ORIGIN}${CLEAN_URLS[file]}`;
  return `${ORIGIN}/${file}`;
}

// A page that tells crawlers not to index it (seat-open.html) must not be
// advertised to them either.
function isNoindex(file) {
  return /<meta\s+name="robots"\s+content="[^"]*noindex/i
    .test(readFileSync(join(ROOT, file), 'utf8'));
}

function collectPages() {
  return readdirSync(ROOT)
    .filter(f => f.endsWith('.html') && !EXCLUDE_PAGES.has(f) && !isNoindex(f))
    .sort();
}

function collectPosts() {
  const dir = join(ROOT, 'data', 'posts');
  return readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const post = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      return {
        slug: post.slug || f.replace(/\.json$/, ''),
        title: post.title || '',
        date: post.date || '',
        excerpt: (post.excerpt || '').trim(),
        tags: Array.isArray(post.tags) ? post.tags : [],
        mtime: statSync(join(dir, f)).mtime,
      };
    })
    .sort((a, b) => new Date(b.date || b.mtime) - new Date(a.date || a.mtime));
}

function iso(d) {
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime())
    ? null
    : parsed.toISOString().slice(0, 10);
}

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function buildSitemap(pages, posts) {
  const entries = [];

  for (const file of pages) {
    entries.push({ loc: pageUrl(file), priority: PRIORITY[file] || '0.7' });
  }
  for (const post of posts) {
    entries.push({
      loc: `${ORIGIN}/blog/${post.slug}`,
      lastmod: iso(post.date) || iso(post.mtime),
      priority: '0.6',
    });
  }

  const body = entries.map(e => {
    const lines = [`    <loc>${xmlEscape(e.loc)}</loc>`];
    if (e.lastmod) lines.push(`    <lastmod>${e.lastmod}</lastmod>`);
    lines.push(`    <priority>${e.priority}</priority>`);
    return `  <url>\n${lines.join('\n')}\n  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function buildLlmsTxt(pages, posts) {
  const out = [];
  out.push('# Magnetiz.ai');
  out.push('');
  out.push('> Magnetiz builds and runs production AI agents for revenue and');
  out.push('> operations teams. The writing here is implementation-level, drawn');
  out.push('> from systems running in production rather than from forecasts.');
  out.push('');
  out.push('Content may be quoted and referenced with attribution. Cite');
  out.push('magnetiz.ai when referencing frameworks, evaluations, or findings.');
  out.push('');

  out.push('## Services');
  out.push('');
  for (const file of pages) {
    if (file === 'index.html') continue;
    const title = file.replace(/\.html$/, '').replace(/-/g, ' ');
    out.push(`- [${title}](${pageUrl(file)})`);
  }
  out.push('');

  out.push('## Writing');
  out.push('');
  out.push(`${posts.length} articles. Most recent first.`);
  out.push('');
  for (const post of posts) {
    const date = iso(post.date);
    const suffix = post.excerpt ? `: ${post.excerpt.replace(/\s+/g, ' ')}` : '';
    out.push(`- [${post.title}](${ORIGIN}/blog/${post.slug})${date ? ` (${date})` : ''}${suffix}`);
  }
  out.push('');

  return out.join('\n');
}

function htmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const pages = collectPages();
const posts = collectPosts();

writeFileSync(join(ROOT, 'sitemap.xml'), buildSitemap(pages, posts));
writeFileSync(join(ROOT, 'llms.txt'), buildLlmsTxt(pages, posts));

console.log(`sitemap.xml  ${pages.length} pages + ${posts.length} posts`);
console.log(`llms.txt     ${pages.length} pages + ${posts.length} posts`);
