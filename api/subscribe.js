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
          // back. Setting this false broke exactly that: beehiiv refuses the
          // reactivation, no pending confirmation is created, and the link in
          // the email lands them on a generic subscribe page having already
          // signed up. Safe to allow, because double opt-in below means a
          // reactivation still has to be confirmed from the real inbox, so a
          // bot replaying an unsubscribed address can reach pending and no
          // further.
          reactivate_existing: true,
          // No welcome email is configured on this publication, so this flag
          // was always inert. Left off rather than implying one exists. The
          // double opt-in confirmation below is what a new subscriber gets.
          send_welcome_email: false,
          // Forces double opt-in at the API level, so an address that never
          // confirms never becomes an active subscriber and never receives
          // mail from our sending domain. Set here rather than relying only
          // on the publication toggle so the protection travels with the code.
          double_opt_override: 'on',
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
