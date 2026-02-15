// api/chat.js – with detailed error logging

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages array' });
  }

  const systemPrompt = {
    role: 'system',
    content: `You are a professional sales assistant for Zubhai...` // (your prompt)
  };

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

    // Log the response status for debugging
    console.log('OpenAI response status:', openaiRes.status);

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      // Log the full error from OpenAI
      console.error('OpenAI error details:', JSON.stringify(data, null, 2));
      return res.status(500).json({ 
        error: 'OpenAI API error',
        details: data.error || 'Unknown error' 
      });
    }

    const assistantMessage = data.choices[0].message.content;
    return res.status(200).json({ reply: assistantMessage });

  } catch (error) {
    console.error('Fetch or other error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
