/**
 * Client half of the form bot protection.
 *
 * Arms a form with the three signals api/_lib/guard.js checks: a honeypot
 * field hidden from humans, the timestamp the form was rendered, and a
 * Cloudflare Turnstile token.
 *
 * The site key lives here and nowhere else. To rotate it, change SITE_KEY.
 */
(function (global, document) {
  'use strict';

  // Cloudflare dashboard -> Turnstile -> your widget -> Site Key.
  // The secret key is its pair and belongs in Vercel as TURNSTILE_SECRET_KEY.
  var SITE_KEY = 'REPLACE_WITH_TURNSTILE_SITE_KEY';

  var HONEYPOT_FIELD = 'company_website';
  var TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__magnetizTurnstileReady';

  var pending = [];
  var scriptRequested = false;

  function configured() {
    return SITE_KEY && SITE_KEY.indexOf('REPLACE_WITH') !== 0;
  }

  function loadTurnstile() {
    if (scriptRequested || !configured()) return;
    scriptRequested = true;
    var s = document.createElement('script');
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  global.__magnetizTurnstileReady = function () {
    pending.splice(0).forEach(renderWidget);
  };

  function renderWidget(state) {
    if (!global.turnstile) {
      pending.push(state);
      return;
    }
    state.widgetId = global.turnstile.render(state.mount, {
      sitekey: SITE_KEY,
      callback: function (token) { state.token = token; },
      'expired-callback': function () { state.token = ''; },
      'error-callback': function () { state.token = ''; }
    });
  }

  /**
   * Arm a form. Returns a handle used to build the request body and to reset
   * the challenge between attempts.
   */
  function arm(form) {
    var state = { form: form, renderedAt: Date.now(), token: '', widgetId: null };

    // Honeypot. Off-screen rather than display:none, because some bots skip
    // fields that are not rendered at all. Hidden from assistive tech and
    // from tab order so a real visitor can never reach it.
    var trap = document.createElement('input');
    trap.type = 'text';
    trap.name = HONEYPOT_FIELD;
    trap.tabIndex = -1;
    trap.autocomplete = 'off';
    trap.setAttribute('aria-hidden', 'true');
    trap.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    form.appendChild(trap);
    state.trap = trap;

    if (configured()) {
      var mount = document.createElement('div');
      mount.style.cssText = 'margin-top:12px;';
      form.appendChild(mount);
      state.mount = mount;
      loadTurnstile();
      renderWidget(state);
    }

    return state;
  }

  /** Build the JSON body, folding in the guard signals. */
  function payload(state, fields) {
    var body = {};
    for (var key in fields) {
      if (Object.prototype.hasOwnProperty.call(fields, key)) body[key] = fields[key];
    }
    body.rendered_at = state.renderedAt;
    body[HONEYPOT_FIELD] = state.trap ? state.trap.value : '';
    body.turnstile_token = state.token;
    return body;
  }

  /** Turnstile tokens are single use, so a retry needs a fresh one. */
  function reset(state) {
    state.token = '';
    if (global.turnstile && state.widgetId !== null) {
      global.turnstile.reset(state.widgetId);
    }
  }

  /**
   * True when the challenge is configured but has not produced a token yet,
   * which means the visitor submitted before verification finished.
   */
  function awaitingChallenge(state) {
    return configured() && !state.token;
  }

  global.MagnetizFormGuard = {
    arm: arm,
    payload: payload,
    reset: reset,
    awaitingChallenge: awaitingChallenge
  };
})(window, document);
