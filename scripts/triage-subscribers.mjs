#!/usr/bin/env node
/**
 * Score beehiiv subscribers for bot likelihood.
 *
 * Usage: node scripts/triage-subscribers.mjs <export.csv> [--out review.csv]
 *
 * Accepts either beehiiv export shape (the short website export with
 * Email/Subscribed/Status, or the full export with email/created_at/status).
 * Emits one row per subscriber with a score, the signals that fired, and a
 * recommended action. Recommends, never deletes.
 */
import fs from 'fs';

const [, , inputPath, ...rest] = process.argv;
if (!inputPath) {
  console.error('usage: triage-subscribers.mjs <export.csv> [--out review.csv]');
  process.exit(1);
}
const outIdx = rest.indexOf('--out');
const outPath = outIdx >= 0 ? rest[outIdx + 1] : null;

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

function normalizeEmail(email) {
  const lower = String(email).trim().toLowerCase();
  const at = lower.lastIndexOf('@');
  if (at < 1) return lower;
  let local = lower.slice(0, at);
  const domain = lower.slice(at + 1);
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return `${local.split('+')[0].replace(/\./g, '')}@gmail.com`;
  }
  return `${local.split('+')[0]}@${domain}`;
}

const VOWELS = /[aeiouy]/;

/** Random-looking strings have long runs with no vowel and few real words. */
function looksRandom(local) {
  const stripped = local.replace(/[^a-z]/g, '');
  if (stripped.length < 6) return false;
  const chunks = local.split(/[._-]+/).filter(Boolean);
  const vowelless = chunks.filter((c) => c.length >= 3 && !VOWELS.test(c)).length;
  const alternating = /^(?:[bcdfghjklmnpqrstvwxz][aeiou]){4,}/.test(stripped);
  return vowelless >= 2 || alternating;
}

const text = fs.readFileSync(inputPath, 'utf8');
const rows = parseCsv(text);
const header = rows[0].map((h) => h.trim().toLowerCase());
const col = (...names) => {
  for (const n of names) { const i = header.indexOf(n); if (i >= 0) return i; }
  return -1;
};
const iEmail = col('email');
const iDate = col('subscribed', 'created_at');
const iStatus = col('status');
if (iEmail < 0) { console.error('no email column found in', header.join(',')); process.exit(1); }

const records = rows.slice(1).map((r) => ({
  email: (r[iEmail] || '').trim().toLowerCase(),
  date: iDate >= 0 ? (r[iDate] || '').trim().slice(0, 10) : '',
  status: iStatus >= 0 ? (r[iStatus] || '').trim().toLowerCase() : ''
})).filter((r) => r.email.includes('@'));

// Collisions: several addresses that are really one inbox.
const byInbox = new Map();
for (const r of records) {
  const n = normalizeEmail(r.email);
  byInbox.set(n, (byInbox.get(n) || 0) + 1);
}
// Bursts: how many signups landed on each calendar day.
const byDay = new Map();
for (const r of records) if (r.date) byDay.set(r.date, (byDay.get(r.date) || 0) + 1);

const scored = records.map((r) => {
  const local = r.email.slice(0, r.email.lastIndexOf('@'));
  const domain = r.email.slice(r.email.lastIndexOf('@') + 1);
  const isGmail = domain === 'gmail.com' || domain === 'googlemail.com';
  const dots = (local.match(/\./g) || []).length;
  const signals = [];
  let score = 0;

  // Gmail ignores dots, so heavy dotting is deliberate obfuscation, not a name.
  if (isGmail && dots >= 4) { score += 45; signals.push(`gmail-dots(${dots})`); }
  else if (isGmail && dots === 3) { score += 40; signals.push('gmail-dots(3)'); }
  else if (isGmail && dots >= 2 && /\.[a-z]\./.test(local)) { score += 35; signals.push('gmail-single-char-segments'); }

  // Real names rarely split into several one or two character pieces.
  const shortSegments = local.split(/[._-]+/).filter((c) => c.length > 0 && c.length <= 2).length;
  if (isGmail && dots >= 2 && shortSegments >= 2) { score += 20; signals.push(`short-segments(${shortSegments})`); }

  if (looksRandom(local)) { score += 30; signals.push('random-local-part'); }
  if (/\d{2,}$/.test(local) && isGmail && dots >= 2) { score += 10; signals.push('trailing-digits'); }
  if (r.status === 'invalid') { score += 40; signals.push('beehiiv-invalid'); }
  if (r.status === 'inactive') { score += 5; signals.push('inactive'); }

  const inboxCount = byInbox.get(normalizeEmail(r.email)) || 1;
  if (inboxCount > 1) { score += 35; signals.push(`same-inbox-x${inboxCount}`); }

  const dayCount = byDay.get(r.date) || 0;
  if (dayCount >= 10) { score += 15; signals.push(`burst-day(${dayCount})`); }

  const action = score >= 70 ? 'REMOVE' : score >= 40 ? 'REVIEW' : 'KEEP';
  return { ...r, score, action, signals: signals.join(' ') };
});

scored.sort((a, b) => b.score - a.score || a.email.localeCompare(b.email));

const counts = scored.reduce((acc, r) => { acc[r.action] = (acc[r.action] || 0) + 1; return acc; }, {});
const out = ['email,subscribed,status,score,action,signals']
  .concat(scored.map((r) => [r.email, r.date, r.status, r.score, r.action, `"${r.signals}"`].join(',')))
  .join('\n');

if (outPath) { fs.writeFileSync(outPath, out + '\n'); console.error(`wrote ${outPath}`); }
else console.log(out);

console.error(`\n${records.length} subscribers scored`);
console.error(`  REMOVE (>=70, high confidence bot): ${counts.REMOVE || 0}`);
console.error(`  REVIEW (40-69, your call):          ${counts.REVIEW || 0}`);
console.error(`  KEEP   (<40, looks human):          ${counts.KEEP || 0}`);
