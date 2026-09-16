import { guardSubmission } from './_lib/guard.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  const gate = await guardSubmission(req, { email });
  if (!gate.ok) {
    // Log the specific gate for triage, return only the generic message so a
    // bot cannot tune against our checks.
    console.warn(`[subscribe] rejected: ${gate.reason}`);
    return res.status(gate.status).json({ error: gate.error });
  }

  const API_KEY = process.env.BEEHIIV_API_KEY;
  const PUB_ID = process.env.BEEHIIV_PUB_ID;

  if (!API_KEY || !PUB_ID) {
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
          email: gate.email,
          // A returning subscriber who had unsubscribed must be able to come
          // back. Setting this false blocked exactly that: beehiiv refuses the
          // reactivation, so the confirmation link had nothing to complete and
          // dropped them on a generic subscribe page. Note that reactivation
          // is immediate and does NOT require confirmation, verified by
          // reproduction, so the gates in _lib/guard.js are the only thing
          // standing between a replayed address and an active subscriber.
          reactivate_existing: true,
          // No welcome email is configured on this publication, so this flag
          // was always inert. Left off rather than implying one exists.
          send_welcome_email: false,
          // No double_opt_override here on purpose. It was set while the form
          // had no challenge, and it cost more than it bought: beehiiv's
          // post-confirmation redirect is only configurable in their new
          // website builder, which this publication has not migrated to, so
          // every confirming subscriber landed on a page asking them to sign
          // up a second time. Turnstile now does that job at the door.
          utm_source: 'magnetiz_website',
          utm_medium: 'newsletter_page'
        })
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err.message || 'Subscription failed'
      });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
