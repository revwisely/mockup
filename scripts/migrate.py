#!/usr/bin/env python3
"""
Migrate blog posts from Webflow (magnetiz-48748d.webflow.io) to local JSON system.

Fetches all /post/* URLs from the sitemap, scrapes each post page,
downloads images locally, cleans HTML, and generates JSON files.
"""

import json
import os
import re
import sys
import time
import urllib.parse
from datetime import datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup, NavigableString

# ─── Configuration ───────────────────────────────────────────────────────────

BASE_URL = "https://magnetiz-48748d.webflow.io"
SITEMAP_URL = f"{BASE_URL}/sitemap.xml"
REQUEST_DELAY = 1  # seconds between requests
TIMEOUT = 30

PROJECT_ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = PROJECT_ROOT / "data" / "posts"
IMAGES_DIR = PROJECT_ROOT / "assets" / "images" / "posts"
MANIFEST_PATH = PROJECT_ROOT / "data" / "posts.json"

# Webflow CDN path for blog-specific images (not site assets)
BLOG_CDN_PREFIX = "cdn.prod.website-files.com/6581c0148b8536b1ace565bf"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) MagnetizMigration/1.0"
}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def fetch(url):
    """Fetch a URL with retries."""
    for attempt in range(3):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
            resp.raise_for_status()
            return resp
        except requests.RequestException as e:
            if attempt == 2:
                raise
            print(f"  Retry {attempt + 1} for {url}: {e}")
            time.sleep(2)


def slugify(text):
    """Convert text to URL slug."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')


def parse_date(date_text):
    """Parse date text like 'July 17, 2025' to 'YYYY-MM-DD'."""
    date_text = date_text.strip()
    # Try various date formats
    for fmt in ["%B %d, %Y", "%b %d, %Y", "%m/%d/%Y", "%Y-%m-%d"]:
        try:
            return datetime.strptime(date_text, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    # Try to extract date pattern from text
    match = re.search(r'(\w+ \d{1,2},?\s*\d{4})', date_text)
    if match:
        for fmt in ["%B %d, %Y", "%B %d,%Y", "%b %d, %Y"]:
            try:
                return datetime.strptime(match.group(1), fmt).strftime("%Y-%m-%d")
            except ValueError:
                continue
    return None


def make_excerpt(html_content, max_len=160):
    """Generate excerpt from HTML content."""
    soup = BeautifulSoup(html_content, "lxml")
    text = soup.get_text(separator=" ", strip=True)
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    if len(text) <= max_len:
        return text
    # Cut at word boundary
    truncated = text[:max_len]
    last_space = truncated.rfind(' ')
    if last_space > 100:
        truncated = truncated[:last_space]
    return truncated.rstrip('.,;:!? ') + "..."


def download_image(url, dest_path):
    """Download an image to local path. Returns True on success."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT, stream=True)
        resp.raise_for_status()
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        with open(dest_path, 'wb') as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"  Failed to download image {url}: {e}")
        return False


def get_image_extension(url):
    """Extract file extension from image URL."""
    parsed = urllib.parse.urlparse(url)
    path = urllib.parse.unquote(parsed.path)
    ext = os.path.splitext(path)[1].lower()
    if ext in ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']:
        return ext
    return '.png'  # default


# ─── Sitemap Parsing ─────────────────────────────────────────────────────────

def get_post_urls():
    """Fetch sitemap and extract all /post/* URLs."""
    print("Fetching sitemap...")
    resp = fetch(SITEMAP_URL)
    soup = BeautifulSoup(resp.text, "lxml-xml")

    urls = []
    for loc in soup.find_all("loc"):
        url = loc.text.strip()
        # Match /post/ paths - handle both www.magnetiz.ai and webflow URLs
        parsed = urllib.parse.urlparse(url)
        if "/post/" in parsed.path:
            # Normalize to webflow URL
            slug = parsed.path.rstrip("/").split("/post/")[-1]
            if slug:
                webflow_url = f"{BASE_URL}/post/{slug}"
                urls.append((slug, webflow_url))

    print(f"Found {len(urls)} blog post URLs")
    return urls


# ─── Post Scraping ───────────────────────────────────────────────────────────

def clean_html(element):
    """Clean Webflow HTML: strip classes, styles, wrapper divs. Keep semantic tags."""
    if element is None:
        return ""

    allowed_tags = {
        'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li',
        'blockquote', 'img', 'a', 'strong', 'em', 'b', 'i',
        'code', 'pre', 'br', 'figure', 'figcaption', 'table',
        'thead', 'tbody', 'tr', 'th', 'td', 'sup', 'sub'
    }

    soup = BeautifulSoup(str(element), "lxml")
    body = soup.find("body")
    if body:
        soup = body

    # Remove script, style, noscript tags
    for tag in soup.find_all(['script', 'style', 'noscript', 'iframe']):
        tag.decompose()

    # Convert h5 headings to h2
    for h5 in soup.find_all('h5'):
        h5.name = 'h2'

    # Process all tags
    for tag in soup.find_all(True):
        if tag.name not in allowed_tags:
            # Unwrap non-allowed tags (keep their content)
            tag.unwrap()
        else:
            # Strip all attributes except specific ones
            attrs_to_keep = {}
            if tag.name == 'a' and tag.get('href'):
                href = tag['href']
                # Fix relative URLs
                if href.startswith('/'):
                    href = f"https://www.magnetiz.ai{href}"
                attrs_to_keep['href'] = href
                if tag.get('target'):
                    attrs_to_keep['target'] = tag['target']
            elif tag.name == 'img' and tag.get('src'):
                attrs_to_keep['src'] = tag['src']
                if tag.get('alt'):
                    attrs_to_keep['alt'] = tag['alt']
            tag.attrs = attrs_to_keep

    # Get cleaned HTML
    html = str(soup)
    # Remove the wrapper tags added by lxml
    html = re.sub(r'^<html><body>', '', html)
    html = re.sub(r'</body></html>$', '', html)
    html = re.sub(r'^<body>', '', html)
    html = re.sub(r'</body>$', '', html)

    # Clean up whitespace
    html = re.sub(r'\n\s*\n\s*\n', '\n\n', html)
    html = html.strip()

    return html


def scrape_post(slug, url):
    """Scrape a single blog post from Webflow."""
    resp = fetch(url)
    soup = BeautifulSoup(resp.text, "lxml")

    post = {"slug": slug}

    # ── Title ──
    h1 = soup.find("h1")
    if h1:
        post["title"] = h1.get_text(strip=True)
    else:
        post["title"] = slug.replace("-", " ").title()
        print(f"  Warning: No h1 found, using slug as title")

    # ── Date ──
    date_wrapper = soup.find(class_="blog-post-header-date-wrapper")
    if date_wrapper:
        date_div = date_wrapper.find(class_="text-size-small")
        if date_div:
            date_text = date_div.get_text(strip=True)
            parsed = parse_date(date_text)
            if parsed:
                post["date"] = parsed
            else:
                print(f"  Warning: Could not parse date '{date_text}'")

    if "date" not in post:
        # Fallback: look for date pattern in page
        page_text = soup.get_text()
        date_match = re.search(r'(\w+\s+\d{1,2},\s*\d{4})', page_text)
        if date_match:
            parsed = parse_date(date_match.group(1))
            if parsed:
                post["date"] = parsed
    if "date" not in post:
        post["date"] = "2024-01-01"
        print(f"  Warning: No date found, using default")

    # ── Hero Image ──
    hero_img_url = None
    # Look for the blog-specific CDN image in the header area
    header_section = soup.find(class_="section-blog-post-header")
    if header_section:
        # Find img with blog CDN prefix (not site asset icons)
        for img in header_section.find_all("img"):
            src = img.get("src", "")
            if BLOG_CDN_PREFIX in src:
                hero_img_url = src
                break
            # Also check srcset
            srcset = img.get("srcset", "")
            if BLOG_CDN_PREFIX in srcset:
                # Get the largest image from srcset
                parts = srcset.split(",")
                for part in reversed(parts):
                    part = part.strip()
                    src_candidate = part.split(" ")[0]
                    if BLOG_CDN_PREFIX in src_candidate:
                        hero_img_url = src_candidate
                        break
                if hero_img_url:
                    break

    if not hero_img_url:
        # Fallback: find first blog CDN image on page (skip nav/footer)
        for img in soup.find_all("img"):
            src = img.get("src", "")
            if BLOG_CDN_PREFIX in src and "Untitled%20design" not in src:
                hero_img_url = src
                break

    # Download hero image
    if hero_img_url:
        # Clean URL - remove -p-500, -p-800 etc. variants to get full size
        hero_img_url = re.sub(r'-p-\d+(\.\w+)$', r'\1', hero_img_url)
        ext = get_image_extension(hero_img_url)
        local_hero = IMAGES_DIR / f"{slug}-hero{ext}"
        if download_image(hero_img_url, local_hero):
            post["image"] = f"assets/images/posts/{slug}-hero{ext}"
        else:
            post["image"] = hero_img_url
    else:
        post["image"] = ""
        print(f"  Warning: No hero image found")

    # ── Body Content ──
    body_parts = []

    # Part 1: Intro rich text block
    intro_block = soup.find(class_="rich-text-block")
    if intro_block and "w-richtext" in (intro_block.get("class", []) if isinstance(intro_block.get("class"), list) else intro_block.get("class", "")):
        body_parts.append(str(intro_block))

    # Part 2: Main body rich text (skip the CTA/promo block)
    main_body = soup.find(class_="blog-text-rich-text")
    if main_body:
        body_parts.append(str(main_body))

    if not body_parts:
        # Fallback: find any w-richtext div
        for rt in soup.find_all(class_=re.compile(r'w-richtext')):
            text = rt.get_text(strip=True)
            if len(text) > 100:  # Skip small CTA blocks
                body_parts.append(str(rt))

    raw_body = "\n".join(body_parts)

    # Download and rewrite inline images
    body_soup = BeautifulSoup(raw_body, "lxml")
    img_counter = 0
    for img in body_soup.find_all("img"):
        src = img.get("src", "")
        if BLOG_CDN_PREFIX in src or "cdn.prod.website-files.com" in src:
            # Skip known site-wide icons/assets
            if any(skip in src for skip in ["Untitled%20design", "Logo%20in%20White"]):
                continue
            img_counter += 1
            src = re.sub(r'-p-\d+(\.\w+)$', r'\1', src)
            ext = get_image_extension(src)
            local_name = f"{slug}-{img_counter}{ext}"
            local_path = IMAGES_DIR / local_name
            if download_image(src, local_path):
                img["src"] = f"assets/images/posts/{local_name}"
            # else keep original src

    raw_body = str(body_soup)

    # Clean the HTML
    post["content"] = clean_html(raw_body)

    # ── Metadata ──
    post["author"] = "Magnetiz.ai"
    post["tags"] = []
    post["excerpt"] = make_excerpt(post["content"])

    return post


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    # Ensure directories exist
    POSTS_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    # Get all post URLs
    post_urls = get_post_urls()
    if not post_urls:
        print("ERROR: No post URLs found in sitemap!")
        sys.exit(1)

    total = len(post_urls)
    posts = []
    failed = []

    for i, (slug, url) in enumerate(post_urls, 1):
        print(f"\n[{i}/{total}] {slug}")
        try:
            post = scrape_post(slug, url)
            posts.append(post)

            # Save individual post JSON
            post_file = POSTS_DIR / f"{slug}.json"
            post_data = {
                "slug": post["slug"],
                "title": post["title"],
                "date": post["date"],
                "author": post["author"],
                "excerpt": post["excerpt"],
                "image": post["image"],
                "tags": post["tags"],
                "content": post["content"],
            }
            with open(post_file, "w", encoding="utf-8") as f:
                json.dump(post_data, f, indent=2, ensure_ascii=False)

            print(f"  OK: {post['title'][:60]}...")

        except Exception as e:
            print(f"  FAILED: {e}")
            failed.append((slug, str(e)))

        # Rate limiting
        if i < total:
            time.sleep(REQUEST_DELAY)

    # Sort posts by date (newest first)
    posts.sort(key=lambda p: p.get("date", ""), reverse=True)

    # Generate manifest (no content field, with featured field)
    manifest = []
    for i, post in enumerate(posts):
        manifest.append({
            "slug": post["slug"],
            "title": post["title"],
            "date": post["date"],
            "author": post["author"],
            "excerpt": post["excerpt"],
            "image": post["image"],
            "tags": post["tags"],
            "featured": i < 6,  # Top 6 newest are featured
        })

    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    # Summary
    print(f"\n{'='*60}")
    print(f"Migration complete!")
    print(f"  Posts migrated: {len(posts)}/{total}")
    print(f"  Posts failed:   {len(failed)}")
    print(f"  Manifest:       {MANIFEST_PATH}")
    print(f"  Posts dir:      {POSTS_DIR}")
    print(f"  Images dir:     {IMAGES_DIR}")

    if failed:
        print(f"\nFailed posts:")
        for slug, err in failed:
            print(f"  - {slug}: {err}")

    return len(failed) == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
