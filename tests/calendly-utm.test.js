// node --test tests/  (no deps)
const test = require('node:test');
const assert = require('node:assert');
const m = require('../js/calendly-utm.js');

function memStore() { const d = {}; return { getItem: k => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); } }; }

test('extractUtm maps all five utm_* params to Calendly keys', () => {
  assert.deepStrictEqual(
    m.extractUtm('?utm_source=linkedin&utm_medium=paid&utm_campaign=oct-r1-bridge&utm_content=image&utm_term=gtm&x=1'),
    { utmSource: 'linkedin', utmMedium: 'paid', utmCampaign: 'oct-r1-bridge', utmContent: 'image', utmTerm: 'gtm' });
});

test('extractUtm returns {} with no utms and ignores empty values', () => {
  assert.deepStrictEqual(m.extractUtm(''), {});
  assert.deepStrictEqual(m.extractUtm('?utm_source=&foo=bar'), {});
});

test('appendUtm builds the fallback URL', () => {
  assert.strictEqual(m.appendUtm('https://calendly.com/x/25min', { utmCampaign: 'a b', utmContent: 'x' }),
    'https://calendly.com/x/25min?utm_campaign=a%20b&utm_content=x');
  assert.strictEqual(m.appendUtm('https://calendly.com/x?y=1', { utmSource: 's' }), 'https://calendly.com/x?y=1&utm_source=s');
  assert.strictEqual(m.appendUtm('https://calendly.com/x', {}), 'https://calendly.com/x');
});

test('captureFirstTouch keeps the first UTM set across later pages', () => {
  const s = memStore();
  assert.deepStrictEqual(m.captureFirstTouch('?utm_campaign=first', s), { utmCampaign: 'first' });
  assert.deepStrictEqual(m.captureFirstTouch('', s), { utmCampaign: 'first' });
  assert.deepStrictEqual(m.captureFirstTouch('?utm_campaign=second', s), { utmCampaign: 'first' });
});

test('captureFirstTouch survives missing storage', () => {
  assert.deepStrictEqual(m.captureFirstTouch('?utm_source=li', null), { utmSource: 'li' });
});

test('bookingParams carries the first-touch utms', () => {
  assert.deepStrictEqual(m.bookingParams({ utmSource: 'linkedin', utmCampaign: 'pb14' }),
    { method: 'calendly', first_touch_source: 'linkedin', first_touch_campaign: 'pb14' });
  assert.deepStrictEqual(m.bookingParams({}), { method: 'calendly' });
});

test('onMessage sends one book_call event for a Calendly booking, and ignores everything else', () => {
  m._reset();
  const calls = [];
  const ctx = { gtag: (...a) => calls.push(a), location: { search: '?utm_source=linkedin', pathname: '/content' } };
  assert.strictEqual(m.onMessage({ origin: 'https://evil.example', data: { event: 'calendly.event_scheduled' } }, ctx), false);
  assert.strictEqual(m.onMessage({ origin: 'https://calendly.com', data: { event: 'calendly.page_height' } }, ctx), false);
  assert.strictEqual(m.onMessage({ origin: 'https://calendly.com', data: { event: 'calendly.event_scheduled' } }, ctx), true);
  assert.strictEqual(m.onMessage({ origin: 'https://calendly.com', data: { event: 'calendly.event_scheduled' } }, ctx), false);
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0][0], 'event');
  assert.strictEqual(calls[0][1], 'book_call');
  assert.strictEqual(calls[0][2].first_touch_source, 'linkedin');
});

test('onMessage does nothing when GA is not on the page', () => {
  m._reset();
  assert.strictEqual(m.onMessage({ origin: 'https://calendly.com', data: { event: 'calendly.event_scheduled' } }, { location: {} }), false);
});
