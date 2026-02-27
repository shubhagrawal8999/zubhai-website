const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeLeadPayload(body) {
  const name = typeof body?.name === 'string' ? body.name.replace(/[^a-zA-Z\s'-]/g, '').trim().slice(0, 80) : '';
  const emailRaw = typeof body?.email === 'string' ? body.email.trim().toLowerCase().slice(0, 120) : '';
  const source = typeof body?.source === 'string' ? body.source.trim().slice(0, 60) : 'website-chat';
  const context = typeof body?.context === 'string' ? body.context.trim().slice(0, 60) : 'lead-captured';
  const firstMessage = typeof body?.firstMessage === 'string' ? body.firstMessage.trim().slice(0, 500) : '';

  return {
    name,
    email: EMAIL_REGEX.test(emailRaw) ? emailRaw : '',
    source,
    context,
    firstMessage
  };
}

function getSafeWebhookUrl() {
  const raw = process.env.MAKE_WEBHOOK_URL || process.env.LEAD_WEBHOOK_URL;
  if (!raw) {
    return null;
  }

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:') {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const lead = sanitizeLeadPayload(req.body || {});
  if (!lead.email) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const webhookUrl = getSafeWebhookUrl();
  if (!webhookUrl) {
    return res.status(200).json({ ok: true, delivered: false, message: 'No webhook configured' });
  }

  const payload = {
    event: 'chat_lead_captured',
    timestamp: new Date().toISOString(),
    ...lead
  };

  try {
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!webhookResponse.ok) {
      return res.status(502).json({ error: 'Automation webhook failed' });
    }

    return res.status(200).json({ ok: true, delivered: true });
  } catch {
    return res.status(500).json({ error: 'Automation request failed' });
  }
}
