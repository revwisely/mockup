/* LinkedIn Insight Tag (partner 7176748) + Calendly booking conversion.
   Loaded async on every page: builds website retargeting audiences (#142)
   and member demographics in Campaign Manager.

   BOOKING CONVERSION: id 28668108 ("Call booked (Calendly)"), created via
   the Advertising API 2026-09-11 and associated with the active campaign.
   Newsletter signup conversion (28668116) fires from newsletter.html's
   form success handler. */

var LINKEDIN_BOOKING_CONVERSION_ID = 28668108;

_linkedin_partner_id = "7176748";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);

(function (l) {
  if (!l) {
    window.lintrk = function (a, b) { window.lintrk.q.push([a, b]); };
    window.lintrk.q = [];
  }
  var s = document.getElementsByTagName("script")[0];
  var b = document.createElement("script");
  b.type = "text/javascript";
  b.async = true;
  b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
  s.parentNode.insertBefore(b, s);
})(window.lintrk);

/* Calendly's popup never redirects, so a URL-based conversion can't fire.
   Calendly posts a message on booking; that is the conversion moment. */
window.addEventListener("message", function (e) {
  if (typeof e.origin !== "string" || e.origin.indexOf("calendly.com") === -1) return;
  var ev = e.data && e.data.event;
  if (ev === "calendly.event_scheduled" && window.lintrk && LINKEDIN_BOOKING_CONVERSION_ID) {
    window.lintrk("track", { conversion_id: LINKEDIN_BOOKING_CONVERSION_ID });
  }
});
