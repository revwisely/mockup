// Playbook implementation-kit request.
// Subscribes via beehiiv with playbook + source custom fields (the delivery
// automation conditions on `playbook`), and optionally forwards the event to
// the GTM engine for lead + content_interaction recording.
// Delivery email comes from the beehiiv automation, so no welcome email here.
//
// Same guard as subscribe.js, and for the same reason. This endpoint writes to
// the same beehiiv publication, so an unprotected form here would refill the
// list the newsletter guard was written to clean. Seven public forms point at
// it, which is seven times the surface the bots already found once.

import { guardSubmission } from './_lib/guard.js';

const KNOWN_PLAYBOOKS = new Set(['meeting-intelligence', 'stalled-build-handoff', 'ai-ready-data', 'inbound-signup-routing', 'reply-triage', 'crm-enrichment-review', 'brand-voice-context-layer', 'target-account-ads', 'provable-icp', 'ai-rollout-one-number']);
const KNOWN_SOURCES = new Set(['linkedin', 'newsletter', 'search', 'ai-assistant', 'colleague', 'other']);

// beehiiv's "Added by API" trigger does NOT mean "a subscriber was created
// through the subscriptions API". It means this automation was named in a call
// to its own journeys endpoint. Subscribing alone enrolls nobody, so the kit
// email only sends because of the second call below.
//
// BEEHIIV_KIT_AUTOMATIONS maps each playbook slug to its automation id:
//   {"meeting-intelligence":"aut_...","reply-triage":"aut_...", ...}
// The ids only exist once the automations are built in beehiiv, so this is an
// env var rather than a constant.
const KIT_AUTOMATIONS = (() => {
  try {
    return JSON.parse(process.env.BEEHIIV_KIT_AUTOMATIONS || '{}');
  } catch {
    console.error('[kit-request] BEEHIIV_KIT_AUTOMATIONS is not valid JSON');
    return {};
  }
})();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { source, playbook } = req.body || {};

  // Playbook first: an unknown slug is a malformed request, not a bot, and
  // saying so plainly costs nothing. Everything after this is the shared gate.
  if (!KNOWN_PLAYBOOKS.has(playbook)) {
    return res.status(400).json({ error: 'Unknown playbook' });
  }

  // Reading several playbooks in one sitting and wanting each kit is the
  // behaviour this library is for, so the newsletter's three-per-ten-minutes
  // would reject the most engaged visitor on their fourth download. Seven
  // playbooks exist; 12 leaves room for retries and for the library growing.
  // The IP ceiling is separate and much higher because one office shares one
  // address, and a shared limit would block whoever asked fourth.
  const gate = await guardSubmission(req, {
    email: req.body?.email,
    maxPerEmail: 12,
    maxPerIp: 60
  });
  if (!gate.ok) {
    // Log the specific gate for triage, return only the generic message so a
    // bot cannot tune against our checks.
    console.warn(`[kit-request] rejected: ${gate.reason}`);
    return res.status(gate.status).json({ error: gate.error });
  }

  const email = gate.email;
  const safeSource = KNOWN_SOURCES.has(source) ? source : 'other';

  const API_KEY = process.env.BEEHIIV_API_KEY;
  const PUB_ID = process.env.BEEHIIV_PUB_ID;
  if (!API_KEY || !PUB_ID) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Checked BEFORE subscribing, on purpose. Without an automation id there is
  // no kit, and a subscriber created here would be someone we took an address
  // from and sent nothing to. Failing loudly also means a missing id shows up
  // as a broken form the day it ships rather than as silence nobody notices.
  const automationId = KIT_AUTOMATIONS[playbook];
  if (!automationId) {
    console.error(`[kit-request] no automation id configured for ${playbook}`);
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch(
      `https://api.beehiiv.com/v2/publications/${PUB_ID}/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email: false,
          utm_source: 'magnetiz_website',
          utm_medium: 'playbook_kit',
          utm_campaign: playbook,
          custom_fields: [
            { name: 'playbook', value: playbook },
            { name: 'source', value: safeSource }
          ]
        })
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err.message || 'Kit request failed'
      });
    }

    // Enrol into this playbook's automation, which is what actually sends the
    // kit. Awaited rather than fire-and-forget, because the form promises an
    // inbox and this call is the promise.
    const created = await response.json().catch(() => ({}));
    const enrolment = await fetch(
      `https://api.beehiiv.com/v2/publications/${PUB_ID}/automations/${automationId}/journeys`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        // Both `subscription_id` and `email` are accepted. The id is exact and
        // avoids a second lookup, so prefer it and fall back to the address.
        body: JSON.stringify(
          created?.data?.id ? { subscription_id: created.data.id } : { email }
        )
      }
    );

    if (!enrolment.ok) {
      // They are subscribed but nothing will arrive, so saying "check your
      // inbox" here would be a lie. The body goes to the log because the
      // address and the playbook are what let someone send the kit by hand.
      const detail = await enrolment.text().catch(() => '');
      console.error(
        `[kit-request] enrolment failed ${enrolment.status} for ${playbook} / ${email}: ${detail.slice(0, 200)}`
      );
      return res.status(502).json({
        error: 'We could not start your kit delivery. Try again, or email us and we will send it by hand.'
      });
    }

    // Best-effort forward to the GTM engine (lead + content_interaction signal).
    // Absent env var or a failed call never blocks the kit delivery.
    const ENGINE_URL = process.env.GTM_ENGINE_KIT_WEBHOOK;
    if (ENGINE_URL) {
      fetch(ENGINE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, playbook, source: safeSource, at: new Date().toISOString() })
      }).catch(() => {});
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
