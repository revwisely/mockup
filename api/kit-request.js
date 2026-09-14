// Playbook implementation-kit request.
// Subscribes via beehiiv with playbook + source custom fields (the delivery
// automation conditions on `playbook`), and optionally forwards the event to
// the GTM engine for lead + content_interaction recording.
// Delivery email comes from the beehiiv automation, so no welcome email here.

const KNOWN_PLAYBOOKS = new Set(['meeting-intelligence', 'stalled-build-handoff', 'ai-ready-data']);
const KNOWN_SOURCES = new Set(['linkedin', 'newsletter', 'search', 'ai-assistant', 'colleague', 'other']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, source, playbook } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!KNOWN_PLAYBOOKS.has(playbook)) {
    return res.status(400).json({ error: 'Unknown playbook' });
  }
  const safeSource = KNOWN_SOURCES.has(source) ? source : 'other';

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
