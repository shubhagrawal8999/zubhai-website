# zubhai-website
Official website for Zubhai AI Automation Agency

## Security hardening included

`/api/chat` now includes baseline protections to reduce abuse risk:

- strict message normalization (allowed roles only, bounded length)
- request-size controls (bounded number of messages)
- lead sanitization (name/email)
- HTTPS-only webhook validation for lead automation
- provider timeout handling for DeepSeek requests
- safe error responses (no provider internals leaked)
- first-intent-only meeting notifications per chat window (avoid duplicate alert spam)

## Chat API environment variables

Set these in Vercel Project Settings → Environment Variables:

- `DEEPSEEK_API_KEY` (required): DeepSeek API key for `/api/chat`.
- `LEAD_WEBHOOK_URL` (optional): HTTPS webhook endpoint (Zapier/Make/n8n/custom) that receives lead meeting-intent payloads.
- `RESEND_API_KEY` (optional): If set with the email vars below, the app sends a meeting-intent email alert.
- `LEAD_ALERT_TO_EMAIL` (optional): Destination email for meeting-intent notifications.
- `LEAD_ALERT_FROM_EMAIL` (optional): Verified sender email/domain in Resend.

## Meeting-intent automation

When a user message indicates booking intent (e.g., call/meeting/consultation), `/api/chat` will:
1. Trigger `LEAD_WEBHOOK_URL` if present.
2. Send an email via Resend if the Resend env vars are configured.

Payload fields include name, email, message, source, and timestamp.

## Cost controls for DeepSeek

To reduce usage cost, `/api/chat` now:
- trims conversation history to the latest 8 messages,
- uses a concise system prompt,
- sets `max_tokens` to `110`,
- uses `temperature` `0.3` for shorter, consistent responses,
- caps client-side chat history sent to API.
