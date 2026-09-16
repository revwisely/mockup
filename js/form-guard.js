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
  var SITE_KEY = '0x4AAAAAAE5HlM92NNh_w577';

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
      // Tokens expire. Invisible mode gives the visitor no widget to notice
      // that in, so request a fresh challenge immediately rather than letting
      // someone who read the page for a while get rejected on submit.
      'expired-callback': function () {
        state.token = '';
        if (global.turnstile && state.widgetId !== null) {
          try { global.turnstile.reset(state.widgetId); } catch (e) {}
        }
      },
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
      // Mounted after the form rather than inside it. .newsletter-form is a
      // flex row capped at 440px, so a child here became a third flex item
      // that overflowed the card. The widget is configured Invisible in
      // Cloudflare, so nothing renders and the container takes no layout
      // space, but Turnstile still needs a real element to render into.
      // Switching back to a visible mode means giving this a width and a top
      // margin again. Turnstile's own hidden input lands outside the form
      // with this arrangement, which is fine: the token comes from the
      // render callback, not from a form field.
      var rail = document.createElement('div');
      rail.style.cssText = 'height:0;overflow:hidden;';
      var mount = document.createElement('div');
      rail.appendChild(mount);
      form.parentNode.insertBefore(rail, form.nextSibling);
      state.mount = mount;
      state.rail = rail;
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

  /**
   * Remove the challenge once a submission has succeeded. The mount lives
   * outside the form, so replacing the form's contents with the success
   * message no longer takes the widget with it.
   */
  function teardown(state) {
    if (state.rail && state.rail.parentNode) {
      if (global.turnstile && state.widgetId !== null) {
        try { global.turnstile.remove(state.widgetId); } catch (e) {}
      }
      state.rail.parentNode.removeChild(state.rail);
      state.rail = null;
    }
  }

  global.MagnetizFormGuard = {
    arm: arm,
    payload: payload,
    reset: reset,
    teardown: teardown,
    awaitingChallenge: awaitingChallenge
  };
})(window, document);
