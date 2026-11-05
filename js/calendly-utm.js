/* Calendly UTM passthrough (Trello #577).
   Ad UTMs land on the page URL, but the Calendly popup used to open with a
   fixed URL, so a booking never learned its source. This script:
   1. reads utm_source/medium/campaign/content/term from location.search,
   2. keeps the FIRST-touch set in sessionStorage so page-to-page navigation
      does not lose it,
   3. opens the popup via Calendly.initPopupWidget({ url, utm }) (Calendly's
      documented popup API), falling back to showPopupWidget with the utm_*
      params appended to the URL.
   Pages call window.MagnetizCalendly.open(url) from their click handlers.
   The LinkedIn booking conversion (js/linkedin-insight.js) is untouched: it
   still listens for Calendly's event_scheduled postMessage. */
(function (root) {
  var KEYS = [
    ['utm_source', 'utmSource'],
    ['utm_medium', 'utmMedium'],
    ['utm_campaign', 'utmCampaign'],
    ['utm_content', 'utmContent'],
    ['utm_term', 'utmTerm']
  ];
  var STORAGE_KEY = 'magnetiz_first_touch_utm';

  // Pure: query string -> { utmSource, ... } with only the keys present.
  function extractUtm(search) {
    var out = {};
    var params;
    try { params = new URLSearchParams(search || ''); } catch (e) { return out; }
    KEYS.forEach(function (k) {
      var v = params.get(k[0]);
      if (v) out[k[1]] = v.slice(0, 200);
    });
    return out;
  }

  function hasAny(utm) {
    for (var k in utm) if (Object.prototype.hasOwnProperty.call(utm, k)) return true;
    return false;
  }

  // Pure: append utm_* params to a Calendly URL (fallback path).
  function appendUtm(url, utm) {
    var parts = [];
    KEYS.forEach(function (k) {
      if (utm[k[1]]) parts.push(k[0] + '=' + encodeURIComponent(utm[k[1]]));
    });
    if (!parts.length) return url;
    return url + (url.indexOf('?') === -1 ? '?' : '&') + parts.join('&');
  }

  function storage() {
    try { return root.sessionStorage || null; } catch (e) { return null; }
  }

  // First touch wins: store only when nothing is stored yet.
  function captureFirstTouch(search, store) {
    var current = extractUtm(search);
    var stored = null;
    try { stored = store && JSON.parse(store.getItem(STORAGE_KEY) || 'null'); } catch (e) { stored = null; }
    if (stored && hasAny(stored)) return stored;
    if (hasAny(current) && store) {
      try { store.setItem(STORAGE_KEY, JSON.stringify(current)); } catch (e) { /* private mode */ }
    }
    return current;
  }

  function open(url) {
    var loc = root.location || {};
    var utm = captureFirstTouch(loc.search, storage());
    var C = root.Calendly;
    if (!C) return false;
    if (typeof C.initPopupWidget === 'function') {
      var opts = { url: url };
      if (hasAny(utm)) opts.utm = utm;
      C.initPopupWidget(opts);
    } else {
      C.showPopupWidget(appendUtm(url, utm));
    }
    return true;
  }

  // Booking -> GA4. Calendly's popup never redirects; it posts calendly.event_scheduled
  // to the page when a call is booked (the same moment js/linkedin-insight.js counts).
  // GA4 attributes the event to the session's own source and campaign; the first-touch
  // UTMs ride along as parameters so a visitor who browsed before booking keeps their
  // original source. Mark book_call as a key event in GA4 (Admin, Key events).
  var BOOK_EVENT = 'book_call';

  // Pure: the GA4 parameters for one booking. GA4 records the page itself (page_location).
  function bookingParams(utm) {
    var p = { method: 'calendly' };
    KEYS.forEach(function (k) { if (utm && utm[k[1]]) p['first_touch_' + k[0].slice(4)] = utm[k[1]]; });
    return p;
  }

  var booked = false;
  // Returns true when a booking event was sent.
  function onMessage(e, ctx) {
    ctx = ctx || root;
    if (!e || typeof e.origin !== 'string' || e.origin.indexOf('calendly.com') === -1) return false;
    if (!e.data || e.data.event !== 'calendly.event_scheduled') return false;
    if (booked) return false; // one booking, one event, even if Calendly posts twice
    if (typeof ctx.gtag !== 'function') return false;
    booked = true;
    var utm = captureFirstTouch((ctx.location || {}).search, storage());
    ctx.gtag('event', BOOK_EVENT, bookingParams(utm));
    return true;
  }
  function resetForTest() { booked = false; }

  var api = { extractUtm: extractUtm, appendUtm: appendUtm, captureFirstTouch: captureFirstTouch, open: open, STORAGE_KEY: STORAGE_KEY,
              bookingParams: bookingParams, onMessage: onMessage, BOOK_EVENT: BOOK_EVENT, _reset: resetForTest };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.MagnetizCalendly = api;
    // Capture on page load so a visitor who lands with UTMs and books on a later page keeps them.
    try { captureFirstTouch((root.location || {}).search, storage()); } catch (e) { /* never break the page */ }
    try { root.addEventListener('message', function (e) { try { onMessage(e); } catch (err) { /* never break the page */ } }); } catch (e) { /* no window */ }
  }
})(typeof window !== 'undefined' ? window : this);
