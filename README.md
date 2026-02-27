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
- `MAKE_WEBHOOK_URL` (optional): HTTPS custom webhook from Make.com for lead capture events (preferred for Google Sheets + email automation).
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

## Lead capture to Google Sheets + thank-you email (Make.com)

The chat widget now sends lead info (name, email, first message) to `/api/lead` as soon as the visitor shares their email.

To automate this in Make:
1. Create a new scenario with **Webhooks > Custom webhook** (trigger).
2. Copy the webhook URL and set it in Vercel as `MAKE_WEBHOOK_URL`.
3. Add **Google Sheets > Add a row** and map these fields from webhook data: `timestamp`, `name`, `email`, `firstMessage`, `source`, `context`.
4. Add **Gmail** (or another email module) with subject like `Thanks for connecting with Zubhai` and send to webhook field `email`.
5. Example email body:
   - `Hi {{name}}, thanks for connecting with me on Zubhai. We'll reach out shortly with next steps.`
6. Turn the Make scenario on.

Webhook payload event for lead capture: `chat_lead_captured`.


If your Vercel deployment cannot run serverless functions on your current plan/setup, you can still send leads directly from the browser: set `data-make-webhook-url` on the `<body>` tag in `index.html` to your Make custom webhook URL. The site will fall back to this direct method if `/api/lead` is unavailable.
