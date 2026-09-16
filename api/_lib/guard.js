// Bot protection shared by the public form endpoints.
//
// Written 2026-09-16 after the newsletter form took 53 submissions in 24 hours
// against a baseline of 38 in the prior three months. The endpoint had no
// origin check, no rate limit, and no challenge, so it could be driven
// directly with curl. Because subscribe.js also asked beehiiv to send a
// welcome email, every bot submission put mail from the Magnetiz sending
// domain into an inbox that never asked for it.
//
// Four independent gates run before any beehiiv call. They are ordered
// cheapest first so an obvious script costs us nothing.

const ALLOWED_ORIGINS = new Set([
  'https://magnetiz.ai',
  'https://www.magnetiz.ai'
]);

// Field name reads as legitimate to a form-filling bot and is hidden from
// humans in CSS. Anything in it is a bot.
export const HONEYPOT_FIELD = 'company_website';

// A human reads the section, types an email, and clicks. Under 1.5s means the
// page was scripted. Over an hour means a stale page being replayed.
const MIN_FILL_MS = 1500;
const MAX_FILL_MS = 60 * 60 * 1000;

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'temp-mail.org', 'throwawaymail.com', 'yopmail.com', 'trashmail.com',
  'sharklasers.com', 'getnada.com', 'dispostable.com', 'maildrop.cc',
  'fakeinbox.com', 'mailnesia.com', 'tempr.email', 'emailondeck.com'
]);

// Per-instance only. Vercel reuses a warm instance across requests, so this
// catches a burst hitting one instance but is not a cluster-wide limit.
// Turnstile is what actually caps volume; this is a cheap extra floor.
const recentSubmissions = new Map();

function pruneRateLimit(now) {
  for (const [key, timestamps] of recentSubmissions) {
    const live = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (live.length) recentSubmissions.set(key, live);
    else recentSubmissions.delete(key);
  }
}

// Gmail ignores dots and everything after a plus, so b.o.t.1@gmail.com and
// bot1@gmail.com are one inbox. The 9/11 bot batch was almost entirely
// dot-variants, so collapsing them is what makes the rate limit bite.
export function normalizeEmail(email) {
  const lower = String(email).trim().toLowerCase();
  const at = lower.lastIndexOf('@');
  if (at < 1) return lower;
  let local = lower.slice(0, at);
  const domain = lower.slice(at + 1);
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.split('+')[0].replace(/\./g, '');
    return `${local}@gmail.com`;
  }
  return `${local.split('+')[0]}@${domain}`;
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || 'unknown';
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Fail open ONLY when the key was never configured, so shipping the guard
  // cannot take the live form down before the key is set in Vercel. An
  // invalid or missing token with a key present is always rejected.
  if (!secret) {
    console.warn('[guard] TURNSTILE_SECRET_KEY unset, challenge gate skipped');
    return { ok: true, skipped: true };
  }

  if (!token) return { ok: false, reason: 'challenge_missing' };

  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== 'unknown') body.append('remoteip', ip);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const data = await res.json();
    if (data.success) return { ok: true };
    return { ok: false, reason: `challenge_failed:${(data['error-codes'] || []).join(',')}` };
  } catch (e) {
    // Cloudflare unreachable. Reject rather than wave everything through.
    return { ok: false, reason: 'challenge_unavailable' };
  }
}

/**
 * Run every gate against a form submission.
 * Resolves to { ok: true, email, normalized } or { ok: false, status, error, reason }.
 * `error` is what the visitor sees. `reason` is for logs only and is never
 * returned to the client, so a bot cannot learn which gate caught it.
 */
export async function guardSubmission(req, { email, requireChallenge = true } = {}) {
  const now = Date.now();

  // Gate 1: same origin. Kills every plain curl loop on its own.
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  const originOk =
    ALLOWED_ORIGINS.has(origin) ||
    (!origin && [...ALLOWED_ORIGINS].some((o) => referer.startsWith(o)));
  if (!originOk) {
    return { ok: false, status: 403, error: 'Request blocked.', reason: `origin:${origin || referer || 'none'}` };
  }

  // Gate 2: honeypot. Hidden from humans, filled by form-scraping bots.
  const honeypot = req.body?.[HONEYPOT_FIELD];
  if (honeypot) {
    return { ok: false, status: 400, error: 'Request blocked.', reason: 'honeypot' };
  }

  // Gate 3: submission timing.
  const renderedAt = Number(req.body?.rendered_at);
  if (!Number.isFinite(renderedAt)) {
    return { ok: false, status: 400, error: 'Request blocked.', reason: 'timing_missing' };
  }
  const elapsed = now - renderedAt;
  if (elapsed < MIN_FILL_MS || elapsed > MAX_FILL_MS) {
    return { ok: false, status: 400, error: 'Request blocked.', reason: `timing:${elapsed}ms` };
  }

  // Email shape and quality.
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: 'Valid email is required', reason: 'email_shape' };
  }
  const normalized = normalizeEmail(email);
  const domain = normalized.slice(normalized.lastIndexOf('@') + 1);
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, status: 400, error: 'Please use a permanent email address.', reason: `disposable:${domain}` };
  }

  // Gate 4: rate limit, keyed on both IP and the normalized inbox.
  pruneRateLimit(now);
  const ip = clientIp(req);
  for (const key of [`ip:${ip}`, `email:${normalized}`]) {
    const hits = recentSubmissions.get(key) || [];
    if (hits.length >= RATE_LIMIT_MAX) {
      return { ok: false, status: 429, error: 'Too many attempts. Please try again later.', reason: `ratelimit:${key}` };
    }
  }

  // Gate 5: Cloudflare Turnstile. Last because it costs a network round trip.
  if (requireChallenge) {
    const challenge = await verifyTurnstile(req.body?.turnstile_token, ip);
    if (!challenge.ok) {
      return { ok: false, status: 403, error: 'Verification failed. Please refresh and try again.', reason: challenge.reason };
    }
  }

  for (const key of [`ip:${ip}`, `email:${normalized}`]) {
    recentSubmissions.set(key, [...(recentSubmissions.get(key) || []), now]);
  }

  return { ok: true, email: String(email).trim().toLowerCase(), normalized };
}
