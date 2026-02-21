const MEETING_INTENT_REGEX = /(book|schedule|arrange|set up)\s+(a\s+)?(call|meeting|consultation|demo)|\b(consultation|discovery call|strategy call|talk to (you|team))\b/i;
const ALLOWED_ROLES = new Set(['user', 'assistant']);
const MAX_CLIENT_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 800;
const DEEPSEEK_TIMEOUT_MS = 12000;

function trimConversation(messages, maxMessages = 8) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages.slice(-maxMessages);
}

function normalizeMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) {
    return [];
  }

  return rawMessages
    .slice(-MAX_CLIENT_MESSAGES)
    .filter((message) => message && ALLOWED_ROLES.has(message.role) && typeof message.content === 'string')
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH)
    }))
    .filter((message) => message.content.length > 0);
}

function sanitizeLead(lead) {
  const name = typeof lead?.name === 'string' ? lead.name.replace(/[^a-zA-Z\s'-]/g, '').trim().slice(0, 80) : '';
  const email = typeof lead?.email === 'string' ? lead.email.trim().toLowerCase().slice(0, 120) : '';
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return {
    name,
    email: emailOk ? email : ''
  };
}

function buildSystemPrompt() {
  return {
    role: 'system',
    content: [
      'You are Zubhai\'s AI automation assistant for website visitors.',
      'Context about Zubhai: custom AI agents, workflow automation, and AI performance analytics for businesses.',
      'Goals: qualify visitors, explain services clearly, and move qualified prospects to a consultation booking.',
      'Style rules: be concise, practical, and specific. Keep replies under 90 words unless asked for more detail.',
      'If user asks for pricing/timeline, provide a range-style estimate and invite a strategy call.',
      'If user asks for a meeting, acknowledge and ask for missing lead details only if needed.',
      'Do not invent case studies, guarantees, or integrations not provided by user/context.'
    ].join(' ')
  };
}

function shouldSendMeetingNotification(messages, latestUserMessage) {
  if (!MEETING_INTENT_REGEX.test(latestUserMessage)) {
    return false;
  }

  const priorUserMessages = messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .slice(0, -1);

  return !priorUserMessages.some((content) => MEETING_INTENT_REGEX.test(content));
}

function getSafeWebhookUrl() {
  const raw = process.env.LEAD_WEBHOOK_URL;
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

async function sendLeadNotification({ leadName, leadEmail, latestUserMessage, source = 'website-chat' }) {
  const timestamp = new Date().toISOString();
  const payload = {
    source,
    timestamp,
    leadName,
    leadEmail,
    latestUserMessage
  };

  const webhookUrl = getSafeWebhookUrl();
  if (webhookUrl) {
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!webhookResponse.ok) {
      throw new Error(`Webhook notification failed: ${webhookResponse.status}`);
    }
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.LEAD_ALERT_TO_EMAIL;
  const fromEmail = process.env.LEAD_ALERT_FROM_EMAIL;

  if (resendApiKey && toEmail && fromEmail) {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `New meeting intent: ${leadName || 'Unknown name'}`,
        text: `Lead wants to meet.\n\nName: ${leadName || 'Unknown'}\nEmail: ${leadEmail || 'Unknown'}\nMessage: ${latestUserMessage || 'N/A'}\nTime: ${timestamp}`
      })
    });

    if (!emailResponse.ok) {
      throw new Error(`Resend notification failed: ${emailResponse.status}`);
    }
  }
}

async function requestDeepSeek(messages) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT_MS);

  try {
    const deepseekRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        max_tokens: 110,
        temperature: 0.3
      }),
      signal: controller.signal
    });

    const data = await deepseekRes.json();
    return { deepseekRes, data };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const rawMessages = req.body?.messages;
  const lead = sanitizeLead(req.body?.lead || {});
  const normalizedMessages = normalizeMessages(rawMessages);

  if (normalizedMessages.length === 0) {
    return res.status(400).json({ error: 'Invalid messages array' });
  }

  const trimmedMessages = trimConversation(normalizedMessages, 8);
  const latestUserMessage = [...trimmedMessages].reverse().find((message) => message.role === 'user')?.content || '';
  const meetingIntent = shouldSendMeetingNotification(trimmedMessages, latestUserMessage);

  if (meetingIntent) {
    try {
      await sendLeadNotification({
        leadName: lead.name,
        leadEmail: lead.email,
        latestUserMessage
      });
    } catch (notificationError) {
      console.error('Lead notification error:', notificationError.message);
    }
  }

  const fullMessages = [buildSystemPrompt(), ...trimmedMessages];

  try {
    const { deepseekRes, data } = await requestDeepSeek(fullMessages);

    if (!deepseekRes.ok) {
      console.error('DeepSeek error status:', deepseekRes.status);
      return res.status(502).json({ error: 'AI provider error' });
    }

    const assistantMessage = data?.choices?.[0]?.message?.content || 'Thanks for your message. Please share a bit more detail so I can help.';
    return res.status(200).json({ reply: assistantMessage, meetingIntent });
  } catch (error) {
    const message = error?.name === 'AbortError' ? 'AI request timeout' : 'Internal server error';
    return res.status(500).json({ error: message });
  }
}
