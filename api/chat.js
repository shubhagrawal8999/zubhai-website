
// api/chat.js
// Vercel serverless function – calls OpenAI API

const fetch = require('node-fetch'); // included in Vercel runtime

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages array' });
  }

  // System prompt: defines the AI's role
  const systemPrompt = {
    role: 'system',
    content: `You are a professional sales assistant for Zubhai, an AI automation agency.
Your goal is to answer questions about our services, showcase expertise, and gently guide the user to book a free consultation.
Be concise, friendly, and use natural language.
If the user asks about pricing, mention it's custom and a consultation is free.
If the user shows interest in booking, provide this link: https://calendly.com/yourname/30min (replace with actual link)
Never invent facts about the company. Stick to the services: AI agents, workflow automation, analytics.
Keep responses under 3 sentences.`
  };

  // Prepend system message to conversation
  const fullMessages = [systemPrompt, ...messages];

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: fullMessages,
        max_tokens: 150,
        temperature: 0.7
      })
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error('OpenAI error:', data);
      return res.status(500).json({ error: 'OpenAI API error' });
    }

    const assistantMessage = data.choices[0].message.content;
    return res.status(200).json({ reply: assistantMessage });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
