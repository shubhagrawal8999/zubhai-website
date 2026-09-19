# Zubhai Website

> The website and AI-assisted lead interface for Zubhai, my experiment in building practical AI automation systems for businesses.

## Why I built this

Zubhai started as an idea about building AI automations for real businesses.

That created a second problem:

**How do you explain an automation service and qualify a potential customer without forcing every visitor through a static contact form?**

I built this website to experiment with that.

Instead of only showing information, the site can:

1. explain the Zubhai offering,
2. start an AI-assisted conversation,
3. collect lead information,
4. trigger automation workflows,
5. surface meeting intent.

The website itself became a small demonstration of the kind of automation I wanted to sell.

## What I built

- Responsive marketing website
- Embedded AI chat experience
- Lead capture through chat
- Make.com webhook integration
- Google Sheets lead pipeline
- Optional email notifications through Resend
- Meeting-intent detection
- Vercel Web Analytics integration
- Server-side API routes
- Input validation and bounded request handling

## Architecture

~~~text
                    Visitor
                       │
                       ▼
                 Zubhai Website
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
          AI Chat             Lead Capture
             │                   │
             ▼                   ▼
         /api/chat            /api/lead
             │                   │
             ▼                   ▼
         DeepSeek           Make.com Webhook
                                  │
                          ┌───────┴────────┐
                          ▼                ▼
                    Google Sheets       Email
~~~

Meeting-intent conversations can also trigger an automation webhook and optional email notification.

## Engineering problems I solved

### Keeping model usage affordable

A chatbot can become expensive if every request sends the entire conversation and allows unrestricted output.

I added controls around conversation history length, output size, request size, concise system instructions, and client-side history limits.

### Protecting server-side integrations

Webhook URLs and provider credentials should not live in public client-side code.

Sensitive integration values are kept in deployment environment variables and relevant calls happen server-side.

### Handling untrusted chat input

The API normalizes incoming messages, limits payload sizes, validates lead fields, and avoids returning provider internals directly to the browser.

### Avoiding duplicate meeting alerts

Meeting intent is handled so the same chat window does not repeatedly trigger the same notification path.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| AI | DeepSeek |
| Hosting | Vercel |
| Automation | Make.com |
| Lead storage | Google Sheets |
| Email | Resend |
| Analytics | Vercel Web Analytics |

## Project structure

~~~text
.
├── index.html
├── style.css
├── script.js
├── api/
│   ├── chat
│   └── lead
├── DESIGN_LOG.md
└── robots.txt
~~~

## Environment variables

Configure deployment secrets in Vercel rather than committing them:

~~~text
DEEPSEEK_API_KEY
MAKE_WEBHOOK_URL
LEAD_WEBHOOK_URL
RESEND_API_KEY
LEAD_ALERT_TO_EMAIL
LEAD_ALERT_FROM_EMAIL
~~~

Not every variable is required for every deployment path.

## What I learned

The biggest lesson was that the website itself can be part of the product demonstration.

Instead of saying "I build automations," the website can demonstrate an automation-powered experience.

## Limitations

This is a small production-oriented project, not a full CRM. The current implementation still leaves room for persistent conversation storage, stronger authentication, richer analytics, better rate limiting, automated testing, and a dedicated lead-management backend.

## Design history

DESIGN_LOG.md records important UI and product changes so the repository also acts as a decision history.

## Status

🚀 Deployed / evolving
